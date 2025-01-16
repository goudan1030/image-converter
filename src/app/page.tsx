'use client';

import { useState, useEffect } from 'react';
import ImageUploader from '@/components/ImageUploader';
import ImageProcessorComponent from '@/components/ImageProcessor';

export default function Home() {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);

  useEffect(() => {
    const handleNewImage = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail?.file) {
        setSelectedImage(customEvent.detail.file);
      }
    };

    window.addEventListener('newImageSelected', handleNewImage);
    return () => {
      window.removeEventListener('newImageSelected', handleNewImage);
    };
  }, []);

  const handleImageUpload = (file: File) => {
    setSelectedImage(file);
  };

  const handleReset = () => {
    setSelectedImage(null);
  };

  return (
    <main className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8">图片处理工具</h1>
        {!selectedImage && <ImageUploader onImageUpload={handleImageUpload} />}
        {selectedImage && (
          <ImageProcessorComponent 
            imageFile={selectedImage}
            onReset={handleReset}
          />
        )}
      </div>
    </main>
  );
}
