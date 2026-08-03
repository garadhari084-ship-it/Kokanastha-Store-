const fs = require('fs');
let content = fs.readFileSync('src/components/PurchaseModule.tsx', 'utf8');

const strToReplace = `<div className="w-28 space-y-1">
                    <label className="text-[10px] font-semibold text-slate-500">Unit Price (₹)</label>
                    <input 
                      type="number" 
                      min="0"
                      value={rowPrice}
                      onChange={(e) => setRowPrice(parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-900 text-xs rounded border border-slate-300 dark:border-slate-600 text-right"
                    />
                  </div>
                  <div className="w-24 space-y-1">
                    <label className="text-[10px] font-semibold text-slate-500">GST %</label>
                    <input 
                      type="number" 
                      min="0"
                      value={rowGst}
                      onChange={(e) => setRowGst(parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-900 text-xs rounded border border-slate-300 dark:border-slate-600 text-right"
                    />
                  </div>`;

// Replace all occurrences with empty string, then add it back once where it belongs
const split = content.split(strToReplace);
if (split.length > 2) {
  content = split.join(''); // remove all
  // The first place it should go is after PO Qty
  const poQtyStr = `<div className="w-24 space-y-1">
                    <label className="text-[10px] font-semibold text-slate-500">PO Qty</label>
                    <input 
                      type="number" 
                      min="1"
                      value={rowQty}
                      onChange={(e) => setRowQty(parseInt(e.target.value) || 0)}
                      className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-900 text-xs rounded border border-slate-300 dark:border-slate-600 text-right"
                    />
                  </div>`;
  content = content.replace(poQtyStr, poQtyStr + "\n" + strToReplace);
}

fs.writeFileSync('src/components/PurchaseModule.tsx', content);
