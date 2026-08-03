const fs = require('fs');
let content = fs.readFileSync('src/components/PurchaseModule.tsx', 'utf8');

const oldPrint = `
      doc.text('Vendor Details', 120, 32);
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text(sup?.name || 'Unknown Vendor', 120, 38);
      doc.text(\`Phone: \${sup?.phone || '-'}\`, 120, 44);
      doc.text(\`GSTIN: \${sup?.gstin || '-'}\`, 120, 50);

      const tableColumn = ["Product Name", "Qty", "Unit Price", "GST %", "Total"];
      const tableRows = po.items.map(item => {
        const prod = products.find(p => p.id === item.product_id);
        const lineTotal = item.qty * item.purchase_price;
        const tax = lineTotal * (item.gst_rate / 100);
        return [
          prod?.name || 'Unknown',
          item.qty.toString(),
          \`Rs. \${item.purchase_price.toLocaleString()}\`,
          \`\${item.gst_rate}%\`,
          \`Rs. \${(lineTotal + tax).toLocaleString()}\`
        ];
      });

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 60,
        styles: { fontSize: 9 },
        headStyles: { fillColor: [79, 70, 229] },
      });
`;

const newPrint = `
      const tableColumn = ["Product Name", "Qty", "Unit Price", "GST %", "Total"];
      let totalQty = 0;
      let totalVal = 0;
      const tableRows = po.items.map(item => {
        const prod = products.find(p => p.id === item.product_id);
        const lineTotal = item.qty * item.purchase_price;
        const tax = lineTotal * (item.gst_rate / 100);
        const lineGross = lineTotal + tax;
        totalQty += item.qty;
        totalVal += lineGross;
        return [
          prod?.name || 'Unknown',
          item.qty.toString(),
          \`Rs. \${item.purchase_price.toLocaleString()}\`,
          \`\${item.gst_rate}%\`,
          \`Rs. \${lineGross.toLocaleString(undefined, {minimumFractionDigits: 2})}\`
        ];
      });
      
      tableRows.push([
        'TOTAL',
        totalQty.toString(),
        '',
        '',
        \`Rs. \${totalVal.toLocaleString(undefined, {minimumFractionDigits: 2})}\`
      ]);

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 60,
        styles: { fontSize: 9 },
        headStyles: { fillColor: [79, 70, 229] },
        didParseCell: function (data) {
          if (data.row.index === tableRows.length - 1) {
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.textColor = [30, 41, 59];
          }
        }
      });
      
      const finalY = (doc as any).lastAutoTable.finalY || 60;
      
      doc.setFontSize(12);
      doc.setTextColor(30, 41, 59);
      doc.text('Vendor / Party Details', 14, finalY + 15);
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text(sup?.name || 'Unknown Vendor', 14, finalY + 22);
      doc.text(\`Phone: \${sup?.phone || '-'}\`, 14, finalY + 28);
      doc.text(\`GSTIN: \${sup?.gstin || '-'}\`, 14, finalY + 34);
`;

content = content.replace(oldPrint, newPrint);

fs.writeFileSync('src/components/PurchaseModule.tsx', content);
