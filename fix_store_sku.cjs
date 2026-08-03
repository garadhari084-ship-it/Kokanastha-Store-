const fs = require('fs');
let content = fs.readFileSync('src/services/store.ts', 'utf8');

content = content.replace(
  "           if (tableName === 'products') {\n               clean.category_id = sanitizeUUID(clean.category_id, true);\n           }",
  "           if (tableName === 'products') {\n               clean.category_id = sanitizeUUID(clean.category_id, true);\n               if (clean.sku === '') clean.sku = null;\n           }"
);

// Also let's fix the 23503 handler to strip product_id if it's there, or just ignore for now since fixing SKU might fix the root cause.
content = content.replace(
  "if ('last_order_id' in copy) copy.last_order_id = null;",
  "if ('last_order_id' in copy) copy.last_order_id = null;\n             if ('product_id' in copy) copy.product_id = null;"
);

fs.writeFileSync('src/services/store.ts', content);
