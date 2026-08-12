import React, { useState, useEffect } from 'react';
import { X, Send, CheckCircle, AlertTriangle, ExternalLink, Copy, User, FileText, DollarSign, Wallet, Star } from 'lucide-react';
import { SalesOrder, Customer, Business } from '../types/erp';
import { formatWhatsAppPhone, formatDisplayPhone } from '../utils/formatters';
import { getPublicInvoiceUrl } from '../utils/qrCode';

interface WhatsAppNotifyModalProps {
  order: SalesOrder | null;
  onClose: () => void;
  customers?: Customer[];
  business?: Business | null;
  triggerToast?: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export function generateWhatsAppInvoiceMessage(
  order: SalesOrder,
  customerName: string,
  businessName: string = 'कोकणस्थ',
  customGoogleReviewUrl?: string
): string {
  const billAmount = order.total_amount || 0;
  const paidAmount = order.paid_amount || 0;
  const balance = Math.max(0, billAmount - paidAmount);

  const formatAmount = (num: number) => {
    return num.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const formattedBill = formatAmount(billAmount);
  const formattedPaid = formatAmount(paidAmount);
  const formattedBalance = formatAmount(balance);
  
  const invoiceLink = getPublicInvoiceUrl(order.order_number);
  const googleReviewLink = customGoogleReviewUrl || 'https://share.google/92HZuDJaVzQA5Sd5x';

  if (balance <= 0) {
    return `Hello ${customerName || 'Customer'}, 👋\n\n` +
      `🙏 Thank you for shopping with ${businessName}!\n\n` +
      `✅ Payment Received Successfully\n\n` +
      `🧾 Invoice No.: ${order.order_number}\n` +
      `💰 Bill Amount: ₹${formattedBill}\n` +
      `✅ Paid Amount: ₹${formattedPaid}\n` +
      `💳 Balance: ₹0.00\n\n` +
      `📄 Download Invoice:\n${invoiceLink}\n\n` +
      `⭐ Please support us with a Google Review:\n${googleReviewLink}\n\n` +
      `Thank you for choosing ${businessName}.\n` +
      `स्वयंपाक कला तुमची… कृती कोकणस्थची!`;
  } else {
    return `Hello ${customerName || 'Customer'}, 👋\n\n` +
      `🙏 Thank you for shopping with ${businessName}!\n\n` +
      `🧾 Invoice Details\n` +
      `• Invoice No.: ${order.order_number}\n` +
      `• Bill Amount: ₹${formattedBill}\n` +
      `• Paid Amount: ₹${formattedPaid}\n` +
      `• Balance Payable: ₹${formattedBalance}\n\n` +
      `📄 View / Download Invoice\n${invoiceLink}\n\n` +
      `⭐ We’d love your feedback!\n` +
      `Please take a moment to rate your experience on Google:\n${googleReviewLink}\n\n` +
      `Thank you for choosing ${businessName}.\n` +
      `स्वयंपाक कला तुमची… कृती कोकणस्थची!`;
  }
}

export const WhatsAppNotifyModal: React.FC<WhatsAppNotifyModalProps> = ({
  order,
  onClose,
  customers = [],
  business,
  triggerToast
}) => {
  // Local message state so user can edit before sending
  const [message, setMessage] = useState<string>('');

  // Resolve customer name & phone safely
  const matchedCust = order ? customers.find(c => c.id === order.customer_id || (c.name && c.name.toLowerCase() === (order.customer_name || '').toLowerCase())) : null;
  const customerName = order?.customer_name || matchedCust?.name || 'Customer';
  const customerPhone = matchedCust?.phone || '';

  const businessName = business?.name || 'कोकणस्थ';
  const googleReviewUrl = (business as any)?.google_review_url || 'https://share.google/92HZuDJaVzQA5Sd5x';

  useEffect(() => {
    if (order) {
      setMessage(generateWhatsAppInvoiceMessage(order, customerName, businessName, googleReviewUrl));
    }
  }, [order, customerName, businessName, googleReviewUrl]);

  if (!order) return null;

  const billAmount = order.total_amount || 0;
  const paidAmount = order.paid_amount || 0;
  const balanceAmount = Math.max(0, billAmount - paidAmount);
  const isPaidInFull = balanceAmount <= 0;

  const invoiceLink = getPublicInvoiceUrl(order.order_number);

  const handleSendWhatsApp = () => {
    const cleanPhone = formatWhatsAppPhone(customerPhone);
    if (!cleanPhone) {
      if (triggerToast) {
        triggerToast('Customer phone number not available. Please enter/update phone number.', 'error');
      } else {
        alert('Customer phone number is missing!');
      }
      return;
    }

    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank');

    if (triggerToast) {
      triggerToast(`WhatsApp message dispatched for ${customerName}`, 'success');
    }
    onClose();
  };

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(message);
    if (triggerToast) {
      triggerToast('Message text copied to clipboard!', 'info');
    }
  };

  return (
    <div 
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[100] bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150 overflow-y-auto"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col my-auto animate-in zoom-in-95 duration-150 max-h-[92vh]">
        
        {/* Header */}
        <div className="bg-emerald-600 dark:bg-emerald-700 text-white p-4 sm:p-5 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-white/20 text-white backdrop-blur-xs">
              <Send size={20} className="stroke-[2.5]" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-100 block">WHATSAPP INVOICE DISPATCH</span>
              <h3 className="text-base sm:text-lg font-black leading-tight text-white">Send WhatsApp Message</h3>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto custom-scrollbar flex-1 text-xs">
          
          {/* Summary Information Card */}
          <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 dark:border-slate-700/80">
              <span className="font-extrabold text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <FileText size={14} className="text-emerald-600" /> Verification Info Card
              </span>
              {isPaidInFull ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 flex items-center gap-1 border border-emerald-300 dark:border-emerald-800">
                  <CheckCircle size={11} /> FULLY PAID
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 flex items-center gap-1 border border-amber-300 dark:border-amber-800">
                  <AlertTriangle size={11} /> BALANCE DUE
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2.5 text-[11.5px]">
              <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 font-bold uppercase block mb-0.5 flex items-center gap-1">
                  <User size={11} className="text-slate-500" /> Customer
                </span>
                <span className="font-black text-slate-900 dark:text-white truncate block">{customerName}</span>
                <span className="text-[10px] text-slate-500 font-medium block truncate">
                  {customerPhone ? formatDisplayPhone(customerPhone) : <span className="text-rose-500 font-bold">No Phone Added</span>}
                </span>
              </div>

              <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 font-bold uppercase block mb-0.5 flex items-center gap-1">
                  <FileText size={11} className="text-slate-500" /> Invoice No.
                </span>
                <span className="font-black text-indigo-600 dark:text-indigo-400 truncate block">{order.order_number}</span>
              </div>

              <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 font-bold uppercase block mb-0.5 flex items-center gap-1">
                  <DollarSign size={11} className="text-slate-500" /> Bill Amount
                </span>
                <span className="font-black text-slate-900 dark:text-white block">
                  ₹{billAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 font-bold uppercase block mb-0.5 flex items-center gap-1">
                  <Wallet size={11} className="text-emerald-500" /> Paid Amount
                </span>
                <span className="font-black text-emerald-600 dark:text-emerald-400 block">
                  ₹{paidAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              <div className={`col-span-2 p-2.5 rounded-xl border ${
                isPaidInFull 
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60' 
                  : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase flex items-center gap-1 text-slate-600 dark:text-slate-300">
                    {isPaidInFull ? '💳 Balance Status' : '⚠️ Balance Payable'}
                  </span>
                  <span className={`font-black text-sm ${isPaidInFull ? 'text-emerald-700 dark:text-emerald-300' : 'text-amber-700 dark:text-amber-300'}`}>
                    ₹{balanceAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <div className="col-span-2 space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-[10.5px] text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200/60 dark:border-slate-800">
                  <span className="font-bold flex items-center gap-1 text-slate-700 dark:text-slate-300">
                    📄 View Invoice Link
                  </span>
                  <a 
                    href={invoiceLink} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-semibold truncate max-w-[200px]"
                  >
                    {invoiceLink} <ExternalLink size={10} />
                  </a>
                </div>

                <div className="flex items-center justify-between text-[10.5px] text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200/60 dark:border-slate-800">
                  <span className="font-bold flex items-center gap-1 text-amber-600 dark:text-amber-400">
                    <Star size={11} fill="currentColor" /> Google Review Link
                  </span>
                  <a 
                    href={googleReviewUrl} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-semibold truncate max-w-[200px]"
                  >
                    {googleReviewUrl} <ExternalLink size={10} />
                  </a>
                </div>
              </div>

            </div>
          </div>

          {/* Editable Message Preview */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                💬 Message Preview
              </label>
              <button 
                onClick={handleCopyMessage}
                className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 flex items-center gap-1 cursor-pointer"
              >
                <Copy size={11} /> Copy Text
              </button>
            </div>

            <textarea 
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={9}
              className="w-full p-3 bg-slate-900 text-slate-100 font-mono text-[11px] leading-relaxed rounded-2xl border border-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none resize-none custom-scrollbar"
            />
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex gap-2">
          <button
            onClick={onClose}
            className="px-4 py-3 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-extrabold rounded-2xl transition cursor-pointer"
          >
            Cancel
          </button>
          
          <button
            onClick={handleSendWhatsApp}
            className="flex-1 py-3.5 px-6 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black text-sm transition cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 active:scale-[0.98]"
          >
            <Send size={18} className="fill-current" />
            <span>📲 Send WhatsApp Message</span>
          </button>
        </div>

      </div>
    </div>
  );
};
