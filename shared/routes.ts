import { z } from 'zod';

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
    process: {
      method: 'POST' as const,
      path: '/api/process',
      // Input is FormData containing the file and processing params as JSON string
      responses: {
        200: z.object({
          url: z.string(),
          filename: z.string(),
          size: z.number(),
          mimeType: z.string(),
        }),
        400: errorSchemas.validation,
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
