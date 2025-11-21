import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Users, Loader2 } from 'lucide-react';
import { useChatStore } from '../store/useChatStore';
import MessageRequestItem from './MessageRequestItem';

const MessageRequestList = () => {
  const { 
    messageRequests, 
    isRequestsLoading, 
    getMessageRequests,
    requestCount 
  } = useChatStore();

  useEffect(() => {
    getMessageRequests();
  }, [getMessageRequests]);

  if (isRequestsLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 h-full">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-4" />
        <p className="text-gray-600 dark:text-gray-400">Loading message requests...</p>
      </div>
    );
  }

  if (messageRequests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center h-full">
        <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6">
          <MessageSquare className="w-10 h-10 text-gray-400" />
        </div>
        <h3 className="font-semibold text-gray-900 dark:text-white text-lg mb-2">
          No Message Requests
        </h3>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-6 max-w-sm">
          When someone new sends you a message, it will appear here as a request. 
          You can then choose to accept, reject, or delete it.
        </p>
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 max-w-sm">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
              How it works
            </span>
          </div>
          <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
            <li>• New users' messages appear as requests</li>
            <li>• Accept to start chatting normally</li>
            <li>• Reject to decline without notification</li>
            <li>• Delete to remove permanently</li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-white">
                Message Requests
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {messageRequests.length} pending request{messageRequests.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          
          {requestCount > 0 && (
            <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">
                {requestCount > 99 ? '99+' : requestCount}
              </span>
            </div>
          )}
        </div>
        
        <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <p className="text-xs text-yellow-800 dark:text-yellow-200">
            <strong>Privacy Notice:</strong> These are messages from people who aren't in your contacts. 
            Review carefully before accepting.
          </p>
        </div>
      </div>

      {/* Request List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messageRequests.map((request, index) => (
          <MessageRequestItem
            key={request._id}
            request={request}
            index={index}
          />
        ))}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <div className="flex items-center justify-center gap-4 text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Accept = Start chatting</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
            <span>Reject = Decline silently</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <span>Delete = Remove forever</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageRequestList;