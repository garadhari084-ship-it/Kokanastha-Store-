const fs = require('fs');
const file = 'src/components/UsersModule.tsx';

let content = fs.readFileSync(file, 'utf8');

const target = `        active: true,
        password_hash: newUserPassword
      });`;

const replacement = `        active: true,
        password_hash: newUserPassword,
        allowed_pages: selectedAllowedPages
      });`;

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync(file, content);
  console.log('Replaced in ' + file);
} else {
  console.log('Could not find target');
}
