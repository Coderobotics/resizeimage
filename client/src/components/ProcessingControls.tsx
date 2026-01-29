import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Loader2, Download, RefreshCw, Wand2, Minimize2, Maximize2 } from "lucide-react";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface ProcessingControlsProps {
  mode: "resize" | "compress" | "upscale";
  isProcessing: boolean;
  onProcess: (params: any) => void;
  originalSize: number;
  originalDimensions?: { width: number; height: number; mimeType?: string; size?: number };
}

export function ProcessingControls({
  mode,
  isProcessing,
  onProcess,
  originalSize,
  originalDimensions,
}: ProcessingControlsProps) {
  // Common state
  const [format, setFormat] = useState<"jpeg" | "png" | "webp">("jpeg");

  // Update format when original mimeType is available
  useEffect(() => {
    if (originalDimensions?.mimeType) {
      const type = originalDimensions.mimeType.split("/")[1];
      if (type === "jpeg" || type === "jpg") setFormat("jpeg");
      else if (type === "png") setFormat("png");
      else if (type === "webp") setFormat("webp");
    }
  }, [originalDimensions]);

  // Resize state
  const [width, setWidth] = useState<number>(originalDimensions?.width || 1920);
  const [height, setHeight] = useState<number>(originalDimensions?.height || 1080);
  const [maintainRatio, setMaintainRatio] = useState(true);

  // Update dimensions when originalDimensions changes
  useEffect(() => {
    if (originalDimensions) {
      setWidth(originalDimensions.width);
      setHeight(originalDimensions.height);
    }
  }, [originalDimensions]);

  const handleWidthChange = (newWidth: number) => {
    setWidth(newWidth);
    if (maintainRatio && originalDimensions) {
      const ratio = originalDimensions.height / originalDimensions.width;
      setHeight(Math.round(newWidth * ratio));
    }
  };

  const handleHeightChange = (newHeight: number) => {
    setHeight(newHeight);
    if (maintainRatio && originalDimensions) {
      const ratio = originalDimensions.width / originalDimensions.height;
      setWidth(Math.round(newHeight * ratio));
    }
  };

  const setOriginalSize = () => {
    if (originalDimensions) {
      setWidth(originalDimensions.width);
      setHeight(originalDimensions.height);
    }
  };

  // Compress state
  const [quality, setQuality] = useState([80]);

  // Upscale state
  const [scale, setScale] = useState<number>(2);

  const handleSubmit = () => {
    let params: any = { format };

    if (mode === "resize") {
      params = { ...params, width, height, maintainAspectRatio: maintainRatio };
    } else if (mode === "compress") {
      params = { ...params, quality: quality[0] };
    } else if (mode === "upscale") {
      params = { ...params, scale };
    }

    onProcess(params);
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 rounded-2xl border border-border bg-card p-6 shadow-sm"
    >
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="font-display text-lg font-semibold">
            {mode === "resize" && "Resize Settings"}
            {mode === "compress" && "Compression Level"}
            {mode === "upscale" && "Upscale Factor"}
          </h3>
          {originalDimensions?.size && (
            <p className="text-xs text-muted-foreground">
              Current file size: <span className="font-medium text-foreground">{formatFileSize(originalDimensions.size)}</span>
            </p>
          )}
        </div>
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Configuration
        </span>
      </div>

      <div className="space-y-6">
        {mode === "resize" && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="width-input">Width (px)</Label>
              <Input
                id="width-input"
                type="number"
                value={width}
                onChange={(e) => handleWidthChange(Number(e.target.value))}
                className="font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="height-input">Height (px)</Label>
              <Input
                id="height-input"
                type="number"
                value={height}
                onChange={(e) => handleHeightChange(Number(e.target.value))}
                className="font-mono"
              />
            </div>
            <div className="col-span-2 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="aspect-ratio"
                  checked={maintainRatio}
                  onCheckedChange={(c) => setMaintainRatio(!!c)}
                />
                <Label htmlFor="aspect-ratio" className="font-normal cursor-pointer">
                  Lock aspect ratio
                </Label>
              </div>
              {originalDimensions && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={setOriginalSize}
                  className="h-auto p-0 text-xs text-primary hover:bg-transparent"
                >
                  Reset to {originalDimensions.width}x{originalDimensions.height}
                </Button>
              )}
            </div>
          </div>
        )}

        {mode === "compress" && (
          <div className="space-y-4">
            <div className="flex justify-between">
              <Label>Quality</Label>
              <span className="font-mono text-sm text-muted-foreground">
                {quality[0]}%
              </span>
            </div>
            <Slider
              value={quality}
              onValueChange={setQuality}
              min={1}
              max={100}
              step={1}
              className="py-4"
            />
            <p className="text-xs text-muted-foreground">
              Lower quality results in smaller file size but may reduce image clarity.
            </p>
          </div>
        )}

        {mode === "upscale" && (
          <div className="grid grid-cols-2 gap-4">
            <Button
              variant={scale === 2 ? "default" : "outline"}
              onClick={() => setScale(2)}
              className="h-24 flex-col space-y-2 text-lg"
            >
              <span className="text-3xl font-bold">2x</span>
              <span className="text-xs font-normal opacity-70">
                Standard Upscale
              </span>
            </Button>
            <Button
              variant={scale === 4 ? "default" : "outline"}
              onClick={() => setScale(4)}
              className="h-24 flex-col space-y-2 text-lg"
            >
              <span className="text-3xl font-bold">4x</span>
              <span className="text-xs font-normal opacity-70">
                Ultra Upscale
              </span>
            </Button>
          </div>
        )}

        <div className="space-y-2 mb-8 relative z-[50]">
          <Label>Output Format</Label>
          <Select
            value={format}
            onValueChange={(v: any) => setFormat(v)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select format" />
            </SelectTrigger>
            <SelectContent className="z-[100]" position="popper" sideOffset={5}>
              <SelectItem value="jpeg">JPEG (Best for photos)</SelectItem>
              <SelectItem value="png">PNG (Lossless, transparent)</SelectItem>
              <SelectItem value="webp">WebP (Modern optimization)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="pt-4">
          <Button
            onClick={handleSubmit}
            disabled={isProcessing}
            className="w-full h-12 text-base font-semibold shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                {mode === "resize" && <Minimize2 className="mr-2 h-5 w-5" />}
                {mode === "compress" && <RefreshCw className="mr-2 h-5 w-5" />}
                {mode === "upscale" && <Wand2 className="mr-2 h-5 w-5" />}
                {mode === "resize" && "Resize Image"}
                {mode === "compress" && "Compress Image"}
                {mode === "upscale" && "Upscale Image"}
              </>
            )}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
