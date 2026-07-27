const fs = require('fs');
let code = fs.readFileSync('src/components/PackingVerificationModule.tsx', 'utf-8');

code = code.replace(/flex flex-col lg:flex-row gap-3\.5/g, 'flex flex-col md:flex-row gap-3.5');

fs.writeFileSync('src/components/PackingVerificationModule.tsx', code);
console.log('Fixed dispatch flex');
