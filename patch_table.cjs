const fs = require('fs');
const file = 'src/components/DeliveryModule.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /<th className="py-2.5 px-3">Area Zone<\/th>/,
  `<th className="py-2.5 px-3">Area Zone</th>\n              <th className="py-2.5 px-3">Storage Rack</th>`
);

content = content.replace(
  /<td className="py-2.5 px-3 text-xs text-slate-600 dark:text-slate-300">[\s\n]*<div className="flex items-center gap-1.5 font-bold">[\s\n]*<MapPin size=\{12\} className="text-slate-400" \/>[\s\n]*\{o.area \|\| '-\'\}[\s\n]*<\/div>[\s\n]*<\/td>/m,
  `$&
                    <td className="py-2.5 px-3">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200 uppercase">
                          {o.rack_location ? o.rack_location : '-'}
                        </span>
                        {o.rack_section && <span className="text-[9px] text-slate-500">Sec: {o.rack_section}</span>}
                        {o.total_bags ? <span className="text-[9px] text-indigo-500 font-bold">{o.total_bags} Bags</span> : null}
                      </div>
                    </td>`
);

fs.writeFileSync(file, content);
