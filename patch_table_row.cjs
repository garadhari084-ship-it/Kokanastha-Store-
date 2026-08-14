const fs = require('fs');
const file = 'src/components/DeliveryModule.tsx';
let content = fs.readFileSync(file, 'utf8');

const searchStr = `<td className="py-2.5 px-3 font-bold text-slate-700 dark:text-slate-300">
                      {o.area || 'Unknown'}
                    </td>`;
const replaceStr = `${searchStr}
                    <td className="py-2.5 px-3">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200 uppercase">
                          {o.rack_location ? o.rack_location : '-'}
                        </span>
                        {o.rack_section && <span className="text-[9px] text-slate-500">Sec: {o.rack_section}</span>}
                        {o.total_bags ? <span className="text-[9px] text-indigo-500 font-bold">{o.total_bags} Bags</span> : null}
                      </div>
                    </td>`;

content = content.replace(searchStr, replaceStr);
fs.writeFileSync(file, content);
