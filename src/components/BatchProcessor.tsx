import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ImageProcessor as ImageProcessorUtil } from '../utils/imageProcessor';
import { Download } from "lucide-react";

interface BatchProcessorProps {
  imageFiles: File[];
  onReset: () => void;
}

interface ProcessingImage {
  file: File;
  processed: {
    url: string;
    file: File;
    size: number;
  } | null;
  progress: number;
  error?: string;
}

const BatchProcessor: React.FC<BatchProcessorProps> = ({ imageFiles, onReset }) => {
  const [selectedFormat, setSelectedFormat] = useState<'original' | 'webp'>('original');
  const [processingImages, setProcessingImages] = useState<ProcessingImage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [totalProgress, setTotalProgress] = useState(0);
  const [allCompleted, setAllCompleted] = useState(false);

  useEffect(() => {
    setProcessingImages(imageFiles.map(file => ({
      file,
      processed: null,
      progress: 0
    })));
    setAllCompleted(false);
    setTotalProgress(0);
  }, [imageFiles]);

  const updateImageProgress = (index: number, progress: number) => {
    setProcessingImages(prev => {
      const newImages = [...prev];
      newImages[index].progress = progress;
      
      // 重新计算总进度
      const newTotalProgress = newImages.reduce((sum, img) => sum + img.progress, 0) / newImages.length;
      setTotalProgress(newTotalProgress);
      
      return newImages;
    });
  };

  const handleCompressAll = async (targetSizeKB: number) => {
    setIsProcessing(true);
    setAllCompleted(false);
    setTotalProgress(0);
    let completedCount = 0;

    try {
      // 使用 Promise.all 并行处理所有图片
      await Promise.all(processingImages.map(async (img, index) => {
        try {
          // 更新开始处理状态
          updateImageProgress(index, 10);

          // 处理图片
          const result = await ImageProcessorUtil.compressToTargetSize(
            img.file,
            targetSizeKB,
            selectedFormat // 使用选择的格式
          );

          // 更新处理结果
          setProcessingImages(prev => {
            const newImages = [...prev];
            newImages[index] = {
              ...newImages[index],
              processed: result,
              progress: 100
            };
            return newImages;
          });

          completedCount++;
          updateImageProgress(index, 100);

          // 检查是否所有图片都处理完成
          if (completedCount === processingImages.length) {
            setAllCompleted(true);
            setTotalProgress(100);
          }
        } catch (error) {
          console.error('处理失败:', error);
          setProcessingImages(prev => {
            const newImages = [...prev];
            newImages[index] = {
              ...newImages[index],
              error: '处理失败',
              progress: 0
            };
            return newImages;
          });
        }
      }));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadAll = () => {
    processingImages.forEach(img => {
      if (img.processed) {
        const link = document.createElement('a');
        link.href = img.processed.url;
        // 根据选择的格式设置文件扩展名
        const extension = selectedFormat === 'webp' ? '.webp' : 
          img.file.name.substring(img.file.name.lastIndexOf('.'));
        const fileName = img.file.name.substring(0, img.file.name.lastIndexOf('.'));
        link.download = `processed_${fileName}${extension}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h3 className="font-medium">批量处理图片</h3>
          <p className="text-sm text-muted-foreground">
            共 {imageFiles.length} 张图片
          </p>
        </div>
        <Button
          variant="ghost"
          onClick={onReset}
          disabled={isProcessing}
        >
          重新上传
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>选择输出格式</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <Button
              variant={selectedFormat === 'original' ? 'default' : 'outline'}
              onClick={() => setSelectedFormat('original')}
              disabled={isProcessing}
              className="w-full"
            >
              保留原格式
            </Button>
            <Button
              variant={selectedFormat === 'webp' ? 'default' : 'outline'}
              onClick={() => setSelectedFormat('webp')}
              disabled={isProcessing}
              className="w-full"
            >
              转换为WebP
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {processingImages.map((img, index) => (
          <div key={index} className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>{img.file.name}</span>
              <span>
                {img.processed 
                  ? `${(img.processed.size / 1024).toFixed(1)}KB` 
                  : `${(img.file.size / 1024).toFixed(1)}KB`}
              </span>
            </div>
            <Progress value={img.progress} />
            {img.error && (
              <p className="text-sm text-destructive">{img.error}</p>
            )}
          </div>
        ))}

        <div className="space-y-2">
          <div className="flex justify-between text-sm font-medium">
            <span>总进度</span>
            <span>{Math.round(totalProgress)}%</span>
          </div>
          <Progress value={totalProgress} className="h-2" />
        </div>
      </div>

      <div className="space-y-2">
        <Button
          onClick={() => handleCompressAll(200)}
          className="w-full"
          disabled={isProcessing}
        >
          压缩到200KB以内
        </Button>
        <Button
          onClick={() => handleCompressAll(500)}
          className="w-full"
          disabled={isProcessing}
        >
          压缩到500KB以内
        </Button>
      </div>

      {allCompleted && (
        <Button
          variant="default"
          onClick={handleDownloadAll}
          className="w-full bg-green-500 hover:bg-green-600"
        >
          <Download className="mr-2 h-4 w-4" />
          下载全部处理后的图片
        </Button>
      )}
    </div>
  );
};

export default BatchProcessor; 