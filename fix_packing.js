const fs = require('fs');
let content = fs.readFileSync('src/components/PackingVerificationModule.tsx', 'utf8');

// I will find the last occurrence of "<Scan size={13} />" before line 1050
const targetRegex = /<Scan size=\{13\} \/>\s*<span>Open Station<\/span>\s*<\/button>\s*<\/td>\s*<\/tr>\s*\);\s*(.*)/s;
// The rest of the file after the map is essentially just closing tags and the empty state.
