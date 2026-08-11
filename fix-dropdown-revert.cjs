const fs = require('fs');
let content = fs.readFileSync('src/components/SalesModule.tsx', 'utf8');

const regex = /<CustomDropdown\s*value=\{rowProductId\}\s*onChange=\{\(pId\) => \{\s*if \(\!pId\) \{[\s\S]*?\}\s*\}\}/;

const oldImplementation = `<CustomDropdown 
                      value={rowProductId}
                      onChange={(val) => {
                        setRowProductId(val);
                        // set price according to selection
                        const p = products.find(prod => prod.id === val);
                        if (p) {
                          const selCust = customers.find(c => c.id === selectedCustomerId);
                          const evalRes = calculateApplicablePrice(p, {
                            isLoyalMember: isLoyalMember(selCust),
                            isAdvanceBooking,
                            isDiwaliSale: isFestiveBooking,
                            business: currentBiz,
                            orderDate
                          });
                          setRowPrice(evalRes.appliedPrice);
                          // Default to tenant default tax unless product has a specific valid GST rate
                          const defaultTax = (defaultTenantTax === 0 || p.gst_rate === 18 || typeof p.gst_rate !== 'number' || isNaN(p.gst_rate)) 
                            ? defaultTenantTax 
                            : p.gst_rate;
                          setRowTaxRate(defaultTax);
                        }
                      }}`;

if (content.match(regex)) {
  content = content.replace(regex, oldImplementation);
  fs.writeFileSync('src/components/SalesModule.tsx', content);
  console.log('Success revert CustomDropdown');
} else {
  console.log('Regex did not match');
}
