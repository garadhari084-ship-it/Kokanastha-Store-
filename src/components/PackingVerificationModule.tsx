import { PageHeader } from './PageHeader';
import React, { useState, useEffect } from 'react';
import { 
  QrCode, 
  Scan, 
  Check, 
  X, 
  AlertCircle, 
  Printer, 
  ArrowRight, 
  Sparkles,
  ClipboardCheck,
  RotateCcw,
  Volume2
} from 'lucide-react';
import { Camera } from 'lucide-react';
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

  // Scanning flow states
  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(
    openOrderIdInitially ? dbStore.getSalesOrders(businessId).find(o => o.id === openOrderIdInitially) || null : null
  );
  const [barcodeInput, setBarcodeInput] = useState('');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [recentScanLog, setRecentScanLog] = useState<{ msg: string; success: boolean } | null>(null);
  
  // Audio state
  const [audioFeedback, setAudioFeedback] = useState(true);

  // Auto-refresh when pending orders change
  const reloadPending = () => {
    setPendingOrders(
      dbStore.getSalesOrders(businessId).filter(o => o.status === 'Pending' || o.status === 'Packing')
    );
    if (selectedOrder) {
      const refreshed = dbStore.getSalesOrders(businessId).find(o => o.id === selectedOrder.id);
      setSelectedOrder(refreshed || null);
    }
  };
  useEffect(() => {
    return dbStore.subscribe(() => {
      setProducts(dbStore.getProducts(businessId));
      setCustomers(dbStore.getCustomers(businessId));
    });
  }, [businessId]);


  const handleSelectOrder = (order: SalesOrder) => {
    setSelectedOrder(order);
    setBarcodeInput('');
    setRecentScanLog(null);
    dbStore.updateSalesOrder(order.id, { status: 'Packing' });
    reloadPending();
  };

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    if (!barcodeInput.trim()) return;

    try {
      const result = dbStore.verifyPackingBarcode(businessId, selectedOrder.id, barcodeInput.trim());
      
      if (!result.success) {
        throw new Error(result.error_message || 'Scan mismatch.');
      }

      setRecentScanLog({
        msg: `Successfully scanned item: ${result.product?.name} (Qty matched: ${result.scanned_qty}/${result.required_qty})`,
        success: true
      });

      if (audioFeedback) {
        triggerToast(`BEEP! Scanned: ${result.product?.name}`, 'success');
      }

      setBarcodeInput('');
      reloadPending();
    } catch (err: any) {
      setRecentScanLog({
        msg: err.message || 'Verification mismatch.',
        success: false
      });
      if (audioFeedback) {
        triggerToast(`MISM_BEEP! Error: ${err.message}`, 'error');
      }
    }
  };

  // Helper to trigger a mock barcode scanner click
  const handleQuickMockScan = (barcode: string) => {
    setBarcodeInput(barcode);
    setTimeout(() => {
      try {
        const result = dbStore.verifyPackingBarcode(businessId, selectedOrder!.id, barcode);
        if (!result.success) {
          throw new Error(result.error_message || 'Scan mismatch.');
        }
        setRecentScanLog({
          msg: `Simulated scan: ${result.product?.name} matches! (${result.scanned_qty}/${result.required_qty})`,
          success: true
        });
        triggerToast(`Mock Scanner Success: ${result.product?.name}`, 'success');
        setBarcodeInput('');
        reloadPending();
      } catch (err: any) {
        setRecentScanLog({
          msg: err.message,
          success: false
        });
        triggerToast(err.message, 'error');
      }
    }, 100);
  };

  const handleCompletePacking = () => {
    if (!selectedOrder) return;

    try {
      // Check if all items are fully scanned
      const allPacked = (selectedOrder.items || []).every(it => (it.scanned_qty || 0) === it.qty);
      if (!allPacked) {
        triggerToast('Cannot dispatch: Some items in the order have not been scan-verified yet.', 'error');
        return;
      }

      // Complete standard stock deductions triggers on status change
      dbStore.completePackingSession(
        businessId,
        selectedOrder.id,
        user.id,
        user.name,
        totalItemsCount,
        []
      );

      triggerToast(`Fulfillment Approved! Generating shipping label for ${selectedOrder.order_number}.`, 'success');
      setSelectedOrder(null);
      setRecentScanLog(null);
      reloadPending();
    } catch (e: any) {
      triggerToast(e.message || 'Dispatch failed.', 'error');
    }
  };

  const handleResetOrderScans = () => {
    if (!selectedOrder) return;
    if (window.confirm('Reset all scanned quantities back to 0 for this packing task?')) {
      dbStore.updateSalesOrder(selectedOrder.id, {
        items: (selectedOrder.items || []).map(it => ({ ...it, scanned_qty: 0 }))
      });
      triggerToast('Quantities reset.', 'info');
      reloadPending();
    }
  };

  // Calculate Packing stats
  const totalItemsCount = selectedOrder ? (selectedOrder.items || []).reduce((acc, it) => acc + it.qty, 0) : 0;
  const packedItemsCount = selectedOrder ? (selectedOrder.items || []).reduce((acc, it) => acc + (it.scanned_qty || 0), 0) : 0;
  const packingProgressPercent = totalItemsCount > 0 ? Math.round((packedItemsCount / totalItemsCount) * 100) : 0;

  return (
    <div className="space-y-6 max-w-full pb-12 px-0 font-sans text-slate-900 dark:text-slate-100 overflow-x-hidden" id="packing-verification-module">
      <PageHeader
        title="Barcode Packing Verification Station"
        subtitle="Scan sales order QR codes, verify unit barcodes, and enforce error-free dispatch checks."
        icon={ClipboardCheck}
        rightContent={
          <>
<div className="flex items-center gap-2">
          <button 
            onClick={() => setAudioFeedback(!audioFeedback)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold cursor-pointer border ${
              audioFeedback 
                ? 'bg-indigo-50 border-indigo-200 text-indigo-600' 
                : 'bg-slate-50 border-slate-200 text-slate-400'
            }`}
          >
            <Volume2 size={14} />
            <span>Scanner Beep {audioFeedback ? 'ON' : 'OFF'}</span>
          </button>
        </div>
          </>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Pending Packing Queue */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 shadow-xs">
            <h3 className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-3">Pending Fulfillment Queue</h3>
            
            <div className="space-y-2.5 max-h-[60vh] overflow-y-auto">
              {pendingOrders.map((o, idx) => {
                const customer = customers.find(c => c.id === o.customer_id);
                const itemsCount = (o.items || []).reduce((acc, it) => acc + (it.qty || 0), 0);
                const packedCount = (o.items || []).reduce((acc, it) => acc + (it.scanned_qty || 0), 0);
                const pct = Math.round((packedCount / itemsCount) * 100);

                return (
                  <div 
                    key={`${o.id}-${idx}`}
                    onClick={() => handleSelectOrder(o)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                      selectedOrder?.id === o.id 
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' 
                        : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <strong className="text-[11px] font-extrabold">{o.order_number}</strong>
                        <p className={`text-[11px] mt-0.5 ${selectedOrder?.id === o.id ? 'text-indigo-200' : 'text-slate-500'}`}>
                          {customer ? customer.name : 'Unknown customer'}
                        </p>
                      </div>
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                        selectedOrder?.id === o.id ? 'bg-indigo-700 text-white' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {o.status}
                      </span>
                    </div>

                    <div className="mt-3 space-y-1">
                      <div className="flex justify-between text-[10px]">
                        <span>Verified qty: {packedCount}/{itemsCount}</span>
                        <span>{pct}% packed</span>
                      </div>
                      <div className="w-full bg-black/10 dark:bg-white/10 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${selectedOrder?.id === o.id ? 'bg-white' : 'bg-indigo-600'}`} 
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}

              {pendingOrders.length === 0 && (
                <div className="text-center py-10 text-slate-400">
                  <Scan size={32} className="mx-auto text-slate-300 mb-2" />
                  <p className="text-[11px]">Perfect clean list! No orders are currently pending packing.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Active Packing Screen */}
        <div className="lg:col-span-2 space-y-4">
          {selectedOrder ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-xs overflow-x-auto overflow-y-hidden">
              
              {/* Order Overview banner */}
              <div className="p-5 bg-slate-950 text-white flex justify-between items-center">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">ACTIVE PACKING DESK</span>
                  <h2 className="text-xs font-bold mt-0.5">{selectedOrder.order_number}</h2>
                  <p className="text-[11px] text-slate-400 mt-0.5">Billed to: {customers.find(c => c.id === selectedOrder.customer_id)?.name}</p>
                </div>

                <div className="text-right space-y-1">
                  <strong className="text-base font-mono font-extrabold text-indigo-400 block">{packingProgressPercent}%</strong>
                  <span className="text-[10px] text-slate-400 block uppercase">Verifications Done</span>
                </div>
              </div>

              {/* Progress and resets */}
              <div className="px-6 py-4 bg-indigo-50 border-b border-indigo-100 flex items-center justify-between">
                <div className="w-2/3">
                  <div className="w-full bg-indigo-200 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-indigo-600 h-full transition-all" style={{ width: `${packingProgressPercent}%` }} />
                  </div>
                </div>
                <button 
                  onClick={handleResetOrderScans}
                  className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:underline cursor-pointer"
                >
                  <RotateCcw size={12} />
                  <span>Reset scan counts</span>
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Barcode scan simulation line */}
                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                  <h4 className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-1.5">
                    <Scan size={14} className="text-indigo-600 animate-pulse" />
                    <span>Scan Product Barcode</span>
                  </h4>

                  <form onSubmit={handleBarcodeSubmit} className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="Input SKU barcode (e.g. AM-1001, CO-1002)..."
                      value={barcodeInput}
                      onChange={(e) => setBarcodeInput(e.target.value)}
                      className="w-full px-3 py-2 bg-white text-[11px] rounded-lg border focus:ring-1 focus:ring-indigo-600 font-mono"
                    />
                    <button 
                      type="submit"
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[11px] font-semibold cursor-pointer shrink-0"
                    >
                      Process Scan
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsScannerOpen(true)}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 dark:bg-white dark:hover:bg-slate-200 text-white dark:text-slate-900 rounded-lg text-[11px] font-semibold cursor-pointer shrink-0 flex items-center gap-1.5"
                    >
                      <Camera size={14} />
                      Camera Scan
                    </button>
                  </form>

                  {recentScanLog && (
                    <div className={`p-2.5 rounded-lg flex items-start gap-2 text-[11px] border ${
                      recentScanLog.success 
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                        : 'bg-rose-50 border-rose-200 text-rose-800'
                    }`}>
                      {recentScanLog.success ? <Check size={14} className="mt-0.5" /> : <AlertCircle size={14} className="mt-0.5" />}
                      <span className="font-semibold">{recentScanLog.msg}</span>
                    </div>
                  )}
                </div>

                {/* Checklist Grid */}
                <div className="space-y-3">
                  <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Item Scan Verification Checklist</h4>
                  
                  <div className="border border-slate-100 dark:border-slate-800 rounded-xl overflow-x-auto">
                    <table className="w-full text-left text-[11px]">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-800 text-[10px] font-bold uppercase text-slate-400 border-b">
                          <th className="p-3">Product SKU</th>
                          <th className="p-3 text-center">Barcode</th>
                          <th className="p-3 text-right">Target Qty</th>
                          <th className="p-3 text-right">Scanned Qty</th>
                          <th className="p-3 text-center">Verification</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y font-medium text-slate-700 dark:text-slate-300">
                        {(selectedOrder.items || []).map((it, idx) => {
                          const p = products.find(prod => prod.id === it.product_id);
                          if (!p) return null;

                          const isCompleted = it.scanned_qty === it.qty;

                          return (
                            <tr key={idx} className={`hover:bg-slate-50/50 ${isCompleted ? 'bg-emerald-50/20' : ''}`}>
                              <td className="p-3">
                                <strong>{p.name}</strong>
                                <span className="text-[10px] text-slate-400 font-mono block">SKU: {p.sku}</span>
                              </td>
                              <td className="p-3 text-center">
                                <span className="font-mono text-[11px] text-indigo-600 bg-indigo-50/50 px-2 py-0.5 rounded font-bold">
                                  {p.barcode}
                                </span>
                              </td>
                              <td className="p-3 text-right font-mono font-bold text-xs">{it.qty}</td>
                              <td className={`p-3 text-right font-mono font-extrabold text-xs ${isCompleted ? 'text-emerald-600' : 'text-slate-800'}`}>
                                {it.scanned_qty}
                              </td>
                              <td className="p-3 text-center">
                                {isCompleted ? (
                                  <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                                    <Check size={12} /> OK
                                  </span>
                                ) : (
                                  <button 
                                    onClick={() => handleQuickMockScan(p.barcode)}
                                    className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-[10px] font-bold rounded-md cursor-pointer"
                                    title="Click to simulate physical barcode scan"
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

                {/* Bottom Trigger for Dispatch Slip */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                  {packingProgressPercent === 100 ? (
                    <button 
                      onClick={handleCompletePacking}
                      className="flex items-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold animate-bounce shadow-lg cursor-pointer"
                    >
                      <Sparkles size={16} />
                      <span>Complete Packing & Generate Dispatch Slip</span>
                      <ArrowRight size={16} />
                    </button>
                  ) : (
                    <p className="text-[11px] text-slate-400 italic font-medium flex items-center gap-1.5">
                      <AlertCircle size={14} className="text-amber-500 shrink-0" />
                      <span>Verify all barcode scan checkmarks to unlock shipping dispatch actions.</span>
                    </p>
                  )}
                </div>

              </div>
            </div>
          ) : (
            <div className="bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-700 rounded-2xl h-[65vh] flex flex-col items-center justify-center p-8 text-center text-slate-400">
              <QrCode size={56} className="text-slate-300 dark:text-slate-700 mb-3 animate-pulse" />
              <strong className="text-slate-700 dark:text-slate-300 font-bold text-xs">Packing Station is Offline</strong>
              <p className="text-[11px] max-w-sm mt-1">Select a pending sales order from the fulfillment queue on the left side to load verification lists.</p>
            </div>
          )}
        </div>
      </div>
      {isScannerOpen && (
        <BarcodeScanner 
          onClose={() => setIsScannerOpen(false)}
          onScan={(barcode) => {
            setBarcodeInput(barcode);
            setIsScannerOpen(false);
            handleQuickMockScan(barcode);
          }}
        />
      )}
    </div>
  );
};
