import express from 'express';
import { fetchAllRegisters } from '#controllers/users.controller.js';
import { authenticateToken } from '#src/middleware/users.middleware.js';

import dotenv from "dotenv";
dotenv.config();

const router = express.Router();

router.get('/', authenticateToken, fetchAllRegisters);

export default router;
