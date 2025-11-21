import React, { useState } from 'react';
import { Trash2, AlertTriangle, User, Shield, Bell } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { axiosInstance } from '../lib/axios';
import { toast } from 'react-hot-toast';
import AccountDeleteModal from '../components/AccountDeleteModal';
import { useNavigate } from 'react-router-dom';

const SettingsPage = () => {
  const { authUser, logout } = useAuthStore();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const navigate = useNavigate();

  const handleDeleteAccount = async (password) => {
    setIsDeleting(true);
    try {
      await axiosInstance.delete('/auth/delete-account', {
        data: { password }
      });
      
      toast.success('Account deleted successfully');
      logout();
      navigate('/login');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to delete account');
      console.error('Failed to delete account:', error);
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  return (
    <div className="min-h-screen bg-base-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-base-content mb-8">Settings</h1>
        
        <div className="grid gap-6">
          {/* Profile Section */}
          <div className="bg-base-200 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <User className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-semibold">Profile Information</h2>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-base-content/70">Full Name</label>
                <p className="text-base-content">{authUser?.fullName}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-base-content/70">Email</label>
                <p className="text-base-content">{authUser?.email}</p>
              </div>
            </div>
          </div>

          {/* Privacy Section */}
          <div className="bg-base-200 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-semibold">Privacy & Security</h2>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Profile Visibility</h3>
                  <p className="text-sm text-base-content/70">Control who can see your profile</p>
                </div>
                <div className="badge badge-primary">Public</div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Message Requests</h3>
                  <p className="text-sm text-base-content/70">Allow others to send you messages</p>
                </div>
                <input type="checkbox" className="toggle toggle-primary" defaultChecked />
              </div>
            </div>
          </div>

          {/* Notifications Section */}
          <div className="bg-base-200 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <Bell className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-semibold">Notifications</h2>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Message Notifications</h3>
                  <p className="text-sm text-base-content/70">Get notified about new messages</p>
                </div>
                <input type="checkbox" className="toggle toggle-primary" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Sound Notifications</h3>
                  <p className="text-sm text-base-content/70">Play sound for new messages</p>
                </div>
                <input type="checkbox" className="toggle toggle-primary" defaultChecked />
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-red-50 dark:bg-red-900/10 rounded-lg p-6 border border-red-200 dark:border-red-800">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-red-500" />
              <h2 className="text-xl font-semibold text-red-700 dark:text-red-400">Danger Zone</h2>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-red-700 dark:text-red-400">Delete Account</h3>
                  <p className="text-sm text-red-600 dark:text-red-500">
                    Permanently delete your account and all associated data
                  </p>
                </div>
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="btn btn-error btn-outline flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Account Modal */}
      <AccountDeleteModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteAccount}
        isLoading={isDeleting}
      />
    </div>
  );
};

export default SettingsPage;
