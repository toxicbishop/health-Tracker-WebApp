import { Router, Request, Response, NextFunction } from "express";
import { HealthLog } from "../types/health";
import { validate } from "../middleware/validate";
import { HealthLogSchema } from "../validations/healthValidation";

import { googleSheetsService } from "../services/googleSheetsService";

const router = Router();

// In-memory cache could still be used for GETr but for Phase 4 we save to Sheets
let healthLogs: HealthLog[] = [];

/**
 * @route   POST /health-log
 * @desc    Create a new health log entry and save to Google Sheets
 * @access  Public (for now)
 */
router.post("/", validate(HealthLogSchema as any), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const logData: HealthLog = req.body;

    // Save to Google Sheets
    await googleSheetsService.appendLog(logData);

    // Also keep in memory for the GET endpoint for now
    const newLog = {
      ...logData,
      id: Math.random().toString(36).substring(2, 9)
    };
    healthLogs.push(newLog);

    console.log(`[API]: New health log added and saved to Sheets: ${newLog.type}`);
    res.status(201).json(newLog);
  } catch (error) {
    next(error); // Pass to global error handler
  }
});

/**
 * @route   GET /health-log
 * @desc    Retrieve all health log entries
 * @access  Public (for now)
 */
router.get("/", (req: Request, res: Response) => {
  try {
    const { userId, type } = req.query;

    let filteredLogs = healthLogs;

    if (userId) {
      filteredLogs = filteredLogs.filter(log => log.userId === userId);
    }

    if (type) {
      filteredLogs = filteredLogs.filter(log => log.type === type);
    }

    res.json(filteredLogs);
  } catch (error) {
    console.error("[API Error]:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
