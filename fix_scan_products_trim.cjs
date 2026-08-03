const fs = require('fs');
let content = fs.readFileSync('src/components/PurchaseModule.tsx', 'utf8');

const scanLoopOld = `              for (const it of data.items) {
                  let prod = dbStore.getProducts(businessId).find(p => p.name.toLowerCase() === it.name.toLowerCase());
                  if (!prod) {`;
const scanLoopNew = `              for (const it of data.items) {
                  const searchName = (it.name || '').toLowerCase().trim();
                  let prod = dbStore.getProducts(businessId).find(p => p.name.toLowerCase().trim() === searchName);
                  if (!prod) {`;
content = content.replace(scanLoopOld, scanLoopNew);

const newProdOld = `                      const newProd: any = {
                          name: it.name,`;
const newProdNew = `                      const newProd: any = {
                          name: (it.name || '').trim() || 'Scanned Item',`;
content = content.replace(newProdOld, newProdNew);

fs.writeFileSync('src/components/PurchaseModule.tsx', content);
