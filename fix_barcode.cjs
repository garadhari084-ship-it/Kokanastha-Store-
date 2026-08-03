const fs = require('fs');
let content = fs.readFileSync('src/services/store.ts', 'utf8');

const barcodeOld = `               if (clean.barcode === '') clean.barcode = null;`;
const barcodeNew = `               if (clean.barcode === '' || clean.barcode === null) {
                   clean.barcode = 'BAR-' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase();
               }`;
content = content.replace(barcodeOld, barcodeNew);
fs.writeFileSync('src/services/store.ts', content);
