const fs = require('fs');
let content = fs.readFileSync('src/components/PurchaseModule.tsx', 'utf8');

if (!content.includes('const [uploadedInvoice, setUploadedInvoice]')) {
    // 1. Add state
    content = content.replace(
        "const [pendingPOToConfirm, setPendingPOToConfirm] = useState<any>(null);",
        "const [pendingPOToConfirm, setPendingPOToConfirm] = useState<any>(null);\n  const [uploadedInvoice, setUploadedInvoice] = useState<string | null>(null);"
    );

    // 2. Clear state on resetForm
    content = content.replace(
        "setRowQty(10);\n    setRowPrice(0);\n    setRowGst(0);",
        "setRowQty(10);\n    setRowPrice(0);\n    setRowGst(0);\n    setUploadedInvoice(null);"
    );

    // 3. Set state in handleScanInvoice
    content = content.replace(
        "const base64String = reader.result as string;",
        "const base64String = reader.result as string;\n        setUploadedInvoice(base64String);"
    );

    // 4. Add it to newPOData
    content = content.replace(
        "payment_date: calcPaidAmount > 0 ? new Date().toISOString().split('T')[0] : undefined,",
        "payment_date: calcPaidAmount > 0 ? new Date().toISOString().split('T')[0] : undefined,\n        invoice_image: uploadedInvoice,"
    );

    // 5. Add UI to show the uploaded image
    const uiStr = `<div className="mt-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2 mb-4">
                  <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Line Items</h3>
                </div>`;
    const newUiStr = `<div className="mt-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2 mb-4">
                  <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Line Items</h3>
                </div>
                {uploadedInvoice && (
                  <div className="mb-4">
                    <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">Invoice Attachment</p>
                    <div className="relative inline-block border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                      <img src={uploadedInvoice} alt="Invoice" className="h-32 object-contain" />
                      <button type="button" onClick={() => setUploadedInvoice(null)} className="absolute top-1 right-1 bg-rose-500 text-white rounded p-1 hover:bg-rose-600">
                        <X size={12} />
                      </button>
                    </div>
                  </div>
                )}`;

    content = content.replace(uiStr, newUiStr);
    
    // Show attachment in viewing mode
    const viewModeStr = `<div className="text-right">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Status</p>`;
    const newViewModeStr = `<div className="text-right">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Status</p>`;
                    
    const viewAttachStr = `{viewingOrder.payment_notes && (
                    <div className="mt-3 text-xs text-slate-600 dark:text-slate-400">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">Notes:</span> {viewingOrder.payment_notes}
                    </div>
                  )}
                </div>`;
    const newViewAttachStr = `{viewingOrder.payment_notes && (
                    <div className="mt-3 text-xs text-slate-600 dark:text-slate-400">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">Notes:</span> {viewingOrder.payment_notes}
                    </div>
                  )}
                  {viewingOrder.invoice_image && (
                    <div className="mt-4">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Attached Invoice</p>
                      <img src={viewingOrder.invoice_image} alt="Invoice" className="max-h-64 object-contain rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm" />
                    </div>
                  )}
                </div>`;
                
    content = content.replace(viewAttachStr, newViewAttachStr);

    fs.writeFileSync('src/components/PurchaseModule.tsx', content);
}
