'use client';

import { useState, useCallback, useRef } from 'react';
import ImageUploader from '@/components/ImageUploader';
import ImageProcessor from '@/components/ImageProcessor';
import BatchProcessor from '@/components/BatchProcessor';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";

export default function Home() {
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleImageUpload = (files: File[]) => {
    const validFiles = files.filter(file => {
      const isValidType = /^image\/(jpeg|png|gif|webp)$/.test(file.type);
      const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB
      return isValidType && isValidSize;
    });

    if (validFiles.length === 0) {
      toast({
        title: "文件不支持",
        description: "请上传JPG、PNG、GIF或WebP格式的图片，且大小不超过10MB",
        variant: "destructive",
      });
      return;
    }

    if (validFiles.length > 10) {
      toast({
        title: "超出限制",
        description: "一次最多只能上传10张图片",
        variant: "destructive",
      });
      validFiles.splice(10); // 只保留前10张
    }

    if (files.length !== validFiles.length) {
      toast({
        title: "部分文件已过滤",
        description: "已过滤不支持的格式或超过大小限制的文件",
        variant: "destructive",
      });
    }

    setSelectedImages(validFiles);
  };

  const handleReset = () => {
    setSelectedImages([]);
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

    const files = Array.from(e.dataTransfer.files);
    handleImageUpload(files);
  };

  // 处理点击上传
  const handleClickUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      handleImageUpload(Array.from(files));
      // 重置 input 值，允许重复选择相同文件
      e.target.value = '';
    }
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
      
      <main className="container py-8 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">图片处理工具</h1>
          <p className="text-lg text-muted-foreground">
            支持批量压缩、格式转换的在线图片处理工具
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>开始处理</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedImages.length === 0 ? (
              <ImageUploader onImageUpload={handleImageUpload} />
            ) : selectedImages.length === 1 ? (
              <ImageProcessor 
                imageFile={selectedImages[0]}
                onReset={handleReset}
                onMultipleFiles={handleImageUpload}
                fileInputRef={fileInputRef}
              />
            ) : (
              <BatchProcessor 
                imageFiles={selectedImages}
                onReset={handleReset}
              />
            )}
          </CardContent>
        </Card>

        {isDragActive && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-background p-8 rounded-lg border-2 border-dashed border-primary">
              <p className="text-2xl font-medium text-primary">
                松开鼠标上传图片
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                支持JPG、PNG、GIF、WebP格式，单个文件不超过10MB
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
