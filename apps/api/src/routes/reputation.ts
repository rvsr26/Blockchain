import { Router, Request, Response, NextFunction } from "express";
import { prisma } from "../utils/db";

const router = Router();

router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { walletAddress } = req.query;
    const where: any = walletAddress ? { walletAddress } : {};
    const events = await prisma.reputationEvent.findMany({ where, orderBy: { createdAt: "desc" } });
    
    // Aggregate scores
    const scores: Record<string, number> = {};
    events.forEach((e) => { scores[e.walletAddress] = (scores[e.walletAddress] || 0) + e.points; });
    
    if (walletAddress) {
      res.json({ walletAddress, totalScore: scores[walletAddress as string] || 0, events });
    } else {
      const leaderboard = Object.entries(scores).map(([wallet, score]) => ({ wallet, score })).sort((a, b) => b.score - a.score);
      res.json({ leaderboard, events });
    }
  } catch (err) { next(err); }
});

router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const event = await prisma.reputationEvent.create({ data: req.body });
    res.status(201).json(event);
  } catch (err) { next(err); }
});

export default router;
