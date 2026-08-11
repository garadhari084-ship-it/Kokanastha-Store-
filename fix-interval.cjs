const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');
content = content.replace(
  /\/\/ Live auto-sync interval across devices\/browsers\s*useEffect\(\(\) => \{\s*if \(\!currentBusiness\?\.id\) return;\s*const interval = setInterval\(async \(\) => \{\s*if \(isSupabaseConfigured && supabase && dbMode === 'supabase'\) \{\s*await dbStore\.syncFromSupabase\(currentBusiness\.id\);\s*\}\s*\}, 3000\);\s*return \(\) => clearInterval\(interval\);\s*\}, \[currentBusiness\?\.id, dbMode\]\);/g,
  `// Removed auto-sync interval to improve performance and prevent lag`
);
fs.writeFileSync('src/App.tsx', content);
console.log('Interval removed');
