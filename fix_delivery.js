const fs = require('fs');
let code = fs.readFileSync('src/components/DeliveryModule.tsx', 'utf8');

code = code.replace(/\\`/g, '`');

fs.writeFileSync('src/components/DeliveryModule.tsx', code);
