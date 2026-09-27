import { Router, Request, Response, NextFunction } from "express";
import { prisma } from "../utils/db";
import { z } from "zod";
import { AppError } from "../middleware/errorHandler";
import { auditLog } from "../services/auditService";

const router = Router();

const createElectionSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  organizationId: z.string(),
  electionType: z.string().default("CR"),
  startTime: z.string(),
  endTime: z.string(),
  quorumPercent: z.number().min(0).max(100).default(50),
  totalEligibleVoters: z.number().default(0),
  metadataCid: z.string().optional(),
  creatorWallet: z.string(),
  candidates: z.array(z.object({ name: z.string(), description: z.string().optional(), ipfsCid: z.string().optional() })).optional(),
});

router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, organizationId } = req.query;
    const where: any = {};
    if (status) where.status = status;
    if (organizationId) where.organizationId = organizationId;
    
    const elections = await prisma.election.findMany({
      where,
      include: {
        candidates: true,
        organization: { select: { name: true } },
        _count: { select: { votes: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(elections);
  } catch (err) { next(err); }
});

router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = createElectionSchema.parse(req.body);
    const election = await prisma.election.create({
      data: {
        title: data.title,
        description: data.description,
        organizationId: data.organizationId,
        electionType: data.electionType,
        startTime: new Date(data.startTime),
        endTime: new Date(data.endTime),
        quorumPercent: data.quorumPercent,
        totalEligibleVoters: data.totalEligibleVoters,
        metadataCid: data.metadataCid,
        creatorWallet: data.creatorWallet,
        status: "DRAFT",
        candidates: data.candidates
          ? { create: data.candidates.map((c) => ({ name: c.name, description: c.description, ipfsCid: c.ipfsCid })) }
          : undefined,
      },
      include: { candidates: true },
    });
    
    await auditLog({ module: "ELECTION", action: "ELECTION_CREATED", actorWallet: data.creatorWallet, refId: election.id, refType: "election" });
    res.status(201).json(election);
  } catch (err) { next(err); }
});

router.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const election = await prisma.election.findUnique({
      where: { id: req.params.id },
      include: {
        candidates: true,
        organization: true,
        votes: { select: { voterWallet: true, candidateId: true, castAt: true, txHash: true } },
      },
    });
    if (!election) return next(new AppError(404, "Election not found"));
    res.json(election);
  } catch (err) { next(err); }
});

router.patch("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const election = await prisma.election.update({ where: { id: req.params.id }, data: req.body });
    res.json(election);
  } catch (err) { next(err); }
});

router.post("/:id/vote", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { voterWallet, candidateId, txHash, blockNumber } = req.body;
    
    // Prevent duplicate vote at DB layer
    const existing = await prisma.vote.findUnique({ where: { electionId_voterWallet: { electionId: req.params.id, voterWallet } } });
    if (existing) return next(new AppError(409, "You have already voted in this election."));
    
    const vote = await prisma.vote.create({
      data: { electionId: req.params.id, candidateId, voterWallet, txHash, blockNumber }
    });
    
    await prisma.candidate.update({ where: { id: candidateId }, data: { voteCount: { increment: 1 } } });
    await prisma.election.update({ where: { id: req.params.id }, data: { totalEligibleVoters: { increment: 0 } } });
    
    await auditLog({ module: "ELECTION", action: "VOTE_CAST", actorWallet: voterWallet, refId: req.params.id, refType: "election", txHash });
    res.status(201).json(vote);
  } catch (err) { next(err); }
});

router.get("/:id/has-voted", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { wallet } = req.query;
    const vote = await prisma.vote.findUnique({
      where: { electionId_voterWallet: { electionId: req.params.id, voterWallet: wallet as string } }
    });
    res.json({ hasVoted: !!vote, vote });
  } catch (err) { next(err); }
});

router.post("/:id/candidates", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, description, ipfsCid, creatorWallet } = req.body;
    const candidate = await prisma.candidate.create({
      data: { electionId: req.params.id, name, description, ipfsCid }
    });
    await auditLog({ module: "ELECTION", action: "CANDIDATE_ADDED", actorWallet: creatorWallet, refId: req.params.id, refType: "election" });
    res.status(201).json(candidate);
  } catch (err) { next(err); }
});

export default router;
