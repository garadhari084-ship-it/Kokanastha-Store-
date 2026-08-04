const fs = require('fs');
let content = fs.readFileSync('src/components/DeliveryModule.tsx', 'utf8');

const oldUI = `      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1 sm:pb-0">
          {[
            { id: 'All', label: 'All Orders' },`;

const newUI = `      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        <div className="flex flex-col gap-2 w-full">
          {/* Date Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1 sm:pb-0">
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
          <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1 sm:pb-0">
            {[
              { id: 'All', label: 'All Orders' },`;

content = content.replace(oldUI, newUI);
fs.writeFileSync('src/components/DeliveryModule.tsx', content);
console.log('patched delivery ui 2');
