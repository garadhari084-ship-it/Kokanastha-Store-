const fs = require('fs');
let content = fs.readFileSync('src/components/DeliveryModule.tsx', 'utf8');

const target1 = `            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-8 text-center">
                  <div className="flex flex-col items-center justify-center text-slate-500 dark:text-slate-400">
                    <Package size={24} className="mb-2 opacity-50" />
                    <p className="font-bold text-xs">No active deliveries found for filter "{activeFilter}".</p>
                    <p className="text-[10px]">Packed orders from the Packing station will appear under Ready to Dispatch.</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredOrders.map((o) => {`.replace(/\r\n/g, '\n');

const rep1 = `            {groupedOrders.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-8 text-center">
                  <div className="flex flex-col items-center justify-center text-slate-500 dark:text-slate-400">
                    <Package size={24} className="mb-2 opacity-50" />
                    <p className="font-bold text-xs">No active deliveries found for filter "{activeFilter}".</p>
                    <p className="text-[10px]">Packed orders from the Packing station will appear under Ready to Dispatch.</p>
                  </div>
                </td>
              </tr>
            ) : (
              groupedOrders.map(([date, dateOrders]) => (
                <React.Fragment key={date}>
                  <tr className="bg-slate-100 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-700/50">
                    <td colSpan={9} className="py-2.5 px-4 font-bold text-slate-700 dark:text-slate-300 text-xs">
                      {getRelativeDateLabel(date)}
                      <span className="ml-2 text-[10px] font-medium bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 py-0.5 px-2 rounded-full border border-slate-200 dark:border-slate-700">
                        {dateOrders.length} order{dateOrders.length > 1 ? 's' : ''}
                      </span>
                    </td>
                  </tr>
                  {dateOrders.map((o) => {`.replace(/\r\n/g, '\n');

const target2 = `                );
              })
            )}
          </tbody>`;
const rep2 = `                );
              })}
              </React.Fragment>
            )))}
          </tbody>`;

let newContent = content.replace(target1, rep1).replace(target2, rep2);
fs.writeFileSync('src/components/DeliveryModule.tsx', newContent);
console.log('Fixed delivery');
