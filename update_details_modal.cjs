const fs = require('fs');
let content = fs.readFileSync('src/components/DeliveryModule.tsx', 'utf-8');

const oldModalRegex = /\{\/\* Order Details Modal \*\/\}(.|\n)*?\n      \}/;
const newModal = `{/* Order Details Modal */}
      {detailOrder && (
        <div className="fixed inset-0 z-[100] bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-xl shadow-xl border border-slate-200 dark:border-slate-800 animate-in zoom-in duration-200 flex flex-col overflow-hidden max-h-[90vh]">
            <div className="flex justify-between items-center p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
              <div>
                <h3 className="font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Package size={16} className="text-indigo-500" /> Invoice Details
                </h3>
                <p className="text-[10px] text-slate-500 font-bold mt-0.5 uppercase tracking-wider">
                  {detailOrder.order_number}
                </p>
              </div>
              <button onClick={() => setDetailOrder(null)} className="cursor-pointer text-slate-400 hover:text-slate-600 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-full transition-colors">
                <X size={16} />
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto custom-scrollbar flex-1 space-y-4">
              {/* Top Meta */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Date</span>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{detailOrder.order_date || (new Date(detailOrder.created_at).toLocaleDateString())}</span>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Customer</span>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate block" title={detailOrder.customer_name || 'Walk-in'}>
                    {detailOrder.customer_name || 'Walk-in'}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Status</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 inline-block">
                    {detailOrder.status}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Payment</span>
                  <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                    ₹{(detailOrder.total_amount || 0).toLocaleString()}
                  </span>
                  <span className={\`text-[8px] font-bold px-1.5 py-0.5 rounded ml-1 \${detailOrder.payment_status === 'Paid' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'}\`}>
                    {detailOrder.payment_status}
                  </span>
                </div>
              </div>

              {/* Edit Store Location Form */}
              <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                <div className="bg-slate-100 dark:bg-slate-800 px-3 py-2 flex items-center justify-between">
                  <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                    <LayoutGrid size={13} className="text-amber-500" />
                    Store Location (Rack)
                  </h4>
                  {!isEditingStorage ? (
                    <button onClick={() => setIsEditingStorage(true)} className="text-[10px] font-bold bg-white dark:bg-slate-900 px-2 py-1 rounded shadow-2xs border border-slate-200 dark:border-slate-700 text-indigo-600 dark:text-indigo-400 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800">
                      Edit/Update
                    </button>
                  ) : (
                    <button onClick={saveStorageInfo} className="text-[10px] font-bold bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1 rounded shadow-2xs cursor-pointer">
                      Save Location
                    </button>
                  )}
                </div>
                
                {isEditingStorage ? (
                  <div className="p-3 bg-white dark:bg-slate-900 grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Rack Location</label>
                      <input 
                        type="text" 
                        value={editRackLocation} 
                        onChange={e => setEditRackLocation(e.target.value)} 
                        className="w-full text-xs p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                        placeholder="e.g. Rack A"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Section/Shelf</label>
                      <input 
                        type="text" 
                        value={editRackSection} 
                        onChange={e => setEditRackSection(e.target.value)} 
                        className="w-full text-xs p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                        placeholder="e.g. Shelf 2"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Total Bags</label>
                      <input 
                        type="number" 
                        value={editTotalBags} 
                        onChange={e => setEditTotalBags(Number(e.target.value))} 
                        className="w-full text-xs p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                        min="1"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-white dark:bg-slate-900 flex flex-wrap items-center gap-4 text-xs font-bold text-slate-700 dark:text-slate-300">
                    <div>Rack: <span className="text-slate-900 dark:text-white font-black">{detailOrder.rack_location || '-'}</span></div>
                    <div>Section: <span className="text-slate-900 dark:text-white font-black">{detailOrder.rack_section || '-'}</span></div>
                    <div>Bags: <span className="text-slate-900 dark:text-white font-black text-indigo-600 dark:text-indigo-400">{detailOrder.total_bags || 1}</span></div>
                  </div>
                )}
              </div>

              {/* Items List */}
              <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 text-[10px] font-black uppercase tracking-widest text-slate-500">
                    <tr>
                      <th className="px-3 py-2 border-b border-slate-100 dark:border-slate-700">Item</th>
                      <th className="px-3 py-2 border-b border-slate-100 dark:border-slate-700 text-right">Qty</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs">
                    {(detailOrder.items || []).map((item, idx) => (
                      <tr key={idx} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="px-3 py-2.5 font-bold text-slate-800 dark:text-slate-200">
                          {dbStore.getProducts(businessId).find(p => p.id === item.product_id)?.name || 'Unknown'}
                        </td>
                        <td className="px-3 py-2.5 text-right font-black text-indigo-600 dark:text-indigo-400">
                          {item.qty}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setDetailOrder(null)}
                className="cursor-pointer py-2 px-6 bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 dark:hover:bg-slate-600 text-white rounded-xl text-xs font-bold transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      }`;

content = content.replace(oldModalRegex, newModal);
fs.writeFileSync('src/components/DeliveryModule.tsx', content);
