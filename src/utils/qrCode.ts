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
  const cleanUpi = (upiId || '').trim();
  const cleanName = (businessName || 'Merchant').trim().replace(/[^\w\s]/gi, '');
  const numAmount = Number(amount) || 0;
  const formattedAmount = numAmount > 0 ? numAmount.toFixed(2) : '0.00';
  const cleanOrderNo = (orderNumber || '').trim().replace(/[^\w\s-]/gi, '');
  const note = cleanOrderNo ? `INV-${cleanOrderNo}` : 'Invoice Payment';

  return `upi://pay?pa=${cleanUpi}&pn=${encodeURIComponent(cleanName)}&am=${formattedAmount}&cu=INR&tn=${encodeURIComponent(note)}`;
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
  return `INV:${orderNumber}|DATE:${orderDate}|AMT:${amount.toFixed(2)}|CUST:${customerName.trim()}|BIZ:${businessName || ''}|GSTIN:${gstin || ''}`;
}
