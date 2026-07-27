const fs = require('fs');
let code = fs.readFileSync('src/components/PackingVerificationModule.tsx', 'utf-8');

code = code.replace(/p-2\.5\.5/g, 'p-4');
// check for any space-y messes too
code = code.replace(/space-y-3\.5\.5/g, 'space-y-4');
code = code.replace(/space-y-2\.5\.5/g, 'space-y-3');

fs.writeFileSync('src/components/PackingVerificationModule.tsx', code);
console.log('Fixed paddings again');
