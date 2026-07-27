import React, { useState, useEffect, useRef } from 'react';
import { PageHeader } from './PageHeader';
import { 
  Bike, 
  Store, 
  QrCode, 
  Scan, 
  Check, 
  X, 
  AlertCircle, 
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
  MapPin,
  Building2,
  Navigation,
  LayoutGrid,
  List
} from 'lucide-react';
import { BarcodeScanner } from './BarcodeScanner';
import { dbStore } from '../services/store';
import { SalesOrder, Product, UserProfile, Customer } from '../types/erp';

interface PackingVerificationModuleProps {
  businessId: string;
  user: UserProfile;
  triggerToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  openOrderIdInitially?: string | null;
  onNavigate?: (view: string, data?: any) => void;
}

export const PackingVerificationModule: React.FC<PackingVerificationModuleProps> = ({
  businessId,
  user,
  triggerToast,
  openOrderIdInitially = null,
  onNavigate
}) => {
  const [pendingOrders, setPendingOrders] = useState<SalesOrder[]>(
    dbStore.getSalesOrders(businessId).filter(o => o.status === 'Pending' || o.status === 'Packing')
  );
  const [products, setProducts] = useState<Product[]>(dbStore.getProducts(businessId));
  const [customers, setCustomers] = useState<Customer[]>(dbStore.getCustomers(businessId));

  // Active view & search states
  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(
    openOrderIdInitially ? dbStore.getSalesOrders(businessId).find(o => o.id === openOrderIdInitially) || null : null
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

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

  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const selectedOrderRef = useRef<SalesOrder | null>(selectedOrder);

  useEffect(() => {
    selectedOrderRef.current = selectedOrder;
  }, [selectedOrder]);

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
      if (refreshed && (refreshed.status === 'Pending' || refreshed.status === 'Packing')) {
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
  const processBarcodeScan = (codeToVerify: string): { success: boolean; message: string; scanned?: number; total?: number } => {
    if (!selectedOrder) {
      return { success: false, message: 'No order selected.' };
    }
    const cleanCode = codeToVerify.trim();
    if (!cleanCode) {
      return { success: false, message: 'Empty barcode.' };
    }

    try {
      const result = dbStore.verifyPackingBarcode(businessId, selectedOrder.id, cleanCode);
      
      if (!result.success) {
        throw new Error(result.error_message || 'Barcode scan failed or item mismatch.');
      }

      const prodName = result.product?.name || 'Item';
      const scanned = result.scanned_qty || 0;
      const total = result.required_qty || 0;
      const pending = Math.max(0, total - scanned);

      const msg = `Scanned: ${prodName} | ${scanned}/${total} Verified (${pending} Pending)`;

      setRecentScanLog({
        msg,
        success: true
      });

      if (audioFeedback) {
        triggerToast(`Scanned: ${prodName} (${scanned}/${total})`, 'success');
      }

      setBarcodeInput('');
      reloadOrders();

      return {
        success: true,
        message: `${prodName}: ${scanned}/${total} Verified`,
        scanned,
        total
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
        message: errMsg
      };
    }
  };

  // Helper to scan all remaining pending units for a specific item in 1 click
  const handleScanAllForProduct = (barcodeOrSku: string, pendingQty: number) => {
    for (let i = 0; i < pendingQty; i++) {
      processBarcodeScan(barcodeOrSku);
    }
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
        []
      );

      if (!res.success) {
        throw new Error(res.error || 'Failed to complete packing.');
      }

      triggerToast(`Order #${selectedOrder.order_number} verified & marked as Packed! Moved to Ready to Dispatch.`, 'success');
      setSelectedOrder(null);
      setRecentScanLog(null);
      reloadOrders();
      if (onNavigate) {
        onNavigate('delivery');
      }
    } catch (err: any) {
      triggerToast(err.message || 'Packing completion failed.', 'error');
    }
  };

  // Calculations for current selected order
  const selectedItems = selectedOrder?.items || [];
  const totalItemsCount = selectedItems.reduce((acc, it) => acc + (it.qty || 0), 0);
  const packedItemsCount = selectedItems.reduce((acc, it) => acc + (it.scanned_qty || 0), 0);
  const pendingItemsCount = Math.max(0, totalItemsCount - packedItemsCount);
  const packingProgressPercent = totalItemsCount > 0 ? Math.round((packedItemsCount / totalItemsCount) * 100) : 0;
  const isFullyVerified = totalItemsCount > 0 && packingProgressPercent === 100;

  // Filter queue orders
  const filteredQueue = pendingOrders.filter(o => {
    const cust = customers.find(c => c.id === o.customer_id);
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      o.order_number.toLowerCase().includes(q) ||
      (cust && cust.name.toLowerCase().includes(q)) ||
      (cust && cust.phone?.toLowerCase().includes(q)) ||
      (o.area && o.area.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-3 max-w-full pb-16 px-0 font-sans text-slate-900 dark:text-slate-100 overflow-x-hidden" id="packing-verification-module">
      
      {/* SECTION 1: TOP PAGE HEADER */}
      <PageHeader
        title="Barcode Packing Verification Station"
        subtitle="Verify order items item-by-item with barcode scans and assign dispatch delivery partners."
        icon={ClipboardCheck}
        rightContent={
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setAudioFeedback(!audioFeedback)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold cursor-pointer border transition-colors ${
                audioFeedback 
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-600 dark:bg-indigo-900/30 dark:border-indigo-800 dark:text-indigo-400' 
                  : 'bg-slate-50 border-slate-200 text-slate-400 dark:bg-slate-800 dark:border-slate-700'
              }`}
            >
              <Volume2 size={15} />
              <span>Sound Beep {audioFeedback ? 'ON' : 'OFF'}</span>
            </button>
          </div>
        }
      />

      <div className="px-0.5 sm:px-1 space-y-3">
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
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* PACKING VERIFICATION ACTION FOOTER */}
          <div className={`bg-white dark:bg-slate-900 rounded-3xl border p-4 shadow-sm transition-all duration-300 ${isFullyVerified ? 'border-emerald-500/50 shadow-emerald-500/10' : 'border-slate-200 dark:border-slate-800'}`}>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3 text-left w-full sm:w-auto">
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${isFullyVerified ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400'}`}>
                  {isFullyVerified ? <CheckCircle2 size={22} /> : <AlertCircle size={22} />}
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900 dark:text-white">
                    {isFullyVerified ? 'Packing Verification 100% Complete!' : `Verification In Progress (${packingProgressPercent}%)`}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {isFullyVerified 
                      ? `All ${totalItemsCount} units scanned and verified. Ready to move to Delivery & Dispatch.`
                      : `${pendingItemsCount} unit${pendingItemsCount > 1 ? 's' : ''} remaining to scan & verify.`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={handleBackToQueue}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
                >
                  Save & Back to Queue
                </button>

                {isFullyVerified ? (
                  <button
                    type="button"
                    onClick={handleCompleteDispatch}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black shadow-md shadow-emerald-600/20 flex items-center gap-2 cursor-pointer transition-all active:scale-95"
                  >
                    <Sparkles size={16} />
                    <span>Complete Packing & Move to Ready to Dispatch</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      // Scan remaining units all at once
                      (selectedOrder?.items || []).forEach(item => {
                        const rem = (item.qty || 0) - (item.scanned_qty || 0);
                        if (rem > 0) {
                          handleScanAllForProduct(item.barcode || item.sku, rem);
                        }
                      });
                    }}
                    className="px-4 py-2.5 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 text-xs font-bold rounded-xl border border-indigo-200 dark:border-indigo-800 transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <CheckCircle2 size={15} />
                    <span>Quick Verify All ({pendingItemsCount})</span>
                  </button>
                )}
              </div>
            </div>
          </div>

        </div>
      ) : (

        /* ========================================================================= */
        /* PAGE VIEW B: ORDERS QUEUE LIST (PENDING FULFILLMENT LIST)                 */
        /* ========================================================================= */
        <div className="space-y-3">
          
          {/* Header Controls & Search Bar */}
          <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-row flex-wrap items-center justify-between gap-3.5">
            <div className="relative w-full md:w-96">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search orders, customers, area..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 text-[11px] font-medium rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder:text-slate-400"
              />
            </div>
            
            <div className="flex items-center gap-2.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm ring-1 ring-slate-200 dark:ring-slate-600' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
                  title="Grid View"
                >
                  <LayoutGrid size={16} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm ring-1 ring-slate-200 dark:ring-slate-600' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
                  title="List View"
                >
                  <List size={16} />
                </button>
              </div>
              <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800/50 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700">
                <PackageCheck size={14} className="text-indigo-500" />
                <span className="text-slate-700 dark:text-slate-300">
                  {pendingOrders.length} Pending
                </span>
              </div>
            </div>
          </div>

          {/* Orders Display */}
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-3.5">
              {filteredQueue.map((o) => {
                const customer = customers.find(c => c.id === o.customer_id);
                const items = o.items || [];
                const itemsCount = items.reduce((acc, it) => acc + (it.qty || 0), 0);
                const packedCount = items.reduce((acc, it) => acc + (it.scanned_qty || 0), 0);
                const pct = itemsCount > 0 ? Math.round((packedCount / itemsCount) * 100) : 0;
                const isDone = itemsCount > 0 && pct === 100;
                
                return (
                  <div 
                    key={o.id}
                    onClick={() => handleOpenPackingStation(o)}
                    className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-2.5 sm:p-3 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group hover:border-indigo-500/50 cursor-pointer relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-indigo-500/10 via-indigo-500/5 to-transparent rounded-bl-full pointer-events-none"></div>
                    
                    <div className="space-y-2 relative z-10">
                      {/* Header: Order Ref & Status Pill */}
                      <div className="flex justify-between items-start gap-1">
                        <div className="min-w-0">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block leading-none mb-0.5">Order Ref</span>
                          <strong className="text-xs sm:text-sm font-black text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate block">
                            #{o.order_number}
                          </strong>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider shrink-0 border ${
                          isDone 
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700' 
                            : o.status === 'Packing' 
                            ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/80 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700 animate-pulse' 
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border-amber-300 dark:border-amber-700'
                        }`}>
                          {isDone ? 'Verified' : o.status}
                        </span>
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
                      <th className="p-3">Order Details</th>
                      <th className="p-3">Customer Info</th>
                      <th className="p-3">Progress</th>
                      <th className="p-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredQueue.map((o) => {
                      const customer = customers.find(c => c.id === o.customer_id);
                      const items = o.items || [];
                      const itemsCount = items.reduce((acc, it) => acc + (it.qty || 0), 0);
                      const packedCount = items.reduce((acc, it) => acc + (it.scanned_qty || 0), 0);
                      const pct = itemsCount > 0 ? Math.round((packedCount / itemsCount) * 100) : 0;
                      const isDone = itemsCount > 0 && pct === 100;

                      return (
                        <tr 
                          key={o.id} 
                          onClick={() => handleOpenPackingStation(o)}
                          className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group cursor-pointer"
                        >
                          <td className="p-3">
                            <div className="flex flex-col gap-1">
                              <span className="text-sm font-black text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                #{o.order_number}
                              </span>
                              <span className={`w-fit px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase tracking-wider border ${
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
      </div>{/* CAMERA SCANNER MODAL */}
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
