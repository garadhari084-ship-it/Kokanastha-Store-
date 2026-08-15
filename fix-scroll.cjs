const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');
html = html.replace('padding: 20px;', 'padding: 0;');
fs.writeFileSync('index.html', html);

let css = fs.readFileSync('src/index.css', 'utf8');
css += `\nhtml, body { overflow: hidden; height: 100%; }\n`;
fs.writeFileSync('src/index.css', css);
