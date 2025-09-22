import { sql } from "#config/database.js";
import logger from "#config/logger.js";
import bcrypt from "bcrypt";

/*
Get registers by ID
*/
export const getRegisterById = async (id) => {
    logger.info(`Search for id=${id}`);
    const result = await sql`SELECT * FROM registers WHERE id = ${id}`;
    return result[0] || null;
}

/*
Get ID by registers
*/
export const getIdByRegister = async (fieldname, value) => {
    logger.info(`Search for ${fieldname}=${value}`);
    let result;
    if (fieldname == "name") {
      result = await sql`SELECT id FROM registers WHERE name = ${value}`;
    }

    if (fieldname == "email") {
      result = await sql`SELECT id FROM registers WHERE email = ${value}`;
    }

    return result[0] || null;
};

/*
Get User by ID
*/
export const getUserById = async (id) => {
    logger.info(`Search for id=${id}`);
    const result = await sql`SELECT * FROM users WHERE id = ${id}`;
    return result[0] || null;
};

/*
Get ID by User
*/
export const getIdByUser = async (fieldname, value) => {
    logger.info(`Search for ${fieldname}=${value}`);
    let result;
    if (fieldname == "name") {
      result = await sql`SELECT * FROM users WHERE name = ${value}`;
    }

    if (fieldname == "email") {
      result = await sql`SELECT * FROM users WHERE email = ${value}`;
    }

    return result[0] || null;
};

/*
Update registers
*/
export const updateRegister = async (id, updates) => {
    const existing = await getRegisterById(id);
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
    WHERE id = ${id}
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
export const updateUser = async (id, updates) => {
    const existing = await getUserById(id);
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
    SET name = ${updates.name}, email = ${updates.email}, role = ${updates.role}, password = ${updates.password}, updated_at = NOW()
    WHERE id = ${id}
    RETURNING id, name, email, role, password, created_at, updated_at
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
export const deleteUser = async (id) => {
    const existing = await getUserById(id);

    if (!existing) {
      throw new Error("User not found");
    }

    await sql`DELETE FROM users WHERE id = ${id}`;
    return { message: `User ${id} deleted successfully` };
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