'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import ImageUploader from '@/components/ImageUploader';
import ImageProcessor from '@/components/ImageProcessor';
import BatchProcessor from '@/components/BatchProcessor';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { ArrowRight, Image, Layers, Zap, Lock, Clock, FileImage, Sparkles, ArrowUpIcon } from "lucide-react";
import { Banner } from '@/components/ui/banner';

export default function Home() {
  // 用于ImageUploader组件的图片状态
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  // 用于处理组件的图片状态
  const [processingImages, setProcessingImages] = useState<File[]>([]);
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploaderRef = useRef<HTMLDivElement>(null);
  const processorRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // 添加调试信息
  useEffect(() => {
    console.log("Home: selectedFiles length:", selectedFiles.length);
    console.log("Home: processingImages length:", processingImages.length);
  }, [selectedFiles, processingImages]);

  // 当从页面顶部或拖放区域接收图片
  const handleImageUpload = (files: File[]) => {
    console.log("handleImageUpload called with", files.length, "files");
    
    try {
      const validFiles = files.filter(file => {
        const isValidType = /^image\/(jpeg|png|gif|webp)$/.test(file.type);
        const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB
        return isValidType && isValidSize;
      });

      if (validFiles.length === 0) {
        toast({
          title: "File not supported",
          description: "Please upload images in JPG, PNG, GIF or WebP format, no larger than 10MB",
          variant: "destructive",
        });
        return;
      }

      if (validFiles.length > 10) {
        toast({
          title: "Limit exceeded",
          description: "You can upload up to 10 images at once",
          variant: "destructive",
        });
        validFiles.splice(10); // 只保留前10张
      }

      if (files.length !== validFiles.length) {
        toast({
          title: "Some files filtered",
          description: "Files with unsupported formats or exceeding size limits have been filtered",
          variant: "destructive",
        });
      }

      // 更新预览状态，确保无论单张还是多张图片都进入预览状态
      console.log("设置selectedFiles:", validFiles.length);
      setSelectedFiles(prevFiles => {
        // 通过函数式更新确保状态一致性
        return [...validFiles];
      });
      // 确保处理状态被清空，强制显示上传组件
      setProcessingImages([]);
      
      // 滚动到上传区域
      if (uploaderRef.current) {
        uploaderRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    } catch (error) {
      console.error("Error processing image upload:", error);
      toast({
        title: "Upload error",
        description: "An error occurred while processing images, please try again",
        variant: "destructive",
      });
    }
  };

  // 从ImageUploader接收"开始处理"事件
  const handleStartProcessing = (files: File[]) => {
    console.log("handleStartProcessing called with", files.length, "files");
    try {
      if (files.length === 0) {
        toast({
          title: "No images selected",
          description: "Please select at least one image to process",
          variant: "destructive",
        });
        return;
      }
      
      setProcessingImages(prevImages => {
        // 同样使用函数式更新
        return [...files];
      });
      
      // 滚动到处理区域
      if (processorRef.current) {
        processorRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    } catch (error) {
      console.error("Error starting image processing:", error);
      toast({
        title: "Processing error",
        description: "An error occurred while starting processing, please try again",
        variant: "destructive",
      });
    }
  };

  // 重置所有状态
  const handleReset = () => {
    console.log("handleReset called");
    setProcessingImages([]);
    // 确保清除selectedFiles，保证重置完整
    setSelectedFiles([]);
  };

  // 处理拖拽事件
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    console.log("文件被拖放");
    
    const files = Array.from(e.dataTransfer.files);
    handleImageUpload(files);
  };

  // 处理点击上传
  const handleClickUpload = () => {
    console.log("触发文件选择器");
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      console.log("通过文件选择器选择了", files.length, "个文件");
      handleImageUpload(Array.from(files));
      // 重置 input 值，允许重复选择相同文件
      e.target.value = '';
    }
  };

  const scrollToProcessor = () => {
    if (processorRef.current) {
      processorRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleStartClick = () => {
    handleClickUpload();
  };

  // 添加更多图片到预览状态
  const handleAddMoreFiles = (files: File[]) => {
    console.log("添加更多图片:", files.length);
    try {
      // 使用函数式更新，直接设置新的文件列表，而不是追加
      setSelectedFiles(currentFiles => {
        // 如果新文件列表的长度和当前一样，可能是由于状态变化导致的重复调用
        // 在这种情况下，我们直接返回当前状态
        if (files.length === currentFiles.length && 
            files.every((file, i) => file.name === currentFiles[i].name && file.size === currentFiles[i].size)) {
          console.log("检测到重复更新，忽略");
          return currentFiles;
        }
        
        console.log("更新文件列表:", files.length);
        return files;
      });
    } catch (error) {
      console.error("Error adding more images:", error);
      toast({
        title: "Adding failed",
        description: "Failed to add more images, please try again",
        variant: "destructive",
      });
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div 
      className="min-h-screen"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept="image/jpeg,image/png,image/gif,image/webp"
        multiple
        onChange={handleFileInputChange}
      />
      
      {/* 使用新的Banner组件替换原有的英雄区域 */}
      <Banner 
        onGetStarted={handleStartClick}
        onLearnMore={scrollToProcessor}
        videoSrc="/videos/banner-bg.webm"
      />

      {/* 处理区域 */}
      <section ref={processorRef} className="py-16 bg-background" id="tools">
        <div className="container space-y-8">
          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold tracking-tight">Powerful Image Processing Tools</h2>
            <p className="text-muted-foreground text-lg">
              We provide professional image processing features to meet your various needs
            </p>
          </div>

          <Card className="shadow-lg border-muted">
            <CardHeader>
              <CardTitle>Start Processing</CardTitle>
              <CardDescription>
                Upload your images and select processing options
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div ref={uploaderRef}>
                {processingImages.length === 0 ? (
                  <ImageUploader 
                    onImageUpload={handleStartProcessing} 
                    initialFiles={selectedFiles}
                    onAddMoreFiles={handleAddMoreFiles}
                  />
                ) : processingImages.length === 1 ? (
                  <ImageProcessor 
                    imageFile={processingImages[0]}
                    onReset={handleReset}
                    onMultipleFiles={handleStartProcessing}
                    fileInputRef={fileInputRef}
                  />
                ) : (
                  <BatchProcessor 
                    imageFiles={processingImages}
                    onReset={handleReset}
                  />
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
      
      {/* 功能特点 */}
      <section className="py-16 bg-muted/30" id="features">
        <div className="container space-y-12">
          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold tracking-tight">Why Choose Our Tool?</h2>
            <p className="text-muted-foreground text-lg">
              Simple, efficient, and secure image processing experience
            </p>
          </div>
          
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardContent className="pt-6">
                <div className="mb-4 text-primary">
                  <Zap size={36} />
                </div>
                <h3 className="text-xl font-semibold mb-2">Efficient Processing</h3>
                <p className="text-muted-foreground">
                  Using advanced algorithms to quickly compress images without losing quality
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="mb-4 text-primary">
                  <Lock size={36} />
                </div>
                <h3 className="text-xl font-semibold mb-2">Privacy Protection</h3>
                <p className="text-muted-foreground">
                  All processing is completed in your browser, images are never uploaded to servers
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="mb-4 text-primary">
                  <Layers size={36} />
                </div>
                <h3 className="text-xl font-semibold mb-2">Batch Processing</h3>
                <p className="text-muted-foreground">
                  Process up to 10 images at once, saving your valuable time
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="mb-4 text-primary">
                  <FileImage size={36} />
                </div>
                <h3 className="text-xl font-semibold mb-2">Format Conversion</h3>
                <p className="text-muted-foreground">
                  Support conversion to modern formats like WebP for smaller file sizes
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="mb-4 text-primary">
                  <Clock size={36} />
                </div>
                <h3 className="text-xl font-semibold mb-2">Instant Processing</h3>
                <p className="text-muted-foreground">
                  No waiting for uploads and processing, results appear in real-time for immediate download
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="mb-4 text-primary">
                  <Sparkles size={36} />
                </div>
                <h3 className="text-xl font-semibold mb-2">Smart Optimization</h3>
                <p className="text-muted-foreground">
                  Automatically balance quality and file size for optimal results
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ部分 */}
      <section className="py-16 bg-background" id="faq">
        <div className="container space-y-12">
          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold tracking-tight">Frequently Asked Questions</h2>
            <p className="text-muted-foreground text-lg">
              Common questions about our image processing tools
            </p>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2 lg:gap-12">
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">How to compress images without losing quality?</h3>
              <p className="text-muted-foreground">
                Our tool uses intelligent compression algorithms to reduce file size while maintaining image quality. You can choose to compress to 200KB or 500KB, and the system will automatically balance quality and file size for best results.
              </p>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Why should I convert to WebP format?</h3>
              <p className="text-muted-foreground">
                WebP is a modern image format that offers excellent compression rates while maintaining high-quality visual effects. Compared to traditional JPEG and PNG, WebP format typically reduces file size by 20-30%, helping to improve website loading speed.
              </p>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Are my images uploaded to servers?</h3>
              <p className="text-muted-foreground">
                No. Our tool runs entirely in your browser, and all image processing is done locally. Your images are never uploaded to any server, ensuring your privacy and security.
              </p>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">How many images can I process at once?</h3>
              <p className="text-muted-foreground">
                Currently, you can upload and process up to 10 images at once. The batch processing feature helps you apply the same processing options to multiple images simultaneously, greatly improving efficiency.
              </p>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Which image formats are supported?</h3>
              <p className="text-muted-foreground">
                We support the most common image formats: JPEG, PNG, GIF, and WebP. You can upload images in these formats and choose to keep the original format or convert to WebP.
              </p>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Is there a fee to use this tool?</h3>
              <p className="text-muted-foreground">
                Basic features are free to use. Sign in to access all premium features without limitations.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA部分 */}
      <section className="py-16 bg-primary/10">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h2 className="text-3xl font-bold tracking-tight">
              Start Processing Your Images Now
            </h2>
            <p className="text-muted-foreground text-lg">
              Simple, fast, secure - Sign in to access all premium features without limitations
            </p>
            <Button size="lg" className="text-lg" onClick={handleStartClick}>
              Start Processing <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {isDragActive && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-background p-8 rounded-lg border-2 border-dashed border-primary">
            <p className="text-2xl font-medium text-primary">
              Release to Upload Images
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Supports JPG, PNG, GIF, WebP formats, up to 10MB per file
            </p>
          </div>
        </div>
      )}

      {/* 返回顶部按钮 */}
      <button
        onClick={scrollToTop}
        className="fixed bottom-4 right-4 bg-primary text-white p-2 rounded-full shadow-lg hover:bg-primary/80 transition-all duration-300"
      >
        <ArrowUpIcon className="h-5 w-5" />
      </button>
    </div>
  );
}
