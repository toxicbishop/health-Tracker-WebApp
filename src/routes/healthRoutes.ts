import { Router, Request, Response } from "express";
import { HealthLog } from "../types/health";
import { validate } from "../middleware/validate";
import { HealthLogSchema } from "../validations/healthValidation";

const router = Router();

// In-memory storage for demonstration purposes (Phase 2)
// This will be replaced by a database in later phases.
let healthLogs: HealthLog[] = [];

/**
 * @route   POST /health-log
 * @desc    Create a new health log entry
 * @access  Public (for now)
 */
router.post("/", validate(HealthLogSchema as any), (req: Request, res: Response) => {
  try {
    const logData: HealthLog = req.body;

    // Add unique ID
    const newLog = {
      ...logData,
      id: Math.random().toString(36).substring(2, 9)
    };

    healthLogs.push(newLog);

    console.log(`[API]: New health log added: ${newLog.type} for user ${newLog.userId}`);
    res.status(201).json(newLog);
  } catch (error) {
    console.error("[API Error]:", error);
    res.status(500).json({ error: "Internal Server Error" });
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
