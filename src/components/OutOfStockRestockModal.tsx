import React, { useState, useEffect } from 'react';
import { 
  X, 
  AlertTriangle, 
  PackageX, 
  Plus, 
  Minus, 
  Boxes, 
  CheckCircle2, 
  ShoppingCart, 
  ArrowRight,
  TrendingUp,
  Tag,
  Barcode
} from 'lucide-react';
import { dbStore } from '../services/store';
import { Product, UserProfile } from '../types/erp';

interface OutOfStockRestockModalProps {
  isOpen: boolean;
  product: Product | null;
  businessId: string;
  user: UserProfile;
  currencySymbol?: string;
  onClose: () => void;
  onRestockSuccess: (
    updatedProduct: Product, 
    addedStock: number, 
    action: 'add_to_order' | 'select_only',
    orderQty: number
  ) => void;
  triggerToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const OutOfStockRestockModal: React.FC<OutOfStockRestockModalProps> = ({
  isOpen,
  product,
  businessId,
  user,
  currencySymbol = '₹',
  onClose,
  onRestockSuccess,
  triggerToast
}) => {
  const [restockQty, setRestockQty] = useState<number>(10);
  const [orderQty, setOrderQty] = useState<number>(1);
  const [restockNotes, setRestockNotes] = useState<string>('Replenished during Order Creation');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && product) {
      setRestockQty(10);
      setOrderQty(1);
      setRestockNotes('Replenished during Order Creation');
      setIsSubmitting(false);
    }
  }, [isOpen, product]);

  if (!isOpen || !product) return null;

  const currentStock = product.current_stock ?? 0;
  const unit = product.unit || 'units';
  const newStockAfterInward = currentStock + (Number(restockQty) || 0);

  const handleApplyRestock = async (action: 'add_to_order' | 'select_only') => {
    const qtyToAdd = Number(restockQty);
    if (!qtyToAdd || qtyToAdd <= 0) {
      triggerToast('Please enter a valid stock quantity greater than 0.', 'error');
      return;
    }

    const orderQtyNum = Math.max(1, Number(orderQty) || 1);
    if (action === 'add_to_order' && orderQtyNum > (currentStock + qtyToAdd)) {
      triggerToast(`Order quantity (${orderQtyNum}) cannot exceed total new stock (${currentStock + qtyToAdd}).`, 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Add stock log in database store
      dbStore.addStockLog(
        product.id,
        qtyToAdd,
        'In',
        restockNotes.trim() || 'Inventory replenishment during sales order creation',
        user.id,
        businessId
      );

      // 2. Log activity
      dbStore.logActivity(
        user.id,
        user.name,
        user.role,
        'Stock Restock',
        `Restocked ${product.name} (SKU: ${product.sku}): +${qtyToAdd} ${unit} (New Stock: ${newStockAfterInward} ${unit}) during order creation`,
        businessId
      );

      // 3. Fetch latest updated product from store
      const updatedProducts = dbStore.getProducts(businessId);
      const freshProd = updatedProducts.find(p => p.id === product.id) || {
        ...product,
        current_stock: newStockAfterInward
      };

      onRestockSuccess(freshProd, qtyToAdd, action, orderQtyNum);
    } catch (err: any) {
      console.error('Error replenishing stock:', err);
      triggerToast(err?.message || 'Failed to replenish inventory.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const presetAmounts = [5, 10, 20, 50, 100];

  return (
    <div 
      className="fixed inset-0 z-[150] bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150"
      id="out-of-stock-modal"
    >
      <div 
        className="bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/60 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl space-y-0 animate-in zoom-in-95 duration-150 text-slate-900 dark:text-slate-100 flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Warning Banner Header */}
        <div className="bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 text-white p-5 flex items-start justify-between relative overflow-hidden">
          <div className="flex items-center gap-3.5 relative z-10">
            <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner shrink-0 border border-white/30">
              <PackageX className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest bg-black/25 px-2 py-0.5 rounded-full text-rose-100">
                  Stock Alert
                </span>
              </div>
              <h3 className="text-lg font-black tracking-tight leading-tight mt-0.5">
                Product is Out of Stock!
              </h3>
              <p className="text-xs text-rose-100 font-medium mt-0.5">
                This item cannot be added with 0 stock. Replenish inventory below.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/80 hover:text-white p-1.5 rounded-xl hover:bg-white/20 transition-all cursor-pointer relative z-10"
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* Product Summary Card */}
          <div className="bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 rounded-2xl p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h4 className="text-sm font-black text-slate-900 dark:text-slate-100">
                  {product.name}
                </h4>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold bg-white dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                    <Tag size={11} className="text-slate-400" />
                    SKU: {product.sku || 'N/A'}
                  </span>
                  {product.barcode && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold bg-white dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                      <Barcode size={11} className="text-slate-400" />
                      {product.barcode}
                    </span>
                  )}
                  {product.category && (
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                      • {product.category}
                    </span>
                  )}
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg bg-rose-600 text-white shadow-xs animate-pulse">
                  <AlertTriangle size={12} />
                  0 {unit} in Stock
                </span>
                <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mt-1">
                  Rate: {currencySymbol}{product.selling_price?.toLocaleString() || 0}
                </p>
              </div>
            </div>

            <div className="text-[11px] text-rose-800 dark:text-rose-300 bg-rose-100/70 dark:bg-rose-900/40 p-2.5 rounded-xl border border-rose-200 dark:border-rose-800/60 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
              <span>
                <strong>Zero stock detected.</strong> To prevent negative inventory discrepancies, please add incoming inventory now. You can then immediately add it to your order.
              </span>
            </div>
          </div>

          {/* Restock Inventory Form */}
          <div className="space-y-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/80">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
                <Boxes size={15} className="text-indigo-600 dark:text-indigo-400" />
                Add Inward Inventory Quantity *
              </label>
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                Unit: <strong className="text-indigo-600 dark:text-indigo-400">{unit}</strong>
              </span>
            </div>

            {/* Quantity Stepper Input */}
            <div className="flex items-center gap-2">
              <div className="flex items-center flex-1">
                <button
                  type="button"
                  onClick={() => setRestockQty(prev => Math.max(1, (Number(prev) || 1) - 1))}
                  className="w-10 h-10 bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-l-xl border border-r-0 border-slate-300 dark:border-slate-600 font-black text-sm flex items-center justify-center cursor-pointer transition-colors"
                  title="Decrease Inward Qty"
                >
                  <Minus size={14} className="stroke-[3]" />
                </button>
                <input 
                  type="number"
                  min={1}
                  value={restockQty}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '') {
                      setRestockQty('' as any);
                    } else {
                      const num = parseInt(val, 10);
                      setRestockQty(isNaN(num) ? 1 : Math.max(1, num));
                    }
                  }}
                  onBlur={() => {
                    if (restockQty === ('' as any) || Number(restockQty) < 1) {
                      setRestockQty(10);
                    }
                  }}
                  className="w-full h-10 px-3 text-center bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-sm font-mono font-black text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-indigo-500"
                  placeholder="Inward Qty"
                />
                <button
                  type="button"
                  onClick={() => setRestockQty(prev => (Number(prev) || 0) + 1)}
                  className="w-10 h-10 bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-r-xl border border-l-0 border-slate-300 dark:border-slate-600 font-black text-sm flex items-center justify-center cursor-pointer transition-colors"
                  title="Increase Inward Qty"
                >
                  <Plus size={14} className="stroke-[3]" />
                </button>
              </div>

              {/* Quick Presets */}
              <div className="hidden sm:flex items-center gap-1.5">
                {presetAmounts.map(amt => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setRestockQty(amt)}
                    className={`px-2.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                      restockQty === amt 
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs' 
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-300'
                    }`}
                  >
                    +{amt}
                  </button>
                ))}
              </div>
            </div>

            {/* Mobile Presets */}
            <div className="flex sm:hidden items-center gap-1.5 overflow-x-auto pb-1">
              {presetAmounts.map(amt => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setRestockQty(amt)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold shrink-0 transition-all cursor-pointer border ${
                    restockQty === amt 
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs' 
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  +{amt}
                </button>
              ))}
            </div>

            {/* Notes Input */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block">
                Restock Note / Reason (Optional)
              </label>
              <input 
                type="text"
                value={restockNotes}
                onChange={(e) => setRestockNotes(e.target.value)}
                placeholder="e.g., Kitchen batch cooking, supplier delivery, inventory adjustment..."
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl focus:outline-hidden focus:border-indigo-500 text-slate-900 dark:text-slate-100"
              />
            </div>

            {/* Stock Level Preview Bar */}
            <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-xl p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp size={15} className="text-emerald-600 dark:text-emerald-400" />
                <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                  New Available Stock:
                </span>
              </div>
              <div className="text-right">
                <span className="text-sm font-black font-mono text-emerald-700 dark:text-emerald-300">
                  {newStockAfterInward} {unit}
                </span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block font-semibold">
                  (+{Number(restockQty) || 0} units added)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-200 dark:border-slate-800 flex flex-col-reverse sm:flex-row items-center justify-between gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancel (Don't Add)
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleApplyRestock('select_only')}
              className="flex-1 sm:flex-none px-3.5 py-2.5 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="Add stock and select product in the order row"
            >
              <Boxes size={14} />
              <span>Add Stock Only</span>
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleApplyRestock('add_to_order')}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-98 disabled:opacity-50"
              title="Add stock and directly append product to order items"
            >
              <ShoppingCart size={14} />
              <span>Add Stock & Add to Order</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
