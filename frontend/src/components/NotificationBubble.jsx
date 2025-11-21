import { useState, useEffect } from 'react';
import { MessageCircle, X, Volume2, VolumeX } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';

const NotificationBubble = ({ 
  isVisible, 
  onClose, 
  senderName, 
  messageText, 
  senderAvatar,
  onClick 
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const { authUser } = useAuthStore();

  useEffect(() => {
    if (isVisible && soundEnabled) {
      playNotificationSound();
    }
  }, [isVisible, soundEnabled]);

  const playNotificationSound = () => {
    if (isPlaying) return;
    
    setIsPlaying(true);
    const audio = new Audio('/notification.mp3'); // You can add a notification sound file
    audio.volume = 0.3;
    audio.play().catch(() => {
      // Fallback: use Web Audio API for a simple beep
      playBeepSound();
    });
    
    audio.onended = () => setIsPlaying(false);
  };

  const playBeepSound = () => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
    
    setTimeout(() => setIsPlaying(false), 500);
  };

  const toggleSound = (e) => {
    e.stopPropagation();
    setSoundEnabled(!soundEnabled);
  };

  if (!isVisible) return null;

  return (
    <div 
      className="fixed bottom-20 right-4 z-50 max-w-sm animate-slide-in-right"
      onClick={onClick}
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 cursor-pointer hover:shadow-xl transition-all duration-200">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full overflow-hidden">
              <img
                src={senderAvatar || "/avatar.png"}
                alt={senderName}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h4 className="font-semibold text-sm text-gray-900 dark:text-white">
                {senderName}
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                New message
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={toggleSound}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              title={soundEnabled ? "Disable sound" : "Enable sound"}
            >
              {soundEnabled ? (
                <Volume2 size={14} className="text-gray-500" />
              ) : (
                <VolumeX size={14} className="text-gray-500" />
              )}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
            >
              <X size={14} className="text-gray-500" />
            </button>
          </div>
        </div>

        {/* Message Preview */}
        <div className="flex items-start gap-2">
          <MessageCircle size={16} className="text-blue-500 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
            {messageText || "Sent a photo"}
          </p>
        </div>

        {/* Pulse indicator */}
        <div className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
      </div>
    </div>
  );
};

export default NotificationBubble;
