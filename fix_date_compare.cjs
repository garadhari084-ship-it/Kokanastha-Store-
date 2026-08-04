const fs = require('fs');

function fixFile(file) {
  let content = fs.readFileSync(file, 'utf8');
  
  // Let's replace the inline date calculation with getLocalTodayDate format.
  const oldDateLogic = `        const today = new Date().toLocaleDateString('en-CA');
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toLocaleDateString('en-CA');`;
        
  const newDateLogic = `        const d = new Date();
        const today = \`\${d.getFullYear()}-\${String(d.getMonth() + 1).padStart(2, '0')}-\${String(d.getDate()).padStart(2, '0')}\`;
        const t = new Date();
        t.setDate(t.getDate() + 1);
        const tomorrowStr = \`\${t.getFullYear()}-\${String(t.getMonth() + 1).padStart(2, '0')}-\${String(t.getDate()).padStart(2, '0')}\`;`;

  content = content.replace(oldDateLogic, newDateLogic);

  const oldDateLabel = `    const today = new Date().toLocaleDateString('en-CA');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toLocaleDateString('en-CA');`;

  const newDateLabel = `    const d = new Date();
    const today = \`\${d.getFullYear()}-\${String(d.getMonth() + 1).padStart(2, '0')}-\${String(d.getDate()).padStart(2, '0')}\`;
    const t = new Date();
    t.setDate(t.getDate() + 1);
    const tomorrowStr = \`\${t.getFullYear()}-\${String(t.getMonth() + 1).padStart(2, '0')}-\${String(t.getDate()).padStart(2, '0')}\`;`;
    
  content = content.replace(oldDateLabel, newDateLabel);
  
  fs.writeFileSync(file, content);
  console.log('Fixed', file);
}

fixFile('src/components/DeliveryModule.tsx');
fixFile('src/components/PackingVerificationModule.tsx');

