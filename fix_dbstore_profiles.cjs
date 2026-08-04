const fs = require('fs');
const file = 'src/services/store.ts';

let content = fs.readFileSync(file, 'utf8');

const target = `             // Polyfill password_hash
             data.forEach((p: any) => {
                const em = p.email?.toLowerCase().trim();
                if (em && existingPasswords[em]) {
                   p.password_hash = existingPasswords[em];
                }
             });`;

const replacement = `             // Polyfill password_hash and allowed_pages
             data.forEach((p: any) => {
                const em = p.email?.toLowerCase().trim();
                if (em && existingPasswords[em]) {
                   p.password_hash = existingPasswords[em];
                }
                const localUser = this.cache.profiles.find(localP => localP.id === p.id);
                if (localUser && localUser.allowed_pages && !p.allowed_pages) {
                   p.allowed_pages = localUser.allowed_pages;
                }
             });`;
              
const escapedTarget = target.replace(/[.*+?^\${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s*');
const targetRegex = new RegExp(escapedTarget, 'g');

if (targetRegex.test(content)) {
  content = content.replace(targetRegex, replacement);
  fs.writeFileSync(file, content);
  console.log('Replaced in ' + file);
} else {
  console.log('Could not find target');
}
