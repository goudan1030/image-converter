import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

interface ImageUploaderProps {
  onImageUpload: (file: File) => void;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageUpload }) => {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles && acceptedFiles.length > 0) {
      onImageUpload(acceptedFiles[0]);
    }
  }, [onImageUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif']
    },
    multiple: false
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
        <p className="text-gray-600">点击或拖放图片到这里上传</p>
      )}
    </div>
  );
};

export default ImageUploader; 