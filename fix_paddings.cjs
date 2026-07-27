const fs = require('fs');
let code = fs.readFileSync('src/components/PackingVerificationModule.tsx', 'utf-8');

code = code.replace(/p-2\.5\.5/g, 'p-3.5');
code = code.replace(/p-3\.5\.5/g, 'p-4');

fs.writeFileSync('src/components/PackingVerificationModule.tsx', code);
console.log('Fixed paddings');
