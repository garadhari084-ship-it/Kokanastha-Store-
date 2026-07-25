import re

with open("src/components/SalesModule.tsx", "r", encoding="utf-8") as f:
    content = f.read()

target_dropdown = """                  <select 
                    value={selectedCustomerId}
                    onChange={(e) => {
                      setSelectedCustomerId(e.target.value);
                      const c = customers.find(cust => cust.id === e.target.value);
                      if (c?.area) setSelectedArea(c.area);
                    }}
                    className="w-full px-3 py-2 bg-slate-50 text-[11px] rounded-lg border focus:outline-none"
                  >
                    {customers.map((c, idx) => (
                      <option key={`${c.id}-${idx}`} value={c.id}>{c.name} (Credit outstanding: ₹{c.outstanding_amount.toLocaleString()})</option>
                    ))}
                  </select>"""

if target_dropdown not in content:
    # try replacing focus:outline-none with focus:outline-hidden
    target_dropdown = target_dropdown.replace("focus:outline-none", "focus:outline-hidden")

replacement_dropdown = """                  <select 
                    value={selectedCustomerId}
                    onChange={(e) => {
                      setSelectedCustomerId(e.target.value);
                      const c = customers.find(cust => cust.id === e.target.value);
                      if (c?.area) setSelectedArea(c.area);
                    }}
                    className="w-full px-3 py-2 bg-slate-50 text-[11px] rounded-lg border focus:outline-hidden"
                  >
                    <option value="" disabled>-- Select Customer --</option>
                    <option value="WALK_IN">Walk-in Customer (Instant POS)</option>
                    {customers.map((c, idx) => (
                      <option key={`${c.id}-${idx}`} value={c.id}>{c.name} (Credit outstanding: ₹{c.outstanding_amount.toLocaleString()})</option>
                    ))}
                  </select>"""

content = content.replace(target_dropdown, replacement_dropdown)

target_channel = "channel: 'Direct Order',"
replacement_channel = "channel: selectedCustomerId === 'WALK_IN' ? 'Walk-in' : 'Direct Order',"

content = content.replace(target_channel, replacement_channel)

with open("src/components/SalesModule.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("SUCCESS")
