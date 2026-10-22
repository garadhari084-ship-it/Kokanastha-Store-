import React, { useState, useEffect, useMemo } from 'react';
import { 
  Package, 
  Search, 
  PackageOpen, 
  Plus, 
  Minus,
  Clock, 
  ShieldCheck, 
  AlertTriangle, 
  Truck, 
  CheckCircle2, 
  Filter, 
  Layers,
  ArrowUpRight,
  History,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Calendar,
  Zap,
  MoreVertical,
  PlusCircle,
  FileText,
  Download,
  X,
  Sliders,
  Check,
  PackagePlus,
  RefreshCw
} from 'lucide-react';
import { dbStore } from '../services/store';
import { Product, SalesOrder, UserProfile, StockLog } from '../types/erp';

interface ItemStockLiveReportModuleProps {
  businessId: string;
  user: UserProfile;
  triggerToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  onCreateOrder?: () => void;
  onOpenInventory?: (productId?: string) => void;
}

export const ItemStockLiveReportModule: React.FC<ItemStockLiveReportModuleProps> = React.memo(({
  businessId,
  user,
  triggerToast,
  onCreateOrder,
  onOpenInventory
}) => {
  const [products, setProducts] = useState<Product[]>(dbStore.getProducts(businessId));
  const [allOrders, setAllOrders] = useState<SalesOrder[]>(dbStore.getSalesOrders(businessId));
  const [categories, setCategories] = useState<any[]>(dbStore.getCategories(businessId));
  const [stockLogs, setStockLogs] = useState<StockLog[]>(dbStore.getStockLogs(businessId));
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'shortage' | 'low' | 'excess' | 'moving'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'live' | 'ledger'>('live');

  // Quick In-Report Stock Adjustment State
  const [quickAdjustProduct, setQuickAdjustProduct] = useState<any | null>(null);
  const [adjustMode, setAdjustMode] = useState<'add' | 'deduct' | 'set'>('add');
  const [adjustQtyInput, setAdjustQtyInput] = useState<number | string>(5);
  const [adjustReason, setAdjustReason] = useState<string>('');
  const [isSubmittingAdjust, setIsSubmittingAdjust] = useState<boolean>(false);

  useEffect(() => {
    const unsub = dbStore.subscribe(() => {
      setProducts(dbStore.getProducts(businessId));
      setAllOrders(dbStore.getSalesOrders(businessId));
      setCategories(dbStore.getCategories(businessId));
      setStockLogs(dbStore.getStockLogs(businessId));
    });
    return unsub;
  }, [businessId]);

  const reportData = useMemo(() => {
    const statsMap = new Map<string, {
      booked: number;
      packed: number;
      outForDelivery: number;
      delivered: number;
      totalOrdered: number;
    }>();

    const norm = (s: string) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');

    allOrders.forEach(order => {
      if (!order || order.status === 'Cancelled' || order.status === 'Returned') return;

      (order.items || []).forEach(item => {
        if (!item) return;

        const qty = Number(item.qty) || Number((item as any).quantity) || 0;
        if (qty <= 0) return;

        const scanned = Number(item.scanned_qty || 0);

        const itemProdId = String(item.product_id || item.id || '').trim();
        const legacyIdMap: Record<string, string> = {
          'p1': 'b1111111-1111-4111-8111-111111111111',
          'p2': 'b2222222-2222-4222-8222-222222222222',
          'p3': 'b3333333-3333-4333-8333-333333333333',
          'p4': 'b4444444-4444-4444-8444-444444444444'
        };
        const resolvedItemProdId = legacyIdMap[itemProdId] || itemProdId;
        const rawItemName = String(item.product_name || (item as any).name || '').trim();
        const itemName = rawItemName.toLowerCase();
        const itemSku = String(item.sku || '').trim().toLowerCase();
        const normItemName = norm(rawItemName);

        const prodMatch = products.find(p => {
          if (!p) return false;
          const resolvedPId = legacyIdMap[p.id] || p.id;
          if (resolvedPId && resolvedItemProdId && resolvedPId === resolvedItemProdId) return true;
          if (p.id && itemProdId && (p.id === itemProdId || legacyIdMap[p.id] === itemProdId || legacyIdMap[itemProdId] === p.id)) return true;
          if (p.sku && itemProdId && p.sku.toLowerCase() === itemProdId.toLowerCase()) return true;
          if (p.sku && itemSku && p.sku.toLowerCase() === itemSku) return true;
          if (p.name && itemName && p.name.trim().toLowerCase() === itemName) return true;
          if (p.barcode && itemProdId && p.barcode.toLowerCase() === itemProdId.toLowerCase()) return true;
          if (p.name && normItemName && norm(p.name) === normItemName && normItemName.length > 2) return true;
          return false;
        });

        const targetProdId = prodMatch ? prodMatch.id : resolvedItemProdId;
        if (!targetProdId && !itemName) return;

        const lookupKey = targetProdId || itemName;
        let stats = statsMap.get(lookupKey);
        if (!stats && prodMatch) {
          stats = statsMap.get(prodMatch.id) || 
                  statsMap.get(legacyIdMap[prodMatch.id] || '') ||
                  statsMap.get(prodMatch.name.trim().toLowerCase()) || 
                  (prodMatch.sku ? statsMap.get(prodMatch.sku.trim().toLowerCase()) : undefined) ||
                  statsMap.get(norm(prodMatch.name));
        }

        if (!stats) {
          stats = { booked: 0, packed: 0, outForDelivery: 0, delivered: 0, totalOrdered: 0 };
        }

        // Always register stats under all identifier keys for this product
        if (targetProdId) {
          statsMap.set(targetProdId, stats);
          if (legacyIdMap[targetProdId]) statsMap.set(legacyIdMap[targetProdId], stats);
        }
        if (prodMatch) {
          if (prodMatch.id) {
            statsMap.set(prodMatch.id, stats);
            if (legacyIdMap[prodMatch.id]) statsMap.set(legacyIdMap[prodMatch.id], stats);
            const foundLegacy = Object.keys(legacyIdMap).find(k => legacyIdMap[k] === prodMatch.id);
            if (foundLegacy) statsMap.set(foundLegacy, stats);
          }
          if (prodMatch.name) statsMap.set(prodMatch.name.trim().toLowerCase(), stats);
          if (prodMatch.sku && prodMatch.sku.trim()) statsMap.set(prodMatch.sku.trim().toLowerCase(), stats);
          if (prodMatch.name) statsMap.set(norm(prodMatch.name), stats);
        } else {
          if (itemName) statsMap.set(itemName, stats);
          if (itemSku) statsMap.set(itemSku, stats);
          if (normItemName) statsMap.set(normItemName, stats);
        }

        stats.totalOrdered += qty;

        const isAdvOrFest = Boolean(order.advance_booking || order.festive_booking);
        const isDelivered = (order.status === 'Delivered' || order.delivery_status === 'Delivered') && 
                            (!isAdvOrFest || Boolean(order.delivered_at));
        const isDispatched = order.status === 'Dispatched' || order.delivery_status === 'Dispatched';
        const isPacked = order.status === 'Packed' || order.delivery_status === 'Packed';

        if (isDelivered) {
          stats.delivered += qty;
        } else {
          // ANY active undelivered order (Pending, Packing, Packed, Dispatched, Advance Booking, Festive Booking) is BOOKED quantity!
          stats.booked += qty;

          if (isDispatched) {
            stats.outForDelivery += qty;
          } else if (isPacked) {
            stats.packed += qty;
          } else {
            stats.packed += Math.min(qty, scanned);
          }
        }
      });
    });

    const legacyIdMap: Record<string, string> = {
      'p1': 'b1111111-1111-4111-8111-111111111111',
      'p2': 'b2222222-2222-4222-8222-222222222222',
      'p3': 'b3333333-3333-4333-8333-333333333333',
      'p4': 'b4444444-4444-4444-8444-444444444444'
    };

    return products.map(prod => {
      const normProdId = legacyIdMap[prod.id] || prod.id;
      const legacyKey = Object.keys(legacyIdMap).find(k => legacyIdMap[k] === prod.id);

      const stats = statsMap.get(prod.id) || 
                     statsMap.get(normProdId) ||
                     (legacyKey ? statsMap.get(legacyKey) : undefined) ||
                     statsMap.get(prod.name.trim().toLowerCase()) || 
                     (prod.sku ? statsMap.get(prod.sku.trim().toLowerCase()) : undefined) || 
                     statsMap.get(norm(prod.name)) ||
                     { booked: 0, packed: 0, outForDelivery: 0, delivered: 0, totalOrdered: 0 };

      const physicalStock = Number(prod.current_stock) || 0;
      const availableStock = physicalStock - stats.booked;

      // Category Name
      const catObj = categories.find(c => c.id === prod.category_id);
      const categoryName = catObj ? catObj.name : 'Uncategorized';

      // Last Movement
      const isLogForProd = (log: StockLog, p: any) => {
        if (!log || !p) return false;
        const lId = String(log.product_id || '').trim();
        if (!lId) return false;
        if (lId === p.id || legMap[lId] === p.id || legMap[p.id] === lId) return true;
        if (p.sku && lId.toLowerCase() === p.sku.toLowerCase()) return true;
        if (p.barcode && lId.toLowerCase() === p.barcode.toLowerCase()) return true;
        if (p.name && norm(lId) === norm(p.name) && norm(p.name).length > 2) return true;
        return false;
      };

      const legMap: Record<string, string> = {
        'p1': 'b1111111-1111-4111-8111-111111111111',
        'p2': 'b2222222-2222-4222-8222-222222222222',
        'p3': 'b3333333-3333-4333-8333-333333333333',
        'p4': 'b4444444-4444-4444-8444-444444444444'
      };

      const lastLog = stockLogs
        .filter(l => isLogForProd(l, prod))
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

      return {
        ...prod,
        physicalStock,
        bookQty: stats.booked,
        packQty: stats.packed,
        outForDeliveryQty: stats.outForDelivery,
        deliveredQty: stats.delivered,
        activePipelineQty: stats.booked,
        totalOrderQty: stats.totalOrdered,
        availableStock,
        categoryName,
        lastMovement: lastLog ? lastLog.created_at : null,
        lastMovementType: lastLog ? lastLog.type : null,
        lastMovementQty: lastLog ? lastLog.change_qty : null,
        lastMovementNotes: lastLog ? lastLog.notes : null
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
      if (statusFilter === 'shortage' && p.availableStock >= 0) return false;
      if (statusFilter === 'low' && (p.availableStock < (p.minimum_stock || 5) || p.availableStock < 0)) return true;
      if (statusFilter === 'low' && p.availableStock >= (p.minimum_stock || 5)) return false;
      if (statusFilter === 'excess' && p.availableStock <= (p.maximum_stock || 50)) return false;
      if (statusFilter === 'moving' && p.totalOrderQty <= 0) return false;

      return true;
    });
  }, [products, allOrders, categories, stockLogs, searchQuery, statusFilter, selectedCategory]);

  const handleOpenQuickAdjust = (item: any, mode: 'add' | 'deduct' | 'set' = 'add', defaultPreset = 5) => {
    setQuickAdjustProduct(item);
    setAdjustMode(mode);
    setAdjustQtyInput(defaultPreset);
    setAdjustReason(mode === 'add' ? 'Stock Inward / Restock' : mode === 'deduct' ? 'Stock Reduction / Audit' : 'Physical Inventory Count');
  };

  const handleConfirmQuickAdjust = async () => {
    if (!quickAdjustProduct || isSubmittingAdjust) return;
    const qtyVal = Number(adjustQtyInput);
    if (isNaN(qtyVal) || (adjustMode !== 'set' && qtyVal <= 0)) {
      triggerToast('Please enter a valid stock quantity greater than zero.', 'error');
      return;
    }

    // Always fetch latest authoritative product from store using multi-alias lookup
    const freshProd = dbStore.findProduct(quickAdjustProduct.id) ||
                      (quickAdjustProduct.sku ? dbStore.findProduct(quickAdjustProduct.sku) : undefined) ||
                      (quickAdjustProduct.name ? dbStore.findProduct(quickAdjustProduct.name) : undefined) ||
                      dbStore.getProducts(businessId).find(p => p.id === quickAdjustProduct.id) ||
                      quickAdjustProduct;
    const currentStock = Number(freshProd.current_stock) || 0;
    let changeQty = 0;
    let logType: StockLog['type'] = 'Adjustment';

    if (adjustMode === 'add') {
      changeQty = qtyVal;
      logType = 'In';
    } else if (adjustMode === 'deduct') {
      changeQty = -qtyVal;
      logType = 'Out';
    } else if (adjustMode === 'set') {
      changeQty = qtyVal - currentStock;
      logType = 'Adjustment';
    }

    if (changeQty === 0) {
      triggerToast('No change in stock level.', 'info');
      setQuickAdjustProduct(null);
      return;
    }

    if (changeQty < 0 && (currentStock + changeQty < 0)) {
      triggerToast(`Insufficient Stock! "${freshProd.name}" only has ${currentStock} units available. Cannot deduct ${Math.abs(changeQty)}.`, 'error');
      return;
    }

    setIsSubmittingAdjust(true);
    try {
      const finalNote = adjustReason.trim() || `Manual stock update via Item Stock Live Report (${adjustMode} ${Math.abs(changeQty)})`;
      const targetBalance = currentStock + changeQty;

      // Lock in authoritative expectation before updating store
      dbStore.setAuthoritativeStock(freshProd.id, targetBalance, changeQty, freshProd.sku, freshProd.name);

      dbStore.addStockLog(
        freshProd.id,
        changeQty,
        logType,
        finalNote,
        user.id,
        businessId
      );

      dbStore.logActivity(
        user.id,
        user.name,
        user.role,
        'Stock Change',
        `Adjusted stock for ${freshProd.name}: ${changeQty > 0 ? '+' : ''}${changeQty} (${logType}) via Item Stock Live Report`,
        businessId
      );

      // Instantly refresh local state
      setProducts(dbStore.getProducts(businessId));
      setStockLogs(dbStore.getStockLogs(businessId));

      triggerToast(
        `Stock updated for "${freshProd.name}": ${changeQty > 0 ? `+${changeQty}` : changeQty} ${freshProd.unit || 'units'}. New Balance: ${targetBalance} ${freshProd.unit || 'units'}.`,
        'success'
      );
      setQuickAdjustProduct(null);
      setAdjustQtyInput(5);
      setAdjustReason('');
    } catch (err: any) {
      triggerToast(`Failed to update stock: ${err.message}`, 'error');
    } finally {
      setIsSubmittingAdjust(false);
    }
  };

  const handleExportPDF = async () => {
    try {
      const { jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');
      
      const doc = new jsPDF('l', 'mm', 'a4');
      
      // Header
      doc.setFontSize(20);
      doc.setTextColor(40, 44, 52);
      doc.text('Inventory & Stock Live Report', 14, 20);
      
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 27);
      doc.text(`Total Active SKUs: ${reportData.length}`, 14, 32);

      const tableData = reportData.map(p => [
        p.name || 'N/A',
        p.sku || 'N/A',
        p.categoryName,
        p.availableStock,
        p.bookQty,
        p.packQty,
        p.activePipelineQty,
        p.totalOrderQty
      ]);

      autoTable(doc, {
        startY: 40,
        head: [['Product Name', 'SKU', 'Category', 'Available', 'Booked', 'Packed', 'Pipeline', 'Total Orders']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 8, cellPadding: 3 },
        alternateRowStyles: { fillColor: [245, 247, 250] },
      });

      doc.save(`kokanastha-stock-report-${Date.now()}.pdf`);
      triggerToast('PDF Report Downloaded', 'success');
    } catch (err) {
      console.error('PDF export failed:', err);
      triggerToast('PDF generation failed', 'error');
    }
  };

  const handleExportExcel = async () => {
    try {
      const XLSX = await import('xlsx');
      
      const data = reportData.map(p => ({
        'Product Name': p.name,
        'SKU': p.sku,
        'Category': p.categoryName,
        'Available Stock': p.availableStock,
        'Booked Qty': p.bookQty,
        'Packed Qty': p.packQty,
        'Active Pipeline': p.activePipelineQty,
        'Total Ordered': p.totalOrderQty,
        'Last Movement': p.lastMovement ? `${p.lastMovementType || ''} ${p.lastMovementQty ? (p.lastMovementQty > 0 ? `+${p.lastMovementQty}` : p.lastMovementQty) : ''} (${new Date(p.lastMovement).toLocaleString()})` : 'Never'
      }));

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Stock Report');
      
      XLSX.writeFile(wb, `kokanastha-stock-report-${Date.now()}.xlsx`);
      triggerToast('Excel Report Downloaded', 'success');
    } catch (err) {
      console.error('Excel export failed:', err);
      triggerToast('Excel generation failed', 'error');
    }
  };

  // Overall KPI totals
  const totals = useMemo(() => {
    return reportData.reduce((acc, item) => {
      acc.totalBooked += item.bookQty;
      acc.totalPacked += item.packQty;
      acc.totalDispatched += item.outForDeliveryQty;
      acc.totalDelivered += item.deliveredQty;
      acc.totalAvailable += item.availableStock;
      acc.totalPhysical += (item.physicalStock || 0);
      if (item.availableStock < 0) acc.negativeCount += 1;
      if (item.availableStock < (item.minimum_stock || 5) && item.availableStock >= 0) acc.lowStockCount += 1;
      return acc;
    }, {
      totalBooked: 0,
      totalPacked: 0,
      totalDispatched: 0,
      totalDelivered: 0,
      totalAvailable: 0,
      totalPhysical: 0,
      negativeCount: 0,
      lowStockCount: 0
    });
  }, [reportData]);

  const ledgerData = useMemo(() => {
    return stockLogs
      .map(log => {
        const p = products.find(prod => prod.id === log.product_id);
        return { ...log, productName: p?.name || 'Unknown Item', sku: p?.sku || 'N/A' };
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [stockLogs, products]);

  // Derived values for quick adjust modal calculation
  const modalFreshProduct = useMemo(() => {
    if (!quickAdjustProduct) return null;
    return products.find(p => p.id === quickAdjustProduct.id) || quickAdjustProduct;
  }, [quickAdjustProduct, products]);
  const modalCurrentStock = modalFreshProduct ? (Number(modalFreshProduct.current_stock) || 0) : 0;
  const modalBookedQty = modalFreshProduct ? (reportData.find(r => r.id === modalFreshProduct.id)?.bookQty || 0) : 0;
  const modalAdjustQty = Math.max(0, Number(adjustQtyInput) || 0);
  const modalCalculatedDelta = adjustMode === 'add' ? modalAdjustQty : adjustMode === 'deduct' ? -modalAdjustQty : (modalAdjustQty - modalCurrentStock);
  const modalNewPhysicalBalance = modalCurrentStock + modalCalculatedDelta;
  const modalNewAvailable = modalNewPhysicalBalance - modalBookedQty;

  return (
    <div className="space-y-6 pb-12">
      {/* Header Section */}
      <div className="bg-gradient-to-br from-slate-900 to-indigo-950 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden border border-slate-800">
        {/* Background Accent */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full -mr-20 -mt-20 blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/10 rounded-full -ml-16 -mb-16 blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-500/20 rounded-2xl backdrop-blur-md border border-indigo-400/20 shadow-lg">
                <BarChart3 className="text-indigo-300" size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-black tracking-tight flex items-center gap-2">
                  Inventory Insights
                  <span className="bg-emerald-500 text-white text-[10px] px-2 py-0.5 rounded-full uppercase tracking-widest font-black animate-pulse">
                    Live
                  </span>
                </h2>
                <p className="text-indigo-200/60 text-xs font-medium">
                  Real-time stock valuation and pipeline tracking for {products.length} active SKUs
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <button
              onClick={() => setActiveTab(activeTab === 'live' ? 'ledger' : 'live')}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border border-white/10 backdrop-blur-md cursor-pointer"
            >
              {activeTab === 'live' ? <History size={14} /> : <Zap size={14} />}
              {activeTab === 'live' ? 'Movement Ledger' : 'Live Report'}
            </button>
            
            <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl border border-white/5">
              <button
                onClick={handleExportPDF}
                className="p-2 hover:bg-white/10 rounded-lg text-indigo-300 transition-colors cursor-pointer"
                title="Export PDF Report"
              >
                <FileText size={16} />
              </button>
              <button
                onClick={handleExportExcel}
                className="p-2 hover:bg-white/10 rounded-lg text-emerald-400 transition-colors cursor-pointer"
                title="Export Excel (.xlsx)"
              >
                <Download size={16} />
              </button>
            </div>

            {onCreateOrder && (
              <button
                onClick={onCreateOrder}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2 bg-indigo-500 hover:bg-indigo-400 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all shadow-lg shadow-indigo-500/20 cursor-pointer"
              >
                <Plus size={14} />
                New Invoice
              </button>
            )}
          </div>
        </div>

        {/* Global Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
            <p className="text-indigo-300/60 text-[10px] font-black uppercase tracking-widest">Available Stock</p>
            <div className="flex items-end justify-between mt-1">
              <h3 className="text-2xl font-black font-mono">{totals.totalAvailable.toLocaleString()}</h3>
              <TrendingUp size={16} className="text-emerald-400 mb-1" />
            </div>
          </div>
          <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
            <p className="text-rose-300/60 text-[10px] font-black uppercase tracking-widest">Shortage Items</p>
            <div className="flex items-end justify-between mt-1">
              <h3 className="text-2xl font-black font-mono text-rose-400">{totals.negativeCount}</h3>
              <AlertTriangle size={16} className="text-rose-400 mb-1" />
            </div>
          </div>
          <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
            <p className="text-amber-300/60 text-[10px] font-black uppercase tracking-widest">Low Stock Alert</p>
            <div className="flex items-end justify-between mt-1">
              <h3 className="text-2xl font-black font-mono text-amber-400">{totals.lowStockCount}</h3>
              <Calendar size={16} className="text-amber-400 mb-1" />
            </div>
          </div>
        </div>
      </div>

      {activeTab === 'live' ? (
        <>
          {/* Detailed Breakdown Pipeline */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4 group">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-600 group-hover:scale-110 transition-transform">
                <Clock size={24} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Booked (In Packing)</p>
                <h4 className="text-xl font-black text-slate-900 dark:text-white font-mono">{totals.totalBooked.toLocaleString()}</h4>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4 group">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
                <PackageOpen size={24} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Packed (Ready for Dispatch)</p>
                <h4 className="text-xl font-black text-slate-900 dark:text-white font-mono">{totals.totalPacked.toLocaleString()}</h4>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4 group">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                <Truck size={24} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Out For Delivery</p>
                <h4 className="text-xl font-black text-slate-900 dark:text-white font-mono">{totals.totalDispatched.toLocaleString()}</h4>
              </div>
            </div>
          </div>



          {/* Filtering & Table Section */}
          <div className="bg-white dark:bg-slate-900 rounded-[32px] shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/20">
              <div className="flex flex-col lg:flex-row gap-4 justify-between items-stretch lg:items-center">
                <div className="relative flex-1 max-w-xl">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="text"
                    placeholder="Search by product name, SKU, or barcode..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 rounded-2xl text-sm focus:outline-none focus:border-indigo-500 transition-all font-medium"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-2 bg-white dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 rounded-2xl px-4 py-2 text-xs font-black text-slate-600 dark:text-slate-400">
                    <Layers size={14} />
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="bg-transparent focus:outline-none cursor-pointer"
                    >
                      <option value="all">All Categories</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-2 bg-white dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 rounded-2xl px-4 py-2 text-xs font-black text-slate-600 dark:text-slate-400">
                    <Filter size={14} />
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value as any)}
                      className="bg-transparent focus:outline-none cursor-pointer"
                    >
                      <option value="all">Status: All SKUs</option>
                      <option value="shortage">Status: Shortage (Deficit &lt; 0)</option>
                      <option value="low">Status: Low Stock (Below Min)</option>
                      <option value="excess">Status: Overstock (Above Max)</option>
                      <option value="moving">Status: Active Moving Items</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50/50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-black uppercase tracking-widest text-[10px] border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="py-4 px-6">Product Details</th>
                    <th className="py-4 px-3 text-center">Available Stock</th>
                    <th className="py-4 px-3 text-center">Book Quantity</th>
                    <th className="py-4 px-3 text-center">In Pipeline</th>
                    <th className="py-4 px-3 text-center">Last Move</th>
                    <th className="py-4 px-3 text-right">Activity</th>
                    <th className="py-4 px-6 text-center">Stock Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {reportData.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-20 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-300">
                            <PackageOpen size={40} />
                          </div>
                          <p className="text-slate-500 font-black">No stock records matching your search.</p>
                          <button 
                            onClick={() => {setSearchQuery(''); setStatusFilter('all'); setSelectedCategory('all');}}
                            className="text-indigo-500 text-xs font-bold hover:underline cursor-pointer"
                          >
                            Clear all filters
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    reportData.map((item) => {
                      const isLow = item.availableStock < (item.minimum_stock || 5) && item.availableStock >= 0;
                      const isShort = item.availableStock < 0;
                      
                      return (
                        <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-4">
                              <div className="relative shrink-0">
                                {item.image_url ? (
                                  <img 
                                    src={item.image_url} 
                                    alt={item.name} 
                                    className="w-12 h-12 object-cover rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-white shadow-sm"
                                  />
                                ) : (
                                  <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400">
                                    <Package size={20} />
                                  </div>
                                )}
                                {isShort && (
                                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 border-2 border-white dark:border-slate-900 rounded-full animate-ping"></div>
                                )}
                              </div>
                              <div>
                                <h5 className="text-sm font-black text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">
                                  {item.name}
                                </h5>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded uppercase tracking-tighter">
                                    {item.sku}
                                  </span>
                                  <span className="text-[10px] text-slate-300">•</span>
                                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.categoryName}</span>
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="py-4 px-3 text-center">
                            <div className="inline-flex flex-col items-center">
                              <button
                                type="button"
                                onClick={() => handleOpenQuickAdjust(item, 'add', 5)}
                                title={`Available Stock: ${item.availableStock} (Physical: ${item.physicalStock} - Booked: ${item.bookQty})`}
                                className={`text-sm font-black font-mono px-3 py-1 rounded-xl shadow-xs border cursor-pointer hover:scale-105 active:scale-95 transition-transform ${
                                  isShort 
                                    ? 'bg-rose-500 text-white border-rose-600 shadow-sm' 
                                    : isLow 
                                      ? 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/50' 
                                      : 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/50'
                                }`}
                              >
                                {item.availableStock}
                              </button>
                              {isShort && <span className="text-[9px] text-rose-500 font-black mt-1 uppercase tracking-wider">Deficit ({item.availableStock})</span>}
                              {isLow && <span className="text-[9px] text-amber-500 font-black mt-1 uppercase tracking-wider">Refill Needed</span>}
                              {!isShort && !isLow && <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold mt-1 uppercase tracking-wider">In Stock</span>}
                            </div>
                          </td>

                          <td className="py-4 px-3 text-center">
                            <div className="inline-flex flex-col items-center">
                              <span className={`text-sm font-black font-mono px-3 py-1 rounded-xl border ${
                                item.bookQty > 0 
                                  ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/50' 
                                  : 'bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                              }`}>
                                {item.bookQty}
                              </span>
                              <span className="text-[9px] text-slate-400 font-bold mt-1 uppercase">Book Quantity</span>
                            </div>
                          </td>

                          <td className="py-4 px-3 text-center">
                            <div className="flex flex-col items-center gap-1">
                              <div className="flex -space-x-2">
                                {item.bookQty > 0 && <div className="w-6 h-6 rounded-full bg-amber-500 border-2 border-white dark:border-slate-900 flex items-center justify-center text-[8px] font-black text-white" title={`Booked: ${item.bookQty}`}>B</div>}
                                {item.packQty > 0 && <div className="w-6 h-6 rounded-full bg-indigo-500 border-2 border-white dark:border-slate-900 flex items-center justify-center text-[8px] font-black text-white" title={`Packed: ${item.packQty}`}>P</div>}
                                {item.outForDeliveryQty > 0 && <div className="w-6 h-6 rounded-full bg-blue-500 border-2 border-white dark:border-slate-900 flex items-center justify-center text-[8px] font-black text-white" title={`Transit: ${item.outForDeliveryQty}`}>T</div>}
                              </div>
                              <span className="text-[11px] font-black text-slate-500 font-mono">
                                {item.activePipelineQty} units
                              </span>
                            </div>
                          </td>



                          <td className="py-4 px-3 text-center">
                            {item.lastMovement ? (
                              <div className="flex flex-col items-center">
                                <div className="flex items-center gap-1">
                                  <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-tighter ${
                                    item.lastMovementType === 'In' || item.lastMovementType === 'Return' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                  }`}>
                                    {item.lastMovementType}
                                  </span>
                                  {typeof item.lastMovementQty === 'number' && (
                                    <span className={`text-[10px] font-black font-mono ${
                                      item.lastMovementQty > 0 ? 'text-emerald-600 dark:text-emerald-400' : item.lastMovementQty < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-500'
                                    }`}>
                                      {item.lastMovementQty > 0 ? `+${item.lastMovementQty}` : item.lastMovementQty}
                                    </span>
                                  )}
                                </div>
                                <span className="text-[9px] text-slate-400 mt-1 font-medium whitespace-nowrap">
                                  {new Date(item.lastMovement).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            ) : (
                              <span className="text-slate-300 text-[10px]">---</span>
                            )}
                          </td>

                          <td className="py-4 px-3 text-right">
                            <div className="flex flex-col items-end">
                              <span className="text-xs font-black text-slate-700 dark:text-slate-200">{item.totalOrderQty} Orders</span>
                              <div className="w-20 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full mt-1.5 overflow-hidden">
                                <div 
                                  className="h-full bg-indigo-500 rounded-full" 
                                  style={{ width: `${Math.min(100, (item.totalOrderQty / 50) * 100)}%` }}
                                ></div>
                              </div>
                            </div>
                          </td>

                          <td className="py-4 px-6 text-center">
                            <div className="flex justify-center items-center gap-1.5">
                              <button 
                                type="button"
                                onClick={() => handleOpenQuickAdjust(item, 'add', 5)}
                                className="px-2.5 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-all cursor-pointer font-black text-[11px] flex items-center gap-1 border border-emerald-200 dark:border-emerald-800 shadow-2xs hover:scale-105 active:scale-95"
                                title="Add Stock (+) to this SKU"
                              >
                                <Plus size={13} className="stroke-[3]" />
                                <span>Add</span>
                              </button>
                              
                              <button 
                                type="button"
                                onClick={() => handleOpenQuickAdjust(item, 'deduct', 5)}
                                className="px-2.5 py-1.5 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-xl hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-all cursor-pointer font-black text-[11px] flex items-center gap-1 border border-rose-200 dark:border-rose-800 shadow-2xs hover:scale-105 active:scale-95"
                                title="Deduct / Minus Stock (-) from this SKU"
                              >
                                <Minus size={13} className="stroke-[3]" />
                                <span>Minus</span>
                              </button>

                              {onOpenInventory && (
                                <button 
                                  type="button"
                                  onClick={() => onOpenInventory(item.id)}
                                  className="p-1.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer hover:scale-105 active:scale-95"
                                  title="Open Full Inventory Ledger for this item"
                                >
                                  <Sliders size={15} />
                                </button>
                              )}
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
        </>
      ) : (
        /* Stock Ledger / History Tab */
        <div className="bg-white dark:bg-slate-900 rounded-[32px] shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/30">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
              <History size={16} className="text-indigo-500" />
              Stock Movement History
            </h3>
            <div className="flex items-center gap-2">
               <span className="text-[10px] font-bold text-slate-400">Showing {ledgerData.length} records</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50/50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-black uppercase tracking-widest text-[10px] border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="py-4 px-6">Timestamp</th>
                  <th className="py-4 px-6">Product Item</th>
                  <th className="py-4 px-4 text-center">Type</th>
                  <th className="py-4 px-4 text-center">Change</th>
                  <th className="py-4 px-6">Source / Notes</th>
                  <th className="py-4 px-6">User</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {ledgerData.slice(0, 100).map((log) => {
                  const isPositive = log.change_qty > 0;
                  const isZero = log.change_qty === 0;

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="py-4 px-6 text-[11px] font-mono text-slate-500 whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex flex-col">
                          <span className="text-xs font-black text-slate-900 dark:text-white">{log.productName}</span>
                          <span className="text-[10px] font-mono text-slate-400 uppercase">{log.sku}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                          log.type === 'In' ? 'bg-emerald-100 text-emerald-700' :
                          log.type === 'Out' ? 'bg-rose-100 text-rose-700' :
                          log.type === 'Return' ? 'bg-blue-100 text-blue-700' :
                          'bg-amber-100 text-amber-700'
                        }`}>
                          {log.type}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className={`text-sm font-black font-mono ${isZero ? 'text-slate-400' : isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {isPositive ? '+' : ''}{log.change_qty}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <p className="text-xs text-slate-600 dark:text-slate-400 font-medium line-clamp-1 max-w-[250px]" title={log.notes}>
                          {log.notes}
                        </p>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                           <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-500">
                             {log.created_by?.substring(0, 1).toUpperCase() || 'S'}
                           </div>
                           <span className="text-[11px] font-bold text-slate-500 italic">Staff</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================== QUICK STOCK ADJUSTMENT MODAL ==================== */}
      {quickAdjustProduct && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-lg max-h-[calc(100dvh-2rem)] flex flex-col overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-150 my-auto">
            {/* Modal Header - Fixed at Top */}
            <div className="bg-slate-900 text-white px-5 sm:px-6 py-4 flex items-center justify-between border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`p-2.5 rounded-2xl shrink-0 ${adjustMode === 'add' ? 'bg-emerald-500/20 text-emerald-400' : adjustMode === 'deduct' ? 'bg-rose-500/20 text-rose-400' : 'bg-indigo-500/20 text-indigo-400'}`}>
                  <PackagePlus size={20} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-black uppercase tracking-wider text-white">
                    Stock Adjustment
                  </h3>
                  <p className="text-slate-400 text-xs font-semibold truncate">
                    {quickAdjustProduct.name} <span className="font-mono text-[10px] text-indigo-400">({quickAdjustProduct.sku})</span>
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setQuickAdjustProduct(null)}
                className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer shrink-0"
                title="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body - Scrollable Middle */}
            <div className="p-5 sm:p-6 space-y-4 sm:space-y-5 overflow-y-auto flex-1 min-h-0 overscroll-contain">
              {/* Action Mode Toggle */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Adjustment Type
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => { setAdjustMode('add'); setAdjustReason('Stock Inward / Replenishment'); }}
                    className={`py-2.5 px-3 rounded-2xl text-xs font-black border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      adjustMode === 'add'
                        ? 'bg-emerald-500 text-white border-emerald-600 shadow-md shadow-emerald-500/20'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                    }`}
                  >
                    <Plus size={14} className="stroke-[3]" />
                    <span>Add Stock (+)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setAdjustMode('deduct'); setAdjustReason('Stock Reduction / Audit'); }}
                    className={`py-2.5 px-3 rounded-2xl text-xs font-black border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      adjustMode === 'deduct'
                        ? 'bg-rose-500 text-white border-rose-600 shadow-md shadow-rose-500/20'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-rose-50 dark:hover:bg-rose-950/30'
                    }`}
                  >
                    <Minus size={14} className="stroke-[3]" />
                    <span>Deduct Stock (-)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setAdjustMode('set'); setAdjustReason('Physical Inventory Count / Correction'); setAdjustQtyInput(modalCurrentStock); }}
                    className={`py-2.5 px-3 rounded-2xl text-xs font-black border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      adjustMode === 'set'
                        ? 'bg-indigo-600 text-white border-indigo-700 shadow-md shadow-indigo-600/20'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/30'
                    }`}
                  >
                    <Sliders size={14} />
                    <span>Set Exact (=)</span>
                  </button>
                </div>
              </div>

              {/* Quantity Input & Preset Pills */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {adjustMode === 'set' ? 'New Exact Stock Level' : 'Quantity to Add / Minus'}
                  </label>
                  <span className="text-[11px] font-bold text-slate-500">
                    Unit: <strong className="text-slate-800 dark:text-slate-200">{quickAdjustProduct.unit || 'units'}</strong>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustQtyInput(prev => Math.max(1, (Number(prev) || 0) - 1))}
                    className="w-11 h-11 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center font-black text-base cursor-pointer shrink-0 transition-colors"
                  >
                    <Minus size={16} />
                  </button>
                  <input
                    type="number"
                    min={adjustMode === 'set' ? 0 : 1}
                    value={adjustQtyInput}
                    onChange={(e) => setAdjustQtyInput(e.target.value)}
                    className="flex-1 py-2.5 px-4 bg-slate-50 dark:bg-slate-800/80 border-2 border-slate-200 dark:border-slate-700 rounded-2xl text-center text-lg font-black font-mono text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 transition-colors"
                    placeholder="Enter quantity..."
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setAdjustQtyInput(prev => (Number(prev) || 0) + 1)}
                    className="w-11 h-11 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center font-black text-base cursor-pointer shrink-0 transition-colors"
                  >
                    <Plus size={16} />
                  </button>
                </div>

                {/* Fast Presets */}
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mr-1">Quick Select:</span>
                  {[1, 5, 10, 20, 50, 100].map(amt => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setAdjustQtyInput(amt)}
                      className={`px-3 py-1 rounded-xl text-[11px] font-black font-mono transition-all cursor-pointer border ${
                        Number(adjustQtyInput) === amt
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {amt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Live Impact Calculation Preview Card */}
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 space-y-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Real-time Stock Impact Preview
                </p>
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div className="bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-100 dark:border-slate-800">
                    <span className="text-[8px] font-bold text-slate-400 uppercase">Physical</span>
                    <h5 className="text-sm font-black font-mono text-slate-700 dark:text-slate-200 mt-0.5">{modalCurrentStock}</h5>
                  </div>
                  <div className={`p-2 rounded-xl border ${
                    modalCalculatedDelta > 0 
                      ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 text-emerald-700 dark:text-emerald-400' 
                      : modalCalculatedDelta < 0
                        ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 text-rose-700 dark:text-rose-400'
                        : 'bg-slate-100 dark:bg-slate-900 border-slate-200 text-slate-500'
                  }`}>
                    <span className="text-[8px] font-bold uppercase">Delta</span>
                    <h5 className="text-sm font-black font-mono mt-0.5">
                      {modalCalculatedDelta > 0 ? `+${modalCalculatedDelta}` : modalCalculatedDelta}
                    </h5>
                  </div>
                  <div className="bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-100 dark:border-slate-800">
                    <span className="text-[8px] font-bold text-amber-500 uppercase">Booked Qty</span>
                    <h5 className="text-sm font-black font-mono text-amber-600 dark:text-amber-400 mt-0.5">{modalBookedQty}</h5>
                  </div>
                  <div className={`p-2 rounded-xl border ${
                    modalNewAvailable < 0 
                      ? 'bg-rose-500 text-white border-rose-600' 
                      : 'bg-indigo-50 dark:bg-indigo-950/30 border-indigo-200 text-indigo-700 dark:text-indigo-400'
                  }`}>
                    <span className="text-[8px] font-bold uppercase">Net Available</span>
                    <h5 className="text-sm font-black font-mono mt-0.5">{modalNewAvailable}</h5>
                  </div>
                </div>
              </div>

              {/* Audit Reason & Quick Pills */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Audit Reason / Note (Optional)
                </label>
                <input
                  type="text"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="e.g. Received new stock consignment, audit count correction..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                />
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {(adjustMode === 'add' 
                    ? ['Consignment Received', 'Vendor Restock', 'Stock Audit Count', 'Customer Return']
                    : ['Damaged in Transit', 'Audit Count Deficit', 'Expired / Spoiled', 'Internal Consumption']
                  ).map(pill => (
                    <button
                      key={pill}
                      type="button"
                      onClick={() => setAdjustReason(pill)}
                      className="text-[10px] px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 cursor-pointer font-medium transition-colors"
                    >
                      + {pill}
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* Action Buttons - Fixed at Bottom, Never Cut Off */}
            <div className="p-4 sm:p-5 bg-slate-50/90 dark:bg-slate-900/90 backdrop-blur-xs border-t border-slate-100 dark:border-slate-800 shrink-0">
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setQuickAdjustProduct(null)}
                  disabled={isSubmittingAdjust}
                  className="flex-1 py-3 px-4 bg-slate-200/70 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-2xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmQuickAdjust}
                  disabled={isSubmittingAdjust}
                  className={`flex-1 py-3 px-4 text-white text-xs font-black rounded-2xl transition-all shadow-lg cursor-pointer flex items-center justify-center gap-2 ${
                    adjustMode === 'add'
                      ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20'
                      : adjustMode === 'deduct'
                        ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-500/20'
                        : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/20'
                  }`}
                >
                  {isSubmittingAdjust ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>Updating...</span>
                    </>
                  ) : (
                    <>
                      <Check size={16} />
                      <span>Confirm Stock ({modalCalculatedDelta > 0 ? `+${modalCalculatedDelta}` : modalCalculatedDelta})</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
