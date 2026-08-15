
export interface MetricDetailConfig {
  title: string;
  subtitle: string;
  icon: any;
  iconColor: string;
  badgeText: string;
  type: 'status' | 'to_pack' | 'deliveries_today' | 'overdue' | 'payment' | 'area' | 'all' | 'revenue' | 'receivables' | 'low_stock' | 'out_of_stock' | 'kitchen';
  filterValue?: string;
  description?: string;
}

import { PageHeader } from './PageHeader';
import { WhatsAppNotifyModal } from './WhatsAppNotifyModal';
import { Database } from 'lucide-react';
import React, { useEffect, useState, useMemo, useRef } from 'react';
import { formatOrderTime } from '../utils/formatters';
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
  Download,
  Mail,
  FileText,
  Trash2,
  BadgeAlert,
  ChevronDown,
  Eye,
  Share2,
  Calendar,
  CalendarDays,
  Edit,
  ClipboardList,
  AlertCircle
} from 'lucide-react';
import { dbStore, isOrderInTimeHorizon, TimeHorizon } from '../services/store';
import { SalesOrder, UserProfile, OrderStatus } from '../types/erp';
import { generateBillOfSupplyHTML, generate3InchBillHTML } from '../utils/invoiceTemplate';
import { BillOfSupplyView } from './BillOfSupplyView';

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
  // Role Permission Flags & Tab Filtering
  const userRole = user?.role || 'Viewer';

  const canCreateOrder = userRole !== 'Viewer' && userRole !== 'Packing Staff';
  const canCollectPayment = userRole !== 'Viewer' && userRole !== 'Packing Staff';
  const canDeleteOrder = userRole === 'Super Admin';
  const canEditOrder = userRole !== 'Viewer' && userRole !== 'Packing Staff';
  const showFinancials = userRole === 'Super Admin' || userRole === 'Admin' || userRole === 'Manager';
  const canMassDispatch = userRole !== 'Viewer';

  // Allowed Dashboard Tabs per User Role
  const allowedTabs = useMemo(() => {
    if (userRole === 'Super Admin' || userRole === 'Admin' || userRole === 'Manager') {
      return [
        { id: 'operations', label: 'Live Operations', icon: Activity },
        { id: 'analytics', label: 'Sales & Revenue', icon: BarChart3 },
        { id: 'logistics', label: 'Dispatch & Zones', icon: Truck },
        { id: 'inventory', label: 'Stock & Kitchen', icon: Boxes }
      ];
    }
    if (userRole === 'Sales Staff') {
      return [
        { id: 'operations', label: 'Live Operations', icon: Activity },
        { id: 'analytics', label: 'Sales & Revenue', icon: BarChart3 },
        { id: 'logistics', label: 'Dispatch & Zones', icon: Truck }
      ];
    }
    if (userRole === 'Packing Staff') {
      return [
        { id: 'operations', label: 'Kitchen & Packing Ops', icon: Activity },
        { id: 'logistics', label: 'Dispatch & Zones', icon: Truck },
        { id: 'inventory', label: 'Stock & Kitchen', icon: Boxes }
      ];
    }
    // Viewer
    return [
      { id: 'operations', label: 'Live Operations', icon: Activity },
      { id: 'logistics', label: 'Dispatch & Zones', icon: Truck },
      { id: 'inventory', label: 'Stock & Kitchen', icon: Boxes }
    ];
  }, [userRole]);

  const [activeTab, setActiveTab] = useState<TabView>('operations');

  useEffect(() => {
    const validIds = allowedTabs.map(t => t.id);
    if (!validIds.includes(activeTab)) {
      setActiveTab(validIds[0].id as TabView);
    }
  }, [userRole, allowedTabs, activeTab]);

  const [timeHorizon, setTimeHorizon] = useState<TimeHorizon>('today');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const [isTopFilterMenuOpen, setIsTopFilterMenuOpen] = useState(false);
  
  const topFilterRef = useRef<HTMLDivElement>(null);
  const chartFilterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (topFilterRef.current && !topFilterRef.current.contains(event.target as Node)) {
        setIsTopFilterMenuOpen(false);
      }
      if (chartFilterRef.current && !chartFilterRef.current.contains(event.target as Node)) {
        setIsFilterMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Search & Filter State
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [areaFilter, setAreaFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);

  // Modals state
  const [selectedOrderForDetail, setSelectedOrderForDetail] = useState<SalesOrder | null>(null);
  const [selectedOrderForNotify, setSelectedOrderForNotify] = useState<SalesOrder | null>(null);
  const [viewingInvoiceOrder, setViewingInvoiceOrder] = useState<SalesOrder | null>(null);
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedOrderForPayment, setSelectedOrderForPayment] = useState<SalesOrder | null>(null);
  const [invoiceToDelete, setInvoiceToDelete] = useState<SalesOrder | null>(null);
  const [invoiceToEdit, setInvoiceToEdit] = useState<SalesOrder | null>(null);

  const handleDeleteInvoiceConfirm = (id: string, orderNumber: string) => {
    dbStore.deleteSalesOrder(id);
    triggerToast(`Invoice ${orderNumber} deleted successfully.`, 'success');
    setInvoiceToDelete(null);
  };

  const handleEditInvoiceConfirm = (order: SalesOrder) => {
    // Navigate to sales module with the order ID
    onNavigate('sales', { orderId: order.id, openAddModal: true });
    setInvoiceToEdit(null);
  };

  // Invoice Handlers
  const handlePrintInvoice = async (order: SalesOrder) => {
    triggerToast(`Bill of Supply "${order.order_number}" sent to print spooler!`, 'success');
    dbStore.logActivity(user.id, user.name, user.role, 'Print Invoice', `Printed Bill of Supply for ${order.order_number}`, businessId);

    const cust = customers.find(c => c.id === order.customer_id);
    const businessObj = dbStore.getBusiness(businessId);
    const printHtml = await generateBillOfSupplyHTML(order, cust, businessObj, products);

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

  const handleDownload3InchBill = async (order: SalesOrder) => {
    const cust = customers.find(c => c.id === order.customer_id);
    const businessObj = dbStore.getBusiness(businessId);
    const fullHtml = await generate3InchBillHTML(order, cust, businessObj, products);

    const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    // Download as HTML
    const a = document.createElement('a');
    a.href = url;
    a.download = `3_Inch_Bill_${order.order_number}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    // Open print window directly
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

  const handleSavePDFInvoice = async (order: SalesOrder) => {
    const cust = customers.find(c => c.id === order.customer_id);
    const businessObj = dbStore.getBusiness(businessId);
    const fullHtml = await generateBillOfSupplyHTML(order, cust, businessObj, products);
    
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
    dbStore.logActivity(user.id, user.name, user.role, 'Save Invoice', `Saved Bill of Supply for ${order.order_number}`, businessId);

    handlePrintInvoice(order);
  };

  const handleEmailInvoice = (order: SalesOrder, emailStr: string) => {
    triggerToast(`Tax Invoice summary dispatched successfully to email: ${emailStr}`, 'success');
    dbStore.logActivity(user.id, user.name, user.role, 'Email Invoice', `Emailed invoice copy for ${order.order_number} to ${emailStr}`, businessId);
  };

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

  // Metric Drilldown Modal State
  const [activeMetricModal, setActiveMetricModal] = useState<MetricDetailConfig | null>(null);
  const [modalSearch, setModalSearch] = useState('');

  const handleOpenMetricDetail = (config: MetricDetailConfig) => {
    setModalSearch('');
    setActiveMetricModal(config);
  };

  const scrollToLedger = (statusVal?: string, areaVal?: string) => {
    if (statusVal) setStatusFilter(statusVal);
    if (areaVal) setAreaFilter(areaVal);
    setActiveMetricModal(null);
    setTimeout(() => {
      const el = document.getElementById('orders-ledger-table');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const handleRestockProduct = (productId: string, addQty: number = 10) => {
    const p = products.find(prod => prod.id === productId);
    if (p) {
      const newStock = (p.current_stock ?? 0) + addQty;
      dbStore.updateProduct(productId, { current_stock: newStock });
      triggerToast(`Restocked ${p.name} (+${addQty} units). New Stock: ${newStock}`, 'success');
    }
  };


  // Fetch Database Records
  const [tick, setTick] = useState(0);
  useEffect(() => {
    return dbStore.subscribe(() => {
      setTick(t => t + 1);
    });
  }, [businessId]);
  const metrics = dbStore.getDashboardMetrics(businessId, timeHorizon, customStartDate, customEndDate);
  const products = dbStore.getProducts(businessId);
  const customers = dbStore.getCustomers(businessId);
  const allOrders = dbStore.getSalesOrders(businessId);

  const lowStockThreshold = useMemo(() => dbStore.getSettings(businessId).low_stock_limit, [businessId]);
  const lowStockCount = useMemo(() => products.filter(p => (p.current_stock ?? 0) > 0 && (p.current_stock ?? 0) <= lowStockThreshold).length, [products, lowStockThreshold]);
  const outOfStockCount = useMemo(() => products.filter(p => (p.current_stock ?? 0) === 0).length, [products]);

  // Modal drilldown items computation
  const modalItems = useMemo(() => {
    if (!activeMetricModal) return { orders: [], products: [] };

    const query = modalSearch.toLowerCase().trim();

    if (activeMetricModal.type === 'low_stock' || activeMetricModal.type === 'out_of_stock' || activeMetricModal.type === 'kitchen') {
      let prods = products;
      if (activeMetricModal.type === 'low_stock') {
        prods = prods.filter(p => (p.current_stock ?? 0) > 0 && (p.current_stock ?? 0) <= lowStockThreshold);
      } else if (activeMetricModal.type === 'out_of_stock') {
        prods = prods.filter(p => (p.current_stock ?? 0) === 0);
      }
      if (query) {
        prods = prods.filter(p => p.name.toLowerCase().includes(query) || p.sku.toLowerCase().includes(query));
      }
      return { orders: [], products: prods };
    }

    // Filter order stream for active metric modal
    let filtered = allOrders;

    // Apply time horizon ONLY for time-dependent metrics
    if (activeMetricModal.type === 'revenue' || activeMetricModal.type === 'all' || activeMetricModal.type === 'area') {
      filtered = allOrders.filter(o => isOrderInTimeHorizon(o, timeHorizon, customStartDate, customEndDate));
    }

    if (activeMetricModal.type === 'to_pack') {
      filtered = filtered.filter(o => o.status === 'Pending' || o.status === 'Packing');
    } else if (activeMetricModal.type === 'deliveries_today') {
      filtered = filtered.filter(o => o.status === 'Dispatched' || o.status === 'Delivered');
    } else if (activeMetricModal.type === 'status' && activeMetricModal.filterValue) {
      const val = activeMetricModal.filterValue.toUpperCase();
      filtered = filtered.filter(o => o.status.toUpperCase() === val);
    } else if (activeMetricModal.type === 'overdue') {
      filtered = filtered.filter(o => o.is_overdue || o.status === 'Pending' || o.status === 'Packing');
    } else if (activeMetricModal.type === 'payment') {
      filtered = filtered.filter(o => o.payment_status === 'Unpaid' || o.payment_status === 'Partial');
    } else if (activeMetricModal.type === 'area' && activeMetricModal.filterValue) {
      const targetArea = activeMetricModal.filterValue.toLowerCase();
      filtered = filtered.filter(o => (o.area || 'Dahisar').toLowerCase() === targetArea);
    } else if (activeMetricModal.type === 'receivables') {
      filtered = filtered.filter(o => o.payment_status !== 'Paid');
    } else if (activeMetricModal.type === 'revenue') {
      filtered = filtered.filter(o => o.status !== 'Cancelled');
    }

    if (query) {
      filtered = filtered.filter(o => 
        o.order_number.toLowerCase().includes(query) ||
        (o.customer_name || '').toLowerCase().includes(query) ||
        (o.area || '').toLowerCase().includes(query) ||
        (o.channel || '').toLowerCase().includes(query)
      );
    }

    return { orders: filtered, products: [] };
  }, [activeMetricModal, modalSearch, allOrders, products, timeHorizon]);

  const horizonLabel = useMemo(() => {
    switch (timeHorizon) {
      case 'today': return 'Today';
      case 'yesterday': return 'Yesterday';
      case '7days': return '7 Days';
      case '30days': return '30 Days';
      case 'custom': return `Custom (${customStartDate || '*'} to ${customEndDate || '*'})`;
      case 'all': default: return 'All Time';
    }
  }, [timeHorizon, customStartDate, customEndDate]);

  // Filtered Orders for the Table
  const filteredOrders = useMemo(() => {
    return allOrders.filter(o => {
      const matchesHorizon = isOrderInTimeHorizon(o, timeHorizon, customStartDate, customEndDate);
      const matchesStatus = 
        statusFilter === 'ALL' ? true :
        statusFilter === 'TO_PACK' ? (o.status === 'Pending' || o.status === 'Packing') :
        o.status.toUpperCase() === statusFilter.toUpperCase();
      const matchesArea = areaFilter === 'ALL' || o.area === areaFilter;
      const cust = customers.find(c => c.id === o.customer_id);
      const custName = o.customer_name || (cust ? cust.name : '');
      const matchesSearch = 
        o.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        custName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (o.area && o.area.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (o.channel && o.channel.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesHorizon && matchesStatus && matchesArea && matchesSearch;
    });
  }, [allOrders, customers, timeHorizon, statusFilter, areaFilter, searchQuery, customStartDate, customEndDate]);

  // Handle Quick Status Change
  const handleQuickStatusChange = (orderId: string, newStatus: OrderStatus) => {
    try {
      dbStore.updateSalesOrder(orderId, { status: newStatus, delivery_status: newStatus });
      triggerToast(`Order status updated to "${newStatus}".`, 'success');
      
      const allUsers = dbStore.getUsers(businessId);
      let packingStaff = allUsers.filter(u => u.role && (u.role === 'Packing Staff' || u.role.toLowerCase().includes('pack')));
      if (packingStaff.length === 0) {
        packingStaff = allUsers;
      }
      const orderNum = allOrders.find(o => o.id === orderId)?.order_number || orderId;
      
      if (packingStaff.length > 0) {
        packingStaff.forEach(staff => {
          dbStore.sendMessage({
            sender_id: user?.id || 'sys',
            receiver_id: staff.id,
            content: `Sales Order ${orderNum} status has been updated to ${newStatus}.`,
            business_id: businessId
          });
        });
        triggerToast(`Notification sent to ${packingStaff.length} packaging staff member(s).`, 'success');
      }
    } catch (err: any) {
      triggerToast(err.message || 'Failed to update order status', 'error');
    }
  };

  // Bulk Actions
  const handleBulkStatusUpdate = (status: OrderStatus) => {
    if (selectedOrderIds.length === 0) return;
    
    const allUsers = dbStore.getUsers(businessId);
    let packingStaff = allUsers.filter(u => u.role && (u.role === 'Packing Staff' || u.role.toLowerCase().includes('pack')));
    if (packingStaff.length === 0) {
      packingStaff = allUsers;
    }
    
    selectedOrderIds.forEach(id => {
      dbStore.updateSalesOrder(id, { status, delivery_status: status });
      const orderNum = allOrders.find(o => o.id === id)?.order_number || id;
      
      if (packingStaff.length > 0) {
        packingStaff.forEach(staff => {
          dbStore.sendMessage({
            sender_id: user?.id || 'sys',
            receiver_id: staff.id,
            content: `Sales Order ${orderNum} status has been updated to ${status}.`,
            business_id: businessId
          });
        });
      }
    });
    
    if (packingStaff.length > 0) {
      triggerToast(`Notifications sent to ${packingStaff.length} packaging staff member(s) for ${selectedOrderIds.length} orders.`, 'success');
    }
    
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

  const handleOpenNewOrderModal = () => {
    onNavigate('sales', { openAddModal: true });
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
    } else {
      if (cust.area !== newOrderArea) {
        dbStore.updateCustomer(cust.id, {
          area: newOrderArea,
          shipping_address: `${newOrderArea} Resident`,
          billing_address: `${newOrderArea} Resident`
        });
      }
    }

    const now = new Date();
    const localTodayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    const nextNumber = dbStore.getNextAvailableInvoiceNumber(businessId, false, false);

    const selectedProdObj = products.find(p => p.id === newOrderProduct) || products[0];
    const totalCalc = selectedProdObj ? selectedProdObj.selling_price * newOrderQty : 750;

    const createdOrder = dbStore.createSalesOrder({
      order_number: nextNumber,
      customer_id: cust.id,
      customer_name: cust.name,
      area: newOrderArea,
      channel: newOrderChannel || 'Direct Order',
      time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      is_overdue: false,
      order_date: localTodayStr,
      status: 'Pending',
      payment_status: 'Unpaid',
      delivery_status: 'Pending',
      items: selectedProdObj ? [{
        product_id: selectedProdObj.id,
        qty: newOrderQty,
        scanned_qty: 0,
        selling_price: selectedProdObj.selling_price,
        gst_rate: selectedProdObj.gst_rate || 5
      }] : [],
      advance_booking: newOrderAdvance,
      total_amount: totalCalc,
      business_id: businessId,
      qr_code_data: nextNumber
    });

    dbStore.logActivity(
      user?.id || 'sys',
      user?.name || 'System',
      user?.role || 'Staff',
      'Create Order',
      `Created Order ${nextNumber} for ${cust.name} (Amount: ₹${totalCalc})`,
      businessId
    );

    // Send message to packaging users for new order
    const allUsers = dbStore.getUsers(businessId);
    const packingStaff = allUsers.filter(u => u.role && (u.role === 'Packing Staff' || u.role.toLowerCase().includes('pack')));
    
    if (packingStaff.length > 0) {
      packingStaff.forEach(staff => {
        dbStore.sendMessage({
          sender_id: user?.id || 'sys',
          receiver_id: staff.id,
          content: `New Sales Order ${nextNumber} has been placed. Please prepare for packing.`,
          business_id: businessId
        });
      });
    }

    // Ensure payment modal is closed
    setIsPaymentModalOpen(false);
    setSelectedOrderForPayment(null);

    triggerToast(`Order ${nextNumber} created successfully and saved!`, 'success');

    // Reset filters so the new order is immediately visible in the table
    setStatusFilter('ALL');
    setAreaFilter('ALL');
    setSearchQuery('');
    setTick(t => t + 1);

    setIsNewOrderModalOpen(false);
    setNewOrderCustomer('');
    setNewOrderPhone('');
    setNewOrderQty(1);
    setNewOrderAdvance(false);

    // Scroll to the orders table
    setTimeout(() => {
      const el = document.getElementById('orders-ledger-table');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
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
        subtitle={`Welcome, ${user?.name || 'User'} • ${
          userRole === 'Super Admin' ? 'Full Control & Financial Oversight' :
          userRole === 'Admin' ? 'Administrator Portal & Sales Oversight' :
          userRole === 'Manager' ? 'Operations, Logistics & Stock Control' :
          userRole === 'Sales Staff' ? 'Sales Desk, Order Booking & Unpaid Collections' :
          userRole === 'Packing Staff' ? 'Kitchen Queue, Packaging & Route Dispatch' :
          'Read-Only Operational View'
        }`}
        icon={LayoutDashboard}
        badgeText={`Role: ${userRole}`}
        showThemeSelector={true}
        rightContent={

          <div className="flex items-center gap-3 flex-row-reverse">
            {/* Top Time Filter Dropdown */}
            <div className="relative shrink-0" ref={topFilterRef}>
              <button 
                onClick={() => setIsTopFilterMenuOpen(!isTopFilterMenuOpen)}
                className="w-9 h-9 flex items-center justify-center bg-slate-950/70 border border-white/10 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500 text-slate-200 cursor-pointer hover:bg-slate-900 transition-colors"
                title="Filter by Time"
              >
                <Filter size={16} className="text-amber-500" />
              </button>
              
              {isTopFilterMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-700 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 text-slate-100">
                  <div className="p-2 space-y-1">
                    {['today', 'yesterday', '7days', '30days', 'all', 'custom'].map((horizon) => (
                      <button
                        key={horizon}
                        onClick={() => {
                          setTimeHorizon(horizon as TimeHorizon);
                          if (horizon !== 'custom') setIsTopFilterMenuOpen(false);
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
                         horizon === '30days' ? 'Last 30 Days' :
                         horizon === 'custom' ? 'Custom Date' : 'All Time'}
                        {timeHorizon === horizon && <CheckCircle2 size={14} className="text-amber-500" />}
                      </button>
                    ))}
                  </div>
                  
                  {timeHorizon === 'custom' && (
                    <div className="p-3 bg-slate-800/50 border-t border-slate-700 space-y-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400">Start Date</label>
                        <input 
                          type="date"
                          value={customStartDate}
                          onChange={e => setCustomStartDate(e.target.value)}
                          className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-[11px] font-medium text-white focus:ring-1 focus:ring-amber-500 outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400">End Date</label>
                        <input 
                          type="date"
                          value={customEndDate}
                          onChange={e => setCustomEndDate(e.target.value)}
                          className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-[11px] font-medium text-white focus:ring-1 focus:ring-amber-500 outline-none"
                        />
                      </div>
                      <button 
                        onClick={() => setIsTopFilterMenuOpen(false)}
                        className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-[11px] font-black transition"
                      >
                        Apply Filter
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        }
        bottomContent={
          <div className="mt-2 pt-2 border-t border-white/10 flex flex-nowrap w-full overflow-x-auto hide-scrollbar items-center gap-1.5 pb-0 mb-0">
          {allowedTabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabView)}
                className={`px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl text-[11px] sm:text-[11px] font-extrabold transition-all flex flex-1 justify-center items-center gap-1.5 sm:gap-1.5 cursor-pointer shrink-0 ${
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
      
      <div className="px-0.5 sm:px-1 space-y-6">
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
            <div className="grid grid-cols-2 sm:grid-cols-4 2xl:grid-cols-8 gap-2">
              {/* Metric 1 */}
              <div 
                onClick={() => handleOpenMetricDetail({
                  title: 'To Pack Today (Kitchen Queue)',
                  subtitle: 'Orders currently pending or undergoing kitchen packing',
                  icon: ShoppingBag,
                  iconColor: 'text-amber-600 bg-amber-500/10 border-amber-200',
                  badgeText: 'Kitchen Queue',
                  type: 'to_pack',
                  filterValue: 'TO_PACK',
                  description: 'Orders requiring item selection, weight verification, and box sealing in the kitchen.'
                })}
                className="bg-amber-50/80 dark:bg-amber-950/30 border-l-4 border-l-amber-500 border-y border-r border-amber-200 dark:border-amber-800/60 p-2 rounded-xl shadow-xs hover:shadow-md hover:border-amber-400 dark:hover:border-amber-600 transition-all cursor-pointer group flex flex-col justify-between gap-1"
              >
                <div className="flex items-center gap-1.5">
                  <div className="p-1.5 bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-lg group-hover:scale-110 transition-transform shrink-0">
                    <ShoppingBag size={14} />
                  </div>
                  <span className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">TO PACK</span>
                </div>
                <div className="text-right mt-1">
                  <span className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                    {metrics.toPackToday}
                  </span>
                </div>
              </div>
              {/* Metric 2 */}
              <div 
                onClick={() => handleOpenMetricDetail({
                  title: 'Ready for Dispatch (Sealed Boxes)',
                  subtitle: 'Packed orders awaiting route assignment and dispatch',
                  icon: Truck,
                  iconColor: 'text-yellow-600 bg-yellow-500/10 border-yellow-200',
                  badgeText: 'Sealed Boxes',
                  type: 'status',
                  filterValue: 'PACKED',
                  description: 'Orders sealed, box-tagged, and ready at the dispatch counter.'
                })}
                className="bg-yellow-50/80 dark:bg-yellow-950/30 border-l-4 border-l-yellow-500 border-y border-r border-yellow-200 dark:border-yellow-800/60 p-2 rounded-xl shadow-xs hover:shadow-md hover:border-yellow-400 dark:hover:border-yellow-600 transition-all cursor-pointer group flex flex-col justify-between gap-1"
              >
                <div className="flex items-center gap-1.5">
                  <div className="p-1.5 bg-yellow-500/10 dark:bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 rounded-lg group-hover:scale-110 transition-transform shrink-0">
                    <Truck size={14} />
                  </div>
                  <span className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">READY</span>
                </div>
                <div className="text-right mt-1">
                  <span className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                    {metrics.readyForDispatch}
                  </span>
                </div>
              </div>
              {/* Metric 3 */}
              <div 
                onClick={() => handleOpenMetricDetail({
                  title: 'Deliveries Today (In Transit)',
                  subtitle: 'Orders currently out on delivery across Dahisar / Borivali / Kandivali',
                  icon: Clock,
                  iconColor: 'text-indigo-600 bg-indigo-500/10 border-indigo-200',
                  badgeText: 'Out for Delivery',
                  type: 'status',
                  filterValue: 'DISPATCHED',
                  description: 'Orders assigned to drivers and currently in transit to customers.'
                })}
                className="bg-indigo-50/80 dark:bg-indigo-950/30 border-l-4 border-l-indigo-500 border-y border-r border-indigo-200 dark:border-indigo-800/60 p-2 rounded-xl shadow-xs hover:shadow-md hover:border-indigo-400 dark:hover:border-indigo-600 transition-all cursor-pointer group flex flex-col justify-between gap-1"
              >
                <div className="flex items-center gap-1.5">
                  <div className="p-1.5 bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-lg group-hover:scale-110 transition-transform shrink-0">
                    <Clock size={14} />
                  </div>
                  <span className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">IN TRANSIT</span>
                </div>
                <div className="text-right mt-1">
                  <span className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                    {metrics.deliveriesToday}
                  </span>
                </div>
              </div>
              {/* Metric 4 */}
              <div 
                onClick={() => handleOpenMetricDetail({
                  title: 'Overdue & Priority Delay Queue',
                  subtitle: 'Orders past expected fulfillment time requiring fast-track attention',
                  icon: AlertTriangle,
                  iconColor: 'text-rose-600 bg-rose-500/10 border-rose-200',
                  badgeText: 'High Priority',
                  type: 'overdue',
                  description: 'Prioritize these orders to avoid customer delivery delay.'
                })}
                className="bg-rose-50/80 dark:bg-rose-950/30 border-l-4 border-l-rose-500 border-y border-r border-rose-200 dark:border-rose-800/60 p-2 rounded-xl shadow-xs hover:shadow-md hover:border-rose-400 dark:hover:border-rose-600 transition-all cursor-pointer group flex flex-col justify-between gap-1"
              >
                <div className="flex items-center gap-1.5">
                  <div className="p-1.5 bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 rounded-lg group-hover:scale-110 transition-transform shrink-0">
                    <AlertTriangle size={14} />
                  </div>
                  <span className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">OVERDUE</span>
                </div>
                <div className="text-right mt-1">
                  <span className="text-xl font-black text-rose-600 dark:text-rose-400 tracking-tight">
                    {metrics.overdueOrdersCount}
                  </span>
                </div>
              </div>
              {/* Metric 5 */}
              <div 
                onClick={() => handleOpenMetricDetail({
                  title: 'Pending Payments & Uncollected Dues',
                  subtitle: 'Orders with pending balance requiring payment collection',
                  icon: DollarSign,
                  iconColor: 'text-fuchsia-600 bg-fuchsia-500/10 border-fuchsia-200',
                  badgeText: 'Unpaid Receipts',
                  type: 'payment',
                  description: 'View unpaid customer orders. Collect payment or dispatch WhatsApp reminders.'
                })}
                className="bg-fuchsia-50/80 dark:bg-fuchsia-950/30 border-l-4 border-l-fuchsia-500 border-y border-r border-fuchsia-200 dark:border-fuchsia-800/60 p-2 rounded-xl shadow-xs hover:shadow-md hover:border-fuchsia-400 dark:hover:border-fuchsia-600 transition-all cursor-pointer group flex flex-col justify-between gap-1"
              >
                <div className="flex items-center gap-1.5">
                  <div className="p-1.5 bg-fuchsia-500/10 dark:bg-fuchsia-500/20 text-fuchsia-600 dark:text-fuchsia-400 rounded-lg group-hover:scale-110 transition-transform shrink-0">
                    <DollarSign size={14} />
                  </div>
                  <span className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">PAYMENTS</span>
                </div>
                <div className="text-right mt-1">
                  <span className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                    {metrics.pendingPaymentsCount}
                  </span>
                </div>
              </div>
              {/* Metric 6 */}
              <div 
                onClick={() => handleOpenMetricDetail({
                  title: 'All Active Orders Stream',
                  subtitle: 'Complete list of sales orders across all channels',
                  icon: ShoppingBag,
                  iconColor: 'text-sky-600 bg-sky-500/10 border-sky-200',
                  badgeText: 'All Channels',
                  type: 'all',
                  description: 'Master operational view of all active sales transactions.'
                })}
                className="bg-sky-50/80 dark:bg-sky-950/30 border-l-4 border-l-sky-500 border-y border-r border-sky-200 dark:border-sky-800/60 p-2 rounded-xl shadow-xs hover:shadow-md hover:border-sky-400 dark:hover:border-sky-600 transition-all cursor-pointer group flex flex-col justify-between gap-1"
              >
                <div className="flex items-center gap-1.5">
                  <div className="p-1.5 bg-sky-500/10 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400 rounded-lg group-hover:scale-110 transition-transform shrink-0">
                    <ShoppingBag size={14} />
                  </div>
                  <span className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">TOTAL</span>
                </div>
                <div className="text-right mt-1">
                  <span className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                    {metrics.totalOrdersCount}
                  </span>
                </div>
              </div>
              {/* Metric 7 */}
              {showFinancials ? (
                <div 
                  onClick={() => handleOpenMetricDetail({
                    title: 'Sales & Revenue Ledger',
                    subtitle: 'Gross revenue breakdown across completed and active orders',
                    icon: TrendingUp,
                    iconColor: 'text-emerald-600 bg-emerald-500/10 border-emerald-200',
                    badgeText: '+14.2% Growth',
                    type: 'revenue',
                    description: 'Financial ledger summarizing completed sales and collected revenue.'
                  })}
                  className="bg-emerald-50/80 dark:bg-emerald-950/30 border-l-4 border-l-emerald-500 border-y border-r border-emerald-200 dark:border-emerald-800/60 p-2 rounded-xl shadow-xs hover:shadow-md hover:border-emerald-400 dark:hover:border-emerald-600 transition-all cursor-pointer group flex flex-col justify-between gap-1"
                >
                  <div className="flex items-center gap-1.5">
                    <div className="p-1.5 bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-lg group-hover:scale-110 transition-transform shrink-0">
                      <TrendingUp size={14} />
                    </div>
                    <span className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">REVENUE</span>
                  </div>
                  <div className="text-right mt-1">
                    <span className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                      ₹{metrics.todaySalesAmount.toLocaleString()}
                    </span>
                  </div>
                </div>
              ) : (
                <div 
                  onClick={() => handleOpenMetricDetail({
                    title: 'Low Stock Replenishment Alert',
                    subtitle: 'Kitchen raw material & packaging stock running low',
                    icon: Boxes,
                    iconColor: 'text-purple-600 bg-purple-500/10 border-purple-200',
                    badgeText: 'Low Stock',
                    type: 'low_stock',
                    description: 'Items requiring restock or supplier re-orders.'
                  })}
                  className="bg-purple-50/80 dark:bg-purple-950/30 border-l-4 border-l-purple-500 border-y border-r border-purple-200 dark:border-purple-800/60 p-2 rounded-xl shadow-xs hover:shadow-md hover:border-purple-400 dark:hover:border-purple-600 transition-all cursor-pointer group flex flex-col justify-between gap-1"
                >
                  <div className="flex items-center gap-1.5">
                    <div className="p-1.5 bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 rounded-lg group-hover:scale-110 transition-transform shrink-0">
                      <Boxes size={14} />
                    </div>
                    <span className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">LOW STOCK</span>
                  </div>
                  <div className="text-right mt-1">
                    <span className="text-xl font-black text-purple-600 dark:text-purple-400 tracking-tight">
                      {lowStockCount}
                    </span>
                  </div>
                </div>
              )}

              {/* Metric 8 */}
              {showFinancials ? (
                <div 
                  onClick={() => handleOpenMetricDetail({
                    title: 'Outstanding Accounts Receivable',
                    subtitle: 'Customer receivables pending payment settlement',
                    icon: Clock,
                    iconColor: 'text-teal-600 bg-teal-500/10 border-teal-200',
                    badgeText: 'Receivables',
                    type: 'receivables',
                    description: 'Track outstanding balances and send instant payment follow-up alerts.'
                  })}
                  className="bg-teal-50/80 dark:bg-teal-950/30 border-l-4 border-l-teal-500 border-y border-r border-teal-200 dark:border-teal-800/60 p-2 rounded-xl shadow-xs hover:shadow-md hover:border-teal-400 dark:hover:border-teal-600 transition-all cursor-pointer group flex flex-col justify-between gap-1"
                >
                  <div className="flex items-center gap-1.5">
                    <div className="p-1.5 bg-teal-500/10 dark:bg-teal-500/20 text-teal-600 dark:text-teal-400 rounded-lg group-hover:scale-110 transition-transform shrink-0">
                      <Clock size={14} />
                    </div>
                    <span className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">OUTSTANDING</span>
                  </div>
                  <div className="text-right mt-1">
                    <span className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                      ₹{metrics.outstandingAmount.toLocaleString()}
                    </span>
                  </div>
                </div>
              ) : (
                <div 
                  onClick={() => handleOpenMetricDetail({
                    title: 'Out of Stock Critical Alert',
                    subtitle: 'Products with zero stock level requiring immediate replenishment',
                    icon: AlertTriangle,
                    iconColor: 'text-red-600 bg-red-500/10 border-red-200',
                    badgeText: 'Zero Stock',
                    type: 'out_of_stock',
                    description: 'Zero stock SKUs requiring kitchen cooking or purchasing.'
                  })}
                  className="bg-red-50/80 dark:bg-red-950/30 border-l-4 border-l-red-500 border-y border-r border-red-200 dark:border-red-800/60 p-2 rounded-xl shadow-xs hover:shadow-md hover:border-red-400 dark:hover:border-red-600 transition-all cursor-pointer group flex flex-col justify-between gap-1"
                >
                  <div className="flex items-center gap-1.5">
                    <div className="p-1.5 bg-red-500/10 dark:bg-red-500/20 text-red-600 dark:text-red-400 rounded-lg group-hover:scale-110 transition-transform shrink-0">
                      <AlertTriangle size={14} />
                    </div>
                    <span className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">ZERO STOCK</span>
                  </div>
                  <div className="text-right mt-1">
                    <span className="text-xl font-black text-red-600 dark:text-red-400 tracking-tight">
                      {outOfStockCount}
                    </span>
                  </div>
                </div>
              )}
            </div>



          
            {/* Operational Order Pipeline & Active Orders by Area */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-6">
                            {/* Pipeline */}
              <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 border border-slate-700 rounded-3xl p-6 shadow-xl text-white">
                <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-500/10 blur-3xl rounded-full translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>
                
                <div className="relative z-10 flex items-center justify-between pb-4 border-b border-slate-700/80 mb-5">
                  <h2 className="text-sm font-black text-white flex items-center gap-2 tracking-wide uppercase">
                    <Activity size={18} className="text-amber-400" /> Operational Order Pipeline
                  </h2>
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span className="text-[10px] font-bold text-amber-400 bg-amber-400/10 px-2.5 py-0.5 rounded-full border border-amber-400/20 uppercase tracking-wider shadow-[0_0_10px_rgba(251,191,36,0.2)]">
                      Command Center
                    </span>
                  </div>
                </div>
                
                <div className="relative z-10 flex flex-col gap-1.5">
                  {[
                    { id: 1, label: 'Booking Received', count: metrics.statusPipeline.bookingReceived, color: 'bg-slate-800', textColor: 'text-amber-400', progressColor: 'bg-amber-400', glow: 'shadow-[0_0_12px_rgba(251,191,36,0.4)]' },
                    { id: 2, label: 'Production Started', count: metrics.statusPipeline.productionStarted, color: 'bg-amber-950', textColor: 'text-amber-400', progressColor: 'bg-amber-400', glow: 'shadow-[0_0_12px_rgba(251,191,36,0.4)]' },
                    { id: 3, label: 'Packing Started', count: metrics.statusPipeline.packingStarted, color: 'bg-amber-950', textColor: 'text-amber-400', progressColor: 'bg-amber-400', glow: 'shadow-[0_0_12px_rgba(251,191,36,0.4)]' },
                    { id: 4, label: 'Packing Completed', count: metrics.statusPipeline.packingCompleted, color: 'bg-amber-950', textColor: 'text-amber-400', progressColor: 'bg-amber-400', glow: 'shadow-[0_0_12px_rgba(251,191,36,0.4)]' },
                    { id: 5, label: 'Ready for Dispatch', count: metrics.statusPipeline.readyForDispatch, color: 'bg-amber-950', textColor: 'text-amber-400', progressColor: 'bg-amber-400', glow: 'shadow-[0_0_12px_rgba(251,191,36,0.4)]' },
                    { id: 6, label: 'Out for Delivery', count: metrics.statusPipeline.outForDelivery, color: 'bg-indigo-950', textColor: 'text-indigo-400', progressColor: 'bg-indigo-400', glow: 'shadow-[0_0_12px_rgba(129,140,248,0.4)]' },
                    { id: 7, label: 'Delivered', count: metrics.statusPipeline.delivered, color: 'bg-emerald-950', textColor: 'text-emerald-400', progressColor: 'bg-emerald-400', glow: 'shadow-[0_0_12px_rgba(52,211,153,0.4)]' }
                  ].map((step, idx, arr) => (
                    <div key={step.id} className="relative group z-10">
                      {idx !== arr.length - 1 && (
                        <div className="absolute left-[19px] top-[32px] bottom-[-6px] w-[2px] bg-slate-700/50 -z-10"></div>
                      )}
                      <div className="relative z-10 flex items-center gap-4 p-2 rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/10">
                        <div className={`w-6 h-6 shrink-0 rounded-full flex items-center justify-center text-[10px] font-black ${step.color} ${step.textColor} ${step.count > 0 ? step.glow + ' ring-1 ring-' + step.progressColor.split('-')[1] + '-500/50' : 'ring-1 ring-white/10'}`}>
                          {step.id}
                        </div>
                        <span className={`text-[11px] font-bold flex-1 tracking-wide ${step.count > 0 ? 'text-white' : 'text-slate-400'}`}>{step.label}</span>
                        <div className="hidden sm:block w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden shadow-inner ring-1 ring-white/5">
                          <div className={`h-full ${step.progressColor} rounded-full transition-all duration-1000 ${step.count > 0 ? step.glow : ''}`} style={{ width: step.count > 0 ? '100%' : '0%' }}></div>
                        </div>
                        <div className={`w-10 text-center bg-slate-800/80 px-2 py-1 rounded-md border border-slate-700/50 shadow-inner`}>
                          <span className={`text-[11px] font-black ${step.count > 0 ? step.textColor : 'text-slate-500'}`}>{step.count}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

{/* Active Orders by Area */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
                  <h2 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <MapPin size={18} className="text-amber-500" /> Active Orders by Area
                  </h2>
                  <span className="text-[10px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-full">
                    {metrics.activeOrdersByArea.length} Zones
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {metrics.activeOrdersByArea.map((area, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                        <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">{area.area}</span>
                      </div>
                      <span className="text-[11px] font-black text-slate-900 dark:text-white bg-white dark:bg-slate-900 px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700 shadow-xs">
                        {area.count} orders
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Operational Shortcuts */}
            <div className="mt-6 bg-gradient-to-r from-slate-900 to-slate-800 dark:from-slate-950 dark:to-slate-900 rounded-3xl p-6 shadow-md relative overflow-hidden border border-slate-800">
              <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2"></div>
              
              <div className="flex items-center justify-between mb-4 relative z-10">
                <h2 className="text-sm font-extrabold text-amber-500 flex items-center gap-1.5">
                  <Zap size={16} /> Quick Operational Shortcuts
                </h2>
                <span className="text-[10px] font-bold text-slate-900 bg-amber-500/20 text-amber-500 px-2.5 py-0.5 rounded-full border border-amber-500/30">
                  Express
                </span>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 relative z-10">
                <button 
                  onClick={handleOpenNewOrderModal}
                  className="flex flex-col gap-1 text-left p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition group cursor-pointer"
                >
                  <PlusCircle size={16} className="text-amber-400 mb-1 group-hover:scale-110 transition-transform" />
                  <span className="text-[11px] font-bold text-white">New Order</span>
                  <span className="text-[10px] text-slate-400">नवीन ऑर्डर</span>
                </button>
                <button 
                  onClick={() => handleOpenMetricDetail({
                    title: 'To Pack Today (Kitchen Queue)',
                    subtitle: 'Orders currently pending or undergoing kitchen packing',
                    icon: ShoppingBag,
                    iconColor: 'text-amber-600 bg-amber-500/10 border-amber-200',
                    badgeText: 'Kitchen Queue',
                    type: 'to_pack',
                    filterValue: 'TO_PACK',
                    description: 'Orders requiring item selection, weight verification, and box sealing in the kitchen.'
                  })}
                  className="flex flex-col gap-1 text-left p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition group cursor-pointer"
                >
                  <Boxes size={16} className="text-amber-400 mb-1 group-hover:scale-110 transition-transform" />
                  <span className="text-[11px] font-bold text-white">Production</span>
                  <span className="text-[10px] text-slate-400">उत्पादन पॅकिंग</span>
                </button>
                <button 
                  onClick={() => handleOpenMetricDetail({
                    title: 'Ready for Dispatch & Delivery Queue',
                    subtitle: 'Packed orders awaiting route assignment and dispatch',
                    icon: Truck,
                    iconColor: 'text-yellow-600 bg-yellow-500/10 border-yellow-200',
                    badgeText: 'Dispatch Queue',
                    type: 'status',
                    filterValue: 'PACKED',
                    description: 'Orders sealed, box-tagged, and ready for route assignment.'
                  })}
                  className="flex flex-col gap-1 text-left p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition group cursor-pointer"
                >
                  <Truck size={16} className="text-indigo-400 mb-1 group-hover:scale-110 transition-transform" />
                  <span className="text-[11px] font-bold text-white">Dispatch</span>
                  <span className="text-[10px] text-slate-400">डिलिव्हरी</span>
                </button>
                <button 
                  onClick={() => handleOpenMetricDetail({
                    title: 'Pending Payments & Uncollected Dues',
                    subtitle: 'Orders with pending balance requiring payment collection',
                    icon: DollarSign,
                    iconColor: 'text-amber-600 bg-amber-500/10 border-amber-200',
                    badgeText: 'Unpaid Receipts',
                    type: 'payment',
                    description: 'View unpaid customer orders. Collect payment or dispatch WhatsApp reminders.'
                  })}
                  className="flex flex-col gap-1 text-left p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition group cursor-pointer"
                >
                  <DollarSign size={16} className="text-emerald-400 mb-1 group-hover:scale-110 transition-transform" />
                  <span className="text-[11px] font-bold text-white">Collect</span>
                  <span className="text-[10px] text-slate-400">पेमेंट जमा</span>
                </button>
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
                    <h2 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
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
                  <h2 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
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
                      <div className="flex items-center gap-1.5">
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
                        <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white flex items-center gap-1.5.5">
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
                  <h2 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
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
                    className="w-full mt-2 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[11px] font-extrabold shadow-md transition cursor-pointer flex items-center justify-center gap-1.5"
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
                  <h2 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Boxes size={18} className="text-amber-500" /> Kitchen Raw Material & Goods Stock
                  </h2>
                  <span className="text-[11px] font-bold text-slate-500">Inventory Status</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div 
                    onClick={() => handleOpenMetricDetail({
                      title: 'Low Stock Replenishment Alert',
                      subtitle: 'Kitchen goods and packaging items at or below reorder threshold',
                      icon: Boxes,
                      iconColor: 'text-amber-600 bg-amber-500/10 border-amber-200',
                      badgeText: 'Reorder Queue',
                      type: 'low_stock',
                      description: 'Items requiring raw material procurement or kitchen re-stocking.'
                    })}
                    className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-2xl border border-amber-200/60 dark:border-amber-800/50 cursor-pointer hover:border-amber-400 transition"
                  >
                    <span className="text-[11px] font-bold text-amber-800 dark:text-amber-300 block">Low Stock Alert</span>
                    <span className="text-xl font-black text-amber-600 dark:text-amber-400">{metrics.lowStock} Items</span>
                    <p className="text-[10px] text-amber-700/80 dark:text-amber-400/80 mt-1">Requires reorder from supplier</p>
                  </div>

                  <div 
                    onClick={() => handleOpenMetricDetail({
                      title: 'Out of Stock Emergency Alert',
                      subtitle: 'Products with 0 remaining inventory',
                      icon: AlertTriangle,
                      iconColor: 'text-rose-600 bg-rose-500/10 border-rose-200',
                      badgeText: 'Out of Stock',
                      type: 'out_of_stock',
                      description: 'Depleted product lines. Restock stock count to resume online sales.'
                    })}
                    className="p-4 bg-rose-50 dark:bg-rose-950/30 rounded-2xl border border-rose-200/60 dark:border-rose-800/50 cursor-pointer hover:border-rose-400 transition"
                  >
                    <span className="text-[11px] font-bold text-rose-800 dark:text-rose-300 block">Out of Stock</span>
                    <span className="text-xl font-black text-rose-600 dark:text-rose-400">{metrics.outOfStock} Items</span>
                    <p className="text-[10px] text-rose-700/80 dark:text-rose-400/80 mt-1">Halt online bookings</p>
                  </div>

                  <div 
                    onClick={() => handleOpenMetricDetail({
                      title: 'Kitchen Master Inventory',
                      subtitle: 'Full list of kitchen items and raw materials',
                      icon: ClipboardList,
                      iconColor: 'text-indigo-600 bg-indigo-500/10 border-indigo-200',
                      badgeText: 'Kitchen List',
                      type: 'kitchen',
                      description: 'Comprehensive list of all kitchen SKUs including loose products and combos.'
                    })}
                    className="p-4 bg-indigo-50 dark:bg-indigo-950/30 rounded-2xl border border-indigo-200/60 dark:border-indigo-800/50 cursor-pointer hover:border-indigo-400 transition"
                  >
                    <span className="text-[11px] font-bold text-indigo-800 dark:text-indigo-300 block">Kitchen Catalog</span>
                    <span className="text-xl font-black text-indigo-600 dark:text-indigo-400">{products.length} Items</span>
                    <p className="text-[10px] text-indigo-700/80 dark:text-indigo-400/80 mt-1">View all production goods</p>
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
                  <button 
                    onClick={() => handleOpenMetricDetail({
                      title: 'Low Stock Replenishment Alert',
                      subtitle: 'Kitchen goods and packaging items at or below reorder threshold',
                      icon: Boxes,
                      iconColor: 'text-amber-600 bg-amber-500/10 border-amber-200',
                      badgeText: 'Reorder Queue',
                      type: 'low_stock',
                      description: 'Items requiring raw material procurement or kitchen re-stocking.'
                    })}
                    className="text-[11px] font-bold text-amber-600 hover:text-amber-700 transition"
                  >
                    View Full List →
                  </button>
                </div>

                <div className="space-y-3">
                  {products
                    .filter(p => (p.current_stock ?? 0) <= lowStockThreshold)
                    .sort((a, b) => (a.current_stock ?? 0) - (b.current_stock ?? 0))
                    .slice(0, 5)
                    .map(p => (
                      <div key={p.id} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                        <div>
                          <strong className="text-[11px] font-bold block text-slate-800 dark:text-slate-200">{p.name}</strong>
                          <span className="text-[10px] text-slate-400">SKU: {p.sku}</span>
                        </div>
                        <div className="text-right">
                          <span className={`text-[11px] font-extrabold px-2.5 py-1 rounded-full ${
                            (p.current_stock ?? 0) === 0 
                              ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200' 
                              : 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200'
                          }`}>
                            {p.current_stock} {p.unit} left
                          </span>
                        </div>
                      </div>
                    ))}
                  {products.filter(p => (p.current_stock ?? 0) <= (p.minimum_stock || 10)).length === 0 && (
                    <div className="text-center py-4">
                      <p className="text-[11px] text-slate-400 italic font-medium">All stocks are optimal! No reorders needed.</p>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </motion.div>
        )}

      </AnimatePresence>

      {/* 3. RECENT ORDERS TABLE & BATCH ACTIONS LEDGER */}
      <div id="orders-ledger-table" className="space-y-5 scroll-mt-6">
        
        {/* Active Filter Indicator Banner */}
        {(statusFilter !== 'ALL' || areaFilter !== 'ALL' || searchQuery || timeHorizon !== 'all') && (
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 rounded-2xl flex items-center justify-between text-[11px] font-bold animate-in fade-in">
            <div className="flex items-center gap-1.5 flex-wrap">
              <Filter size={14} className="text-amber-600 shrink-0" />
              <span>Active Filters:</span>
              {timeHorizon !== 'all' && (
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black">
                  Period: {horizonLabel}
                </span>
              )}
              {statusFilter !== 'ALL' && (
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black">
                  Status: {statusFilter}
                </span>
              )}
              {areaFilter !== 'ALL' && (
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black">
                  Area: {areaFilter}
                </span>
              )}
              {searchQuery && (
                <span className="px-2.5 py-0.5 rounded-full bg-slate-900 text-white text-[10px] font-bold">
                  Search: "{searchQuery}"
                </span>
              )}
              <span className="text-slate-500 font-normal">({filteredOrders.length} orders found)</span>
            </div>

            <button 
              onClick={() => {
                setTimeHorizon('all');
                setCustomStartDate('');
                setCustomEndDate('');
                setStatusFilter('ALL');
                setAreaFilter('ALL');
                setSearchQuery('');
              }}
              className="px-2.5 py-1 bg-amber-500 text-slate-950 hover:bg-amber-400 rounded-xl text-[10px] font-extrabold transition cursor-pointer flex items-center gap-1 shrink-0"
            >
              <X size={12} /> Reset Filters
            </button>
          </div>
        )}

        {/* Table Controls */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
          {/* Top Row: Title & Status Pills */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="shrink-0">
              <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                Orders Ledger & Dispatch Log
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">Live transaction stream with instant status updates & printing</p>
            </div>

            {/* Status Pills */}
            <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl text-[11px] font-bold overflow-x-auto border border-slate-200/50 dark:border-slate-700/50 hide-scrollbar max-w-full">
              {['ALL', 'TO_PACK', 'PENDING', 'PACKING', 'PACKED', 'DISPATCHED', 'DELIVERED'].map((st) => (
                <button 
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap flex-1 sm:flex-none ${
                    statusFilter === st 
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs border border-slate-200/80 dark:border-slate-600' 
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 border border-transparent'
                  }`}
                >
                  {st === 'TO_PACK' ? 'TO PACK TODAY' : st}
                </button>
              ))}
            </div>
          </div>

          {/* Bottom Row: Search, Area Filter, and Date Filter */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800/60">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search order #, customer, area..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-8 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-[11px] font-medium focus:outline-none focus:ring-1 focus:ring-amber-500 w-full"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <X size={12} />
                </button>
              )}
            </div>

            <div className="flex items-center gap-3 shrink-0">
              {/* Area Filter Dropdown */}
              <select 
                value={areaFilter}
                onChange={(e) => setAreaFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-[11px] font-bold focus:outline-none focus:ring-1 focus:ring-amber-500 text-slate-700 dark:text-slate-200 cursor-pointer min-w-[150px]"
              >
                <option value="ALL">All Areas (सर्व भाग)</option>
                {(() => {
                  const bObj = dbStore.getBusiness(businessId);
                  const zones = bObj?.area_zones && bObj.area_zones.length > 0 
                    ? bObj.area_zones 
                    : ['Dahisar', 'Borivali', 'Kandivali', 'Mira Road', 'Vasai', 'Virar', 'Malad', 'Goregaon', 'Andheri'];
                  return zones.map(z => (
                    <option key={z} value={z}>{z}</option>
                  ));
                })()}
              </select>

              {/* Time Filter Dropdown */}
              <div className="relative shrink-0" ref={chartFilterRef}>
                <button 
                  onClick={() => setIsFilterMenuOpen(!isFilterMenuOpen)}
                  className="w-9 h-9 flex items-center justify-center bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500 text-slate-700 dark:text-slate-200 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  title="Filter by Time"
                >
                  <Filter size={16} className="text-amber-500" />
                </button>
                
                {isFilterMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                  <div className="p-2 space-y-1">
                    {['today', 'yesterday', '7days', '30days', 'all', 'custom'].map((horizon) => (
                      <button
                        key={horizon}
                        onClick={() => {
                          setTimeHorizon(horizon as TimeHorizon);
                          if (horizon !== 'custom') setIsFilterMenuOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-xl text-[11px] font-bold transition flex items-center justify-between ${
                          timeHorizon === horizon 
                            ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400' 
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        {horizon === 'today' ? 'Today' :
                         horizon === 'yesterday' ? 'Yesterday' :
                         horizon === '7days' ? 'Last 7 Days' :
                         horizon === '30days' ? 'Last 30 Days' :
                         horizon === 'custom' ? 'Custom Date' : 'All Time'}
                        {timeHorizon === horizon && <CheckCircle2 size={14} className="text-amber-500" />}
                      </button>
                    ))}
                  </div>
                  
                  {timeHorizon === 'custom' && (
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 space-y-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500">Start Date</label>
                        <input 
                          type="date"
                          value={customStartDate}
                          onChange={e => setCustomStartDate(e.target.value)}
                          className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] font-medium focus:ring-1 focus:ring-amber-500 outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500">End Date</label>
                        <input 
                          type="date"
                          value={customEndDate}
                          onChange={e => setCustomEndDate(e.target.value)}
                          className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] font-medium focus:ring-1 focus:ring-amber-500 outline-none"
                        />
                      </div>
                      <button 
                        onClick={() => setIsFilterMenuOpen(false)}
                        className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-[11px] font-black transition"
                      >
                        Apply Filter
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

        {/* Selected Items Batch Control Floating Banner */}
        {selectedOrderIds.length > 0 && (
          <div className="p-3 bg-amber-500 text-slate-950 rounded-2xl font-bold text-[11px] flex flex-wrap items-center justify-between gap-3 shadow-lg animate-in fade-in slide-in-from-top-2">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 size={18} /> {selectedOrderIds.length} orders selected for batch processing
            </span>

            <div className="flex items-center gap-1.5">
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
        <div className="bg-white dark:bg-slate-900 overflow-x-auto rounded-3xl border border-black dark:border-white shadow-sm mt-5">
          <table className="w-full text-left text-[11px]">
            <thead className="bg-slate-700 dark:bg-slate-600 text-white font-bold uppercase tracking-wider border-b border-black dark:border-white">
              <tr>
                <th className="py-2.5 px-4 w-10">
                  <input 
                    type="checkbox" 
                    onChange={handleSelectAll}
                    checked={selectedOrderIds.length > 0 && selectedOrderIds.length === filteredOrders.length}
                    className="rounded border-slate-300 text-amber-500 focus:ring-amber-500 cursor-pointer transition-colors"
                  />
                </th>
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
                    <td className="py-2.5 px-4">
                      <input 
                        type="checkbox" 
                        checked={isSelected}
                        onChange={() => handleToggleSelectOrder(o.id)}
                        className="rounded border-slate-300 text-amber-500 focus:ring-amber-500 cursor-pointer transition-colors"
                      />
                    </td>

                    <td className="py-2.5 px-4 font-black text-slate-900 dark:text-white">
                      <div className="flex items-center gap-2">
                        <span>{o.order_number}</span>
                        {o.advance_booking && (
                          <span className="px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 text-[9px] font-extrabold border border-amber-200/80 dark:border-amber-800/60">
                            Advance
                          </span>
                        )}
                        {o.is_updated && (
                          <span className="px-1.5 py-0.5 rounded bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-400 text-[9px] font-extrabold border border-sky-200/80 dark:border-sky-800/60">
                            Updated
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
                      ₹{o.total_amount.toLocaleString()}
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
                        {/* View Tax Invoice button */}
                        <button 
                          onClick={() => setViewingInvoiceOrder(o)}
                          className="p-1.5 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-lg transition cursor-pointer"
                          title="View & Print Tax Invoice"
                        >
                          <FileText size={15} />
                        </button>

                        {/* Notify button */}
                        <button 
                          onClick={() => {
                            setSelectedOrderForNotify(o);
                          }}
                          className="p-1.5 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-lg transition cursor-pointer"
                          title="Send Customer Tracking via WhatsApp"
                        >
                          <Send size={15} />
                        </button>

                        {/* View Receipt Detail */}
                        <button 
                          onClick={() => setSelectedOrderForDetail(o)}
                          className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg transition cursor-pointer"
                          title="View Specifications & Actions"
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
                    <div className="flex flex-col items-center justify-center gap-1.5">
                      <ShoppingBag size={28} className="text-slate-300 dark:text-slate-600" />
                      <p className="font-bold text-slate-600 dark:text-slate-300 text-xs">
                        No orders found for {horizonLabel}.
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
      </div>

      {/* ================= MODAL 1: EXECUTIVE METRIC DRILL-DOWN MODAL ================= */}
      {activeMetricModal && (
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setActiveMetricModal(null);
              setModalSearch('');
            }
          }}
          className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150"
        >
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-2xl border ${activeMetricModal.iconColor} flex items-center justify-center`}>
                  <activeMetricModal.icon size={22} />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-base font-black text-slate-900 dark:text-white">
                      {activeMetricModal.title}
                    </h3>
                    <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                      {activeMetricModal.badgeText}
                    </span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => { setActiveMetricModal(null); setModalSearch(''); }}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-full bg-slate-100 dark:bg-slate-800 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Description & Search Bar */}
            <div className="p-4 bg-slate-50/80 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-end gap-3">
              <div className="relative w-full sm:w-64 shrink-0">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text"
                  placeholder="Search items in view..."
                  value={modalSearch}
                  onChange={(e) => setModalSearch(e.target.value)}
                  className="w-full pl-8 pr-8 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-[11px] font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                {modalSearch && (
                  <button onClick={() => setModalSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400">
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>

            {/* Content Area - Scrollable */}
            <div className="p-5 overflow-y-auto flex-1 space-y-4">
              
              {/* If Products Modal */}
              {modalItems.products.length > 0 && (
                <div className="overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-slate-800">
                  <table className="w-full text-left text-[11px]">
                    <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 font-bold uppercase border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="py-3 px-4">Product Name</th>
                        <th className="py-3 px-4">Category</th>
                        <th className="py-3 px-4">SKU</th>
                        <th className="py-3 px-4">Current Stock</th>
                        <th className="py-3 px-4">Min Alert Threshold</th>
                        <th className="py-3 px-4">Selling Price</th>
                        <th className="py-3 px-4 text-right">Quick Restock</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {modalItems.products.map(p => {
                        const cat = dbStore.getCategories(businessId).find(c => c.id === p.category_id);
                        return (
                          <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                            <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">{p.name}</td>
                            <td className="py-3.5 px-4 font-medium text-slate-500">{cat?.name || 'General'}</td>
                            <td className="py-3.5 px-4 font-mono text-slate-500">{p.sku}</td>
                          <td className="py-3.5 px-4 font-black">
                            <span className={`px-2.5 py-1 rounded-full border ${
                              (p.current_stock ?? 0) === 0
                                ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200'
                                : (p.current_stock ?? 0) <= lowStockThreshold
                                  ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200'
                                  : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200'
                            }`}>
                              {p.current_stock ?? 0} {p.unit}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 font-medium">{p.minimum_stock || 10} {p.unit}</td>
                          <td className="py-3.5 px-4 font-bold text-slate-800 dark:text-slate-200">₹{p.selling_price}</td>
                          <td className="py-3.5 px-4 text-right">
                            <button 
                              onClick={() => handleRestockProduct(p.id, 10)}
                              className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold rounded-lg text-[10px] transition cursor-pointer"
                            >
                              + Add 10 Units
                            </button>
                          </td>
                        </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* If Orders Modal */}
              {modalItems.orders.length > 0 && (
                <div className="overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-slate-800">
                  <table className="w-full text-left text-[11px]">
                    <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 font-bold uppercase border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="py-3 px-4">Order #</th>
                        <th className="py-3 px-4">Customer & Area</th>
                        <th className="py-3 px-4">Items Summary</th>
                        <th className="py-3 px-4">Amount</th>
                        <th className="py-3 px-4">Payment</th>
                        <th className="py-3 px-4">Pipeline Status</th>
                        <th className="py-3 px-4 text-right">Quick Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {modalItems.orders.map(o => {
                        const cust = customers.find(c => c.id === o.customer_id);
                        const custName = o.customer_name || (cust ? cust.name : 'Walk-in Customer');
                        
                        return (
                          <tr 
                            key={o.id} 
                            onClick={() => setSelectedOrderForDetail(o)}
                            className="hover:bg-amber-50/50 dark:hover:bg-slate-800/60 cursor-pointer transition"
                          >
                            <td className="py-3.5 px-4 font-black text-slate-900 dark:text-white">
                              {o.order_number}
                              <span className="block text-[10px] text-slate-400 font-normal">{formatOrderTime(o.time, o.created_at)}</span>
                            </td>

                            <td className="py-3.5 px-4">
                              <strong className="text-slate-800 dark:text-slate-200 block font-bold">{custName}</strong>
                              <span className="inline-flex items-center gap-1 text-[10px] text-slate-500">
                                <MapPin size={10} className="text-amber-500" /> {o.area || 'Dahisar'}
                              </span>
                            </td>

                            <td className="py-3.5 px-4 max-w-[180px]">
                              <div className="truncate text-slate-600 dark:text-slate-400 text-[10px]">
                                {(o.items || []).map(it => {
                                  const pObj = products.find(p => p.id === it.product_id);
                                  return `${pObj ? pObj.name : 'Item'} (${it.qty})`;
                                }).join(', ') || 'Faral Combo Box'}
                              </div>
                            </td>

                            <td className="py-3.5 px-4 font-black text-slate-900 dark:text-white">
                              ₹{o.total_amount.toLocaleString()}
                            </td>

                            <td className="py-3.5 px-4">
                              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                                o.payment_status === 'Paid'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-rose-50 text-rose-700 border-rose-200'
                              }`}>
                                {o.payment_status}
                              </span>
                            </td>

                            <td className="py-3.5 px-4">
                              <span className={`inline-flex items-center text-[10px] font-extrabold px-2.5 py-1 rounded-full border ${
                                o.status === 'Delivered' ? 'bg-emerald-50 text-emerald-700 border-emerald-300' :
                                o.status === 'Dispatched' ? 'bg-indigo-50 text-indigo-700 border-indigo-300' :
                                o.status === 'Packed' ? 'bg-yellow-50 text-amber-800 border-yellow-300' :
                                o.status === 'Packing' ? 'bg-amber-50 text-amber-800 border-amber-300' :
                                'bg-slate-100 text-slate-700 border-slate-300'
                              }`}>
                                {o.status}
                              </span>
                            </td>

                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedOrderForNotify(o);
                                  }}
                                  className="p-1.5 hover:bg-amber-100 dark:hover:bg-amber-950/50 text-amber-600 rounded-lg transition"
                                  title="Send WhatsApp Alert"
                                >
                                  <Send size={14} />
                                </button>
                                {o.payment_status !== 'Paid' && (
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedOrderForPayment(o);
                                      setIsPaymentModalOpen(true);
                                    }}
                                    className="px-2 py-1 bg-emerald-600 text-white rounded-lg text-[10px] font-bold hover:bg-emerald-500 transition"
                                  >
                                    Collect ₹
                                  </button>
                                )}
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setViewingInvoiceOrder(o);
                                  }}
                                  className="px-2 py-1 bg-amber-500/10 hover:bg-amber-500 text-amber-700 hover:text-slate-950 border border-amber-500/20 rounded-lg transition cursor-pointer font-bold flex items-center gap-1 text-[10px]"
                                  title="Preview & Print Tax Invoice"
                                >
                                  <Printer size={13} />
                                  <span>Print Bill</span>
                                </button>
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedOrderForDetail(o);
                                  }}
                                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg transition"
                                  title="View Order Details"
                                >
                                  <ChevronRight size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Empty State */}
              {modalItems.orders.length === 0 && modalItems.products.length === 0 && (
                <div className="py-12 text-center space-y-2">
                  <CheckCircle2 size={36} className="mx-auto text-emerald-500/80" />
                  <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-200">No items matching this metric filter</h4>
                  <p className="text-[11px] text-slate-500">All orders in this queue are up to date.</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <span className="text-[11px] font-bold text-slate-500">
                Showing {modalItems.orders.length || modalItems.products.length} entries
              </span>

              <div className="flex items-center gap-1.5">
                <button 
                  onClick={() => { setActiveMetricModal(null); setModalSearch(''); }}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-[11px] font-bold transition cursor-pointer"
                >
                  Close Window
                </button>
                
                {activeMetricModal.filterValue && (
                  <button 
                    onClick={() => scrollToLedger(activeMetricModal.filterValue, activeMetricModal.type === 'area' ? activeMetricModal.filterValue : undefined)}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-[11px] font-black transition shadow-md cursor-pointer flex items-center gap-1.5"
                  >
                    <span>View in Full Ledger ↓</span>
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ================= MODAL 2: ORDER SPECIFICATIONS & RECEIPT ================= */}
      {selectedOrderForDetail && (
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedOrderForDetail(null);
          }}
          className="fixed inset-0 z-[70] bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
        >
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg max-h-[92vh] overflow-y-auto p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150 custom-scrollbar">
            
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
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-full bg-slate-100 dark:bg-slate-800 cursor-pointer"
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
                  <span className="text-[11px] font-bold text-amber-600 block">Time: {formatOrderTime(selectedOrderForDetail.time, selectedOrderForDetail.created_at)}</span>
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

            {/* Vertically stacked action buttons matching invoice specifications */}
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
                onClick={() => handleSavePDFInvoice(selectedOrderForDetail)}
                className="w-full py-3.5 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white rounded-2xl font-black text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-md"
                title="Save & Download Tax Invoice PDF"
              >
                <Download size={16} /> Save PDF
              </button>
              {canCollectPayment && (
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
              )}

              {(canEditOrder || canDeleteOrder) && (
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100 dark:border-slate-800 mt-2">
                  {canEditOrder ? (
                    <button
                      onClick={() => {
                        if (selectedOrderForDetail.delivery_status === 'Delivered') {
                          triggerToast('Cannot edit an order that is already delivered.', 'error');
                          return;
                        }
                        setInvoiceToEdit(selectedOrderForDetail);
                        setSelectedOrderForDetail(null);
                      }}
                      className={`w-full py-3 rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5 ${selectedOrderForDetail.delivery_status === 'Delivered' ? 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500 cursor-not-allowed' : 'bg-sky-100 hover:bg-sky-200 text-sky-700 dark:bg-sky-900/40 dark:hover:bg-sky-900/60 dark:text-sky-300 cursor-pointer'}`}
                    >
                      <Edit size={14} /> Edit / Update
                    </button>
                  ) : <div />}
                  
                  {canDeleteOrder ? (
                    <button
                      onClick={() => {
                        setInvoiceToDelete(selectedOrderForDetail);
                        setSelectedOrderForDetail(null);
                      }}
                      className="w-full py-3 bg-rose-100 hover:bg-rose-200 text-rose-700 dark:bg-rose-900/40 dark:hover:bg-rose-900/60 dark:text-rose-300 rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Trash2 size={14} /> Delete Invoice
                    </button>
                  ) : <div />}
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* ================= MODAL 4: PAYMENT COLLECTION ================= */}
      {isPaymentModalOpen && (
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsPaymentModalOpen(false);
          }}
          className="fixed inset-0 z-[70] bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
        >
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150 custom-scrollbar">
            
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider block">COLLECT PAYMENT</span>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">Record Cash / UPI Receipt</h3>
              </div>
              <button onClick={() => setIsPaymentModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full bg-slate-100 dark:bg-slate-800 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCollectPaymentSubmit} className="space-y-4 text-[11px]">
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
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl text-xs transition shadow-lg cursor-pointer flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 size={18} /> Confirm Receipt & Close Dues
              </button>
            </form>

          </div>
        </div>
      )}

      {/* ================= MODAL 5: CUSTOMER NOTIFICATION MODAL ================= */}
      {selectedOrderForNotify && (
        <WhatsAppNotifyModal
          order={selectedOrderForNotify}
          onClose={() => setSelectedOrderForNotify(null)}
          customers={customers}
          business={dbStore.getBusiness(businessId)}
          triggerToast={triggerToast}
        />
      )}

      {/* ================= MODAL 6: COMMERCIAL TAX INVOICE PREVIEW & CONFIRMATION ================= */}
      {viewingInvoiceOrder && (() => {
        const custObj = customers.find(c => c.id === viewingInvoiceOrder.customer_id);
        const businessObj = dbStore.getBusiness(businessId);
        const items = viewingInvoiceOrder.items || [];
        const taxableVal = items.reduce((sum, it) => sum + (it.qty * it.selling_price), 0);
        const cgstVal = Math.round(items.reduce((sum, it) => sum + (it.qty * it.selling_price * ((it.gst_rate || 0)/200)), 0));
        const sgstVal = Math.round(items.reduce((sum, it) => sum + (it.qty * it.selling_price * ((it.gst_rate || 0)/200)), 0));

        return (
          <div 
            onClick={(e) => {
              if (e.target === e.currentTarget) setViewingInvoiceOrder(null);
            }}
            className="fixed inset-0 z-[80] bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150"
          >
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
              
              {/* Header */}
              <div className="bg-slate-950 text-white px-6 py-4 flex items-center justify-between shrink-0 print:hidden">
                <div className="flex items-center gap-1.5.5">
                  <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl">
                    <FileText size={18} />
                  </div>
                  <div>
                    <h2 className="text-xs font-black uppercase tracking-wider text-amber-400">Commercial Tax Invoice Preview & Confirmation</h2>
                    <p className="text-[10px] text-slate-400 font-mono">Order Number: {viewingInvoiceOrder.order_number}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setViewingInvoiceOrder(null)} 
                  className="p-1.5 text-slate-400 hover:text-white rounded-full bg-slate-800 transition cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Invoice Printable Body */}
              <div className="flex-1 overflow-y-auto p-4 bg-slate-100 dark:bg-slate-950 print:p-0 print:bg-white" id="printable-tax-invoice">
                <BillOfSupplyView 
                  order={viewingInvoiceOrder} 
                  customer={custObj} 
                  businessObj={businessObj} 
                  products={products} 
                />
              </div>

              {/* Action buttons in two distinct rows */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 space-y-2 shrink-0 print:hidden">
                {/* Row 1 */}
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => handleSavePDFInvoice(viewingInvoiceOrder)}
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
                    onClick={() => handleEmailInvoice(viewingInvoiceOrder, custObj?.email || 'customer@kokanasthafaral.com')}
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
                      onClick={() => {
                        if (window.confirm(`Are you sure you want to permanently delete Order #${viewingInvoiceOrder.order_number}?`)) {
                          dbStore.deleteSalesOrder(viewingInvoiceOrder.id);
                          dbStore.logActivity(user.id, user.name, user.role, 'Delete Order', `Deleted order #${viewingInvoiceOrder.order_number}`, businessId);
                          triggerToast(`Order #${viewingInvoiceOrder.order_number} successfully deleted.`, 'info');
                          setViewingInvoiceOrder(null);
                        }
                      }}
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

      {/* ================= MODAL: DELETE INVOICE CONFIRMATION ================= */}
      {invoiceToDelete && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl p-6 text-center animate-in zoom-in-95 duration-150">
            <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/30 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 size={32} />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Delete Invoice</h3>
            <p className="text-[13px] text-slate-500 mb-6">
              Are you sure you want to delete invoice <strong>{invoiceToDelete.order_number}</strong>? This action cannot be undone.
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setInvoiceToDelete(null)}
                className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-[13px] rounded-xl transition"
              >
                No, Cancel
              </button>
              <button
                onClick={() => handleDeleteInvoiceConfirm(invoiceToDelete.id, invoiceToDelete.order_number)}
                className="flex-1 py-3 px-4 bg-rose-600 hover:bg-rose-500 text-white font-bold text-[13px] rounded-xl shadow-md transition"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: EDIT INVOICE CONFIRMATION ================= */}
      {invoiceToEdit && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl p-6 text-center animate-in zoom-in-95 duration-150">
            <div className="w-16 h-16 bg-sky-100 dark:bg-sky-900/30 text-sky-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Edit size={32} />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Edit Invoice</h3>
            <p className="text-[13px] text-slate-500 mb-6">
              Do you want to edit or update invoice <strong>{invoiceToEdit.order_number}</strong>?
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setInvoiceToEdit(null)}
                className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-[13px] rounded-xl transition"
              >
                No, Cancel
              </button>
              <button
                onClick={() => handleEditInvoiceConfirm(invoiceToEdit)}
                className="flex-1 py-3 px-4 bg-sky-600 hover:bg-sky-500 text-white font-bold text-[13px] rounded-xl shadow-md transition"
              >
                Yes, Edit
              </button>
            </div>
          </div>
        </div>
      )}

      </div>
    </div>
  );
};
