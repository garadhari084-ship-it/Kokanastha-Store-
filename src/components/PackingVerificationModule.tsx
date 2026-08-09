import React, { useState, useEffect, useRef, useMemo } from 'react';
import { PageHeader } from './PageHeader';
import { 
  Bike, 
  Store, 
  QrCode, 
  Scan, 
  Check, 
  X, 
  AlertCircle, 
  AlertTriangle,
  Printer, 
  ArrowLeft, 
  ArrowRight,
  Sparkles,
  ClipboardCheck,
  RotateCcw,
  Volume2,
  Camera,
  Truck,
  User,
  Phone,
  FileText,
  CheckCircle2,
  PackageCheck,
  Search,
  Clock,
  Calendar,
  CalendarDays,
  MapPin,
  Building2,
  Navigation,
  LayoutGrid,
  List,
  SlidersHorizontal,
  Minimize2,
  Maximize2
} from 'lucide-react';
import { BarcodeScanner } from './BarcodeScanner';
import { dbStore } from '../services/store';
import { SalesOrder, Product, UserProfile, Customer, Category } from '../types/erp';

interface PackingVerificationModuleProps {
  businessId: string;
  user: UserProfile;
  triggerToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  openOrderIdInitially?: string | null;
  deepLinkData?: any;
  onNavigate?: (view: string, data?: any) => void;
}

