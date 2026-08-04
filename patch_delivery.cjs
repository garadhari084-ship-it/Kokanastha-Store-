const fs = require('fs');
let content = fs.readFileSync('src/components/DeliveryModule.tsx', 'utf8');

content = content.replace(
  "const [activeFilter, setActiveFilter] = useState<'All' | 'Pending Delivery' | 'Ready to Dispatch' | 'In Transit' | 'Delivered' | 'Returned'>('Pending Delivery');",
  "const [activeFilter, setActiveFilter] = useState<'All' | 'Pending Delivery' | 'Ready to Dispatch' | 'In Transit' | 'Delivered' | 'Returned'>('Pending Delivery');\n  const [dateFilter, setDateFilter] = useState<'All' | 'Today' | 'Tomorrow' | 'Upcoming'>('All');"
);

const oldFilterDeps = `    }).sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
  }, [orders, customers, searchQuery, activeFilter]);`;

const oldSearchBlock = `      if (searchQuery) {
        const cust = customers.find(c => c.id === o.customer_id);
        const q = searchQuery.toLowerCase();
        return o.order_number.toLowerCase().includes(q) || 
               (cust && cust.name.toLowerCase().includes(q));
      }
      
      return true;
    }).sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());`;

const newSearchBlock = `      if (dateFilter !== 'All') {
        const today = new Date().toLocaleDateString('en-CA');
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toLocaleDateString('en-CA');
        const date = o.delivery_date || o.order_date || 'Unknown Date';
        
        if (dateFilter === 'Today' && date !== today) return false;
        if (dateFilter === 'Tomorrow' && date !== tomorrowStr) return false;
        if (dateFilter === 'Upcoming' && date <= tomorrowStr) return false;
      }
      
      if (searchQuery) {
        const cust = customers.find(c => c.id === o.customer_id);
        const q = searchQuery.toLowerCase();
        return o.order_number.toLowerCase().includes(q) || 
               (cust && cust.name.toLowerCase().includes(q));
      }
      
      return true;
    }).sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());`;

content = content.replace(oldSearchBlock, newSearchBlock);
content = content.replace("  }, [orders, customers, searchQuery, activeFilter]);", "  }, [orders, customers, searchQuery, activeFilter, dateFilter]);");

fs.writeFileSync('src/components/DeliveryModule.tsx', content);
console.log('patched delivery logic');
