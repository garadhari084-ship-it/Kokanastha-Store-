import re

with open('src/components/DashboardView.tsx', 'r') as f:
    content = f.read()

missing_ui = """
            {/* Operational Order Pipeline & Active Orders by Area */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-6">
              {/* Pipeline */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
                  <h2 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Layers size={18} className="text-amber-500" /> Operational Order Pipeline
                  </h2>
                  <span className="text-[10px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-900/30 px-2.5 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
                    Live Status
                  </span>
                </div>
                <div className="space-y-4">
                  {[
                    { id: 1, label: 'Booking Received', count: metrics.statusPipeline.bookingReceived, color: 'bg-slate-100 dark:bg-slate-800', textColor: 'text-amber-700 dark:text-amber-400', progressColor: 'bg-amber-500' },
                    { id: 2, label: 'Production Started', count: metrics.statusPipeline.productionStarted, color: 'bg-amber-50 dark:bg-amber-900/20', textColor: 'text-amber-700 dark:text-amber-400', progressColor: 'bg-amber-500' },
                    { id: 3, label: 'Packing Started', count: metrics.statusPipeline.packingStarted, color: 'bg-amber-50 dark:bg-amber-900/20', textColor: 'text-amber-700 dark:text-amber-400', progressColor: 'bg-amber-500' },
                    { id: 4, label: 'Packing Completed', count: metrics.statusPipeline.packingCompleted, color: 'bg-amber-50 dark:bg-amber-900/20', textColor: 'text-amber-700 dark:text-amber-400', progressColor: 'bg-amber-500' },
                    { id: 5, label: 'Ready for Dispatch', count: metrics.statusPipeline.readyForDispatch, color: 'bg-amber-50 dark:bg-amber-900/20', textColor: 'text-amber-700 dark:text-amber-400', progressColor: 'bg-amber-500' },
                    { id: 6, label: 'Out for Delivery', count: metrics.statusPipeline.outForDelivery, color: 'bg-indigo-50 dark:bg-indigo-900/20', textColor: 'text-indigo-700 dark:text-indigo-400', progressColor: 'bg-indigo-500' },
                    { id: 7, label: 'Delivered', count: metrics.statusPipeline.delivered, color: 'bg-emerald-50 dark:bg-emerald-900/20', textColor: 'text-emerald-700 dark:text-emerald-400', progressColor: 'bg-emerald-500' }
                  ].map(step => (
                    <div key={step.id} className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${step.color} ${step.textColor}`}>
                        {step.id}
                      </div>
                      <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex-1">{step.label}</span>
                      <div className="w-24 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className={`h-full ${step.progressColor} rounded-full`} style={{ width: step.count > 0 ? '100%' : '0%' }}></div>
                      </div>
                      <span className={`text-xs font-black w-4 text-right ${step.textColor}`}>{step.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Active Orders by Area */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
                  <h2 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <MapPin size={18} className="text-amber-500" /> Active Orders by Area
                  </h2>
                  <span className="text-[10px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-full">
                    {metrics.activeOrdersByArea.length} Zones
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {metrics.activeOrdersByArea.map((area, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                        <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">{area.area}</span>
                      </div>
                      <span className="text-[11px] font-black text-slate-900 dark:text-white bg-white dark:bg-slate-900 px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700 shadow-xs">
                        {area.count} orders
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Operational Shortcuts */}
            <div className="mt-6 bg-gradient-to-r from-slate-900 to-slate-800 dark:from-slate-950 dark:to-slate-900 rounded-3xl p-6 shadow-md relative overflow-hidden border border-slate-800">
              <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2"></div>
              
              <div className="flex items-center justify-between mb-4 relative z-10">
                <h2 className="text-sm font-extrabold text-amber-500 flex items-center gap-1.5">
                  <Zap size={16} /> Quick Operational Shortcuts
                </h2>
                <span className="text-[10px] font-bold text-slate-900 bg-amber-500/20 text-amber-500 px-2.5 py-0.5 rounded-full border border-amber-500/30">
                  Express
                </span>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 relative z-10">
                <button className="flex flex-col gap-1 text-left p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition group">
                  <PlusCircle size={16} className="text-amber-400 mb-1 group-hover:scale-110 transition-transform" />
                  <span className="text-[11px] font-bold text-white">New Order</span>
                  <span className="text-[10px] text-slate-400">नवीन ऑर्डर</span>
                </button>
                <button className="flex flex-col gap-1 text-left p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition group">
                  <Boxes size={16} className="text-amber-400 mb-1 group-hover:scale-110 transition-transform" />
                  <span className="text-[11px] font-bold text-white">Production</span>
                  <span className="text-[10px] text-slate-400">उत्पादन पॅकिंग</span>
                </button>
                <button className="flex flex-col gap-1 text-left p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition group">
                  <Truck size={16} className="text-indigo-400 mb-1 group-hover:scale-110 transition-transform" />
                  <span className="text-[11px] font-bold text-white">Dispatch</span>
                  <span className="text-[10px] text-slate-400">डिलिव्हरी</span>
                </button>
                <button className="flex flex-col gap-1 text-left p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition group">
                  <DollarSign size={16} className="text-emerald-400 mb-1 group-hover:scale-110 transition-transform" />
                  <span className="text-[11px] font-bold text-white">Collect</span>
                  <span className="text-[10px] text-slate-400">पेमेंट जमा</span>
                </button>
              </div>
            </div>\n"""

# find the operations tab closing motion div
# {activeTab === 'operations' && (
#    ...
#          </motion.div>
# )}
start_idx = content.find("{activeTab === 'operations' && (")
if start_idx != -1:
    analytics_idx = content.find("{/* ================= TAB 2: SALES & REVENUE ANALYTICS ================= */}")
    if analytics_idx != -1:
        motion_div_end = content.rfind("</motion.div>", start_idx, analytics_idx)
        if motion_div_end != -1:
            new_content = content[:motion_div_end] + missing_ui + content[motion_div_end:]
            with open('src/components/DashboardView.tsx', 'w') as f:
                f.write(new_content)
            print("Successfully inserted missing UI")
        else:
            print("Could not find motion div end")
    else:
        print("Could not find analytics tab")
else:
    print("Could not find operations tab")

