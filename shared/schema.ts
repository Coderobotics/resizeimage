import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const processedImages = pgTable("processed_images", {
  id: serial("id").primaryKey(),
  originalName: text("original_name").notNull(),
  mimeType: text("mime_type").notNull(),
  size: integer("size").notNull(),
  processedPath: text("processed_path"),
  operation: text("operation").notNull(), // 'resize', 'compress', 'upscale'
  params: text("params"), // JSON string of params used
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertProcessedImageSchema = createInsertSchema(processedImages).omit({ 
  id: true, 
  createdAt: true,
  processedPath: true 
});

export type ProcessedImage = typeof processedImages.$inferSelect;
export type InsertProcessedImage = z.infer<typeof insertProcessedImageSchema>;

// Explicit API types
export type OperationType = 'resize' | 'compress' | 'upscale';

export interface ResizeParams {
  width?: number;
  height?: number;
  maintainAspectRatio: boolean;
  format: 'jpeg' | 'png' | 'webp';
}

export interface CompressParams {
  quality: number;
  format: 'jpeg' | 'png' | 'webp';
}

export interface UpscaleParams {
  scale: number; // 2, 4
  format: 'jpeg' | 'png' | 'webp';
}

export interface ProcessImageResponse {
  id: number;
  url: string;
  filename: string;
  size: number;
  mimeType: string;
}
