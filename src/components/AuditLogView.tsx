import { PageHeader } from './PageHeader';
import React, { useState } from 'react';
import { ShieldAlert, Search, RefreshCw, Calendar, UserCheck } from 'lucide-react';
import { dbStore } from '../services/store';
import { SystemAuditLog } from '../types/erp';

interface AuditLogViewProps {
  businessId: string;
}

export const AuditLogView: React.FC<AuditLogViewProps> = ({ businessId }) => {
  const [logs, setLogs] = useState<SystemAuditLog[]>(dbStore.getSystemAuditLogs(businessId));
  const [searchQuery, setSearchQuery] = useState('');

  const handleRefresh = () => {
    setLogs(dbStore.getSystemAuditLogs(businessId));
  };

  const filteredLogs = logs.filter(l => 
    l.user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-full pb-12 px-0 font-sans text-slate-900 dark:text-slate-100 overflow-x-hidden" id="audit-log-view-root">
      <PageHeader
        title="Security Compliance & Audit Trails"
        subtitle="Immutable chronological timeline of all warehouse activities, login sessions, and stock mutations."
        icon={ShieldAlert}
        rightContent={
          <>
<button 
          onClick={handleRefresh}
          className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-semibold cursor-pointer"
        >
          <RefreshCw size={14} />
          <span>Refresh Feed</span>
        </button>
          </>
        }
      />

      {/* Filter and stats */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-[350px]">
          <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search audit trail by actor, action or event keyword..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 text-[11px] rounded-lg border focus:outline-hidden"
          />
        </div>

        <div className="text-[11px] font-mono text-slate-400">
          Tracking <strong className="text-slate-700 dark:text-slate-200">{filteredLogs.length}</strong> system operations
        </div>
      </div>

      {/* Timeline list */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-xs overflow-x-auto overflow-y-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800 text-[10px] font-bold uppercase text-slate-400 border-b">
                <th className="p-4">Timestamp</th>
                <th className="p-4">Operator</th>
                <th className="p-4">Access Level</th>
                <th className="p-4">Operation Trigger</th>
                <th className="p-4">Change Log Details</th>
              </tr>
            </thead>
            <tbody className="divide-y text-[11px] text-slate-700 dark:text-slate-300">
              {filteredLogs.map((log, idx) => (
                <tr key={`${log.id}-${idx}`} className="hover:bg-slate-50/50">
                  <td className="p-4 font-mono text-[10px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <Calendar size={12} />
                      {new Date(log.created_at).toLocaleString()}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="flex items-center gap-1 font-semibold text-slate-900 dark:text-white">
                      <UserCheck size={12} className="text-slate-400" />
                      {log.user_name}
                    </span>
                  </td>
                  <td className="p-4 font-mono text-[11px]">
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                      log.role === 'Super Admin' ? 'bg-purple-100 text-purple-700' :
                      log.role === 'Admin' ? 'bg-indigo-100 text-indigo-700' :
                      log.role === 'Manager' ? 'bg-blue-100 text-blue-700' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {log.role}
                    </span>
                  </td>
                  <td className="p-4 font-bold text-slate-800 dark:text-slate-200">
                    {log.action}
                  </td>
                  <td className="p-4 font-mono text-slate-500 italic max-w-sm truncate" title={log.details}>
                    {log.details}
                  </td>
                </tr>
              ))}

              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-slate-400 font-sans">
                    No matching activity log footprints found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
