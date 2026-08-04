const fs = require('fs');
let content = fs.readFileSync('src/components/CustomerModule.tsx', 'utf8');

const regexCell = /<td className="py-2 px-4">\s*<div className="flex flex-col">\s*<div className="flex items-center gap-2">/;

const newCell = `<td className="py-2 px-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => handleOpenEditModal(cust)}>
                        <div className="flex items-center gap-3">
                          {cust.image_url ? (
                            <img src={cust.image_url} alt={cust.name} className="w-8 h-8 rounded-full object-cover shrink-0 border border-slate-200" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700 text-slate-500">
                              <Users size={14} />
                            </div>
                          )}
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">`;

content = content.replace(regexCell, newCell);
fs.writeFileSync('src/components/CustomerModule.tsx', content);
