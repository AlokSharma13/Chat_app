import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
  messages: [], // Unified array for both optimistic and confirmed messages
  users: [],
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,
  // Upload state
  isUploading: false,
  uploadProgress: 0,
  uploadFileName: '',
  uploadSuccess: false,
  uploadError: false,
  // Notification state
  showNotification: false,
  notificationData: null,
  unreadCount: 0,
  unreadMessages: {}, // Track unread messages per user
  // Typing state
  isTyping: false,
  typingUser: null,
  // Message requests state
  messageRequests: [],
  isRequestsLoading: false,
  requestCount: 0,

  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/users");
      set({ users: res.data });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMessages: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      // Clear any existing messages and set new ones
      set({ messages: res.data.map(msg => ({ ...msg, isOptimistic: false })) });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  // Helper method to add a regular message
  addMessage: (message) => {
    const { messages } = get();
    set({ messages: [...messages, { ...message, isOptimistic: false }] });
  },

  // Helper method to add optimistic message
  addOptimisticMessage: (message) => {
    const { messages } = get();
    const optimisticMessage = {
      ...message,
      isOptimistic: true,
      status: message.status || 'sending',
      createdAt: message.createdAt || new Date(),
    };
    set({ messages: [...messages, optimisticMessage] });
  },

  // Helper method to update optimistic message
  updateOptimisticMessage: (tempId, updates) => {
    const { messages } = get();
    const updatedMessages = messages.map(msg => {
      if (msg.tempId === tempId) {
        return { ...msg, ...updates };
      }
      return msg;
    });
    set({ messages: updatedMessages });
  },

  // Helper method to remove optimistic message (usually replaced by real message)
  removeOptimisticMessage: (tempId) => {
    const { messages } = get();
    const filteredMessages = messages.filter(msg => msg.tempId !== tempId);
    set({ messages: filteredMessages });
  },

  // Helper method to replace optimistic message with real message
  replaceOptimisticMessage: (tempId, realMessage) => {
    const { messages } = get();
    const updatedMessages = messages.map(msg => {
      if (msg.tempId === tempId && msg.isOptimistic) {
        return { ...realMessage, isOptimistic: false };
      }
      return msg;
    });
    set({ messages: updatedMessages });
  },
  sendMessage: async (messageData) => {
    const { selectedUser, addDiscoveredUser, replaceOptimisticMessage, updateOptimisticMessage } = get();
    
    try {
      const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, messageData);
      
      // Replace optimistic message with real message from server
      if (messageData.tempId) {
        replaceOptimisticMessage(messageData.tempId, res.data);
      } else {
        // If no tempId, just add the message (fallback)
        const { addMessage } = get();
        addMessage(res.data);
      }
      
      // Add the receiver to contacts if they're not already there
      if (selectedUser) {
        addDiscoveredUser(selectedUser);
      }
      
      return res.data;
    } catch (error) {
      // Update optimistic message to show error state
      if (messageData.tempId) {
        updateOptimisticMessage(messageData.tempId, {
          status: 'failed',
          error: error.response?.data?.message || 'Failed to send message'
        });
      }
      
      toast.error(error.response?.data?.message || 'Failed to send message');
      throw error;
    }
  },

  deleteMessage: async (messageId) => {
    try {
      await axiosInstance.delete(`/messages/message/${messageId}`);
      const { messages } = get();
      const filteredMessages = messages.filter(msg => msg._id !== messageId);
      set({ messages: filteredMessages });
      toast.success("Message deleted successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete message");
    }
  },

  deleteContact: async (contactId) => {
    try {
      await axiosInstance.delete(`/messages/contact/${contactId}`);
      const { users, selectedUser, unreadMessages } = get();
      
      // Remove contact from users list
      const updatedUsers = users.filter(user => user._id !== contactId);
      
      // Clear unread messages for this contact
      const updatedUnreadMessages = { ...unreadMessages };
      delete updatedUnreadMessages[contactId];
      
      // Calculate new unread count
      const newUnreadCount = Object.values(updatedUnreadMessages).reduce((sum, count) => sum + count, 0);
      
      set({ 
        users: updatedUsers,
        unreadMessages: updatedUnreadMessages,
        unreadCount: newUnreadCount
      });
      
      // If the deleted contact was selected, clear selection and messages
      if (selectedUser && selectedUser._id === contactId) {
        set({ selectedUser: null, messages: [] });
      }
      
      toast.success("Contact deleted successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete contact");
    }
  },

  // Upload methods
  startUpload: (fileName) => {
    set({ 
      isUploading: true, 
      uploadProgress: 0, 
      uploadFileName: fileName,
      uploadSuccess: false,
      uploadError: false 
    });
  },

  updateUploadProgress: (progress) => {
    set({ uploadProgress: progress });
  },

  completeUpload: () => {
    set({ 
      isUploading: false, 
      uploadProgress: 100, 
      uploadSuccess: true,
      uploadError: false 
    });
  },

  failUpload: () => {
    set({ 
      isUploading: false, 
      uploadSuccess: false,
      uploadError: true 
    });
  },

  resetUploadState: () => {
    set({ 
      isUploading: false, 
      uploadProgress: 0, 
      uploadFileName: '',
      uploadSuccess: false,
      uploadError: false 
    });
  },

  // Notification methods
  showMessageNotification: (message, senderInfo) => {
    const { unreadMessages } = get();
    const senderId = message.senderId;
    
    set({
      showNotification: true,
      notificationData: {
        senderName: senderInfo?.fullName || senderInfo?.username || 'Unknown',
        messageText: message.text || (message.image ? 'Sent a photo' : 'New message'),
        senderAvatar: senderInfo?.profilePic,
        messageId: message._id,
        senderId: senderId
      },
      unreadCount: get().unreadCount + 1,
      unreadMessages: {
        ...unreadMessages,
        [senderId]: (unreadMessages[senderId] || 0) + 1
      }
    });

    // Auto-hide notification after 5 seconds
    setTimeout(() => {
      set({ showNotification: false });
    }, 5000);
  },

  hideNotification: () => {
    set({ showNotification: false });
  },

  clearUnreadCount: () => {
    set({ 
      unreadCount: 0,
      unreadMessages: {}
    });
  },

  clearUnreadCountForUser: (userId) => {
    const { unreadMessages, unreadCount } = get();
    const userUnreadCount = unreadMessages[userId] || 0;
    
    set({
      unreadCount: Math.max(0, unreadCount - userUnreadCount),
      unreadMessages: {
        ...unreadMessages,
        [userId]: 0
      }
    });
  },

  incrementUnreadCount: () => {
    set({ unreadCount: get().unreadCount + 1 });
  },

  // Typing methods
  setTyping: (isTyping, userId = null) => {
    set({ 
      isTyping,
      typingUser: isTyping ? userId : null
    });
  },

  startTyping: (userId) => {
    set({ 
      isTyping: true,
      typingUser: userId
    });
  },

  stopTyping: () => {
    set({ 
      isTyping: false,
      typingUser: null
    });
  },

  subscribeToMessages: () => {
    const { selectedUser, showMessageNotification, addMessage } = get();
    const socket = useAuthStore.getState().socket;

    socket.on("newMessage", (newMessage) => {
      const { authUser } = useAuthStore.getState();
      const isMessageFromCurrentUser = newMessage.senderId === authUser._id;
      
      if (isMessageFromCurrentUser) return; // Don't process own messages
      
      const isMessageSentFromSelectedUser = selectedUser && newMessage.senderId === selectedUser._id;
      
      // Add message to chat if it's from the selected user
      if (isMessageSentFromSelectedUser) {
        addMessage(newMessage);
      } else {
        // Show notification for messages from other users
        const senderInfo = get().users.find(user => user._id === newMessage.senderId);
        if (senderInfo) {
          showMessageNotification(newMessage, senderInfo);
        } else {
          // If sender is not in contacts, fetch their info
          const { fetchUserById } = get();
          fetchUserById(newMessage.senderId).then(senderInfo => {
            if (senderInfo) {
              showMessageNotification(newMessage, senderInfo);
            } else {
              showMessageNotification(newMessage, { 
                fullName: 'Unknown User', 
                profilePic: null 
              });
            }
          });
        }
      }
    });

    // Enhanced chat list updates
    socket.on("chatListUpdate", ({ userId, lastMessage, unreadCount }) => {
      const { users } = get();
      const updatedUsers = users.map(user => {
        if (user._id === userId) {
          return {
            ...user,
            lastMessage,
            unreadCount: unreadCount || 0,
            lastMessageAt: lastMessage.createdAt
          };
        }
        return user;
      });
      
      // Sort by last message time
      updatedUsers.sort((a, b) => 
        new Date(b.lastMessageAt || 0) - new Date(a.lastMessageAt || 0)
      );
      
      set({ users: updatedUsers });
    });

    // Image upload progress
    socket.on("imageUploadStart", ({ senderId, tempId, fileName }) => {
      // Handle image upload start for received messages
      console.log('Image upload started:', { senderId, tempId, fileName });
    });

    socket.on("imageUploadProgress", ({ senderId, tempId, progress }) => {
      // Handle image upload progress for received messages
      console.log('Image upload progress:', { senderId, tempId, progress });
    });

    socket.on("imageUploadError", ({ senderId, tempId, error }) => {
      // Handle image upload error for received messages
      console.log('Image upload error:', { senderId, tempId, error });
    });

    // User status updates
    socket.on("userStatusChanged", ({ userId, status }) => {
      const { users } = get();
      const updatedUsers = users.map(user => {
        if (user._id === userId) {
          return { ...user, status, lastSeen: new Date() };
        }
        return user;
      });
      set({ users: updatedUsers });
    });

    socket.on("messageDeleted", ({ messageId }) => {
      const { messages } = get();
      const filteredMessages = messages.filter(msg => msg._id !== messageId);
      set({ messages: filteredMessages });
    });

    socket.on("typing", ({ userId, isTyping }) => {
      const { selectedUser } = get();
      if (selectedUser && userId === selectedUser._id) {
        set({ 
          isTyping,
          typingUser: isTyping ? userId : null
        });
      }
    });

    socket.on("userDeleted", ({ userId }) => {
      const { users, selectedUser } = get();
      const updatedUsers = users.filter(user => user._id !== userId);
      set({ users: updatedUsers });
      
      // If the deleted user was selected, clear selection
      if (selectedUser && selectedUser._id === userId) {
        set({ selectedUser: null, messages: [] });
      }
    });

    socket.on("contactDeleted", ({ contactId, deletedMessagesCount }) => {
      // This event is received when the current user deletes a contact
      // The backend has already removed the contact from their inbox and deleted messages
      // We just need to update the UI to reflect the changes
      const { users, selectedUser, unreadMessages } = get();
      
      // Remove contact from users list
      const updatedUsers = users.filter(user => user._id !== contactId);
      
      // Clear unread messages for this contact
      const updatedUnreadMessages = { ...unreadMessages };
      delete updatedUnreadMessages[contactId];
      
      // Calculate new unread count
      const newUnreadCount = Object.values(updatedUnreadMessages).reduce((sum, count) => sum + count, 0);
      
      set({ 
        users: updatedUsers,
        unreadMessages: updatedUnreadMessages,
        unreadCount: newUnreadCount
      });
      
      // If the deleted contact was selected, clear selection and messages
      if (selectedUser && selectedUser._id === contactId) {
        set({ selectedUser: null, messages: [] });
      }
    });
    
    // Message request events
    socket.on("newMessageRequest", (request) => {
      const { addNewRequest } = get();
      addNewRequest(request);
      toast.info(`New message request from ${request.senderId.fullName}`);
    });
    
    socket.on("requestUpdated", (request) => {
      const { updateRequest } = get();
      updateRequest(request);
    });
    
    socket.on("requestAccepted", ({ requestId, sender }) => {
      // Request was accepted - sender is now in contacts
      const { addDiscoveredUser } = get();
      addDiscoveredUser(sender);
    });
    
    socket.on("requestRejected", ({ requestId }) => {
      // Request was rejected - remove from list
      const { messageRequests } = get();
      const updatedRequests = messageRequests.filter(req => req._id !== requestId);
      set({ messageRequests: updatedRequests });
    });
    
    socket.on("requestDeleted", ({ requestId }) => {
      // Request was deleted - remove from list
      const { messageRequests } = get();
      const updatedRequests = messageRequests.filter(req => req._id !== requestId);
      set({ messageRequests: updatedRequests });
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    socket.off("newMessage");
    socket.off("messageDeleted");
    socket.off("typing");
    socket.off("userDeleted");
    socket.off("contactDeleted");
    socket.off("newMessageRequest");
    socket.off("requestUpdated");
    socket.off("requestAccepted");
    socket.off("requestRejected");
    socket.off("requestDeleted");
    socket.off("chatListUpdate");
    socket.off("imageUploadStart");
    socket.off("imageUploadProgress");
    socket.off("imageUploadError");
    socket.off("userStatusChanged");
  },

  setSelectedUser: (selectedUser) => set({ selectedUser }),

  // User discovery methods
  addDiscoveredUser: (user) => {
    const { users } = get();
    const userExists = users.some(existingUser => existingUser._id === user._id);
    if (!userExists) {
      set({ users: [...users, user] });
    }
  },

  addDiscoveredUserAndSelect: (user) => {
    const { users } = get();
    const userExists = users.some(existingUser => existingUser._id === user._id);
    if (!userExists) {
      set({ users: [...users, user] });
    }
    set({ selectedUser: user });
  },

  fetchUserById: async (userId) => {
    try {
      const response = await axiosInstance.get(`/messages/search?query=${userId}`);
      const users = response.data;
      const user = users.find(u => u._id === userId);
      if (user) {
        addDiscoveredUser(user);
        return user;
      }
      return null;
    } catch (error) {
      console.error('Failed to fetch user:', error);
      return null;
    }
  },

  // Message Request Methods
  getMessageRequests: async () => {
    set({ isRequestsLoading: true });
    try {
      const response = await axiosInstance.get('/requests');
      set({ messageRequests: response.data });
    } catch (error) {
      console.error('Failed to fetch message requests:', error);
      toast.error('Failed to load message requests');
    } finally {
      set({ isRequestsLoading: false });
    }
  },

  getRequestCount: async () => {
    try {
      const response = await axiosInstance.get('/requests/count');
      set({ requestCount: response.data.count });
    } catch (error) {
      console.error('Failed to fetch request count:', error);
    }
  },

  acceptMessageRequest: async (requestId) => {
    try {
      const response = await axiosInstance.post(`/requests/${requestId}/accept`);
      const { messageRequests } = get();
      
      // Remove from requests
      const updatedRequests = messageRequests.filter(req => req._id !== requestId);
      set({ 
        messageRequests: updatedRequests,
        requestCount: Math.max(0, get().requestCount - 1)
      });
      
      // Add sender to users list
      if (response.data.sender) {
        const { addDiscoveredUser } = get();
        addDiscoveredUser(response.data.sender);
      }
      
      toast.success('Message request accepted');
    } catch (error) {
      console.error('Failed to accept request:', error);
      toast.error('Failed to accept message request');
    }
  },

  rejectMessageRequest: async (requestId) => {
    try {
      await axiosInstance.post(`/requests/${requestId}/reject`);
      const { messageRequests } = get();
      
      // Remove from requests
      const updatedRequests = messageRequests.filter(req => req._id !== requestId);
      set({ 
        messageRequests: updatedRequests,
        requestCount: Math.max(0, get().requestCount - 1)
      });
      
      toast.success('Message request rejected');
    } catch (error) {
      console.error('Failed to reject request:', error);
      toast.error('Failed to reject message request');
    }
  },

  deleteMessageRequest: async (requestId) => {
    try {
      await axiosInstance.delete(`/requests/${requestId}`);
      const { messageRequests } = get();
      
      // Remove from requests
      const updatedRequests = messageRequests.filter(req => req._id !== requestId);
      set({ 
        messageRequests: updatedRequests,
        requestCount: Math.max(0, get().requestCount - 1)
      });
      
      toast.success('Message request deleted');
    } catch (error) {
      console.error('Failed to delete request:', error);
      toast.error('Failed to delete message request');
    }
  },

  addNewRequest: (request) => {
    const { messageRequests, requestCount } = get();
    set({
      messageRequests: [request, ...messageRequests],
      requestCount: requestCount + 1
    });
  },

  updateRequest: (updatedRequest) => {
    const { messageRequests } = get();
    const updatedRequests = messageRequests.map(req => 
      req._id === updatedRequest._id ? updatedRequest : req
    );
    set({ messageRequests: updatedRequests });
  },

  // Clear optimistic messages (now just filters out optimistic messages)
  clearOptimisticMessages: () => {
    const { messages } = get();
    const confirmedMessages = messages.filter(msg => !msg.isOptimistic);
    set({ messages: confirmedMessages });
  },
}));
