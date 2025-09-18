import logger from "#config/logger.js";
import { getUserById, updateUser, deleteUser, getAllUsers } from "#services/users.service.js";
import { userIdSchema, updateUserSchema } from "#validations/users.validation.js";

/*
Get user by ID
*/
export const getUserByIdController = async (req, res) => {
    try {
        const { id } = userIdSchema.parse({ id: req.params.id });

        const user = await getUserById(id);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        logger.info(`Fetched user ${id}`);
        res.json(user);
    } catch(e) {
        logger.error("Error in getUserById", e);
        res.status(404).json({ error: e.message });
    }
};

/*
Update user
*/
export const updateUserController = async (req, res) => {
    
        logger.info("req.params:", req.params);
        const { id } = userIdSchema.parse({ id: req.params.id });
        logger.info("req.body:", req.body);
        const updates = updateUserSchema.parse(req.body);

        // Authorization: users can only update their own profile unless admin
        logger.info(`Authorization proceeds...`);
        logger.info(`req.user.role: ${req.user.role}`);
        logger.info(`req.user.id: ${req.user.id}`);
        logger.info(`id: ${id}`);

        //////////
        if (req.user.role !== "admin" && Number(req.user.id) !== id) {
            return res.status(403).json({ error: "Forbidden" });
        }

        // Only admin can change role
        logger.info("Validate role...");
        if (updates.role && req.user.role !== "admin") {
            return res.status(403).json({ error: "Only admins can change roles" });
        }
        //////////

        logger.info(`updateUser... (updates=${JSON.stringify(updates)})`);
        const updated = await updateUser(id, updates);
        
        logger.info(`User ${id} updated by ${req.user.email}`);
        res.json(updated);
    
};

/*
Delete user
*/

export const deleteUserController = async (req, res) => {
    try {
        const { id } = userIdSchema.parse({ id: req.params.id });

        // Authorization: admin OR the user themselves
        if (req.user.role !== "admin" && req.user.id !== id) {
            return res.status(403).json({ error: "Forbidden" });
        }

        const result = await deleteUser(id);

        logger.info(`User ${id} deleted by ${req.user.email}`);
        res.json(result);
    } catch(e) {
        logger.error("Error in deleteUser", e);
        res.status(400).json({ error: e.message });
    }
};

export const fetchAllUsers = async (req, res, next) => {
    try {
        logger.info('Getting users...');

        const allUsers = await getAllUsers();

        res.json({
            message: 'Successfully retrieved users',
            users: allUsers,
            count: allUsers.length,
        });

    } catch(e) {
        logger.error(e);
        next(e);
    }
}