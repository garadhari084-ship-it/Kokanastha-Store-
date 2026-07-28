import { SalesOrder, Customer, Business, Product } from '../types/erp';
import { buildUpiPayString, buildBillVerificationString, generateQRCodeDataUrl } from './qrCode';
import { formatOrderTime } from './formatters';
import { urlToBase64 } from './imageToBase64';

export function numberToWordsIndian(amount: number): string {
  if (!amount || amount <= 0) return 'Zero Rupees only';

  const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 
                 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function convertNumber(num: number): string {
    if (num < 20) return units[num];
    if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 !== 0 ? ' ' + units[num % 10] : '');
    if (num < 1000) return units[Math.floor(num / 100)] + ' Hundred' + (num % 100 !== 0 ? ' ' + convertNumber(num % 100) : '');
    if (num < 100000) return convertNumber(Math.floor(num / 1000)) + ' Thousand' + (num % 1000 !== 0 ? ' ' + convertNumber(num % 1000) : '');
    if (num < 10000000) return convertNumber(Math.floor(num / 100000)) + ' Lakh' + (num % 100000 !== 0 ? ' ' + convertNumber(num % 100000) : '');
    return convertNumber(Math.floor(num / 10000000)) + ' Crore' + (num % 10000000 !== 0 ? ' ' + convertNumber(num % 10000000) : '');
  }

  const integerPart = Math.round(amount);
  const words = convertNumber(integerPart);
  return `${words} Rupees only`;
}

