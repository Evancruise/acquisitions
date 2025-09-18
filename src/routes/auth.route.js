import express from 'express';
import { signup, signin, signout, initUserTable, deleteUserTable } from '#controllers/auth.controller.js';
import { authenticateToken, authorizeRoles } from '#middleware/users.middleware.js';
// import { sign } from 'jsonwebtoken';

const router = express.Router();

router.post("/sign-up", signup);
router.post("/sign-in", signin);
router.post("/sign-out", signout);
router.post("/init", initUserTable);
router.post("/del", deleteUserTable);

export default router;
