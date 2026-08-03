const fs = require('fs');
let content = fs.readFileSync('src/components/PurchaseModule.tsx', 'utf8');

// 1. Add uploadInputRef
content = content.replace(
  "const fileInputRef = React.useRef<HTMLInputElement>(null);",
  "const fileInputRef = React.useRef<HTMLInputElement>(null);\n  const uploadInputRef = React.useRef<HTMLInputElement>(null);"
);

// 2. Clear uploadInputRef as well
content = content.replace(
  "if (fileInputRef.current) fileInputRef.current.value = '';",
  "if (fileInputRef.current) fileInputRef.current.value = '';\n            if (uploadInputRef.current) uploadInputRef.current.value = '';"
);

// 3. Add the upload button UI
const uiStr = `<div className="flex items-center gap-4">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <PlusCircle size={16} className="text-indigo-600" />
                  Draft New Purchase Order
                </h2>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    ref={fileInputRef}
                    onChange={handleScanInvoice}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isScanning}
                    className="px-3 py-1.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-lg text-xs font-bold hover:bg-emerald-200 flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-colors"
                  >
                    {isScanning ? 'Scanning...' : 'Scan Invoice'}
                  </button>
                </div>
              </div>`;

const newUiStr = `<div className="flex items-center gap-4">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <PlusCircle size={16} className="text-indigo-600" />
                  Draft New Purchase Order
                </h2>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      ref={fileInputRef}
                      onChange={handleScanInvoice}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isScanning}
                      className="px-3 py-1.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-lg text-xs font-bold hover:bg-emerald-200 flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-colors"
                    >
                      {isScanning ? 'Scanning...' : 'Camera'}
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      ref={uploadInputRef}
                      onChange={handleScanInvoice}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => uploadInputRef.current?.click()}
                      disabled={isScanning}
                      className="px-3 py-1.5 bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 rounded-lg text-xs font-bold hover:bg-indigo-200 flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-colors"
                    >
                      {isScanning ? 'Uploading...' : 'Upload'}
                    </button>
                  </div>
                </div>
              </div>`;

content = content.replace(uiStr, newUiStr);

fs.writeFileSync('src/components/PurchaseModule.tsx', content);
