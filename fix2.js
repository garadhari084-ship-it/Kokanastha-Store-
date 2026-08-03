const fs = require('fs');
let content = fs.readFileSync('src/components/PurchaseModule.tsx', 'utf8');

// The file currently starts with the injected handleSavePO code.
// Let's find the 'import { PaymentCollectionModal }' line and move everything before it into the correct place.

const parts = content.split("import { PaymentCollectionModal } from './PaymentCollectionModal';");

if (parts.length === 2) {
    const injectedCode = parts[0];
    let restOfFile = "import { PaymentCollectionModal } from './PaymentCollectionModal';" + parts[1];
    
    // Now we need to find where the injected code SHOULD have gone.
    // The injected code replaced: "const poNumber = `PO-${new Date().getFullYear()}${String(new Date().getMonth()+1).padStart(2, '0')}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;" inside handleSavePO.
    // But since it matched the whole file or something, we need to find "const handleSavePO = (e: React.FormEvent) => {"
    
    // Let's look at what is currently inside handleSavePO in the restOfFile.
    // Wait, the regex in fix_purchase_entry.cjs was:
    // /const poNumber = \`PO-\$\{new Date\(\)\.getFullYear\(\)\}\$\{String[\s\S]*?catch \(e: any\) \{\n      triggerToast\(e\.message || 'Error creating PO', 'error'\);\n    \}\n  \};/
    
    // Since it matched the FIRST occurrence of "const poNumber", maybe it matched something I didn't see?
    // No, wait, if the file didn't have "const poNumber" at the top before my script...
    // Oh, I see, `content = content.replace(/const poNumber = \`PO-\$\{new Date\(\)\.getFullYear\(\)\}\$\{String[\s\S]*?catch \(e: any\) \{\n      triggerToast\(e\.message || 'Error creating PO', 'error'\);\n    \}\n  \};/, handleSavePO.trim());`
    
    // This replaced from the FIRST match of `const poNumber = ...` all the way to `... };`.
    // Wait, it replaced from the FIRST match, but why did it put it at the very top of the file?
    // Because I accidentally did a global replace or something?
    // No, if the FIRST match was at the very top of the file... no it wasn't.
    // Wait, if it's at the top of the file now, it means it didn't find the match! It just prepended it?
    // Let's check `fix_purchase_entry.cjs`: I did `content = content.replace(...)`. If it matched at index 0, it means the entire string matched? No.
    // Ah, wait! The regex didn't match at all? No, if it didn't match, it wouldn't change anything.
    // Oh! The regex matched `import { PaymentCollectionModal }` because `[\s\S]*` matched EVERYTHING from the first `const poNumber` to the LAST `catch (e: any) { ... } };` in the file!!
    // It matched greedily from `const poNumber` inside `handleSavePO` all the way to some other catch block at the end of the file!! No wait, `catch (e: any)` inside `handleSavePO`.
    // Oh, wait, the start of `handleSavePO` was not deleted. Let's see what is currently around line 300.
    
    fs.writeFileSync('injected.txt', injectedCode);
    fs.writeFileSync('rest.txt', restOfFile);
}
