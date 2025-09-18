import express from "express";
import jwt from "jsonwebtoken";

const router = express.Router();

/**
 * 查看目前使用的 JWT_SECRET
 */
router.get("/debug-secret", (req, res) => {
  try {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      return res.status(500).json({ error: "JWT_SECRET not defined" });
    }

    res.json({
      JWT_SECRET: secret,
      length: secret.length,
      hex: Buffer.from(secret).toString("hex"),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * 驗證目前請求帶的 token
 */
router.get("/debug-token", (req, res) => {
  const token =
    req.cookies?.token ||
    (req.headers.authorization?.startsWith("Bearer ")
      ? req.headers.authorization.split(" ")[1]
      : null);

  if (!token) {
    return res.status(400).json({ error: "No token found in cookies or headers" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    res.json({
      rawToken: token,
      decoded,
    });
  } catch (err) {
    res.status(400).json({
      error: err.message,
      rawToken: token,
    });
  }
});

/**
 * 簽發一個新的 token
 * 用法: GET /api/debug/generate-token?id=3&email=allan192837@gmail.com&role=admin
 */
router.get("/generate-token", (req, res) => {
  const { id = 1, email = "test@example.com", role = "user" } = req.query;

  const payload = { id: Number(id), email, role };

  try {
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || "1h",
    });

    res.json({
      payload,
      token,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;