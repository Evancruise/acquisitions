import { formatValidationError } from "#utils/format.js";
import { createUser, findUserByEmail, createUsersTable, removeUserTable, findRegister } from "#services/auth.service.js";
import { signupSchema, signinSchema } from "#validations/auth.validation.js";
import bcrypt from 'bcrypt';
import jwt from "jsonwebtoken";
import logger from '#config/logger.js';
import { getIdByUser, updateUser } from "#src/services/users.service.js";
import sgMail from "@sendgrid/mail";

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export const deleteUserTable = async (req, res) => {
    removeUserTable();
    logger.info("✅ Delete user table");
    res.status(200).json({ message: "Delete user table successfully" });
};

export const initUserTable = async (req, res) => {
    createUsersTable();
    logger.info("✅ Init user table");
    res.status(200).json({ message: "Init user table successfully" });
};

export const deleteRegisterTable = async (req, res) => {
    deleteRegisterTable();
    logger.info("✅ Delete register table");
    res.status(200).json({ message: "Delete register table successfully" });
};

export const initRegisterTable = async (req, res) => {
    createRegisterTable();
    logger.info("✅ Init register table");
    res.status(200).json({ message: "Init register table successfully" });
};

function generateSecureSixDigitCode() {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return (array[0] % 1000000).toString().padStart(6, "0");
}

// ✅ 註冊
export const request = async (req, res) => {
    const { name, email } = req.body;

    const token = jwt.sign({ email, name }, 
        process.env.JWT_SECRET,
       { expiresIn: "1h" });
    
    const register = await createRegister({ name, email });

    // 寄信
    const code = generateSecureSixDigitCode();
    const code_hash = await bcrypt.hash(code, 10);
    
    await sgMail.send({
      from: "noreply@gmail.com",
      to: email,
      subject: "Verify email from Oral cancer template",
      html: `<p>Your Oral cancer app verification code is ${code}</p>`,
    });

    return res.status(201).render("verify", { success: true, message: "Verification email sent", email: email, token: token, code_hash: code_hash });
};

// 驗證註冊流程
export const verify_register = async (req, res) => {
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (req.body.email !== decoded.email) {
          return res.status(401).json({ success: true, message: "Wrong email" });
        }

        const id = decoded.id;
        const email = decoded.email;
        const register = await findRegister({ email });
        let updated = null;
        const validCode = await bcrypt.compare(req.body.code, req.body.code_hash);

        if (!validCode) {
              return res.status(401).json({ 
              success: false,
              error: "Invalid credentials",
              message: "Code not correct",
          });
        }

        if (register && register.status == "pending") {
            // check code verification
            // req.body.code
            // update status into user database
            register.status = "complete";
            updated = updateRegister(id, register);
        }

        return res.status(200).json({ success: true, message: "Verify register complete" });
    } catch (err) {
        logger.error("verify_register error:", e);
        return res.status(401).json({ success: true, message: "Verify register error" });
    }
};

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
      { id: user.id, email: user.email, password: user.password, role: user.role },
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
        password: user.passowrd,
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

    logger.info(`password: ${password}`);
    logger.info(`user.password: ${user.password}`);

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ success: false, error: "Invalid credentials", message: "Wrong password" });
    }

    logger.info(`Signing with: ${process.env.JWT_SECRET}`);

    logger.info(`SIGN secret length: ${process.env.JWT_SECRET.length}`);
    logger.info(`SIGN secret hex: ${Buffer.from(process.env.JWT_SECRET).toString("hex")}`);

    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, password: user.password, role: user.role },
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

  if (req.body.new_password !== req.body.password) {
    return res.status(401).json({ 
        success: false,
        error: "Invalid credentials",
        message: "Password not the same",
    });
  }

  const updated = updateUser(id, req.body);

  return res.status(200).json({ success: true, layout: false, message: "Verify changepwd success!" });
};

export const quickchangepwd = (req, res) => {
  try {
    const token = req.cookies.token;  // 從 cookie 拿 token
    if (!token) {
      return res.redirect("/api/auth/loginPage"); // 沒有 token 回登入頁
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    return res.status(200).render(
        "quick_changepwd", { 
            path: "/api/auth/quick_changepwd", 
            priority: 1, 
            layout: "layout", 
            name: decoded.name,
            email: decoded.email });
  } catch (err) {
    console.error("JWT 驗證失敗:", err);
    return res.redirect("/api/auth/loginPage");
  }
};

export const verify_quick_changepwd = async (req, res) => {
  try {
    const user = await getIdByUser("name", req.body.name);
    const id = user.id;

    const token = req.cookies.token;  // 從 cookie 拿 token
    if (!token) {
      return res.redirect("/api/auth/loginPage"); // 沒有 token 回登入頁
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    logger.info(`req.body: ${JSON.stringify(req.body)}`);
    logger.info(`decoded: ${JSON.stringify(decoded)}`);

    const validPassword = await bcrypt.compare(req.body.old_password, decoded.password);

    if (!validPassword) {
      return res.status(401).json({ 
          success: false,
          error: "Invalid credentials",
          message: "Password not correct",
      });
    }

    if (req.body.password !== req.body.new_password) {
      return res.status(401).json({ 
          success: false,
          error: "Invalid credentials",
          message: "New password not the same",
      });
    }

    const updated = updateUser(id, req.body);

    return res.status(200).json({ 
        success: true, 
        layout: "layout", 
        path: "/api/auth/quick_changepwd", 
        message: "Verify changepwd success!" 
    });
  } catch (err) {
    return res.status(400).json({
        success: false, 
        layout: "layout",
        path: "/api/auth/quick_changepwd",
        error: "Validation failed",
        message: "User id not the same (by name/email)",
    });
  }
};
