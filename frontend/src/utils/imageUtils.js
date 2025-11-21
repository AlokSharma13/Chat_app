import imageCompression from 'browser-image-compression';

/**
 * Compress and optimize image for upload
 * @param {File} file - Original image file
 * @param {Object} options - Compression options
 * @returns {Promise<File>} - Compressed image file
 */
export const compressImage = async (file, options = {}) => {
  const defaultOptions = {
    maxSizeMB: 1, // Maximum file size in MB
    maxWidthOrHeight: 1920, // Maximum width or height in pixels
    useWebWorker: true, // Use web worker for better performance
    quality: 0.8, // Image quality (0-1)
    fileType: 'image/jpeg', // Output format
    ...options
  };

  try {
    const compressedFile = await imageCompression(file, defaultOptions);
    
    // Log compression results
    console.log('Compression results:', {
      originalSize: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
      compressedSize: `${(compressedFile.size / 1024 / 1024).toFixed(2)} MB`,
      reductionPercentage: `${((file.size - compressedFile.size) / file.size * 100).toFixed(1)}%`
    });
    
    return compressedFile;
  } catch (error) {
    console.error('Image compression failed:', error);
    throw new Error('Failed to compress image');
  }
};

/**
 * Create optimized thumbnails for images
 * @param {File} file - Original image file
 * @param {number} size - Thumbnail size in pixels
 * @returns {Promise<string>} - Base64 thumbnail data URL
 */
export const createThumbnail = async (file, size = 200) => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      const { width, height } = img;
      const aspectRatio = width / height;
      
      let newWidth, newHeight;
      if (width > height) {
        newWidth = size;
        newHeight = size / aspectRatio;
      } else {
        newHeight = size;
        newWidth = size * aspectRatio;
      }
      
      canvas.width = newWidth;
      canvas.height = newHeight;
      
      ctx.drawImage(img, 0, 0, newWidth, newHeight);
      
      const thumbnailDataUrl = canvas.toDataURL('image/jpeg', 0.7);
      resolve(thumbnailDataUrl);
    };
    
    img.onerror = () => reject(new Error('Failed to create thumbnail'));
    img.src = URL.createObjectURL(file);
  });
};

/**
 * Get image dimensions
 * @param {File} file - Image file
 * @returns {Promise<{width: number, height: number}>} - Image dimensions
 */
export const getImageDimensions = async (file) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight
      });
    };
    
    img.onerror = () => reject(new Error('Failed to get image dimensions'));
    img.src = URL.createObjectURL(file);
  });
};

/**
 * Check if image needs compression
 * @param {File} file - Image file
 * @param {number} maxSize - Maximum size in bytes
 * @returns {boolean} - Whether compression is needed
 */
export const needsCompression = (file, maxSize = 2 * 1024 * 1024) => {
  return file.size > maxSize;
};

/**
 * Generate a unique ID for temporary messages
 * @returns {string} - Unique temporary ID
 */
export const generateTempId = () => {
  return `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Convert file to base64 data URL
 * @param {File} file - File to convert
 * @returns {Promise<string>} - Base64 data URL
 */
export const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Failed to convert file to base64'));
    reader.readAsDataURL(file);
  });
};

/**
 * Create a blurred placeholder for images
 * @param {File} file - Original image file
 * @param {number} blur - Blur amount (default: 10)
 * @returns {Promise<string>} - Blurred image data URL
 */
export const createBlurredPlaceholder = async (file, blur = 10) => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      const size = 40; // Small size for blur effect
      canvas.width = size;
      canvas.height = size;
      
      // Apply blur filter
      ctx.filter = `blur(${blur}px)`;
      ctx.drawImage(img, 0, 0, size, size);
      
      const blurredDataUrl = canvas.toDataURL('image/jpeg', 0.3);
      resolve(blurredDataUrl);
    };
    
    img.onerror = () => reject(new Error('Failed to create blurred placeholder'));
    img.src = URL.createObjectURL(file);
  });
};

/**
 * Progressive image loading utility
 */
export class ProgressiveImage {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      className: 'progressive-image',
      placeholderClass: 'progressive-image-placeholder',
      loadedClass: 'progressive-image-loaded',
      ...options
    };
  }
  
  load(lowQualitySrc, highQualitySrc) {
    return new Promise((resolve, reject) => {
      // Create placeholder image
      const placeholder = document.createElement('img');
      placeholder.src = lowQualitySrc;
      placeholder.className = this.options.placeholderClass;
      placeholder.style.filter = 'blur(5px)';
      placeholder.style.transition = 'all 0.3s ease';
      
      this.container.appendChild(placeholder);
      
      // Load high quality image
      const highQualityImg = new Image();
      highQualityImg.onload = () => {
        highQualityImg.className = this.options.loadedClass;
        highQualityImg.style.opacity = '0';
        highQualityImg.style.transition = 'opacity 0.3s ease';
        
        this.container.appendChild(highQualityImg);
        
        // Fade in high quality image
        requestAnimationFrame(() => {
          highQualityImg.style.opacity = '1';
          placeholder.style.opacity = '0';
          
          setTimeout(() => {
            if (placeholder.parentNode) {
              placeholder.parentNode.removeChild(placeholder);
            }
            resolve(highQualityImg);
          }, 300);
        });
      };
      
      highQualityImg.onerror = reject;
      highQualityImg.src = highQualitySrc;
    });
  }
}

/**
 * Image upload queue manager for handling multiple uploads
 */
export class ImageUploadQueue {
  constructor(options = {}) {
    this.queue = [];
    this.processing = false;
    this.maxConcurrent = options.maxConcurrent || 3;
    this.onProgress = options.onProgress || (() => {});
    this.onComplete = options.onComplete || (() => {});
    this.onError = options.onError || (() => {});
  }
  
  add(file, uploadFn) {
    const id = generateTempId();
    const item = {
      id,
      file,
      uploadFn,
      status: 'queued',
      progress: 0
    };
    
    this.queue.push(item);
    this.processQueue();
    
    return id;
  }
  
  async processQueue() {
    if (this.processing || this.queue.length === 0) return;
    
    this.processing = true;
    const processing = [];
    
    while (processing.length < this.maxConcurrent && this.queue.length > 0) {
      const item = this.queue.shift();
      if (item) {
        processing.push(this.processItem(item));
      }
    }
    
    await Promise.allSettled(processing);
    this.processing = false;
    
    if (this.queue.length > 0) {
      this.processQueue();
    }
  }
  
  async processItem(item) {
    try {
      item.status = 'processing';
      this.onProgress(item.id, 0);
      
      const result = await item.uploadFn(item.file, (progress) => {
        item.progress = progress;
        this.onProgress(item.id, progress);
      });
      
      item.status = 'completed';
      item.result = result;
      this.onComplete(item.id, result);
      
    } catch (error) {
      item.status = 'error';
      item.error = error;
      this.onError(item.id, error);
    }
  }
  
  remove(id) {
    const index = this.queue.findIndex(item => item.id === id);
    if (index > -1) {
      this.queue.splice(index, 1);
    }
  }
  
  clear() {
    this.queue = [];
  }
  
  getStatus() {
    const queued = this.queue.filter(item => item.status === 'queued').length;
    const processing = this.queue.filter(item => item.status === 'processing').length;
    const completed = this.queue.filter(item => item.status === 'completed').length;
    const errors = this.queue.filter(item => item.status === 'error').length;
    
    return { queued, processing, completed, errors, total: this.queue.length };
  }
}