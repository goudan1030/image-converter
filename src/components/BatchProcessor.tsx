'use client';

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ImageProcessor as ImageProcessorUtil } from '../utils/imageProcessor';
import { Download, RefreshCw, FileType, PenTool, Check, FileImage, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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
  targetSizeKB?: number;
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

    // 设置所有图片的目标大小
    setProcessingImages(prev => prev.map(img => ({
      ...img,
      targetSizeKB,
      error: undefined, // 重置错误状态
      progress: 0
    })));

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

          // 检查是否有错误状态
          if (result.status === 'error') {
            throw new Error(result.error || 'compression failed');
          }

          // 更新处理结果
          setProcessingImages(prev => {
            const newImages = [...prev];
            newImages[index] = {
              ...newImages[index],
              processed: result,
              progress: 100,
              error: undefined
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
          console.error('processing failed:', error);
          setProcessingImages(prev => {
            const newImages = [...prev];
            newImages[index] = {
              ...newImages[index],
              error: error instanceof Error ? error.message : 'processing failed',
              progress: 0
            };
            return newImages;
          });
        }
      })).catch(err => {
        // 捕获Promise.all可能抛出的错误
        console.error('batch processing failed:', err);
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // 添加单个图片重试功能
  const handleRetryImage = async (index: number) => {
    const img = processingImages[index];
    
    if (!img.targetSizeKB) {
      console.error('没有找到目标大小信息，无法重试');
      return;
    }
    
    // 更新单个图片的处理状态
    setProcessingImages(prev => {
      const newImages = [...prev];
      newImages[index] = {
        ...newImages[index],
        progress: 10,
        error: undefined
      };
      return newImages;
    });
    
    try {
      // 处理单个图片
      const result = await ImageProcessorUtil.compressToTargetSize(
        img.file,
        img.targetSizeKB,
        selectedFormat
      );
      
      // 检查是否有错误状态
      if (result.status === 'error') {
        throw new Error(result.error || 'compression failed');
      }
      
      // 更新处理结果
      setProcessingImages(prev => {
        const newImages = [...prev];
        newImages[index] = {
          ...newImages[index],
          processed: result,
          progress: 100,
          error: undefined
        };
        
        // 重新计算总进度
        const newTotalProgress = newImages.reduce((sum, img) => sum + img.progress, 0) / newImages.length;
        setTotalProgress(newTotalProgress);
        
        // 检查是否所有图片都处理完成
        const allDone = newImages.every(img => img.progress === 100);
        if (allDone) {
          setAllCompleted(true);
        }
        
        return newImages;
      });
    } catch (error) {
      console.error('重试失败:', error);
      setProcessingImages(prev => {
        const newImages = [...prev];
        newImages[index] = {
          ...newImages[index],
          error: error instanceof Error ? error.message : 'processing failed',
          progress: 0
        };
        return newImages;
      });
    }
  };

  const handleDownloadAll = () => {
    // 使用try-catch包装，避免未捕获的错误
    try {
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
    } catch (error) {
      console.error('下载失败:', error);
    }
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

  // 计算总的压缩率
  const calculateCompressionRatio = () => {
    const totalOriginalSize = processingImages.reduce((sum, img) => sum + img.file.size, 0);
    const totalProcessedSize = processingImages.reduce((sum, img) => sum + (img.processed?.size || 0), 0);
    
    if (totalOriginalSize === 0 || totalProcessedSize === 0) return 0;
    
    return Math.round(((totalOriginalSize - totalProcessedSize) / totalOriginalSize) * 100);
  };

  // 获取处理完成的图片数量
  const getCompletedCount = () => {
    return processingImages.filter(img => img.processed !== null).length;
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div className="space-y-1">
          <h3 className="text-xl font-semibold">Batch Process Images</h3>
          <p className="text-sm text-muted-foreground">
            Total {imageFiles.length} images
          </p>
        </div>
        <Button
          variant="outline"
          onClick={onReset}
          disabled={isProcessing}
          className="shrink-0"
        >
          <RefreshCw className="mr-2 h-4 w-4" /> Upload Again
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* 处理选项 */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-muted/40 shadow-md">
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <FileImage className="mr-2 h-5 w-5 text-primary" />
                Processing Options
              </CardTitle>
              <CardDescription>
                Select output format and compression options
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="text-sm font-medium mb-3">Select Output Format</h4>
                <div className="grid grid-cols-2 gap-4">
                  <Button
                    variant={selectedFormat === 'original' ? 'default' : 'outline'}
                    onClick={() => setSelectedFormat('original')}
                    disabled={isProcessing}
                    className="w-full"
                  >
                    <FileType className="mr-2 h-4 w-4" />
                    Keep Original Format
                  </Button>
                  <Button
                    variant={selectedFormat === 'webp' ? 'default' : 'outline'}
                    onClick={() => setSelectedFormat('webp')}
                    disabled={isProcessing}
                    className="w-full"
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
                    onClick={() => handleCompressAll(200)}
                    className="w-full"
                    disabled={isProcessing}
                    variant="secondary"
                  >
                    Compress to Under 200KB
                  </Button>
                  <Button
                    onClick={() => handleCompressAll(500)}
                    className="w-full"
                    disabled={isProcessing}
                    variant="secondary"
                  >
                    Compress to Under 500KB
                  </Button>
                </div>
              </div>
              
              {allCompleted && (
                <div className="pt-4 border-t border-muted/30">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Total Size Before:</span>
                      <span className="text-sm">
                        {formatFileSize(processingImages.reduce((sum, img) => sum + img.file.size, 0))}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Total Size After:</span>
                      <span className="text-sm">
                        {formatFileSize(processingImages.reduce((sum, img) => sum + (img.processed?.size || 0), 0))}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Total Compression Ratio:</span>
                      <Badge variant="outline" className="bg-green-500/10 text-green-600">
                        Reduced by {calculateCompressionRatio()}%
                      </Badge>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {allCompleted && (
            <Button
              variant="default"
              onClick={handleDownloadAll}
              size="lg"
              className="w-full bg-green-600 hover:bg-green-700 h-12 text-lg shadow-lg"
            >
              <Download className="mr-2 h-5 w-5" />
              Download All Processed Images
            </Button>
          )}
        </div>

        {/* 图片处理状态 */}
        <div className="lg:col-span-2">
          <Card className="border-muted/40 shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <Clock className="mr-2 h-5 w-5 text-primary" />
                Processing Progress
              </CardTitle>
              <CardDescription>
                {isProcessing ? "Processing images..." : allCompleted ? "All images processed successfully!" : "Waiting to start processing..."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {processingImages.length > 0 && (
                <div className="space-y-5">
                  <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                    {processingImages.map((img, index) => (
                      <div key={index} className="space-y-2 p-3 rounded-lg bg-muted/20 border border-muted/30">
                        <div className="flex justify-between text-sm">
                          <div className="flex items-center max-w-[70%]">
                            {img.progress === 100 && (
                              <Check className="h-4 w-4 text-green-500 mr-2 shrink-0" />
                            )}
                            <span className="truncate">{img.file.name}</span>
                          </div>
                          <div className="flex items-center space-x-3">
                            {img.processed ? (
                              <div className="flex items-center space-x-2">
                                <span className="text-sm text-muted-foreground line-through">
                                  {formatFileSize(img.file.size)}
                                </span>
                                <span className="text-sm font-medium text-green-600">
                                  {formatFileSize(img.processed.size)}
                                </span>
                              </div>
                            ) : (
                              <span className="text-sm text-muted-foreground">
                                {formatFileSize(img.file.size)}
                              </span>
                            )}
                          </div>
                        </div>
                        <Progress 
                          value={img.progress} 
                          className={`h-2 ${img.progress === 100 ? "bg-muted-foreground/20" : ""} ${img.error ? "bg-red-200" : ""}`}
                        />
                        {img.error && (
                          <div className="flex flex-col space-y-2">
                            <p className="text-sm text-destructive">{img.error}</p>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="text-xs border-destructive text-destructive hover:bg-destructive/10"
                              onClick={() => handleRetryImage(index)}
                            >
                              <RefreshCw className="h-3 w-3 mr-1" /> Retry This Image
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="space-y-3 pt-4 border-t border-muted/30">
                    <div className="flex justify-between items-center text-sm font-medium">
                      <div className="flex items-center">
                        <span>Total Progress</span>
                        <Badge variant="outline" className="ml-2 bg-primary/5">
                          {getCompletedCount()}/{processingImages.length}
                        </Badge>
                      </div>
                      <span>{Math.round(totalProgress)}%</span>
                    </div>
                    <Progress 
                      value={totalProgress} 
                      className="h-2.5" 
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default BatchProcessor; 