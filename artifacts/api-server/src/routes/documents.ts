import { Router } from "express";
import { db, documents } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { randomBytes } from "crypto";
import path from "path";
import fs from "fs/promises";

const router = Router();

// Ensure uploads directory exists
const UPLOAD_DIR = process.env.UPLOAD_DIR || "./uploads";

async function ensureUploadDir() {
  try {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
  } catch (error) {
    console.error("Failed to create upload directory:", error);
  }
}

ensureUploadDir();

// GET /api/documents
router.get("/", async (req, res) => {
  try {
    const { category } = req.query;
    
    let whereClause = eq(documents.userId, req.session.userId!);
    
    if (category) {
      whereClause = and(whereClause, eq(documents.category, category as string))!;
    }
    
    const allDocs = await db.query.documents.findMany({
      where: whereClause,
      orderBy: desc(documents.createdAt),
    });

    res.json({ documents: allDocs });
  } catch (error) {
    console.error("Get documents error:", error);
    res.status(500).json({ error: "Failed to get documents" });
  }
});

// POST /api/documents/upload
router.post("/upload", async (req, res) => {
  try {
    // For MVP, we'll handle file upload via base64
    // In production, use multer or similar
    const { filename, content, mimeType, category = "other", relatedQuoteId } = req.body;
    
    if (!filename || !content) {
      return res.status(400).json({ error: "Filename and content required" });
    }
    
    // Decode base64 content
    const buffer = Buffer.from(content, "base64");
    const size = buffer.length;
    
    // Generate unique filename
    const ext = path.extname(filename);
    const uniqueName = `${Date.now()}-${randomBytes(8).toString("hex")}${ext}`;
    const storagePath = path.join(UPLOAD_DIR, uniqueName);
    
    // Save file
    await fs.writeFile(storagePath, buffer);
    
    // Generate share token (optional)
    const shareToken = randomBytes(32).toString("hex");
    const shareExpiresAt = new Date();
    shareExpiresAt.setDate(shareExpiresAt.getDate() + 7); // 7 days
    
    // Save to database
    const [doc] = await db.insert(documents).values({
      userId: req.session.userId!,
      filename: uniqueName,
      originalName: filename,
      mimeType: mimeType || "application/octet-stream",
      size,
      storagePath,
      category,
      relatedQuoteId: relatedQuoteId || null,
      shareToken,
      shareExpiresAt,
    }).returning();
    
    res.status(201).json({
      document: {
        ...doc,
        downloadUrl: `/api/documents/${doc.id}/download`,
      },
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: "Failed to upload document" });
  }
});

// GET /api/documents/:id/download
router.get("/:id/download", async (req, res) => {
  try {
    const doc = await db.query.documents.findFirst({
      where: and(
        eq(documents.id, req.params.id),
        eq(documents.userId, req.session.userId!)
      ),
    });

    if (!doc) {
      return res.status(404).json({ error: "Document not found" });
    }

    // Read file
    const fileBuffer = await fs.readFile(doc.storagePath);
    
    // Set headers
    res.setHeader("Content-Type", doc.mimeType);
    res.setHeader("Content-Disposition", `attachment; filename="${doc.originalName}"`);
    res.setHeader("Content-Length", doc.size);
    
    res.send(fileBuffer);
  } catch (error) {
    console.error("Download error:", error);
    res.status(500).json({ error: "Failed to download document" });
  }
});

// GET /api/documents/:id/share (get shareable link)
router.get("/:id/share", async (req, res) => {
  try {
    const doc = await db.query.documents.findFirst({
      where: and(
        eq(documents.id, req.params.id),
        eq(documents.userId, req.session.userId!)
      ),
    });

    if (!doc) {
      return res.status(404).json({ error: "Document not found" });
    }

    // Generate new token if expired
    let shareToken = doc.shareToken;
    let shareExpiresAt = doc.shareExpiresAt;
    
    if (!shareToken || !shareExpiresAt || new Date(shareExpiresAt) < new Date()) {
      shareToken = randomBytes(32).toString("hex");
      shareExpiresAt = new Date();
      shareExpiresAt.setDate(shareExpiresAt.getDate() + 7);
      
      await db.update(documents)
        .set({ shareToken, shareExpiresAt })
        .where(eq(documents.id, doc.id));
    }

    res.json({
      shareUrl: `/api/documents/share/${shareToken}`,
      expiresAt: shareExpiresAt,
    });
  } catch (error) {
    console.error("Share error:", error);
    res.status(500).json({ error: "Failed to generate share link" });
  }
});

// GET /api/documents/share/:token (public download via token)
router.get("/share/:token", async (req, res) => {
  try {
    const doc = await db.query.documents.findFirst({
      where: eq(documents.shareToken, req.params.token),
    });

    if (!doc) {
      return res.status(404).json({ error: "Document not found" });
    }

    if (!doc.shareExpiresAt || new Date(doc.shareExpiresAt) < new Date()) {
      return res.status(410).json({ error: "Share link expired" });
    }

    // Read file
    const fileBuffer = await fs.readFile(doc.storagePath);
    
    res.setHeader("Content-Type", doc.mimeType);
    res.setHeader("Content-Disposition", `attachment; filename="${doc.originalName}"`);
    res.setHeader("Content-Length", doc.size);
    
    res.send(fileBuffer);
  } catch (error) {
    console.error("Share download error:", error);
    res.status(500).json({ error: "Failed to download document" });
  }
});

// DELETE /api/documents/:id
router.delete("/:id", async (req, res) => {
  try {
    const doc = await db.query.documents.findFirst({
      where: and(
        eq(documents.id, req.params.id),
        eq(documents.userId, req.session.userId!)
      ),
    });

    if (!doc) {
      return res.status(404).json({ error: "Document not found" });
    }

    // Delete file
    try {
      await fs.unlink(doc.storagePath);
    } catch (error) {
      console.warn("Failed to delete file:", error);
    }

    // Delete from database
    await db.delete(documents).where(eq(documents.id, doc.id));

    res.json({ message: "Document deleted" });
  } catch (error) {
    console.error("Delete document error:", error);
    res.status(500).json({ error: "Failed to delete document" });
  }
});

export default router;
