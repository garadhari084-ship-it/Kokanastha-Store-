import { PageHeader } from './PageHeader';
import React, { useEffect, useState } from 'react';
import { 
  ShoppingBag, PlusCircle, Search, Truck, FileText, Calendar, DollarSign, X, Check, CheckCircle, Clock, Package, Download, Building, ArrowRight, Printer, AlertTriangle, ChevronRight, FileSpreadsheet, Store
} from 'lucide-react';
import { dbStore } from '../services/store';
import { PurchaseOrder, Supplier, Product, UserProfile, PurchaseItem } from '../types/erp';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface PurchaseModuleProps {
  businessId: string;
  user: UserProfile;
  triggerToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const PurchaseModule: React.FC<PurchaseModuleProps> = ({ 
  businessId, 
  user, 
  triggerToast 
}) => {
  const [purchases, setPurchases] = useState<PurchaseOrder[]>(dbStore.getPurchaseOrders(businessId));
  const [suppliers, setSuppliers] = useState<Supplier[]>(dbStore.getSuppliers(businessId));
  const [products, setProducts] = useState<Product[]>(dbStore.getProducts(businessId));
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewingOrder, setViewingOrder] = useState<PurchaseOrder | null>(null);

  // Form states for creating a new PO
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [items, setItems] = useState<PurchaseItem[]>([]);
  
  // Quick item add row state
  const [rowProductId, setRowProductId] = useState('');
  const [rowQty, setRowQty] = useState(10);
  const [rowPrice, setRowPrice] = useState(0);

  const resetForm = () => {
    setSelectedSupplierId(suppliers[0]?.id || '');
    setDeliveryDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    setItems([]);
    setRowProductId('');
    setRowQty(10);
    setRowPrice(0);
  };

  useEffect(() => {
    return dbStore.subscribe(() => {
      setPurchases(dbStore.getPurchaseOrders(businessId));
      setSuppliers(dbStore.getSuppliers(businessId));
      setProducts(dbStore.getProducts(businessId));
    });
  }, [businessId]);

  const handleOpenAddModal = () => {
    if (suppliers.length === 0) {
      triggerToast('Please add a vendor first in the Supplier module.', 'error');
      return;
    }
    if (products.length === 0) {
      triggerToast('Please add products first in the Inventory module.', 'error');
      return;
    }
    resetForm();
    setIsModalOpen(true);
  };

  const handleProductSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const pId = e.target.value;
    setRowProductId(pId);
    const prod = products.find(p => p.id === pId);
    if (prod) {
      setRowPrice(prod.purchase_price);
    }
  };

  const handleAddRowItem = () => {
    if (!rowProductId) {
      triggerToast('Please select a product first.', 'error');
      return;
    }
    if (rowQty <= 0) {
      triggerToast('Quantity must be greater than zero.', 'error');
      return;
    }
    
    const prod = products.find(p => p.id === rowProductId);
    if (!prod) return;

    if (items.some(it => it.product_id === rowProductId)) {
      triggerToast('This product is already added to the order. Adjust qty instead.', 'error');
      return;
    }

    const newItem: PurchaseItem = {
      product_id: rowProductId,
      qty: rowQty,
      received_qty: 0,
      purchase_price: rowPrice,
      gst_rate: prod.gst_rate
    };

    setItems([...items, newItem]);
    setRowProductId('');
    setRowQty(10);
    setRowPrice(0);
  };

  const handleRemoveItem = (prodId: string) => {
    setItems(items.filter(i => i.product_id !== prodId));
  };

  const handleSavePO = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplierId) {
      triggerToast('Please select a vendor.', 'error');
      return;
    }
    if (items.length === 0) {
      triggerToast('Please add at least one item to the PO.', 'error');
      return;
    }

    let totalAmount = 0;
    items.forEach(i => {
      const lineTotal = i.qty * i.purchase_price;
      const tax = lineTotal * (i.gst_rate / 100);
      totalAmount += (lineTotal + tax);
    });

    const poNumber = `PO-${new Date().getFullYear()}${String(new Date().getMonth()+1).padStart(2, '0')}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;

    try {
      dbStore.createPurchaseOrder({
        order_number: poNumber,
        supplier_id: selectedSupplierId,
        order_date: new Date().toISOString().split('T')[0],
        delivery_date: deliveryDate,
        status: 'Draft',
        payment_status: 'Unpaid',
        items: items,
        total_amount: totalAmount,
        business_id: businessId
      });
      dbStore.logActivity(user.id, user.name, user.role, 'Create PO', `Generated new Purchase Order: ${poNumber}`, businessId);
      triggerToast(`Purchase Order ${poNumber} created successfully.`, 'success');
      setIsModalOpen(false);
    } catch (e: any) {
      triggerToast(e.message || 'Error creating PO', 'error');
    }
  };

  const handleUpdateStatus = (poId: string, newStatus: PurchaseOrder['status']) => {
    try {
      dbStore.updatePurchaseOrder(poId, { status: newStatus });
      dbStore.logActivity(user.id, user.name, user.role, 'Update PO', `Updated PO status to ${newStatus}`, businessId);
      triggerToast(`Order status updated to ${newStatus}`, 'success');
      setViewingOrder(null);
    } catch (err: any) {
      triggerToast(err.message || 'Error updating status', 'error');
    }
  };

  const handlePrintPO = (po: PurchaseOrder) => {
    try {
      const doc = new jsPDF();
      const sup = suppliers.find(s => s.id === po.supplier_id);
      
      doc.setFontSize(22);
      doc.setTextColor(30, 41, 59);
      doc.text('PURCHASE ORDER', 14, 22);
      
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text(`PO Number: ${po.order_number}`, 14, 32);
      doc.text(`Order Date: ${po.order_date}`, 14, 38);
      doc.text(`Delivery Date: ${po.delivery_date}`, 14, 44);
      
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(12);
      doc.text('Vendor Details', 120, 32);
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text(sup?.name || 'Unknown Vendor', 120, 38);
      doc.text(`Phone: ${sup?.phone || '-'}`, 120, 44);
      doc.text(`GSTIN: ${sup?.gstin || '-'}`, 120, 50);

      const tableColumn = ["Product Name", "Qty", "Unit Price", "GST %", "Total"];
      const tableRows = po.items.map(item => {
        const prod = products.find(p => p.id === item.product_id);
        const lineTotal = item.qty * item.purchase_price;
        const tax = lineTotal * (item.gst_rate / 100);
        return [
          prod?.name || 'Unknown',
          item.qty.toString(),
          `Rs. ${item.purchase_price.toLocaleString()}`,
          `${item.gst_rate}%`,
          `Rs. ${(lineTotal + tax).toLocaleString()}`
        ];
      });

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 60,
        theme: 'striped',
        headStyles: { fillColor: [79, 70, 229], textColor: 255, fontSize: 10, fontStyle: 'bold' },
        bodyStyles: { fontSize: 9 },
        alternateRowStyles: { fillColor: [248, 250, 252] },
      });

      doc.setFontSize(12);
      doc.setTextColor(30, 41, 59);
      doc.text(`Total Amount: Rs. ${po.total_amount.toLocaleString()}`, 14, (doc as any).lastAutoTable.finalY + 15);
      
      doc.save(`${po.order_number}.pdf`);
      triggerToast('Purchase Order PDF generated.', 'success');
      dbStore.logActivity(user.id, user.name, user.role, 'Print PO', `Printed Purchase Order: ${po.order_number}`, businessId);
    } catch (err) {
      console.error(err);
      triggerToast('Failed to generate PDF.', 'error');
    }
  };

  const getProductName = (id: string) => products.find(p => p.id === id)?.name || 'Unknown Product';
  const getSupplierName = (id: string) => suppliers.find(s => s.id === id)?.name || 'Unknown Vendor';

  const filteredPurchases = purchases.filter(po => 
    po.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    getSupplierName(po.supplier_id).toLowerCase().includes(searchQuery.toLowerCase())
  ).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  // KPIs
  const totalPOAmount = purchases.reduce((sum, po) => sum + po.total_amount, 0);
  const pendingDeliveries = purchases.filter(po => po.status === 'Ordered').length;
  const draftPOs = purchases.filter(po => po.status === 'Draft').length;

  return (
    <div className="space-y-4 max-w-full pb-8 px-0 font-sans text-slate-900 dark:text-slate-100 overflow-x-hidden animate-in fade-in duration-300">
      <PageHeader
        title="Procurement & Purchase Lifecycle"
        subtitle="Manage supplier purchase orders, track inbound deliveries, and audit accounts payable."
        icon={ShoppingBag}
        rightContent={
          <div className="flex flex-wrap gap-2">
            <button className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-semibold cursor-pointer shadow-sm transition-colors">
              <FileSpreadsheet size={16} className="text-emerald-600" />
              <span>Export CSV</span>
            </button>
            {user.role !== 'Viewer' && (
              <button 
                onClick={handleOpenAddModal} 
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[11px] font-semibold cursor-pointer shadow-sm transition-colors"
              >
                <PlusCircle size={16} />
                <span>Create Purchase Order</span>
              </button>
            )}
          </div>
        }
      />

      <div className="px-0.5 sm:px-1 space-y-4">
        {/* Advanced KPI Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-3 sm:p-4 rounded-xl shadow-xs hover:shadow-md hover:border-slate-400 dark:hover:border-slate-600 transition-all cursor-default group flex flex-col justify-between gap-1">
            <div className="flex items-center gap-1.5">
              <div className="p-1.5 bg-slate-500/10 dark:bg-slate-500/20 text-slate-600 dark:text-slate-400 rounded-lg group-hover:scale-110 transition-transform shrink-0">
                <FileText size={14} />
              </div>
              <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">TOTAL POs</span>
            </div>
            <div className="flex flex-col gap-0.5 mt-0.5">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">Lifetime historical orders</span>
            </div>
            <div className="text-right mt-1">
              <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {purchases.length}
              </span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-3 sm:p-4 rounded-xl shadow-xs hover:shadow-md hover:border-indigo-400 dark:hover:border-indigo-600 transition-all cursor-default group flex flex-col justify-between gap-1">
            <div className="flex items-center gap-1.5">
              <div className="p-1.5 bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-lg group-hover:scale-110 transition-transform shrink-0">
                <DollarSign size={14} />
              </div>
              <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">LIFETIME SPEND</span>
            </div>
            <div className="flex flex-col gap-0.5 mt-0.5">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">Total procurement value</span>
            </div>
            <div className="text-right mt-1">
              <span className="text-xl sm:text-2xl font-black text-indigo-600 dark:text-indigo-400 tracking-tight">
                ₹{totalPOAmount.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-3 sm:p-4 rounded-xl shadow-xs hover:shadow-md hover:border-emerald-400 dark:hover:border-emerald-600 transition-all cursor-default group flex flex-col justify-between gap-1">
            <div className="flex items-center gap-1.5">
              <div className="p-1.5 bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-lg group-hover:scale-110 transition-transform shrink-0">
                <Truck size={14} />
              </div>
              <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">PENDING DELIVERIES</span>
            </div>
            <div className="flex flex-col gap-0.5 mt-0.5">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">Ordered but not received</span>
            </div>
            <div className="text-right mt-1">
              <span className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
                {pendingDeliveries}
              </span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-3 sm:p-4 rounded-xl shadow-xs hover:shadow-md hover:border-amber-400 dark:hover:border-amber-600 transition-all cursor-default group flex flex-col justify-between gap-1">
            <div className="flex items-center gap-1.5">
              <div className="p-1.5 bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-lg group-hover:scale-110 transition-transform shrink-0">
                <Clock size={14} />
              </div>
              <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">DRAFT POS</span>
            </div>
            <div className="flex flex-col gap-0.5 mt-0.5">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">Awaiting vendor confirmation</span>
            </div>
            <div className="text-right mt-1">
              <span className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400 tracking-tight">
                {draftPOs}
              </span>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-2 mt-4">
          <div className="relative flex-1 flex items-center">
            <Search size={14} className="absolute left-3 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search PO by number or vendor..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-900 text-xs font-medium rounded-xl border border-slate-300 dark:border-slate-700 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-400"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 text-slate-400 hover:text-slate-600">
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Main List Table */}
        <div className="bg-white dark:bg-slate-900 overflow-x-auto rounded-xl border border-slate-300 dark:border-slate-700 shadow-xs mt-2">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700 text-[10px]">
              <tr>
                <th className="py-3 px-4">PO Details</th>
                <th className="py-3 px-4">Vendor</th>
                <th className="py-3 px-4 text-center">Lifecycle Status</th>
                <th className="py-3 px-4 text-right">Order Value</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredPurchases.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">
                    <Store size={24} className="mx-auto mb-2 opacity-30" />
                    <p className="font-semibold">No purchase orders found.</p>
                  </td>
                </tr>
              ) : (
                filteredPurchases.map(po => (
                  <tr key={po.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-2.5 px-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900 dark:text-white font-mono text-[13px]">{po.order_number}</span>
                        <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-500">
                          <span className="flex items-center gap-1"><Calendar size={10}/> Order: {po.order_date}</span>
                          <span className="flex items-center gap-1"><Truck size={10}/> Est: {po.delivery_date}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0">
                          <Building size={12} className="text-slate-500" />
                        </div>
                        <span className="font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[150px]">
                          {getSupplierName(po.supplier_id)}
                        </span>
                      </div>
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        po.status === 'Draft' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800' :
                        po.status === 'Ordered' ? 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400 border border-sky-200 dark:border-sky-800' :
                        po.status === 'Received' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800' :
                        'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                      }`}>
                        {po.status === 'Draft' && <Clock size={10} className="mr-1" />}
                        {po.status === 'Ordered' && <Truck size={10} className="mr-1" />}
                        {po.status === 'Received' && <CheckCircle size={10} className="mr-1" />}
                        {po.status === 'Cancelled' && <X size={10} className="mr-1" />}
                        {po.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <span className="font-black text-[13px] text-slate-900 dark:text-white">
                        ₹{po.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <button 
                        onClick={() => setViewingOrder(po)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded hover:bg-slate-50 dark:hover:bg-slate-700 text-[11px] font-bold transition-colors cursor-pointer"
                      >
                        Details <ChevronRight size={12} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View PO Details Modal */}
      {viewingOrder && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                  <Package size={16} className="text-white" />
                </div>
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-wider">Purchase Order Overview</h2>
                  <p className="text-[10px] text-slate-400 font-mono">{viewingOrder.order_number}</p>
                </div>
              </div>
              <button onClick={() => setViewingOrder(null)} className="text-slate-400 hover:text-white transition-colors cursor-pointer p-1">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto bg-slate-50 dark:bg-slate-900/50 flex-1 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-6">
                
                {/* Items Table */}
                <div>
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Line Items ({viewingOrder.items.length})</h3>
                  <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
                          <th className="py-2.5 px-4 font-bold text-slate-600 dark:text-slate-400">Product</th>
                          <th className="py-2.5 px-4 font-bold text-slate-600 dark:text-slate-400 text-right">Qty</th>
                          <th className="py-2.5 px-4 font-bold text-slate-600 dark:text-slate-400 text-right">Price</th>
                          <th className="py-2.5 px-4 font-bold text-slate-600 dark:text-slate-400 text-right">Tax</th>
                          <th className="py-2.5 px-4 font-bold text-slate-600 dark:text-slate-400 text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                        {viewingOrder.items.map((item, idx) => {
                          const lineBase = item.qty * item.purchase_price;
                          const lineTax = lineBase * (item.gst_rate / 100);
                          return (
                            <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                              <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">{getProductName(item.product_id)}</td>
                              <td className="py-3 px-4 text-right font-black text-slate-900 dark:text-white">{item.qty}</td>
                              <td className="py-3 px-4 text-right">₹{item.purchase_price.toLocaleString()}</td>
                              <td className="py-3 px-4 text-right text-[10px] text-slate-500">{item.gst_rate}%</td>
                              <td className="py-3 px-4 text-right font-bold text-indigo-600 dark:text-indigo-400">₹{(lineBase + lineTax).toLocaleString(undefined, {minimumFractionDigits:2})}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Status Transitions */}
                {user.role !== 'Viewer' && viewingOrder.status !== 'Received' && viewingOrder.status !== 'Cancelled' && (
                  <div className="bg-indigo-50/50 dark:bg-indigo-900/10 rounded-xl p-4 border border-indigo-100 dark:border-indigo-900/30 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-indigo-900 dark:text-indigo-300 uppercase tracking-wider flex items-center gap-1.5"><ArrowRight size={14}/> Advance Lifecycle Status</h4>
                      <p className="text-[11px] text-indigo-700 dark:text-indigo-400 mt-1">Move this PO to the next stage in procurement.</p>
                    </div>
                    <div className="flex gap-2">
                      {viewingOrder.status === 'Draft' && (
                        <button 
                          onClick={() => handleUpdateStatus(viewingOrder.id, 'Ordered')}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg cursor-pointer transition-colors shadow-sm"
                        >
                          Mark as Ordered
                        </button>
                      )}
                      {viewingOrder.status === 'Ordered' && (
                        <button 
                          onClick={() => {
                            if (window.confirm('Receiving this PO will automatically increase inventory stock in the ledger. Proceed?')) {
                              handleUpdateStatus(viewingOrder.id, 'Received');
                            }
                          }}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg cursor-pointer transition-colors shadow-sm flex items-center gap-1.5"
                        >
                          <CheckCircle size={14} /> Receive Goods
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Sidebar Info */}
              <div className="space-y-4">
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm">
                  <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3">Order Summary</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-700/50">
                      <span className="text-xs text-slate-600 dark:text-slate-400">Status</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        viewingOrder.status === 'Draft' ? 'bg-amber-100 text-amber-700' :
                        viewingOrder.status === 'Ordered' ? 'bg-sky-100 text-sky-700' :
                        viewingOrder.status === 'Received' ? 'bg-emerald-100 text-emerald-700' :
                        'bg-rose-100 text-rose-700'
                      }`}>
                        {viewingOrder.status}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-700/50">
                      <span className="text-xs text-slate-600 dark:text-slate-400">Total Value</span>
                      <span className="text-sm font-black text-slate-900 dark:text-white">₹{viewingOrder.total_amount.toLocaleString(undefined, {minimumFractionDigits:2})}</span>
                    </div>
                    <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-700/50">
                      <span className="text-xs text-slate-600 dark:text-slate-400">Vendor</span>
                      <span className="text-xs font-semibold text-slate-900 dark:text-white truncate max-w-[120px]">{getSupplierName(viewingOrder.supplier_id)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-600 dark:text-slate-400">Est. Delivery</span>
                      <span className="text-xs font-mono text-slate-900 dark:text-white">{viewingOrder.delivery_date}</span>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => handlePrintPO(viewingOrder)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl transition-colors cursor-pointer border border-slate-300 dark:border-slate-600"
                >
                  <Printer size={16} /> Print Official PO Document
                </button>

                {user.role !== 'Viewer' && viewingOrder.status === 'Draft' && (
                  <button 
                    onClick={() => {
                      if (window.confirm('Are you sure you want to cancel this PO?')) {
                        handleUpdateStatus(viewingOrder.id, 'Cancelled');
                      }
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    Cancel Order
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create New PO Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-in fade-in duration-200">
            <div className="bg-slate-50 dark:bg-slate-800 px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between shrink-0">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <PlusCircle size={16} className="text-indigo-600" />
                Draft New Purchase Order
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer transition-colors p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700">
                <X size={18} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              
              {/* Header Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/50 dark:bg-slate-800/30 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Select Vendor *</label>
                  <select 
                    value={selectedSupplierId}
                    onChange={(e) => setSelectedSupplierId(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-600 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                  >
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.name} - {s.phone}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Expected Delivery Date *</label>
                  <input 
                    type="date"
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 text-xs font-semibold font-mono rounded-lg border border-slate-300 dark:border-slate-600 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Add Item Row */}
              <div>
                <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 border-b border-slate-200 dark:border-slate-700 pb-2">Add Line Items</h3>
                <div className="flex flex-wrap md:flex-nowrap items-end gap-3 bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div className="flex-1 min-w-[200px] space-y-1">
                    <label className="text-[10px] font-semibold text-slate-500">Product</label>
                    <select 
                      value={rowProductId}
                      onChange={handleProductSelect}
                      className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-900 text-xs rounded border border-slate-300 dark:border-slate-600"
                    >
                      <option value="">-- Select Product --</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>{p.name} (Stock: {p.stock_quantity})</option>
                      ))}
                    </select>
                  </div>
                  <div className="w-24 space-y-1">
                    <label className="text-[10px] font-semibold text-slate-500">PO Qty</label>
                    <input 
                      type="number" 
                      min="1"
                      value={rowQty}
                      onChange={(e) => setRowQty(parseInt(e.target.value) || 0)}
                      className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-900 text-xs rounded border border-slate-300 dark:border-slate-600 text-right"
                    />
                  </div>
                  <div className="w-28 space-y-1">
                    <label className="text-[10px] font-semibold text-slate-500">Unit Price (₹)</label>
                    <input 
                      type="number" 
                      min="0"
                      value={rowPrice}
                      onChange={(e) => setRowPrice(parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-900 text-xs rounded border border-slate-300 dark:border-slate-600 text-right"
                    />
                  </div>
                  <button 
                    type="button"
                    onClick={handleAddRowItem}
                    className="px-4 py-1.5 h-[34px] bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold rounded cursor-pointer hover:bg-slate-700 dark:hover:bg-white transition-colors"
                  >
                    Add Item
                  </button>
                </div>
              </div>

              {/* Items List */}
              {items.length > 0 && (
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="py-2.5 px-4 font-semibold text-slate-600 dark:text-slate-400">Item</th>
                        <th className="py-2.5 px-4 font-semibold text-slate-600 dark:text-slate-400 text-right">Qty</th>
                        <th className="py-2.5 px-4 font-semibold text-slate-600 dark:text-slate-400 text-right">Unit Rate</th>
                        <th className="py-2.5 px-4 font-semibold text-slate-600 dark:text-slate-400 text-right">GST</th>
                        <th className="py-2.5 px-4 font-semibold text-slate-600 dark:text-slate-400 text-right">Line Total</th>
                        <th className="py-2.5 px-4"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                      {items.map((item, idx) => {
                        const lineBase = item.qty * item.purchase_price;
                        const lineTax = lineBase * (item.gst_rate / 100);
                        const lineTotal = lineBase + lineTax;
                        return (
                          <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                            <td className="py-2.5 px-4 font-medium">{getProductName(item.product_id)}</td>
                            <td className="py-2.5 px-4 text-right font-bold">{item.qty}</td>
                            <td className="py-2.5 px-4 text-right">₹{item.purchase_price.toLocaleString()}</td>
                            <td className="py-2.5 px-4 text-right text-slate-500 text-[10px]">{item.gst_rate}%</td>
                            <td className="py-2.5 px-4 text-right font-black text-indigo-600 dark:text-indigo-400">₹{lineTotal.toLocaleString()}</td>
                            <td className="py-2.5 px-2 text-center">
                              <button 
                                onClick={() => handleRemoveItem(item.product_id)}
                                className="text-slate-400 hover:text-rose-500 cursor-pointer p-1 rounded hover:bg-rose-50 dark:hover:bg-rose-900/20"
                              >
                                <X size={14} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700">
                      <tr>
                        <td colSpan={4} className="py-3 px-4 text-right font-bold text-slate-600 dark:text-slate-400 uppercase text-[10px] tracking-wider">
                          Gross PO Value:
                        </td>
                        <td className="py-3 px-4 text-right font-black text-sm text-slate-900 dark:text-white">
                          ₹{items.reduce((sum, i) => sum + (i.qty * i.purchase_price) * (1 + i.gst_rate/100), 0).toLocaleString(undefined, {minimumFractionDigits: 2})}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>

            <div className="bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 px-6 py-4 flex justify-between items-center shrink-0">
              <button 
                type="button" 
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors shadow-sm"
              >
                Cancel
              </button>
              <button 
                onClick={handleSavePO}
                disabled={items.length === 0}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 cursor-pointer shadow-sm transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <Check size={14} /> Submit Purchase Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
