const fs = require('fs');

function fixFile(file) {
  let content = fs.readFileSync(file, 'utf8');
  
  const regex = /if \(dateFilter !== 'All'\) \{\s+const d = new Date\(\);\s+const today = `\$\{d\.getFullYear\(\)\}-\$\{String\(d\.getMonth\(\) \+ 1\)\.padStart\(2, '0'\)\}-\$\{String\(d\.getDate\(\)\)\.padStart\(2, '0'\)\}`;[^\}]+const date = o\.delivery_date \|\| o\.order_date \|\| 'Unknown Date';/;
  
  const target1 = `if (dateFilter !== 'All') {
      const today = new Date().toLocaleDateString('en-CA');
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toLocaleDateString('en-CA');
      const date = o.delivery_date || o.order_date || 'Unknown Date';`;
      
  const target2 = `if (dateFilter !== 'All') {
        const today = new Date().toLocaleDateString('en-CA');
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toLocaleDateString('en-CA');
        const date = o.delivery_date || o.order_date || 'Unknown Date';`;

  const newLogic = `if (dateFilter !== 'All') {
        const d = new Date();
        const today = \`\${d.getFullYear()}-\${String(d.getMonth() + 1).padStart(2, '0')}-\${String(d.getDate()).padStart(2, '0')}\`;
        const t = new Date();
        t.setDate(t.getDate() + 1);
        const tomorrowStr = \`\${t.getFullYear()}-\${String(t.getMonth() + 1).padStart(2, '0')}-\${String(t.getDate()).padStart(2, '0')}\`;
        const date = o.delivery_date || o.order_date || 'Unknown Date';`;

  content = content.replace(target1, newLogic);
  content = content.replace(target2, newLogic);
  
  content = content.replace(regex, newLogic);
  
  fs.writeFileSync(file, content);
  console.log('Fixed', file);
}

fixFile('src/components/DeliveryModule.tsx');
fixFile('src/components/PackingVerificationModule.tsx');
