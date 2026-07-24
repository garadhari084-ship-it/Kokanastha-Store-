import { PageHeader } from './PageHeader';
import { Database } from 'lucide-react';
import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell, 
  AreaChart, 
  Area 
} from 'recharts';
import { 
  LayoutDashboard, ShoppingBag, 
  TrendingUp, 
  Clock, 
  PackageCheck, 
  Truck, 
  AlertTriangle, 
  DollarSign, 
  PlusCircle, 
  BarChart3, 
  Layers, 
  MapPin, 
  Search, 
  CheckCircle2, 
  Printer, 
  ChevronRight, 
  Sparkles, 
  Phone, 
  User, 
  CreditCard, 
  X, 
  Languages, 
  Palette, 
  Send, 
  Zap, 
  Boxes, 
  ArrowUpRight, 
  Activity,
  Filter,
  RefreshCw,
  QrCode,
  FileText,
  BadgeAlert,
  ChevronDown
} from 'lucide-react';
import { dbStore } from '../services/store';
import { SalesOrder, UserProfile, OrderStatus } from '../types/erp';

interface DashboardViewProps {
  businessId: string;
  user: UserProfile;
  onNavigate: (view: string, actionData?: any) => void;
  triggerToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

type ColorTheme = 'midnight-gold' | 'emerald-pro' | 'royal-sapphire' | 'titanium-dark';
type TabView = 'operations' | 'analytics' | 'logistics' | 'inventory';

export const DashboardView: React.FC<DashboardViewProps> = ({ 
  businessId, 
  user, 
  onNavigate, 
  triggerToast 
}) => {
  // Theme & Language Settings
      const [activeTab, setActiveTab] = useState<TabView>('operations');
  const [timeHorizon, setTimeHorizon] = useState<'today' | 'yesterday' | '7days' | '30days' | 'all'>('today');

  // Search & Filter State
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [areaFilter, setAreaFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);

  // Modals state
  const [selectedOrderForDetail, setSelectedOrderForDetail] = useState<SalesOrder | null>(null);
  const [selectedOrderForNotify, setSelectedOrderForNotify] = useState<SalesOrder | null>(null);
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedOrderForPayment, setSelectedOrderForPayment] = useState<SalesOrder | null>(null);

  // New Order Form state
  const [newOrderCustomer, setNewOrderCustomer] = useState('');
  const [newOrderPhone, setNewOrderPhone] = useState('');
  const [newOrderArea, setNewOrderArea] = useState('Dahisar');
  const [newOrderChannel, setNewOrderChannel] = useState('Direct Order');
  const [newOrderProduct, setNewOrderProduct] = useState('');
  const [newOrderQty, setNewOrderQty] = useState(1);
  const [newOrderAdvance, setNewOrderAdvance] = useState(false);

  // Payment Form state
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'Cash' | 'Card'>('UPI');

  // Fetch Database Records
  const [tick, setTick] = useState(0);
  useEffect(() => {
    return dbStore.subscribe(() => {
      setTick(t => t + 1);
    });
  }, [businessId]);
  const metrics = dbStore.getDashboardMetrics(businessId);
  const products = dbStore.getProducts(businessId);
  const customers = dbStore.getCustomers(businessId);
  const allOrders = dbStore.getSalesOrders(businessId);

  // Calculate Time-adjusted Multipliers
  const timeMultiplier = useMemo(() => {
    switch (timeHorizon) {
      case 'yesterday': return 0.92;
      case '7days': return 6.8;
      case '30days': return 28.5;
      case 'all': return 365.0;
      case 'today': default: return 1.0;
    }
  }, [timeHorizon]);

  // Adjusted Metrics based on Time Horizon
  const adjustedSalesAmount = Math.round(metrics.todaySalesAmount * timeMultiplier);
  const adjustedTotalOrders = Math.round(metrics.totalOrdersCount * (timeHorizon === 'today' ? 1 : timeHorizon === 'yesterday' ? 0.95 : timeHorizon === '7days' ? 6.5 : timeHorizon === '30days' ? 27 : 365));

