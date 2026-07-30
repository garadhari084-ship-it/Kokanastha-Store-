import { PageHeader } from './PageHeader';
import React, { useEffect, useState, useMemo } from 'react';
import { ShieldAlert, Search, RefreshCw, Calendar, UserCheck, Shield, Key, Plus, Trash2, Edit3, Activity, AlertCircle, Clock, Zap, UserPlus, Box, Truck, Tag, Settings, CreditCard, Play } from 'lucide-react';
import { dbStore } from '../services/store';
import { SystemAuditLog } from '../types/erp';
import { motion, AnimatePresence } from 'motion/react';

interface AuditLogViewProps {
  businessId: string;
  triggerToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const AuditLogView: React.FC<AuditLogViewProps> = ({ businessId, triggerToast }) => {
  const [logs, setLogs] = useState<SystemAuditLog[]>(dbStore.getSystemAuditLogs(businessId));
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string>('All');
  const [timeRange, setTimeRange] = useState<string>('all');

  useEffect(() => {
    return dbStore.subscribe(() => {
      setLogs(dbStore.getSystemAuditLogs(businessId));
    });
  }, [businessId]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      await dbStore.syncFromSupabase(businessId);
      const updatedLogs = dbStore.getSystemAuditLogs(businessId);
      setLogs(updatedLogs);
      triggerToast('Security audit trail synchronized successfully.', 'success');
    } catch (error) {
      console.error('Failed to refresh audit logs:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const getActionIcon = (action: string) => {
    const act = action.toLowerCase();
    if (act.includes('login') || act.includes('auth')) return <Key size={14} className="text-emerald-500" />;
    if (act.includes('delete') || act.includes('remove')) return <Trash2 size={14} className="text-red-500" />;
    if (act.includes('create') || act.includes('add')) return <Plus size={14} className="text-blue-500" />;
    if (act.includes('update') || act.includes('edit')) return <Edit3 size={14} className="text-amber-500" />;
    if (act.includes('pack') || act.includes('scan')) return <Box size={14} className="text-indigo-500" />;
    if (act.includes('deliver') || act.includes('dispatch')) return <Truck size={14} className="text-purple-500" />;
    if (act.includes('bill') || act.includes('invoice') || act.includes('pay')) return <CreditCard size={14} className="text-teal-500" />;
    if (act.includes('product') || act.includes('category')) return <Tag size={14} className="text-rose-500" />;
    if (act.includes('setting') || act.includes('config')) return <Settings size={14} className="text-slate-500" />;
    if (act.includes('provision')) return <UserPlus size={14} className="text-cyan-500" />;
    return <Activity size={14} className="text-slate-400" />;
  };

  const getActionColor = (action: string) => {
    const act = action.toLowerCase();
    if (act.includes('delete') || act.includes('remove') || act.includes('fail')) return 'bg-red-50 dark:bg-red-500/10 border-red-100 dark:border-red-500/20';
    if (act.includes('login')) return 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20';
    if (act.includes('create') || act.includes('add')) return 'bg-blue-50 dark:bg-blue-500/10 border-blue-100 dark:border-blue-500/20';
    if (act.includes('update') || act.includes('edit')) return 'bg-amber-50 dark:bg-amber-500/10 border-amber-100 dark:border-amber-500/20';
    return 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700';
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'Super Admin':
        return <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400 border border-purple-200 dark:border-purple-500/30">Super Admin</span>;
      case 'Admin':
        return <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30">Admin</span>;
      case 'Manager':
        return <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30">Manager</span>;
      default:
        return <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700">{role}</span>;
    }
  };

  const filteredLogs = useMemo(() => {
    let result = logs;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(l => 
        (l.user_name || '').toLowerCase().includes(q) ||
        (l.action || '').toLowerCase().includes(q) ||
        (l.details || '').toLowerCase().includes(q) ||
        (l.user_role || '').toLowerCase().includes(q)
      );
    }

    if (selectedRole !== 'All') {
      result = result.filter(l => l.user_role === selectedRole);
    }

    if (timeRange !== 'all') {
      const now = new Date();
      result = result.filter(l => {
        const logDate = new Date(l.created_at);
        const diffMs = now.getTime() - logDate.getTime();
        const diffDays = diffMs / (1000 * 60 * 60 * 24);
        if (timeRange === 'today') return diffDays < 1;
        if (timeRange === 'week') return diffDays < 7;
        if (timeRange === 'month') return diffDays < 30;
        return true;
      });
    }

    return result;
  }, [logs, searchQuery, selectedRole, timeRange]);

  const stats = useMemo(() => {
    const today = new Date();
    const todayLogs = logs.filter(l => (today.getTime() - new Date(l.created_at).getTime()) < 24 * 60 * 60 * 1000);
    const criticalLogs = logs.filter(l => l.action.toLowerCase().includes('delete') || l.action.toLowerCase().includes('remove'));
    const uniqueUsers = new Set(logs.map(l => l.user_id)).size;

    return {
      total: logs.length,
      today: todayLogs.length,
      critical: criticalLogs.length,
      users: uniqueUsers
    };
  }, [logs]);

