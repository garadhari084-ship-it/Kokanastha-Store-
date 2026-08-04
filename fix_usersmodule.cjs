const fs = require('fs');
const file = 'src/components/UsersModule.tsx';

let content = fs.readFileSync(file, 'utf8');

const target = `{ id: 'packing', label: 'Packing' },
                      { id: 'delivery', label: 'Delivery' },`;

const replacement = `{ id: 'packing', label: 'Packing' },
                      { id: 'item_stock_live_report', label: 'Item Stock Live' },
                      { id: 'delivery', label: 'Delivery' },`;
              
const escapedTarget = target.replace(/[.*+?^\${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s*');
const targetRegex = new RegExp(escapedTarget, 'g');

if (targetRegex.test(content)) {
  content = content.replace(targetRegex, replacement);
  fs.writeFileSync(file, content);
  console.log('Replaced in ' + file);
} else {
  console.log('Could not find target');
}
