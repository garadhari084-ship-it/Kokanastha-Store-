with open("src/services/store.ts", "r", encoding="utf-8") as f:
    content = f.read()

target = """    // Update order status & delivery details
    if (deliveryDetails && deliveryDetails.partner) {
      order.status = 'Dispatched';
      order.delivery_status = 'Dispatched';
      order.delivery_partner = deliveryDetails.partner;
      order.delivery_person_name = deliveryDetails.personName;
      order.delivery_person_phone = deliveryDetails.personPhone;
      order.tracking_number = deliveryDetails.trackingNumber;
      order.dispatch_notes = deliveryDetails.notes;
      order.dispatched_at = new Date().toISOString();
    } else {
      order.status = 'Packed';
      order.delivery_status = 'Packed';
    }
      
    this.save('sales');"""

replacement = """    // Update order status & delivery details
    let finalPartner = 'Packed';
    if (deliveryDetails && deliveryDetails.partner) {
      finalPartner = deliveryDetails.partner;
      this.updateSalesOrder(orderId, {
        status: 'Dispatched',
        delivery_status: 'Dispatched',
        delivery_partner: deliveryDetails.partner,
        delivery_person_name: deliveryDetails.personName,
        delivery_person_phone: deliveryDetails.personPhone,
        tracking_number: deliveryDetails.trackingNumber,
        dispatch_notes: deliveryDetails.notes,
        dispatched_at: new Date().toISOString()
      });
    } else {
      this.updateSalesOrder(orderId, {
        status: 'Packed',
        delivery_status: 'Packed'
      });
    }"""

if target in content:
    content = content.replace(target, replacement)
    
    # Also fix the logActivity which references order.delivery_partner
    target2 = "`Completed packing & assigned delivery (${order.delivery_partner || 'Packed'}) for order ${order.order_number}.`,"
    replacement2 = "`Completed packing & assigned delivery (${finalPartner}) for order ${order.order_number}.`,"
    content = content.replace(target2, replacement2)
    
    with open("src/services/store.ts", "w", encoding="utf-8") as f:
        f.write(content)
    print("SUCCESS")
else:
    print("TARGET NOT FOUND")
