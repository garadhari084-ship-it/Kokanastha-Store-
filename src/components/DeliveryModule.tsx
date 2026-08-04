
import { PageHeader } from './PageHeader';
import React, { useEffect, useState, useMemo } from 'react';
import { DeliveryReports } from './DeliveryReports';
import { 
  Truck, 
  Search, 
  MapPin, 
  CheckCircle2, 
  Calendar,
  Package,
  Phone,
  MessageCircle,
  Navigation,
  Printer,
  IndianRupee,
  Clock,
  AlertTriangle,
  X,
  Filter,
  Eye,
  CreditCard,
  QrCode,
  RotateCcw,
  Building2,
  LayoutGrid,
  Banknote,
  XCircle,
  Sparkles,
  User,
  AlertCircle
} from 'lucide-react';
import { dbStore } from '../services/store';
import { SalesOrder, Customer, UserProfile, OrderStatus } from '../types/erp';
import { TodayDeliveryModal } from './TodayDeliveryModal';

interface DeliveryModuleProps {
  businessId: string;
  user: UserProfile;
  triggerToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const DeliveryModule: React.FC<DeliveryModuleProps> = ({ 
  businessId, 
  user, 
  triggerToast
}) => {
  const [orders, setOrders] = useState<SalesOrder[]>(
    dbStore.getSalesOrders(businessId)
  );
  const [customers, setCustomers] = useState<Customer[]>(dbStore.getCustomers(businessId));
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'All' | 'Pending Delivery' | 'Ready to Dispatch' | 'In Transit' | 'Delivered' | 'Returned'>('Pending Delivery');
  const [dateFilter, setDateFilter] = useState<'All' | 'Today' | 'Tomorrow' | 'Upcoming'>('All');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [activeView, setActiveView] = useState<'Operations' | 'Reports'>('Operations');
  
  const reloadOrders = () => {
    setOrders(dbStore.getSalesOrders(businessId));
  };

  useEffect(() => {
    return dbStore.subscribe(() => {
      setCustomers(dbStore.getCustomers(businessId));
      reloadOrders();
    });
  }, [businessId]);

  const [confirmingOrder, setConfirmingOrder] = useState<SalesOrder | null>(null);
  const [selectedPaymentMode, setSelectedPaymentMode] = useState<'Cash' | 'Card' | 'UPI' | 'Net Banking' | 'Not Paid' | null>(null);
  const [detailOrder, setDetailOrder] = useState<SalesOrder | null>(null);

  // Delivery Partner & Dispatch Station State
  const [dispatchingOrder, setDispatchingOrder] = useState<SalesOrder | null>(null);
  const [deliveryPartner, setDeliveryPartner] = useState<string>('Rapido');
  const [personName, setPersonName] = useState<string>('');
  const [personPhone, setPersonPhone] = useState<string>('');
    const [trackingNumber, setTrackingNumber] = useState<string>('');
  const [showTodayModal, setShowTodayModal] = useState(false);

  useEffect(() => {
    // Show modal on module load to highlight today's priorities
    const timer = setTimeout(() => {
      setShowTodayModal(true);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleModalAction = (order: SalesOrder) => {
    setShowTodayModal(false);
    if (order.status === 'Dispatched') {
      setConfirmingOrder(order);
      setSelectedPaymentMode(null);
    } else {
      setDispatchingOrder(order);
      // Reset dispatch form defaults
      setDeliveryPartner('Rapido');
      setPersonName('');
      setPersonPhone('');
      setTrackingNumber('');
    }
  };

  const handleCompleteDispatchAssignment = (targetOrder: SalesOrder, e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!targetOrder) return;

    try {
      const isCustomPerson = deliveryPartner === 'In-House Agent' || deliveryPartner === 'Customer Pickup';
      const updateData: Partial<SalesOrder> = {
        status: 'Dispatched',
        delivery_status: 'Dispatched',
        delivery_partner: deliveryPartner,
        delivery_person_name: isCustomPerson ? personName : undefined,
        delivery_person_phone: isCustomPerson ? personPhone : undefined,
        tracking_number: !isCustomPerson ? trackingNumber : undefined,
      };

      dbStore.updateSalesOrder(targetOrder.id, updateData);
      triggerToast(`Order #${targetOrder.order_number} dispatched & assigned to ${deliveryPartner}!`, 'success');

      // Send notification message to sales/manager staff
      const orderNum = targetOrder.order_number || targetOrder.id;
      const allUsers = dbStore.getUsers(businessId);
      const salesStaff = allUsers.filter(u => u.role && (u.role === 'Sales Staff' || u.role === 'Manager'));
      salesStaff.forEach(staff => {
        dbStore.sendMessage({
          sender_id: user.id,
          receiver_id: staff.id,
          content: `Order #${orderNum} has been assigned to ${deliveryPartner} and dispatched for delivery.`,
          business_id: businessId
        });
      });

      setDispatchingOrder(null);
      setPersonName('');
      setPersonPhone('');
      setTrackingNumber('');
      reloadOrders();
    } catch (err: any) {
      triggerToast(err.message || 'Error assigning delivery partner', 'error');
    }
  };

  const handleUpdateStatus = (order: SalesOrder, newStatus: OrderStatus) => {
    if (newStatus === 'Delivered') {
      setConfirmingOrder(order);
      setSelectedPaymentMode(null);
      return;
    }
    performStatusUpdate(order, newStatus);
  };

  const performStatusUpdate = (
    order: SalesOrder, 
    newStatus: OrderStatus,
    paymentOption?: 'Cash' | 'Card' | 'UPI' | 'Net Banking' | 'Not Paid' | null
  ) => {
    try {
      const updateData: Partial<SalesOrder> = { 
        status: newStatus,
        delivery_status: newStatus
      };

      if (newStatus === 'Delivered') {
        if (paymentOption && paymentOption !== 'Not Paid') {
          const modeMap: Record<string, string> = {
            'Cash': 'Cash',
            'Card': 'Card',
            'UPI': 'UPI / QR',
            'Net Banking': 'Bank Transfer'
          };
          updateData.payment_status = 'Paid';
          updateData.payment_mode = modeMap[paymentOption] || paymentOption;
          updateData.paid_amount = order.total_amount;
        }
      }

      dbStore.updateSalesOrder(order.id, updateData);
      
      if (newStatus === 'Delivered' && paymentOption && paymentOption !== 'Not Paid') {
        triggerToast(`Order #${order.order_number} marked Delivered & Paid via ${paymentOption}!`, 'success');
      } else {
        triggerToast(`Order status updated to ${newStatus}`, 'success');
      }

      reloadOrders();
      
      const orderNum = order.order_number || order.id;
      
      if (newStatus === 'Dispatched') {
         const allUsers = dbStore.getUsers(businessId);
         const salesStaff = allUsers.filter(u => u.role && (u.role === 'Sales Staff' || u.role === 'Manager'));
         salesStaff.forEach(staff => {
            dbStore.sendMessage({
               sender_id: user.id,
               receiver_id: staff.id,
               content: `Order ${orderNum} has been dispatched and is out for delivery.`,
               business_id: businessId
            });
         });
      }
      if (newStatus === 'Delivered') {
         const allUsers = dbStore.getUsers(businessId);
         const salesStaff = allUsers.filter(u => u.role && (u.role === 'Sales Staff' || u.role === 'Manager'));
         salesStaff.forEach(staff => {
            dbStore.sendMessage({
               sender_id: user.id,
               receiver_id: staff.id,
               content: `Order ${orderNum} has been successfully delivered.`,
               business_id: businessId
            });
         });
      }

    } catch (err: any) {
      triggerToast(err.message || 'Error updating order', 'error');
    }
  };

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      // Apply status filter
      if (activeFilter === 'Pending Delivery') {
        if (o.status !== 'Pending' && o.status !== 'Packing') return false;
      } else if (activeFilter === 'Ready to Dispatch') {
        if (o.status !== 'Packed') return false;
      } else if (activeFilter === 'In Transit') {
        if (o.status !== 'Dispatched') return false;
      } else if (activeFilter === 'Delivered') {
        if (o.status !== 'Delivered') return false;
      } else if (activeFilter === 'Returned') {
        if (o.status !== 'Returned') return false;
      }
      
      // Apply search query
          if (dateFilter !== 'All') {
      const dateStr = (o.delivery_date || o.order_date || '').trim();
      if (!dateStr || dateStr === 'Unknown Date') return false;
      
      const parseDate = (d) => {
        const parts = d.split('-');
        return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2])).getTime();
      };
      
      const now = new Date();
      const todayTime = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      const tmrwTime = todayTime + 86400000;
      
      const orderTime = parseDate(dateStr);
      
      if (dateFilter === 'Today' && orderTime !== todayTime) return false;
      if (dateFilter === 'Tomorrow' && orderTime !== tmrwTime) return false;
      if (dateFilter === 'Upcoming' && orderTime <= tmrwTime) return false;
    }
      
      if (searchQuery) {
        const cust = customers.find(c => c.id === o.customer_id);
        const q = searchQuery.toLowerCase();
        return o.order_number.toLowerCase().includes(q) || 
               (cust && cust.name.toLowerCase().includes(q));
      }
      
      return true;
    }).sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
  }, [orders, customers, searchQuery, activeFilter, dateFilter]);

  const groupedOrders = useMemo(() => {
    const groups: Record<string, SalesOrder[]> = {};
    filteredOrders.forEach(o => {
      const date = o.delivery_date || o.order_date || 'Unknown Date';
      if (!groups[date]) groups[date] = [];
      groups[date].push(o);
    });
    
    return Object.entries(groups).sort(([dateA], [dateB]) => dateA.localeCompare(dateB));
  }, [filteredOrders]);

    const getRelativeDateLabel = (dateString: string) => {
    if (!dateString || dateString === 'Unknown Date') return dateString || 'Unknown Date';
    
    const parseDate = (d: string) => {
      const parts = d.split('-');
      return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2])).getTime();
    };
    
    const now = new Date();
    const todayTime = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const tmrwTime = todayTime + 86400000;
    
    const orderTime = parseDate(dateString.trim());
    
    if (orderTime === todayTime) return `Today's Delivery (${dateString})`;
    if (orderTime === tmrwTime) return `Tomorrow's Delivery (${dateString})`;
    return `Delivery on ${dateString}`;
  };

  // Metrics
  const pendingCount = orders.filter(o => o.status === 'Pending' || o.status === 'Packing').length;
  const readyCount = orders.filter(o => o.status === 'Packed').length;
  const transitCount = orders.filter(o => o.status === 'Dispatched').length;
  const deliveredCount = orders.filter(o => o.status === 'Delivered').length;
  const returnedCount = orders.filter(o => o.status === 'Returned').length;
  const codPendingCount = orders.filter(o => (o.status === 'Dispatched' || o.status === 'Packed') && o.payment_status !== 'Paid').length;
  const codPendingAmount = orders.filter(o => (o.status === 'Dispatched' || o.status === 'Packed') && o.payment_status !== 'Paid')
    .reduce((sum, o) => sum + Math.max(0, o.total_amount - (o.paid_amount || 0)), 0);

  const handlePrintNote = (order: SalesOrder) => {
    const cust = customers.find(c => c.id === order.customer_id);
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Dispatch Note - ${order.order_number}</title>
          <style>
            body { font-family: system-ui, sans-serif; padding: 2rem; max-width: 800px; margin: 0 auto; color: #1e293b; }
            h1 { font-size: 1.5rem; margin-bottom: 0.5rem; font-weight: 900; }
            .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2rem; border-bottom: 2px solid #e2e8f0; padding-bottom: 1rem; }
            .badge { display: inline-block; padding: 0.25rem 0.5rem; border-radius: 999px; font-size: 0.75rem; font-weight: 700; background: #e2e8f0; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-bottom: 2rem; }
            .box { padding: 1rem; border: 1px solid #e2e8f0; border-radius: 0.5rem; }
            .box h3 { font-size: 0.75rem; text-transform: uppercase; color: #64748b; margin-top: 0; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 2rem; }
            th { text-align: left; padding: 0.75rem; border-bottom: 1px solid #cbd5e1; font-size: 0.875rem; }
            td { padding: 0.75rem; border-bottom: 1px solid #e2e8f0; font-size: 0.875rem; }
            .totals { text-align: right; }
            .totals strong { font-size: 1.25rem; }
            .cod-alert { background: #fee2e2; color: #991b1b; padding: 1rem; border-radius: 0.5rem; text-align: center; font-weight: bold; margin-bottom: 1rem; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1>DISPATCH NOTE</h1>
              <p>Order: <strong>${order.order_number}</strong> &bull; Date: ${order.order_date}</p>
            </div>
            <div class="badge">${order.status.toUpperCase()}</div>
          </div>
          
          ${order.payment_status !== 'Paid' ? `
            <div class="cod-alert">
              PAYMENT PENDING / CASH ON DELIVERY: ₹${Math.max(0, order.total_amount - (order.paid_amount || 0)).toLocaleString()}
            </div>
          ` : `
            <div style="background: #dcfce7; color: #166534; padding: 1rem; border-radius: 0.5rem; text-align: center; font-weight: bold; margin-bottom: 1rem;">
              PREPAID ORDER - DO NOT COLLECT CASH
            </div>
          `}
          
          <div class="info-grid">
            <div class="box">
              <h3>Delivery To</h3>
              <strong>${cust?.name || 'Customer'}</strong><br/>
              ${cust?.shipping_address || 'No address provided'}<br/><br/>
              ${cust?.phone ? `Phone: \${${cust.phone}}` : ''}
            </div>
            <div class="box">
              <h3>Order Info</h3>
              Area: ${order.area || 'N/A'}<br/>
              Payment Status: ${order.payment_status}<br/>
              Channel: ${order.channel || 'Direct'}
            </div>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th style="text-align: right">Qty</th>
              </tr>
            </thead>
            <tbody>
              ${(order.items || []).map(item => `
                <tr>
                  <td>${dbStore.getProducts(businessId).find(p => p.id === item.product_id)?.name || 'Unknown'}</td>
                  <td style="text-align: right"><strong>${item.qty}</strong></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="totals">
            Total Value: <strong>₹${order.total_amount.toLocaleString()}</strong>
          </div>
          
          <div style="margin-top: 4rem; text-align: center; font-size: 0.875rem; color: #64748b;">
            ___________________________<br/><br/>
            Receiver Signature
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  return (
    <div className="space-y-4 max-w-full pb-8 px-0 font-sans text-slate-900 dark:text-slate-100 overflow-x-hidden" id="delivery-module-root">
      <PageHeader
        title="Delivery & Dispatch Operations"
        subtitle="Manage orders that are ready for dispatch and track delivery fulfillment."
        icon={Truck}
      />

      <div className="px-0.5 sm:px-1 space-y-4">
        {/* Toggle View */}
        <div className="flex gap-6 border-b border-slate-200 dark:border-slate-800 mb-4 px-2">
          <button
            onClick={() => setActiveView('Operations')}
            className={`pb-3 font-bold text-sm transition-colors relative ${
              activeView === 'Operations'
                ? 'text-indigo-600 dark:text-indigo-400'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            Dispatch Operations
            {activeView === 'Operations' && (
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-t-full" />
            )}
          </button>
          <button
            onClick={() => setActiveView('Reports')}
            className={`pb-3 font-bold text-sm transition-colors relative ${
              activeView === 'Reports'
                ? 'text-indigo-600 dark:text-indigo-400'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            Fulfillment Reports
            {activeView === 'Reports' && (
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-t-full" />
            )}
          </button>
        </div>

        {activeView === 'Reports' ? (
          <DeliveryReports businessId={businessId} />
        ) : (
          <>
            {/* Advanced Metrics Cards (Matched to SalesModule) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        <div 
          onClick={() => setActiveFilter('Ready to Dispatch')}
          className={`bg-white dark:bg-slate-900 border p-2 sm:p-3 rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between gap-1 ${
            activeFilter === 'Ready to Dispatch' ? 'border-yellow-500 ring-2 ring-yellow-500/20' : 'border-slate-200/80 dark:border-slate-800 hover:border-yellow-400 dark:hover:border-yellow-600'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <div className="p-1.5 bg-yellow-500/10 dark:bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 rounded-lg group-hover:scale-110 transition-transform shrink-0">
              <Package size={14} />
            </div>
            <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">READY TO DISPATCH</span>
          </div>
          <div className="text-right mt-1">
            <span className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
              {readyCount}
            </span>
          </div>
        </div>

        <div 
          onClick={() => setActiveFilter('In Transit')}
          className={`bg-white dark:bg-slate-900 border p-2 sm:p-3 rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between gap-1 ${
            activeFilter === 'In Transit' ? 'border-indigo-500 ring-2 ring-indigo-500/20' : 'border-slate-200/80 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <div className="p-1.5 bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-lg group-hover:scale-110 transition-transform shrink-0">
              <Truck size={14} />
            </div>
            <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">IN TRANSIT</span>
          </div>
          <div className="text-right mt-1">
            <span className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
              {transitCount}
            </span>
          </div>
        </div>

        <div 
          onClick={() => setActiveFilter('Delivered')}
          className={`bg-white dark:bg-slate-900 border p-2 sm:p-3 rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between gap-1 ${
            activeFilter === 'Delivered' ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-slate-200/80 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-600'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <div className="p-1.5 bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-lg group-hover:scale-110 transition-transform shrink-0">
              <CheckCircle2 size={14} />
            </div>
            <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">DELIVERED</span>
          </div>
          <div className="text-right mt-1">
            <span className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
              {deliveredCount}
            </span>
          </div>
        </div>

        <div 
          onClick={() => setActiveFilter('All')}
          className={`bg-white dark:bg-slate-900 border p-2 sm:p-3 rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between gap-1 border-slate-200/80 dark:border-slate-800 hover:border-rose-400 dark:hover:border-rose-600`}
        >
          <div className="flex items-center gap-1.5">
            <div className="p-1.5 bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 rounded-lg group-hover:scale-110 transition-transform shrink-0">
              <IndianRupee size={14} />
            </div>
            <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">COD PENDING</span>
          </div>
          <div className="text-right mt-1">
            <span className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
              ₹{codPendingAmount.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        <div className="flex flex-col gap-2 w-full">
          {/* Date Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1 sm:pb-0">
            {[
              { id: 'All', label: 'All Dates' },
              { id: 'Today', label: "Today's Delivery" },
              { id: 'Tomorrow', label: "Tomorrow" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setDateFilter(tab.id as any)}
                className={`px-3 py-1.5 rounded-full text-[11px] font-black transition-all whitespace-nowrap cursor-pointer border ${
                  dateFilter === tab.id
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          
          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1 sm:pb-0">
            {[
              { id: 'All', label: 'All Orders' },
            { id: 'Pending Delivery', label: `Pending Delivery (${pendingCount})` },
            { id: 'Ready to Dispatch', label: `Ready to Dispatch (${readyCount})` },
            { id: 'In Transit', label: `In Transit (${transitCount})` },
            { id: 'Delivered', label: `Delivered (${deliveredCount})` },
            { id: 'Returned', label: `Returned (${returnedCount})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-full text-[11px] font-black transition-all whitespace-nowrap cursor-pointer border ${
                activeFilter === tab.id
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        </div>
        <div className="flex-1 max-w-md flex items-center bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-full px-3 py-1.5 shadow-xs focus-within:ring-2 focus-within:ring-indigo-500 transition-shadow">
          <Search size={15} className="text-slate-400 mr-2 shrink-0" />
          <input 
            type="text" 
            placeholder="Search orders by number or customer..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-[11px] sm:text-xs outline-hidden text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* DELIVERY PARTNER & DISPATCH MODAL POPUP */}
      {dispatchingOrder && (() => {
        const targetCust = customers.find(c => c.id === dispatchingOrder.customer_id);
        const packedList = orders.filter(o => o.status === 'Packed');

        return (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-3xl p-5 sm:p-6 space-y-4 my-auto relative">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3.5">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl flex items-center justify-center bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 shrink-0">
                    <Truck size={22} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-black text-slate-900 dark:text-white">Delivery Partner & Dispatch</h3>
                      <span className="px-2.5 py-0.5 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 text-xs font-extrabold rounded-lg">
                        #{dispatchingOrder.order_number}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Customer: <strong className="text-slate-800 dark:text-slate-200">{targetCust?.name || 'Customer'}</strong> • Total: <strong className="text-emerald-600 dark:text-emerald-400">₹{dispatchingOrder.total_amount.toLocaleString()}</strong>
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setDispatchingOrder(null);
                    setPersonName('');
                    setPersonPhone('');
                    setTrackingNumber('');
                  }}
                  className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={(e) => handleCompleteDispatchAssignment(dispatchingOrder, e)} className="space-y-4">
                {/* Select Delivery Mode */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                      SELECT DELIVERY MODE
                    </label>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {[
                      { id: 'Rapido', label: 'Rapido', desc: 'BIKE EXPRESS' },
                      { id: 'Dunzo / Swiggy', label: 'Dunzo / Swiggy', desc: 'HYPERLOCAL' },
                      { id: 'Porter', label: 'Porter', desc: 'LOCAL DRIVER' },
                      { id: 'Courier Logistics', label: 'Courier', desc: 'BLUEDART/DELHIVERY' },
                      { id: 'In-House Agent', label: 'In-House', desc: 'COMPANY DRIVER' },
                      { id: 'Customer Pickup', label: 'Self Pickup', desc: 'STORE COUNTER' }
                    ].map((mode) => (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() => setDeliveryPartner(mode.id)}
                        className={`p-3.5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer min-h-[76px] ${
                          deliveryPartner === mode.id
                            ? 'bg-gradient-to-br from-indigo-600 to-indigo-700 border-indigo-700 text-white shadow-md shadow-indigo-600/20 scale-[1.02]'
                            : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        <strong className="text-xs font-black block">{mode.label}</strong>
                        <span className={`text-[9.5px] font-bold uppercase tracking-wider mt-1.5 ${deliveryPartner === mode.id ? 'text-indigo-200' : 'text-slate-500'}`}>
                          {mode.desc}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tracking / Driver Details */}
                <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800">
                  {(deliveryPartner === 'In-House Agent' || deliveryPartner === 'Customer Pickup') ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                          <User size={12} className="text-slate-400" /> {deliveryPartner === 'Customer Pickup' ? 'Collector / Person Name' : 'Driver / Exec Name'}
                        </label>
                        <input 
                          type="text" 
                          placeholder={deliveryPartner === 'Customer Pickup' ? 'e.g. Customer Name' : 'e.g. Rahul Sharma'}
                          value={personName}
                          onChange={(e) => setPersonName(e.target.value)}
                          className="w-full px-3 py-2 bg-white dark:bg-slate-900 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all placeholder:font-normal placeholder:text-slate-400"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                          <Phone size={12} className="text-slate-400" /> Contact Mobile Number (10 Digits)
                        </label>
                        <input 
                          type="tel" 
                          maxLength={10}
                          placeholder="e.g. 9876543210"
                          value={personPhone}
                          onChange={(e) => setPersonPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                          className="w-full px-3 py-2 bg-white dark:bg-slate-900 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all placeholder:font-normal placeholder:text-slate-400"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                        <Navigation size={12} className="text-slate-400" /> TRACKING / WAYBILL NUMBER
                      </label>
                      <input 
                        type="text" 
                        placeholder="e.g. TRK-99214"
                        value={trackingNumber}
                        onChange={(e) => setTrackingNumber(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all placeholder:font-normal placeholder:text-slate-400"
                      />
                    </div>
                  )}
                </div>

                {/* Footer Buttons */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setDispatchingOrder(null);
                      setPersonName('');
                      setPersonPhone('');
                      setTrackingNumber('');
                    }}
                    className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black shadow-md shadow-emerald-600/20 flex items-center gap-2 cursor-pointer transition-all active:scale-95"
                  >
                    <Sparkles size={15} />
                    <span>Ready to Dispatch & Assign</span>
                    <span className="bg-emerald-700/50 px-2 py-0.5 rounded text-[10px]">{deliveryPartner}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* Compact List View */}
      <div className="bg-white dark:bg-slate-900 overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm mt-3">
        <table className="w-full text-left text-[11px]">
          <thead className="bg-slate-800 dark:bg-slate-800 text-white font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
            <tr>
              <th className="py-2.5 px-3">Order ID</th>
              <th className="py-2.5 px-3">Date / Delivery</th>
              <th className="py-2.5 px-3">Customer</th>
              <th className="py-2.5 px-3">Contact</th>
              <th className="py-2.5 px-3">Area Zone</th>
              <th className="py-2.5 px-3">Delivery Partner</th>
              <th className="py-2.5 px-3">Amount</th>
              <th className="py-2.5 px-3">Status</th>
              <th className="py-2.5 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
            {groupedOrders.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-8 text-center">
                  <div className="flex flex-col items-center justify-center text-slate-500 dark:text-slate-400">
                    <Package size={24} className="mb-2 opacity-50" />
                    <p className="font-bold text-xs">No active deliveries found for filter "{activeFilter}".</p>
                    <p className="text-[10px]">Packed orders from the Packing station will appear under Ready to Dispatch.</p>
                  </div>
                </td>
              </tr>
            ) : (
              groupedOrders.map(([date, dateOrders]) => (
                <React.Fragment key={date}>
                  <tr className="bg-slate-100 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-700/50">
                    <td colSpan={9} className="py-2.5 px-4 font-bold text-slate-700 dark:text-slate-300 text-xs">
                      {getRelativeDateLabel(date)}
                      <span className="ml-2 text-[10px] font-medium bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 py-0.5 px-2 rounded-full border border-slate-200 dark:border-slate-700">
                        {dateOrders.length} order{dateOrders.length > 1 ? 's' : ''}
                      </span>
                    </td>
                  </tr>
                  {dateOrders.map((o) => {
                const cust = customers.find(c => c.id === o.customer_id);
                const isCOD = o.payment_status !== 'Paid';
                const unpaidBalance = Math.max(0, o.total_amount - (o.paid_amount || 0));
                
                return (
                  <tr key={o.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 px-3 font-black text-slate-900 dark:text-white">
                      <button 
                        onClick={() => setDetailOrder(o)}
                        className="hover:text-indigo-500 cursor-pointer text-left transition-colors flex items-center gap-1.5"
                      >
                        <Eye size={12} className="text-indigo-400" />
                        {o.order_number}
                      </button>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex flex-col">
                        <span className="text-slate-800 dark:text-slate-200 font-semibold text-[10px]">
                          {o.order_date || new Date(o.created_at).toLocaleDateString()}
                        </span>
                        {o.delivery_date && (
                          <span className="text-indigo-600 dark:text-indigo-400 font-bold mt-0.5 text-[9px]">Del: {o.delivery_date}</span>
                        )}
                      </div>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800 dark:text-slate-200">{cust?.name || 'Walk-in Customer'}</span>
                        <span className="text-[9px] text-slate-500 truncate max-w-[150px]">{cust?.shipping_address || 'No address'}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3">
                      {cust?.phone ? (
                        <div className="flex gap-1.5">
                          <a href={`tel:${cust.phone}`} className="p-1 bg-sky-50 dark:bg-sky-900/20 text-sky-600 rounded hover:bg-sky-100 transition-colors" title="Call">
                            <Phone size={12} />
                          </a>
                          <a href={`https://wa.me/${cust.phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="p-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded hover:bg-emerald-100 transition-colors" title="WhatsApp">
                            <MessageCircle size={12} />
                          </a>
                          <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((cust?.shipping_address || '') + ' ' + (cust?.area || ''))}`} target="_blank" rel="noreferrer" className="p-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded hover:bg-slate-200 transition-colors" title="Maps">
                            <Navigation size={12} />
                          </a>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[10px]">No phone</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-slate-700 dark:text-slate-300">
                      {o.area || 'Unknown'}
                    </td>
                    <td className="py-2.5 px-3">
                      {o.delivery_partner ? (
                        <div className="flex flex-col">
                          <span className="font-bold text-indigo-600 dark:text-indigo-400 text-[10px]">{o.delivery_partner}</span>
                          {(o.delivery_person_name || o.tracking_number) && (
                            <span className="text-[9px] text-slate-500 truncate max-w-[120px]">
                              {o.delivery_person_name || o.tracking_number}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[10px]">Not assigned</span>
                      )}
                      {(o.rack_location || o.rack_section) && (
                        <div className="mt-1 flex items-center gap-1 text-[9px] font-bold text-amber-700 bg-amber-100 dark:bg-amber-900/30 px-1.5 py-0.5 rounded-md inline-flex w-fit">
                          <LayoutGrid size={10} />
                          {[o.rack_location, o.rack_section].filter(Boolean).join(' • ')}
                        </div>
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex flex-col">
                        <span className="font-black text-slate-900 dark:text-white">₹{o.total_amount.toLocaleString()}</span>
                        {isCOD ? (
                          <span className="text-[9px] font-bold text-rose-600 flex items-center gap-0.5"><AlertTriangle size={8} /> COD (₹{unpaidBalance})</span>
                        ) : (
                          <span className="text-[9px] font-bold text-emerald-600">Prepaid</span>
                        )}
                      </div>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                        o.status === 'Delivered' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/80 dark:text-emerald-300' :
                        o.status === 'Returned' ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/80 dark:text-rose-300' :
                        o.status === 'Dispatched' ? 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/80 dark:text-indigo-300' :
                        'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/80 dark:text-amber-300'
                      }`}>
                        {o.status === 'Packed' ? 'Ready to Dispatch' : o.status === 'Dispatched' ? 'In Transit' : o.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right flex justify-end gap-1.5 items-center h-full">
                      <button
                        onClick={() => handlePrintNote(o)}
                        className="p-1.5 text-slate-500 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 dark:bg-slate-800 dark:hover:bg-indigo-900/30 rounded transition-colors border border-slate-200 dark:border-slate-700"
                        title="Print Dispatch Note"
                      >
                        <Printer size={12} />
                      </button>
                      
                      {/* Quick Pipeline Status Updater (Moved from Sales Module) */}
                      <select
                        value={o.status}
                        onChange={(e) => handleUpdateStatus(o, e.target.value as any)}
                        className="text-[10px] font-bold py-1 px-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg cursor-pointer focus:outline-none focus:ring-1 focus:ring-amber-500"
                        title="Quick Update Pipeline Status"
                      >
                        <option value="Pending">Pending</option>
                        <option value="Packing">Packing</option>
                        <option value="Packed">Ready</option>
                        <option value="Dispatched">Out for Delivery</option>
                        <option value="Delivered">Completed</option>
                        <option value="Returned">Returned</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>

                      {o.status === 'Packed' && (
                        <button 
                          onClick={() => {
                            setDispatchingOrder(o);
                            setDeliveryPartner(o.delivery_partner || 'Rapido');
                            setPersonName(o.delivery_person_name || '');
                            setPersonPhone(o.delivery_person_phone || '');
                            setTrackingNumber(o.tracking_number || '');
                          }}
                          className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg font-black text-[10px] transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                        >
                          <Sparkles size={12} /> Assign & Dispatch
                        </button>
                      )}
                      
                      {o.status === 'Dispatched' && (
                        <div className="flex gap-1 items-center">
                          <button 
                            onClick={() => handleUpdateStatus(o, 'Delivered')}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-black text-[10px] transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                          >
                            <CheckCircle2 size={12} /> Deliver
                          </button>
                        </div>
                      )}
                      
                      {o.status === 'Delivered' && (
                        <div className="flex gap-1">
                          <div className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 rounded font-bold text-[10px] flex items-center gap-1 border border-slate-200 dark:border-slate-700">
                            <CheckCircle2 size={12} /> Done
                          </div>
                          <button 
                            onClick={() => {
                              if (window.confirm("Mark as Returned? Product will be added back to inventory.")) {
                                performStatusUpdate(o, 'Returned');
                              }
                            }}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded border border-rose-200 dark:border-rose-800 cursor-pointer"
                            title="Return Order"
                          >
                            <RotateCcw size={12} />
                          </button>
                        </div>
                      )}
                      
                      {o.status === 'Returned' && (
                        <div className="px-2.5 py-1.5 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded font-bold text-[10px] flex items-center gap-1 border border-rose-200 dark:border-rose-800">
                          <RotateCcw size={12} /> Returned
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
              </React.Fragment>
            )))}
          </tbody>
        </table>
      </div>

      {/* Confirmation Modal */}
      {confirmingOrder && (
        <div className="fixed inset-0 z-[100] bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-xl border border-slate-200 dark:border-slate-800 p-6 animate-in zoom-in duration-200 flex flex-col">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mb-3 shrink-0 ring-4 ring-emerald-50 dark:ring-emerald-900/10">
                <CheckCircle2 size={26} />
              </div>
              <h3 className="text-lg font-black text-slate-950 dark:text-white">Confirm Delivery</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Marking order <strong className="text-slate-900 dark:text-white">#{confirmingOrder.order_number}</strong> as Delivered
              </p>
            </div>

            {confirmingOrder.payment_status === 'Paid' ? (
              <div className="mt-4 p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-center">
                <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center justify-center gap-1.5">
                  <CheckCircle2 size={15} /> Payment Already Completed (Prepaid)
                </span>
                <span className="block text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-semibold">
                  Amount: ₹{confirmingOrder.total_amount.toLocaleString()} ({confirmingOrder.payment_mode || 'Paid'})
                </span>
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 rounded-xl p-3 flex justify-between items-center">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-400 block">Pending Balance</span>
                    <span className="text-base font-black text-amber-950 dark:text-amber-200">
                      ₹{Math.max(0, confirmingOrder.total_amount - (confirmingOrder.paid_amount || 0)).toLocaleString()}
                    </span>
                  </div>
                  <span className="px-2 py-1 bg-amber-200/60 dark:bg-amber-800/60 text-amber-900 dark:text-amber-200 rounded text-[10px] font-bold">
                    Unpaid
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                    Payment Mode (Mandatory <span className="text-rose-500">*</span>)
                  </label>
                  
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'Cash', label: 'Cash', icon: Banknote, color: 'text-emerald-600 dark:text-emerald-400' },
                      { id: 'Card', label: 'Card', icon: CreditCard, color: 'text-indigo-600 dark:text-indigo-400' },
                      { id: 'UPI', label: 'UPI / QR', icon: QrCode, color: 'text-purple-600 dark:text-purple-400' },
                      { id: 'Net Banking', label: 'Net Banking', icon: Building2,
  LayoutGrid, color: 'text-blue-600 dark:text-blue-400' },
                      { id: 'Not Paid', label: 'Not Paid', icon: XCircle, color: 'text-slate-500' },
                    ].map((mode) => {
                      const Icon = mode.icon;
                      const isSelected = selectedPaymentMode === mode.id;
                      return (
                        <button
                          key={mode.id}
                          type="button"
                          onClick={() => setSelectedPaymentMode(mode.id as any)}
                          className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                            mode.id === 'Not Paid' && isSelected
                              ? 'bg-rose-50 dark:bg-rose-950/50 border-rose-400 text-rose-700 dark:text-rose-300 ring-2 ring-rose-400/30'
                              : isSelected
                              ? 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-500 text-indigo-900 dark:text-indigo-200 ring-2 ring-indigo-500/30 font-bold'
                              : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-indigo-500/10 dark:bg-indigo-500/20' : 'bg-slate-100 dark:bg-slate-700/50'}`}>
                            <Icon size={16} className={mode.color} />
                          </div>
                          <span className="text-[11px] font-extrabold flex-1 leading-tight">{mode.label}</span>
                          {isSelected && <CheckCircle2 size={14} className="text-indigo-600 dark:text-indigo-400 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {!selectedPaymentMode && (
                  <p className="text-[10px] text-rose-500 font-bold text-center mt-1">
                    ⚠️ Please select a payment method or 'Not Paid' to proceed.
                  </p>
                )}
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-3 w-full mt-5">
              <button
                type="button"
                onClick={() => {
                  setConfirmingOrder(null);
                  setSelectedPaymentMode(null);
                }}
                className="cursor-pointer py-2.5 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={confirmingOrder.payment_status !== 'Paid' && !selectedPaymentMode}
                onClick={() => {
                  if (confirmingOrder.payment_status !== 'Paid' && !selectedPaymentMode) return;
                  performStatusUpdate(confirmingOrder, 'Delivered', selectedPaymentMode);
                  setConfirmingOrder(null);
                  setSelectedPaymentMode(null);
                }}
                className={`cursor-pointer py-2.5 px-4 text-white rounded-xl text-xs font-bold transition-all shadow-md ${
                  confirmingOrder.payment_status !== 'Paid' && !selectedPaymentMode
                    ? 'bg-slate-300 dark:bg-slate-800 text-slate-500 cursor-not-allowed shadow-none'
                    : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200 dark:shadow-none active:scale-95'
                }`}
              >
                Confirm Delivery
              </button>
            </div>
          </div>
        </div>
      )}

            {/* Today's Delivery Summary Modal - Auto triggered */}
      <TodayDeliveryModal 
        isOpen={showTodayModal}
        onClose={() => setShowTodayModal(false)}
        businessId={businessId}
        orders={orders}
        customers={customers}
        onAction={handleModalAction}
      />

      {/* Order Details Modal */}
      {detailOrder && (
        <div className="fixed inset-0 z-[100] bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-xl border border-slate-200 dark:border-slate-800 animate-in zoom-in duration-200 flex flex-col overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
              <div>
                <h3 className="font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Package size={16} className="text-indigo-500" /> Package Contents
                </h3>
                <p className="text-[10px] text-slate-500 font-bold mt-0.5 uppercase tracking-wider">
                  {detailOrder.order_number}
                  {(detailOrder.rack_location || detailOrder.rack_section) && (
                    <span className="ml-2 inline-flex items-center gap-1 text-amber-700 bg-amber-100 dark:bg-amber-900/30 px-1.5 py-0.5 rounded-md">
                      <LayoutGrid size={10} />
                      {[detailOrder.rack_location, detailOrder.rack_section].filter(Boolean).join(' • ')}
                    </span>
                  )}
                </p>
              </div>
              <button onClick={() => setDetailOrder(null)} className="cursor-pointer text-slate-400 hover:text-slate-600 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-full transition-colors">
                <X size={16} />
              </button>
            </div>
            
            <div className="p-0 max-h-[60vh] overflow-y-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-[10px] font-black uppercase tracking-widest text-slate-500 sticky top-0">
                  <tr>
                    <th className="px-4 py-2 border-b border-slate-100 dark:border-slate-700">Item</th>
                    <th className="px-4 py-2 border-b border-slate-100 dark:border-slate-700 text-right">Qty</th>
                  </tr>
                </thead>
                <tbody className="text-xs">
                  {(detailOrder.items || []).map((item, idx) => (
                    <tr key={idx} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="px-4 py-3 font-bold text-slate-800 dark:text-slate-200">
                        {dbStore.getProducts(businessId).find(p => p.id === item.product_id)?.name || 'Unknown'}
                      </td>
                      <td className="px-4 py-3 text-right font-black text-indigo-600 dark:text-indigo-400">
                        {item.qty}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setDetailOrder(null)}
                className="cursor-pointer py-2 px-6 bg-slate-900 dark:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
          </>
        )}
      </div>
    </div>
  );
};
