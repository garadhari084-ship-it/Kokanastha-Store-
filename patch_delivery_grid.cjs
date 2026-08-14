const fs = require('fs');
const file = 'src/components/DeliveryModule.tsx';
let content = fs.readFileSync(file, 'utf8');

const searchStr = `      {/* Compact List View */}
      <div className="bg-white dark:bg-slate-900 overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm mt-3">`;

const replaceStr = `      {viewMode === 'grid' ? (
        <div className="mt-4 space-y-8">
          {groupedOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 py-12 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 border-dashed">
              <Package size={32} className="mb-3 opacity-30" />
              <p className="font-bold text-sm">No active deliveries found for filter "{activeFilter}".</p>
              <p className="text-xs mt-1">Packed orders from the Packing station will appear under Ready to Dispatch.</p>
            </div>
          ) : (
            groupedOrders.map(([date, dateOrders]) => (
              <div key={date} className="space-y-3">
                <div className="flex items-center gap-3">
                  <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest">{getRelativeDateLabel(date)}</h3>
                  <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800"></div>
                  <span className="text-[10px] font-black bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 py-1 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700">
                    {dateOrders.length} ORDER{dateOrders.length > 1 ? 'S' : ''}
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {dateOrders.map((o) => {
                    const cust = customers.find(c => c.id === o.customer_id);
                    const isCOD = o.payment_status !== 'Paid';
                    const todayStart = new Date();
                    todayStart.setHours(0, 0, 0, 0);
                    const isOverdue = o.delivery_date && new Date(o.delivery_date) < todayStart && o.status !== 'Delivered' && o.status !== 'Returned';
                    
                    return (
                      <div key={o.id} className={\`bg-white dark:bg-slate-900 rounded-2xl border \${isOverdue ? 'border-rose-300 dark:border-rose-900 shadow-rose-500/10' : 'border-slate-200 dark:border-slate-800'} shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow\`}>
                        {/* Header */}
                        <div className={\`px-4 py-3 border-b \${isOverdue ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-100 dark:border-rose-900/50' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800'} flex items-center justify-between\`}>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">{o.order_number}</span>
                            {isOverdue && (
                              <span className="text-[9px] font-black text-rose-700 dark:text-rose-400 bg-rose-200/50 dark:bg-rose-900/50 px-1.5 py-0.5 rounded flex items-center gap-1">
                                <AlertTriangle size={10} /> OVERDUE
                              </span>
                            )}
                          </div>
                          <span className={\`text-[10px] font-extrabold px-2 py-0.5 rounded-lg border uppercase tracking-wider \${
                            o.status === 'Dispatched' ? 'bg-blue-100 border-blue-200 text-blue-700' :
                            o.status === 'Delivered' ? 'bg-emerald-100 border-emerald-200 text-emerald-700' :
                            o.status === 'Packed' ? 'bg-yellow-100 border-yellow-200 text-yellow-700' :
                            o.status === 'Returned' ? 'bg-rose-100 border-rose-200 text-rose-700' :
                            'bg-slate-100 border-slate-200 text-slate-700'
                          }\`}>
                            {o.status}
                          </span>
                        </div>
                        
                        {/* Body */}
                        <div className="p-4 space-y-4 flex-1">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate pr-2 max-w-[180px]">
                                {cust?.name || 'Walk-in Customer'}
                              </p>
                              <div className="flex items-center gap-1 text-[10px] text-slate-500 mt-1">
                                <MapPin size={10} className="text-emerald-500" />
                                <span className="font-medium truncate max-w-[150px]">{o.area || 'Unknown Zone'}</span>
                              </div>
                            </div>
                            <button onClick={() => openDetailModal(o)} className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-indigo-500 transition-colors" title="View Details">
                              <Eye size={16} />
                            </button>
                          </div>
                          
                          {/* Storage Info */}
                          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 border border-slate-100 dark:border-slate-700/50 grid grid-cols-2 gap-2">
                            <div>
                              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Location</span>
                              <span className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                                <LayoutGrid size={12} className="text-emerald-500" />
                                {o.rack_location || '-'}
                              </span>
                            </div>
                            <div>
                              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Packages</span>
                              <span className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                                <Package size={12} className="text-indigo-500" />
                                {o.total_bags || 1} Bag{o.total_bags !== 1 ? 's' : ''}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Footer */}
                        <div className="px-4 py-3 bg-slate-50/50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800/50 space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-lg font-black text-slate-900 dark:text-white tracking-tight">₹{o.total_amount.toLocaleString()}</span>
                            <span className={\`text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider \${isCOD ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'}\`}>
                              {isCOD ? 'COD PENDING' : 'PREPAID'}
                            </span>
                          </div>
                          
                          <div className="flex gap-2">
                            <button
                              onClick={() => handlePrintNote(o)}
                              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-[10px] font-bold transition-colors"
                            >
                              <Printer size={12} /> Print
                            </button>
                            
                            {o.status === 'Packed' && (
                              <button
                                onClick={() => handleModalAction(o)}
                                className="flex-[2] flex items-center justify-center gap-1.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-bold transition-colors shadow-sm"
                              >
                                <Truck size={12} /> Dispatch
                              </button>
                            )}
                            
                            {o.status === 'Dispatched' && (
                              <button
                                onClick={() => handleModalAction(o)}
                                className="flex-[2] flex items-center justify-center gap-1.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold transition-colors shadow-sm"
                              >
                                <CheckCircle2 size={12} /> Mark Delivered
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
      {/* Compact List View */}
      <div className="bg-white dark:bg-slate-900 overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm mt-3">`;

content = content.replace(searchStr, replaceStr);
fs.writeFileSync(file, content);
