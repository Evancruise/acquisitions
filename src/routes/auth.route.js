import express from 'express';
import { register, 
        loginPage, 
        dashboard, 
        changepwd, 
        signup, 
        signin, 
        signout, 
        initUserTable, 
        deleteUserTable, 
        verify_changepwd, 
        quickchangepwd, 
        verify_quick_changepwd, 
        request, 
        verify,
        verify_register, 
        initRegisterTable,
        deleteRegisterTable} from '#controllers/auth.controller.js';
// import { authenticateToken, authorizeRoles } from '#middleware/users.middleware.js';
// import { sign } from 'jsonwebtoken';

const router = express.Router();

router.get("/register", register);
router.get("/loginPage", loginPage);

router.get("/dashboard", dashboard);

router.get("/changepwd", changepwd);
router.get("/quick_changepwd", quickchangepwd);
router.post("/verify_changepwd", verify_changepwd);
router.post("/verify_quick_changepwd", verify_quick_changepwd);

router.post("/sign-up", signup);
router.post("/sign-in", signin);
router.get("/sign-out", signout);

router.post("/init-user", initUserTable);
router.post("/del-user", deleteUserTable);

router.post("/init-reg", initRegisterTable);
router.post("/del-reg", deleteRegisterTable);

router.post("/request", request);

router.get("/verify", verify);
router.post("/verify_register", verify_register);

export default router;
