import React from 'react';
import { AlertCircle, ArrowRight, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ChatMessage } from '../types/erp';

interface PackingAlertBannerProps {
  unreadMessages: ChatMessage[];
  onViewMessages: (message?: ChatMessage) => void;
  onDismiss: (messageId?: string) => void;
}

export const PackingAlertBanner: React.FC<PackingAlertBannerProps> = ({ 
  unreadMessages, 
  onViewMessages,
  onDismiss
}) => {
  if (!unreadMessages || unreadMessages.length === 0) return null;
  
  const latestMessage = unreadMessages[unreadMessages.length - 1];

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onViewMessages(latestMessage);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 100, opacity: 0, scale: 0.95 }}
        className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-[420px] bg-red-600 text-white rounded-2xl shadow-2xl p-4 sm:p-5 z-[999999] border-2 border-white/90 ring-4 ring-red-600/30 cursor-pointer transition-all hover:bg-red-700 hover:scale-[1.02] active:scale-[0.98] select-none"
        onClick={handleClick}
      >
        <div className="flex items-center justify-between gap-3 relative">
          {/* Left Icon */}
          <div className="bg-white/20 p-3 rounded-full animate-pulse shrink-0 flex items-center justify-center">
            <AlertCircle size={28} className="text-white" />
          </div>

          {/* Center Content */}
          <div className="flex-1 min-w-0">
            <h4 className="font-black text-sm sm:text-base uppercase tracking-wider text-white mb-1">
              NEW ORDER TO PACK!
            </h4>
            <p className="text-xs sm:text-sm text-white/95 font-medium leading-snug line-clamp-2 mb-3">
              {latestMessage.content}
            </p>
            <div className="inline-flex items-center text-[11px] font-extrabold bg-red-900/60 text-white px-3 py-1 rounded-md border border-red-400/30">
              {unreadMessages.length} Unread Notification{unreadMessages.length !== 1 ? 's' : ''}
            </div>
          </div>

          {/* Right Arrow Button */}
          <div 
            className="p-2 text-white hover:bg-white/20 rounded-full transition-all shrink-0 flex items-center justify-center cursor-pointer"
            onClick={handleClick}
            title="Open Order Station"
          >
            <ArrowRight size={26} className="stroke-[2.5]" />
          </div>

          {/* Close / Dismiss Button */}
          <button
            type="button"
            title="Dismiss notification"
            onClick={(e) => {
              e.stopPropagation();
              onDismiss(latestMessage.id);
            }}
            className="absolute -top-2 -right-2 p-1 bg-red-800 text-white hover:bg-red-900 rounded-full border border-white/40 transition-colors shadow-md cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

