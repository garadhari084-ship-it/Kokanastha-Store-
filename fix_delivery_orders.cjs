const fs = require('fs');
let content = fs.readFileSync('src/components/DeliveryModule.tsx', 'utf8');

const target1 = "dbStore.getSalesOrders(businessId).filter(o => ['Packed', 'Dispatched', 'Delivered', 'Returned'].includes(o.status))";
const rep1 = "dbStore.getSalesOrders(businessId)";

content = content.replaceAll(target1, rep1);
fs.writeFileSync('src/components/DeliveryModule.tsx', content);
console.log('Fixed reloadOrders');
