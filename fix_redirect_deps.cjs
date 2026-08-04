const fs = require('fs');
const file = 'src/App.tsx';

let content = fs.readFileSync(file, 'utf8');

const target = '}, [currentUser?.id, activeView]);';
const replacement = '}, [currentUser, activeView]);';

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync(file, content);
  console.log('Replaced in ' + file);
} else {
  console.log('Could not find target');
}
