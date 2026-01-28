import { db } from "./db";
import {
  processedImages,
  type InsertProcessedImage,
  type ProcessedImage
} from "@shared/schema";
import { eq } from "drizzle-orm";

export interface IStorage {
  createProcessedImage(image: InsertProcessedImage): Promise<ProcessedImage>;
  getProcessedImage(id: number): Promise<ProcessedImage | undefined>;
  updateProcessedImage(id: number, updates: Partial<ProcessedImage>): Promise<ProcessedImage>;
}

export class DatabaseStorage implements IStorage {
  async createProcessedImage(image: InsertProcessedImage): Promise<ProcessedImage> {
    const [newImage] = await db.insert(processedImages).values(image).returning();
    return newImage;
  }

  async getProcessedImage(id: number): Promise<ProcessedImage | undefined> {
    const [image] = await db.select().from(processedImages).where(eq(processedImages.id, id));
    return image;
  }

  async updateProcessedImage(id: number, updates: Partial<ProcessedImage>): Promise<ProcessedImage> {
    const [updated] = await db
      .update(processedImages)
      .set(updates)
      .where(eq(processedImages.id, id))
      .returning();
    return updated;
  }
}

export const storage = new DatabaseStorage();
