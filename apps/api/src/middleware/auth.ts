import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AppError } from "./errorHandler";

export interface AuthRequest extends Request {
  user?: { walletAddress: string; role: string; userId: string };
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return next(new AppError(401, "Authentication required"));

  try {
    const secret = process.env.JWT_SECRET || "dev-secret";
    const payload = jwt.verify(token, secret) as any;
    req.user = payload;
    next();
  } catch {
    return next(new AppError(401, "Invalid or expired token"));
  }
}

export function optionalAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (token) {
    try {
      const secret = process.env.JWT_SECRET || "dev-secret";
      req.user = jwt.verify(token, secret) as any;
    } catch {}
  }
  next();
}
