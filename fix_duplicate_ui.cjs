const fs = require('fs');
let content = fs.readFileSync('src/components/PurchaseModule.tsx', 'utf8');

const regex = /<div className="w-28 space-y-1">\s*<label className="text-\[10px\] font-semibold text-slate-500">Unit Price \(₹\)<\/label>\s*<input[^>]+value={rowPrice}[^>]+>\s*<\/div>\s*<div className="w-24 space-y-1">\s*<label className="text-\[10px\] font-semibold text-slate-500">GST %<\/label>\s*<input[^>]+value={rowGst}[^>]+>\s*<\/div>/g;

let matches = content.match(regex);
if (matches && matches.length > 1) {
  content = content.replace(matches[1], "");
}

fs.writeFileSync('src/components/PurchaseModule.tsx', content);
