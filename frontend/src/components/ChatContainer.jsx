import {useChatStore} from '../store/useChatStore';
import {useEffect,useRef, useState, useMemo, memo} from 'react';
import {motion, AnimatePresence} from 'framer-motion';
import ChatHeader from './ChatHeader';
import MessageInput from './MessageInput';
import MessageSkeleton from './skeletons/MessageSkeleton';
import {useAuthStore} from '../store/useAuthStore';
import {formatMessageTime} from '../lib/utils';
import ImageModal from './ImageModal';
import NotificationBubble from './NotificationBubble';
import MessageDeleteModal from './MessageDeleteModal';
import TypingIndicator from './TypingIndicator';
import { Download, Trash2, Eye, Clock, AlertCircle, Check, CheckCheck } from 'lucide-react';

// Message status indicator component
const MessageStatus = memo(({ message, authUser }) => {
  if (message.senderId !== authUser._id) return null;
  
  const getStatusIcon = () => {
    switch (message.status) {
      case 'sending':
        return <Clock className="w-3 h-3 text-gray-400" />;
      case 'uploading':
        return <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Clock className="w-3 h-3 text-blue-400" />
        </motion.div>;
      case 'failed':
        return <AlertCircle className="w-3 h-3 text-red-500" />;
      case 'sent':
        return <Check className="w-3 h-3 text-gray-500" />;
      case 'delivered':
        return <CheckCheck className="w-3 h-3 text-gray-500" />;
      case 'read':
        return <CheckCheck className="w-3 h-3 text-blue-500" />;
      default:
        return <Check className="w-3 h-3 text-gray-400" />;
    }
  };

  return (
    <div className="flex items-center justify-end mt-1">
      {getStatusIcon()}
      {message.status === 'failed' && (
        <span className="text-xs text-red-500 ml-1">Failed to send</span>
      )}
    </div>
  );
});

