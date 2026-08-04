import React, { useState, useMemo } from 'react';
import { Package, Calendar, Truck, CheckCircle2, Search, FileText } from 'lucide-react';
import { dbStore } from '../services/store';
import { Product, SalesOrder, PackingSession } from '../types/erp';

interface DeliveryReportsProps {
  businessId: string;
}

export const DeliveryReports: React.FC<DeliveryReportsProps> = ({ businessId }) => {
  const [activeTab, setActiveTab] = useState<'product' | 'delivery' | 'packing'>('product');
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [appliedStartDate, setAppliedStartDate] = useState(startDate);
  const [appliedEndDate, setAppliedEndDate] = useState(endDate);
  const [searchQuery, setSearchQuery] = useState('');

  const orders = dbStore.getSalesOrders(businessId);
  const products = dbStore.getProducts(businessId);
  const packingSessions = dbStore.getPackingSessions(businessId);

  const filteredOrders = useMemo(() => {
    return orders.filter(o => o.order_date >= appliedStartDate && o.order_date <= appliedEndDate && o.status !== 'Cancelled' && o.status !== 'Returned');
  }, [orders, appliedStartDate, appliedEndDate]);

  const productReport = useMemo(() => {
    return products.map(prod => {
      let ordered = 0;
      let packed = 0;
      let dispatched = 0;
      let delivered = 0;

      filteredOrders.forEach(order => {
        const item = (order.items || []).find(i => i.product_id === prod.id);
        if (item) {
          const qty = item.qty || 0;
          ordered += qty;
          
          if (['Packed', 'Dispatched', 'Delivered'].includes(order.status)) {
            packed += (item.scanned_qty || qty); // fallback to qty if scanned_qty is not set
          }
          if (['Dispatched', 'Delivered'].includes(order.status)) {
            dispatched += qty;
          }
          if (order.status === 'Delivered') {
            delivered += qty;
          }
        }
      });

      return {
        ...prod,
        ordered,
        packed,
        dispatched,
        delivered
      };
    }).filter(p => p.ordered > 0)
      .filter(p => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (p.name || '').toLowerCase().includes(q) || (p.sku || '').toLowerCase().includes(q) || (p.barcode || '').toLowerCase().includes(q);
      })
      .sort((a, b) => b.ordered - a.ordered);
  }, [products, filteredOrders, searchQuery]);

  const datewiseDelivery = useMemo(() => {
    const dates: Record<string, { orders: number; items: number; amount: number; }> = {};
    
    filteredOrders.forEach(order => {
      if (order.status === 'Delivered') {
        const date = order.delivery_date || order.order_date;
        if (!dates[date]) dates[date] = { orders: 0, items: 0, amount: 0 };
        dates[date].orders += 1;
        dates[date].amount += order.total_amount;
        dates[date].items += (order.items || []).reduce((sum, item) => sum + (item.qty || 0), 0);
      }
    });

    return Object.entries(dates)
      .map(([date, stats]) => ({ date, ...stats }))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [filteredOrders]);

  const datewisePacking = useMemo(() => {
    const dates: Record<string, { sessions: number; scans: number; }> = {};
    
    packingSessions.forEach(session => {
      const date = (session.end_time || session.start_time).split('T')[0];
      if (date >= appliedStartDate && date <= appliedEndDate) {
        if (!dates[date]) dates[date] = { sessions: 0, scans: 0 };
        dates[date].sessions += 1;
        dates[date].scans += (session.total_scans || 0);
      }
    });

    return Object.entries(dates)
      .map(([date, stats]) => ({ date, ...stats }))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [packingSessions, appliedStartDate, appliedEndDate]);

  return (
    <div className="space-y-4 font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex gap-2">
          <button 
            onClick={() => setActiveTab('product')}
            className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors flex items-center gap-2 ${
              activeTab === 'product' ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <Package size={16} /> Full Product Report
          </button>
          <button 
            onClick={() => setActiveTab('delivery')}
            className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors flex items-center gap-2 ${
              activeTab === 'delivery' ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <Truck size={16} /> Date-wise Delivery
          </button>
          <button 
            onClick={() => setActiveTab('packing')}
            className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors flex items-center gap-2 ${
              activeTab === 'packing' ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <CheckCircle2 size={16} /> Date-wise Packing
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 p-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
            <Calendar size={14} className="text-slate-400 ml-2" />
            <input 
              type="date" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-transparent text-xs font-medium focus:outline-none text-slate-700 dark:text-slate-300"
            />
            <span className="text-slate-400">-</span>
            <input 
              type="date" 
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-transparent text-xs font-medium focus:outline-none text-slate-700 dark:text-slate-300 pr-2"
            />
          </div>
          <button
            onClick={() => {
              setAppliedStartDate(startDate);
              setAppliedEndDate(endDate);
            }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
          >
            Apply
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {activeTab === 'product' && (
          <div>
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <div className="relative w-full max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[11px] font-bold border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="px-4 py-3">Product Name</th>
                    <th className="px-4 py-3">Barcode/SKU</th>
                    <th className="px-4 py-3 text-right">Ordered Qty</th>
                    <th className="px-4 py-3 text-right">Packed Qty</th>
                    <th className="px-4 py-3 text-right">Dispatched Qty</th>
                    <th className="px-4 py-3 text-right">Delivered Qty</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {productReport.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                        <FileText size={32} className="mx-auto mb-3 opacity-20" />
                        <p>No product data found in this date range.</p>
                      </td>
                    </tr>
                  ) : (
                    productReport.map(item => (
                      <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                        <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200">{item.name}</td>
                        <td className="px-4 py-3 text-slate-500 dark:text-slate-400 font-mono text-xs">{item.barcode || item.sku || '-'}</td>
                        <td className="px-4 py-3 text-right font-mono font-medium">{item.ordered}</td>
                        <td className="px-4 py-3 text-right font-mono font-medium text-amber-600 dark:text-amber-400">{item.packed}</td>
                        <td className="px-4 py-3 text-right font-mono font-medium text-indigo-600 dark:text-indigo-400">{item.dispatched}</td>
                        <td className="px-4 py-3 text-right font-mono font-medium text-emerald-600 dark:text-emerald-400">{item.delivered}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'delivery' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[11px] font-bold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3 text-right">Orders Delivered</th>
                  <th className="px-4 py-3 text-right">Items Delivered</th>
                  <th className="px-4 py-3 text-right">Total Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {datewiseDelivery.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-12 text-center text-slate-500">
                      <Truck size={32} className="mx-auto mb-3 opacity-20" />
                      <p>No deliveries found in this date range.</p>
                    </td>
                  </tr>
                ) : (
                  datewiseDelivery.map(item => (
                    <tr key={item.date} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                      <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200">{item.date}</td>
                      <td className="px-4 py-3 text-right font-mono font-medium">{item.orders}</td>
                      <td className="px-4 py-3 text-right font-mono font-medium">{item.items}</td>
                      <td className="px-4 py-3 text-right font-mono font-medium text-emerald-600 dark:text-emerald-400">
                        ₹{item.amount.toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'packing' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[11px] font-bold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3 text-right">Orders Packed (Sessions)</th>
                  <th className="px-4 py-3 text-right">Total Items Scanned</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {datewisePacking.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-12 text-center text-slate-500">
                      <CheckCircle2 size={32} className="mx-auto mb-3 opacity-20" />
                      <p>No packing sessions found in this date range.</p>
                    </td>
                  </tr>
                ) : (
                  datewisePacking.map(item => (
                    <tr key={item.date} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                      <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200">{item.date}</td>
                      <td className="px-4 py-3 text-right font-mono font-medium">{item.sessions}</td>
                      <td className="px-4 py-3 text-right font-mono font-medium text-indigo-600 dark:text-indigo-400">{item.scans}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
