import bcrypt from "bcrypt";
import logger from "#src/config/logger.js";
import { sql } from "#config/database.js";

// ✅ 刪除 records 資料表
export const removeRecordTable = async () => {
  try {
    console.log("🔍 刪除 records/records_gb 資料表中...");
    await sql`DROP TABLE records`;
    await sql`DROP TABLE records_db`;

    console.log("✅ 刪除 records/records_gb 資料表完成");
  } catch (e) {
    console.error("❌ 刪除 records/records_gb 資料表失敗:", e);
    throw e;
  }
};

// ✅ 建立 records 資料表
export const createRecordTable = async () => {
    try {
        console.log("🔍 建立 records 資料表中...");
        
        await sql`
          CREATE TABLE IF NOT EXISTS records (
            id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
            name TEXT NOT NULL,
            gender TEXT NOT NULL,
            age INTEGER NOT NULL,
            patient_id TEXT NOT NULL,
            result TEXT,
            notes TEXT,
            status TEXT,
            progress INT,
            message TEXT,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW(),
            img1 TEXT,
            img2 TEXT,
            img3 TEXT,
            img4 TEXT,
            img5 TEXT,
            img6 TEXT,
            img7 TEXT,
            img8 TEXT,
            img1_result TEXT,
            img2_result TEXT,
            img3_result TEXT,
            img4_result TEXT,
            img5_result TEXT,
            img6_result TEXT,
            img7_result TEXT,
            img8_result TEXT
          )
        `;

        await sql`
          CREATE TABLE IF NOT EXISTS records_gb (
            id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
            name TEXT NOT NULL,
            gender TEXT NOT NULL,
            age INTEGER NOT NULL,
            patient_id TEXT NOT NULL,
            result TEXT,
            notes TEXT,
            status TEXT,
            progress INT,
            message TEXT,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW(),
            img1 TEXT,
            img2 TEXT,
            img3 TEXT,
            img4 TEXT,
            img5 TEXT,
            img6 TEXT,
            img7 TEXT,
            img8 TEXT,
            img1_result TEXT,
            img2_result TEXT,
            img3_result TEXT,
            img4_result TEXT,
            img5_result TEXT,
            img6_result TEXT,
            img7_result TEXT,
            img8_result TEXT
          )
        `;
        console.log("✅ records 資料表建立完成");
    } catch (e) {
        console.error("❌ 建立 records 資料表失敗:", e);
        throw e;
    }
};

/* visualize records table */
export const getAllRecords = async () => {
    try {
        const result = await sql`
          SELECT
            id,
            name,
            gender,
            age,
            patient_id,
            created_at,
            updated_at,
            result,
            notes,
            img1,
            img2,
            img3,
            img4,
            img5,
            img6,
            img7,
            img8,
            img1_result,
            img2_result,
            img3_result,
            img4_result,
            img5_result,
            img6_result,
            img7_result,
            img8_result 
          FROM records
        `;
        return result;
    } catch (e) {
        logger.error("Error getting records", e);
        throw e;
    }
};

export const findRecord = async (key, value) => {
    let result = null;
    if (key === "name") {
        result = await sql`SELECT * FROM records WHERE name = ${value}`;
    } else if (key === "id") {
        result = await sql`SELECT * FROM records WHERE id = ${value}`;
    }
    return result;
};

export const createRecord = async (body) => {
  //try {
    // raw SQL 查詢
    logger.info(`body: ${JSON.stringify(body)}`);

    const existingRecord = await sql`SELECT * FROM records WHERE patient_id = ${body.patient_id}`;

    console.log("✅ Step 1 結果:", existingRecord);

    if (existingRecord.length > 0) {
      throw new Error(`Record with patient_id ${body.patient_id} already exists`);
    }

    console.log(`
      INSERT INTO records (name, gender, age, patient_id, notes, updated_at, img1, img2, img3, img4, img5, img6, img7, img8)
      VALUES (${body.name}, ${body.gender}, ${body.age}, ${body.patient_id}, ${body.notes}, NOW(), ${body.pic1_2}, ${body.pic2_2}, ${body.pic3_2}, ${body.pic4_2}, ${body.pic5_2}, ${body.pic6_2}, ${body.pic7_2}, ${body.pic8_2})
      RETURNING name, gender, age, patient_id, notes, created_at, updated_at, img1, img2, img3, img4, img5, img6, img7, img8
    `);

    const newRecord = await sql`
      INSERT INTO records (name, gender, age, patient_id, notes, updated_at, img1, img2, img3, img4, img5, img6, img7, img8)
      VALUES (${body.name}, ${body.gender}, ${body.age}, ${body.patient_id}, ${body.notes}, NOW(), ${body.pic1_2}, ${body.pic2_2}, ${body.pic3_2}, ${body.pic4_2}, ${body.pic5_2}, ${body.pic6_2}, ${body.pic7_2}, ${body.pic8_2})
      RETURNING name, gender, age, patient_id, notes, created_at, updated_at, img1, img2, img3, img4, img5, img6, img7, img8
    `;

    console.log("✅ Step 2 完成:", newRecord[0]);

    return newRecord[0];
  //} catch (e) {
  //  console.error("❌ createRecord 發生錯誤:", e);
  //  throw e;
  //}
};

