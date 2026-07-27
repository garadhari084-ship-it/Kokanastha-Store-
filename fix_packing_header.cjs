const fs = require('fs');
let code = fs.readFileSync('src/components/PackingVerificationModule.tsx', 'utf-8');

const oldHeader = `{/* Active Order Overview Banner */}
          <div className="bg-slate-950 text-white rounded-2xl p-6 shadow-xl border border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            <div className="md:col-span-2 space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 bg-indigo-500/20 text-indigo-300 rounded-md text-[10px] font-bold font-mono tracking-wider uppercase border border-indigo-500/30">
                  PACKING DESK #1
                </span>
                <span className="px-2.5 py-1 bg-slate-800 text-slate-300 rounded-md text-[10px] font-bold uppercase">
                  Status: {selectedOrder.status}
                </span>
              </div>
              <h2 className="text-sm font-extrabold tracking-tight flex items-center gap-2 text-white">
                <span>Order #{selectedOrder.order_number}</span>
              </h2>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-300">
                <p className="flex items-center gap-1">
                  <User size={13} className="text-slate-400" />
                  <span className="font-semibold text-white">
                    {customers.find(c => c.id === selectedOrder.customer_id)?.name || 'Walk-in Customer'}
                  </span>
                </p>
                {selectedOrder.area && (
                  <p className="flex items-center gap-1 text-slate-400">
                    <MapPin size={13} />
                    <span>Area: {selectedOrder.area}</span>
                  </p>
                )}
                {selectedOrder.channel && (
                  <p className="flex items-center gap-1 text-slate-400">
                    <Building2 size={13} />
                    <span>Channel: {selectedOrder.channel}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Verification Progress Box */}
            <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-xl flex flex-col justify-between">`;

const newHeader = `{/* Active Order Overview Banner */}
          <div className="bg-slate-950 text-white rounded-2xl p-4 sm:p-5 shadow-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-3 flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-1 bg-indigo-500/20 text-indigo-300 rounded-md text-[10px] font-bold font-mono tracking-wider uppercase border border-indigo-500/30">
                  PACKING DESK #1
                </span>
                <span className="px-2.5 py-1 bg-slate-800 text-slate-300 rounded-md text-[10px] font-bold uppercase">
                  Status: {selectedOrder.status}
                </span>
                <h2 className="text-sm font-extrabold tracking-tight flex items-center gap-2 text-white ml-1">
                  Order #{selectedOrder.order_number}
                </h2>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-slate-300">
                <p className="flex items-center gap-1.5">
                  <User size={13} className="text-slate-400" />
                  <span className="font-semibold text-white truncate max-w-[150px]">
                    {customers.find(c => c.id === selectedOrder.customer_id)?.name || 'Walk-in Customer'}
                  </span>
                </p>
                {selectedOrder.area && (
                  <p className="flex items-center gap-1.5 text-slate-400">
                    <MapPin size={13} />
                    <span className="truncate max-w-[120px]">Area: {selectedOrder.area}</span>
                  </p>
                )}
                {selectedOrder.channel && (
                  <p className="flex items-center gap-1.5 text-slate-400">
                    <Building2 size={13} />
                    <span className="truncate max-w-[120px]">Channel: {selectedOrder.channel}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Verification Progress Box */}
            <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-xl flex flex-col justify-between w-full md:w-80 shrink-0">`;

code = code.replace(oldHeader, newHeader);
fs.writeFileSync('src/components/PackingVerificationModule.tsx', code);
console.log('Done');
