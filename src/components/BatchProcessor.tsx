import React, { useState } from 'react';
import { ImageProcessor as ImageProcessorUtil, ProcessedImage } from '../utils/imageProcessor';

interface BatchProcessorProps {
  imageFiles: File[];
  onReset: () => void;
}

interface ProcessingImage {
  file: File;
  progress: number;
  processed?: ProcessedImage;
  error?: string;
}

const BatchProcessor: React.FC<BatchProcessorProps> = ({ imageFiles, onReset }) => {
  const [selectedFormat, setSelectedFormat] = useState<'original' | 'webp'>('original');
  const [processingImages, setProcessingImages] = useState<ProcessingImage[]>(
    imageFiles.map(file => ({ file, progress: 0 }))
  );
  const [isProcessing, setIsProcessing] = useState(false);

  const updateImageProgress = (index: number, progress: number) => {
    setProcessingImages(prev => prev.map((img, i) => 
      i === index ? { ...img, progress } : img
    ));
  };

  const updateProcessedImage = (index: number, processed: ProcessedImage) => {
    setProcessingImages(prev => prev.map((img, i) => 
      i === index ? { ...img, processed } : img
    ));
  };

  const handleCompressAll = async (targetSizeKB: number) => {
    setIsProcessing(true);
    
    for (let i = 0; i < processingImages.length; i++) {
      const img = processingImages[i];
      if (img.processed) continue;

      try {
        updateImageProgress(i, 10);
        const result = await ImageProcessorUtil.compressToTargetSize(
          img.file,
          targetSizeKB,
          selectedFormat
        );
        updateImageProgress(i, 100);
        updateProcessedImage(i, result);
      } catch (error) {
        setProcessingImages(prev => prev.map((img, idx) => 
          idx === i ? { ...img, error: '处理失败' } : img
        ));
      }
    }
    
    setIsProcessing(false);
  };

  const handleDownloadAll = () => {
    processingImages.forEach(img => {
      if (img.processed) {
        const link = document.createElement('a');
        link.href = img.processed.url;
        link.download = `processed_${img.file.name}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    });
  };

  return (
    <div className="mt-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">批量处理图片</h2>
        <button
          onClick={onReset}
          className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
        >
          重新上传
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="mb-4">
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
        </div>

        <div className="space-y-4">
          {processingImages.map((img, index) => (
            <div key={index} className="border rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">{img.file.name}</span>
                <span className="text-sm text-gray-500">
                  {(img.file.size / 1024).toFixed(2)} KB
                </span>
              </div>
              
              {img.processed ? (
                <div className="text-sm text-gray-600">
                  <p>处理后大小: {(img.processed.size / 1024).toFixed(2)} KB</p>
                  <p>压缩率: {((1 - img.processed.size / img.file.size) * 100).toFixed(1)}%</p>
                </div>
              ) : (
                <div className="h-2 bg-gray-200 rounded-full">
                  <div 
                    className="h-full bg-blue-500 rounded-full transition-all duration-300"
                    style={{ width: `${img.progress}%` }}
                  />
                </div>
              )}
              
              {img.error && (
                <p className="text-sm text-red-500 mt-1">{img.error}</p>
              )}
            </div>
          ))}
        </div>

        <div className="space-y-2 mt-4">
          <button
            onClick={() => handleCompressAll(200)}
            className="w-full bg-blue-500 text-white px-4 py-3 rounded-lg hover:bg-blue-600 disabled:opacity-50"
            disabled={isProcessing}
          >
            全部压缩到200KB以内
          </button>
          <button
            onClick={() => handleCompressAll(500)}
            className="w-full bg-blue-500 text-white px-4 py-3 rounded-lg hover:bg-blue-600 disabled:opacity-50"
            disabled={isProcessing}
          >
            全部压缩到500KB以内
          </button>
        </div>

        {processingImages.some(img => img.processed) && (
          <button
            onClick={handleDownloadAll}
            className="w-full mt-4 bg-green-500 text-white px-4 py-3 rounded-lg hover:bg-green-600"
          >
            下载全部处理后的图片
          </button>
        )}
      </div>
    </div>
  );
};

export default BatchProcessor; 