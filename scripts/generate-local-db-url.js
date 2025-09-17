import fs from "fs";
import path from "path";

function generateDbUrl(logFile) {
  // 讀 Neon Local Proxy 的 log
  const content = fs.readFileSync(logFile, "utf-8");

  // 嘗試抓出 database, user, password
  const dbMatch = content.match(/'database':\s*'([^']+)'/);
  const userMatch = content.match(/'user':\s*'([^']+)'/);
  const pwMatch = content.match(/'password':\s*'([^']+)'/);

  if (!dbMatch || !userMatch || !pwMatch) {
    throw new Error("❌ 無法從 log 解析出資料庫資訊");
  }

  const db = dbMatch[1];
  const user = userMatch[1];
  const password = pwMatch[1];

  // ⚠️ host 改成 neon-local:5432
  const url = `postgres://${user}:${password}@neon-local:5432/${db}`;
  return url;
}

// 假設 log 存在 tmp/neon-local.log
const logPath = process.argv[2] || path.resolve("tmp/neon-local.log");

try {
  const url = generateDbUrl(logPath);
  console.log("✅ Local DATABASE_URL:");
  console.log(url);
} catch (err) {
  console.error(err.message);
  process.exit(1);
}
