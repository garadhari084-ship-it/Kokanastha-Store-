const fs = require('fs');
let content = fs.readFileSync('src/components/PurchaseModule.tsx', 'utf8');

const tfootStr = `
                      </tbody>
                      <tfoot className="bg-slate-100 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700">
                        <tr>
                          <td className="py-2.5 px-4 font-bold text-slate-600 dark:text-slate-400">Total</td>
                          <td className="py-2.5 px-4 text-right font-black text-slate-900 dark:text-white">
                            {viewingOrder.items.reduce((sum, item) => sum + item.qty, 0)}
                          </td>
                          <td colSpan={2}></td>
                          <td className="py-2.5 px-4 text-right font-bold text-indigo-600 dark:text-indigo-400">
                            ₹{viewingOrder.total_amount.toLocaleString(undefined, {minimumFractionDigits:2})}
                          </td>
                        </tr>
                      </tfoot>
`;
content = content.replace("                      </tbody>", tfootStr);

// Let's add Total Quantity to the Add New PO modal too.
const tfootAddStr = `
                    <tfoot className="bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700">
                      <tr>
                        <td className="py-3 px-4 font-bold text-slate-600 dark:text-slate-400 uppercase text-[10px] tracking-wider">
                          Total Quantity:
                        </td>
                        <td className="py-3 px-2 text-right font-black text-slate-900 dark:text-white">
                          {items.reduce((sum, i) => sum + i.qty, 0)}
                        </td>
                        <td colSpan={1} className="py-3 px-4 text-right font-bold text-slate-600 dark:text-slate-400 uppercase text-[10px] tracking-wider">
                          Gross PO Value:
                        </td>
                        <td colSpan={2} className="py-3 px-4 text-right font-black text-sm text-slate-900 dark:text-white">
                          ₹{items.reduce((sum, i) => sum + (i.qty * i.purchase_price) * (1 + i.gst_rate/100), 0).toLocaleString(undefined, {minimumFractionDigits: 2})}
                        </td>
                        <td></td>
                      </tr>
`;
const oldTfootAdd = `                    <tfoot className="bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700">
                      <tr>
                        <td colSpan={4} className="py-3 px-4 text-right font-bold text-slate-600 dark:text-slate-400 uppercase text-[10px] tracking-wider">
                          Gross PO Value:
                        </td>
                        <td className="py-3 px-4 text-right font-black text-sm text-slate-900 dark:text-white">
                          ₹{items.reduce((sum, i) => sum + (i.qty * i.purchase_price) * (1 + i.gst_rate/100), 0).toLocaleString(undefined, {minimumFractionDigits: 2})}
                        </td>
                        <td></td>
                      </tr>`;
content = content.replace(oldTfootAdd, tfootAddStr);

fs.writeFileSync('src/components/PurchaseModule.tsx', content);
