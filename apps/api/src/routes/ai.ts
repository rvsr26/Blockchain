import { Router, Request, Response, NextFunction } from "express";
import { analyzeProposal, analyzeTender, chatWithAI } from "../services/aiService";
import { prisma } from "../utils/db";
import { z } from "zod";

const router = Router();

router.post("/analyze-proposal", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { proposalId, title, description, budget, objectives } = req.body;
    const analysis = await analyzeProposal(title, description, budget, objectives);
    
    if (proposalId) {
      await prisma.aiAnalysis.create({
        data: {
          refId: proposalId,
          refType: "proposal",
          summary: analysis.summary,
          analysisJson: JSON.stringify(analysis),
          confidence: analysis.confidence,
          provider: process.env.OPENAI_API_KEY ? "openai" : "demo",
        },
      });
      // Emit
      const { io } = require("../index");
      io.emit("ai.analysis.completed", { refId: proposalId, refType: "proposal" });
    }
    
    res.json(analysis);
  } catch (err) { next(err); }
});

router.post("/analyze-tender", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tenderId, title, description, estimatedBudget, requirements } = req.body;
    const analysis = await analyzeTender(title, description, estimatedBudget, requirements);
    
    if (tenderId) {
      await prisma.aiAnalysis.create({
        data: {
          refId: tenderId,
          refType: "tender",
          summary: analysis.summary,
          analysisJson: JSON.stringify(analysis),
          confidence: analysis.confidence,
          provider: process.env.OPENAI_API_KEY ? "openai" : "demo",
        },
      });
      // Emit
      const { io } = require("../index");
      io.emit("ai.analysis.completed", { refId: tenderId, refType: "tender" });
    }
    
    res.json(analysis);
  } catch (err) { next(err); }
});

router.post("/chat", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { message, context } = req.body;
    if (!message) return res.status(400).json({ error: "Message is required" });
    const result = await chatWithAI(message, context || "No additional context provided.");
    res.json(result);
  } catch (err) { next(err); }
});

export default router;
