const fs = require('fs');
let content = fs.readFileSync('src/components/SalesModule.tsx', 'utf-8');

content = content.replace(
  /onPointerDown=\{\(e\) => \{ e\.preventDefault\(\); handleCreateSalesOrder\('close'\); \}\} onPointerDown=\{\(e\) => \{ e\.preventDefault\(\); handleCreateSalesOrder\('close'\); \}\} onClick=\{\(\) => handleCreateSalesOrder\('close'\)\}/g,
  "onPointerDown={(e) => { e.preventDefault(); handleCreateSalesOrder('close'); }} onClick={() => handleCreateSalesOrder('close')}"
);

content = content.replace(
  /onPointerDown=\{\(e\) => \{ e\.preventDefault\(\); handleCloseCreateModal\(\); \}\} onPointerDown=\{\(e\) => \{ e\.preventDefault\(\); handleCloseCreateModal\(\); \}\} onClick=\{handleCloseCreateModal\}/g,
  "onPointerDown={(e) => { e.preventDefault(); handleCloseCreateModal(); }} onClick={handleCloseCreateModal}"
);

fs.writeFileSync('src/components/SalesModule.tsx', content);
