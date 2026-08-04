const fs = require('fs');
let content = fs.readFileSync('src/components/DeliveryModule.tsx', 'utf8');

// 1. Fix the count variables
const oldCounts = `  // Metrics
  const readyCount = orders.filter(o => o.status === 'Packed').length;
  const transitCount = orders.filter(o => o.status === 'Dispatched').length;`;

const newCounts = `  // Metrics
  const pendingCount = orders.filter(o => o.status === 'Pending' || o.status === 'Packing').length;
  const readyCount = orders.filter(o => o.status === 'Packed').length;
  const transitCount = orders.filter(o => o.status === 'Dispatched').length;`;
content = content.replace(oldCounts, newCounts);

// 2. Fix the activeFilter logic
const oldFilterLogic = `      // Apply status filter
      if (activeFilter === 'Pending Delivery') {
        if (o.status !== 'Dispatched') return false;
      } else if (activeFilter === 'Ready to Dispatch') {`;

const newFilterLogic = `      // Apply status filter
      if (activeFilter === 'Pending Delivery') {
        if (o.status !== 'Pending' && o.status !== 'Packing') return false;
      } else if (activeFilter === 'Ready to Dispatch') {`;
content = content.replace(oldFilterLogic, newFilterLogic);

// 3. Fix the label for Pending Delivery tab
const oldTab = `{ id: 'Pending Delivery', label: \`Pending Delivery (\${transitCount})\` }`;
const newTab = `{ id: 'Pending Delivery', label: \`Pending Delivery (\${pendingCount})\` }`;
content = content.replaceAll(oldTab, newTab);

const oldCard = `            <div 
              onClick={() => setActiveFilter('Pending Delivery')}
              className={\`bg-white dark:bg-slate-900 border p-2 sm:p-3 rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between gap-1 \${
                activeFilter === 'Pending Delivery' ? 'border-rose-500 ring-2 ring-rose-500/20' : 'border-slate-200/80 dark:border-slate-800 hover:border-rose-400 dark:hover:border-rose-600'
              }\`}
            >
              <div className="flex justify-between items-start">
                <div className="p-1.5 sm:p-2 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-lg group-hover:scale-110 transition-transform">
                  <AlertCircle size={18} />
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Late / Failed</span>
              </div>
              <div className="text-right mt-1">
                <span className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
                  {transitCount}
                </span>
              </div>
            </div>`;
// Wait, the card says "Late / Failed" but it filters on "Pending Delivery"? That was a mismatch too! Let's check the code first.
fs.writeFileSync('src/components/DeliveryModule.tsx', content);
console.log('patched');
