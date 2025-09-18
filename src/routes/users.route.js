import express from "express";
import { getUserByIdController, updateUserController, deleteUserController, fetchAllUsers } from "#controllers/users.controller.js";
import { authenticateToken, validateUpdateUser, authorizeRoles } from "#middleware/users.middleware.js";
import logger from "#config/logger.js";
import jwt from "jsonwebtoken";

const router = express.Router();

router.get('/', authenticateToken, fetchAllUsers);
router.get('/:id', authenticateToken, getUserByIdController);
router.put('/:id', authenticateToken, validateUpdateUser, updateUserController);
router.delete('/:id', authenticateToken, authorizeRoles("admin"), deleteUserController);

/*
router.get("/debug-secret", (req, res) => {
  
    const secret = process.env.JWT_SECRET;

    logger.info(`secret: ${secret}`);

    if (!secret) {
      return res.status(500).json({ error: "JWT_SECRET not defined" });
    }

    res.json({
      JWT_SECRET: secret,
      length: secret.length,
      hex: Buffer.from(secret).toString("hex"),
    });
});

router.get("/debug-token", (req, res) => {
  const token = req.cookies?.token || req.headers.authorization?.split(" ")[1];

  logger.info(`token: ${token}`);

  if (!token) {
    return res.status(400).json({ error: "No token found in cookies or headers" });
  }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    res.json({
      rawToken: token,
      decoded,
    });
});

router.get("/generate-token", (req, res) => {
  const { id = 1, email = "test@example.com", role = "user" } = req.query;

  const payload = { id: Number(id), email, role };

  try {
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || "1h",
    });

    logger.info(`token: ${token}`);

    res.json({
      payload,
      token,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
*/

export default router;
