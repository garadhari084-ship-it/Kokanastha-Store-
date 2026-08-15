const fs = require('fs');
let content = fs.readFileSync('src/components/SalesModule.tsx', 'utf-8');

// 1. Update the note text
content = content.replace(
  "triggerToast('Note: Editing a packed order will revert its status to Pending.', 'info');",
  "triggerToast('Note: Editing a packed order will revert its status to Packing.', 'info');"
);

// 2. Update the status logic in Edit Flow
content = content.replace(
  "status: isFulfilledImmediately || isWalkIn ? 'Delivered' : existingOrder?.status === 'Packed' ? 'Pending' : (existingOrder?.status || 'Pending'),",
  "status: isFulfilledImmediately || isWalkIn ? 'Delivered' : existingOrder?.status === 'Packed' ? 'Packing' : (existingOrder?.status || 'Pending'),"
);

// 3. Update handleOpenEditModal checks
content = content.replace(
  "if (order.delivery_status === 'Delivered') {\n      triggerToast('Cannot edit an order that is already delivered.', 'error');\n      return;\n    }",
  "if (order.delivery_status === 'Delivered' || order.status === 'Dispatched') {\n      triggerToast('Cannot edit an order that is already delivered or dispatched.', 'error');\n      return;\n    }\n    if (order.payment_status === 'Paid') {\n      triggerToast('Cannot edit an order that is already fully paid.', 'error');\n      return;\n    }"
);

// 4. Update Quick View Modal Edit button
content = content.replace(
  "if (selectedOrderForDetail.delivery_status === 'Delivered') {\n                      triggerToast('Note: This order is already delivered. Any changes will update the inventory records.', 'info');\n                    }",
  "if (selectedOrderForDetail.delivery_status === 'Delivered' || selectedOrderForDetail.status === 'Dispatched') {\n                      triggerToast('Cannot edit an order that is out for delivery or delivered.', 'error');\n                      return;\n                    }\n                    if (selectedOrderForDetail.payment_status === 'Paid') {\n                      triggerToast('Cannot edit a fully paid order.', 'error');\n                      return;\n                    }"
);

content = content.replace(
  "${selectedOrderForDetail.delivery_status === 'Delivered' ? 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500 cursor-not-allowed' : 'bg-sky-100 hover:bg-sky-200 text-sky-700 dark:bg-sky-900/40 dark:hover:bg-sky-900/60 dark:text-sky-300 cursor-pointer'}",
  "${(selectedOrderForDetail.delivery_status === 'Delivered' || selectedOrderForDetail.status === 'Dispatched' || selectedOrderForDetail.payment_status === 'Paid') ? 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500 cursor-not-allowed' : 'bg-sky-100 hover:bg-sky-200 text-sky-700 dark:bg-sky-900/40 dark:hover:bg-sky-900/60 dark:text-sky-300 cursor-pointer'}"
);

// 5. Update Full Invoice Modal Edit button
content = content.replace(
  "if (viewingInvoiceOrder.delivery_status === 'Delivered') {\n                        triggerToast('Cannot edit an order that is already delivered.', 'error');\n                        return;\n                      }",
  "if (viewingInvoiceOrder.delivery_status === 'Delivered' || viewingInvoiceOrder.status === 'Dispatched') {\n                        triggerToast('Cannot edit an order that is out for delivery or delivered.', 'error');\n                        return;\n                      }\n                      if (viewingInvoiceOrder.payment_status === 'Paid') {\n                        triggerToast('Cannot edit a fully paid order.', 'error');\n                        return;\n                      }"
);

content = content.replace(
  "${viewingInvoiceOrder.delivery_status === 'Delivered' ? 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500 cursor-not-allowed' : 'bg-sky-100 dark:bg-sky-950/60 hover:bg-sky-200 dark:hover:bg-sky-900/80 text-sky-700 dark:text-sky-300 cursor-pointer'}",
  "${(viewingInvoiceOrder.delivery_status === 'Delivered' || viewingInvoiceOrder.status === 'Dispatched' || viewingInvoiceOrder.payment_status === 'Paid') ? 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500 cursor-not-allowed' : 'bg-sky-100 dark:bg-sky-950/60 hover:bg-sky-200 dark:hover:bg-sky-900/80 text-sky-700 dark:text-sky-300 cursor-pointer'}"
);

fs.writeFileSync('src/components/SalesModule.tsx', content);
