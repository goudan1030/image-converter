import React, { useState, useRef } from 'react';
import { ImageProcessor as ImageProcessorUtil, ProcessedImage } from '../utils/imageProcessor';
import Image from 'next/image';

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

  const renderCompressionResult = (targetSize: number) => {
    if (!processedImage) return null;

    const currentSize = processedImage.size / 1024;
    const isOverSize = currentSize > targetSize;
    const difference = currentSize - targetSize;

    return (
      <div className="mt-2">
        <div className="flex items-center justify-between mb-2">
          <span className={`text-sm ${isOverSize ? 'text-red-500' : 'text-green-500'}`}>
            当前大小: {currentSize.toFixed(1)}KB
          </span>
          <span className={`text-sm ${isOverSize ? 'text-red-500' : 'text-green-500'}`}>
            {isOverSize 
              ? `超出 ${difference.toFixed(1)}KB` 
              : '已达标'}
          </span>
        </div>
        {isOverSize && (
          <button
            onClick={() => handleCompressToSize(targetSize, processedImage.file)}
            className="w-full mt-1 px-3 py-2 text-sm bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors"
            disabled={isProcessing}
          >
            继续压缩 ({currentSize.toFixed(1)}KB → {targetSize}KB)
          </button>
        )}
      </div>
    );
  };

  if (!imageFile || !previewUrl) {
    return null;
  }

  const originalSize = (imageFile.size / 1024).toFixed(2);
  const compressionRatio = processedImage 
    ? ((1 - processedImage.size / imageFile.size) * 100).toFixed(1)
    : null;

  return (
    <div className="mt-8">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileChange}
        className="hidden"
      />
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">图片处理</h2>
        <button
          onClick={onReset}
          className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
        >
          重新上传
        </button>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-4">
        <div 
          className="aspect-w-16 aspect-h-9 mb-4 cursor-pointer group relative"
          onClick={handleImageClick}
        >
          <Image
            src={previewUrl}
            alt="预览图"
            fill
            className="rounded-lg object-contain"
            unoptimized
          />
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center">
            <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              点击更换图片
            </span>
          </div>
        </div>
        
        {isProcessing && (
          <div className="mb-4">
            <div className="h-2 bg-gray-200 rounded-full">
              <div 
                className="h-full bg-blue-500 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-sm text-gray-600 mt-1">处理中... {progress}%</p>
          </div>
        )}

        <div className="text-sm text-gray-600 mb-4">
          <p>原始大小: {originalSize} KB</p>
          {processedImage && (
            <>
              <p>处理后大小: {(processedImage.size / 1024).toFixed(2)} KB</p>
              <p>压缩率: {compressionRatio}%</p>
              <p>尺寸: {processedImage.width} x {processedImage.height}</p>
            </>
          )}
        </div>

        <div className="border-t pt-4">
          <h3 className="font-semibold mb-2">选择输出格式</h3>
          <div className="flex gap-4 mb-4">
            <label className="flex-1">
              <input
                type="radio"
                name="format"
                value="original"
                checked={selectedFormat === 'original'}
                onChange={(e) => setSelectedFormat(e.target.value as 'original' | 'webp')}
                className="hidden"
              />
              <div className={`p-3 border rounded-lg text-center cursor-pointer transition-all ${
                selectedFormat === 'original' 
                  ? 'border-blue-500 bg-blue-50 text-blue-600' 
                  : 'border-gray-200 hover:border-blue-200'
              }`}>
                保留原格式
              </div>
            </label>
            <label className="flex-1">
              <input
                type="radio"
                name="format"
                value="webp"
                checked={selectedFormat === 'webp'}
                onChange={(e) => setSelectedFormat(e.target.value as 'original' | 'webp')}
                className="hidden"
              />
              <div className={`p-3 border rounded-lg text-center cursor-pointer transition-all ${
                selectedFormat === 'webp' 
                  ? 'border-blue-500 bg-blue-50 text-blue-600' 
                  : 'border-gray-200 hover:border-blue-200'
              }`}>
                转换为WebP
              </div>
            </label>
          </div>

          <div className="space-y-4">
            <div>
              <button
                onClick={() => handleCompressToSize(200)}
                className="w-full bg-blue-500 text-white px-4 py-3 rounded-lg hover:bg-blue-600 disabled:opacity-50"
                disabled={isProcessing}
              >
                压缩到200KB以内
              </button>
              {processedImage && renderCompressionResult(200)}
            </div>

            <div>
              <button
                onClick={() => handleCompressToSize(500)}
                className="w-full bg-blue-500 text-white px-4 py-3 rounded-lg hover:bg-blue-600 disabled:opacity-50"
                disabled={isProcessing}
              >
                压缩到500KB以内
              </button>
              {processedImage && renderCompressionResult(500)}
            </div>
          </div>
        </div>
        
        {processedImage && (
          <div className="mt-4">
            <button
              onClick={handleDownload}
              className="w-full bg-green-500 text-white px-4 py-3 rounded-lg hover:bg-green-600"
            >
              下载处理后的图片
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageProcessorComponent; 