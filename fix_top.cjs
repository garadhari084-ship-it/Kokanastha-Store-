const fs = require('fs');
let content = fs.readFileSync('src/components/PurchaseModule.tsx', 'utf8');

const marker = "import { PaymentCollectionModal } from './PaymentCollectionModal';";
const parts = content.split(marker);

if (parts.length === 2 && parts[0].includes('const poNumber')) {
    // Top part contains the injected string. Remove it.
    let restOfFile = marker + parts[1];
    
    // Now we need to manually find handleSavePO in restOfFile and replace its body.
    const startOfHandleSavePO = restOfFile.indexOf('const handleSavePO = (e: React.FormEvent) => {');
    const endOfHandleSavePO = restOfFile.indexOf('const handleUpdateStatus = (poId: string, newStatus: PurchaseOrder[\'status\']) => {');
    
    if (startOfHandleSavePO !== -1 && endOfHandleSavePO !== -1) {
        const bodyStart = restOfFile.indexOf('const poNumber = `PO-', startOfHandleSavePO);
        if (bodyStart !== -1) {
            const before = restOfFile.substring(0, bodyStart);
            const after = restOfFile.substring(endOfHandleSavePO);
            
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
      setPurchases(dbStore.getPurchaseOrders(businessId));
    } catch (e: any) {
      triggerToast(e.message || 'Error creating PO', 'error');
    }
  };

  `;
            content = before + handleSavePO + after;
        }
    }
    
    fs.writeFileSync('src/components/PurchaseModule.tsx', content);
}
