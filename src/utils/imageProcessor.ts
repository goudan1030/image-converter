export interface ProcessedImage {
  url: string;
  file: File;
  width: number;
  height: number;
  size: number;
  status?: 'success' | 'error';
  error?: string;
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
    try {
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
                status: 'success' as const
              });
            }
          },
          mimeType,
          adjustedQuality
        );
      });
    } catch (error) {
      console.error('图片压缩失败:', error);
      return {
        url: '',
        file: file,
        width: 0,
        height: 0,
        size: file.size,
        status: 'error' as const,
        error: error instanceof Error ? error.message : '未知错误'
      };
    }
  }

  static async compressToTargetSize(
    file: File,
    targetSizeKB: number,
    format: 'original' | 'webp' = 'original'
  ): Promise<ProcessedImage> {
    try {
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
          status: 'success' as const
        };
      }

      // 区分处理不同的图片格式
      const isPNG = file.type === 'image/png';
      const isJPEG = file.type === 'image/jpeg' || file.type === 'image/jpg';
      const isGIF = file.type === 'image/gif';
      const isWebP = file.type === 'image/webp';
      
      // PNG格式和保持原格式的特殊处理
      if (isPNG && format === 'original') {
        // PNG使用无损压缩，质量参数不起作用，需要特殊处理
        console.log("Detected PNG format with original format option");
        
        // 使用递归函数确保达到目标大小
        return this.timeoutPromise(this.resizePngUntilTargetSize(file, targetSizeKB), 60000);
      }
      
      // 如果转换为WebP格式，直接使用WebP的高效压缩
      if (format === 'webp') {
        // WebP格式使用递归压缩方法
        return this.timeoutPromise(this.recursiveCompression(file, targetSizeKB, format), 60000);
      }

      // JPEG等其他格式使用递归压缩确保达到目标大小
      return this.timeoutPromise(this.recursiveCompression(file, targetSizeKB, format), 60000);
    } catch (error) {
      console.error('压缩至目标大小失败:', error);
      return {
        url: '',
        file: file,
        width: 0,
        height: 0,
        size: file.size,
        status: 'error' as const,
        error: error instanceof Error ? 
          error.message : 
          '压缩过程异常，请尝试重新压缩或使用较小的图片'
      };
    }
  }

  // 添加递归压缩方法，确保最终结果小于等于目标大小
  static async recursiveCompression(
    file: File,
    targetSizeKB: number,
    format: 'original' | 'webp' = 'original',
    quality: number = format === 'webp' ? 0.95 : 0.7, // WebP使用更高的初始质量
    attempt: number = 0
  ): Promise<ProcessedImage> {
    if (attempt > 10) {
      console.log(`Maximum compression attempts reached, resorting to resizing`);
      // 如果多次尝试仍然无法达到目标大小，尝试缩小尺寸
      return this.resizeUntilTargetSize(file, targetSizeKB, format);
    }

    console.log(`Compression attempt ${attempt+1} with quality ${quality.toFixed(2)}`);
    
    // 尝试用当前质量压缩
    const result = await this.compressImage(file, quality, format);
    const resultSizeKB = result.size / 1024;
    
    console.log(`Result size: ${resultSizeKB.toFixed(2)}KB, target: ${targetSizeKB}KB`);
    
    // 如果达到目标，返回结果
    if (resultSizeKB <= targetSizeKB) {
      // 检查是否太小 - 如果压缩结果比目标小太多，尝试提高质量
      if (resultSizeKB < targetSizeKB * 0.5 && quality < 0.95) {
        console.log(`Result too small (${resultSizeKB.toFixed(2)}KB), trying higher quality`);
        // 释放当前预览URL以避免内存泄漏
        URL.revokeObjectURL(result.url);
        
        // 提高质量，接近目标大小
        const newQuality = Math.min(0.99, quality * 1.5);
        return this.recursiveCompression(file, targetSizeKB, format, newQuality, attempt + 1);
      }
      
      console.log(`Target size achieved (${resultSizeKB.toFixed(2)}KB), returning result`);
      return result;
    }
    
    // 释放当前预览URL以避免内存泄漏
    URL.revokeObjectURL(result.url);
    
    // 计算新的质量参数 - 使用更智能的调整方法
    let newQuality;
    
    if (attempt === 0) {
      // 首次尝试，使用比例方法估计所需质量，但不要降低太多
      newQuality = Math.max(0.5, quality * (targetSizeKB / resultSizeKB));
      // 对于WebP格式，保持较高的下限
      if (format === 'webp') {
        newQuality = Math.max(0.75, newQuality);
      }
    } else {
      // 后续尝试，更温和地降低质量
      newQuality = Math.max(format === 'webp' ? 0.6 : 0.3, quality * 0.85);
    }
    
    // 递归尝试新的质量参数
    return this.recursiveCompression(file, targetSizeKB, format, newQuality, attempt + 1);
  }

  // 通用的尺寸调整方法，适用于任何格式，确保达到目标大小
  static async resizeUntilTargetSize(
    file: File,
    targetSizeKB: number,
    format: 'original' | 'webp' = 'original',
    initialScale: number = 0.9,  // 默认先缩小到90%
    attemptCount: number = 0     // 添加尝试计数器
  ): Promise<ProcessedImage> {
    try {
      // 防止无限递归
      if (attemptCount > 5) {
        throw new Error('达到最大尝试次数，无法达到目标大小');
      }

      // 加载原始图片
      const img = await this.loadImage(file);
      const originalSize = file.size / 1024;
      
      // 如果文件已经小于目标大小，直接返回
      if (originalSize <= targetSizeKB) {
        return {
          url: URL.createObjectURL(file),
          file: file,
          width: img.width,
          height: img.height,
          size: file.size,
          status: 'success' as const
        };
      }

      // 计算缩放比例 - 使用平方根比例方法
      let scale = Math.min(initialScale, Math.sqrt(targetSizeKB / originalSize));
      console.log(`Resizing from ${originalSize.toFixed(2)}KB to target ${targetSizeKB}KB, scale: ${(scale * 100).toFixed(0)}%`);
      
      // 确保缩放不会太极端
      scale = Math.max(0.1, scale); // 不小于10%的原始尺寸
      
      // 创建canvas并缩放图片
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { alpha: true });
      
      if (!ctx) {
        throw new Error('Failed to get canvas context');
      }
      
      // 设置新尺寸
      canvas.width = Math.max(1, Math.floor(img.width * scale));
      canvas.height = Math.max(1, Math.floor(img.height * scale));
      
      // 使用高质量缩放
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      // 确定mime类型
      const mimeType = format === 'webp' ? 'image/webp' : file.type;
      
      // 创建blob，使用合适的质量 - 提高WebP的默认质量
      return this.timeoutPromise(new Promise((resolve, reject) => {
        let resolved = false;
        
        canvas.toBlob(
          async (blob) => {
            if (resolved) return; // 避免重复处理
            
            try {
              if (!blob) {
                throw new Error('创建图片数据失败');
              }
              
              resolved = true;
              const url = URL.createObjectURL(blob);
              const newFileName = format === 'webp' ? `${file.name.split('.')[0]}.webp` : file.name;
              const newFile = new File([blob], newFileName, {
                type: mimeType,
              });
              
              const result = {
                url,
                file: newFile,
                width: canvas.width,
                height: canvas.height,
                size: newFile.size,
                status: 'success' as const
              };
              
              // 检查结果大小
              const newSizeKB = newFile.size / 1024;
              console.log(`调整大小为 ${newSizeKB.toFixed(2)}KB (目标: ${targetSizeKB}KB)`);
              
              // 如果仍然超过目标大小，再次递归调用缩小
              if (newSizeKB > targetSizeKB) {
                // 释放当前URL避免内存泄漏
                URL.revokeObjectURL(url);
                
                // 使用更激进的缩放比例继续尝试
                const nextScale = Math.min(0.9, Math.sqrt(targetSizeKB / newSizeKB));
                console.log(`仍然超过目标大小，尝试再次缩小: ${(nextScale * 100).toFixed(0)}%`);
                
                // 增加尝试计数
                const recursiveResult = await this.resizeUntilTargetSize(
                  newFile, targetSizeKB, format, nextScale, attemptCount + 1
                );
                resolve(recursiveResult);
              } else if (newSizeKB < targetSizeKB * 0.5 && canvas.width > 100 && canvas.height > 100) {
                // 如果文件太小了（小于目标的50%），尝试增加尺寸获得更好的质量
                // 但要避免尺寸太小的图片被放大
                URL.revokeObjectURL(url);
                
                // 增加尺寸以提高质量
                const upScale = Math.min(1.5, Math.sqrt(targetSizeKB / newSizeKB));
                console.log(`结果太小，尝试增加质量，缩放比例: ${(upScale * 100).toFixed(0)}%`);
                
                // 增加尝试计数
                const upscaledResult = await this.resizeUntilTargetSize(
                  file, targetSizeKB, format, initialScale * upScale, attemptCount + 1
                );
                resolve(upscaledResult);
              } else {
                // 达到目标大小，返回结果
                resolve(result);
              }
            } catch (error) {
              reject(error);
            }
          },
          mimeType,
          format === 'webp' ? 0.92 : 0.85 // 大幅提高webp的默认质量
        );
      }), 20000);
    } catch (error) {
      console.error('调整图片大小失败:', error);
      // 返回错误状态让调用者处理
      return {
        url: '',
        file: file,
        width: 0,
        height: 0,
        size: file.size,
        status: 'error' as const,
        error: error instanceof Error ? error.message : '调整图片大小失败'
      };
    }
  }

  static async resizePngUntilTargetSize(
    file: File,
    targetSizeKB: number,
    initialScale: number = 0.9,  // 默认先缩小到90%
    attemptCount: number = 0     // 添加尝试计数器
  ): Promise<ProcessedImage> {
    try {
      // 防止无限递归
      if (attemptCount > 5) {
        throw new Error('达到最大尝试次数，无法达到目标大小');
      }
      
      // 加载原始图片
      const img = await this.loadImage(file);
      const originalSize = file.size / 1024;
      
      // 如果文件已经小于目标大小，直接返回
      if (originalSize <= targetSizeKB) {
        return {
          url: URL.createObjectURL(file),
          file: file,
          width: img.width,
          height: img.height,
          size: file.size,
          status: 'success' as const
        };
      }

      // 计算缩放比例 - 使用比例缩放根
      let scale = Math.min(initialScale, Math.sqrt(targetSizeKB / originalSize));
      console.log(`Resizing PNG from ${originalSize.toFixed(2)}KB to target ${targetSizeKB}KB, scale: ${(scale * 100).toFixed(0)}%`);
      
      // 确保缩放不会太极端
      scale = Math.max(0.1, scale); // 不小于10%的原始尺寸
      
      // 创建canvas并缩放图片
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { alpha: true });
      
      if (!ctx) {
        throw new Error('Failed to get canvas context');
      }
      
      // 设置新尺寸
      canvas.width = Math.max(1, Math.floor(img.width * scale));
      canvas.height = Math.max(1, Math.floor(img.height * scale));
      
      // 使用高质量缩放
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      // 创建PNG blob
      return this.timeoutPromise(new Promise((resolve, reject) => {
        canvas.toBlob(
          async (blob) => {
            if (blob) {
              const url = URL.createObjectURL(blob);
              const newFile = new File([blob], file.name, {
                type: 'image/png',
              });
              
              const result = {
                url,
                file: newFile,
                width: canvas.width,
                height: canvas.height,
                size: newFile.size,
                status: 'success' as const
              };
              
              // 检查结果大小
              const newSizeKB = newFile.size / 1024;
              console.log(`Resized PNG to ${newSizeKB.toFixed(2)}KB (target: ${targetSizeKB}KB)`);
              
              // 如果仍然超过目标大小，再次递归调用缩小
              if (newSizeKB > targetSizeKB) {
                // 释放当前URL避免内存泄漏
                URL.revokeObjectURL(url);
                
                // 使用更激进的缩放比例继续尝试
                const nextScale = Math.min(0.9, Math.sqrt(targetSizeKB / newSizeKB));
                console.log(`Still above target size, trying again with scale: ${(nextScale * 100).toFixed(0)}%`);
                
                const recursiveResult = await this.resizePngUntilTargetSize(newFile, targetSizeKB, nextScale, attemptCount + 1);
                resolve(recursiveResult);
              } else {
                // 达到目标大小，返回结果
                resolve(result);
              }
            }
          },
          'image/png'
        );
      }), 20000);
    } catch (error) {
      console.error('PNG压缩失败:', error);
      return {
        url: '',
        file: file,
        width: 0,
        height: 0,
        size: file.size,
        status: 'error' as const,
        error: error instanceof Error ? error.message : 'PNG图片处理失败'
      };
    }
  }

  // 添加一个通用的超时Promise包装
  static timeoutPromise<T>(promise: Promise<T>, timeoutMs: number = 30000): Promise<T> {
    return new Promise((resolve, reject) => {
      // 超时计时器
      const timeoutId = setTimeout(() => {
        reject(new Error(`操作超时 (${timeoutMs/1000}秒)`));
      }, timeoutMs);

      // 执行原始Promise
      promise.then(
        (result) => {
          clearTimeout(timeoutId); // 清除超时计时器
          resolve(result);
        },
        (error) => {
          clearTimeout(timeoutId); // 清除超时计时器
          reject(error);
        }
      );
    });
  }

  // 添加取消压缩的方法，用于清理资源
  static cancelCompression(processedImage: ProcessedImage): void {
    if (processedImage.url) {
      try {
        URL.revokeObjectURL(processedImage.url);
      } catch (e) {
        console.warn('释放URL资源失败:', e);
      }
    }
  }
} 