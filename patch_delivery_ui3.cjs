const fs = require('fs');
let content = fs.readFileSync('src/components/DeliveryModule.tsx', 'utf8');

const oldUI = `            </button>
          ))}
        </div>
        <div className="flex-1 max-w-md flex items-center bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-full px-3 py-1.5 shadow-xs focus-within:ring-2 focus-within:ring-indigo-500 transition-shadow">`;

const newUI = `            </button>
          ))}
        </div>
        </div>
        <div className="flex-1 max-w-md flex items-center bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-full px-3 py-1.5 shadow-xs focus-within:ring-2 focus-within:ring-indigo-500 transition-shadow self-start mt-1">`;

content = content.replace(oldUI, newUI);
fs.writeFileSync('src/components/DeliveryModule.tsx', content);
console.log('patched delivery ui 3');
