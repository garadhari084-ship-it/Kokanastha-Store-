const fs = require('fs');
let code = fs.readFileSync('src/components/PackingVerificationModule.tsx', 'utf-8');

// 1. Banner
code = code.replace(/flex flex-col md:flex-row md:items-center justify-between gap-4/, 'flex flex-row flex-wrap items-center justify-between gap-4');

// 2. Barcode Form
code = code.replace(/flex flex-col sm:flex-row gap-2/, 'flex flex-row w-full gap-2');

// 3. Dispatch panel Header
code = code.replace(/flex flex-col sm:flex-row sm:items-center justify-between gap-2\.5 border-b/, 'flex flex-row flex-wrap items-center justify-between gap-2.5 border-b');

// 4. Dispatch Form
code = code.replace(/flex flex-col xl:flex-row gap-3\.5/, 'flex flex-col lg:flex-row gap-3.5');

// 5. Dispatch Action Buttons
code = code.replace(/flex flex-col sm:flex-row items-center justify-between gap-2\.5/, 'flex flex-row flex-wrap items-center justify-between gap-2.5');

// 6. View B header
code = code.replace(/flex flex-col md:flex-row items-center justify-between gap-3\.5/, 'flex flex-row flex-wrap items-center justify-between gap-3.5');

fs.writeFileSync('src/components/PackingVerificationModule.tsx', code);
console.log('Flex replaced');
