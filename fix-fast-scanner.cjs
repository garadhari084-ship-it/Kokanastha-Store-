const fs = require('fs');
let content = fs.readFileSync('src/components/SalesModule.tsx', 'utf8');

// Add barcodeInput state right after rowProductId state
if (!content.includes('const [barcodeInput, setBarcodeInput] = useState(')) {
  content = content.replace(
    /const \[rowProductId, setRowProductId\] = useState\(''\);/,
    `const [rowProductId, setRowProductId] = useState('');\n  const [barcodeInput, setBarcodeInput] = useState('');`
  );
}

// Add the Fast Barcode Scanner input above the Product SKU dropdown
const fastScanUI = `<div className="md:col-span-12 flex items-end mb-2">
                    <div className="w-full">
                      <label className="text-[11px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1 mb-1">
                        <ScanLine size={14} /> Fast Barcode Scan
                      </label>
                      <input 
                        type="text" 
                        placeholder="Scan or type barcode here and press Enter..."
                        value={barcodeInput}
                        onChange={(e) => setBarcodeInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const code = barcodeInput.trim();
                            if (!code) return;
                            
                            // Find product by SKU or exact name match
                            const p = products.find(prod => prod.sku.toLowerCase() === code.toLowerCase() || prod.name.toLowerCase() === code.toLowerCase() || prod.id === code);
                            
                            if (p) {
                              const selCust = customers.find(c => c.id === selectedCustomerId);
                              const evalRes = calculateApplicablePrice(p, {
                                isLoyalMember: isLoyalMember(selCust),
                                isAdvanceBooking,
                                isDiwaliSale: isFestiveBooking,
                                business: currentBiz,
                                orderDate
                              });
                              
                              const defaultTax = (defaultTenantTax === 0 || p.gst_rate === 18 || typeof p.gst_rate !== 'number' || isNaN(p.gst_rate))
                                ? defaultTenantTax
                                : p.gst_rate;
                                
                              const existingItem = orderItems.find(it => it.product_id === p.id);
                              
                              if (existingItem) {
                                 const updatedItems = orderItems.map(it => 
                                   it.product_id === p.id 
                                     ? { ...it, qty: it.qty + 1 }
                                     : it
                                 );
                                 setOrderItems(updatedItems);
                                 triggerToast('Item quantity updated.', 'success');
                              } else {
                                 const newItem = {
                                   product_id: p.id,
                                   qty: 1,
                                   scanned_qty: 0,
                                   selling_price: evalRes.appliedPrice,
                                   gst_rate: defaultTax,
                                   normal_rate: evalRes.normalRate,
                                   rate_type: evalRes.rateType,
                                   rate_reason: evalRes.rateReason,
                                   unit_savings: Math.max(0, evalRes.normalRate - evalRes.appliedPrice),
                                   is_overridden: false
                                 };
                                 setOrderItems([...orderItems, newItem]);
                                 triggerToast('Added: ' + p.name, 'success');
                              }
                              setBarcodeInput('');
                            } else {
                              triggerToast('Product not found for barcode: ' + code, 'error');
                              setBarcodeInput('');
                            }
                          }
                        }}
                        autoFocus
                        className="w-full px-4 py-2.5 bg-indigo-50/50 dark:bg-indigo-950/20 border-2 border-indigo-200 dark:border-indigo-800 rounded-xl text-sm font-black focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 text-slate-900 dark:text-slate-100 placeholder:text-indigo-300 dark:placeholder:text-indigo-700/50 transition-all"
                      />
                    </div>
                  </div>
                  
                  <div className="md:col-span-4">`;

content = content.replace(/<div className="md:col-span-4">\s*<label className="text-\[11px\] font-black text-slate-900/g, fastScanUI + '\n                    <label className="text-[11px] font-black text-slate-900');

// Ensure ScanLine is imported
if (!content.includes('ScanLine')) {
  content = content.replace(/import {([^}]+)} from 'lucide-react';/, "import { $1, ScanLine } from 'lucide-react';");
}

fs.writeFileSync('src/components/SalesModule.tsx', content);
console.log('Success fast scan UI');
