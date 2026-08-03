const fs = require('fs');
let content = fs.readFileSync('src/components/PurchaseModule.tsx', 'utf8');

const attachStr = `
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
                )}
`;

content = content.replace(
  `{/* Add Item Row */}`,
  attachStr + `{/* Add Item Row */}`
);

fs.writeFileSync('src/components/PurchaseModule.tsx', content);
