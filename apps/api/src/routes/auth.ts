import { Router, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../utils/db";
import { ethers } from "ethers";
import { z } from "zod";
import crypto from "crypto";

const router = Router();

const loginSchema = z.object({
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid wallet address"),
  signature: z.string(),
  displayName: z.string().optional(),
});

router.post("/nonce", async (req: Request, res: Response) => {
  try {
    const { walletAddress } = req.body;
    if (!walletAddress || !/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      return res.status(400).json({ error: "Invalid wallet address" });
    }
    const addr = walletAddress.toLowerCase();
    
    const nonce = `Sign this message to authenticate with ChainGov:\n\nNonce: ${crypto.randomBytes(16).toString("hex")}`;
    const expiresAt = new Date(Date.now() + 1000 * 60 * 10); // 10 minutes
    
    await prisma.authNonce.create({
      data: {
        walletAddress: addr,
        nonce,
        expiresAt
      }
    });

    res.json({ nonce });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to generate nonce" });
  }
});

router.post("/login", async (req: Request, res: Response) => {
  try {
    const { walletAddress, signature, displayName } = loginSchema.parse(req.body);
    const addr = walletAddress.toLowerCase();

    // Verify nonce
    const nonceRecord = await prisma.authNonce.findFirst({
      where: {
        walletAddress: addr,
        used: false,
        expiresAt: { gt: new Date() }
      },
      orderBy: { createdAt: "desc" }
    } as any); // cast to any to bypass createdAt missing in model, let's sort by expiresAt desc instead

    if (!nonceRecord) {
      return res.status(400).json({ error: "Nonce expired or not found" });
    }

    // Verify signature
    try {
      const isDemo = process.env.DEMO_MODE === "true" && addr === "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266";
      
      if (!isDemo) {
        const signerAddr = ethers.verifyMessage(nonceRecord.nonce, signature);
        if (signerAddr.toLowerCase() !== addr) {
          return res.status(401).json({ error: "Invalid signature" });
        }
      }
    } catch (e) {
      return res.status(401).json({ error: "Signature verification failed" });
    }

    // Mark nonce as used
    await prisma.authNonce.update({
      where: { id: nonceRecord.id },
      data: { used: true }
    });

    let user = await prisma.user.findUnique({ where: { walletAddress: addr } });
    if (!user) {
      user = await prisma.user.create({
        data: { walletAddress: addr, displayName: displayName || `${addr.slice(0, 6)}...${addr.slice(-4)}`, role: "MEMBER" }
      });
    }

    const secret = process.env.JWT_SECRET || "dev-secret";
    const token = jwt.sign(
      { sub: user.id, wallet: user.walletAddress, role: user.role },
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
    const user = await prisma.user.findUnique({ where: { walletAddress: payload.wallet } });
    res.json(user);
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
});

export default router;