export async function generateBillOfSupplyHTML(
  order: SalesOrder,
  cust?: Customer,
  businessObj?: Business,
  products: Product[] = []
): Promise<string> {
  const items = order.items || [];
  const logoBase64 = businessObj?.logo_url ? await urlToBase64(businessObj.logo_url) : "";
  const subTotal = items.reduce((sum, it) => sum + ((it.qty || 1) * (it.selling_price || 0)), 0);
  const delivery = order.total_amount > subTotal ? (order.total_amount - subTotal) : 0;
  const totalAmount = order.total_amount || (subTotal + delivery);
  const totalQty = items.reduce((sum, it) => sum + (it.qty || 0), 0);
  const amountInWords = numberToWordsIndian(totalAmount);

  const received = order.payment_status === 'Paid' ? totalAmount : 0;
  const balance = totalAmount - received;
  const paymentMode = order.payment_status === 'Paid' ? 'Online / Paid' : 'Credit / Pending';

  const custName = cust?.name || order.customer_name || 'SMITA NAYAK';
  const custAddr = cust?.billing_address || (order.area ? `${order.area} Zone, Mumbai` : 'ARYAVARTA B 406');
  const custPhone = cust?.phone || (order as any).phone || '8779792825';

  const bName = businessObj?.name || 'KOKANASTHA';
  const bAddress = businessObj?.billing_address || 'SHOP NO 7 SITA BLDG MARUTI NAGAR SHIVVALLABH ROAD ASHOKVAN DAHISAR E MUMBAI 68, Ph. no.: 9820769697 Email: contact@kokanastha.in';

  // Real UPI QR Code and Bill QR Code parameters
  const upiId = businessObj?.upi_id || '9820769697@okicici';
  const upiString = buildUpiPayString({
    upiId,
    businessName: bName,
    amount: totalAmount,
    orderNumber: order.order_number
  });

  const billString = buildBillVerificationString({
    orderNumber: order.order_number,
    orderDate: order.order_date,
    amount: totalAmount,
    customerName: custName,
    businessName: bName,
    gstin: businessObj?.gstin
  });

  const upiQrImgSrc = await generateQRCodeDataUrl(upiString, { width: 150, margin: 1 });
  const billQrImgSrc = await generateQRCodeDataUrl(billString, { width: 150, margin: 1 });

  const bankName = businessObj?.bank_name || 'NKGSB COOPERATIVE BANK LIMITED, DAHISAR EAST ASHOKVAN';
  const accountNo = businessObj?.account_number || '092110100000085';
  const ifscCode = businessObj?.ifsc_code || 'NKGS0000092';
  const accountHolder = businessObj?.account_holder || bName;

  const formattedItems = items.map((it, idx) => {
    const p = products.find(prod => prod.id === it.product_id);
    const itemCode = p?.barcode || p?.sku || p?.hsn_code || '';
    const itemName = p?.name || 'Faral Item';
    const priceUnit = it.selling_price || 0;
    const finalRate = it.selling_price || 0;
    const itemAmount = (it.qty || 1) * (it.selling_price || 0);

    return `
      <tr>
        <td style="padding: 6px; border-bottom: 1px solid #e2e8f0; text-align: center;">${idx + 1}</td>
        <td style="padding: 6px; border-bottom: 1px solid #e2e8f0; font-weight: bold; text-transform: uppercase;">${itemName}</td>
        <td style="padding: 6px; border-bottom: 1px solid #e2e8f0; text-align: center; font-family: monospace; color: #475569;">${itemCode}</td>
        <td style="padding: 6px; border-bottom: 1px solid #e2e8f0; text-align: center; font-weight: bold;">${it.qty}</td>
        <td style="padding: 6px; border-bottom: 1px solid #e2e8f0; text-align: right;">₹ ${priceUnit.toFixed(2)}</td>
        <td style="padding: 6px; border-bottom: 1px solid #e2e8f0; text-align: right;">${finalRate.toFixed(2)}</td>
        <td style="padding: 6px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: bold;">₹ ${itemAmount.toFixed(2)}</td>
      </tr>
    `;
  }).join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Bill of Supply - ${order.order_number}</title>
  <style>
    @page { size: A4; margin: 10mm; }
    body {
      font-family: Arial, Helvetica, sans-serif;
      color: #1e293b;
      margin: 0;
      padding: 15px;
      font-size: 10pt;
      line-height: 1.35;
      background: #ffffff;
    }
    .top-label {
      text-align: right;
      font-size: 7.5pt;
      font-weight: 700;
      color: #64748b;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
    }
    .header-box {
      text-align: center;
      margin-bottom: 12px;
    }
    .company-title {
      font-size: 16pt;
      font-weight: 900;
      letter-spacing: 1px;
      margin: 0;
      text-transform: uppercase;
      color: #0f172a;
    }
    .company-address {
      font-size: 7.5pt;
      color: #334155;
      margin-top: 4px;
      font-weight: 600;
      letter-spacing: 0.2px;
    }
    .divider-double {
      border-top: 2px solid #0f172a;
      margin: 8px 0;
    }
    .bill-title {
      text-align: center;
      font-size: 11pt;
      font-weight: 800;
      margin: 6px 0 12px 0;
      color: #0f172a;
    }
    .meta-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 12px;
    }
    .meta-table td {
      vertical-align: top;
      padding: 0 4px;
      width: 33.33%;
    }
    .meta-heading {
      font-size: 8.5pt;
      font-weight: 800;
      color: #0f172a;
      margin-bottom: 4px;
      border-bottom: 1px solid #cbd5e1;
      padding-bottom: 2px;
    }
    .meta-value {
      font-size: 8.5pt;
      color: #334155;
    }
    .meta-value strong {
      color: #0f172a;
    }
    table.items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 12px;
      font-size: 8.5pt;
    }
    table.items-table th {
      border-top: 1px solid #0f172a;
      border-bottom: 1px solid #0f172a;
      padding: 6px 4px;
      text-align: left;
      font-weight: 800;
      color: #0f172a;
    }
    table.items-table td {
      padding: 6px 4px;
    }
    .total-row td {
      border-top: 1px solid #0f172a;
      border-bottom: 1px solid #0f172a;
      font-weight: 800;
      padding: 6px 4px;
    }
    .bottom-section {
      display: table;
      width: 100%;
      margin-top: 12px;
    }
    .left-col {
      display: table-cell;
      width: 58%;
      vertical-align: top;
      padding-right: 15px;
    }
    .right-col {
      display: table-cell;
      width: 42%;
      vertical-align: top;
    }
    .section-label {
      font-size: 8pt;
      font-weight: 800;
      color: #0f172a;
      margin-top: 8px;
      margin-bottom: 2px;
    }
    .amounts-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 8.5pt;
    }
    .amounts-table td {
      padding: 3px 0;
    }
    .amounts-table tr.grand-row td {
      border-top: 1px solid #0f172a;
      border-bottom: 1px solid #0f172a;
      font-weight: 800;
      font-size: 9.5pt;
    }
    .bank-box {
      margin-top: 10px;
      display: table;
      width: 100%;
    }
    .qr-cell {
      display: table-cell;
      width: 65px;
      vertical-align: top;
      padding-right: 8px;
    }
    .bank-details-cell {
      display: table-cell;
      vertical-align: top;
      font-size: 7.5pt;
      color: #334155;
    }
    .sig-box {
      margin-top: 30px;
      text-align: right;
      font-size: 8.5pt;
    }
    .sig-name {
      font-family: 'Brush Script MT', cursive, sans-serif;
      font-size: 14pt;
      color: #1e293b;
      margin: 8px 0 2px 0;
    }
    .tear-line {
      border-top: 1px dashed #64748b;
      margin: 25px 0 12px 0;
    }
    .ack-header {
      text-align: center;
      margin-bottom: 8px;
    }
    .ack-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 8pt;
    }
    .ack-table td {
      vertical-align: top;
      width: 33.33%;
    }
  </style>
