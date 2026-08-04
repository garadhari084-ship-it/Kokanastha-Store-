const fs = require('fs');
const file = 'src/services/store.ts';

let content = fs.readFileSync(file, 'utf8');

const target = `             const mergedProfiles = data.map((p: any) => ({
               ...p,
               password_hash: (p as any).password_hash || existingPasswords[p.email?.toLowerCase()?.trim()] || undefined
             }));`;

const replacement = `             const mergedProfiles = data.map((p: any) => {
               const localUser = this.cache.profiles.find(localP => localP.id === p.id);
               return {
                 ...p,
                 password_hash: (p as any).password_hash || existingPasswords[p.email?.toLowerCase()?.trim()] || undefined,
                 allowed_pages: p.allowed_pages || localUser?.allowed_pages || undefined
               };
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
