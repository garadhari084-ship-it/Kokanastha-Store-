const fs = require('fs');
const file = 'src/components/DeliveryModule.tsx';
let content = fs.readFileSync(file, 'utf8');

const searchStr = `      ) : (
      {/* Compact List View */}
      <div className="bg-white dark:bg-slate-900 overflow-x-auto`;

const replaceStr = `      ) : (
      <div className="bg-white dark:bg-slate-900 overflow-x-auto`;

content = content.replace(searchStr, replaceStr);
fs.writeFileSync(file, content);
