import 'dotenv/config';

import { defineConfig } from "drizzle-kit";
import dotenv from "dotenv";

dotenv.config();

console.log("DATABASE_URL:", process.env.DATABASE_URL); // ← debug 用

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/schema/*",
  out: "./drizzle",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});

