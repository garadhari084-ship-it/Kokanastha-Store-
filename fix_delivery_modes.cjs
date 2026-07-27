const fs = require('fs');
let code = fs.readFileSync('src/components/PackingVerificationModule.tsx', 'utf-8');

// The icons I will add to Delivery Mode buttons:
// Rapido -> Bike
// Dunzo / Swiggy -> MapPin or ShoppingBag
// Porter -> Truck
// Courier Logistics -> Package
// In-House Agent -> Users or User
// Customer Pickup -> Store or UserCheck

// First, make sure we import these icons in PackingVerificationModule.tsx if needed
// Let's just use icons that are already imported or import them
// Let's use string replacement to add icons.

// In PackingVerificationModule.tsx we have:
// { id: 'Rapido', label: 'Rapido', desc: 'Bike Express' } ...
// Let's replace the whole grid.

const oldGrid = `<div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    { id: 'Rapido', label: 'Rapido', desc: 'Bike Express' },
                    { id: 'Dunzo / Swiggy', label: 'Dunzo / Swiggy', desc: 'Hyperlocal' },
                    { id: 'Porter', label: 'Porter', desc: 'Local Driver' },
                    { id: 'Courier Logistics', label: 'Courier', desc: 'BlueDart/Delhivery' },
                    { id: 'In-House Agent', label: 'In-House', desc: 'Company Driver' },
                    { id: 'Customer Pickup', label: 'Self Pickup', desc: 'Store Counter' }
                  ].map((mode) => (
                    <button
                      key={mode.id}
                      type="button"
                      disabled={!isFullyVerified}
                      onClick={() => setDeliveryPartner(mode.id)}
                      className={\`p-3.5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer min-h-[76px] \${
                        deliveryPartner === mode.id && isFullyVerified
                          ? 'bg-gradient-to-br from-indigo-600 to-indigo-700 border-indigo-700 text-white shadow-md shadow-indigo-600/20 scale-[1.02]'
                          : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600'
                      } \${!isFullyVerified ? 'opacity-50 grayscale cursor-not-allowed' : ''}\`}
                    >
                      <strong className="text-xs font-black block">{mode.label}</strong>
                      <span className={\`text-[9.5px] font-bold uppercase tracking-wider mt-1.5 \${deliveryPartner === mode.id && isFullyVerified ? 'text-indigo-200' : 'text-slate-500'}\`}>
                        {mode.desc}
                      </span>
                    </button>
                  ))}
                </div>`;

const newGrid = `<div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'Rapido', label: 'Rapido', desc: 'Bike Express', icon: <Bike size={24} /> },
                    { id: 'Dunzo / Swiggy', label: 'Dunzo / Swiggy', desc: 'Hyperlocal', icon: <ShoppingBag size={24} /> },
                    { id: 'Porter', label: 'Porter', desc: 'Local Driver', icon: <Truck size={24} /> },
                    { id: 'Courier Logistics', label: 'Courier', desc: 'BlueDart/Delhivery', icon: <Package size={24} /> },
                    { id: 'In-House Agent', label: 'In-House', desc: 'Company Driver', icon: <User size={24} /> },
                    { id: 'Customer Pickup', label: 'Self Pickup', desc: 'Store Counter', icon: <Store size={24} /> }
                  ].map((mode) => (
                    <button
                      key={mode.id}
                      type="button"
                      disabled={!isFullyVerified}
                      onClick={() => setDeliveryPartner(mode.id)}
                      className={\`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer min-h-[76px] \${
                        deliveryPartner === mode.id && isFullyVerified
                          ? 'bg-gradient-to-br from-indigo-600 to-indigo-700 border-indigo-700 text-white shadow-md shadow-indigo-600/20 scale-[1.02]'
                          : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600'
                      } \${!isFullyVerified ? 'opacity-50 grayscale cursor-not-allowed' : ''}\`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <strong className="text-[13px] font-black">{mode.label}</strong>
                        <div className={\`\${deliveryPartner === mode.id && isFullyVerified ? 'text-indigo-200' : 'text-indigo-500/50'}\`}>
                          {mode.icon}
                        </div>
                      </div>
                      <span className={\`text-[10px] font-bold uppercase tracking-wider \${deliveryPartner === mode.id && isFullyVerified ? 'text-indigo-200' : 'text-slate-500'}\`}>
                        {mode.desc}
                      </span>
                    </button>
                  ))}
                </div>`;

code = code.replace(oldGrid, newGrid);

// Ensure Bike and Store are imported from lucide-react
if (!code.includes('Bike,')) {
  code = code.replace(/import {/, 'import { Bike, Store, ');
}

fs.writeFileSync('src/components/PackingVerificationModule.tsx', code);
console.log('Fixed delivery modes');
