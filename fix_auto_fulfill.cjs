const fs = require('fs');
let content = fs.readFileSync('src/components/SalesModule.tsx', 'utf-8');

// Remove Auto-fulfill if Paid and Walk-in
const autoFulfillBlock = `// Auto-fulfill if Paid and Walk-in
                        if (st === 'Paid' && selectedCustomerId === 'WALK_IN') {
                          setIsFulfilledImmediately(true);
                        }`;

const noAutoFulfill = `// Auto-fulfill if Paid and Walk-in
                        if (st === 'Paid' && selectedCustomerId === 'WALK_IN') {
                          // We no longer auto-fulfill because it locks the edit button.
                          // setIsFulfilledImmediately(true);
                        }`;

if (content.includes(autoFulfillBlock)) {
  content = content.replace(autoFulfillBlock, noAutoFulfill);
  fs.writeFileSync('src/components/SalesModule.tsx', content);
} else {
  console.log("Could not find auto-fulfill block in SalesModule.tsx");
}
