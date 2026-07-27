const fs = require('fs');
let code = fs.readFileSync('src/components/PackingVerificationModule.tsx', 'utf-8');

code = code.replace(/<div className="bg-slate-900\/90 border border-slate-800 p-3\.5 rounded-xl flex flex-col justify-between w-full md:w-80 shrink-0">/, '<div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-xl flex flex-col justify-between w-full sm:w-[320px] shrink-0">');

// ensure we don't have w-full forcing wrap on mobile if they want it side by side even on small? No, on mobile it must wrap. sm: is 640px. At 640px, it fits.
fs.writeFileSync('src/components/PackingVerificationModule.tsx', code);
console.log('Fixed banner progress box');
