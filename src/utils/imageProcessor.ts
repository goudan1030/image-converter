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
      throw new Error('Failed to get canvas context');
    }

    // 使用 ImageBitmap 的原始尺寸
    canvas.width = img.width;
    canvas.height = img.height;

    // 使用 ImageBitmap 的渲染方法
    ctx.imageSmoothingEnabled = false; // 禁用平滑处理
    ctx.drawImage(img, 0, 0);

    // 确保正确处理原始格式
    const mimeType = format === 'webp' ? 'image/webp' : file.type;
    
    // 确保文件名扩展名匹配实际格式
    let newFileName;
    if (format === 'webp') {
      newFileName = `${file.name.split('.')[0]}.webp`;
    } else {
      // 保留原始文件名，确保扩展名正确
      newFileName = file.name;
    }

    // 根据不同的图片格式调整质量参数的含义
    // JPEG和WebP的质量参数范围是0-1
    // PNG的质量参数无效，但我们需要保持高质量压缩
    const adjustedQuality = mimeType === 'image/png' ? undefined : quality;

    console.log(`Compressing image: format=${mimeType}, quality=${adjustedQuality}, size=${img.width}x${img.height}`);

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
        adjustedQuality
      );
    });
  }

  static async compressToTargetSize(
    file: File,
    targetSizeKB: number,
    format: 'original' | 'webp' = 'original'
  ): Promise<ProcessedImage> {
    console.log(`Starting compression to target size: ${targetSizeKB}KB, original size: ${(file.size/1024).toFixed(2)}KB, format: ${format === 'original' ? file.type : 'webp'}`);
    
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

    // 区分处理不同的图片格式
    const isPNG = file.type === 'image/png';
    const isGIF = file.type === 'image/gif';
    
    // 设置质量搜索范围
    let minQuality = 0.01; // 最低质量
    let maxQuality = 1;    // 最高质量
    
    // PNG处理特殊调整
    if (isPNG && format === 'original') {
      // PNG使用无损压缩，质量参数不起作用，需要特殊处理
      console.log("Detected PNG format, trying to compress while maintaining original quality");
      
      const img = await this.loadImage(file);
      const result = await this.compressImage(file, undefined, format);
      
      // 如果使用无损压缩达不到目标大小，可以尝试转换为带有alpha通道的JPEG
      if (result.size > targetSizeKB * 1024) {
        console.log("PNG lossless compression cannot reach target size, trying other compression methods...");
      } else {
        console.log(`Successfully compressed PNG to ${(result.size / 1024).toFixed(2)}KB`);
        return result;
      }
    }
    
    // GIF需要特殊处理，因为GIF可能是动画
    if (isGIF && format === 'original') {
      console.log("Detected GIF format, keeping original format may not compress effectively");
    }

    let attempt = 0;
    let result: ProcessedImage;
    let bestResult: ProcessedImage | null = null;
    let bestQuality = 0;

    // 二分搜索寻找适合的质量参数
    do {
      const currentQuality = (minQuality + maxQuality) / 2;
      result = await this.compressImage(file, currentQuality, format);
      
      console.log(`Trying quality: ${currentQuality.toFixed(2)}, result size: ${(result.size / 1024).toFixed(2)}KB, target: ${targetSizeKB}KB`);
      
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
      console.log(`Successfully compressed to ${(bestResult.size / 1024).toFixed(2)}KB with quality: ${bestQuality.toFixed(2)}`);
      return bestResult;
    }
    
    // 对于PNG特殊情况，如果保持原格式无法达到目标大小
    if (isPNG && format === 'original' && (!bestResult || bestResult.size > targetSizeKB * 1024)) {
      console.log("PNG cannot reach target size through normal compression, trying to resize...");
      // 尝试缩小图片尺寸来满足大小要求
      const img = await this.loadImage(file);
      
      // 计算需要的缩小比例
      const originalSize = file.size / 1024;
      const scale = Math.sqrt(targetSizeKB / originalSize);
      console.log(`Trying to scale image to ${(scale * 100).toFixed(0)}% of original size`);
      
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { alpha: true });
      
      if (!ctx) {
        throw new Error('Failed to get canvas context');
      }
      
      // 设置新尺寸
      canvas.width = Math.max(1, Math.floor(img.width * scale));
      canvas.height = Math.max(1, Math.floor(img.height * scale));
      
      // 绘制缩小后的图像
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      // 创建PNG blob
      return new Promise((resolve) => {
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const url = URL.createObjectURL(blob);
              const newFile = new File([blob], file.name, {
                type: 'image/png',
              });
              
              resolve({
                url,
                file: newFile,
                width: canvas.width,
                height: canvas.height,
                size: newFile.size,
              });
            }
          },
          'image/png'
        );
      });
    }
    
    // 如果二分搜索未能达到目标，使用最低质量再尝试一次
    console.log(`Cannot reach target size, using lowest quality compression`);
    result = await this.compressImage(file, 0.01, format);
    
    // 返回最终结果，即使可能未达到目标大小
    console.log(`Final compression result: ${(result.size / 1024).toFixed(2)}KB, maintaining original dimensions ${result.width}x${result.height}`);
    return result;
  }
} 