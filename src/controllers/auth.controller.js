import { formatValidationError } from "#utils/format.js";
import { createUser, findUserByEmail, createUsersTable, deleteTable } from "#services/auth.service.js";
import { signupSchema, signinSchema } from "#validations/auth.validation.js";
import bcrypt from 'bcrypt';
import jwt from "jsonwebtoken";
import logger from '#config/logger.js';
import { getIdByUser } from "#src/services/users.service.js";

export const deleteUserTable = async (req, res) => {
    deleteTable();
    logger.info("✅ Delete user table");
    res.status(200).json({ message: "Delete user table successfully" });
};

export const initUserTable = async (req, res) => {
    createUsersTable();
    logger.info("✅ Init user table");
    res.status(200).json({ message: "Init user table successfully" });
};

// ✅ 註冊
export const register = async (req, res) => {
    res.render("register", { layout: false });
};

export const signup = async (req, res, next) => {
  try {

    logger.info("🔍 signup req.body =", req.body);

    const validationResult = signupSchema.safeParse(req.body);

    logger.info("validationResult = ", validationResult);

    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: validationResult.error.format(),
      });
    }

    const { name, email, password, role } = validationResult.data;

    logger.info(`req.body.password: ${req.body.password}`);
    logger.info(`req.body.password_2: ${req.body.password_2}`);

    if (req.body.password !== req.body.password_2) {
        return res.status(401).json({ 
            success: false,
            error: "Invalid credentials",
            message: "Password not the same",
        });
    }

    const user = await createUser({ name, email, password, role });
    console.log("name, email, password, role:", name, email, password, role);

    logger.info(`Signing with: ${process.env.JWT_SECRET}`);

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN },
    );

    logger.info(`token: ${token}`);

    res.cookie("token", token, {
      httpOnly: true,
      // secure: process.env.NODE_ENV === "development",
      secure: true,    // 建議上線時開啟
      sameSite: "strict",
      path: "/",
    });

    logger.info(`✅ User registered: ${email}`);

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (e) {
    logger.error("Signup error:", e);
    return res.status(409).json({ error: "Email already exists" });
  }
};

// ✅ 登入
export const loginPage = async(req, res) => {
    res.render("loginPage", { layout: false });
}

export const signin = async (req, res, next) => {
  // try {

    logger.info(`req.body: ${JSON.stringify(req.body)}`);
    const validationResult = signinSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        error: "Validation failed",
        details: validationResult.error.format(),
      });
    }

    const { name, email, password } = validationResult.data;

    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ success: false, error: "Invalid credentials", message: "User not found" });
    }

    if (name != user.name) {
      return res.status(401).json({ success: false, error: "Invalid credentials", message: "Wrong name" });
    }

    if (email != user.email) {
      return res.status(401).json({ success: false, error: "Invalid credentials", message: "Wrong email" });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ success: false, error: "Invalid credentials", message: "Wrong password" });
    }

    logger.info(`Signing with: ${process.env.JWT_SECRET}`);

    logger.info(`SIGN secret length: ${process.env.JWT_SECRET.length}`);
    logger.info(`SIGN secret hex: ${Buffer.from(process.env.JWT_SECRET).toString("hex")}`);

    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN },
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: true,    // 建議上線時開啟
      sameSite: "strict",
      path: '/',
    });

    logger.info(`✅ User logged in: ${email}`);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  //} catch (e) {
  //  logger.error("Signin error", e);
  //  next(e);
  //}
};

// ✅ 登出
export const signout = (req, res) => {
  res.clearCookie("token");
  res.clearCookie("Path");
  res.clearCookie("SameSite");
  logger.info("✅ User signed out");
  res.status(200).render("loginPage", { layout: false, message: "Logged out successfully" });
};

// dashboard 首頁
export const dashboard = (req, res) => {
  try {
    const token = req.cookies.token;  // 從 cookie 拿 token
    if (!token) {
      return res.redirect("/api/auth/loginPage"); // 沒有 token 回登入頁
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    logger.info(`decoded.name: ${decoded.name}`);

    res.render("dashboard", { name: decoded.name, path: "/api/auth/dashboard", priority: 1, layout: "layout" });
  } catch (err) {
    console.error("JWT 驗證失敗:", err);
    return res.redirect("/api/auth/loginPage");
  }
};

export const changepwd = (req, res) => {
  return res.status(200).render("changepwd", { layout: false });
};

export const verify_changepwd = async (req, res) => {

  logger.info(`req.body: ${JSON.stringify(req.body)}`);

  const userIdByName = await getIdByUser("name", req.body.name);
  const userIdByEmail = await getIdByUser("email", req.body.email);

  logger.info(`userIdByName: ${JSON.stringify(userIdByName)}`);
  logger.info(`userIdByEmail: ${JSON.stringify(userIdByEmail)}`);

  if (!userIdByName || !userIdByEmail) {
    return res.status(400).json({
        success: false,
        error: "Validation failed",
        message: "User not found",
    });
  }

  if (userIdByEmail.id !== userIdByName.id) {
    return res.status(400).json({
        success: false,
        error: "Validation failed",
        message: "User id not the same (by name/email)",
    });
  }

  if (req.body.new_password !== req.body.new_password_2) {
    return res.status(401).json({ 
        success: false,
        error: "Invalid credentials",
        message: "Password not the same",
    });
  }

  return res.status(200).json({ success: true, layout: false, message: "Verify changepwd success!" });
};

export const quickchangepwd = (req, res) => {
  try {
    const token = req.cookies.token;  // 從 cookie 拿 token
    if (!token) {
      return res.redirect("/api/auth/loginPage"); // 沒有 token 回登入頁
    }

    return res.status(200).json({ layout: false });
  } catch (err) {
    console.error("JWT 驗證失敗:", err);
    return res.redirect("/api/auth/loginPage");
  }
};
