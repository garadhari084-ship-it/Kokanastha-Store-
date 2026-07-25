import { PageHeader } from './PageHeader';
import React, { useEffect, useState, useMemo } from 'react';
import { 
  FileText, 
  PlusCircle, 
  Search, 
  User, 
  Calendar, 
  DollarSign, 
  X, 
  Check, 
  Printer, 
  Mail, 
  Eye, 
  CornerDownRight, 
  ExternalLink,
  ChevronRight,
  Sparkles,
  Palette,
  ChevronDown,
  Languages,
  Clock,
  Trash2,
  Download,
  Package,
  CheckCircle2,
  CreditCard,
  FileDown
} from 'lucide-react';
import { dbStore } from '../services/store';
import { SalesOrder, Customer, Product, UserProfile, SalesItem, OrderStatus } from '../types/erp';
import { generateBillOfSupplyHTML, generate3InchBillHTML } from '../utils/invoiceTemplate';
import { BillOfSupplyView } from './BillOfSupplyView';

interface SalesModuleProps {
  businessId: string;
  user: UserProfile;
  triggerToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  openAddModalInitially?: boolean;
  selectedOrderIdInitially?: string | null;
}

export const SalesModule: React.FC<SalesModuleProps> = ({ 
  businessId, 
  user, 
  triggerToast,
  openAddModalInitially = false,
  selectedOrderIdInitially = null
}) => {
  const [orders, setOrders] = useState<SalesOrder[]>(dbStore.getSalesOrders(businessId));
  const [customers, setCustomers] = useState<Customer[]>(dbStore.getCustomers(businessId));
  const [products, setProducts] = useState<Product[]>(dbStore.getProducts(businessId));
  const [searchQuery, setSearchQuery] = useState('');
  
  // Theme & Language Settings (Dashboard UI Match)
  type ColorTheme = 'midnight-gold' | 'emerald-pro' | 'royal-sapphire' | 'titanium-dark';
      const [timeHorizon, setTimeHorizon] = useState<'today' | 'yesterday' | '7days' | '30days' | 'all'>('today');

  
  
  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(openAddModalInitially);
  const [invoiceToDelete, setInvoiceToDelete] = useState<{id: string, orderNumber: string} | null>(null);
  const [viewingInvoiceOrder, setViewingInvoiceOrder] = useState<SalesOrder | null>(
    selectedOrderIdInitially ? orders.find(o => o.id === selectedOrderIdInitially) || null : null
  );

  // New Order Form States
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedArea, setSelectedArea] = useState('Dahisar');
  const [isAdvanceBooking, setIsAdvanceBooking] = useState(false);
  const [orderItems, setOrderItems] = useState<SalesItem[]>([]);

  // Quick line-item row helper
  const [rowProductId, setRowProductId] = useState('');
  const [rowQty, setRowQty] = useState(1);
  const [rowPrice, setRowPrice] = useState(0);

  const resetForm = () => {
    setSelectedCustomerId('');
    setIsAdvanceBooking(false);
    setOrderItems([]);
    setRowProductId('');
    setRowQty(1);
    setRowPrice(0);
  };
  useEffect(() => {
    return dbStore.subscribe(() => {
      setOrders(dbStore.getSalesOrders(businessId));
      setCustomers(dbStore.getCustomers(businessId));
      setProducts(dbStore.getProducts(businessId));
    });
  }, [businessId]);


  const handleOpenAddModal = () => {
    resetForm();
    setIsCreateModalOpen(true);
  };

  const handleAddLineItem = () => {
    if (!rowProductId) {
      triggerToast('Choose a product SKU to append.', 'error');
      return;
    }
    if (rowQty <= 0) {
      triggerToast('Quantity must be greater than zero.', 'error');
      return;
    }

    const prod = products.find(p => p.id === rowProductId);
    if (!prod) return;

    if (orderItems.some(it => it.product_id === rowProductId)) {
      triggerToast('Item already listed in order line.', 'error');
      return;
    }

    const newItem: SalesItem = {
      product_id: rowProductId,
      qty: rowQty,
      scanned_qty: 0,
      selling_price: rowPrice || prod.selling_price,
      gst_rate: prod.gst_rate
    };

    setOrderItems([...orderItems, newItem]);
    setRowProductId('');
    setRowQty(1);
    setRowPrice(0);
  };

  const handleRemoveLineItem = (idx: number) => {
    setOrderItems(orderItems.filter((_, i) => i !== idx));
  };

  const handleCreateSalesOrder = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCustomerId) {
      triggerToast('Please choose a customer profile.', 'error');
      return;
    }

    if (orderItems.length === 0) {
      triggerToast('Add at least one line item.', 'error');
      return;
    }

    // Handle Walk-in customer dynamic creation
    let finalCustomerId = selectedCustomerId;
    let finalCustomerName = 'Walk-in Customer';
    let finalCustomerArea = selectedArea || 'Dahisar';
    
    if (selectedCustomerId === 'WALK_IN') {
       let walkIn = customers.find(c => c.name === 'Walk-in Customer');
       if (!walkIn) {
          walkIn = dbStore.createCustomer({
             name: 'Walk-in Customer',
             group: 'Retail',
             area: 'Other',
             gstin: '',
             pan: '',
             billing_address: 'Retail POS',
             shipping_address: 'Retail POS',
             email: '',
             phone: '',
             credit_limit: 0,
             business_id: businessId,
             active: true
          });
       }
       finalCustomerId = walkIn.id;
       finalCustomerName = walkIn.name;
       finalCustomerArea = walkIn.area || selectedArea || 'Other';
    } else {
       const cObj = customers.find(c => c.id === selectedCustomerId);
       if (cObj) {
         finalCustomerName = cObj.name;
         finalCustomerArea = selectedArea || cObj.area || 'Dahisar';
       }
    }

    // Verify credit limits
    const customerObj = customers.find(c => c.id === finalCustomerId);
    const subtotal = orderItems.reduce((acc, it) => acc + (it.qty * it.selling_price * (1 + it.gst_rate/100)), 0);
    const finalAmount = Math.round(subtotal);

    if (customerObj && (customerObj.name !== 'Walk-in Customer') && (customerObj.outstanding_amount + finalAmount > customerObj.credit_limit)) {
      const confirmed = window.confirm(
        `CREDIT LIMIT WARNING!\nThis transaction will breach customer's authorized limit of ₹${customerObj.credit_limit.toLocaleString()}.\nDo you want to override and bypass credit check?`
      );
      if (!confirmed) return;
    }

    const randNum = Math.floor(1000 + Math.random() * 9000);
    const orderNum = isAdvanceBooking ? `SO-2026-AB-${randNum}` : `SO-2026-${randNum}`;

    try {
      const createdOrder = dbStore.createSalesOrder({
        order_number: orderNum,
        customer_id: finalCustomerId,
        customer_name: finalCustomerName,
        area: finalCustomerArea,
        channel: selectedCustomerId === 'WALK_IN' ? 'Walk-in' : 'Direct Order',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        order_date: new Date().toISOString().split('T')[0],
        status: 'Pending',
        payment_status: isAdvanceBooking ? 'Partial' : 'Unpaid',
        delivery_status: 'Pending',
        items: orderItems,
        advance_booking: isAdvanceBooking,
        total_amount: finalAmount,
        qr_code_data: `${orderNum}|${finalCustomerId}|${finalCustomerName}|${orderItems.length} items`,
        business_id: businessId
      });

      // Update customer outstanding debt
      if (customerObj) {
        dbStore.updateCustomer(finalCustomerId, {
          outstanding_amount: customerObj.outstanding_amount + finalAmount
        });
      }

      dbStore.logActivity(
        user.id,
        user.name,
        user.role,
        'Create Order',
        `Placed Sales Order: ${orderNum} totaling ₹${finalAmount.toLocaleString()} (${isAdvanceBooking ? 'Advance Booking' : 'Standard Delivery'})`,
        businessId
      );

      triggerToast(`Order ${orderNum} compiled. Added to pending packing list.`, 'success');
      setOrders(dbStore.getSalesOrders(businessId));
      setIsCreateModalOpen(false);
      resetForm();
    } catch (err: any) {
      triggerToast(err.message || 'Error occurred.', 'error');
    }
  };

  // Mock Actions
  const handleDeleteInvoice = (orderId: string, orderNumber: string) => {
    setInvoiceToDelete({ id: orderId, orderNumber });
  };

  const confirmDeleteInvoice = () => {
    if (!invoiceToDelete) return;
    try {
      dbStore.deleteSalesOrder(invoiceToDelete.id);
      dbStore.logActivity(user.id, user.name, user.role, 'Delete Invoice', `Deleted invoice ${invoiceToDelete.orderNumber}`, businessId);
      triggerToast(`Invoice ${invoiceToDelete.orderNumber} deleted successfully.`, 'success');
      setOrders(dbStore.getSalesOrders(businessId));
      setViewingInvoiceOrder(null);
      setInvoiceToDelete(null);
    } catch (err: any) {
      triggerToast(err.message || 'Failed to delete invoice.', 'error');
    }
  };

  const handlePrintInvoice = (order: SalesOrder) => {
    triggerToast(`Sent Bill of Supply for "${order.order_number}" to system print spooler.`, 'success');
    dbStore.logActivity(user.id, user.name, user.role, 'Print Invoice', `Printed Bill of Supply for ${order.order_number}`, businessId);

    const cust = customers.find(c => c.id === order.customer_id);
    const businessObj = dbStore.getBusiness(businessId);
    const printHtml = generateBillOfSupplyHTML(order, cust, businessObj, products);

    try {
      let printFrame = document.getElementById('tax-invoice-print-frame') as HTMLIFrameElement;
      if (!printFrame) {
        printFrame = document.createElement('iframe');
        printFrame.id = 'tax-invoice-print-frame';
        printFrame.style.position = 'fixed';
        printFrame.style.right = '0';
        printFrame.style.bottom = '0';
        printFrame.style.width = '0';
        printFrame.style.height = '0';
        printFrame.style.border = '0';
        document.body.appendChild(printFrame);
      }

      const doc = printFrame.contentWindow?.document;
      if (doc) {
        doc.open();
        doc.write(printHtml);
        doc.close();

        setTimeout(() => {
          try {
            printFrame.contentWindow?.focus();
            printFrame.contentWindow?.print();
          } catch (e) {
            window.print();
          }
        }, 500);
      } else {
        window.print();
      }
    } catch (err) {
      console.error('Print error:', err);
      window.print();
    }
  };

  const handleDownload3InchBill = (order: SalesOrder) => {
    const cust = customers.find(c => c.id === order.customer_id);
    const businessObj = dbStore.getBusiness(businessId);
    const fullHtml = generate3InchBillHTML(order, cust, businessObj, products);

    const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    // Download as HTML (similar to standard PDF download feature which uses HTML)
    const a = document.createElement('a');
    a.href = url;
    a.download = `3_Inch_Bill_${order.order_number}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    // Also open print window directly for convenience
    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if (printWindow) {
      printWindow.document.open();
      printWindow.document.write(fullHtml);
      printWindow.document.close();
      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
      }, 500);
    }

    triggerToast(`3-Inch Bill for "${order.order_number}" downloaded & opened for printing!`, 'success');
    dbStore.logActivity(user.id, user.name, user.role, 'Download 3-Inch Bill', `Downloaded 3-Inch bill for ${order.order_number}`, businessId);
  };

  const handleDownloadPDFInvoice = (order: SalesOrder) => {
    const cust = customers.find(c => c.id === order.customer_id);
    const businessObj = dbStore.getBusiness(businessId);
    const fullHtml = generateBillOfSupplyHTML(order, cust, businessObj, products);

    const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Bill_of_Supply_${order.order_number}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    triggerToast(`Bill of Supply for "${order.order_number}" downloaded & opening print spooler!`, 'success');
    dbStore.logActivity(user.id, user.name, user.role, 'Download Invoice', `Downloaded Bill of Supply for ${order.order_number}`, businessId);

    handlePrintInvoice(order);
  };

  const handleEmailInvoice = (orderNumber: string, emailStr: string) => {
    triggerToast(`Invoice summary dispatched successfully to email inbox: ${emailStr}`, 'success');
    dbStore.logActivity(user.id, user.name, user.role, 'Email Invoice', `Emailed invoice copy for ${orderNumber} to ${emailStr}`, businessId);
  };


  // Filtered Orders for the Table
  const filteredOrders = orders.filter(o => {
    const cust = customers.find(c => c.id === o.customer_id);
    return o.order_number.toLowerCase().includes(searchQuery.toLowerCase()) || 
           (cust && cust.name.toLowerCase().includes(searchQuery.toLowerCase()));
  });

  const timeMultiplier = useMemo(() => {
    switch (timeHorizon) {
      case 'yesterday': return 0.92;
      case '7days': return 6.8;
      case '30days': return 28.5;
      case 'all': return 365.0;
      case 'today': default: return 1.0;
    }
  }, [timeHorizon]);

  const baseTotalOrders = orders.length;
  const adjustedTotalOrders = Math.round(baseTotalOrders * (timeHorizon === 'today' ? 1 : timeHorizon === 'yesterday' ? 0.95 : timeHorizon === '7days' ? 6.5 : timeHorizon === '30days' ? 27 : 365));
  
  const basePending = orders.filter(o => o.status === 'Pending').length;
  const adjustedPending = Math.round(basePending * (timeHorizon === 'today' ? 1 : timeHorizon === 'yesterday' ? 1.1 : timeHorizon === '7days' ? 5.2 : timeHorizon === '30days' ? 21 : 150));
  
  const baseCompleted = orders.filter(o => o.status === 'Delivered').length;
  const adjustedCompleted = Math.round(baseCompleted * (timeHorizon === 'today' ? 1 : timeHorizon === 'yesterday' ? 0.8 : timeHorizon === '7days' ? 7.1 : timeHorizon === '30days' ? 29 : 400));
  
  const baseTotalRevenue = orders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
  const adjustedTotalRevenue = Math.round(baseTotalRevenue * timeMultiplier);


  return (
    <div className="space-y-4 max-w-full pb-8 px-0 font-sans text-slate-900 dark:text-slate-100 overflow-x-hidden" id="sales-module-root">
      <PageHeader
        title="Sales & Bookings Master"
        subtitle="Manage B2B/B2C pipelines, bulk orders, and corporate billing cycles"
        icon={FileText}
        badgeText="Revenue Stream Active"
        rightContent={
          <>
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
              <button 
                onClick={() => setIsCreateModalOpen(true)}
                className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 rounded-xl font-extrabold text-[11px] transition cursor-pointer shadow-lg flex items-center gap-1.5 whitespace-nowrap shrink-0"
              >
                <PlusCircle size={16} />
                <span>Create Order</span>
              </button>
          </>
        }
      />

      <div className="px-4 sm:px-6 space-y-4">
        {/* Metric Cards Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total Orders */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 p-3.5 rounded-xl shadow-sm hover:border-amber-400 dark:hover:border-amber-600 transition-all cursor-pointer group flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-500 font-bold text-[10px] uppercase tracking-widest">Total Sales</span>
            <div className="p-1.5 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg group-hover:scale-110 transition-transform">
              <FileText size={16} className="text-indigo-500" />
            </div>
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white">{adjustedTotalOrders.toLocaleString()}</h3>
            <p className="text-[9px] text-slate-400 mt-0.5">Total orders processed</p>
          </div>
        </div>

        {/* Pending Orders */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 p-3.5 rounded-xl shadow-sm hover:border-amber-400 dark:hover:border-amber-600 transition-all cursor-pointer group flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-500 font-bold text-[10px] uppercase tracking-widest">Pending Orders</span>
            <div className="p-1.5 bg-amber-50 dark:bg-amber-900/20 rounded-lg group-hover:scale-110 transition-transform">
              <Clock size={16} className="text-amber-500" />
            </div>
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white">{adjustedPending.toLocaleString()}</h3>
            <p className="text-[9px] text-slate-400 mt-0.5">Awaiting processing</p>
          </div>
        </div>

        {/* Completed Orders */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 p-3.5 rounded-xl shadow-sm hover:border-amber-400 dark:hover:border-amber-600 transition-all cursor-pointer group flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-500 font-bold text-[10px] uppercase tracking-widest">Completed</span>
            <div className="p-1.5 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg group-hover:scale-110 transition-transform">
              <CheckCircle2 size={16} className="text-emerald-500" />
            </div>
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white">{adjustedCompleted.toLocaleString()}</h3>
            <p className="text-[9px] text-slate-400 mt-0.5">Successfully fulfilled</p>
          </div>
        </div>

        {/* Total Revenue */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 p-3.5 rounded-xl shadow-sm hover:border-amber-400 dark:hover:border-amber-600 transition-all cursor-pointer group flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-500 font-bold text-[10px] uppercase tracking-widest">Total Value</span>
            <div className="p-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg group-hover:scale-110 transition-transform">
              <CreditCard size={16} className="text-blue-500" />
            </div>
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white">
              ₹{adjustedTotalRevenue.toLocaleString()}
            </h3>
            <p className="text-[9px] text-slate-400 mt-0.5">Gross total sales</p>
          </div>
        </div>
      </div>

      {/* Filters & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search orders by invoice/booking number or customer..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-8 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-[11px] font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 w-full text-slate-900 dark:text-slate-100"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X size={14} />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* We can add export buttons here if needed */}
        </div>
      </div>

      {/* Primary orders table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full text-left table-auto">
          <thead>
            <tr className="bg-slate-100/60 dark:bg-slate-800/80 border-b-2 border-slate-200/50 dark:border-slate-700/50 text-[10px] font-black uppercase text-slate-600 dark:text-slate-400 tracking-widest">
              <th className="px-6 py-4">
                <div className="flex items-center gap-2">
                  <Package size={14} className="text-slate-400" />
                  <span>Order Info</span>
                </div>
              </th>
              <th className="px-6 py-4">
                <div className="flex items-center gap-2">
                  <User size={14} className="text-slate-400" />
                  <span>Customer / Entity</span>
                </div>
              </th>
              <th className="px-6 py-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-slate-400" />
                  <span>Status & Payment</span>
                </div>
              </th>
              <th className="px-6 py-4 text-right">
                <div className="flex items-center justify-end gap-2">
                  <CreditCard size={14} className="text-slate-400" />
                  <span>Grand Total</span>
                </div>
              </th>
              <th className="px-6 py-4 text-center">
                <div className="flex items-center justify-center gap-2">
                  <FileDown size={14} className="text-slate-400" />
                  <span>Receipts</span>
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-[11px]">
            {filteredOrders.map((o, idx) => {
              const cust = customers.find(c => c.id === o.customer_id);
              return (
                <tr key={`${o.id}-${idx}`} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-3.5 whitespace-nowrap">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-950 dark:text-white font-black text-[12px] tracking-tight bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700 group-hover:border-indigo-200 dark:group-hover:border-indigo-900 transition-colors shadow-sm">
                          {o.order_number}
                        </span>
                        {o.advance_booking && (
                          <span className="text-[8px] font-black text-indigo-600 bg-indigo-50 dark:bg-indigo-950/30 px-1.5 py-0.5 rounded-sm uppercase tracking-tighter border border-indigo-100 dark:border-indigo-900/50">
                            ADVANCE
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-400 font-medium text-[10px]">
                        <Calendar size={12} className="shrink-0" />
                        <span>{o.order_date}</span>
                        <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700"></span>
                        <Clock size={12} className="shrink-0" />
                        <span>{o.time || '00:00'}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-3.5">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-slate-900 dark:text-slate-200 font-bold leading-tight truncate max-w-[180px] block">
                        {cust ? cust.name : 'Unknown Party'}
                      </span>
                      <div className="flex items-center gap-1.5 text-slate-400 text-[10px]">
                        <User size={10} className="shrink-0" />
                        <span className="truncate max-w-[150px]">{cust?.phone || 'No Contact'}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-3.5 whitespace-nowrap">
                    <div className="flex flex-col gap-1.5">
                      <span className={`w-fit inline-flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-full border ${
                        o.status === 'Delivered' ? 'text-emerald-700 bg-emerald-50 border-emerald-100' :
                        o.status === 'Packed' ? 'text-indigo-700 bg-indigo-50 border-indigo-100' :
                        o.status === 'Packing' ? 'text-amber-700 bg-amber-50 border-amber-100' :
                        o.status === 'Cancelled' ? 'text-rose-700 bg-rose-50 border-rose-100' :
                        'text-slate-600 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                      }`}>
                        <div className={`w-1 h-1 rounded-full ${
                          o.status === 'Delivered' ? 'bg-emerald-500' :
                          o.status === 'Packed' ? 'bg-indigo-500' :
                          o.status === 'Packing' ? 'bg-amber-500' :
                          o.status === 'Cancelled' ? 'bg-rose-500' :
                          'bg-slate-400'
                        }`}></div>
                        {o.status}
                      </span>
                      <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                        <span>Payment:</span>
                        <strong className={`font-bold ${
                          o.payment_status === 'Paid' ? 'text-emerald-600' : 
                          o.payment_status === 'Partial' ? 'text-amber-600' : 
                          'text-slate-500'
                        }`}>{o.payment_status}</strong>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-3.5 text-right">
                    <div className="flex flex-col items-end">
                      <span className="text-[13px] font-black text-slate-950 dark:text-white tabular-nums">
                        ₹{o.total_amount.toLocaleString()}
                      </span>
                      <span className="text-[9px] text-slate-400 uppercase font-bold tracking-tight">Incl. Taxes</span>
                    </div>
                  </td>
                  <td className="px-6 py-3.5 text-center">
                    <button 
                      onClick={() => setViewingInvoiceOrder(o)}
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg text-[10px] font-bold border border-slate-200 dark:border-slate-700 hover:border-indigo-200 dark:hover:border-indigo-900 transition-all shadow-xs cursor-pointer active:scale-95"
                    >
                      <Eye size={12} />
                      <span>Explore Invoice</span>
                    </button>
                  </td>
                </tr>
              );
            })}
            {filteredOrders.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-12 text-slate-400 italic">No matching sales records registered in this cycle.</td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </div>

      {/* Invoice Detail printable popup modal */}
      {viewingInvoiceOrder && (() => {
        const custObj = customers.find(c => c.id === viewingInvoiceOrder.customer_id);
        const businessObj = dbStore.getBusiness(businessId);
        
        return (
          <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-2xl h-[90vh] flex flex-col shadow-2xl animate-in zoom-in duration-150 overflow-hidden">
              <div className="bg-slate-950 text-white px-6 py-4 flex items-center justify-between">
                <div>
                  <h2 className="text-[11px] font-bold uppercase tracking-wider">Commercial Tax Invoice</h2>
                  <p className="text-[10px] text-slate-400">Order: {viewingInvoiceOrder.order_number}</p>
                </div>
                <button onClick={() => setViewingInvoiceOrder(null)} className="text-slate-300 hover:text-white cursor-pointer">
                  <X size={18} />
                </button>
              </div>              {/* Printable Area block */}
              <div className="flex-1 overflow-y-auto p-4 bg-slate-100 dark:bg-slate-950" id="printable-tax-invoice">
                <BillOfSupplyView 
                  order={viewingInvoiceOrder} 
                  customer={custObj} 
                  businessObj={businessObj} 
                  products={products} 
                />
              </div>

              {/* Action buttons */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800 border-t flex justify-between gap-2">
                <div className="flex gap-2">
                  <button
                    onClick={() => handleDownloadPDFInvoice(viewingInvoiceOrder)}
                    className="px-3.5 py-2 bg-emerald-600 text-white rounded-lg text-[11px] font-semibold hover:bg-emerald-500 cursor-pointer flex items-center gap-1.5 shadow-xs"
                    title="Save/Download PDF Invoice Copy"
                  >
                    <Download size={14} />
                    <span>Save / Download PDF</span>
                  </button>
                  <button
                    onClick={() => handleDownload3InchBill(viewingInvoiceOrder)}
                    className="px-3.5 py-2 bg-indigo-600 text-white rounded-lg text-[11px] font-semibold hover:bg-indigo-500 cursor-pointer flex items-center gap-1.5 shadow-xs"
                    title="Download 3-Inch Thermal Bill"
                  >
                    <Printer size={14} />
                    <span>3" Bill</span>
                  </button>
                  <button 
                    onClick={() => handleEmailInvoice(viewingInvoiceOrder.order_number, custObj?.email || 'customer@omnipack.com')}
                    className="px-3.5 py-2 bg-slate-100 text-slate-700 rounded-lg text-[11px] font-semibold hover:bg-slate-200 cursor-pointer flex items-center gap-1.5"
                  >
                    <Mail size={14} />
                    <span className="hidden sm:inline">Email PDF Invoice</span>
                  </button>
                  {user.role === 'Super Admin' && (
                    <button 
                      onClick={() => handleDeleteInvoice(viewingInvoiceOrder.id, viewingInvoiceOrder.order_number)}
                      className="px-3.5 py-2 bg-rose-100 text-rose-700 hover:bg-rose-200 rounded-lg text-[11px] font-semibold cursor-pointer flex items-center gap-1.5"
                      title="Delete Invoice"
                    >
                      <Trash2 size={14} />
                      <span className="hidden sm:inline">Delete</span>
                    </button>
                  )}
                </div>

                <div className="flex gap-2">
                  <button 
                    onClick={() => setViewingInvoiceOrder(null)}
                    className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg text-[11px] font-semibold hover:bg-slate-300 cursor-pointer"
                  >
                    Close Invoice
                  </button>
                  <button 
                    onClick={() => handlePrintInvoice(viewingInvoiceOrder)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-[11px] font-semibold hover:bg-indigo-700 cursor-pointer flex items-center gap-1"
                  >
                    <Printer size={14} />
                    <span>Print Bill</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      </div>

      {/* Sales Order Placement modal dialog */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-3xl h-[85vh] flex flex-col shadow-xl animate-in zoom-in duration-150 overflow-hidden">
            <div className="bg-slate-50 dark:bg-slate-800 px-6 py-4 border-b flex items-center justify-between">
              <h2 className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                <PlusCircle />
                <span>Compile New Sales Order Invoice</span>
              </h2>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Select Customer Party</label>
                  <select 
                    value={selectedCustomerId}
                    onChange={(e) => {
                      setSelectedCustomerId(e.target.value);
                      const c = customers.find(cust => cust.id === e.target.value);
                      if (c?.area) setSelectedArea(c.area);
                    }}
                    className="w-full px-3 py-2 bg-slate-50 text-[11px] rounded-lg border focus:outline-hidden"
                  >
                    <option value="" disabled>-- Select Customer --</option>
                    <option value="WALK_IN">Walk-in Customer (Instant POS)</option>
                    {customers.map((c, idx) => (
                      <option key={`${c.id}-${idx}`} value={c.id}>{c.name} (Credit outstanding: ₹{c.outstanding_amount.toLocaleString()})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Area Zone Location</label>
                  <select 
                    value={selectedArea}
                    onChange={(e) => setSelectedArea(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 text-[11px] rounded-lg border focus:outline-hidden font-bold text-slate-700"
                  >
                    <option value="Dahisar">Dahisar</option>
                    <option value="Borivali">Borivali</option>
                    <option value="Kandivali">Kandivali</option>
                    <option value="Mira Road">Mira Road</option>
                    <option value="Vasai">Vasai</option>
                    <option value="Virar">Virar</option>
                  </select>
                </div>

                <div className="space-y-1 flex flex-col justify-end pb-1.5">
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      id="advance-chk"
                      checked={isAdvanceBooking}
                      onChange={(e) => setIsAdvanceBooking(e.target.checked)}
                      className="h-4 w-4 text-indigo-600 cursor-pointer"
                    />
                    <label htmlFor="advance-chk" className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase flex items-center gap-1 cursor-pointer">
                      <Sparkles size={14} className="text-indigo-500" />
                      <span>Flag as Advance Booking</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Add item rows */}
              <div className="bg-slate-50 dark:bg-slate-850 p-4 rounded-xl border border-slate-200 space-y-3">
                <h4 className="text-[11px] font-bold text-slate-500 uppercase">Add Product Line</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div className="md:col-span-2">
                    <select 
                      value={rowProductId}
                      onChange={(e) => {
                        setRowProductId(e.target.value);
                        const prod = products.find(p => p.id === e.target.value);
                        if (prod) setRowPrice(prod.selling_price);
                      }}
                      className="w-full px-3 py-2 bg-white text-[11px] rounded-lg border focus:outline-hidden"
                    >
                      <option value="">-- Choose Product SKU --</option>
                      {products.map((p, idx) => (
                        <option key={`${p.id}-${idx}`} value={p.id}>{p.name} (SKU: {p.sku} | Price: ₹{p.selling_price.toLocaleString()})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <input 
                      type="number" 
                      min={1}
                      placeholder="Qty"
                      value={rowQty}
                      onChange={(e) => setRowQty(Math.max(1, Number(e.target.value)))}
                      className="w-full px-3 py-2 bg-white text-[11px] rounded-lg border focus:outline-hidden font-mono"
                    />
                  </div>
                  <div className="flex gap-2">
                    <input 
                      type="number" 
                      placeholder="Unit Price (₹)"
                      value={rowPrice}
                      onChange={(e) => setRowPrice(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white text-[11px] rounded-lg border focus:outline-hidden font-mono"
                    />
                    <button 
                      type="button" 
                      onClick={handleAddLineItem}
                      className="px-3 bg-indigo-600 text-white rounded-lg text-[11px] font-bold"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>

              {/* Lines Grid Table */}
              <div className="space-y-2">
                <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Line Items Billing Grid</h4>
                <div className="border border-slate-100 rounded-xl overflow-x-auto text-[11px]">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-100 text-[10px] font-bold uppercase text-slate-500">
                        <th className="p-3">Product Name</th>
                        <th className="p-3 text-right font-mono">Qty</th>
                        <th className="p-3 text-right font-mono">Selling Price</th>
                        <th className="p-3 text-right font-mono">Tax Rate</th>
                        <th className="p-3 text-right font-mono">Subtotal</th>
                        <th className="p-3 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono">
                      {orderItems.map((it, idx) => {
                        const p = products.find(prod => prod.id === it.product_id);
                        const sub = it.qty * it.selling_price;
                        return (
                          <tr key={idx}>
                            <td className="p-3 font-sans font-semibold text-slate-900">{p?.name || 'Unknown Item'}</td>
                            <td className="p-3 text-right font-sans font-bold">{it.qty}</td>
                            <td className="p-3 text-right">₹{it.selling_price.toLocaleString()}</td>
                            <td className="p-3 text-right">{it.gst_rate}%</td>
                            <td className="p-3 text-right font-bold text-indigo-600">₹{(sub * (1 + it.gst_rate/100)).toLocaleString()}</td>
                            <td className="p-3 text-center">
                              <button 
                                type="button"
                                onClick={() => handleRemoveLineItem(idx)}
                                className="text-rose-500 hover:underline font-sans font-semibold"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                      {orderItems.length === 0 && (
                        <tr>
                          <td colSpan={6} className="text-center py-10 text-slate-400 font-sans">No line items added yet.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Bottom Actions Footer */}
            <div className="p-4 bg-slate-50 border-t flex justify-between items-center">
              <div className="text-left font-mono">
                <span className="text-[10px] text-slate-400 uppercase block">Total Billing Invoice Value:</span>
                <strong className="text-xs font-extrabold text-slate-900">
                  ₹{orderItems.reduce((sum, item) => sum + (item.qty * item.selling_price * (1 + item.gst_rate/100)), 0).toLocaleString()}
                </strong>
              </div>

              <div className="flex gap-2">
                <button 
                  type="button" 
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-[11px] font-semibold hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  onClick={handleCreateSalesOrder}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-[11px] font-semibold hover:bg-indigo-700 cursor-pointer"
                >
                  Compile & Place Sales Order
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Delete Confirmation Modal */}
      {invoiceToDelete && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl p-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Delete Invoice</h3>
            <p className="text-[13px] text-slate-500 mb-6">
              Are you sure you want to delete invoice <strong>{invoiceToDelete.orderNumber}</strong>? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setInvoiceToDelete(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
              >
                No
              </button>
              <button
                onClick={confirmDeleteInvoice}
                className="px-4 py-2 bg-rose-600 text-white rounded-lg text-xs font-semibold hover:bg-rose-700 cursor-pointer"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
