import { formatValidationError } from "#utils/format.js";
import { createUser, 
         createUsersTable, 
         removeUserTable, 
         createRegister, 
         createRegisterTable, 
         removeRegisterTable,
         findRegister,
         findUser } from "#services/auth.service.js";
import { createRecord, deleteRecord, updateRecord, recoverRecord, deleteDiscardRecord } from "#src/services/records.service.js";
import { signupSchema, signinSchema } from "#validations/auth.validation.js";
import bcrypt from 'bcrypt';
import jwt from "jsonwebtoken";
import logger from '#config/logger.js';
import { getUser, updateUser, updateRegister, updateUserTableFromRegister, deleteUser, check_user_login, updateUserPassword } from "#src/services/users.service.js";
import { findRecord, findDiscardRecord } from "#src/services/records.service.js";
import { movefiles, deletefiles } from "#utils/func.js";
import sgMail from "@sendgrid/mail";
import multer from "multer";
import fs from "fs";
import path from "path";
import { getAllRecords } from "#services/records.service.js";
import { getAllUsers } from "#src/services/users.service.js";
import ExcelJS from "exceljs";
import QRCode from "qrcode";
import { config, default_config } from "#config/config.js";
import { generateToken } from "#middleware/users.middleware.js";
import { DateTime } from "luxon";

const upload = multer({ dest: "uploads/" });
const upload_gb = multer({ dest: "uploads_gb/" });

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
    removeRegisterTable();
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

const send_email = async (email) => {
  try {
    // 寄信
    const code = generateSecureSixDigitCode();
    const code_hash = await bcrypt.hash(code, 10);

    logger.info(`process.env.SENDGRID_API_KEY=${process.env.SENDGRID_API_KEY}`);
    
    await sgMail.send({
      from: process.env.MAIL_FROM,
      to: email,
      subject: "Verify email from Oral cancer template",
      html: `<p>Your Oral cancer app verification code is ${code}</p>`,
    });

    logger.info(`code: ${code}`);
    logger.info(`[send_email] code_hash: ${JSON.stringify(code_hash)}`);

    return code_hash;
  } catch (err) {
    logger.info(`Cannot send email: ${err.message}`);
    return null;
  }
};

export const resend = async (req, res) => {
  try {
    const { name, email, token } = req.body;
    const code_hash = await send_email(email);

    logger.info(`[resend] code_hash: ${code_hash}`);

    return res.status(201).json({ success: true, layout: false, message: "Verification email sent", redirect: `/api/auth/verify?name=${name}&email=${email}&code_hash=${code_hash}&token=${token}` });
  } catch (err) {
    return res.status(401).json({ success: false, message: err.message });
  }    
};

// ✅ 註冊
export const request = async (req, res) => {

  try {
    const { name, email } = req.body;

    const token = jwt.sign(
        { email, name }, 
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
    );
    
    logger.info(`createRegister: name: ${name} email: ${email}`);
    const register = await createRegister({ name, email });
    logger.info(`register: ${JSON.stringify(register)}`);

    const code_hash = await send_email(email);

    /*
    // 寄信
    const code = generateSecureSixDigitCode();
    const code_hash = await bcrypt.hash(code, 10);

    logger.info(`process.env.SENDGRID_API_KEY=${process.env.SENDGRID_API_KEY}`);
    
    await sgMail.send({
      from: process.env.MAIL_FROM,
      to: email,
      subject: "Verify email from Oral cancer template",
      html: `<p>Your Oral cancer app verification code is ${code}</p>`,
    });

    logger.info(`code: ${code}`);
    */

    return res.status(201).json({ success: true, layout: false, message: "Verification email sent", redirect: `/api/auth/verify?name=${name}&email=${email}&code_hash=${code_hash}&token=${token}` });
  } catch (err) {
    return res.status(401).json({ success: false, message: err.message });
  }    
}

// 驗證註冊流程
export const verify = async(req, res) => {
    return res.status(201).render("verify", { layout: false, name: req.query.name, email: req.query.email, code_hash: req.query.code_hash, token: req.query.token });
}

