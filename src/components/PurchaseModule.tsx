import { PageHeader } from './PageHeader';
import React, { useEffect, useState } from 'react';
import { 
  ShoppingBag, PlusCircle, Search, Truck, FileText, Calendar, DollarSign, X, Check, CheckCircle, Clock, Package, Download, Building, ArrowRight, Printer, AlertTriangle, ChevronRight, FileSpreadsheet, Store, CreditCard, QrCode, Wallet, CheckCircle2, Receipt, Banknote
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

  // Quick Payment Modal State
  const [paymentModalPO, setPaymentModalPO] = useState<PurchaseOrder | null>(null);
  const [paymentOption, setPaymentOption] = useState<'Paid' | 'Partial' | 'Unpaid'>('Paid');
  const [paymentAmountInput, setPaymentAmountInput] = useState<number>(0);
  const [paymentModeInput, setPaymentModeInput] = useState<'Cash' | 'UPI' | 'Bank Transfer' | 'Cheque' | 'Credit Card' | 'Other'>('UPI');
  const [paymentNotesInput, setPaymentNotesInput] = useState<string>('');
  const [paymentDateInput, setPaymentDateInput] = useState<string>(new Date().toISOString().split('T')[0]);

  // Form states for creating a new PO
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [items, setItems] = useState<PurchaseItem[]>([]);
  
  // Initial Payment Form states on Create PO
  const [initialPaymentStatus, setInitialPaymentStatus] = useState<'Unpaid' | 'Partial' | 'Paid'>('Unpaid');
  const [initialPaidAmount, setInitialPaidAmount] = useState<number>(0);
  const [initialPaymentMode, setInitialPaymentMode] = useState<'Cash' | 'UPI' | 'Bank Transfer' | 'Cheque' | 'Credit Card' | 'Other'>('UPI');
  const [initialPaymentNotes, setInitialPaymentNotes] = useState<string>('');

  // Quick item add row state
  const [rowProductId, setRowProductId] = useState('');
  const [rowQty, setRowQty] = useState(10);
  const [rowPrice, setRowPrice] = useState(0);

  const resetForm = () => {
    setSelectedSupplierId(suppliers[0]?.id || '');
    setDeliveryDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    setItems([]);
    setInitialPaymentStatus('Unpaid');
    setInitialPaidAmount(0);
    setInitialPaymentMode('UPI');
    setInitialPaymentNotes('');
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

  const handleOpenPaymentModal = (po: PurchaseOrder, defaultOpt?: 'Paid' | 'Partial' | 'Unpaid') => {
    setPaymentModalPO(po);
    const currStatus = defaultOpt || po.payment_status || 'Unpaid';
    setPaymentOption(currStatus);
    const currPaid = po.paid_amount || (po.payment_status === 'Paid' ? po.total_amount : 0);
    if (currStatus === 'Paid') {
      setPaymentAmountInput(po.total_amount);
    } else if (currStatus === 'Partial') {
      setPaymentAmountInput(currPaid > 0 ? currPaid : Math.round(po.total_amount / 2));
    } else {
      setPaymentAmountInput(0);
    }
    setPaymentModeInput(po.payment_mode || 'UPI');
    setPaymentNotesInput(po.payment_notes || '');
    setPaymentDateInput(po.payment_date || new Date().toISOString().split('T')[0]);
  };

  const handleSavePaymentRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentModalPO) return;

    let finalPaid = 0;
    let finalStatus: 'Unpaid' | 'Partial' | 'Paid' = 'Unpaid';

    if (paymentOption === 'Paid') {
      finalPaid = paymentModalPO.total_amount;
      finalStatus = 'Paid';
    } else if (paymentOption === 'Unpaid') {
      finalPaid = 0;
      finalStatus = 'Unpaid';
    } else {
      finalPaid = Math.max(0, paymentAmountInput);
      if (finalPaid >= paymentModalPO.total_amount) {
        finalPaid = paymentModalPO.total_amount;
        finalStatus = 'Paid';
      } else if (finalPaid > 0) {
        finalStatus = 'Partial';
      } else {
        finalStatus = 'Unpaid';
      }
    }

    try {
      dbStore.updatePurchaseOrder(paymentModalPO.id, {
        payment_status: finalStatus,
        paid_amount: finalPaid,
        payment_mode: paymentModeInput,
        payment_notes: paymentNotesInput.trim(),
        payment_date: paymentDateInput
      });

      dbStore.logActivity(
        user.id, user.name, user.role,
        'Payment Update',
        `Updated PO ${paymentModalPO.order_number} payment to ${finalStatus} (Paid: ₹${finalPaid})`,
        businessId
      );

      triggerToast(`Payment updated: PO ${paymentModalPO.order_number} marked as ${finalStatus} (₹${finalPaid.toLocaleString()}/${paymentModalPO.total_amount.toLocaleString()})`, 'success');
      
      const updatedPO = {
        ...paymentModalPO,
        payment_status: finalStatus,
        paid_amount: finalPaid,
        payment_mode: paymentModeInput,
        payment_notes: paymentNotesInput.trim(),
        payment_date: paymentDateInput
      };
      
      setPaymentModalPO(null);
      if (viewingOrder && viewingOrder.id === paymentModalPO.id) {
        setViewingOrder(updatedPO);
      }
    } catch (err: any) {
      triggerToast(err.message || 'Error updating payment', 'error');
    }
  };

  const handleQuickMarkPayment = (po: PurchaseOrder, newPaymentStatus: 'Paid' | 'Unpaid') => {
    const finalPaid = newPaymentStatus === 'Paid' ? po.total_amount : 0;
    try {
      dbStore.updatePurchaseOrder(po.id, {
        payment_status: newPaymentStatus,
        paid_amount: finalPaid,
        payment_date: newPaymentStatus === 'Paid' ? new Date().toISOString().split('T')[0] : undefined
      });
      dbStore.logActivity(
        user.id, user.name, user.role,
        'Quick Payment',
        `Quick marked PO ${po.order_number} as ${newPaymentStatus}`,
        businessId
      );
      triggerToast(`PO ${po.order_number} marked as ${newPaymentStatus}`, 'success');
      if (viewingOrder && viewingOrder.id === po.id) {
        setViewingOrder({
          ...viewingOrder,
          payment_status: newPaymentStatus,
          paid_amount: finalPaid,
          payment_date: newPaymentStatus === 'Paid' ? new Date().toISOString().split('T')[0] : undefined
        });
      }
    } catch (err: any) {
      triggerToast(err.message || 'Error updating payment', 'error');
    }
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

    let calcPaidAmount = 0;
    let finalPayStatus = initialPaymentStatus;
    if (initialPaymentStatus === 'Paid') {
      calcPaidAmount = totalAmount;
    } else if (initialPaymentStatus === 'Partial') {
      calcPaidAmount = Math.min(totalAmount, Math.max(0, initialPaidAmount));
      if (calcPaidAmount >= totalAmount) {
        finalPayStatus = 'Paid';
        calcPaidAmount = totalAmount;
      } else if (calcPaidAmount <= 0) {
        finalPayStatus = 'Unpaid';
        calcPaidAmount = 0;
      }
    } else {
      calcPaidAmount = 0;
    }

    try {
      dbStore.createPurchaseOrder({
        order_number: poNumber,
        supplier_id: selectedSupplierId,
        order_date: new Date().toISOString().split('T')[0],
        delivery_date: deliveryDate,
        status: 'Draft',
        payment_status: finalPayStatus,
        paid_amount: calcPaidAmount,
        payment_mode: initialPaymentMode,
        payment_notes: initialPaymentNotes.trim(),
        payment_date: calcPaidAmount > 0 ? new Date().toISOString().split('T')[0] : undefined,
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
  const totalPaidAmount = purchases.reduce((sum, po) => {
    if (po.payment_status === 'Paid') return sum + po.total_amount;
    if (po.payment_status === 'Partial') return sum + (po.paid_amount || 0);
    return sum;
  }, 0);
  const totalOutstandingAmount = Math.max(0, totalPOAmount - totalPaidAmount);
  const pendingDeliveries = purchases.filter(po => po.status === 'Ordered').length;

  return (
    <div className="space-y-4 max-w-full pb-8 px-0 font-sans text-slate-900 dark:text-slate-100 overflow-x-hidden animate-in fade-in duration-300">
      <PageHeader
        title="Procurement & Purchase Lifecycle"
        subtitle="Manage supplier purchase orders, track inbound deliveries, and audit accounts payable & payments."
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
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-3 sm:p-4 rounded-xl shadow-xs hover:shadow-md hover:border-indigo-400 dark:hover:border-indigo-600 transition-all cursor-default group flex flex-col justify-between gap-1">
            <div className="flex items-center gap-1.5">
              <div className="p-1.5 bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-lg group-hover:scale-110 transition-transform shrink-0">
                <DollarSign size={14} />
              </div>
              <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">TOTAL SPEND</span>
            </div>
            <div className="flex flex-col gap-0.5 mt-0.5">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">Total procurement value</span>
            </div>
            <div className="text-right mt-1">
              <span className="text-xl sm:text-2xl font-black text-indigo-600 dark:text-indigo-400 tracking-tight">
                ₹{totalPOAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-3 sm:p-4 rounded-xl shadow-xs hover:shadow-md hover:border-emerald-400 dark:hover:border-emerald-600 transition-all cursor-default group flex flex-col justify-between gap-1">
            <div className="flex items-center gap-1.5">
              <div className="p-1.5 bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-lg group-hover:scale-110 transition-transform shrink-0">
                <CheckCircle2 size={14} />
              </div>
              <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">SETTLED PAYMENTS</span>
            </div>
            <div className="flex flex-col gap-0.5 mt-0.5">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">Paid to vendors</span>
            </div>
            <div className="text-right mt-1">
              <span className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
                ₹{totalPaidAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-3 sm:p-4 rounded-xl shadow-xs hover:shadow-md hover:border-amber-400 dark:hover:border-amber-600 transition-all cursor-default group flex flex-col justify-between gap-1">
            <div className="flex items-center gap-1.5">
              <div className="p-1.5 bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-lg group-hover:scale-110 transition-transform shrink-0">
                <Receipt size={14} />
              </div>
              <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">OUTSTANDING DUES</span>
            </div>
            <div className="flex flex-col gap-0.5 mt-0.5">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">Pending & part payments</span>
            </div>
            <div className="text-right mt-1">
              <span className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400 tracking-tight">
                ₹{totalOutstandingAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-3 sm:p-4 rounded-xl shadow-xs hover:shadow-md hover:border-sky-400 dark:hover:border-sky-600 transition-all cursor-default group flex flex-col justify-between gap-1">
            <div className="flex items-center gap-1.5">
              <div className="p-1.5 bg-sky-500/10 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400 rounded-lg group-hover:scale-110 transition-transform shrink-0">
                <Truck size={14} />
              </div>
              <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">PENDING DELIVERIES</span>
            </div>
            <div className="flex flex-col gap-0.5 mt-0.5">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">Inbound goods expected</span>
            </div>
            <div className="text-right mt-1">
              <span className="text-xl sm:text-2xl font-black text-sky-600 dark:text-sky-400 tracking-tight">
                {pendingDeliveries}
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
                <th className="py-3 px-4 text-center">Payment Status</th>
                <th className="py-3 px-4 text-right">Order Value</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredPurchases.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    <Store size={24} className="mx-auto mb-2 opacity-30" />
                    <p className="font-semibold">No purchase orders found.</p>
                  </td>
                </tr>
              ) : (
                filteredPurchases.map(po => {
                  const currPaid = po.paid_amount || (po.payment_status === 'Paid' ? po.total_amount : 0);
                  const balance = Math.max(0, po.total_amount - currPaid);
                  
                  return (
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
                      <td className="py-2.5 px-4 text-center">
                        <div className="flex flex-col items-center gap-0.5">
                          {po.payment_status === 'Paid' ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                              <CheckCircle2 size={10} className="mr-1 text-emerald-600 dark:text-emerald-400" /> Payment Done
                            </span>
                          ) : po.payment_status === 'Partial' ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                              <Banknote size={10} className="mr-1 text-amber-600 dark:text-amber-400" /> Part Payment
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                              <Clock size={10} className="mr-1 text-rose-600 dark:text-rose-400" /> Unpaid
                            </span>
                          )}
                          <span className="text-[10px] text-slate-500 font-mono">
                            Paid: ₹{currPaid.toLocaleString()} {po.payment_mode ? `(${po.payment_mode})` : ''}
                          </span>
                        </div>
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <div className="flex flex-col items-end">
                          <span className="font-black text-[13px] text-slate-900 dark:text-white">
                            ₹{po.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </span>
                          {balance > 0 && (
                            <span className="text-[10px] font-semibold text-rose-600 dark:text-rose-400">
                              Due: ₹{balance.toLocaleString()}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {user.role !== 'Viewer' && (
                            <button
                              onClick={() => handleOpenPaymentModal(po)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 rounded text-[11px] font-bold transition-colors cursor-pointer"
                              title="Update payment status / record payment"
                            >
                              <DollarSign size={12} /> Pay / Edit
                            </button>
                          )}
                          <button 
                            onClick={() => setViewingOrder(po)}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded hover:bg-slate-50 dark:hover:bg-slate-700 text-[11px] font-bold transition-colors cursor-pointer"
                          >
                            Details <ChevronRight size={12} />
                          </button>
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

                {/* Payment & Settlement Card */}
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      <CreditCard size={12} className="text-emerald-600" /> Payment & Settlement
                    </h3>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      viewingOrder.payment_status === 'Paid' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                      viewingOrder.payment_status === 'Partial' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                      'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                    }`}>
                      {viewingOrder.payment_status || 'Unpaid'}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-700/50">
                      <span className="text-slate-500">Amount Paid:</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        ₹{(viewingOrder.paid_amount || (viewingOrder.payment_status === 'Paid' ? viewingOrder.total_amount : 0)).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-700/50">
                      <span className="text-slate-500">Outstanding:</span>
                      <span className="font-bold text-rose-600 dark:text-rose-400">
                        ₹{Math.max(0, viewingOrder.total_amount - (viewingOrder.paid_amount || (viewingOrder.payment_status === 'Paid' ? viewingOrder.total_amount : 0))).toLocaleString()}
                      </span>
                    </div>
                    {viewingOrder.payment_mode && (
                      <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-700/50">
                        <span className="text-slate-500">Payment Mode:</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{viewingOrder.payment_mode}</span>
                      </div>
                    )}
                    {viewingOrder.payment_date && (
                      <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-700/50">
                        <span className="text-slate-500">Payment Date:</span>
                        <span className="font-mono text-slate-800 dark:text-slate-200">{viewingOrder.payment_date}</span>
                      </div>
                    )}
                    {viewingOrder.payment_notes && (
                      <div className="pt-1 text-[11px] text-slate-500 italic">
                        "{viewingOrder.payment_notes}"
                      </div>
                    )}
                  </div>

                  {user.role !== 'Viewer' && (
                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/50 space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => handleQuickMarkPayment(viewingOrder, 'Paid')}
                          className="px-2 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold cursor-pointer transition-colors text-center"
                        >
                          Payment Done
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenPaymentModal(viewingOrder, 'Partial')}
                          className="px-2 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded text-[11px] font-bold cursor-pointer transition-colors text-center"
                        >
                          Part Payment
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleOpenPaymentModal(viewingOrder)}
                        className="w-full py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-800 dark:text-slate-200 rounded text-[11px] font-bold cursor-pointer transition-colors text-center flex items-center justify-center gap-1"
                      >
                        <DollarSign size={12} /> Detailed Payment Record
                      </button>
                    </div>
                  )}
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

      {/* Record / Update Payment Modal */}
      {paymentModalPO && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800">
            <div className="bg-emerald-900 text-white px-6 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-800/80 flex items-center justify-center">
                  <Banknote size={18} className="text-emerald-300" />
                </div>
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-wider">Record Purchase Payment</h2>
                  <p className="text-[10px] text-emerald-200 font-mono">{paymentModalPO.order_number} - Total: ₹{paymentModalPO.total_amount.toLocaleString()}</p>
                </div>
              </div>
              <button onClick={() => setPaymentModalPO(null)} className="text-emerald-200 hover:text-white transition-colors cursor-pointer p-1">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSavePaymentRecord} className="p-6 space-y-4">
              {/* Payment Type Selection */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Select Payment Option *</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentOption('Paid');
                      setPaymentAmountInput(paymentModalPO.total_amount);
                    }}
                    className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all cursor-pointer text-center ${
                      paymentOption === 'Paid' 
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm' 
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    Payment Done
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentOption('Partial');
                      const currPaid = paymentModalPO.paid_amount || 0;
                      setPaymentAmountInput(currPaid > 0 ? currPaid : Math.round(paymentModalPO.total_amount / 2));
                    }}
                    className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all cursor-pointer text-center ${
                      paymentOption === 'Partial' 
                        ? 'bg-amber-600 text-white border-amber-600 shadow-sm' 
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    Part Payment
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentOption('Unpaid');
                      setPaymentAmountInput(0);
                    }}
                    className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all cursor-pointer text-center ${
                      paymentOption === 'Unpaid' 
                        ? 'bg-rose-600 text-white border-rose-600 shadow-sm' 
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    Unpaid
                  </button>
                </div>
              </div>

              {/* Paid Amount Field (if Partial or Paid) */}
              {paymentOption === 'Partial' && (
                <div className="space-y-1 bg-amber-50 dark:bg-amber-950/30 p-3 rounded-xl border border-amber-200 dark:border-amber-800">
                  <div className="flex justify-between items-center text-xs mb-1">
                    <label className="font-bold text-amber-900 dark:text-amber-300">Enter Part Payment Amount (₹)</label>
                    <span className="text-[10px] text-amber-700 dark:text-amber-400">Total Order: ₹{paymentModalPO.total_amount.toLocaleString()}</span>
                  </div>
                  <input
                    type="number"
                    min="1"
                    max={paymentModalPO.total_amount}
                    value={paymentAmountInput}
                    onChange={(e) => setPaymentAmountInput(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 text-sm font-bold font-mono rounded-lg border border-amber-300 dark:border-amber-700 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                    placeholder="e.g. 5000"
                  />
                  <div className="flex justify-between text-[11px] text-amber-800 dark:text-amber-400 pt-1">
                    <span>Remaining Outstanding:</span>
                    <span className="font-bold">₹{Math.max(0, paymentModalPO.total_amount - paymentAmountInput).toLocaleString()}</span>
                  </div>
                </div>
              )}

              {paymentOption !== 'Unpaid' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Payment Mode *</label>
                      <select
                        value={paymentModeInput}
                        onChange={(e) => setPaymentModeInput(e.target.value as any)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-600 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                      >
                        <option value="Cash">Cash</option>
                        <option value="UPI">UPI / QR Code</option>
                        <option value="Bank Transfer">Bank Transfer / NEFT</option>
                        <option value="Cheque">Cheque</option>
                        <option value="Credit Card">Credit / Debit Card</option>
                        <option value="Other">Other Mode</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Payment Date *</label>
                      <input
                        type="date"
                        value={paymentDateInput}
                        onChange={(e) => setPaymentDateInput(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 text-xs font-semibold font-mono rounded-lg border border-slate-300 dark:border-slate-600 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Transaction Ref / Notes</label>
                    <input
                      type="text"
                      value={paymentNotesInput}
                      onChange={(e) => setPaymentNotesInput(e.target.value)}
                      placeholder="e.g. UTR #9823471029, Cheque #004123, Paid via HDFC"
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 text-xs rounded-lg border border-slate-300 dark:border-slate-600 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </>
              )}

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentModalPO(null)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors shadow-sm flex items-center gap-1.5"
                >
                  <Check size={14} /> Save Payment Record
                </button>
              </div>
            </form>
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

              {/* Payment Details Section */}
              <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <CreditCard size={14} className="text-emerald-600" /> Initial Payment Setup
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Payment Status *</label>
                    <select
                      value={initialPaymentStatus}
                      onChange={(e) => setInitialPaymentStatus(e.target.value as any)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-600 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                    >
                      <option value="Unpaid">Unpaid (Default)</option>
                      <option value="Partial">Part Payment</option>
                      <option value="Paid">Payment Done (Full)</option>
                    </select>
                  </div>

                  {initialPaymentStatus === 'Partial' && (
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Initial Paid Amount (₹) *</label>
                      <input
                        type="number"
                        min="1"
                        value={initialPaidAmount}
                        onChange={(e) => setInitialPaidAmount(parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 text-xs font-bold font-mono rounded-lg border border-slate-300 dark:border-slate-600 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                        placeholder="e.g. 5000"
                      />
                    </div>
                  )}

                  {initialPaymentStatus !== 'Unpaid' && (
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Payment Mode *</label>
                      <select
                        value={initialPaymentMode}
                        onChange={(e) => setInitialPaymentMode(e.target.value as any)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-600 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                      >
                        <option value="Cash">Cash</option>
                        <option value="UPI">UPI / QR Code</option>
                        <option value="Bank Transfer">Bank Transfer / NEFT</option>
                        <option value="Cheque">Cheque</option>
                        <option value="Credit Card">Credit / Debit Card</option>
                        <option value="Other">Other Mode</option>
                      </select>
                    </div>
                  )}
                </div>

                {initialPaymentStatus !== 'Unpaid' && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Payment Reference / Notes</label>
                    <input
                      type="text"
                      value={initialPaymentNotes}
                      onChange={(e) => setInitialPaymentNotes(e.target.value)}
                      placeholder="e.g. Advance paid via UPI, UTR #823910"
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 text-xs rounded-lg border border-slate-300 dark:border-slate-600"
                    />
                  </div>
                )}
              </div>
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
