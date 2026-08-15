const fs = require('fs');
let content = fs.readFileSync('src/components/SalesModule.tsx', 'utf-8');

content = content.replace(
  'className="px-2.5 py-2 bg-indigo-700 hover:bg-indigo-600 text-white border-l border-indigo-500/50 transition-colors cursor-pointer flex items-center rounded-r-xl"',
  'className="px-2.5 py-2 bg-indigo-700 hover:bg-indigo-600 text-white border-l border-indigo-500/50 transition-colors cursor-pointer flex items-center rounded-r-xl select-none touch-manipulation"'
);

fs.writeFileSync('src/components/SalesModule.tsx', content);
