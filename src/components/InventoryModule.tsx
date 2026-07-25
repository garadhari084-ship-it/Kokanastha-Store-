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
    <div className="space-y-6 max-w-full pb-12 px-0 font-sans text-slate-900 dark:text-slate-100 overflow-x-hidden" id="inventory-module-root">
      {/* Page Header */}
      <PageHeader
        title="Inventory Ledger & Stock Adjustment"
        subtitle="Record stock-ins, transfers, damages, and audit stock history ledgers."
        icon={ClipboardList}
        rightContent={
          <>
{user.role !== 'Viewer' && (
          <button 
            onClick={() => {
              if (autoProductId) setSelectedProductId(autoProductId);
              setIsAdjustModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[11px] font-semibold cursor-pointer"
          >
            <PlusCircle size={16} />
            <span>Inward / Adjust Stock</span>
          </button>
        )}
          </>
        }
      />

      <div className="px-4 sm:px-6 space-y-6">
      {/* Valuation Panels Trailing */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-xl shadow-xs">
          <span className="text-[10px] text-slate-400 font-bold uppercase block">Asset Valuation (FIFO Cost)</span>
          <strong className="text-base font-mono text-slate-900 dark:text-white mt-1 block">₹{totalValuation.toLocaleString()}</strong>
          <span className="text-[10px] text-slate-500 block mt-1">Calculated at current purchase cost levels.</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-xl shadow-xs">
          <span className="text-[10px] text-slate-400 font-bold uppercase block">Expected Sales Revenue</span>
          <strong className="text-base font-mono text-indigo-600 mt-1 block">₹{totalRetailValuation.toLocaleString()}</strong>
          <span className="text-[10px] text-slate-500 block mt-1">Expected revenue if sold at retail catalog.</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-xl shadow-xs">
          <span className="text-[10px] text-slate-400 font-bold uppercase block">Expected Gross Profit Margin</span>
          <strong className="text-base font-mono text-emerald-600 mt-1 block">₹{(totalRetailValuation - totalValuation).toLocaleString()}</strong>
          <span className="text-[10px] text-emerald-600 font-bold block mt-1">
            +{(((totalRetailValuation - totalValuation) / (totalValuation || 1)) * 100).toFixed(1)}% markup ratio
          </span>
        </div>
      </div>

      {/* Main Ledger Table view */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-xs overflow-x-auto overflow-y-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
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
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 text-[11px] rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-hidden"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800 text-[10px] font-bold uppercase text-slate-400 border-b border-slate-100 dark:border-slate-800">
                <th className="p-4">Timestamp</th>
                <th className="p-4">Product Details</th>
                <th className="p-4">Transaction Type</th>
                <th className="p-4">Change Qty</th>
                <th className="p-4">Remarks / Audit Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-[11px]">
              {filteredLogs.map((log, idx) => {
                const p = products.find(prod => prod.id === log.product_id);
                if (!p) return null;

                const isAddition = log.change_qty > 0;

                return (
                  <tr key={`${log.id}-${idx}`} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                    <td className="p-4 font-mono text-[11px] text-slate-400">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="p-4 space-y-0.5">
                      <strong className="text-slate-800 dark:text-slate-200">{p.name}</strong>
                      <span className="text-[10px] text-slate-400 font-mono block">SKU: {p.sku}</span>
                    </td>
                    <td className="p-4">
                      <span className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded-full ${
                        log.type === 'In' ? 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/30' :
                        log.type === 'Adjustment' ? 'text-indigo-700 bg-indigo-50 dark:bg-indigo-950/30' :
                        log.type === 'Damage' ? 'text-rose-700 bg-rose-50 dark:bg-rose-950/30' :
                        log.type === 'Return' ? 'text-amber-700 bg-amber-50 dark:bg-amber-950/30' :
                        'text-slate-700 bg-slate-100'
                      }`}>
                        {log.type}
                      </span>
                    </td>
                    <td className={`p-4 font-bold font-mono text-xs ${isAddition ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {isAddition ? '+' : ''}{log.change_qty}
                    </td>
                    <td className="p-4 text-slate-500 italic max-w-[250px] truncate" title={log.notes}>
                      {log.notes}
                    </td>
                  </tr>
                );
              })}

              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-slate-400">
                    No transactions recorded in ledger logs yet.
                  </td>
                </tr>
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
