import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";
import sharp from "sharp";
import express from "express";

// Ensure uploads directory exists
const UPLOADS_DIR = path.join(process.cwd(), "uploads");
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR);
}

const upload = multer({ dest: UPLOADS_DIR });

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Serve processed files statically if needed, or use the download endpoint
  // app.use('/uploads', express.static(UPLOADS_DIR));

  app.post(api.images.upload.path, upload.single('image'), async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    try {
      const image = await storage.createProcessedImage({
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        operation: 'pending',
        // Store the temp path for now, we'll process it later
        // In a real app we might move it to a permanent location
        // For now, req.file.path is the temp path in uploads/
      });
      
      // Store the mapping of DB ID to file path in memory or update DB
      // We need to persist the temp filename to the DB to retrieve it later
      await storage.updateProcessedImage(image.id, {
        processedPath: req.file.path 
      });

      res.status(201).json({
        id: image.id,
        filename: req.file.filename,
        originalName: req.file.originalname,
      });
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ message: "Upload failed" });
    }
  });

  app.post(api.images.process.path, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const input = api.images.process.input.parse(req.body);
      const image = await storage.getProcessedImage(id);

      if (!image || !image.processedPath) {
        return res.status(404).json({ message: "Image not found" });
      }

      const inputPath = image.processedPath;
      const originalExt = path.extname(image.originalName);
      const outputFilename = `processed-${Date.now()}-${id}.${input.params.format}`;
      const outputPath = path.join(UPLOADS_DIR, outputFilename);

      let pipeline = sharp(inputPath);

      if (input.operation === 'resize') {
        const params = input.params as any;
        pipeline = pipeline.resize({
          width: params.width || null,
          height: params.height || null,
          fit: params.maintainAspectRatio ? 'contain' : 'fill',
          background: { r: 255, g: 255, b: 255, alpha: 0 } // transparent/white bg
        });
      } else if (input.operation === 'compress') {
        // Compression is handled by toFormat options below
      } else if (input.operation === 'upscale') {
        const params = input.params as any;
        // Get metadata to know current size
        const metadata = await pipeline.metadata();
        if (metadata.width) {
          pipeline = pipeline.resize({
            width: Math.round(metadata.width * params.scale),
            kernel: sharp.kernel.lanczos3 // High quality upscaling
          });
          // Add some sharpening to simulate "AI" enhancement
          pipeline = pipeline.sharpen();
        }
      }

      // Output format settings
      const format = input.params.format;
      const quality = 'quality' in input.params ? input.params.quality : 90; // Default high quality for resize/upscale

      if (format === 'jpeg') {
        pipeline = pipeline.jpeg({ quality });
      } else if (format === 'png') {
        pipeline = pipeline.png({ quality: quality < 100 ? quality : 100 });
      } else if (format === 'webp') {
        pipeline = pipeline.webp({ quality });
      }

      await pipeline.toFile(outputPath);
      const stats = fs.statSync(outputPath);

      // Update DB with operation details
      await storage.updateProcessedImage(id, {
        operation: input.operation,
        params: JSON.stringify(input.params),
        processedPath: outputPath // Update to the new processed file
      });

      res.json({
        id,
        url: `/api/download/${outputFilename}`,
        filename: outputFilename,
        size: stats.size,
        mimeType: `image/${format}`
      });

    } catch (err) {
      console.error("Processing error:", err);
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
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
