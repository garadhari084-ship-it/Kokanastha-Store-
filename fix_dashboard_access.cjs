const fs = require('fs');
const file = 'src/App.tsx';

let content = fs.readFileSync(file, 'utf8');

const target = `      case 'dashboard':
      case 'inbox':
        return true;`;

const replacement = `      case 'dashboard':
        return role === 'Manager' || role === 'Admin' || role === 'Viewer';
      case 'inbox':
        return true;`;

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync(file, content);
  console.log('Replaced in ' + file);
} else {
  console.log('Could not find target');
}
