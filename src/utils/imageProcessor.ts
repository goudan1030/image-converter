export interface ProcessedImage {
  url: string;
  file: File;
  width: number;
  height: number;
  size: number;
}

export interface CompressionOptions {
  targetSizeKB?: number;
  quality?: number;
  format?: 'original' | 'webp';
}

export class ImageProcessor {
  static async loadImage(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }

  static async resizeImage(
    file: File,
    maxWidth: number,
    maxHeight: number
  ): Promise<ProcessedImage> {
    const img = await this.loadImage(file);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    let width = img.width;
    let height = img.height;

    if (width > maxWidth || height > maxHeight) {
      const ratio = Math.min(maxWidth / width, maxHeight / height);
      width *= ratio;
      height *= ratio;
    }

    canvas.width = width;
    canvas.height = height;
    ctx?.drawImage(img, 0, 0, width, height);

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const newFile = new File([blob], file.name, {
            type: file.type,
          });

          resolve({
            url,
            file: newFile,
            width,
            height,
            size: newFile.size,
          });
        }
      }, file.type);
    });
  }

  static async compressImage(
    file: File,
    quality: number = 0.7,
    format: 'original' | 'webp' = 'original'
  ): Promise<ProcessedImage> {
    const img = await this.loadImage(file);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    canvas.width = img.width;
    canvas.height = img.height;
    ctx?.drawImage(img, 0, 0);

    const mimeType = format === 'webp' ? 'image/webp' : file.type;
    const extension = format === 'webp' ? '.webp' : file.name.split('.').pop();
    const newFileName = format === 'webp' 
      ? `${file.name.split('.')[0]}.webp`
      : file.name;

    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            const newFile = new File([blob], newFileName, {
              type: mimeType,
            });

            resolve({
              url,
              file: newFile,
              width: img.width,
              height: img.height,
              size: newFile.size,
            });
          }
        },
        mimeType,
        quality
      );
    });
  }

  static async compressToTargetSize(
    file: File,
    targetSizeKB: number,
    format: 'original' | 'webp' = 'original'
  ): Promise<ProcessedImage> {
    let minQuality = 0.1;
    let maxQuality = 1;
    let attempt = 0;
    let result: ProcessedImage;
    
    if (file.size <= targetSizeKB * 1024) {
      const img = await this.loadImage(file);
      return {
        url: URL.createObjectURL(file),
        file: file,
        width: img.width,
        height: img.height,
        size: file.size,
      };
    }

    const originalImage = await this.loadImage(file);
    let resizedFile = file;
    
    if (originalImage.width > 1920 || originalImage.height > 1920) {
      const resizeResult = await this.resizeImage(file, 1920, 1920);
      resizedFile = resizeResult.file;
    }

    do {
      const currentQuality = (minQuality + maxQuality) / 2;
      result = await this.compressImage(resizedFile, currentQuality, format);
      
      if (result.size > targetSizeKB * 1024) {
        maxQuality = currentQuality;
      } else {
        minQuality = currentQuality;
      }
      
      if (Math.abs(result.size - targetSizeKB * 1024) < 1024 ||
          (maxQuality - minQuality) < 0.01) {
        break;
      }
      
      attempt++;
    } while (attempt < 10);

    if (result.size > targetSizeKB * 1024) {
      const scale = Math.sqrt(targetSizeKB * 1024 / result.size);
      const finalWidth = Math.floor(result.width * scale);
      const finalHeight = Math.floor(result.height * scale);
      
      result = await this.resizeImage(result.file, finalWidth, finalHeight);
      if (result.size > targetSizeKB * 1024) {
        result = await this.compressImage(result.file, 0.5, format);
      }
    }

    return result;
  }
} 