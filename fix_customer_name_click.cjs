const fs = require('fs');
let content = fs.readFileSync('src/components/CustomerModule.tsx', 'utf8');

const regexNameCell = /<td className="px-4 py-3 whitespace-nowrap">\s*<div className="flex items-center gap-3">\s*<div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700 text-slate-500">\s*<Users size={14} \/>\s*<\/div>\s*<div>\s*<div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">([\s\S]*?)<\/div>/;

const match = content.match(regexNameCell);
if (match) {
  const newCell = `<td className="px-4 py-3 whitespace-nowrap cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors" onClick={() => handleOpenEditModal(cust)}>
                          <div className="flex items-center gap-3">
                            {cust.image_url ? (
                                <img src={cust.image_url} alt={cust.name} className="w-8 h-8 rounded-full object-cover shrink-0 border border-slate-200" />
                            ) : (
                                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700 text-slate-500">
                                  <Users size={14} />
                                </div>
                            )}
                            <div>
                              <div className="font-bold text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300 flex items-center gap-2">` + match[1] + `</div>`;
  content = content.replace(match[0], newCell);
  fs.writeFileSync('src/components/CustomerModule.tsx', content);
}
