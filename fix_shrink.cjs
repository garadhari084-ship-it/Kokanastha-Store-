const fs = require('fs');
let code = fs.readFileSync('src/components/PackingVerificationModule.tsx', 'utf-8');

code = code.replace(/className="flex-1 sm:flex-none h-10 px-4 sm:w-36 bg-indigo-600/g, 'className="flex-none h-10 px-4 w-auto sm:w-36 bg-indigo-600 shrink-0');
code = code.replace(/className="flex-1 sm:flex-none h-10 px-4 sm:w-36 bg-slate-900/g, 'className="flex-none h-10 px-4 w-auto sm:w-36 bg-slate-900 shrink-0');

fs.writeFileSync('src/components/PackingVerificationModule.tsx', code);
console.log('Fixed shrink');
