import { PageHeader } from './PageHeader';
import React, { useEffect, useState } from 'react';
import { 
  ShoppingBag, 
  PlusCircle, 
  Search, 
  Truck, 
  FileText, 
  Calendar, 
  DollarSign, 
  X, 
  Check, 
  CheckCircle,
  Clock
} from 'lucide-react';
import { dbStore } from '../services/store';
import { PurchaseOrder, Supplier, Product, UserProfile, PurchaseItem } from '../types/erp';

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
  const [isModalOpen, setIsModalOpen] = useState(false);

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
    resetForm();
    setIsModalOpen(true);
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

    // Check if item already added
    if (items.some(it => it.product_id === rowProductId)) {
      triggerToast('This product is already added to the order. Adjust qty instead.', 'error');
      return;
    }

    const newItem: PurchaseItem = {
      product_id: rowProductId,
      qty: rowQty,
      received_qty: 0,
      purchase_price: rowPrice || prod.purchase_price,
      gst_rate: prod.gst_rate
    };

    setItems([...items, newItem]);
    setRowProductId('');
    setRowQty(10);
    setRowPrice(0);
  };

  const handleRemoveRowItem = (idx: number) => {
    setItems(items.filter((_, i) => i !== idx));
  };

  const handleCreatePO = (e: React.FormEvent, immediateReceive = false) => {
    e.preventDefault();

    if (!selectedSupplierId) {
      triggerToast('Please choose a vendor.', 'error');
      return;
    }

    if (items.length === 0) {
      triggerToast('Add at least one product item to the order list.', 'error');
      return;
    }

    // Calc total amount inclusive of tax
    const total = items.reduce((sum, item) => {
      const lineCost = item.qty * item.purchase_price;
      const lineTax = lineCost * (item.gst_rate / 100);
      return sum + lineCost + lineTax;
    }, 0);

    const randomNum = Math.floor(100 + Math.random() * 900);
    const orderNum = `PO-2026-${randomNum}`;

    try {
      dbStore.createPurchaseOrder({
        order_number: orderNum,
        supplier_id: selectedSupplierId,
        order_date: new Date().toISOString().split('T')[0],
        delivery_date: deliveryDate,
        status: immediateReceive ? 'Received' : 'Ordered',
        payment_status: 'Unpaid',
        items: items.map(it => ({ ...it, received_qty: immediateReceive ? it.qty : 0 })),
        total_amount: Math.round(total),
        business_id: businessId
      });

      // Update supplier trade balance outstanding
      const supplier = suppliers.find(s => s.id === selectedSupplierId);
      if (supplier) {
        dbStore.updateSupplier(selectedSupplierId, {
          outstanding_amount: supplier.outstanding_amount + Math.round(total)
        });
      }

      dbStore.logActivity(
        user.id,
        user.name,
        user.role,
        'Create Purchase',
        `Raised Purchase Order: ${orderNum} to ${supplier?.name || 'Vendor'} for ₹${Math.round(total).toLocaleString()}`,
        businessId
      );

      triggerToast(`Purchase Order ${orderNum} raised successfully.`, 'success');
      setPurchases(dbStore.getPurchaseOrders(businessId));
      setIsModalOpen(false);
      resetForm();
    } catch (err: any) {
      triggerToast(err.message || 'Error occurred.', 'error');
    }
  };

  const handleProcessGoodsReceipt = (poId: string) => {
    try {
      const po = purchases.find(p => p.id === poId);
      if (!po) return;

      dbStore.updatePurchaseOrder(poId, {
        status: 'Received',
        items: po.items.map(it => ({ ...it, received_qty: it.qty }))
      });

      dbStore.logActivity(
        user.id,
        user.name,
        user.role,
        'Goods Receipt',
        `Completed Goods Receipt Note (GRN) for Purchase Order: ${po.order_number}`,
        businessId
      );

      triggerToast(`Goods Receipt Note (GRN) parsed. Stock levels incremented successfully.`, 'success');
      setPurchases(dbStore.getPurchaseOrders(businessId));
    } catch (e: any) {
      triggerToast(e.message || 'Error executing GRN.', 'error');
    }
  };

  const handleCancelPO = (poId: string) => {
    try {
      const po = purchases.find(p => p.id === poId);
      if (!po) return;

      dbStore.updatePurchaseOrder(poId, { status: 'Cancelled' });
      
      // Deduct trade payable
      const supplier = suppliers.find(s => s.id === po.supplier_id);
      if (supplier) {
        dbStore.updateSupplier(po.supplier_id, {
          outstanding_amount: Math.max(0, supplier.outstanding_amount - po.total_amount)
        });
      }

      dbStore.logActivity(user.id, user.name, user.role, 'Cancel Purchase', `Cancelled purchase order: ${po.order_number}`, businessId);
      triggerToast(`Purchase order marked as Cancelled.`, 'info');
      setPurchases(dbStore.getPurchaseOrders(businessId));
    } catch (e: any) {
      triggerToast(e.message || 'Cancel failed.', 'error');
    }
  };

  const filteredPurchases = purchases.filter(po => {
    const s = suppliers.find(sup => sup.id === po.supplier_id);
    return po.order_number.toLowerCase().includes(searchQuery.toLowerCase()) || 
           (s && s.name.toLowerCase().includes(searchQuery.toLowerCase()));
  });

  return (
    <div className="space-y-6 max-w-full pb-12 px-0 font-sans text-slate-900 dark:text-slate-100 overflow-x-hidden" id="procurement-module-root">
      <PageHeader
        title="Procurement & Purchase Lifecycle"
        subtitle="Raise supplier requests, manage Goods Receipt Notes (GRN), and audit inventory stock additions."
        icon={ShoppingBag}
        rightContent={
          <>
{user.role !== 'Viewer' && (
          <button 
            onClick={handleOpenAddModal} 
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[11px] font-semibold cursor-pointer"
          >
            <PlusCircle size={16} />
            <span>Raise Purchase Order</span>
          </button>
        )}
          </>
        }
      />

      {/* Search Filter bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 shadow-xs flex items-center gap-3">
        <Search size={16} className="text-slate-400" />
        <input 
          type="text" 
          placeholder="Search purchases by PO order number or vendor name..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-transparent text-[11px] outline-hidden text-slate-800 dark:text-slate-100"
        />
      </div>

      {/* PO List Grid */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-xs overflow-x-auto overflow-y-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800 text-[11px] font-semibold uppercase text-slate-500 border-b border-slate-100 dark:border-slate-800">
              <th className="p-4">Order Details</th>
              <th className="p-4">Supplier Vendor</th>
              <th className="p-4">Procurement Status</th>
              <th className="p-4">Total Payables</th>
              <th className="p-4 text-center">Receipt Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-[11px]">
            {filteredPurchases.map((po, idx) => {
              const vendor = suppliers.find(s => s.id === po.supplier_id);
              return (
                <tr key={`${po.id}-${idx}`} className="hover:bg-slate-50/50 text-slate-700 dark:text-slate-300">
                  <td className="p-4 space-y-1">
                    <strong className="text-slate-900 dark:text-white font-semibold">{po.order_number}</strong>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400">
                      <span className="flex items-center gap-0.5"><Calendar size={12} /> {po.order_date}</span>
                    </div>
                  </td>
                  <td className="p-4 font-semibold text-slate-800 dark:text-slate-200">
                    {vendor ? vendor.name : 'Unknown Supplier'}
                  </td>
                  <td className="p-4 space-y-1">
                    <span className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded-full ${
                      po.status === 'Received' ? 'text-emerald-700 bg-emerald-50' :
                      po.status === 'Ordered' ? 'text-indigo-700 bg-indigo-50' :
                      po.status === 'Cancelled' ? 'text-rose-700 bg-rose-50' :
                      'text-slate-700 bg-slate-100'
                    }`}>
                      {po.status}
                    </span>
                    <span className="text-[10px] text-slate-400 block">Payment: <strong>{po.payment_status}</strong></span>
                  </td>
                  <td className="p-4 font-mono font-bold text-slate-950 dark:text-white">
                    ₹{po.total_amount.toLocaleString()}
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex justify-center gap-1.5">
                      {po.status === 'Ordered' && user.role !== 'Viewer' && (
                        <>
                          <button 
                            onClick={() => handleProcessGoodsReceipt(po.id)}
                            className="flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-semibold transition cursor-pointer"
                            title="Acknowledge Delivery (GRN)"
                          >
                            <Check size={12} />
                            <span>GRN Receipt</span>
                          </button>
                          <button 
                            onClick={() => handleCancelPO(po.id)}
                            className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-[11px] font-semibold transition cursor-pointer"
                          >
                            Cancel
                          </button>
                        </>
                      )}
                      {po.status === 'Received' && (
                        <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                          <CheckCircle size={14} /> Received in Stock
                        </span>
                      )}
                      {po.status === 'Cancelled' && (
                        <span className="text-[11px] text-rose-400 italic">No Actions</span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {filteredPurchases.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-10 text-slate-400">No procurement activities registered in catalog.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* PO Creation Drawer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-3xl h-[85vh] flex flex-col shadow-xl animate-in zoom-in duration-150 overflow-hidden">
            <div className="bg-slate-50 dark:bg-slate-800 px-6 py-4 border-b flex items-center justify-between">
              <h2 className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                <ShoppingBag />
                <span>Draft New Supplier Purchase Order</span>
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Select Supplier Vendor</label>
                  <select 
                    value={selectedSupplierId}
                    onChange={(e) => setSelectedSupplierId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 text-[11px] rounded-lg border focus:outline-hidden"
                  >
                    {suppliers.map((s, idx) => (
                      <option key={`${s.id}-${idx}`} value={s.id}>{s.name} (GST: {s.gstin || 'None'})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Target Expected Delivery Date</label>
                  <input 
                    type="date" 
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 text-[11px] rounded-lg border focus:outline-hidden font-mono"
                  />
                </div>
              </div>

              {/* Add item sub-row panel */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <h4 className="text-[11px] font-bold text-slate-500 uppercase">Add Procurement Line Item</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div className="md:col-span-2">
                    <select 
                      value={rowProductId}
                      onChange={(e) => {
                        setRowProductId(e.target.value);
                        const prod = products.find(p => p.id === e.target.value);
                        if (prod) setRowPrice(prod.purchase_price);
                      }}
                      className="w-full px-3 py-2 bg-white text-[11px] rounded-lg border focus:outline-hidden"
                    >
                      <option value="">-- Choose Catalog SKU --</option>
                      {products.map((p, idx) => (
                        <option key={`${p.id}-${idx}`} value={p.id}>{p.name} (SKU: {p.sku})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <input 
                      type="number" 
                      min={1}
                      placeholder="Qty"
                      value={rowQty}
                      onChange={(e) => setRowQty(Math.max(1, Number(e.target.value)))}
                      className="w-full px-3 py-2 bg-white text-[11px] rounded-lg border focus:outline-hidden font-mono"
                    />
                  </div>
                  <div className="flex gap-2">
                    <input 
                      type="number" 
                      placeholder="Unit Cost (₹)"
                      value={rowPrice}
                      onChange={(e) => setRowPrice(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white text-[11px] rounded-lg border focus:outline-hidden font-mono"
                    />
                    <button 
                      type="button" 
                      onClick={handleAddRowItem}
                      className="px-3 bg-indigo-600 text-white rounded-lg text-[11px] font-bold"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>

              {/* Added Line Items Table */}
              <div className="space-y-2">
                <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Purchase Lines Grid</h4>
                <div className="border border-slate-100 rounded-xl overflow-x-auto text-[11px]">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-100 text-[10px] font-bold uppercase text-slate-500">
                        <th className="p-3">Product SKU</th>
                        <th className="p-3 text-right">Quantity</th>
                        <th className="p-3 text-right">Unit Price</th>
                        <th className="p-3 text-right">Tax Rate</th>
                        <th className="p-3 text-right">Subtotal</th>
                        <th className="p-3 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono">
                      {items.map((it, idx) => {
                        const p = products.find(prod => prod.id === it.product_id);
                        const cost = it.qty * it.purchase_price;
                        return (
                          <tr key={idx}>
                            <td className="p-3 font-sans font-semibold text-slate-900">{p?.name || 'Unknown'}</td>
                            <td className="p-3 text-right font-bold">{it.qty}</td>
                            <td className="p-3 text-right">₹{it.purchase_price.toLocaleString()}</td>
                            <td className="p-3 text-right">{it.gst_rate}%</td>
                            <td className="p-3 text-right font-bold text-indigo-600">₹{(cost * (1 + it.gst_rate/100)).toLocaleString()}</td>
                            <td className="p-3 text-center">
                              <button 
                                type="button"
                                onClick={() => handleRemoveRowItem(idx)}
                                className="text-rose-500 hover:underline font-sans font-semibold"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                      {items.length === 0 && (
                        <tr>
                          <td colSpan={6} className="text-center py-10 text-slate-400 font-sans">No line items added yet.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Bottom Actions footer */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800 border-t flex justify-between items-center">
              <div className="text-left font-mono">
                <span className="text-[10px] text-slate-400 uppercase block">Total Inclusive Amount:</span>
                <strong className="text-xs font-extrabold text-slate-900 dark:text-white">
                  ₹{items.reduce((sum, item) => sum + (item.qty * item.purchase_price * (1 + item.gst_rate/100)), 0).toLocaleString()}
                </strong>
              </div>

              <div className="flex gap-2">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-[11px] font-semibold hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  onClick={(e) => handleCreatePO(e, false)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-[11px] font-semibold"
                >
                  Raise PO (Ordered)
                </button>
                <button 
                  type="button" 
                  onClick={(e) => handleCreatePO(e, true)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-[11px] font-semibold hover:bg-indigo-700"
                >
                  Receive Immediately (GRN)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
