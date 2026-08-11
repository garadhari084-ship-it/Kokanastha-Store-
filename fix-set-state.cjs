const fs = require('fs');
let content = fs.readFileSync('src/components/SalesModule.tsx', 'utf8');

// Replace orderItems updates in fast scan with functional updates
content = content.replace(
  /const existingItem = orderItems\.find\(it => it\.product_id === p\.id\);\s*if \(existingItem\) \{\s*const updatedItems = orderItems\.map\(it => \s*it\.product_id === p\.id \s*\? \{ \.\.\.it, qty: it\.qty \+ 1 \}\s*: it\s*\);\s*setOrderItems\(updatedItems\);\s*triggerToast\('Item quantity updated\.', 'success'\);\s*\} else \{\s*const newItem = \{[\s\S]*?\};\s*setOrderItems\(\[\.\.\.orderItems, newItem\]\);\s*triggerToast\('Added: ' \+ p\.name, 'success'\);\s*\}/g,
  `setOrderItems(prevItems => {
    const existingItem = prevItems.find(it => it.product_id === p.id);
    if (existingItem) {
      triggerToast('Item quantity updated.', 'success');
      return prevItems.map(it => 
        it.product_id === p.id 
          ? { ...it, qty: it.qty + 1 }
          : it
      );
    } else {
      const newItem = {
        product_id: p.id,
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
      triggerToast('Added: ' + p.name, 'success');
      return [...prevItems, newItem];
    }
  });`
);

// Replace orderItems updates in CustomDropdown with functional updates
content = content.replace(
  /const existingItem = orderItems\.find\(it => it\.product_id === pId\);\s*if \(existingItem\) \{\s*const updatedItems = orderItems\.map\(it => \s*it\.product_id === pId \s*\? \{ \.\.\.it, qty: it\.qty \+ 1 \}\s*: it\s*\);\s*setOrderItems\(updatedItems\);\s*triggerToast\('Item quantity updated\.', 'success'\);\s*\} else \{\s*const newItem = \{[\s\S]*?\};\s*setOrderItems\(\[\.\.\.orderItems, newItem\]\);\s*\}/g,
  `setOrderItems(prevItems => {
    const existingItem = prevItems.find(it => it.product_id === pId);
    if (existingItem) {
      triggerToast('Item quantity updated.', 'success');
      return prevItems.map(it => 
        it.product_id === pId 
          ? { ...it, qty: it.qty + 1 }
          : it
      );
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
      return [...prevItems, newItem];
    }
  });`
);

// Do the same for handleAddLineItem
content = content.replace(
  /const existingItemIndex = orderItems\.findIndex\(it => it\.product_id === rowProductId\);\s*if \(existingItemIndex >= 0\) \{\s*\/\/ Update existing item\s*const updatedItems = \[\.\.\.orderItems\];\s*updatedItems\[existingItemIndex\] = \{\s*\.\.\.updatedItems\[existingItemIndex\],\s*qty: updatedItems\[existingItemIndex\]\.qty \+ finalQty\s*\};\s*setOrderItems\(updatedItems\);\s*triggerToast\('Item quantity updated\.', 'success'\);\s*\} else \{[\s\S]*?setOrderItems\(\[\.\.\.orderItems, newItem\]\);\s*\}/g,
  `setOrderItems(prevItems => {
    const existingItemIndex = prevItems.findIndex(it => it.product_id === rowProductId);
    if (existingItemIndex >= 0) {
      triggerToast('Item quantity updated.', 'success');
      const updatedItems = [...prevItems];
      updatedItems[existingItemIndex] = {
        ...updatedItems[existingItemIndex],
        qty: updatedItems[existingItemIndex].qty + finalQty
      };
      return updatedItems;
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
        
      const newItem = {
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
      return [...prevItems, newItem];
    }
  });`
);

fs.writeFileSync('src/components/SalesModule.tsx', content);
console.log('Success setOrderItems functional updates');
