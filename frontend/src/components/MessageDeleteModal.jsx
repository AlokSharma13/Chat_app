import { useState } from 'react';
import { Trash2, AlertTriangle, X } from 'lucide-react';

const MessageDeleteModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  messageText, 
  isImage = false,
  isLoading = false 
}) => {
  const [confirmText, setConfirmText] = useState('');

  const handleConfirm = () => {
    if (confirmText.toLowerCase() === 'delete') {
      onConfirm();
    }
  };

  const handleClose = () => {
    setConfirmText('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full animate-slide-in">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
              <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Delete Message
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                This action cannot be undone
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            disabled={isLoading}
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="flex items-start gap-3 mb-6">
            <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-gray-700 dark:text-gray-300 mb-2">
                Are you sure you want to delete this message?
              </p>
              {isImage ? (
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  This will permanently delete the image and any associated text.
                </div>
              ) : (
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 mt-2">
                  <p className="text-sm text-gray-600 dark:text-gray-300 italic">
                    "{messageText}"
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Confirmation input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Type <span className="font-mono bg-gray-100 dark:bg-gray-700 px-1 rounded">delete</span> to confirm:
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:bg-gray-700 dark:text-white"
              placeholder="Type 'delete' here"
              disabled={isLoading}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={confirmText.toLowerCase() !== 'delete' || isLoading}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  Delete Message
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageDeleteModal;
