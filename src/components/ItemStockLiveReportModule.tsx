import React, { useState, useEffect, useMemo } from 'react';
import { Package, Search, PackageOpen, Plus, Clock, ShieldCheck, AlertTriangle } from 'lucide-react';
import { dbStore } from '../services/store';
import { Product, SalesOrder, UserProfile } from '../types/erp';

interface ItemStockLiveReportModuleProps {
  businessId: string;
  user: UserProfile;
  triggerToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  onCreateOrder?: () => void;
}

export const ItemStockLiveReportModule: React.FC<ItemStockLiveReportModuleProps> = ({
  businessId,
  user,
  triggerToast,
  onCreateOrder
}) => {
  const [products, setProducts] = useState<Product[]>(dbStore.getProducts(businessId));
  const [activeOrders, setActiveOrders] = useState<SalesOrder[]>(
    dbStore.getSalesOrders(businessId).filter(o => o.status === 'Pending' || o.status === 'Packing' || o.status === 'Packed')
  );
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    return dbStore.subscribe(() => {
      setProducts(dbStore.getProducts(businessId));
      setActiveOrders(
        dbStore.getSalesOrders(businessId).filter(o => o.status === 'Pending' || o.status === 'Packing' || o.status === 'Packed')
      );
    });
  }, [businessId]);

  const reportData = useMemo(() => {
    return products.map(prod => {
      let bookQty = 0;      // Unpacked booked quantity awaiting packing
      let packQty = 0;      // Verified / scanned packed quantity
      let totalOrderQty = 0;// Total quantity ordered across active sales orders

      activeOrders.forEach(order => {
        const item = (order.items || []).find(i => i.product_id === prod.id);
        if (item) {
          const qty = Number(item.qty || 0);
          const scanned = Number(item.scanned_qty || 0);
          
          // As items get scanned in packing station:
          // bookQty reduces, packQty increases
          const unpackedQty = Math.max(0, qty - scanned);
          const packedPortion = Math.min(qty, scanned);

          bookQty += unpackedQty;
          packQty += packedPortion;
          totalOrderQty += qty;
        }
      });

      // Pending Qty = Remaining quantity awaiting packing (bookQty)
      const pendingQty = bookQty;
      
      // Live Stock (Minus Booked) = System current stock (which reflects stock after deducting booked orders)
      const liveStock = Number(prod.current_stock) || 0;

      return {
        ...prod,
        bookQty,
        packQty,
        pendingQty,
        totalOrderQty,
        liveStock
      };
    }).filter(p => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return String(p.name || '').toLowerCase().includes(q) || String(p.barcode || '').toLowerCase().includes(q);
      }
      return true;
    });
  }, [products, activeOrders, searchQuery]);

  // Overall KPI totals
  const totals = useMemo(() => {
    return reportData.reduce((acc, item) => {
      acc.totalBooked += item.bookQty;
      acc.totalPacked += item.packQty;
      acc.totalPending += item.pendingQty;
      acc.totalLive += item.liveStock;
      if (item.liveStock < 0) acc.negativeCount += 1;
      return acc;
    }, { totalBooked: 0, totalPacked: 0, totalPending: 0, totalLive: 0, negativeCount: 0 });
  }, [reportData]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Package className="text-indigo-600" />
            Item Stock Live Report
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Real-time live stock status • Dynamic transition from Book Qty to Pack Qty as orders get packed
          </p>
        </div>
        
        {onCreateOrder && (
          <button
            onClick={onCreateOrder}
            className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors flex items-center gap-2 w-full sm:w-auto justify-center shadow-sm cursor-pointer"
          >
            <Plus size={16} />
            Create Order
          </button>
        )}
      </div>

      {/* KPI Cards Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-bold">
            <span>Book Qty (Unpacked)</span>
            <Clock size={16} className="text-amber-500" />
          </div>
          <p className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">{totals.totalBooked.toLocaleString()}</p>
          <span className="text-[10px] text-slate-400 block">Orders awaiting packing</span>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-bold">
            <span>Pack Qty (Verified)</span>
            <PackageOpen size={16} className="text-indigo-500" />
          </div>
          <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400 font-mono">{totals.totalPacked.toLocaleString()}</p>
          <span className="text-[10px] text-slate-400 block">Scanned in packing station</span>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-bold">
            <span>Pending Qty</span>
            <Clock size={16} className="text-rose-500" />
          </div>
          <p className="text-2xl font-black text-rose-600 dark:text-rose-400 font-mono">{totals.totalPending.toLocaleString()}</p>
          <span className="text-[10px] text-slate-400 block">Pending packing pipeline</span>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-bold">
            <span>Net Live Available</span>
            {totals.negativeCount > 0 ? (
              <AlertTriangle size={16} className="text-rose-600 animate-bounce" />
            ) : (
              <ShieldCheck size={16} className="text-emerald-600" />
            )}
          </div>
          <p className={`text-2xl font-black font-mono ${
            totals.totalLive < 0 
              ? 'text-rose-600 dark:text-rose-400' 
              : 'text-emerald-600 dark:text-emerald-400'
          }`}>
            {totals.totalLive.toLocaleString()}
          </p>
          <span className="text-[10px] text-slate-400 block">
            {totals.negativeCount > 0 ? `${totals.negativeCount} item(s) in shortage!` : 'Current live available stock'}
          </span>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search items by name or barcode..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow text-slate-800 dark:text-slate-200"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-[11px]">
            <thead className="bg-slate-100 dark:bg-slate-800/90 text-slate-700 dark:text-slate-200 font-extrabold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700 text-[10px]">
              <tr>
                <th className="py-3 px-4">#</th>
                <th className="py-3 px-4">Image</th>
                <th className="py-3 px-4">Barcode</th>
                <th className="py-3 px-4">Item Name</th>
                <th className="py-3 px-4 text-center">Book Qty</th>
                <th className="py-3 px-4 text-center">Pack Qty</th>
                <th className="py-3 px-4 text-center">Pending Qty</th>
                <th className="py-3 px-4 text-right">Live Stock (Minus Booked)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 text-slate-700 dark:text-slate-300">
              {reportData.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                      <PackageOpen size={32} className="opacity-30 mb-3" />
                      <p className="text-sm">No items found.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                reportData.map((item, index) => (
                  <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-2.5 px-4 font-mono text-slate-400">
                      {index + 1}
                    </td>
                    <td className="py-2.5 px-4">
                      {item.image_url ? (
                        <img 
                          src={item.image_url} 
                          alt={item.name} 
                          className="w-10 h-10 object-cover rounded-md border border-slate-200 dark:border-slate-700 bg-white"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                          <Package size={16} className="text-slate-400" />
                        </div>
                      )}
                    </td>
                    <td className="py-2.5 px-4 font-mono font-medium text-slate-600 dark:text-slate-400">
                      {item.barcode || '-'}
                    </td>
                    <td className="py-2.5 px-4 font-bold text-slate-900 dark:text-slate-100">
                      {item.name}
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <span className="inline-block px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 font-bold">
                        {item.bookQty}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <span className="inline-block px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400 font-bold">
                        {item.packQty}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full font-black ${
                        item.pendingQty > 0 
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' 
                          : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                      }`}>
                        {item.pendingQty}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono font-black">
                      {item.liveStock < 0 ? (
                        <span className="inline-block px-2.5 py-1 rounded-lg bg-rose-600 text-white dark:bg-rose-700 dark:text-white font-mono font-black border border-rose-700 shadow-sm animate-pulse">
                          {item.liveStock} (SHORTAGE)
                        </span>
                      ) : item.liveStock > 10 ? (
                        <span className="inline-block px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200/80 shadow-xs">
                          {item.liveStock}
                        </span>
                      ) : (
                        <span className="inline-block px-2.5 py-1 rounded-lg bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-200/80 shadow-xs">
                          {item.liveStock}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
