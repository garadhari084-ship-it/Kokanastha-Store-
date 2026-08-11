const fs = require('fs');
let content = fs.readFileSync('src/utils/invoiceTemplate.ts', 'utf8');

const regex = /const upiPayString = buildUpiPayString\([\s\S]*?const upiQrImgSrc = await generateQRCodeDataUrl\(upiPayString, { width: 220, margin: 1 }\);/;

const newImplementation = `const upiPayString = buildUpiPayString({
    upiId,
    businessName: bName,
    amount: total,
    orderNumber: invoiceNo
  });
  const upiQrImgSrc = await generateQRCodeDataUrl(upiPayString, { width: 220, margin: 1 });

  const custName = customerObj?.name || 'Cash Customer';
  const billString = buildBillVerificationString({
    orderNumber: invoiceNo,
    orderDate: order.order_date,
    amount: total,
    customerName: custName,
    businessName: bName,
    gstin: businessObj?.gstin
  });
  const billQrImgSrc = await generateQRCodeDataUrl(billString, { width: 220, margin: 1 });`;

if (content.match(regex)) {
  content = content.replace(regex, newImplementation);
  
  const qrHtmlRegex = /<div class="text-center" style="margin: 12px 0;">\s*<img src="\${upiQrImgSrc}" alt="UPI QR Code" style="width: 45mm; height: 45mm; margin: 0 auto; display: block;" \/>\s*<div style="font-size: 12px; font-weight: 900; margin-top: 6px;">Scan this QR Code to pay<\/div>\s*<\/div>/;
  
  const qrHtmlReplacement = `<div class="text-center" style="margin: 8px 0;">
    <div style="display: flex; justify-content: center; gap: 4px; align-items: flex-start;">
      <div style="flex: 1; text-align: center;">
        <img src="\${upiQrImgSrc}" alt="UPI QR Code" style="width: 33mm; height: 33mm; margin: 0 auto; display: block;" />
        <div style="font-size: 8px; font-weight: 900; margin-top: 2px;">SCAN TO PAY</div>
      </div>
      <div style="flex: 1; text-align: center;">
        <img src="\${billQrImgSrc}" alt="Bill QR Code" style="width: 33mm; height: 33mm; margin: 0 auto; display: block;" />
        <div style="font-size: 8px; font-weight: 900; margin-top: 2px;">VERIFIED BILL</div>
      </div>
    </div>
  </div>`;
  
  if (content.match(qrHtmlRegex)) {
    content = content.replace(qrHtmlRegex, qrHtmlReplacement);
    fs.writeFileSync('src/utils/invoiceTemplate.ts', content);
    console.log('Success');
  } else {
    console.log('HTML Regex did not match');
  }
} else {
  console.log('Regex did not match');
}
