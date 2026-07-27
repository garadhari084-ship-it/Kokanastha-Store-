const fs = require('fs');
let code = fs.readFileSync('/tmp/pack_bck.tsx', 'utf-8');

const importReplacement = `import { PageHeader } from './PageHeader';
import { 
  QrCode, 
  Scan, 
  Check, 
  X, 
  AlertCircle, 
  Printer, 
  ArrowLeft, 
  ArrowRight,
  Sparkles,
  ClipboardCheck,
  RotateCcw,
  Volume2,
  Camera,
  Truck,
  User,
  Phone,
  FileText,
  CheckCircle2,
  PackageCheck,
  Search,
  Clock,
  MapPin,
  Building2,
  Navigation,
  LayoutGrid,
  List
} from 'lucide-react';
import { BarcodeScanner } from './BarcodeScanner';`;

code = code.replace(/import \{ PageHeader \} from '\.\/PageHeader';\s*import \{[\s\S]*?\} from 'lucide-react';\s*import \{ BarcodeScanner \} from '\.\/BarcodeScanner';/, importReplacement);

const stateReplacement = `const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');`;

code = code.replace(/const \[searchQuery, setSearchQuery\] = useState\(''\);/, stateReplacement);

const queueReplacement = `/* ========================================================================= */
        /* PAGE VIEW B: ORDERS QUEUE LIST (PENDING FULFILLMENT LIST)                 */
        /* ========================================================================= */
        <div className="space-y-6">
          
          {/* Header Controls & Search Bar */}
          <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative w-full md:w-96">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search orders, customers, area..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 text-sm font-medium rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder:text-slate-400"
              />
            </div>
            
            <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
                <button
                  onClick={() => setViewMode('grid')}
                  className={\`p-1.5 rounded-md transition-all \${viewMode === 'grid' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm ring-1 ring-slate-200 dark:ring-slate-600' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}\`}
                  title="Grid View"
                >
                  <LayoutGrid size={16} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={\`p-1.5 rounded-md transition-all \${viewMode === 'list' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm ring-1 ring-slate-200 dark:ring-slate-600' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}\`}
                  title="List View"
                >
                  <List size={16} />
                </button>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800/50 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700">
                <PackageCheck size={14} className="text-indigo-500" />
                <span className="text-slate-700 dark:text-slate-300">
                  {pendingOrders.length} Pending
                </span>
              </div>
            </div>
          </div>

          {/* Orders Display */}
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredQueue.map((o) => {
                const customer = customers.find(c => c.id === o.customer_id);
                const items = o.items || [];
                const itemsCount = items.reduce((acc, it) => acc + (it.qty || 0), 0);
                const packedCount = items.reduce((acc, it) => acc + (it.scanned_qty || 0), 0);
                const pct = itemsCount > 0 ? Math.round((packedCount / itemsCount) * 100) : 0;
                const isDone = itemsCount > 0 && pct === 100;
                
                return (
                  <div 
                    key={o.id}
                    onClick={() => handleOpenPackingStation(o)}
                    className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group hover:border-indigo-400/50 cursor-pointer overflow-hidden relative"
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-indigo-500/5 to-transparent rounded-bl-full pointer-events-none"></div>
                    
                    <div className="space-y-4 relative z-10">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Order Ref</span>
                          <strong className="text-base font-black text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors flex items-center gap-2">
                            #{o.order_number}
                          </strong>
                        </div>
                        <span className={\`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider \${
                          isDone 
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30' 
                            : o.status === 'Packing' 
                            ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30' 
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30'
                        }\`}>
                          {isDone ? 'Verified' : o.status}
                        </span>
                      </div>
                      
                      <div className="space-y-1.5 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800/80">
                        <div className="flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-slate-200">
                          <div className="w-6 h-6 rounded-md bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500 shrink-0">
                            <User size={12} />
                          </div>
                          <span className="truncate">{customer ? customer.name : 'Walk-in Customer'}</span>
                        </div>
                        {customer?.phone && (
                          <div className="flex items-center gap-2 text-xs text-slate-500 pl-8">
                            <Phone size={10} /> {customer.phone}
                          </div>
                        )}
                        {o.area && (
                          <div className="flex items-center gap-2 text-xs text-slate-500 pl-8">
                            <MapPin size={10} /> <span className="truncate">{o.area}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-xs font-bold">
                          <span className="text-slate-500">Scan Progress</span>
                          <span className={\`\${isDone ? 'text-emerald-600 dark:text-emerald-400' : 'text-indigo-600 dark:text-indigo-400'}\`}>{pct}%</span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden shadow-inner">
                          <div 
                            className={\`h-full rounded-full transition-all duration-700 ease-out \${isDone ? 'bg-emerald-500' : 'bg-gradient-to-r from-indigo-500 to-indigo-400'}\`} 
                            style={{ width: \`\${pct}%\` }} 
                          />
                        </div>
                        <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          <span>{packedCount} Scanned</span>
                          <span>{itemsCount} Total</span>
                        </div>
                      </div>
                    </div>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenPackingStation(o);
                      }}
                      className="mt-5 w-full py-2.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600 dark:group-hover:bg-indigo-500 dark:group-hover:text-white dark:group-hover:border-indigo-500 shadow-sm active:scale-[0.98]"
                    >
                      <Scan size={14} />
                      <span>Open Station</span>
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/80 text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-bold">
                      <th className="p-4">Order Details</th>
                      <th className="p-4">Customer Info</th>
                      <th className="p-4">Progress</th>
                      <th className="p-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredQueue.map((o) => {
                      const customer = customers.find(c => c.id === o.customer_id);
                      const items = o.items || [];
                      const itemsCount = items.reduce((acc, it) => acc + (it.qty || 0), 0);
                      const packedCount = items.reduce((acc, it) => acc + (it.scanned_qty || 0), 0);
                      const pct = itemsCount > 0 ? Math.round((packedCount / itemsCount) * 100) : 0;
                      const isDone = itemsCount > 0 && pct === 100;

                      return (
                        <tr 
                          key={o.id} 
                          onClick={() => handleOpenPackingStation(o)}
                          className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group cursor-pointer"
                        >
                          <td className="p-4">
                            <div className="flex flex-col gap-1.5">
                              <span className="text-sm font-black text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                #{o.order_number}
                              </span>
                              <span className={\`w-fit px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider \${
                                isDone 
                                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' 
                                  : o.status === 'Packing' 
                                  ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400' 
                                  : 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'
                              }\`}>
                                {isDone ? 'Verified' : o.status}
                              </span>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex flex-col gap-1 text-xs">
                              <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                                <User size={12} className="text-slate-400" />
                                {customer ? customer.name : 'Walk-in'}
                              </span>
                              {(customer?.phone || o.area) && (
                                <span className="text-slate-500 flex items-center gap-3">
                                  {customer?.phone && <span className="flex items-center gap-1"><Phone size={10} /> {customer.phone}</span>}
                                  {o.area && <span className="flex items-center gap-1"><MapPin size={10} /> {o.area}</span>}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-4 min-w-[200px]">
                            <div className="flex items-center gap-3">
                              <div className="flex-1 space-y-1.5">
                                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden shadow-inner">
                                  <div 
                                    className={\`h-full rounded-full \${isDone ? 'bg-emerald-500' : 'bg-gradient-to-r from-indigo-500 to-indigo-400'}\`} 
                                    style={{ width: \`\${pct}%\` }} 
                                  />
                                </div>
                                <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                  <span>{packedCount} / {itemsCount} units</span>
                                </div>
                              </div>
                              <span className={\`text-xs font-black w-9 text-right \${isDone ? 'text-emerald-600 dark:text-emerald-400' : 'text-indigo-600 dark:text-indigo-400'}\`}>
                                {pct}%
                              </span>
                            </div>
                          </td>
                          <td className="p-4 text-right">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenPackingStation(o);
                              }}
                              className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-lg text-xs font-bold transition-all flex items-center justify-end gap-1.5 ml-auto opacity-0 group-hover:opacity-100 shadow-sm border border-indigo-200/50 dark:border-indigo-500/20"
                            >
                              <Scan size={14} />
                              <span>Verify</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {filteredQueue.length === 0 && (
            <div className="col-span-full bg-slate-50 dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 p-12 text-center text-slate-500 space-y-4">
              <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center justify-center mx-auto">
                <QrCode size={28} className="text-slate-400" />
              </div>
              <div>
                <h4 className="font-bold text-base text-slate-700 dark:text-slate-300 mb-1">No Pending Orders</h4>
                <p className="text-sm max-w-sm mx-auto text-slate-500">All sales orders are packed and verified! New pending sales orders will automatically appear in this queue.</p>
              </div>
            </div>
          )}
        </div>
      )}
      </div>`;

// Replace the old View B
code = code.replace(/\/\* ===+ \*\/\s*\/\* PAGE VIEW B: ORDERS QUEUE LIST \(PENDING FULFILLMENT LIST\)                 \*\/\s*\/\* ===+ \*\/\s*<div className="space-y-6">[\s\S]*?(?=<\/div>\s*\{\/\* CAMERA SCANNER MODAL \*\/)/, queueReplacement);

fs.writeFileSync('src/components/PackingVerificationModule.tsx', code);
console.log('Updated view correctly');
