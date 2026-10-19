import React, { useState, useEffect, useMemo } from 'react';
import { Package, Search, PackageOpen, Plus, Clock, ShieldCheck, AlertTriangle, Truck, CheckCircle2, Filter, Layers } from 'lucide-react';
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
  const [allOrders, setAllOrders] = useState<SalesOrder[]>(dbStore.getSalesOrders(businessId));
  const [categories, setCategories] = useState<any[]>(dbStore.getCategories(businessId));
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'shortage' | 'packing_pending' | 'delivery_pending' | 'dispatched'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    return dbStore.subscribe(() => {
      setProducts(dbStore.getProducts(businessId));
      setAllOrders(dbStore.getSalesOrders(businessId));
      setCategories(dbStore.getCategories(businessId));
    });
  }, [businessId]);

  const reportData = useMemo(() => {
    return products.map(prod => {
      let bookQty = 0;           // Unpacked booked qty awaiting packing
      let packQty = 0;           // Packed / scanned qty awaiting dispatch
      let outForDeliveryQty = 0; // Dispatched / out for delivery qty
      let deliveredQty = 0;      // Delivered / completed qty
      let totalOrderQty = 0;     // Total quantity ordered across all non-cancelled orders

      allOrders.forEach(order => {
        if (order.status === 'Cancelled' || order.status === 'Returned') return;

        const item = (order.items || []).find(i => i.product_id === prod.id);
        if (item) {
          const qty = Number(item.qty || 0);
          const scanned = Number(item.scanned_qty || 0);

          totalOrderQty += qty;

          if (order.status === 'Pending') {
            const unpacked = Math.max(0, qty - scanned);
            const packed = Math.min(qty, scanned);
            bookQty += unpacked;
            packQty += packed;
          } else if (order.status === 'Packing') {
            const unpacked = Math.max(0, qty - scanned);
            const packed = Math.min(qty, scanned);
            bookQty += unpacked;
            packQty += packed;
          } else if (order.status === 'Packed') {
            packQty += qty;
          } else if (order.status === 'Dispatched') {
            outForDeliveryQty += qty;
          } else if (order.status === 'Delivered') {
            deliveredQty += qty;
          } else {
            // Default active handling if custom delivery status
            if (order.delivery_status === 'Dispatched') {
              outForDeliveryQty += qty;
            } else if (order.delivery_status === 'Delivered') {
              deliveredQty += qty;
            } else {
              bookQty += Math.max(0, qty - scanned);
              packQty += Math.min(qty, scanned);
            }
          }
        }
      });

      // Total committed active pipeline qty before delivery
      const activePipelineQty = bookQty + packQty + outForDeliveryQty;
      
      // Net Live Available Stock (directly matches Product Stock in ERP)
      const liveStock = Number(prod.current_stock) || 0;

      // Category Name
      const catObj = categories.find(c => c.id === prod.category_id);
      const categoryName = catObj ? catObj.name : 'Uncategorized';

      return {
        ...prod,
        bookQty,
        packQty,
        outForDeliveryQty,
        deliveredQty,
        activePipelineQty,
        totalOrderQty,
        liveStock,
        categoryName
      };
    }).filter(p => {
      // Search query filter
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesName = String(p.name || '').toLowerCase().includes(q);
        const matchesBarcode = String(p.barcode || '').toLowerCase().includes(q);
        const matchesSku = String(p.sku || '').toLowerCase().includes(q);
        if (!matchesName && !matchesBarcode && !matchesSku) return false;
      }

      // Category filter
      if (selectedCategory !== 'all' && p.category_id !== selectedCategory) {
        return false;
      }

      // Status filter
      if (statusFilter === 'shortage' && p.liveStock >= 0) return false;
      if (statusFilter === 'packing_pending' && p.bookQty <= 0) return false;
      if (statusFilter === 'delivery_pending' && p.packQty <= 0) return false;
      if (statusFilter === 'dispatched' && p.outForDeliveryQty <= 0) return false;

      return true;
    });
  }, [products, allOrders, categories, searchQuery, statusFilter, selectedCategory]);

  // Overall KPI totals
  const totals = useMemo(() => {
    return reportData.reduce((acc, item) => {
      acc.totalBooked += item.bookQty;
      acc.totalPacked += item.packQty;
      acc.totalDispatched += item.outForDeliveryQty;
      acc.totalDelivered += item.deliveredQty;
      acc.totalLive += item.liveStock;
      if (item.liveStock < 0) acc.negativeCount += 1;
      return acc;
    }, {
      totalBooked: 0,
      totalPacked: 0,
      totalDispatched: 0,
      totalDelivered: 0,
      totalLive: 0,
      negativeCount: 0
    });
  }, [reportData]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Package className="text-indigo-600 dark:text-indigo-400" />
            Item Stock Live Report
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
            Live Item Stock matching Product Stock, with breakdown for Book Qty, Pack Qty, Out for Delivery, and Delivered.
          </p>
        </div>
        
        {onCreateOrder && (
          <button
            onClick={onCreateOrder}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 w-full sm:w-auto justify-center shadow-sm cursor-pointer"
          >
            <Plus size={16} />
            Create Invoice Order
          </button>
        )}
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {/* 1. Live Product Stock Total */}
        <div className="p-3.5 bg-slate-900 dark:bg-slate-800 text-white rounded-2xl border border-slate-700 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-300 text-[11px] font-bold">
            <span>Live Stock (Product)</span>
            {totals.negativeCount > 0 ? (
              <AlertTriangle size={15} className="text-rose-400 animate-bounce" />
            ) : (
              <ShieldCheck size={15} className="text-emerald-400" />
            )}
          </div>
          <p className={`text-2xl font-black font-mono ${
            totals.totalLive < 0 ? 'text-rose-400' : 'text-emerald-400'
          }`}>
            {totals.totalLive.toLocaleString()}
          </p>
          <span className="text-[10px] text-slate-400 block font-medium">
            {totals.negativeCount > 0 ? `${totals.negativeCount} item(s) in shortage` : 'Total Available'}
          </span>
        </div>

        {/* 2. Book Qty (Packing Pending) */}
        <div className="p-3.5 bg-amber-50/70 dark:bg-amber-950/30 rounded-2xl border border-amber-200 dark:border-amber-900/60 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-amber-800 dark:text-amber-300 text-[11px] font-bold">
            <span>Book Qty (Packing)</span>
            <Clock size={15} className="text-amber-600" />
          </div>
          <p className="text-2xl font-black text-amber-700 dark:text-amber-300 font-mono">
            {totals.totalBooked.toLocaleString()}
          </p>
          <span className="text-[10px] text-amber-600/80 dark:text-amber-400 block font-medium">
            Unpacked at packing station
          </span>
        </div>

        {/* 3. Pack Qty (Delivery Pending) */}
        <div className="p-3.5 bg-indigo-50/70 dark:bg-indigo-950/30 rounded-2xl border border-indigo-200 dark:border-indigo-900/60 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-indigo-800 dark:text-indigo-300 text-[11px] font-bold">
            <span>Pack Qty (Delivery)</span>
            <PackageOpen size={15} className="text-indigo-600" />
          </div>
          <p className="text-2xl font-black text-indigo-700 dark:text-indigo-300 font-mono">
            {totals.totalPacked.toLocaleString()}
          </p>
          <span className="text-[10px] text-indigo-600/80 dark:text-indigo-400 block font-medium">
            Packed, awaiting fleet/dispatch
          </span>
        </div>

        {/* 4. Out For Delivery */}
        <div className="p-3.5 bg-blue-50/70 dark:bg-blue-950/30 rounded-2xl border border-blue-200 dark:border-blue-900/60 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-blue-800 dark:text-blue-300 text-[11px] font-bold">
            <span>Out For Delivery</span>
            <Truck size={15} className="text-blue-600" />
          </div>
          <p className="text-2xl font-black text-blue-700 dark:text-blue-300 font-mono">
            {totals.totalDispatched.toLocaleString()}
          </p>
          <span className="text-[10px] text-blue-600/80 dark:text-blue-400 block font-medium">
            In-transit / Dispatched
          </span>
        </div>

        {/* 5. Delivered Total */}
        <div className="p-3.5 bg-emerald-50/70 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200 dark:border-emerald-900/60 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-emerald-800 dark:text-emerald-300 text-[11px] font-bold">
            <span>Delivered Total</span>
            <CheckCircle2 size={15} className="text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-emerald-700 dark:text-emerald-300 font-mono">
            {totals.totalDelivered.toLocaleString()}
          </p>
          <span className="text-[10px] text-emerald-600/80 dark:text-emerald-400 block font-medium">
            Fulfilled orders
          </span>
        </div>
      </div>

      {/* Main Report Table & Search/Filter Controls */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
        {/* Filter Toolbar */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search items by name, barcode, or SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-200 font-medium"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Category Filter */}
            <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs">
              <Layers size={14} className="text-slate-400" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-transparent text-slate-700 dark:text-slate-200 font-bold focus:outline-none cursor-pointer text-xs"
              >
                <option value="all">All Categories</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            {/* Pipeline Status Filter */}
            <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs">
              <Filter size={14} className="text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="bg-transparent text-slate-700 dark:text-slate-200 font-bold focus:outline-none cursor-pointer text-xs"
              >
                <option value="all">All Pipeline Items</option>
                <option value="shortage">⚠️ Stock Shortage Items Only</option>
                <option value="packing_pending">📦 Packing Pending Items</option>
                <option value="delivery_pending">🚚 Delivery Pending Items</option>
                <option value="dispatched">🛵 Out For Delivery Items</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-100 dark:bg-slate-800/90 text-slate-700 dark:text-slate-200 font-extrabold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700 text-[10px]">
              <tr>
                <th className="py-3 px-3">#</th>
                <th className="py-3 px-3">Item Details</th>
                <th className="py-3 px-3 text-center">Live Stock</th>
                <th className="py-3 px-3 text-center">Book Qty (Packing)</th>
                <th className="py-3 px-3 text-center">Pack Qty (Delivery)</th>
                <th className="py-3 px-3 text-center">Out For Delivery</th>
                <th className="py-3 px-3 text-center">Delivered Qty</th>
                <th className="py-3 px-3 text-center">Pending Pipeline Stage ("Pending Where")</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 text-slate-700 dark:text-slate-300">
              {reportData.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                      <PackageOpen size={32} className="opacity-30 mb-3" />
                      <p className="text-sm font-bold">No matching stock items found.</p>
                      <p className="text-xs text-slate-400 mt-1">Try resetting search query or status filter.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                reportData.map((item, index) => {
                  const hasShortage = item.liveStock < 0;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-2.5 px-3 font-mono text-slate-400 text-[11px]">
                        {index + 1}
                      </td>

                      {/* Product Details */}
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2.5">
                          {item.image_url ? (
                            <img 
                              src={item.image_url} 
                              alt={item.name} 
                              className="w-9 h-9 object-cover rounded-lg border border-slate-200 dark:border-slate-700 bg-white shrink-0"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0">
                              <Package size={15} className="text-slate-400" />
                            </div>
                          )}
                          <div>
                            <p className="font-extrabold text-slate-900 dark:text-slate-100 text-xs">
                              {item.name}
                            </p>
                            <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                              <span>Barcode: {item.barcode || 'N/A'}</span>
                              <span>•</span>
                              <span>Cat: {item.categoryName}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Live Stock (Direct Product Stock) */}
                      <td className="py-2.5 px-3 text-center font-mono font-black">
                        {hasShortage ? (
                          <span className="inline-block px-2.5 py-1 rounded-lg bg-rose-600 text-white font-mono font-black text-xs border border-rose-700 shadow-xs animate-pulse">
                            {item.liveStock} (SHORTAGE)
                          </span>
                        ) : item.liveStock > 10 ? (
                          <span className="inline-block px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 font-mono font-black text-xs border border-emerald-200/80 shadow-2xs">
                            {item.liveStock}
                          </span>
                        ) : (
                          <span className="inline-block px-2.5 py-1 rounded-lg bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 font-mono font-black text-xs border border-amber-200/80 shadow-2xs">
                            {item.liveStock}
                          </span>
                        )}
                      </td>

                      {/* Book Qty (Packing Pending) */}
                      <td className="py-2.5 px-3 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full font-bold font-mono text-xs ${
                          item.bookQty > 0 
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-800' 
                            : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                        }`}>
                          {item.bookQty}
                        </span>
                      </td>

                      {/* Pack Qty (Delivery Pending) */}
                      <td className="py-2.5 px-3 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full font-bold font-mono text-xs ${
                          item.packQty > 0 
                            ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/80 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800' 
                            : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                        }`}>
                          {item.packQty}
                        </span>
                      </td>

                      {/* Out For Delivery */}
                      <td className="py-2.5 px-3 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full font-bold font-mono text-xs ${
                          item.outForDeliveryQty > 0 
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-300 dark:border-blue-800' 
                            : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                        }`}>
                          {item.outForDeliveryQty}
                        </span>
                      </td>

                      {/* Delivered Qty */}
                      <td className="py-2.5 px-3 text-center">
                        <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 font-bold font-mono text-xs border border-emerald-200/60 dark:border-emerald-800/50">
                          {item.deliveredQty}
                        </span>
                      </td>

                      {/* Pending Pipeline Stage ("Pending Where") */}
                      <td className="py-2.5 px-3 text-center">
                        {item.activePipelineQty === 0 ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                            <CheckCircle2 size={11} /> All Clear / No Active Bookings
                          </span>
                        ) : (
                          <div className="flex flex-wrap justify-center items-center gap-1">
                            {item.bookQty > 0 && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-black bg-amber-500 text-slate-950 px-2 py-0.5 rounded-md shadow-2xs">
                                📦 {item.bookQty} Packing Pending
                              </span>
                            )}
                            {item.packQty > 0 && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-black bg-indigo-600 text-white px-2 py-0.5 rounded-md shadow-2xs">
                                🚚 {item.packQty} Delivery Pending
                              </span>
                            )}
                            {item.outForDeliveryQty > 0 && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-black bg-blue-600 text-white px-2 py-0.5 rounded-md shadow-2xs">
                                🛵 {item.outForDeliveryQty} In-Transit
                              </span>
                            )}
                          </div>
                        )}
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
  );
};
