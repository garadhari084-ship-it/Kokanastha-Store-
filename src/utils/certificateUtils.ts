import jsPDF from 'jspdf';

export const generateLoyaltyCertificate = (
  customerName: string,
  plan: string,
  startDate: string,
  endDate: string,
  triggerToast: (msg: string, type: 'success' | 'error') => void
) => {
  try {
    const doc = new jsPDF('landscape', 'mm', 'a4');
    const width = doc.internal.pageSize.getWidth();
    const height = doc.internal.pageSize.getHeight();

    // 1. Background (Ivory/Off-White)
    doc.setFillColor(252, 252, 250);
    doc.rect(0, 0, width, height, 'F');

    // 2. Outer Border (Dark Navy)
    doc.setDrawColor(15, 23, 42); // slate-900
    doc.setLineWidth(2.5);
    doc.rect(12, 12, width - 24, height - 24);

    // 3. Inner Border (Elegant Gold)
    doc.setDrawColor(212, 175, 55); // Metallic Gold
    doc.setLineWidth(0.8);
    doc.rect(16, 16, width - 32, height - 32);

    // 4. Corner Accents (Gold Lines)
    const c = 16;
    const l = 18;
    doc.setDrawColor(212, 175, 55);
    doc.setLineWidth(0.8);
    // Top-Left
    doc.line(c, c + l, c + l, c);
    // Top-Right
    doc.line(width - c - l, c, width - c, c + l);
    // Bottom-Left
    doc.line(c, height - c - l, c + l, height - c);
    // Bottom-Right
    doc.line(width - c - l, height - c, width - c, height - c - l);

    // 5. Header / Brand
    doc.setFont('times', 'bold');
    doc.setFontSize(38);
    doc.setTextColor(15, 23, 42); // Navy
    doc.text('CERTIFICATE OF MEMBERSHIP', width / 2, 48, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(212, 175, 55); // Gold
    // We add spaces manually for tracking effect since charSpace isn't universally supported in all jsPDF versions without advanced API
    doc.text('K O K A N A S T H A   L O Y A L   M E M B E R S H I P   P R O G R A M', width / 2, 60, { align: 'center' });

    // 6. Presentation Text
    doc.setFont('times', 'italic');
    doc.setFontSize(18);
    doc.setTextColor(71, 85, 105); // Slate-600
    doc.text('This proudly certifies that', width / 2, 88, { align: 'center' });

    // 7. Customer Name
    doc.setFont('times', 'bold');
    doc.setFontSize(44);
    doc.setTextColor(15, 23, 42); // Navy
    doc.text((customerName || 'Loyal Customer').toUpperCase(), width / 2, 108, { align: 'center' });

    // 8. Description
    doc.setFont('times', 'normal');
    doc.setFontSize(15);
    doc.setTextColor(71, 85, 105); // Slate-600
    doc.text('has been formally inducted into the Kokanastha Loyal Membership Program', width / 2, 128, { align: 'center' });
    doc.text('and is entitled to all associated privileges and benefits.', width / 2, 137, { align: 'center' });

    // 9. Plan Details
    const start = startDate ? new Date(startDate).toLocaleDateString() : 'N/A';
    const end = endDate ? new Date(endDate).toLocaleDateString() : 'N/A';

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(`MEMBERSHIP TIER: ${(plan || 'Standard').toUpperCase()}`, width / 2, 155, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`VALIDITY: ${start}  —  ${end}`, width / 2, 163, { align: 'center' });

    // 10. Seal (Bottom Center)
    const sealY = 180;
    doc.setFillColor(212, 175, 55); // Gold
    doc.circle(width / 2, sealY, 15, 'F');
    doc.setDrawColor(252, 252, 250); // White/Ivory
    doc.setLineWidth(0.6);
    doc.circle(width / 2, sealY, 12.5, 'S');
    
    doc.setFont('times', 'bolditalic');
    doc.setFontSize(16);
    doc.setTextColor(255, 255, 255);
    doc.text('KLM', width / 2, sealY + 2.5, { align: 'center' });
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6);
    doc.text('PREMIUM', width / 2, sealY + 7, { align: 'center' });

    // 11. Signatures
    // Left: Date
    doc.setDrawColor(15, 23, 42);
    doc.setLineWidth(0.5);
    doc.line(40, 180, 95, 180);
    doc.setFont('times', 'normal');
    doc.setFontSize(13);
    doc.setTextColor(15, 23, 42);
    doc.text(start, 67.5, 177, { align: 'center' });
    doc.setFontSize(10);
    doc.text('Date of Issue', 67.5, 186, { align: 'center' });

    // Right: Signature
    doc.line(width - 95, 180, width - 40, 180);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(18);
    doc.text('Kokanastha', width - 67.5, 177, { align: 'center' });
    doc.setFont('times', 'normal');
    doc.setFontSize(10);
    doc.text('Authorized Signatory', width - 67.5, 186, { align: 'center' });

    // Output
    doc.save(`Loyalty_Certificate_${customerName.replace(/\s+/g, '_')}.pdf`);
    triggerToast('Certificate downloaded successfully.', 'success');
  } catch (e: any) {
    console.error(e);
    triggerToast('Failed to generate certificate', 'error');
  }
};

export const sendCertificateOnWhatsApp = (
  customerName: string,
  phone: string,
  plan: string,
  startDate: string,
  endDate: string,
  triggerToast: (msg: string, type: 'success' | 'error') => void
) => {
  const start = startDate ? new Date(startDate).toLocaleDateString() : 'N/A';
  const end = endDate ? new Date(endDate).toLocaleDateString() : 'N/A';
  
  const message = `Hello ${customerName},\n\nWelcome to the Kokanastha Loyal Membership Program!\n\n*Membership Details:*\nPlan: ${plan || 'Standard'}\nValid From: ${start}\nValid To: ${end}\n\nThank you for being a loyal customer!`;
  
  const cleanPhone = phone ? phone.replace(/\D/g, '') : '';
  const finalPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
  
  if (finalPhone) {
    window.open(`https://wa.me/${finalPhone}?text=${encodeURIComponent(message)}`, '_blank');
  } else {
    triggerToast('Customer phone number is missing.', 'error');
  }
};

export const sendRenewalReminderOnWhatsApp = (
  customerName: string,
  phone: string,
  plan: string,
  endDate: string,
  triggerToast: (msg: string, type: 'success' | 'error') => void
) => {
  const end = endDate ? new Date(endDate).toLocaleDateString() : 'N/A';
  
  const message = `Hello ${customerName},\n\nThis is a friendly reminder that your Kokanastha Loyal Membership (*${plan || 'Standard'}*) is expiring on *${end}*.\n\nPlease renew your membership soon to continue enjoying your exclusive benefits and discounts!\n\nThank you for being a valued customer.`;
  
  const cleanPhone = phone ? phone.replace(/\D/g, '') : '';
  const finalPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
  
  if (finalPhone) {
    window.open(`https://wa.me/${finalPhone}?text=${encodeURIComponent(message)}`, '_blank');
  } else {
    triggerToast('Customer phone number is missing.', 'error');
  }
};