export const updateRecord = async (body, imgUpdates) => {
  try {
    // raw SQL 查詢
    const existingRecord = await sql`SELECT * FROM records WHERE patient_id = ${body.patient_id}`;

    console.log("✅ Step 1 結果:", existingRecord);

    if (existingRecord.length == 0) {
      throw new Error(`Record with patient_id ${body.patient_id} not exists`);
    }

    const editRecord = await sql`
        UPDATE records
        SET 
          name = ${body.name},
          gender = ${body.gender},
          age = ${body.age},
          notes = ${body.notes},
          updated_at = NOW(),
          img1 = ${imgUpdates.pic1_2},
          img2 = ${imgUpdates.pic2_2},
          img3 = ${imgUpdates.pic3_2},
          img4 = ${imgUpdates.pic4_2},
          img5 = ${imgUpdates.pic5_2},
          img6 = ${imgUpdates.pic6_2},
          img7 = ${imgUpdates.pic7_2},
          img8 = ${imgUpdates.pic8_2}
        WHERE patient_id = ${body.patient_id}
        RETURNING *
      `;

    console.log("✅ Step 2 完成:", editRecord[0]);
    return editRecord[0];
  } catch (e) {
    console.error("❌ createRecord 發生錯誤:", e);
    throw e;
  }
};

export const deleteRecord = async (body) => {
  try {
    // raw SQL 查詢
    const existingRecord = await sql`SELECT * FROM records WHERE patient_id = ${body.patient_id}`;

    console.log("✅ Step 1 結果:", existingRecord);

    if (existingRecord.length == 0) {
      throw new Error(`Record with patient_id ${body.patient_id} has already deleted`);
    }

    await sql`INSERT INTO records_gb (
            name, gender, age, patient_id, result, notes, status, progress, message, created_at, updated_at, 
            img1, img2, img3, img4, img5, img6, img7, img8,
            img1_result, img2_result, img3_result, img4_result, img5_result, img6_result, img7_result, img8_result
        )
        SELECT
            name, gender, age, patient_id, result, notes, status, progress, message, created_at, updated_at,
            img1, img2, img3, img4, img5, img6, img7, img8,
            img1_result, img2_result, img3_result, img4_result, img5_result, img6_result, img7_result, img8_result
        FROM records
        WHERE patient_id = ${body.patient_id}
        RETURNING *
    `;

    await sql`DELETE FROM records 
        WHERE patient_id = ${body.patient_id}
    `;

    console.log("✅ Step 2 完成");
  } catch (e) {
    console.error("❌ deleteRecord 發生錯誤:", e);
    throw e;
  }
};

export const recoverRecord = async (body) => {
  try {
    // raw SQL 查詢
    const existingRecord = await sql`SELECT * FROM records WHERE patient_id = ${body.patient_id}`;

    console.log("✅ Step 1 結果:", existingRecord);

    if (existingRecord.length !== 0) {
      throw new Error(`Record with patient_id ${body.patient_id} already exists`);
    }

    const record = await sql`INSERT INTO records (
            name, gender, age, patient_id, result, notes, status, progress, message, created_at, updated_at, 
            img1, img2, img3, img4, img5, img6, img7, img8,
            img1_result, img2_result, img3_result, img4_result, img5_result, img6_result, img7_result, img8_result
        )
        SELECT
            name, gender, age, patient_id, result, notes, status, progress, message, created_at, updated_at,
            img1, img2, img3, img4, img5, img6, img7, img8,
            img1_result, img2_result, img3_result, img4_result, img5_result, img6_result, img7_result, img8_result
        FROM records_gb
        WHERE patient_id = ${body.patient_id}
        RETURNING *
    `;

    await sql`DELETE FROM records_gb
        WHERE patient_id = ${body.patient_id}
    `;

    console.log("✅ Step 2 完成:", record[0]);
    return record[0];
  } catch (e) {
    console.error("❌ recoverRecord 發生錯誤:", e);
    throw e;
  }
};