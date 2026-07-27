const fs = require('fs');
let code = fs.readFileSync('src/components/PackingVerificationModule.tsx', 'utf-8');

const oldConsole = `<div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Scan size={16} className="text-indigo-600 animate-pulse" />
                <span>Barcode / SKU Input Console</span>
              </h3>
              <button
                onClick={() => setIsScannerOpen(true)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer flex items-center gap-2 shadow-md shadow-indigo-600/20 transition-all active:scale-95"
              >
                <Camera size={16} />
                <span>Camera Scanner</span>
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="flex gap-2">
              <div className="relative flex-1">
                <input 
                  ref={barcodeInputRef}
                  type="text" 
                  placeholder="Scan or type barcode / SKU / product name (e.g. AM-1001)..."
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  className="w-full pl-3 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-mono font-bold rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-600"
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
              <button 
                type="submit"
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white dark:text-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer shrink-0 transition-all active:scale-95"
              >
                Verify Item
              </button>
            </form>`;

const newConsole = `<div className="flex items-center justify-between">
              <h3 className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Scan size={14} className="text-indigo-600 animate-pulse" />
                <span>Barcode / SKU Input Console</span>
              </h3>
            </div>

            <form onSubmit={handleFormSubmit} className="flex flex-col sm:flex-row gap-2">
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
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsScannerOpen(true)}
                  className="flex-1 sm:flex-none h-10 px-4 sm:w-36 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[11px] font-bold cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/20 transition-all active:scale-95"
                >
                  <Camera size={14} />
                  <span>Camera Scanner</span>
                </button>
                <button 
                  type="submit"
                  className="flex-1 sm:flex-none h-10 px-4 sm:w-36 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white dark:text-slate-900 text-white rounded-xl text-[11px] font-bold cursor-pointer flex items-center justify-center shrink-0 transition-all active:scale-95"
                >
                  Verify Item
                </button>
              </div>
            </form>`;

code = code.replace(oldConsole, newConsole);
fs.writeFileSync('src/components/PackingVerificationModule.tsx', code);
console.log('Done replacement');
