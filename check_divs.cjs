const fs = require('fs');
const content = fs.readFileSync('src/components/DeliveryModule.tsx', 'utf8');

let openCount = (content.match(/<div(\s|>)/g) || []).length;
let closeCount = (content.match(/<\/div>/g) || []).length;
console.log(`Open: ${openCount}, Close: ${closeCount}`);
