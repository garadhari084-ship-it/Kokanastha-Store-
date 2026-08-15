const fs = require('fs');
let content = fs.readFileSync('src/components/SalesModule.tsx', 'utf-8');

content = content.replace(
  /onClick=\{handleCloseCreateModal\}/g,
  'onPointerDown={(e) => { e.preventDefault(); handleCloseCreateModal(); }} onClick={handleCloseCreateModal}'
);

content = content.replace(
  /onClick=\{\(\) => handleCreateSalesOrder\('close'\)\}/g,
  "onPointerDown={(e) => { e.preventDefault(); handleCreateSalesOrder('close'); }} onClick={() => handleCreateSalesOrder('close')}"
);

fs.writeFileSync('src/components/SalesModule.tsx', content);
