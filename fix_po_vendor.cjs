const fs = require('fs');
let content = fs.readFileSync('src/components/PurchaseModule.tsx', 'utf8');

const tfootStr = `
                      </tfoot>
                    </table>
                  </div>
                </div>
`;
const vendorDetailsStr = `
                      </tfoot>
                    </table>
                  </div>
                  
                  {/* Vendor Details as per invoice */}
                  <div className="mt-6 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Party / Vendor Details</h3>
                    <div className="text-xs text-slate-700 dark:text-slate-300 space-y-1">
                      <p><span className="font-semibold">Name:</span> {suppliers.find(s => s.id === viewingOrder.supplier_id)?.name || 'Unknown'}</p>
                      <p><span className="font-semibold">Phone:</span> {suppliers.find(s => s.id === viewingOrder.supplier_id)?.phone || 'N/A'}</p>
                      <p><span className="font-semibold">GSTIN:</span> {suppliers.find(s => s.id === viewingOrder.supplier_id)?.gstin || 'N/A'}</p>
                      {suppliers.find(s => s.id === viewingOrder.supplier_id)?.address && (
                        <p><span className="font-semibold">Address:</span> {suppliers.find(s => s.id === viewingOrder.supplier_id)?.address}</p>
                      )}
                    </div>
                  </div>
                </div>
`;

content = content.replace(tfootStr, vendorDetailsStr);

fs.writeFileSync('src/components/PurchaseModule.tsx', content);
