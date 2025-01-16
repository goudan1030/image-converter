'use client';

import { useState } from 'react';
import ImageUploader from '@/components/ImageUploader';
import ImageProcessor from '@/components/ImageProcessor';
import BatchProcessor from '@/components/BatchProcessor';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  const [selectedImages, setSelectedImages] = useState<File[]>([]);

  const handleImageUpload = (files: File[]) => {
    setSelectedImages(files);
  };

  const handleReset = () => {
    setSelectedImages([]);
  };

  return (
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
          {selectedImages.length === 0 && (
            <ImageUploader onImageUpload={handleImageUpload} />
          )}
          {selectedImages.length === 1 ? (
            <ImageProcessor 
              imageFile={selectedImages[0]}
              onReset={handleReset}
              onMultipleFiles={handleImageUpload}
            />
          ) : selectedImages.length > 1 && (
            <BatchProcessor 
              imageFiles={selectedImages}
              onReset={handleReset}
            />
          )}
        </CardContent>
      </Card>
    </main>
  );
}
