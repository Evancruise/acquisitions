
import logger from '#config/logger.js';
import { removeRecordTable, createRecordTable } from '#src/services/records.service.js';
import { getAllRecords } from '#src/services/records.service.js';

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