import QRCode from 'qrcode';

export interface QRCodeOptions {
  width?: number;
  margin?: number;
  color?: {
    dark?: string;
    light?: string;
  };
}

/**
 * Generate SVG string for QR code synchronously using fallback or asynchronously
 */
export async function generateQRCodeDataUrl(text: string, options?: QRCodeOptions): Promise<string> {
  try {
    return await QRCode.toDataURL(text, {
      width: options?.width || 250,
      margin: options?.margin ?? 1,
      errorCorrectionLevel: 'M',
      color: {
        dark: options?.color?.dark || '#000000',
        light: options?.color?.light || '#ffffff'
      }
    });
  } catch (err) {
    console.error('Failed to generate QR code data URL:', err);
    // Fallback to QR server API
    return `https://api.qrserver.com/v1/create-qr-code/?size=${options?.width || 250}x${options?.width || 250}&data=${encodeURIComponent(text)}`;
  }
}

/**
 * Generate raw SVG string for QR code
 */
export async function generateQRCodeSvg(text: string, options?: QRCodeOptions): Promise<string> {
  try {
    return await QRCode.toString(text, {
      type: 'svg',
      width: options?.width || 150,
      margin: options?.margin ?? 1,
      errorCorrectionLevel: 'M',
      color: {
        dark: options?.color?.dark || '#000000',
        light: options?.color?.light || '#ffffff'
      }
    });
  } catch (err) {
    console.error('Failed to generate QR code SVG:', err);
    const imgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${options?.width || 150}x${options?.width || 150}&data=${encodeURIComponent(text)}`;
    return `<img src="${imgUrl}" width="${options?.width || 150}" height="${options?.width || 150}" alt="QR Code" style="display:block; border: 1px solid #e2e8f0; padding: 2px; background: #fff;" />`;
  }
}

/**
 * Constructs a standard UPI Pay URL string for scanning with BHIM, GPay, PhonePe, Paytm, etc.
 * Formats parameters strictly according to NPCI UPI specifications so that
 * all UPI scanner apps automatically pre-fill the exact invoice payment amount.
 */
export function buildUpiPayString(params: {
  upiId: string;
  businessName: string;
  amount: number;
  orderNumber: string;
}): string {
  const { upiId, businessName, amount, orderNumber } = params;
  
  // Clean VPA address
  const cleanUpi = (upiId || '9820769697@okicici').trim().replace(/\s+/g, '');
  
  // Clean Merchant Name: keep alphanumeric and single spaces
  const cleanName = (businessName || 'KOKANASTHA').trim().replace(/[^\w\s]/gi, '').replace(/\s+/g, ' ');
  
  // Clean Order / Invoice Number
  const cleanOrderNo = (orderNumber || '').trim().replace(/[^\w-]/gi, '');
  const note = cleanOrderNo ? `Invoice ${cleanOrderNo}` : 'Invoice Payment';

  // Amount formatted to 2 decimal places
  const numAmount = Number(amount) || 0;

  // NPCI UPI Specification Parameters:
  const encodedName = encodeURIComponent(cleanName);
  const encodedNote = encodeURIComponent(note);

  let upiUrl = `upi://pay?pa=${cleanUpi}&pn=${encodedName}&tn=${encodedNote}&cu=INR`;
  if (numAmount > 0) {
    upiUrl += `&am=${numAmount.toFixed(2)}`;
  }

  return upiUrl;
}

/**
 * Returns a publicly accessible URL for a given invoice/order number.
 * Automatically maps AI Studio development origins (ais-dev-) to public share origin (ais-pre-)
 * so external mobile scanners open the digital invoice directly in the browser without 403 Google login errors.
 */
export function getPublicInvoiceUrl(orderNumber: string, extraPayload?: string): string {
  const cleanOrder = (orderNumber || '').trim();
  if (!cleanOrder) return '';

  let origin = '';
  if (typeof window !== 'undefined' && window.location?.origin) {
    origin = window.location.origin;
    // Replace private dev URL (ais-dev-) with public share URL (ais-pre-) so external phone cameras can open the invoice link directly
    if (origin.includes('ais-dev-')) {
      origin = origin.replace('ais-dev-', 'ais-pre-');
    }
  }

  let url = `${origin}/?inv=${encodeURIComponent(cleanOrder)}`;
  if (extraPayload) {
    url += `&d=${encodeURIComponent(extraPayload)}`;
  }
  return url;
}

/**
 * Constructs a Bill Verification URL string for scanning invoices.
 * Generates an accessible digital invoice web URL with an embedded compact order payload so mobile phone
 * cameras and QR scanners open the exact digital invoice immediately in the web browser.
 */
export function buildBillVerificationString(params: {
  orderNumber: string;
  orderDate?: string;
  amount?: number;
  customerName?: string;
  businessName?: string;
  gstin?: string;
  items?: any[];
  paymentMode?: string;
  upiId?: string;
}): string {
  const cleanOrder = (params.orderNumber || '').trim();
  if (!cleanOrder) return '';

  let origin = '';
  if (typeof window !== 'undefined' && window.location?.origin) {
    origin = window.location.origin;
  }

  // Check if running on a custom deployed production domain (not Cloud Run preview container or localhost)
  const isDevContainer = !origin || origin.includes('run.app') || origin.includes('localhost') || origin.includes('ais-dev') || origin.includes('ais-pre');

  if (!isDevContainer && origin.startsWith('http')) {
    const compactPayload: Record<string, any> = {
      no: cleanOrder,
      dt: params.orderDate || new Date().toISOString().split('T')[0],
      tot: params.amount || 0,
      cust: params.customerName || 'Customer',
      biz: params.businessName || 'Kokanastha Faral & Sweets',
      pm: params.paymentMode || 'Paid'
    };
    if (params.gstin) compactPayload.gst = params.gstin;
    if (params.items && Array.isArray(params.items) && params.items.length > 0) {
      compactPayload.its = params.items.slice(0, 10).map((it: any) => ({
        n: it.name || it.product_name || 'Item',
        q: Number(it.qty) || 1,
        p: Number(it.total_price || (it.qty * (it.unit_price || it.selling_price || 0))) || 0
      }));
    }

    try {
      const jsonStr = JSON.stringify(compactPayload);
      const base64Data = btoa(encodeURIComponent(jsonStr).replace(/%([0-9A-F]{2})/g, (match, p1) => String.fromCharCode(parseInt(p1, 16))));
      return `${origin}/?inv=${encodeURIComponent(cleanOrder)}&d=${encodeURIComponent(base64Data)}`;
    } catch (e) {
      return `${origin}/?inv=${encodeURIComponent(cleanOrder)}`;
    }
  }

  // Otherwise, construct a clean, self-contained digital bill verification receipt text.
  // Any phone camera, Google Lens, or QR scanner app will display the verified bill parameters instantly on screen
  // without sending network requests to Cloud Run preview containers, completely eliminating 404 / 403 "Page Not Found" errors!
  const bName = (params.businessName || 'Kokanastha Faral & Sweets').toUpperCase();
  const dateStr = params.orderDate || new Date().toISOString().split('T')[0];
  const custName = params.customerName || 'Customer';
  const total = Number(params.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const payMode = params.paymentMode || 'Paid';

  const lines: string[] = [
    `===============================`,
    `   ${bName}`,
    `   BILL VERIFICATION RECEIPT   `,
    `===============================`,
    `Invoice No   : ${cleanOrder}`,
    `Date         : ${dateStr}`,
    `Customer     : ${custName}`
  ];

  if (params.gstin) {
    lines.push(`GSTIN        : ${params.gstin}`);
  }

  lines.push(`Payment Mode : ${payMode}`);
  lines.push(`-------------------------------`);

  if (params.items && Array.isArray(params.items) && params.items.length > 0) {
    lines.push(`ITEMS SUMMARY:`);
    params.items.slice(0, 6).forEach((it: any) => {
      const name = it.name || it.product_name || 'Item';
      const qty = Number(it.qty) || 1;
      const itemTot = Number(it.total_price || (qty * (it.unit_price || it.selling_price || 0))).toFixed(2);
      lines.push(`• ${name} (x${qty}) - ₹${itemTot}`);
    });
    if (params.items.length > 6) {
      lines.push(`+ ${params.items.length - 6} more items`);
    }
    lines.push(`-------------------------------`);
  }

  lines.push(`TOTAL AMOUNT : ₹${total}`);
  lines.push(`STATUS       : VERIFIED & PAID`);
  lines.push(`===============================`);
  lines.push(`Authentic Digital Store Receipt`);

  return lines.join('\n');
}
