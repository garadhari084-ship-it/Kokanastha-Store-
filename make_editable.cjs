const fs = require('fs');
let content = fs.readFileSync('src/components/PurchaseModule.tsx', 'utf8');

const oldGstCell = `<td className="py-2.5 px-4 text-right text-slate-500 text-[10px]">{item.gst_rate}%</td>`;
const newGstCell = `<td className="py-2.5 px-2 text-right">
                              <input 
                                type="number" 
                                min="0" 
                                value={item.gst_rate} 
                                onChange={(e) => {
                                  const newItems = [...items];
                                  newItems[idx].gst_rate = parseFloat(e.target.value) || 0;
                                  setItems(newItems);
                                }}
                                className="w-16 px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded text-xs text-right inline-block"
                              /> %
                            </td>`;

const oldPriceCell = `<td className="py-2.5 px-4 text-right">₹{item.purchase_price.toLocaleString()}</td>`;
const newPriceCell = `<td className="py-2.5 px-2 text-right flex items-center justify-end gap-1">
                              ₹ <input 
                                type="number" 
                                min="0" 
                                value={item.purchase_price} 
                                onChange={(e) => {
                                  const newItems = [...items];
                                  newItems[idx].purchase_price = parseFloat(e.target.value) || 0;
                                  setItems(newItems);
                                }}
                                className="w-20 px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded text-xs text-right"
                              />
                            </td>`;
                            
const oldQtyCell = `<td className="py-2.5 px-4 text-right font-bold">{item.qty}</td>`;
const newQtyCell = `<td className="py-2.5 px-2 text-right font-bold">
                              <input 
                                type="number" 
                                min="1" 
                                value={item.qty} 
                                onChange={(e) => {
                                  const newItems = [...items];
                                  newItems[idx].qty = parseFloat(e.target.value) || 0;
                                  setItems(newItems);
                                }}
                                className="w-20 px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded text-xs text-right font-bold inline-block"
                              />
                            </td>`;                            

content = content.replace(oldGstCell, newGstCell);
content = content.replace(oldPriceCell, newPriceCell);
content = content.replace(oldQtyCell, newQtyCell);

fs.writeFileSync('src/components/PurchaseModule.tsx', content);
