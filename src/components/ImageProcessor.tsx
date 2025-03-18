'use client';

import React, { useState, useEffect } from 'react';
import { ImageProcessor as ImageProcessorUtil, ProcessedImage } from '../utils/imageProcessor';
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Upload, Download, RefreshCw, Image as ImageIcon, FileType, PenTool } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ImageProcessorProps {
  imageFile: File;
  onReset: () => void;
  onMultipleFiles?: (files: File[]) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
}

const ImageProcessor: React.FC<ImageProcessorProps> = ({ 
  imageFile, 
  onReset, 
  onMultipleFiles,
  fileInputRef 
}) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedImage, setProcessedImage] = useState<ProcessedImage | null>(null);
  const [progress, setProgress] = useState(0);
  const [selectedFormat, setSelectedFormat] = useState<'original' | 'webp'>('original');
  const [compressionRatio, setCompressionRatio] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastTargetSize, setLastTargetSize] = useState<number | null>(null);

  // 改进预览URL生成逻辑
  useEffect(() => {
    console.log("ImageProcessor: 接收到新图片", imageFile?.name);
    let url: string | null = null;
    
    if (imageFile) {
      // 创建预览URL
      try {
        url = URL.createObjectURL(imageFile);
        console.log("ImageProcessor: 成功创建预览URL");
        setPreviewUrl(url);
      } catch (error) {
        console.error("ImageProcessor: 创建预览URL失败", error);
      }
      
      // 重置其他状态
      setProcessedImage(null);
      setProgress(0);
      setCompressionRatio(null);
      
      // 清理函数
      return () => {
        if (url) {
          console.log("ImageProcessor: 清理预览URL");
          try {
            URL.revokeObjectURL(url);
          } catch (error) {
            console.error("ImageProcessor: 清理预览URL失败", error);
          }
        }
      };
    }
  }, [imageFile]);

  const handleDownload = () => {
    if (processedImage) {
      const link = document.createElement('a');
      link.href = processedImage.url;
      link.download = `processed_${processedImage.file.name}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const simulateProgress = () => {
    setProgress(0);
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) {
          clearInterval(interval);
          return prev;
        }
        return prev + 10;
      });
    }, 100);
    return () => clearInterval(interval);
  };

  const handleCompressToSize = async (targetSizeKB: number, sourceFile: File = imageFile) => {
    console.log("ImageProcessor: 开始压缩图片");
    setIsProcessing(true);
    setError(null);
    setLastTargetSize(targetSizeKB);
    const cleanup = simulateProgress();
    
    try {
      const result = await ImageProcessorUtil.compressToTargetSize(sourceFile, targetSizeKB, selectedFormat);
      
      if (result.status === 'error') {
        throw new Error(result.error || '压缩过程发生未知错误');
      }
      
      setProcessedImage(result);
      setPreviewUrl(result.url);
      setProgress(100);
      
      // 计算压缩比率
      const originalSizeKB = sourceFile.size / 1024;
      const newSizeKB = result.size / 1024;
      const ratio = ((originalSizeKB - newSizeKB) / originalSizeKB) * 100;
      setCompressionRatio(Math.round(ratio));
      console.log("ImageProcessor: 压缩完成，比率:", Math.round(ratio), "%");
    } catch (error) {
      console.error('压缩失败:', error);
      setError(error instanceof Error ? error.message : '压缩失败，请尝试重新压缩');
    } finally {
      cleanup();
      setIsProcessing(false);
    }
  };

  const handleRetry = () => {
    if (lastTargetSize) {
      handleCompressToSize(lastTargetSize);
    }
  };

  const handleImageClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // 获取文件类型，格式化为大写
  const getFileType = () => {
    const extension = imageFile.name.split('.').pop() || '';
    return extension.toUpperCase();
  };

  // 格式化文件大小
  const formatFileSize = (sizeInBytes: number) => {
    const kb = sizeInBytes / 1024;
    if (kb < 1000) {
      return `${kb.toFixed(1)}KB`;
    } else {
      return `${(kb / 1024).toFixed(2)}MB`;
    }
  };

  return (
    <div className="space-y-8">
      {/* 调试信息 */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mb-4 p-2 bg-gray-100 text-xs">
          <p>ImageProcessor调试: 图片名称={imageFile?.name}, 有预览={previewUrl ? "是" : "否"}, 预览URL={previewUrl?.substring(0, 30)}...</p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div className="space-y-1">
          <h3 className="text-xl font-semibold">Process Single Image</h3>
          <p className="text-sm text-muted-foreground">
            {imageFile.name} • {formatFileSize(imageFile.size)}
          </p>
        </div>
        <Button
          variant="outline"
          onClick={onReset}
          className="shrink-0"
        >
          <RefreshCw className="mr-2 h-4 w-4" /> Upload Again
        </Button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* 图片预览区域 */}
        <Card className="overflow-hidden border-muted/40 shadow-md">
          <div className="bg-muted/20 p-2 flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <ImageIcon className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium truncate max-w-[200px]">
                {imageFile.name}
              </span>
            </div>
            <Badge variant="outline" className="bg-background">
              {getFileType()}
            </Badge>
          </div>
          <CardContent className="p-0">
            <div 
              className="relative w-full h-[300px] cursor-pointer group overflow-hidden"
              onClick={handleImageClick}
              role="button"
              tabIndex={0}
            >
              {previewUrl && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Image
                    src={previewUrl}
                    alt="Preview"
                    fill
                    className="object-contain"
                    unoptimized
                    priority
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                </div>
              )}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-center justify-center">
                <div className="bg-black/70 text-white px-4 py-2 rounded-full opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                  <Upload className="inline-block mr-2 h-4 w-4" />
                  Change Image
                </div>
              </div>
            </div>
          </CardContent>
          {processedImage && compressionRatio !== null && (
            <div className="p-4 bg-primary/5 border-t border-muted">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">Original Size:</span>
                  <span className="text-sm text-muted-foreground">{formatFileSize(imageFile.size)}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">Processed:</span>
                  <span className="text-sm text-muted-foreground">{formatFileSize(processedImage.size)}</span>
                </div>
              </div>
              <div className="mt-2 flex items-center">
                <span className="text-sm font-medium mr-2">Compression Ratio:</span>
                <Badge variant="outline" className={`${compressionRatio > 50 ? 'bg-green-500/10 text-green-600' : 'bg-primary/10 text-primary'}`}>
                  Reduced by {compressionRatio}%
                </Badge>
              </div>
            </div>
          )}
        </Card>

        {/* 图片处理选项 */}
        <div className="space-y-6">
          <Card className="border-muted/40 shadow-md">
            <CardContent className="p-6 space-y-6">
              <div>
                <h4 className="text-sm font-medium mb-3">Output Format</h4>
                <div className="grid grid-cols-2 gap-4">
                  <Button
                    variant={selectedFormat === 'original' ? 'default' : 'outline'}
                    onClick={() => setSelectedFormat('original')}
                    className="w-full"
                    disabled={isProcessing}
                  >
                    <FileType className="mr-2 h-4 w-4" />
                    Keep Original Format
                  </Button>
                  <Button
                    variant={selectedFormat === 'webp' ? 'default' : 'outline'}
                    onClick={() => setSelectedFormat('webp')}
                    className="w-full"
                    disabled={isProcessing}
                  >
                    <PenTool className="mr-2 h-4 w-4" />
                    Convert to WebP
                  </Button>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-3">Compression Options</h4>
                <div className="space-y-2">
                  <Button
                    onClick={() => handleCompressToSize(200)}
                    className="w-full"
                    disabled={isProcessing}
                    variant="secondary"
                  >
                    Compress to Under 200KB
                  </Button>
                  <Button
                    onClick={() => handleCompressToSize(500)}
                    className="w-full"
                    disabled={isProcessing}
                    variant="secondary"
                  >
                    Compress to Under 500KB
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 处理进度指示器 */}
          {isProcessing && (
            <Card className="border-muted/40 p-4 space-y-4">
              <h4 className="text-sm font-medium">Processing Progress</h4>
              <Progress value={progress} className="h-2" />
              <p className="text-sm text-muted-foreground text-center">
                Processing... {progress}%
              </p>
            </Card>
          )}

          {/* 错误显示及重试按钮 */}
          {error && (
            <Card className="border-destructive p-4 space-y-4">
              <div className="flex items-center space-x-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-destructive">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <h4 className="text-sm font-medium text-destructive">Processing Failed</h4>
              </div>
              <p className="text-sm text-destructive/80">{error}</p>
              <Button
                variant="outline"
                onClick={handleRetry}
                className="w-full border-destructive text-destructive hover:bg-destructive/10"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Retry Compression
              </Button>
            </Card>
          )}

          {/* 下载按钮 */}
          {processedImage && (
            <Button
              variant="default"
              onClick={handleDownload}
              className="w-full bg-green-600 hover:bg-green-700 h-12 text-lg shadow-lg"
              size="lg"
            >
              <Download className="mr-2 h-5 w-5" />
              Download Processed Image
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageProcessor; 