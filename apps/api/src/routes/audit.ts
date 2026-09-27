import { Router, Request, Response, NextFunction } from "express";
import { prisma } from "../utils/db";

const router = Router();

router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { module, action, actorWallet, startDate, endDate, page = "1", limit = "50" } = req.query;
    const where: any = {};
    if (module) where.module = module;
    if (action) where.action = action;
    if (actorWallet) where.actorWallet = actorWallet;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate as string);
      if (endDate) where.createdAt.lte = new Date(endDate as string);
    }
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const [events, total] = await Promise.all([
      prisma.auditEvent.findMany({ where, orderBy: { createdAt: "desc" }, skip, take: parseInt(limit as string) }),
      prisma.auditEvent.count({ where }),
    ]);
    res.json({ events, total, page: parseInt(page as string), limit: parseInt(limit as string) });
  } catch (err) { next(err); }
});

export default router;
