const fs = require('fs');
let code = fs.readFileSync('src/components/PackingVerificationModule.tsx', 'utf-8');

// 1. Fix handleResetOrderScans (remove window.confirm which gets blocked in iframe)
const oldResetFunc = `const handleResetOrderScans = () => {
    if (!selectedOrder) return;
    if (window.confirm(\`Reset all scanned quantities back to 0 for Order #\${selectedOrder.order_number}?\`)) {
      dbStore.updateSalesOrder(selectedOrder.id, {
        items: (selectedOrder.items || []).map(it => ({ ...it, scanned_qty: 0 }))
      });
      triggerToast('All item scan counts reset to 0.', 'info');
      setRecentScanLog(null);
      reloadOrders();
    }
  };`;

const newResetFunc = `const handleResetOrderScans = () => {
    if (!selectedOrder) return;
    const resetItems = (selectedOrder.items || []).map(it => ({ ...it, scanned_qty: 0 }));
    dbStore.updateSalesOrder(selectedOrder.id, {
      items: resetItems
    });
    setSelectedOrder(prev => prev ? { ...prev, items: resetItems } : null);
    triggerToast('All item scan counts reset to 0.', 'info');
    setRecentScanLog(null);
    reloadOrders();
  };`;

if (code.includes(oldResetFunc)) {
  code = code.replace(oldResetFunc, newResetFunc);
  console.log('Successfully updated handleResetOrderScans!');
} else {
  console.error('Could not find oldResetFunc');
}

// 2. Replace Barcode Console Form
const consoleRegex = /<form onSubmit=\{handleFormSubmit\}[\s\S]*?<\/form>/;

const newConsoleForm = `<form onSubmit={handleFormSubmit} className="space-y-2.5 w-full">
              {/* Row 1: Barcode / SKU input field + Verify Item button on tablet/desktop */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full">
                <div className="relative flex-1">
                  <input 
                    ref={barcodeInputRef}
                    type="text" 
                    placeholder="Scan or type barcode / SKU / product name (e.g. AM-1001)..."
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    className="w-full pl-3 pr-10 h-10 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-[11px] font-mono font-bold rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  />
                  {barcodeInput && (
                    <button 
                      type="button" 
                      onClick={() => setBarcodeInput('')}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>

                {/* Verify Item button on tablet & desktop (sm+) */}
                <button 
                  type="submit"
                  className="hidden sm:flex h-10 px-4 sm:w-48 shrink-0 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white dark:text-slate-900 text-white rounded-xl text-[11px] font-bold cursor-pointer items-center justify-center transition-all active:scale-95 shadow-sm"
                >
                  Verify Item
                </button>
              </div>

              {/* Row 2: Equal width buttons on mobile; Camera Scanner right-aligned under Verify Item on tablet/desktop */}
              <div className="grid grid-cols-2 sm:flex sm:justify-end gap-2 w-full">
                {/* Verify Item button on mobile (< sm) */}
                <button 
                  type="submit"
                  className="sm:hidden h-10 px-4 w-full bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white dark:text-slate-900 text-white rounded-xl text-[11px] font-bold cursor-pointer flex items-center justify-center transition-all active:scale-95 shadow-sm"
                >
                  Verify Item
                </button>

                {/* Camera Scanner button */}
                <button
                  type="button"
                  onClick={() => setIsScannerOpen(true)}
                  className="h-10 px-4 w-full sm:w-48 shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[11px] font-bold cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/20 transition-all active:scale-95"
                >
                  <Camera size={14} />
                  <span>Camera Scanner</span>
                </button>
              </div>
            </form>`;

if (consoleRegex.test(code)) {
  code = code.replace(consoleRegex, newConsoleForm);
  fs.writeFileSync('src/components/PackingVerificationModule.tsx', code);
  console.log('Successfully updated Barcode Console Form!');
} else {
  console.error('Could not match consoleRegex');
}
