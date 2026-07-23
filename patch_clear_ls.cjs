const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /const cats = localStorage\.getItem\('omnipack_erp_categories'\);\n    if \(cats && cats\.includes\('"cat-'\)\) \{\n       console\.log\('Clearing old non-UUID local storage\.\.\.'\);\n       localStorage\.clear\(\);\n       window\.location\.reload\(\);\n    \}/;

const injection = `
    const profiles = localStorage.getItem('omnipack_erp_profiles');
    const cats = localStorage.getItem('omnipack_erp_categories');
    
    if (
        (cats && cats.includes('"cat-')) || 
        (profiles && profiles.includes('"admin_user"'))
    ) {
       console.log('Clearing old non-UUID local storage...');
       localStorage.clear();
       window.location.reload();
    }
`;

content = content.replace(regex, injection);
fs.writeFileSync('src/App.tsx', content);
