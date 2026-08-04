import { PageHeader } from './PageHeader';
import React, { useEffect, useState } from 'react';
import { 
  PlusCircle, 
  Search, 
  ArrowUpRight, 
  ArrowDownLeft, 
  AlertTriangle, 
  TrendingDown, 
  FileSpreadsheet, 
  History, 
  X,
  RefreshCw,
  ClipboardList
} from 'lucide-react';
import { dbStore } from '../services/store';
import { Product, StockLog, UserProfile } from '../types/erp';

interface InventoryModuleProps {
  businessId: string;
  user: UserProfile;
  triggerToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  openInwardModalInitially?: boolean;
  autoProductId?: string | null;
}

export const InventoryModule: React.FC<InventoryModuleProps> = ({ 
  businessId, 
  user, 
  triggerToast,
  openInwardModalInitially = false,
  autoProductId = null
}) => {
  const [products, setProducts] = useState<Product[]>(dbStore.getProducts(businessId));
  const [stockLogs, setStockLogs] = useState<StockLog[]>(dbStore.getStockLogs(businessId));
  const [searchQuery, setSearchQuery] = useState('');
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(openInwardModalInitially);

  // Adjustment Form States
  const [selectedProductId, setSelectedProductId] = useState<string>(autoProductId || products[0]?.id || '');
  const [adjustQty, setAdjustQty] = useState<number>(10);
  const [adjustType, setAdjustType] = useState<StockLog['type']>('In');
  const [adjustNotes, setAdjustNotes] = useState<string>('');
  useEffect(() => {
    return dbStore.subscribe(() => {
      setProducts(dbStore.getProducts(businessId));
      setStockLogs(dbStore.getStockLogs(businessId));
    });
  }, [businessId]);


  const handleCreateAdjustment = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedProductId) {
      triggerToast('Please select a valid product to adjust.', 'error');
      return;
    }

    if (adjustQty <= 0) {
      triggerToast('Quantity must be greater than zero.', 'error');
      return;
    }

    // Negative mapping for Out/Damage/Transfer to represent actual deduction
    const finalQty = (adjustType === 'In' || adjustType === 'Return') ? adjustQty : -adjustQty;

    const prod = products.find(p => p.id === selectedProductId);
    if (!prod) return;

    if (finalQty < 0 && prod.current_stock + finalQty < 0) {
      triggerToast(`Insufficient Stock! "${prod.name}" has only ${prod.current_stock} units left. Cannot deduct ${adjustQty}.`, 'error');
      return;
    }

    try {
      dbStore.addStockLog(
        selectedProductId,
        finalQty,
        adjustType,
        adjustNotes.trim() || `Manual inventory movement: ${adjustType}`,
        user.id,
        businessId
      );

      dbStore.logActivity(
        user.id,
        user.name,
        user.role,
        'Stock Change',
        `Adjusted stock for ${prod.name}: ${finalQty > 0 ? '+' : ''}${finalQty} (${adjustType})`,
        businessId
      );

      triggerToast(`Inventory stock adjusted successfully.`, 'success');
      setProducts(dbStore.getProducts(businessId));
      setStockLogs(dbStore.getStockLogs(businessId));
      setIsAdjustModalOpen(false);
      setAdjustNotes('');
      setAdjustQty(10);
    } catch (err: any) {
      triggerToast(err.message || 'Error occurred.', 'error');
    }
  };

  // Stock Valuation Calculation (FIFO standard representation)
  // Calculates asset value at average cost or FIFO levels
  const totalValuation = products.reduce((acc, p) => acc + (p.current_stock * p.purchase_price), 0);
  const totalRetailValuation = products.reduce((acc, p) => acc + (p.current_stock * p.selling_price), 0);

  const filteredLogs = stockLogs.filter(log => {
    const p = products.find(prod => prod.id === log.product_id);
    if (!p) return false;
    return p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.sku.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="space-y-4 max-w-full pb-8 px-0 font-sans text-slate-900 dark:text-slate-100 overflow-x-hidden" id="inventory-module-root">
      {/* Page Header */}
      <PageHeader
        title="Inventory Ledger & Stock Adjustment"
        subtitle="Record stock-ins, transfers, damages, and audit stock history ledgers."
        icon={ClipboardList}
        rightContent={
          <div className="flex items-center gap-2">
            {user.role !== 'Viewer' && (
              <button 
                onClick={() => {
                  if (autoProductId) setSelectedProductId(autoProductId);
                  setIsAdjustModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white rounded-xl text-[10px] sm:text-[11px] font-bold cursor-pointer shadow-md transition-all whitespace-nowrap border border-indigo-400/30"
              >
                <PlusCircle size={14} />
                <span>Inward / Adjust Stock</span>
              </button>
            )}
          </div>
        }
      />

      <div className="px-0.5 sm:px-1 space-y-4">
      {/* Valuation Panels Trailing */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-2 sm:p-3 rounded-xl shadow-xs hover:shadow-md hover:border-slate-400 dark:hover:border-slate-600 transition-all cursor-default group flex flex-col justify-between gap-1">
          <div className="flex items-center gap-1.5">
            <div className="p-1.5 bg-slate-500/10 dark:bg-slate-500/20 text-slate-600 dark:text-slate-400 rounded-lg group-hover:scale-110 transition-transform shrink-0">
              <FileSpreadsheet size={14} />
            </div>
            <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">ASSET VALUATION</span>
          </div>
          <div className="text-right mt-1">
            <span className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
              ₹{totalValuation.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-2 sm:p-3 rounded-xl shadow-xs hover:shadow-md hover:border-indigo-400 dark:hover:border-indigo-600 transition-all cursor-default group flex flex-col justify-between gap-1">
          <div className="flex items-center gap-1.5">
            <div className="p-1.5 bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-lg group-hover:scale-110 transition-transform shrink-0">
              <ArrowUpRight size={14} />
            </div>
            <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">SALES REVENUE</span>
          </div>
          <div className="text-right mt-1">
            <span className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
              ₹{totalRetailValuation.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-2 sm:p-3 rounded-xl shadow-xs hover:shadow-md hover:border-emerald-400 dark:hover:border-emerald-600 transition-all cursor-default group flex flex-col justify-between gap-1">
          <div className="flex items-center gap-1.5">
            <div className="p-1.5 bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-lg group-hover:scale-110 transition-transform shrink-0">
              <TrendingDown size={14} />
            </div>
            <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">PROFIT MARGIN</span>
          </div>
          <div className="text-right mt-1">
            <span className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
              ₹{(totalRetailValuation - totalValuation).toLocaleString()}
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-2 sm:p-3 rounded-xl shadow-xs hover:shadow-md hover:border-rose-400 dark:hover:border-rose-600 transition-all cursor-default group flex flex-col justify-between gap-1">
          <div className="flex items-center gap-1.5">
            <div className="p-1.5 bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 rounded-lg group-hover:scale-110 transition-transform shrink-0">
              <AlertTriangle size={14} />
            </div>
            <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">LOW STOCK ALERTS</span>
          </div>
          <div className="text-right mt-1">
            <span className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
              {products.filter(p => p.current_stock < 10).length}
            </span>
          </div>
        </div>
      </div>

      {/* Main Ledger Table view */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-black dark:border-white shadow-sm mt-5 overflow-x-auto overflow-y-hidden">
        <div className="px-3 py-2 border-b border-black dark:border-white flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-50 dark:bg-slate-800/50">
          <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <History size={16} />
            <span>Stock Transaction Ledger</span>
          </h3>
          <div className="relative w-full md:w-[280px]">
            <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search ledger by product..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-slate-900 text-[11px] rounded-full border border-slate-300 dark:border-slate-700 focus:outline-hidden"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-[11px]">
            <thead>
              <tr className="bg-slate-700 dark:bg-slate-600 text-white font-bold uppercase tracking-wider border-b border-black dark:border-white text-[11px]">
                <th className="py-2.5 px-4">Timestamp</th>
                <th className="py-2.5 px-4">Product Details</th>
                <th className="py-2.5 px-4">Transaction Type</th>
                <th className="py-2.5 px-4">Change Qty</th>
                <th className="py-2.5 px-4">Remarks / Audit Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black dark:divide-white bg-white dark:bg-slate-900 text-[11px]">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12">
                    <div className="flex flex-col items-center justify-center text-slate-500 dark:text-slate-400">
                      <History size={24} className="mb-2 opacity-50" />
                      <p className="font-bold text-xs">No transactions found.</p>
                      <p className="text-[10px]">No records match your filters.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log, idx) => {
                  const p = products.find(prod => prod.id === log.product_id);
                  if (!p) return null;

                  const isAddition = log.change_qty > 0;
                  const logDate = new Date(log.created_at);

                  return (
                    <tr key={`${log.id}-${idx}`} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-2.5 px-4 font-black text-slate-900 dark:text-white">
                        <div className="flex flex-col">
                          <span>{logDate.toLocaleDateString()}</span>
                          <span className="text-[9px] text-slate-500">{logDate.toLocaleTimeString()}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-800 dark:text-slate-200">{p.name}</span>
                          <span className="text-[9px] text-slate-500 font-mono tracking-widest text-indigo-500/70">{p.sku}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                          log.type === 'In' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          log.type === 'Adjustment' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                          log.type === 'Damage' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                          log.type === 'Return' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                          'bg-slate-100 text-slate-700 border-slate-200'
                        }`}>
                          {log.type}
                        </span>
                      </td>
                      <td className="py-2.5 px-4">
                        <div className="flex items-center gap-1">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-black ${isAddition ? 'bg-emerald-100/50 text-emerald-700' : 'bg-rose-100/50 text-rose-700'}`}>
                            {isAddition ? '+' : ''}{log.change_qty}
                          </span>
                        </div>
                      </td>
                      <td className="py-2.5 px-4">
                        <div className="flex items-center gap-1.5 max-w-[200px]">
                          <span className="truncate text-slate-600 dark:text-slate-400 font-medium" title={log.notes}>
                            {log.notes || 'No notes'}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      </div>

      {/* Adjust Stock Modal Box */}
      {isAdjustModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-xl animate-in zoom-in duration-150 overflow-hidden">
            <div className="bg-slate-50 dark:bg-slate-800 px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <h2 className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                <PlusCircle />
                <span>Adjust Stock Levels</span>
              </h2>
              <button onClick={() => setIsAdjustModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateAdjustment} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase">Select Catalog Product</label>
                <select 
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 text-[11px] rounded-lg border focus:outline-hidden"
                >
                  <option value="">-- Choose Product --</option>
                  {products.map((p, idx) => (
                    <option key={`${p.id}-${idx}`} value={p.id}>
                      {p.name} (SKU: {p.sku} | Stock: {p.current_stock})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Movement Type</label>
                  <select 
                    value={adjustType}
                    onChange={(e) => setAdjustType(e.target.value as StockLog['type'])}
                    className="w-full px-3 py-2 bg-slate-50 text-[11px] rounded-lg border focus:outline-hidden"
                  >
                    <option value="In">Stock In (+)</option>
                    <option value="Out">Stock Out (-)</option>
                    <option value="Adjustment">Adjustment (+/-)</option>
                    <option value="Transfer">Transfer (-)</option>
                    <option value="Damage">Damage / Scrap (-)</option>
                    <option value="Return">Customer Return (+)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Quantity (UOM units)</label>
                  <input 
                    type="number" 
                    min={1} 
                    required
                    value={adjustQty}
                    onChange={(e) => setAdjustQty(Math.max(1, Number(e.target.value)))}
                    className="w-full px-3 py-2 bg-slate-50 text-[11px] rounded-lg border focus:outline-hidden font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase">Audit Remarks / Reason *</label>
                <textarea 
                  rows={2}
                  required
                  value={adjustNotes}
                  onChange={(e) => setAdjustNotes(e.target.value)}
                  placeholder="Reason for stock movement (e.g., received consignment from vendor, scrap damaged box)..."
                  className="w-full px-3 py-2 bg-slate-50 text-[11px] rounded-lg border focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button 
                  type="button" 
                  onClick={() => setIsAdjustModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-[11px] font-semibold hover:bg-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-[11px] font-semibold hover:bg-indigo-700 cursor-pointer"
                >
                  Write Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
