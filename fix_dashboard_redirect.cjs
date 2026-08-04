const fs = require('fs');
const file = 'src/App.tsx';

let content = fs.readFileSync(file, 'utf8');

const target = `  const menuItems = [`;
const replacement = `  useEffect(() => {
    if (currentUser && !hasAccessToView(activeView)) {
      const firstAvailable = menuItems.find(item => hasAccessToView(item.id));
      if (firstAvailable) {
        setActiveView(firstAvailable.id);
      }
    }
  }, [currentUser?.id, activeView]);

  const menuItems = [`;

if (content.includes(target) && !content.includes('setActiveView(firstAvailable.id)')) {
  content = content.replace(target, replacement);
  fs.writeFileSync(file, content);
  console.log('Replaced in ' + file);
} else {
  console.log('Target not found or already patched');
}
