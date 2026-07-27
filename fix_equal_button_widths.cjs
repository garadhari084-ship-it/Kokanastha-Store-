const fs = require('fs');
let code = fs.readFileSync('src/components/PackingVerificationModule.tsx', 'utf-8');

const oldRow = `<div className="flex items-center justify-between gap-2 w-full">
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
              </div>`;

const newRow = `<div className="grid grid-cols-2 gap-2 w-full">
                <button 
                  type="submit"
                  className="h-10 px-4 w-full bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white dark:text-slate-900 text-white rounded-xl text-[11px] font-bold cursor-pointer flex items-center justify-center transition-all active:scale-95 shadow-sm"
                >
                  Verify Item
                </button>

                <button
                  type="button"
                  onClick={() => setIsScannerOpen(true)}
                  className="h-10 px-4 w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[11px] font-bold cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/20 transition-all active:scale-95"
                >
                  <Camera size={14} />
                  <span>Camera Scanner</span>
                </button>
              </div>`;

if (code.includes(oldRow)) {
  code = code.replace(oldRow, newRow);
  fs.writeFileSync('src/components/PackingVerificationModule.tsx', code);
  console.log('Updated to equal width grid!');
} else {
  console.error('Could not match oldRow');
}
