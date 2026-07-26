import re

with open('src/components/DashboardView.tsx', 'r') as f:
    content = f.read()

metrics = [
    {
        "id": "1",
        "title": "To Pack Today (Kitchen Queue)",
        "subtitle": "Orders currently pending or undergoing kitchen packing",
        "icon": "ShoppingBag",
        "color": "amber",
        "badgeText": "Kitchen Queue",
        "type": "to_pack",
        "filterValue": "TO_PACK",
        "desc": "Orders requiring item selection, weight verification, and box sealing in the kitchen.",
        "label": "TO PACK",
        "value": "{metrics.toPackToday}",
        "valColor": "text-slate-900 dark:text-white"
    },
    {
        "id": "2",
        "title": "Ready for Dispatch (Sealed Boxes)",
        "subtitle": "Packed orders awaiting route assignment and dispatch",
        "icon": "Truck",
        "color": "yellow",
        "badgeText": "Sealed Boxes",
        "type": "status",
        "filterValue": "PACKED",
        "desc": "Orders sealed, box-tagged, and ready at the dispatch counter.",
        "label": "READY",
        "value": "{metrics.readyToDispatch}",
        "valColor": "text-slate-900 dark:text-white"
    },
    {
        "id": "3",
        "title": "Deliveries Today (In Transit)",
        "subtitle": "Orders currently out on delivery across Dahisar / Borivali / Kandivali",
        "icon": "Clock",
        "color": "indigo",
        "badgeText": "Out for Delivery",
        "type": "status",
        "filterValue": "DISPATCHED",
        "desc": "Orders assigned to drivers and currently in transit to customers.",
        "label": "IN TRANSIT",
        "value": "{metrics.deliveriesToday}",
        "valColor": "text-slate-900 dark:text-white"
    },
    {
        "id": "4",
        "title": "Overdue & Priority Delay Queue",
        "subtitle": "Orders past expected fulfillment time requiring fast-track attention",
        "icon": "AlertTriangle",
        "color": "rose",
        "badgeText": "High Priority",
        "type": "overdue",
        "filterValue": "",
        "desc": "Prioritize these orders to avoid customer delivery delay.",
        "label": "OVERDUE",
        "value": "{metrics.overdueOrdersCount}",
        "valColor": "text-rose-600 dark:text-rose-400"
    },
    {
        "id": "5",
        "title": "Pending Payments & Uncollected Dues",
        "subtitle": "Orders with pending balance requiring payment collection",
        "icon": "DollarSign",
        "color": "amber",
        "badgeText": "Unpaid Receipts",
        "type": "payment",
        "filterValue": "",
        "desc": "View unpaid customer orders. Collect payment or dispatch WhatsApp reminders.",
        "label": "PAYMENTS",
        "value": "{metrics.pendingPaymentsCount}",
        "valColor": "text-slate-900 dark:text-white"
    },
    {
        "id": "6",
        "title": "All Active Orders Stream",
        "subtitle": "Complete list of sales orders across all channels",
        "icon": "ShoppingBag",
        "color": "sky",
        "badgeText": "All Channels",
        "type": "all",
        "filterValue": "",
        "desc": "Master operational view of all active sales transactions.",
        "label": "TOTAL",
        "value": "{metrics.totalOrdersCount}",
        "valColor": "text-slate-900 dark:text-white"
    },
    {
        "id": "7",
        "title": "Sales & Revenue Ledger",
        "subtitle": "Gross revenue breakdown across completed and active orders",
        "icon": "TrendingUp",
        "color": "emerald",
        "badgeText": "+14.2% Growth",
        "type": "revenue",
        "filterValue": "",
        "desc": "Financial ledger summarizing completed sales and collected revenue.",
        "label": "REVENUE",
        "value": "₹{metrics.todaySalesAmount.toLocaleString()}",
        "valColor": "text-slate-900 dark:text-white"
    },
    {
        "id": "8",
        "title": "Outstanding Accounts Receivable",
        "subtitle": "Customer receivables pending payment settlement",
        "icon": "Clock",
        "color": "orange",
        "badgeText": "Receivables",
        "type": "receivables",
        "filterValue": "",
        "desc": "Track outstanding balances and send instant payment follow-up alerts.",
        "label": "OUTSTANDING",
        "value": "₹{metrics.outstandingAmount.toLocaleString()}",
        "valColor": "text-slate-900 dark:text-white"
    }
]

new_grid_content = '            {/* 8 GLOWING OPERATIONAL METRIC CARDS GRID */}\n            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8 gap-2">\n'

for m in metrics:
    filter_val_str = f",\n                  filterValue: '{m['filterValue']}'" if m['filterValue'] else ""
    info_text = m['desc'].split('.')[0] # Shorten desc for the card info
    new_grid_content += f"""              {{/* Metric {m['id']} */}}
              <div 
                onClick={{() => handleOpenMetricDetail({{
                  title: '{m['title']}',
                  subtitle: '{m['subtitle']}',
                  icon: {m['icon']},
                  iconColor: 'text-{m['color']}-600 bg-{m['color']}-500/10 border-{m['color']}-200',
                  badgeText: '{m['badgeText']}',
                  type: '{m['type']}'{filter_val_str},
                  description: '{m['desc']}'
                }})}}
                className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-2.5 rounded-xl shadow-xs hover:shadow-md hover:border-{m['color']}-400 dark:hover:border-{m['color']}-600 transition-all cursor-pointer group flex flex-col gap-1.5"
              >
                <div className="flex items-start">
                  <div className="p-1.5 bg-{m['color']}-500/10 dark:bg-{m['color']}-500/20 text-{m['color']}-600 dark:text-{m['color']}-400 rounded-lg group-hover:scale-110 transition-transform">
                    <{m['icon']} size={{14}} />
                  </div>
                </div>
                <div className="flex flex-col gap-0.5 mt-0.5">
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">{m['label']}</span>
                  <span className="text-[8px] text-slate-400 dark:text-slate-500 leading-tight line-clamp-2" title="{info_text}">{info_text}</span>
                </div>
                <div className="mt-1">
                  <span className="text-base font-black {m['valColor']} tracking-tight">
                    {m['value']}
                  </span>
                </div>
              </div>\n"""

new_grid_content += '            </div>'

pattern = r'\{\/\* 8 GLOWING OPERATIONAL METRIC CARDS GRID \*\/\}\s*<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8 gap-3">.*?<\/div>\s*<\/div>\n\s*\{\/\* Metric 2'

# Wait, regex dot matches newline might be tricky.
# Let's just find the indexes.
start_idx = content.find('{/* 8 GLOWING OPERATIONAL METRIC CARDS GRID */}')
end_idx = content.find('          </motion.div>', start_idx)

if start_idx != -1 and end_idx != -1:
    # Actually the grid ends at `</div>\n          </motion.div>`
    grid_end = content.rfind('</div>', start_idx, end_idx)
    if grid_end != -1:
        grid_end += 6 # include </div>
        
        new_content = content[:start_idx] + new_grid_content + '\n' + content[grid_end:]
        with open('src/components/DashboardView.tsx', 'w') as f:
            f.write(new_content)
        print("Success")
    else:
        print("Could not find grid end")
else:
    print("Could not find block")

