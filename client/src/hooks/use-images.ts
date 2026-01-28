import { useMutation } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { z } from "zod";

// Upload Hook
export function useUploadImage() {
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(api.images.upload.path, {
        method: api.images.upload.method,
        body: formData,
        // No Content-Type header needed for FormData, browser sets it
      });

      if (!res.ok) {
        if (res.status === 400) {
          const error = api.images.upload.responses[400].parse(await res.json());
          throw new Error(error.message);
        }
        throw new Error("Failed to upload image");
      }

      return api.images.upload.responses[201].parse(await res.json());
    },
  });
}

// Process Hook
type ProcessParams = z.infer<typeof api.images.process.input>;

export function useProcessImage() {
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: ProcessParams }) => {
      const url = buildUrl(api.images.process.path, { id });
      const validatedData = api.images.process.input.parse(data);

      const res = await fetch(url, {
        method: api.images.process.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validatedData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        if (res.status === 400 || res.status === 404 || res.status === 500) {
           throw new Error(errorData.message || "Processing failed");
        }
        throw new Error("Failed to process image");
      }

      return api.images.process.responses[200].parse(await res.json());
    },
  });
}
