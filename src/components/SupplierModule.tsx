import { PageHeader } from './PageHeader';
import React, { useEffect, useState } from 'react';
import { 
  Truck, 
  Search, 
  PlusCircle, 
  Edit, 
  Trash2, 
  X, 
  Phone, 
  Mail, 
  MapPin,
  ClipboardList
} from 'lucide-react';
import { dbStore } from '../services/store';
import { Supplier, UserProfile } from '../types/erp';

interface SupplierModuleProps {
  businessId: string;
  user: UserProfile;
  triggerToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const SupplierModule: React.FC<SupplierModuleProps> = ({ 
  businessId, 
  user, 
  triggerToast 
}) => {
  const [suppliers, setSuppliers] = useState<Supplier[]>(dbStore.getSuppliers(businessId));
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formGstin, setFormGstin] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formAddress, setFormAddress] = useState('');

  const resetForm = () => {
    setFormName('');
    setFormGstin('');
    setFormPhone('');
    setFormEmail('');
    setFormAddress('');
    setEditingSupplier(null);
  };
  useEffect(() => {
    return dbStore.subscribe(() => {
      setSuppliers(dbStore.getSuppliers(businessId));
    });
  }, [businessId]);


  const handleOpenAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (sup: Supplier) => {
    setEditingSupplier(sup);
    setFormName(sup.name);
    setFormGstin(sup.gstin || '');
    setFormPhone(sup.phone);
    setFormEmail(sup.email || '');
    setFormAddress(sup.address);
    setIsModalOpen(true);
  };

  const handleSaveSupplier = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formName.trim() || !formPhone.trim() || !formAddress.trim()) {
      triggerToast('Supplier Name, Phone, and Address are required.', 'error');
      return;
    }

    try {
      if (editingSupplier) {
        dbStore.updateSupplier(editingSupplier.id, {
          name: formName.trim(),
          gstin: formGstin.toUpperCase().trim(),
          phone: formPhone.trim(),
          email: formEmail.trim(),
          address: formAddress.trim()
        });
        dbStore.logActivity(user.id, user.name, user.role, 'Update Supplier', `Updated supplier details for ${formName}`, businessId);
        triggerToast('Supplier updated successfully.', 'success');
      } else {
        dbStore.createSupplier({
          name: formName.trim(),
          gstin: formGstin.toUpperCase().trim(),
          phone: formPhone.trim(),
          email: formEmail.trim(),
          address: formAddress.trim(),
          business_id: businessId
        });
        dbStore.logActivity(user.id, user.name, user.role, 'Create Supplier', `Created new supplier profile: ${formName}`, businessId);
        triggerToast('Supplier registered successfully.', 'success');
      }

      setSuppliers(dbStore.getSuppliers(businessId));
      setIsModalOpen(false);
      resetForm();
    } catch (err: any) {
      triggerToast(err.message || 'Error occurred.', 'error');
    }
  };

  const handleDeleteSupplier = (id: string, name: string) => {
    if (user.role === 'Viewer') {
      triggerToast('Unauthorized: Viewers cannot alter vendor accounts.', 'error');
      return;
    }

    if (window.confirm(`Are you sure you want to delete Vendor profile: "${name}"?`)) {
      dbStore.deleteSupplier(id);
      dbStore.logActivity(user.id, user.name, user.role, 'Delete Supplier', `Deleted vendor: ${name}`, businessId);
      triggerToast('Supplier deleted.', 'success');
      setSuppliers(dbStore.getSuppliers(businessId));
    }
  };

  const filteredSuppliers = suppliers.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.phone.includes(searchQuery) ||
    (s.gstin && s.gstin.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6 max-w-full pb-12 px-0 font-sans text-slate-900 dark:text-slate-100 overflow-x-hidden" id="supplier-module-root">
      <PageHeader
        title="Supplier & Vendor Master Directory"
        subtitle="Record suppliers, tax registration numbers, and pending trade payables."
        icon={Truck}
        rightContent={
          <>
{user.role !== 'Viewer' && (
          <button 
            onClick={handleOpenAddModal} 
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[11px] font-semibold cursor-pointer"
          >
            <PlusCircle size={16} />
            <span>Register Vendor</span>
          </button>
        )}
          </>
        }
      />

      <div className="px-0.5 sm:px-1 space-y-6">
      {/* Filters */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 shadow-xs flex items-center gap-3">
        <Search size={16} className="text-slate-400" />
        <input 
          type="text" 
          placeholder="Search vendors by name, telephone, GSTIN..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-transparent text-[11px] outline-hidden text-slate-800 dark:text-slate-100"
        />
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-xs overflow-x-auto overflow-y-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800 text-[11px] font-semibold uppercase text-slate-500 border-b border-slate-100 dark:border-slate-800">
              <th className="p-4">Vendor Details</th>
              <th className="p-4">GST Identification</th>
              <th className="p-4">Warehouse Address</th>
              <th className="p-4">Outstanding Balances</th>
              <th className="p-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-[11px]">
            {filteredSuppliers.map((sup, idx) => (
              <tr key={`${sup.id}-${idx}`} className="hover:bg-slate-50/50 text-slate-700 dark:text-slate-300">
                <td className="p-4 space-y-1">
                  <strong className="text-slate-900 dark:text-white font-semibold block">{sup.name}</strong>
                  <div className="space-y-0.5 text-slate-500 text-[11px] font-mono">
                    <p className="flex items-center gap-1"><Phone size={12} /> {sup.phone}</p>
                    {sup.email && <p className="flex items-center gap-1"><Mail size={12} /> {sup.email}</p>}
                  </div>
                </td>
                <td className="p-4 font-mono text-[11px]">
                  {sup.gstin || 'Unregistered'}
                </td>
                <td className="p-4 max-w-[200px] truncate" title={sup.address}>
                  <p className="flex items-start gap-1">
                    <MapPin size={12} className="shrink-0 mt-0.5 text-slate-400" />
                    <span>{sup.address}</span>
                  </p>
                </td>
                <td className="p-4 font-mono font-bold text-slate-900 dark:text-white">
                  ₹{sup.outstanding_amount.toLocaleString()}
                </td>
                <td className="p-4 text-center">
                  <div className="flex justify-center gap-2">
                    {user.role !== 'Viewer' && (
                      <>
                        <button onClick={() => handleOpenEditModal(sup)} className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg cursor-pointer"><Edit size={14} /></button>
                        <button onClick={() => handleDeleteSupplier(sup.id, sup.name)} className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg cursor-pointer"><Trash2 size={14} /></button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filteredSuppliers.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-10 text-slate-400">No vendor profiles registered yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      </div>

      {/* Modal form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-xl animate-in zoom-in duration-150 overflow-hidden">
            <div className="bg-slate-50 dark:bg-slate-800 px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between shrink-0">
              <h2 className="text-[11px] font-bold uppercase tracking-wider">{editingSupplier ? 'Modify Vendor Account' : 'Register Vendor Account'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer"><X size={18} /></button>
            </div>
            <form onSubmit={handleSaveSupplier} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div className="space-y-1 col-span-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase">Vendor/Trade Name *</label>
                <input 
                  type="text" 
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Maharashtra Agro Milk Cooperative"
                  className="w-full px-3 py-2 bg-slate-50 text-[11px] rounded-lg border focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Phone Number *</label>
                  <input 
                    type="tel" 
                    required
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="+91 XXXXX XXXXX"
                    className="w-full px-3 py-2 bg-slate-50 text-[11px] rounded-lg border focus:ring-1"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Email Address</label>
                  <input 
                    type="email" 
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="sales@vendor.com"
                    className="w-full px-3 py-2 bg-slate-50 text-[11px] rounded-lg border focus:ring-1"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase">Indian GSTIN (15 characters)</label>
                <input 
                  type="text" 
                  maxLength={15}
                  value={formGstin}
                  onChange={(e) => setFormGstin(e.target.value)}
                  placeholder="27MAMCO9988G1ZE"
                  className="w-full px-3 py-2 bg-slate-50 text-[11px] rounded-lg border focus:ring-1 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase">Corporate Warehouse Address *</label>
                <textarea 
                  rows={2}
                  required
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  placeholder="Full physical billing and delivery location of supplier..."
                  className="w-full px-3 py-2 bg-slate-50 text-[11px] rounded-lg border focus:ring-1"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-[11px] font-semibold hover:bg-slate-200">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-[11px] font-semibold hover:bg-indigo-700">Save Vendor</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
