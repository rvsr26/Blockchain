import { Router, Request, Response, NextFunction } from "express";
import { prisma } from "../utils/db";
import { z } from "zod";
import { AppError } from "../middleware/errorHandler";
import { auditLog } from "../services/auditService";

const router = Router();

const createProposalSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  organizationId: z.string(),
  authorWallet: z.string(),
  requestedBudget: z.number().optional(),
  objectives: z.string().optional(),
  timeline: z.string().optional(),
  ipfsCid: z.string().optional(),
  votingDeadline: z.string().optional(),
});

router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, organizationId } = req.query;
    const where: any = {};
    if (status) where.status = status;
    if (organizationId) where.organizationId = organizationId;
    const proposals = await prisma.proposal.findMany({
      where, include: { organization: { select: { name: true } }, _count: { select: { proposalVotes: true } } },
      orderBy: { createdAt: "desc" },
    });
    res.json(proposals);
  } catch (err) { next(err); }
});

router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = createProposalSchema.parse(req.body);
    const proposal = await prisma.proposal.create({
      data: {
        ...data,
        requestedBudget: data.requestedBudget,
        votingDeadline: data.votingDeadline ? new Date(data.votingDeadline) : undefined,
      },
    });
    await auditLog({ module: "PROPOSAL", action: "PROPOSAL_CREATED", actorWallet: data.authorWallet, refId: proposal.id, refType: "proposal" });
    res.status(201).json(proposal);
  } catch (err) { next(err); }
});

router.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const proposal = await prisma.proposal.findUnique({
      where: { id: req.params.id },
      include: { organization: true, proposalVotes: true },
    });
    if (!proposal) return next(new AppError(404, "Proposal not found"));
    const aiAnalyses = await (prisma as any).aiAnalysis.findMany({ where: { refId: req.params.id, refType: "proposal" }, orderBy: { createdAt: "desc" }, take: 1 });
    res.json({ ...proposal, aiAnalyses });
  } catch (err) { next(err); }
});

router.patch("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const proposal = await prisma.proposal.update({ where: { id: req.params.id }, data: req.body });
    res.json(proposal);
  } catch (err) { next(err); }
});

router.post("/:id/vote", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { voterWallet, voteType, txHash } = req.body;
    const existing = await prisma.proposalVote.findUnique({ where: { proposalId_voterWallet: { proposalId: req.params.id, voterWallet } } });
    if (existing) return next(new AppError(409, "You have already voted on this proposal."));
    const vote = await prisma.proposalVote.create({ data: { proposalId: req.params.id, voterWallet, voteType, txHash } });
    if (voteType === "YES") await prisma.proposal.update({ where: { id: req.params.id }, data: { yesVotes: { increment: 1 } } });
    else if (voteType === "NO") await prisma.proposal.update({ where: { id: req.params.id }, data: { noVotes: { increment: 1 } } });
    await auditLog({ module: "PROPOSAL", action: "PROPOSAL_VOTE_CAST", actorWallet: voterWallet, refId: req.params.id, refType: "proposal", txHash });
    res.status(201).json(vote);
  } catch (err) { next(err); }
});

export default router;
