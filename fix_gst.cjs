const fs = require('fs');
let content = fs.readFileSync('src/components/PurchaseModule.tsx', 'utf8');

// 1. Add rowGst state
content = content.replace(
  "const [rowPrice, setRowPrice] = useState(0);",
  "const [rowPrice, setRowPrice] = useState(0);\n  const [rowGst, setRowGst] = useState(0);"
);

// 2. Reset rowGst
content = content.replace(
  "setRowPrice(0);\n  };",
  "setRowPrice(0);\n    setRowGst(0);\n  };"
);

// 3. Set rowGst on product select
content = content.replace(
  "setRowPrice(prod.purchase_price);\n    }",
  "setRowPrice(prod.purchase_price);\n      setRowGst(prod.gst_rate);\n    }"
);

// 4. Use rowGst in handleAddRowItem
content = content.replace(
  "gst_rate: prod.gst_rate\n    };",
  "gst_rate: rowGst\n    };"
);

// 5. Reset rowGst after adding
content = content.replace(
  "setRowPrice(0);\n  };\n\n  const handleRemoveItem",
  "setRowPrice(0);\n    setRowGst(0);\n  };\n\n  const handleRemoveItem"
);

// 6. Add GST input field in UI
const unitPriceField = `<div className="w-28 space-y-1">
                    <label className="text-[10px] font-semibold text-slate-500">Unit Price (₹)</label>
                    <input 
                      type="number" 
                      min="0"
                      value={rowPrice}
                      onChange={(e) => setRowPrice(parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-900 text-xs rounded border border-slate-300 dark:border-slate-600 text-right"
                    />
                  </div>`;

const newFields = `<div className="w-28 space-y-1">
                    <label className="text-[10px] font-semibold text-slate-500">Unit Price (₹)</label>
                    <input 
                      type="number" 
                      min="0"
                      value={rowPrice}
                      onChange={(e) => setRowPrice(parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-900 text-xs rounded border border-slate-300 dark:border-slate-600 text-right"
                    />
                  </div>
                  <div className="w-24 space-y-1">
                    <label className="text-[10px] font-semibold text-slate-500">GST %</label>
                    <input 
                      type="number" 
                      min="0"
                      value={rowGst}
                      onChange={(e) => setRowGst(parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-900 text-xs rounded border border-slate-300 dark:border-slate-600 text-right"
                    />
                  </div>`;

content = content.replace(unitPriceField, newFields);

fs.writeFileSync('src/components/PurchaseModule.tsx', content);
