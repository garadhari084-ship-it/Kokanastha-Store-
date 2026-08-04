import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Truck, 
  Search, 
  Phone, 
  MapPin, 
  CheckCircle2, 
  Clock, 
  ChevronRight,
  TrendingUp,
  Package,
  AlertCircle,
  ExternalLink,
  Navigation,
  MessageSquare
} from 'lucide-react';
import { SalesOrder, Customer } from '../types/erp';
import { dbStore } from '../services/store';

interface TodayDeliveryModalProps {
  businessId: string;
  isOpen: boolean;
  onClose: () => void;
  orders: SalesOrder[];
  customers: Customer[];
  onAction: (order: SalesOrder) => void;
}

export const TodayDeliveryModal: React.FC<TodayDeliveryModalProps> = ({
  businessId,
  isOpen,
  onClose,
  orders,
  customers,
  onAction
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  const todayStr = new Date().toISOString().split('T')[0];
  
  const todayOrders = useMemo(() => {
    return orders.filter(o => o.delivery_date === todayStr);
  }, [orders, todayStr]);

  const stats = useMemo(() => {
    const pending = todayOrders.filter(o => o.status === 'Pending' || o.status === 'Packed').length;
    const dispatched = todayOrders.filter(o => o.status === 'Dispatched').length;
    const delivered = todayOrders.filter(o => o.status === 'Delivered').length;
    const totalAmount = todayOrders.reduce((sum, o) => sum + o.total_amount, 0);
    
    return {
      total: todayOrders.length,
      pending,
      dispatched,
      delivered,
      totalAmount
    };
  }, [todayOrders]);

  const filteredOrders = useMemo(() => {
    if (!searchTerm) return todayOrders;
    const lowSearch = searchTerm.toLowerCase();
    return todayOrders.filter(o => 
      o.order_number.toLowerCase().includes(lowSearch) ||
      o.customer_name?.toLowerCase().includes(lowSearch) ||
      o.area?.toLowerCase().includes(lowSearch)
    );
  }, [todayOrders, searchTerm]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
      />
      
      {/* Modal Content */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-4xl max-h-[85vh] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-white/20 dark:border-slate-800"
      >
        {/* Header Section */}
        <div className="relative p-6 bg-gradient-to-br from-emerald-600 to-teal-700 text-white overflow-hidden">
          {/* Abstract Pattern Overlay */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-400/20 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl" />
          
          <div className="relative flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
                  <Truck className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-black tracking-tight">Today's Delivery Dispatch</h2>
              </div>
              <p className="text-emerald-50/80 font-medium ml-11">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </p>
            </div>
            <button 
              onClick={onClose}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Stats Bar */}
          <div className="relative grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            {[
              { label: 'Total Tasks', value: stats.total, icon: Package, color: 'bg-white/10' },
              { label: 'Pending', value: stats.pending, icon: Clock, color: 'bg-amber-400/20' },
              { label: 'Out for Delivery', value: stats.dispatched, icon: Truck, color: 'bg-sky-400/20' },
              { label: 'Delivered', value: stats.delivered, icon: CheckCircle2, color: 'bg-emerald-400/20' }
            ].map((stat, idx) => (
              <div key={idx} className={`${stat.color} p-4 rounded-2xl backdrop-blur-md border border-white/10`}>
                <div className="flex items-center gap-2 mb-2">
                  <stat.icon className="w-4 h-4 opacity-70" />
                  <span className="text-xs font-bold uppercase tracking-wider opacity-80">{stat.label}</span>
                </div>
                <div className="text-2xl font-black">{stat.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text"
              placeholder="Search by order ID, customer or area..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all text-sm"
            />
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 bg-white dark:bg-slate-800 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
            <TrendingUp className="w-3 h-3 text-emerald-500" />
            Today's Target: ₹{stats.totalAmount.toLocaleString('en-IN')}
          </div>
        </div>

        {/* Orders List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          {filteredOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-full mb-3">
                <AlertCircle className="w-8 h-8" />
              </div>
              <p className="font-bold">No matching deliveries found</p>
              <p className="text-xs">Try adjusting your search criteria</p>
            </div>
          ) : (
            filteredOrders.map((order) => (
              <div 
                key={order.id}
                className="group p-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl hover:border-emerald-200 dark:hover:border-emerald-900 transition-all hover:shadow-lg hover:shadow-emerald-500/5"
              >
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  {/* Order Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-black text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded">
                        #{order.order_number}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                        order.status === 'Delivered' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' :
                        order.status === 'Dispatched' ? 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-400' :
                        'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                    <h3 className="font-black text-slate-800 dark:text-slate-100 text-lg">
                      {order.customer_name || 'Walk-in Customer'}
                    </h3>
                    <div className="flex flex-wrap items-center gap-3 mt-1">
                      <div className="flex items-center gap-1 text-xs text-slate-500">
                        <MapPin className="w-3 h-3" />
                        {order.area || 'General Area'}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-slate-500">
                        <Clock className="w-3 h-3" />
                        {order.time || 'No Time Set'}
                      </div>
                      <div className="flex items-center gap-1 text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded">
                        ₹{order.total_amount.toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="flex items-center gap-2">
                    {order.status !== 'Delivered' && (
                      <button 
                        onClick={() => onAction(order)}
                        className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/20 active:scale-95"
                      >
                        {order.status === 'Dispatched' ? 'Mark Delivered' : 'Assign Partner'}
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    )}
                    
                    <div className="flex items-center gap-1">
                      <a 
                        href={`tel:${order.customer_id}`} // Assuming ID might be phone or lookup needed
                        className="p-2 bg-slate-100 dark:bg-slate-700 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-slate-600 dark:text-slate-400 hover:text-emerald-600 transition-colors rounded-xl"
                        title="Call Customer"
                      >
                        <Phone className="w-4 h-4" />
                      </a>
                      <button 
                        className="p-2 bg-slate-100 dark:bg-slate-700 hover:bg-sky-100 dark:hover:bg-sky-900/40 text-slate-600 dark:text-slate-400 hover:text-sky-600 transition-colors rounded-xl"
                        title="Send Updates"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">
            OmniPack ERP • Delivery Intelligence
          </p>
          <button 
            onClick={onClose}
            className="px-6 py-2 text-xs font-black text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
          >
            DISMISS
          </button>
        </div>
      </motion.div>
    </div>
  );
};
