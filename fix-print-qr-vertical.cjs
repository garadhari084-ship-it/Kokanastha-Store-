const fs = require('fs');
let content = fs.readFileSync('src/utils/invoiceTemplate.ts', 'utf8');

const regex = /<div class="text-center" style="margin: 8px 0;">\s*<div style="display: flex; justify-content: center; gap: 4px; align-items: flex-start;">\s*<div style="flex: 1; text-align: center;">\s*<img src="\${upiQrImgSrc}" alt="UPI QR Code" style="width: 33mm; height: 33mm; margin: 0 auto; display: block;" \/>\s*<div style="font-size: 8px; font-weight: 900; margin-top: 2px;">SCAN TO PAY<\/div>\s*<\/div>\s*<div style="flex: 1; text-align: center;">\s*<img src="\${billQrImgSrc}" alt="Bill QR Code" style="width: 33mm; height: 33mm; margin: 0 auto; display: block;" \/>\s*<div style="font-size: 8px; font-weight: 900; margin-top: 2px;">VERIFIED BILL<\/div>\s*<\/div>\s*<\/div>\s*<\/div>/g;

const newImplementation = `<div class="text-center" style="margin: 8px 0;">
    <div style="margin-bottom: 12px;">
      <img src="\${upiQrImgSrc}" alt="UPI QR Code" style="width: 40mm; height: 40mm; margin: 0 auto; display: block;" />
      <div style="font-size: 11px; font-weight: 900; margin-top: 4px;">SCAN TO PAY VIA UPI</div>
    </div>
    
    <div class="dashed-line" style="margin: 10px 0;"></div>
    
    <div style="margin-top: 10px;">
      <img src="\${billQrImgSrc}" alt="Bill QR Code" style="width: 30mm; height: 30mm; margin: 0 auto; display: block;" />
      <div style="font-size: 9px; font-weight: 900; margin-top: 4px;">VERIFIED BILL QR</div>
    </div>
  </div>`;

if (content.match(regex)) {
  content = content.replace(regex, newImplementation);
  fs.writeFileSync('src/utils/invoiceTemplate.ts', content);
  console.log('Success');
} else {
  console.log('Regex did not match');
}
