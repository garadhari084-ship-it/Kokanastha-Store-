const fs = require('fs');
let content = fs.readFileSync('src/components/PurchaseModule.tsx', 'utf8');

const scanOld = `                  if (!prod) {
                      // create product
                      const newProd: any = {
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
                      };
                      dbStore.createProduct(newProd);
                      prod = newProd;
                  }`;
const scanNew = `                  if (!prod) {
                      // create product
                      const newProd: any = {
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
                      };
                      prod = dbStore.createProduct(newProd);
                  }`;
content = content.replace(scanOld, scanNew);

const afterScanOld = `              }
              setItems(newItems);
          }
          
          triggerToast('Invoice scanned and mapped successfully!', 'success');`;

const afterScanNew = `              }
              setItems(newItems);
              setProducts(dbStore.getProducts(businessId));
          }
          
          triggerToast('Invoice scanned and mapped successfully!', 'success');`;
content = content.replace(afterScanOld, afterScanNew);

// Also let's fix supplier finding during scan if a new supplier is created
const supScanOld = `            let supplier = suppliers.find(s => s.name.toLowerCase() === data.supplierName.toLowerCase() || (data.supplierPhone && s.phone === data.supplierPhone));
            if (!supplier) {
                const newSupplierId = crypto.randomUUID();
                const newSupplier: any = {
                    name: data.supplierName,
                    phone: data.supplierPhone || '',
                    address: '',
                    gstin: data.supplierGstin || '',
                    business_id: businessId,
                    email: ''
                };
                dbStore.createSupplier(newSupplier);
                supplier = newSupplier;
            }
            setSelectedSupplierId(supplier.id);`;

const supScanNew = `            let supplier = suppliers.find(s => s.name.toLowerCase() === data.supplierName.toLowerCase() || (data.supplierPhone && s.phone === data.supplierPhone));
            if (!supplier) {
                const newSupplier: any = {
                    name: data.supplierName,
                    phone: data.supplierPhone || '',
                    address: '',
                    gstin: data.supplierGstin || '',
                    business_id: businessId,
                    email: ''
                };
                supplier = dbStore.createSupplier(newSupplier);
                setSuppliers(dbStore.getSuppliers(businessId));
            }
            setSelectedSupplierId(supplier.id);`;
content = content.replace(supScanOld, supScanNew);

fs.writeFileSync('src/components/PurchaseModule.tsx', content);
