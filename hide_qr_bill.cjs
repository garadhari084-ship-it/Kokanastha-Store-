const fs = require('fs');
let content = fs.readFileSync('src/components/BillOfSupplyView.tsx', 'utf-8');

const target = `{/* UPI QR */}
              <div className="text-center bg-white border border-slate-300 rounded-md p-1 shrink-0 w-20 shadow-2xs">`;

const replacement = `{/* UPI QR */}
              {order.payment_status !== 'Paid' && (
                <div className="text-center bg-white border border-slate-300 rounded-md p-1 shrink-0 w-20 shadow-2xs">
                  <div className="text-[7.5px] font-black uppercase text-slate-900 leading-none mb-0.5">UPI PAY QR</div>
                  {upiQrImgSrc ? (
                    <img src={upiQrImgSrc} alt="UPI QR" className="w-16 h-16 mx-auto border rounded border-slate-200" />
                  ) : (
                    <div className="w-16 h-16 mx-auto border rounded border-slate-200 bg-slate-100" />
                  )}
                  <div className="text-[6.5px] font-bold text-emerald-700 mt-0.5">SCAN TO PAY</div>
                  <div className="text-[5.5px] font-mono text-slate-500 truncate max-w-[64px] mx-auto">{upiId}</div>
                </div>
              )}`;

const originalBlock = `{/* UPI QR */}
              <div className="text-center bg-white border border-slate-300 rounded-md p-1 shrink-0 w-20 shadow-2xs">
                <div className="text-[7.5px] font-black uppercase text-slate-900 leading-none mb-0.5">UPI PAY QR</div>
                {upiQrImgSrc ? (
                  <img src={upiQrImgSrc} alt="UPI QR" className="w-16 h-16 mx-auto border rounded border-slate-200" />
                ) : (
                  <div className="w-16 h-16 mx-auto border rounded border-slate-200 bg-slate-100" />
                )}
                <div className="text-[6.5px] font-bold text-emerald-700 mt-0.5">SCAN TO PAY</div>
                <div className="text-[5.5px] font-mono text-slate-500 truncate max-w-[64px] mx-auto">{upiId}</div>
              </div>`;


if (content.includes(originalBlock)) {
  content = content.replace(originalBlock, replacement);
  fs.writeFileSync('src/components/BillOfSupplyView.tsx', content);
} else {
  console.log("Could not find QR block in BillOfSupplyView.tsx");
}
