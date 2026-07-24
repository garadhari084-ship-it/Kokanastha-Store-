import React, { useState, useEffect, useRef } from 'react';
import { PageHeader } from './PageHeader';
import { 
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
  Navigation
} from 'lucide-react';
import { BarcodeScanner } from './BarcodeScanner';
import { dbStore } from '../services/store';
import { SalesOrder, Product, UserProfile, Customer } from '../types/erp';

interface PackingVerificationModuleProps {
  businessId: string;
  user: UserProfile;
  triggerToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  openOrderIdInitially?: string | null;
}

export const PackingVerificationModule: React.FC<PackingVerificationModuleProps> = ({
  businessId,
  user,
  triggerToast,
  openOrderIdInitially = null
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
    const activeId = selectedOrderRef.current?.id;
    if (activeId) {
      const refreshed = allSales.find(o => o.id === activeId);
      if (refreshed) {
        setSelectedOrder(refreshed);
      }
    }
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
      dbStore.updateSalesOrder(order.id, { status: 'Packing' });
    }
    reloadOrders();
  };

  // Exit packing station view back to order queue (keeping scanned items)
  const handleBackToQueue = () => {
    setSelectedOrder(null);
    setIsScannerOpen(false);
    setRecentScanLog(null);
    reloadOrders();
  };

  // Barcode Submission Handler
  const processBarcodeScan = (codeToVerify: string) => {
    if (!selectedOrder) return;
    const cleanCode = codeToVerify.trim();
    if (!cleanCode) return;

    try {
      const result = dbStore.verifyPackingBarcode(businessId, selectedOrder.id, cleanCode);
      
      if (!result.success) {
        throw new Error(result.error_message || 'Barcode scan failed or item mismatch.');
      }

      const prodName = result.product?.name || 'Item';
      const scanned = result.scanned_qty || 0;
      const total = result.required_qty || 0;
      const pending = Math.max(0, total - scanned);

      setRecentScanLog({
        msg: `Scanned: ${prodName} | ${scanned}/${total} Verified (${pending} Pending)`,
        success: true
      });

      if (audioFeedback) {
        triggerToast(`Scanned: ${prodName} (${scanned}/${total})`, 'success');
      }

      setBarcodeInput('');
      reloadOrders();
    } catch (err: any) {
      setRecentScanLog({
        msg: err.message || 'Scan error / product mismatch.',
        success: false
      });
      if (audioFeedback) {
        triggerToast(`Scan Error: ${err.message}`, 'error');
      }
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    processBarcodeScan(barcodeInput);
  };

  // Reset scans
  const handleResetOrderScans = () => {
    if (!selectedOrder) return;
    if (window.confirm(`Reset all scanned quantities back to 0 for Order #${selectedOrder.order_number}?`)) {
      dbStore.updateSalesOrder(selectedOrder.id, {
        items: (selectedOrder.items || []).map(it => ({ ...it, scanned_qty: 0 }))
      });
      triggerToast('All item scan counts reset to 0.', 'info');
      setRecentScanLog(null);
      reloadOrders();
    }
  };

  // Complete Packing & Assign Delivery
  const handleCompleteDispatch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedOrder) return;

    const items = selectedOrder.items || [];
    const allPacked = items.length > 0 && items.every(it => (it.scanned_qty || 0) === it.qty);

    if (!allPacked) {
      triggerToast('Cannot dispatch: Some items still have pending quantities.', 'error');
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
          notes: dispatchNotes
        }
      );

      if (!res.success) {
        throw new Error(res.error || 'Failed to complete dispatch.');
      }

      triggerToast(`Order #${selectedOrder.order_number} successfully packed & assigned to ${deliveryPartner}!`, 'success');
      setSelectedOrder(null);
      setRecentScanLog(null);
      reloadOrders();
    } catch (err: any) {
      triggerToast(err.message || 'Dispatch assignment failed.', 'error');
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
    <div className="space-y-6 max-w-full pb-16 px-0 font-sans text-slate-900 dark:text-slate-100 overflow-x-hidden" id="packing-verification-module">
      
      {/* SECTION 1: TOP PAGE HEADER */}
      <PageHeader
        title="Barcode Packing Verification Station"
        subtitle="Verify order items item-by-item with barcode scans and assign dispatch delivery partners."
        icon={ClipboardCheck}
        rightContent={
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setAudioFeedback(!audioFeedback)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer border transition-colors ${
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

      {/* ========================================================================= */}
      {/* PAGE VIEW A: DEDICATED PACKING STATION FOR A SELECTED ORDER               */}
      {/* ========================================================================= */}
      {selectedOrder ? (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-200">
          
          {/* Top Bar with Back Button */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <button
              onClick={handleBackToQueue}
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              <ArrowLeft size={16} />
              <span>Back to Orders Queue</span>
            </button>

            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500 font-medium hidden sm:inline">
                Data saved automatically as you scan
              </span>
              <button 
                onClick={handleResetOrderScans}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-900/20 dark:hover:bg-rose-900/40 dark:text-rose-400 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                <RotateCcw size={14} />
                <span>Reset Scans</span>
              </button>
            </div>
          </div>

          {/* Active Order Overview Banner */}
          <div className="bg-slate-950 text-white rounded-2xl p-6 shadow-xl border border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            <div className="md:col-span-2 space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 bg-indigo-500/20 text-indigo-300 rounded-md text-[10px] font-bold font-mono tracking-wider uppercase border border-indigo-500/30">
                  PACKING DESK #1
                </span>
                <span className="px-2.5 py-1 bg-slate-800 text-slate-300 rounded-md text-[10px] font-bold uppercase">
                  Status: {selectedOrder.status}
                </span>
              </div>
              <h2 className="text-xl font-extrabold tracking-tight flex items-center gap-2 text-white">
                <span>Order #{selectedOrder.order_number}</span>
              </h2>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-300">
                <p className="flex items-center gap-1">
                  <User size={13} className="text-slate-400" />
                  <span className="font-semibold text-white">
                    {customers.find(c => c.id === selectedOrder.customer_id)?.name || 'Walk-in Customer'}
                  </span>
                </p>
                {selectedOrder.area && (
                  <p className="flex items-center gap-1 text-slate-400">
                    <MapPin size={13} />
                    <span>Area: {selectedOrder.area}</span>
                  </p>
                )}
                {selectedOrder.channel && (
                  <p className="flex items-center gap-1 text-slate-400">
                    <Building2 size={13} />
                    <span>Channel: {selectedOrder.channel}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Verification Progress Box */}
            <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl flex flex-col justify-between">
              <div className="flex justify-between items-baseline mb-2">
                <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">Verification Progress</span>
                <span className="text-2xl font-mono font-black text-indigo-400">{packingProgressPercent}%</span>
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
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Scan size={16} className="text-indigo-600 animate-pulse" />
                <span>Barcode / SKU Input Console</span>
              </h3>
              <button
                onClick={() => setIsScannerOpen(true)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer flex items-center gap-2 shadow-md shadow-indigo-600/20 transition-all"
              >
                <Camera size={16} />
                <span>Open Back Camera Scanner</span>
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="flex gap-2">
              <div className="relative flex-1">
                <input 
                  ref={barcodeInputRef}
                  type="text" 
                  placeholder="Scan or type barcode / SKU / product name (e.g. AM-1001)..."
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  className="w-full pl-3 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-mono font-bold rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-600"
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
              <button 
                type="submit"
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white dark:text-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer shrink-0 transition-all"
              >
                Verify Item
              </button>
            </form>

            {/* Scan Feedback Banner */}
            {recentScanLog && (
              <div className={`p-3 rounded-xl flex items-center gap-2.5 text-xs font-semibold border ${
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
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
              <h3 className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <PackageCheck size={16} className="text-indigo-600" />
                <span>Order Items Verification List ({selectedItems.length} Products)</span>
              </h3>
              <span className="text-xs text-slate-500 font-medium">
                Click "Simulate Scan" for manual verification
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-100/70 dark:bg-slate-800/80 text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                    <th className="py-3 px-4">Product Details</th>
                    <th className="py-3 px-4 text-center">Barcode / SKU</th>
                    <th className="py-3 px-4 text-center">Total Qty</th>
                    <th className="py-3 px-4 text-center">Scanned Qty</th>
                    <th className="py-3 px-4 text-center">Pending Qty</th>
                    <th className="py-3 px-4 text-center">Status / Progress</th>
                    <th className="py-3 px-4 text-right">Action</th>
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
                          <strong className="text-slate-900 dark:text-slate-100 font-bold block text-sm">
                            {p ? p.name : 'Unknown Product'}
                          </strong>
                          <span className="text-[11px] text-slate-400 font-mono">Category: {p?.category || 'General'}</span>
                        </td>
                        
                        <td className="py-3.5 px-4 text-center">
                          <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2.5 py-1 rounded-md border border-indigo-100 dark:border-indigo-900">
                            {p?.barcode || p?.sku || 'N/A'}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-center font-mono font-extrabold text-sm text-slate-900 dark:text-slate-100">
                          {totalNeeded}
                        </td>

                        <td className="py-3.5 px-4 text-center font-mono font-extrabold text-sm text-emerald-600 dark:text-emerald-400">
                          {scanned}
                        </td>

                        <td className={`py-3.5 px-4 text-center font-mono font-extrabold text-sm ${pending > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'}`}>
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

                        <td className="py-3.5 px-4 text-right">
                          {!isItemDone && p && (
                            <button
                              onClick={() => processBarcodeScan(p.barcode || p.sku)}
                              className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                            >
                              Simulate Scan
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* DISPATCH & DELIVERY PARTNER ASSIGNMENT PANEL (UNLOCKED WHEN 100% VERIFIED) */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${isFullyVerified ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                  <Truck size={22} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Delivery Partner & Dispatch Assignment</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {isFullyVerified 
                      ? 'All items verified! Select delivery service (Rapido, Dunzo, Courier, Agent, etc.) to dispatch.' 
                      : 'Complete scanning all item checkmarks above to unlock delivery dispatch options.'}
                  </p>
                </div>
              </div>

              {isFullyVerified ? (
                <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-xs font-extrabold rounded-full flex items-center gap-1">
                  <Sparkles size={14} /> Ready to Dispatch
                </span>
              ) : (
                <span className="px-3 py-1 bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 text-xs font-extrabold rounded-full flex items-center gap-1">
                  <AlertCircle size={14} /> {pendingItemsCount} Units Pending Scan
                </span>
              )}
            </div>

            <form onSubmit={handleCompleteDispatch} className="space-y-5">
              {/* Delivery Partner Selection Cards */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                  Select Delivery Mode / Partner
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
                  {[
                    { id: 'Rapido', label: 'Rapido', desc: 'Bike Express' },
                    { id: 'Dunzo / Swiggy', label: 'Dunzo / Swiggy', desc: 'Hyperlocal' },
                    { id: 'Porter', label: 'Porter', desc: 'Local Driver' },
                    { id: 'Courier Logistics', label: 'Courier', desc: 'BlueDart/Delhivery' },
                    { id: 'In-House Agent', label: 'In-House Exec', desc: 'Company Driver' },
                    { id: 'Customer Pickup', label: 'Self Pickup', desc: 'Store Counter' }
                  ].map((mode) => (
                    <button
                      key={mode.id}
                      type="button"
                      disabled={!isFullyVerified}
                      onClick={() => setDeliveryPartner(mode.id)}
                      className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                        deliveryPartner === mode.id && isFullyVerified
                          ? 'bg-indigo-600 border-indigo-600 text-white shadow-md'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-100'
                      } ${!isFullyVerified ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <strong className="text-xs font-extrabold block">{mode.label}</strong>
                      <span className={`text-[10px] mt-1 ${deliveryPartner === mode.id && isFullyVerified ? 'text-indigo-200' : 'text-slate-400'}`}>
                        {mode.desc}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Delivery Driver / Tracking Details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
                    <User size={13} /> Driver / Exec Name
                  </label>
                  <input 
                    type="text" 
                    disabled={!isFullyVerified}
                    placeholder="e.g. Rahul Sharma"
                    value={personName}
                    onChange={(e) => setPersonName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 text-xs rounded-xl border border-slate-200 dark:border-slate-700 font-medium disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
                    <Phone size={13} /> Driver Contact Number
                  </label>
                  <input 
                    type="text" 
                    disabled={!isFullyVerified}
                    placeholder="e.g. +91 9876543210"
                    value={personPhone}
                    onChange={(e) => setPersonPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 text-xs rounded-xl border border-slate-200 dark:border-slate-700 font-medium disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
                    <Navigation size={13} /> Tracking / Waybill Number
                  </label>
                  <input 
                    type="text" 
                    disabled={!isFullyVerified}
                    placeholder="e.g. RAP-99214 or AWB-1002"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 text-xs rounded-xl border border-slate-200 dark:border-slate-700 font-medium disabled:opacity-50"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
                  <FileText size={13} /> Dispatch Notes / Special Instructions
                </label>
                <input 
                  type="text" 
                  disabled={!isFullyVerified}
                  placeholder="e.g. Handle fragile bakery box with care, call customer before arriving..."
                  value={dispatchNotes}
                  onChange={(e) => setDispatchNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 text-xs rounded-xl border border-slate-200 dark:border-slate-700 font-medium disabled:opacity-50"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={handleBackToQueue}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Save Progress & Exit
                </button>

                {isFullyVerified ? (
                  <button
                    type="submit"
                    className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-extrabold shadow-lg shadow-emerald-600/30 flex items-center gap-2 cursor-pointer transition-all animate-bounce"
                  >
                    <Sparkles size={18} />
                    <span>Confirm Dispatch & Assign ({deliveryPartner})</span>
                    <ArrowRight size={18} />
                  </button>
                ) : (
                  <div className="text-xs text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1.5">
                    <AlertCircle size={16} />
                    <span>Verify remaining {pendingItemsCount} units to enable dispatch.</span>
                  </div>
                )}
              </div>
            </form>
          </div>

        </div>
      ) : (

        /* ========================================================================= */
        /* PAGE VIEW B: ORDERS QUEUE LIST (PENDING FULFILLMENT LIST)                 */
        /* ========================================================================= */
        <div className="space-y-6">
          
          {/* Header Controls & Search Bar */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search orders, customers, area..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-600"
              />
            </div>

            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-lg font-bold">
                {pendingOrders.length} Pending Orders
              </span>
            </div>
          </div>

          {/* Orders Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredQueue.map((o) => {
              const customer = customers.find(c => c.id === o.customer_id);
              const items = o.items || [];
              const itemsCount = items.reduce((acc, it) => acc + (it.qty || 0), 0);
              const packedCount = items.reduce((acc, it) => acc + (it.scanned_qty || 0), 0);
              const pendingCount = Math.max(0, itemsCount - packedCount);
              const pct = itemsCount > 0 ? Math.round((packedCount / itemsCount) * 100) : 0;
              const isDone = itemsCount > 0 && pct === 100;

              return (
                <div 
                  key={o.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 font-mono block">ORDER NUMBER</span>
                        <strong className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                          #{o.order_number}
                        </strong>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold font-mono ${
                        isDone 
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' 
                          : o.status === 'Packing' 
                          ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300' 
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                      }`}>
                        {isDone ? 'VERIFIED' : o.status.toUpperCase()}
                      </span>
                    </div>

                    <div className="text-xs space-y-1 text-slate-600 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-3">
                      <p className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <User size={14} className="text-indigo-600" />
                        <span>{customer ? customer.name : 'Walk-in Customer'}</span>
                      </p>
                      {customer?.phone && (
                        <p className="text-[11px] text-slate-400 pl-5">{customer.phone}</p>
                      )}
                      {o.area && (
                        <p className="text-[11px] text-slate-500 pl-5 flex items-center gap-1">
                          <MapPin size={11} /> Area: {o.area}
                        </p>
                      )}
                    </div>

                    {/* Progress details */}
                    <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800 space-y-2">
                      <div className="flex justify-between items-center text-xs font-bold font-mono">
                        <span className="text-slate-500">Items Scan Progress</span>
                        <span className={isDone ? 'text-emerald-600' : 'text-indigo-600'}>{pct}%</span>
                      </div>

                      <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${isDone ? 'bg-emerald-500' : 'bg-indigo-600'}`} 
                          style={{ width: `${pct}%` }} 
                        />
                      </div>

                      <div className="flex justify-between text-[11px] font-semibold text-slate-500 pt-0.5">
                        <span>{packedCount} Scanned</span>
                        <span className={pendingCount > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'}>
                          {pendingCount} Pending
                        </span>
                        <span>{itemsCount} Total</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleOpenPackingStation(o)}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors flex items-center justify-center gap-2 shadow-md shadow-indigo-600/20"
                  >
                    <Scan size={15} />
                    <span>Open Packing Station Page</span>
                  </button>
                </div>
              );
            })}

            {filteredQueue.length === 0 && (
              <div className="col-span-full bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-12 text-center text-slate-400 space-y-3">
                <QrCode size={48} className="mx-auto text-slate-300 dark:text-slate-700" />
                <h4 className="font-bold text-sm text-slate-700 dark:text-slate-300">No Pending Orders to Pack</h4>
                <p className="text-xs max-w-sm mx-auto">All sales orders are packed and verified! New pending sales orders will automatically appear in this queue.</p>
              </div>
            )}
          </div>

        </div>
      )}

      {/* CAMERA SCANNER MODAL */}
      {isScannerOpen && (
        <BarcodeScanner 
          onClose={() => setIsScannerOpen(false)}
          onScan={(barcode) => {
            setIsScannerOpen(false);
            processBarcodeScan(barcode);
          }}
        />
      )}

    </div>
  );
};
