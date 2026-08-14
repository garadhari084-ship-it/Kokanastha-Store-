const fs = require('fs');
const file = 'src/components/DeliveryModule.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /useState\<'All' \| 'Pending Delivery' \| 'Ready to Dispatch' \| 'In Transit' \| 'Delivered' \| 'Returned'\>/g,
  "useState<'All' | 'Pending Delivery' | 'Ready to Dispatch' | 'In Transit' | 'Delivered' | 'Returned' | 'Overdue'>"
);

content = content.replace(
  /const codPendingAmount = [^;]+;/,
  `$&

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const overdueCount = orders.filter(o => 
    o.status !== 'Delivered' && 
    o.status !== 'Returned' && 
    o.delivery_date && 
    new Date(o.delivery_date) < todayStart
  ).length;`
);

content = content.replace(
  /(\} else if \(activeFilter === 'Returned'\) \{\n\s+if \(o\.status !== 'Returned'\) return false;\n\s+\})/,
  `$1 else if (activeFilter === 'Overdue') {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        if (o.status === 'Delivered' || o.status === 'Returned' || !o.delivery_date || new Date(o.delivery_date) >= todayStart) return false;
      }`
);

fs.writeFileSync(file, content);
