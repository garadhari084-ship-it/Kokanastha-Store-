import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { SalesOrder, Customer, Business, Product } from '../types/erp';
import { numberToWordsIndian } from '../utils/invoiceTemplate';
import { buildUpiPayString, buildBillVerificationString } from '../utils/qrCode';
import { formatOrderTime } from '../utils/formatters';
import { calculateOrderSavings } from '../utils/pricing';

interface BillOfSupplyViewProps {
  order: SalesOrder;
  customer?: Customer;
  businessObj?: Business;
  products?: Product[];
}

export const BillOfSupplyView: React.FC<BillOfSupplyViewProps> = ({
  order,
  customer,
  businessObj,
  products = []
}) => {
  const cur = businessObj?.currency_default;
  const currencySymbol = cur ? (cur.includes(' - ') ? cur.split(' - ')[0].trim() : cur.trim()) : '₹';

  const items = order.items || [];
  const subTotal = items.reduce((sum, it) => sum + ((it.qty || 1) * (it.selling_price || 0)), 0);
  const discount = order.discount_amount || 0;
  
  const additionalCharges = order.additional_charges || 0;
  const deliveryCharges = order.delivery_charges || 0;
  let legacyDelivery = 0;
  if (additionalCharges === 0 && deliveryCharges === 0) {
    legacyDelivery = (order.total_amount > (subTotal - discount) ? (order.total_amount - (subTotal - discount)) : 0);
  }
  const totalAmount = order.total_amount || (subTotal + additionalCharges + deliveryCharges + legacyDelivery - discount);
  const totalQty = items.reduce((sum, it) => sum + (it.qty || 0), 0);
  const amountInWords = numberToWordsIndian(totalAmount);

  const received = typeof order.paid_amount === 'number' 
    ? order.paid_amount 
    : (order.payment_status === 'Paid' ? totalAmount : 0);
  const balance = Math.max(0, totalAmount - received);
  const paymentMode = order.payment_mode || (order.payment_status === 'Paid' ? 'Online / Paid' : 'Credit / Pending');

  const custName = customer?.name || order.customer_name || 'SMITA NAYAK';
  const custAddr = customer?.billing_address || (order.area ? `${order.area} Zone, Mumbai` : 'ARYAVARTA B 406');
  const custPhone = customer?.phone || (order as any).phone || '8779792825';

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

  const [upiQrImgSrc, setUpiQrImgSrc] = useState('');
  const [billQrImgSrc, setBillQrImgSrc] = useState('');

  useEffect(() => {
    QRCode.toDataURL(upiString, { width: 220, margin: 1 }).then(setUpiQrImgSrc).catch(console.error);
    QRCode.toDataURL(billString, { width: 220, margin: 1 }).then(setBillQrImgSrc).catch(console.error);
  }, [upiString, billString]);

  const bankName = businessObj?.bank_name || 'NKGSB COOPERATIVE BANK LIMITED, DAHISAR EAST ASHOKVAN';
  const accountNo = businessObj?.account_number || '092110100000085';
  const ifscCode = businessObj?.ifsc_code || 'NKGS0000092';
  const accountHolder = businessObj?.account_holder || bName;

  const savingsInfo = calculateOrderSavings(items, products);

  return (
    <div className="bg-white text-slate-900 px-0.5 sm:px-1 py-6 sm:py-8 font-sans text-[11px] leading-relaxed shadow-lg max-w-2xl mx-auto rounded-xl border border-slate-200 print:border-none print:shadow-none print:max-w-none print:w-full print:p-0">
      
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-4">
          {businessObj?.logo_url && (
            <img 
              src={businessObj.logo_url} 
              alt={bName} 
              className="w-24 h-auto max-h-24 object-contain" 
            />
          )}
          <div className="text-left space-y-1">
            <h1 className="text-xl font-black tracking-wide text-slate-950 uppercase m-0 leading-tight">
              {bName}
            </h1>
            <p className="text-[10px] text-slate-600 font-medium max-w-sm leading-tight">
              {bAddress}
            </p>
            {businessObj?.mobile_number && (
              <p className="text-[10px] text-slate-700 font-medium flex items-center gap-1 leading-tight">
                <span className="text-emerald-600"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21"/><path d="M9 10a.5 5 0 0 0 1 0V9a.5 5 0 0 0-1 0v1Z"/><path d="M14 14a.5 5 0 0 0 1 0v-1a.5 5 0 0 0-1 0v1Z"/></svg></span>
                {businessObj.mobile_number}
              </p>
            )}
            {businessObj?.fssai_number && (
              <p className="text-[10px] text-slate-700 font-bold leading-tight">
                FSSAI No: {businessObj.fssai_number}
              </p>
            )}
          </div>
        </div>
        <div className="text-right text-[9px] font-bold text-slate-500 uppercase tracking-wider">
          ORIGINAL FOR RECIPIENT
        </div>
      </div>

      {/* Double Border Divider */}
      <div className="border-t-2 border-slate-950 my-2"></div>

      {/* Title */}
      <div className="text-center font-black text-sm text-slate-950 mb-3">
        Bill of Supply
      </div>

      {/* Metadata 3-col Grid */}
      <div className="grid grid-cols-3 gap-3 mb-4 text-[10.5px]">
        <div>
          <div className="font-extrabold text-slate-900 border-b border-slate-300 pb-1 mb-1 uppercase text-[9px] tracking-wide">
            Bill To
          </div>
          <div className="text-slate-800">
            <strong className="block text-slate-950 font-bold">{custName}</strong>
            <span className="block text-slate-600">{custAddr}</span>
            <span className="block text-slate-600 mt-0.5">Contact No. : {custPhone}</span>
          </div>
        </div>

        <div>
          <div className="font-extrabold text-slate-900 border-b border-slate-300 pb-1 mb-1 uppercase text-[9px] tracking-wide">
            Transportation Details
          </div>
          <div className="text-slate-700 space-y-0.5">
            <div><span className="text-slate-500">Transport Name:</span> {order.delivery_type && order.delivery_type.toLowerCase().includes('courier') ? 'Global Courier' : 'Direct Express'}</div>
            <div><span className="text-slate-500">Delivery Date:</span> {order.delivery_date || order.order_date}</div>
            <div><span className="text-slate-500">Delivery Location:</span> {order.area || 'Dahisar'}</div>
            <div><span className="text-slate-500">Delivery Type:</span> {order.delivery_type || 'Local Dispatch'}</div>
          </div>
        </div>

        <div>
          <div className="font-extrabold text-slate-900 border-b border-slate-300 pb-1 mb-1 uppercase text-[9px] tracking-wide">
            Invoice Details
          </div>
          <div className="text-slate-700 space-y-0.5 font-mono text-[10px]">
            <div><span className="text-slate-500 font-sans">Invoice No. :</span> <strong className="text-slate-950 font-bold">{order.order_number}</strong></div>
            <div><span className="text-slate-500 font-sans">Date :</span> {order.order_date}</div>
            <div><span className="text-slate-500 font-sans">Time :</span> {formatOrderTime(order.time, order.created_at)}</div>
          </div>
        </div>
      </div>

      {/* Savings Highlight Banner */}
      {savingsInfo.totalSavings > 0 && (
        <div className="mb-3 px-3 py-1.5 bg-emerald-50 border border-emerald-300 rounded-lg text-emerald-950 font-bold text-center text-[11px] flex items-center justify-center gap-2">
          <span className="text-sm">🎉</span>
          <span>{savingsInfo.bannerMessage}</span>
          <span className="text-[9px] font-mono text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-200">
            Saved {currencySymbol}{savingsInfo.totalSavings.toLocaleString()}
          </span>
        </div>
      )}

      {/* Table */}
      <div className="border-y border-slate-950 mb-4 overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-950 text-[10px] font-black uppercase text-slate-950">
              <th className="py-2 px-1 text-center w-8">#</th>
              <th className="py-2 px-2">Item name</th>
              <th className="py-2 px-2 text-center">Item Code</th>
              <th className="py-2 px-2 text-center">Quantity</th>
              <th className="py-2 px-2 text-right">Normal Rate</th>
              <th className="py-2 px-2 text-right">Applied Rate</th>
              <th className="py-2 px-2 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-[10.5px]">
            {items.map((it, idx) => {
              const p = products.find(prod => prod.id === it.product_id);
              const itemCode = p?.barcode || p?.sku || p?.hsn_code || '38655039462';
              const itemName = p?.name || 'Faral / Sweet Item';
              const price = it.selling_price || 0;
              const normalRate = typeof it.normal_rate === 'number' && !isNaN(it.normal_rate) && it.normal_rate > 0 
                ? it.normal_rate 
                : (p ? (typeof p.selling_price === 'number' ? p.selling_price : price) : price);
              const qty = it.qty || 1;
              const amount = qty * price;

              return (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="py-1.5 px-1 text-center font-mono text-slate-500">{idx + 1}</td>
                  <td className="py-1.5 px-2 font-extrabold text-slate-900 uppercase">
                    <div>{itemName}</div>
                    {it.rate_reason && normalRate > price && (
                      <span className="text-[8.5px] font-semibold text-emerald-700 block">
                        ✓ {it.rate_reason}
                      </span>
                    )}
                  </td>
                  <td className="py-1.5 px-2 text-center font-mono text-slate-600">{itemCode}</td>
                  <td className="py-1.5 px-2 text-center font-bold text-slate-900">{qty}</td>
                  <td className="py-1.5 px-2 text-right font-mono text-slate-500">
                    {normalRate > price ? (
                      <span className="line-through text-slate-400">{currencySymbol} {normalRate.toFixed(2)}</span>
                    ) : (
                      <span>{currencySymbol} {normalRate.toFixed(2)}</span>
                    )}
                  </td>
                  <td className="py-1.5 px-2 text-right font-mono font-bold text-slate-900">
                    {currencySymbol} {price.toFixed(2)}
                  </td>
                  <td className="py-1.5 px-2 text-right font-mono font-black text-slate-950">{currencySymbol} {amount.toFixed(2)}</td>
                </tr>
              );
            })}
            <tr className="border-t border-b border-slate-950 font-black text-slate-950 text-[11px]">
              <td colSpan={3} className="py-2 px-2">Total</td>
              <td className="py-2 px-2 text-center">{totalQty}</td>
              <td></td>
              <td></td>
              <td className="py-2 px-2 text-right font-mono">{currencySymbol} {subTotal.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Bottom Section 2-Column Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 text-[10.5px]">
        {/* Left Side */}
        <div className="sm:col-span-7 space-y-3">
          <div>
            <div className="font-extrabold text-slate-900 uppercase text-[9px]">Invoice Amount In Words</div>
            <div className="font-bold text-slate-900 italic mt-0.5">{amountInWords}</div>
          </div>

          <div>
            <div className="font-extrabold text-slate-900 uppercase text-[9px]">Payment mode</div>
            <div className="font-semibold text-slate-800">{paymentMode}</div>
          </div>

          <div>
            <div className="font-extrabold text-slate-900 uppercase text-[9px]">Terms and Conditions</div>
            <div className="text-[9.5px] text-slate-600 space-y-0.5 mt-0.5">
              <p>Thanks for doing business with us!</p>
              <p className="font-bold">NO REPLACEMENT AND NO REFUND FOR FOOD PRODUCTS</p>
              <p>STAY SAFE AND STAY HOME</p>
            </div>
          </div>

          <div>
            <div className="font-extrabold text-slate-900 uppercase text-[9px] mb-1">Payment QRs & Bank Details</div>
            <div className="flex items-start gap-2 text-[9px] text-slate-700 bg-slate-50 p-2 rounded border border-slate-200">
              {/* UPI QR */}
              <div className="text-center bg-white border border-slate-300 rounded p-1 shrink-0 w-20">
                <div className="text-[7.5px] font-black uppercase text-slate-900 leading-none mb-0.5">UPI PAY</div>
                {upiQrImgSrc ? (
                  <img src={upiQrImgSrc} alt="UPI QR" className="w-16 h-16 mx-auto border rounded border-slate-200" />
                ) : (
                  <div className="w-16 h-16 mx-auto border rounded border-slate-200 bg-slate-100" />
                )}
                <div className="text-[6.5px] font-bold text-emerald-700 mt-0.5">SCAN TO PAY</div>
                <div className="text-[5.5px] font-mono text-slate-500 truncate max-w-[64px] mx-auto">{upiId}</div>
              </div>

              {/* Bill QR */}
              <div className="text-center bg-white border border-slate-300 rounded p-1 shrink-0 w-20">
                <div className="text-[7.5px] font-black uppercase text-slate-900 leading-none mb-0.5">BILL QR</div>
                {billQrImgSrc ? (
                  <img src={billQrImgSrc} alt="Bill QR" className="w-16 h-16 mx-auto border rounded border-slate-200" />
                ) : (
                  <div className="w-16 h-16 mx-auto border rounded border-slate-200 bg-slate-100" />
                )}
                <div className="text-[6.5px] font-bold text-blue-700 mt-0.5">VERIFIED</div>
                <div className="text-[5.5px] font-mono text-slate-500 truncate max-w-[64px] mx-auto">{order.order_number}</div>
              </div>

              {/* Bank Details */}
              <div className="space-y-0.5 text-[8.5px] leading-tight shrink min-w-0 pl-1">
                <div><strong>Bank :</strong> {bankName}</div>
                <div><strong>Account No. :</strong> {accountNo}</div>
                <div><strong>IFSC code :</strong> {ifscCode}</div>
                <div><strong>A/C Holder :</strong> {accountHolder}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side */}
        <div className="sm:col-span-5 flex flex-col justify-between">
          <div className="space-y-1.5 border-t sm:border-t-0 border-slate-300 pt-2 sm:pt-0">
            <div className="font-extrabold text-slate-900 uppercase text-[9px] border-b border-slate-300 pb-0.5 mb-1 text-right">Amounts</div>
            <div className="flex justify-between font-mono">
              <span className="font-sans text-slate-600">Sub Total</span>
              <span>{currencySymbol} {subTotal.toFixed(2)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between font-mono text-rose-600">
                <span className="font-sans">Discount</span>
                <span>{order.discount_percentage ? `-${order.discount_percentage}%` : `-${currencySymbol} ${discount.toFixed(2)}`}</span>
              </div>
            )}
            {order.points_redeemed !== undefined && order.points_redeemed > 0 && (
              <div className="flex justify-between font-mono text-amber-800 font-bold bg-amber-50/80 px-1 py-0.5 rounded border border-amber-200">
                <span className="font-sans">Loyalty Points Redeemed</span>
                <span>-{order.points_redeemed} Pts</span>
              </div>
            )}
            {order.points_redeemed !== undefined && order.points_redeemed > 0 && customer && (
              <div className="flex justify-between font-mono text-emerald-800 font-medium text-[9.5px] px-1 py-0.5">
                <span className="font-sans text-slate-500">Remaining Loyalty Points</span>
                <span>{(customer.loyalty_points || 0).toLocaleString()} Pts</span>
              </div>
            )}
            {legacyDelivery > 0 && (
              <div className="flex justify-between font-mono text-slate-600">
                <span className="font-sans uppercase">DELIVERY:</span>
                <span>{currencySymbol} {legacyDelivery.toFixed(2)}</span>
              </div>
            )}
            {deliveryCharges > 0 && (
              <div className="flex justify-between font-mono text-slate-600">
                <span className="font-sans uppercase">Delivery Charges:</span>
                <span>{currencySymbol} {deliveryCharges.toFixed(2)}</span>
              </div>
            )}
            {additionalCharges > 0 && (
              <div className="flex justify-between font-mono text-slate-600">
                <span className="font-sans uppercase">Additional Charges:</span>
                <span>{currencySymbol} {additionalCharges.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-mono font-black border-y border-slate-950 py-1 text-slate-950 text-xs">
              <span className="font-sans">Total</span>
              <span>{currencySymbol} {totalAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-mono text-slate-600">
              <span className="font-sans">Received</span>
              <span>{currencySymbol} {received.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-mono font-extrabold text-slate-900 border-b border-slate-300 pb-1">
              <span className="font-sans">Balance</span>
              <span>{currencySymbol} {balance.toFixed(2)}</span>
            </div>
          </div>

          <div className="text-right mt-6 pt-2">
            <div className="text-xs text-slate-800">For : <strong>{bName}</strong></div>
            <div className="font-serif italic text-lg text-slate-900 my-1 font-bold">AbRupendu</div>
            <div className="font-extrabold text-[10px] uppercase tracking-wide text-slate-900">AB RUPENDU</div>
          </div>
        </div>
      </div>

      {/* Dotted Tear-off Line */}
      <div className="border-t border-dashed border-slate-400 my-6"></div>

      {/* Acknowledgement Header */}
      <div className="text-center mb-3">
        <div className="font-bold text-[10px] uppercase tracking-wider text-slate-700">Acknowledgement</div>
        <h2 className="font-black text-sm uppercase text-slate-950 m-0">{bName}</h2>
      </div>

      {/* Acknowledgement 3-col Grid */}
      <div className="grid grid-cols-3 gap-3 text-[10px]">
        <div>
          <strong className="block font-bold text-slate-900">Invoice To:</strong>
          <span className="block font-bold text-slate-950">{custName}</span>
          <span className="block text-slate-600">{custAddr}</span>
        </div>

        <div>
          <strong className="block font-bold text-slate-900">Invoice Details:</strong>
          <div className="font-mono text-slate-700 space-y-0.5">
            <div>Invoice No. : {order.order_number}</div>
            <div>Invoice date : {order.order_date}</div>
            <div>Invoice Amount : {currencySymbol} {totalAmount.toFixed(2)}</div>
          </div>
        </div>

        <div className="flex flex-col justify-end text-right">
          <div className="border-t border-slate-900 pt-1 text-center font-bold text-slate-800 w-36 ml-auto">
            Receiver's Seal & Sign
          </div>
        </div>
      </div>

    </div>
  );
};
