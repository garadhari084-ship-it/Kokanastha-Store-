const fs = require('fs');
const file = 'src/components/DeliveryModule.tsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /\{detailOrder && \([\s\S]*?\}\)[\s\n]*\<\/div\>[\s\n]*\<\/div\>[\s\n]*\)/m;

const newModal = `{detailOrder && (
        <div className="fixed inset-0 z-[100] bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-lg shadow-xl border border-slate-200 dark:border-slate-800 animate-in zoom-in duration-200 flex flex-col overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/80 relative">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Package size={20} className="text-indigo-500" /> Order Details
                </h3>
                <p className="text-[11px] text-slate-500 font-bold mt-0.5 uppercase tracking-wider flex items-center gap-2">
                  <span>{detailOrder.order_number}</span>
                  {detailOrder.delivery_date && new Date(detailOrder.delivery_date) < new Date(new Date().setHours(0,0,0,0)) && detailOrder.status !== 'Delivered' && (
                    <span className="inline-flex items-center gap-1 text-rose-700 bg-rose-100 dark:bg-rose-900/30 px-1.5 py-0.5 rounded text-[9px]">
                      <AlertTriangle size={10} /> OVERDUE
                    </span>
                  )}
                </p>
              </div>
              <button onClick={() => setDetailOrder(null)} className="cursor-pointer text-slate-400 hover:text-slate-600 bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 p-2 rounded-full transition-all hover:scale-105 active:scale-95">
                <X size={16} />
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto max-h-[70vh] bg-slate-50/30 dark:bg-slate-900/50 space-y-4">
              {/* Storage Section */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm relative overflow-hidden">
                <div className="flex justify-between items-start mb-3">
                  <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                    <MapPin size={14} className="text-emerald-500" /> Dispatch Storage & Rack
                  </h4>
                  {!isEditingStorage ? (
                    <button onClick={() => setIsEditingStorage(true)} className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded-md">
                      Edit Location
                    </button>
                  ) : null}
                </div>
                
                {isEditingStorage ? (
                  <div className="space-y-3 animate-in fade-in zoom-in-95 duration-200">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Rack Location</label>
                        <input type="text" value={editRackLocation} onChange={e => setEditRackLocation(e.target.value)} placeholder="e.g. Rack A1" className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:ring-1 focus:ring-indigo-500 outline-none" />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Section / Shelf</label>
                        <input type="text" value={editRackSection} onChange={e => setEditRackSection(e.target.value)} placeholder="e.g. Shelf 2" className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:ring-1 focus:ring-indigo-500 outline-none" />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Total Bags / Boxes</label>
                        <input type="number" min="1" value={editTotalBags} onChange={e => setEditTotalBags(parseInt(e.target.value)||1)} className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:ring-1 focus:ring-indigo-500 outline-none" />
                      </div>
                    </div>
                    <div className="flex gap-2 justify-end pt-2">
                      <button onClick={() => setIsEditingStorage(false)} className="px-3 py-1.5 text-[10px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer">Cancel</button>
                      <button onClick={saveStorageInfo} className="px-3 py-1.5 text-[10px] font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-md cursor-pointer">Save Storage Info</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-4 mt-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                        <LayoutGrid size={14} />
                      </div>
                      <div>
                        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Location</div>
                        <div className="text-xs font-black text-slate-800 dark:text-slate-200">{detailOrder.rack_location || '-'}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                        <Navigation size={14} />
                      </div>
                      <div>
                        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Section</div>
                        <div className="text-xs font-black text-slate-800 dark:text-slate-200">{detailOrder.rack_section || '-'}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
                        <Package size={14} />
                      </div>
                      <div>
                        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Packages</div>
                        <div className="text-xs font-black text-slate-800 dark:text-slate-200">{detailOrder.total_bags || 1} Bags</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Items Table */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 text-[9px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-100 dark:border-slate-700">
                    <tr>
                      <th className="px-4 py-2.5">Item</th>
                      <th className="px-4 py-2.5 text-right">Qty</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs">
                    {(detailOrder.items || []).map((item, idx) => (
                      <tr key={idx} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="px-4 py-3 font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                           <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                          {dbStore.getProducts(businessId).find(p => p.id === item.product_id)?.name || 'Unknown'}
                        </td>
                        <td className="px-4 py-3 text-right font-black text-indigo-600 dark:text-indigo-400">
                          {item.qty}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setDetailOrder(null)}
                className="cursor-pointer py-2.5 px-8 bg-slate-900 dark:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}`;

content = content.replace(regex, newModal);
fs.writeFileSync(file, content);
