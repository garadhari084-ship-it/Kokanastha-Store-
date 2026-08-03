const fs = require('fs');
let content = fs.readFileSync('src/components/PurchaseModule.tsx', 'utf8');

// Add states
content = content.replace(
  "const [items, setItems] = useState<PurchaseItem[]>([]);",
  "const [items, setItems] = useState<PurchaseItem[]>([]);\n  const [isScanning, setIsScanning] = useState(false);\n  const fileInputRef = React.useRef<HTMLInputElement>(null);"
);

// Add the scan handler
const scanHandler = `
  const handleScanInvoice = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      triggerToast('Please upload an image file.', 'error');
      return;
    }

    setIsScanning(true);
    triggerToast('Scanning invoice, please wait...', 'info');

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        try {
          const res = await fetch('/api/scan-invoice', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageBase64: base64String })
          });

          if (!res.ok) {
            throw new Error('Failed to scan invoice');
          }

          const data = await res.json();
          
          if (data.supplierName) {
            // Find or create supplier
            let supplier = suppliers.find(s => s.name.toLowerCase() === data.supplierName.toLowerCase() || (data.supplierPhone && s.phone === data.supplierPhone));
            if (!supplier) {
                const newSupplierId = crypto.randomUUID();
                const newSupplier = {
                    id: newSupplierId,
                    name: data.supplierName,
                    phone: data.supplierPhone || '',
                    address: '',
                    gstin: data.supplierGstin || '',
                    business_id: businessId,
                    created_at: new Date().toISOString()
                };
                dbStore.createSupplier(newSupplier);
                supplier = newSupplier;
            }
            setSelectedSupplierId(supplier.id);
          }

          if (data.items && data.items.length > 0) {
              const newItems = [];
              for (const it of data.items) {
                  let prod = products.find(p => p.name.toLowerCase() === it.name.toLowerCase());
                  if (!prod) {
                      // create product
                      const newProd = {
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
                      };
                      dbStore.createProduct(newProd);
                      prod = newProd;
                  }
                  newItems.push({
                      product_id: prod.id,
                      qty: it.qty || 1,
                      received_qty: 0,
                      purchase_price: it.price || prod.purchase_price,
                      gst_rate: it.gst_rate || prod.gst_rate
                  });
              }
              setItems(newItems);
          }
          
          triggerToast('Invoice scanned and mapped successfully!', 'success');
        } catch(err: any) {
            triggerToast(err.message || 'Error processing invoice', 'error');
        } finally {
            setIsScanning(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      triggerToast(err.message || 'Error reading image', 'error');
      setIsScanning(false);
    }
  };
`;

content = content.replace(
  "const handleOpenAddModal = () => {",
  scanHandler + "\n  const handleOpenAddModal = () => {"
);

// Modify the modal header to add the scan button
const modalHeader = `<h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <PlusCircle size={16} className="text-indigo-600" />
                Draft New Purchase Order
              </h2>`;

const modalHeaderReplacement = `<div className="flex items-center gap-4">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <PlusCircle size={16} className="text-indigo-600" />
                  Draft New Purchase Order
                </h2>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    ref={fileInputRef}
                    onChange={handleScanInvoice}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isScanning}
                    className="px-3 py-1.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-lg text-xs font-bold hover:bg-emerald-200 flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-colors"
                  >
                    {isScanning ? 'Scanning...' : 'Scan Invoice'}
                  </button>
                </div>
              </div>`;

content = content.replace(modalHeader, modalHeaderReplacement);

fs.writeFileSync('src/components/PurchaseModule.tsx', content);
