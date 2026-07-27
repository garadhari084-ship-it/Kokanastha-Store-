const fs = require('fs');
let code = fs.readFileSync('src/components/PackingVerificationModule.tsx', 'utf-8');

const replacement = `          {/* DISPATCH & DELIVERY PARTNER ASSIGNMENT PANEL (UNLOCKED WHEN 100% VERIFIED) */}
          <div className={\`bg-white dark:bg-slate-900 rounded-3xl border p-4 sm:p-5 shadow-sm space-y-4 transition-all duration-300 \${isFullyVerified ? 'border-emerald-500/50 shadow-emerald-500/10' : 'border-slate-200 dark:border-slate-800'}\`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className={\`w-10 h-10 rounded-xl flex items-center justify-center \${isFullyVerified ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'}\`}>
                  <Truck size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">Delivery Partner & Dispatch</h3>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {isFullyVerified 
                      ? 'All items verified! Select delivery service to proceed.' 
                      : 'Complete scanning all item checkmarks above to unlock dispatch options.'}
                  </p>
                </div>
              </div>
              <div>
                {isFullyVerified ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold rounded-lg border border-emerald-200 dark:border-emerald-500/30">
                    <Sparkles size={12} /> Ready to Dispatch
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 text-[10px] font-bold rounded-lg border border-amber-200 dark:border-amber-500/30">
                    <AlertCircle size={12} /> {pendingItemsCount} Units Pending
                  </span>
                )}
              </div>
            </div>

            <form onSubmit={handleCompleteDispatch} className="flex flex-col lg:flex-row gap-4">
              {/* Left Column: Delivery Mode */}
              <div className="flex-1 space-y-2">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">
                  Select Delivery Mode
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
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
                      className={\`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer min-h-[60px] \${
                        deliveryPartner === mode.id && isFullyVerified
                          ? 'bg-gradient-to-br from-indigo-600 to-indigo-700 border-indigo-700 text-white shadow-md shadow-indigo-600/20 scale-[1.02]'
                          : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600'
                      } \${!isFullyVerified ? 'opacity-50 grayscale cursor-not-allowed' : ''}\`}
                    >
                      <strong className="text-[11px] font-black block">{mode.label}</strong>
                      <span className={\`text-[8px] font-bold uppercase tracking-wider mt-1 \${deliveryPartner === mode.id && isFullyVerified ? 'text-indigo-200' : 'text-slate-500'}\`}>
                        {mode.desc}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Right Column: Delivery Details & Actions */}
              <div className="flex-[0.8] flex flex-col gap-3">
                <div className="bg-slate-50 dark:bg-slate-800/30 rounded-2xl p-3 border border-slate-100 dark:border-slate-800 space-y-2.5">
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                        <User size={10} className="text-slate-400" /> Driver / Exec Name
                      </label>
                      <input 
                        type="text" 
                        disabled={!isFullyVerified}
                        placeholder="e.g. Rahul Sharma"
                        value={personName}
                        onChange={(e) => setPersonName(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 text-[11px] font-semibold rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 disabled:opacity-50 transition-all placeholder:font-normal placeholder:text-slate-400"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                        <Phone size={10} className="text-slate-400" /> Contact Number
                      </label>
                      <input 
                        type="text" 
                        disabled={!isFullyVerified}
                        placeholder="e.g. +91 9876543210"
                        value={personPhone}
                        onChange={(e) => setPersonPhone(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 text-[11px] font-semibold rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 disabled:opacity-50 transition-all placeholder:font-normal placeholder:text-slate-400"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                        <Navigation size={10} className="text-slate-400" /> Tracking / Waybill
                      </label>
                      <input 
                        type="text" 
                        disabled={!isFullyVerified}
                        placeholder="e.g. RAP-99214"
                        value={trackingNumber}
                        onChange={(e) => setTrackingNumber(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 text-[11px] font-semibold rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 disabled:opacity-50 transition-all placeholder:font-normal placeholder:text-slate-400"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                        <FileText size={10} className="text-slate-400" /> Dispatch Notes
                      </label>
                      <input 
                        type="text" 
                        disabled={!isFullyVerified}
                        placeholder="e.g. Handle with care..."
                        value={dispatchNotes}
                        onChange={(e) => setDispatchNotes(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 text-[11px] font-semibold rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 disabled:opacity-50 transition-all placeholder:font-normal placeholder:text-slate-400"
                      />
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-auto flex flex-col sm:flex-row items-center justify-between gap-2.5">
                  <button
                    type="button"
                    onClick={handleBackToQueue}
                    className="w-full sm:w-auto px-3 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-[11px] font-bold rounded-xl border border-slate-200 dark:border-slate-700 transition-all cursor-pointer shadow-sm active:scale-[0.98]"
                  >
                    Save and Exit
                  </button>
                  
                  {isFullyVerified ? (
                    <button
                      type="submit"
                      className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white rounded-xl text-[11px] font-black shadow-md shadow-emerald-500/20 flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-[0.98]"
                    >
                      <Sparkles size={12} />
                      <span>Dispatch & Assign</span>
                      <span className="bg-emerald-700/50 px-1.5 py-0.5 rounded text-[9px] ml-1">{deliveryPartner}</span>
                    </button>
                  ) : (
                    <div className="w-full sm:w-auto px-3 py-2 bg-amber-50 dark:bg-amber-500/10 rounded-xl text-[10px] text-amber-700 dark:text-amber-400 font-bold flex items-center justify-center gap-1.5 border border-amber-200 dark:border-amber-500/30">
                      <AlertCircle size={12} />
                      <span>Verify {pendingItemsCount} unit{pendingItemsCount > 1 ? 's' : ''} to dispatch</span>
                    </div>
                  )}
                </div>
              </div>
            </form>
          </div>`;

code = code.replace(/\{\/\* DISPATCH & DELIVERY PARTNER ASSIGNMENT PANEL \(UNLOCKED WHEN 100% VERIFIED\) \*\/\}\s*<div className=\{\`bg-white dark:bg-slate-900 rounded-3xl border p-5 sm:p-6 shadow-sm space-y-5 transition-all duration-300 \$\{isFullyVerified \? 'border-emerald-500\/50 shadow-emerald-500\/10' : 'border-slate-200 dark:border-slate-800'\}\`\}>[\s\S]*?(?=\s*<\/div>\s*\)\s*:\s*\(\s*\/\* ===+ \*\/\s*\/\* PAGE VIEW B)/, replacement);

fs.writeFileSync('src/components/PackingVerificationModule.tsx', code);
console.log('Updated successfully');
