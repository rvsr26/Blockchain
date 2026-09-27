import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger";

export class AppError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
    this.name = "AppError";
  }
}

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  logger.error(`${req.method} ${req.path} - ${err.message}`);
  
  if (err.name === "AppError") {
    return res.status(err.statusCode).json({ error: err.message });
  }
  
  if (err.code === "P2002") {
    return res.status(409).json({ error: "A record with this information already exists." });
  }
  
  if (err.name === "ZodError") {
    return res.status(400).json({ error: "Invalid input data", details: err.errors });
  }
  
  return res.status(500).json({ error: "An internal server error occurred. Please try again." });
}
