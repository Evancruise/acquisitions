import bcrypt from "bcrypt";
import { sql } from "#config/database.js";

// ✅ 建立新使用者
export const createUser = async ({ name, email, password, role = "user" }) => {
  try {
    console.log("🔍 Step 1: 準備查詢使用者", email);

    // raw SQL 查詢
    const existingUser = await sql`SELECT * FROM users WHERE email = ${email}`;

    console.log("✅ Step 1 結果:", existingUser);

    if (existingUser.length > 0) {
      throw new Error("User already exists");
    }

    console.log("🔍 Step 2: 開始雜湊密碼");
    const password_hash = await bcrypt.hash(password, 10);
    console.log("✅ Step 2 完成，hash=", password_hash);

    console.log("🔍 Step 3: 插入新使用者");

    const newUser = await sql`
      INSERT INTO users (name, email, password, role)
      VALUES (${name}, ${email}, ${password_hash}, ${role})
      RETURNING id, name, email, role, created_at
    `;

    console.log("✅ Step 3 完成:", newUser[0]);

    return newUser[0];
  } catch (e) {
    console.error("❌ createUser 發生錯誤:", e);
    throw e;
  }
};

// ✅ 依 email 查詢使用者
export const findUserByEmail = async (email) => {
  const result = await sql`SELECT * FROM users WHERE email = ${email}`;
  return result[0] || null;
};

// ✅ 驗證使用者密碼
export const validateUserCredentials = async (email, password) => {
  const user = await findUserByEmail(email);

  if (!user) {
    throw new Error("Invalid credentials");
  }

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    throw new Error("Invalid credentials");
  }

  return user;
};
