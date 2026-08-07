const fs = require('fs');

let content = fs.readFileSync('src/components/ProductModule.tsx', 'utf8');

const oldCss = `              .print-area { 
                display: block !important; 
                position: fixed !important;
                top: 0 !important;
                left: 0 !important;
                width: \${printLabelsPerRow === 2 ? (printLabelSize === '38x25' ? '80mm' : '105mm') : (printLabelSize === '38x25' ? '40mm' : '55mm')} !important;
                height: auto !important;
                margin: 0 !important;
                padding: 0 !important;
                background: #ffffff !important;
                z-index: 99999999 !important;
                overflow: visible !important;
              }
              
              .barcode-print-grid { 
                display: block !important; 
                width: 100% !important;
                margin: 0 !important;
                padding: 0 !important;
                text-align: left !important;
                font-size: 0 !important; /* remove whitespace between inline-block elements */
              }
              
              .barcode-label-sticker {
                box-sizing: border-box !important;
                margin: 0 !important;
                border: none !important;
                display: inline-flex !important;
                flex-direction: column !important;
                justify-content: flex-start !important;
                align-items: center !important;
                text-align: center !important;
                overflow: hidden !important;
                background: #ffffff !important;
                color: #000000 !important;
                page-break-inside: avoid !important;
                break-inside: avoid !important;
                vertical-align: top !important;
              }
              \${printLabelsPerRow === 2 ? \`
              .barcode-label-sticker:nth-child(odd) {
                margin-right: 2mm !important;
              }
              \` : ''}`;

const newCss = `              .print-area { 
                display: block !important; 
                position: fixed !important;
                top: 0 !important;
                left: 0 !important;
                width: \${printLabelsPerRow === 2 ? (printLabelSize === '38x25' ? '80mm' : '104mm') : (printLabelSize === '38x25' ? '40mm' : '52mm')} !important;
                height: auto !important;
                margin: 0 !important;
                padding: 0 !important;
                background: #ffffff !important;
                z-index: 99999999 !important;
                overflow: visible !important;
              }
              
              .barcode-print-grid { 
                display: flex !important; 
                flex-wrap: wrap !important;
                width: 100% !important;
                margin: 0 !important;
                padding: 0 !important;
                align-content: flex-start !important;
              }
              
              .barcode-label-sticker {
                box-sizing: border-box !important;
                margin: 0 !important;
                border: none !important;
                display: flex !important;
                flex-direction: column !important;
                justify-content: flex-start !important;
                align-items: center !important;
                text-align: center !important;
                overflow: hidden !important;
                background: #ffffff !important;
                color: #000000 !important;
                page-break-inside: avoid !important;
                break-inside: avoid !important;
              }
              \${printLabelsPerRow === 2 ? \`
              .barcode-label-sticker:nth-child(odd) {
                margin-right: 4mm !important; /* Space between two columns */
              }
              \` : ''}`;

if (content.includes(oldCss)) {
    content = content.replace(oldCss, newCss);
    
    // Also update @page size to include the height
    const oldPageCss = `              @page { 
                size: \${printLabelsPerRow === 2 ? (printLabelSize === '38x25' ? '80mm' : '105mm') : (printLabelSize === '38x25' ? '40mm' : '55mm')} auto; 
                margin: 0mm !important; 
              }`;
              
    const newPageCss = `              @page { 
                size: \${printLabelsPerRow === 2 ? (printLabelSize === '38x25' ? '80mm' : '104mm') : (printLabelSize === '38x25' ? '40mm' : '52mm')} \${printLabelSize === '50x38' ? '38mm' : '25mm'}; 
                margin: 0mm !important; 
              }`;
    
    content = content.replace(oldPageCss, newPageCss);
    fs.writeFileSync('src/components/ProductModule.tsx', content);
    console.log("Updated ProductModule.tsx successfully!");
} else {
    console.log("Could not find the target CSS to replace.");
}
