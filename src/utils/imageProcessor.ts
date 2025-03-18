export interface ProcessedImage {
  url: string;
  file: File;
  width: number;
  height: number;
  size: number;
}

export class ImageProcessor {
  static async loadImage(file: File): Promise<ImageBitmap> {
    return createImageBitmap(file);
  }

  static async compressImage(
    file: File,
    quality: number = 0.7,
    format: 'original' | 'webp' = 'original'
  ): Promise<ProcessedImage> {
    const img = await this.loadImage(file);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', {
      willReadFrequently: true,
      alpha: true
    });

    if (!ctx) {
      throw new Error('无法获取 canvas context');
    }

    // 使用 ImageBitmap 的原始尺寸
    canvas.width = img.width;
    canvas.height = img.height;

    // 使用 ImageBitmap 的渲染方法
    ctx.imageSmoothingEnabled = false; // 禁用平滑处理
    ctx.drawImage(img, 0, 0);

    const mimeType = format === 'webp' ? 'image/webp' : file.type;
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
    // 如果原始文件已经小于目标大小，直接返回
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

    // 设置质量搜索范围
    let minQuality = 0.01; // 最低质量
    let maxQuality = 1;
    let attempt = 0;
    let result: ProcessedImage;
    let bestResult: ProcessedImage | null = null;
    let bestQuality = 0;

    // 二分搜索寻找适合的质量参数
    do {
      const currentQuality = (minQuality + maxQuality) / 2;
      result = await this.compressImage(file, currentQuality, format);
      
      if (result.size > targetSizeKB * 1024) {
        maxQuality = currentQuality;
      } else {
        minQuality = currentQuality;
        if (!bestResult || result.size > bestResult.size) {
          bestResult = result;
          bestQuality = currentQuality;
        }
      }
      
      if (Math.abs(maxQuality - minQuality) < 0.01) {
        break;
      }
      
      attempt++;
    } while (attempt < 15); // 增加尝试次数以获得更精确的结果

    // 如果找到合适的质量参数，返回结果
    if (bestResult && bestResult.size <= targetSizeKB * 1024) {
      console.log(`通过调整质量成功压缩到 ${(bestResult.size / 1024).toFixed(2)}KB，质量: ${bestQuality.toFixed(2)}`);
      return bestResult;
    }
    
    // 如果二分搜索未能达到目标，使用最低质量再尝试一次
    console.log(`无法达到目标大小，使用最低质量压缩`);
    result = await this.compressImage(file, 0.01, format);
    
    // 返回最终结果，即使可能未达到目标大小
    console.log(`最终压缩结果: ${(result.size / 1024).toFixed(2)}KB，保持原始尺寸 ${result.width}x${result.height}`);
    return result;
  }
} 