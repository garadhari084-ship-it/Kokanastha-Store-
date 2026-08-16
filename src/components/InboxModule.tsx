import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Send, 
  Search, 
  User, 
  Phone, 
  Video, 
  MessageSquare,
  Check, 
  CheckCheck, 
  ArrowLeft, 
  X, 
  Package,
  Trash2,
  AlertTriangle,
  Bot,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { dbStore } from '../services/store';
import { UserProfile, ChatMessage } from '../types/erp';

interface InboxModuleProps {
  currentUser: UserProfile;
  businessId: string;
  onClose?: () => void;
  onNavigate?: (view: string, data?: any) => void;
}

export const InboxModule: React.FC<InboxModuleProps> = ({ currentUser, businessId, onClose, onNavigate }) => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileListVisible, setIsMobileListVisible] = useState(true);
  const [isDeletingChatModalOpen, setIsDeletingChatModalOpen] = useState(false);
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Virtual user for automated order notifications
  const orderSystemUser = useMemo<UserProfile>(() => ({
    id: 'order_system',
    name: 'Order System',
    email: 'orders@system.erp',
    role: 'System Automation',
    created_at: '2026-01-01T00:00:00.000Z',
    business_id: businessId
  }), [businessId]);

  useEffect(() => {
    const rawUsers = dbStore.getUsers(businessId).filter(u => u.id !== currentUser.id && u.id !== 'order_system');
    setUsers([orderSystemUser, ...rawUsers]);
    
    const allMessages = dbStore.getMessages(businessId);
    setMessages(allMessages);

    const unsubscribe = dbStore.subscribe(() => {
      setMessages(dbStore.getMessages(businessId));
      const freshUsers = dbStore.getUsers(businessId).filter(u => u.id !== currentUser.id && u.id !== 'order_system');
      setUsers([orderSystemUser, ...freshUsers]);
    });

    return () => unsubscribe();
  }, [businessId, currentUser.id, orderSystemUser]);

  // Mark conversation as read ONLY when the specific chat is open
  useEffect(() => {
    if (selectedUserId) {
      dbStore.markConversationRead(selectedUserId, currentUser.id);
    }
  }, [selectedUserId, messages.length, currentUser.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedUserId, messages]);

  const allAvailableUsers = useMemo(() => {
    return [orderSystemUser, ...users.filter(u => u.id !== 'order_system')];
  }, [orderSystemUser, users]);

  const selectedUser = allAvailableUsers.find(u => u.id === selectedUserId);
  
  const filteredUsers = allAvailableUsers.filter(u => 
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

  const handleDeleteSingleMessage = (msgId: string) => {
    dbStore.deleteMessage(msgId);
  };

  const handleDeleteEntireConversation = () => {
    if (!selectedUserId) return;
    dbStore.deleteConversation(currentUser.id, selectedUserId, businessId);
    setIsDeletingChatModalOpen(false);
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

  const totalUnreadCount = messages.filter(m => m.receiver_id === currentUser.id && !m.is_read).length;

  return (
    <div className="flex flex-1 h-full min-h-0 w-full bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm relative">
      {/* Sidebar - User List */}
      <div className={`${isMobileListVisible ? 'flex' : 'hidden'} md:flex flex-col w-full md:w-80 border-r border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/60 h-full min-h-0`}>
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              Internal Communications
              {totalUnreadCount > 0 && (
                <span className="bg-rose-500 text-white text-[10px] px-2 py-0.5 rounded-full font-black min-w-[20px] text-center shadow-sm animate-pulse">
                  {totalUnreadCount}
                </span>
              )}
            </h2>
            {onClose && (
              <button 
                onClick={onClose}
                className="md:hidden p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Close chat"
              >
                <X size={18} />
              </button>
            )}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
            <input 
              type="text" 
              placeholder="Search chats or colleagues..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all placeholder:text-slate-400"
            />
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/40">
          {filteredUsers.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <User className="mx-auto mb-2 opacity-20" size={32} />
              <p className="text-xs">No users or chats found</p>
            </div>
          ) : (
            filteredUsers.map(userItem => {
              const lastMsg = getLastMessage(userItem.id);
              const unreadCount = getUnreadCount(userItem.id);
              const isSelected = selectedUserId === userItem.id;
              const isOrderSystem = userItem.id === 'order_system';

              return (
                <button
                  key={userItem.id}
                  onClick={() => {
                    setSelectedUserId(userItem.id);
                    setIsMobileListVisible(false);
                  }}
                  className={`w-full p-3.5 flex items-start gap-3 hover:bg-white dark:hover:bg-slate-800/80 transition-all text-left group ${
                    isSelected 
                      ? 'bg-indigo-50/70 dark:bg-indigo-950/30 border-l-4 border-indigo-600' 
                      : 'border-l-4 border-transparent'
                  }`}
                >
                  <div className="relative shrink-0">
                    {isOrderSystem ? (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-500 to-amber-400 flex items-center justify-center text-white shadow-sm ring-2 ring-amber-200 dark:ring-amber-900/40">
                        <Bot size={20} />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-300 font-bold uppercase border border-white dark:border-slate-800 shadow-sm">
                        {userItem.name.charAt(0)}
                      </div>
                    )}
                    
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 bg-rose-600 text-white text-[10px] font-black rounded-full flex items-center justify-center ring-2 ring-white dark:ring-slate-900 shadow-sm animate-bounce">
                        {unreadCount}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-0.5">
                      <p className={`text-xs truncate flex items-center gap-1.5 ${
                        unreadCount > 0 
                          ? 'font-extrabold text-slate-950 dark:text-white' 
                          : 'font-semibold text-slate-800 dark:text-slate-200'
                      }`}>
                        {userItem.name}
                        {isOrderSystem && (
                          <span className="px-1.5 py-0.2 bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 text-[9px] font-bold rounded-md">
                            Bot
                          </span>
                        )}
                      </p>
                      {lastMsg && (
                        <span className="text-[10px] text-slate-400 font-medium shrink-0 ml-1">
                          {new Date(lastMsg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                    <div className="flex justify-between items-center">
                      <p className={`text-[11px] truncate pr-2 ${
                        unreadCount > 0 
                          ? 'text-indigo-600 dark:text-indigo-400 font-semibold' 
                          : 'text-slate-500 dark:text-slate-400'
                      }`}>
                        {lastMsg ? lastMsg.content.replace(/\n/g, ' ') : userItem.role}
                      </p>
                      {lastMsg && lastMsg.sender_id === currentUser.id && (
                        <span className="shrink-0">
                          {lastMsg.is_read ? <CheckCheck size={13} className="text-indigo-500" /> : <Check size={13} className="text-slate-400" />}
                        </span>
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
      <div className={`${!isMobileListVisible ? 'flex' : 'hidden'} md:flex flex-col flex-1 h-full min-h-0 bg-white dark:bg-slate-900 overflow-hidden`}>
        {selectedUser ? (
          <>
            {/* Chat Header */}
            <div className="p-3 sm:p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-800/40 shrink-0 z-10">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setIsMobileListVisible(true)}
                  className="md:hidden p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                  title="Back to chat list"
                >
                  <ArrowLeft size={18} />
                </button>
                {selectedUser.id === 'order_system' ? (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-500 to-amber-400 flex items-center justify-center text-white shadow-sm">
                    <Bot size={20} />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-bold uppercase border border-indigo-200 dark:border-indigo-800/50 shadow-sm">
                    {selectedUser.name.charAt(0)}
                  </div>
                )}
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    {selectedUser.name}
                    {selectedUser.id === 'order_system' && (
                      <span className="text-[10px] font-normal px-2 py-0.5 bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 rounded-full flex items-center gap-1">
                        <Sparkles size={11} /> Automated
                      </span>
                    )}
                  </h3>
                  <p className="text-[10px] text-slate-500 font-medium">
                    {selectedUser.role} • Active
                  </p>
                </div>
              </div>

              {/* Action Buttons & Delete Chat Button */}
              <div className="flex items-center gap-1.5">
                {conversationMessages.length > 0 && (
                  <button 
                    onClick={() => setIsDeletingChatModalOpen(true)}
                    className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 border border-rose-200 dark:border-rose-800/50 rounded-xl transition-all shadow-sm active:scale-95"
                    title="Delete all messages in this chat"
                  >
                    <Trash2 size={14} />
                    <span className="hidden sm:inline">Delete Chat</span>
                  </button>
                )}
                
                <button className="hidden sm:flex p-2 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition cursor-not-allowed opacity-40" title="Call">
                  <Phone size={17} />
                </button>
                <button className="hidden sm:flex p-2 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition cursor-not-allowed opacity-40" title="Video">
                  <Video size={17} />
                </button>

                {onClose && (
                  <button 
                    onClick={onClose}
                    className="ml-1 p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title="Close"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50/40 dark:bg-slate-900/40">
              {conversationMessages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8">
                  <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500 rounded-full flex items-center justify-center mb-3">
                    <MessageSquare size={26} />
                  </div>
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">No messages in this chat yet</p>
                  <p className="text-[11px] text-slate-400 mt-1 max-w-xs">
                    {selectedUser.id === 'order_system' 
                      ? 'New orders and packing assignments will automatically arrive here.' 
                      : `Send a direct message to ${selectedUser.name} to begin collaborating.`}
                  </p>
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {conversationMessages.map((msg) => {
                    const isMe = msg.sender_id === currentUser.id;
                    const isHovered = hoveredMessageId === msg.id;

                    return (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 8, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
                        transition={{ duration: 0.15 }}
                        className={`flex ${isMe ? 'justify-end' : 'justify-start'} group/msg`}
                        onMouseEnter={() => setHoveredMessageId(msg.id)}
                        onMouseLeave={() => setHoveredMessageId(null)}
                      >
                        <div className={`max-w-[85%] sm:max-w-[75%] flex flex-col ${isMe ? 'items-end' : 'items-start'} relative`}>
                          <div className="relative group">
                            <div className={`px-4 py-2.5 rounded-2xl text-xs leading-relaxed shadow-sm ${
                              isMe 
                                ? 'bg-indigo-600 text-white rounded-tr-none' 
                                : selectedUser.id === 'order_system'
                                  ? 'bg-amber-50 dark:bg-amber-950/40 text-slate-900 dark:text-amber-100 border border-amber-200 dark:border-amber-800/60 rounded-tl-none font-medium'
                                  : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-100 dark:border-slate-700/80 rounded-tl-none'
                            }`}>
                              <p className="whitespace-pre-wrap">{msg.content}</p>
                              
                              {/* Open Order Station Action Button */}
                              {(() => {
                                const match = msg.content.match(/(?:INV|ORD|SO)-[\d\w-]+/i)
                                           || msg.content.match(/(?:Sales\s+Order|Order|Invoice)[\s#:]*([A-Za-z0-9-]+)/i)
                                           || msg.content.match(/#([A-Za-z0-9-]+)/i);
                                const orderNum = match ? (match[1] || match[0]).replace(/^#/, '').trim() : null;
                                if (orderNum && onNavigate) {
                                  return (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const allSales = dbStore.getSalesOrders(businessId);
                                        const clean = orderNum.toLowerCase();
                                        const matched = allSales.find(o => {
                                          const oNum = (o.order_number || '').toLowerCase().replace(/^#/, '');
                                          return oNum === clean || oNum.includes(clean) || clean.includes(oNum) || o.id === orderNum;
                                        });
                                        onNavigate('packing', { orderId: matched?.id, orderNumber: matched?.order_number || orderNum });
                                      }}
                                      className="mt-2.5 w-full bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold px-3 py-2 rounded-xl text-[11px] flex items-center justify-center gap-1.5 shadow-sm transition-transform active:scale-95 cursor-pointer"
                                    >
                                      <Package size={15} className="text-slate-950" /> 
                                      <span>Open Packing Station ({orderNum})</span>
                                    </button>
                                  );
                                }
                                return null;
                              })()}
                            </div>

                            {/* Delete single message icon button */}
                            <button
                              onClick={() => handleDeleteSingleMessage(msg.id)}
                              className={`absolute top-1 ${isMe ? '-left-8' : '-right-8'} p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all opacity-0 group-hover/msg:opacity-100 ${isHovered ? 'opacity-100' : ''}`}
                              title="Delete this message"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>

                          <div className="flex items-center gap-1.5 mt-1 px-1">
                            <span className="text-[9px] text-slate-400 font-medium">
                              {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {isMe && (
                              msg.is_read ? <CheckCheck size={11} className="text-indigo-500" /> : <Check size={11} className="text-slate-400" />
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-3 sm:p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 z-10">
              <form onSubmit={handleSendMessage} className="flex items-center gap-2.5 bg-slate-50 dark:bg-slate-800/60 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent transition-all">
                <input 
                  type="text" 
                  placeholder={selectedUser.id === 'order_system' ? 'Send a reply or system log...' : `Message ${selectedUser.name}...`}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-1 bg-transparent border-none outline-none text-xs px-3 py-2 text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
                />
                <button 
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
                  title="Send"
                >
                  <Send size={16} />
                </button>
              </form>
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
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Internal Communications Hub</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 max-w-xs leading-relaxed">
              Connect with packing staff, sales, and management in real time. Select a conversation from the sidebar to start chatting.
            </p>
            <div className="grid grid-cols-2 gap-3 mt-8 w-full max-w-sm">
              <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-left shadow-xs">
                <div className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase mb-1">Unread Alerts</div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">Badges stay visible until you open each chat.</p>
              </div>
              <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-left shadow-xs">
                <div className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase mb-1">Order System</div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">Instant direct notifications dispatched to packing team.</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Delete Entire Chat Confirmation Modal */}
      {isDeletingChatModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-xl"
          >
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400 mb-4">
              <div className="p-2.5 bg-rose-100 dark:bg-rose-950/60 rounded-xl">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Delete Entire Chat?</h3>
                <p className="text-xs text-slate-500">This action is permanent and cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
              Are you sure you want to delete all messages in your conversation with <span className="font-bold text-slate-900 dark:text-white">{selectedUser.name}</span>?
            </p>

            <div className="flex justify-end items-center gap-3">
              <button
                type="button"
                onClick={() => setIsDeletingChatModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteEntireConversation}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition shadow-md shadow-rose-600/20"
              >
                Yes, Delete Chat
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
