import express from "express";
import { initRecordTable, deleteRecordTable, fetchAllRecords } from "#controllers/records.controller.js";
import { authenticateToken } from "#src/middleware/users.middleware.js";

import dotenv from "dotenv";
dotenv.config();

const router = express.Router();

router.get('/init-rec', initRecordTable);
router.get('/del-rec', deleteRecordTable);
router.get('/', authenticateToken, fetchAllRecords);

export default router;
