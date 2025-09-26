import { sql } from "#config/database.js";
import logger from "#config/logger.js";
import bcrypt from "bcrypt";

/*
Get registers by ID
*/
export const getRegister = async (fieldname, value) => {
    logger.info(`Search for ${fieldname}=${value}`);
    let result = null;

    if (fieldname == "id") {
      result = await sql`SELECT * FROM registers WHERE id = ${value}`;
    } else if (fieldname == "name") {
      result = await sql`SELECT * FROM registers WHERE name = ${value}`;
    } else if (fieldname == "email") {
      result = await sql`SELECT * FROM registers WHERE email = ${value}`;
    }

    return result[0] || null;
}

/*
Get ID by User
*/
export const getUser = async (fieldname, value) => {
    logger.info(`Search for ${fieldname}=${value}`);
    let result;
    if (fieldname == "name") {
      result = await sql`SELECT * FROM users WHERE name = ${value}`;
    }

    if (fieldname == "email") {
      result = await sql`SELECT * FROM users WHERE email = ${value}`;
    }

    if (fieldname == "id") {
      result = await sql`SELECT * FROM users WHERE id = ${value}`;
    }

    return result[0] || null;
};

/*
Update registers
*/
export const updateRegister = async (fieldname, value, updates) => {
    const existing = await getRegister(fieldname, value);
    if (!existing) throw new Error("User not found");

    const setClauses = [];

    if (updates.status) {
      setClauses.push(`status = '${updates.status}'`);
    } else {
      updates.status = existing.status;
    }
    
    logger.info(`updates: ${JSON.stringify(updates)}`);
    logger.info("applying update sql command");
    
    const updated = await sql`UPDATE registers
    SET name = ${updates.name}, email = ${updates.email}, role = ${updates.role}, status = ${updates.status}
    WHERE id = ${updates.id}
    RETURNING id, name, email, status
    `;

    if (updated.length === 0) {
      throw new Error(`Update failed: user ${id} not found`);
    }

    logger.info("Updated registers successfully");
    return updated[0];
};

export const updateUserTableFromRegister = async (id, name) => {

    const result = await sql`SELECT * FROM users WHERE name = ${name}`;

    if (result.length !== 0) {
      throw new Error(`Update failed: user ${name} has already existed`);
    }
    
    const updated = await sql`INSERT INTO users (
                name, email, role, created_at
              )
              SELECT name, email, role, created_at FROM registers
              WHERE id=${id}
              RETURNING id, name, email, role, created_at`;
    
    if (updated.length === 0) {
      throw new Error(`Update failed: register ${id} not found`);
    } 

    logger.info("Updated users from registers successfully");
    return updated[0];
};

/*
Update user
*/
export const updateUser = async (fieldname, value, updates) => {
    const existing = await getUser(fieldname, value);

    logger.info(`existing: ${JSON.stringify(existing)}`);

    if (!existing) throw new Error("User not found");

    const setClauses = [];

    if (updates.name) {
      setClauses.push(`name = '${updates.name}'`);
    } else {
      updates.name = existing.name;
    }

    if (updates.email) {
      setClauses.push(`email = '${updates.email}'`);
    } else {
      updates.email = existing.email;
    }

    if (updates.role) {
      setClauses.push(`role = '${updates.role}'`);
    } else {
      updates.role = existing.role;
    }

    if (updates.unit) {
      setClauses.push(`unit = '${updates.unit}'`);
    } else {
      updates.unit = existing.unit;
    }

    let password_hash = null;
    if (updates.password) {
      password_hash = await bcrypt.hash(updates.password, 10);
      updates.password = password_hash;
      setClauses.push(`password = ${password_hash}`);
    } else {
      password_hash = await bcrypt.hash(existing.password, 10);
      updates.password = password_hash;
    }

    if (setClauses.length === 0) return existing;

    logger.info("applying update sql command");
    
    const updated = await sql`UPDATE users
    SET name = ${updates.name}, email = ${updates.email}, role = ${updates.role}, password = ${updates.password}, unit = ${updates.unit}, updated_at = NOW()
    WHERE id = ${existing.id}
    RETURNING id, name, email, role, unit, password, created_at, updated_at
    `;

    if (updated.length === 0) {
      throw new Error(`Update failed: user ${id} not found`);
    }

    logger.info("Updated users Successfully");
    return updated[0];
};

/*
Delete user
*/
export const deleteUser = async (fieldname, value) => {
    const existing = await getUser(fieldname, value);

    if (!existing) {
      throw new Error("User not found");
    }

    if (fieldname == "id") {
      await sql`DELETE FROM users WHERE id = ${value}`;
    } else if (fieldname == "name") {
      await sql`DELETE FROM users WHERE name = ${value}`;
    } else if (fieldname == "email") {
      await sql`DELETE FROM users WHERE email = ${value}`;
    }
    return { message: `User deleted successfully` };
};

/*
Visualize user table
*/
export const getAllUsers = async () => {
    try {
        const result = await sql`
          SELECT
            id,
            email,
            name,
            role,
            unit,
            password,
            created_at,
            updated_at
          FROM users
        `;
        return result;
    } catch (e) {
        logger.error("Error getting users", e);
        throw e;
    }
};

/*
Visualize registers table
*/
export const getAllRegisters = async () => {
    try {
        const result = await sql`
          SELECT
            id,
            email,
            name,
            role,
            status,
            created_at,
            expired_at
          FROM registers
        `;
        return result;
    } catch (e) {
        logger.error("Error getting registers", e);
        throw e;
    }
};