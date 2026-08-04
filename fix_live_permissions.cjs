const fs = require('fs');
const file = 'src/App.tsx';

let content = fs.readFileSync(file, 'utf8');

const target = `  // Subscribe to store updates to keep UI in sync across devices
  useEffect(() => {
    return dbStore.subscribe(() => {
      setSyncTick(prev => prev + 1);
      if (currentBusiness && currentUser) {
        const messages = dbStore.getMessages(currentBusiness.id);
        setUnreadMessagesCount(messages.filter(m => m.receiver_id === currentUser.id && !m.is_read).length);
      }
    });
  }, [currentBusiness?.id, currentUser?.id]);`;

const replacement = `  // Subscribe to store updates to keep UI in sync across devices
  useEffect(() => {
    return dbStore.subscribe(() => {
      setSyncTick(prev => prev + 1);
      
      // Live update for permissions/profile changes (User Management live sync)
      if (currentUser && currentBusiness) {
        const allUsers = dbStore.getUsers(currentBusiness.id);
        const updatedUser = allUsers.find(u => u.id === currentUser.id);
        if (updatedUser) {
           // Stringify comparison to check if nested properties like allowed_pages changed
           if (JSON.stringify(updatedUser) !== JSON.stringify(currentUser)) {
             setCurrentUser(updatedUser);
           }
        }
      }

      if (currentBusiness && currentUser) {
        const messages = dbStore.getMessages(currentBusiness.id);
        setUnreadMessagesCount(messages.filter(m => m.receiver_id === currentUser.id && !m.is_read).length);
      }
    });
  }, [currentBusiness?.id, currentUser?.id, currentUser]);`;

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync(file, content);
  console.log('Replaced in ' + file);
} else {
  console.log('Could not find target');
}
