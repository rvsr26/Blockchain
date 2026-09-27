import { Router, Request, Response, NextFunction } from "express";
import { prisma } from "../utils/db";

const router = Router();

router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { organizationId } = req.query;
    const members = await prisma.organizationMember.findMany({
      where: organizationId ? { organizationId: organizationId as string } : {},
      include: { user: true, organization: { select: { name: true } } },
      orderBy: { joinedAt: "desc" },
    });
    res.json(members);
  } catch (err) { next(err); }
});

router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { walletAddress, organizationId, role, displayName } = req.body;
    const addr = walletAddress.toLowerCase();
    let user = await prisma.user.findUnique({ where: { walletAddress: addr } });
    if (!user) user = await prisma.user.create({ data: { walletAddress: addr, displayName, role: role || "MEMBER" } });
    const member = await prisma.organizationMember.upsert({
      where: { userId_organizationId: { userId: user.id, organizationId } },
      update: { role, status: "ACTIVE" },
      create: { userId: user.id, organizationId, role: role || "MEMBER" },
      include: { user: true },
    });
    res.status(201).json(member);
  } catch (err) { next(err); }
});

router.patch("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const member = await prisma.organizationMember.update({ where: { id: req.params.id }, data: req.body });
    res.json(member);
  } catch (err) { next(err); }
});

router.delete("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.organizationMember.update({ where: { id: req.params.id }, data: { status: "INACTIVE" } });
    res.json({ message: "Member deactivated" });
  } catch (err) { next(err); }
});

export default router;
