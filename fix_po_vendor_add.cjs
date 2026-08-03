const fs = require('fs');
let content = fs.readFileSync('src/components/PurchaseModule.tsx', 'utf8');

const tfootAddStr = `
                    </tfoot>
                  </table>
                </div>
              )}
`;
const vendorAddStr = `
                    </tfoot>
                  </table>
                </div>
              )}
              
              {items.length > 0 && selectedSupplierId && (
                  <div className="mt-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm">
                    <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Party / Vendor Details (As Per Invoice)</h3>
                    <div className="text-xs text-slate-700 dark:text-slate-300 grid grid-cols-2 gap-2">
                      <p><span className="font-semibold">Name:</span> {suppliers.find(s => s.id === selectedSupplierId)?.name || 'Unknown'}</p>
                      <p><span className="font-semibold">Phone:</span> {suppliers.find(s => s.id === selectedSupplierId)?.phone || 'N/A'}</p>
                      <p><span className="font-semibold">GSTIN:</span> {suppliers.find(s => s.id === selectedSupplierId)?.gstin || 'N/A'}</p>
                      <p className="col-span-2"><span className="font-semibold">Address:</span> {suppliers.find(s => s.id === selectedSupplierId)?.address || 'N/A'}</p>
                    </div>
                  </div>
              )}
`;

content = content.replace(tfootAddStr, vendorAddStr);

fs.writeFileSync('src/components/PurchaseModule.tsx', content);
