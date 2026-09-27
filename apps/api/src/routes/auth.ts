import { Router, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../utils/db";
import { ethers } from "ethers";
import { z } from "zod";

const router = Router();

const loginSchema = z.object({
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid wallet address"),
  signature: z.string().optional(),
  message: z.string().optional(),
  displayName: z.string().optional(),
});

router.post("/login", async (req: Request, res: Response) => {
  try {
    const { walletAddress, signature, message, displayName } = loginSchema.parse(req.body);
    const addr = walletAddress.toLowerCase();

    let user = await prisma.user.findUnique({ where: { walletAddress: addr } });
    if (!user) {
      user = await prisma.user.create({
        data: { walletAddress: addr, displayName: displayName || `${addr.slice(0, 6)}...${addr.slice(-4)}`, role: "MEMBER" }
      });
    }

    const secret = process.env.JWT_SECRET || "dev-secret";
    const token = jwt.sign(
      { walletAddress: user.walletAddress, role: user.role, userId: user.id },
      secret,
      { expiresIn: (process.env.JWT_EXPIRES_IN || "7d") as any }
    );

    res.json({ token, user: { id: user.id, walletAddress: user.walletAddress, displayName: user.displayName, role: user.role } });
  } catch (err: any) {
    res.status(400).json({ error: err.message || "Login failed" });
  }
});

router.get("/me", async (req: Request, res: Response) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "No token" });
  try {
    const secret = process.env.JWT_SECRET || "dev-secret";
    const payload = jwt.verify(token, secret) as any;
    const user = await prisma.user.findUnique({ where: { walletAddress: payload.walletAddress } });
    res.json(user);
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
});

export default router;
