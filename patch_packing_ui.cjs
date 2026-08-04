const fs = require('fs');
let content = fs.readFileSync('src/components/PackingVerificationModule.tsx', 'utf8');

const oldUI = `            <div className="flex items-center gap-2.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
                <button
                  onClick={() => setViewMode('grid')}`;

const newUI = `            <div className="flex items-center gap-2.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
                <button
                  onClick={() => setDateFilter('All')}
                  className={\`px-3 py-1.5 text-xs font-bold rounded-md transition-all \${dateFilter === 'All' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400 ring-1 ring-slate-200 dark:ring-slate-600' : 'text-slate-500 hover:text-slate-700 dark:text-slate-300'}\`}
                >
                  All Dates
                </button>
                <button
                  onClick={() => setDateFilter('Today')}
                  className={\`px-3 py-1.5 text-xs font-bold rounded-md transition-all \${dateFilter === 'Today' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400 ring-1 ring-slate-200 dark:ring-slate-600' : 'text-slate-500 hover:text-slate-700 dark:text-slate-300'}\`}
                >
                  Today's Delivery
                </button>
                <button
                  onClick={() => setDateFilter('Tomorrow')}
                  className={\`px-3 py-1.5 text-xs font-bold rounded-md transition-all \${dateFilter === 'Tomorrow' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400 ring-1 ring-slate-200 dark:ring-slate-600' : 'text-slate-500 hover:text-slate-700 dark:text-slate-300'}\`}
                >
                  Tomorrow
                </button>
              </div>

              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
                <button
                  onClick={() => setViewMode('grid')}`;

content = content.replace(oldUI, newUI);
fs.writeFileSync('src/components/PackingVerificationModule.tsx', content);
console.log('patched packing ui');
