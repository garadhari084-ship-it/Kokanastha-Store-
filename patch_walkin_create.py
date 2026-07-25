import re

with open("src/components/SalesModule.tsx", "r", encoding="utf-8") as f:
    content = f.read()

target = """    // Verify credit limits
    const customerObj = customers.find(c => c.id === selectedCustomerId);
    const subtotal = orderItems.reduce((acc, it) => acc + (it.qty * it.selling_price * (1 + it.gst_rate/100)), 0);
    const finalAmount = Math.round(subtotal);

    if (customerObj && (customerObj.outstanding_amount + finalAmount > customerObj.credit_limit)) {
      const confirmed = window.confirm(
        `CREDIT LIMIT WARNING!\\nThis transaction will breach customer's authorized limit of ₹${customerObj.credit_limit.toLocaleString()}.\\nDo you want to override and bypass credit check?`
      );
      if (!confirmed) return;
    }

    const randNum = Math.floor(1000 + Math.random() * 9000);
    const orderNum = isAdvanceBooking ? `SO-2026-AB-${randNum}` : `SO-2026-${randNum}`;

    try {
      const createdOrder = dbStore.createSalesOrder({
        order_number: orderNum,
        customer_id: selectedCustomerId,
        customer_name: customerObj?.name || 'Walk-in Customer',
        area: selectedArea || customerObj?.area || 'Dahisar',
        channel: selectedCustomerId === 'WALK_IN' ? 'Walk-in' : 'Direct Order',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),"""

replacement = """    // Handle Walk-in customer dynamic creation
    let finalCustomerId = selectedCustomerId;
    let finalCustomerName = 'Walk-in Customer';
    let finalCustomerArea = selectedArea || 'Dahisar';
    
    if (selectedCustomerId === 'WALK_IN') {
       let walkIn = customers.find(c => c.name === 'Walk-in Customer');
       if (!walkIn) {
          walkIn = dbStore.createCustomer({
             name: 'Walk-in Customer',
             group: 'Retail',
             area: 'Other',
             gstin: '',
             pan: '',
             billing_address: 'Retail POS',
             shipping_address: 'Retail POS',
             email: '',
             phone: '',
             credit_limit: 0,
             business_id: businessId,
             active: true
          });
       }
       finalCustomerId = walkIn.id;
       finalCustomerName = walkIn.name;
       finalCustomerArea = walkIn.area || selectedArea || 'Other';
    } else {
       const cObj = customers.find(c => c.id === selectedCustomerId);
       if (cObj) {
         finalCustomerName = cObj.name;
         finalCustomerArea = selectedArea || cObj.area || 'Dahisar';
       }
    }

    // Verify credit limits
    const customerObj = customers.find(c => c.id === finalCustomerId);
    const subtotal = orderItems.reduce((acc, it) => acc + (it.qty * it.selling_price * (1 + it.gst_rate/100)), 0);
    const finalAmount = Math.round(subtotal);

    if (customerObj && (customerObj.name !== 'Walk-in Customer') && (customerObj.outstanding_amount + finalAmount > customerObj.credit_limit)) {
      const confirmed = window.confirm(
        `CREDIT LIMIT WARNING!\\nThis transaction will breach customer's authorized limit of ₹${customerObj.credit_limit.toLocaleString()}.\\nDo you want to override and bypass credit check?`
      );
      if (!confirmed) return;
    }

    const randNum = Math.floor(1000 + Math.random() * 9000);
    const orderNum = isAdvanceBooking ? `SO-2026-AB-${randNum}` : `SO-2026-${randNum}`;

    try {
      const createdOrder = dbStore.createSalesOrder({
        order_number: orderNum,
        customer_id: finalCustomerId,
        customer_name: finalCustomerName,
        area: finalCustomerArea,
        channel: selectedCustomerId === 'WALK_IN' ? 'Walk-in' : 'Direct Order',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),"""

content = content.replace(target, replacement)

# Check if target was found
if target not in content and replacement not in content:
    print("TARGET NOT FOUND")
else:
    with open("src/components/SalesModule.tsx", "w", encoding="utf-8") as f:
        f.write(content)
    print("SUCCESS")
