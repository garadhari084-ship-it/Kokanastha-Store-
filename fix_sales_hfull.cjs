const fs = require('fs');
let content = fs.readFileSync('src/components/SalesModule.tsx', 'utf-8');

content = content.replace(
  '<div className="bg-white dark:bg-slate-900 w-full h-full flex flex-col animate-in zoom-in duration-150 overflow-hidden">',
  '<div className="bg-white dark:bg-slate-900 w-full h-[100dvh] flex flex-col animate-in zoom-in duration-150 overflow-hidden">'
);

content = content.replace(
  '<div className="bg-slate-900 p-4 shrink-0 shadow-2xl relative z-10 border-t border-slate-800/80">',
  '<div className="bg-slate-900 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shrink-0 shadow-2xl relative z-10 border-t border-slate-800/80">'
);

fs.writeFileSync('src/components/SalesModule.tsx', content);
