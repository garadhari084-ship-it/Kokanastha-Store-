const fs = require('fs');
let code = fs.readFileSync('src/components/PackingVerificationModule.tsx', 'utf-8');
code = code.replace(/<\/div>\s*<\/div>\s*\{\/\* CAMERA SCANNER MODAL \*\/\}/g, '</div>{/* CAMERA SCANNER MODAL */}');
fs.writeFileSync('src/components/PackingVerificationModule.tsx', code);
