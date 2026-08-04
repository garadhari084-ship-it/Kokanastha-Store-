const fs = require('fs');
let lines = fs.readFileSync('src/components/DeliveryModule.tsx', 'utf8').split('\n');
const index = lines.findIndex(l => l.includes('<div className="flex-1 max-w-md flex items-center bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-full'));
if (index > -1) {
  lines.splice(index, 0, '        </div>');
  fs.writeFileSync('src/components/DeliveryModule.tsx', lines.join('\n'));
  console.log('Fixed div');
} else {
  console.log('Not found');
}
