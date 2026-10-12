import sys

with open('src/components/ProductModule.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

# Add quick stock state and helper functions
state_target = '''  const [formStockAdjustmentQty, setFormStockAdjustmentQty] = useState<number | string>('');
  const [formStockAdjustmentNote, setFormStockAdjustmentNote] = useState<string>('');'''

state_replacement = '''  const [formStockAdjustmentQty, setFormStockAdjustmentQty] = useState<number | string>('');
  const [formStockAdjustmentNote, setFormStockAdjustmentNote] = useState<string>('');

  // Quick Stock Adjustment Helpers
  const [quickStockProduct, setQuickStockProduct] = useState<Product | null>(null);
  const [isQuickStockModalOpen, setIsQuickStockModalOpen] = useState(false);
  const [quickStockMode, setQuickStockMode] = useState<'add' | 'reduce' | 'set'>('add');
  const [quickStockQty, setQuickStockQty] = useState<number | string>(10);
  const [quickStockNote, setQuickStockNote] = useState('');

  const handleQuickAddStock = (prod: Product, qty = 1) => {
    try {
      dbStore.addStockLog(
        prod.id,
        qty,
        'In',
        `Quick stock add (+${qty}) from Product Catalog`,
        user.id,
        businessId
      );
      triggerToast(`Added +${qty} ${prod.unit} to "${prod.name}" stock.`, 'success');
    } catch (err: any) {
      triggerToast(`Failed to update stock: ${err.message}`, 'error');
    }
  };

  const handleQuickDeductStock = (prod: Product, qty = 1) => {
    try {
      dbStore.addStockLog(
        prod.id,
        -qty,
        'Out',
        `Quick stock deduct (-${qty}) from Product Catalog`,
        user.id,
        businessId
      );
      triggerToast(`Deducted -${qty} ${prod.unit} from "${prod.name}" stock.`, 'success');
    } catch (err: any) {
      triggerToast(`Failed to update stock: ${err.message}`, 'error');
    }
  };

  const handleOpenQuickStockModal = (prod: Product) => {
    setQuickStockProduct(prod);
    setQuickStockMode('add');
    setQuickStockQty(10);
    setQuickStockNote('');
    setIsQuickStockModalOpen(true);
  };

  const handleConfirmQuickStock = () => {
    if (!quickStockProduct) return;
    const qtyVal = Number(quickStockQty);
    if (isNaN(qtyVal) || (quickStockMode !== 'set' && qtyVal <= 0)) {
      triggerToast('Please enter a valid stock quantity.', 'error');
      return;
    }

    const freshProd = dbStore.getProducts(businessId).find(p => p.id === quickStockProduct.id) || quickStockProduct;
    const currentStock = freshProd.current_stock ?? 0;
    let changeQty = 0;
    let logType: StockLog['type'] = 'Adjustment';

    if (quickStockMode === 'add') {
      changeQty = qtyVal;
      logType = 'In';
    } else if (quickStockMode === 'reduce') {
      changeQty = -qtyVal;
      logType = 'Out';
    } else if (quickStockMode === 'set') {
      changeQty = qtyVal - currentStock;
      logType = 'Adjustment';
    }

    if (changeQty === 0) {
      triggerToast('No change in stock level.', 'info');
      setIsQuickStockModalOpen(false);
      return;
    }

    try {
      dbStore.addStockLog(
        quickStockProduct.id,
        changeQty,
        logType,
        quickStockNote.trim() || `Quick stock adjust (${quickStockMode} ${qtyVal})`,
        user.id,
        businessId
      );
      triggerToast(`Stock updated for "${quickStockProduct.name}". New balance: ${currentStock + changeQty} ${quickStockProduct.unit}`, 'success');
      setIsQuickStockModalOpen(false);
      setQuickStockProduct(null);
    } catch (err: any) {
      triggerToast(`Error updating stock: ${err.message}`, 'error');
    }
  };'''

if state_target in code:
    code = code.replace(state_target, state_replacement)
    print("Replaced state_target")
else:
    print("WARNING: state_target not found")

# Update currentStock in handleSaveProduct to use freshProd
save_target = '''          let logType: StockLog['type'] = 'Adjustment';
          const currentStock = editingProduct.current_stock ?? 0;'''

save_replacement = '''          let logType: StockLog['type'] = 'Adjustment';
          const freshProd = dbStore.getProducts(businessId).find(p => p.id === editingProduct.id);
          const currentStock = freshProd?.current_stock ?? editingProduct.current_stock ?? 0;'''

if save_target in code:
    code = code.replace(save_target, save_replacement)
    print("Replaced save_target")
else:
    print("WARNING: save_target not found")

# Update Stock State table cell
cell_target = '''                    <td className="py-2 px-3">
                      <div className="flex flex-col items-start gap-1">
                        <div className="flex items-center gap-1.5">
                          <span className={`font-black text-[12px] ${isNegative ? 'text-rose-600 bg-rose-50 dark:bg-rose-950/60 px-1.5 py-0.5 rounded border border-rose-300 dark:border-rose-800' : isOut ? 'text-rose-600' : isLow ? 'text-amber-600' : 'text-emerald-600'}`}>
                            {prod.current_stock}
                          </span>
                          <span className="text-[9px] text-slate-500 font-bold">{prod.unit}</span>
                        </div>'''

cell_replacement = '''                    <td className="py-2 px-3">
                      <div className="flex flex-col items-start gap-1">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenQuickStockModal(prod)}
                            className={`font-black text-[12px] px-2 py-0.5 rounded transition-all cursor-pointer hover:scale-105 active:scale-95 border shadow-2xs ${
                              isNegative
                                ? 'text-rose-600 bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-800'
                                : isOut
                                ? 'text-rose-600 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800'
                                : isLow
                                ? 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800'
                                : 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800'
                            }`}
                            title="Click to open Quick Stock Adjustment"
                          >
                            {prod.current_stock}
                          </button>
                          <span className="text-[9px] text-slate-500 font-bold">{prod.unit}</span>
                          
                          {user.role !== 'Viewer' && !isComboProduct(prod) && (
                            <div className="flex items-center gap-1 ml-1">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleQuickAddStock(prod, 1);
                                }}
                                className="w-5 h-5 rounded bg-emerald-100 hover:bg-emerald-600 text-emerald-800 hover:text-white dark:bg-emerald-950/60 dark:hover:bg-emerald-600 dark:text-emerald-300 text-[11px] font-black flex items-center justify-center transition-colors border border-emerald-300 dark:border-emerald-800 shadow-2xs cursor-pointer active:scale-95"
                                title="Quick Add +1 Stock"
                              >
                                +
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleQuickDeductStock(prod, 1);
                                }}
                                className="w-5 h-5 rounded bg-rose-100 hover:bg-rose-600 text-rose-800 hover:text-white dark:bg-rose-950/60 dark:hover:bg-rose-600 dark:text-rose-300 text-[11px] font-black flex items-center justify-center transition-colors border border-rose-300 dark:border-rose-800 shadow-2xs cursor-pointer active:scale-95"
                                title="Quick Deduct -1 Stock"
                              >
                                -
                              </button>
                            </div>
                          )}
                        </div>'''

if cell_target in code:
    code = code.replace(cell_target, cell_replacement)
    print("Replaced cell_target")
else:
    print("WARNING: cell_target not found")

modal_jsx = '''
      {/* ==================== QUICK STOCK ADJUSTMENT MODAL ==================== */}
      {isQuickStockModalOpen && quickStockProduct && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in duration-150 border border-slate-200 dark:border-slate-800">
            <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PackagePlus size={18} className="text-emerald-400" />
                <h2 className="text-xs font-bold uppercase tracking-wider">Quick Stock Adjustment</h2>
              </div>
              <button onClick={() => setIsQuickStockModalOpen(false)} className="text-white/80 hover:text-white cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Product Card */}
              <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                <img src={quickStockProduct.image_url} alt={quickStockProduct.name} className="w-12 h-12 object-cover rounded-lg border border-slate-300 dark:border-slate-600" />
                <div className="flex-1 min-w-0">
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white truncate">{quickStockProduct.name}</h3>
                  <p className="text-[10px] text-slate-500 font-mono">SKU: {quickStockProduct.sku} | Barcode: {quickStockProduct.barcode}</p>
                  <p className="text-[11px] font-black text-indigo-600 dark:text-indigo-400 mt-0.5">
                    Current Balance: {quickStockProduct.current_stock} {quickStockProduct.unit}
                  </p>
                </div>
              </div>

              {/* Mode Selectors */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Adjustment Action</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setQuickStockMode('add')}
                    className={`px-2.5 py-2 rounded-xl text-[10px] font-bold border transition-all cursor-pointer flex items-center justify-center gap-1 ${
                      quickStockMode === 'add'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50'
                    }`}
                  >
                    <Plus size={12} /> Add Stock (+)
                  </button>

                  <button
                    type="button"
                    onClick={() => setQuickStockMode('reduce')}
                    className={`px-2.5 py-2 rounded-xl text-[10px] font-bold border transition-all cursor-pointer flex items-center justify-center gap-1 ${
                      quickStockMode === 'reduce'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800 hover:bg-rose-50'
                    }`}
                  >
                    <Minus size={12} /> Deduct Stock (-)
                  </button>

                  <button
                    type="button"
                    onClick={() => setQuickStockMode('set')}
                    className={`px-2.5 py-2 rounded-xl text-[10px] font-bold border transition-all cursor-pointer flex items-center justify-center gap-1 ${
                      quickStockMode === 'set'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50'
                    }`}
                  >
                    Set Total (=)
                  </button>
                </div>
              </div>

              {/* Quantity Input */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase">
                  {quickStockMode === 'add'
                    ? `Quantity to Add (+ ${quickStockProduct.unit})`
                    : quickStockMode === 'reduce'
                    ? `Quantity to Deduct (- ${quickStockProduct.unit})`
                    : `New Total Stock Balance (= ${quickStockProduct.unit})`}
                </label>
                <input
                  type="number"
                  min="0"
                  value={quickStockQty}
                  onChange={(e) => setQuickStockQty(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="e.g. 50"
                  autoFocus
                />
              </div>

              {/* Note Input */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase">Reason / Remarks (Optional)</label>
                <input
                  type="text"
                  value={quickStockNote}
                  onChange={(e) => setQuickStockNote(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="e.g. Stock count audit, received shipment, manual adjustment"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsQuickStockModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmQuickStock}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors shadow-xs cursor-pointer"
                >
                  Confirm Stock Update
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
'''

last_div_idx = code.rfind('</div>')
if last_div_idx != -1:
    code = code[:last_div_idx] + modal_jsx + '\n' + code[last_div_idx:]

with open('src/components/ProductModule.tsx', 'w', encoding='utf-8') as f:
    f.write(code)

print('Updated ProductModule.tsx successfully')
