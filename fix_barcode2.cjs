const fs = require('fs');
let content = fs.readFileSync('src/services/store.ts', 'utf8');

const barcodeOld = `               if (clean.barcode === '' || clean.barcode === null) {`;
const barcodeNew = `               if (!clean.barcode) {`;
content = content.replace(barcodeOld, barcodeNew);

fs.writeFileSync('src/services/store.ts', content);
