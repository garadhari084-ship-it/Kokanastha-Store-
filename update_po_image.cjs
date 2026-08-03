const fs = require('fs');
let content = fs.readFileSync('src/types/erp.ts', 'utf8');

if (!content.includes('invoice_image?: string;')) {
    content = content.replace(
        "payment_history?: PaymentRecord[];\n  items: PurchaseItem[];",
        "payment_history?: PaymentRecord[];\n  invoice_image?: string;\n  items: PurchaseItem[];"
    );
    fs.writeFileSync('src/types/erp.ts', content);
}
