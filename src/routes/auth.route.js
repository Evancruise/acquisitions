import express from 'express';
import path from 'path';
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
        record,
        verify_register, 
        initRegisterTable,
        deleteRegisterTable,
        new_record,
        edit_record,
        recycle_bin,
        recycle_record,
        record_search,
        export_data,
        account_management,
        new_account,
        edit_account,
        rebind_page,
        rebind_qr,
        scan_result} from '#controllers/auth.controller.js';
// import { authenticateToken, authorizeRoles } from '#middleware/users.middleware.js';
// import { sign } from 'jsonwebtoken';
import multer from "multer";

const router = express.Router();
const upload = multer();

router.use("/static", express.static(path.join(process.cwd(), "public")));

router.get("/register", register);
router.get("/loginPage", loginPage);

router.get("/dashboard", dashboard);
router.get("/record", record);
router.post("/new_record", new_record);
router.post("/edit_record", edit_record);

router.get("/recycle_bin", recycle_bin);
router.post("/recycle_record", recycle_record);

router.get("/record_search", record_search);
router.post("/export_data", upload.none(), export_data);

router.get("/account_management", account_management);
router.post("/edit_account", upload.none(), edit_account);
router.post("/new_account", upload.none(), new_account);

router.get("/rebind_page", rebind_page);
router.get("/rebind-qr", rebind_qr);
router.post("/scan_result", scan_result);

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
