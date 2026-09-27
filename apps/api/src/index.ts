import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import { logger } from "./utils/logger";
import { errorHandler } from "./middleware/errorHandler";
import organizationRoutes from "./routes/organizations";
import memberRoutes from "./routes/members";
import electionRoutes from "./routes/elections";
import proposalRoutes from "./routes/proposals";
import tenderRoutes from "./routes/tenders";
import documentRoutes from "./routes/documents";
import aiRoutes from "./routes/ai";
import auditRoutes from "./routes/audit";
import analyticsRoutes from "./routes/analytics";
import authRoutes from "./routes/auth";
import reputationRoutes from "./routes/reputation";

dotenv.config({ path: "../../.env" });

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: process.env.CORS_ORIGIN || "http://localhost:5173",
  credentials: true,
}));
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: "Too many requests from this IP",
}));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/organizations", organizationRoutes);
app.use("/api/members", memberRoutes);
app.use("/api/elections", electionRoutes);
app.use("/api/proposals", proposalRoutes);
app.use("/api/tenders", tenderRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/audit", auditRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/reputation", reputationRoutes);

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString(), mode: process.env.DEMO_MODE === "true" ? "demo" : "production" });
});

app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`Governance Platform API running on port ${PORT}`);
  logger.info(`Demo mode: ${process.env.DEMO_MODE === "true"}`);
});

export default app;
