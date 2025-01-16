'use client';

import { useState } from 'react';
import ImageUploader from '@/components/ImageUploader';
import ImageProcessor from '@/components/ImageProcessor';
import BatchProcessor from '@/components/BatchProcessor';

export default function Home() {
  const [selectedImages, setSelectedImages] = useState<File[]>([]);

  const handleImageUpload = (files: File[]) => {
    setSelectedImages(files);
  };

  const handleReset = () => {
    setSelectedImages([]);
  };

  const handleMultipleFiles = (files: File[]) => {
    setSelectedImages(files);
  };

  return (
    <main className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8">图片处理工具</h1>
        {selectedImages.length === 0 && (
          <ImageUploader onImageUpload={handleImageUpload} />
        )}
        {selectedImages.length === 1 ? (
          <ImageProcessor 
            imageFile={selectedImages[0]}
            onReset={handleReset}
            onMultipleFiles={handleMultipleFiles}
          />
        ) : selectedImages.length > 1 && (
          <BatchProcessor 
            imageFiles={selectedImages}
            onReset={handleReset}
          />
        )}
      </div>
    </main>
  );
}
