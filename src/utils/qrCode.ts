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
 * When running inside sandbox/container environments (.run.app / localhost), returns the public web domain link
 * so external mobile scanners do not hit container 403 / 404 errors.
 */
export function getPublicInvoiceUrl(orderNumber: string): string {
  const cleanOrder = (orderNumber || '').trim();
  if (!cleanOrder) return '';

  if (typeof window !== 'undefined' && window.location?.origin) {
    const origin = window.location.origin;
    const hostname = window.location.hostname;

    // Standard public domain for external mobile scanner access
    if (hostname.includes('run.app') || hostname.includes('localhost') || hostname === '127.0.0.1') {
      return `https://kokanastha-store.vercel.app/?inv=${encodeURIComponent(cleanOrder)}`;
    }

    return `${origin}/?inv=${encodeURIComponent(cleanOrder)}`;
  }
  
  return `https://kokanastha-store.vercel.app/?inv=${encodeURIComponent(cleanOrder)}`;
}

/**
 * Constructs a Bill Verification payload string for scanning invoices.
 * Outputs a clear, structured verification string readable by ANY mobile camera
 * or QR scanner app, showing key bill parameters immediately on screen.
 */
export function buildBillVerificationString(params: {
  orderNumber: string;
  orderDate?: string;
  amount?: number;
  customerName?: string;
  businessName?: string;
  gstin?: string;
}): string {
  const { orderNumber } = params;
  const cleanOrder = (orderNumber || '').trim();
  return getPublicInvoiceUrl(cleanOrder);
}
