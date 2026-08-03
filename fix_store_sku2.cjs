const fs = require('fs');
let content = fs.readFileSync('src/services/store.ts', 'utf8');

content = content.replace(
  "if (clean.sku === '') clean.sku = null;",
  "if (clean.sku === '') clean.sku = null;\n               if (clean.barcode === '') clean.barcode = null;"
);

fs.writeFileSync('src/services/store.ts', content);
