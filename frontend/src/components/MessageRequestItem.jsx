import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, X, Trash2, Image as ImageIcon, Clock } from 'lucide-react';
import { useChatStore } from '../store/useChatStore';

const MessageRequestItem = ({ request, index }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { acceptMessageRequest, rejectMessageRequest, deleteMessageRequest } = useChatStore();

  const handleAccept = async () => {
    setIsProcessing(true);
    try {
      await acceptMessageRequest(request._id);
    } catch (error) {
      console.error('Error accepting request:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    setIsProcessing(true);
    try {
      await rejectMessageRequest(request._id);
    } catch (error) {
      console.error('Error rejecting request:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async () => {
    setIsProcessing(true);
    try {
      await deleteMessageRequest(request._id);
    } catch (error) {
      console.error('Error deleting request:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const formatTimeAgo = (date) => {
    const now = new Date();
    const requestTime = new Date(date);
    const diffInMinutes = Math.floor((now - requestTime) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm"
    >
      {/* User Info Header */}
      <div className="flex items-center gap-3 mb-3">
        <div className="relative">
          <img
            src={request.senderId.profilePic || "/avatar.png"}
            alt={request.senderId.fullName}
            className="w-12 h-12 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600"
          />
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full border-2 border-white dark:border-gray-800 flex items-center justify-center">
            <span className="text-[10px] text-white font-bold">!</span>
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-gray-900 dark:text-white truncate">
            {request.senderId.fullName}
          </h4>
          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
            {request.senderId.email}
          </p>
        </div>
        
        <div className="flex items-center gap-1 text-xs text-gray-400">
          <Clock className="w-3 h-3" />
          <span>{formatTimeAgo(request.requestedAt)}</span>
        </div>
      </div>

      {/* Message Preview */}
      <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <div className="text-sm text-gray-600 dark:text-gray-300 mb-1">
          First message:
        </div>
        {request.messageId?.image ? (
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
            <ImageIcon className="w-4 h-4" />
            <span className="text-sm">Sent a photo</span>
          </div>
        ) : (
          <p className="text-gray-800 dark:text-gray-200 line-clamp-3">
            {request.messageId?.text || request.firstMessage?.text || 'No message content'}
          </p>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleAccept}
          disabled={isProcessing}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-green-400 text-white rounded-lg transition-colors text-sm font-medium"
        >
          <Check className="w-4 h-4" />
          {isProcessing ? 'Accepting...' : 'Accept'}
        </motion.button>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleReject}
          disabled={isProcessing}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 disabled:bg-yellow-400 text-white rounded-lg transition-colors text-sm font-medium"
        >
          <X className="w-4 h-4" />
          {isProcessing ? 'Rejecting...' : 'Reject'}
        </motion.button>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleDelete}
          disabled={isProcessing}
          className="px-3 py-2 bg-red-500 hover:bg-red-600 disabled:bg-red-400 text-white rounded-lg transition-colors"
          title="Delete permanently"
        >
          <Trash2 className="w-4 h-4" />
        </motion.button>
      </div>

      {/* Status Info */}
      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
          <strong>Accept</strong> to start chatting • <strong>Reject</strong> to decline • <strong>Delete</strong> to remove permanently
        </p>
      </div>
    </motion.div>
  );
};

export default MessageRequestItem;