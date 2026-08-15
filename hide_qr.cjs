const fs = require('fs');
let content = fs.readFileSync('src/utils/invoiceTemplate.ts', 'utf-8');

// The block starts with <div class="section-label" style="margin-top: 10px;">Payment QRs & Bank Details</div>
// Let's conditionally render the UPI QR code

const qrBlock = `      <div class="section-label" style="margin-top: 10px;">Payment QRs & Bank Details</div>
      <div style="display: flex; gap: 24px; margin-top: 6px; align-items: flex-start;">
        <!-- QR 1: Real UPI Payment QR -->
        <div style="text-align: center; border: 1px solid #cbd5e1; padding: 4px; border-radius: 6px; background: #ffffff; width: 80px; shrink: 0;">
          <div style="font-size: 6pt; font-weight: 800; color: #0f172a; text-transform: uppercase; margin-bottom: 2px;">UPI PAY QR</div>
          <img src="\${upiQrImgSrc}" width="72" height="72" style="display: block; margin: 0 auto; border: 1px solid #cbd5e1; border-radius: 3px; background: #fff;" alt="UPI QR" />
          <div style="font-size: 5.5pt; font-weight: 700; color: #047857; margin-top: 2px;">SCAN TO PAY</div>
          <div style="font-size: 5pt; color: #475569; font-family: monospace; text-overflow: ellipsis; overflow: hidden; white-space: nowrap; max-width: 72px;">\${upiId}</div>
        </div>`;

const newQrBlock = `      <div class="section-label" style="margin-top: 10px;">Payment QRs & Bank Details</div>
      <div style="display: flex; gap: 24px; margin-top: 6px; align-items: flex-start;">
        \${order.payment_status !== 'Paid' ? \`<!-- QR 1: Real UPI Payment QR -->
        <div style="text-align: center; border: 1px solid #cbd5e1; padding: 4px; border-radius: 6px; background: #ffffff; width: 80px; shrink: 0;">
          <div style="font-size: 6pt; font-weight: 800; color: #0f172a; text-transform: uppercase; margin-bottom: 2px;">UPI PAY QR</div>
          <img src="\${upiQrImgSrc}" width="72" height="72" style="display: block; margin: 0 auto; border: 1px solid #cbd5e1; border-radius: 3px; background: #fff;" alt="UPI QR" />
          <div style="font-size: 5.5pt; font-weight: 700; color: #047857; margin-top: 2px;">SCAN TO PAY</div>
          <div style="font-size: 5pt; color: #475569; font-family: monospace; text-overflow: ellipsis; overflow: hidden; white-space: nowrap; max-width: 72px;">\${upiId}</div>
        </div>\` : ''}`;

if (content.includes(qrBlock)) {
  content = content.replace(qrBlock, newQrBlock);
  fs.writeFileSync('src/utils/invoiceTemplate.ts', content);
} else {
  console.log("Could not find QR block in invoiceTemplate.ts");
}
