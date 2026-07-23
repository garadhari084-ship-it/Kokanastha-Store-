const fs = require('fs');
let content = fs.readFileSync('src/components/DashboardView.tsx', 'utf8');

const replacements = [
  { find: 'text-\\[10px\\]', temp: 'TEMP_TEXT_9PX', replace: 'text-[9px]' },
  { find: 'text-\\[11px\\]', temp: 'TEMP_TEXT_10PX', replace: 'text-[10px]' },
  { find: 'text-xs', temp: 'TEMP_TEXT_11PX', replace: 'text-[11px]' },
  { find: 'text-sm', temp: 'TEMP_TEXT_XS', replace: 'text-xs' },
  { find: 'text-base', temp: 'TEMP_TEXT_SM', replace: 'text-sm' },
  { find: 'text-lg', temp: 'TEMP_TEXT_BASE', replace: 'text-base' },
  { find: 'text-xl', temp: 'TEMP_TEXT_LG', replace: 'text-lg' },
  { find: 'text-2xl', temp: 'TEMP_TEXT_XL', replace: 'text-xl' },
  { find: 'text-3xl', temp: 'TEMP_TEXT_2XL', replace: 'text-2xl' },
  { find: 'text-4xl', temp: 'TEMP_TEXT_3XL', replace: 'text-3xl' },
  { find: 'text-5xl', temp: 'TEMP_TEXT_4XL', replace: 'text-4xl' },
];

for (const r of replacements) {
  const regex = new RegExp(`(?<!-)\\b${r.find}\\b`, 'g');
  content = content.replace(regex, r.temp);
}

for (const r of replacements) {
  const regex = new RegExp(`\\b${r.temp}\\b`, 'g');
  content = content.replace(regex, r.replace);
}

fs.writeFileSync('src/components/DashboardView.tsx', content);