export const verify_register = async (req, res) => {
    try {
        const token = req.body.token;
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        logger.info(`decoded: ${JSON.stringify(decoded)}`);

        if (req.body.email !== decoded.email) {
          return res.status(401).json({ success: true, message: "Wrong email" });
        }

        const name = decoded.name;
        const email = decoded.email;
        const register = await findRegister({ email });

        logger.info(`register: ${JSON.stringify(register)}`);

        logger.info(`req.body.code: ${req.body.code}`);
        logger.info(`req.body.code_hash: ${req.body.code_hash}`);

        const id = register.id;
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
            updated = updateRegister("id", id, register);
            updateUserTableFromRegister(id, name);
        }

        return res.status(200).json({ success: true, message: "Verify register complete", redirect: `/api/auth/changepwd?name=${name}&email=${email}` });
    } catch (err) {
        logger.error("verify_register error:", err);
        return res.status(401).json({ success: false, message: err.message });
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
};

export const signin = async (req, res, next) => {
  try {

    logger.info(`req.body: ${JSON.stringify(req.body)}`);
    const validationResult = signinSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        error: "Validation failed",
        details: validationResult.error.format(),
      });
    }

    const { name, email, password } = validationResult.data;

    logger.info(`email: ${email}`);

    const user = await findUser("email", email);

    logger.info(`User: ${user}`);

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

    /*
    const check_allowed_loggin = await check_user_login("name", user.name);

    if (!check_allowed_loggin) {
        return res.status(403).json({ success: false, message: "Account locked. Try again later." });
    }
    */

    logger.info(`new Date(user.allowed_loggin_at): ${new Date(user.allowed_loggin_at)} | new Date(): ${new Date()}`);
  
    if (new Date(user.allowed_loggin_at) > new Date()) {

      const unlockTime = DateTime.fromJSDate(user.allowed_loggin_at)
                               .setZone(user.timezone || "UTC")
                               .toFormat("yyyy-MM-dd HH:mm:ss");

      return res.status(403).json({
          error: "Account locked. Try again later.",
          message: `Account locked until ${unlockTime} (${user.timezone})`,
      });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
        await updateUserPassword(false, "name", user.name);
        return res.status(401).json({ success: false, message: `Wrong password. Please login again (remaining times: ${user.retry_times})` });
    } else {
        await updateUserPassword(true, "name", user.name);
    }

    logger.info(`Signing with: ${process.env.JWT_SECRET}`);

    logger.info(`SIGN secret length: ${process.env.JWT_SECRET.length}`);
    logger.info(`SIGN secret hex: ${Buffer.from(process.env.JWT_SECRET).toString("hex")}`);

    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, password: user.password, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: config.expireTime },
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
        token: token,
      },
    });
  } catch (e) {
    logger.error("Signin error", e);
    return res.status(400).json({
      success: false, 
      message: `Login Failed ${e.message}`})
  }
};

// ✅ 登出
export const signout = (req, res) => {
  res.clearCookie("token");
  res.clearCookie("Path");
  res.clearCookie("SameSite");
  logger.info("✅ User signed out");
  res.status(200).render("loginPage", { layout: false, message: "Logged out successfully" });
};

function priority_from_role(role) {
  let priority = -1;
  if (role == "tester") {
    priority = 3;
  } else if (role == "resource manager") {
    priority = 2;
  } else if (role == "system manager") {
    priority = 1;
  }
  logger.info(`priority = ${priority}`);
  return priority;
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

    res.render("dashboard", { name: decoded.name, path: "/api/auth/dashboard", priority: priority_from_role(decoded.role), layout: "layout" });
  } catch (err) {
    console.error("JWT 驗證失敗:", err);
    return res.redirect("/api/auth/loginPage");
  }
};

// record 頁面
function formatDateTime(date) {
    if (!(date instanceof Date)) date = new Date(date);
    const iso = date.toISOString();
    const [day, time] = iso.split("T");
    return `${day} ${time.split(".")[0]}`;
}

