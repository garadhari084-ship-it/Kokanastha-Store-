const fs = require('fs');
let content = fs.readFileSync('src/components/SalesModule.tsx', 'utf8');

const regex = /<CustomDropdown\s+value=\{rowProductId\}[\s\S]*?onChange=\{\(pId\) => \{[\s\S]*?\}\}/;

const newImplementation = `<CustomDropdown 
                      value={rowProductId}
                      onChange={(pId) => {
                        if (!pId) {
                          setRowProductId('');
                          setRowPrice(0);
                          setRowTaxRate(defaultTenantTax);
                          return;
                        }

                        const prod = products.find(p => p.id === pId);
                        if (prod) {
                          const selCust = customers.find(c => c.id === selectedCustomerId);
                          const evalRes = calculateApplicablePrice(prod, {
                            isLoyalMember: isLoyalMember(selCust),
                            isAdvanceBooking,
                            isDiwaliSale: isFestiveBooking,
                            business: currentBiz,
                            orderDate
                          });
                          
                          const defaultTax = (defaultTenantTax === 0 || prod.gst_rate === 18 || typeof prod.gst_rate !== 'number' || isNaN(prod.gst_rate))
                            ? defaultTenantTax
                            : prod.gst_rate;
                            
                          const existingItem = orderItems.find(it => it.product_id === pId);
                          
                          if (existingItem) {
                             const updatedItems = orderItems.map(it => 
                               it.product_id === pId 
                                 ? { ...it, qty: it.qty + 1 }
                                 : it
                             );
                             setOrderItems(updatedItems);
                             triggerToast('Item quantity updated.', 'success');
                          } else {
                             const newItem = {
                               product_id: pId,
                               qty: 1,
                               scanned_qty: 0,
                               selling_price: evalRes.appliedPrice,
                               gst_rate: defaultTax,
                               normal_rate: evalRes.normalRate,
                               rate_type: evalRes.rateType,
                               rate_reason: evalRes.rateReason,
                               unit_savings: Math.max(0, evalRes.normalRate - evalRes.appliedPrice),
                               is_overridden: false
                             };
                             setOrderItems([...orderItems, newItem]);
                          }
                          
                          // We don't setRowProductId, to keep it empty for the next scan
                          setRowProductId('');
                          setRowQty(1);
                          setRowPrice(0);
                          setRowTaxRate(defaultTenantTax);
                        } else {
                          setRowProductId(pId);
                          setRowPrice(0);
                          setRowTaxRate(defaultTenantTax);
                        }
                      }}`;

if (content.match(regex)) {
  content = content.replace(regex, newImplementation);
  fs.writeFileSync('src/components/SalesModule.tsx', content);
  console.log('Success');
} else {
  console.log('Regex did not match');
}
