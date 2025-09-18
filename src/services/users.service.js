import { sql } from "#config/database.js";
import logger from "#config/logger.js";
import bcrypt from "bcrypt";

/*
Get User by ID
*/
export const getUserById = async (id) => {
    logger.info(`Search for id=${id}`);
    const result = await sql`SELECT * FROM users WHERE id = ${id}`;
    return result[0] || null;
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

  if (updates.password) {
    setClauses.push(`password = ${updates.password}`);
  } else {
    updates.password = existing.password;
  }

  if (setClauses.length === 0) return existing;

  logger.info("applying update sql command");
  
  const updated = await sql`UPDATE users
  SET name = ${updates.name}, email = ${updates.email}, role = ${updates.role}, password = ${updates.password}, updated_at = NOW()
  WHERE id = ${id}
  RETURNING id, name, email, role, created_at, updated_at
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

export const getAllUsers = async () => {
    try {
        const result = await sql`
          SELECT
            id,
            email,
            name,
            role,
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