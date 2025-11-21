import { memo, useMemo, useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FixedSizeList as List } from 'react-window';
import { Search, MessageSquare, Users, Bell, Settings } from 'lucide-react';
import { useChatStore } from '../store/useChatStore';
import { useAuthStore } from '../store/useAuthStore';
import { formatMessageTime } from '../lib/utils';

// Memoized user item component to prevent unnecessary re-renders
const UserItem = memo(({ 
  user, 
  isSelected, 
  onSelect, 
  unreadCount = 0, 
  lastMessage,
  isOnline = false 
}) => {
  const handleClick = useCallback(() => {
    onSelect(user);
  }, [user, onSelect]);

  return (
    <motion.div
      whileHover={{ backgroundColor: 'rgba(59, 130, 246, 0.05)' }}
      whileTap={{ scale: 0.98 }}
      onClick={handleClick}
      className={`p-3 cursor-pointer border-b border-gray-200 dark:border-gray-700 transition-all duration-200 ${
        isSelected 
          ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-blue-500' 
          : 'hover:bg-gray-50 dark:hover:bg-gray-800'
      }`}
    >
      <div className="flex items-center space-x-3">
        {/* Avatar with online indicator */}
        <div className="relative">
          <img
            src={user.profilePic || '/avatar.png'}
            alt={user.fullName}
            className="w-12 h-12 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600"
          />
          {isOnline && (
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full"></div>
          )}
        </div>

        {/* User info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h3 className={`font-medium truncate ${
              unreadCount > 0 ? 'font-semibold text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-200'
            }`}>
              {user.fullName || user.username}
            </h3>
            
            {/* Timestamp */}
            {lastMessage && (
              <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                {formatMessageTime(lastMessage.createdAt)}
              </span>
            )}
          </div>

          {/* Last message preview */}
          <div className="flex items-center justify-between mt-1">
            <p className={`text-sm truncate ${
              unreadCount > 0 ? 'font-medium text-gray-800 dark:text-gray-100' : 'text-gray-600 dark:text-gray-400'
            }`}>
              {lastMessage 
                ? (lastMessage.image ? '📷 Photo' : lastMessage.text || 'New message')
                : 'No messages yet'
              }
            </p>

            {/* Unread badge */}
            <AnimatePresence>
              {unreadCount > 0 && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  className="bg-blue-500 text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5 ml-2 flex-shrink-0"
                >
                  {unreadCount > 99 ? '99+' : unreadCount}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
});

// Virtual list item renderer for large user lists
const VirtualUserItem = memo(({ index, style, data }) => {
  const { users, selectedUser, onSelectUser, onlineUsers, unreadMessages } = data;
  const user = users[index];
  
  if (!user) return null;
  
  const isSelected = selectedUser?._id === user._id;
  const isOnline = onlineUsers?.includes(user._id) || false;
  const unreadCount = unreadMessages[user._id] || 0;
  
  return (
    <div style={style}>
      <UserItem
        user={user}
        isSelected={isSelected}
        onSelect={onSelectUser}
        unreadCount={unreadCount}
        lastMessage={user.lastMessage}
        isOnline={isOnline}
      />
    </div>
  );
});

const OptimizedSidebar = memo(() => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('chats'); // 'chats', 'requests'
  
  const {
    users,
    selectedUser,
    setSelectedUser,
    isUsersLoading,
    unreadMessages,
    requestCount,
    messageRequests,
    isRequestsLoading
  } = useChatStore();
  
  const { onlineUsers } = useAuthStore();

  // Memoized filtered users for search
  const filteredUsers = useMemo(() => {
    if (!searchTerm.trim()) return users;
    
    const lowercaseSearch = searchTerm.toLowerCase();
    return users.filter(user => 
      user.fullName?.toLowerCase().includes(lowercaseSearch) ||
      user.username?.toLowerCase().includes(lowercaseSearch) ||
      user.email?.toLowerCase().includes(lowercaseSearch)
    );
  }, [users, searchTerm]);

  // Memoized total unread count
  const totalUnreadCount = useMemo(() => {
    return Object.values(unreadMessages).reduce((sum, count) => sum + count, 0);
  }, [unreadMessages]);

  // Callbacks to prevent unnecessary re-renders
  const handleSelectUser = useCallback((user) => {
    setSelectedUser(user);
  }, [setSelectedUser]);

  const handleSearchChange = useCallback((e) => {
    setSearchTerm(e.target.value);
  }, []);

  const clearSearch = useCallback(() => {
    setSearchTerm('');
  }, []);

  // Virtual list data
  const virtualListData = useMemo(() => ({
    users: filteredUsers,
    selectedUser,
    onSelectUser: handleSelectUser,
    onlineUsers,
    unreadMessages
  }), [filteredUsers, selectedUser, handleSelectUser, onlineUsers, unreadMessages]);

  // Determine if we should use virtual scrolling (for performance with large lists)
  const useVirtualScrolling = filteredUsers.length > 50;

  return (
    <div className="w-80 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Messages</h1>
        
        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {searchTerm && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('chats')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors relative ${
            activeTab === 'chats'
              ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          <div className="flex items-center justify-center space-x-2">
            <MessageSquare className="w-4 h-4" />
            <span>Chats</span>
            {totalUnreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
              </span>
            )}
          </div>
        </button>
        
        <button
          onClick={() => setActiveTab('requests')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors relative ${
            activeTab === 'requests'
              ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          <div className="flex items-center justify-center space-x-2">
            <Users className="w-4 h-4" />
            <span>Requests</span>
            {requestCount > 0 && (
              <span className="bg-red-500 text-white text-xs rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                {requestCount > 99 ? '99+' : requestCount}
              </span>
            )}
          </div>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {activeTab === 'chats' && (
            <motion.div
              key="chats"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              className="h-full overflow-hidden"
            >
              {/* Loading state */}
              {isUsersLoading && (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                </div>
              )}

              {/* Empty state */}
              {!isUsersLoading && filteredUsers.length === 0 && (
                <div className="flex flex-col items-center justify-center h-32 text-gray-500 dark:text-gray-400">
                  <MessageSquare className="w-12 h-12 mb-2 opacity-50" />
                  <p className="text-sm">
                    {searchTerm ? 'No conversations found' : 'No conversations yet'}
                  </p>
                </div>
              )}

              {/* User list */}
              {!isUsersLoading && filteredUsers.length > 0 && (
                <>
                  {useVirtualScrolling ? (
                    <List
                      height={400}
                      itemCount={filteredUsers.length}
                      itemSize={80}
                      itemData={virtualListData}
                      className="scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600"
                    >
                      {VirtualUserItem}
                    </List>
                  ) : (
                    <div className="overflow-y-auto h-full scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
                      {filteredUsers.map((user) => (
                        <UserItem
                          key={user._id}
                          user={user}
                          isSelected={selectedUser?._id === user._id}
                          onSelect={handleSelectUser}
                          unreadCount={unreadMessages[user._id] || 0}
                          lastMessage={user.lastMessage}
                          isOnline={onlineUsers?.includes(user._id) || false}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}
            </motion.div>
          )}

          {activeTab === 'requests' && (
            <motion.div
              key="requests"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600"
            >
              {/* Message requests content */}
              {isRequestsLoading && (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                </div>
              )}

              {!isRequestsLoading && messageRequests.length === 0 && (
                <div className="flex flex-col items-center justify-center h-32 text-gray-500 dark:text-gray-400">
                  <Users className="w-12 h-12 mb-2 opacity-50" />
                  <p className="text-sm">No message requests</p>
                </div>
              )}

              {!isRequestsLoading && messageRequests.length > 0 && (
                <div className="p-4">
                  {/* Render message requests here */}
                  {messageRequests.map((request) => (
                    <div key={request._id} className="mb-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Request from {request.senderId?.fullName}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer with online count */}
      <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
          <span className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>{onlineUsers?.length || 0} online</span>
          </span>
          
          <button className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded">
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
});

OptimizedSidebar.displayName = 'OptimizedSidebar';

export default OptimizedSidebar;