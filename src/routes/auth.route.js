import express from 'express';
import { register, loginPage, dashboard, changepwd, signup, signin, signout, initUserTable, deleteUserTable, verify_changepwd } from '#controllers/auth.controller.js';
import { authenticateToken, authorizeRoles } from '#middleware/users.middleware.js';
// import { sign } from 'jsonwebtoken';

const router = express.Router();

router.get("/register", register);
router.get("/loginPage", loginPage);
router.get("/dashboard", dashboard);
router.get("/changepwd", changepwd);
router.post("/verify_changepwd", verify_changepwd);
router.post("/sign-up", signup);
router.post("/sign-in", signin);
router.get("/sign-out", signout);
router.post("/init", initUserTable);
router.post("/del", deleteUserTable);

export default router;
