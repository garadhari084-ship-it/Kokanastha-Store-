import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { SalesOrder, Customer, Business, Product } from '../types/erp';
import { numberToWordsIndian, buildCompleteShippingAddress, buildCompleteBillingAddress } from '../utils/invoiceTemplate';
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
  const subTotal = items.reduce((sum, it) => {
    const p = allAvailableProds.find(prod => 
      prod.id === it.product_id || 
      ((it as any).barcode && prod.barcode === (it as any).barcode) || 
      ((it as any).sku && prod.sku === (it as any).sku) || 
      ((it as any).product_name && prod.name === (it as any).product_name)
    );
    const qty = Math.max(1, Number(it.qty) || Number((it as any).quantity) || 1);
    const rate = Number(it.selling_price) || Number((it as any).price) || (p ? Number(p.selling_price) : 0);
    return sum + (qty * rate);
  }, 0);

  const taxVal = (order.tax_amount !== undefined && order.tax_amount !== null && !isNaN(Number(order.tax_amount)))
    ? Number(order.tax_amount)
    : ((order as any).tax !== undefined && (order as any).tax !== null && !isNaN(Number((order as any).tax)))
      ? Number((order as any).tax)
      : 0;

  const discount = Number(order.discount_amount) || Number((order as any).discount) || Number(order.special_discount_amount) || 0;
  const additionalCharges = Number(order.additional_charges) || 0;
  const deliveryCharges = Number(order.delivery_charges) || Number(order.delivery_charge) || 0;

  const computedTotal = Math.max(0, subTotal + taxVal + additionalCharges + deliveryCharges - discount);
  let totalAmount = computedTotal;
  if (taxVal === 0 && additionalCharges === 0 && deliveryCharges === 0 && discount === 0) {
    totalAmount = subTotal;
  } else if (typeof order.total_amount === 'number' && order.total_amount > 0) {
    totalAmount = order.total_amount;
  }
  const totalQty = items.reduce((sum, it) => sum + (Number(it.qty) || Number((it as any).quantity) || 0), 0);
  const amountInWords = numberToWordsIndian(totalAmount);

  const rawPaid = order.paid_amount ?? (order as any).paidAmount ?? (order as any).advance_amount ?? (order as any).advance;
  const numPaid = typeof rawPaid === 'number' ? rawPaid : (typeof rawPaid === 'string' && rawPaid.trim() !== '' && !isNaN(Number(rawPaid)) ? Number(rawPaid) : undefined);
  
  let received = 0;
  if (order.payment_status === 'Paid') {
    received = Math.max(numPaid !== undefined ? numPaid : totalAmount, totalAmount);
  } else if (numPaid !== undefined && numPaid > 0) {
    received = Math.min(numPaid, totalAmount);
  } else {
    received = 0;
  }
  const balance = Math.max(0, totalAmount - received);
  const paymentMode = order.payment_mode || (order.payment_status === 'Paid' ? 'Online / Paid' : 'Credit / Pending');

  const isWalkIn = order.customer_id === 'WALK_IN' ||
                   order.customer_name === 'Walk-in Customer' ||
                   order.channel === 'Walk-in' ||
                   order.order_number === 'FEST-ADV-111' ||
                   (order.qr_code_data && (order.qr_code_data.includes('|WALK_IN|') || order.qr_code_data.includes('|Walk-in Customer|')));

  let cust = isWalkIn ? undefined : customer;
  if (!cust && order.customer_id && !isWalkIn) {
    const allCusts = dbStore.getCustomers(order.business_id || businessObj?.id || '');
    cust = allCusts.find(c => c.id === order.customer_id);
  }

  const custName = isWalkIn ? 'Walk-in Customer' : (order.customer_name || cust?.name || 'Customer');
  const custPhone = isWalkIn ? ((order as any).phone || (order as any).customer_phone || '') : (cust?.phone || (order as any).phone || (order as any).customer_phone || '');

  const billingInfo = buildCompleteBillingAddress(order, cust);
  const shippingInfo = buildCompleteShippingAddress(order, cust);
  const custAddr = billingInfo.fullAddress;
  const custShippingAddr = shippingInfo.fullAddress;

  const bName = businessObj?.name || 'KOKANASTHA FARAL & SWEETS';
  const bAddress = businessObj?.billing_address || 'Shop 14, Station Road, Borivali West, Mumbai, MH 400092';

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
  const accountHolder = businessObj?.account_holder || 'Kokanastha Faral & Sweets';

  return (
    <div className="bg-white text-slate-900 px-4 sm:px-8 py-6 sm:py-9 font-sans text-xs sm:text-[13px] leading-relaxed shadow-xl max-w-4xl w-full mx-auto rounded-2xl border border-slate-200 print:border-none print:shadow-none print:max-w-none print:w-full print:p-0 print:rounded-none">
      
      {/* Header */}
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-4">
          {businessObj?.logo_url && (
            <img 
              src={businessObj.logo_url} 
              alt={bName} 
              className="w-20 h-auto max-h-20 object-contain" 
            />
          )}
          <div className="text-left">
            <h1 className="text-2xl sm:text-3xl font-black tracking-wide text-slate-950 uppercase m-0 leading-tight">
              {bName}
            </h1>
            <p className="text-xs text-slate-800 font-semibold max-w-md leading-normal mt-0.5">
              {bAddress}
            </p>
          </div>
        </div>
        <div className="text-right text-[10px] font-extrabold text-slate-900 uppercase tracking-wider">
          ORIGINAL FOR RECIPIENT
        </div>
      </div>

      {/* Double Border Divider */}
      <div className="border-t-2 border-b border-slate-950 my-2 h-0.5"></div>

      {/* Title */}
      <div className="text-center font-black text-base sm:text-lg text-slate-950 mb-4 tracking-wide">
        Bill of Supply
      </div>

      {/* Metadata 3-col Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-5 text-xs sm:text-[12px] bg-white p-1 print:bg-white print:border-none print:p-0">
        <div>
          <div className="font-black text-slate-950 border-b border-slate-300 pb-1 mb-1.5 text-xs">
            Bill To
          </div>
          <div className="text-slate-800 space-y-0.5">
            <strong className="block text-slate-950 font-bold text-sm">{custName}</strong>
            <span className="block text-slate-800 break-words leading-relaxed">{custAddr || 'Retail POS'}</span>
            <span className="block text-slate-800 mt-1">Contact No. : <strong className="font-mono text-slate-950">{custPhone || '8779792825'}</strong></span>
          </div>
        </div>

        <div>
          <div className="font-black text-slate-950 border-b border-slate-300 pb-1 mb-1.5 text-xs">
            Transportation Details
          </div>
          <div className="text-slate-800 space-y-0.5">
            <div><span className="text-slate-700">Transport Name:</span> <strong className="text-slate-950">{order.delivery_type && order.delivery_type.toLowerCase().includes('courier') ? 'Global Courier' : 'Direct Express'}</strong></div>
            <div><span className="text-slate-700">Delivery Date:</span> <strong className="text-slate-950">{order.delivery_date || order.order_date}</strong></div>
            <div><span className="text-slate-700">Delivery Location:</span> <strong className="text-slate-950">{order.area || shippingInfo.zone || 'Retail POS'}</strong></div>
            <div><span className="text-slate-700">Delivery Type:</span> <strong className="text-slate-950">{order.delivery_type || 'Local Dispatch'}</strong></div>
          </div>
        </div>

        <div>
          <div className="font-black text-slate-950 border-b border-slate-300 pb-1 mb-1.5 text-xs">
            Invoice Details
          </div>
          <div className="text-slate-800 space-y-0.5 font-mono text-xs">
            <div><span className="text-slate-700 font-sans">Invoice No. :</span> <strong className="text-slate-950 font-bold text-sm">{order.order_number}</strong></div>
            <div><span className="text-slate-700 font-sans">Date :</span> <strong>{order.order_date}</strong></div>
            <div><span className="text-slate-700 font-sans">Time :</span> {formatOrderTime(order.time, order.created_at)}</div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="border-y border-slate-950 mb-5 overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-950 text-xs font-black text-slate-950 bg-white">
              <th className="py-2 px-2 text-center w-10">#</th>
              <th className="py-2 px-3">Item name</th>
              <th className="py-2 px-3 text-center">Item Code</th>
              <th className="py-2 px-3 text-center">Quantity</th>
              <th className="py-2 px-3 text-right">Price/unit</th>
              <th className="py-2 px-3 text-right">Final Rate</th>
              <th className="py-2 px-3 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-xs sm:text-[12.5px]">
            {items.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-6 text-center text-slate-400 font-sans italic text-xs">
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
                const itemCode = (it as any).barcode || (it as any).sku || (it as any).item_code || p?.barcode || p?.sku || p?.hsn_code || '8907571780245';
                const itemName = ((it as any).product_name || (it as any).name || (it as any).title || p?.name || 'Product Item').toUpperCase();
                const price = Number(it.selling_price) || Number((it as any).price) || (p ? Number(p.selling_price) : 0);
                const qty = Math.max(1, Number(it.qty) || Number((it as any).quantity) || 1);
                const amount = qty * price;

              return (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="py-1.5 px-2 text-center font-mono text-slate-700">{idx + 1}</td>
                  <td className="py-1.5 px-3 font-extrabold text-slate-950 uppercase">
                    {itemName}
                  </td>
                  <td className="py-1.5 px-3 text-center font-mono text-slate-700">{itemCode}</td>
                  <td className="py-1.5 px-3 text-center font-bold text-slate-950">{qty}</td>
                  <td className="py-1.5 px-3 text-right font-mono text-slate-800">
                    {currencySymbol} {price.toFixed(2)}
                  </td>
                  <td className="py-1.5 px-3 text-right font-mono text-slate-800">
                    {price.toFixed(2)}
                  </td>
                  <td className="py-1.5 px-3 text-right font-mono font-black text-slate-950">{currencySymbol} {amount.toFixed(2)}</td>
                </tr>
              );
            }))}
            <tr className="border-t border-b border-slate-950 font-black text-slate-950 text-xs sm:text-[13px] bg-white">
              <td colSpan={3} className="py-2 px-3">Total</td>
              <td className="py-2 px-3 text-center">{totalQty}</td>
              <td></td>
              <td></td>
              <td className="py-2 px-3 text-right font-mono text-sm sm:text-base font-black">{currencySymbol} {subTotal.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Bottom Section 2-Column Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 text-xs sm:text-[12.5px]">
        {/* Left Side */}
        <div className="sm:col-span-7 space-y-4">
          <div>
            <div className="font-extrabold text-slate-950 uppercase text-[10px] tracking-wide">Invoice Amount In Words</div>
            <div className="font-bold text-slate-950 mt-0.5 text-xs sm:text-[13px]">{amountInWords}</div>
          </div>

          <div>
            <div className="font-extrabold text-slate-950 uppercase text-[10px] tracking-wide">Payment mode</div>
            <div className="font-bold text-slate-900 text-xs sm:text-[13px]">{order.payment_status === 'Paid' ? 'Online / Paid' : paymentMode}</div>
          </div>

          <div>
            <div className="font-extrabold text-slate-950 uppercase text-[10px] tracking-wide">Terms and Conditions</div>
            <div className="text-xs text-slate-700 space-y-0.5 mt-0.5">
              <p>Thanks for doing business with us!</p>
              <p className="font-bold text-slate-950">NO REPLACEMENT AND NO REFUND FOR FOOD PRODUCTS</p>
              <p>STAY SAFE AND STAY HOME</p>
            </div>
          </div>

          <div>
            <div className="font-extrabold text-slate-950 uppercase text-[10px] tracking-wide mb-1.5">Payment QRs & Bank Details</div>
            <div className="flex items-start gap-3 text-xs text-slate-800 bg-white p-1 rounded-xl border border-slate-200 print:border-none print:p-0">
              {/* UPI QR */}
              <div className="text-center bg-white border border-slate-300 rounded-lg p-1.5 shrink-0 w-24 shadow-2xs">
                <div className="text-[8px] font-black uppercase text-slate-900 leading-none mb-1">UPI PAY QR</div>
                {upiQrImgSrc ? (
                  <img src={upiQrImgSrc} alt="UPI QR" className="w-20 h-20 mx-auto border rounded border-slate-200" />
                ) : (
                  <div className="w-20 h-20 mx-auto border rounded border-slate-200 bg-slate-100" />
                )}
                <div className="text-[7.5px] font-black text-slate-950 mt-1">SCAN TO PAY</div>
                <div className="text-[6.5px] font-mono text-slate-600 truncate max-w-[80px] mx-auto">{upiId}</div>
              </div>

              {/* Bill QR */}
              <div className="text-center bg-white border border-slate-300 rounded-lg p-1.5 shrink-0 w-24 shadow-2xs">
                <div className="text-[8px] font-black uppercase text-slate-900 leading-none mb-1">BILL QR</div>
                {billQrImgSrc ? (
                  <img src={billQrImgSrc} alt="Bill QR" className="w-20 h-20 mx-auto border rounded border-slate-200" />
                ) : (
                  <div className="w-20 h-20 mx-auto border rounded border-slate-200 bg-slate-100" />
                )}
                <div className="text-[7.5px] font-black text-slate-950 mt-1">VERIFIED BILL</div>
                <div className="text-[6.5px] font-mono text-slate-600 truncate max-w-[80px] mx-auto">{order.order_number}</div>
              </div>

              {/* Bank Details */}
              <div className="space-y-0.5 text-xs leading-normal shrink min-w-0 pl-1 my-auto text-slate-900 font-medium">
                <div><strong>Bank :</strong> {bankName}</div>
                <div><strong>Account No. :</strong> <span className="font-mono">{accountNo}</span></div>
                <div><strong>IFSC code :</strong> <span className="font-mono">{ifscCode}</span></div>
                <div><strong>Account holder :</strong> {accountHolder}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side */}
        <div className="sm:col-span-5 flex flex-col justify-between">
          <div className="space-y-1 border-t sm:border-t-0 border-slate-300 pt-3 sm:pt-0">
            <div className="font-extrabold text-slate-950 uppercase text-[11px] tracking-wider border-b border-slate-300 pb-1 mb-1.5 text-right">Amounts</div>
            <div className="flex justify-between font-mono text-xs sm:text-[13px]">
              <span className="font-sans text-slate-800">Sub Total</span>
              <span className="font-bold text-slate-950">{currencySymbol} {subTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-mono text-xs sm:text-[13px]">
              <span className="font-sans text-slate-800">DELIVERY:</span>
              <span className="font-bold text-slate-950">{currencySymbol} {deliveryCharges.toFixed(2)}</span>
            </div>
            {taxVal > 0 && (
              <div className="flex justify-between font-mono text-indigo-600 text-xs sm:text-[13px]">
                <span className="font-sans">Tax (GST)</span>
                <span>+{currencySymbol} {taxVal.toFixed(2)}</span>
              </div>
            )}
            {discount > 0 && (
              <div className="flex justify-between font-mono text-rose-600 text-xs sm:text-[13px]">
                <span className="font-sans">Discount</span>
                <span>-{currencySymbol} {discount.toFixed(2)}</span>
              </div>
            )}
            {additionalCharges > 0 && (
              <div className="flex justify-between font-mono text-slate-800 text-xs sm:text-[13px]">
                <span className="font-sans">Additional Charges:</span>
                <span>{currencySymbol} {additionalCharges.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-mono font-black border-y border-slate-950 py-1 text-slate-950 text-sm sm:text-base">
              <span className="font-sans">Total</span>
              <span>{currencySymbol} {totalAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-mono font-bold text-slate-900 text-xs sm:text-[13px] py-0.5">
              <span className="font-sans">Received</span>
              <span>{currencySymbol} {received.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-mono font-bold text-slate-900 text-xs sm:text-[13px] py-0.5">
              <span className="font-sans">Balance</span>
              <span>{currencySymbol} {balance.toFixed(2)}</span>
            </div>
          </div>

          <div className="text-right mt-6 pt-2">
            <div className="text-xs text-slate-900 font-bold">For : <strong>{bName}</strong></div>
            <div className="font-serif italic text-xl text-slate-950 my-1 font-bold">AbRupendu</div>
            <div className="font-extrabold text-xs uppercase tracking-wide text-slate-950">AB RUPENDU</div>
          </div>
        </div>
      </div>

      {/* Dotted Tear-off Line */}
      <div className="border-t border-dashed border-slate-400 my-6"></div>

      {/* Acknowledgement Header */}
      <div className="text-center mb-3">
        <div className="font-extrabold text-xs uppercase tracking-wider text-slate-700">Acknowledgement</div>
        <h2 className="font-black text-sm uppercase text-slate-950 m-0">{bName}</h2>
      </div>

      {/* Acknowledgement Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        <div>
          <strong className="block font-bold text-slate-950">Invoice To:</strong>
          <span className="block font-bold text-slate-950">{custName}</span>
          <span className="block text-slate-700 text-[11px] leading-relaxed break-words">{custAddr || 'Retail POS'}</span>
        </div>

        <div>
          <strong className="block font-bold text-slate-950">Invoice Details:</strong>
          <div className="font-mono text-slate-800 space-y-0.5">
            <div>Invoice No. : <strong>{order.order_number}</strong></div>
            <div>Invoice date : {order.order_date}</div>
            <div>Invoice Amount : <strong>{currencySymbol} {totalAmount.toFixed(2)}</strong></div>
          </div>
        </div>

        <div className="flex flex-col justify-end text-right">
          <div className="border-t border-slate-950 pt-1 text-center font-bold text-slate-900 w-40 ml-auto">
            Receiver's Seal & Sign
          </div>
        </div>
      </div>

    </div>
  );
};
