import { z } from 'zod';
import { insertProcessedImageSchema, processedImages } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  images: {
    upload: {
      method: 'POST' as const,
      path: '/api/upload',
      // Input is FormData, handled separately
      responses: {
        201: z.object({
          id: z.number(),
          filename: z.string(),
          originalName: z.string(),
        }),
        400: errorSchemas.validation,
      },
    },
    process: {
      method: 'POST' as const,
      path: '/api/process/:id',
      input: z.object({
        operation: z.enum(['resize', 'compress', 'upscale']),
        params: z.union([
          z.object({
            width: z.number().optional(),
            height: z.number().optional(),
            maintainAspectRatio: z.boolean(),
            format: z.enum(['jpeg', 'png', 'webp']),
          }), // Resize
          z.object({
            quality: z.number().min(1).max(100),
            format: z.enum(['jpeg', 'png', 'webp']),
          }), // Compress
          z.object({
            scale: z.number(),
            format: z.enum(['jpeg', 'png', 'webp']),
          }), // Upscale
        ]),
      }),
      responses: {
        200: z.object({
          id: z.number(),
          url: z.string(),
          filename: z.string(),
          size: z.number(),
          mimeType: z.string(),
        }),
        404: errorSchemas.notFound,
        500: errorSchemas.internal,
      },
    },
    download: {
      method: 'GET' as const,
      path: '/api/download/:filename',
      responses: {
        200: z.any(), // File stream
        404: errorSchemas.notFound,
      },
    }
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
