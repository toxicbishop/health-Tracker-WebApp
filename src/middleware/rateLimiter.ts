import rateLimit from "express-rate-limit";

// Rate limiter for general routes (e.g., getting profiles, logging health data)
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again after 15 minutes",
});

// Stricter rate limiter for authentication routes (login, register)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 requests per windowMs
  message:
    "Too many login attempts from this IP, please try again after 15 minutes",
});
