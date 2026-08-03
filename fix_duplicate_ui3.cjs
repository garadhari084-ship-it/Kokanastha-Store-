const fs = require('fs');
let content = fs.readFileSync('src/components/PurchaseModule.tsx', 'utf8');

const strToReplace = `<div className="w-24 space-y-1">
                    <label className="text-[10px] font-semibold text-slate-500">GST %</label>
                    <input 
                      type="number" 
                      min="0"
                      value={rowGst}
                      onChange={(e) => setRowGst(parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-900 text-xs rounded border border-slate-300 dark:border-slate-600 text-right"
                    />
                  </div>`;

// Find first occurrence
const firstIdx = content.indexOf(strToReplace);
if (firstIdx !== -1) {
  // Find second occurrence starting after the first
  const secondIdx = content.indexOf(strToReplace, firstIdx + strToReplace.length);
  if (secondIdx !== -1) {
    content = content.slice(0, secondIdx) + content.slice(secondIdx + strToReplace.length);
  }
}

fs.writeFileSync('src/components/PurchaseModule.tsx', content);