export const PackingVerificationModule: React.FC<PackingVerificationModuleProps> = ({
  businessId,
  user,
  triggerToast,
  openOrderIdInitially = null,
  deepLinkData = null,
  onNavigate
}) => {
  const [pendingOrders, setPendingOrders] = useState<SalesOrder[]>(
    dbStore.getSalesOrders(businessId).filter(o => o.status === 'Pending' || o.status === 'Packing')
  );
  const [products, setProducts] = useState<Product[]>(dbStore.getProducts(businessId));
  const [categories, setCategories] = useState<Category[]>(dbStore.getCategories(businessId));
  const [customers, setCustomers] = useState<Customer[]>(dbStore.getCustomers(businessId));

  // Active view & search states
  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isCompactDensity, setIsCompactDensity] = useState<boolean>(false);
  const [dateFilter, setDateFilter] = useState<'All' | 'Overdue' | 'Today' | 'Tomorrow' | 'Upcoming' | 'Next7' | 'Custom'>('Today');
  const [customDateValue, setCustomDateValue] = useState<string>(new Date().toISOString().split('T')[0]);

  // Scanning flow states
  const [barcodeInput, setBarcodeInput] = useState('');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [recentScanLog, setRecentScanLog] = useState<{ msg: string; success: boolean } | null>(null);
  
  // Audio feedback state
  const [audioFeedback, setAudioFeedback] = useState(true);

  // Delivery partner assignment states (when 100% scanned)
  const [deliveryPartner, setDeliveryPartner] = useState<string>('Rapido');
  const [personName, setPersonName] = useState<string>('');
  const [personPhone, setPersonPhone] = useState<string>('');
  const [trackingNumber, setTrackingNumber] = useState<string>('');
  const [dispatchNotes, setDispatchNotes] = useState<string>('');
  const [rackLocation, setRackLocation] = useState<string>('');
  const [rackSection, setRackSection] = useState<string>('');
  const [totalBags, setTotalBags] = useState<number>(1);
  const [showResumePopup, setShowResumePopup] = useState(false);

  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const selectedOrderRef = useRef<SalesOrder | null>(selectedOrder);

  useEffect(() => {
    selectedOrderRef.current = selectedOrder;
    if (selectedOrder && user?.id) {
      dbStore.markMessagesForOrderRead(selectedOrder.order_number, user.id);
      dbStore.markMessagesForOrderRead(selectedOrder.id, user.id);
    }
  }, [selectedOrder, user?.id]);

  useEffect(() => {
    const targetId = deepLinkData?.orderId || openOrderIdInitially;
    const targetNum = deepLinkData?.orderNumber;

    if ((targetId || targetNum) && user?.id) {
      const allSales = dbStore.getSalesOrders(businessId);

      const orderToOpen = allSales.find(o => {
        if (targetId && o.id === targetId) return true;
        
        const cleanOrderNum = (o.order_number || '').toLowerCase().replace(/^#/, '').trim();
        
        if (targetNum) {
          const cleanTargetNum = targetNum.toLowerCase().replace(/^#/, '').trim();
          if (cleanTargetNum && (cleanOrderNum === cleanTargetNum || cleanOrderNum.includes(cleanTargetNum) || cleanTargetNum.includes(cleanOrderNum))) {
            return true;
          }
        }
        
        if (targetId) {
          const cleanTargetId = targetId.toLowerCase().replace(/^#/, '').trim();
          if (cleanTargetId && (cleanOrderNum === cleanTargetId || cleanOrderNum.includes(cleanTargetId) || cleanTargetId.includes(cleanOrderNum))) {
            return true;
          }
        }
        
        return false;
      });

      if (orderToOpen) {
        handleOpenPackingStation(orderToOpen);
        dbStore.markMessagesForOrderRead(orderToOpen.order_number, user.id);
        dbStore.markMessagesForOrderRead(orderToOpen.id, user.id);
      }
    }
  }, [openOrderIdInitially, deepLinkData, businessId, user?.id]);

  const formatDisplayDate = (dateStr: string | undefined | null) => {
    if (!dateStr || dateStr === 'N/A') return '';
    if (dateStr.includes('-')) {
      const [y, m, d] = dateStr.split('-');
      return `${d}/${m}/${y}`;
    }
    return dateStr;
  };

  // Auto-refresh when orders change in store
  const reloadOrders = () => {
    const allSales = dbStore.getSalesOrders(businessId);
    setPendingOrders(
      allSales.filter(o => o.status === 'Pending' || o.status === 'Packing')
    );
    
    // Refresh current selected order data if it exists in the new list
    setSelectedOrder(prev => {
      if (!prev) return null;
      const refreshed = allSales.find(o => o.id === prev.id);
      if (refreshed) {
        return {
          ...refreshed,
          items: refreshed.items ? refreshed.items.map(it => ({ ...it })) : []
        };
      }
      return null;
    });
  };

  useEffect(() => {
    return dbStore.subscribe(() => {
      setProducts(dbStore.getProducts(businessId));
      setCustomers(dbStore.getCustomers(businessId));
      reloadOrders();
    });
  }, [businessId]);

  // Open specific order packing view
  const handleOpenPackingStation = (order: SalesOrder) => {
    // Set selected order first
    setSelectedOrder(order);
    
    setBarcodeInput('');
    setRecentScanLog(null);
    setPersonName(order.delivery_person_name || '');
    setPersonPhone(order.delivery_person_phone || '');
    setTrackingNumber(order.tracking_number || '');
    setDispatchNotes(order.dispatch_notes || '');
    if (order.delivery_partner) setDeliveryPartner(order.delivery_partner);
    setRackLocation(order.rack_location || '');
    setRackSection(order.rack_section || '');
    setTotalBags(order.total_bags || 1);

    // Show resume popup if it was partially packed
    if (order.is_partially_packed) {
      setShowResumePopup(true);
    }

    // Update status to 'Packing' if it was 'Pending'
    if (order.status === 'Pending') {
      dbStore.updateSalesOrder(order.id, { 
        status: 'Packing',
        packing_started_at: new Date().toISOString()
      });
    }
    
    // Call reload to ensure state consistency with database
    reloadOrders();
  };

  // Exit packing station view back to order queue (keeping scanned items)
  const handleBackToQueue = () => {
    setSelectedOrder(null);
    setIsScannerOpen(false);
    setRecentScanLog(null);
    // reloadOrders will be called by the subscriber or we can call it manually
    // but setSelectedOrder(null) is the primary action here
    const allSales = dbStore.getSalesOrders(businessId);
    setPendingOrders(
      allSales.filter(o => o.status === 'Pending' || o.status === 'Packing')
    );
  };

  // Barcode Submission Handler
  const processBarcodeScan = (codeToVerify: string): { success: boolean; message: string; scanned?: number; total?: number; isAllScanned?: boolean } => {
    const currentOrder = selectedOrderRef.current || selectedOrder;
    if (!currentOrder) {
      return { success: false, message: 'No order selected.', isAllScanned: false };
    }
    const cleanCode = codeToVerify.trim();
    if (!cleanCode) {
      return { success: false, message: 'Empty barcode.', isAllScanned: false };
    }

    try {
      const result = dbStore.verifyPackingBarcode(businessId, currentOrder.id, cleanCode);
      
      if (!result.success) {
        throw new Error(result.error_message || 'Barcode scan failed or item mismatch.');
      }

      const prodName = result.product?.name || 'Item';
      const scanned = result.scanned_qty || 0;
      const total = result.required_qty || 0;
      const pending = Math.max(0, total - scanned);

      reloadOrders();

      const refreshedOrder = dbStore.getSalesOrders(businessId).find(o => o.id === currentOrder.id);
      const isAllScanned = refreshedOrder && refreshedOrder.items.length > 0
        ? refreshedOrder.items.every(it => (it.scanned_qty || 0) >= it.qty)
        : false;

      const msg = isAllScanned
        ? `🎉 Order #${currentOrder.order_number} 100% Scanned & Verified!`
        : `Scanned: ${prodName} | ${scanned}/${total} Verified (${pending} Pending)`;

      setRecentScanLog({
        msg,
        success: true
      });

      if (audioFeedback) {
        triggerToast(msg, 'success');
      }

      setBarcodeInput('');

      return {
        success: true,
        message: msg,
        scanned,
        total,
        isAllScanned
      };
    } catch (err: any) {
      const errMsg = err.message || 'Scan error / product mismatch.';
      setRecentScanLog({
        msg: errMsg,
        success: false
      });
      if (audioFeedback) {
        triggerToast(`Scan Error: ${errMsg}`, 'error');
      }
      return {
        success: false,
        message: errMsg,
        isAllScanned: false
      };
    }
  };

  // Helper to verify a single product completely
  const handleVerifyProductItemCompletely = (productId: string) => {
    if (!selectedOrder) return;
    const currentOrder = dbStore.getSalesOrders(businessId).find(o => o.id === selectedOrder.id) || selectedOrder;
    const prod = products.find(p => p.id === productId);
    const updatedItems = (currentOrder.items || []).map(item => {
      if (item.product_id === productId) {
        return { ...item, scanned_qty: item.qty };
      }
      return { ...item };
    });

    dbStore.updateSalesOrder(selectedOrder.id, { items: updatedItems });
    triggerToast(`Verified all units for ${prod?.name || 'Item'}.`, 'success');
    setRecentScanLog({
      msg: `Quick Verified: ${prod?.name || 'Item'}`,
      success: true
    });
    reloadOrders();
  };

  // Helper to scan/verify 1 unit of a product
  const handleScanOneForProduct = (productId: string) => {
    const prod = products.find(p => p.id === productId);
    const codeToScan = prod?.barcode || prod?.sku || productId;
    processBarcodeScan(codeToScan);
  };

  // Helper to quick verify ALL remaining items in the order
  const handleQuickVerifyAll = () => {
    if (!selectedOrder) return;
    const currentOrder = dbStore.getSalesOrders(businessId).find(o => o.id === selectedOrder.id) || selectedOrder;
    const updatedItems = (currentOrder.items || []).map(item => ({
      ...item,
      scanned_qty: item.qty
    }));

    dbStore.updateSalesOrder(selectedOrder.id, { items: updatedItems });
    triggerToast(`All ${totalItemsCount} items verified for Order #${selectedOrder.order_number}!`, 'success');
    setRecentScanLog({
      msg: `🎉 Quick Verified All: ${totalItemsCount}/${totalItemsCount} units verified.`,
      success: true
    });
    reloadOrders();
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    processBarcodeScan(barcodeInput);
  };

  // Reset scans
  const handleResetOrderScans = () => {
    if (!selectedOrder) return;
    const resetItems = (selectedOrder.items || []).map(it => ({ ...it, scanned_qty: 0 }));
    dbStore.updateSalesOrder(selectedOrder.id, {
      items: resetItems
    });
    setSelectedOrder(prev => prev ? { ...prev, items: resetItems } : null);
    triggerToast('All item scan counts reset to 0.', 'info');
    setRecentScanLog(null);
    reloadOrders();
  };

  // Complete Packing Verification & Move to Ready to Dispatch
  const handleCompleteDispatch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedOrder) return;

    const items = selectedOrder.items || [];
    const allPacked = items.length > 0 && items.every(it => (it.scanned_qty || 0) === it.qty);

    if (!allPacked) {
      triggerToast('Cannot complete packing: Some items still have pending quantities.', 'error');
      return;
    }

    try {
      const res = dbStore.completePackingSession(
        businessId,
        selectedOrder.id,
        user.id,
        user.name,
        totalItemsCount,
        [],
        {
          partner: deliveryPartner,
          personName,
          personPhone,
          trackingNumber,
          notes: dispatchNotes,
          rackLocation,
          rackSection
        }
      );

      if (!res.success) {
        throw new Error(res.error || 'Failed to complete packing.');
      }

      triggerToast(`Order #${selectedOrder.order_number} verified & marked as Packed! Ready for dispatch.`, 'success');
      setSelectedOrder(null);
      setRecentScanLog(null);
      reloadOrders();
    } catch (err: any) {
      triggerToast(err.message || 'Packing completion failed.', 'error');
    }
  };

  // Handle saving as partial package
  const handleSavePartialPackage = () => {
    if (!selectedOrder) return;

    try {
      dbStore.updateSalesOrder(selectedOrder.id, {
        rack_location: rackLocation,
        rack_section: rackSection,
        total_bags: totalBags,
        is_partially_packed: true,
        status: 'Packing'
      });

      triggerToast(`Order #${selectedOrder.order_number} saved as Partial Package at ${rackLocation} - ${rackSection}.`, 'info');
      setSelectedOrder(null);
      setRecentScanLog(null);
      reloadOrders();
    } catch (err: any) {
      triggerToast(err.message || 'Failed to save partial package.', 'error');
    }
  };

  // Calculations for current selected order
  const selectedItems = selectedOrder?.items || [];
  const totalItemsCount = selectedItems.reduce((acc, it) => acc + (it.qty || 0), 0);
  const packedItemsCount = selectedItems.reduce((acc, it) => acc + (it.scanned_qty || 0), 0);
  const pendingItemsCount = Math.max(0, totalItemsCount - packedItemsCount);
  const packingProgressPercent = totalItemsCount > 0 ? Math.round((packedItemsCount / totalItemsCount) * 100) : 0;
  const isFullyVerified = totalItemsCount > 0 && packingProgressPercent === 100;

  const parseOrderDate = (dStr: string | undefined): number => {
    if (!dStr) return 0;
    const clean = dStr.trim();
    if (!clean || clean === 'Unknown Date') return 0;

    if (clean.includes('/') && clean.split('/').length === 3) {
      const [d, m, y] = clean.split('/').map(Number);
      return new Date(y, m - 1, d, 0, 0, 0, 0).getTime();
    }
    if (clean.includes('-') && clean.split('-').length === 3) {
      const parts = clean.split('-').map(Number);
      if (parts[0] > 1000) {
        return new Date(parts[0], parts[1] - 1, parts[2], 0, 0, 0, 0).getTime();
      } else {
        return new Date(parts[2], parts[1] - 1, parts[0], 0, 0, 0, 0).getTime();
      }
    }
    const dt = new Date(clean);
    dt.setHours(0, 0, 0, 0);
    return isNaN(dt.getTime()) ? 0 : dt.getTime();
  };

  const getDeliveryStatus = (deliveryDate: string | undefined) => {
    if (!deliveryDate) return { 
      badge: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700', 
      border: 'border-slate-200 dark:border-slate-800',
      cardBg: 'bg-white dark:bg-slate-900',
      icon: 'text-slate-500 dark:text-slate-400',
      text: 'text-slate-600 dark:text-slate-400 font-bold',
      dot: 'bg-slate-400',
      statusText: 'NO DATE SET',
      daysRemainingText: 'No Date Set',
      diffDays: null,
      isOverdue: false
    };
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTime = today.getTime();
    
    const dTime = parseOrderDate(deliveryDate);
    if (dTime === 0) {
      return { 
        badge: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700', 
        border: 'border-slate-200 dark:border-slate-800',
        cardBg: 'bg-white dark:bg-slate-900',
        icon: 'text-slate-500 dark:text-slate-400',
        text: 'text-slate-600 dark:text-slate-400 font-bold',
        dot: 'bg-slate-400',
        statusText: 'NO DATE SET',
        daysRemainingText: 'No Date Set',
        diffDays: null,
        isOverdue: false
      };
    }
    
    const diffTime = dTime - todayTime;
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      const absDays = Math.abs(diffDays);
      return { 
        badge: 'bg-rose-100 text-rose-950 border-rose-500 dark:bg-rose-950/90 dark:text-rose-200 dark:border-rose-800 font-black shadow-sm', 
        border: 'border-rose-400 dark:border-rose-800/80',
        cardBg: 'bg-rose-50/20 dark:bg-rose-950/10',
        icon: 'text-rose-700 dark:text-rose-400',
        text: 'text-rose-800 dark:text-rose-400 font-extrabold',
        ping: true,
        dot: 'bg-rose-600 shadow-[0_0_8px_rgba(225,29,72,0.9)]',
        statusText: `OVERDUE BY ${absDays} DAY${absDays > 1 ? 'S' : ''}`,
        daysRemainingText: `${absDays} Day${absDays > 1 ? 's' : ''} Overdue`,
        pillClass: 'bg-rose-600 text-white shadow-sm animate-pulse',
        pingBg: 'bg-rose-500',
        diffDays,
        isOverdue: true
      };
    } else if (diffDays === 0) {
      return { 
        badge: 'bg-amber-100 text-amber-950 border-amber-500 dark:bg-amber-950/90 dark:text-amber-200 dark:border-amber-800 font-black shadow-sm', 
        border: 'border-amber-400 dark:border-amber-800/70',
        cardBg: 'bg-amber-50/20 dark:bg-amber-950/10',
        icon: 'text-amber-700 dark:text-amber-400',
        text: 'text-amber-800 dark:text-amber-400 font-extrabold',
        ping: true,
        dot: 'bg-[#F59E0B] shadow-[0_0_8px_rgba(245,158,11,0.9)]',
        statusText: 'DUE TODAY (0 DAYS LEFT)',
        daysRemainingText: '0 Days Left (Due Today)',
        pillClass: 'bg-[#F59E0B] text-white shadow-sm animate-pulse',
        pingBg: 'bg-[#F59E0B]',
        diffDays,
        isOverdue: false
      };
    } else if (diffDays === 1) {
      return { 
        badge: 'bg-amber-100 text-amber-950 border-amber-500 dark:bg-amber-950/90 dark:text-amber-200 dark:border-amber-800 font-black shadow-sm', 
        border: 'border-amber-400 dark:border-amber-800/70',
        cardBg: 'bg-amber-50/20 dark:bg-amber-950/10',
        icon: 'text-amber-700 dark:text-amber-400',
        text: 'text-amber-800 dark:text-amber-400 font-extrabold',
        ping: true,
        dot: 'bg-[#F59E0B] shadow-[0_0_8px_rgba(245,158,11,0.9)]',
        statusText: 'DUE TOMORROW (1 DAY LEFT)',
        daysRemainingText: '1 Day Remaining',
        pillClass: 'bg-[#F59E0B] text-white shadow-sm animate-pulse',
        pingBg: 'bg-[#F59E0B]',
        diffDays,
        isOverdue: false
      };
    } else if (diffDays <= 5) {
      return { 
        badge: 'bg-amber-100 text-amber-950 border-amber-500 dark:bg-amber-950/90 dark:text-amber-200 dark:border-amber-800 font-black shadow-sm', 
        border: 'border-amber-400 dark:border-amber-800/70',
        cardBg: 'bg-amber-50/20 dark:bg-amber-950/10',
        icon: 'text-amber-700 dark:text-amber-400',
        text: 'text-amber-800 dark:text-amber-400 font-extrabold',
        ping: true,
        dot: 'bg-[#F59E0B] shadow-[0_0_8px_rgba(245,158,11,0.9)]',
        statusText: `DUE IN ${diffDays} DAYS`,
        daysRemainingText: `${diffDays} Days Remaining`,
        pillClass: 'bg-[#F59E0B] text-white shadow-sm animate-pulse',
        pingBg: 'bg-[#F59E0B]',
        diffDays,
        isOverdue: false
      };
    } else if (diffDays <= 10) {
      return { 
        badge: 'bg-orange-100 text-orange-950 border-orange-500 dark:bg-orange-950/90 dark:text-orange-200 dark:border-orange-800 font-black shadow-sm', 
        border: 'border-orange-400 dark:border-orange-800/60',
        cardBg: 'bg-orange-50/20 dark:bg-orange-950/10',
        icon: 'text-orange-700 dark:text-orange-400',
        text: 'text-orange-800 dark:text-orange-400 font-extrabold',
        ping: true,
        dot: 'bg-orange-600 shadow-[0_0_8px_rgba(234,88,12,0.9)]',
        statusText: `DUE IN ${diffDays} DAYS`,
        daysRemainingText: `${diffDays} Days Remaining`,
        pillClass: 'bg-orange-600 text-white shadow-sm animate-pulse',
        pingBg: 'bg-orange-500',
        diffDays,
        isOverdue: false
      };
    } else {
      return { 
        badge: 'bg-emerald-100 text-emerald-950 border-emerald-500 dark:bg-emerald-950/90 dark:text-emerald-200 dark:border-emerald-700 font-black shadow-sm', 
        border: 'border-emerald-400 dark:border-emerald-800/50',
        cardBg: 'bg-emerald-50/20 dark:bg-emerald-950/10',
        icon: 'text-[#15803D] dark:text-[#22C55E]',
        text: 'text-[#15803D] dark:text-[#22C55E] font-extrabold',
        ping: true,
        dot: 'bg-[#22C55E] shadow-[0_0_8px_rgba(34,197,94,0.9)]',
        statusText: `DUE IN ${diffDays} DAYS`,
        daysRemainingText: `${diffDays} Days Remaining`,
        pillClass: 'bg-[#22C55E] text-white shadow-sm animate-pulse',
        pingBg: 'bg-[#22C55E]',
        diffDays,
        isOverdue: false
      };
    }
  };

  // Calculate live counts for overdue and today orders
  const { overdueCount, todayCount } = useMemo(() => {
    let overdue = 0;
    let today = 0;
    pendingOrders.forEach(o => {
      const dStatus = getDeliveryStatus(o.delivery_date);
      if (dStatus.isOverdue) overdue++;
      if (dStatus.diffDays === 0) today++;
    });
    return { overdueCount: overdue, todayCount: today };
  }, [pendingOrders]);

  // Filter queue orders
  const filteredQueue = pendingOrders.filter(o => {
    const cust = customers.find(c => c.id === o.customer_id);
    const q = searchQuery.toLowerCase().trim();
    
    // Apply date filter
    if (dateFilter !== 'All') {
      const dStatus = getDeliveryStatus(o.delivery_date);

      if (dateFilter === 'Overdue') {
        if (!dStatus.isOverdue) return false;
      } else {
        const dateStr = (o.delivery_date || o.order_date || '').trim();
        if (!dateStr || dateStr === 'Unknown Date') return false;
        
        const orderTime = parseOrderDate(dateStr);
        const now = new Date();
        const todayTime = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        const tmrwTime = todayTime + 86400000;
        const next7Time = todayTime + (7 * 86400000);
        
        if (dateFilter === 'Today' && orderTime !== todayTime) return false;
        if (dateFilter === 'Tomorrow' && orderTime !== tmrwTime) return false;
        if (dateFilter === 'Upcoming' && orderTime <= tmrwTime) return false;
        if (dateFilter === 'Next7' && (orderTime < todayTime || orderTime > next7Time)) return false;
        if (dateFilter === 'Custom') {
          const customTime = parseOrderDate(customDateValue);
          if (orderTime !== customTime) return false;
        }
      }
    }
    
    if (!q) return true;
    return (
      o.order_number.toLowerCase().includes(q) ||
      (cust && cust.name.toLowerCase().includes(q)) ||
      (cust && cust.phone?.toLowerCase().includes(q)) ||
      (o.area && o.area.toLowerCase().includes(q))
    );
  });

  const groupedQueue = useMemo(() => {
    const groups: Record<string, SalesOrder[]> = {};
    
    // Sort the entire filteredQueue first to show newest delivery first
    const sorted = [...filteredQueue].sort((a, b) => {
      const dateA = a.delivery_date || a.order_date || '0000-00-00';
      const dateB = b.delivery_date || b.order_date || '0000-00-00';
      if (dateA !== dateB) return dateB.localeCompare(dateA); // Descending date
      return b.order_number.localeCompare(a.order_number); // Descending order number
    });

    sorted.forEach(o => {
      const date = o.delivery_date || o.order_date || 'Unknown Date';
      if (!groups[date]) groups[date] = [];
      groups[date].push(o);
    });
    
    return Object.entries(groups).sort(([dateA], [dateB]) => {
      if (dateA === 'Unknown Date') return 1;
      if (dateB === 'Unknown Date') return -1;
      return dateB.localeCompare(dateA); // Descending group date
    });
  }, [filteredQueue]);

  const getRelativeDateLabel = (dateString: string) => {
    if (!dateString || dateString === 'Unknown Date') return dateString || 'Unknown Date';
    
    const orderTime = parseOrderDate(dateString.trim());
    const now = new Date();
    const todayTime = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const tmrwTime = todayTime + 86400000;
    
    if (orderTime < todayTime) {
      const diffDays = Math.round((todayTime - orderTime) / 86400000);
      return `⚠️ OVERDUE Orders (${formatDisplayDate(dateString)} • ${diffDays} Day${diffDays > 1 ? 's' : ''} Overdue)`;
    }
    if (orderTime === todayTime) return `Today's Delivery (${formatDisplayDate(dateString)})`;
    if (orderTime === tmrwTime) return `Tomorrow's Delivery (${formatDisplayDate(dateString)})`;
    return `Delivery on ${formatDisplayDate(dateString)}`;
  };

  const stats = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const todayOrders = pendingOrders.filter(o => (o.delivery_date || o.order_date) === todayStr);
    const packingOrders = pendingOrders.filter(o => o.status === 'Packing');
    const fullyScanned = pendingOrders.filter(o => {
      const items = o.items || [];
      return items.length > 0 && items.every(it => (it.scanned_qty || 0) >= it.qty);
    });
    
    return {
      total: pendingOrders.length,
      today: todayOrders.length,
      active: packingOrders.length,
      ready: fullyScanned.length
    };
  }, [pendingOrders]);

  return (
    <div className="space-y-3 max-w-full pb-16 px-0 font-sans text-slate-900 dark:text-slate-100 overflow-x-hidden" id="packing-verification-module">
      
      {/* SECTION 1: TOP PAGE HEADER */}
      <PageHeader
        title="Barcode Packing Verification Station"
        subtitle="Verify order items item-by-item with barcode scans and assign dispatch delivery partners."
        icon={ClipboardCheck}
      />

      {/* RESUME PARTIAL PACKING POPUP */}
      {showResumePopup && selectedOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <AlertCircle size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">Resume Partial Packing</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">This order was previously saved as an incomplete package.</p>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-700/50 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Stored At</span>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      {selectedOrder.rack_location || 'N/A'} - {selectedOrder.rack_section || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Total Bags</span>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      {selectedOrder.total_bags || 1} Bag(s)
                    </p>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Pending Items</span>
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                    {selectedOrder.items.filter(it => (it.scanned_qty || 0) < it.qty).map((it, idx) => {
                      const p = products.find(prod => prod.id === it.product_id);
                      return (
                        <div key={idx} className="flex justify-between items-center text-xs bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-100 dark:border-slate-700">
                          <span className="font-medium text-slate-700 dark:text-slate-300 truncate mr-2">
                            {p?.name || 'Unknown Product'}
                          </span>
                          <span className="font-mono font-bold text-amber-600 dark:text-amber-400 shrink-0">
                            {it.qty - (it.scanned_qty || 0)} Pending
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowResumePopup(false)}
                className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-sm shadow-lg shadow-indigo-600/20 transition-all active:scale-[0.98]"
              >
                Continue Packing
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="px-0.5 sm:px-1 space-y-3">
        {!selectedOrder && (
          <>
            {/* ADVANCED STATS BAR */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
              <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center sm:items-start">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Queue Total</span>
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-indigo-50 dark:bg-indigo-950/50 rounded-lg text-indigo-600 dark:text-indigo-400">
                    <List size={14} />
                  </div>
                  <span className="text-xl font-black text-slate-900 dark:text-white leading-none">{stats.total}</span>
                </div>
              </div>
              <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center sm:items-start">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Deliver Today</span>
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-rose-50 dark:bg-rose-950/50 rounded-lg text-rose-600 dark:text-rose-400">
                    <Clock size={14} />
                  </div>
                  <span className="text-xl font-black text-rose-600 leading-none">{stats.today}</span>
                </div>
              </div>
              <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center sm:items-start">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Currently Packing</span>
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-amber-50 dark:bg-amber-950/50 rounded-lg text-amber-600 dark:text-amber-400">
                    <PackageCheck size={14} />
                  </div>
                  <span className="text-xl font-black text-amber-600 leading-none">{stats.active}</span>
                </div>
              </div>
              <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center sm:items-start">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Ready to Dispatch</span>
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-emerald-50 dark:bg-emerald-950/50 rounded-lg text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 size={14} />
                  </div>
                  <span className="text-xl font-black text-emerald-600 leading-none">{stats.ready}</span>
                </div>
              </div>
            </div>

            {/* ADVANCED SINGLE-LINE FILTER & SEARCH TOOLBAR */}
            <div className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all ${
              isCompactDensity ? 'p-1.5 sm:p-2' : 'p-2 sm:p-2.5'
            }`}>
              <div className="flex flex-col lg:flex-row items-center justify-between gap-2">
                
                {/* Left: Search Box & Filter Tabs in One Inline Flex Flow */}
                <div className="flex flex-col sm:flex-row items-center gap-2 w-full lg:w-auto flex-1 min-w-0">
                  
                  {/* Search Box */}
                  <div className="relative w-full sm:w-52 md:w-64 shrink-0">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
                    <input
                      type="text"
                      placeholder="Search Order #, Name, Area..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className={`w-full pl-7 pr-6 border border-slate-200 dark:border-slate-700/80 rounded-xl text-[11px] font-medium focus:ring-2 focus:ring-indigo-500/50 transition-all bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white ${
                        isCompactDensity ? 'h-7' : 'h-8'
                      }`}
                    />
                    {searchQuery && (
                      <button 
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                      >
                        <X size={11} />
                      </button>
                    )}
                  </div>

                  {/* Filter Pill Tabs Strip */}
                  <div className="flex items-center overflow-x-auto no-scrollbar bg-slate-100/90 dark:bg-slate-800/90 p-0.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 gap-0.5 w-full sm:w-auto">
                    
                    {/* 1. OVERDUE TAB */}
                    <button
                      onClick={() => setDateFilter('Overdue')}
                      className={`flex items-center gap-1 rounded-lg text-[9.5px] font-black uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                        isCompactDensity ? 'px-1.5 py-0.5' : 'px-2 py-1'
                      } ${
                        dateFilter === 'Overdue'
                          ? 'bg-rose-600 text-white shadow-sm ring-1 ring-rose-400/50'
                          : 'text-rose-700 dark:text-rose-300 bg-rose-50/80 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200/80 dark:border-rose-800/80'
                      }`}
                    >
                      <AlertTriangle size={12} className={dateFilter === 'Overdue' ? 'animate-bounce text-white' : 'text-rose-600 dark:text-rose-400'} />
                      <span>Overdue</span>
                      <span className={`px-1.5 py-0.2 rounded-full text-[8.5px] font-black ${
                        dateFilter === 'Overdue' ? 'bg-white text-rose-700' : 'bg-rose-600 text-white'
                      }`}>
                        {overdueCount}
                      </span>
                    </button>

                    {/* 2. TODAY TAB */}
                    <button
                      onClick={() => setDateFilter('Today')}
                      className={`flex items-center gap-1 rounded-lg text-[9.5px] font-black uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                        isCompactDensity ? 'px-1.5 py-0.5' : 'px-2 py-1'
                      } ${
                        dateFilter === 'Today'
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-slate-700'
                      }`}
                    >
                      <Calendar size={12} />
                      <span>Today</span>
                      {todayCount > 0 && (
                        <span className={`px-1 py-0.2 rounded-full text-[8.5px] font-black ${
                          dateFilter === 'Today' ? 'bg-white text-indigo-700' : 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'
                        }`}>
                          {todayCount}
                        </span>
                      )}
                    </button>

                    {/* 3. TOMORROW TAB */}
                    <button
                      onClick={() => setDateFilter('Tomorrow')}
                      className={`flex items-center gap-1 rounded-lg text-[9.5px] font-black uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                        isCompactDensity ? 'px-1.5 py-0.5' : 'px-2 py-1'
                      } ${
                        dateFilter === 'Tomorrow'
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-slate-700'
                      }`}
                    >
                      <Clock size={12} />
                      <span>Tomorrow</span>
                    </button>

                    {/* 4. NEXT 7 DAYS TAB */}
                    <button
                      onClick={() => setDateFilter('Next7')}
                      className={`flex items-center gap-1 rounded-lg text-[9.5px] font-black uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                        isCompactDensity ? 'px-1.5 py-0.5' : 'px-2 py-1'
                      } ${
                        dateFilter === 'Next7'
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-slate-700'
                      }`}
                    >
                      <Sparkles size={12} />
                      <span>Next 7 Days</span>
                    </button>

                    {/* 5. ALL ORDERS TAB */}
                    <button
                      onClick={() => setDateFilter('All')}
                      className={`flex items-center gap-1 rounded-lg text-[9.5px] font-black uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                        isCompactDensity ? 'px-1.5 py-0.5' : 'px-2 py-1'
                      } ${
                        dateFilter === 'All'
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-slate-700'
                      }`}
                    >
                      <LayoutGrid size={12} />
                      <span>All Orders</span>
                      <span className={`px-1 py-0.2 rounded-full text-[8.5px] font-black ${
                        dateFilter === 'All' ? 'bg-white text-indigo-700' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                      }`}>
                        {pendingOrders.length}
                      </span>
                    </button>

                    {/* 6. SELECT DATE TAB */}
                    <button
                      onClick={() => setDateFilter('Custom')}
                      className={`flex items-center gap-1 rounded-lg text-[9.5px] font-black uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                        isCompactDensity ? 'px-1.5 py-0.5' : 'px-2 py-1'
                      } ${
                        dateFilter === 'Custom'
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-slate-700'
                      }`}
                    >
                      <CalendarDays size={12} />
                      <span>Select Date</span>
                    </button>
                  </div>

                  {dateFilter === 'Custom' && (
                    <div className="animate-in fade-in slide-in-from-left-2 duration-300">
                      <input
                        type="date"
                        value={customDateValue}
                        onChange={(e) => setCustomDateValue(e.target.value)}
                        className="h-7.5 px-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[10px] font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-sm"
                      />
                    </div>
                  )}
                </div>

                {/* Right Action Group: View Mode Switcher + Reduce/Compact Option */}
                <div className="flex items-center gap-1.5 shrink-0 justify-end w-full lg:w-auto">
                  {/* Grid / List View Toggle */}
                  <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700">
                    <button 
                      onClick={() => setViewMode('grid')}
                      title="Grid View"
                      className={`p-1 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-400'}`}
                    >
                      <LayoutGrid size={14} />
                    </button>
                    <button 
                      onClick={() => setViewMode('list')}
                      title="List View"
                      className={`p-1 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-400'}`}
                    >
                      <List size={14} />
                    </button>
                  </div>

                  {/* Advanced Reduce / Density Toggle Button */}
                  <button
                    onClick={() => setIsCompactDensity(!isCompactDensity)}
                    title={isCompactDensity ? "Switch to Standard View" : "Reduce Spacing & Font Size (Compact Mode)"}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-xl border text-[9.5px] font-black uppercase tracking-wider transition-all cursor-pointer shadow-sm ${
                      isCompactDensity
                        ? 'bg-indigo-600 text-white border-indigo-600 ring-2 ring-indigo-400/40'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200/80 dark:border-slate-700/80 hover:bg-slate-200/80 dark:hover:bg-slate-700'
                    }`}
                  >
                    <SlidersHorizontal size={12} className={isCompactDensity ? 'text-white' : 'text-indigo-600 dark:text-indigo-400'} />
                    <span>{isCompactDensity ? 'Dense' : 'Reduce Size'}</span>
                  </button>
                </div>

              </div>
            </div>
          </>
        )}

      {/* ========================================================================= */}
      {/* PAGE VIEW A: DEDICATED PACKING STATION FOR A SELECTED ORDER               */}
      {/* ========================================================================= */}
      {selectedOrder ? (
        <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
          
          {/* Top Bar with Back Button */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <button
              onClick={handleBackToQueue}
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-[11px] font-bold transition-all cursor-pointer active:scale-95"
            >
              <ArrowLeft size={16} />
              <span>Back to Orders Queue</span>
            </button>

            <div className="flex items-center gap-2.5">
              <span className="text-[11px] text-slate-500 font-medium hidden sm:inline">
                Data saved automatically as you scan
              </span>
              <button 
                onClick={handleResetOrderScans}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-900/20 dark:hover:bg-rose-900/40 dark:text-rose-400 rounded-xl text-[11px] font-bold transition-all cursor-pointer active:scale-95"
              >
                <RotateCcw size={14} />
                <span>Reset Scans</span>
              </button>
            </div>
          </div>

          {/* Active Order Overview Banner */}
          <div className="bg-slate-950 text-white rounded-2xl p-4 sm:p-5 shadow-xl border border-slate-800 flex flex-row flex-wrap items-center justify-between gap-4">
            <div className="space-y-3 flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-1 bg-indigo-500/20 text-indigo-300 rounded-md text-[10px] font-bold font-mono tracking-wider uppercase border border-indigo-500/30">
                  PACKING DESK #1
                </span>
                <span className="px-2.5 py-1 bg-slate-800 text-slate-300 rounded-md text-[10px] font-bold uppercase">
                  Status: {selectedOrder.status}
                </span>
                <h2 className="text-sm font-extrabold tracking-tight flex items-center gap-2 text-white ml-1">
                  Order #{selectedOrder.order_number}
                  <span className="text-[9px] font-medium text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded-md ml-1 tracking-normal">
                    {formatDisplayDate(selectedOrder.order_date)} {selectedOrder.delivery_date ? `• Delivery: ${formatDisplayDate(selectedOrder.delivery_date)}` : ''}
                  </span>
                </h2>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-slate-300">
                <p className="flex items-center gap-1.5">
                  <User size={13} className="text-slate-400" />
                  <span className="font-semibold text-white truncate max-w-[150px]">
                    {customers.find(c => c.id === selectedOrder.customer_id)?.name || 'Walk-in Customer'}
                  </span>
                </p>
                {selectedOrder.area && (
                  <p className="flex items-center gap-1.5 text-slate-400">
                    <MapPin size={13} />
                    <span className="truncate max-w-[120px]">Area: {selectedOrder.area}</span>
                  </p>
                )}
                {selectedOrder.channel && (
                  <p className="flex items-center gap-1.5 text-slate-400">
                    <Building2 size={13} />
                    <span className="truncate max-w-[120px]">Channel: {selectedOrder.channel}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Verification Progress Box */}
            <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-xl flex flex-col justify-between w-full sm:w-[320px] shrink-0">
              <div className="flex justify-between items-baseline mb-2">
                <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">Verification Progress</span>
                <span className="text-sm font-mono font-black text-indigo-400">{packingProgressPercent}%</span>
              </div>
              
              <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden mb-3">
                <div 
                  className={`h-full transition-all duration-300 rounded-full ${isFullyVerified ? 'bg-emerald-500' : 'bg-indigo-500'}`} 
                  style={{ width: `${packingProgressPercent}%` }}
                />
              </div>

              <div className="flex justify-between text-[11px] font-mono text-slate-300 font-semibold">
                <span className="text-emerald-400">{packedItemsCount} Scanned</span>
                <span className={pendingItemsCount > 0 ? 'text-amber-400' : 'text-slate-400'}>
                  {pendingItemsCount} Pending
                </span>
                <span>{totalItemsCount} Total Units</span>
              </div>
            </div>
          </div>

          {/* Barcode Scanner Controls */}
          <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Scan size={14} className="text-indigo-600 animate-pulse" />
                <span>Barcode / SKU Input Console</span>
              </h3>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-2.5 w-full">
              {/* Row 1: Barcode / SKU input field + Verify Item button on tablet/desktop */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full">
                <div className="relative flex-1">
                  <input 
                    ref={barcodeInputRef}
                    type="text" 
                    placeholder="Scan or type barcode / SKU / product name (e.g. AM-1001)..."
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    className="w-full pl-3 pr-10 h-10 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-[11px] font-mono font-bold rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  />
                  {barcodeInput && (
                    <button 
                      type="button" 
                      onClick={() => setBarcodeInput('')}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>

                {/* Verify Item button on tablet & desktop (sm+) */}
                <button 
                  type="submit"
                  className="hidden sm:flex h-10 px-4 sm:w-48 shrink-0 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white dark:text-slate-900 text-white rounded-xl text-[11px] font-bold cursor-pointer items-center justify-center transition-all active:scale-95 shadow-sm"
                >
                  Verify Item
                </button>
              </div>

              {/* Row 2: Equal width buttons on mobile; Camera Scanner right-aligned under Verify Item on tablet/desktop */}
              <div className="grid grid-cols-2 sm:flex sm:justify-end gap-2 w-full">
                {/* Verify Item button on mobile (< sm) */}
                <button 
                  type="submit"
                  className="sm:hidden h-10 px-4 w-full bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white dark:text-slate-900 text-white rounded-xl text-[11px] font-bold cursor-pointer flex items-center justify-center transition-all active:scale-95 shadow-sm"
                >
                  Verify Item
                </button>

                {/* Camera Scanner button */}
                <button
                  type="button"
                  onClick={() => setIsScannerOpen(true)}
                  className="h-10 px-4 w-full sm:w-48 shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[11px] font-bold cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/20 transition-all active:scale-95"
                >
                  <Camera size={14} />
                  <span>Camera Scanner</span>
                </button>
              </div>
            </form>

            {/* Scan Feedback Banner */}
            {recentScanLog && (
              <div className={`p-2.5 rounded-xl flex items-center gap-2.5 text-[11px] font-semibold border ${
                recentScanLog.success 
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300' 
                  : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
              }`}>
                {recentScanLog.success ? <CheckCircle2 size={18} className="shrink-0 text-emerald-600 dark:text-emerald-400" /> : <AlertCircle size={18} className="shrink-0 text-rose-600 dark:text-rose-400" />}
                <span>{recentScanLog.msg}</span>
              </div>
            )}
          </div>

          {/* ITEM SCAN CHECKLIST TABLE WITH DETAILED SCANNED VS PENDING QUANTITIES */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
              <h3 className="text-[11px] font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <PackageCheck size={16} className="text-indigo-600" />
                <span>Order Items Verification List ({selectedItems.length} Products)</span>
              </h3>
              <span className="text-[11px] text-slate-500 font-medium">
                
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-[11px]">
                <thead>
                  <tr className="bg-slate-100/70 dark:bg-slate-800/80 text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                    <th className="py-3 px-4">Product Details</th>
                    <th className="py-3 px-4 text-center">Barcode / SKU</th>
                    <th className="py-3 px-4 text-center">Total Qty</th>
                    <th className="py-3 px-4 text-center">Scanned Qty</th>
                    <th className="py-3 px-4 text-center">Pending Qty</th>
                    <th className="py-3 px-4 text-center">Status / Progress</th>
                    <th className="py-3 px-4 text-center">Quick Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {selectedItems.map((it, idx) => {
                    const p = products.find(prod => prod.id === it.product_id);
                    const totalNeeded = it.qty || 0;
                    const scanned = it.scanned_qty || 0;
                    const pending = Math.max(0, totalNeeded - scanned);
                    const isItemDone = scanned >= totalNeeded;
                    const pct = totalNeeded > 0 ? Math.min(100, Math.round((scanned / totalNeeded) * 100)) : 0;

                    return (
                      <tr 
                        key={idx} 
                        className={`transition-colors ${
                          isItemDone 
                            ? 'bg-emerald-50/40 dark:bg-emerald-950/20' 
                            : scanned > 0 
                            ? 'bg-amber-50/30 dark:bg-amber-950/20' 
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                        }`}
                      >
                        <td className="py-3.5 px-4">
                          <strong className="text-slate-900 dark:text-slate-100 font-bold block text-[11px]">
                            {p ? p.name : 'Unknown Product'}
                          </strong>
                          <span className="text-[11px] text-slate-400 font-mono">Category: {p?.category || 'General'}</span>
                        </td>
                        
                        <td className="py-3.5 px-4 text-center">
                          <span className="font-mono text-[11px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2.5 py-1 rounded-md border border-indigo-100 dark:border-indigo-900">
                            {p?.barcode || p?.sku || 'N/A'}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-center font-mono font-extrabold text-[11px] text-slate-900 dark:text-slate-100">
                          {totalNeeded}
                        </td>

                        <td className="py-3.5 px-4 text-center font-mono font-extrabold text-[11px] text-emerald-600 dark:text-emerald-400">
                          {scanned}
                        </td>

                        <td className={`py-3.5 px-4 text-center font-mono font-extrabold text-[11px] ${pending > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'}`}>
                          {pending}
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <div className="flex flex-col items-center gap-1">
                            {isItemDone ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                <Check size={12} /> Verified ({scanned}/{totalNeeded})
                              </span>
                            ) : scanned > 0 ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                                {scanned} Scanned • {pending} Pending
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                0/{totalNeeded} Scanned ({pending} Pending)
                              </span>
                            )}
                            
                            <div className="w-24 bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full ${isItemDone ? 'bg-emerald-500' : 'bg-amber-500'}`} 
                                style={{ width: `${pct}%` }} 
                              />
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          {isItemDone ? (
                            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1">
                              <CheckCircle2 size={14} /> Done
                            </span>
                          ) : (
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleScanOneForProduct(it.product_id)}
                                title="Scan 1 unit"
                                className="px-2 py-1 bg-slate-100 hover:bg-indigo-50 dark:bg-slate-800 dark:hover:bg-indigo-950/50 text-slate-700 dark:text-slate-200 hover:text-indigo-600 text-[10px] font-bold rounded-lg border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                              >
                                +1 Scan
                              </button>
                              <button
                                type="button"
                                onClick={() => handleVerifyProductItemCompletely(it.product_id)}
                                title="Verify all units for this item"
                                className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:hover:bg-indigo-900/80 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold rounded-lg border border-indigo-200 dark:border-indigo-800 transition-colors cursor-pointer"
                              >
                                Verify Item
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* STORAGE & BAGS (Godown / Storage) */}
          <div className="bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <LayoutGrid size={16} className="text-indigo-500" />
                  <h4 className="text-[11px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">Storage Location</h4>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="text-[10px] text-slate-500 mb-1 block ml-1">Rack No</label>
                    <input
                      type="text"
                      value={rackLocation}
                      onChange={(e) => setRackLocation(e.target.value)}
                      placeholder="e.g. Rack A"
                      className="w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-medium px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-[10px] text-slate-500 mb-1 block ml-1">Table No / Section</label>
                    <input
                      type="text"
                      value={rackSection}
                      onChange={(e) => setRackSection(e.target.value)}
                      placeholder="e.g. Table 3"
                      className="w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-medium px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-500" />
                  <h4 className="text-[11px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">Packaging Details</h4>
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 mb-1 block ml-1">Total Number of Bags</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min="1"
                      value={totalBags}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '') {
                          setTotalBags(1);
                        } else {
                          const parsed = parseInt(val, 10);
                          setTotalBags(isNaN(parsed) ? 1 : Math.max(1, parsed));
                        }
                      }}
                      className="w-24 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-bold px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    />
                    <span className="text-[10px] text-slate-400 font-medium italic">Click field to clear & type new count</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* PACKING VERIFICATION ACTION FOOTER */}
          <div className={`bg-white dark:bg-slate-900 rounded-3xl border p-4 shadow-sm transition-all duration-300 ${isFullyVerified ? 'border-emerald-500/50 shadow-emerald-500/10' : 'border-slate-200 dark:border-slate-800'}`}>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 text-left w-full sm:w-auto">
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${isFullyVerified ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400'}`}>
                  {isFullyVerified ? <CheckCircle2 size={22} /> : <AlertCircle size={22} />}
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900 dark:text-white">
                    {isFullyVerified ? 'Packing Verification 100% Complete!' : `Verification In Progress (${packingProgressPercent}%)`}
                  </h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                    {isFullyVerified 
                      ? 'All items scanned. You can now mark this order as Packed.' 
                      : `${pendingItemsCount} items still pending scan verification.`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                {!isFullyVerified && (
                  <button
                    onClick={handleSavePartialPackage}
                    className="flex-1 sm:flex-none px-6 h-12 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-2xl text-[11px] font-black transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-2"
                  >
                    <Clock size={16} />
                    <span>Save Partial & Pause</span>
                  </button>
                )}
                
                <button
                  onClick={handleCompleteDispatch}
                  disabled={!isFullyVerified}
                  className={`flex-1 sm:flex-none px-8 h-12 rounded-2xl text-[11px] font-black transition-all flex items-center justify-center gap-2 ${
                    isFullyVerified 
                      ? 'bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 shadow-xl cursor-pointer active:scale-95' 
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'
                  }`}
                >
                  <PackageCheck size={18} />
                  <span>Mark as Packed & Ready</span>
                </button>
              </div>
            </div>
          </div>

        </div>
      ) : (
        /* ========================================================================= */
        /* PAGE VIEW B: ORDERS QUEUE LIST (PENDING FULFILLMENT LIST)                 */
        /* ========================================================================= */
        <div className="space-y-6">
          
          {/* Orders Display */}
          {groupedQueue.map(([date, dateOrders]) => (
            <div key={date} className="mb-6">
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 px-1 border-b border-slate-200 dark:border-slate-800 pb-2">
                {getRelativeDateLabel(date)}
                <span className="ml-2 text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 py-0.5 px-2 rounded-full">
                  {dateOrders.length} order{dateOrders.length > 1 ? 's' : ''}
                </span>
              </h3>
              {viewMode === 'grid' ? (
                <div className={
                  isCompactDensity 
                    ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2" 
                    : "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-3.5"
                }>
                  {dateOrders.map((o) => {
                    const customer = customers.find(c => c.id === o.customer_id);
                    const items = o.items || [];
                    const itemsCount = items.reduce((acc, it) => acc + (it.qty || 0), 0);
                    const packedCount = items.reduce((acc, it) => acc + (it.scanned_qty || 0), 0);
                    const pct = itemsCount > 0 ? Math.round((packedCount / itemsCount) * 100) : 0;
                    const isDone = itemsCount > 0 && pct === 100;
                    const dStatus = getDeliveryStatus(o.delivery_date);
                    
                    return (
                      <div 
                        key={o.id}
                        onClick={() => handleOpenPackingStation(o)}
                        className={`bg-white dark:bg-slate-900 ${dStatus.cardBg || ''} rounded-xl border ${
                          isCompactDensity ? 'p-2 space-y-1' : 'p-2.5 sm:p-3 space-y-2'
                        } shadow-sm hover:shadow-md transition-all flex flex-col justify-between group cursor-pointer relative overflow-hidden ${dStatus.border} hover:border-indigo-500/50`}
                      >
                        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-indigo-500/10 via-indigo-500/5 to-transparent rounded-bl-full pointer-events-none"></div>
                        
                        {/* Top Right Delivery Status Indicator */}
                        <div className="absolute top-2 right-2 flex flex-col items-end gap-1 z-20">
                          <div className={`w-3 h-3 rounded-full ${dStatus.dot} border-2 border-white dark:border-slate-900 shadow-sm animate-pulse`}></div>
                        </div>
                        
                        <div className="space-y-2 relative z-10">
                          {/* Header: Order Ref & Status Pill */}
                          <div className="flex justify-between items-start gap-1">
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 mb-0.5">
                                <span className={`w-1.5 h-1.5 rounded-full ${dStatus.dot} animate-pulse shrink-0`}></span>
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block leading-none">Order Ref</span>
                              </div>
                              <strong className="text-xs sm:text-sm font-black text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate block">
                                #{o.order_number}
                              </strong>
                              <div className="flex flex-col gap-0.5 mt-0.5">
                                {o.delivery_date ? (
                                  <span className="text-[8px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-tighter block">
                                    Delivery: {formatDisplayDate(o.delivery_date)}
                                  </span>
                                ) : (
                                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter block">
                                    Ordered: {formatDisplayDate(o.order_date) || 'N/A'}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider shrink-0 border ${
                                isDone 
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700' 
                                  : o.status === 'Packing' 
                                  ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/80 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700 animate-pulse' 
                                  : 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border-amber-300 dark:border-amber-700'
                              }`}>
                                {isDone ? 'Verified' : o.status}
                              </span>
                              {o.total_amount && (
                                <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400">
                                  ₹{o.total_amount.toLocaleString()}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          {/* Delivery Target & Days Remaining Badge - Prominent Card Element */}
                          <div className="flex items-center my-1.5">
                            <div className={`w-full flex items-center justify-between gap-1.5 px-2.5 py-1.5 rounded-xl border shadow-sm ${dStatus.badge}`}>
                              <div className="flex items-center gap-1.5 min-w-0">
                                <Clock size={13} className={`${dStatus.icon} shrink-0`} />
                                <div className="flex flex-col min-w-0">
                                  <span className="text-[8px] uppercase font-black leading-tight tracking-wider opacity-90 truncate">
                                    {dStatus.statusText}
                                  </span>
                                  <span className="text-[10px] font-black truncate">
                                    {formatDisplayDate(o.delivery_date) || formatDisplayDate(o.order_date) || 'No Date Set'}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-tight ${dStatus.pillClass}`}>
                                  {dStatus.daysRemainingText}
                                </span>
                                {dStatus.ping && (
                                  <span 
                                    className={`flex h-2 w-2 rounded-full ${dStatus.pingBg} animate-ping`} 
                                    title={dStatus.isOverdue ? 'Critical Overdue' : 'Delivery Target'}
                                  ></span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Customer Info Container */}
                          <div className="space-y-1 p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-800 dark:text-slate-200">
                              <div className="w-5 h-5 rounded bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                                <User size={11} />
                              </div>
                              <span className="truncate">{customer ? customer.name : 'Walk-in Customer'}</span>
                            </div>
                            {customer?.phone && (
                              <div className="flex items-center gap-1.5 text-[10px] text-slate-500 pl-6.5 truncate">
                                <Phone size={10} className="shrink-0 text-slate-400" /> 
                                <span className="truncate">{customer.phone}</span>
                              </div>
                            )}
                            {o.area && (
                              <div className="flex items-center gap-1.5 text-[10px] text-slate-500 pl-6.5 truncate">
                                <MapPin size={10} className="shrink-0 text-slate-400" /> 
                                <span className="truncate">{o.area}</span>
                              </div>
                            )}
                          </div>
                          
                          {/* Scan Progress Bar */}
                          <div className="space-y-1">
                            <div className="flex justify-between items-center text-[10px] font-bold">
                              <span className="text-slate-500">Progress</span>
                              <span className={isDone ? 'text-emerald-600 dark:text-emerald-400' : 'text-indigo-600 dark:text-indigo-400'}>{pct}%</span>
                            </div>
                            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full transition-all duration-500 ease-out ${isDone ? 'bg-emerald-500' : 'bg-gradient-to-r from-indigo-500 to-violet-500'}`} 
                                style={{ width: `${pct}%` }} 
                              />
                            </div>
                            <div className="flex justify-between text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                              <span>{packedCount} Scanned</span>
                              <span>{itemsCount} Total</span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Vibrant Action Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenPackingStation(o);
                          }}
                          className={`mt-2.5 w-full py-2 px-3 rounded-lg text-[11px] font-black transition-all flex items-center justify-center gap-1.5 shadow-md cursor-pointer active:scale-95 ${
                            isDone
                              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-600/20'
                              : 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-indigo-600/20'
                          }`}
                        >
                          <Scan size={13} />
                          <span>Open Station</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
                  <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-800/80 text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-bold">
                          <th className="p-3">Delivery Status</th>
                          <th className="p-3">Order Info</th>
                          <th className="p-3">Customer Info</th>
                          <th className="p-3">Progress</th>
                          <th className="p-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {dateOrders.map((o) => {
                          const customer = customers.find(c => c.id === o.customer_id);
                          const items = o.items || [];
                          const itemsCount = items.reduce((acc, it) => acc + (it.qty || 0), 0);
                          const packedCount = items.reduce((acc, it) => acc + (it.scanned_qty || 0), 0);
                          const pct = itemsCount > 0 ? Math.round((packedCount / itemsCount) * 100) : 0;
                          const isDone = itemsCount > 0 && pct === 100;
                          const dStatus = getDeliveryStatus(o.delivery_date);

                          return (
                            <tr 
                              key={o.id} 
                              onClick={() => handleOpenPackingStation(o)}
                              className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group cursor-pointer"
                            >
                              <td className="p-3">
                                <div className="flex items-center gap-2">
                                  <div className={`w-2.5 h-2.5 rounded-full ${dStatus.dot} flex-shrink-0 shadow-sm animate-pulse`}></div>
                                  <div className={`px-2.5 py-1 rounded-xl border flex items-center gap-2 shadow-sm ${dStatus.badge}`}>
                                    <Clock size={13} className={dStatus.icon} />
                                    <div className="flex flex-col">
                                      <span className="text-[8px] uppercase font-black leading-tight opacity-90 tracking-wider">
                                        {dStatus.statusText}
                                      </span>
                                      <span className="text-[10px] font-black">
                                        {formatDisplayDate(o.delivery_date) || formatDisplayDate(o.order_date) || 'N/A'}
                                      </span>
                                    </div>
                                    <span className={`ml-1 px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-tight ${dStatus.pillClass}`}>
                                      {dStatus.daysRemainingText}
                                    </span>
                                  </div>
                                </div>
                              </td>
                              <td className="p-3">
                                <div className="flex flex-col gap-1">
                                  <span className="text-sm font-black text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                    #{o.order_number}
                                  </span>
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] text-slate-500 font-bold">
                                      {formatDisplayDate(o.order_date)}
                                    </span>
                                    {o.total_amount && (
                                      <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-black">
                                        ₹{o.total_amount.toLocaleString()}
                                      </span>
                                    )}
                                  </div>
                                  <span className={`w-fit mt-1 px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase tracking-wider border ${
                                    isDone 
                                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700' 
                                      : o.status === 'Packing' 
                                      ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/80 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700' 
                                      : 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border-amber-300 dark:border-amber-700'
                                  }`}>
                                    {isDone ? 'Verified' : o.status}
                                  </span>
                                </div>
                              </td>
                          <td className="p-3">
                            <div className="flex flex-col gap-0.5 text-[11px]">
                              <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                                <User size={12} className="text-indigo-500 shrink-0" />
                                {customer ? customer.name : 'Walk-in Customer'}
                              </span>
                              {(customer?.phone || o.area) && (
                                <span className="text-slate-500 flex items-center gap-2.5 text-[10px]">
                                  {customer?.phone && <span className="flex items-center gap-1"><Phone size={10} /> {customer.phone}</span>}
                                  {o.area && <span className="flex items-center gap-1"><MapPin size={10} /> {o.area}</span>}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-3 min-w-[180px]">
                            <div className="flex items-center gap-2.5">
                              <div className="flex-1 space-y-1">
                                <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full rounded-full ${isDone ? 'bg-emerald-500' : 'bg-gradient-to-r from-indigo-500 to-violet-500'}`} 
                                    style={{ width: `${pct}%` }} 
                                  />
                                </div>
                                <div className="flex justify-between text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                                  <span>{packedCount} / {itemsCount} units</span>
                                </div>
                              </div>
                              <span className={`text-[11px] font-black w-9 text-right ${isDone ? 'text-emerald-600 dark:text-emerald-400' : 'text-indigo-600 dark:text-indigo-400'}`}>
                                {pct}%
                              </span>
                            </div>
                          </td>
                          <td className="p-3 text-right">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenPackingStation(o);
                              }}
                              className={`px-3 py-1.5 rounded-lg text-[11px] font-black transition-all inline-flex items-center gap-1.5 ml-auto shadow-sm cursor-pointer active:scale-95 ${
                                isDone
                                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                                  : 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-indigo-600/20'
                              }`}
                            >
                              <Scan size={13} />
                              <span>Open Station</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ))}
      
      {filteredQueue.length === 0 && (
        <div className="col-span-full bg-slate-50 dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 p-12 text-center text-slate-500 space-y-3">
          <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center justify-center mx-auto">
            <QrCode size={28} className="text-slate-400" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-slate-700 dark:text-slate-300 mb-1">No Pending Orders</h4>
            <p className="text-[11px] max-w-sm mx-auto text-slate-500">All sales orders are packed and verified! New pending sales orders will automatically appear in this queue.</p>
          </div>
        </div>
      )}
      </div>
    )}
    </div>
    {/* CAMERA SCANNER MODAL */}
      {isScannerOpen && (
        <BarcodeScanner 
          onClose={() => setIsScannerOpen(false)}
          onScan={(barcode) => {
            return processBarcodeScan(barcode);
          }}
        />
      )}
    </div>
  );
};
