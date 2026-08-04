import React, { useState } from 'react';
import { CustomerModule } from './CustomerModule';
import { PartiesModule } from './PartiesModule';
import { LoyaltySubscriptionModule } from './LoyaltySubscriptionModule';
import { UserProfile } from '../types/erp';
import { Users, History, Award } from 'lucide-react';

interface PartiesLayoutProps {
  businessId: string;
  user: UserProfile;
  triggerToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const PartiesLayout: React.FC<PartiesLayoutProps> = ({ businessId, user, triggerToast }) => {
  const [activeTab, setActiveTab] = useState<'details' | 'history' | 'loyalty'>('details');

  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-2 gap-2 shrink-0">
        <button
          onClick={() => setActiveTab('details')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-colors \${
            activeTab === 'details' 
              ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' 
              : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800'
          }`}
        >
          <Users size={16} /> Party Details
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-colors \${
            activeTab === 'history' 
              ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' 
              : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800'
          }`}
        >
          <History size={16} /> Customer History & Record
        </button>
        <button
          onClick={() => setActiveTab('loyalty')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-colors \${
            activeTab === 'loyalty' 
              ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' 
              : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800'
          }`}
        >
          <Award size={16} /> Loyalty & Subscriptions
        </button>
      </div>

      <div className="flex-1 overflow-auto p-4 md:p-6 bg-slate-50 dark:bg-slate-950">
        {activeTab === 'details' && <CustomerModule businessId={businessId} user={user} triggerToast={triggerToast} />}
        {activeTab === 'history' && <PartiesModule businessId={businessId} user={user} triggerToast={triggerToast} />}
        {activeTab === 'loyalty' && <LoyaltySubscriptionModule businessId={businessId} user={user} triggerToast={triggerToast} />}
      </div>
    </div>
  );
};
