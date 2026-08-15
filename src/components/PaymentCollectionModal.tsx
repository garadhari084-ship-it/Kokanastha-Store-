import React, { useState, useEffect } from 'react';
import { 
  DollarSign, X, CheckCircle2, Printer, Download, Send, Mail, 
  CreditCard, QrCode, Banknote, Building2, FileText, History, 
  ArrowRight, ShieldCheck, Check, Sparkles, User, AlertCircle
} from 'lucide-react';
import { SalesOrder, PurchaseOrder, PaymentRecord, UserProfile } from '../types/erp';
import { generateWhatsAppInvoiceMessage } from './WhatsAppNotifyModal';
import { formatWhatsAppPhone } from '../utils/formatters';
import { dbStore } from '../services/store';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface PaymentCollectionModalProps {
  businessId: string;
  user: UserProfile;
  order: SalesOrder | PurchaseOrder;
  type: 'Sales' | 'Purchase';
  onClose: () => void;
  onSuccess: (updatedOrder: SalesOrder | PurchaseOrder, newRecord: PaymentRecord) => void;
  triggerToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const PaymentCollectionModal: React.FC<PaymentCollectionModalProps> = ({
  businessId,
  user,
  order,
  type,
  onClose,
  onSuccess,
  triggerToast
}) => {
  const business = dbStore.getBusiness(businessId);
  const currencySymbol = business?.currency_symbol || '₹';

  // Always resolve latest order record from dbStore to avoid stale prop snapshots
  const freshOrder = (type === 'Sales' 
    ? dbStore.getSalesOrders(businessId).find(s => s.id === order.id) 
    : dbStore.getPurchaseOrders(businessId).find(p => p.id === order.id)) || order;

  // Calculate current figures using fresh data
  const totalAmount = Number(freshOrder.total_amount) || 0;
  const previouslyPaid = Number(freshOrder.paid_amount) || 0;
  const currentOutstanding = Math.max(0, totalAmount - previouslyPaid);

  // Form states
  const [paymentAmount, setPaymentAmount] = useState<number>(currentOutstanding);
  const [paymentMode, setPaymentMode] = useState<string>('UPI / QR');
  const [referenceNo, setReferenceNo] = useState<string>('');
  const [bankAccount, setBankAccount] = useState<string>(business?.bank_name || 'Main Cash / Bank Account');
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState<string>('');

  // Sync state when order changes or modal opens
  useEffect(() => {
    const latest = (type === 'Sales' 
      ? dbStore.getSalesOrders(businessId).find(s => s.id === order.id) 
      : dbStore.getPurchaseOrders(businessId).find(p => p.id === order.id)) || order;

    const tot = Number(latest.total_amount) || 0;
    const paid = Number(latest.paid_amount) || 0;
    const outstanding = Math.max(0, tot - paid);

    setPaymentAmount(outstanding);
    setUpdatedOrderState(latest);
  }, [order.id, order.paid_amount, order.total_amount, businessId, type]);

  // Step state: 'entry' -> 'success_options'
  const [step, setStep] = useState<'entry' | 'success_options'>('entry');
  const [createdReceipt, setCreatedReceipt] = useState<PaymentRecord | null>(null);
  const [updatedOrderState, setUpdatedOrderState] = useState<SalesOrder | PurchaseOrder>(order);

  // Preset calculation
  const calculatedRemaining = Math.max(0, currentOutstanding - (paymentAmount || 0));

  // Determine party details
  let partyName = 'Party';
  let partyEmail = '';
  let partyPhone = '';
  if (type === 'Sales') {
    const cust = dbStore.getCustomers(businessId).find(c => c.id === (order as SalesOrder).customer_id);
    partyName = (order as SalesOrder).customer_name || cust?.name || 'Walk-in Customer';
    partyEmail = cust?.email || '';
    partyPhone = cust?.phone || '';
  } else {
    const supp = dbStore.getSuppliers(businessId).find(s => s.id === (order as PurchaseOrder).supplier_id);
    partyName = supp?.name || 'Vendor / Supplier';
    partyEmail = supp?.email || '';
    partyPhone = supp?.phone || '';
  }

  const handleApplyPreset = (percent: number) => {
    if (percent === 100) {
      setPaymentAmount(currentOutstanding);
    } else {
      const amt = Math.round((currentOutstanding * percent) / 100);
      setPaymentAmount(amt);
    }
  };

  const handleProcessPayment = (e: React.FormEvent) => {
    e.preventDefault();

    if (paymentAmount <= 0) {
      triggerToast('Payment amount must be greater than zero.', 'error');
      return;
    }

    if (paymentAmount > currentOutstanding + 0.01) {
      triggerToast(`Payment amount cannot exceed outstanding balance of ${currencySymbol}${currentOutstanding.toLocaleString()}.`, 'error');
      return;
    }

    const newTotalPaid = previouslyPaid + paymentAmount;
    let newPaymentStatus: 'Unpaid' | 'Partial' | 'Paid' = 'Unpaid';
    if (newTotalPaid >= totalAmount - 0.01) {
      newPaymentStatus = 'Paid';
    } else if (newTotalPaid > 0) {
      newPaymentStatus = 'Partial';
    }

    const receiptSeq = (order.payment_history && order.payment_history.length > 0) ? `-${order.payment_history.length + 1}` : '';
    const receiptNo = `${type === 'Sales' ? 'RCT' : 'PAY'}-${order.order_number}${receiptSeq}`;

    const newRecord: PaymentRecord = {
      id: crypto.randomUUID(),
      order_id: order.id,
      order_number: order.order_number,
      type,
      amount: paymentAmount,
      payment_mode: paymentMode,
      reference_no: referenceNo.trim() || undefined,
      bank_account: bankAccount,
      payment_date: paymentDate,
      notes: notes.trim() || undefined,
      receipt_number: receiptNo,
      collected_by: user.name || 'Staff',
      business_id: businessId,
      created_at: new Date().toISOString()
    };

    const existingHistory = order.payment_history || [];
    const newHistory = [...existingHistory, newRecord];

    let updatedOrderObj: any;

    if (type === 'Sales') {
      updatedOrderObj = dbStore.updateSalesOrder(order.id, {
        payment_status: newPaymentStatus,
        paid_amount: newTotalPaid,
        payment_mode: paymentMode,
        payment_reference: referenceNo.trim() || undefined,
        payment_bank: bankAccount,
        payment_notes: notes.trim() || undefined,
        payment_date: paymentDate,
        payment_history: newHistory
      });

      // Update customer ledger outstanding amount
      const custId = (order as SalesOrder).customer_id;
      if (custId) {
        const custs = dbStore.getCustomers(businessId);
        const cObj = custs.find(c => c.id === custId);
        if (cObj) {
          const newOut = Math.max(0, (cObj.outstanding_amount || 0) - paymentAmount);
          dbStore.updateCustomer(custId, { outstanding_amount: newOut });
        }
      }
    } else {
      updatedOrderObj = dbStore.updatePurchaseOrder(order.id, {
        payment_status: newPaymentStatus,
        paid_amount: newTotalPaid,
        payment_mode: paymentMode,
        payment_reference: referenceNo.trim() || undefined,
        payment_bank: bankAccount,
        payment_notes: notes.trim() || undefined,
        payment_date: paymentDate,
        payment_history: newHistory
      });

      // Update supplier ledger outstanding amount
      const suppId = (order as PurchaseOrder).supplier_id;
      if (suppId) {
        const supps = dbStore.getSuppliers(businessId);
        const sObj = supps.find(s => s.id === suppId);
        if (sObj) {
          const newOut = Math.max(0, (sObj.outstanding_amount || 0) - paymentAmount);
          dbStore.updateSupplier(suppId, { outstanding_amount: newOut });
        }
      }
    }

    dbStore.logActivity(
      user.id, user.name, user.role,
      `${type === 'Sales' ? 'Collect Payment' : 'Vendor Payment'}`,
      `Recorded ${type} payment of ${currencySymbol}${paymentAmount.toLocaleString()} via ${paymentMode} for Order ${order.order_number} (Receipt #${receiptNo})`,
      businessId
    );

    triggerToast(`Payment of ${currencySymbol}${paymentAmount.toLocaleString()} recorded successfully! Voucher #${receiptNo}`, 'success');

    setCreatedReceipt(newRecord);
    setUpdatedOrderState(updatedOrderObj);
    onSuccess(updatedOrderObj, newRecord);
    setStep('success_options');
  };

  // Printable Payment Receipt Generator
  const handlePrintReceipt = () => {
    if (!createdReceipt) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Payment Receipt - ${createdReceipt.receipt_number}</title>
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; padding: 24px; color: #1e293b; max-width: 700px; margin: 0 auto; }
            .header { border-bottom: 2px solid #0f172a; padding-bottom: 16px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-start; }
            .company-name { font-size: 22px; font-weight: 900; color: #0f172a; text-transform: uppercase; }
            .receipt-title { text-align: right; }
            .badge { background: #10b981; color: white; padding: 4px 12px; font-weight: 800; border-radius: 12px; font-size: 12px; text-transform: uppercase; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; background: #f8fafc; padding: 16px; border-radius: 12px; border: 1px solid #e2e8f0; }
            .table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            .table th, .table td { border: 1px solid #cbd5e1; padding: 10px 12px; text-align: left; font-size: 13px; }
            .table th { background-color: #f1f5f9; font-weight: 800; }
            .amount-box { background: #ecfdf5; border: 2px solid #10b981; padding: 16px; border-radius: 12px; text-align: center; margin-bottom: 24px; }
            .amount-val { font-size: 28px; font-weight: 900; color: #047857; }
            .footer { margin-top: 40px; display: flex; justify-content: space-between; align-items: flex-end; font-size: 12px; color: #64748b; }
            .stamp-box { border-top: 1px solid #94a3b8; width: 180px; text-align: center; padding-top: 6px; font-weight: 700; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="company-name">${business?.name || 'OmniPack ERP'}</div>
              <div style="font-size: 11px; color: #64748b; margin-top: 4px;">${business?.billing_address || ''}</div>
              <div style="font-size: 11px; color: #64748b;">GSTIN: ${business?.gstin || 'N/A'} | Phone: ${business?.phone || ''}</div>
            </div>
            <div class="receipt-title">
              <span class="badge">${type === 'Sales' ? 'Official Payment Receipt' : 'Vendor Payment Voucher'}</span>
              <div style="font-size: 14px; font-weight: 800; margin-top: 8px;">Voucher #: ${createdReceipt.receipt_number}</div>
              <div style="font-size: 11px; color: #64748b;">Date: ${createdReceipt.payment_date}</div>
            </div>
          </div>

          <div class="grid">
            <div>
              <strong style="font-size: 11px; color: #64748b; text-transform: uppercase;">Received From / Paid To</strong>
              <div style="font-size: 15px; font-weight: 800; color: #0f172a; margin-top: 2px;">${partyName}</div>
              <div style="font-size: 12px; color: #475569;">${partyPhone} ${partyEmail ? '| ' + partyEmail : ''}</div>
            </div>
            <div>
              <strong style="font-size: 11px; color: #64748b; text-transform: uppercase;">Linked Order Ref</strong>
              <div style="font-size: 15px; font-weight: 800; color: #0f172a; margin-top: 2px;">Order #${order.order_number}</div>
              <div style="font-size: 12px; color: #475569;">Total Order Bill: ${currencySymbol}${totalAmount.toLocaleString()}</div>
            </div>
          </div>

          <div class="amount-box">
            <div style="font-size: 12px; font-weight: 700; color: #065f46; text-transform: uppercase;">Amount ${type === 'Sales' ? 'Collected' : 'Disbursed'}</div>
            <div class="amount-val">${currencySymbol}${createdReceipt.amount.toLocaleString()}</div>
            <div style="font-size: 12px; color: #047857; margin-top: 4px; font-weight: 600;">Mode: ${createdReceipt.payment_mode} ${createdReceipt.reference_no ? '(Ref: ' + createdReceipt.reference_no + ')' : ''}</div>
          </div>

          <table class="table">
            <thead>
              <tr>
                <th>Financial Breakdown</th>
                <th style="text-align: right;">Amount (${currencySymbol})</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Total Invoice / Order Amount</td>
                <td style="text-align: right; font-weight: 700;">${totalAmount.toLocaleString()}</td>
              </tr>
              <tr>
                <td>Previously Settled Amount</td>
                <td style="text-align: right;">${previouslyPaid.toLocaleString()}</td>
              </tr>
              <tr style="background-color: #f8fafc;">
                <td><strong>Current Payment Received (This Voucher)</strong></td>
                <td style="text-align: right; font-weight: 900; color: #047857;"><strong>${createdReceipt.amount.toLocaleString()}</strong></td>
              </tr>
              <tr>
                <td><strong>Remaining Unpaid Outstanding Balance</strong></td>
                <td style="text-align: right; font-weight: 800; color: ${calculatedRemaining === 0 ? '#10b981' : '#e11d48'};">
                  <strong>${calculatedRemaining.toLocaleString()}</strong>
                </td>
              </tr>
            </tbody>
          </table>

          ${createdReceipt.notes ? `<div style="padding: 12px; background: #fffbebf; border: 1px dashed #f59e0b; border-radius: 8px; font-size: 12px; margin-bottom: 24px;"><strong>Payment Note:</strong> ${createdReceipt.notes}</div>` : ''}

          <div class="footer">
            <div>
              <div>Recorded By: <strong>${createdReceipt.collected_by}</strong></div>
              <div>System Audit Stamp: ${new Date().toLocaleString()}</div>
            </div>
            <div class="stamp-box">
              Authorized Signatory
            </div>
          </div>

          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  // Download PDF Receipt
  const handleDownloadPDFReceipt = () => {
    if (!createdReceipt) return;

    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(18);
    doc.setTextColor(15, 23, 42);
    doc.text(business?.name || 'OmniPack ERP', 14, 20);

    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`GSTIN: ${business?.gstin || 'N/A'} | Phone: ${business?.phone || ''}`, 14, 26);
    doc.text(business?.billing_address || '', 14, 31);

    doc.setFontSize(14);
    doc.setTextColor(16, 185, 129);
    doc.text(`${type === 'Sales' ? 'PAYMENT RECEIPT' : 'PAYMENT VOUCHER'}`, 140, 20, { align: 'left' });
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text(`Voucher #: ${createdReceipt.receipt_number}`, 140, 26);
    doc.text(`Date: ${createdReceipt.payment_date}`, 140, 31);

    doc.setLineWidth(0.5);
    doc.setDrawColor(226, 232, 240);
    doc.line(14, 36, 196, 36);

    // Party Details
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(`Party: ${partyName}`, 14, 46);
    doc.text(`Order Ref: #${order.order_number}`, 140, 46);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Phone: ${partyPhone} ${partyEmail ? '| ' + partyEmail : ''}`, 14, 52);
    doc.text(`Total Order Bill: ${currencySymbol}${totalAmount.toLocaleString()}`, 140, 52);

    // Table
    autoTable(doc, {
      startY: 60,
      head: [['Financial Item', `Amount (${currencySymbol})`]],
      body: [
        ['Total Order Amount', `${totalAmount.toLocaleString()}`],
        ['Previously Paid', `${previouslyPaid.toLocaleString()}`],
        ['Current Payment Received', `${createdReceipt.amount.toLocaleString()}`],
        ['Remaining Balance', `${calculatedRemaining.toLocaleString()}`]
      ],
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 12;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`Payment Mode: ${createdReceipt.payment_mode}`, 14, finalY);
    if (createdReceipt.reference_no) {
      doc.text(`Reference / UTR #: ${createdReceipt.reference_no}`, 14, finalY + 6);
    }
    doc.text(`Collected By: ${createdReceipt.collected_by}`, 140, finalY);

    doc.save(`${createdReceipt.receipt_number}.pdf`);
  };

  // WhatsApp Receipt Share
  const handleShareWhatsApp = () => {
    if (!createdReceipt) return;

    let msg = '';
    if (type === 'Sales') {
      const updatedPaidAmount = (order.paid_amount || 0) + createdReceipt.amount;
      const updatedOrder = {
        ...order,
        paid_amount: updatedPaidAmount
      } as SalesOrder;

      const businessName = business?.name || 'कोकणस्थ';
      const googleReviewUrl = (business as any)?.google_review_url || 'https://share.google/92HZuDJaVzQA5Sd5x';

      msg = generateWhatsAppInvoiceMessage(updatedOrder, partyName, businessName, googleReviewUrl);
    } else {
      msg = `*Payment Receipt Confirmation* 🧾\n` +
        `Business: *${business?.name || 'OmniPack ERP'}*\n` +
        `Voucher #: *${createdReceipt.receipt_number}*\n` +
        `Order #: *${order.order_number}*\n` +
        `Party: *${partyName}*\n\n` +
        `-----------------------------\n` +
        `*Amount Paid: ${currencySymbol}${createdReceipt.amount.toLocaleString()}*\n` +
        `Payment Mode: ${createdReceipt.payment_mode}\n` +
        (createdReceipt.reference_no ? `Ref / UTR #: ${createdReceipt.reference_no}\n` : '') +
        `*Remaining Outstanding Balance: ${currencySymbol}${calculatedRemaining.toLocaleString()}*\n` +
        `-----------------------------\n` +
        `Thank you for your business!`;
    }

    const cleanPhone = formatWhatsAppPhone(partyPhone);
    if (!cleanPhone) {
      triggerToast('Party phone number not available.', 'error');
      return;
    }
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  return (
    <div 
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[100] bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150 overflow-y-auto"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col my-auto animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-slate-950 text-white p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-2xl ${type === 'Sales' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-indigo-500/20 text-indigo-400'}`}>
              <DollarSign size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                  type === 'Sales' ? 'bg-emerald-500/30 text-emerald-300' : 'bg-indigo-500/30 text-indigo-300'
                }`}>
                  {type === 'Sales' ? 'Inward Payment Collection' : 'Outward Vendor Settlement'}
                </span>
              </div>
              <h3 className="text-base font-black text-white mt-0.5">
                {order.order_number} • {partyName}
              </h3>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl bg-slate-800 hover:bg-slate-700 transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* STEP 1: PAYMENT ENTRY FORM */}
        {step === 'entry' && (
          <form onSubmit={handleProcessPayment} className="p-5 space-y-4 text-xs overflow-y-auto max-h-[80vh]">
            
            {/* Financial Summary Card */}
            <div className="grid grid-cols-3 gap-2 p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-800">
              <div className="space-y-0.5">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Total Bill</span>
                <span className="text-sm font-black text-slate-900 dark:text-white block">
                  {currencySymbol}{totalAmount.toLocaleString()}
                </span>
              </div>
              <div className="space-y-0.5 border-l border-slate-200 dark:border-slate-700 pl-2">
                <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">Already Paid</span>
                <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 block">
                  {currencySymbol}{previouslyPaid.toLocaleString()}
                </span>
              </div>
              <div className="space-y-0.5 border-l border-slate-200 dark:border-slate-700 pl-2">
                <span className="text-[10px] font-semibold text-rose-500 uppercase tracking-wider block">Outstanding Due</span>
                <span className="text-sm font-black text-rose-600 dark:text-rose-400 block">
                  {currencySymbol}{currentOutstanding.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Presets / Quick Amount Buttons */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  Collection / Settlement Amount ({currencySymbol})
                </label>
                <span className="text-[10px] text-slate-400 font-medium">Quick Presets:</span>
              </div>
              
              <div className="grid grid-cols-3 gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => handleApplyPreset(100)}
                  className={`py-2 px-2 rounded-xl border text-[11px] font-bold transition cursor-pointer flex items-center justify-center gap-1 ${
                    paymentAmount === currentOutstanding && currentOutstanding > 0
                      ? 'bg-emerald-600 text-white border-emerald-500 shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <CheckCircle2 size={13} /> Full Balance
                </button>

                <button
                  type="button"
                  onClick={() => handleApplyPreset(50)}
                  className={`py-2 px-2 rounded-xl border text-[11px] font-bold transition cursor-pointer flex items-center justify-center gap-1 ${
                    paymentAmount === Math.round(currentOutstanding * 0.5) && currentOutstanding > 0
                      ? 'bg-emerald-600 text-white border-emerald-500 shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
                  }`}
                >
                  50% Part Pay
                </button>

                <button
                  type="button"
                  onClick={() => handleApplyPreset(25)}
                  className={`py-2 px-2 rounded-xl border text-[11px] font-bold transition cursor-pointer flex items-center justify-center gap-1 ${
                    paymentAmount === Math.round(currentOutstanding * 0.25) && currentOutstanding > 0
                      ? 'bg-emerald-600 text-white border-emerald-500 shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
                  }`}
                >
                  25% Part Pay
                </button>
              </div>

              {/* Amount Input */}
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-black text-sm">
                  {currencySymbol}
                </span>
                <input 
                  type="number"
                  min="1"
                  max={currentOutstanding}
                  step="any"
                  value={paymentAmount || ''}
                  onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                  className="w-full pl-8 pr-3 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-emerald-500/50 rounded-2xl text-base font-black text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500 transition shadow-inner"
                  placeholder="Enter amount..."
                  required
                />
              </div>

              {/* Dynamic Balance Preview Banner */}
              <div className="mt-2 p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 flex items-center justify-between text-[11px]">
                <span className="text-slate-500 font-medium">Remaining Balance After Payment:</span>
                <span className={`font-black ${calculatedRemaining === 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                  {currencySymbol}{calculatedRemaining.toLocaleString()} 
                  <span className="ml-1 text-[10px] font-bold">
                    ({calculatedRemaining === 0 ? 'Fully Paid' : 'Partially Outstanding'})
                  </span>
                </span>
              </div>
            </div>

            {/* Payment Mode */}
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                Payment Mode / Gateway
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { mode: 'UPI / QR', icon: QrCode },
                  { mode: 'Cash', icon: Banknote },
                  { mode: 'Card', icon: CreditCard },
                  { mode: 'Bank Transfer', icon: Building2 },
                  { mode: 'Cheque', icon: FileText },
                  { mode: 'Credit / On Account', icon: ShieldCheck }
                ].map(({ mode, icon: Icon }) => (
                  <button 
                    key={mode}
                    type="button"
                    onClick={() => setPaymentMode(mode)}
                    className={`p-2.5 rounded-xl border text-[11px] font-bold transition cursor-pointer flex items-center gap-1.5 ${
                      paymentMode === mode 
                        ? 'bg-slate-900 text-white dark:bg-emerald-600 dark:text-white border-slate-900 dark:border-emerald-500 shadow-sm' 
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <Icon size={14} className="shrink-0" />
                    <span className="truncate">{mode}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Reference No & Account */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Reference / UTR / Cheque #
                </label>
                <input 
                  type="text"
                  value={referenceNo}
                  onChange={(e) => setReferenceNo(e.target.value)}
                  placeholder="e.g. UPI-982189 / CHQ-1042"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-xs focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Deposit / Cash Account
                </label>
                <select 
                  value={bankAccount}
                  onChange={(e) => setBankAccount(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-xs focus:outline-hidden focus:border-emerald-500"
                >
                  <option value={business?.bank_name || 'Main Bank Account'}>{business?.bank_name || 'Main Bank A/C'}</option>
                  <option value="Main Counter Cash Drawer">Main Counter Cash Drawer</option>
                  <option value="Petty Cash Box">Petty Cash Box</option>
                  <option value="Business UPI QR Account">Business UPI QR Account</option>
                </select>
              </div>
            </div>

            {/* Payment Date & Remarks */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Payment Date
                </label>
                <input 
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-xs focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Notes / Remarks
                </label>
                <input 
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Part payment received"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-xs focus:outline-hidden focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Past Payment History list if any */}
            {(order.payment_history || []).length > 0 && (
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
                <span className="font-bold text-[10px] text-slate-400 uppercase tracking-wider block flex items-center gap-1">
                  <History size={12} /> Previous Payment Receipts ({order.payment_history?.length})
                </span>
                <div className="max-h-24 overflow-y-auto space-y-1.5 pr-1">
                  {order.payment_history?.map((r, i) => (
                    <div key={r.id || i} className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700 flex items-center justify-between text-[11px]">
                      <div>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{r.receipt_number}</span>
                        <span className="text-slate-400 block text-[10px]">{r.payment_date} • {r.payment_mode}</span>
                      </div>
                      <span className="font-black text-emerald-600 dark:text-emerald-400">
                        +{currencySymbol}{r.amount.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-2">
              <button 
                type="submit"
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl text-xs transition shadow-lg cursor-pointer flex items-center justify-center gap-2"
              >
                <CheckCircle2 size={18} /> Confirm {currencySymbol}{paymentAmount.toLocaleString()} Settlement & Generate Receipt
              </button>
            </div>

          </form>
        )}

        {/* STEP 2: POST-COLLECTION MASTER ACTION CENTER ("There is options after collect") */}
        {step === 'success_options' && createdReceipt && (
          <div className="p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            
            {/* Success Celebration Card */}
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 rounded-2xl text-center space-y-1">
              <div className="w-12 h-12 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto shadow-md animate-bounce">
                <Check size={24} strokeWidth={3} />
              </div>
              <h4 className="text-base font-black text-emerald-950 dark:text-emerald-200 pt-1">
                Payment Recorded & Voucher Generated!
              </h4>
              <p className="text-xs text-emerald-700 dark:text-emerald-300 font-medium">
                Voucher <strong className="font-mono font-bold">{createdReceipt.receipt_number}</strong> created successfully.
              </p>
            </div>

            {/* Receipt Summary Details */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-700">
                <span className="text-slate-500 font-medium">Amount Received:</span>
                <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                  {currencySymbol}{createdReceipt.amount.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                <span>Payment Mode & Ref:</span>
                <span className="font-bold">{createdReceipt.payment_mode} {createdReceipt.reference_no ? `(${createdReceipt.reference_no})` : ''}</span>
              </div>
              <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                <span>Remaining Balance Due:</span>
                <span className={`font-black ${calculatedRemaining === 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                  {currencySymbol}{calculatedRemaining.toLocaleString()}
                </span>
              </div>
            </div>

            {/* ACTION OPTIONS CENTER */}
            <div>
              <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block mb-2.5">
                Select Next Action / Sharing Options:
              </span>

              <div className="grid grid-cols-1 gap-2.5">
                {/* 1. Print Official Receipt */}
                <button
                  type="button"
                  onClick={handlePrintReceipt}
                  className="w-full py-3 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-2xl font-black text-xs transition flex items-center justify-between cursor-pointer shadow-sm"
                >
                  <div className="flex items-center gap-2.5">
                    <Printer size={18} />
                    <span>Print Official Payment Receipt Voucher</span>
                  </div>
                  <ArrowRight size={16} />
                </button>

                {/* 2. Download PDF Voucher */}
                <button
                  type="button"
                  onClick={handleDownloadPDFReceipt}
                  className="w-full py-3 px-4 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white rounded-2xl font-black text-xs transition flex items-center justify-between cursor-pointer shadow-sm"
                >
                  <div className="flex items-center gap-2.5">
                    <Download size={18} />
                    <span>Download Payment Voucher PDF</span>
                  </div>
                  <ArrowRight size={16} />
                </button>

                {/* 3. Send WhatsApp Acknowledgement */}
                {partyPhone && (
                  <button
                    type="button"
                    onClick={handleShareWhatsApp}
                    className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black text-xs transition flex items-center justify-between cursor-pointer shadow-sm"
                  >
                    <div className="flex items-center gap-2.5">
                      <Send size={18} />
                      <span>Send WhatsApp Receipt to {partyName} ({partyPhone})</span>
                    </div>
                    <ArrowRight size={16} />
                  </button>
                )}

                {/* 4. Complete & Close */}
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-3.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-2xl font-extrabold text-xs transition cursor-pointer flex items-center justify-center gap-2 mt-1"
                >
                  <CheckCircle2 size={16} /> Complete & Done
                </button>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