export const record = async (req, res) => {

    const token = req.cookies.token;  // 從 cookie 拿 token
    if (!token) {
        return res.redirect("/api/auth/loginPage"); // 沒有 token 回登入頁
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    logger.info(`decoded: ${JSON.stringify(decoded)}`);
    logger.info(`decoded.name: ${decoded.name}`);

    const record = await findRecord("name", decoded.name);
    let length = 0;

    logger.info(`record: ${JSON.stringify(record)}`);

    let grouped = {};

    if (record) {
        // 1. 排序 (依 created_at 從新到舊)
        record.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        logger.info(`record (sorted): ${JSON.stringify(record)}`);

        // 假設 record 是陣列
        length = Object.keys(record).length;
        
        // 2. 分組 (key = YYYY-MM-DD)
        grouped = record.reduce((acc, item) => {
          logger.info(`item.created_at: ${item.created_at}`);

          const dateKey = DateTime.fromJSDate(item.created_at)
                               .setZone(item.timezone || "UTC")
                               .toFormat("yyyy-MM-dd");

          // const dateKey = item.created_at.toISOString().split("T")[0] // Date → YYYY-MM-DD
          logger.info(`dateKey: ${dateKey}`);

          if (!acc[dateKey]) {
            acc[dateKey] = [];
          }
          acc[dateKey].push(item);
          return acc;
        }, {});
        logger.info(`grouped: ${JSON.stringify(grouped)}`);
    }

    return res.status(201).render("record", 
    { layout: "layout", 
      grouped_records: grouped, 
      priority: priority_from_role(decoded.role), 
      path: "/api/auth/record", 
      id: decoded.id, 
      patient_id: `${decoded.id}-${length}`,
      new_patient_id: `${decoded.id}-${length+1}`,
      name: decoded.name,
      token: token, 
      formatDateTime });
};

export const new_record = [
  upload.any(),  // multer 處理 multipart/form-data
  async (req, res) => {
    const body = req.body;
    const files = req.files;
    generateToken(body);

    logger.info("req.headers:", req.headers);
    logger.info("body:", body);
    logger.info("files:", JSON.stringify(files, null, 2));

    const token = body.token;
    if (!token) {
      return res.redirect("/api/auth/loginPage");
    }

    const action = body.action;  
    const patientId = body.patient_id;

    // 確保 patient_id 資料夾存在
    const uploadDir = path.join(process.cwd(), "public", "uploads", patientId);
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // 儲存檔案到 patient_id 資料夾
    const savedFiles = [];
    for (const file of files) {
      const targetPath = path.join(uploadDir, file.originalname);
      fs.renameSync(file.path, targetPath);
      savedFiles.push(`/uploads/${patientId}/${file.originalname}`);
    }

    let newRecord = null;

    if (action === "create") {
      /* 
      update current new add user file into records table from body
      */
      newRecord = await createRecord(body);

      // TODO: 把 files 存到資料夾，例如 uploads/{patient_id}/
      return res.status(200).json({
        layout: false,
        success: true,
        redirect: "/api/auth/record",
        message: "Create new record successfully",
        patient_id: patientId,
        files: files.map(f => ({ field: f.fieldname, name: f.originalname }))
      });
    } else if (action === "infer") {
      /* 
      update current new add user file into records table from body
      */
      newRecord = await createRecord(body);

      return res.status(200).json({
        layout: false,
        success: true,
        redirect: "/api/auth/record",
        message: "inference complete"
      });
    } else if (action === "check_result") {
        return res.status(200).json({
          success: true,
          message: "檢查結果完成",
          patient_id: patientId,
          redirect: "/api/auth/record",
          files: savedFiles,
        });
    } else {
        return res.status(400).json({
          layout: false,
          success: false,
          message: "unknown action"
        });
    }
  }
];

export const edit_record = [
  upload.any(),
  async (req, res) => {
    const body = req.body;
    const files = req.files;
    generateToken(body);

    logger.info("req.headers:", req.headers);
    logger.info("body:", body);
    logger.info("files:", JSON.stringify(files, null, 2));

    const token = body.token;
    if (!token) {
      return res.redirect("/api/auth/loginPage");
    }

    const action = body.action;
    const patientId = body.patient_id;

    const uploadDir = path.join(process.cwd(), "public", "uploads", patientId);
    const uploadDir_gb = path.join(process.cwd(), "public", "uploads_gb", patientId);

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    if (action === "save") {
        const savedFiles = [];
        for (const file of files) {
          const targetPath = path.join(uploadDir, file.originalname);
          fs.renameSync(file.path, targetPath);
          savedFiles.push(`/uploads/${patientId}/${file.originalname}`);
        }

        // 儲存檔案到 patient_id 資料夾
        const imgUpdates = {};
        for (let i = 1; i <= 8; i++) {
          const fieldName = `pic${i}_2`;
          const file = files.find(f => f.fieldname === fieldName);
          logger.info(`body[pic${i}_2]=`, body[`pic${i}_2`]);

          if (file) {
            // 有新檔 → 搬移到 patient_id 資料夾
            const newPath = path.join(uploadDir, file.originalname);
            await fs.promises.rename(file.path, newPath);

            // 存 DB 用的相對路徑 (假設 uploads 在 public/static 底下)
            const relativePath = path.relative("public", newPath).replace(/\\/g, "/");
            imgUpdates[fieldName] = "/" + relativePath;
          } else {
            // 沒新檔 → 用 hidden input 傳來的舊路徑
            imgUpdates[fieldName] = body[`pic${i}_2`] || null;
          }
        }

        logger.info("imgUpdates:", imgUpdates);
    
        const editRecord = await updateRecord(body, imgUpdates);

        // TODO: 把 files 存到資料夾，例如 uploads/{patient_id}/
        return res.status(200).json({
          layout: false,
          success: true,
          redirect: "/api/auth/record",
          message: "Edit new record successfully",
          patient_id: patientId,
          files: files.map(f => ({ field: f.fieldname, name: f.originalname }))
        });
    } else if (action === "delete") {
        await deleteRecord(body);

        if (!fs.existsSync(uploadDir_gb)) {
          fs.mkdirSync(uploadDir_gb, { recursive: true });
        }

        if (fs.existsSync(uploadDir_gb)) {
          // move the files from folder with gb to that with original ones
          const moveOk = await movefiles(uploadDir, uploadDir_gb);
          if (moveOk == false) {
            return res.status(401).json({ success: false, message: "Files transfer failed" })
          }
        }

        // TODO: 把 files 存到資料夾，例如 uploads/{patient_id}/
        return res.status(200).json({
          layout: false,
          success: true,
          redirect: "/api/auth/record",
          message: "Delete record successfully",
          patient_id: patientId
        });
    }
  }
];

export const record_search = async (req, res) => {
    const token = req.cookies.token;  // 從 cookie 拿 token
    if (!token) {
        return res.redirect("/api/auth/loginPage"); // 沒有 token 回登入頁
    }

    let grouped = {};

    const allRecords = await getAllRecords();

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    logger.info(`decoded: ${JSON.stringify(decoded)}`);
    logger.info(`decoded.role: ${decoded.role}`);

    logger.info(`allRecords: ${JSON.stringify(allRecords)}`);

    let length = 0;

    if (allRecords) {
        // 1. 排序 (依 created_at 從新到舊)
        allRecords.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        // 假設 record 是陣列
        length = Object.keys(allRecords).length;

        // 2. 分組 (key = YYYY-MM-DD)
        grouped = allRecords.reduce((acc, item) => {
          logger.info(`item.created_at: ${item.created_at}`);
          const dateKey = item.created_at.toISOString().split("T")[0] // Date → YYYY-MM-DD
          logger.info(`dateKey: ${dateKey}`);

          if (!acc[dateKey]) {
            acc[dateKey] = [];
          }
          acc[dateKey].push(item);
          return acc;
        }, {});
        logger.info(`grouped: ${JSON.stringify(grouped)}`);
    }

    return res.status(201).render("record_search", 
    { layout: "layout",  
      grouped_records: grouped, 
      today_date: (new Date()).toISOString().split("T")[0],
      priority: priority_from_role(decoded.role), 
      path: "/api/auth/record_search", 
      token: token });
};

export const export_data = async (req, res) => {
    try {
        logger.info(`export_data req.body: ${JSON.stringify(req.body)}`);
        const rows = JSON.parse(req.body.tableData || "[]");

        if (!rows.length) {
            return res.status(400).json({ success: false, message: "No data to export" });  
        }

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Records');

        worksheet.columns = [
          { header: "影像案例編號", key: "patient_id", width: 20 },
          { header: "建立日期", key: "created_at", width: 15 },
          { header: "上傳日期", key: "updated_at", width: 15 },
          { header: "上傳人員", key: "name", width: 15 },
          { header: "分析狀態", key: "status", width: 15 },
          { header: "備註", key: "notes", width: 30 }
        ];

        // 加入資料
        rows.forEach((r) => worksheet.addRow(r));

        // 設定回應 headers → 讓瀏覽器自動下載
        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        res.setHeader("Content-Disposition", "attachment; filename=records.xlsx");

        // 把 workbook 寫到 response stream
        await workbook.xlsx.write(res);
        res.end();
    } catch (e) {
        logger.error("export_data error:", e);
        return res.status(500).json({ success: false, message: "Export data failed" });
    }
};

export const account_management = async (req, res) => {
    try {
      const token = req.cookies.token;  // 從 cookie 拿 token
      if (!token) {
          return res.redirect("/api/auth/loginPage"); // 沒有 token 回登入頁
      }

      const allUsers = await getAllUsers();
      logger.info(`allUsers: ${JSON.stringify(allUsers)}`);

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      logger.info(`decoded: ${JSON.stringify(decoded)}`);
      logger.info(`decoded.role: ${decoded.role}`);

      let length = 0;

      let grouped = {};

      if (allUsers) {
          // 1. 排序 (依 created_at 從新到舊)
          allUsers.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

          // 假設 record 是陣列
          length = Object.keys(allUsers).length;

          // 2. 分組 (key = YYYY-MM-DD)
          grouped = allUsers.reduce((acc, item) => {
            const dateName = item.name
            logger.info(`dateName: ${dateName}`);

            if (!acc[dateName]) {
              acc[dateName] = [];
            }
            acc[dateName].push(item);
            return acc;
          }, {});
          logger.info(`grouped: ${JSON.stringify(grouped)}`);
      }

      logger.info(`config: ${JSON.stringify(config)}`);

      return res.status(201).render("account_management", 
      { layout: "layout",  
        grouped_accounts: grouped, 
        today_date: (new Date()).toISOString().split("T")[0],
        priority: priority_from_role(decoded.role), 
        path: "/api/auth/account_management", 
        token: token,
        config: config});
    } catch(err) {
      console.log("account_management error: ", err.message);
      return res.redirect("/api/auth/loginPage");
    }
};

export const new_account = async (req, res) => {
  try {
    const body = req.body;
    generateToken(body);
    const { name, email, password, role, unit, notes } = body;

    logger.info("body:", body);

    const user = await createUser({ name, email, password, role, unit, notes });
    
    logger.info(`user: ${JSON.stringify(user)}`);

    return res.status(201).json({ success: true, message: "Create new account successfully", redirect: "/api/auth/account_management" });
  } catch (e) {
    logger.error("new_account error:", e);
    return res.status(409).json({ success: false, message: "Email already exists" });
  }
};

export const edit_account = async (req, res) => {
  try {  
    const body = req.body;

    generateToken(body);

    const action = body.action;

    logger.info("body:", body);

    if (action === "save") {
        const user = await updateUser("name", body.name, body);
        logger.info(`user: ${JSON.stringify(user)}`);
        return res.status(201).json({ success: true, message: "Edit account successfully", redirect: "/api/auth/account_management" });
    } else if (action === "delete") {
        const user = await deleteUser("name", body.name);
        logger.info(`user: ${JSON.stringify(user)}`);
        return res.status(201).json({ success: true, message: "Delete account successfully", redirect: "/api/auth/account_management" });
    }
  } catch (e) {
    logger.error("edit_account error:", e);
    return res.status(409).json({ success: false, message: "Edit account failed" });
  }
};

export const apply_account_setting = async (req, res) => {
    try {  
        const body = req.body;

        generateToken(body);

        const action = body.action;
        logger.info("body:", body);

        if (action == "save") {
            config.minPasswordLength = body.minPasswordLength;
            config.passwordComplexity = body.passwordComplexity;
            config.passwordExpiryDays = body.passwordExpiryDays;
            config.accountLockThreshold = body.accountLockThreshold;
            config.enableMFA = body.enableMFA;
            config.mfaMethods = body.mfaMethods;
            config.enableActivityMonitoring = body.enableActivityMonitoring;
            config.anomalyThreshold = body.anomalyThreshold;
            return res.status(201).json({ success: true, message: "Update system setting successfully", redirect: "/api/auth/account_management" });
        } else if (action === "reset") {
            config.minPasswordLength = default_config.minPasswordLength;
            config.passwordComplexity = default_config.passwordComplexity;
            config.passwordExpiryDays = default_config.passwordExpiryDays;
            config.accountLockThreshold = default_config.accountLockThreshold;
            config.enableMFA = default_config.enableMFA;
            config.mfaMethods = default_config.mfaMethods;
            config.enableActivityMonitoring = default_config.enableActivityMonitoring;
            config.anomalyThreshold = default_config.anomalyThreshold;
            return res.status(201).json({ success: true, message: "Reset system setting successfully", redirect: "/api/auth/account_management" });
        } else if (action === "init") {
            removeUserTable();    
            createUsersTable();
            removeRegisterTable();
            createRegisterTable();
            return res.status(201).json({ success: true, message: "Init system setting successfully", redirect: "/api/auth/account_management" });
        }
    } catch (e) {
        logger.error("apply_account_setting error:", e);
        return res.status(409).json({ success: false, message: "Apply account setting failed" });
    }
};

export const apply_system_setting = async (req, res) => {
    try {  
        const body = req.body;

        generateToken(body);

        logger.info("body:", body);

        const action = body.action;

        if (action === "save") {
            config.expireTime = body.expireTime;
            config.model_version = body.model_version;
            config.threshold = body.threshold;
            config.model_accuracy = body.model_accuracy;
            config.update_inform = body.update_inform;
            return res.status(201).json({ success: true, message: "Apply system setting successfully", redirect: "/api/auth/account_management" });
        } else if (action === "reset") {
            config.expireTime = default_config.expireTime;
            config.model_version = default_config.model_version;
            config.threshold = default_config.threshold;
            config.model_accuracy = default_config.model_accuracy;
            config.update_inform = default_config.update_inform;
            return res.status(201).json({ success: true, message: "Reset system setting successfully", redirect: "/api/auth/account_management" });
        }

    } catch (e) {
        logger.error("apply_system_setting error:", e);
        return res.status(409).json({ success: false, message: "Apply system setting failed" });
    }
};

export const rebind_page = async (req, res) => {
    try {
        const token = req.cookies.token;  // 從 cookie 拿 token
        if (!token) {
            return res.redirect("/api/auth/loginPage"); // 沒有 token 回登入頁
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        logger.info(`decoded: ${JSON.stringify(decoded)}`);
        logger.info(`decoded.role: ${decoded.role}`);

        return res.status(201).render("rebind_page", { layout: "layout", priority: priority_from_role(decoded.role), path: "/api/auth/rebind_page", token: token });
    } catch (err) {
        logger.info(`rebind_page error: `, err.message);
        return res.redirect("/api/auth/loginPage");
    }
};

export const rebind_qr = async (req, res) => {
    try {
      const qrData = "user-binding-token-" + Date.now();
      const qrImage = await QRCode.toDataURL(qrData);

      const img = qrImage.replace(/^data:image\/png;base64,/, "");
      const imgBuffer = Buffer.from(img, "base64");
      res.setHeader("Content-Type", "image/png");
      res.send(imgBuffer);
    } catch (e) {
      res.status(500).send("QR code generation failed");
    }
};

export const scan_result = async (req, res) => {
    const { qrContent } = req.body;
    logger.info(`qrContent: ${qrContent}`);

    if (qrContent && qrContent.startsWith("user-binding-token-")) {
        return res.json({ success: true, message: "QR code valid", redirect: "/api/auth/rebind_page" });
    } else {
        return res.status(400).json({ success: false, message: "Invalid QR code" });
    }
};

export const recycle_bin = async (req, res) => {
    try {
        const token = req.cookies.token;  // 從 cookie 拿 token
        if (!token) {
            return res.redirect("/api/auth/loginPage"); // 沒有 token 回登入頁
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        logger.info(`decoded: ${JSON.stringify(decoded)}`);
        logger.info(`decoded.name: ${decoded.name}`);

        const record = await findDiscardRecord("name", decoded.name);
        let length = 0;

        logger.info(`record: ${JSON.stringify(record)}`);

        let grouped = {};

        if (record) {
            // 1. 排序 (依 created_at 從新到舊)
            record.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

            // 假設 record 是陣列
            length = Object.keys(record).length;

            // 2. 分組 (key = YYYY-MM-DD)
            grouped = record.reduce((acc, item) => {
              logger.info(`item.created_at: ${item.created_at}`);
              const dateKey = item.created_at.toISOString().split("T")[0] // Date → YYYY-MM-DD
              logger.info(`dateKey: ${dateKey}`);

              if (!acc[dateKey]) {
                acc[dateKey] = [];
              }
              acc[dateKey].push(item);
              return acc;
            }, {});
            logger.info(`grouped: ${JSON.stringify(grouped)}`);
        }

        return res.status(201).render("recycle_bin", 
        { layout: "layout", 
          grouped_records: grouped, 
          priority: priority_from_role(decoded.role), 
          path: "/api/auth/recycle_bin", 
          id: decoded.id, 
          patient_id: `${decoded.id}-${length}`,
          name: decoded.name,
          token: token, 
          formatDateTime });
    } catch (err) {
        logger.info("recycle bin error: ", err.message);
        return res.redirect("/api/auth/loginPage");
    }
};

export const recycle_record = [
    upload_gb.any(), 
    async (req, res) => {
      try {
          const body = req.body;

          generateToken(body);

          const files = req.files;

          const token = body.token;
          if (!token) {
            return res.redirect("/api/auth/loginPage");
          }

          const action = body.action;
          const patientId = body.patient_id;

          if (action == "resume") {

              const uploadDir_gb = path.join(process.cwd(), "public", "uploads_gb", patientId);
              const uploadDir = path.join(process.cwd(), "public", "uploads", patientId);

              if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
              }

              if (fs.existsSync(uploadDir_gb)) {
                // move the files from folder with gb to that with original ones
                const moveOk = await movefiles(uploadDir_gb, uploadDir);
                if (moveOk == false) {
                  return res.status(401).json({ success: false, message: "Files transfer failed" })
                }
              }

              for (const file of files) {
                const targetPath = path.join(uploadDir, file.originalname);
                fs.renameSync(file.path, targetPath);
              }

              // 儲存檔案到 patient_id 資料夾
              for (let i = 1; i <= 8; i++) {
                const fieldName = `pic${i}_2`;
                const file = files.find(f => f.fieldname === fieldName);
                logger.info(`body[pic${i}_2]=`, body[`pic${i}_2`]);

                if (file) {
                  // 有新檔 → 搬移到 patient_id 資料夾
                  const newPath = path.join(uploadDir, file.originalname);
                  await fs.promises.rename(file.path, newPath);
                }
              }
              
              // recover the info in database records_gb accordingly
              const record = await recoverRecord(body);

              return res.status(201).json({ "success": true, "message": "Recover files successfully", redirect: "/api/auth/recycle_bin" });

          } else if (action === "delete") {
              const uploadDir_gb = path.join(process.cwd(), "public", "uploads_gb", patientId);
              if (fs.existsSync(uploadDir_gb)) {
                  // remove the files from folder with gb
                  await deletefiles(uploadDir_gb);
              }
              
              // remove the info in database records_gb accordingly
              const record = await deleteDiscardRecord(body);

              return res.status(201).json({ "success": true, "message": "Delete files successfully", redirect: "/api/auth/recycle_bin" });
          }
      } catch (err) {
          logger.info("recycle bin error: ", err.message);
          return res.redirect("/api/auth/loginPage");
      }
  }
];

export const changepwd = (req, res) => {
  logger.info(`body: ${JSON.stringify(req.query)}`);
  return res.status(200).render("changepwd", { layout: false, name: req.query.name, email: req.query.email });
};

export const verify_changepwd = async (req, res) => {

  logger.info(`req.body: ${JSON.stringify(req.body)}`);

  const userIdByName = await getUser("name", req.body.name);
  const userIdByEmail = await getUser("email", req.body.email);

  logger.info(`userIdByName: ${JSON.stringify(userIdByName)}`);
  logger.info(`userIdByEmail: ${JSON.stringify(userIdByEmail)}`);

  if (!userIdByName || !userIdByEmail) {
    return res.status(400).json({
        success: false,
        error: "Validation failed",
        message: "User not found",
    });
  }

  const id = userIdByEmail.id;

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

  const updated = updateUser("id", id, req.body);

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
            priority: priority_from_role(decoded.role), 
            layout: "layout", 
            name: decoded.name,
            email: decoded.email });
  } catch (err) {
    console.error("quickchangepwd error:", err.message);
    return res.redirect("/api/auth/loginPage");
  }
};

export const verify_quick_changepwd = async (req, res) => {
  try {
    const user = await getUser("name", req.body.name);
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

    const updated = updateUser("id", id, req.body);

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
