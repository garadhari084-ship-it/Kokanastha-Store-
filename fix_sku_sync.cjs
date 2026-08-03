const fs = require('fs');
let content = fs.readFileSync('src/services/store.ts', 'utf8');

const cleanerOld = `               // if (clean.sku === '') clean.sku = null;
               // if (clean.barcode === '') clean.barcode = null;`;
const cleanerNew = `               if (clean.sku === '' || clean.sku === null) {
                   clean.sku = 'SKU-' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase();
               }
               if (clean.barcode === '') clean.barcode = null;`;
content = content.replace(cleanerOld, cleanerNew);

fs.writeFileSync('src/services/store.ts', content);
