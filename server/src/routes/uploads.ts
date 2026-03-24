import { Router, type Request, type Response, type NextFunction } from "express";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import type { Writable } from "node:stream";
import { prisma } from "../lib/prisma.js";
import { authRequired, type AuthedRequest } from "../middleware/auth.js";

type AuthedMulterRequest = AuthedRequest & { file?: Express.Multer.File };

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 80 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/") || file.mimetype.startsWith("video/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image or video files are allowed"));
    }
  },
});

function cloudinaryConfigured(): boolean {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET,
  );
}

async function assertInstructor(req: AuthedRequest): Promise<boolean> {
  const me = await prisma.user.findUnique({
    where: { id: req.userId! },
    select: { role: true },
  });
  return me?.role === "INSTRUCTOR";
}

router.post("/", authRequired, (req: Request, res: Response, next: NextFunction) => {
  upload.single("file")(req, res, (err: unknown) => {
    if (err) {
      res.status(400).json({ error: err instanceof Error ? err.message : "Invalid upload" });
      return;
    }
    next();
  });
}, async (req: AuthedMulterRequest, res: Response) => {
  if (!(await assertInstructor(req))) {
    res.status(403).json({ error: "Instructor access only" });
    return;
  }
  if (!cloudinaryConfigured()) {
    res.status(503).json({
      error: "Uploads disabled: set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET",
    });
    return;
  }
  const file = req.file;
  if (!file?.buffer) {
    res.status(400).json({ error: "Missing file (field name: file)" });
    return;
  }

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  const folder = process.env.CLOUDINARY_UPLOAD_FOLDER || "skillshare-hub";
  const resource_type = file.mimetype.startsWith("video/") ? "video" : "image";

  try {
    const result = await new Promise<{ secure_url: string; resource_type?: string }>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type,
          use_filename: true,
          unique_filename: true,
        },
        (err, uploaded) => {
          if (err || !uploaded) reject(err ?? new Error("Upload failed"));
          else resolve(uploaded);
        },
      ) as Writable;
      stream.end(file.buffer);
    });
    res.json({ url: result.secure_url, resourceType: result.resource_type ?? resource_type });
  } catch (e) {
    console.error("Cloudinary upload error:", e);
    res.status(500).json({ error: "Upload failed" });
  }
});

export default router;
