const fs = require('fs');
let content = fs.readFileSync('src/components/DeliveryModule.tsx', 'utf8');

const target2 = `                          <button 
                            onClick={() => handleUpdateStatus(o, 'Delivered')}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-black text-[10px] transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                          >
                            <CheckCircle2 size={12} /> Deliver
                          </button>
                          
                          {/* Quick Pipeline Status Updater (Moved from Sales Module) */}
                          <select
                            value={o.status}
                            onChange={(e) => handleUpdateStatus(o, e.target.value as any)}
                            className="text-[10px] font-bold py-1 px-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg cursor-pointer focus:outline-none focus:ring-1 focus:ring-amber-500"
                            title="Quick Update Pipeline Status"
                          >
                            <option value="Pending">Pending</option>
                            <option value="Packing">Packing</option>
                            <option value="Packed">Ready</option>
                            <option value="Dispatched">Out for Delivery</option>
                            <option value="Delivered">Completed</option>
                            <option value="Returned">Returned</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                        </div>
                      )}
                      
                      {o.status === 'Delivered' && (`;

const rep2 = `                          <button 
                            onClick={() => handleUpdateStatus(o, 'Delivered')}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-black text-[10px] transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                          >
                            <CheckCircle2 size={12} /> Deliver
                          </button>
                        </div>
                      )}
                      
                      {o.status === 'Delivered' && (`;

content = content.replace(target2, rep2);

const target3 = `                      {o.status === 'Packed' && (
                        <button 
                          onClick={() => {
                            setDispatchingOrder(o);`;

const rep3 = `                      {/* Quick Pipeline Status Updater (Moved from Sales Module) */}
                      <select
                        value={o.status}
                        onChange={(e) => handleUpdateStatus(o, e.target.value as any)}
                        className="text-[10px] font-bold py-1 px-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg cursor-pointer focus:outline-none focus:ring-1 focus:ring-amber-500"
                        title="Quick Update Pipeline Status"
                      >
                        <option value="Pending">Pending</option>
                        <option value="Packing">Packing</option>
                        <option value="Packed">Ready</option>
                        <option value="Dispatched">Out for Delivery</option>
                        <option value="Delivered">Completed</option>
                        <option value="Returned">Returned</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>

                      {o.status === 'Packed' && (
                        <button 
                          onClick={() => {
                            setDispatchingOrder(o);`;

content = content.replace(target3, rep3);

fs.writeFileSync('src/components/DeliveryModule.tsx', content);
console.log('Fixed quick updater');
