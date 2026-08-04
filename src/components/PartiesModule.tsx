import React, { useState } from 'react';
import { Customer, SalesOrder, UserProfile } from '../types/erp';
import { dbStore } from '../services/store';
import { Search, Plus, User, FileText, Phone, MapPin, Receipt, History } from 'lucide-react';
import { PageHeader } from './PageHeader';

interface PartiesModuleProps {
  businessId: string;
  user: UserProfile;
  triggerToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const PartiesModule: React.FC<PartiesModuleProps> = ({ businessId, user, triggerToast }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  const customers = dbStore.getCustomers(businessId);
  
  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone.includes(searchQuery)
  );

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);
  const customerHistory = selectedCustomer ? dbStore.getSalesOrders(businessId).filter(o => o.customer_id === selectedCustomer.id) : [];

  return (
    <div className="space-y-4 max-w-full pb-8 font-sans text-slate-900 dark:text-slate-100 overflow-x-hidden h-full flex flex-col">
      <PageHeader 
        title="Parties / Customer History" 
        subtitle="Manage customer history, transactions, and balances."
        icon={History}
      >
        <div className="flex gap-2 hidden md:flex">
          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-[10px] font-bold border border-rose-200 transition-colors">
            <Plus size={12} /> Add Sale
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg text-[10px] font-bold border border-indigo-200 transition-colors">
            <Plus size={12} /> Add Purchase
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[10px] font-bold shadow-sm transition-colors">
            <Plus size={12} /> Add Party
          </button>
        </div>
      </PageHeader>

      <div className="flex flex-col md:flex-row gap-4 h-[calc(100vh-180px)]">
        {/* Left Pane - Parties List */}
        <div className="w-full md:w-1/3 lg:w-1/4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden shrink-0">
          <div className="p-3 border-b border-slate-200 dark:border-slate-800">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input 
                type="text"
                placeholder="Search parties..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 text-[11px] rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none"
              />
            </div>
          </div>
          <div className="flex bg-slate-50 dark:bg-slate-800 p-2 text-[10px] font-bold text-slate-500 uppercase border-b border-slate-200 dark:border-slate-800">
            <div className="flex-1">Party Name</div>
            <div className="w-20 text-right">Amount</div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {filteredCustomers.map(cust => (
              <div 
                key={cust.id} 
                onClick={() => setSelectedCustomerId(cust.id)}
                className={`flex p-3 border-b border-slate-100 dark:border-slate-800/50 cursor-pointer transition-colors ${selectedCustomerId === cust.id ? 'bg-indigo-50 dark:bg-indigo-900/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
              >
                <div className="flex-1 flex flex-col">
                  <span className="text-[11px] font-bold">{cust.name}</span>
                  <span className="text-[9px] text-slate-500">{cust.phone}</span>
                </div>
                <div className="w-24 text-right flex flex-col justify-center">
                  <span className={`text-[11px] font-black ${cust.outstanding_amount > 0 ? 'text-rose-600' : 'text-slate-700 dark:text-slate-300'}`}>
                    ₹{cust.outstanding_amount.toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Pane - Details & Transactions */}
        <div className="flex-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
          {selectedCustomer ? (
            <>
              {/* Header Details */}
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex flex-col gap-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    {selectedCustomer.image_url ? (
                      <img src={selectedCustomer.image_url} alt={selectedCustomer.name} className="w-12 h-12 rounded-full object-cover shrink-0 border border-slate-200" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500 shrink-0">
                        <User size={20} />
                      </div>
                    )}
                    <div>
                      <h2 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                        {selectedCustomer.name}
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                          {selectedCustomer.group}
                        </span>
                      </h2>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-4 text-[11px] text-slate-600 dark:text-slate-400">
                  <div className="flex items-center gap-1.5"><Phone size={12} /> {selectedCustomer.phone}</div>
                  <div className="flex items-center gap-1.5"><MapPin size={12} /> {selectedCustomer.billing_address || 'No Address'}</div>
                  <div className="flex items-center gap-1.5"><Receipt size={12} /> GSTIN: {selectedCustomer.gstin || 'N/A'}</div>
                </div>
              </div>

              {/* Transactions Table */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Transactions
              </div>
              <div className="flex-1 overflow-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 bg-slate-100 dark:bg-slate-800 z-10 text-[10px] text-slate-500 shadow-sm">
                    <tr>
                      <th className="py-2.5 px-4 font-bold">Type</th>
                      <th className="py-2.5 px-4 font-bold">Number</th>
                      <th className="py-2.5 px-4 font-bold">Date</th>
                      <th className="py-2.5 px-4 font-bold">Total</th>
                      <th className="py-2.5 px-4 font-bold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50 text-[11px]">
                    {customerHistory.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-500">No transactions recorded yet.</td>
                      </tr>
                    ) : (
                      customerHistory.map((order, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                          <td className="py-2.5 px-4">
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-slate-100 text-slate-700 border border-slate-200">
                              Sale
                            </span>
                          </td>
                          <td className="py-2.5 px-4 font-mono font-bold text-sky-600">{order.order_number}</td>
                          <td className="py-2.5 px-4 text-slate-600 dark:text-slate-400">{order.order_date}</td>
                          <td className="py-2.5 px-4 font-black">₹{order.total_amount.toLocaleString()}</td>
                          <td className="py-2.5 px-4">
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                              order.status === 'Pending' ? 'bg-slate-100 text-slate-600' :
                              order.status === 'Packing' || order.status === 'Packed' ? 'bg-sky-100 text-sky-700' :
                              order.status === 'Dispatched' ? 'bg-indigo-100 text-indigo-700' :
                              order.status === 'Delivered' ? 'bg-emerald-100 text-emerald-700' :
                              'bg-rose-100 text-rose-700'
                            }`}>
                              {order.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
              <User size={48} className="mb-4 opacity-20" />
              <p className="text-sm font-bold">Select a party to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
