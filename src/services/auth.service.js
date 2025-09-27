import bcrypt from "bcrypt";
import logger from "#src/config/logger.js";
import { sql } from "#config/database.js";

// ✅ 刪除 register 資料表
export const removeRegisterTable = async() => {
  try {
    console.log("🔍 刪除 registers 資料表中...");
    await sql`DROP TABLE registers`;

    console.log("✅ 刪除 registers 資料表完成");
  } catch (e) {
    console.error("❌ 刪除 registers 資料表失敗:", e);
    throw e;
  }
};

// ✅ 刪除 users 資料表
export const removeUserTable = async() => {
  try {
    console.log("🔍 刪除 users 資料表中...");
    await sql`DROP TABLE users`;

    console.log("✅ 刪除 users 資料表完成");
  } catch (e) {
    console.error("❌ 刪除 users 資料表失敗:", e);
    throw e;
  }
};

// ✅ 建立 register 資料表
export const createRegisterTable = async () => {
  try {
    console.log("🔍 建立 registers 資料表中...");

    await sql`
      CREATE TABLE IF NOT EXISTS registers (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password TEXT,
        role VARCHAR(50) DEFAULT 'tester',
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT NOW(),
        expired_at TIMESTAMP DEFAULT NOW()
      )
    `;

    console.log("✅ registers 資料表建立完成");
  } catch (e) {
    console.error("❌ 建立 registers 資料表失敗:", e);
    throw e;
  }
};

// ✅ 建立 users 資料表
export const createUsersTable = async () => {
  try {
    console.log("🔍 建立 users 資料表中...");

    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password TEXT,
        role VARCHAR(50) DEFAULT 'tester',
        unit VARCHAR(100) DEFAULT 'personal',
        note TEXT,
        status VARCHAR(50) DEFAULT 'deactivated',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;

    const admin_user = await createUser({ name: "admin", email: "admin@gmail.com", password: process.env.DB_PASSWORD, role: "system manager", note: "none" });

    console.log("✅ users 資料表建立完成");
  } catch (e) {
    console.error("❌ 建立 users 資料表失敗:", e);
    throw e;
  }
};

// ✅ 建立註冊使用者
export const createRegister = async ({ name, email, role = "tester" }) => {
  try {
    // raw SQL 查詢
    const existingRegister = await sql`SELECT * FROM registers WHERE email = ${email}`;

    if (existingRegister.length > 0) {
      throw new Error(`Register with email ${email} already exists`);
    }

    const newRegister = await sql`
      INSERT INTO registers (name, email, role, status, created_at, expired_at)
      VALUES (${name}, ${email}, ${role}, 'pending', NOW(), NOW() + interval '1 hour')
      RETURNING id, name, email, status, created_at, expired_at
    `;

    console.log("✅ Step 3 完成:", newRegister[0]);
    return newRegister[0];
  } catch(err) {
    console.error("❌ createRegister 發生錯誤:", err);
    throw err;
  }
}

// ✅ 建立新使用者
export const createUser = async ({ name, email, password, role = "tester", unit = "personal", note = "none" }) => {
  try {
    // raw SQL 查詢
    const existingUser = await sql`SELECT * FROM users WHERE email = ${email}`;

    console.log("✅ Step 1 結果:", existingUser);

    if (existingUser.length > 0) {
      throw new Error(`User with email ${email} already exists`);
    }

    console.log("🔍 Step 2: 開始雜湊密碼");
    const password_hash = await bcrypt.hash(password, 10);
    console.log("✅ Step 2 完成，hash=", password_hash);

    console.log("🔍 Step 3: 插入新使用者");

    const newUser = await sql`
      INSERT INTO users (name, email, password, role, unit, note)
      VALUES (${name}, ${email}, ${password_hash}, ${role}, ${unit}, ${note})
      RETURNING id, name, email, password, role, unit, note, status, created_at
    `;

    console.log("✅ Step 3 完成:", newUser[0]);

    return newUser[0];
  } catch (e) {
    console.error("❌ createUser 發生錯誤:", e);
    throw e;
  }
};

// ✅ 依 name/email 查詢當前註冊使用者
export const findRegister = async ({email}) => {
  const result = await sql`SELECT * FROM registers WHERE email = ${email}`;
  return result[0] || null;
};

// ✅ 查詢使用者
export const findUser = async (key, value) => {
  let result = null;
  if (key === "name") {
    result = await sql`SELECT * FROM users WHERE name = ${value}`;
  } else if (key === "email") {
    result = await sql`SELECT * FROM users WHERE email = ${value}`;
  }
  return result[0] || null;
};

// ✅ 驗證使用者密碼
export const validateUserCredentials = async ({email, password}) => {
  const user = await findUser("email", email);

  if (!user) {
    throw new Error("Invalid credentials");
  }

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    throw new Error("Invalid credentials");
  }

  return user;
};
