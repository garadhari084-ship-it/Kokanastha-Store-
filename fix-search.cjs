const fs = require('fs');
let content = fs.readFileSync('src/components/SalesModule.tsx', 'utf8');

const regex = /const query = searchQuery\.toLowerCase\(\)\.trim\(\);/;

const newImplementation = `let query = searchQuery.toLowerCase().trim();
      
      // If the scanned text is a full URL from the Bill QR code, extract the order number
      if (query.includes('?inv=')) {
        try {
          const urlObj = new URL(searchQuery.trim());
          const invParam = urlObj.searchParams.get('inv');
          if (invParam) {
            query = invParam.toLowerCase().trim();
          }
        } catch (e) {
          // fallback regex if new URL fails
          const match = query.match(/inv=([^&]+)/);
          if (match) {
            query = decodeURIComponent(match[1]).toLowerCase().trim();
          }
        }
      }`;

if (content.match(regex)) {
  content = content.replace(regex, newImplementation);
  fs.writeFileSync('src/components/SalesModule.tsx', content);
  console.log('Success search query parsing');
} else {
  console.log('Regex did not match');
}
