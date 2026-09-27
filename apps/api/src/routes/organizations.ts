import { Router, Request, Response, NextFunction } from "express";
import { prisma } from "../utils/db";
import { z } from "zod";
import { AppError } from "../middleware/errorHandler";

const router = Router();

const createOrgSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  adminWallet: z.string(),
  rules: z.string().optional(),
});

router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgs = await prisma.organization.findMany({
      include: { _count: { select: { members: true, elections: true, proposals: true, tenders: true } } },
      orderBy: { createdAt: "desc" },
    });
    res.json(orgs);
  } catch (err) { next(err); }
});

router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = createOrgSchema.parse(req.body);
    const org = await prisma.organization.create({ data });
    
    // Auto-create admin user/member if not exists
    let user = await prisma.user.findUnique({ where: { walletAddress: data.adminWallet.toLowerCase() } });
    if (!user) user = await prisma.user.create({ data: { walletAddress: data.adminWallet.toLowerCase(), role: "ADMIN" } });
    await prisma.organizationMember.create({ data: { userId: user.id, organizationId: org.id, role: "ADMIN" } }).catch(() => {});
    
    res.status(201).json(org);
  } catch (err) { next(err); }
});

router.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const org = await prisma.organization.findUnique({
      where: { id: req.params.id },
      include: {
        members: { include: { user: true } },
        elections: true,
        proposals: true,
        tenders: true,
      },
    });
    if (!org) return next(new AppError(404, "Organization not found"));
    res.json(org);
  } catch (err) { next(err); }
});

router.patch("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const org = await prisma.organization.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json(org);
  } catch (err) { next(err); }
});

export default router;
