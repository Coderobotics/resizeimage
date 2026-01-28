import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { UploadCloud, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface DropzoneProps {
  onFileSelect: (file: File) => void;
  isUploading: boolean;
  className?: string;
}

export function Dropzone({ onFileSelect, isUploading, className }: DropzoneProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        onFileSelect(acceptedFiles[0]);
      }
    },
    [onFileSelect]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".webp"],
    },
    maxFiles: 1,
    disabled: isUploading,
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        "relative group cursor-pointer overflow-hidden rounded-3xl border-2 border-dashed border-border bg-card/50 p-12 text-center transition-all duration-300 hover:border-primary/50 hover:bg-primary/5",
        isDragActive && "border-primary bg-primary/10 scale-[1.02]",
        isUploading && "pointer-events-none opacity-60",
        className
      )}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center justify-center space-y-4">
        <div className="relative">
          <div className="absolute inset-0 animate-pulse rounded-full bg-primary/20 blur-xl" />
          <div className="relative rounded-2xl bg-gradient-to-br from-primary to-accent p-4 shadow-lg">
            <UploadCloud className="h-8 w-8 text-white" />
          </div>
        </div>
        <div className="space-y-2">
          <h3 className="font-display text-xl font-semibold tracking-tight text-foreground">
            {isDragActive ? "Drop it like it's hot!" : "Upload your image"}
          </h3>
          <p className="text-sm text-muted-foreground">
            Drag and drop or click to select
          </p>
        </div>
        <div className="flex gap-2 text-xs font-medium text-muted-foreground/70">
          <span className="rounded-full bg-muted px-2.5 py-1">JPG</span>
          <span className="rounded-full bg-muted px-2.5 py-1">PNG</span>
          <span className="rounded-full bg-muted px-2.5 py-1">WEBP</span>
        </div>
      </div>
    </div>
  );
}
