const fs = require('fs');
const file = 'src/services/store.ts';

let content = fs.readFileSync(file, 'utf8');

const target = `       const { data, error } = await query;
       
       if (error) {
          console.error(\`Failed to fetch \${table}:\`, error.message);
          return;
       }
       
       if (data) {
           (this.cache as any)[key] = data;
       }`;

const replacement = `       const { data, error } = await query;
       
       if (error) {
          console.error(\`Failed to fetch \${table}:\`, error.message);
          return;
       }
       
       if (data) {
           if (key === 'profiles') {
               // Preserve allowed_pages from local cache if Supabase column is missing
               const finalData = data.map((remoteUser) => {
                   const localUser = this.cache.profiles.find(p => p.id === remoteUser.id);
                   if (localUser && localUser.allowed_pages && !remoteUser.allowed_pages) {
                       return { ...remoteUser, allowed_pages: localUser.allowed_pages };
                   }
                   return remoteUser;
               });
               (this.cache as any)[key] = finalData;
           } else {
               (this.cache as any)[key] = data;
           }
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
