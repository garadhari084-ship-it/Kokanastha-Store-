const fs = require('fs');
let content = fs.readFileSync('src/components/SalesModule.tsx', 'utf8');

// Replace the handleAddLineItem function
const regex = /const handleAddLineItem = \(\) => \{[\s\S]*?setRowTaxRate\(defaultTenantTax\);\n  \};/;

const newImplementation = `const handleAddLineItem = () => {
    if (!rowProductId) {
      triggerToast('Choose a product SKU to append.', 'error');
      return;
    }
    const finalQty = Math.max(1, Number(rowQty) || 1);
    if (finalQty <= 0) {
      triggerToast('Quantity must be greater than zero.', 'error');
      return;
    }
    const prod = products.find(p => p.id === rowProductId);
    if (!prod) return;

    const existingItemIndex = orderItems.findIndex(it => it.product_id === rowProductId);
    
    if (existingItemIndex >= 0) {
      // Update existing item
      const updatedItems = [...orderItems];
      updatedItems[existingItemIndex] = {
        ...updatedItems[existingItemIndex],
        qty: updatedItems[existingItemIndex].qty + finalQty
      };
      setOrderItems(updatedItems);
      triggerToast('Item quantity updated.', 'success');
    } else {
      const selCust = customers.find(c => c.id === selectedCustomerId);
      const evalRes = calculateApplicablePrice(prod, {
        isLoyalMember: isLoyalMember(selCust),
        isAdvanceBooking,
        isDiwaliSale: isFestiveBooking,
        business: currentBiz,
        orderDate
      });
      
      const isCustomPrice = rowPrice !== '' && !isNaN(Number(rowPrice)) && Number(rowPrice) !== evalRes.appliedPrice;
      const finalPrice = rowPrice !== '' && !isNaN(Number(rowPrice)) ? Number(rowPrice) : evalRes.appliedPrice;
      const finalTax = rowTaxRate !== '' && !isNaN(Number(rowTaxRate))
        ? Number(rowTaxRate)
        : (typeof prod.gst_rate === 'number' && !isNaN(prod.gst_rate) && prod.gst_rate >= 0 ? prod.gst_rate : defaultTenantTax);
        
      const newItem: SalesItem = {
        product_id: rowProductId,
        qty: finalQty,
        scanned_qty: 0,
        selling_price: finalPrice,
        gst_rate: finalTax,
        normal_rate: evalRes.normalRate,
        rate_type: isCustomPrice ? 'OVERRIDE' : evalRes.rateType,
        rate_reason: isCustomPrice ? 'Admin Price Override' : evalRes.rateReason,
        unit_savings: Math.max(0, evalRes.normalRate - finalPrice),
        is_overridden: isCustomPrice
      };
      
      if (isCustomPrice) {
        dbStore.logActivity(
          user.id,
          user.name,
          user.role,
          'Price Override',
          \`Admin price override for \${prod.name} (SKU: \${prod.sku}): calculated \${evalRes.rateType} ₹\${evalRes.appliedPrice} -> overridden to ₹\${finalPrice}\`,
          businessId
        );
      }
      setOrderItems([...orderItems, newItem]);
    }
    
    setRowProductId('');
    setRowQty(1);
    setRowPrice(0);
    setRowTaxRate(defaultTenantTax);
  };`;

if (content.match(regex)) {
  content = content.replace(regex, newImplementation);
  fs.writeFileSync('src/components/SalesModule.tsx', content);
  console.log('Success handleAddLineItem');
} else {
  console.log('Regex did not match');
}
