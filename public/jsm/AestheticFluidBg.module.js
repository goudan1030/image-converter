/**
 * AestheticFluidBg.module.js
 * A module that creates a fluid, aesthetic background animation
 */

class AestheticFluidBg {
  constructor(options = {}) {
    // Default settings
    this.settings = {
      dom: options.dom || null,
      colors: options.colors || ["#FDFDFD", "#DDDDDD", "#BBBBBB", "#555555", "#343434", "#010101"],
      loop: options.loop !== undefined ? options.loop : true,
      speed: options.speed || 0.005,
      amplitude: options.amplitude || 0.1,
      frequency: options.frequency || 0.5,
      resolution: options.resolution || 150
    };

    // 确保颜色数组至少有两个颜色
    if (!Array.isArray(this.settings.colors) || this.settings.colors.length < 2) {
      console.warn('Invalid colors array, using default colors');
      this.settings.colors = ["#FDFDFD", "#DDDDDD", "#BBBBBB", "#555555", "#343434", "#010101"];
    }

    // Canvas setup
    this.canvas = null;
    this.ctx = null;
    this.points = [];
    this.targetPoints = [];
    this.time = 0;
    this.animationFrame = null;
    this.resizeTimeout = null;
    this.width = 0;
    this.height = 0;

    // Initialize if DOM element is provided
    if (this.settings.dom) {
      this.init();
    }
  }

  init() {
    try {
      // Get container element
      this.container = document.getElementById(this.settings.dom);
      if (!this.container) {
        console.error(`Element with ID "${this.settings.dom}" not found.`);
        return;
      }
      
      // Create canvas
      this.canvas = document.createElement('canvas');
      this.ctx = this.canvas.getContext('2d');
      this.container.appendChild(this.canvas);
      
      // Set canvas to fill container
      this.canvas.style.position = 'absolute';
      this.canvas.style.top = 0;
      this.canvas.style.left = 0;
      this.canvas.style.width = '100%';
      this.canvas.style.height = '100%';
      this.canvas.style.zIndex = '-1';
      
      // Set container to relative position if not positioned
      const containerStyle = window.getComputedStyle(this.container);
      if (containerStyle.position === 'static') {
        this.container.style.position = 'relative';
      }
      
      // Resize and start animation
      this.resize();
      window.addEventListener('resize', this.handleResize.bind(this));
      
      if (this.settings.loop) {
        this.animate();
      } else {
        this.draw();
      }
    } catch (err) {
      console.error('Error initializing AestheticFluidBg:', err);
    }
  }

  resize() {
    try {
      this.width = this.container.clientWidth;
      this.height = this.container.clientHeight;
      
      this.canvas.width = this.width;
      this.canvas.height = this.height;
      
      // Initialize points grid
      this.initPoints();
    } catch (err) {
      console.error('Error in resize:', err);
    }
  }

  handleResize() {
    // Debounce resize events
    clearTimeout(this.resizeTimeout);
    this.resizeTimeout = setTimeout(() => {
      this.resize();
    }, 200);
  }

  initPoints() {
    try {
      this.points = [];
      this.targetPoints = [];
      
      const numX = Math.ceil(this.width / this.settings.resolution) + 1;
      const numY = Math.ceil(this.height / this.settings.resolution) + 1;
      
      for (let y = 0; y < numY; y++) {
        for (let x = 0; x < numX; x++) {
          // Create main points grid
          this.points.push({
            x: x * this.settings.resolution,
            y: y * this.settings.resolution,
            originX: x * this.settings.resolution,
            originY: y * this.settings.resolution,
            offsetX: 0,
            offsetY: 0
          });
          
          // Create target points for animations
          this.targetPoints.push({
            offsetX: (Math.random() * 2 - 1) * this.settings.amplitude * this.settings.resolution,
            offsetY: (Math.random() * 2 - 1) * this.settings.amplitude * this.settings.resolution
          });
        }
      }
    } catch (err) {
      console.error('Error in initPoints:', err);
    }
  }

  animate() {
    try {
      this.time += this.settings.speed;
      this.updatePoints();
      this.draw();
      
      this.animationFrame = requestAnimationFrame(this.animate.bind(this));
    } catch (err) {
      console.error('Error in animate:', err);
      this.pause(); // 错误时停止动画
    }
  }

