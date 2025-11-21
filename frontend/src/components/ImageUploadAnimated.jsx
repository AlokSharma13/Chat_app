import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, Check, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

const ImageUploadAnimated = ({
  onImageSelect,
  onImageRemove,
  selectedImage,
  isUploading = false,
  uploadProgress = 0,
  uploadError = false,
  uploadSuccess = false,
  maxSize = 10 * 1024 * 1024,
  acceptedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
}) => {
  const fileInputRef = useRef(null);
  const [imagePreview, setImagePreview] = useState(selectedImage);

  const handleImageSelect = useCallback(
    (file) => {
      if (!acceptedTypes.includes(file.type)) {
        toast.error('Please select a supported image format (JPEG, PNG, GIF, WebP)');
        return;
      }

      if (file.size > maxSize) {
        toast.error(`Image size must be less than ${Math.round(maxSize / 1024 / 1024)}MB`);
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result;
        setImagePreview(result);
        onImageSelect(file, result);
      };
      reader.readAsDataURL(file);
    },
    [acceptedTypes, maxSize, onImageSelect]
  );

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) handleImageSelect(file);
  };

  const removeImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    onImageRemove();
  };

  const getUploadStatusIcon = () => {
    if (uploadError) return <AlertCircle className="w-5 h-5 text-red-500" />;
    if (uploadSuccess) return <Check className="w-5 h-5 text-green-500" />;
    if (isUploading)
      return (
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
          <Upload className="w-5 h-5 text-blue-500" />
        </motion.div>
      );
    return null;
  };

  return (
    <div className="relative inline-block">
      <AnimatePresence>
        {imagePreview && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -20 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="relative group"
          >
            <div className="relative overflow-hidden rounded-xl border-2 border-gray-200 dark:border-gray-700">
              <img
                src={imagePreview}
                alt="Preview"
                className={`max-w-[200px] max-h-[150px] object-cover transition-all duration-300 ${
                  isUploading ? 'blur-sm opacity-70' : ''
                }`}
              />

              {/* Upload overlay */}
              {isUploading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center"
                >
                  <div className="text-center text-white">
                    {getUploadStatusIcon()}
                    <div className="w-20 h-1 bg-white rounded-full mx-auto my-1">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${uploadProgress}%` }}
                        transition={{ duration: 0.3 }}
                        className="h-1 bg-white rounded-full"
                      />
                    </div>
                    <div className="text-xs">{uploadProgress}%</div>
                  </div>
                </motion.div>
              )}

              {/* Success/Error indicators */}
              {(uploadSuccess || uploadError) && (
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0 }}
                  className={`absolute top-2 right-2 p-1 rounded-full ${
                    uploadSuccess ? 'bg-green-500' : 'bg-red-500'
                  } text-white`}
                >
                  {getUploadStatusIcon()}
                </motion.div>
              )}
            </div>

            {/* Remove button */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={removeImage}
              className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-md"
              disabled={isUploading}
            >
              <X className="w-3 h-3" />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedTypes.join(',')}
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
};

export default ImageUploadAnimated;
