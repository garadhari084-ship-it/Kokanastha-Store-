const fs = require('fs');
const file = 'src/components/DeliveryModule.tsx';
let content = fs.readFileSync(file, 'utf8');

const overdueCard = `
        <div 
          onClick={() => setActiveFilter('Overdue')}
          className={\`bg-white dark:bg-slate-900 border p-2 sm:p-3 rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between gap-1 \${
            activeFilter === 'Overdue' ? 'border-rose-500 ring-2 ring-rose-500/20' : 'border-slate-200/80 dark:border-slate-800 hover:border-rose-400 dark:hover:border-rose-600'
          }\`}
        >
          <div className="flex items-center gap-1.5">
            <div className="p-1.5 bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 rounded-lg group-hover:scale-110 transition-transform shrink-0">
              <AlertTriangle size={14} />
            </div>
            <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">OVERDUE</span>
          </div>
          <div className="text-right mt-1">
            <span className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
              {overdueCount}
            </span>
          </div>
        </div>
`;

content = content.replace(
  /\<div className="grid grid-cols-2 lg:grid-cols-4 gap-2"\>/,
  `<div className="grid grid-cols-2 lg:grid-cols-5 gap-2">\n` + overdueCard
);

fs.writeFileSync(file, content);
