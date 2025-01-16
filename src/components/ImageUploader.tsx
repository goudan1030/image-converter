import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

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
    <div
      {...getRootProps()}
      className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-gray-400 transition-colors"
    >
      <input {...getInputProps()} />
      {isDragActive ? (
        <p className="text-gray-600">将图片拖放到这里...</p>
      ) : (
        <div className="space-y-2">
          <p className="text-gray-600">点击或拖放图片到这里上传</p>
          <p className="text-sm text-gray-500">支持多张图片同时上传（最多10张）</p>
          <p className="text-sm text-gray-500">支持 JPG、PNG、GIF、WebP 格式</p>
          <p className="text-sm text-gray-500">单个文件大小不超过10MB</p>
        </div>
      )}
    </div>
  );
};

export default ImageUploader; 