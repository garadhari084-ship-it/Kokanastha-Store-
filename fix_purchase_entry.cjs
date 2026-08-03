const fs = require('fs');
let content = fs.readFileSync('src/components/PurchaseModule.tsx', 'utf8');

// 1. Add new state for initialOrderStatus and pendingPOToConfirm
content = content.replace(
  "const [initialPaymentStatus, setInitialPaymentStatus] = useState<'Unpaid' | 'Partial' | 'Paid'>('Unpaid');",
  "const [initialOrderStatus, setInitialOrderStatus] = useState<'Draft' | 'Ordered' | 'Received'>('Received');\n  const [initialPaymentStatus, setInitialPaymentStatus] = useState<'Unpaid' | 'Partial' | 'Paid'>('Unpaid');\n  const [pendingPOToConfirm, setPendingPOToConfirm] = useState<any>(null);"
);

// 2. Add reset for initialOrderStatus
content = content.replace(
  "setInitialPaymentStatus('Unpaid');",
  "setInitialOrderStatus('Received');\n    setInitialPaymentStatus('Unpaid');"
);

// 3. Update handleSavePO to check for auto-conversion if status is Received
const handleSavePO = `
    const poNumber = \`PO-\${new Date().getFullYear()}\${String(new Date().getMonth()+1).padStart(2, '0')}-\${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}\`;

    let calcPaidAmount = 0;
    let finalPayStatus = initialPaymentStatus;
    if (initialPaymentStatus === 'Paid') {
      calcPaidAmount = totalAmount;
    } else if (initialPaymentStatus === 'Partial') {
      calcPaidAmount = Math.min(totalAmount, Math.max(0, initialPaidAmount));
      if (calcPaidAmount >= totalAmount) {
        finalPayStatus = 'Paid';
      }
    } else {
      calcPaidAmount = 0;
    }
    
    const newPOData = {
        order_number: poNumber,
        supplier_id: selectedSupplierId,
        order_date: new Date().toISOString().split('T')[0],
        delivery_date: deliveryDate,
        status: initialOrderStatus,
        payment_status: finalPayStatus,
        paid_amount: calcPaidAmount,
        payment_mode: initialPaymentMode,
        payment_notes: initialPaymentNotes.trim(),
        payment_date: calcPaidAmount > 0 ? new Date().toISOString().split('T')[0] : undefined,
        items: items,
        total_amount: totalAmount,
        business_id: businessId
    };

    if (initialOrderStatus === 'Received') {
      const hasAutoConversion = items.some(item => {
        const prod = products.find(p => p.id === item.product_id);
        return prod && prod.auto_conversion;
      });
      if (hasAutoConversion) {
        setPendingPOToConfirm(newPOData);
        return;
      }
    }

    executeSavePO(newPOData);
  };

  const executeSavePO = (poData: any) => {
    try {
      dbStore.createPurchaseOrder(poData);
      dbStore.logActivity(user.id, user.name, user.role, 'Create PO', \`Generated new Purchase Order: \${poData.order_number}\`, businessId);
      triggerToast(\`Purchase Order \${poData.order_number} created successfully.\`, 'success');
      setIsModalOpen(false);
      setPendingPOToConfirm(null);
    } catch (e: any) {
      triggerToast(e.message || 'Error creating PO', 'error');
    }
  };
`;

// we need to replace the content of handleSavePO from "const poNumber =" to the end of handleSavePO block
content = content.replace(
  /const poNumber = `PO-\$\{new Date\(\)\.getFullYear\(\)\}\$\{String[\s\S]*?catch \(e: any\) \{\n      triggerToast\(e\.message || 'Error creating PO', 'error'\);\n    \}\n  \};/,
  handleSavePO.trim()
);


// 4. Add Order Status dropdown in UI
const paymentDetailsHeader = `<h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <CreditCard size={14} className="text-emerald-600" /> Initial Payment Setup
                </h3>`;

const paymentDetailsHeaderReplacement = `<div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4 border-b border-slate-200 dark:border-slate-700 pb-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Purchase Entry Status *</label>
                    <select
                      value={initialOrderStatus}
                      onChange={(e) => setInitialOrderStatus(e.target.value as any)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-600 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="Draft">Save as Draft</option>
                      <option value="Ordered">Mark as Ordered (Pending Delivery)</option>
                      <option value="Received">Direct Purchase (Received Goods)</option>
                    </select>
                  </div>
                </div>
                <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <CreditCard size={14} className="text-emerald-600" /> Initial Payment Setup
                </h3>`;

content = content.replace(paymentDetailsHeader, paymentDetailsHeaderReplacement);

// 5. Update the Auto Conversion Modal to handle both pendingPOToConfirm and orderToReceive
const modalCondition = `{orderToReceive && (`;
const modalConditionReplacement = `{(orderToReceive || pendingPOToConfirm) && (`;

content = content.replace(modalCondition, modalConditionReplacement);

const modalMap = `{orderToReceive.items.map((item, idx) => {`;
const modalMapReplacement = `{(orderToReceive || pendingPOToConfirm).items.map((item: any, idx: number) => {`;

content = content.replace(modalMap, modalMapReplacement);

const modalCancelBtn = `onClick={() => setOrderToReceive(null)}`;
const modalCancelBtnReplacement = `onClick={() => { setOrderToReceive(null); setPendingPOToConfirm(null); }}`;

content = content.replace(modalCancelBtn, modalCancelBtnReplacement);

const modalConfirmBtn = `onClick={() => {
                    handleUpdateStatus(orderToReceive.id, 'Received');
                    setOrderToReceive(null);
                  }}`;
const modalConfirmBtnReplacement = `onClick={() => {
                    if (pendingPOToConfirm) {
                      executeSavePO(pendingPOToConfirm);
                    } else if (orderToReceive) {
                      handleUpdateStatus(orderToReceive.id, 'Received');
                      setOrderToReceive(null);
                    }
                  }}`;

content = content.replace(modalConfirmBtn, modalConfirmBtnReplacement);

fs.writeFileSync('src/components/PurchaseModule.tsx', content);
