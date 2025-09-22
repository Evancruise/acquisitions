import { formatValidationError } from "#utils/format.js";
import { createUser, 
         createUsersTable, 
         removeUserTable, 
         createRegister, 
         createRegisterTable, 
         removeRegisterTable,
         findRegister } from "#services/auth.service.js";
import { createRecord, deleteRecord, updateRecord } from "#src/services/records.service.js";
import { signupSchema, signinSchema } from "#validations/auth.validation.js";
import bcrypt from 'bcrypt';
import jwt from "jsonwebtoken";
import logger from '#config/logger.js';
import { getIdByUser, updateUser, updateRegister, updateUserTableFromRegister } from "#src/services/users.service.js";
import { findRecord } from "#src/services/records.service.js";
import sgMail from "@sendgrid/mail";
import multer from "multer";
import fs from "fs";
import path from "path";

const upload = multer({ dest: "uploads/" });

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

// ✅ 註冊
export const request = async (req, res) => {

  try {
    const { name, email } = req.body;

    const token = jwt.sign({ email, name }, 
        process.env.JWT_SECRET,
       { expiresIn: "1h" });
    
    logger.info(`createRegister: name: ${name} email: ${email}`);
    const register = await createRegister({ name, email });
    logger.info(`register: ${JSON.stringify(register)}`);

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
            updated = updateRegister(id, register);
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

    logger.info(`email: ${email}`);

    const user = await findUserByEmail(email);

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
        token: token,
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

    return res.status(201).render("record", 
    { layout: "layout", 
      grouped_records: grouped, 
      priority: 1, 
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
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

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
    
    if (action === "save") {
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

export const changepwd = (req, res) => {
  logger.info(`body: ${JSON.stringify(req.query)}`);
  return res.status(200).render("changepwd", { layout: false, name: req.query.name, email: req.query.email });
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
