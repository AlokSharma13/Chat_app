import { useState, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Image, Send, X, Loader2, AlertCircle, Check } from 'lucide-react';
import { useChatStore } from '../store/useChatStore';
import { toast } from 'react-hot-toast';
import { useAuthStore } from '../store/useAuthStore';
import ImageUploadAnimated from './ImageUploadAnimated';
import { 
  compressImage, 
  createThumbnail, 
  generateTempId, 
  needsCompression,
  fileToBase64
} from '../utils/imageUtils';

const MessageInput = () => {
  const [text, setText] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isImageUploading, setIsImageUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [optimisticMessages, setOptimisticMessages] = useState(new Map());
  const [processingImage, setProcessingImage] = useState(false);
  
  const typingTimeoutRef = useRef(null);
  const abortControllerRef = useRef(null);
  
  const { 
    sendMessage, 
    selectedUser,
    messages,
    addOptimisticMessage,
    updateOptimisticMessage,
    removeOptimisticMessage
  } = useChatStore();
  const { authUser, socket } = useAuthStore();

  // Optimized image processing
  const handleImageSelect = useCallback(async (file, preview) => {
    try {
      setProcessingImage(true);
      setImageFile(file);
      setImagePreview(preview);
      setUploadError(false);
      
      // Check if compression is needed
      if (needsCompression(file)) {
        // toast.info('Optimizing image for faster upload...');
        // toast('Optimizing image for faster upload...');
        const toastId = toast.loading('Optimizing image for faster upload...');

        try {
          const compressedFile = await compressImage(file, {
            maxSizeMB: 2,
            maxWidthOrHeight: 1920,
            quality: 0.8
          });
          setImageFile(compressedFile);
        } catch (compressionError) {
          console.warn('Image compression failed, using original:', compressionError);
          // Continue with original file if compression fails
        }finally{
          toast.dismiss(toastId);
        }
      }
      
    } catch (error) {
      
      console.error('Image processing failed:', error);
      toast.error('Failed to process image');
      setUploadError(true);
    } finally {
      setProcessingImage(false);
    }
  }, []);
  
  const handleImageRemove = useCallback(() => {
    setImageFile(null);
    setImagePreview(null);
    setIsImageUploading(false);
    setUploadProgress(0);
    setUploadError(false);
    setUploadSuccess(false);
    
    // Cancel any ongoing upload
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  // Enhanced typing indicator with debouncing
  const handleTyping = useCallback(() => {
    if (!selectedUser || !socket) return;
    
    // Emit typing start
    socket.emit("typing", {
      receiverId: selectedUser._id,
      isTyping: true,
      conversationId: `${authUser._id}-${selectedUser._id}`
    });

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set timeout to stop typing after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("typing", {
        receiverId: selectedUser._id,
        isTyping: false,
        conversationId: `${authUser._id}-${selectedUser._id}`
      });
    }, 2000);
  }, [selectedUser, socket, authUser]);

  const handleTextChange = useCallback((e) => {
    setText(e.target.value);
    handleTyping();
  }, [handleTyping]);

  const stopTyping = useCallback(() => {
    if (selectedUser && socket) {
      socket.emit("typing", {
        receiverId: selectedUser._id,
        isTyping: false,
        conversationId: `${authUser._id}-${selectedUser._id}`
      });
    }
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  }, [selectedUser, socket, authUser]);

  // Optimistic message sending with enhanced error handling
  const handleSendMessage = useCallback(async (e) => {
    e.preventDefault();
    if ((!text.trim() && !imageFile) || !selectedUser) return;

    const tempId = generateTempId();
    const messageText = text.trim();
    
    // Stop typing indicator
    stopTyping();

    // Create optimistic message
    const optimisticMessage = {
      _id: tempId,
      senderId: authUser._id,
      receiverId: selectedUser._id,
      text: messageText,
      image: imagePreview || null,
      createdAt: new Date(),
      status: 'sending',
      tempId,
      isOptimistic: true
    };

    // Add optimistic message immediately
    addOptimisticMessage(optimisticMessage);

    // Clear form immediately for better UX
    setText("");
    const currentImageFile = imageFile;
    const currentImagePreview = imagePreview;
    handleImageRemove();

    try {
      // Prepare message data
      const messageData = {
        text: messageText,
        tempId,
        optimisticMessage
      };

      // Handle image upload if present
      if (currentImageFile) {
        setIsImageUploading(true);
        setUploadProgress(0);
        
        // Convert to base64 for upload
        const imageBase64 = await fileToBase64(currentImageFile);
        messageData.image = imageBase64;
        
        // Update optimistic message with uploading status
        updateOptimisticMessage(tempId, {
          ...optimisticMessage,
          status: 'uploading',
          uploadProgress: 0
        });
      }

      // Send message to server
      // The sendMessage function will handle replacing the optimistic message with the real one
      const response = await sendMessage(messageData);
      
      setUploadSuccess(true);
      
    } catch (error) {
      console.error("Failed to send message:", error);
      
      // The sendMessage function will handle updating the optimistic message with error status
      
      // Show error message
      toast.error(error.response?.data?.message || "Failed to send message");
      setUploadError(true);
      
      // Restore form data on error (optional)
      setText(messageText);
      if (currentImagePreview && currentImageFile) {
        setImagePreview(currentImagePreview);
        setImageFile(currentImageFile);
      }
      
    } finally {
      setIsImageUploading(false);
      setUploadProgress(0);
    }
  }, [text, imageFile, imagePreview, selectedUser, authUser, stopTyping, 
      handleImageRemove, sendMessage, addOptimisticMessage, updateOptimisticMessage]);
  // Memoized form submission check
  const canSendMessage = useMemo(() => {
    return (text.trim().length > 0 || imageFile) && !isImageUploading && !processingImage;
  }, [text, imageFile, isImageUploading, processingImage]);

  return (
    <motion.div 
      className="p-4 w-full border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
      initial={false}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
    >
      {/* Enhanced Image Upload Component */}
      <AnimatePresence>
        {!imagePreview && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4"
          >
            <ImageUploadAnimated
              onImageSelect={handleImageSelect}
              onImageRemove={handleImageRemove}
              selectedImage={imagePreview}
              isUploading={isImageUploading}
              uploadProgress={uploadProgress}
              uploadError={uploadError}
              uploadSuccess={uploadSuccess}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Image Preview with Upload Status */}
      <AnimatePresence>
        {imagePreview && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="mb-4"
          >
            <div className="relative inline-block">
              <div className="relative overflow-hidden rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className={`max-w-[200px] max-h-[150px] object-cover transition-all duration-300 ${
                    isImageUploading || processingImage ? 'blur-sm opacity-70' : ''
                  }`}
                />
                
                {/* Processing/Upload Overlay */}
                <AnimatePresence>
                  {(isImageUploading || processingImage) && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center"
                    >
                      <div className="text-center text-white">
                        {processingImage ? (
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="mb-2"
                          >
                            <Loader2 className="w-5 h-5" />
                          </motion.div>
                        ) : (
                          <motion.div className="mb-2">
                            <Upload className="w-5 h-5" />
                          </motion.div>
                        )}
                        
                        {isImageUploading && (
                          <>
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${uploadProgress}%` }}
                              className="w-16 h-1 bg-white rounded-full mx-auto mb-1"
                            />
                            <div className="text-xs">{uploadProgress}%</div>
                          </>
                        )}
                        
                        {processingImage && (
                          <div className="text-xs">Optimizing...</div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Status Indicators */}
                <AnimatePresence>
                  {uploadSuccess && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0 }}
                      className="absolute top-2 right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white"
                    >
                      <Check className="w-3 h-3" />
                    </motion.div>
                  )}
                  
                  {uploadError && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0 }}
                      className="absolute top-2 right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white"
                    >
                      <AlertCircle className="w-3 h-3" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Remove Button */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleImageRemove}
                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors duration-200 shadow-md"
                disabled={isImageUploading}
              >
                <X className="w-3 h-3" />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Message Input Form */}
      <form onSubmit={handleSendMessage} className="flex items-end gap-2">
        <div className="flex-1 min-w-0">
          <div className="relative">
            <input
              type="text"
              className="w-full px-4 py-3 pr-12 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
              placeholder={imageFile ? "Add a caption..." : "Type a message..."}
              value={text}
              onChange={handleTextChange}
              disabled={isImageUploading}
              maxLength={1000}
            />
            
            {/* Image Upload Button (when no image selected) */}
            {!imagePreview && (
              <motion.button
                type="button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => document.querySelector('input[type="file"]')?.click()}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-blue-500 transition-colors duration-200"
                disabled={processingImage}
              >
                {processingImage ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Image className="w-5 h-5" />
                )}
              </motion.button>
            )}
          </div>
        </div>

        {/* Send Button */}
        <motion.button
          type="submit"
          disabled={!canSendMessage}
          whileHover={canSendMessage ? { scale: 1.05 } : {}}
          whileTap={canSendMessage ? { scale: 0.95 } : {}}
          className={`p-3 rounded-2xl transition-all duration-200 ${
            canSendMessage
              ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
          }`}
        >
          {isImageUploading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </motion.button>
      </form>

      {/* Character Count (when approaching limit) */}
      <AnimatePresence>
        {text.length > 800 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className={`text-xs mt-2 text-right ${
              text.length > 950 ? 'text-red-500' : 'text-gray-500'
            }`}
          >
            {text.length}/1000
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default MessageInput
