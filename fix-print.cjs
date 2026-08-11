const fs = require('fs');
let content = fs.readFileSync('src/utils/invoiceTemplate.ts', 'utf8');

const regex = /export async function generate3InchBillHTML[\s\S]*?<\/html>\s*`;\n}/;

const newImplementation = `export async function generate3InchBillHTML(
  order: any,
  customerObj: any,
  businessObj: any,
  products: any[]
): Promise<string> {
  const bName = businessObj?.name || "KOKANASTHA";
  const bAddress = businessObj?.billing_address || "SHOP NO 7 SITA BLDG MARUTI NAGAR SHIVVALLA\\nBH ROAD ASHOKVAN DAHISAR E MUMBAI 68";
  const phone = businessObj?.phone || "9820769697";
  const email = businessObj?.email || "contact@kokanastha.in";
  
  const orderDate = new Date(order.order_date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
  const orderTime = new Date(order.created_at || order.order_date).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  });
  const invoiceNo = order.order_number;

  let totalQty = 0;
  let itemsHtml = "";
  (order.items || []).forEach((it: any, index: number) => {
    const p = products.find((prod) => prod.id === it.product_id);
    const itemName = p?.name || "Unknown Item";
    const qty = it.qty || 1;
    const price = it.selling_price || 0;
    const amount = qty * price;
    totalQty += qty;
    itemsHtml += \`
      <tr>
        <td style="vertical-align: top; width: 15px;">\${index + 1}</td>
        <td colspan="3" style="padding-bottom: 2px;">\${itemName}</td>
      </tr>
      <tr>
        <td></td>
        <td>\${qty}</td>
        <td style="text-align: right;">\${price.toFixed(2)}</td>
        <td style="text-align: right;">\${amount.toFixed(2)}</td>
      </tr>
    \`;
  });

  const subTotal = (order.items || []).reduce((sum: number, it: any) => sum + ((it.qty || 1) * (it.selling_price || 0)), 0);
  const discount = order.discount_amount || 0;
  const additionalCharges = order.additional_charges || 0;
  const deliveryCharges = order.delivery_charges || 0;
  
  let legacyDelivery = 0;
  if (additionalCharges === 0 && deliveryCharges === 0) {
    legacyDelivery = (order.total_amount > (subTotal - discount) ? (order.total_amount - (subTotal - discount)) : 0);
  }
  
  const total = order.total_amount || (subTotal + additionalCharges + deliveryCharges + legacyDelivery - discount);
  const receivedAmount = order.paid_amount || total;
  const balance = total - receivedAmount;
  
  // Example for points: 1 point per 100 spent, if they don't have a specific field.
  const earnedPoints = (total * 0.01).toFixed(2);
  const availablePoints = customerObj?.loyalty_points || earnedPoints;

  const bankName = businessObj?.bank_name || "NKGSB COOPERATIVE BANK LIMITED";
  const accountNo = businessObj?.account_number || "092110100000085";
  const ifscCode = businessObj?.ifsc_code || "NKGS0000092";
  const accountHolder = businessObj?.account_holder || "KOKANASTHA";
  const bState = businessObj?.state || "27-Maharashtra";
  const upiId = businessObj?.upi_id || "9820769697@okicici";

  const upiPayString = buildUpiPayString({
    upiId,
    businessName: bName,
    amount: total,
    orderNumber: invoiceNo
  });
  const upiQrImgSrc = await generateQRCodeDataUrl(upiPayString, { width: 220, margin: 1 });

  return \`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Bill of Supply</title>
  <style>
    @page { 
      margin: 0; 
    }
    body {
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      font-size: 13px;
      font-weight: 900;
      line-height: 1.3;
      width: 100%;
      max-width: 80mm;
      margin: 0 auto;
      padding: 4mm 4mm;
      color: #000;
      background: #fff;
      box-sizing: border-box;
      text-transform: uppercase;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    table { width: 100%; border-collapse: collapse; }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    
    .dashed-line { border-top: 1.5px dashed #000; margin: 6px 0; }
    
    .header { text-align: center; font-weight: 900; }
    .header h2 { margin: 0 0 4px 0; font-size: 17px; font-weight: 900; }
    .header p { margin: 2px 0; font-size: 12px; }
    
    .bill-title { text-align: center; font-size: 14px; font-weight: 900; margin: 12px 0 8px; }
    
    .info-section {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      margin-top: 8px;
      font-weight: 900;
    }
    .info-left { width: 55%; }
    .info-right { width: 45%; text-align: right; }
    .info-section div { margin-bottom: 2px; }
    
    .items-table { font-size: 13px; margin-bottom: 5px; font-weight: 900; margin-top: 8px; }
    .items-table th { border-bottom: 1.5px dashed #000; border-top: 1.5px dashed #000; padding: 6px 0; text-align: left; }
    .items-table td { vertical-align: top; padding: 2px 0; }
    
    .totals-table { width: 100%; font-size: 13px; font-weight: 900; margin-bottom: 5px; }
    .totals-table td { padding: 3px 0; }
    
    .bank-details { font-size: 12px; margin-top: 8px; line-height: 1.4; font-weight: 900; }
    .terms { font-size: 12px; margin-top: 8px; line-height: 1.4; font-weight: 900; }
  </style>
</head>
<body>
  <div class="header">
    <h2>\${bName}</h2>
    <p>\${bAddress.replace(/\\n/g, "<br>")}</p>
    <p>State: \${bState}</p>
    <p>Ph.No.: \${phone}</p>
    \${businessObj?.mobile_number ? \`<p>Mobile (WhatsApp): \${businessObj.mobile_number}</p>\` : ''}
    <p>Email: \${email}</p>
    \${businessObj?.fssai_number ? \`<p style="font-weight: 900; margin-top: 4px;">FSSAI No: \${businessObj.fssai_number}</p>\` : ''}
  </div>
  
  <div class="bill-title">Bill of Supply</div>
  
  <div class="info-section">
    <div class="info-left">
      \${customerObj ? \`
        <div style="font-weight: 900;">\${customerObj.name || ''}</div>
        \${customerObj.phone ? \`<div>Ph. No.: \${customerObj.phone}</div>\` : ''}
        <div>Bill To:</div>
        <div style="word-break: break-word;">\${customerObj.billing_address || customerObj.address || ''}</div>
      \` : \`
        <div>Cash Sale</div>
      \`}
    </div>
    <div class="info-right">
      <div>Date: \${orderDate}</div>
      <div>Time: \${orderTime}</div>
      <div>Invoice No.: \${invoiceNo}</div>
    </div>
  </div>
  
  <table class="items-table">
    <thead>
      <tr>
        <th style="width: 15px;">#</th>
        <th>Item Name<br>Qty</th>
        <th style="text-align: right;">Price</th>
        <th style="text-align: right;">Amount</th>
      </tr>
    </thead>
    <tbody>
      \${itemsHtml}
    </tbody>
  </table>
  
  <div class="dashed-line"></div>
  
  <table class="totals-table">
    <tr>
      <td style="width: 15px; vertical-align: top;"></td>
      <td style="text-align: left;">
        <div style="margin-bottom: 2px;">Qty: \${totalQty}</div>
        \${discount > 0 ? \`<div style="display: flex; justify-content: space-between;"><span>Disc.\${order.discount_percentage ? \`(\${order.discount_percentage}%)\` : ''}</span><span>:</span></div>\` : ''}
        \${deliveryCharges > 0 ? \`<div style="display: flex; justify-content: space-between;"><span>Delivery</span><span>:</span></div>\` : ''}
        \${additionalCharges > 0 ? \`<div style="display: flex; justify-content: space-between;"><span>Additional</span><span>:</span></div>\` : ''}
        \${legacyDelivery > 0 ? \`<div style="display: flex; justify-content: space-between;"><span>DELIVERY</span><span>:</span></div>\` : ''}
        <div style="display: flex; justify-content: space-between;"><span>Total</span><span>:</span></div>
        <div style="display: flex; justify-content: space-between;"><span>Received</span><span>:</span></div>
        <div style="display: flex; justify-content: space-between;"><span>Balance</span><span>:</span></div>
      </td>
      <td style="text-align: right; vertical-align: top; width: 80px;">
        <div style="margin-bottom: 2px;">\${subTotal.toFixed(2)}</div>
        \${discount > 0 ? \`<div>-\${discount.toFixed(2)}</div>\` : ''}
        \${deliveryCharges > 0 ? \`<div>\${deliveryCharges.toFixed(2)}</div>\` : ''}
        \${additionalCharges > 0 ? \`<div>\${additionalCharges.toFixed(2)}</div>\` : ''}
        \${legacyDelivery > 0 ? \`<div>\${legacyDelivery.toFixed(2)}</div>\` : ''}
        <div>\${total.toFixed(2)}</div>
        <div>\${receivedAmount.toFixed(2)}</div>
        <div>\${balance.toFixed(2)}</div>
      </td>
    </tr>
  </table>
  
  <div class="dashed-line"></div>
  
  <table class="totals-table">
    <tr>
      <td style="width: 15px;"></td>
      <td style="text-align: left;">
        <div style="display: flex; justify-content: space-between;"><span>Earned Points</span><span>:</span></div>
        <div style="display: flex; justify-content: space-between;"><span>Available Points</span><span>:</span></div>
      </td>
      <td style="text-align: right; width: 80px;">
        <div>\${earnedPoints}</div>
        <div>\${availablePoints}</div>
      </td>
    </tr>
  </table>

  <div class="text-center" style="margin: 12px 0;">
    <img src="\${upiQrImgSrc}" alt="UPI QR Code" style="width: 45mm; height: 45mm; margin: 0 auto; display: block;" />
    <div style="font-size: 12px; font-weight: 900; margin-top: 6px;">Scan this QR Code to pay</div>
  </div>

  <div class="dashed-line"></div>
  
  <div class="bank-details">
    <div style="font-weight: 900; margin-bottom: 2px;">Bank Details</div>
    <div>Bank Name: \${bankName}</div>
    <div>Account Holder Name: \${accountHolder}</div>
    <div>Account No.: \${accountNo}</div>
    <div>IFSC Code: \${ifscCode}</div>
  </div>
  
  <div class="dashed-line"></div>
  
  <div class="terms">
    <div style="font-weight: 900; margin-bottom: 2px;">Terms & Conditions</div>
    <div>Thanks for doing business with us!</div>
    <div>NO REPLACEMENT AND NO REFUND FOR FOOD PRODUCTS</div>
    <div>STAY SAFE AND STAY HOME</div>
  </div>
  <div style="text-align: center; margin-top: 15px; font-size: 11px; font-weight: bold;">
    - End of Bill -
  </div>
  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 300);
    };
  </script>
</body>
</html>\`;
}
`;

if (content.match(regex)) {
  content = content.replace(regex, newImplementation);
  fs.writeFileSync('src/utils/invoiceTemplate.ts', content);
  console.log('Success');
} else {
  console.log('Regex did not match');
}
