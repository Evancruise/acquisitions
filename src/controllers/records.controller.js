
import logger from '#config/logger.js';
import { removeRecordTable, createRecordTable, removeDiscardRecordTable, createDiscardRecordTable } from '#src/services/records.service.js';
import { getAllRecords, getAllDiscardRecords } from '#src/services/records.service.js';

export const deleteRecordTable = async (req, res) => {
    removeRecordTable();
    logger.info("✅ Delete record table");
    res.status(200).json({ message: "Delete record table successfully" });
};

export const initRecordTable = async (req, res) => {
    createRecordTable();
    logger.info("✅ Init record table");
    res.status(200).json({ message: "Init record table successfully" });
};

export const deleteDiscardRecordTable = async (req, res) => {
    removeDiscardRecordTable();
    logger.info("✅ Delete record_gb table");
    res.status(200).json({ message: "Delete record_gb table successfully" });
};

export const initDiscardRecordTable = async (req, res) => {
    createDiscardRecordTable();
    logger.info("✅ Init record_gb table");
    res.status(200).json({ message: "Init record_gb table successfully" });
};

/*
Acquire records table
*/
export const fetchAllRecords = async (req, res, next) => {
    try {
        logger.info('Getting records table...');

        const allRecords = await getAllRecords();

        res.json({
            message: 'Successfully retrieved records',
            users: allRecords,
            count: allRecords.length,
        });

    } catch(e) {
        logger.error(e);
        next(e);
    }
};

/*
Acquire records_gb table
*/
export const fetchAllDiscardRecords = async (req, res, next) => {
    try {
        logger.info('Getting records_gb table...');

        const allDiscardRecords = await getAllDiscardRecords();

        res.json({
            message: 'Successfully retrieved records_gb',
            users: allDiscardRecords,
            count: allDiscardRecords.length,
        });

    } catch(e) {
        logger.error(e);
        next(e);
    }
};