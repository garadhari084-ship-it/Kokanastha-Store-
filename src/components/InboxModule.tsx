import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Search, 
  User, 
  MoreVertical, 
  Phone, 
  Video, 
  MessageSquare,
  Clock,
  Check,
  CheckCheck,
  ArrowLeft,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { dbStore } from '../services/store';
import { UserProfile, ChatMessage } from '../types/erp';

interface InboxModuleProps {
  currentUser: UserProfile;
  businessId: string;
  onClose?: () => void;
}

export const InboxModule: React.FC<InboxModuleProps> = ({ currentUser, businessId, onClose }) => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileListVisible, setIsMobileListVisible] = useState(true);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const allUsers = dbStore.getUsers(businessId).filter(u => u.id !== currentUser.id);
    setUsers(allUsers);
    
    const allMessages = dbStore.getMessages(businessId);
    setMessages(allMessages);

    const unsubscribe = dbStore.subscribe(() => {
      setMessages(dbStore.getMessages(businessId));
      setUsers(dbStore.getUsers(businessId).filter(u => u.id !== currentUser.id));
    });

    return () => unsubscribe();
  }, [businessId, currentUser.id]);

  useEffect(() => {
    if (selectedUserId) {
      dbStore.markConversationRead(selectedUserId, currentUser.id);
    }
  }, [selectedUserId, messages.length, currentUser.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedUserId, messages]);

  const selectedUser = users.find(u => u.id === selectedUserId);
  
  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (u.role && u.role.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const conversationMessages = messages.filter(m => 
    (m.sender_id === currentUser.id && m.receiver_id === selectedUserId) ||
    (m.sender_id === selectedUserId && m.receiver_id === currentUser.id)
  ).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  const handleSendMessage = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newMessage.trim() || !selectedUserId) return;

    dbStore.sendMessage({
      sender_id: currentUser.id,
      receiver_id: selectedUserId,
      content: newMessage.trim(),
      business_id: businessId
    });

    setNewMessage('');
  };

  const getLastMessage = (userId: string) => {
    const userMessages = messages.filter(m => 
      (m.sender_id === currentUser.id && m.receiver_id === userId) ||
      (m.sender_id === userId && m.receiver_id === currentUser.id)
    ).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    
    return userMessages[0];
  };

  const getUnreadCount = (userId: string) => {
    return messages.filter(m => 
      m.sender_id === userId && 
      m.receiver_id === currentUser.id && 
      !m.is_read
    ).length;
  };

  return (
    <div className="flex h-[calc(100vh-120px)] bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm mx-4 mb-4">
      {/* Sidebar - User List */}
      <div className={`${isMobileListVisible ? 'flex' : 'hidden'} md:flex flex-col w-full md:w-80 border-r border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/50`}>
        <div className="p-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Internal Communications</h2>
            {onClose && (
              <button 
                onClick={onClose}
                className="md:hidden p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X size={18} />
              </button>
            )}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search colleagues..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredUsers.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <User className="mx-auto mb-2 opacity-20" size={32} />
              <p className="text-xs">No users found</p>
            </div>
          ) : (
            filteredUsers.map(user => {
              const lastMsg = getLastMessage(user.id);
              const unreadCount = getUnreadCount(user.id);
              const isSelected = selectedUserId === user.id;

              return (
                <button
                  key={user.id}
                  onClick={() => {
                    setSelectedUserId(user.id);
                    setIsMobileListVisible(false);
                  }}
                  className={`w-full p-4 flex items-start gap-3 border-b border-slate-100 dark:border-slate-800/50 hover:bg-white dark:hover:bg-slate-800 transition-all text-left ${isSelected ? 'bg-white dark:bg-slate-800 ring-1 ring-inset ring-indigo-500/10' : ''}`}
                >
                  <div className="relative shrink-0">
                    <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold uppercase border border-white dark:border-slate-800 shadow-sm">
                      {user.name.charAt(0)}
                    </div>
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-indigo-600 text-white text-[10px] font-black rounded-full flex items-center justify-center ring-2 ring-white dark:ring-slate-900 shadow-sm">
                        {unreadCount}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <p className={`text-xs truncate ${unreadCount > 0 ? 'font-bold text-slate-900 dark:text-white' : 'font-semibold text-slate-700 dark:text-slate-300'}`}>
                        {user.name}
                      </p>
                      {lastMsg && (
                        <span className="text-[10px] text-slate-400 font-medium">
                          {new Date(lastMsg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-[11px] text-slate-500 truncate pr-2">
                        {lastMsg ? lastMsg.content : user.role}
                      </p>
                      {lastMsg && lastMsg.sender_id === currentUser.id && (
                        lastMsg.is_read ? <CheckCheck size={12} className="text-indigo-500" /> : <Check size={12} className="text-slate-400" />
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Main Chat Window */}
      <div className={`${!isMobileListVisible ? 'flex' : 'hidden'} md:flex flex-col flex-1 bg-white dark:bg-slate-900`}>
        {selectedUser ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setIsMobileListVisible(true)}
                  className="md:hidden p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                >
                  <ArrowLeft size={18} />
                </button>
                <div className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-bold uppercase border border-indigo-200 dark:border-indigo-800/50">
                  {selectedUser.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white">{selectedUser.name}</h3>
                  <p className="text-[10px] text-slate-500 font-medium">{selectedUser.role} • Online</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button className="p-2 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition cursor-not-allowed opacity-50">
                  <Phone size={18} />
                </button>
                <button className="p-2 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition cursor-not-allowed opacity-50">
                  <Video size={18} />
                </button>
                <button className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition">
                  <MoreVertical size={18} />
                </button>
                {onClose && (
                  <button 
                    onClick={onClose}
                    className="ml-2 p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/30 dark:bg-slate-900/50">
              <AnimatePresence initial={false}>
                {conversationMessages.map((msg) => {
                  const isMe = msg.sender_id === currentUser.id;
                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.15 }}
                      className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[80%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                        <div className={`px-4 py-2.5 rounded-2xl text-xs leading-relaxed shadow-sm ${
                          isMe 
                            ? 'bg-indigo-600 text-white rounded-tr-none' 
                            : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-100 dark:border-slate-700 rounded-tl-none'
                        }`}>
                          {msg.content}
                        </div>
                        <div className="flex items-center gap-1.5 mt-1 px-1">
                          <span className="text-[9px] text-slate-400 font-medium">
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {isMe && (
                            msg.is_read ? <CheckCheck size={10} className="text-indigo-500" /> : <Check size={10} className="text-slate-400" />
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <form onSubmit={handleSendMessage} className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/50 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent transition-all">
                <input 
                  type="text" 
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-1 bg-transparent border-none outline-none text-xs px-3 py-2 text-slate-800 dark:text-slate-100"
                />
                <button 
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-indigo-200 dark:shadow-none"
                >
                  <Send size={16} />
                </button>
              </form>
              <p className="text-[10px] text-slate-400 text-center mt-2 font-medium">Press Enter to send message</p>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-slate-50/20 dark:bg-slate-900/20 relative">
            {onClose && (
              <button 
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <X size={20} />
              </button>
            )}
            <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500 dark:text-indigo-400 rounded-full flex items-center justify-center mb-4">
              <MessageSquare size={32} />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Professional Messaging Hub</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 max-w-xs leading-relaxed">
              Connect with your team members across all departments. Select a conversation from the sidebar to begin chatting.
            </p>
            <div className="grid grid-cols-2 gap-3 mt-8 w-full max-w-sm">
              <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-left">
                <div className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase mb-1">Real-time</div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">Instantly synced across all business sessions.</p>
              </div>
              <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-left">
                <div className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase mb-1">Internal</div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">Secure end-to-end communication for your staff.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
