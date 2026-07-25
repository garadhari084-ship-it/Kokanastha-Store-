import re
with open("src/services/store.ts", "r", encoding="utf-8") as f:
    content = f.read()

target = r"    // Update order status & delivery details[\s\S]*?this\.save\('sales'\);"

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

content = re.sub(target, replacement, content)

target2 = r"`Completed packing & assigned delivery \(\$\{order\.delivery_partner \|\| 'Packed'\}\) for order \$\{order\.order_number\}\.`,"
replacement2 = r"`Completed packing & assigned delivery (${finalPartner}) for order ${order.order_number}.`,"
content = re.sub(target2, replacement2, content)

with open("src/services/store.ts", "w", encoding="utf-8") as f:
    f.write(content)
print("SUCCESS")
