import { PageHeader } from './PageHeader';
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, Search, ShieldCheck, UserPlus, Edit2, Trash2, X, MoreVertical,
  Activity, Calendar, Mail, Clock, LayoutGrid, List, CheckCircle2,
  Lock, Key, Power, ExternalLink, ArrowUpRight, Zap, ShieldAlert,
  BarChart2, Filter, ChevronDown, UserCheck, UserX, Shield, Fingerprint
} from 'lucide-react';
import { dbStore } from '../services/store';
import { UserProfile, UserRole, SystemAuditLog } from '../types/erp';
import { supabase, isSupabaseConfigured } from '../services/supabase';

interface UsersModuleProps {
  businessId: string;
  user: UserProfile;
  triggerToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const UsersModule: React.FC<UsersModuleProps> = ({ 
  businessId, 
  user: currentUser, 
  triggerToast 
}) => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [logs, setLogs] = useState<SystemAuditLog[]>([]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);

  // New User Form State
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('Viewer');
  const [newUserPassword, setNewUserPassword] = useState('');

  const loadData = () => {
    setUsers(dbStore.getUsers(businessId));
    setLogs(dbStore.getSystemAuditLogs(businessId));
  };

  useEffect(() => {
    loadData();
    return dbStore.subscribe(() => {
      loadData();
    });
  }, [businessId]);

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentUser.role !== 'Super Admin' && currentUser.role !== 'Admin') {
      triggerToast('Unauthorized: Only Admins can create users.', 'error');
      return;
    }
    try {
      const newUser = dbStore.createUser({
        name: newUserName,
        email: newUserEmail,
        role: newUserRole,
        business_id: businessId,
        active: true,
        password_hash: newUserPassword
      });
      if (isSupabaseConfigured && supabase && newUserPassword) {
        supabase.auth.signUp({
          email: newUserEmail,
          password: newUserPassword,
          options: {
            data: { name: newUserName, role: newUserRole, business_id: businessId }
          }
        }).catch(err => console.warn('Supabase Auth signUp notice:', err));
      }
      triggerToast(`User ${newUserName} created successfully.`, 'success');
      dbStore.logActivity(currentUser.id, currentUser.name, currentUser.role, 'Add User', `Created new user ${newUserName} (${newUserRole})`, businessId);
      setIsAddModalOpen(false);
      setNewUserName('');
      setNewUserEmail('');
      setNewUserRole('Viewer');
      setNewUserPassword('');
    } catch (e: any) {
      triggerToast(e.message || 'Failed to provision identity', 'error');
    }
  };

  const openEditModal = (u: UserProfile) => {
    if (currentUser.role !== 'Super Admin' && currentUser.role !== 'Admin' && currentUser.id !== u.id) {
      triggerToast('Unauthorized: You can only edit your own profile.', 'error');
      return;
    }
    setSelectedUser(u);
    setNewUserName(u.name);
    setNewUserEmail(u.email);
    setNewUserRole(u.role);
    setNewUserPassword('');
    setIsEditModalOpen(true);
  };

  const handleEditUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    try {
      const updates: Partial<UserProfile> = { name: newUserName, email: newUserEmail, role: newUserRole };
      if (newUserPassword.trim() !== '') {
        (updates as any).password_hash = newUserPassword;
      }
      dbStore.updateUser(selectedUser.id, updates);
      triggerToast(`Identity ${newUserName} updated successfully.`, 'success');
      dbStore.logActivity(currentUser.id, currentUser.name, currentUser.role, 'Update Identity', `Updated identity ${newUserName}`, businessId);
      setIsEditModalOpen(false);
      setSelectedUser(null);
    } catch (e: any) {
      triggerToast(e.message || 'Failed to update identity', 'error');
    }
  };

  const toggleUserStatus = (u: UserProfile) => {
    if (currentUser.role !== 'Super Admin' && currentUser.role !== 'Admin') {
      triggerToast('Unauthorized: Only Admins can modify status.', 'error');
      return;
    }
    if (u.id === currentUser.id) {
      triggerToast('You cannot suspend your own active session.', 'error');
      return;
    }
    try {
      dbStore.updateUser(u.id, { active: !u.active });
      triggerToast(`Identity ${u.name} ${!u.active ? 'activated' : 'suspended'}.`, 'success');
      dbStore.logActivity(currentUser.id, currentUser.name, currentUser.role, 'Status Toggle', `Changed access status for ${u.name} to ${!u.active ? 'Active' : 'Suspended'}`, businessId);
    } catch (e: any) {
      triggerToast(e.message || 'Failed to change status', 'error');
    }
  };

  const openDeleteModal = (u: UserProfile) => {
    if (currentUser.role !== 'Super Admin') {
      triggerToast('Unauthorized: Only Super Admins can revoke identities.', 'error');
      return;
    }
    if (u.id === currentUser.id) {
      triggerToast('You cannot self-revoke your super admin identity.', 'error');
      return;
    }
    setSelectedUser(u);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteUser = () => {
    if (!selectedUser) return;
    try {
      dbStore.deleteUser(selectedUser.id);
      triggerToast(`Identity ${selectedUser.name} obliterated.`, 'success');
      dbStore.logActivity(currentUser.id, currentUser.name, currentUser.role, 'Revoke Identity', `Obliterated identity ${selectedUser.name}`, businessId);
      setIsDeleteModalOpen(false);
      setSelectedUser(null);
    } catch (e: any) {
      triggerToast(e.message || 'Failed to revoke identity', 'error');
    }
  };

  const userActivityMap = useMemo(() => {
    const map = new Map<string, { lastLogin: Date | null, actionCount: number }>();
    users.forEach(u => map.set(u.id, { lastLogin: null, actionCount: 0 }));
    logs.forEach(log => {
      const data = map.get(log.user_id);
      if (data) {
        data.actionCount++;
        const logDate = new Date(log.created_at);
        if (log.action.includes('Login') && (!data.lastLogin || logDate > data.lastLogin)) {
          data.lastLogin = logDate;
        }
      }
    });
    return map;
  }, [users, logs]);

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) || u.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = roleFilter === 'All' || u.role === roleFilter;
      const matchesStatus = statusFilter === 'All' || (statusFilter === 'Active' ? u.active : !u.active);
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchTerm, roleFilter, statusFilter]);

  const allRoles = Array.from(new Set(users.map(u => u.role)));

  // KPI Calculations
  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.active).length;
  const suspendedUsers = totalUsers - activeUsers;
  const adminUsers = users.filter(u => u.role === 'Super Admin' || u.role === 'Admin').length;

  return (
    <div className="space-y-4 max-w-full pb-12 px-0 font-sans text-slate-900 dark:text-slate-100 overflow-x-hidden animate-in fade-in duration-300">
      <PageHeader
        title="Identity & Access Management"
        subtitle="Manage organization users, strict RBAC roles, and operational access controls."
        icon={Fingerprint}
        rightContent={
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex bg-slate-900/60 rounded-xl p-0.5 border border-slate-700/50 mr-1 shadow-inner">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${viewMode === 'grid' ? 'bg-slate-800 text-amber-400 shadow-sm ring-1 ring-slate-600' : 'text-slate-400 hover:text-slate-200'}`}
                title="Grid View"
              >
                <LayoutGrid size={14} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${viewMode === 'list' ? 'bg-slate-800 text-amber-400 shadow-sm ring-1 ring-slate-600' : 'text-slate-400 hover:text-slate-200'}`}
                title="List View"
              >
                <List size={14} />
              </button>
            </div>
            {(currentUser.role === 'Super Admin' || currentUser.role === 'Admin') && (
              <button 
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white rounded-xl text-[10px] sm:text-[11px] font-bold cursor-pointer shadow-md transition-all whitespace-nowrap border border-indigo-400/30"
              >
                <UserPlus size={14} />
                <span>Add New User</span>
              </button>
            )}
          </div>
        }
      />

      {/* Advanced KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 px-0.5 sm:px-1">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm relative overflow-hidden group hover:border-amber-500/30 transition-colors">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-amber-500/10 transition-colors"></div>
          <div className="flex justify-between items-start mb-2 relative z-10">
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Identities</h3>
            <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              <Users size={14} />
            </div>
          </div>
          <div className="relative z-10">
            <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{totalUsers}</span>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm relative overflow-hidden group hover:border-emerald-500/30 transition-colors">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-emerald-500/10 transition-colors"></div>
          <div className="flex justify-between items-start mb-2 relative z-10">
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Active Sessions</h3>
            <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <UserCheck size={14} />
            </div>
          </div>
          <div className="relative z-10 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{activeUsers}</span>
            <span className="text-[10px] font-bold text-emerald-500">{(activeUsers/totalUsers*100 || 0).toFixed(0)}%</span>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm relative overflow-hidden group hover:border-rose-500/30 transition-colors">
           <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-rose-500/10 transition-colors"></div>
          <div className="flex justify-between items-start mb-2 relative z-10">
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Suspended</h3>
            <div className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <UserX size={14} />
            </div>
          </div>
          <div className="relative z-10">
            <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{suspendedUsers}</span>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm relative overflow-hidden group hover:border-indigo-500/30 transition-colors">
           <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-indigo-500/10 transition-colors"></div>
          <div className="flex justify-between items-start mb-2 relative z-10">
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Elevated Privileges</h3>
            <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <ShieldAlert size={14} />
            </div>
          </div>
          <div className="relative z-10">
            <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{adminUsers}</span>
          </div>
        </div>
      </div>

      <div className="px-0.5 sm:px-1 space-y-4">
        {/* Advanced Filters Toolbar */}
        <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative flex-1 w-full max-w-md">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search directory by name, email..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-700/60 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all dark:text-white font-medium"
            />
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 hide-scrollbar">
            <div className="relative shrink-0">
               <Shield size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 z-10" />
               <select 
                value={roleFilter} 
                onChange={e => setRoleFilter(e.target.value)}
                className="pl-8 pr-8 py-2 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-700/60 rounded-xl text-[11px] focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all dark:text-white cursor-pointer font-bold appearance-none relative"
              >
                <option value="All">All Access Roles</option>
                {allRoles.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
            
            <div className="relative shrink-0">
               <Filter size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 z-10" />
               <select 
                value={statusFilter} 
                onChange={e => setStatusFilter(e.target.value)}
                className="pl-8 pr-8 py-2 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-700/60 rounded-xl text-[11px] focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all dark:text-white cursor-pointer font-bold appearance-none relative"
              >
                <option value="All">All Statuses</option>
                <option value="Active">Active Users</option>
                <option value="Inactive">Suspended Users</option>
              </select>
              <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Directory Listing */}
        {filteredUsers.length === 0 ? (
          <div className="p-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 rounded-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 flex items-center justify-center text-slate-400 mb-5 shadow-inner">
              <Users size={32} />
            </div>
            <h3 className="text-base font-black text-slate-900 dark:text-white mb-1.5 tracking-tight">No identities matched</h3>
            <p className="text-xs text-slate-500 max-w-sm leading-relaxed">Adjust your filters or query to locate specific users within the organization's directory.</p>
            <button 
              onClick={() => { setSearchTerm(''); setRoleFilter('All'); setStatusFilter('All'); }}
              className="mt-6 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold rounded-xl transition-colors"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredUsers.map((u) => {
                const actData = userActivityMap.get(u.id);
                const isAdmin = u.role === 'Super Admin' || u.role === 'Admin';
                return (
                  <div key={u.id} className={`bg-white dark:bg-slate-900 border rounded-2xl shadow-sm overflow-hidden flex flex-col group hover:shadow-md transition-all duration-300 ${!u.active ? 'opacity-75 grayscale-[20%] border-slate-200 dark:border-slate-800' : isAdmin ? 'border-indigo-500/20 hover:border-indigo-500/40' : 'border-slate-200 dark:border-slate-800 hover:border-amber-500/30'}`}>
                    <div className="p-5 flex-1 relative">
                       {/* Subtle Background Accent for Admins */}
                       {isAdmin && (
                         <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-bl-full pointer-events-none"></div>
                       )}
                      <div className="flex justify-between items-start mb-4 relative z-10">
                        <div className="relative">
                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl shadow-inner group-hover:scale-105 transition-transform ${isAdmin ? 'bg-gradient-to-br from-indigo-100 to-indigo-200 dark:from-indigo-900/60 dark:to-indigo-800/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700' : 'bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'}`}>
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-slate-900 ${u.active ? 'bg-emerald-500' : 'bg-rose-500'}`} title={u.active ? "Active" : "Suspended"}></div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button onClick={() => openEditModal(u)} className="p-1.5 text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-500/10 rounded-lg transition-colors" title="Modify Identity">
                            <Edit2 size={14} />
                          </button>
                          {(currentUser.role === 'Super Admin' && u.id !== currentUser.id) && (
                            <button onClick={() => openDeleteModal(u)} className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors" title="Revoke Access">
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="relative z-10">
                        <h3 className="font-black text-slate-900 dark:text-white text-base truncate pr-2 tracking-tight" title={u.name}>{u.name}</h3>
                        <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs mt-1 truncate font-medium">
                          <Mail size={12} className="shrink-0 text-slate-400" />
                          <span className="truncate">{u.email}</span>
                        </div>
                      </div>
                      <div className="mt-5 flex flex-wrap items-center gap-2 relative z-10">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${isAdmin ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300 border-indigo-200 dark:border-indigo-500/20' : 'bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700 ring-1 ring-inset ring-slate-500/20'}`}>
                          <ShieldCheck size={12} />
                          {u.role}
                        </span>
                        {!u.active && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20">
                            <Lock size={12} /> Suspended
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="px-5 py-3.5 bg-slate-50/80 dark:bg-slate-900/60 border-t border-slate-100 dark:border-slate-800/80 flex justify-between items-center">
                      <div className="flex flex-col gap-0.5 text-[10px]">
                        <span className="text-slate-400 font-bold uppercase tracking-wider">Last Auth</span>
                        <span className="font-mono text-slate-700 dark:text-slate-300 font-bold flex items-center gap-1">
                          {actData?.lastLogin ? (
                             <>
                               <CheckCircle2 size={10} className="text-emerald-500" />
                               {actData.lastLogin.toLocaleDateString()}
                             </>
                          ) : (
                             <>
                               <Clock size={10} className="text-slate-400" />
                               Never
                             </>
                          )}
                        </span>
                      </div>
                      {(currentUser.role === 'Super Admin' || currentUser.role === 'Admin') && u.id !== currentUser.id && (
                        <button 
                          onClick={() => toggleUserStatus(u)}
                          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[10px] font-bold uppercase tracking-wider transition-all shadow-sm ${u.active ? 'border-slate-200 bg-white text-rose-600 hover:border-rose-300 hover:bg-rose-50 dark:bg-slate-800 dark:border-slate-700 dark:text-rose-400 dark:hover:border-rose-700 dark:hover:bg-rose-900/40' : 'border-slate-200 bg-white text-emerald-600 hover:border-emerald-300 hover:bg-emerald-50 dark:bg-slate-800 dark:border-slate-700 dark:text-emerald-400 dark:hover:border-emerald-700 dark:hover:bg-emerald-900/40'}`}
                        >
                          <Power size={12} />
                          {u.active ? 'Suspend' : 'Activate'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs whitespace-nowrap">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 uppercase text-[10px] font-extrabold tracking-wider">
                    <tr>
                      <th className="px-5 py-4">Identity</th>
                      <th className="px-5 py-4">Access Role</th>
                      <th className="px-5 py-4">Status</th>
                      <th className="px-5 py-4">Security Metrics</th>
                      <th className="px-5 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {filteredUsers.map((u) => {
                      const actData = userActivityMap.get(u.id);
                      const isAdmin = u.role === 'Super Admin' || u.role === 'Admin';
                      return (
                        <tr key={u.id} className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group ${!u.active ? 'opacity-80 grayscale-[20%]' : ''}`}>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3.5">
                              <div className="relative">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shadow-inner transition-transform ${isAdmin ? 'bg-gradient-to-br from-indigo-100 to-indigo-200 dark:from-indigo-900/60 dark:to-indigo-800/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700' : 'bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'}`}>
                                  {u.name.charAt(0).toUpperCase()}
                                </div>
                                <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-[1.5px] border-white dark:border-slate-900 ${u.active ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                              </div>
                              <div>
                                <p className="font-bold text-slate-900 dark:text-white text-sm tracking-tight group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">{u.name}</p>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5 flex items-center gap-1.5"><Mail size={10} className="text-slate-400" />{u.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${isAdmin ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300 border-indigo-200 dark:border-indigo-500/20' : 'bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700 ring-1 ring-inset ring-slate-500/20'}`}>
                              <ShieldCheck size={12} />
                              {u.role}
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            {u.active ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30">
                                <CheckCircle2 size={12} /> Active
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30">
                                <Lock size={12} /> Suspended
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex flex-col text-[11px] gap-1">
                              <div className="flex items-center gap-2">
                                <span className="text-slate-500 font-medium w-16">Last Auth:</span>
                                <span className="text-slate-900 dark:text-slate-200 font-mono font-bold">
                                  {actData?.lastLogin ? actData.lastLogin.toLocaleDateString() : 'Never'}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-slate-500 font-medium w-16">Activity:</span>
                                <span className="text-slate-900 dark:text-slate-200 font-mono font-bold flex items-center gap-1">
                                  <Activity size={10} className="text-amber-500" />
                                  {actData?.actionCount || 0} events
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-right">
                            <div className="flex justify-end items-center gap-2">
                              {(currentUser.role === 'Super Admin' || currentUser.role === 'Admin') && u.id !== currentUser.id && (
                                <button
                                  onClick={() => toggleUserStatus(u)}
                                  className={`p-2 rounded-lg transition-colors border shadow-sm ${u.active ? 'border-slate-200 bg-white text-slate-400 hover:text-rose-600 hover:border-rose-300 hover:bg-rose-50 dark:bg-slate-800 dark:border-slate-700 dark:hover:border-rose-700 dark:hover:bg-rose-900/40' : 'border-slate-200 bg-white text-slate-400 hover:text-emerald-600 hover:border-emerald-300 hover:bg-emerald-50 dark:bg-slate-800 dark:border-slate-700 dark:hover:border-emerald-700 dark:hover:bg-emerald-900/40'}`}
                                  title={u.active ? "Suspend User" : "Activate User"}
                                >
                                  <Power size={14} />
                                </button>
                              )}
                              <button
                                onClick={() => openEditModal(u)}
                                className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-500/10 hover:border-amber-300 dark:hover:border-amber-700/50 rounded-lg transition-colors shadow-sm"
                                title="Modify Configuration"
                              >
                                <Edit2 size={14} />
                              </button>
                              {(currentUser.role === 'Super Admin' && u.id !== currentUser.id) && (
                                <button
                                  onClick={() => openDeleteModal(u)}
                                  className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:border-rose-300 dark:hover:border-rose-700/50 rounded-lg transition-colors shadow-sm"
                                  title="Obliterate Identity"
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )
        )}
      </div>

      {/* Unified Modal (Add / Edit) */}
      {(isAddModalOpen || isEditModalOpen) && (
        <div className="fixed inset-0 z-[60] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-bl-full pointer-events-none blur-xl"></div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2.5 uppercase tracking-wide relative z-10">
                {isAddModalOpen ? (
                  <>
                    <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-500">
                       <UserPlus size={16} />
                    </div>
                    Add New User
                  </>
                ) : (
                  <>
                     <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                       <Edit2 size={16} />
                    </div>
                    Modify Configuration
                  </>
                )}
              </h3>
              <button 
                onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors relative z-10 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm"
              >
                <X size={16} />
              </button>
            </div>
            
            <form id="unifiedUserForm" onSubmit={isAddModalOpen ? handleCreateUser : handleEditUser} className="p-6 overflow-y-auto space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Fingerprint size={12} />
                  Full Legal Name
                </label>
                <div className="relative group">
                  <Users size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-amber-500 transition-colors" />
                  <input 
                    type="text" required value={newUserName} onChange={e => setNewUserName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-700/60 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all dark:text-white"
                    placeholder="Enter full name"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Mail size={12} />
                  Corporate Email
                </label>
                <div className="relative group">
                  <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-amber-500 transition-colors" />
                  <input 
                    type="email" required value={newUserEmail} onChange={e => setNewUserEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-700/60 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all dark:text-white"
                    placeholder="employee@organization.com"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck size={12} />
                  RBAC Access Level
                </label>
                <div className="relative group">
                  <ShieldCheck size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-amber-500 transition-colors z-10" />
                  <select
                    value={newUserRole} onChange={e => setNewUserRole(e.target.value as UserRole)}
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-700/60 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all dark:text-white cursor-pointer appearance-none relative"
                    disabled={isEditModalOpen && currentUser.role !== 'Super Admin' && selectedUser?.id !== currentUser.id}
                  >
                    <option value="Super Admin">Super Admin</option>
                    <option value="Admin">Admin</option>
                    <option value="Manager">Manager</option>
                    <option value="Packing Staff">Packing Staff</option>
                    <option value="Sales Staff">Sales Staff</option>
                    <option value="Viewer">Viewer</option>
                  </select>
                  <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Key size={12} />
                  Authentication Password
                  {isEditModalOpen && <span className="lowercase font-normal ml-1 text-slate-400 tracking-normal">(Leave blank to keep unchanged)</span>}
                </label>
                <div className="relative group">
                  <Key size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-amber-500 transition-colors" />
                  <input 
                    type="password" required={!isEditModalOpen} value={newUserPassword} onChange={e => setNewUserPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-700/60 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all dark:text-white"
                    placeholder="••••••••••••"
                  />
                </div>
              </div>
            </form>

            <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-end gap-3">
              <button 
                type="button"
                onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }}
                className="px-5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
              >
                Abort
              </button>
              <button 
                type="submit"
                form="unifiedUserForm"
                className="px-6 py-2.5 bg-gradient-to-b from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 text-xs font-extrabold rounded-xl transition-all shadow-lg shadow-amber-500/20 flex items-center gap-2 border border-amber-300"
              >
                {isAddModalOpen ? 'Create User' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && selectedUser && (
        <div className="fixed inset-0 z-[60] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            <div className="p-8 flex flex-col items-center text-center space-y-5 relative overflow-hidden">
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-rose-500/10 rounded-full blur-3xl pointer-events-none"></div>
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-rose-50 dark:bg-rose-500/10 border-4 border-rose-100 dark:border-rose-500/20 flex items-center justify-center text-rose-600 dark:text-rose-500 relative z-10 shadow-inner">
                  <Trash2 size={32} />
                </div>
                 <div className="absolute inset-0 rounded-full border border-rose-500/30 animate-ping"></div>
              </div>
              <div className="relative z-10">
                <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Obliterate Identity</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2.5 leading-relaxed max-w-[260px] mx-auto">
                  You are about to permanently erase <strong className="text-rose-600 dark:text-rose-400 font-mono font-bold bg-rose-50 dark:bg-rose-900/30 px-1 rounded">{selectedUser.name}</strong> from the system directory. This action is irreversible.
                </p>
              </div>
            </div>
            <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex gap-3">
              <button 
                onClick={() => setIsDeleteModalOpen(false)}
                className="flex-1 px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
              >
                Retain Access
              </button>
              <button 
                onClick={confirmDeleteUser}
                className="flex-1 px-4 py-3 bg-gradient-to-b from-rose-500 to-rose-600 hover:from-rose-400 hover:to-rose-500 text-white text-xs font-extrabold rounded-xl transition-all shadow-lg shadow-rose-600/20 border border-rose-500"
              >
                Confirm Erase
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
