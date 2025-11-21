import { useEffect, useState } from 'react';
import { Upload, Check, X } from 'lucide-react';

const UploadProgress = ({ 
  isUploading, 
  progress = 0, 
  onCancel, 
  fileName = "image.jpg",
  isSuccess = false,
  isError = false 
}) => {
  const [showProgress, setShowProgress] = useState(false);

  useEffect(() => {
    if (isUploading) {
      setShowProgress(true);
    } else if (isSuccess || isError) {
      // Hide after a short delay when upload completes
      const timer = setTimeout(() => {
        setShowProgress(false);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isUploading, isSuccess, isError]);

  if (!showProgress) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 z-50">
      <div className="bg-base-100 border border-base-300 rounded-lg shadow-lg p-3 animate-slide-up">
        <div className="flex items-center gap-3">
          {/* Upload Icon */}
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            isError ? 'bg-error/20' : isSuccess ? 'bg-success/20' : 'bg-primary/20'
          }`}>
            {isError ? (
              <X className="w-4 h-4 text-error" />
            ) : isSuccess ? (
              <Check className="w-4 h-4 text-success" />
            ) : (
              <Upload className="w-4 h-4 text-primary animate-pulse" />
            )}
          </div>

          {/* File Info */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{fileName}</p>
            <p className="text-xs text-base-content/70">
              {isError ? 'Upload failed' : isSuccess ? 'Upload complete' : 'Uploading...'}
            </p>
          </div>

          {/* Cancel Button (only show when uploading) */}
          {isUploading && onCancel && (
            <button
              onClick={onCancel}
              className="w-6 h-6 rounded-full bg-base-200 hover:bg-base-300 flex items-center justify-center transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Progress Bar */}
        {isUploading && (
          <div className="mt-3">
            <div className="w-full bg-base-200 rounded-full h-1.5 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-primary to-primary-focus rounded-full transition-all duration-300 ease-out relative"
                style={{ width: `${progress}%` }}
              >
                {/* Animated shimmer effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
              </div>
            </div>
            <p className="text-xs text-base-content/70 mt-1">{Math.round(progress)}%</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadProgress;
