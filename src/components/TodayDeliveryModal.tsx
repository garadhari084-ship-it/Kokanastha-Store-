import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Truck, 
  Search, 
  MapPin, 
  CheckCircle2,
  Clock,
  TrendingUp,
  Package,
  AlertCircle
} from 'lucide-react';
import { SalesOrder, Customer } from '../types/erp';

interface TodayDeliveryModalProps {
  businessId: string;
  isOpen: boolean;
  onClose: () => void;
  orders: SalesOrder[];
  customers: Customer[];
  onAction: (order: SalesOrder) => void;
}

export const TodayDeliveryModal: React.FC<TodayDeliveryModalProps> = ({
  isOpen,
  onClose,
  orders,
  onAction
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'All' | 'Pending' | 'Dispatched' | 'Delivered'>('All');
  
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  
  const todayOrders = useMemo(() => {
    return orders.filter(o => {
      const isTodayDelivery = o.delivery_date === todayStr;
      const isTodayOrder = !o.delivery_date && o.order_date === todayStr;
      return isTodayDelivery || isTodayOrder;
    });
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
    let result = todayOrders;
    
    // Tab filtering
    if (activeTab === 'Pending') {
      result = result.filter(o => o.status === 'Pending' || o.status === 'Packed');
    } else if (activeTab === 'Dispatched') {
      result = result.filter(o => o.status === 'Dispatched');
    } else if (activeTab === 'Delivered') {
      result = result.filter(o => o.status === 'Delivered');
    }

    // Search filtering
    if (searchTerm) {
      const lowSearch = searchTerm.toLowerCase();
      result = result.filter(o => 
        o.order_number.toLowerCase().includes(lowSearch) ||
        o.customer_name?.toLowerCase().includes(lowSearch) ||
        o.area?.toLowerCase().includes(lowSearch)
      );
    }
    
    return result;
  }, [todayOrders, searchTerm, activeTab]);

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
        className="relative w-full max-w-5xl max-h-[90vh] bg-slate-50 dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-white/20 dark:border-slate-800"
      >
        {/* Header Section */}
        <div className="relative p-6 bg-gradient-to-br from-emerald-600 to-teal-700 text-white shrink-0">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-400/20 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl pointer-events-none" />
          
          <div className="relative flex items-start justify-between z-10">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="p-2.5 bg-white/20 rounded-2xl backdrop-blur-md border border-white/20 shadow-inner">
                  <Truck className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h2 className="text-3xl font-black tracking-tight drop-shadow-sm">Today's Delivery Dispatch</h2>
                  <p className="text-emerald-50/90 font-medium text-sm flex items-center gap-2 mt-0.5">
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-300"></span>
                    <span>{stats.total} Tasks Scheduled</span>
                  </p>
                </div>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2.5 bg-white/10 hover:bg-white/20 rounded-full transition-colors backdrop-blur-md border border-white/10 group"
            >
              <X className="w-5 h-5 group-hover:scale-110 transition-transform" />
            </button>
          </div>

          {/* Actionable Tabs inside header for better visual hierarchy */}
          <div className="relative mt-8 flex gap-3 overflow-x-auto pb-2 custom-scrollbar z-10">
            {[
              { id: 'All', label: 'TOTAL TASKS', value: stats.total, icon: Package },
              { id: 'Pending', label: 'PENDING', value: stats.pending, icon: Clock },
              { id: 'Dispatched', label: 'OUT FOR DELIVERY', value: stats.dispatched, icon: Truck },
              { id: 'Delivered', label: 'DELIVERED', value: stats.delivered, icon: CheckCircle2 }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-3 px-5 py-3 rounded-2xl border transition-all whitespace-nowrap ${
                  activeTab === tab.id 
                    ? 'bg-white text-emerald-700 border-white shadow-lg scale-105' 
                    : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
                }`}
              >
                <div className={`p-1.5 rounded-lg ${activeTab === tab.id ? 'bg-emerald-100' : 'bg-white/20'}`}>
                  <tab.icon className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <div className={`text-[10px] font-black uppercase tracking-wider opacity-80 ${activeTab === tab.id ? 'text-emerald-600' : 'text-emerald-100'}`}>
                    {tab.label}
                  </div>
                  <div className="text-xl font-black leading-none mt-0.5">{tab.value}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Filters & Search */}
        <div className="p-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shrink-0 z-10 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text"
              placeholder="Search by order ID, customer or area..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all text-sm font-medium text-slate-900 dark:text-slate-100"
            />
          </div>
          
          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-100 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-400">
            <TrendingUp className="w-4 h-4" />
            <span className="text-xs font-black uppercase tracking-wider">Today's Target:</span>
            <span className="text-sm font-black">₹{stats.totalAmount.toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* Orders List */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 md:p-6 bg-slate-50 dark:bg-slate-900 space-y-3 custom-scrollbar">
          <AnimatePresence mode="popLayout">
            {filteredOrders.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-16 text-slate-400"
              >
                <div className="p-5 bg-white dark:bg-slate-800 rounded-full mb-4 shadow-sm border border-slate-100 dark:border-slate-700">
                  <AlertCircle className="w-10 h-10 text-slate-300 dark:text-slate-500" />
                </div>
                <p className="font-bold text-lg text-slate-600 dark:text-slate-300">No deliveries found</p>
                <p className="text-sm text-slate-500 mt-1">
                  {searchTerm ? 'Try adjusting your search criteria' : 'There are no tasks for the selected status today'}
                </p>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {filteredOrders.map((order) => (
                  <motion.div 
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    key={order.id}
                    className="group bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl hover:border-emerald-300 dark:hover:border-emerald-700 transition-all hover:shadow-lg overflow-hidden flex flex-col"
                  >
                    <div className="p-4 flex-1">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-black text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-900/50 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700">
                            #{order.order_number}
                          </span>
                          <span className={`text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider ${
                            order.status === 'Delivered' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800' :
                            order.status === 'Dispatched' ? 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-400 border border-sky-200 dark:border-sky-800' :
                            'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                          }`}>
                            {order.status}
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-black text-slate-800 dark:text-slate-100">
                            ₹{order.total_amount.toLocaleString('en-IN')}
                          </div>
                          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                            {order.payment_status}
                          </div>
                        </div>
                      </div>

                      <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg mb-3">
                        {order.customer_name || 'Walk-in Customer'}
                      </h3>

                      <div className="flex flex-wrap items-center gap-4 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span className="truncate max-w-[120px]">{order.area || 'General Area'}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{order.time || 'Anytime'}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="px-4 py-3 bg-slate-50 dark:bg-slate-900/30 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                       <button
                         onClick={() => {
                           onClose();
                           onAction(order);
                         }}
                         className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors shadow-sm hover:shadow flex items-center gap-2"
                       >
                         Manage Delivery
                         <Truck className="w-3.5 h-3.5" />
                       </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};
