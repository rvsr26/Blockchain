import { Router, Request, Response, NextFunction } from "express";
import { prisma } from "../utils/db";
import multer from "multer";
import path from "path";
import { v4 as uuidv4 } from "uuid";

const router = Router();
const upload = multer({ dest: "../../data/documents/", limits: { fileSize: 10 * 1024 * 1024 } });

router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const docs = await prisma.document.findMany({ orderBy: { createdAt: "desc" } });
    res.json(docs);
  } catch (err) { next(err); }
});

router.post("/", upload.single("file"), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { uploadedBy, documentType, refId, refType } = req.body;
    const file = req.file;
    const doc = await prisma.document.create({
      data: {
        fileName: file?.originalname || req.body.fileName || "document",
        fileType: file?.mimetype || req.body.fileType || "application/octet-stream",
        localPath: file?.path,
        ipfsCid: req.body.ipfsCid || `demo-cid-${uuidv4().slice(0, 8)}`,
        uploadedBy,
        documentType,
        refId,
        refType,
      },
    });
    
    // Import and emit
    const { io } = require("../index");
    io.emit("document.uploaded", { docId: doc.id, fileName: doc.fileName });
    
    res.status(201).json(doc);
  } catch (err) { next(err); }
});

export default router;
