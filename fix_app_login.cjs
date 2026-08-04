const fs = require('fs');
const file = 'src/App.tsx';

let content = fs.readFileSync(file, 'utf8');

const target = `            if (dbProfile) {
              profile = dbProfile as UserProfile;
            }`;

const replacement = `            if (dbProfile) {
              // Polyfill for allowed_pages if Supabase column is missing but local cache has it
              const localUsers = JSON.parse(localStorage.getItem('omnipack_erp_db') || '{}')?.profiles || [];
              const localUser = localUsers.find(u => u.id === dbProfile.id);
              if (localUser && localUser.allowed_pages && !dbProfile.allowed_pages) {
                  dbProfile.allowed_pages = localUser.allowed_pages;
              }
              profile = dbProfile as UserProfile;
            }`;
              
const escapedTarget = target.replace(/[.*+?^\${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s*');
const targetRegex = new RegExp(escapedTarget, 'g');

if (targetRegex.test(content)) {
  content = content.replace(targetRegex, replacement);
  fs.writeFileSync(file, content);
  console.log('Replaced in ' + file);
} else {
  console.log('Could not find target');
}
