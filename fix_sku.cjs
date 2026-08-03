const fs = require('fs');
let content = fs.readFileSync('src/services/store.ts', 'utf8');

const createProdOld = `  public createProduct(prod: Omit<Product, 'id' | 'created_at' | 'current_stock'>): Product {
    const newProd: Product = {`;
const createProdNew = `  public createProduct(prod: Omit<Product, 'id' | 'created_at' | 'current_stock'>): Product {
    if (!prod.sku || prod.sku.trim() === '') {
      prod.sku = 'SKU-' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase();
    }
    const newProd: Product = {`;
content = content.replace(createProdOld, createProdNew);

const updateProdOld = `  public updateProduct(id: string, updates: Partial<Product>) {
    const idx = this.cache.products.findIndex(p => p.id === id);
    if (idx !== -1) {`;
const updateProdNew = `  public updateProduct(id: string, updates: Partial<Product>) {
    if (updates.sku !== undefined && updates.sku.trim() === '') {
      updates.sku = 'SKU-' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase();
    }
    const idx = this.cache.products.findIndex(p => p.id === id);
    if (idx !== -1) {`;
content = content.replace(updateProdOld, updateProdNew);

// Also fix the cleaner block we added earlier where we set sku to null if empty
const cleanerOld = `               if (clean.sku === '') clean.sku = null;
               if (clean.barcode === '') clean.barcode = null;`;
const cleanerNew = `               // if (clean.sku === '') clean.sku = null;
               // if (clean.barcode === '') clean.barcode = null;`;
content = content.replace(cleanerOld, cleanerNew);

fs.writeFileSync('src/services/store.ts', content);
