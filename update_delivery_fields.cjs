const fs = require('fs');
let code = fs.readFileSync('src/components/PackingVerificationModule.tsx', 'utf-8');

const oldDetailsBlock = `<div className="bg-slate-50 dark:bg-slate-800/30 rounded-2xl p-3.5 border border-slate-100 dark:border-slate-800 space-y-3.5">
                  <div className="grid grid-cols-2 gap-3.5">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                        <User size={12} className="text-slate-400" /> Driver / Exec Name
                      </label>
                      <input 
                        type="text" 
                        disabled={!isFullyVerified}
                        placeholder="e.g. Rahul Sharma"
                        value={personName}
                        onChange={(e) => setPersonName(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 text-[11px] font-semibold rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 disabled:opacity-50 transition-all placeholder:font-normal placeholder:text-slate-400"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                        <Phone size={12} className="text-slate-400" /> Contact Number
                      </label>
                      <input 
                        type="text" 
                        disabled={!isFullyVerified}
                        placeholder="e.g. +91 9876543210"
                        value={personPhone}
                        onChange={(e) => setPersonPhone(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 text-[11px] font-semibold rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 disabled:opacity-50 transition-all placeholder:font-normal placeholder:text-slate-400"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3.5">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                        <Navigation size={12} className="text-slate-400" /> Tracking / Waybill
                      </label>
                      <input 
                        type="text" 
                        disabled={!isFullyVerified}
                        placeholder="e.g. RAP-99214"
                        value={trackingNumber}
                        onChange={(e) => setTrackingNumber(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 text-[11px] font-semibold rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 disabled:opacity-50 transition-all placeholder:font-normal placeholder:text-slate-400"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                        <FileText size={12} className="text-slate-400" /> Dispatch Notes
                      </label>
                      <input 
                        type="text" 
                        disabled={!isFullyVerified}
                        placeholder="e.g. Handle with care..."
                        value={dispatchNotes}
                        onChange={(e) => setDispatchNotes(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 text-[11px] font-semibold rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 disabled:opacity-50 transition-all placeholder:font-normal placeholder:text-slate-400"
                      />
                    </div>
                  </div>
                </div>`;

const newDetailsBlock = `<div className="bg-slate-50 dark:bg-slate-800/30 rounded-2xl p-3.5 border border-slate-100 dark:border-slate-800">
                  {(deliveryPartner === 'In-House Agent' || deliveryPartner === 'Customer Pickup') ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                          <User size={12} className="text-slate-400" /> {deliveryPartner === 'Customer Pickup' ? 'Collector / Person Name' : 'Driver / Exec Name'}
                        </label>
                        <input 
                          type="text" 
                          disabled={!isFullyVerified}
                          placeholder={deliveryPartner === 'Customer Pickup' ? 'e.g. Customer Name' : 'e.g. Rahul Sharma'}
                          value={personName}
                          onChange={(e) => setPersonName(e.target.value)}
                          className="w-full px-3 py-2 bg-white dark:bg-slate-900 text-[11px] font-semibold rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 disabled:opacity-50 transition-all placeholder:font-normal placeholder:text-slate-400"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                          <Phone size={12} className="text-slate-400" /> Contact Number
                        </label>
                        <input 
                          type="text" 
                          disabled={!isFullyVerified}
                          placeholder="e.g. +91 9876543210"
                          value={personPhone}
                          onChange={(e) => setPersonPhone(e.target.value)}
                          className="w-full px-3 py-2 bg-white dark:bg-slate-900 text-[11px] font-semibold rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 disabled:opacity-50 transition-all placeholder:font-normal placeholder:text-slate-400"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                        <Navigation size={12} className="text-slate-400" /> Tracking / Waybill Number
                      </label>
                      <input 
                        type="text" 
                        disabled={!isFullyVerified}
                        placeholder="e.g. TRK-99214"
                        value={trackingNumber}
                        onChange={(e) => setTrackingNumber(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 text-[11px] font-semibold rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 disabled:opacity-50 transition-all placeholder:font-normal placeholder:text-slate-400"
                      />
                    </div>
                  )}
                </div>`;

if (code.includes(oldDetailsBlock)) {
  code = code.replace(oldDetailsBlock, newDetailsBlock);
  fs.writeFileSync('src/components/PackingVerificationModule.tsx', code);
  console.log('Successfully updated delivery details block!');
} else {
  console.error('Could not find oldDetailsBlock exact string');
}
