import { useEffect, useState } from 'react'
import {useChatStore} from '../store/useChatStore'
import {useAuthStore} from '../store/useAuthStore'
import SidebarSkeleton from './skeletons/SidebarSkeleton'
import UserSearch from './UserSearch'
import ContactDeleteModal from './ContactDeleteModal'
import { Users, Search, Plus, MoreHorizontal, Trash2 } from 'lucide-react'

const Sidebar = () => {
  const { getUsers, users, selectedUser, setSelectedUser, isUsersLoading, unreadCount, clearUnreadCount, unreadMessages, addDiscoveredUserAndSelect, deleteContact} = useChatStore()
  // const onlineUsers =[];
  const {onlineUsers} = useAuthStore();
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [contactToDelete, setContactToDelete] = useState(null);
  const [activeDropdown, setActiveDropdown] = useState(null);

  useEffect (() => {
    getUsers();
  }, [getUsers]);

  const filteredUsers = showOnlineOnly
    ? users.filter((user) => onlineUsers.includes(user._id)) : users;

  const handleUserSearch = (user) => {
    addDiscoveredUserAndSelect(user);
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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (activeDropdown !== null) {
        setActiveDropdown(null);
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [activeDropdown]);

  if(isUsersLoading) return <SidebarSkeleton />

  return (
    <aside className="h-full w-20 lg:w-72 border-r border-base-300 flex flex-col transition-all duration-200">
      <div className="border-b border-base-300 w-full p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Users className="size-6" />
            <span className="font-medium hidden lg:block">Contacts</span>
          </div>
          <button
            onClick={() => setShowUserSearch(true)}
            className="btn btn-sm btn-primary btn-circle"
            title="Search Users"
          >
            <Search className="w-4 h-4" />
          </button>
        </div>
         {/* filter toggle  */}
        <div className="hidden lg:flex items-center justify-between">
          <div className="flex items-center gap-2">
            <label className="cursor-pointer flex items-center gap-2">
              <input
                type="checkbox"
                checked={showOnlineOnly}
                onChange={(e) => setShowOnlineOnly(e.target.checked)}
                className="checkbox checkbox-sm"
              />
              <span className="text-sm">Show online only</span>
            </label>
            <span className="text-xs text-zinc-500">({onlineUsers.length - 1} online)</span>
          </div>
          {unreadCount > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-500">Unread:</span>
              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                {unreadCount}
              </span>
              <button
                onClick={clearUnreadCount}
                className="text-xs text-blue-500 hover:text-blue-600 underline"
              >
                Mark all read
              </button>
            </div>
          )}
        </div>

      </div>
      <div className='overflow-y-auto w-full py-3'>
        {filteredUsers.map((user) => (
          <div key={user._id} className="relative group">
            <button
              onClick={() => setSelectedUser(user)}
              className={`
                w-full p-3 flex items-center gap-3
                hover:bg-base-300 transition-colors
                ${selectedUser?._id === user._id ? "bg-base-300 ring-1 ring-base-300" : ""}
              `}
            >
              <div className="relative mx-auto lg:mx-0">
                <img
                  src={user.profilePic || "/avatar.png"}
                  alt={user.name}
                  className="size-12 object-cover rounded-full"
                />
                {onlineUsers.includes(user._id) && (
                  <span
                    className="absolute bottom-0 right-0 size-3 bg-green-500 
                    rounded-full ring-2 ring-zinc-900"
                  />
                )}
              </div>

              {/* User info - only visible on larger screens */}
              <div className="hidden lg:block text-left min-w-0 flex-1">
                <div className="font-medium truncate flex items-center gap-2">
                  {user.fullName}
                  {unreadMessages[user._id] > 0 && (
                    <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-medium min-w-[20px] text-center">
                      {unreadMessages[user._id]}
                    </span>
                  )}
                </div>
                <div className="text-sm text-zinc-400">
                  {onlineUsers.includes(user._id) ? "Online" : "Offline"}
                </div>
              </div>

              {/* Unread indicator for mobile view */}
              {unreadMessages[user._id] > 0 && (
                <div className="lg:hidden">
                  <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                    {unreadMessages[user._id]}
                  </span>
                </div>
              )}
            </button>
            
            {/* Options dropdown */}
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 hidden group-hover:block">
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveDropdown(activeDropdown === user._id ? null : user._id);
                  }}
                  className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full transition-colors"
                  title="More options"
                >
                  <MoreHorizontal className="w-4 h-4 text-gray-500" />
                </button>
                
                {activeDropdown === user._id && (
                  <div className="absolute right-0 mt-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-10 min-w-[120px]">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteContact(user);
                      }}
                      className="w-full px-3 py-2 text-left text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 text-sm"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete Contact
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {filteredUsers.length === 0 && (
          <div className="text-center text-zinc-500 py-8 px-4">
            <Users className="w-12 h-12 mx-auto mb-3 text-zinc-400" />
            <p className="text-sm mb-2">No contacts yet</p>
            <p className="text-xs text-zinc-400">
              Search for users to start chatting
            </p>
          </div>
        )}

      </div>

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
    </aside>
  );
};

export default Sidebar;
