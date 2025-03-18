'use client';

import React, { useCallback, useState, useEffect, useMemo, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent } from "@/components/ui/card";
import { Upload, Image as ImageIcon, FileImage, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Image from 'next/image';

interface ImageUploaderProps {
  onImageUpload: (files: File[]) => void;
  initialFiles?: File[];
  onAddMoreFiles?: (files: File[]) => void;
  hideTitle?: boolean;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ 
  onImageUpload, 
  initialFiles = [], 
  onAddMoreFiles,
  hideTitle = false
}) => {
  // 使用useMemo防止不必要的状态更新
  const [selectedFiles, setSelectedFiles] = useState<File[]>(initialFiles);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [lastInitialFilesLength, setLastInitialFilesLength] = useState(initialFiles.length);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 当initialFiles变化且与上次不同时才更新selectedFiles
  useEffect(() => {
    console.log("ImageUploader: initialFiles changed:", initialFiles.length, "last:", lastInitialFilesLength);
    
    // 避免不必要的更新：当initialFiles为空且selectedFiles也为空时，不触发更新
    if (initialFiles.length === 0 && selectedFiles.length === 0) {
      return;
    }
    
    // 只有当initialFiles长度变化时才更新内部状态
    // 这可以防止在清除操作后又重新从initialFiles加载
    if (initialFiles.length !== lastInitialFilesLength) {
      // 深度比较当前selectedFiles和initialFiles
      // 只有当内容确实不同时才更新
      const needsUpdate = initialFiles.length !== selectedFiles.length ||
        !initialFiles.every((file, i) => 
          i < selectedFiles.length && 
          file.name === selectedFiles[i].name && 
          file.size === selectedFiles[i].size
        );
      
      if (needsUpdate) {
        console.log("ImageUploader: 更新selectedFiles为initialFiles");
        setSelectedFiles(initialFiles);
        setLastInitialFilesLength(initialFiles.length);
      }
    }
  }, [initialFiles, lastInitialFilesLength, selectedFiles]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    console.log("ImageUploader: onDrop called with", acceptedFiles.length, "files");
    if (acceptedFiles && acceptedFiles.length > 0) {
      // 将新文件添加到已有文件列表中，而不是替换
      const newFiles = [...selectedFiles, ...acceptedFiles];
      setSelectedFiles(newFiles);
      setLastInitialFilesLength(newFiles.length);
      
      // 如果提供了onAddMoreFiles回调，调用它
      if (onAddMoreFiles) {
        console.log("ImageUploader: 通知父组件添加了新文件");
        onAddMoreFiles(newFiles);
      }
    }
  }, [selectedFiles, onAddMoreFiles]);

  // 处理文件选择
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log("ImageUploader: 文件选择器选择了文件");
    const files = e.target.files;
    if (files && files.length > 0) {
      const newFiles = Array.from(files);
      
      // 将新文件添加到已有文件列表中
      setSelectedFiles(prevFiles => {
        const combinedFiles = [...prevFiles, ...newFiles];
        
        // 更新lastInitialFilesLength以与当前选择保持一致
        setLastInitialFilesLength(combinedFiles.length);
        
        // 如果提供了onAddMoreFiles回调，调用它
        if (onAddMoreFiles) {
          // 包装在setTimeout里，避免在渲染过程中触发回调
          setTimeout(() => {
            console.log("ImageUploader: 通知父组件添加了新文件（通过文件选择器）");
            onAddMoreFiles(combinedFiles);
          }, 0);
        }
        
        return combinedFiles;
      });
      
      // 重置input，允许再次选择相同文件
      e.target.value = '';
    }
  };

  // 触发文件选择器
  const triggerFileInput = () => {
    console.log("ImageUploader: 触发文件选择器");
    fileInputRef.current?.click();
  };

  // 生成预览URL - 改进版本，确保URL不会过早释放
  useEffect(() => {
    console.log("ImageUploader: 更新预览URLs, selectedFiles:", selectedFiles.length);
    
    // 创建一个映射，将每个文件ID映射到其预览URL
    // 这样可以保留之前的URL而不是重新创建
    const newUrls: string[] = [];
    
    selectedFiles.forEach((file, index) => {
      // 为每个文件生成一个唯一URL
      try {
        const url = URL.createObjectURL(file);
        newUrls.push(url);
      } catch (e) {
        console.error("为文件创建预览URL时出错:", e);
        newUrls.push(''); // 添加空URL以保持索引一致
      }
    });
    
    // 设置新的预览URL数组
    setPreviewUrls(newUrls);
    
    // 清理函数，当组件卸载或依赖项变化时执行
    return () => {
      // 释放所有新创建的URLs
      newUrls.forEach(url => {
        if (url) {
          try {
            URL.revokeObjectURL(url);
          } catch (e) {
            console.error("释放URL时出错:", e);
          }
        }
      });
    };
  }, [selectedFiles]); // 只依赖于selectedFiles

  // 渲染图片预览的助手函数，添加错误处理
  const renderPreview = (url: string, index: number) => {
    if (!url) return null;
    
    return (
      <Image
        src={url}
        alt={`预览图 ${index + 1}`}
        fill
        className="object-contain"
        unoptimized
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        onError={(e) => {
          console.error(`图片 ${index} 加载失败:`, e);
          e.currentTarget.style.display = 'none'; // 隐藏无法加载的图片
        }}
      />
    );
  };

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/gif': ['.gif'],
      'image/webp': ['.webp']
    },
    multiple: true,
    maxFiles: 10,
    maxSize: 10485760,
    noClick: true, // 禁用点击触发，我们使用专门的按钮
  });

  // 格式化文件大小
  const formatFileSize = (sizeInBytes: number) => {
    const kb = sizeInBytes / 1024;
    if (kb < 1000) {
      return `${kb.toFixed(1)}KB`;
    } else {
      return `${(kb / 1024).toFixed(2)}MB`;
    }
  };

  // 获取文件类型，格式化为大写
  const getFileType = (file: File) => {
    const extension = file.name.split('.').pop() || '';
    return extension.toUpperCase();
  };

  // 清除所有选择的文件
  const clearFiles = () => {
    console.log("ImageUploader: 清除所有文件");
    
    // 先释放所有预览URL资源
    previewUrls.forEach(url => {
      if (url) {
        try {
          URL.revokeObjectURL(url);
        } catch (e) {
          console.error("释放URL时出错:", e);
        }
      }
    });
    
    // 清空状态
    setPreviewUrls([]);
    setSelectedFiles([]);
    setLastInitialFilesLength(0);
    
    // 在状态更新后通知父组件
    if (onAddMoreFiles) {
      // 使用setTimeout避免在渲染周期中调用
      setTimeout(() => {
        console.log("ImageUploader: 通知父组件清除了所有文件");
        onAddMoreFiles([]);
      }, 0);
    }
  };

  // 开始处理选中的图片
  const handleStartProcessing = () => {
    console.log("ImageUploader: 开始处理", selectedFiles.length, "张图片");
    if (selectedFiles.length > 0) {
      onImageUpload(selectedFiles);
    }
  };

  // 删除单张图片
  const handleRemoveFile = (index: number) => {
    console.log("ImageUploader: 删除图片索引", index);
    
    // 先尝试释放这张图片的预览URL
    if (index < previewUrls.length && previewUrls[index]) {
      try {
        URL.revokeObjectURL(previewUrls[index]);
      } catch (e) {
        console.error("释放单张图片URL时出错:", e);
      }
    }
    
    setSelectedFiles(prevFiles => {
      const newFiles = [...prevFiles];
      newFiles.splice(index, 1);
      
      // 更新lastInitialFilesLength以与当前选择保持一致
      setLastInitialFilesLength(newFiles.length);
      
      // 同时更新预览URLs
      setPreviewUrls(prevUrls => {
        const newUrls = [...prevUrls];
        newUrls.splice(index, 1);
        return newUrls;
      });
      
      // 如果提供了onAddMoreFiles回调，通知父组件完整的新文件列表
      if (onAddMoreFiles) {
        // 使用setTimeout避免在渲染周期中调用
        setTimeout(() => {
          console.log("ImageUploader: 通知父组件删除了一张图片");
          onAddMoreFiles(newFiles);
        }, 0);
      }
      
      return newFiles;
    });
  };

  return (
    <div className="space-y-6">
      {/* 添加隐藏的文件上传输入框 */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/gif,image/webp"
        className="hidden"
        onChange={handleFileSelect}
      />
      
      <div className="flex flex-col gap-4">
        {/* 标题和说明 */}
        {!hideTitle && (
          <>
            <div className="text-center">
              <h2 className="text-xl font-bold">Select Images to Convert</h2>
              <p className="text-gray-500">Supports JPG, PNG formats, max 30MB</p>
            </div>
          </>
        )}

        {selectedFiles.length === 0 ? (
          <div
            {...getRootProps()}
            className={cn(
              "border-2 border-dashed rounded-xl p-10 transition-all duration-300 flex flex-col items-center justify-center min-h-[300px]",
              isDragActive 
                ? "border-primary bg-primary/5 scale-[1.02]" 
                : "border-muted-foreground/20 hover:border-muted-foreground/30 hover:bg-muted/20"
            )}
          >
            <input {...getInputProps()} />
            
            {isDragActive ? (
              <div className="flex flex-col items-center gap-4 animate-pulse">
                <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center">
                  <Upload className="h-10 w-10 text-primary" />
                </div>
                <p className="text-xl font-medium text-primary">Release to Upload Images...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-6 max-w-md mx-auto text-center">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                  <FileImage className="h-10 w-10 text-primary" />
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-xl font-medium">Drag and Drop Your Images Here</h3>
                  <p className="text-sm text-muted-foreground">
                    Or use the button below to select images from your device
                  </p>
                </div>
                
                <Button
                  onClick={triggerFileInput}
                  className="px-6"
                  type="button"
                >
                  <ImageIcon className="mr-2 h-4 w-4" />
                  Select Images
                </Button>
                
                <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                  <div className="flex flex-col items-center p-2 rounded-lg border border-border">
                    <span className="font-medium mb-1">Supported Formats</span>
                    <span>JPG, PNG, GIF, WebP</span>
                  </div>
                  <div className="flex flex-col items-center p-2 rounded-lg border border-border">
                    <span className="font-medium mb-1">File Size</span>
                    <span>Max 10MB</span>
                  </div>
                  <div className="flex flex-col items-center p-2 rounded-lg border border-border">
                    <span className="font-medium mb-1">Batch Processing</span>
                    <span>Up to 10</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-medium">Selected {selectedFiles.length} Images</h3>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => clearFiles()}
                >
                  <X className="mr-2 h-4 w-4" />
                  Clear
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={triggerFileInput}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Add More
                </Button>
              </div>
            </div>
            
            <div className={`grid gap-4 ${selectedFiles.length > 1 ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4' : 'grid-cols-1'}`}>
              {selectedFiles.map((file, index) => (
                <Card key={`${file.name}-${index}`} className="overflow-hidden border-muted/40 shadow-sm group relative">
                  <button 
                    className="absolute top-2 right-2 bg-background/80 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    onClick={() => handleRemoveFile(index)}
                    type="button"
                  >
                    <X className="h-4 w-4 text-muted-foreground" />
                  </button>
                  <div className="bg-muted/20 p-2 flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <ImageIcon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium truncate max-w-[120px]">
                        {file.name}
                      </span>
                    </div>
                    <Badge variant="outline" className="bg-background">
                      {getFileType(file)}
                    </Badge>
                  </div>
                  <div className="relative w-full h-[200px]"> {/* 设置固定高度解决高度为0的警告 */}
                    {index < previewUrls.length && previewUrls[index] && renderPreview(previewUrls[index], index)}
                  </div>
                  <div className="p-2 text-xs text-muted-foreground flex justify-between items-center">
                    <span>{formatFileSize(file.size)}</span>
                    {selectedFiles.length > 1 && (
                      <Badge variant="secondary" className="text-xs">
                        {index + 1}/{selectedFiles.length}
                      </Badge>
                    )}
                  </div>
                </Card>
              ))}
            </div>

            <div className="flex justify-center pt-4">
              <Button 
                className="px-8 h-11 text-base" 
                onClick={handleStartProcessing}
                size="lg"
              >
                Process These {selectedFiles.length} Images
              </Button>
            </div>
          </div>
        )}
        
        <div className="text-center text-sm text-muted-foreground">
          <p>All processing is done in the browser, images will not be uploaded to any server</p>
        </div>
      </div>
    </div>
  );
};

export default ImageUploader; 