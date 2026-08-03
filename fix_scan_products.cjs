const fs = require('fs');
let content = fs.readFileSync('src/components/PurchaseModule.tsx', 'utf8');

const scanLoopOld = `              for (const it of data.items) {
                  let prod = products.find(p => p.name.toLowerCase() === it.name.toLowerCase());
                  if (!prod) {`;
const scanLoopNew = `              for (const it of data.items) {
                  let prod = dbStore.getProducts(businessId).find(p => p.name.toLowerCase() === it.name.toLowerCase());
                  if (!prod) {`;
content = content.replace(scanLoopOld, scanLoopNew);

fs.writeFileSync('src/components/PurchaseModule.tsx', content);
