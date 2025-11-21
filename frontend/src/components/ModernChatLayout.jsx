import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import ModernSidebar from './ModernSidebar';
import SidebarToggle from './SidebarToggle';
import ChatContainer from './ChatContainer';
import NoChatSelected from './NoChatSelected';
import { useChatStore } from '../store/useChatStore';

const ModernChatLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { selectedUser } = useChatStore();

  // Auto-open sidebar on desktop, auto-close on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsSidebarOpen(true);
      } else {
        setIsSidebarOpen(false);
      }
    };

    // Set initial state
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="h-screen bg-gray-50 dark:bg-gray-900 flex overflow-hidden">
      {/* Sidebar Toggle Button (Mobile Only) */}
      <SidebarToggle isOpen={isSidebarOpen} onToggle={toggleSidebar} />

      {/* Sidebar */}
      <ModernSidebar isOpen={isSidebarOpen} onToggle={toggleSidebar} />

      {/* Main Chat Area */}
      <motion.div 
        className={`flex-1 flex flex-col transition-all duration-300 ${
          isSidebarOpen ? 'lg:ml-0' : ''
        }`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {selectedUser ? (
          <ChatContainer />
        ) : (
          <NoChatSelected />
        )}
      </motion.div>
    </div>
  );
};

export default ModernChatLayout;