  updatePoints() {
    try {
      // Update points based on time and target positions
      for (let i = 0; i < this.points.length; i++) {
        const point = this.points[i];
        const target = this.targetPoints[i];
        
        if (!point || !target) continue;
        
        // Calculate new offsets with noise
        const noiseFactor = Math.sin(this.time * this.settings.frequency + i * 0.1);
        point.offsetX = noiseFactor * target.offsetX;
        point.offsetY = noiseFactor * target.offsetY;
        
        // Update actual point position
        point.x = point.originX + point.offsetX;
        point.y = point.originY + point.offsetY;
      }

      // Regenerate targets periodically
      if (Math.random() < 0.01) {
        for (let i = 0; i < this.targetPoints.length; i++) {
          const target = this.targetPoints[i];
          if (!target) continue;
          
          target.offsetX = (Math.random() * 2 - 1) * this.settings.amplitude * this.settings.resolution;
          target.offsetY = (Math.random() * 2 - 1) * this.settings.amplitude * this.settings.resolution;
        }
      }
    } catch (err) {
      console.error('Error in updatePoints:', err);
    }
  }

  draw() {
    if (!this.ctx) return;
    
    try {
      // Clear canvas
      this.ctx.clearRect(0, 0, this.width, this.height);
      
      // Find grid dimensions
      const numX = Math.ceil(this.width / this.settings.resolution) + 1;
      const numY = Math.ceil(this.height / this.settings.resolution) + 1;
      
      // 确保颜色数组可用
      if (!Array.isArray(this.settings.colors) || this.settings.colors.length < 2) {
        this.settings.colors = ["#FDFDFD", "#343434"]; // 安全的默认值
      }
      
      // Draw gradient background
      const gradient = this.ctx.createLinearGradient(0, 0, this.width, this.height);
      this.settings.colors.forEach((color, i) => {
        if (color) { // 只有在颜色有效时才添加
          gradient.addColorStop(i / (this.settings.colors.length - 1), color);
        }
      });
      
      this.ctx.fillStyle = gradient;
      this.ctx.fillRect(0, 0, this.width, this.height);
      
      // Draw fluid effect
      for (let y = 0; y < numY - 1; y++) {
        for (let x = 0; x < numX - 1; x++) {
          const index = y * numX + x;
          
          const p1 = this.points[index];
          const p2 = this.points[index + 1];
          const p3 = this.points[index + numX];
          const p4 = this.points[index + numX + 1];
          
          if (p1 && p2 && p3 && p4) {
            // Create a smooth gradient for each cell
            const cellGradient = this.ctx.createLinearGradient(
              p1.x, p1.y, 
              p4.x, p4.y
            );
            
            // 安全地获取颜色
            const colorIndex = Math.floor(((p1.y / this.height) * (this.settings.colors.length - 1)));
            const safeIndex = Math.max(0, Math.min(colorIndex, this.settings.colors.length - 1));
            const safeIndex2 = Math.max(0, Math.min(colorIndex + 1, this.settings.colors.length - 1));
            
            // 确保颜色存在，否则使用默认色
            const color1 = this.settings.colors[safeIndex] || "#FDFDFD";
            const color2 = this.settings.colors[safeIndex2] || "#343434";
            
            cellGradient.addColorStop(0, color1);
            cellGradient.addColorStop(1, color2);
            
            this.ctx.beginPath();
            this.ctx.moveTo(p1.x, p1.y);
            this.ctx.lineTo(p2.x, p2.y);
            this.ctx.lineTo(p4.x, p4.y);
            this.ctx.lineTo(p3.x, p3.y);
            this.ctx.closePath();
            
            this.ctx.fillStyle = cellGradient;
            this.ctx.fill();
          }
        }
      }
    } catch (err) {
      console.error('Error in draw:', err);
    }
  }

  play() {
    if (!this.animationFrame && this.canvas) {
      this.animate();
    }
  }

  pause() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
  }

  destroy() {
    try {
      this.pause();
      window.removeEventListener('resize', this.handleResize.bind(this));
      
      if (this.canvas && this.canvas.parentNode) {
        this.canvas.parentNode.removeChild(this.canvas);
      }
      
      this.canvas = null;
      this.ctx = null;
      this.points = [];
      this.targetPoints = [];
    } catch (err) {
      console.error('Error in destroy:', err);
    }
  }
}

// 使模块同时兼容ESM和浏览器全局对象
if (typeof window !== 'undefined') {
  window.AestheticFluidBg = AestheticFluidBg;
}

// 保留ESM导出兼容性
if (typeof exports !== 'undefined') {
  exports.AestheticFluidBg = AestheticFluidBg;
} 