</head>
<body>
  <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; border-bottom: 1px solid #e2e8f0; padding-bottom: 16px;">
    <div style="display: flex; align-items: center; gap: 16px;">
      ${logoBase64 ? `<img src="${logoBase64}" alt="${bName}" style="max-height: 100px; width: auto; object-fit: contain;" />` : ""}
      <div style="text-align: left;">
        <h1 class="company-title" style="margin: 0 0 4px 0; font-size: 20pt; text-align: left;">${bName}</h1>
        <div class="company-address" style="text-align: left; margin: 0;">${bAddress}</div>
      </div>
    </div>
    <div style="text-align: right;">
      <div class="top-label" style="margin-bottom: 8px; text-align: right;">ORIGINAL FOR RECIPIENT</div>
    </div>
  </div>

  <div class="divider-double"></div>
  <div class="bill-title">Bill of Supply</div>

  <table class="meta-table">
    <tr>
      <td>
        <div class="meta-heading">Bill To</div>
        <div class="meta-value">
          <strong>${custName}</strong><br/>
          ${custAddr}<br/>
          Contact No. : ${custPhone}
        </div>
      </td>
      <td>
        <div class="meta-heading">Transportation Details</div>
        <div class="meta-value">
          Transport Name: Direct Express<br/>
          Delivery Date: ${order.order_date}<br/>
          Delivery Location: ${order.area || 'Dahisar'}<br/>
          Delivery Type: Local Dispatch
        </div>
      </td>
      <td>
        <div class="meta-heading">Invoice Details</div>
        <div class="meta-value">
          Invoice No. : <strong>${order.order_number}</strong><br/>
          Date : ${order.order_date}<br/>
          Time : ${formatOrderTime(order.time, order.created_at)}
        </div>
      </td>
    </tr>
  </table>

  <table class="items-table">
    <thead>
      <tr>
        <th style="width: 25px; text-align: center;">#</th>
        <th>Item name</th>
        <th style="text-align: center;">Item Code</th>
        <th style="text-align: center;">Quantity</th>
        <th style="text-align: right;">Price/unit</th>
        <th style="text-align: right;">Final Rate</th>
        <th style="text-align: right;">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${formattedItems}
      <tr class="total-row">
        <td colspan="3">Total</td>
        <td style="text-align: center;">${totalQty}</td>
        <td></td>
        <td></td>
        <td style="text-align: right;">₹ ${subTotal.toFixed(2)}</td>
      </tr>
    </tbody>
  </table>

  <div class="bottom-section">
    <div class="left-col">
      <div class="section-label">Invoice Amount In Words</div>
      <div style="font-size: 8.5pt; color: #1e293b; font-weight: 600;">${amountInWords}</div>

      <div class="section-label" style="margin-top: 10px;">Payment mode</div>
      <div style="font-size: 8.5pt; color: #1e293b;">${paymentMode}</div>

      <div class="section-label" style="margin-top: 10px;">Terms and Conditions</div>
      <div style="font-size: 7.5pt; color: #475569; line-height: 1.3;">
        Thanks for doing business with us!<br/>
        NO REPLACEMENT AND NO REFUND FOR FOOD PRODUCTS<br/>
        STAY SAFE AND STAY HOME
      </div>

      <div class="section-label" style="margin-top: 10px;">Payment QRs & Bank Details</div>
      <div style="display: flex; gap: 8px; margin-top: 6px; align-items: flex-start;">
        <!-- QR 1: Real UPI Payment QR -->
        <div style="text-align: center; border: 1px solid #cbd5e1; padding: 4px; border-radius: 6px; background: #ffffff; width: 72px; shrink: 0;">
          <div style="font-size: 5.5pt; font-weight: 800; color: #0f172a; text-transform: uppercase; margin-bottom: 2px;">UPI PAY QR</div>
          <img src="${upiQrImgSrc}" width="62" height="62" style="display: block; margin: 0 auto; border: 1px solid #cbd5e1; border-radius: 3px; background: #fff;" alt="UPI QR" />
          <div style="font-size: 5pt; font-weight: 700; color: #047857; margin-top: 2px;">SCAN TO PAY</div>
          <div style="font-size: 4.8pt; color: #475569; font-family: monospace; text-overflow: ellipsis; overflow: hidden; white-space: nowrap; max-width: 62px;">${upiId}</div>
        </div>

        <!-- QR 2: Real Bill Verification QR -->
        <div style="text-align: center; border: 1px solid #cbd5e1; padding: 4px; border-radius: 6px; background: #ffffff; width: 72px; shrink: 0;">
          <div style="font-size: 5.5pt; font-weight: 800; color: #0f172a; text-transform: uppercase; margin-bottom: 2px;">BILL QR</div>
          <img src="${billQrImgSrc}" width="62" height="62" style="display: block; margin: 0 auto; border: 1px solid #cbd5e1; border-radius: 3px; background: #fff;" alt="Bill QR" />
          <div style="font-size: 5pt; font-weight: 700; color: #1d4ed8; margin-top: 2px;">VERIFIED BILL</div>
          <div style="font-size: 4.8pt; color: #475569; font-family: monospace;">${order.order_number}</div>
        </div>

        <!-- Bank Details -->
        <div style="font-size: 7.2pt; color: #334155; line-height: 1.35; flex: 1; min-width: 0; padding-left: 2px;">
          <strong>Bank :</strong> ${bankName}<br/>
          <strong>Account No. :</strong> ${accountNo}<br/>
          <strong>IFSC code :</strong> ${ifscCode}<br/>
          <strong>Account holder :</strong> ${accountHolder}
        </div>
      </div>
    </div>

    <div class="right-col">
      <div class="section-label" style="text-align: right; border-bottom: 1px solid #cbd5e1; padding-bottom: 2px;">Amounts</div>
      <table class="amounts-table">
        <tr>
          <td>Sub Total</td>
          <td style="text-align: right;">₹ ${subTotal.toFixed(2)}</td>
        </tr>
        <tr>
          <td>DELIVERY:</td>
          <td style="text-align: right;">₹ ${delivery.toFixed(2)}</td>
        </tr>
        <tr class="grand-row">
          <td>Total</td>
          <td style="text-align: right;">₹ ${totalAmount.toFixed(2)}</td>
        </tr>
        <tr>
          <td>Received</td>
          <td style="text-align: right;">₹ ${received.toFixed(2)}</td>
        </tr>
        <tr>
          <td><strong>Balance</strong></td>
          <td style="text-align: right;"><strong>₹ ${balance.toFixed(2)}</strong></td>
        </tr>
      </table>

      <div class="sig-box">
        <div>For : <strong>${bName}</strong></div>
        <div class="sig-name">AbRupendu</div>
        <div style="font-weight: 800; font-size: 8pt; text-transform: uppercase;">AB RUPENDU</div>
      </div>
    </div>
  </div>

  <div class="tear-line"></div>

  <div class="ack-header">
    <strong style="font-size: 8.5pt;">Acknowledgement</strong><br/>
    <strong style="font-size: 10pt; text-transform: uppercase; color: #0f172a;">${bName}</strong>
  </div>

  <table class="ack-table">
    <tr>
      <td>
        <strong>Invoice To:</strong><br/>
        <strong>${custName}</strong><br/>
        ${custAddr}
      </td>
      <td>
        <strong>Invoice Details:</strong><br/>
        Invoice No. : ${order.order_number}<br/>
        Invoice date : ${order.order_date}<br/>
        Invoice Amount : ₹ ${totalAmount.toFixed(2)}
      </td>
      <td style="text-align: right; vertical-align: bottom;">
        <div style="border-top: 1px solid #0f172a; width: 140px; margin-left: auto; text-align: center; padding-top: 2px;">
          Receiver's Seal & Sign
        </div>
      </td>
    </tr>
  </table>

  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 300);
    };
  </script>
