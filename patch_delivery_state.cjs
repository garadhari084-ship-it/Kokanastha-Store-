const fs = require('fs');
const file = 'src/components/DeliveryModule.tsx';
let content = fs.readFileSync(file, 'utf8');

// Add imports LayoutList, Grid3X3
content = content.replace(
  /LayoutGrid,/,
  "LayoutGrid,\n  LayoutList,\n  Grid3X3,"
);

// Add viewMode state
content = content.replace(
  /const \[searchQuery, setSearchQuery\] = useState\(''\);/,
  "const [searchQuery, setSearchQuery] = useState('');\n  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');"
);

fs.writeFileSync(file, content);
