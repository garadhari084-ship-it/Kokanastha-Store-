import React from 'react';
import { AlertTriangle, ArrowRight, X, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface OverdueAlertBannerProps {
  overdueCount: number;
  onViewOverdue: () => void;
  onDismiss: () => void;
}

export const OverdueAlertBanner: React.FC<OverdueAlertBannerProps> = ({
  overdueCount,
  onViewOverdue,
  onDismiss
}) => {
  if (overdueCount <= 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0, scale: 0.9 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 100, opacity: 0, scale: 0.9 }}
        className="fixed bottom-4 right-4 z-[999999] w-[92vw] sm:w-[430px] bg-gradient-to-r from-red-700 via-rose-800 to-red-900 text-white rounded-2xl shadow-2xl p-4 sm:p-5 border-2 border-red-400 ring-4 ring-red-600/30 cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98] select-none"
        onClick={onViewOverdue}
      >
        <div className="flex items-center justify-between gap-3 relative">
          {/* Pulsing Warning Icon */}
          <div className="bg-white/20 p-3 rounded-full animate-bounce shrink-0 flex items-center justify-center border border-white/30 shadow-inner">
            <AlertTriangle size={28} className="text-white" />
          </div>

          {/* Alert Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white text-red-800 shadow-sm">
                CRITICAL OVERDUE
              </span>
              <span className="text-[11px] font-extrabold text-red-100 flex items-center gap-1">
                <Clock size={12} /> Target Missed
              </span>
            </div>
            <h4 className="font-black text-sm sm:text-base text-white leading-tight">
              {overdueCount} Order{overdueCount !== 1 ? 's' : ''} Overdue!
            </h4>
            <p className="text-xs text-white/95 font-medium mt-0.5 leading-snug line-clamp-2">
              Delivery target has passed. Please open Packing Station to review & dispatch immediately.
            </p>
          </div>

          {/* Action Arrow */}
          <div 
            className="p-2.5 bg-white/20 hover:bg-white/30 text-white rounded-full transition-all shrink-0 flex items-center justify-center border border-white/30 shadow-md"
            title="Open Packing Verification Station"
          >
            <ArrowRight size={22} className="stroke-[2.5]" />
          </div>

          {/* Close / Dismiss Button */}
          <button
            type="button"
            title="Dismiss overdue alert"
            onClick={(e) => {
              e.stopPropagation();
              onDismiss();
            }}
            className="absolute -top-2.5 -right-2.5 p-1 bg-red-950 text-white hover:bg-red-900 rounded-full border border-white/60 transition-colors shadow-lg cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
