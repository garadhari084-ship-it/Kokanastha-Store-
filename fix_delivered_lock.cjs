const fs = require('fs');
let content = fs.readFileSync('src/components/SalesModule.tsx', 'utf-8');

// 1. handleOpenEditModal
content = content.replace(
  "if (order.delivery_status === 'Delivered' || order.status === 'Dispatched') {\n      triggerToast('Cannot edit an order that is already delivered or dispatched.', 'error');\n      return;\n    }",
  "if (order.status === 'Dispatched') {\n      triggerToast('Cannot edit an order that is out for delivery (Dispatched).', 'error');\n      return;\n    }\n    if (order.delivery_status === 'Delivered') {\n      triggerToast('Note: This order is already delivered. Any changes will update the inventory records.', 'info');\n    }"
);

// 2. Quick View Modal Edit button click
content = content.replace(
  "if (selectedOrderForDetail.delivery_status === 'Delivered' || selectedOrderForDetail.status === 'Dispatched') {\n                      triggerToast('Cannot edit an order that is out for delivery or delivered.', 'error');\n                      return;\n                    }",
  "if (selectedOrderForDetail.status === 'Dispatched') {\n                      triggerToast('Cannot edit an order that is out for delivery (Dispatched).', 'error');\n                      return;\n                    }\n                    if (selectedOrderForDetail.delivery_status === 'Delivered') {\n                      triggerToast('Note: This order is already delivered. Any changes will update the inventory records.', 'info');\n                    }"
);

// 3. Quick View Modal Edit button class
content = content.replace(
  "${(selectedOrderForDetail.delivery_status === 'Delivered' || selectedOrderForDetail.status === 'Dispatched') ? 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500 cursor-not-allowed' : 'bg-sky-100 hover:bg-sky-200 text-sky-700 dark:bg-sky-900/40 dark:hover:bg-sky-900/60 dark:text-sky-300 cursor-pointer'}",
  "${selectedOrderForDetail.status === 'Dispatched' ? 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500 cursor-not-allowed' : 'bg-sky-100 hover:bg-sky-200 text-sky-700 dark:bg-sky-900/40 dark:hover:bg-sky-900/60 dark:text-sky-300 cursor-pointer'}"
);

// 4. Full Invoice Modal Edit button click
content = content.replace(
  "if (viewingInvoiceOrder.delivery_status === 'Delivered' || viewingInvoiceOrder.status === 'Dispatched') {\n                        triggerToast('Cannot edit an order that is out for delivery or delivered.', 'error');\n                        return;\n                      }",
  "if (viewingInvoiceOrder.status === 'Dispatched') {\n                        triggerToast('Cannot edit an order that is out for delivery (Dispatched).', 'error');\n                        return;\n                      }\n                      if (viewingInvoiceOrder.delivery_status === 'Delivered') {\n                        triggerToast('Note: This order is already delivered. Any changes will update the inventory records.', 'info');\n                      }"
);

// 5. Full Invoice Modal Edit button class
content = content.replace(
  "${(viewingInvoiceOrder.delivery_status === 'Delivered' || viewingInvoiceOrder.status === 'Dispatched') ? 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500 cursor-not-allowed' : 'bg-sky-100 dark:bg-sky-950/60 hover:bg-sky-200 dark:hover:bg-sky-900/80 text-sky-700 dark:text-sky-300 cursor-pointer'}",
  "${viewingInvoiceOrder.status === 'Dispatched' ? 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500 cursor-not-allowed' : 'bg-sky-100 dark:bg-sky-950/60 hover:bg-sky-200 dark:hover:bg-sky-900/80 text-sky-700 dark:text-sky-300 cursor-pointer'}"
);

fs.writeFileSync('src/components/SalesModule.tsx', content);
