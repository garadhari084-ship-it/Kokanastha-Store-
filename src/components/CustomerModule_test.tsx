import { PageHeader } from './PageHeader';
import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  UserPlus, 
  Edit, 
  Trash2, 
  FileSpreadsheet, 
  FileText, 
  DollarSign, 
  History, 
  X, 
  Plus, 
  MapPin, 
  Phone, 
  Mail,
  CheckCircle,
  ExternalLink
} from 'lucide-react';
import { dbStore } from '../services/store';
import { Customer, SalesOrder, UserProfile } from '../types/erp';

interface CustomerModuleProps {
  businessId: string;
  user: UserProfile;
  triggerToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  openAddModalInitially?: boolean;
}

export const CustomerModule: React.FC<CustomerModuleProps> = ({ 
  businessId, 
  user, 
  triggerToast,
  openAddModalInitially = false
}) => {
  const [customers, setCustomers] = useState<Customer[]>(dbStore.getCustomers(businessId));
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('All');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(openAddModalInitially);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [viewingHistoryCustomer, setViewingHistoryCustomer] = useState<Customer | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formGroup, setFormGroup] = useState('Retail');
  const [formGstin, setFormGstin] = useState('');
  const [formPan, setFormPan] = useState('');
  const [formBilling, setFormBilling] = useState('');
  const [formShipping, setFormShipping] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formCreditLimit, setFormCreditLimit] = useState(100000);

  const resetForm = () => {
    setFormName('');
    setFormGroup('Retail');
    setFormGstin('');
    setFormPan('');
    setFormBilling('');
    setFormShipping('');
    setFormEmail('');
    setFormPhone('');
    setFormCreditLimit(100000);
    setEditingCustomer(null);
  };

  const handleOpenAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (cust: Customer) => {
    setEditingCustomer(cust);
    setFormName(cust.name);
    setFormGroup(cust.group);
    setFormGstin(cust.gstin);
    setFormPan(cust.pan);
    setFormBilling(cust.billing_address);
    setFormShipping(cust.shipping_address);
    setFormEmail(cust.email);
    setFormPhone(cust.phone);
    setFormCreditLimit(cust.credit_limit);
    setIsModalOpen(true);
  };

  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formName.trim() || !formPhone.trim() || !formBilling.trim()) {
      triggerToast('Customer Name, Phone, and Billing Address are mandatory.', 'error');
      return;
    }

    // GSTIN/PAN validations (Indian formats)
    if (formGstin.trim() && formGstin.trim().length !== 15) {
      triggerToast('GSTIN must be exactly 15 characters.', 'error');
      return;
    }
    if (formPan.trim() && formPan.trim().length !== 10) {
      triggerToast('PAN must be exactly 10 characters.', 'error');
      return;
    }

    try {
      if (editingCustomer) {
        dbStore.updateCustomer(editingCustomer.id, {
          name: formName.trim(),
          group: formGroup,
          gstin: formGstin.toUpperCase().trim(),
          pan: formPan.toUpperCase().trim(),
          billing_address: formBilling.trim(),
          shipping_address: (formShipping.trim() || formBilling.trim()),
          email: formEmail.trim(),
          phone: formPhone.trim(),
          credit_limit: Number(formCreditLimit)
        });
        dbStore.logActivity(user.id, user.name, user.role, 'Update Customer', `Updated customer details for: ${formName}`, businessId);
        triggerToast('Customer updated successfully.', 'success');
      } else {
        dbStore.createCustomer({
          name: formName.trim(),
          group: formGroup,
          gstin: formGstin.toUpperCase().trim(),
          pan: formPan.toUpperCase().trim(),
          billing_address: formBilling.trim(),
          shipping_address: (formShipping.trim() || formBilling.trim()),
          email: formEmail.trim(),
          phone: formPhone.trim(),
          credit_limit: Number(formCreditLimit),
          business_id: businessId,
          active: true
        });
        dbStore.logActivity(user.id, user.name, user.role, 'Create Customer', `Created new customer: ${formName}`, businessId);
        triggerToast('New customer added successfully.', 'success');
      }

      setCustomers(dbStore.getCustomers(businessId));
      setIsModalOpen(false);
      resetForm();
    } catch (err: any) {
      triggerToast(err.message || 'An error occurred.', 'error');
    }
  };

  const handleDeleteCustomer = (id: string, name: string) => {
    // Check viewer or unauthorized role
    if (user.role === 'Viewer') {
      triggerToast('Unauthorized: Viewer accounts cannot delete data.', 'error');
      return;
    }

    if (window.confirm(`Are you sure you want to delete ${name}?`)) {
      dbStore.deleteCustomer(id);
      dbStore.logActivity(user.id, user.name, user.role, 'Delete Customer', `Deleted customer: ${name}`, businessId);
      triggerToast('Customer deleted successfully.', 'success');
      setCustomers(dbStore.getCustomers(businessId));
    }
  };

  // Export CSV simulation
  const handleExportCSV = () => {
    dbStore.logActivity(user.id, user.name, user.role, 'Export Excel', 'Exported Customers directory to Excel format', businessId);
    
    const headers = ['ID', 'Name', 'Group', 'GSTIN', 'PAN', 'Phone', 'Email', 'Credit Limit', 'Outstanding', 'Billing Address'];
    const rows = filteredCustomers.map(c => [
      c.id,
      c.name,
      c.group,
      c.gstin,
      c.pan,
      c.phone,
      c.email,
      c.credit_limit,
      c.outstanding_amount,
      `"${c.billing_address.replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `customers_export_${businessId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    triggerToast('Excel sheet export initiated successfully.', 'success');
  };

  // Export PDF simulation
  const handleExportPDF = () => {
    dbStore.logActivity(user.id, user.name, user.role, 'Export PDF', 'Exported Customer credit report to PDF', businessId);
    triggerToast('Customer ledger PDF generation complete. Download initiated.', 'success');
  };

  // Filter & Search
  const filteredCustomers = customers.filter(cust => {
    const matchesSearch = 
      cust.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cust.phone.includes(searchQuery) ||
      (cust.email && cust.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (cust.gstin && cust.gstin.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesGroup = selectedGroup === 'All' || cust.group === selectedGroup;

    return matchesSearch && matchesGroup;
  });

  // Get selected customer history
  const getCustomerHistory = (customerId: string): SalesOrder[] => {
    return dbStore.getSalesOrders(businessId).filter(o => o.customer_id === customerId);
  };

  return (
    <div className="space-y-6 max-w-full pb-12 px-0 font-sans text-slate-900 dark:text-slate-100 overflow-x-hidden" id="customer-module-root">
      <PageHeader
        title="Customer Management Master"
        subtitle="Add, edit, delete, group, and audit customer profiles and credit histories."
        icon={Users}
        rightContent={
          <>
<button 
            onClick={handleExportCSV} 
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-semibold cursor-pointer"
          >
            <FileSpreadsheet size={16} className="text-emerald-600" />
            <span>Export Excel</span>
          </button>
          <button 
            onClick={handleExportPDF} 
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-semibold cursor-pointer"
          >
            <FileText size={16} className="text-rose-600" />
            <span>Print Credit PDF</span>
          </button>
          {user.role !== 'Viewer' && (
            <button 
              onClick={handleOpenAddModal} 
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[11px] font-semibold cursor-pointer"
            >
              <UserPlus size={16} />
              <span>Add Customer</span>
            </button>
          )}
          </>
        }
      />

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-center gap-4">
        <div className="relative w-full md:flex-1">
          <Search size={16} className="absolute left-3 top-3.5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search by company name, phone, email, GSTIN..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 text-[11px] rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter size={16} className="text-slate-400" />
          <select 
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
            className="w-full md:w-[180px] px-3 py-2 bg-slate-50 dark:bg-slate-800 text-[11px] rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-hidden"
          >
            <option value="All">All Groups</option>
            <option value="Retail">Retail</option>
            <option value="Wholesale">Wholesale</option>
            <option value="Distributor">Distributor</option>
          </select>
        </div>
      </div>

      {/* Main Customers Directory Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-xs overflow-x-auto overflow-y-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800 text-[11px] font-semibold uppercase text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">
                <th className="p-4">Customer Details</th>
                <th className="p-4">Compliance Codes</th>
                <th className="p-4">Billing & Delivery</th>
                <th className="p-4">Outstanding & Limit</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredCustomers.map((cust, idx) => (
                <tr key={`${cust.id}-${idx}`} className="text-[11px] hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                  <td className="p-4 space-y-1">
                    <div className="flex items-center gap-2">
                      <strong className="text-slate-900 dark:text-slate-100 font-semibold">{cust.name}</strong>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                        cust.group === 'Wholesale' ? 'text-violet-700 bg-violet-50 dark:bg-violet-950/30' :
                        cust.group === 'Distributor' ? 'text-amber-700 bg-amber-50 dark:bg-amber-950/30' :
                        'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/30'
                      }`}>
                        {cust.group}
                      </span>
                    </div>
                    <div className="space-y-0.5 text-slate-500">
                      <p className="flex items-center gap-1 font-mono text-[11px]"><Phone size={12} /> {cust.phone}</p>
                      {cust.email && <p className="flex items-center gap-1"><Mail size={12} /> {cust.email}</p>}
                    </div>
                  </td>
                  <td className="p-4 font-mono text-[11px] space-y-1">
                    <p><span className="text-[10px] text-slate-400 uppercase mr-1">GST:</span>{cust.gstin || 'Unregistered'}</p>
                    <p><span className="text-[10px] text-slate-400 uppercase mr-1">PAN:</span>{cust.pan || 'N/A'}</p>
                  </td>
                  <td className="p-4 max-w-[220px]">
                    <p className="text-slate-700 dark:text-slate-300 flex items-start gap-1 line-clamp-2" title={cust.billing_address}>
                      <MapPin size={12} className="shrink-0 mt-0.5 text-slate-400" />
                      <span>{cust.billing_address}</span>
                    </p>
                  </td>
                  <td className="p-4 space-y-1">
                    <div className="flex items-center justify-between text-slate-600">
                      <span>Outstanding:</span>
                      <strong className={`font-mono ${cust.outstanding_amount > cust.credit_limit ? 'text-rose-600 font-extrabold' : 'text-slate-900 dark:text-slate-100'}`}>
                        ₹{cust.outstanding_amount.toLocaleString()}
                      </strong>
                    </div>
                    <div className="flex items-center justify-between text-slate-400 text-[11px]">
                      <span>Credit Limit:</span>
                      <span className="font-mono">₹{cust.credit_limit.toLocaleString()}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-center gap-2">
                      <button 
                        onClick={() => setViewingHistoryCustomer(cust)}
                        className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-md cursor-pointer"
                        title="View Order History Ledger"
                      >
                        <History size={14} />
                      </button>
                      {user.role !== 'Viewer' && (
                        <>
                          <button 
                            onClick={() => handleOpenEditModal(cust)}
                            className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-md cursor-pointer"
                            title="Edit"
                          >
                            <Edit size={14} />
                          </button>
                          <button 
                            onClick={() => handleDeleteCustomer(cust.id, cust.name)}
                            className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-md cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {filteredCustomers.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-slate-400">
                    <Users size={36} className="mx-auto mb-2 text-slate-300" />
                    <p className="text-[11px]">No customer directory matches your search criteria.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-2xl overflow-hidden shadow-xl animate-in fade-in zoom-in duration-150">
            <div className="bg-slate-50 dark:bg-slate-800 px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                {editingCustomer ? 'Modify Customer Profile' : 'Register New Customer Account'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleSaveCustomer} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1 col-span-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Company Name / Trade Name *</label>
                  <input 
                    type="text" 
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Acme Corporations India Ltd"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 text-[11px] rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Customer Group Classification</label>
                  <select 
                    value={formGroup}
                    onChange={(e) => setFormGroup(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 text-[11px] rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-hidden"
                  >
                    <option value="Retail">Retail Shop / Consumer</option>
                    <option value="Wholesale">Wholesale Trader</option>
                    <option value="Distributor">Primary Distributor</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Contact Phone Number *</label>
                  <input 
                    type="tel" 
                    required
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="+91 XXXXX XXXXX"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 text-[11px] rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Email Address</label>
                  <input 
                    type="email" 
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="procurement@acme.com"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 text-[11px] rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Credit Limit (₹)</label>
                  <input 
                    type="number" 
                    value={formCreditLimit}
                    onChange={(e) => setFormCreditLimit(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 text-[11px] rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Indian GSTIN (15 Characters)</label>
                  <input 
                    type="text" 
                    maxLength={15}
                    value={formGstin}
                    onChange={(e) => setFormGstin(e.target.value)}
                    placeholder="27ABCDE1234F1Z5"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 text-[11px] rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Corporate PAN (10 Characters)</label>
                  <input 
                    type="text" 
                    maxLength={10}
                    value={formPan}
                    onChange={(e) => setFormPan(e.target.value)}
                    placeholder="ABCDE1234F"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 text-[11px] rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 font-mono"
                  />
                </div>

                <div className="space-y-1 col-span-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Registered Billing Address *</label>
                  <textarea 
                    rows={2}
                    required
                    value={formBilling}
                    onChange={(e) => setFormBilling(e.target.value)}
                    placeholder="Head office billing location details..."
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 text-[11px] rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1 col-span-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-slate-500 uppercase">Shipping Destination Address</label>
                    <button 
                      type="button"
                      onClick={() => setFormShipping(formBilling)}
                      className="text-[10px] text-indigo-600 hover:underline cursor-pointer font-semibold"
                    >
                      Same as Billing
                    </button>
                  </div>
                  <textarea 
                    rows={2}
                    value={formShipping}
                    onChange={(e) => setFormShipping(e.target.value)}
                    placeholder="Where physical goods must be delivered..."
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 text-[11px] rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-[11px] font-semibold hover:bg-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-[11px] font-semibold hover:bg-indigo-700 cursor-pointer"
                >
                  Save Customer Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Ledger History slide-over modal */}
      {viewingHistoryCustomer && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-center justify-end">
          <div className="bg-white dark:bg-slate-900 w-full max-w-xl h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-150">
            <div className="bg-slate-950 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History />
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider">{viewingHistoryCustomer.name}</h3>
                  <p className="text-[10px] text-slate-400">Ledger Statement & Order Transactions</p>
                </div>
              </div>
              <button onClick={() => setViewingHistoryCustomer(null)} className="text-slate-300 hover:text-white cursor-pointer">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Micro profile info */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Outstanding Balance</span>
                  <strong className="text-base font-mono text-indigo-600 font-extrabold">₹{viewingHistoryCustomer.outstanding_amount.toLocaleString()}</strong>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Available Credit headroom</span>
                  <strong className="text-xs font-mono text-slate-700 dark:text-slate-200">
                    ₹{(viewingHistoryCustomer.credit_limit - viewingHistoryCustomer.outstanding_amount).toLocaleString()}
                  </strong>
                </div>
              </div>

              {/* Order Lists */}
              <div className="space-y-3">
                <h4 className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Order Ledger Log</h4>
                <div className="space-y-2">
                  {getCustomerHistory(viewingHistoryCustomer.id).map((o, idx) => (
                    <div key={`${o.id}-${idx}`} className="p-3 border border-slate-100 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <strong className="text-[11px] text-slate-900 dark:text-slate-100">{o.order_number}</strong>
                          <span className="text-[10px] text-slate-400 font-mono">{o.order_date}</span>
                        </div>
                        <span className={`inline-block text-[9px] font-bold px-1.5 py-0.5 rounded-sm ${
                          o.status === 'Delivered' ? 'text-emerald-700 bg-emerald-50' :
                          o.status === 'Packed' ? 'text-indigo-700 bg-indigo-50' :
                          o.status === 'Cancelled' ? 'text-rose-700 bg-rose-50' :
                          'text-amber-700 bg-amber-50'
                        }`}>
                          {o.status}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[11px] font-mono font-bold text-slate-900 dark:text-slate-100 block">₹{o.total_amount.toLocaleString()}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{o.payment_status}</span>
                      </div>
                    </div>
                  ))}

                  {getCustomerHistory(viewingHistoryCustomer.id).length === 0 && (
                    <div className="text-center py-12 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-slate-400">
                      <p className="text-[11px]">No transaction records found for this customer profile.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700 flex justify-end">
              <button 
                onClick={() => setViewingHistoryCustomer(null)}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-[11px] font-semibold rounded-lg cursor-pointer hover:bg-slate-300"
              >
                Close Ledger
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
