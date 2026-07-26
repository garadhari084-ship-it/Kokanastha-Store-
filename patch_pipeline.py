import re

with open('src/components/DashboardView.tsx', 'r') as f:
    content = f.read()

pipeline_start = content.find('{/* Pipeline */}')
pipeline_end = content.find('{/* Active Orders by Area */}')

if pipeline_start != -1 and pipeline_end != -1:
    new_pipeline = """              {/* Pipeline */}
              <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 border border-slate-700 rounded-3xl p-6 shadow-xl text-white">
                <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-500/10 blur-3xl rounded-full translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>
                
                <div className="relative z-10 flex items-center justify-between pb-4 border-b border-slate-700/80 mb-5">
                  <h2 className="text-sm font-black text-white flex items-center gap-2 tracking-wide uppercase">
                    <Activity size={18} className="text-amber-400" /> Operational Order Pipeline
                  </h2>
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span className="text-[10px] font-bold text-amber-400 bg-amber-400/10 px-2.5 py-0.5 rounded-full border border-amber-400/20 uppercase tracking-wider shadow-[0_0_10px_rgba(251,191,36,0.2)]">
                      Command Center
                    </span>
                  </div>
                </div>
                
                <div className="relative z-10 space-y-1.5">
                  {[
                    { id: 1, label: 'Booking Received', count: metrics.statusPipeline.bookingReceived, color: 'bg-slate-800', textColor: 'text-amber-400', progressColor: 'bg-amber-400', glow: 'shadow-[0_0_12px_rgba(251,191,36,0.4)]' },
                    { id: 2, label: 'Production Started', count: metrics.statusPipeline.productionStarted, color: 'bg-amber-900/40', textColor: 'text-amber-400', progressColor: 'bg-amber-400', glow: 'shadow-[0_0_12px_rgba(251,191,36,0.4)]' },
                    { id: 3, label: 'Packing Started', count: metrics.statusPipeline.packingStarted, color: 'bg-amber-900/40', textColor: 'text-amber-400', progressColor: 'bg-amber-400', glow: 'shadow-[0_0_12px_rgba(251,191,36,0.4)]' },
                    { id: 4, label: 'Packing Completed', count: metrics.statusPipeline.packingCompleted, color: 'bg-amber-900/40', textColor: 'text-amber-400', progressColor: 'bg-amber-400', glow: 'shadow-[0_0_12px_rgba(251,191,36,0.4)]' },
                    { id: 5, label: 'Ready for Dispatch', count: metrics.statusPipeline.readyForDispatch, color: 'bg-amber-900/40', textColor: 'text-amber-400', progressColor: 'bg-amber-400', glow: 'shadow-[0_0_12px_rgba(251,191,36,0.4)]' },
                    { id: 6, label: 'Out for Delivery', count: metrics.statusPipeline.outForDelivery, color: 'bg-indigo-900/40', textColor: 'text-indigo-400', progressColor: 'bg-indigo-400', glow: 'shadow-[0_0_12px_rgba(129,140,248,0.4)]' },
                    { id: 7, label: 'Delivered', count: metrics.statusPipeline.delivered, color: 'bg-emerald-900/40', textColor: 'text-emerald-400', progressColor: 'bg-emerald-400', glow: 'shadow-[0_0_12px_rgba(52,211,153,0.4)]' }
                  ].map((step, idx, arr) => (
                    <div key={step.id} className="relative group">
                      {idx !== arr.length - 1 && (
                        <div className="absolute left-3 top-7 w-0.5 h-6 bg-slate-700/50 -ml-[1px] z-0"></div>
                      )}
                      <div className="relative z-10 flex items-center gap-4 p-2 rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/10">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${step.color} ${step.textColor} ${step.count > 0 ? step.glow + ' ring-1 ring-' + step.progressColor.split('-')[1] + '-500/50' : 'ring-1 ring-white/10'}`}>
                          {step.id}
                        </div>
                        <span className={`text-sm font-bold flex-1 tracking-wide ${step.count > 0 ? 'text-white' : 'text-slate-400'}`}>{step.label}</span>
                        <div className="hidden sm:block w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden shadow-inner ring-1 ring-white/5">
                          <div className={`h-full ${step.progressColor} rounded-full transition-all duration-1000 ${step.count > 0 ? step.glow : ''}`} style={{ width: step.count > 0 ? '100%' : '0%' }}></div>
                        </div>
                        <div className={`w-10 text-center bg-slate-800/80 px-2 py-1 rounded-md border border-slate-700/50 shadow-inner`}>
                          <span className={`text-sm font-black ${step.count > 0 ? step.textColor : 'text-slate-500'}`}>{step.count}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

"""
    new_content = content[:pipeline_start] + new_pipeline + content[pipeline_end:]
    
    with open('src/components/DashboardView.tsx', 'w') as f:
        f.write(new_content)
    print("Success")
else:
    print("Failed to find boundaries")
