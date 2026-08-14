const fs = require('fs');
const file = 'src/components/DeliveryModule.tsx';
let content = fs.readFileSync(file, 'utf8');

const searchStr = `                const isCOD = o.payment_status !== 'Paid';
                const unpaidBalance = Math.max(0, o.total_amount - (o.paid_amount || 0));
                
                return (
                  <tr key={o.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">`;

const replaceStr = `                const isCOD = o.payment_status !== 'Paid';
                const unpaidBalance = Math.max(0, o.total_amount - (o.paid_amount || 0));
                const todayStart = new Date();
                todayStart.setHours(0, 0, 0, 0);
                const isOverdue = o.delivery_date && new Date(o.delivery_date) < todayStart && o.status !== 'Delivered' && o.status !== 'Returned';
                
                return (
                  <tr key={o.id} className={\`transition-colors \${isOverdue ? 'bg-rose-50/70 hover:bg-rose-100/70 dark:bg-rose-950/20 dark:hover:bg-rose-900/30' : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/40'}\`}>`;

content = content.replace(searchStr, replaceStr);
fs.writeFileSync(file, content);
