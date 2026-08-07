import React from 'react';
import { AlertCircle, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ChatMessage } from '../types/erp';

interface PackingAlertBannerProps {
  unreadMessages: ChatMessage[];
  onViewMessages: () => void;
}

export const PackingAlertBanner: React.FC<PackingAlertBannerProps> = ({ unreadMessages, onViewMessages }) => {
  if (unreadMessages.length === 0) return null;
  
  const latestMessage = unreadMessages[unreadMessages.length - 1];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-red-600 text-white rounded-xl shadow-2xl p-4 z-[999999] border-2 border-white ring-4 ring-red-600/30 cursor-pointer"
        onClick={onViewMessages}
      >
        <div className="flex items-start gap-3">
          <div className="bg-white/20 p-2 rounded-full animate-pulse shrink-0">
            <AlertCircle size={24} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-black text-lg uppercase tracking-wider mb-1">New Order to Pack!</h4>
            <p className="text-sm text-red-50 font-medium leading-tight">
              {latestMessage.content}
            </p>
            <div className="mt-2 text-xs font-bold bg-black/20 inline-block px-2 py-1 rounded">
              {unreadMessages.length} Unread Notification{unreadMessages.length !== 1 ? 's' : ''}
            </div>
          </div>
          <ArrowRight size={20} className="text-white/70 self-center shrink-0" />
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
