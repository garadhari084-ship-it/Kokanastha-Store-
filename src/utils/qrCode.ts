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
      width: options?.width || 200,
      margin: options?.margin ?? 2,
      color: {
        dark: options?.color?.dark || '#0f172a',
        light: options?.color?.light || '#ffffff'
      }
    });
  } catch (err) {
    console.error('Failed to generate QR code data URL:', err);
    // Fallback to QR server API
    return `https://api.qrserver.com/v1/create-qr-code/?size=${options?.width || 200}x${options?.width || 200}&data=${encodeURIComponent(text)}`;
  }
}

/**
 * Generate raw SVG string for QR code
 */
export async function generateQRCodeSvg(text: string, options?: QRCodeOptions): Promise<string> {
  try {
    return await QRCode.toString(text, {
      type: 'svg',
      width: options?.width || 120,
      margin: options?.margin ?? 1,
      color: {
        dark: options?.color?.dark || '#0f172a',
        light: options?.color?.light || '#ffffff'
      }
    });
  } catch (err) {
    console.error('Failed to generate QR code SVG:', err);
    const imgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${options?.width || 120}x${options?.width || 120}&data=${encodeURIComponent(text)}`;
    return `<img src="${imgUrl}" width="${options?.width || 120}" height="${options?.width || 120}" alt="QR Code" style="display:block; border: 1px solid #e2e8f0; padding: 2px; background: #fff;" />`;
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
 * Constructs a Bill Verification payload string for scanning invoices
 */
export function buildBillVerificationString(params: {
  orderNumber: string;
  orderDate: string;
  amount: number;
  customerName: string;
  businessName?: string;
  gstin?: string;
}): string {
  const { orderNumber, orderDate, amount, customerName, businessName, gstin } = params;
  
  // Return a URL pointing to the public invoice view
  // Fallback to a plain text formatted string if window is not defined (e.g., SSR)
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/?inv=${encodeURIComponent(orderNumber)}`;
  }
  
  return `INV:${orderNumber}|DATE:${orderDate}|AMT:${amount.toFixed(2)}|CUST:${customerName.trim()}|BIZ:${businessName || ''}|GSTIN:${gstin || ''}`;
}
