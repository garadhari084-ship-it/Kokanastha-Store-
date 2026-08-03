const fs = require('fs');
let content = fs.readFileSync('src/components/PurchaseModule.tsx', 'utf8');

// Fix duplicate declarations
content = content.replace("  const [rowGst, setRowGst] = useState(0);\n  const [rowGst, setRowGst] = useState(0);", "  const [rowGst, setRowGst] = useState(0);");

// Fix Product creation missing fields
// We see error at src/components/PurchaseModule.tsx(160,45)
// Let's replace the dbStore.createProduct and dbStore.createSupplier payload
content = content.replace(
  `const newSupplier = {
                    id: newSupplierId,
                    name: data.supplierName,
                    phone: data.supplierPhone || '',
                    address: '',
                    gstin: data.supplierGstin || '',
                    business_id: businessId,
                    created_at: new Date().toISOString()
                };`,
  `const newSupplier: any = {
                    name: data.supplierName,
                    phone: data.supplierPhone || '',
                    address: '',
                    gstin: data.supplierGstin || '',
                    business_id: businessId,
                    email: ''
                };`
);

content = content.replace(
  `const newProd = {
                          id: crypto.randomUUID(),
                          name: it.name,
                          category: 'Uncategorized',
                          hsn_code: '',
                          purchase_price: it.price || 0,
                          selling_price: (it.price || 0) * 1.2,
                          gst_rate: it.gst_rate || 0,
                          current_stock: 0,
                          min_stock_level: 5,
                          unit: 'Unit',
                          purchase_unit: 'Unit',
                          business_id: businessId,
                          auto_conversion: false,
                          created_at: new Date().toISOString()
                      };`,
  `const newProd: any = {
                          name: it.name,
                          category: 'Uncategorized',
                          hsn_code: '',
                          purchase_price: it.price || 0,
                          selling_price: (it.price || 0) * 1.2,
                          gst_rate: it.gst_rate || 0,
                          min_stock_level: 5,
                          unit: 'Unit',
                          purchase_unit: 'Unit',
                          business_id: businessId,
                          auto_conversion: false,
                          sku: '',
                          barcode: '',
                          qr_code: '',
                          category_id: ''
                      };`
);

fs.writeFileSync('src/components/PurchaseModule.tsx', content);
