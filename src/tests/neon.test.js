import 'dotenv/config';
import { neon, neonConfig } from '@neondatabase/serverless';

// ⚠️ 這裡改成你的 Neon Local Proxy endpoint
const FETCH_ENDPOINT = 'http://neon-local:4444/sql';

async function main() {
  try {
    // 設定 fetchEndpoint（只針對本地 proxy）
    neonConfig.fetchEndpoint = FETCH_ENDPOINT;
    neonConfig.useSecureWebSocket = false;
    neonConfig.poolQueryViaFetch = true;

    // 從環境變數讀 DATABASE_URL
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      throw new Error("❌ DATABASE_URL not found in environment");
    }

    console.log("🔍 Using DATABASE_URL:", dbUrl);
    console.log("🔍 Fetch endpoint:", FETCH_ENDPOINT);

    // 建立 client
    const sql = neon(dbUrl);

    // 嘗試跑個簡單查詢
    const result = await sql`SELECT now() as current_time;`;

    console.log("✅ Connection successful! Result:");
    console.log(result);
  } catch (err) {
    console.error("❌ Connection failed:", err);
  }
}

main();