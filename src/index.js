import express from "express";
import dotenv from "dotenv";
import pkg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { users } from "./src/schema/user.js";

dotenv.config();

const app = express();
const port = 3000;

// PostgreSQL 連線
const { Pool } = pkg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const db = drizzle(pool);

// 測試路由
app.get("/", async (req, res) => {
  const allUsers = await db.select().from(users);
  res.json(allUsers);
});

app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
});