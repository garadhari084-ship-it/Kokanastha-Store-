import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { SalesOrder, Customer, Business, Product } from '../types/erp';
import { numberToWordsIndian } from '../utils/invoiceTemplate';
import { buildUpiPayString, buildBillVerificationString, generateQRCodeDataUrl } from '../utils/qrCode';
import { formatOrderTime } from '../utils/formatters';
import { calculateOrderSavings } from '../utils/pricing';
import { dbStore } from '../services/store';
import { safeStorage } from '../utils/safeStorage';

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

  const allAvailableProds = [
    ...(Array.isArray(products) ? products : []),
    ...dbStore.getProducts(order.business_id || businessObj?.id || ''),
    ...((dbStore as any).cache?.products || [])
  ];

  let rawItems = order.items || (order as any).order_items || (order as any).orderItems || (order as any).sales_order_items;
  if (typeof rawItems === 'string') {
    try { rawItems = JSON.parse(rawItems); } catch(e) { rawItems = []; }
  }
  let items = Array.isArray(rawItems) ? rawItems : [];
  if (items.length === 0 && (order.id || order.order_number)) {
    const cachedOrder = dbStore.getSalesOrders(order.business_id || businessObj?.id || '').find(o => (order.id && o.id === order.id) || (order.order_number && o.order_number === order.order_number));
    if (cachedOrder && Array.isArray(cachedOrder.items) && cachedOrder.items.length > 0) {
      items = cachedOrder.items;
    }
  }
  if (items.length === 0 && (order.id || order.order_number)) {
    try {
      const rawSales = JSON.parse(safeStorage.getItem('omnipack_erp_sales') || '[]');
      const match = rawSales.find((o: any) => (order.id && o.id === order.id) || (order.order_number && o.order_number === order.order_number));
      if (match && Array.isArray(match.items) && match.items.length > 0) {
        items = match.items;
      }
    } catch(e) {}
  }
  const subTotal = items.reduce((sum, it) => sum + ((Number(it.qty) || 1) * (Number(it.selling_price) || 0)), 0);
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

  const rawPaid = order.paid_amount ?? (order as any).paidAmount ?? (order as any).advance_amount ?? (order as any).advance;
  const numPaid = typeof rawPaid === 'number' ? rawPaid : (typeof rawPaid === 'string' && rawPaid.trim() !== '' && !isNaN(Number(rawPaid)) ? Number(rawPaid) : undefined);
  const paidVal = numPaid !== undefined ? numPaid : (order.payment_status === 'Paid' ? totalAmount : 0);
  const received = order.payment_status === 'Paid' ? Math.max(paidVal, totalAmount) : paidVal;
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
    gstin: businessObj?.gstin,
    upiId,
    items: items.map(it => {
      const p = allAvailableProds.find(prod => 
        prod.id === it.product_id || 
        ((it as any).barcode && prod.barcode === (it as any).barcode) || 
        ((it as any).product_name && prod.name === (it as any).product_name)
      );
      return {
        name: (it as any).product_name || (it as any).name || p?.name || 'Faral Item',
        qty: it.qty,
        unit_price: it.selling_price || 0,
        total_price: (it as any).total_price || (it.qty * (it.selling_price || 0))
      };
    }),
    paymentMode
  });

  const [upiQrImgSrc, setUpiQrImgSrc] = useState('');
  const [billQrImgSrc, setBillQrImgSrc] = useState('');

  useEffect(() => {
    generateQRCodeDataUrl(upiString, { width: 250, margin: 1 }).then(setUpiQrImgSrc).catch(console.error);
    generateQRCodeDataUrl(billString, { width: 250, margin: 1 }).then(setBillQrImgSrc).catch(console.error);
  }, [upiString, billString]);

  const bankName = businessObj?.bank_name || 'NKGSB COOPERATIVE BANK LIMITED, DAHISAR EAST ASHOKVAN';
  const accountNo = businessObj?.account_number || '092110100000085';
  const ifscCode = businessObj?.ifsc_code || 'NKGS0000092';
  const accountHolder = businessObj?.account_holder || bName;

  const savingsInfo = calculateOrderSavings(items, allAvailableProds);

  return (
    <div className="bg-white text-slate-900 px-4 sm:px-8 py-6 sm:py-8 font-sans text-xs sm:text-sm leading-relaxed shadow-lg max-w-4xl mx-auto rounded-xl border border-slate-200 print:border-none print:shadow-none print:max-w-none print:w-full print:p-0">
      
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-5">
          {businessObj?.logo_url && (
            <img 
              src={businessObj.logo_url} 
              alt={bName} 
              className="w-28 h-auto max-h-28 object-contain" 
            />
          )}
          <div className="text-left space-y-1">
            <h1 className="text-2xl sm:text-3xl font-black tracking-wide text-slate-950 uppercase m-0 leading-tight">
              {bName}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 font-medium max-w-md leading-snug">
              {bAddress}
            </p>
            <div className="text-xs text-emerald-600 font-bold flex items-center gap-1 leading-tight mt-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
              </svg>
              9820769697
            </div>
            {businessObj?.fssai_number && (
              <p className="text-xs text-slate-700 font-bold leading-tight">
                FSSAI No: {businessObj.fssai_number}
              </p>
            )}
          </div>
        </div>
        <div className="text-right text-xs font-extrabold text-slate-600 uppercase tracking-wider">
          ORIGINAL FOR RECIPIENT
        </div>
      </div>

      {/* Double Border Divider */}
      <div className="border-t-2 border-slate-950 my-3"></div>

      {/* Title */}
      <div className="text-center font-black text-base sm:text-lg text-slate-950 mb-4 tracking-wide uppercase">
        Bill of Supply
      </div>

      {/* Metadata 3-col Grid */}
      <div className="grid grid-cols-3 gap-4 mb-5 text-xs sm:text-sm">
        <div>
          <div className="font-black text-slate-900 border-b-2 border-slate-300 pb-1 mb-1.5 uppercase text-xs tracking-wider">
            Bill To
          </div>
          <div className="text-slate-800 space-y-0.5">
            <strong className="block text-slate-950 font-black text-sm">{custName}</strong>
            <span className="block text-slate-700 leading-snug">{custAddr}</span>
            <span className="block text-slate-700 font-bold mt-1">Contact No. : {custPhone}</span>
          </div>
        </div>

        <div>
          <div className="font-black text-slate-900 border-b-2 border-slate-300 pb-1 mb-1.5 uppercase text-xs tracking-wider">
            Transportation Details
          </div>
          <div className="text-slate-800 space-y-1">
            <div><span className="text-slate-500 font-medium">Transport Name:</span> <span className="font-semibold">{order.delivery_type && order.delivery_type.toLowerCase().includes('courier') ? 'Global Courier' : 'Direct Express'}</span></div>
            <div><span className="text-slate-500 font-medium">Delivery Date:</span> <span className="font-semibold">{order.delivery_date || order.order_date}</span></div>
            <div><span className="text-slate-500 font-medium">Delivery Location:</span> <span className="font-semibold">{order.area || 'Dahisar'}</span></div>
            <div><span className="text-slate-500 font-medium">Delivery Type:</span> <span className="font-semibold">{order.delivery_type || 'Local Dispatch'}</span></div>
          </div>
        </div>

        <div>
          <div className="font-black text-slate-900 border-b-2 border-slate-300 pb-1 mb-1.5 uppercase text-xs tracking-wider">
            Invoice Details
          </div>
          <div className="text-slate-800 space-y-1 font-mono text-xs sm:text-sm">
            <div><span className="text-slate-500 font-sans">Invoice No. :</span> <strong className="text-slate-950 font-extrabold">{order.order_number}</strong></div>
            <div><span className="text-slate-500 font-sans">Date :</span> <span className="font-bold">{order.order_date}</span></div>
            <div><span className="text-slate-500 font-sans">Time :</span> <span className="font-bold">{formatOrderTime(order.time, order.created_at)}</span></div>
          </div>
        </div>
      </div>

      {/* Savings Highlight Banner */}
      {savingsInfo.totalSavings > 0 && (
        <div className="mb-4 px-4 py-2 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-950 font-bold text-center text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs">
          <span className="text-base">🎉</span>
          <span>{savingsInfo.bannerMessage}</span>
          <span className="text-xs font-mono font-black text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
            Saved {currencySymbol}{savingsInfo.totalSavings.toLocaleString()}
          </span>
        </div>
      )}

      {/* Table */}
      <div className="border-y-2 border-slate-950 mb-5 overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b-2 border-slate-950 text-xs sm:text-sm font-black uppercase text-slate-950 bg-slate-50">
              <th className="py-2.5 px-2 text-center w-10">#</th>
              <th className="py-2.5 px-3">Item name</th>
              <th className="py-2.5 px-2 text-center">Item Code</th>
              <th className="py-2.5 px-2 text-center">Quantity</th>
              <th className="py-2.5 px-3 text-right">Normal Rate</th>
              <th className="py-2.5 px-3 text-right">Applied Rate</th>
              <th className="py-2.5 px-3 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-xs sm:text-sm">
            {items.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-400 font-sans italic text-sm">
                  No line items found in this order.
                </td>
              </tr>
            ) : (
              items.map((it, idx) => {
                const p = allAvailableProds.find(prod => 
                  prod.id === it.product_id || 
                  ((it as any).barcode && prod.barcode === (it as any).barcode) ||
                  ((it as any).sku && prod.sku === (it as any).sku) ||
                  ((it as any).product_name && prod.name === (it as any).product_name)
                );
                const itemCode = (it as any).barcode || (it as any).sku || (it as any).item_code || p?.barcode || p?.sku || p?.hsn_code || 'ITEM';
                const itemName = (it as any).product_name || (it as any).name || (it as any).title || p?.name || 'Product Item';
                const price = Number(it.selling_price) || Number((it as any).price) || (p ? Number(p.selling_price) : 0);
                const normalRate = typeof it.normal_rate === 'number' && !isNaN(it.normal_rate) && it.normal_rate > 0 
                  ? it.normal_rate 
                  : (p ? (typeof p.selling_price === 'number' ? p.selling_price : price) : price);
                const qty = Math.max(1, Number(it.qty) || Number((it as any).quantity) || 1);
                const amount = qty * price;

              return (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="py-2.5 px-2 text-center font-mono text-slate-500">{idx + 1}</td>
                  <td className="py-2.5 px-3 font-black text-slate-900 uppercase">
                    <div className="text-xs sm:text-sm">{itemName}</div>
                    {it.rate_reason && normalRate > price && (
                      <span className="text-[10px] font-bold text-emerald-700 block mt-0.5">
                        ✓ {it.rate_reason}
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-2 text-center font-mono font-semibold text-slate-700">{itemCode}</td>
                  <td className="py-2.5 px-2 text-center font-bold text-slate-950 text-sm">{qty}</td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                    {normalRate > price ? (
                      <span className="line-through text-slate-400">{currencySymbol} {normalRate.toFixed(2)}</span>
                    ) : (
                      <span>{currencySymbol} {normalRate.toFixed(2)}</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                    {currencySymbol} {price.toFixed(2)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-black text-slate-950 text-sm">{currencySymbol} {amount.toFixed(2)}</td>
                </tr>
              );
            }))}
            <tr className="border-t-2 border-b-2 border-slate-950 font-black text-slate-950 text-xs sm:text-sm bg-slate-50">
              <td colSpan={3} className="py-2.5 px-3 uppercase">Total</td>
              <td className="py-2.5 px-2 text-center text-sm sm:text-base font-black">{totalQty}</td>
              <td></td>
              <td></td>
              <td className="py-2.5 px-3 text-right font-mono text-sm sm:text-base">{currencySymbol} {subTotal.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Bottom Section 2-Column Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 text-xs sm:text-sm">
        {/* Left Side */}
        <div className="sm:col-span-7 space-y-4">
          <div>
            <div className="font-black text-slate-900 uppercase text-xs tracking-wider">Invoice Amount In Words</div>
            <div className="font-extrabold text-slate-950 italic mt-1 text-xs sm:text-sm bg-slate-50 p-2 rounded border border-slate-200">{amountInWords}</div>
          </div>

          <div>
            <div className="font-black text-slate-900 uppercase text-xs tracking-wider">Payment mode</div>
            <div className="font-bold text-slate-800 mt-0.5">{paymentMode}</div>
          </div>

          <div>
            <div className="font-black text-slate-900 uppercase text-xs tracking-wider">Terms and Conditions</div>
            <div className="text-xs text-slate-600 space-y-0.5 mt-1 font-medium">
              <p>Thanks for doing business with us!</p>
              <p className="font-black text-slate-900">NO REPLACEMENT AND NO REFUND FOR FOOD PRODUCTS</p>
              <p>STAY SAFE AND STAY HOME</p>
            </div>
          </div>

          <div>
            <div className="font-black text-slate-900 uppercase text-xs tracking-wider mb-1.5">Payment QRs & Bank Details</div>
            <div className="flex items-start gap-3 text-xs text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              {/* UPI QR */}
              {order.payment_status !== 'Paid' && (
                <div className="text-center bg-white border border-slate-300 rounded-lg p-1.5 shrink-0 w-28 shadow-xs">
                  <div className="text-[9px] font-black uppercase text-slate-900 leading-none mb-1">UPI PAY QR</div>
                  {upiQrImgSrc ? (
                    <img src={upiQrImgSrc} alt="UPI QR" className="w-24 h-24 mx-auto border rounded border-slate-200" />
                  ) : (
                    <div className="w-24 h-24 mx-auto border rounded border-slate-200 bg-slate-100" />
                  )}
                  <div className="text-[8px] font-black text-emerald-700 mt-1">SCAN TO PAY</div>
                  <div className="text-[7px] font-mono text-slate-600 truncate max-w-[90px] mx-auto font-bold">{upiId}</div>
                </div>
              )}

              {/* Bill QR */}
              <div className="text-center bg-white border border-slate-300 rounded-lg p-1.5 shrink-0 w-28 shadow-xs">
                <div className="text-[9px] font-black uppercase text-slate-900 leading-none mb-1">BILL QR</div>
                {billQrImgSrc ? (
                  <img src={billQrImgSrc} alt="Bill QR" className="w-24 h-24 mx-auto border rounded border-slate-200" />
                ) : (
                  <div className="w-24 h-24 mx-auto border rounded border-slate-200 bg-slate-100" />
                )}
                <div className="text-[8px] font-black text-blue-700 mt-1">ONLINE INVOICE</div>
                <div className="text-[7px] font-mono text-slate-600 truncate max-w-[90px] mx-auto font-bold">{order.order_number}</div>
              </div>

              {/* Bank Details */}
              <div className="space-y-1 text-xs leading-snug shrink min-w-0 pl-1 my-auto">
                <div><strong className="text-slate-900">Bank :</strong> {bankName}</div>
                <div><strong className="text-slate-900">Account No. :</strong> <span className="font-mono font-bold">{accountNo}</span></div>
                <div><strong className="text-slate-900">IFSC code :</strong> <span className="font-mono font-bold">{ifscCode}</span></div>
                <div><strong className="text-slate-900">A/C Holder :</strong> {accountHolder}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side */}
        <div className="sm:col-span-5 flex flex-col justify-between">
          <div className="space-y-2 border-t sm:border-t-0 border-slate-300 pt-2 sm:pt-0">
            <div className="font-black text-slate-900 uppercase text-xs border-b border-slate-300 pb-1 mb-1.5 text-right tracking-wider">Amounts Summary</div>
            <div className="flex justify-between font-mono">
              <span className="font-sans text-slate-600">Sub Total</span>
              <span className="font-bold">{currencySymbol} {subTotal.toFixed(2)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between font-mono text-rose-600 font-bold">
                <span className="font-sans">Discount {order.discount_percentage ? `(${order.discount_percentage}%)` : ''}</span>
                <span>-{currencySymbol} {discount.toFixed(2)}</span>
              </div>
            )}
            {order.points_redeemed !== undefined && order.points_redeemed > 0 && (
              <div className="flex justify-between font-mono text-amber-900 font-bold bg-amber-50/80 px-2 py-1 rounded border border-amber-300">
                <span className="font-sans">Loyalty Points Redeemed</span>
                <span>-{order.points_redeemed} Pts</span>
              </div>
            )}
            {order.points_redeemed !== undefined && order.points_redeemed > 0 && customer && (
              <div className="flex justify-between font-mono text-emerald-800 font-bold text-xs px-1 py-0.5">
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
            <div className="flex justify-between font-mono font-black border-y-2 border-slate-950 py-1.5 text-slate-950 text-sm sm:text-base bg-slate-50 px-1">
              <span className="font-sans">Total</span>
              <span>{currencySymbol} {totalAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-mono text-slate-700 font-bold">
              <span className="font-sans">Received</span>
              <span>{currencySymbol} {received.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-mono font-black text-slate-950 text-sm border-b-2 border-slate-300 pb-1.5 pt-0.5">
              <span className="font-sans">Balance</span>
              <span className="text-rose-700">{currencySymbol} {balance.toFixed(2)}</span>
            </div>
          </div>

          <div className="text-right mt-8 pt-2">
            <div className="text-xs sm:text-sm text-slate-800">For : <strong>{bName}</strong></div>
            <div className="font-serif italic text-xl text-slate-900 my-2 font-black">AbRupendu</div>
            <div className="font-black text-xs uppercase tracking-wider text-slate-950">AB RUPENDU</div>
          </div>
        </div>
      </div>

      {/* Dotted Tear-off Line */}
      <div className="border-t-2 border-dashed border-slate-400 my-8"></div>

      {/* Acknowledgement Header */}
      <div className="text-center mb-4">
        <div className="font-black text-xs uppercase tracking-widest text-slate-600">Acknowledgement</div>
        <h2 className="font-black text-base uppercase text-slate-950 m-0">{bName}</h2>
      </div>

      {/* Acknowledgement 3-col Grid */}
      <div className="grid grid-cols-3 gap-4 text-xs sm:text-sm">
        <div>
          <strong className="block font-black text-slate-900 uppercase">Invoice To:</strong>
          <span className="block font-bold text-slate-950 text-sm">{custName}</span>
          <span className="block text-slate-600 leading-snug">{custAddr}</span>
        </div>

        <div>
          <strong className="block font-black text-slate-900 uppercase">Invoice Details:</strong>
          <div className="font-mono text-slate-700 space-y-1">
            <div>Invoice No. : <strong className="text-slate-950">{order.order_number}</strong></div>
            <div>Invoice date : {order.order_date}</div>
            <div>Invoice Amount : <strong className="text-slate-950">{currencySymbol} {totalAmount.toFixed(2)}</strong></div>
          </div>
        </div>

        <div className="flex flex-col justify-end text-right">
          <div className="border-t-2 border-slate-900 pt-1.5 text-center font-bold text-slate-800 w-44 ml-auto text-xs uppercase">
            Receiver's Seal & Sign
          </div>
        </div>
      </div>

    </div>
  );
};
