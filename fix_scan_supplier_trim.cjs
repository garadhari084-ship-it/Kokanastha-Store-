const fs = require('fs');
let content = fs.readFileSync('src/components/PurchaseModule.tsx', 'utf8');

const supOld = `            let supplier = suppliers.find(s => s.name.toLowerCase() === data.supplierName.toLowerCase() || (data.supplierPhone && s.phone === data.supplierPhone));`;
const supNew = `            const sName = (data.supplierName || '').toLowerCase().trim();
            const sPhone = (data.supplierPhone || '').trim();
            let supplier = suppliers.find(s => s.name.toLowerCase().trim() === sName || (sPhone && s.phone === sPhone));`;
content = content.replace(supOld, supNew);

const newSupOld = `                const newSupplier: any = {
                    name: data.supplierName,
                    phone: data.supplierPhone || '',`;
const newSupNew = `                const newSupplier: any = {
                    name: (data.supplierName || '').trim() || 'Scanned Supplier',
                    phone: sPhone,`;
content = content.replace(newSupOld, newSupNew);

fs.writeFileSync('src/components/PurchaseModule.tsx', content);
