const fs = require('fs');
let css = fs.readFileSync('src/index.css', 'utf8');
css += `
/* Globally hide all scrollbars */
::-webkit-scrollbar {
  display: none !important;
  width: 0 !important;
  height: 0 !important;
}
* {
  -ms-overflow-style: none !important;
  scrollbar-width: none !important;
}
`;
fs.writeFileSync('src/index.css', css);
