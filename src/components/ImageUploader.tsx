import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent } from "@/components/ui/card";
import { Upload } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageUploaderProps {
  onImageUpload: (files: File[]) => void;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageUpload }) => {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles && acceptedFiles.length > 0) {
      onImageUpload(acceptedFiles);
    }
  }, [onImageUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
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
  });

  return (
    <Card>
      <CardContent className="pt-6">
        <div
          {...getRootProps()}
          className={cn(
            "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
            isDragActive 
              ? "border-primary bg-primary/5" 
              : "border-muted hover:border-muted-foreground/50"
          )}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center gap-2">
            <Upload className="h-10 w-10 text-muted-foreground" />
            {isDragActive ? (
              <p className="text-primary">将图片拖放到这里...</p>
            ) : (
              <>
                <p className="text-lg font-medium">点击或拖放图片到这里上传</p>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>支持多张图片同时上传（最多10张）</p>
                  <p>支持 JPG、PNG、GIF、WebP 格式</p>
                  <p>单个文件大小不超过10MB</p>
                </div>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ImageUploader; 