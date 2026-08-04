const fs = require('fs');
let content = fs.readFileSync('src/components/DeliveryModule.tsx', 'utf8');

const oldUI = `      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-100/50 dark:bg-slate-800/20 p-2.5 rounded-2xl border border-slate-200/60 dark:border-slate-800">
        <div className="flex flex-wrap gap-2 mb-3">
          {[`;

const newUI = `      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-100/50 dark:bg-slate-800/20 p-2.5 rounded-2xl border border-slate-200/60 dark:border-slate-800">
        <div className="flex flex-col gap-2">
          {/* Date Filter Tabs */}
          <div className="flex flex-wrap gap-2">
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
          </div>
          
          {/* Status Filter Tabs */}
          <div className="flex flex-wrap gap-2">
            {[`;

content = content.replace(oldUI, newUI);
fs.writeFileSync('src/components/DeliveryModule.tsx', content);
console.log('patched delivery ui');
