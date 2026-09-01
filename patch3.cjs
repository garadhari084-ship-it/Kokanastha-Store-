const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  /\{\s*event:\s*'factory_reset'\s*},\s*\(payload:\s*any\)\s*=>\s*\{\s*console\.log\('Factory reset broadcast received:',\s*payload\);\s*triggerToast\('System was factory reset by administrator\. Reloading\.\.\.',\s*'error'\);\s*setTimeout\(\(\)\s*=>\s*window\.location\.reload\(\),\s*2000\);\s*\}/,
  `{ event: 'factory_reset' },
          (payload: any) => {
            console.log('Factory reset broadcast received:', payload);
            triggerToast('System was factory reset by administrator. Reloading...', 'error');
            dbStore.clearLocalCacheOnly();
            setTimeout(() => window.location.reload(), 2000);
          }`
);

fs.writeFileSync('src/App.tsx', code);
