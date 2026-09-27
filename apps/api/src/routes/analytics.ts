import { Router, Request, Response, NextFunction } from "express";
import { prisma } from "../utils/db";

const router = Router();

router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const [
      totalOrgs, totalElections, totalProposals, totalTenders, totalMembers,
      activeElections, activeProposals, activeTenders,
      totalVotes, recentAudit,
    ] = await Promise.all([
      prisma.organization.count(),
      prisma.election.count(),
      prisma.proposal.count(),
      prisma.tender.count(),
      prisma.user.count(),
      prisma.election.count({ where: { status: "OPEN" } }),
      prisma.proposal.count({ where: { status: "ACTIVE" } }),
      prisma.tender.count({ where: { status: { in: ["PUBLISHED", "BIDDING_OPEN"] } } }),
      prisma.vote.count(),
      prisma.auditEvent.findMany({ orderBy: { createdAt: "desc" }, take: 10 }),
    ]);

    const electionStats = await prisma.election.groupBy({ by: ["status"], _count: true });
    const proposalStats = await prisma.proposal.groupBy({ by: ["status"], _count: true });
    const tenderStats = await prisma.tender.groupBy({ by: ["status"], _count: true });

    res.json({
      overview: { totalOrgs, totalElections, totalProposals, totalTenders, totalMembers, activeElections, activeProposals, activeTenders, totalVotes },
      electionStats, proposalStats, tenderStats,
      recentActivity: recentAudit,
    });
  } catch (err) { next(err); }
});

router.get("/elections/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const election = await prisma.election.findUnique({
      where: { id: req.params.id },
      include: { candidates: { include: { votes: true } }, votes: true },
    });
    if (!election) return res.status(404).json({ error: "Not found" });
    
    const turnout = election.totalEligibleVoters > 0
      ? (election.votes.length / election.totalEligibleVoters * 100).toFixed(1)
      : 0;
    
    res.json({ ...election, turnout });
  } catch (err) { next(err); }
});

export default router;
