const fs = require('fs');
let code = fs.readFileSync('src/components/PackingVerificationModule.tsx', 'utf-8');

// Replace general space-y
code = code.replace(/space-y-6/g, 'space-y-4');
code = code.replace(/space-y-5/g, 'space-y-3.5');
code = code.replace(/space-y-4/g, 'space-y-3');

// Replace paddings on cards
code = code.replace(/p-5/g, 'p-4');
code = code.replace(/p-4/g, 'p-3.5');
code = code.replace(/p-3/g, 'p-2.5');

// Decrease text sizes
// text-sm -> text-xs
code = code.replace(/text-sm/g, 'text-xs');
// text-xs -> text-[11px]
// wait, text-xs is often used, let's replace some text-xs with text-[11px]
code = code.replace(/text-xs/g, 'text-[11px]');
// text-[11px] -> text-[10px]
// wait, we just replaced text-xs with text-[11px], let's not double replace.

// Header font size adjustments
code = code.replace(/text-3xl/g, 'text-2xl');
code = code.replace(/text-2xl/g, 'text-xl');
code = code.replace(/text-xl/g, 'text-lg');
code = code.replace(/text-lg/g, 'text-base');
code = code.replace(/text-base/g, 'text-sm');

// Fix any weirdness caused by the replacements
code = code.replace(/text-\[11px\] font-black text-slate-900/g, 'text-sm font-black text-slate-900'); // for Delivery Partner & Dispatch h3

fs.writeFileSync('src/components/PackingVerificationModule.tsx', code);
console.log('Compacted layout');
