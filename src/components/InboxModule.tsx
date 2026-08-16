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
  Sparkles,
  MoreVertical,
  UserX,
  Info,
  Download,
  Copy,
  Reply,
  Smile,
  Paperclip,
  CheckCircle2,
  Eraser,
  Clock,
  Mail,
  Shield,
  Building,
  ChevronDown,
  RotateCcw
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
  const [chatFilter, setChatFilter] = useState<'all' | 'unread' | 'colleagues' | 'system' | 'removed'>('all');
  const [isMobileListVisible, setIsMobileListVisible] = useState(true);
  
  // Hidden/Removed users in Internal Communications only
  const [hiddenUserIds, setHiddenUserIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(`omnipack_erp_hidden_comms_${businessId}`);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // Dedicated Modal Target States
  const [contactInfoUser, setContactInfoUser] = useState<UserProfile | null>(null);
  const [clearChatUser, setClearChatUser] = useState<UserProfile | null>(null);
  const [deleteChatUser, setDeleteChatUser] = useState<UserProfile | null>(null);
  const [deleteCommsUser, setDeleteCommsUser] = useState<UserProfile | null>(null);

  // Menus & UI states
  const [isHeaderMenuOpen, setIsHeaderMenuOpen] = useState(false);
  const [activeContactMenuId, setActiveContactMenuId] = useState<string | null>(null);
  const [isSearchInChatOpen, setIsSearchInChatOpen] = useState(false);
  const [inChatSearchQuery, setInChatSearchQuery] = useState('');
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);
  const [replyingToMessage, setReplyingToMessage] = useState<ChatMessage | null>(null);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const headerMenuRef = useRef<HTMLDivElement>(null);

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Close menus on outside click safely
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (headerMenuRef.current && !headerMenuRef.current.contains(e.target as Node)) {
        setIsHeaderMenuOpen(false);
      }
      setActiveContactMenuId(null);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

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

  // Visible users in Internal Communications (excluding users deleted from communications)
  const visibleUsers = useMemo(() => {
    return allAvailableUsers.filter(u => u.id === 'order_system' || !hiddenUserIds.includes(u.id));
  }, [allAvailableUsers, hiddenUserIds]);

  const removedUsers = useMemo(() => {
    return allAvailableUsers.filter(u => u.id !== 'order_system' && hiddenUserIds.includes(u.id));
  }, [allAvailableUsers, hiddenUserIds]);

  const selectedUser = allAvailableUsers.find(u => u.id === selectedUserId);
  
  const getUnreadCount = (userId: string) => {
    return messages.filter(m => 
      m.sender_id === userId && 
      m.receiver_id === currentUser.id && 
      !m.is_read
    ).length;
  };

  const filteredUsers = useMemo(() => {
    const listToFilter = chatFilter === 'removed' ? removedUsers : visibleUsers;

    return listToFilter.filter(u => {
      const matchesSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (u.role && u.role.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase()));
      
      if (!matchesSearch) return false;

      if (chatFilter === 'unread') {
        return getUnreadCount(u.id) > 0;
      }
      if (chatFilter === 'colleagues') {
        return u.id !== 'order_system';
      }
      if (chatFilter === 'system') {
        return u.id === 'order_system';
      }
      return true;
    });
  }, [visibleUsers, removedUsers, searchQuery, chatFilter, messages]);

  const rawConversationMessages = useMemo(() => {
    if (!selectedUserId) return [];
    return messages.filter(m => 
      (m.sender_id === currentUser.id && m.receiver_id === selectedUserId) ||
      (m.sender_id === selectedUserId && m.receiver_id === currentUser.id)
    ).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }, [messages, currentUser.id, selectedUserId]);

  const conversationMessages = useMemo(() => {
    if (!inChatSearchQuery.trim()) return rawConversationMessages;
    const q = inChatSearchQuery.toLowerCase();
    return rawConversationMessages.filter(m => m.content.toLowerCase().includes(q));
  }, [rawConversationMessages, inChatSearchQuery]);

  const handleSendMessage = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newMessage.trim() || !selectedUserId) return;

    let contentToSend = newMessage.trim();
    if (replyingToMessage) {
      const snippet = replyingToMessage.content.length > 50 
        ? replyingToMessage.content.slice(0, 47) + '...' 
        : replyingToMessage.content;
      contentToSend = `> Replying to: "${snippet.replace(/\n/g, ' ')}"\n\n${contentToSend}`;
    }

    dbStore.sendMessage({
      sender_id: currentUser.id,
      receiver_id: selectedUserId,
      content: contentToSend,
      business_id: businessId
    });

    setNewMessage('');
    setReplyingToMessage(null);
    setShowEmojiPicker(false);
  };

  const handleDeleteSingleMessage = (msgId: string) => {
    dbStore.deleteMessage(msgId);
    showToast('Message deleted', 'info');
  };

  // 1. Confirm Clear Conversation
  const handleConfirmClearConversation = () => {
    if (!clearChatUser) return;
    dbStore.deleteConversation(currentUser.id, clearChatUser.id, businessId);
    const targetName = clearChatUser.name;
    setClearChatUser(null);
    setIsHeaderMenuOpen(false);
    showToast(`Chat history with "${targetName}" cleared.`, 'success');
  };

  // 2. Confirm Delete Entire Conversation
  const handleConfirmDeleteEntireConversation = () => {
    if (!deleteChatUser) return;
    const targetId = deleteChatUser.id;
    const targetName = deleteChatUser.name;
    
    dbStore.deleteConversation(currentUser.id, targetId, businessId);
    
    if (selectedUserId === targetId) {
      setSelectedUserId(null);
      setIsMobileListVisible(true);
    }
    
    setDeleteChatUser(null);
    setIsHeaderMenuOpen(false);
    showToast(`Conversation with "${targetName}" deleted.`, 'info');
  };

  // 3. Confirm Delete User from Internal Communications ONLY
  const handleConfirmDeleteUserFromComms = () => {
    if (!deleteCommsUser) return;
    const targetId = deleteCommsUser.id;
    const targetName = deleteCommsUser.name;

    // A. Wipe communications messages between currentUser and this user
    dbStore.deleteConversation(currentUser.id, targetId, businessId);

    // B. Add to hidden list in local storage for Internal Communications ONLY
    const nextHidden = Array.from(new Set([...hiddenUserIds, targetId]));
    setHiddenUserIds(nextHidden);
    try {
      localStorage.setItem(`omnipack_erp_hidden_comms_${businessId}`, JSON.stringify(nextHidden));
    } catch (e) {}

    // C. If currently selected, clear active chat
    if (selectedUserId === targetId) {
      setSelectedUserId(null);
      setIsMobileListVisible(true);
    }

    // D. Log non-destructive activity
    dbStore.logActivity(
      currentUser.id,
      currentUser.name,
      currentUser.role,
      'Remove from Communications',
      `Removed ${targetName} from Internal Communications roster`,
      businessId
    );

    setDeleteCommsUser(null);
    setContactInfoUser(null);
    setIsHeaderMenuOpen(false);
    showToast(`"${targetName}" removed from Internal Communications.`, 'success');
  };

  // Restore/Unhide a contact in Internal Communications
  const handleRestoreUserToComms = (userId: string, userName: string) => {
    const nextHidden = hiddenUserIds.filter(id => id !== userId);
    setHiddenUserIds(nextHidden);
    try {
      localStorage.setItem(`omnipack_erp_hidden_comms_${businessId}`, JSON.stringify(nextHidden));
    } catch (e) {}
    showToast(`"${userName}" restored to Internal Communications.`, 'success');
  };

  const handleCopyMessage = (msg: ChatMessage) => {
    navigator.clipboard.writeText(msg.content);
    setCopiedMsgId(msg.id);
    showToast('Message copied to clipboard', 'info');
    setTimeout(() => setCopiedMsgId(null), 2000);
  };

  const handleExportChat = (targetUser?: UserProfile | null) => {
    const userToExport = targetUser || selectedUser;
    if (!userToExport) {
      showToast('No contact selected to export', 'error');
      return;
    }

    const exportMsgs = messages.filter(m => 
      (m.sender_id === currentUser.id && m.receiver_id === userToExport.id) ||
      (m.sender_id === userToExport.id && m.receiver_id === currentUser.id)
    ).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    if (exportMsgs.length === 0) {
      showToast(`No message history with ${userToExport.name} to export`, 'info');
      return;
    }

    const transcript = exportMsgs.map(m => {
      const sender = m.sender_id === currentUser.id ? currentUser.name : userToExport.name;
      const time = new Date(m.created_at).toLocaleString();
      return `[${time}] ${sender}:\n${m.content}\n`;
    }).join('\n----------------------------------------\n\n');

    const blob = new Blob([transcript], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `OmniPack_Chat_${userToExport.name.replace(/\s+/g, '_')}_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    setIsHeaderMenuOpen(false);
    showToast('Chat transcript downloaded', 'success');
  };

  const getLastMessage = (userId: string) => {
    const userMessages = messages.filter(m => 
      (m.sender_id === currentUser.id && m.receiver_id === userId) ||
      (m.sender_id === userId && m.receiver_id === currentUser.id)
    ).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    
    return userMessages[0];
  };

  const totalUnreadCount = messages.filter(m => m.receiver_id === currentUser.id && !m.is_read).length;

  const quickEmojis = ['👍', '❤️', '✅', '📦', '⚠️', '🎉', '👏', '🙏', '🔥', '🚀'];

  return (
    <div className="flex flex-1 h-full min-h-0 w-full bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm relative font-sans">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`absolute top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl text-xs font-semibold shadow-lg flex items-center gap-2 border ${
              toastMessage.type === 'success' 
                ? 'bg-emerald-600 text-white border-emerald-500' 
                : toastMessage.type === 'error'
                  ? 'bg-rose-600 text-white border-rose-500'
                  : 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 border-slate-700'
            }`}
          >
            {toastMessage.type === 'success' && <CheckCircle2 size={15} />}
            {toastMessage.type === 'error' && <AlertTriangle size={15} />}
            {toastMessage.type === 'info' && <Info size={15} />}
            <span>{toastMessage.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar - Contact List */}
      <div className={`${isMobileListVisible ? 'flex' : 'hidden'} md:flex flex-col w-full md:w-80 lg:w-96 border-r border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/80 h-full min-h-0`}>
        
        {/* Sidebar Header */}
        <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 shrink-0 bg-white dark:bg-slate-900">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                {currentUser.name.charAt(0)}
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                  Communications
                </h2>
                <p className="text-[10px] text-slate-400 font-medium">Direct & System Messages</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {totalUnreadCount > 0 && (
                <span className="bg-emerald-500 text-white text-[10px] px-2 py-0.5 rounded-full font-black min-w-[20px] text-center shadow-xs">
                  {totalUnreadCount} new
                </span>
              )}
              {onClose && (
                <button 
                  onClick={onClose}
                  className="md:hidden p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="Close chat"
                >
                  <X size={18} />
                </button>
              )}
            </div>
          </div>

          {/* Search Box */}
          <div className="relative mb-2.5">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input 
              type="text" 
              placeholder="Search or start new chat..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all placeholder:text-slate-400"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none text-[11px] font-medium">
            <button
              onClick={() => setChatFilter('all')}
              className={`px-2.5 py-1 rounded-full whitespace-nowrap transition-all ${
                chatFilter === 'all'
                  ? 'bg-emerald-600 text-white font-bold shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              All ({visibleUsers.length})
            </button>
            <button
              onClick={() => setChatFilter('unread')}
              className={`px-2.5 py-1 rounded-full whitespace-nowrap transition-all flex items-center gap-1 ${
                chatFilter === 'unread'
                  ? 'bg-emerald-600 text-white font-bold shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              Unread
              {totalUnreadCount > 0 && (
                <span className="w-4 h-4 bg-emerald-500 text-white text-[9px] rounded-full flex items-center justify-center font-black">
                  {totalUnreadCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setChatFilter('colleagues')}
              className={`px-2.5 py-1 rounded-full whitespace-nowrap transition-all ${
                chatFilter === 'colleagues'
                  ? 'bg-emerald-600 text-white font-bold shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              Colleagues
            </button>
            <button
              onClick={() => setChatFilter('system')}
              className={`px-2.5 py-1 rounded-full whitespace-nowrap transition-all ${
                chatFilter === 'system'
                  ? 'bg-emerald-600 text-white font-bold shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              Bot
            </button>
            {removedUsers.length > 0 && (
              <button
                onClick={() => setChatFilter('removed')}
                className={`px-2.5 py-1 rounded-full whitespace-nowrap transition-all flex items-center gap-1 ${
                  chatFilter === 'removed'
                    ? 'bg-rose-600 text-white font-bold shadow-xs'
                    : 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100'
                }`}
              >
                Removed ({removedUsers.length})
              </button>
            )}
          </div>
        </div>

        {/* Contacts List */}
        <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/40">
          {filteredUsers.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <User className="mx-auto mb-2 opacity-20" size={32} />
              <p className="text-xs font-medium">
                {chatFilter === 'removed' ? 'No removed contacts' : 'No chats found'}
              </p>
              {chatFilter !== 'all' && (
                <button 
                  onClick={() => setChatFilter('all')}
                  className="mt-2 text-xs text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
                >
                  Show all chats
                </button>
              )}
            </div>
          ) : (
            filteredUsers.map(userItem => {
              const lastMsg = getLastMessage(userItem.id);
              const unreadCount = getUnreadCount(userItem.id);
              const isSelected = selectedUserId === userItem.id;
              const isOrderSystem = userItem.id === 'order_system';
              const isContactMenuOpen = activeContactMenuId === userItem.id;
              const isRemoved = hiddenUserIds.includes(userItem.id);

              return (
                <div
                  key={userItem.id}
                  className={`relative group flex items-stretch hover:bg-slate-100/80 dark:hover:bg-slate-800/60 transition-all ${
                    isSelected 
                      ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-l-4 border-emerald-600' 
                      : 'border-l-4 border-transparent'
                  }`}
                >
                  <button
                    onClick={() => {
                      if (isRemoved) {
                        handleRestoreUserToComms(userItem.id, userItem.name);
                      }
                      setSelectedUserId(userItem.id);
                      setIsMobileListVisible(false);
                      setIsSearchInChatOpen(false);
                      setInChatSearchQuery('');
                    }}
                    className="flex-1 p-3 flex items-start gap-3 text-left min-w-0"
                  >
                    <div className="relative shrink-0">
                      {isOrderSystem ? (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-500 to-amber-400 flex items-center justify-center text-white shadow-xs ring-2 ring-amber-200 dark:ring-amber-900/40">
                          <Bot size={20} />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center text-slate-700 dark:text-slate-200 font-bold uppercase border border-white dark:border-slate-800 shadow-xs">
                          {userItem.name.charAt(0)}
                        </div>
                      )}
                      
                      {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-emerald-600 text-white text-[9px] font-black rounded-full flex items-center justify-center ring-2 ring-white dark:ring-slate-900 shadow-xs">
                          {unreadCount}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-0.5">
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
                          {isRemoved && (
                            <span className="px-1.5 py-0.2 bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400 text-[9px] font-bold rounded-md">
                              Removed
                            </span>
                          )}
                        </p>
                        {lastMsg && (
                          <span className={`text-[10px] font-medium shrink-0 ml-1 ${
                            unreadCount > 0 ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-slate-400'
                          }`}>
                            {new Date(lastMsg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>

                      <div className="flex justify-between items-center">
                        <p className={`text-[11px] truncate pr-2 ${
                          unreadCount > 0 
                            ? 'text-slate-900 dark:text-slate-100 font-bold' 
                            : 'text-slate-500 dark:text-slate-400'
                        }`}>
                          {isRemoved 
                            ? 'Click to restore to Communications' 
                            : lastMsg 
                              ? lastMsg.content.replace(/\n/g, ' ') 
                              : (userItem.role || 'Colleague')}
                        </p>
                        {lastMsg && lastMsg.sender_id === currentUser.id && (
                          <span className="shrink-0 ml-1">
                            {lastMsg.is_read ? (
                              <CheckCheck size={14} className="text-sky-500" />
                            ) : (
                              <Check size={14} className="text-slate-400" />
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>

                  {/* Contact Item Options Menu Button */}
                  <div className="flex items-center pr-2" onMouseDown={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveContactMenuId(isContactMenuOpen ? null : userItem.id);
                      }}
                      className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-700 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Chat options"
                    >
                      <ChevronDown size={14} />
                    </button>

                    {/* Popover Menu */}
                    {isContactMenuOpen && (
                      <div 
                        onMouseDown={(e) => e.stopPropagation()}
                        className="absolute right-3 top-10 z-40 w-52 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl py-1 text-xs animate-in fade-in zoom-in-95 duration-100"
                      >
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setContactInfoUser(userItem);
                            setActiveContactMenuId(null);
                          }}
                          className="w-full px-3.5 py-2 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 flex items-center gap-2 cursor-pointer"
                        >
                          <Info size={14} className="text-slate-400" /> Contact Info
                        </button>
                        
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setClearChatUser(userItem);
                            setActiveContactMenuId(null);
                          }}
                          className="w-full px-3.5 py-2 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 flex items-center gap-2 cursor-pointer"
                        >
                          <Eraser size={14} className="text-slate-400" /> Clear Chat
                        </button>
                        
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteChatUser(userItem);
                            setActiveContactMenuId(null);
                          }}
                          className="w-full px-3.5 py-2 text-left text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2 cursor-pointer"
                        >
                          <Trash2 size={14} /> Delete Chat
                        </button>
                        
                        {!isOrderSystem && !isRemoved && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteCommsUser(userItem);
                              setActiveContactMenuId(null);
                            }}
                            className="w-full px-3.5 py-2 text-left text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2 border-t border-slate-100 dark:border-slate-700 font-semibold cursor-pointer"
                          >
                            <UserX size={14} /> Delete User from Comms
                          </button>
                        )}

                        {isRemoved && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRestoreUserToComms(userItem.id, userItem.name);
                              setActiveContactMenuId(null);
                            }}
                            className="w-full px-3.5 py-2 text-left text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 flex items-center gap-2 border-t border-slate-100 dark:border-slate-700 font-semibold cursor-pointer"
                          >
                            <RotateCcw size={14} /> Restore to Comms
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
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
            <div className="p-3 sm:px-4 sm:py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/90 dark:bg-slate-800/70 shrink-0 z-10">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setIsMobileListVisible(true)}
                  className="md:hidden p-1.5 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition"
                  title="Back to chat list"
                >
                  <ArrowLeft size={18} />
                </button>
                
                {/* Click avatar/name to view contact info */}
                <button 
                  onClick={() => setContactInfoUser(selectedUser)}
                  className="flex items-center gap-3 text-left group cursor-pointer"
                  title="Click to view contact info"
                >
                  {selectedUser.id === 'order_system' ? (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-500 to-amber-400 flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform">
                      <Bot size={20} />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold uppercase shadow-xs group-hover:scale-105 transition-transform">
                      {selectedUser.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      {selectedUser.name}
                      {selectedUser.id === 'order_system' && (
                        <span className="text-[10px] font-normal px-2 py-0.2 bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 rounded-full flex items-center gap-1">
                          <Sparkles size={10} /> Automated Bot
                        </span>
                      )}
                    </h3>
                    <p className="text-[10px] text-slate-500 font-medium flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
                      {selectedUser.role || 'Active Colleague'}
                    </p>
                  </div>
                </button>
              </div>

              {/* Header Action Buttons */}
              <div className="flex items-center gap-1">
                {/* Search In Chat */}
                <button 
                  onClick={() => setIsSearchInChatOpen(!isSearchInChatOpen)}
                  className={`p-2 rounded-lg transition ${
                    isSearchInChatOpen 
                      ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300' 
                      : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                  title="Search in conversation"
                >
                  <Search size={17} />
                </button>

                {/* 3-Dots Menu */}
                <div className="relative" ref={headerMenuRef} onMouseDown={(e) => e.stopPropagation()}>
                  <button 
                    type="button"
                    onClick={() => setIsHeaderMenuOpen(!isHeaderMenuOpen)}
                    className="p-2 rounded-lg text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                    title="More options"
                  >
                    <MoreVertical size={18} />
                  </button>

                  {isHeaderMenuOpen && (
                    <div 
                      onMouseDown={(e) => e.stopPropagation()}
                      className="absolute right-0 top-11 z-50 w-56 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl py-1.5 text-xs animate-in fade-in zoom-in-95 duration-100"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setContactInfoUser(selectedUser);
                          setIsHeaderMenuOpen(false);
                        }}
                        className="w-full px-4 py-2.5 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 flex items-center gap-2.5 cursor-pointer"
                      >
                        <Info size={15} className="text-slate-400" /> Contact Info
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsSearchInChatOpen(true);
                          setIsHeaderMenuOpen(false);
                        }}
                        className="w-full px-4 py-2.5 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 flex items-center gap-2.5 cursor-pointer"
                      >
                        <Search size={15} className="text-slate-400" /> Search in Chat
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          handleExportChat(selectedUser);
                          setIsHeaderMenuOpen(false);
                        }}
                        className="w-full px-4 py-2.5 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 flex items-center gap-2.5 cursor-pointer"
                      >
                        <Download size={15} className="text-slate-400" /> Export Chat
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setClearChatUser(selectedUser);
                          setIsHeaderMenuOpen(false);
                        }}
                        className="w-full px-4 py-2.5 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 flex items-center gap-2.5 cursor-pointer"
                      >
                        <Eraser size={15} className="text-slate-400" /> Clear Chat History
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDeleteChatUser(selectedUser);
                          setIsHeaderMenuOpen(false);
                        }}
                        className="w-full px-4 py-2.5 text-left text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2.5 cursor-pointer"
                      >
                        <Trash2 size={15} /> Delete Conversation
                      </button>
                      
                      {selectedUser.id !== 'order_system' && (
                        <button
                          type="button"
                          onClick={() => {
                            setDeleteCommsUser(selectedUser);
                            setIsHeaderMenuOpen(false);
                          }}
                          className="w-full px-4 py-2.5 text-left text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2.5 border-t border-slate-100 dark:border-slate-700 font-semibold cursor-pointer"
                        >
                          <UserX size={15} /> Delete User from Comms
                        </button>
                      )}
                    </div>
                  )}
                </div>

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

            {/* In-Chat Search Bar */}
            {isSearchInChatOpen && (
              <div className="p-2.5 bg-slate-100 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-700 flex items-center gap-2 shrink-0">
                <Search size={15} className="text-slate-400 ml-1" />
                <input 
                  type="text" 
                  placeholder="Search messages in this conversation..."
                  value={inChatSearchQuery}
                  onChange={(e) => setInChatSearchQuery(e.target.value)}
                  className="flex-1 bg-transparent border-none outline-none text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
                  autoFocus
                />
                {inChatSearchQuery && (
                  <span className="text-[10px] text-slate-500 font-bold bg-white dark:bg-slate-700 px-2 py-0.5 rounded-full">
                    {conversationMessages.length} found
                  </span>
                )}
                <button 
                  onClick={() => {
                    setIsSearchInChatOpen(false);
                    setInChatSearchQuery('');
                  }}
                  className="p-1 text-slate-400 hover:text-slate-600"
                >
                  <X size={14} />
                </button>
              </div>
            )}

            {/* Chat Messages Canvas */}
            <div className="flex-1 min-h-0 p-3 sm:p-4 overflow-y-auto space-y-3 bg-[#efeae2]/30 dark:bg-slate-950/40 relative">
              
              {conversationMessages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6">
                  {selectedUser.id === 'order_system' ? (
                    <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-2xl max-w-sm">
                      <Bot size={32} className="text-amber-600 dark:text-amber-400 mx-auto mb-2" />
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">Order System Connected</h4>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Automated packing notifications and delivery updates will appear here in real time.
                      </p>
                    </div>
                  ) : (
                    <div className="p-4 bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl max-w-xs shadow-xs">
                      <MessageSquare size={28} className="text-emerald-600 dark:text-emerald-400 mx-auto mb-2" />
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">No messages yet</p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Say hello to {selectedUser.name} to begin this conversation.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {conversationMessages.map((msg) => {
                    const isMe = msg.sender_id === currentUser.id;
                    const isHovered = hoveredMessageId === msg.id;

                    return (
                      <motion.div 
                        key={msg.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} group/msg relative`}
                        onMouseEnter={() => setHoveredMessageId(msg.id)}
                        onMouseLeave={() => setHoveredMessageId(null)}
                      >
                        <div className={`flex items-end gap-1.5 max-w-[88%] sm:max-w-[75%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                          
                          {/* Actions on hover for my own messages */}
                          {isMe && (
                            <div className={`flex items-center gap-1 opacity-0 group-hover/msg:opacity-100 transition-opacity ${isHovered ? 'opacity-100' : ''}`}>
                              <button
                                onClick={() => handleCopyMessage(msg)}
                                className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md transition"
                                title="Copy text"
                              >
                                <Copy size={12} />
                              </button>
                              <button
                                onClick={() => setReplyingToMessage(msg)}
                                className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md transition"
                                title="Reply"
                              >
                                <Reply size={12} />
                              </button>
                              <button
                                onClick={() => handleDeleteSingleMessage(msg.id)}
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-md transition"
                                title="Delete message"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          )}

                          <div className="relative">
                            
                            {/* Message Bubble */}
                            <div className={`rounded-2xl px-3.5 py-2 shadow-xs text-xs break-words ${
                              isMe 
                                ? 'bg-emerald-600 text-white rounded-tr-none' 
                                : selectedUser.id === 'order_system'
                                  ? 'bg-amber-50/90 dark:bg-amber-950/40 text-slate-900 dark:text-slate-100 border border-amber-200 dark:border-amber-800/80 rounded-tl-none'
                                  : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200/60 dark:border-slate-700/80 rounded-tl-none'
                            }`}>
                              
                              {/* Content & Interactive Order Card */}
                              {selectedUser.id === 'order_system' ? (
                                (() => {
                                  const match = msg.content.match(/(?:INV|ORD|SO)-[\d\w-]+/i)
                                             || msg.content.match(/(?:Sales\s+Order|Order|Invoice)[\s#:]*([A-Za-z0-9-]+)/i)
                                             || msg.content.match(/#([A-Za-z0-9-]+)/i);
                                  const orderNum = match ? (match[1] || match[0]).replace(/^#/, '').trim() : null;
                                  const allSales = dbStore.getSalesOrders(businessId);
                                  const clean = orderNum ? orderNum.toLowerCase() : '';
                                  const matchedOrder = orderNum ? allSales.find(o => {
                                    const oNum = (o.order_number || '').toLowerCase().replace(/^#/, '');
                                    return oNum === clean || oNum.includes(clean) || clean.includes(oNum) || o.id === orderNum;
                                  }) : null;

                                  return (
                                    <div className="space-y-2">
                                      {/* Order System Header Tag */}
                                      <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-amber-200/80 dark:border-amber-800/50 text-[11px]">
                                        <span className="font-extrabold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                                          <Bot size={13} className="text-amber-600 dark:text-amber-400" />
                                          Order Dispatch Alert
                                        </span>
                                        {matchedOrder && (
                                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                            matchedOrder.status === 'Delivered' 
                                              ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                                              : matchedOrder.status === 'Packed' || matchedOrder.status === 'Dispatched'
                                                ? 'bg-sky-100 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300'
                                                : 'bg-amber-100 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200'
                                          }`}>
                                            {matchedOrder.status}
                                          </span>
                                        )}
                                      </div>

                                      {/* Message Raw Summary */}
                                      <div className="text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                                        {msg.content}
                                      </div>

                                      {/* Structured Order Breakdown Card if matched */}
                                      {matchedOrder && (
                                        <div className="mt-2 p-2.5 bg-white/90 dark:bg-slate-900/90 rounded-xl border border-amber-300/60 dark:border-amber-700/50 space-y-1.5 shadow-xs">
                                          <div className="flex items-center justify-between text-[11px] font-bold">
                                            <span className="text-slate-600 dark:text-slate-400">Customer:</span>
                                            <span className="text-slate-900 dark:text-white font-semibold">{matchedOrder.customer_name}</span>
                                          </div>
                                          {matchedOrder.area && (
                                            <div className="flex items-center justify-between text-[10px]">
                                              <span className="text-slate-500">Delivery Area:</span>
                                              <span className="text-slate-700 dark:text-slate-300 font-medium">{matchedOrder.area}</span>
                                            </div>
                                          )}
                                          {matchedOrder.items && matchedOrder.items.length > 0 && (
                                            <div className="pt-1 border-t border-slate-100 dark:border-slate-800">
                                              <div className="text-[10px] font-bold text-slate-500 mb-1 flex items-center justify-between">
                                                <span>Items Breakdown:</span>
                                                <span className="text-amber-700 dark:text-amber-400">{matchedOrder.items.length} item(s)</span>
                                              </div>
                                              <ul className="text-[11px] space-y-0.5 max-h-28 overflow-y-auto pr-1">
                                                {matchedOrder.items.map((it: any, idx: number) => (
                                                  <li key={idx} className="flex justify-between items-center text-slate-700 dark:text-slate-300 py-0.5">
                                                    <span className="truncate max-w-[180px]">{it.product_name || 'Product'}</span>
                                                    <span className="font-black text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-1.5 py-0.2 rounded text-[10px]">
                                                      x{it.qty || it.quantity || 1}
                                                    </span>
                                                  </li>
                                                ))}
                                              </ul>
                                            </div>
                                          )}
                                          <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] font-extrabold">
                                            <span className="text-slate-600 dark:text-slate-400">Total Order:</span>
                                            <span className="text-emerald-600 dark:text-emerald-400">
                                              ₹{matchedOrder.total_amount?.toLocaleString()}
                                            </span>
                                          </div>
                                        </div>
                                      )}

                                      {/* Open Packing Station Button */}
                                      {orderNum && onNavigate && (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            onNavigate('packing', { 
                                              orderId: matchedOrder?.id, 
                                              orderNumber: matchedOrder?.order_number || orderNum 
                                            });
                                          }}
                                          className="mt-2 w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-3 py-2 rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition-transform active:scale-95 cursor-pointer"
                                        >
                                          <Package size={15} className="text-slate-950" /> 
                                          <span>Open Packing Station ({orderNum})</span>
                                        </button>
                                      )}
                                    </div>
                                  );
                                })()
                              ) : (
                                <div className="whitespace-pre-wrap">
                                  {msg.content.startsWith('> Replying to:') ? (
                                    <div>
                                      <div className="p-1.5 mb-1.5 bg-black/5 dark:bg-white/5 border-l-2 border-emerald-600 rounded text-[11px] text-slate-600 dark:text-slate-300 italic">
                                        {msg.content.split('\n\n')[0]}
                                      </div>
                                      <p>{msg.content.split('\n\n').slice(1).join('\n\n')}</p>
                                    </div>
                                  ) : (
                                    <p>{msg.content}</p>
                                  )}
                                </div>
                              )}

                              {/* Timestamp & Read Receipt */}
                              <div className={`flex items-center justify-end gap-1 mt-1 text-[10px] select-none ${
                                isMe ? 'text-emerald-100 dark:text-emerald-200' : 'text-slate-400'
                              }`}>
                                <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                {isMe && (
                                  msg.is_read ? (
                                    <CheckCheck size={14} className="text-sky-200 dark:text-sky-300" />
                                  ) : (
                                    <Check size={14} className="text-emerald-200" />
                                  )
                                )}
                              </div>
                            </div>

                            {/* Actions on hover for incoming messages */}
                            {!isMe && (
                              <div className={`flex items-center gap-1 opacity-0 group-hover/msg:opacity-100 transition-opacity ${isHovered ? 'opacity-100' : ''}`}>
                                <button
                                  onClick={() => handleCopyMessage(msg)}
                                  className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md transition"
                                  title="Copy text"
                                >
                                  <Copy size={12} />
                                </button>
                                <button
                                  onClick={() => setReplyingToMessage(msg)}
                                  className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md transition"
                                  title="Reply"
                                >
                                  <Reply size={12} />
                                </button>
                                <button
                                  onClick={() => handleDeleteSingleMessage(msg.id)}
                                  className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-md transition"
                                  title="Delete message"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
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

            {/* Replying Banner */}
            {replyingToMessage && (
              <div className="px-4 py-2 bg-emerald-50 dark:bg-emerald-950/40 border-t border-emerald-200 dark:border-emerald-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 overflow-hidden">
                  <Reply size={14} className="text-emerald-600 shrink-0" />
                  <div className="truncate">
                    <span className="font-bold text-emerald-800 dark:text-emerald-300">
                      Replying to {replyingToMessage.sender_id === currentUser.id ? 'yourself' : selectedUser.name}:
                    </span>
                    <span className="text-slate-600 dark:text-slate-300 ml-1.5 italic">
                      "{replyingToMessage.content.slice(0, 50)}..."
                    </span>
                  </div>
                </div>
                <button 
                  onClick={() => setReplyingToMessage(null)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <X size={14} />
                </button>
              </div>
            )}

            {/* Quick Emoji Bar */}
            {showEmojiPicker && (
              <div className="p-2 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex items-center gap-1.5 overflow-x-auto">
                {quickEmojis.map(emoji => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => {
                      setNewMessage(prev => prev + emoji);
                    }}
                    className="p-1.5 text-base hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-transform active:scale-125"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}

            {/* Message Input Bar */}
            <div className="p-2.5 sm:p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 shrink-0 z-10">
              <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className={`p-2 rounded-full transition ${
                    showEmojiPicker ? 'text-emerald-600 bg-emerald-100 dark:bg-emerald-950/60' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-800'
                  }`}
                  title="Insert emoji"
                >
                  <Smile size={18} />
                </button>

                <div className="flex-1 flex items-center bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 focus-within:ring-2 focus-within:ring-emerald-500 focus-within:border-transparent px-3 py-1 shadow-xs">
                  <input 
                    type="text" 
                    placeholder={selectedUser.id === 'order_system' ? 'Send a reply or system log...' : `Type a message...`}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="flex-1 bg-transparent border-none outline-none text-xs py-2 text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
                  />
                </div>

                <button 
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="p-2.5 bg-emerald-600 text-white rounded-full hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-xs shrink-0 active:scale-95 cursor-pointer"
                  title="Send message"
                >
                  <Send size={16} />
                </button>
              </form>
            </div>
          </>
        ) : (
          /* Empty State */
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-slate-50/20 dark:bg-slate-900/20 relative">
            {onClose && (
              <button 
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            )}
            <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mb-4">
              <MessageSquare size={32} />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Internal Communications</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 max-w-xs leading-relaxed">
              Unified team communication hub with automated Order System alerts, direct messaging, and packing routing.
            </p>
            <div className="grid grid-cols-2 gap-3 mt-8 w-full max-w-sm">
              <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-left shadow-xs">
                <div className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase mb-1">Direct Team Chat</div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">Clear chat history or remove contacts from communications.</p>
              </div>
              <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-left shadow-xs">
                <div className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase mb-1">Order System</div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">Direct notifications routed specifically to Packing Staff.</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 1. Contact Info Modal */}
      {contactInfoUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-xl relative"
          >
            <button
              onClick={() => setContactInfoUser(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="text-center mb-6">
              {contactInfoUser.id === 'order_system' ? (
                <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-tr from-amber-500 to-amber-400 flex items-center justify-center text-white shadow-md mb-3">
                  <Bot size={40} />
                </div>
              ) : (
                <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-3xl shadow-md mb-3">
                  {contactInfoUser.name.charAt(0)}
                </div>
              )}
              <h3 className="text-base font-bold text-slate-900 dark:text-white">{contactInfoUser.name}</h3>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">{contactInfoUser.role || 'Colleague'}</p>
            </div>

            <div className="space-y-3 bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl text-xs border border-slate-100 dark:border-slate-800 mb-6">
              <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                <Mail size={16} className="text-slate-400 shrink-0" />
                <span className="font-medium truncate">{contactInfoUser.email || 'No email on record'}</span>
              </div>
              <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                <Shield size={16} className="text-slate-400 shrink-0" />
                <span className="font-medium">Role: {contactInfoUser.role || 'Standard Staff'}</span>
              </div>
              <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                <Building size={16} className="text-slate-400 shrink-0" />
                <span className="font-medium">Business: {businessId}</span>
              </div>
              <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                <Clock size={16} className="text-slate-400 shrink-0" />
                <span className="font-medium">Joined: {new Date(contactInfoUser.created_at || Date.now()).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => handleExportChat(contactInfoUser)}
                className="w-full py-2.5 px-3 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download size={14} /> Export Chat Transcript
              </button>

              <button
                type="button"
                onClick={() => {
                  const target = contactInfoUser;
                  setContactInfoUser(null);
                  setClearChatUser(target);
                }}
                className="w-full py-2.5 px-3 text-xs font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Eraser size={14} /> Clear Chat History
              </button>
              
              {contactInfoUser.id !== 'order_system' && (
                <button
                  type="button"
                  onClick={() => {
                    const target = contactInfoUser;
                    setContactInfoUser(null);
                    setDeleteCommsUser(target);
                  }}
                  className="w-full py-2.5 px-3 text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/40 border border-rose-200 dark:border-rose-800 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <UserX size={14} /> Delete User from Communications
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* 2. Clear Chat Confirmation Modal with YES / NO */}
      {clearChatUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-xl"
          >
            <div className="flex items-center gap-3 text-amber-600 dark:text-amber-400 mb-4">
              <div className="p-3 bg-amber-100 dark:bg-amber-950/60 rounded-xl">
                <Eraser size={24} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Clear Chat Messages?</h3>
                <p className="text-xs text-slate-500">Keep contact, delete history</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
              Are you sure you want to clear all message history with <span className="font-bold text-slate-900 dark:text-white">{clearChatUser.name}</span>? The contact will remain in your chat list.
            </p>

            <div className="flex justify-end items-center gap-3">
              <button
                type="button"
                onClick={() => setClearChatUser(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition cursor-pointer"
              >
                No, Keep Messages
              </button>
              <button
                type="button"
                onClick={handleConfirmClearConversation}
                className="px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition shadow-md shadow-amber-600/20 cursor-pointer"
              >
                Yes, Clear Chat
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* 3. Delete Entire Chat Confirmation Modal with YES / NO */}
      {deleteChatUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-xl"
          >
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400 mb-4">
              <div className="p-3 bg-rose-100 dark:bg-rose-950/60 rounded-xl">
                <Trash2 size={24} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Delete Entire Conversation?</h3>
                <p className="text-xs text-slate-500">Wipe chat transcript</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
              Are you sure you want to delete the conversation with <span className="font-bold text-slate-900 dark:text-white">{deleteChatUser.name}</span>? All messages will be wiped.
            </p>

            <div className="flex justify-end items-center gap-3">
              <button
                type="button"
                onClick={() => setDeleteChatUser(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition cursor-pointer"
              >
                No, Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteEntireConversation}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition shadow-md shadow-rose-600/20 cursor-pointer"
              >
                Yes, Delete Chat
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* 4. Delete User from Internal Communications Modal with YES / NO */}
      {deleteCommsUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-xl"
          >
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400 mb-4">
              <div className="p-3 bg-rose-100 dark:bg-rose-950/60 rounded-xl">
                <UserX size={24} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Delete User from Communications?</h3>
                <p className="text-xs text-slate-500">Internal Communications only</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
              Are you sure you want to delete <span className="font-bold text-slate-900 dark:text-white">{deleteCommsUser.name}</span> (<span className="text-slate-500">{deleteCommsUser.role}</span>) from Internal Communications?
            </p>

            <div className="p-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-[11px] text-slate-700 dark:text-slate-300 mb-6 space-y-1">
              <p className="font-semibold text-emerald-700 dark:text-emerald-400">✓ The user's ERP login and employee roster account will remain active.</p>
              <p className="text-slate-500">• This user will be removed from your Communications chat list and messages will be cleared.</p>
            </div>

            <div className="flex justify-end items-center gap-3">
              <button
                type="button"
                onClick={() => setDeleteCommsUser(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition cursor-pointer"
              >
                No, Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteUserFromComms}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition shadow-md shadow-rose-600/20 flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 size={13} />
                Yes, Delete from Communications
              </button>
            </div>
          </motion.div>
        </div>
      )}

    </div>
  );
};
