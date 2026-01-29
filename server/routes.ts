import type { Express } from "express";
import type { Server } from "http";
import { api } from "@shared/routes";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";
import sharp from "sharp";

// Ensure uploads directory exists
const UPLOADS_DIR = path.join(process.cwd(), "uploads");
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR);
}

const upload = multer({ dest: UPLOADS_DIR });

// Helper to cleanup old files (older than 1 hour)
function cleanupOldFiles() {
  const now = Date.now();
  const ONE_HOUR = 60 * 60 * 1000;
  
  fs.readdir(UPLOADS_DIR, (err, files) => {
    if (err) return;
    files.forEach(file => {
      const filePath = path.join(UPLOADS_DIR, file);
      fs.stat(filePath, (err, stats) => {
        if (err) return;
        if (now - stats.mtimeMs > ONE_HOUR) {
          fs.unlink(filePath, () => {});
        }
      });
    });
  });
}

// Run cleanup every 15 minutes
setInterval(cleanupOldFiles, 15 * 60 * 1000);

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  app.post(api.images.process.path, upload.single('file'), async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    try {
      // Params are sent as a JSON string in the form data
      const paramsRaw = req.body.params;
      if (!paramsRaw) {
        return res.status(400).json({ message: "Missing processing parameters" });
      }

      const input = JSON.parse(paramsRaw);
      const inputPath = req.file.path;
      const outputFilename = `processed-${Date.now()}-${Math.round(Math.random() * 1000)}.${input.params.format}`;
      const outputPath = path.join(UPLOADS_DIR, outputFilename);

      let pipeline = sharp(inputPath);

      if (input.operation === 'resize') {
        const params = input.params;
        pipeline = pipeline.resize({
          width: params.width || null,
          height: params.height || null,
          fit: params.maintainAspectRatio ? 'contain' : 'fill',
          background: { r: 255, g: 255, b: 255, alpha: 0 }
        });
      } else if (input.operation === 'upscale') {
        const params = input.params;
        const metadata = await pipeline.metadata();
        if (metadata.width) {
          pipeline = pipeline.resize({
            width: Math.round(metadata.width * params.scale),
            kernel: sharp.kernel.lanczos3
          });
          pipeline = pipeline.sharpen();
        }
      }

      // Output format settings
      const format = input.params.format;
      const quality = 'quality' in input.params ? input.params.quality : 90;

      if (format === 'jpeg') {
        pipeline = pipeline.jpeg({ quality });
      } else if (format === 'png') {
        pipeline = pipeline.png({ quality: quality < 100 ? quality : 100 });
      } else if (format === 'webp') {
        pipeline = pipeline.webp({ quality });
      }

      await pipeline.toFile(outputPath);
      const stats = fs.statSync(outputPath);

      // Cleanup original upload immediately
      fs.unlink(inputPath, () => {});

      res.json({
        url: `/api/download/${outputFilename}`,
        filename: outputFilename,
        size: stats.size,
        mimeType: `image/${format}`
      });

    } catch (err) {
      console.error("Processing error:", err);
      // Ensure temp file is cleaned up on error
      if (req.file) fs.unlink(req.file.path, () => {});
      res.status(500).json({ message: "Processing failed" });
    }
  });

  app.get(api.images.download.path, async (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(UPLOADS_DIR, filename);

    if (fs.existsSync(filePath)) {
      res.download(filePath);
    } else {
      res.status(404).json({ message: "File not found" });
    }
  });

  return httpServer;
}
