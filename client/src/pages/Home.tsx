import { useState } from "react";
import { useUploadImage, useProcessImage } from "@/hooks/use-images";
import { Dropzone } from "@/components/Dropzone";
import { ProcessingControls } from "@/components/ProcessingControls";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Download, ArrowRight, Image as ImageIcon, CheckCircle2, FileImage, Minimize2, RefreshCw, Wand2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { api, buildUrl } from "@shared/routes";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"resize" | "compress" | "upscale">("resize");
  const [uploadedFile, setUploadedFile] = useState<{ id: number; filename: string; originalName: string } | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [originalDimensions, setOriginalDimensions] = useState<{ width: number; height: number; mimeType: string; size: number } | null>(null);
  const [processedResult, setProcessedResult] = useState<{ url: string; size: number; filename: string; mimeType: string } | null>(null);
  
  const { toast } = useToast();
  const uploadMutation = useUploadImage();
  const processMutation = useProcessImage();

  const handleFileSelect = async (file: File) => {
    // Create local preview immediately
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setProcessedResult(null); // Clear previous result

    // Get image dimensions
    const img = new Image();
    img.onload = () => {
      setOriginalDimensions({ 
        width: img.width, 
        height: img.height,
        mimeType: file.type,
        size: file.size
      });
    };
    img.src = objectUrl;

    try {
      const result = await uploadMutation.mutateAsync(file);
      setUploadedFile(result);
      toast({
        title: "Image uploaded successfully",
        description: "Ready to process.",
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: (error as Error).message,
        variant: "destructive",
      });
      setPreviewUrl(null);
    }
  };

  const handleProcess = async (params: any) => {
    if (!uploadedFile) return;

    try {
      const result = await processMutation.mutateAsync({
        id: uploadedFile.id,
        data: {
          operation: activeTab,
          params: params,
        },
      });
      setProcessedResult(result);
      toast({
        title: "Processing complete!",
        description: "Your image is ready for download.",
      });
    } catch (error) {
      toast({
        title: "Processing failed",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  };

  const handleDownload = () => {
    if (!processedResult) return;
    
    // Create a temporary anchor to trigger download
    const link = document.createElement('a');
    link.href = processedResult.url;
    link.download = processedResult.filename; // Should be respected by same-origin or blob
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleReset = () => {
    setUploadedFile(null);
    setPreviewUrl(null);
    setProcessedResult(null);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="min-h-screen bg-background selection:bg-primary/20">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-primary/10 p-2 rounded-lg">
              <RefreshCw className="w-5 h-5 text-primary" />
            </div>
            <h1 className="font-display text-xl font-bold tracking-tight">ResizeImage.ai</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-12">
          
          {/* Hero Text */}
          <div className="text-center space-y-4">
            <h2 className="font-display text-4xl md:text-5xl font-bold tracking-tight">
              <span className="gradient-text">Master your images</span> in seconds.
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Simple, powerful tools to resize, compress, and upscale your images using advanced algorithms. Free and unlimited.
            </p>
          </div>

          {/* Main App Area */}
          <Card className="border-none shadow-2xl shadow-primary/5 bg-card/50 backdrop-blur-sm overflow-hidden">
            <Tabs
              defaultValue="resize"
              value={activeTab}
              onValueChange={(v) => {
                setActiveTab(v as any);
                setProcessedResult(null);
              }}
              className="w-full"
            >
              <div className="border-b border-border/50 px-6 pt-6 bg-muted/20">
                <TabsList className="grid w-full grid-cols-3 h-14 bg-muted/50 p-1.5 mb-6">
                  <TabsTrigger 
                    value="resize" 
                    className="text-base font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all"
                  >
                    Resize
                  </TabsTrigger>
                  <TabsTrigger 
                    value="compress" 
                    className="text-base font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all"
                  >
                    Compress
                  </TabsTrigger>
                  <TabsTrigger 
                    value="upscale" 
                    className="text-base font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all"
                  >
                    Upscale
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="p-6 md:p-8">
                <AnimatePresence mode="wait">
                  {!uploadedFile ? (
                    <motion.div
                      key="upload"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      <Dropzone
                        onFileSelect={handleFileSelect}
                        isUploading={uploadMutation.isPending}
                        className="min-h-[300px]"
                      />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="process"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="grid grid-cols-1 md:grid-cols-2 gap-8"
                    >
                      {/* Left Column: Preview */}
                      <div className="space-y-4">
                        <div className="aspect-video relative rounded-2xl overflow-hidden bg-checkerboard border border-border shadow-inner group">
                          <img
                            src={processedResult ? processedResult.url : previewUrl!}
                            alt="Preview"
                            className="w-full h-full object-contain"
                          />
                          {processedResult && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                               <Button size="lg" variant="secondary" onClick={handleDownload}>
                                 <Download className="mr-2 w-4 h-4" /> Download
                               </Button>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center justify-between text-sm text-muted-foreground px-1">
                          <div className="flex items-center gap-2">
                             <FileImage className="w-4 h-4" />
                             <span className="truncate max-w-[150px]">{uploadedFile.originalName}</span>
                          </div>
                          <Button variant="ghost" size="sm" onClick={handleReset} className="h-auto p-0 hover:bg-transparent hover:text-primary">
                            Change image
                          </Button>
                        </div>
                      </div>

                      {/* Right Column: Controls or Result */}
                      <div className="flex flex-col justify-center">
                        {!processedResult ? (
                          <ProcessingControls
                            mode={activeTab}
                            isProcessing={processMutation.isPending}
                            onProcess={handleProcess}
                            originalSize={0} // We could get this if needed
                            originalDimensions={originalDimensions || undefined}
                          />
                        ) : (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-primary/5 border border-primary/20 rounded-2xl p-6 text-center space-y-6"
                          >
                            <div className="mx-auto w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                              <CheckCircle2 className="w-8 h-8" />
                            </div>
                            
                            <div>
                              <h3 className="text-xl font-bold font-display text-foreground">Success!</h3>
                              <p className="text-muted-foreground">Your image has been processed.</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-left bg-background/50 rounded-xl p-4 text-sm">
                              <div>
                                <span className="text-muted-foreground block text-xs uppercase tracking-wider">Format</span>
                                <span className="font-medium">{processedResult.mimeType.split('/')[1].toUpperCase()}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground block text-xs uppercase tracking-wider">Size</span>
                                <span className="font-medium">{formatFileSize(processedResult.size)}</span>
                              </div>
                            </div>

                            <div className="space-y-3">
                              <Button onClick={handleDownload} className="w-full h-12 text-base font-semibold shadow-lg shadow-primary/20">
                                <Download className="mr-2 h-5 w-5" /> Download Image
                              </Button>
                              <Button variant="outline" onClick={() => setProcessedResult(null)} className="w-full">
                                Process another with same settings
                              </Button>
                            </div>
                          </motion.div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </Tabs>
          </Card>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-8 pt-12">
             {[
               {
                 title: "Resize Image",
                 desc: "Change dimensions with pixel-perfect accuracy while maintaining your image's quality.",
                 icon: Minimize2
               },
               {
                 title: "Compress Image",
                 desc: "Reduce file size up to 90% without losing visible quality for faster web loading.",
                 icon: RefreshCw
               },
               {
                 title: "Upscale Image",
                 desc: "Enhance resolution up to 4x using high-performance neural network algorithms.",
                 icon: Wand2
               }
             ].map((feature, i) => (
               <div key={i} className="group p-8 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all hover:shadow-xl hover:shadow-primary/5">
                 <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
                   <feature.icon className="w-7 h-7" />
                 </div>
                 <h3 className="text-xl font-bold font-display mb-3">{feature.title}</h3>
                 <p className="text-muted-foreground text-sm leading-relaxed">{feature.desc}</p>
               </div>
             ))}
          </div>

        </div>
      </main>

      <footer className="border-t border-border/50 py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">
            Copyright &copy; {new Date().getFullYear()} Phpscriptsonline.com. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