  // Format date elegantly
  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return {
      date: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
      time: d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    };
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 px-2 sm:px-4 font-sans text-slate-900 dark:text-slate-100">
      <PageHeader
        title="Security Compliance & Audit Trails"
        subtitle="Immutable chronological timeline of all warehouse activities, login sessions, and system mutations."
        icon={ShieldAlert}
        rightContent={
          <div className="flex items-center gap-2">
            <button 
              onClick={handleRefresh}
              disabled={isRefreshing}
              className={`flex items-center gap-1.5 px-4 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-[10px] sm:text-[11px] font-bold shadow-md transition-all whitespace-nowrap border border-white/10 active:scale-95 ${isRefreshing ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
              <span>{isRefreshing ? 'Synchronizing...' : 'Refresh Feed'}</span>
            </button>
          </div>
        }
      />

      {/* Stats Bento */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Operations', value: stats.total, icon: Activity, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10' },
          { label: 'Operations Today', value: stats.today, icon: Zap, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-500/10' },
          { label: 'Critical Events', value: stats.critical, icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-500/10' },
          { label: 'Unique Actors', value: stats.users, icon: UserCheck, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
        ].map((stat, idx) => (
          <div key={idx} className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${stat.bg} ${stat.color}`}>
              <stat.icon size={18} />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider mb-0.5">{stat.label}</div>
              <div className="text-xl font-extrabold text-slate-900 dark:text-white leading-none">{stat.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-900 p-2 sm:p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-center gap-3">
        <div className="relative w-full sm:flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search by actor, action, or event details..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800/50 text-sm font-medium rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-slate-400"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-800/50 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none text-slate-700 dark:text-slate-300 min-w-[110px]"
          >
            <option value="All">All Roles</option>
            <option value="Super Admin">Super Admin</option>
            <option value="Admin">Admin</option>
            <option value="Manager">Manager</option>
            <option value="Packing Staff">Packing Staff</option>
          </select>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-800/50 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none text-slate-700 dark:text-slate-300 min-w-[110px]"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">Past 7 Days</option>
            <option value="month">Past 30 Days</option>
          </select>
        </div>
      </div>

      {/* Timeline List */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/20">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <Shield size={16} className="text-slate-400" />
            Activity Log
          </h3>
          <span className="text-[11px] font-mono font-medium text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
            {filteredLogs.length} Records
          </span>
        </div>
        
        <div className="divide-y divide-slate-100 dark:divide-slate-800/50 max-h-[800px] overflow-y-auto custom-scrollbar">
          <AnimatePresence initial={false}>
            {filteredLogs.length > 0 ? (
              filteredLogs.map((log, idx) => {
                const time = formatTime(log.created_at);
                const colorClass = getActionColor(log.action);
                
                return (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: Math.min(idx * 0.03, 0.5) }}
                    key={`${log.id}-${idx}`}
                    className="p-4 sm:p-5 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group relative"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                      {/* Timestamp & Icon */}
                      <div className="flex items-start sm:w-32 shrink-0">
                        <div className="hidden sm:flex flex-col items-end text-right pr-4 border-r border-slate-200 dark:border-slate-700 w-full">
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{time.date}</span>
                          <span className="text-[10px] font-mono text-slate-500">{time.time}</span>
                        </div>
                        {/* Mobile time */}
                        <div className="sm:hidden flex items-center gap-1.5 text-[11px] font-mono text-slate-500 mb-2">
                          <Clock size={12} />
                          {time.date} at {time.time}
                        </div>
                      </div>

                      {/* Main Content */}
                      <div className="flex-1 flex items-start gap-3 relative">
                        <div className={`mt-0.5 shrink-0 w-8 h-8 rounded-full flex items-center justify-center border ${colorClass} shadow-sm group-hover:scale-110 transition-transform`}>
                          {getActionIcon(log.action)}
                        </div>
                        
                        <div className="flex-1 space-y-1.5">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                                {log.action}
                              </span>
                              <div className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600 hidden sm:block"></div>
                              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                                <UserCheck size={12} className="text-slate-400" />
                                {log.user_name}
                              </span>
                            </div>
                            <div className="hidden sm:block">
                              {getRoleBadge(log.user_role)}
                            </div>
                          </div>
                          
                          <div className="text-[13px] text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                            {log.details}
                          </div>
                          
                          <div className="sm:hidden mt-2">
                            {getRoleBadge(log.user_role)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            ) : (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                className="py-16 text-center"
              >
                <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100 dark:border-slate-700">
                  <ShieldAlert size={24} className="text-slate-300 dark:text-slate-600" />
                </div>
                <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">No Activity Found</h4>
                <p className="text-xs text-slate-500">We couldn't find any audit logs matching your filters.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
