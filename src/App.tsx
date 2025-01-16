import { useState } from 'react';
import ImageUploader from './components/ImageUploader';
import ImageProcessor from './components/ImageProcessor';

function App() {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);

  const handleImageUpload = (file: File) => {
    setSelectedImage(file);
  };

  const handleReset = () => {
    setSelectedImage(null);
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8">图片处理工具</h1>
        {!selectedImage && <ImageUploader onImageUpload={handleImageUpload} />}
        {selectedImage && (
          <ImageProcessor 
            imageFile={selectedImage}
            onReset={handleReset}
          />
        )}
      </div>
    </div>
  );
}

export default App; 