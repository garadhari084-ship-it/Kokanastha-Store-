const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// Add state variables
if (!content.includes('isEditProfileModalOpen')) {
  content = content.replace(
    "const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);",
    "const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);\n  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);\n  const [editProfileData, setEditProfileData] = useState({ name: '', email: '' });"
  );
}

// Add handleEditProfile
if (!content.includes('const handleEditProfile = async () => {')) {
  const handlerCode = `
  const handleEditProfile = async () => {
    if (!editProfileData.name || !editProfileData.email) {
      triggerToast('Name and email are required', 'error');
      return;
    }

    if (!currentUser) return;
    
    try {
      if (isSupabaseConfigured && supabase) {
        if (editProfileData.email !== currentUser.email) {
            const { error: authError } = await supabase.auth.updateUser({ email: editProfileData.email });
            if (authError) {
              triggerToast('Failed to update email in auth: ' + authError.message, 'error');
              return;
            }
        }
        await supabase.from('users_profiles').update({ 
            name: editProfileData.name, 
            email: editProfileData.email 
        }).eq('id', currentUser.id);
      }
      
      dbStore.updateUser(currentUser.id, { 
          name: editProfileData.name, 
          email: editProfileData.email 
      });
      
      // Update local state directly so UI updates immediately
      setCurrentUser(prev => prev ? { ...prev, name: editProfileData.name, email: editProfileData.email } : prev);
      
      triggerToast('Profile updated successfully', 'success');
      setIsEditProfileModalOpen(false);
    } catch(e) {
      triggerToast('Failed to update profile', 'error');
    }
  };
`;
  content = content.replace(
    "const handleChangePassword = async () => {",
    handlerCode + "\n  const handleChangePassword = async () => {"
  );
}

// Add Edit Profile button to the dropdown menu
if (!content.includes('Account Settings') || !content.includes('setIsEditProfileModalOpen(true)')) {
  content = content.replace(
    /<Settings size=\{14\} \/> Account Settings\s*<\/button>/,
    `<Settings size={14} /> Account Settings
                    </button>
                    <button 
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        setEditProfileData({ name: currentUser?.name || '', email: currentUser?.email || '' });
                        setIsEditProfileModalOpen(true);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-2 focus:outline-none cursor-pointer"
                    >
                      <User size={14} /> Edit Profile
                    </button>`
  );
}

// Add the modal HTML
if (!content.includes('Edit Profile Modal')) {
  const modalHTML = `
      {/* Edit Profile Modal */}
      {isEditProfileModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <User size={18} className="text-indigo-600 dark:text-indigo-400" />
                Edit Profile
              </h3>
              <button 
                onClick={() => setIsEditProfileModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Name</label>
                <input 
                  type="text"
                  value={editProfileData.name}
                  onChange={(e) => setEditProfileData({...editProfileData, name: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                  placeholder="Enter your name"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Email</label>
                <input 
                  type="email"
                  value={editProfileData.email}
                  onChange={(e) => setEditProfileData({...editProfileData, email: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-2">
              <button
                onClick={() => setIsEditProfileModalOpen(false)}
                className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                onClick={handleEditProfile}
                className="px-4 py-2 text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl shadow-sm transition"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
`;
  content = content.replace(
    /\{\/\* Change Password Modal \*\/\}/,
    modalHTML + "\n      {/* Change Password Modal */}"
  );
}

fs.writeFileSync('src/App.tsx', content);
console.log('App.tsx updated!');
