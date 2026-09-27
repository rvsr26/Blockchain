import { Router, Request, Response, NextFunction } from "express";
import { prisma } from "../utils/db";
import { z } from "zod";
import { AppError } from "../middleware/errorHandler";
import { auditLog } from "../services/auditService";

const router = Router();

router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, organizationId } = req.query;
    const where: any = {};
    if (status) where.status = status;
    if (organizationId) where.organizationId = organizationId;
    const tenders = await prisma.tender.findMany({
      where, include: { organization: { select: { name: true } }, _count: { select: { bidCommitments: true } } },
      orderBy: { createdAt: "desc" },
    });
    res.json(tenders);
  } catch (err) { next(err); }
});

router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = req.body;
    const tender = await prisma.tender.create({
      data: {
        title: data.title,
        description: data.description,
        organizationId: data.organizationId,
        estimatedBudget: data.estimatedBudget,
        requirements: data.requirements,
        eligibilityCriteria: data.eligibilityCriteria,
        ipfsCid: data.ipfsCid,
        biddingDeadline: data.biddingDeadline ? new Date(data.biddingDeadline) : undefined,
        revealDeadline: data.revealDeadline ? new Date(data.revealDeadline) : undefined,
        creatorWallet: data.creatorWallet,
        status: "DRAFT",
      },
    });
    await auditLog({ module: "TENDER", action: "TENDER_CREATED", actorWallet: data.creatorWallet, refId: tender.id, refType: "tender" });
    res.status(201).json(tender);
  } catch (err) { next(err); }
});

router.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tender = await prisma.tender.findUnique({
      where: { id: req.params.id },
      include: { organization: true, bidCommitments: true },
    });
    if (!tender) return next(new AppError(404, "Tender not found"));
    const aiAnalyses = await (prisma as any).aiAnalysis.findMany({ where: { refId: req.params.id, refType: "tender" }, orderBy: { createdAt: "desc" }, take: 1 });
    res.json({ ...tender, aiAnalyses });
  } catch (err) { next(err); }
});

router.patch("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tender = await prisma.tender.update({ where: { id: req.params.id }, data: req.body });
    res.json(tender);
  } catch (err) { next(err); }
});

router.post("/:id/commit", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { bidderWallet, commitmentHash, txHash } = req.body;
    const existing = await prisma.bidCommitment.findUnique({ where: { tenderId_bidderWallet: { tenderId: req.params.id, bidderWallet } } });
    if (existing) return next(new AppError(409, "You have already submitted a commitment for this tender."));
    const commitment = await prisma.bidCommitment.create({ data: { tenderId: req.params.id, bidderWallet, commitmentHash, txHashCommit: txHash } });
    await auditLog({ module: "TENDER", action: "BID_COMMITTED", actorWallet: bidderWallet, refId: req.params.id, refType: "tender", txHash });
    res.status(201).json(commitment);
  } catch (err) { next(err); }
});

router.post("/:id/reveal", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { bidderWallet, revealedAmount, valid, txHash } = req.body;
    const commitment = await prisma.bidCommitment.update({
      where: { tenderId_bidderWallet: { tenderId: req.params.id, bidderWallet } },
      data: { revealed: true, revealedAmount, valid, txHashReveal: txHash, revealedAt: new Date() },
    });
    await auditLog({ module: "TENDER", action: "BID_REVEALED", actorWallet: bidderWallet, refId: req.params.id, refType: "tender", txHash });
    res.json(commitment);
  } catch (err) { next(err); }
});

router.post("/:id/award", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { awardedBidder, awardedAmount, awardNotes, awardedBy, txHash } = req.body;
    const tender = await prisma.tender.update({
      where: { id: req.params.id },
      data: { status: "AWARDED", awardedBidder, awardedAmount, awardNotes, awardedBy },
    });
    await auditLog({ module: "TENDER", action: "AWARD_RECORDED", actorWallet: awardedBy, refId: req.params.id, refType: "tender", txHash });
    res.json(tender);
  } catch (err) { next(err); }
});

export default router;
