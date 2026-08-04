import React, { useState, useEffect, useMemo } from 'react';
import { Package, Search, PackageOpen, Plus } from 'lucide-react';
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
    dbStore.getSalesOrders(businessId).filter(o => o.status === 'Pending' || o.status === 'Packing')
  );
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    return dbStore.subscribe(() => {
      setProducts(dbStore.getProducts(businessId));
      setActiveOrders(
        dbStore.getSalesOrders(businessId).filter(o => o.status === 'Pending' || o.status === 'Packing')
      );
    });
  }, [businessId]);

  const reportData = useMemo(() => {
    return products.map(prod => {
      let bookQty = 0;
      let packQty = 0;

      activeOrders.forEach(order => {
        const item = (order.items || []).find(i => i.product_id === prod.id);
        if (item) {
          bookQty += (item.qty || 0);
          packQty += (item.scanned_qty || 0);
        }
      });

      return {
        ...prod,
        bookQty,
        packQty,
        pendingQty: bookQty - packQty,
        availableQty: prod.current_stock,
        liveStock: prod.current_stock + (bookQty - packQty)
      };
    }).filter(p => {
      // Show if it matches search
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (p.name || '').toLowerCase().includes(q) || (p.barcode || '').toLowerCase().includes(q);
      }
      return true;
    });
  }, [products, activeOrders, searchQuery]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Package className="text-indigo-600" />
            Item Stock Live Report
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Real-time packing and live stock status across all active orders
          </p>
        </div>
        
        {onCreateOrder && (
          <button
            onClick={onCreateOrder}
            className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 w-full sm:w-auto justify-center shadow-sm"
          >
            <Plus size={16} />
            Create Order
          </button>
        )}
      </div>

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
                <th className="py-3 px-4 text-right">Available Qty</th>
                <th className="py-3 px-4 text-right">Live Stock</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 text-slate-700 dark:text-slate-300">
              {reportData.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
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
                    <td className="py-2.5 px-4 font-semibold text-slate-800 dark:text-slate-200">
                      {item.name}
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <span className="inline-block px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 font-medium">
                        {item.bookQty}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <span className="inline-block px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400 font-medium">
                        {item.packQty}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-full font-bold ${
                        item.pendingQty > 0 
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400' 
                          : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
                      }`}>
                        {item.pendingQty}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold">
                      <span className={`inline-block px-2.5 py-1 rounded-lg ${
                        item.availableQty > 10 ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-400' :
                        item.availableQty > 0 ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400' :
                        'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                      }`}>
                        {item.availableQty}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold">
                      <span className={`inline-block px-2.5 py-1 rounded-lg ${
                        item.liveStock > 10 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400' :
                        item.liveStock > 0 ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400' :
                        'bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400'
                      }`}>
                        {item.liveStock}
                      </span>
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
