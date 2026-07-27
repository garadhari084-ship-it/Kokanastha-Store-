const fs = require('fs');
let code = fs.readFileSync('src/components/PackingVerificationModule.tsx', 'utf-8');

const oldConsoleBlock = `<form onSubmit={handleFormSubmit} className="flex flex-row w-full gap-2">
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
                  className="flex-none h-10 px-4 w-auto sm:w-36 bg-indigo-600 shrink-0 hover:bg-indigo-700 text-white rounded-xl text-[11px] font-bold cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/20 transition-all active:scale-95"
                >
                  <Camera size={14} />
                  <span>Camera Scanner</span>
                </button>
                <button 
                  type="submit"
                  className="flex-none h-10 px-4 w-auto sm:w-36 bg-slate-900 shrink-0 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white dark:text-slate-900 text-white rounded-xl text-[11px] font-bold cursor-pointer flex items-center justify-center shrink-0 transition-all active:scale-95"
                >
                  Verify Item
                </button>
              </div>
            </form>`;

const newConsoleBlock = `<form onSubmit={handleFormSubmit} className="flex flex-col w-full gap-2.5">
              {/* Row 1: Barcode / SKU type input field */}
              <div className="relative w-full">
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

              {/* Row 2: Verify Item on left, Camera Scanner on right */}
              <div className="flex items-center justify-between gap-2 w-full">
                <button 
                  type="submit"
                  className="h-10 px-5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white dark:text-slate-900 text-white rounded-xl text-[11px] font-bold cursor-pointer flex items-center justify-center transition-all active:scale-95 shadow-sm"
                >
                  Verify Item
                </button>

                <button
                  type="button"
                  onClick={() => setIsScannerOpen(true)}
                  className="h-10 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[11px] font-bold cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/20 transition-all active:scale-95"
                >
                  <Camera size={14} />
                  <span>Camera Scanner</span>
                </button>
              </div>
            </form>`;

if (code.includes(oldConsoleBlock)) {
  code = code.replace(oldConsoleBlock, newConsoleBlock);
  fs.writeFileSync('src/components/PackingVerificationModule.tsx', code);
  console.log('Barcode console row layout successfully updated!');
} else {
  console.error('Could not find oldConsoleBlock exact string');
}