</body>
</html>
  `;
}


export async function generate3InchBillHTML(
  order: any,
  customerObj: any,
  businessObj: any,
  products: any[]
): Promise<string> {
  const bName = businessObj?.name || "KOKANASTHA";
  const logoBase64 = businessObj?.logo_url ? await urlToBase64(businessObj.logo_url) : "";
  const bAddress = businessObj?.billing_address || "SHOP NO 7 SITA BLDG MARUTI NAGAR SHIVVALLA\nBH ROAD ASHOKVAN DAHISAR E MUMBAI 68";
  const phone = businessObj?.phone || "8779792825";
  const email = businessObj?.email || "contact@kokanastha.in";

  const custName = customerObj?.name || "Customer";
  const custPhone = customerObj?.phone || "";
  const custAddress = customerObj?.billing_address || "";

  const orderDate = new Date(order.order_date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
  const orderTime = new Date(order.created_at || order.order_date).toLocaleTimeString("en-IN", {
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

    itemsHtml += `
      <tr>
        <td style="vertical-align: top; width: 15px;">${index + 1}</td>
        <td colspan="3">${itemName}</td>
      </tr>
      <tr>
        <td></td>
        <td style="width: 30px;">${qty}</td>
        <td style="text-align: right;">${price.toFixed(2)}</td>
        <td style="text-align: right;">${amount.toFixed(2)}</td>
      </tr>
    `;
  });

  const subTotal = (order.items || []).reduce((sum: number, it: any) => sum + ((it.qty || 1) * (it.selling_price || 0)), 0);
  const delivery = order.shipping_charges || 0;
  const total = order.total_amount || (subTotal + delivery);

  const bankName = businessObj?.bank_name || "NKGSB COOPERATIVE BANK LIMITED, DAHISAR EAST ASHOKVAN";
  const accountNo = businessObj?.account_number || "092110100000085";
  const ifscCode = businessObj?.ifsc_code || "NKGS0000092";
  const accountHolder = businessObj?.account_holder || bName;

  const upiId = businessObj?.upi_id || "9820769697@okicici";
  const upiString = buildUpiPayString({
    upiId,
    businessName: bName,
    amount: total,
    orderNumber: invoiceNo
  });
  
  // Using encodeURIComponent to ensure special chars are handled
  const upiQrImgSrc = await generateQRCodeDataUrl(upiString, { width: 150, margin: 1 });
  
  const billString = buildBillVerificationString({
    orderNumber: invoiceNo,
    amount: total,
    customerName: custName,
    orderDate: order.order_date,
    gstin: businessObj?.gstin
  });
  const billQrImgSrc = await generateQRCodeDataUrl(billString, { width: 150, margin: 1 });

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>3-Inch Bill</title>
  <style>
    @page { margin: 0; }
    body {
      font-family: monospace;
      font-size: 12px;
      line-height: 1.2;
      width: 78mm;
      margin: 0 auto;
      padding: 2mm 4mm;
      color: #000;
      background: #fff;
      box-sizing: border-box;
    }
    .text-center { text-align: center; }
    .text-left { text-align: left; }
    .text-right { text-align: right; }
    .bold { font-weight: bold; }
    .dashed-line {
      border-top: 1px dashed #000;
      margin: 5px 0;
    }
    .header p { margin: 2px 0; }
    .info-table { width: 100%; font-size: 11px; margin-bottom: 5px; }
    .info-table td { vertical-align: top; }
    .items-table { width: 100%; font-size: 11px; margin-bottom: 5px; }
    .items-table td { vertical-align: top; padding: 2px 0; }
    .totals-table { width: 100%; font-size: 12px; font-weight: bold; margin-bottom: 5px; }
    .totals-table td { padding: 2px 0; }
    .qr-container { display: flex; justify-content: space-around; margin: 10px 0; }
    .qr-box { text-align: center; }
    .qr-box img { width: 65px; height: 65px; margin: 0 auto; display: block; }
    .qr-box div { font-size: 10px; margin-top: 2px; }
    .footer { font-size: 10px; margin-top: 5px; }
    .footer p { margin: 2px 0; }
  </style>
</head>
<body>
  <div class="header text-center bold">
    <div style="font-size: 16px; margin-bottom: 2px;">${bName}</div>
    <p style="font-size: 10px;">${bAddress.replace(/\n/g, "<br>")}</p>
    <p style="font-size: 10px;">Ph. No.: ${phone}</p>
    <p style="font-size: 10px;">Email: ${email}</p>
    <div style="margin: 5px 0;">Bill of Supply</div>
  </div>

  <table class="info-table">
    <tr>
      <td style="width: 50%;">
        <div>${custName}</div>
        <div>Ph. No: ${custPhone}</div>
        <div>Bill To:</div>
        <div>${custAddress}</div>
      </td>
      <td style="width: 50%; text-align: right;">
        <div>Date: ${orderDate}</div>
        <div>Time: ${orderTime}</div>
        <div>Invoice No.: ${invoiceNo}</div>
      </td>
    </tr>
  </table>

  <div class="dashed-line"></div>
  <table class="items-table">
    <tr class="bold">
      <td style="width: 15px;">#</td>
      <td>Item Name</td>
      <td style="width: 30px; text-align: right;"></td>
      <td style="text-align: right;">Price</td>
      <td style="text-align: right;">Amount</td>
    </tr>
    <tr>
      <td></td>
      <td>Qty</td>
      <td colspan="3"></td>
    </tr>
    <div class="dashed-line"></div>
    ${itemsHtml}
  </table>
  <div class="dashed-line"></div>

  <table class="totals-table">
    <tr>
      <td>Qty: ${totalQty}</td>
      <td style="text-align: right; font-weight: normal;">DELIVERY</td>
      <td style="text-align: right; width: 60px;">${delivery.toFixed(2)}</td>
    </tr>
    <tr>
      <td></td>
      <td style="text-align: right;">Total</td>
      <td style="text-align: right;">${total.toFixed(2)}</td>
    </tr>
    <tr>
      <td></td>
      <td style="text-align: right; font-weight: normal;">Received</td>
      <td style="text-align: right;">0.00</td>
    </tr>
    <tr>
      <td></td>
      <td style="text-align: right;">Balance</td>
      <td style="text-align: right;">${total.toFixed(2)}</td>
    </tr>
  </table>
  <div class="dashed-line"></div>
  <div class="text-center bold" style="margin-top: 5px;">
    Available Points &nbsp;&nbsp;&nbsp;&nbsp; 0.00
  </div>

  <div class="qr-container">
    <div class="qr-box">
      <img src="${upiQrImgSrc}" alt="UPI QR" />
      <div>Scan to pay (UPI)</div>
    </div>
    <div class="qr-box">
      <img src="${billQrImgSrc}" alt="Bill QR" />
      <div>Scan for Bill</div>
    </div>
  </div>

  <div class="dashed-line"></div>
  <div class="footer bold">
    <div>Bank Details</div>
    <div style="font-weight: normal;">
      Bank Name: ${bankName}<br>
      A/C Holder: ${accountHolder}<br>
      A/C No: ${accountNo}<br>
      IFSC Code: ${ifscCode}
    </div>
  </div>

  <div class="dashed-line"></div>
  <div class="footer bold">
    <div>Terms & Conditions</div>
    <div style="font-weight: normal;">
      Thanks for doing business with us!<br>
      NO REPLACEMENT AND NO REFUND FOR FOOD PRODUCTS<br>
      STAY SAFE AND STAY HOME
    </div>
  </div>
  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 300);
    };
  </script>
</body>
</html>
  `;
}
