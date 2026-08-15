const fs = require('fs');
let content = fs.readFileSync('src/components/SalesModule.tsx', 'utf-8');

content = content.replace(
  /onPointerDown=\{\(e\) => \{ e\.preventDefault\(\); handleCloseCreateModal\(\); \}\} onClick=\{handleCloseCreateModal\}/g,
  "onClick={handleCloseCreateModal}"
);

content = content.replace(
  /onPointerDown=\{\(e\) => \{ e\.preventDefault\(\); handleCreateSalesOrder\('close'\); \}\} onClick=\{\(\) => handleCreateSalesOrder\('close'\)\}/g,
  "onClick={() => handleCreateSalesOrder('close')}"
);

fs.writeFileSync('src/components/SalesModule.tsx', content);
