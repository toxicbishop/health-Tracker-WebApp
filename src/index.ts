import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import healthRoutes from "./routes/healthRoutes";
import { errorHandler } from "./middleware/errorHandler";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use("/health-log", healthRoutes);

app.get("/", (req, res) => {
  res.json({ message: "Health Tracker Backend is running! 🚀" });
});

// Global Error Handler
app.use(errorHandler as any);

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
