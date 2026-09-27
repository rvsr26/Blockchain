import { prisma } from "../utils/db";
import { logger } from "../utils/logger";

interface AuditLogParams {
  module: string;
  action: string;
  actorWallet?: string;
  userId?: string;
  refId?: string;
  refType?: string;
  txHash?: string;
  blockNumber?: number;
  status?: string;
  details?: string;
}

export async function auditLog(params: AuditLogParams) {
  try {
    await prisma.auditEvent.create({ data: { ...params, status: params.status || "SUCCESS" } });
  } catch (err) {
    logger.error("Failed to write audit log", err);
  }
}