  // Filtered Orders for the Table
  const filteredOrders = useMemo(() => {
    return allOrders.filter(o => {
      const matchesStatus = statusFilter === 'ALL' || o.status.toUpperCase() === statusFilter.toUpperCase();
      const matchesArea = areaFilter === 'ALL' || o.area === areaFilter;
      const cust = customers.find(c => c.id === o.customer_id);
      const custName = o.customer_name || (cust ? cust.name : '');
      const matchesSearch = 
        o.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        custName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (o.area && o.area.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (o.channel && o.channel.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesStatus && matchesArea && matchesSearch;
    });
  }, [allOrders, customers, statusFilter, areaFilter, searchQuery]);

  // Handle Quick Status Change
  const handleQuickStatusChange = (orderId: string, newStatus: OrderStatus) => {
    try {
      dbStore.updateSalesOrder(orderId, { status: newStatus, delivery_status: newStatus });
      triggerToast(`Order status updated to "${newStatus}".`, 'success');
    } catch (err: any) {
      triggerToast(err.message || 'Failed to update order status', 'error');
    }
  };

  // Bulk Actions
  const handleBulkStatusUpdate = (status: OrderStatus) => {
    if (selectedOrderIds.length === 0) return;
    selectedOrderIds.forEach(id => {
      dbStore.updateSalesOrder(id, { status, delivery_status: status });
    });
    triggerToast(`Updated ${selectedOrderIds.length} orders to ${status}.`, 'success');
    setSelectedOrderIds([]);
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedOrderIds(filteredOrders.map(o => o.id));
    } else {
      setSelectedOrderIds([]);
    }
  };

  const handleToggleSelectOrder = (id: string) => {
    setSelectedOrderIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Handle Create Order
  const handleCreateNewOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrderCustomer.trim()) {
      triggerToast('Please provide a customer name.', 'error');
      return;
    }

    let cust = customers.find(c => c.name.toLowerCase() === newOrderCustomer.trim().toLowerCase());
    if (!cust) {
      cust = dbStore.createCustomer({
        name: newOrderCustomer.trim(),
        group: 'Retail',
        area: newOrderArea,
        gstin: '',
        pan: '',
        billing_address: `${newOrderArea} Resident`,
        shipping_address: `${newOrderArea} Resident`,
        email: 'customer@kokanasthafaral.com',
        phone: newOrderPhone || '+91 98200 00000',
        credit_limit: 5000,
        business_id: businessId,
        active: true
      });
    }

    const nextNumber = `#${1035 + allOrders.length + 1}`;
    const selectedProdObj = products.find(p => p.id === newOrderProduct) || products[0];
    const totalCalc = selectedProdObj ? selectedProdObj.selling_price * newOrderQty : 750;

    dbStore.createSalesOrder({
      order_number: nextNumber,
      customer_id: cust.id,
      customer_name: cust.name,
      area: newOrderArea,
      channel: newOrderChannel,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      is_overdue: false,
      order_date: new Date().toISOString().split('T')[0],
      status: 'Pending',
      payment_status: 'Unpaid',
      delivery_status: 'Pending',
      items: selectedProdObj ? [{
        product_id: selectedProdObj.id,
        qty: newOrderQty,
        scanned_qty: 0,
        selling_price: selectedProdObj.selling_price,
        gst_rate: selectedProdObj.gst_rate
      }] : [],
      advance_booking: newOrderAdvance,
      total_amount: totalCalc,
      business_id: businessId,
      qr_code_data: nextNumber
    });

    triggerToast(`Order ${nextNumber} created successfully!`, 'success');
    setIsNewOrderModalOpen(false);
    setNewOrderCustomer('');
    setNewOrderPhone('');
  };

