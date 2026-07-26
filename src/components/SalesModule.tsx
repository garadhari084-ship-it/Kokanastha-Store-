import { PageHeader } from './PageHeader';
import React, { useEffect, useState, useMemo, useRef } from 'react';
import { formatOrderTime } from '../utils/formatters';
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
  FileDown,
  Filter,
  Send,
  ShoppingBag,
  MapPin,
  TrendingUp
} from 'lucide-react';
import { dbStore, isOrderInTimeHorizon, TimeHorizon } from '../services/store';
import { SalesOrder, Customer, Product, UserProfile, SalesItem, OrderStatus } from '../types/erp';
import { generateBillOfSupplyHTML, generate3InchBillHTML } from '../utils/invoiceTemplate';
import { BillOfSupplyView } from './BillOfSupplyView';

interface CustomDropdownOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface CustomDropdownProps {
  value: string;
  onChange: (val: string) => void;
  options: CustomDropdownOption[];
  placeholder?: string;
  className?: string;
}

const CustomDropdown: React.FC<CustomDropdownProps> = ({
  value,
  onChange,
  options,
  placeholder = 'Select...',
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(o => o.value === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative w-full">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-[11px] rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none flex items-center justify-between gap-2 text-left cursor-pointer transition-colors hover:border-slate-300 dark:hover:border-slate-600 ${className}`}
      >
        <span className="truncate font-medium">
          {selectedOption ? selectedOption.label : <span className="text-slate-400">{placeholder}</span>}
        </span>
        <ChevronDown size={14} className={`text-slate-400 transition-transform duration-150 shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl max-h-52 overflow-y-auto py-1 animate-in fade-in zoom-in-95 duration-100">
          {options.map((opt, idx) => (
            <button
              key={`${opt.value}-${idx}`}
              type="button"
              disabled={opt.disabled}
              onClick={() => {
                if (!opt.disabled) {
                  onChange(opt.value);
                  setIsOpen(false);
                }
              }}
              className={`w-full text-left px-3 py-1.5 text-[11px] font-medium transition-colors cursor-pointer truncate block ${
                opt.value === value
                  ? 'bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 font-bold'
                  : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60'
              } ${opt.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const getLocalTodayDate = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const getLocalCurrentTimeInput = () => {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

const format12HourTime = (time24: string) => {
  if (!time24) return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const parts = time24.split(':');
  if (parts.length < 2) return time24;
  let h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  if (isNaN(h) || isNaN(m)) return time24;
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  if (h === 0) h = 12;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')} ${ampm}`;
};

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
      const [timeHorizon, setTimeHorizon] = useState<'today' | 'yesterday' | '7days' | '30days' | 'all'>('all');
  const [isTopFilterMenuOpen, setIsTopFilterMenuOpen] = useState(false);
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [selectedOrderForNotify, setSelectedOrderForNotify] = useState<SalesOrder | null>(null);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedOrderIds(filteredOrders.map(o => o.id));
    } else {
      setSelectedOrderIds([]);
    }
  };

  const handleToggleSelectOrder = (id: string) => {
    setSelectedOrderIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleQuickStatusChange = (orderId: string, newStatus: OrderStatus) => {
    dbStore.updateSalesOrder(orderId, { status: newStatus });
    setOrders(dbStore.getSalesOrders(businessId));
    triggerToast(`Order status updated to ${newStatus}`, 'success');
  };

  
  
  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(openAddModalInitially);
  const [invoiceToDelete, setInvoiceToDelete] = useState<{id: string, orderNumber: string} | null>(null);
  const [selectedOrderForDetail, setSelectedOrderForDetail] = useState<SalesOrder | null>(null);
  const [selectedOrderForPayment, setSelectedOrderForPayment] = useState<SalesOrder | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'Cash' | 'Card'>('UPI');
  const [viewingInvoiceOrder, setViewingInvoiceOrder] = useState<SalesOrder | null>(
    selectedOrderIdInitially ? orders.find(o => o.id === selectedOrderIdInitially) || null : null
  );

  // New Order Form States
  const currentBiz = dbStore.getBusiness(businessId);
  const currencySymbol = useMemo(() => {
    const cur = currentBiz?.currency_symbol || currentBiz?.currency_default;
    if (!cur) return '₹';
    if (cur.includes(' - ')) return cur.split(' - ')[0].trim();
    return cur.trim();
  }, [currentBiz?.currency_symbol, currentBiz?.currency_default]);

  const defaultTenantTax = useMemo(() => {
    return typeof currentBiz?.tax_rate_default === 'number' && !isNaN(currentBiz.tax_rate_default)
      ? currentBiz.tax_rate_default
      : 0;
  }, [currentBiz?.tax_rate_default]);

  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedArea, setSelectedArea] = useState('Dahisar');
  const [orderDate, setOrderDate] = useState<string>(getLocalTodayDate);
  const [orderTime, setOrderTime] = useState<string>(getLocalCurrentTimeInput);
  const [deliveryDate, setDeliveryDate] = useState<string>(getLocalTodayDate);
  const [isAdvanceBooking, setIsAdvanceBooking] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'Paid' | 'Partial' | 'Unpaid'>('Paid');
  const [paymentMode, setPaymentMode] = useState<string>('Cash');
  const [paidAmount, setPaidAmount] = useState<number | string>('');
  const [orderItems, setOrderItems] = useState<SalesItem[]>([]);

  // Quick line-item row helper
  const [rowProductId, setRowProductId] = useState('');
  const [rowQty, setRowQty] = useState(1);
  const [rowPrice, setRowPrice] = useState(0);
  const [rowTaxRate, setRowTaxRate] = useState<number>(defaultTenantTax);

  const resetForm = () => {
    const biz = dbStore.getBusiness(businessId);
    setSelectedCustomerId('');
    setSelectedArea(biz?.default_dispatch_zone || 'Dahisar');
    setOrderDate(getLocalTodayDate());
    setOrderTime(getLocalCurrentTimeInput());
    setDeliveryDate(getLocalTodayDate());
    setIsAdvanceBooking(false);
    setPaymentStatus('Paid');
    setPaymentMode('Cash');
    setPaidAmount('');
    setOrderItems([]);
    setRowProductId('');
    setRowQty(1);
    setRowPrice(0);
    setRowTaxRate(typeof biz?.tax_rate_default === 'number' && !isNaN(biz.tax_rate_default) ? biz.tax_rate_default : 0);
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

    const itemGst = typeof rowTaxRate === 'number' && !isNaN(rowTaxRate)
      ? rowTaxRate
      : (typeof prod.gst_rate === 'number' && !isNaN(prod.gst_rate) && prod.gst_rate >= 0 ? prod.gst_rate : defaultTenantTax);

    const newItem: SalesItem = {
      product_id: rowProductId,
      qty: rowQty,
      scanned_qty: 0,
      selling_price: rowPrice || prod.selling_price,
      gst_rate: itemGst
    };

    setOrderItems([...orderItems, newItem]);
    setRowProductId('');
    setRowQty(1);
    setRowPrice(0);
    setRowTaxRate(defaultTenantTax);
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
             area: selectedArea || 'Dahisar',
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
       finalCustomerArea = selectedArea || 'Dahisar';
    } else {
       const cObj = customers.find(c => c.id === selectedCustomerId);
       if (cObj) {
         finalCustomerName = cObj.name;
         finalCustomerArea = selectedArea || (cObj.area && cObj.area !== 'Other' ? cObj.area : 'Dahisar');
       }
    }

    // Calculate payment amount and credit balance
    const customerObj = customers.find(c => c.id === finalCustomerId);
    const subtotal = orderItems.reduce((acc, it) => acc + (it.qty * it.selling_price * (1 + it.gst_rate/100)), 0);
    const finalAmount = Math.round(subtotal);

    let actualPaid = 0;
    if (paymentStatus === 'Paid') {
      actualPaid = finalAmount;
    } else if (paymentStatus === 'Partial') {
      actualPaid = Math.min(finalAmount, Math.max(0, Number(paidAmount) || 0));
    } else {
      actualPaid = 0;
    }
    const unpaidBalance = Math.max(0, finalAmount - actualPaid);

    if (customerObj && (customerObj.name !== 'Walk-in Customer') && (unpaidBalance > 0) && (customerObj.outstanding_amount + unpaidBalance > customerObj.credit_limit)) {
      const confirmed = window.confirm(
        `CREDIT LIMIT WARNING!\nThis transaction will increase debt by ${currencySymbol}${unpaidBalance.toLocaleString()} and breach authorized limit of ${currencySymbol}${customerObj.credit_limit.toLocaleString()}.\nDo you want to override and bypass credit check?`
      );
      if (!confirmed) return;
    }

    const currentBiz = dbStore.getBusiness(businessId);
    const prefix = currentBiz?.invoice_prefix ? currentBiz.invoice_prefix.trim() : 'SO-2026-';
    const randNum = Math.floor(1000 + Math.random() * 9000);
    const orderNum = isAdvanceBooking ? `${prefix}AB-${randNum}` : `${prefix}${randNum}`;

    try {
      const createdOrder = dbStore.createSalesOrder({
        order_number: orderNum,
        customer_id: finalCustomerId,
        customer_name: finalCustomerName,
        area: finalCustomerArea,
        channel: selectedCustomerId === 'WALK_IN' ? 'Walk-in' : 'Direct Order',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        order_date: getLocalTodayDate(),
        ...(selectedCustomerId !== 'WALK_IN' && deliveryDate ? { delivery_date: deliveryDate } : {}),
        status: 'Pending',
        payment_status: paymentStatus,
        payment_mode: paymentMode,
        paid_amount: actualPaid,
        delivery_status: 'Pending',
        items: orderItems,
        advance_booking: isAdvanceBooking,
        total_amount: finalAmount,
        qr_code_data: `${orderNum}|${finalCustomerId}|${finalCustomerName}|${orderItems.length} items`,
        business_id: businessId
      });

      // Update customer outstanding debt with the remaining unpaid balance!
      if (customerObj && finalCustomerId !== 'WALK_IN') {
        dbStore.updateCustomer(finalCustomerId, {
          outstanding_amount: Math.max(0, customerObj.outstanding_amount + unpaidBalance)
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


  // Filter orders strictly by time horizon for the entire page (metrics & table)
  const horizonOrders = useMemo(() => {
    return orders.filter(o => isOrderInTimeHorizon(o, timeHorizon));
  }, [orders, timeHorizon]);

  // Filtered Orders for the Table (applies search on top of time horizon)
  const filteredOrders = useMemo(() => {
    return horizonOrders.filter(o => {
      const cust = customers.find(c => c.id === o.customer_id);
      const custName = o.customer_name || (cust ? cust.name : '');
      const query = searchQuery.toLowerCase().trim();
      return !query || 
             o.order_number.toLowerCase().includes(query) || 
             custName.toLowerCase().includes(query) ||
             (o.area || '').toLowerCase().includes(query) ||
             (o.channel || '').toLowerCase().includes(query);
    });
  }, [horizonOrders, customers, searchQuery]);

  // Metric counts computed directly from time-horizon filtered orders
  const adjustedTotalOrders = horizonOrders.length;
  const adjustedPending = horizonOrders.filter(o => o.status === 'Pending' || o.status === 'Packing').length;
  const adjustedCompleted = horizonOrders.filter(o => o.status === 'Delivered').length;
  const adjustedTotalRevenue = horizonOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0);

  const horizonLabel = useMemo(() => {
    switch (timeHorizon) {
      case 'today': return 'Today';
      case 'yesterday': return 'Yesterday';
      case '7days': return 'Last 7 Days';
      case '30days': return 'Last 30 Days';
      case 'all': default: return 'All Time';
    }
  }, [timeHorizon]);


  return (
    <div className="space-y-4 max-w-full pb-8 px-0 font-sans text-slate-900 dark:text-slate-100 overflow-x-hidden" id="sales-module-root">
      <PageHeader
        title="Sales & Bookings Master"
        subtitle="Manage B2B/B2C pipelines, bulk orders, and corporate billing cycles"
        icon={FileText}
        badgeText="Revenue Stream Active"
        rightContent={
          <div className="flex items-center gap-3">
            {/* Quick Action Button */}
              <button 
                onClick={() => setIsCreateModalOpen(true)}
                className="p-2 md:px-4 md:py-2 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 rounded-xl font-extrabold text-[11px] transition cursor-pointer shadow-lg flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 min-w-[36px]"
              >
                <PlusCircle size={16} />
                <span className="hidden md:inline-block">Create Order</span>
              </button>

            {/* Top Time Filter Dropdown */}
            <div className="relative shrink-0">
              <button 
                onClick={() => setIsTopFilterMenuOpen(!isTopFilterMenuOpen)}
                className="h-9 px-3 flex items-center gap-2 bg-slate-950/70 border border-white/10 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500 text-slate-200 cursor-pointer hover:bg-slate-900 transition-colors text-xs font-bold"
                title="Filter by Time"
              >
                <Filter size={15} className="text-amber-500 shrink-0" />
                <span className="hidden sm:inline-block text-amber-400 font-extrabold">{horizonLabel}</span>
                <ChevronDown size={14} className="text-slate-400" />
              </button>
              
              {isTopFilterMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-700 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 text-slate-100">
                  <div className="p-2 space-y-1">
                    {['today', 'yesterday', '7days', '30days', 'all'].map((horizon) => (
                      <button
                        key={horizon}
                        onClick={() => {
                          setTimeHorizon(horizon as 'today'|'yesterday'|'7days'|'30days'|'all');
                          setIsTopFilterMenuOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-xl text-[11px] font-bold transition flex items-center justify-between ${
                          timeHorizon === horizon 
                             ? 'bg-amber-900/40 text-amber-500' 
                             : 'text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        {horizon === 'today' ? 'Today' : 
                         horizon === 'yesterday' ? 'Yesterday' : 
                         horizon === '7days' ? 'Last 7 Days' : 
                         horizon === '30days' ? 'Last 30 Days' : 'All Time'}
                        {timeHorizon === horizon && <CheckCircle2 size={14} className="text-amber-500" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        }
      />

      <div className="px-0.5 sm:px-1 space-y-4">
        {/* Metric Cards Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          {/* Total Sales */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-2 sm:p-3 rounded-xl shadow-xs hover:shadow-md hover:border-indigo-400 dark:hover:border-indigo-600 transition-all cursor-pointer group flex flex-col justify-between gap-1">
            <div className="flex items-center gap-1.5">
              <div className="p-1.5 bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-lg group-hover:scale-110 transition-transform shrink-0">
                <FileText size={14} />
              </div>
              <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">TOTAL SALES</span>
            </div>
            <div className="flex flex-col gap-0.5 mt-0.5">
              <span className="text-[11px] text-slate-800 dark:text-slate-200 leading-tight line-clamp-2" title="Total orders processed in system">Total orders processed in system</span>
            </div>
            <div className="text-right mt-1">
              <span className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
                {adjustedTotalOrders.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Pending Orders */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-2 sm:p-3 rounded-xl shadow-xs hover:shadow-md hover:border-amber-400 dark:hover:border-amber-600 transition-all cursor-pointer group flex flex-col justify-between gap-1">
            <div className="flex items-center gap-1.5">
              <div className="p-1.5 bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-lg group-hover:scale-110 transition-transform shrink-0">
                <Clock size={14} />
              </div>
              <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">PENDING ORDERS</span>
            </div>
            <div className="flex flex-col gap-0.5 mt-0.5">
              <span className="text-[11px] text-slate-800 dark:text-slate-200 leading-tight line-clamp-2" title="Orders awaiting kitchen processing & packing">Orders awaiting processing & kitchen packing</span>
            </div>
            <div className="text-right mt-1">
              <span className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
                {adjustedPending.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Completed Orders */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-2 sm:p-3 rounded-xl shadow-xs hover:shadow-md hover:border-emerald-400 dark:hover:border-emerald-600 transition-all cursor-pointer group flex flex-col justify-between gap-1">
            <div className="flex items-center gap-1.5">
              <div className="p-1.5 bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-lg group-hover:scale-110 transition-transform shrink-0">
                <CheckCircle2 size={14} />
              </div>
              <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">COMPLETED</span>
            </div>
            <div className="flex flex-col gap-0.5 mt-0.5">
              <span className="text-[11px] text-slate-800 dark:text-slate-200 leading-tight line-clamp-2" title="Successfully fulfilled & delivered orders">Successfully fulfilled & delivered orders</span>
            </div>
            <div className="text-right mt-1">
              <span className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
                {adjustedCompleted.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Total Value */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-2 sm:p-3 rounded-xl shadow-xs hover:shadow-md hover:border-emerald-400 dark:hover:border-emerald-600 transition-all cursor-pointer group flex flex-col justify-between gap-1">
            <div className="flex items-center gap-1.5">
              <div className="p-1.5 bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-lg group-hover:scale-110 transition-transform shrink-0">
                <TrendingUp size={14} />
              </div>
              <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">TOTAL VALUE</span>
            </div>
            <div className="flex flex-col gap-0.5 mt-0.5">
              <span className="text-[11px] text-slate-800 dark:text-slate-200 leading-tight line-clamp-2" title="Gross total sales value incl. taxes">Gross total sales value incl. taxes</span>
            </div>
            <div className="text-right mt-1">
              <span className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
                ₹{adjustedTotalRevenue.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

      {/* Filters & Actions Bar */}
      <div className="flex items-center justify-between gap-2 sm:gap-3 bg-white dark:bg-slate-900 p-2.5 sm:p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-x-auto">
        <div className="flex items-center gap-2 sm:gap-3 w-full min-w-max sm:min-w-0">
          <div className="relative w-36 sm:w-80 shrink-0 sm:shrink">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-7 py-1.5 sm:py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-[11px] font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 w-full text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X size={13} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-[11px] font-bold shrink-0 whitespace-nowrap">
              <Clock size={13} className="shrink-0" />
              <span>Horizon: <strong>{horizonLabel}</strong></span>
              <span className="ml-1 text-[10px] bg-amber-500/20 text-amber-800 dark:text-amber-300 px-1.5 py-0.2 rounded-md font-extrabold">
                {filteredOrders.length} {filteredOrders.length === 1 ? 'order' : 'orders'}
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* Primary orders table */}
      <div className="bg-white dark:bg-slate-900 overflow-x-auto rounded-3xl border border-black dark:border-white shadow-sm mt-5">
        <table className="w-full text-left text-[11px] whitespace-nowrap">
          <thead className="bg-slate-700 dark:bg-slate-600 text-white font-bold uppercase tracking-wider border-b border-black dark:border-white">
            <tr>
              <th className="py-2.5 px-4">Order ID</th>
              <th className="py-2.5 px-4">Customer</th>
              <th className="py-2.5 px-4">Area Zone</th>
              <th className="py-2.5 px-4">Pipeline Status</th>
              <th className="py-2.5 px-4">Amount</th>
              <th className="py-2.5 px-4">Payment</th>
              <th className="py-2.5 px-4">Time</th>
              <th className="py-2.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black dark:divide-white bg-white dark:bg-slate-900">
            {filteredOrders.map((o) => {
              const cust = customers.find(c => c.id === o.customer_id);
              const custName = o.customer_name || (cust ? cust.name : 'Walk-in Customer');
              const isSelected = selectedOrderIds.includes(o.id);

              return (
                <tr 
                  key={o.id}
                  className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${
                    isSelected ? 'bg-amber-50/50 dark:bg-amber-900/10' : ''
                  }`}
                >
                  <td className="py-2.5 px-4 font-black text-slate-900 dark:text-white">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => setSelectedOrderForDetail(o)}
                        className="hover:text-amber-500 cursor-pointer text-left transition-colors"
                      >
                        {o.order_number}
                      </button>
                      {o.advance_booking && (
                        <span className="px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 text-[9px] font-extrabold border border-amber-200/80 dark:border-amber-800/60">
                          Advance
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="py-2.5 px-4 font-semibold text-slate-800 dark:text-slate-200">
                    <div>
                      <span>{custName}</span>
                      {o.channel && (
                        <span className="text-[10px] text-slate-400 block font-normal">
                          Via {o.channel}
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="py-2.5 px-4 font-semibold text-slate-700 dark:text-slate-300 text-xs">
                    <span className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md border border-slate-200/80 dark:border-slate-700 font-medium text-[11px] text-slate-700 dark:text-slate-300">
                      📍 {o.area || 'Dahisar'}
                    </span>
                  </td>

                  <td className="py-2.5 px-4">
                    <span className={`inline-flex items-center text-[11px] font-bold px-3 py-1 rounded-full border ${
                      o.status === 'Delivered' ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800/60' :
                      o.status === 'Dispatched' ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800/60' :
                      o.status === 'Packed' ? 'bg-yellow-50 dark:bg-yellow-950/40 text-amber-800 dark:text-yellow-300 border-yellow-300 dark:border-yellow-800/60' :
                      o.status === 'Packing' ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800/60' :
                      o.status === 'Cancelled' ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800/60' :
                      'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                    }`}>
                      {o.status === 'Pending' ? 'Pending (बुकिंग)' :
                       o.status === 'Packing' ? 'Packing Started (पॅकिंग)' :
                       o.status === 'Packed' ? 'Ready / Packed (तयार)' :
                       o.status === 'Dispatched' ? 'Out for Delivery (निघाले)' :
                       o.status === 'Delivered' ? 'Delivered (पूर्ण)' :
                       o.status === 'Cancelled' ? 'Cancelled (रद्द)' : o.status}
                    </span>
                  </td>

                  <td className="py-2.5 px-4 font-black text-slate-900 dark:text-white">
                    {currencySymbol}{o.total_amount.toLocaleString()}
                  </td>

                  <td className="py-2.5 px-4">
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

                  <td className="py-2.5 px-4 text-slate-500 font-medium">
                    {formatOrderTime(o.time, o.created_at)}
                  </td>

                  <td className="py-2.5 px-4 text-right">
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
                        className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg transition cursor-pointer"
                        title="View Invoice & Specifications"
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
                <td colSpan={8} className="text-center py-12 text-slate-400 font-medium">
                  <div className="flex flex-col items-center justify-center gap-1.5">
                    <ShoppingBag size={28} className="text-slate-300 dark:text-slate-600" />
                    <p className="font-bold text-slate-600 dark:text-slate-300 text-xs">
                      No orders found.
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Try switching to "All Time" or reset your search & area filters to see more orders.
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ================= ORDER SPECIFICATIONS & RECEIPT MODAL ================= */}
      {selectedOrderForDetail && (
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedOrderForDetail(null);
          }}
          className="fixed inset-0 z-[70] bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
        >
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">
                  INVOICE & SPECIFICATIONS
                </span>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">
                  {selectedOrderForDetail.order_number}
                </h3>
              </div>
              <button 
                onClick={() => setSelectedOrderForDetail(null)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-full bg-slate-100 dark:bg-slate-800 cursor-pointer transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Order Content */}
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <strong className="text-sm font-extrabold text-slate-900 dark:text-white block">
                    {selectedOrderForDetail.customer_name || 'Walk-in Customer'}
                  </strong>
                  <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5 font-medium">
                    <MapPin size={12} className="text-amber-500 shrink-0" />
                    {selectedOrderForDetail.area || 'Dahisar'} zone
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-slate-400 block font-mono">Date: {selectedOrderForDetail.order_date}</span>
                  {selectedOrderForDetail.delivery_date && (
                    <span className="text-[11px] text-indigo-600 dark:text-indigo-400 block font-mono font-bold">Delivery: {selectedOrderForDetail.delivery_date}</span>
                  )}
                  <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 block">Time: {formatOrderTime(selectedOrderForDetail.time, selectedOrderForDetail.created_at)}</span>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Items Ordered</span>
                {(selectedOrderForDetail.items || []).map((it, idx) => {
                  const pObj = products.find(p => p.id === it.product_id);
                  return (
                    <div key={idx} className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-slate-100 dark:border-slate-800 text-xs">
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {pObj ? pObj.name : `Product ID #${it.product_id}`} × {it.qty}
                      </span>
                      <span className="font-black text-slate-900 dark:text-white">
                        {currencySymbol}{(it.selling_price * it.qty).toLocaleString()}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Total Summary */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Total Payable Amount</span>
                <span className="text-2xl font-black text-slate-900 dark:text-white">
                  {currencySymbol}{selectedOrderForDetail.total_amount.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Vertically stacked action buttons matching the attached image */}
            <div className="flex flex-col space-y-2.5 pt-2">
              <button 
                onClick={() => {
                  setViewingInvoiceOrder(selectedOrderForDetail);
                  setSelectedOrderForDetail(null);
                }}
                className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-2xl font-black text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <Printer size={16} /> Preview & Print Tax Invoice
              </button>
              <button
                onClick={() => handleDownload3InchBill(selectedOrderForDetail)}
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-md"
                title="Download 3-Inch Thermal Bill"
              >
                <Printer size={16} /> 3" Bill
              </button>
              <button
                onClick={() => handleDownloadPDFInvoice(selectedOrderForDetail)}
                className="w-full py-3.5 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white rounded-2xl font-black text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-md"
                title="Save & Download Tax Invoice PDF"
              >
                <Download size={16} /> Save PDF
              </button>
              <button 
                onClick={() => {
                  setSelectedOrderForPayment(selectedOrderForDetail);
                  setSelectedOrderForDetail(null);
                  setIsPaymentModalOpen(true);
                }}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <DollarSign size={16} /> Collect Payment
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ================= PAYMENT COLLECTION MODAL ================= */}
      {isPaymentModalOpen && selectedOrderForPayment && (
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsPaymentModalOpen(false);
          }}
          className="fixed inset-0 z-[80] bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
        >
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider block">COLLECT PAYMENT</span>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">Record Cash / UPI Receipt</h3>
              </div>
              <button onClick={() => setIsPaymentModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full bg-slate-100 dark:bg-slate-800 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              if (!selectedOrderForPayment) return;
              dbStore.updateSalesOrder(selectedOrderForPayment.id, { payment_status: 'Paid' });
              dbStore.logActivity(user.id, user.name, user.role, 'Collect Payment', `Collected ₹${selectedOrderForPayment.total_amount} via ${paymentMethod} for Order ${selectedOrderForPayment.order_number}`, businessId);
              triggerToast(`Recorded payment of ₹${selectedOrderForPayment.total_amount.toLocaleString()} via ${paymentMethod} for Order ${selectedOrderForPayment.order_number}`, 'success');
              setOrders(dbStore.getSalesOrders(businessId));
              setIsPaymentModalOpen(false);
              setSelectedOrderForPayment(null);
            }} className="space-y-4 text-[11px]">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Select Payment Mode</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['UPI', 'Cash', 'Card'] as const).map((m) => (
                    <button 
                      key={m}
                      type="button"
                      onClick={() => setPaymentMethod(m)}
                      className={`p-3 rounded-xl border text-[11px] font-bold transition cursor-pointer ${
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

              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200/60 dark:border-emerald-800/50 flex justify-between items-center">
                <span className="font-bold text-slate-700 dark:text-slate-300">Order {selectedOrderForPayment.order_number} Amount:</span>
                <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                  ₹{selectedOrderForPayment.total_amount.toLocaleString()}
                </span>
              </div>

              <button 
                type="submit"
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl text-xs transition shadow-lg cursor-pointer flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 size={18} /> Confirm Receipt & Close Dues
              </button>
            </form>

          </div>
        </div>
      )}

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

              {/* Action buttons in two distinct rows */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 space-y-2">
                {/* Row 1 */}
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => handleDownloadPDFInvoice(viewingInvoiceOrder)}
                    className="py-2 px-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[11px] font-bold cursor-pointer flex items-center justify-center gap-1.5 shadow-xs transition"
                    title="Save / Download PDF Invoice Copy"
                  >
                    <Download size={14} className="shrink-0" />
                    <span className="truncate">Save / Download PDF</span>
                  </button>
                  <button
                    onClick={() => handleDownload3InchBill(viewingInvoiceOrder)}
                    className="py-2 px-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[11px] font-bold cursor-pointer flex items-center justify-center gap-1.5 shadow-xs transition"
                    title="Download 3-Inch Thermal Bill"
                  >
                    <Printer size={14} className="shrink-0" />
                    <span className="truncate">3" Bill</span>
                  </button>
                  <button 
                    onClick={() => handleEmailInvoice(viewingInvoiceOrder.order_number, custObj?.email || 'customer@omnipack.com')}
                    className="py-2 px-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 rounded-xl text-[11px] font-bold cursor-pointer flex items-center justify-center gap-1.5 transition"
                    title="Email PDF Invoice to Customer"
                  >
                    <Mail size={14} className="shrink-0" />
                    <span className="truncate">Email PDF Invoice</span>
                  </button>
                </div>

                {/* Row 2 */}
                <div className="grid grid-cols-3 gap-2">
                  {user.role === 'Super Admin' ? (
                    <button 
                      onClick={() => handleDeleteInvoice(viewingInvoiceOrder.id, viewingInvoiceOrder.order_number)}
                      className="py-2 px-2 bg-rose-100 dark:bg-rose-950/60 hover:bg-rose-200 dark:hover:bg-rose-900/80 text-rose-700 dark:text-rose-300 rounded-xl text-[11px] font-bold cursor-pointer flex items-center justify-center gap-1.5 transition"
                      title="Delete Invoice"
                    >
                      <Trash2 size={14} className="shrink-0" />
                      <span className="truncate">Delete</span>
                    </button>
                  ) : (
                    <div />
                  )}
                  <button 
                    onClick={() => setViewingInvoiceOrder(null)}
                    className="py-2 px-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-xl text-[11px] font-bold cursor-pointer flex items-center justify-center gap-1.5 transition"
                  >
                    <X size={14} className="shrink-0" />
                    <span className="truncate">Close Invoice</span>
                  </button>
                  <button 
                    onClick={() => handlePrintInvoice(viewingInvoiceOrder)}
                    className="py-2 px-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-[11px] font-black cursor-pointer flex items-center justify-center gap-1.5 shadow-xs transition"
                  >
                    <Printer size={14} className="shrink-0" />
                    <span className="truncate">Print</span>
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
              <div>
                <h2 className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 text-slate-900 dark:text-white">
                  <PlusCircle className="text-amber-500" />
                  <span>Compile New Sales Order Invoice</span>
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] bg-indigo-50 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300 font-extrabold px-2 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-800">
                    Currency: {currencySymbol} ({currentBiz?.currency_symbol || currentBiz?.currency_default || 'INR'})
                  </span>
                  <span className="text-[10px] bg-emerald-50 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 font-extrabold px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                    Default Tax: {defaultTenantTax}% GST
                  </span>
                </div>
              </div>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer"><X size={18} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2 space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Select Customer Party</label>
                  <CustomDropdown 
                    value={selectedCustomerId}
                    onChange={(val) => {
                      setSelectedCustomerId(val);
                      const c = customers.find(cust => cust.id === val);
                      if (c?.area && c.area !== 'Other') {
                        setSelectedArea(c.area);
                      } else if (val === 'WALK_IN' || !c?.area || c.area === 'Other') {
                        setSelectedArea(currentBiz?.default_dispatch_zone || 'Dahisar');
                      }
                    }}
                    placeholder="-- Select Customer --"
                    options={[
                      { value: 'WALK_IN', label: 'Walk-in Customer (Instant POS)' },
                      ...customers.map(c => ({
                        value: c.id,
                        label: `${c.name} (Credit outstanding: ${currencySymbol}${c.outstanding_amount.toLocaleString()})`
                      }))
                    ]}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Area Zone Location</label>
                  {(() => {
                    const areaZoneList = currentBiz?.area_zones && currentBiz.area_zones.length > 0 
                      ? currentBiz.area_zones 
                      : ['Dahisar', 'Borivali', 'Kandivali', 'Mira Road', 'Vasai', 'Virar', 'Malad', 'Goregaon', 'Andheri'];
                    return (
                      <CustomDropdown 
                        value={selectedArea}
                        onChange={(val) => setSelectedArea(val)}
                        options={areaZoneList.map(aZone => ({ value: aZone, label: aZone }))}
                        className="font-bold text-slate-700 dark:text-slate-200"
                      />
                    );
                  })()}
                </div>

                {selectedCustomerId !== 'WALK_IN' ? (
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-500 uppercase">Delivery Date</label>
                    <input 
                      type="date"
                      value={deliveryDate}
                      onChange={(e) => setDeliveryDate(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-[11px] rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-hidden font-medium cursor-pointer"
                    />
                  </div>
                ) : (
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
                        <span>Advance Booking</span>
                      </label>
                    </div>
                  </div>
                )}
              </div>

              {selectedCustomerId !== 'WALK_IN' && (
                <div className="pt-1 flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    id="advance-chk-sub"
                    checked={isAdvanceBooking}
                    onChange={(e) => setIsAdvanceBooking(e.target.checked)}
                    className="h-4 w-4 text-indigo-600 cursor-pointer"
                  />
                  <label htmlFor="advance-chk-sub" className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase flex items-center gap-1 cursor-pointer">
                    <Sparkles size={14} className="text-indigo-500" />
                    <span>Flag as Advance Booking</span>
                  </label>
                </div>
              )}

              {/* Add item rows */}
              <div className="bg-slate-50 dark:bg-slate-850 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-[11px] font-bold text-slate-500 uppercase">Add Product Line</h4>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded">
                      Default Tax Rate: {defaultTenantTax}%
                    </span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded">
                      Currency: {currencySymbol}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                  <div className="md:col-span-4">
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Product SKU *</label>
                    <CustomDropdown 
                      value={rowProductId}
                      onChange={(pId) => {
                        setRowProductId(pId);
                        const prod = products.find(p => p.id === pId);
                        if (prod) {
                          setRowPrice(prod.selling_price);
                          const defaultTax = (defaultTenantTax === 0 || prod.gst_rate === 18 || typeof prod.gst_rate !== 'number' || isNaN(prod.gst_rate))
                            ? defaultTenantTax
                            : prod.gst_rate;
                          setRowTaxRate(defaultTax);
                        }
                      }}
                      placeholder="-- Choose Product SKU --"
                      options={[
                        { value: '', label: '-- Choose Product SKU --' },
                        ...products.map(p => ({
                          value: p.id,
                          label: `${p.name} (SKU: ${p.sku} | Price: ${currencySymbol}${p.selling_price.toLocaleString()})`
                        }))
                      ]}
                      className="bg-white dark:bg-slate-800 font-medium"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Qty</label>
                    <input 
                      type="number" 
                      min={1}
                      placeholder="Qty"
                      value={rowQty}
                      onChange={(e) => setRowQty(Math.max(1, Number(e.target.value)))}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 text-[11px] rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-hidden font-mono text-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Price ({currencySymbol})</label>
                    <input 
                      type="number" 
                      placeholder="Unit Price"
                      value={rowPrice}
                      onChange={(e) => setRowPrice(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 text-[11px] rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-hidden font-mono text-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Tax Rate (%)</label>
                    <input 
                      type="number" 
                      min={0}
                      max={100}
                      step={0.1}
                      placeholder="Tax %"
                      value={rowTaxRate}
                      onChange={(e) => setRowTaxRate(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 text-[11px] rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-hidden font-mono text-slate-900 dark:text-slate-100 font-bold text-indigo-600 dark:text-indigo-400"
                    />
                  </div>
                  <div className="md:col-span-2 flex items-end">
                    <button 
                      type="button" 
                      onClick={handleAddLineItem}
                      className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[11px] font-bold transition-colors cursor-pointer"
                    >
                      + Add Item
                    </button>
                  </div>
                </div>
              </div>

              {/* Lines Grid Table */}
              <div className="space-y-2">
                <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Line Items Billing Grid</h4>
                <div className="border border-slate-100 dark:border-slate-800 rounded-xl overflow-x-auto text-[11px]">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-100 dark:bg-slate-800 text-[10px] font-bold uppercase text-slate-500">
                        <th className="p-3">Product Name</th>
                        <th className="p-3 text-right font-mono">Qty</th>
                        <th className="p-3 text-right font-mono">Selling Price ({currencySymbol})</th>
                        <th className="p-3 text-right font-mono">Tax Rate (%)</th>
                        <th className="p-3 text-right font-mono">Subtotal (Incl. Tax)</th>
                        <th className="p-3 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                      {orderItems.map((it, idx) => {
                        const p = products.find(prod => prod.id === it.product_id);
                        const baseVal = it.qty * it.selling_price;
                        const taxVal = baseVal * (it.gst_rate / 100);
                        const itemTotal = baseVal + taxVal;
                        return (
                          <tr key={idx}>
                            <td className="p-3 font-sans font-semibold text-slate-900 dark:text-white">{p?.name || 'Unknown Item'}</td>
                            <td className="p-3 text-right font-sans font-bold">
                              <input 
                                type="number" 
                                min={1}
                                value={it.qty}
                                onChange={(e) => {
                                  const updated = [...orderItems];
                                  updated[idx].qty = Math.max(1, Number(e.target.value));
                                  setOrderItems(updated);
                                }}
                                className="w-16 px-2 py-1 text-right bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-[11px] focus:outline-hidden text-slate-900 dark:text-slate-100"
                              />
                            </td>
                            <td className="p-3 text-right">
                              <input 
                                type="number" 
                                value={it.selling_price}
                                onChange={(e) => {
                                  const updated = [...orderItems];
                                  updated[idx].selling_price = Number(e.target.value);
                                  setOrderItems(updated);
                                }}
                                className="w-24 px-2 py-1 text-right bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-[11px] focus:outline-hidden text-slate-900 dark:text-slate-100"
                              />
                            </td>
                            <td className="p-3 text-right">
                              <input 
                                type="number" 
                                min={0}
                                max={100}
                                step={0.1}
                                value={it.gst_rate}
                                onChange={(e) => {
                                  const updated = [...orderItems];
                                  updated[idx].gst_rate = Number(e.target.value);
                                  setOrderItems(updated);
                                }}
                                className="w-16 px-2 py-1 text-right bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-[11px] focus:outline-hidden text-slate-900 dark:text-slate-100"
                              />
                            </td>
                            <td className="p-3 text-right font-bold text-indigo-600 dark:text-indigo-400">
                              {currencySymbol}{itemTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td className="p-3 text-center">
                              <button 
                                type="button"
                                onClick={() => handleRemoveLineItem(idx)}
                                className="text-rose-500 hover:underline font-sans font-semibold cursor-pointer"
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

              {/* Payment Settlement Options */}
              <div className="bg-slate-50 dark:bg-slate-850 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/60 dark:border-slate-800 pb-2">
                  <h4 className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase flex items-center gap-1.5">
                    <CreditCard size={14} className="text-indigo-500" />
                    <span>Payment & Settlement Options</span>
                  </h4>
                  {(() => {
                    const taxableVal = orderItems.reduce((sum, item) => sum + (item.qty * item.selling_price), 0);
                    const taxVal = orderItems.reduce((sum, item) => sum + (item.qty * item.selling_price * (item.gst_rate / 100)), 0);
                    const totalVal = Math.round(taxableVal + taxVal);
                    const computedPaid = paymentStatus === 'Paid' 
                      ? totalVal 
                      : (paymentStatus === 'Partial' ? Math.min(totalVal, Math.max(0, Number(paidAmount) || 0)) : 0);
                    const computedBalance = Math.max(0, totalVal - computedPaid);

                    return (
                      <div className="flex items-center gap-3 text-[11px] font-bold">
                        <span className="text-slate-500 dark:text-slate-400">
                          Total: <span className="font-mono text-slate-800 dark:text-slate-100">{currencySymbol}{totalVal.toLocaleString()}</span>
                        </span>
                        <span className="text-slate-500 dark:text-slate-400">
                          Paid: <span className="font-mono text-emerald-600 dark:text-emerald-400">{currencySymbol}{computedPaid.toLocaleString()}</span>
                        </span>
                        <span className="text-slate-500 dark:text-slate-400">
                          Balance: <span className={`font-mono ${computedBalance > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-600 dark:text-slate-400'}`}>{currencySymbol}{computedBalance.toLocaleString()}</span>
                        </span>
                      </div>
                    );
                  })()}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase block">Payment Status</label>
                    <CustomDropdown 
                      value={paymentStatus}
                      onChange={(val) => {
                        const st = val as 'Paid' | 'Partial' | 'Unpaid';
                        setPaymentStatus(st);
                        if (st === 'Unpaid') {
                          setPaymentMode('Credit / On Account');
                        } else if (paymentMode === 'Credit / On Account') {
                          setPaymentMode('Cash');
                        }
                      }}
                      options={[
                        { value: 'Paid', label: 'Fully Paid (Settled)' },
                        { value: 'Partial', label: 'Partial / Advance Received' },
                        { value: 'Unpaid', label: 'Unpaid / On Credit' }
                      ]}
                      className="bg-white dark:bg-slate-800 font-bold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase block">Payment Method / Mode</label>
                    <CustomDropdown 
                      value={paymentMode}
                      onChange={(val) => setPaymentMode(val)}
                      options={[
                        { value: 'Cash', label: 'Cash' },
                        { value: 'UPI / QR', label: 'UPI / QR Code' },
                        { value: 'Card', label: 'Card (Credit/Debit)' },
                        { value: 'Bank Transfer', label: 'Bank Transfer / NEFT' },
                        { value: 'Credit / On Account', label: 'Credit / On Account' }
                      ]}
                      className="bg-white dark:bg-slate-800"
                    />
                  </div>

                  {paymentStatus === 'Partial' && (
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase block">Advance / Received Amount ({currencySymbol})</label>
                      <input 
                        type="number"
                        min={0}
                        placeholder="Enter advance/received amount"
                        value={paidAmount}
                        onChange={(e) => setPaidAmount(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-[11px] rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-hidden font-mono font-bold text-emerald-600 dark:text-emerald-400"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Actions Footer */}
            {(() => {
              const taxableVal = orderItems.reduce((sum, item) => sum + (item.qty * item.selling_price), 0);
              const taxVal = orderItems.reduce((sum, item) => sum + (item.qty * item.selling_price * (item.gst_rate / 100)), 0);
              const totalVal = Math.round(taxableVal + taxVal);

              return (
                <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div className="flex items-center gap-4 text-left font-mono text-[11px]">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase block font-sans">Base Subtotal</span>
                      <strong className="font-bold text-slate-700 dark:text-slate-300">
                        {currencySymbol}{taxableVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase block font-sans">Total Tax (GST)</span>
                      <strong className="font-bold text-emerald-600 dark:text-emerald-400">
                        +{currencySymbol}{taxVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </strong>
                    </div>
                    <div className="border-l border-slate-200 dark:border-slate-700 pl-3">
                      <span className="text-[10px] text-slate-400 uppercase block font-sans font-bold">Grand Total Value</span>
                      <strong className="text-sm font-black text-indigo-600 dark:text-indigo-400">
                        {currencySymbol}{totalVal.toLocaleString()}
                      </strong>
                    </div>
                  </div>

                  <div className="flex gap-2 w-full sm:w-auto justify-end">
                    <button 
                      type="button" 
                      onClick={() => setIsCreateModalOpen(false)}
                      className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-[11px] font-semibold hover:bg-slate-300 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button 
                      type="button" 
                      onClick={handleCreateSalesOrder}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[11px] font-bold shadow-md cursor-pointer transition"
                    >
                      Compile & Place Sales Order
                    </button>
                  </div>
                </div>
              );
            })()}
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

      {/* WhatsApp / SMS Tracking Modal */}
      {selectedOrderForNotify && (
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedOrderForNotify(null);
          }}
          className="fixed inset-0 z-[70] bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
        >
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider block">CUSTOMER ALERT</span>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">Send SMS / WhatsApp Tracking</h3>
              </div>
              <button onClick={() => setSelectedOrderForNotify(null)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full bg-slate-100 dark:bg-slate-800 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-[11px]">
              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 font-mono text-[11px] text-slate-700 dark:text-slate-300">
                "Hello {selectedOrderForNotify.customer_name || 'Customer'}, your Kokanastha Faral order {selectedOrderForNotify.order_number} is now {selectedOrderForNotify.status}! Track live delivery route at https://kokanasthafaral.com/track/{selectedOrderForNotify.order_number}"
              </div>

              <div className="flex gap-1.5">
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
