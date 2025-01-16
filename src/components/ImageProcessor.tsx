import React, { useState, useRef } from 'react';
import { ImageProcessor as ImageProcessorUtil, ProcessedImage } from '../utils/imageProcessor';
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Upload, Download } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageProcessorProps {
  imageFile: File;
  onReset: () => void;
  onMultipleFiles?: (files: File[]) => void;
}

const ImageProcessorComponent: React.FC<ImageProcessorProps> = ({ imageFile, onReset, onMultipleFiles }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedImage, setProcessedImage] = useState<ProcessedImage | null>(null);
  const [progress, setProgress] = useState(0);
  const [selectedFormat, setSelectedFormat] = useState<'original' | 'webp'>('original');

  React.useEffect(() => {
    if (imageFile) {
      const url = URL.createObjectURL(imageFile);
      setPreviewUrl(url);
      setProcessedImage(null);
      setProgress(0);
      return () => URL.revokeObjectURL(url);
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
    setIsProcessing(true);
    const cleanup = simulateProgress();
    
    try {
      const result = await ImageProcessorUtil.compressToTargetSize(sourceFile, targetSizeKB, selectedFormat);
      setProcessedImage(result);
      setPreviewUrl(result.url);
      setProgress(100);
    } catch (error) {
      console.error('压缩失败:', error);
    } finally {
      cleanup();
      setIsProcessing(false);
    }
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      event.target.value = '';
      onReset();
      if (files.length === 1) {
        onMultipleFiles?.([files[0]]);
      } else if (files.length > 1) {
        onMultipleFiles?.(Array.from(files));
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h3 className="font-medium">处理单张图片</h3>
          <p className="text-sm text-muted-foreground">
            点击图片区域可更换图片
          </p>
        </div>
        <Button
          variant="ghost"
          onClick={onReset}
        >
          重新上传
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <div 
            className="relative w-full aspect-[16/9] cursor-pointer group"
            onClick={handleImageClick}
          >
            {previewUrl && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Image
                  src={previewUrl}
                  alt="预览图"
                  fill
                  className="rounded-lg object-contain"
                  unoptimized
                  priority
                />
              </div>
            )}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-center justify-center rounded-lg">
              <Upload className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
          </div>
        </CardContent>
      </Card>

      {isProcessing && (
        <div className="space-y-2">
          <Progress value={progress} />
          <p className="text-sm text-muted-foreground text-center">
            处理中... {progress}%
          </p>
        </div>
      )}

      <div className="grid gap-4">
        <div className="grid grid-cols-2 gap-4">
          <Button
            variant={selectedFormat === 'original' ? 'default' : 'outline'}
            onClick={() => setSelectedFormat('original')}
          >
            保留原格式
          </Button>
          <Button
            variant={selectedFormat === 'webp' ? 'default' : 'outline'}
            onClick={() => setSelectedFormat('webp')}
          >
            转换为WebP
          </Button>
        </div>

        <div className="space-y-2">
          <Button
            onClick={() => handleCompressToSize(200)}
            className="w-full"
            disabled={isProcessing}
          >
            压缩到200KB以内
          </Button>
          <Button
            onClick={() => handleCompressToSize(500)}
            className="w-full"
            disabled={isProcessing}
          >
            压缩到500KB以内
          </Button>
        </div>

        {processedImage && (
          <Button
            variant="success"
            onClick={handleDownload}
            className="w-full"
          >
            <Download className="mr-2 h-4 w-4" />
            下载处理后的图片
          </Button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept="image/*"
        multiple
        onChange={handleFileChange}
      />
    </div>
  );
};

export default ImageProcessorComponent; 