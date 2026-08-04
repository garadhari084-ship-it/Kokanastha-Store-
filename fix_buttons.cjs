const fs = require('fs');
const file = 'src/components/PackingVerificationModule.tsx';

let content = fs.readFileSync(file, 'utf8');

const target = `<div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
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
              </div>`;

const replacement = `<div className="flex items-center gap-1.5">
                {[
                  { id: 'All', label: 'All Dates' },
                  { id: 'Today', label: "Today's Delivery" },
                  { id: 'Tomorrow', label: "Tomorrow" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setDateFilter(tab.id as any)}
                    className={\`px-3 py-1.5 rounded-full text-[11px] font-black transition-all whitespace-nowrap cursor-pointer border \${
                      dateFilter === tab.id
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }\`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>`;
              
const escapedTarget = target.replace(/[.*+?^\${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s*');
const targetRegex = new RegExp(escapedTarget, 'g');

if (targetRegex.test(content)) {
  content = content.replace(targetRegex, replacement);
  fs.writeFileSync(file, content);
  console.log('Replaced in ' + file);
} else {
  console.log('Could not find target');
}
