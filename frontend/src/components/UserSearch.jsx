import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, MessageCircle } from "lucide-react";
import { axiosInstance } from "../lib/axios";
import { toast } from "react-hot-toast";

const UserSearch = ({ onUserSelect, onClose, isVisible }) => {
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (isVisible && searchRef.current) {
      searchRef.current.focus();
    }
  }, [isVisible]);

  useEffect(() => {
    if (query.trim().length < 2) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    // Debounce search
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      searchUsers(query);
    }, 300);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [query]);

  const searchUsers = async (searchQuery) => {
    if (searchQuery.trim().length < 2) return;

    setIsSearching(true);
    try {
      const response = await axiosInstance.get(
        `/messages/search?query=${encodeURIComponent(searchQuery)}`
      );
      setSearchResults(response.data);
      setShowResults(true);
    } catch (error) {
      console.error("Search error:", error);
      toast.error("Failed to search users");
    } finally {
      setIsSearching(false);
    }
  };

  const handleUserSelect = (user) => {
    onUserSelect(user);
    setQuery("");
    setSearchResults([]);
    setShowResults(false);
    onClose();
  };

  const handleClose = () => {
    setQuery("");
    setSearchResults([]);
    setShowResults(false);
    onClose();
  };

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.8, y: -50 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: { type: "spring", stiffness: 300, damping: 30 },
    },
    exit: { opacity: 0, scale: 0.8, y: -50, transition: { duration: 0.2 } },
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={handleClose}
        >
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <Search className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold">Search Users</h3>
              </div>
              <button
                onClick={handleClose}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Search Input */}
            <div className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  ref={searchRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by name, username, or email..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white"
                />
                {isSearching && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
            </div>

            {/* Search Results */}
            {showResults && (
              <div className="max-h-64 overflow-y-auto border-t border-gray-200 dark:border-gray-700">
                {searchResults.length === 0 ? (
                  <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                    {query.trim().length < 2
                      ? "Type at least 2 characters to search"
                      : "No users found"}
                  </div>
                ) : (
                  <div className="p-2">
                    {searchResults.map((user, index) => (
                      <motion.div
                        key={user._id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg cursor-pointer transition-colors"
                        onClick={() => handleUserSelect(user)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="w-10 h-10 rounded-full overflow-hidden">
                          <img
                            src={user.profilePic || "/avatar.png"}
                            alt={user.fullName}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 dark:text-white truncate">
                            {user.fullName}
                          </h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                            {user.email}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUserSelect(user);
                            }}
                            className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                            title="Start Chat"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Footer */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                Search for users by their name, username, or email address
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default UserSearch;
