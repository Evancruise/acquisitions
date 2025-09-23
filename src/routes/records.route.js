import express from "express";
import { initRecordTable, deleteRecordTable, initDiscardRecordTable, deleteDiscardRecordTable, fetchAllRecords, fetchAllDiscardRecords } from "#controllers/records.controller.js";
import { authenticateToken } from "#src/middleware/users.middleware.js";

import dotenv from "dotenv";
dotenv.config();

const router = express.Router();

router.get('/init-rec', initRecordTable);
router.get('/del-rec', deleteRecordTable);
router.get('/init-rec-gb', initDiscardRecordTable);
router.get('/del-rec-gb', deleteDiscardRecordTable);

router.get('/rec', authenticateToken, fetchAllRecords);
router.get('/rec-gb', authenticateToken, fetchAllDiscardRecords);

export default router;
