const fs = require('fs');
let content = fs.readFileSync('src/components/SalesModule.tsx', 'utf-8');

content = content.replace(
  'className="px-4 py-2 bg-slate-800 hover:bg-slate-700 active:bg-slate-800 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"',
  'className="px-4 py-2 bg-slate-800 hover:bg-slate-700 active:bg-slate-800 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs select-none touch-manipulation"'
);

content = content.replace(
  "className={`px-5 py-2 text-xs font-bold transition-all cursor-pointer flex items-center gap-2 rounded-l-xl ${",
  "className={`px-5 py-2 text-xs font-bold transition-all cursor-pointer flex items-center gap-2 rounded-l-xl select-none touch-manipulation ${"
);

fs.writeFileSync('src/components/SalesModule.tsx', content);
