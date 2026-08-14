const fs = require('fs');
const file = 'src/components/DeliveryModule.tsx';
let content = fs.readFileSync(file, 'utf8');

const searchSection = `        </div>
        <div className="flex-1 max-w-md flex items-center bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-full px-3 py-1.5 shadow-xs focus-within:ring-2 focus-within:ring-indigo-500 transition-shadow">`;

const replaceSection = `        </div>
        <div className="flex items-center gap-3 w-full lg:w-auto">
          <div className="flex items-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-0.5 shadow-xs">
            <button
              onClick={() => setViewMode('list')}
              className={\`p-1.5 rounded-md transition-all \${viewMode === 'list' ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}\`}
              title="List View"
            >
              <LayoutList size={16} />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={\`p-1.5 rounded-md transition-all \${viewMode === 'grid' ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}\`}
              title="Grid View"
            >
              <Grid3X3 size={16} />
            </button>
          </div>
          <div className="flex-1 max-w-md flex items-center bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-full px-3 py-1.5 shadow-xs focus-within:ring-2 focus-within:ring-indigo-500 transition-shadow">`;

content = content.replace(searchSection, replaceSection);
fs.writeFileSync(file, content);