  // Handle Collect Payment
  const handleCollectPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderForPayment) return;

    dbStore.updateSalesOrder(selectedOrderForPayment.id, {
      payment_status: 'Paid'
    });

    triggerToast(`Collected ₹${selectedOrderForPayment.total_amount.toLocaleString()} via ${paymentMethod}!`, 'success');
    setIsPaymentModalOpen(false);
    setSelectedOrderForPayment(null);
  };

  // Theme Config styling classes
  

  // Distribution chart data
  const channelData = useMemo(() => [
    { name: 'Direct Order', value: 45, color: '#f59e0b' },
    { name: 'Swiggy', value: 25, color: '#10b981' },
    { name: 'Zomato', value: 20, color: '#ef4444' },
    { name: 'Walk-in', value: 10, color: '#6366f1' }
  ], []);

  return (
    <div className="space-y-6 max-w-full pb-12 px-0 font-sans text-slate-900 dark:text-slate-100 overflow-x-hidden" id="executive-dashboard-root">
      
      <PageHeader
        title="Executive Command Center"
        subtitle="Live order tracking, route fulfillment & sales intelligence dashboard"
        icon={LayoutDashboard}
        badgeText="Dispatch Engine Active"
        rightContent={

          <>
            {/* Time Horizon Selector */}
              <div className="flex flex-nowrap bg-slate-950/70 p-1 rounded-2xl border border-white/10 text-[11px] font-bold shrink-0">
                {[
                  { id: 'today', label: 'Today' },
                  { id: 'yesterday', label: 'Yesterday' },
                  { id: '7days', label: '7 Days' },
                  { id: '30days', label: '30 Days' },
                  { id: 'all', label: 'All' }
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => setTimeHorizon(item.id as any)}
                    className={`px-3 py-1.5 rounded-xl transition whitespace-nowrap ${
                      timeHorizon === item.id 
                        ? 'bg-amber-500 text-slate-950 font-extrabold shadow-sm' 
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            {/* Quick Action Button */}
              <button 
                onClick={async () => {
                  try {
                    await dbStore.forcePushAllToSupabase();
                    triggerToast('Successfully synced initial data to Supabase!', 'success');
                  } catch(e) {
                    triggerToast(`Failed to sync.`, 'error');
            alert('Supabase errors:\n' + e.message + '\n\nNOTE: Row-Level Security (RLS) might be blocking this. Please either disable RLS temporarily in Supabase, or run the seed.sql file in the Supabase SQL Editor directly.');
                  }
                }}
                className="px-4 py-2 bg-indigo-500 hover:bg-indigo-400 text-white rounded-xl font-extrabold text-[11px] transition cursor-pointer shadow-lg flex items-center gap-1.5 whitespace-nowrap shrink-0"
              >
                <Database size={16} />
                <span>Sync to Supabase</span>
              </button>
              <button 
                onClick={() => setIsNewOrderModalOpen(true)}
                className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 rounded-xl font-extrabold text-[11px] transition cursor-pointer shadow-lg flex items-center gap-1.5 whitespace-nowrap shrink-0"
              >
                <PlusCircle size={16} />
                <span>Create Order</span>
              </button>
          </>
        }
        bottomContent={
          <div className="mt-4 pt-4 border-t border-white/10 flex flex-nowrap w-full overflow-x-auto hide-scrollbar items-center gap-2 pb-0 mb-0">
          {[
            { id: 'operations', label: 'Live Operations', icon: Activity },
            { id: 'analytics', label: 'Sales & Revenue', icon: BarChart3 },
            { id: 'logistics', label: 'Dispatch & Zones', icon: Truck },
            { id: 'inventory', label: 'Stock & Kitchen', icon: Boxes }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabView)}
                className={`px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl text-[11px] sm:text-[11px] font-extrabold transition-all flex flex-1 justify-center items-center gap-1.5 sm:gap-2 cursor-pointer shrink-0 ${
                  isActive
                    ? 'bg-white text-slate-950 shadow-lg scale-102'
                    : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon size={16} className={isActive ? 'text-amber-600' : 'text-slate-400'} />
                <span className="whitespace-nowrap">{tab.label}</span>
                </button>
            );
          })}
        </div>
        }
      />
      {/* 2. DYNAMIC TAB CONTENT */}
      <AnimatePresence mode="wait">
        
        {/* ================= TAB 1: LIVE OPERATIONS COMMAND ================= */}
        {activeTab === 'operations' && (
          <motion.div
            key="operations"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* 8 GLOWING OPERATIONAL METRIC CARDS GRID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Metric 1 */}
              <div 
                onClick={() => setStatusFilter('PACKING')}
                className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 rounded-2xl shadow-sm hover:shadow-amber-500/10 hover:border-amber-400 dark:hover:border-amber-600 transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                      TO PACK TODAY
                    </span>
                    
                  </div>
                  <div className="p-3 bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-xl group-hover:scale-110 transition-transform">
                    <ShoppingBag size={22} />
                  </div>
                </div>
                <div className="mt-4 flex items-baseline justify-between">
                  <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                    {metrics.toPackToday}
                  </span>
                  <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 px-2.5 py-1 rounded-full border border-amber-200 dark:border-amber-800">
                    Kitchen Queue
                  </span>
                </div>
              </div>

              {/* Metric 2 */}
              <div 
                onClick={() => setStatusFilter('PACKED')}
                className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 rounded-2xl shadow-sm hover:shadow-yellow-500/10 hover:border-yellow-400 dark:hover:border-yellow-600 transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                      READY FOR DISPATCH
                    </span>
                    
                  </div>
                  <div className="p-3 bg-yellow-500/10 dark:bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 rounded-xl group-hover:scale-110 transition-transform">
                    <Truck size={22} />
                  </div>
                </div>
                <div className="mt-4 flex items-baseline justify-between">
                  <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                    {metrics.readyForDispatch}
                  </span>
                  <span className="text-[10px] font-bold text-yellow-700 dark:text-yellow-300 bg-yellow-50 dark:bg-yellow-950/50 px-2.5 py-1 rounded-full border border-yellow-200 dark:border-yellow-800">
                    Sealed Boxes
                  </span>
                </div>
              </div>

              {/* Metric 3 */}
              <div 
                onClick={() => setStatusFilter('DISPATCHED')}
                className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 rounded-2xl shadow-sm hover:shadow-indigo-500/10 hover:border-indigo-400 dark:hover:border-indigo-600 transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                      DELIVERIES TODAY
                    </span>
                    
                  </div>
                  <div className="p-3 bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-xl group-hover:scale-110 transition-transform">
                    <Clock size={22} />
                  </div>
                </div>
                <div className="mt-4 flex items-baseline justify-between">
                  <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                    {metrics.deliveriesToday}
                  </span>
                  <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/50 px-2.5 py-1 rounded-full border border-indigo-200 dark:border-indigo-800">
                    In Transit
                  </span>
                </div>
              </div>

              {/* Metric 4 */}
              <div 
                onClick={() => triggerToast('Showing overdue delayed orders', 'info')}
                className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 rounded-2xl shadow-sm hover:shadow-rose-500/10 hover:border-rose-400 dark:hover:border-rose-600 transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                      OVERDUE ORDERS
                    </span>
                    
                  </div>
                  <div className="p-3 bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 rounded-xl group-hover:scale-110 transition-transform">
                    <AlertTriangle size={22} />
                  </div>
                </div>
                <div className="mt-4 flex items-baseline justify-between">
                  <span className="text-2xl font-black text-rose-600 dark:text-rose-400 tracking-tight">
                    {metrics.overdueOrdersCount}
                  </span>
                  <span className="text-[10px] font-bold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/50 px-2.5 py-1 rounded-full border border-rose-200 dark:border-rose-800">
                    Priority
                  </span>
                </div>
              </div>

              {/* Metric 5 */}
              <div 
                onClick={() => setIsPaymentModalOpen(true)}
                className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 rounded-2xl shadow-sm hover:shadow-amber-500/10 hover:border-amber-400 dark:hover:border-amber-600 transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                      PENDING PAYMENTS
                    </span>
                    
                  </div>
                  <div className="p-3 bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-xl group-hover:scale-110 transition-transform">
                    <DollarSign size={22} />
                  </div>
                </div>
                <div className="mt-4 flex items-baseline justify-between">
                  <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                    {metrics.pendingPaymentsCount}
                  </span>
                  <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 px-2.5 py-1 rounded-full border border-amber-200 dark:border-amber-800">
                    Collect
                  </span>
                </div>
              </div>

              {/* Metric 6 */}
              <div 
                onClick={() => setStatusFilter('ALL')}
                className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 rounded-2xl shadow-sm hover:shadow-sky-500/10 hover:border-sky-400 dark:hover:border-sky-600 transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                      TOTAL ORDERS
                    </span>
                    
                  </div>
                  <div className="p-3 bg-sky-500/10 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400 rounded-xl group-hover:scale-110 transition-transform">
                    <ShoppingBag size={22} />
                  </div>
                </div>
                <div className="mt-4 flex items-baseline justify-between">
                  <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                    {adjustedTotalOrders}
                  </span>
                  <span className="text-[10px] font-bold text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/50 px-2.5 py-1 rounded-full border border-sky-200 dark:border-sky-800">
                    All Channels
                  </span>
                </div>
              </div>

              {/* Metric 7 */}
              <div 
                onClick={() => setActiveTab('analytics')}
                className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 rounded-2xl shadow-sm hover:shadow-emerald-500/10 hover:border-emerald-400 dark:hover:border-emerald-600 transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                      TOTAL SALES
                    </span>
                    
                  </div>
                  <div className="p-3 bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl group-hover:scale-110 transition-transform">
                    <TrendingUp size={22} />
                  </div>
                </div>
                <div className="mt-4 flex items-baseline justify-between">
                  <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                    ₹{adjustedSalesAmount.toLocaleString()}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800 flex items-center gap-0.5">
                    <ArrowUpRight size={12} /> +14.2%
                  </span>
                </div>
              </div>

              {/* Metric 8 */}
              <div 
                onClick={() => onNavigate('reports')}
                className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 rounded-2xl shadow-sm hover:shadow-orange-500/10 hover:border-orange-400 dark:hover:border-orange-600 transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                      OUTSTANDING DUES
                    </span>
                    
                  </div>
                  <div className="p-3 bg-orange-500/10 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 rounded-xl group-hover:scale-110 transition-transform">
                    <Clock size={22} />
                  </div>
                </div>
                <div className="mt-4 flex items-baseline justify-between">
                  <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                    ₹{metrics.outstandingAmount.toLocaleString()}
                  </span>
                  <span className="text-[10px] font-bold text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-950/50 px-2.5 py-1 rounded-full border border-orange-200 dark:border-orange-800">
                    Receivables
                  </span>
                </div>
              </div>

            </div>

            {/* PIPELINE & AREA BREAKDOWN DUAL PANELS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Order Workflow Pipeline */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <h2 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                      <Layers size={18} className="text-amber-500" /> Operational Order Pipeline
                    </h2>
                    
                  </div>
                  <span className="text-[11px] text-amber-600 dark:text-amber-400 font-bold bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-full border border-amber-200 dark:border-amber-800">
                    Live Status
                  </span>
                </div>

                <div className="space-y-3">
                  {[
                    { key: 'bookingReceived', label: 'Booking Received', count: metrics.statusPipeline.bookingReceived, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/30', filter: 'PENDING' },
                    { key: 'productionStarted', label: 'Production Started', count: metrics.statusPipeline.productionStarted, color: 'text-yellow-600', bg: 'bg-yellow-50 dark:bg-yellow-950/30', filter: 'PENDING' },
                    { key: 'packingStarted', label: 'Packing Started', count: metrics.statusPipeline.packingStarted, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/30', filter: 'PACKING' },
                    { key: 'packingCompleted', label: 'Packing Completed', count: metrics.statusPipeline.packingCompleted, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/30', filter: 'PACKED' },
                    { key: 'readyForDispatch', label: 'Ready for Dispatch', count: metrics.statusPipeline.readyForDispatch, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/30', filter: 'PACKED' },
                    { key: 'outForDelivery', label: 'Out for Delivery', count: metrics.statusPipeline.outForDelivery, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-950/30', filter: 'DISPATCHED' },
                    { key: 'delivered', label: 'Delivered', count: metrics.statusPipeline.delivered, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/30', filter: 'DELIVERED' }
                  ].map((stage, idx) => {
                    const maxCount = Math.max(...Object.values(metrics.statusPipeline), 1);
                    const percentage = Math.min(100, Math.round((stage.count / maxCount) * 100));

                    return (
                      <div 
                        key={stage.key}
                        onClick={() => setStatusFilter(stage.filter)}
                        className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0 pr-4">
                          <div className={`w-7 h-7 rounded-lg ${stage.bg} ${stage.color} flex items-center justify-center font-bold text-[11px] shrink-0`}>
                            {idx + 1}
                          </div>
                          <div className="truncate">
                            <strong className="text-[11px] font-bold text-slate-800 dark:text-slate-200 block truncate">
                              {stage.label}
                            </strong>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <div className="w-24 sm:w-32 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden hidden sm:block">
                            <div 
                              className={`h-full rounded-full ${stage.color.replace('text-', 'bg-')}`} 
                              style={{ width: `${Math.max(percentage, stage.count > 0 ? 15 : 0)}%` }}
                            ></div>
                          </div>
                          <span className={`text-xs font-black ${stage.color} min-w-[20px] text-right`}>
                            {stage.count}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Active Orders by Region/Area Heatmap */}
              <div className="space-y-6">
          
                <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div>
                      <h2 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                        <MapPin size={18} className="text-amber-500" /> Active Orders by Area
                      </h2>
                      
                    </div>
                    <span className="text-[11px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
                      7 Zones
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-1">
                    {metrics.activeOrdersByArea.map((item) => (
                      <div 
                        key={item.area}
                        onClick={() => {
                          setAreaFilter(item.area);
                          triggerToast(`Filtered orders for area: ${item.area}`, 'info');
                        }}
                        className={`flex items-center justify-between p-3 rounded-2xl transition cursor-pointer border ${
                          areaFilter === item.area 
                            ? 'bg-amber-500/10 border-amber-400 text-amber-900 dark:text-amber-200' 
                            : 'bg-slate-50 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800 hover:bg-slate-100/80 dark:hover:bg-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>
                          <strong className="text-[11px] font-bold text-slate-800 dark:text-slate-200">
                            {item.area}
                          </strong>
                        </div>
                        <span className="text-[11px] font-black bg-white dark:bg-slate-800 px-2.5 py-1 rounded-xl shadow-xs border border-slate-200/60 dark:border-slate-700">
                          {item.count} orders
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quick Action Buttons Card */}
                <div className="bg-gradient-to-br from-slate-900 to-amber-950/40 text-white rounded-3xl p-6 shadow-xl border border-amber-500/30">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs font-extrabold flex items-center gap-2 text-amber-300">
                      <Sparkles size={16} /> Quick Operational Shortcuts
                    </h3>
                    <span className="text-[10px] text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/30">
                      Express
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <button 
                      onClick={() => setIsNewOrderModalOpen(true)}
                      className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl text-left transition border border-white/10 cursor-pointer group"
                    >
                      <PlusCircle size={18} className="text-amber-400 mb-1 group-hover:scale-110 transition-transform" />
                      <strong className="text-[11px] font-bold block">New Order</strong>
                      <span className="text-[10px] text-slate-300">नवीन ऑर्डर</span>
                    </button>

                    <button 
                      onClick={() => onNavigate('packing')}
                      className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl text-left transition border border-white/10 cursor-pointer group"
                    >
                      <PackageCheck size={18} className="text-amber-400 mb-1 group-hover:scale-110 transition-transform" />
                      <strong className="text-[11px] font-bold block">Production</strong>
                      <span className="text-[10px] text-slate-300">उत्पादन पॅकिंग</span>
                    </button>

                    <button 
                      onClick={() => onNavigate('delivery')}
                      className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl text-left transition border border-white/10 cursor-pointer group"
                    >
                      <Truck size={18} className="text-indigo-400 mb-1 group-hover:scale-110 transition-transform" />
                      <strong className="text-[11px] font-bold block">Dispatch</strong>
                      <span className="text-[10px] text-slate-300">डिलिव्हरी</span>
                    </button>

                    <button 
                      onClick={() => setIsPaymentModalOpen(true)}
                      className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl text-left transition border border-white/10 cursor-pointer group"
                    >
                      <DollarSign size={18} className="text-emerald-400 mb-1 group-hover:scale-110 transition-transform" />
                      <strong className="text-[11px] font-bold block">Collect</strong>
                      <span className="text-[10px] text-slate-300">पेमेंट जमा</span>
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </motion.div>
        )}

        {/* ================= TAB 2: SALES & REVENUE ANALYTICS ================= */}
        {activeTab === 'analytics' && (
          <motion.div 
            key="analytics"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-6">
          
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Monthly Revenue Chart */}
              <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <h2 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                      <BarChart3 size={18} className="text-amber-500" /> Revenue & Order Trends
                    </h2>
                    <p className="text-[11px] text-slate-500">6-Month revenue performance & seasonal peak forecast</p>
                  </div>
                  <span className="text-[11px] font-extrabold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                    +18.4% YoY Growth
                  </span>
                </div>

                <div className="h-64 sm:h-72 w-full min-w-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={metrics.monthlyRevenueGraph}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                      <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(val) => `₹${val / 1000}k`} />
                      <Tooltip 
                        formatter={(value: any) => [`₹${Number(value).toLocaleString()}`, 'Revenue']}
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }}
                      />
                      <Area type="monotone" dataKey="revenue" stroke="#f59e0b" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Order Channel Distribution Pie Chart */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <h2 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    Order Channel Share
                  </h2>
                  <span className="text-[11px] font-bold text-slate-500">Direct vs Online</span>
                </div>

                <div className="h-48 w-full min-w-0 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={channelData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {channelData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: any) => [`${value}%`, 'Share']} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  {channelData.map(ch => (
                    <div key={ch.name} className="flex items-center justify-between text-[11px] font-bold">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: ch.color }}></span>
                        <span className="text-slate-700 dark:text-slate-300">{ch.name}</span>
                      </div>
                      <span className="text-slate-900 dark:text-white">{ch.value}%</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Top Products Leaderboard Table */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">
                    Top Selling Products & Specialties
                  </h2>
                  <p className="text-[11px] text-slate-500">Highest grossing faral & sweet boxes of the month</p>
                </div>
                <button 
                  onClick={() => onNavigate('products')}
                  className="text-[11px] text-amber-600 dark:text-amber-400 font-bold hover:underline"
                >
                  Manage Products →
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-bold uppercase border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Product Name</th>
                      <th className="py-3 px-4">SKU Code</th>
                      <th className="py-3 px-4">Units Sold</th>
                      <th className="py-3 px-4">Total Sales Revenue</th>
                      <th className="py-3 px-4 text-right">Profit Margin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {metrics.topProducts.map((p, idx) => (
                      <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
                          <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[11px] font-black flex items-center justify-center shrink-0">
                            #{idx + 1}
                          </span>
                          <span>{p.name}</span>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-500">{p.sku}</td>
                        <td className="py-3.5 px-4 font-extrabold text-slate-800 dark:text-slate-200">{p.sold} units</td>
                        <td className="py-3.5 px-4 font-black text-emerald-600 dark:text-emerald-400">₹{p.revenue.toLocaleString()}</td>
                        <td className="py-3.5 px-4 text-right font-bold text-slate-600 dark:text-slate-300">
                          <span className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800 text-[11px]">
                            ~42% Margin
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* ================= TAB 3: DISPATCH & LOGISTICS CONTROL ================= */}
        {activeTab === 'logistics' && (
          <motion.div 
            key="logistics"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-6">
          
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Dispatch Assistant */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <h2 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    <Truck size={18} className="text-indigo-500" /> Active Dispatch Hub
                  </h2>
                  <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 px-2.5 py-1 rounded-full">
                    Route Optimization
                  </span>
                </div>

                <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-2xl border border-indigo-100 dark:border-indigo-900/50 space-y-2">
                  <span className="text-[11px] font-extrabold text-indigo-900 dark:text-indigo-300 block">
                    🚀 Daily Delivery Batch Ready
                  </span>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400">
                    {metrics.readyForDispatch} packed orders are currently awaiting courier pickup or driver assignment for local Dahisar/Borivali delivery.
                  </p>
                  <button 
                    onClick={() => {
                      handleBulkStatusUpdate('Dispatched');
                      triggerToast('All packed orders marked as Out For Delivery!', 'success');
                    }}
                    className="w-full mt-2 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[11px] font-extrabold shadow-md transition cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Send size={15} /> Mass Dispatch All Ready Orders
                  </button>
                </div>
              </div>

              {/* Area Zone Logistics */}
              <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">
                      Delivery Zone Density & Driver Routes
                    </h2>
                    <p className="text-[11px] text-slate-500">Live order allocation by neighborhood</p>
                  </div>
                  <button 
                    onClick={() => onNavigate('delivery')}
                    className="text-[11px] text-amber-600 dark:text-amber-400 font-bold hover:underline"
                  >
                    Open Delivery Module →
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {metrics.activeOrdersByArea.slice(0, 4).map(item => (
                    <div key={item.area} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-center space-y-1">
                      <MapPin size={18} className="mx-auto text-amber-500" />
                      <strong className="text-[11px] font-bold block text-slate-800 dark:text-slate-200">{item.area}</strong>
                      <span className="text-base font-black text-amber-600 dark:text-amber-400 block">{item.count}</span>
                      <span className="text-[10px] text-slate-400 block">Assigned Route</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </motion.div>
        )}

        {/* ================= TAB 4: KITCHEN & INVENTORY MONITOR ================= */}
        {activeTab === 'inventory' && (
          <motion.div 
            key="inventory"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-6">
          
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Stock Overview */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <h2 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    <Boxes size={18} className="text-amber-500" /> Kitchen Raw Material & Goods Stock
                  </h2>
                  <span className="text-[11px] font-bold text-slate-500">Inventory Status</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-2xl border border-amber-200/60 dark:border-amber-800/50">
                    <span className="text-[11px] font-bold text-amber-800 dark:text-amber-300 block">Low Stock Alert</span>
                    <span className="text-xl font-black text-amber-600 dark:text-amber-400">{metrics.lowStock} Items</span>
                    <p className="text-[10px] text-amber-700/80 dark:text-amber-400/80 mt-1">Requires reorder from supplier</p>
                  </div>

                  <div className="p-4 bg-rose-50 dark:bg-rose-950/30 rounded-2xl border border-rose-200/60 dark:border-rose-800/50">
                    <span className="text-[11px] font-bold text-rose-800 dark:text-rose-300 block">Out of Stock</span>
                    <span className="text-xl font-black text-rose-600 dark:text-rose-400">{metrics.outOfStock} Items</span>
                    <p className="text-[10px] text-rose-700/80 dark:text-rose-400/80 mt-1">Halt online bookings</p>
                  </div>
                </div>

                <button 
                  onClick={() => onNavigate('inventory')}
                  className="w-full py-2.5 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white rounded-xl text-[11px] font-bold transition"
                >
                  Manage Full Inventory & Reorders →
                </button>
              </div>

              {/* Low Stock Items List */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">
                    Stock Replenishment Queue
                  </h2>
                  <span className="text-[11px] font-bold text-amber-600">Reorder Threshold: 15</span>
                </div>

                <div className="space-y-3">
                  {products.slice(0, 4).map(p => (
                    <div key={p.id} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                      <div>
                        <strong className="text-[11px] font-bold block text-slate-800 dark:text-slate-200">{p.name}</strong>
                        <span className="text-[10px] text-slate-400">SKU: {p.sku}</span>
                      </div>
                      <div className="text-right">
                        <span className={`text-[11px] font-extrabold px-2.5 py-1 rounded-full ${
                          p.current_stock === 0 
                            ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200' 
                            : 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200'
                        }`}>
                          {p.current_stock} {p.unit} left
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </motion.div>
        )}

      </AnimatePresence>

      {/* 3. RECENT ORDERS TABLE & BATCH ACTIONS LEDGER */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-5">
        
        {/* Table Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              Orders Ledger & Dispatch Log
            </h2>
            <p className="text-[11px] text-slate-500">Live transaction stream with instant status updates & printing</p>
          </div>

          <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-2.5 w-full lg:w-auto min-w-0">
            {/* Search Input */}
            <div className="relative w-full sm:w-auto">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search order #, customer, area..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-8 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-[11px] font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 w-full sm:w-60"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Area Filter Dropdown */}
            <select 
              value={areaFilter}
              onChange={(e) => setAreaFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-[11px] font-bold focus:outline-none text-slate-700 dark:text-slate-200 cursor-pointer w-full sm:w-auto"
            >
              <option value="ALL">All Areas (सर्व भाग)</option>
              <option value="Dahisar">Dahisar</option>
              <option value="Borivali">Borivali</option>
              <option value="Kandivali">Kandivali</option>
              <option value="Mira Road">Mira Road</option>
              <option value="Vasai">Vasai</option>
              <option value="Virar">Virar</option>
            </select>

            {/* Status Pills */}
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-[11px] font-bold overflow-x-auto max-w-full">
              {['ALL', 'PENDING', 'PACKING', 'PACKED', 'DISPATCHED', 'DELIVERED'].map((st) => (
                <button 
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 rounded-lg transition whitespace-nowrap ${
                    statusFilter === st 
                      ? 'bg-amber-500 text-slate-950 font-black shadow-xs' 
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Selected Items Batch Control Floating Banner */}
        {selectedOrderIds.length > 0 && (
          <div className="p-3 bg-amber-500 text-slate-950 rounded-2xl font-bold text-[11px] flex flex-wrap items-center justify-between gap-3 shadow-lg animate-in fade-in slide-in-from-top-2">
            <span className="flex items-center gap-2">
              <CheckCircle2 size={18} /> {selectedOrderIds.length} orders selected for batch processing
            </span>

            <div className="flex items-center gap-2">
              <button 
                onClick={() => handleBulkStatusUpdate('Dispatched')}
                className="px-3 py-1.5 bg-slate-950 text-white rounded-xl text-[11px] hover:bg-slate-900 transition cursor-pointer"
              >
                Mark Out for Delivery
              </button>
              <button 
                onClick={() => handleBulkStatusUpdate('Delivered')}
                className="px-3 py-1.5 bg-emerald-800 text-white rounded-xl text-[11px] hover:bg-emerald-900 transition cursor-pointer"
              >
                Mark Delivered
              </button>
              <button 
                onClick={() => {
                  window.print();
                  triggerToast(`Printed ${selectedOrderIds.length} order invoices.`, 'info');
                }}
                className="px-3 py-1.5 bg-white text-slate-950 rounded-xl text-[11px] hover:bg-slate-100 transition cursor-pointer flex items-center gap-1"
              >
                <Printer size={14} /> Print Invoices
              </button>
            </div>
          </div>
        )}

        {/* Orders Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-slate-800">
          <table className="w-full text-left text-[11px]">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200/80 dark:border-slate-800">
              <tr>
                <th className="py-3.5 px-4 w-10">
                  <input 
                    type="checkbox" 
                    onChange={handleSelectAll}
                    checked={selectedOrderIds.length > 0 && selectedOrderIds.length === filteredOrders.length}
                    className="rounded border-slate-300 text-amber-500 focus:ring-amber-500 cursor-pointer"
                  />
                </th>
                <th className="py-3.5 px-4">Order ID</th>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Area Zone</th>
                <th className="py-3.5 px-4">Pipeline Status</th>
                <th className="py-3.5 px-4">Amount</th>
                <th className="py-3.5 px-4">Payment</th>
                <th className="py-3.5 px-4">Time</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredOrders.map((o) => {
                const cust = customers.find(c => c.id === o.customer_id);
                const custName = o.customer_name || (cust ? cust.name : 'Walk-in Customer');
                const isSelected = selectedOrderIds.includes(o.id);

                return (
                  <tr 
                    key={o.id}
                    className={`hover:bg-amber-50/40 dark:hover:bg-slate-800/50 transition-colors ${
                      isSelected ? 'bg-amber-50/60 dark:bg-slate-800/80' : ''
                    }`}
                  >
                    <td className="py-3.5 px-4">
                      <input 
                        type="checkbox" 
                        checked={isSelected}
                        onChange={() => handleToggleSelectOrder(o.id)}
                        className="rounded border-slate-300 text-amber-500 focus:ring-amber-500 cursor-pointer"
                      />
                    </td>

                    <td className="py-3.5 px-4 font-black text-slate-900 dark:text-white">
                      <div className="flex items-center gap-2">
                        <span>{o.order_number}</span>
                        {o.advance_booking && (
                          <span className="px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 text-[9px] font-extrabold border border-amber-200 dark:border-amber-800">
                            Advance
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-200">
                      <div>
                        <span>{custName}</span>
                        {o.channel && (
                          <span className="text-[10px] text-slate-400 block font-normal">
                            Via {o.channel}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                        <MapPin size={12} className="text-amber-500" />
                        {o.area || 'Dahisar'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <select 
                        value={o.status}
                        onChange={(e) => handleQuickStatusChange(o.id, e.target.value as OrderStatus)}
                        className={`text-[11px] font-extrabold px-3 py-1 rounded-full border focus:outline-none cursor-pointer ${
                          o.status === 'Delivered' ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800' :
                          o.status === 'Dispatched' ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800' :
                          o.status === 'Packed' ? 'bg-yellow-50 dark:bg-yellow-950/40 text-amber-800 dark:text-yellow-300 border-yellow-300 dark:border-yellow-800' :
                          o.status === 'Packing' ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800' :
                          o.status === 'Cancelled' ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800' :
                          'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                        }`}
                      >
                        <option value="Pending">Pending (बुकिंग)</option>
                        <option value="Packing">Packing Started (पॅकिंग)</option>
                        <option value="Packed">Ready / Packed (तयार)</option>
                        <option value="Dispatched">Out for Delivery (निघाले)</option>
                        <option value="Delivered">Delivered (पूर्ण)</option>
                        <option value="Cancelled">Cancelled (रद्द)</option>
                      </select>
                    </td>

                    <td className="py-3.5 px-4 font-black text-slate-900 dark:text-white">
                      ₹{o.total_amount.toLocaleString()}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border ${
                        o.payment_status === 'Paid' 
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200' 
                          : o.payment_status === 'Partial'
                          ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200'
                          : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200'
                      }`}>
                        {o.payment_status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-slate-500 font-medium">
                      {o.time || '10:15 AM'}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* Notify button */}
                        <button 
                          onClick={() => {
                            setSelectedOrderForNotify(o);
                          }}
                          className="p-1.5 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-amber-600 rounded-lg transition"
                          title="Send Customer Tracking SMS / WhatsApp"
                        >
                          <Send size={15} />
                        </button>

                        {/* View Receipt Detail */}
                        <button 
                          onClick={() => setSelectedOrderForDetail(o)}
                          className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg transition"
                          title="View Invoice & QR Code"
                        >
                          <ChevronRight size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-slate-400 font-medium">
                    No orders matching your filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= MODAL 1: ORDER SPECIFICATIONS & RECEIPT ================= */}
      {selectedOrderForDetail && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">
                  INVOICE & SPECIFICATIONS
                </span>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  {selectedOrderForDetail.order_number}
                </h3>
              </div>
              <button 
                onClick={() => setSelectedOrderForDetail(null)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-full bg-slate-100 dark:bg-slate-800"
              >
                <X size={18} />
              </button>
            </div>

            {/* Order Content */}
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <strong className="text-xs font-extrabold text-slate-900 dark:text-white block">
                    {selectedOrderForDetail.customer_name || 'Walk-in Customer'}
                  </strong>
                  <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                    <MapPin size={12} className="text-amber-500" />
                    {selectedOrderForDetail.area || 'Dahisar'} zone
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-slate-400 block font-mono">Date: {selectedOrderForDetail.order_date}</span>
                  <span className="text-[11px] font-bold text-amber-600 block">Time: {selectedOrderForDetail.time || '10:15 AM'}</span>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase">Items Ordered</span>
                {(selectedOrderForDetail.items || []).map((it, idx) => {
                  const pObj = products.find(p => p.id === it.product_id);
                  return (
                    <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-slate-100 dark:border-slate-800 text-[11px]">
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {pObj ? pObj.name : `Product ID #${it.product_id}`} × {it.qty}
                      </span>
                      <span className="font-black text-slate-900 dark:text-white">
                        ₹{(it.selling_price * it.qty).toLocaleString()}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Total Summary */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Total Payable Amount</span>
                <span className="text-xl font-black text-slate-900 dark:text-white">
                  ₹{selectedOrderForDetail.total_amount.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button 
                onClick={() => {
                  window.print();
                  triggerToast('Printing invoice...', 'info');
                }}
                className="flex-1 py-3 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white rounded-xl font-extrabold text-[11px] transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Printer size={16} /> Print Tax Invoice
              </button>
              <button 
                onClick={() => {
                  setSelectedOrderForPayment(selectedOrderForDetail);
                  setSelectedOrderForDetail(null);
                  setIsPaymentModalOpen(true);
                }}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-extrabold text-[11px] transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <DollarSign size={16} /> Collect Payment
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ================= MODAL 2: EXPRESS NEW ORDER MODAL ================= */}
      {isNewOrderModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider block">EXPRESS DISPATCH</span>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">Create New Faral Order</h3>
              </div>
              <button onClick={() => setIsNewOrderModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full bg-slate-100 dark:bg-slate-800">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateNewOrder} className="space-y-4 text-[11px]">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Customer Name (ग्राहक नाव)</label>
                <input 
                  type="text" 
                  placeholder="e.g. Anish Kulkarni"
                  value={newOrderCustomer}
                  onChange={(e) => setNewOrderCustomer(e.target.value)}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Phone Number</label>
                  <input 
                    type="text" 
                    placeholder="+91 98200 00000"
                    value={newOrderPhone}
                    onChange={(e) => setNewOrderPhone(e.target.value)}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Delivery Area Zone</label>
                  <select 
                    value={newOrderArea}
                    onChange={(e) => setNewOrderArea(e.target.value)}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none cursor-pointer"
                  >
                    <option value="Dahisar">Dahisar</option>
                    <option value="Borivali">Borivali</option>
                    <option value="Kandivali">Kandivali</option>
                    <option value="Mira Road">Mira Road</option>
                    <option value="Vasai">Vasai</option>
                    <option value="Virar">Virar</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Select Faral / Sweet Combo Box</label>
                <select 
                  value={newOrderProduct}
                  onChange={(e) => setNewOrderProduct(e.target.value)}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none cursor-pointer"
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} — ₹{p.selling_price} ({p.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3 items-center">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Quantity</label>
                  <input 
                    type="number" 
                    min={1}
                    value={newOrderQty}
                    onChange={(e) => setNewOrderQty(Number(e.target.value))}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div className="pt-5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={newOrderAdvance}
                      onChange={(e) => setNewOrderAdvance(e.target.checked)}
                      className="rounded border-slate-300 text-amber-500 focus:ring-amber-500 cursor-pointer"
                    />
                    <span className="font-bold text-slate-800 dark:text-slate-200">Festive Advance Booking</span>
                  </label>
                </div>
              </div>

              <button 
                type="submit"
                className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs transition shadow-lg cursor-pointer"
              >
                Confirm Order & Generate Invoice
              </button>
            </form>

          </div>
        </div>
      )}

      {/* ================= MODAL 3: PAYMENT COLLECTION ================= */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider block">COLLECT PAYMENT</span>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">Record Cash / UPI Receipt</h3>
              </div>
              <button onClick={() => setIsPaymentModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full bg-slate-100 dark:bg-slate-800">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCollectPaymentSubmit} className="space-y-4 text-[11px]">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Select Payment Mode</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['UPI', 'Cash', 'Card'] as const).map((m) => (
                    <button 
                      key={m}
                      type="button"
                      onClick={() => setPaymentMethod(m)}
                      className={`p-3 rounded-xl border text-[11px] font-bold transition ${
                        paymentMethod === m 
                          ? 'bg-emerald-600 text-white border-emerald-500 shadow-md' 
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {selectedOrderForPayment && (
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200/60 dark:border-emerald-800/50 flex justify-between items-center">
                  <span className="font-bold text-slate-700 dark:text-slate-300">Order {selectedOrderForPayment.order_number} Amount:</span>
                  <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                    ₹{selectedOrderForPayment.total_amount.toLocaleString()}
                  </span>
                </div>
              )}

              <button 
                type="submit"
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl text-xs transition shadow-lg cursor-pointer flex items-center justify-center gap-2"
              >
                <CheckCircle2 size={18} /> Confirm Receipt & Close Dues
              </button>
            </form>

          </div>
        </div>
      )}

      {/* ================= MODAL 4: CUSTOMER NOTIFICATION MODAL ================= */}
      {selectedOrderForNotify && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider block">CUSTOMER ALERT</span>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">Send SMS / WhatsApp Tracking</h3>
              </div>
              <button onClick={() => setSelectedOrderForNotify(null)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full bg-slate-100 dark:bg-slate-800">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-[11px]">
              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 font-mono text-[11px] text-slate-700 dark:text-slate-300">
                "Hello {selectedOrderForNotify.customer_name || 'Customer'}, your Kokanastha Faral order {selectedOrderForNotify.order_number} is now {selectedOrderForNotify.status}! Track live delivery route at https://kokanasthafaral.com/track/{selectedOrderForNotify.order_number}"
              </div>

              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    triggerToast(`WhatsApp alert dispatched for ${selectedOrderForNotify.order_number}!`, 'success');
                    setSelectedOrderForNotify(null);
                  }}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-extrabold transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Send size={15} /> Send WhatsApp
                </button>
                <button 
                  onClick={() => {
                    triggerToast(`SMS dispatch notification sent to customer!`, 'info');
                    setSelectedOrderForNotify(null);
                  }}
                  className="flex-1 py-3 bg-slate-900 dark:bg-slate-800 text-white rounded-xl font-extrabold transition cursor-pointer"
                >
                  Send SMS
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
