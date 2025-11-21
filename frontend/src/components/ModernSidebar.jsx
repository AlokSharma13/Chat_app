import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Menu, 
  X, 
  MoreVertical, 
  Trash2, 
  Settings,
  LogOut,
  MessageCircle,
  Users,
  ChevronLeft,
  Plus,
  Inbox,
  MessageSquare
} from 'lucide-react';
import { useChatStore } from '../store/useChatStore';
import { useAuthStore } from '../store/useAuthStore';
import UserSearch from './UserSearch';
import ContactDeleteModal from './ContactDeleteModal';
import MessageRequestList from './MessageRequestList';
import { toast } from 'react-hot-toast';

const ModernSidebar = ({ isOpen, onToggle }) => {
  const { 
    getUsers, 
    users, 
    selectedUser, 
    setSelectedUser, 
    isUsersLoading, 
    unreadCount, 
    clearUnreadCount, 
    unreadMessages,
    addDiscoveredUserAndSelect,
    deleteContact,
    clearUnreadCountForUser,
    requestCount,
    getRequestCount
  } = useChatStore();
  
  const { authUser, onlineUsers, logout } = useAuthStore();
  
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [contactToDelete, setContactToDelete] = useState(null);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);
  const [activeTab, setActiveTab] = useState('inbox'); // 'inbox' or 'requests'

  useEffect(() => {
    getUsers();
    getRequestCount();
  }, [getUsers, getRequestCount]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (activeDropdown !== null) {
        setActiveDropdown(null);
      }
      if (showProfileMenu) {
        setShowProfileMenu(false);
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [activeDropdown, showProfileMenu]);

  // Filter users based on search and online status
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (user.username && user.username.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesOnlineFilter = !showOnlineOnly || onlineUsers.includes(user._id);
    
    return matchesSearch && matchesOnlineFilter;
  });

  const handleUserSelect = (user) => {
    setSelectedUser(user);
    clearUnreadCountForUser(user._id);
    // Close sidebar on mobile after selecting
    if (window.innerWidth < 1024) {
      onToggle();
    }
  };

  const handleDeleteContact = (user) => {
    setContactToDelete(user);
    setShowDeleteModal(true);
    setActiveDropdown(null);
  };

  const confirmDeleteContact = async (contactId) => {
    await deleteContact(contactId);
    setShowDeleteModal(false);
    setContactToDelete(null);
  };

  const cancelDeleteContact = () => {
    setShowDeleteModal(false);
    setContactToDelete(null);
  };

  const handleUserSearch = (user) => {
    addDiscoveredUserAndSelect(user);
    setShowUserSearch(false);
    // Close sidebar on mobile after selecting
    if (window.innerWidth < 1024) {
      onToggle();
    }
  };

  const handleLogout = async () => {
    await logout();
    setShowProfileMenu(false);
  };

  const sidebarVariants = {
    open: {
      x: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30
      }
    },
    closed: {
      x: "-100%",
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30
      }
    }
  };

  const overlayVariants = {
    open: {
      opacity: 1,
      transition: { duration: 0.2 }
    },
    closed: {
      opacity: 0,
      transition: { duration: 0.2 }
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            variants={overlayVariants}
            initial="closed"
            animate="open"
            exit="closed"
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={onToggle}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        variants={sidebarVariants}
        initial="closed"
        animate={isOpen ? "open" : "closed"}
        className="fixed lg:relative left-0 top-0 h-full w-80 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 z-50 flex flex-col shadow-xl lg:shadow-none"
      >
        {/* Header with Profile */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700">
          <div className="flex items-center gap-3 flex-1">
            <div className="relative">
              <img
                src={authUser?.profilePic || "/avatar.png"}
                alt={authUser?.fullName}
                className="w-10 h-10 rounded-full object-cover ring-2 ring-blue-200 dark:ring-gray-600"
              />
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-900"></div>
            </div>
            
            <div className="flex-1 min-w-0">
              <h2 className="font-semibold text-gray-900 dark:text-white truncate">
                {authUser?.fullName}
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {authUser?.email}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {/* Profile Menu */}
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowProfileMenu(!showProfileMenu);
                  }}
                  className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  <MoreVertical className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                </button>

                <AnimatePresence>
                  {showProfileMenu && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -10 }}
                      className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50"
                    >
                      <button className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2">
                        <Settings className="w-4 h-4" />
                        Settings
                      </button>
                      <button 
                        onClick={handleLogout}
                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                      >
                        <LogOut className="w-4 h-4" />
                        Logout
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Close button for mobile */}
              <button
                onClick={onToggle}
                className="lg:hidden p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <X className="w-4 h-4 text-gray-600 dark:text-gray-300" />
              </button>
            </div>
          </div>
        </div>

        {/* Search and Controls */}
        <div className="p-4 space-y-3 border-b border-gray-200 dark:border-gray-700">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowUserSearch(true)}
                className="flex items-center gap-2 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                New Chat
              </button>
            </div>

            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <input
                  type="checkbox"
                  checked={showOnlineOnly}
                  onChange={(e) => setShowOnlineOnly(e.target.checked)}
                  className="rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                />
                Online only
              </label>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>{filteredUsers.length} conversations</span>
            <span>{onlineUsers.length - 1} online</span>
            {unreadCount > 0 && (
              <button
                onClick={clearUnreadCount}
                className="text-blue-500 hover:text-blue-600 underline"
              >
                {unreadCount} unread
              </button>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <div className="flex">
            <button
              onClick={() => setActiveTab('inbox')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors relative ${
                activeTab === 'inbox'
                  ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              <Inbox className="w-4 h-4" />
              <span>Inbox</span>
              {unreadCount > 0 && (
                <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center ml-1">
                  <span className="text-white text-xs font-bold">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                </div>
              )}
              {activeTab === 'inbox' && (
                <motion.div 
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400"
                />
              )}
            </button>
            
            <button
              onClick={() => setActiveTab('requests')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors relative ${
                activeTab === 'requests'
                  ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>Requests</span>
              {requestCount > 0 && (
                <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center ml-1">
                  <span className="text-white text-xs font-bold">
                    {requestCount > 99 ? '99+' : requestCount}
                  </span>
                </div>
              )}
              {activeTab === 'requests' && (
                <motion.div 
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400"
                />
              )}
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            {activeTab === 'inbox' ? (
              <motion.div
                key="inbox"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="h-full overflow-y-auto"
              >
                {isUsersLoading ? (
                  <div className="p-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 animate-pulse">
                        <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-8 text-center h-full">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                      <MessageCircle className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                      {searchQuery ? 'No conversations found' : 'No conversations yet'}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                      {searchQuery 
                        ? 'Try searching with a different term'
                        : 'Start a new conversation by searching for users'
                      }
                    </p>
                    {!searchQuery && (
                      <button
                        onClick={() => setShowUserSearch(true)}
                        className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors text-sm font-medium"
                      >
                        Find Users
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="p-2">
                    {filteredUsers.map((user) => (
                      <motion.div
                        key={user._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="relative group"
                      >
                        <button
                          onClick={() => handleUserSelect(user)}
                          className={`w-full p-3 rounded-xl flex items-center gap-3 transition-all duration-200 ${
                            selectedUser?._id === user._id 
                              ? 'bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-200 dark:ring-blue-700' 
                              : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                          }`}
                        >
                          {/* Avatar */}
                          <div className="relative">
                            <img
                              src={user.profilePic || "/avatar.png"}
                              alt={user.fullName}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                            {onlineUsers.includes(user._id) && (
                              <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-900"></div>
                            )}
                            {unreadMessages[user._id] > 0 && (
                              <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                                <span className="text-white text-xs font-medium">
                                  {unreadMessages[user._id] > 99 ? '99+' : unreadMessages[user._id]}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* User Info */}
                          <div className="flex-1 min-w-0 text-left">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium text-gray-900 dark:text-white truncate">
                                {user.fullName}
                              </h4>
                              <span className="text-xs text-gray-400">
                                {onlineUsers.includes(user._id) ? 'Online' : 'Offline'}
                              </span>
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                              {user.email}
                            </p>
                          </div>
                        </button>

                        {/* Options Menu */}
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="relative">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveDropdown(activeDropdown === user._id ? null : user._id);
                              }}
                              className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                            >
                              <MoreVertical className="w-4 h-4 text-gray-500" />
                            </button>

                            <AnimatePresence>
                              {activeDropdown === user._id && (
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                  animate={{ opacity: 1, scale: 1, y: 0 }}
                                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                  className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-10"
                                >
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteContact(user);
                                    }}
                                    className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                    Delete Chat
                                  </button>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="requests"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="h-full"
              >
                <MessageRequestList />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.aside>

      {/* User Search Modal */}
      <UserSearch
        isVisible={showUserSearch}
        onClose={() => setShowUserSearch(false)}
        onUserSelect={handleUserSearch}
      />

      {/* Contact Delete Modal */}
      <ContactDeleteModal
        isVisible={showDeleteModal}
        user={contactToDelete}
        onConfirm={confirmDeleteContact}
        onCancel={cancelDeleteContact}
      />
    </>
  );
};

export default ModernSidebar;