const ChatContainer = () => {
  const {
    messages, // Now unified array with both optimistic and confirmed messages
    getMessages, 
    isMessagesLoading, 
    selectedUser,
    setSelectedUser,
    subscribeToMessages,
    unsubscribeFromMessages, 
    deleteMessage,
    showNotification,
    notificationData,
    hideNotification,
    clearUnreadCount,
    clearUnreadCountForUser,
    users,
    isTyping,
    typingUser,
    clearOptimisticMessages
  } = useChatStore();
  const {authUser} = useAuthStore();
  const messageEndRef = useRef(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Messages are already unified, just ensure they're sorted by creation time
  const sortedMessages = useMemo(() => {
    return [...messages].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  }, [messages]);

  useEffect(() => {
    if (selectedUser?._id) {
      getMessages(selectedUser._id);
      // Clear unread count for this user when switching to their chat
      clearUnreadCountForUser(selectedUser._id);
      // Clear optimistic messages when switching chats
      clearOptimisticMessages();
    }
    subscribeToMessages();
    return () => {
      unsubscribeFromMessages();
      // Clean up optimistic messages on unmount
      clearOptimisticMessages();
    };
  }, [selectedUser, getMessages, subscribeToMessages, unsubscribeFromMessages, 
      clearUnreadCountForUser, clearOptimisticMessages]);

  // Auto-scroll with optimized performance
  useEffect(() => {
    if (messageEndRef.current && sortedMessages.length > 0) {
      // Use requestAnimationFrame for better performance
      requestAnimationFrame(() => {
        messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
      });
    }
  }, [sortedMessages]);

  const handleImageClick = (imageUrl, fileName, messageId) => {
    setSelectedImage({ url: imageUrl, fileName, messageId });
    setShowImageModal(true);
  };

  const handleDownloadImage = (imageUrl, fileName) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = fileName || 'image.jpg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDeleteMessage = (message) => {
    setMessageToDelete(message);
    setShowDeleteModal(true);
  };

  const confirmDeleteMessage = async () => {
    if (!messageToDelete) return;
    
    setIsDeleting(true);
    try {
      await deleteMessage(messageToDelete._id);
      setShowDeleteModal(false);
      setMessageToDelete(null);
    } catch (error) {
      console.error('Failed to delete message:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleNotificationClick = () => {
    if (notificationData?.senderId) {
      // Find the user and switch to their chat
      const user = users.find(u => u._id === notificationData.senderId);
      if (user) {
        setSelectedUser(user);
        clearUnreadCountForUser(notificationData.senderId);
      }
    }
    hideNotification();
  };

  const handleDeleteFromModal = async () => {
    if (selectedImage?.messageId) {
      await handleDeleteMessage(selectedImage.messageId);
      setShowImageModal(false);
      setSelectedImage(null);
    }
  };

   if(isMessagesLoading) {
    return (
    <div className='flex-1 flex flex-col overflow-auto'>
      <ChatHeader />
      <MessageSkeleton />
      <MessageInput />

    </div>
    );
  }

  return (
    <>
      {/* Notification Bubble */}
      <NotificationBubble
        isVisible={showNotification}
        onClose={hideNotification}
        onClick={handleNotificationClick}
        senderName={notificationData?.senderName}
        messageText={notificationData?.messageText}
        senderAvatar={notificationData?.senderAvatar}
      />

      {/* Image Modal */}
      <ImageModal
        isOpen={showImageModal}
        onClose={() => {
          setShowImageModal(false);
          setSelectedImage(null);
        }}
        imageUrl={selectedImage?.url}
        fileName={selectedImage?.fileName}
        onDelete={handleDeleteFromModal}
        canDelete={selectedImage?.messageId && messages.find(m => m._id === selectedImage.messageId)?.senderId === authUser._id}
      />

      {/* Delete Confirmation Modal */}
      <MessageDeleteModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setMessageToDelete(null);
        }}
        onConfirm={confirmDeleteMessage}
        messageText={messageToDelete?.text}
        isImage={!!messageToDelete?.image}
        isLoading={isDeleting}
      />
      
      <div className='flex-1 flex flex-col overflow-auto'>
        <ChatHeader />

         <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <AnimatePresence initial={false}>
            {sortedMessages.map((message, index) => (
              <motion.div
                key={message._id || message.tempId}
                initial={message.isOptimistic ? { opacity: 0, y: 20, scale: 0.95 } : false}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ 
                  duration: 0.3, 
                  ease: "easeOut",
                  delay: message.isOptimistic ? 0 : 0 
                }}
                className={`chat ${message.senderId === authUser._id ? "chat-end" : "chat-start"} ${
                  message.isOptimistic ? 'opacity-80' : ''
                }`}
                ref={index === sortedMessages.length - 1 ? messageEndRef : null}
              >
                <div className="chat-image avatar">
                  <div className="size-10 rounded-full border">
                    <img
                      src={
                        message.senderId === authUser._id
                          ? authUser.profilePic || "/avatar.png"
                          : selectedUser.profilePic || "/avatar.png"
                      }
                      alt="profile pic"
                    />
                  </div>
                </div>
                
                <div className="chat-header mb-1">
                  <time className="text-xs opacity-50 ml-1">
                    {formatMessageTime(message.createdAt)}
                  </time>
                </div>
                
                <div className={`chat-bubble flex flex-col relative ${
                  message.status === 'failed' ? 'bg-red-100 border border-red-300' : ''
                }`}>
                  {message.image && (
                    <div className="relative group mb-2">
                      <div className="relative overflow-hidden rounded-md">
                        <img
                          src={message.image}
                          alt="Attachment"
                          className={`sm:max-w-[200px] rounded-md cursor-pointer transition-all duration-300 ${
                            message.status === 'uploading' ? 'blur-sm opacity-70' : 'hover:opacity-90'
                          }`}
                          onClick={() => !message.isOptimistic && handleImageClick(message.image, `image_${message._id}.jpg`, message._id)}
                        />
                        
                        {/* Upload progress overlay */}
                        <AnimatePresence>
                          {message.status === 'uploading' && (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-md"
                            >
                              <div className="text-center text-white">
                                <motion.div
                                  animate={{ rotate: 360 }}
                                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                  className="mb-2"
                                >
                                  <Clock className="w-5 h-5" />
                                </motion.div>
                                {message.uploadProgress && (
                                  <>
                                    <motion.div
                                      initial={{ width: 0 }}
                                      animate={{ width: `${message.uploadProgress}%` }}
                                      className="w-16 h-1 bg-white rounded-full mx-auto mb-1"
                                    />
                                    <div className="text-xs">{message.uploadProgress}%</div>
                                  </>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                      
                      {/* Hover overlay with action buttons (only for non-optimistic messages) */}
                      {!message.isOptimistic && (
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-md flex items-center justify-center gap-2 image-hover-overlay">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleImageClick(message.image, `image_${message._id}.jpg`, message._id);
                            }}
                            className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-colors"
                            title="Preview"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownloadImage(message.image, `image_${message._id}.jpg`);
                            }}
                            className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-colors"
                            title="Download"
                          >
                            <Download size={16} />
                          </button>
                          {message.senderId === authUser._id && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteMessage(message);
                              }}
                              className="w-8 h-8 bg-red-500/80 hover:bg-red-600/80 rounded-full flex items-center justify-center text-white transition-colors"
                              title="Delete"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {message.text && <p>{message.text}</p>}
                  
                  {/* Message status indicator */}
                  <MessageStatus message={message} authUser={authUser} />
                  
                  {/* Error retry button */}
                  {message.status === 'failed' && (
                    <motion.button
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-2 text-xs text-red-600 hover:text-red-800 underline"
                      onClick={() => {
                        // Implement retry logic here
                        console.log('Retry message:', message);
                      }}
                    >
                      Tap to retry
                    </motion.button>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Typing Indicator */}
        <TypingIndicator 
          isTyping={isTyping} 
          senderName={selectedUser?.fullName || selectedUser?.username || "Someone"}
        />

        <MessageInput />
      </div>
    </>
  )
}

export default ChatContainer