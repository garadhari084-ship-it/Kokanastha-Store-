const fs = require('fs');
let content = fs.readFileSync('src/components/PackingVerificationModule.tsx', 'utf8');

content = content.replace(
  "const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');",
  "const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');\n  const [dateFilter, setDateFilter] = useState<'All' | 'Today' | 'Tomorrow' | 'Upcoming'>('All');"
);

const oldFilter = `  // Filter queue orders
  const filteredQueue = pendingOrders.filter(o => {
    const cust = customers.find(c => c.id === o.customer_id);
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      o.order_number.toLowerCase().includes(q) ||
      (cust && cust.name.toLowerCase().includes(q)) ||
      (cust && cust.phone?.toLowerCase().includes(q)) ||
      (o.area && o.area.toLowerCase().includes(q))
    );
  });`;

const newFilter = `  // Filter queue orders
  const filteredQueue = pendingOrders.filter(o => {
    const cust = customers.find(c => c.id === o.customer_id);
    const q = searchQuery.toLowerCase().trim();
    
    // Apply date filter
    if (dateFilter !== 'All') {
      const today = new Date().toLocaleDateString('en-CA');
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toLocaleDateString('en-CA');
      const date = o.delivery_date || o.order_date || 'Unknown Date';
      
      if (dateFilter === 'Today' && date !== today) return false;
      if (dateFilter === 'Tomorrow' && date !== tomorrowStr) return false;
      if (dateFilter === 'Upcoming' && date <= tomorrowStr) return false;
    }
    
    if (!q) return true;
    return (
      o.order_number.toLowerCase().includes(q) ||
      (cust && cust.name.toLowerCase().includes(q)) ||
      (cust && cust.phone?.toLowerCase().includes(q)) ||
      (o.area && o.area.toLowerCase().includes(q))
    );
  });`;

content = content.replace(oldFilter, newFilter);

fs.writeFileSync('src/components/PackingVerificationModule.tsx', content);
console.log('patched packing logic');
