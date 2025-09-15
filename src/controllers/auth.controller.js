import { formatValidationError } from "#utils/format.js";
import { createUser, findUserByEmail } from "#services/auth.service.js";
import { signupSchema, signinSchema } from "#validations/auth.validation.js";
import bcrypt from 'bcrypt';
import jwt from "jsonwebtoken";
import logger from '#config/logger.js';

// ✅ 註冊
export const signup = async (req, res, next) => {
  try {

    logger.info("🔍 signup req.body =", req.body);

    const validationResult = signupSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        error: "Validation failed",
        details: validationResult.error.format(),
      });
    }

    const { name, email, password, role } = validationResult.data;

    const user = await createUser({ name, email, password, role });
    console.log("name, email, password, role:", name, email, password, role);

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    logger.info(`✅ User registered: ${email}`);

    return res.status(201).json({
      message: "User registered successfully",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (e) {
    logger.error("Signup error", e);
    if (/user.*exist/i.test(e.message)) {
      return res.status(409).json({ error: "Email already exists" });
    }
    next(e);
  }
};

// ✅ 登入
export const signin = async (req, res, next) => {
  try {
    const validationResult = signinSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        error: "Validation failed",
        details: validationResult.error.format(),
      });
    }

    const { email, password } = validationResult.data;

    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    logger.info(`✅ User logged in: ${email}`);

    return res.status(200).json({
      message: "Login successful",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (e) {
    logger.error("Signin error", e);
    next(e);
  }
};

// ✅ 登出
export const signout = (req, res) => {
  res.clearCookie("token");
  logger.info("✅ User signed out");
  res.status(200).json({ message: "Logged out successfully" });
};