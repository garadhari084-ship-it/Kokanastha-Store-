const fs = require('fs');
let content = fs.readFileSync('src/components/SalesModule.tsx', 'utf8');

if (!content.includes('const fastScanInputRef = useRef<HTMLInputElement>(null);')) {
  content = content.replace(
    /const \[barcodeInput, setBarcodeInput\] = useState\(''\);/,
    `const [barcodeInput, setBarcodeInput] = useState('');\n  const fastScanInputRef = useRef<HTMLInputElement>(null);`
  );
}

content = content.replace(
  /<input\s+type="text"\s+placeholder="Scan or type barcode here and press Enter\.\.\."\s+value=\{barcodeInput\}/,
  `<input 
                        ref={fastScanInputRef}
                        type="text" 
                        placeholder="Scan or type barcode here and press Enter..."
                        value={barcodeInput}`
);

content = content.replace(
  /triggerToast\('Added: ' \+ p\.name, 'success'\);\s*return \[\.\.\.prevItems, newItem\];\s*\}\s*\}\);\s*setBarcodeInput\(''\);/g,
  `triggerToast('Added: ' + p.name, 'success');
      return [...prevItems, newItem];
    }
  });
  setBarcodeInput('');
  setTimeout(() => fastScanInputRef.current?.focus(), 10);`
);

content = content.replace(
  /triggerToast\('Product not found for barcode: ' \+ code, 'error'\);\s*setBarcodeInput\(''\);/g,
  `triggerToast('Product not found for barcode: ' + code, 'error');
  setBarcodeInput('');
  setTimeout(() => fastScanInputRef.current?.focus(), 10);`
);

fs.writeFileSync('src/components/SalesModule.tsx', content);
console.log('Success focus fix');
