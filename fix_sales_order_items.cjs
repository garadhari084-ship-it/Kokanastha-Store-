const fs = require('fs');
let content = fs.readFileSync('src/services/store.ts', 'utf8');

const salesOld = `               if (clean.items) {
                   clean.items.forEach((i: any) => {
                       const si = { ...i, sales_order_id: clean.id };
                       si.id = sanitizeUUID(si.id, false);
                       si.product_id = sanitizeUUID(si.product_id, false);
                       salesItems.push(si);
                   });
               }`;
const salesNew = `               if (clean.items) {
                   clean.items.forEach((i: any) => {
                       const si = { ...i, sales_order_id: clean.id };
                       si.id = sanitizeUUID(si.id, false);
                       si.product_id = sanitizeUUID(si.product_id, false);
                       delete si.is_overridden;
                       salesItems.push(si);
                   });
               }`;
content = content.replace(salesOld, salesNew);

const purchaseOld = `               if (clean.items) {
                   clean.items.forEach((i: any) => {
                       const pi = { ...i, purchase_order_id: clean.id };
                       pi.id = sanitizeUUID(pi.id, false);
                       pi.product_id = sanitizeUUID(pi.product_id, false);
                       purchaseItems.push(pi);
                   });
               }`;
const purchaseNew = `               if (clean.items) {
                   clean.items.forEach((i: any) => {
                       const pi = { ...i, purchase_order_id: clean.id };
                       pi.id = sanitizeUUID(pi.id, false);
                       pi.product_id = sanitizeUUID(pi.product_id, false);
                       delete pi.is_overridden;
                       purchaseItems.push(pi);
                   });
               }`;
content = content.replace(purchaseOld, purchaseNew);

fs.writeFileSync('src/services/store.ts', content);
