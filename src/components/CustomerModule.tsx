import { PageHeader } from './PageHeader';
import React, { useEffect, useState } from 'react';
import { 
  Users, Search, Filter, UserPlus, Edit, Trash2, FileSpreadsheet, FileText, DollarSign, History, X, Plus, MapPin, Phone, Mail, CheckCircle, ExternalLink, ShieldAlert, Building, SearchX
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
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
  const [formArea, setFormArea] = useState('');
  const [formGstin, setFormGstin] = useState('');
  const [formPan, setFormPan] = useState('');
  const [formBilling, setFormBilling] = useState('');
  const [formShipping, setFormShipping] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formCreditLimit, setFormCreditLimit] = useState<number>(0);
  
  // Custom Area additions
  const [isAddingArea, setIsAddingArea] = useState(false);
  const [newArea, setNewArea] = useState('');

  useEffect(() => {
    return dbStore.subscribe(() => {
      setCustomers(dbStore.getCustomers(businessId));
    });
  }, [businessId]);

  const handleOpenAddModal = () => {
    setFormName('');
    setFormGroup('Retail');
    setFormArea('');
    setFormGstin('');
    setFormPan('');
    setFormBilling('');
    setFormShipping('');
    setFormEmail('');
    setFormPhone('');
    setFormCreditLimit(0);
    
    setEditingCustomer(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (cust: Customer) => {
    setEditingCustomer(cust);
    setFormName(cust.name);
    setFormGroup(cust.group);
    setFormArea(cust.area || '');
    setFormGstin(cust.gstin || '');
    setFormPan(cust.pan || '');
    setFormBilling(cust.billing_address);
    setFormShipping(cust.shipping_address);
    setFormEmail(cust.email || '');
    setFormPhone(cust.phone);
    setFormCreditLimit(cust.credit_limit);
    setIsModalOpen(true);
  };

  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formPhone.trim() || !formBilling.trim()) return;

    const cleanPhone = formPhone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      triggerToast('Mobile number must be exactly 10 digits.', 'error');
      return;
    }

    try {
      if (editingCustomer) {
        dbStore.updateCustomer(editingCustomer.id, {
          name: formName.trim(),
          group: formGroup,
          area: formArea,
          gstin: formGstin.toUpperCase(),
          pan: formPan.toUpperCase(),
          billing_address: formBilling,
          shipping_address: formShipping,
          email: formEmail,
          phone: cleanPhone,
          credit_limit: formCreditLimit
        });
        dbStore.logActivity(user.id, user.name, user.role, 'Update Customer', `Updated customer profile: ${formName}`, businessId);
        triggerToast('Customer updated successfully.', 'success');
      } else {
        dbStore.createCustomer({
          name: formName.trim(),
          group: formGroup,
          area: formArea,
          gstin: formGstin.toUpperCase(),
          pan: formPan.toUpperCase(),
          billing_address: formBilling,
          shipping_address: formShipping,
          email: formEmail,
          phone: cleanPhone,
          credit_limit: formCreditLimit,
          business_id: businessId,
          active: true,
          
        });
        dbStore.logActivity(user.id, user.name, user.role, 'Create Customer', `Registered new customer: ${formName}`, businessId);
        triggerToast('Customer created successfully.', 'success');
      }
      setIsModalOpen(false);
      setCustomers(dbStore.getCustomers(businessId));
    } catch (e: any) {
      triggerToast(e.message || 'An error occurred.', 'error');
    }
  };

  const handleDeleteCustomer = (id: string, name: string) => {
    if (user.role === 'Viewer') {
      triggerToast('Unauthorized to perform deletion.', 'error');
      return;
    }

    // Check if customer has outstanding balance
    const cust = customers.find(c => c.id === id);
    if (cust && cust.outstanding_amount > 0) {
      triggerToast(`Cannot delete: Customer has an outstanding balance of Rs. ${cust.outstanding_amount}`, 'error');
      return;
    }

    if (window.confirm(`Are you sure you want to delete customer "${name}"? This action cannot be undone.`)) {
      try {
        dbStore.deleteCustomer(id);
        dbStore.logActivity(user.id, user.name, user.role, 'Delete Customer', `Deleted customer: ${name}`, businessId);
        triggerToast('Customer removed from master.', 'success');
        setCustomers(dbStore.getCustomers(businessId));
      } catch (e: any) {
         triggerToast(e.message || 'Failed to delete customer', 'error');
      }
    }
  };

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

  const handleExportPDF = () => {
    dbStore.logActivity(user.id, user.name, user.role, 'Export PDF', 'Exported Customer credit report to PDF', businessId);
    
    try {
      const doc = new jsPDF();
      
      doc.setFontSize(18);
      doc.setTextColor(30, 41, 59);
      doc.text('Customer Credit Management Report', 14, 22);
      
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);
      doc.text(`Business ID: ${businessId}`, 14, 35);
      doc.text(`Exported by: ${user.name} (${user.role})`, 14, 40);
      
      const tableColumn = ["Customer Name", "Group", "Phone", "Credit Limit", "Outstanding", "Available"];
      const tableRows = filteredCustomers.map(c => [
        c.name,
        c.group,
        c.phone,
        `Rs. ${c.credit_limit.toLocaleString()}`,
        `Rs. ${c.outstanding_amount.toLocaleString()}`,
        `Rs. ${(c.credit_limit - c.outstanding_amount).toLocaleString()}`
      ]);

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 48,
        theme: 'striped',
        headStyles: { fillColor: [79, 70, 229], textColor: 255, fontSize: 10, fontStyle: 'bold' },
        bodyStyles: { fontSize: 9 },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        margin: { top: 48 }
      });

      doc.save(`customer_credit_report_${businessId}_${new Date().toISOString().split('T')[0]}.pdf`);
      
      setTimeout(() => {
        triggerToast('Customer ledger PDF generation complete. Download initiated.', 'success');
      }, 500);
    } catch (err) {
      console.error('PDF Generation Error:', err);
      triggerToast('Failed to generate PDF. Please try again.', 'error');
    }
  };

  const handlePrintIndividualLedger = (cust: Customer) => {
    dbStore.logActivity(user.id, user.name, user.role, 'Print Ledger', `Printed individual ledger for ${cust.name}`, businessId);
    
    try {
      const doc = new jsPDF();
      const history = getCustomerHistory(cust.id);
      
      doc.setFontSize(18);
      doc.setTextColor(30, 41, 59);
      doc.text('Customer Ledger Statement', 14, 22);
      
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text(`Customer: ${cust.name}`, 14, 30);
      doc.text(`Phone: ${cust.phone}`, 14, 35);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 40);
      doc.text(`Business ID: ${businessId}`, 14, 45);
      
      autoTable(doc, {
        body: [
          ['Total Outstanding Balance', `Rs. ${cust.outstanding_amount.toLocaleString()}`],
          ['Authorized Credit Limit', `Rs. ${cust.credit_limit.toLocaleString()}`],
          ['Available Credit Headroom', `Rs. ${(cust.credit_limit - cust.outstanding_amount).toLocaleString()}`]
        ],
        startY: 50,
        theme: 'grid',
        styles: { fontSize: 9, cellPadding: 3 },
        columnStyles: { 0: { fontStyle: 'bold', fillColor: [248, 250, 252], cellWidth: 60 } }
      });

      const tableColumn = ["Order Number", "Order Date", "Delivery Status", "Invoice Amount", "Payment Status"];
      const tableRows = history.map(o => [
        o.order_number,
        o.order_date,
        o.status,
        `Rs. ${o.total_amount.toLocaleString()}`,
        o.payment_status
      ]);

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: (doc as any).lastAutoTable.finalY + 10,
        theme: 'striped',
        headStyles: { fillColor: [15, 23, 42], textColor: 255, fontSize: 9 },
        bodyStyles: { fontSize: 8 }
      });

      doc.save(`ledger_${cust.name.replace(/\s+/g, '_').toLowerCase()}_${new Date().toISOString().split('T')[0]}.pdf`);
      triggerToast('Individual ledger PDF generated successfully.', 'success');
    } catch (err) {
      console.error('Individual PDF Error:', err);
      triggerToast('Failed to generate ledger PDF.', 'error');
    }
  };

  const filteredCustomers = customers.filter(cust => {
    const matchesSearch = 
      cust.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cust.phone.includes(searchQuery) ||
      (cust.email && cust.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (cust.gstin && cust.gstin.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesGroup = selectedGroup === 'All' || cust.group === selectedGroup;

    return matchesSearch && matchesGroup;
  });

  const getCustomerHistory = (customerId: string): SalesOrder[] => {
    return dbStore.getSalesOrders(businessId).filter(o => o.customer_id === customerId);
  };

  // KPI Calculations
  const totalCustomers = customers.length;
  const totalOutstanding = customers.reduce((sum, c) => sum + c.outstanding_amount, 0);
  const overLimitCount = customers.filter(c => c.outstanding_amount > c.credit_limit).length;
  const avgCreditLimit = totalCustomers > 0 ? Math.round(customers.reduce((sum, c) => sum + c.credit_limit, 0) / totalCustomers) : 0;

  return (
    <div className="space-y-4 max-w-full pb-8 px-0 font-sans text-slate-900 dark:text-slate-100 overflow-x-hidden" id="customer-module-root">
      <PageHeader
        title="Customer Management Master"
        subtitle="Add, edit, delete, group, and audit customer profiles and credit histories."
        icon={Users}
      >
        <div className="flex flex-nowrap overflow-x-auto md:flex-wrap gap-2 hide-scrollbar w-full justify-end">
          <button 
            onClick={handleExportCSV} 
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-[10px] sm:text-[11px] font-bold cursor-pointer shadow-sm transition-all whitespace-nowrap shrink-0 border border-white/10"
          >
            <FileSpreadsheet size={14} className="text-emerald-400" />
            <span>Export Excel</span>
          </button>
          <button 
            onClick={handleExportPDF} 
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-[10px] sm:text-[11px] font-bold cursor-pointer shadow-sm transition-all whitespace-nowrap shrink-0 border border-white/10"
          >
            <FileText size={14} className="text-rose-400" />
            <span>Print Credit PDF</span>
          </button>
          {user.role !== 'Viewer' && (
            <button 
              onClick={handleOpenAddModal} 
              className="flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white rounded-xl text-[10px] sm:text-[11px] font-bold cursor-pointer shadow-md transition-all whitespace-nowrap shrink-0 border border-indigo-400/30"
            >
              <UserPlus size={14} />
              <span>Add Customer</span>
            </button>
          )}
        </div>
      </PageHeader>

      <div className="px-0.5 sm:px-1 space-y-4">
        {/* KPI Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-2 sm:p-3 rounded-xl shadow-xs hover:shadow-md hover:border-slate-400 dark:hover:border-slate-600 transition-all cursor-default group flex flex-col justify-between gap-1">
            <div className="flex items-center gap-1.5">
              <div className="p-1.5 bg-slate-500/10 dark:bg-slate-500/20 text-slate-600 dark:text-slate-400 rounded-lg group-hover:scale-110 transition-transform shrink-0">
                <Users size={14} />
              </div>
              <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">TOTAL CUSTOMERS</span>
            </div>
            <div className="text-right mt-1">
              <span className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
                {totalCustomers}
              </span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-2 sm:p-3 rounded-xl shadow-xs hover:shadow-md hover:border-indigo-400 dark:hover:border-indigo-600 transition-all cursor-default group flex flex-col justify-between gap-1">
            <div className="flex items-center gap-1.5">
              <div className="p-1.5 bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-lg group-hover:scale-110 transition-transform shrink-0">
                <DollarSign size={14} />
              </div>
              <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">TOTAL RECEIVABLE</span>
            </div>
            <div className="text-right mt-1">
              <span className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
                ₹{totalOutstanding.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-2 sm:p-3 rounded-xl shadow-xs hover:shadow-md hover:border-emerald-400 dark:hover:border-emerald-600 transition-all cursor-default group flex flex-col justify-between gap-1">
            <div className="flex items-center gap-1.5">
              <div className="p-1.5 bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-lg group-hover:scale-110 transition-transform shrink-0">
                <Building size={14} />
              </div>
              <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">AVG CREDIT LIMIT</span>
            </div>
            <div className="text-right mt-1">
              <span className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
                ₹{avgCreditLimit.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-2 sm:p-3 rounded-xl shadow-xs hover:shadow-md hover:border-rose-400 dark:hover:border-rose-600 transition-all cursor-default group flex flex-col justify-between gap-1">
            <div className="flex items-center gap-1.5">
              <div className="p-1.5 bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 rounded-lg group-hover:scale-110 transition-transform shrink-0">
                <ShieldAlert size={14} />
              </div>
              <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">LIMIT EXCEEDED</span>
            </div>
            <div className="text-right mt-1">
              <span className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
                {overLimitCount}
              </span>
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row gap-2 mt-4">
          <div className="relative flex-1 flex items-center">
            <Search size={14} className="absolute left-3 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by company name, phone, email, GSTIN..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 bg-white dark:bg-slate-900 text-[11px] font-medium rounded-xl border border-black dark:border-white focus:outline-hidden focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-400"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 text-slate-400 hover:text-slate-600"
              >
                <X size={14} />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-slate-400 hidden sm:block" />
            <select 
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="w-full sm:w-[160px] py-2.5 px-3 bg-white dark:bg-slate-900 text-[11px] font-medium rounded-xl border border-black dark:border-white focus:outline-hidden focus:ring-1 focus:ring-indigo-500 transition-all"
            >
              <option value="All">All Groups</option>
              <option value="Retail">Retail</option>
              <option value="Wholesale">Wholesale</option>
              <option value="Distributor">Distributor</option>
            </select>
          </div>
        </div>

        {/* Compact List View */}
        <div className="bg-white dark:bg-slate-900 overflow-x-auto rounded-3xl border border-black dark:border-white shadow-sm mt-5">
          <table className="w-full text-left text-[11px] whitespace-nowrap">
            <thead className="bg-slate-700 dark:bg-slate-600 text-white font-bold uppercase tracking-wider border-b border-black dark:border-white text-[11px]">
              <tr>
                <th className="py-2.5 px-4">Customer Details</th>
                <th className="py-2.5 px-4">Compliance Codes</th>
                <th className="py-2.5 px-4">Location/Area</th>
                <th className="py-2.5 px-4">Outstanding / Limit</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black dark:divide-white bg-white dark:bg-slate-900 text-[11px]">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-500 dark:text-slate-400">
                      <SearchX size={24} className="mb-2 opacity-50" />
                      <p className="font-bold text-xs">No customers found.</p>
                      <p className="text-[10px]">Try adjusting filters or add a new customer.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((cust, idx) => {
                  const isOverLimit = cust.outstanding_amount > cust.credit_limit;
                  const headroom = cust.credit_limit - cust.outstanding_amount;
                  
                  return (
                    <tr key={`${cust.id}-${idx}`} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-2 px-4">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-800 dark:text-slate-200 line-clamp-1 text-[12px]">{cust.name}</span>
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                              cust.group === 'Wholesale' ? 'bg-violet-50 text-violet-700 border border-violet-200 dark:bg-violet-900/30 dark:border-violet-800 dark:text-violet-300' :
                              cust.group === 'Distributor' ? 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/30 dark:border-amber-800 dark:text-amber-300' :
                              'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/30 dark:border-emerald-800 dark:text-emerald-300'
                            }`}>
                              {cust.group}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-[9px] mt-0.5">
                            <span className="flex items-center gap-0.5 text-slate-500 font-mono"><Phone size={10} /> {cust.phone}</span>
                            {cust.email && <span className="flex items-center gap-0.5 text-slate-500"><Mail size={10} /> {cust.email}</span>}
                          </div>
                        </div>
                      </td>
                      <td className="py-2 px-4">
                        <div className="flex flex-col font-mono text-[10px] space-y-0.5">
                          <p><span className="text-slate-400 uppercase mr-1">GST:</span><span className="font-bold">{cust.gstin || 'Unregistered'}</span></p>
                          <p><span className="text-slate-400 uppercase mr-1">PAN:</span><span className="font-bold">{cust.pan || 'N/A'}</span></p>
                        </div>
                      </td>
                      <td className="py-2 px-4">
                        <div className="flex flex-col max-w-[200px]">
                          <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                            <MapPin size={10} className="text-slate-400" />
                            {cust.area || 'No Area Assigned'}
                          </span>
                          <span className="text-[9px] text-slate-500 truncate mt-0.5" title={cust.billing_address}>
                            {cust.billing_address}
                          </span>
                        </div>
                      </td>
                      <td className="py-2 px-4">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className={`font-black text-[12px] ${isOverLimit ? 'text-rose-600' : 'text-slate-900 dark:text-white'}`}>
                              ₹{cust.outstanding_amount.toLocaleString()}
                            </span>
                            {isOverLimit && (
                              <span className="text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-rose-50 border border-rose-200 text-rose-700 dark:bg-rose-900/30 dark:border-rose-800 dark:text-rose-300">
                                Over Limit
                              </span>
                            )}
                          </div>
                          <div className="text-[9px] mt-0.5">
                            <span className="text-slate-400 mr-1">Limit:</span>
                            <span className="font-mono font-bold text-slate-600 dark:text-slate-300">₹{cust.credit_limit.toLocaleString()}</span>
                            <span className="text-slate-400 mx-1">|</span>
                            <span className="text-slate-400 mr-1">Avail:</span>
                            <span className={`font-mono font-bold ${headroom < 0 ? 'text-rose-500' : 'text-emerald-500'}`}>₹{headroom.toLocaleString()}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-2 px-4 text-right">
                        <div className="flex justify-end gap-1.5 items-center">
                          <button
                            onClick={() => setViewingHistoryCustomer(cust)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 dark:bg-slate-800 dark:hover:bg-indigo-900/30 rounded transition-colors border border-slate-200 dark:border-slate-700"
                            title="View Ledger History"
                          >
                            <History size={14} />
                          </button>
                          {user.role !== 'Viewer' && (
                            <>
                              <button
                                onClick={() => handleOpenEditModal(cust)}
                                className="p-1.5 text-slate-500 hover:text-sky-600 bg-slate-50 hover:bg-sky-50 dark:bg-slate-800 dark:hover:bg-sky-900/30 rounded transition-colors border border-slate-200 dark:border-slate-700"
                                title="Edit Customer"
                              >
                                <Edit size={14} />
                              </button>
                              <button
                                onClick={() => handleDeleteCustomer(cust.id, cust.name)}
                                className="p-1.5 text-slate-500 hover:text-rose-600 bg-slate-50 hover:bg-rose-50 dark:bg-slate-800 dark:hover:bg-rose-900/30 rounded transition-colors border border-slate-200 dark:border-slate-700"
                                title="Delete Customer"
                              >
                                <Trash2 size={14} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Main Add/Edit Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden shadow-xl animate-in zoom-in duration-150">
            <div className="bg-slate-50 dark:bg-slate-800 px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between shrink-0">
              <h2 className="text-xs font-bold uppercase tracking-wider">
                {editingCustomer ? 'Update Customer Profile' : 'Register New Customer'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer transition-colors">
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleSaveCustomer} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Customer / Company Name *</label>
                  <input 
                    type="text" 
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Acme Corp"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 text-[11px] rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Customer Group *</label>
                  <select 
                    value={formGroup}
                    onChange={(e) => setFormGroup(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 text-[11px] rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-hidden"
                  >
                    <option value="Retail">Retail</option>
                    <option value="Wholesale">Wholesale</option>
                    <option value="Distributor">Distributor</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-[11px] font-bold text-slate-500 uppercase">Geographical Area / Zone</label>
                    <button 
                      type="button" 
                      onClick={() => setIsAddingArea(!isAddingArea)}
                      className="text-[10px] text-indigo-600 hover:underline cursor-pointer font-bold"
                    >
                      {isAddingArea ? 'Select Existing' : '+ Add Custom Area'}
                    </button>
                  </div>
                  
                  {isAddingArea ? (
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={newArea}
                        onChange={(e) => setNewArea(e.target.value)}
                        placeholder="e.g. Andheri West"
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 text-[11px] rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                      />
                      <button 
                        type="button"
                        onClick={() => {
                          if(newArea.trim()) {
                            setFormArea(newArea.trim());
                            setIsAddingArea(false);
                            setNewArea('');
                          }
                        }}
                        className="px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[11px] font-semibold"
                      >
                        Use
                      </button>
                    </div>
                  ) : (() => {
                    // Extract unique areas from existing customers
                    const areasSet = new Set(customers.map(c => c.area).filter(Boolean));
                    const predefinedZones = ['Dahisar', 'Borivali', 'Kandivali', 'Malad', 'Goregaon', 'Andheri'];
                    predefinedZones.forEach(z => areasSet.add(z));
                    const zones = Array.from(areasSet).sort();

                    return (
                      <select 
                        value={formArea}
                        onChange={(e) => setFormArea(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 text-[11px] rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-hidden"
                      >
                        <option value="">-- No specific area --</option>
                        {zones.map(z => (
                          <option key={z} value={z as string}>{z}</option>
                        ))}
                      </select>
                    );
                  })()}
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Contact Mobile Number * (10 Digits)</label>
                  <input 
                    type="tel" 
                    required
                    maxLength={10}
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="e.g. 9820012345"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 text-[11px] rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 font-mono"
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
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 text-[11px] rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 font-mono uppercase"
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
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 text-[11px] rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 font-mono uppercase"
                  />
                </div>

                <div className="space-y-1 md:col-span-2">
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

                <div className="space-y-1 md:col-span-2">
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

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800 mt-6">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-[11px] font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-[11px] font-semibold hover:bg-indigo-700 cursor-pointer shadow-sm transition-colors"
                >
                  Save Customer Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Ledger History Modal */}
      {viewingHistoryCustomer && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-xl animate-in zoom-in duration-150">
            <div className="bg-slate-950 text-white px-6 py-4 flex items-center justify-between shrink-0">
              <h2 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                <History size={16} />
                Ledger Statement: {viewingHistoryCustomer.name}
              </h2>
              <button onClick={() => setViewingHistoryCustomer(null)} className="text-slate-400 hover:text-white cursor-pointer transition-colors">
                <X size={18} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto bg-slate-50 dark:bg-slate-900 flex-1">
              {/* Ledger Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                  <p className="text-[10px] text-slate-500 font-bold uppercase">Outstanding Balance</p>
                  <p className="text-xl font-black text-slate-900 dark:text-white mt-1">₹{viewingHistoryCustomer.outstanding_amount.toLocaleString()}</p>
                </div>
                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                  <p className="text-[10px] text-slate-500 font-bold uppercase">Authorized Credit Limit</p>
                  <p className="text-xl font-black text-slate-900 dark:text-white mt-1">₹{viewingHistoryCustomer.credit_limit.toLocaleString()}</p>
                </div>
                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                  <p className="text-[10px] text-slate-500 font-bold uppercase">Available Credit</p>
                  <p className={`text-xl font-black mt-1 ${(viewingHistoryCustomer.credit_limit - viewingHistoryCustomer.outstanding_amount) < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    ₹{(viewingHistoryCustomer.credit_limit - viewingHistoryCustomer.outstanding_amount).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Transaction History */}
              <h3 className="text-[11px] font-bold text-slate-800 dark:text-slate-200 uppercase mb-3 px-1 border-b border-slate-200 dark:border-slate-700 pb-2">Recent Sales Orders</h3>
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                <table className="w-full text-left text-[11px]">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
                      <th className="py-2.5 px-4 font-bold text-slate-600 dark:text-slate-400">Order Number</th>
                      <th className="py-2.5 px-4 font-bold text-slate-600 dark:text-slate-400">Date</th>
                      <th className="py-2.5 px-4 font-bold text-slate-600 dark:text-slate-400">Amount</th>
                      <th className="py-2.5 px-4 font-bold text-slate-600 dark:text-slate-400">Status</th>
                      <th className="py-2.5 px-4 font-bold text-slate-600 dark:text-slate-400 text-right">Payment</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                    {getCustomerHistory(viewingHistoryCustomer.id).length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-500">No transactions recorded yet.</td>
                      </tr>
                    ) : (
                      getCustomerHistory(viewingHistoryCustomer.id).map((order, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                          <td className="py-2.5 px-4 font-mono font-bold">{order.order_number}</td>
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
                          <td className="py-2.5 px-4 text-right">
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                              order.payment_status === 'Paid' ? 'bg-emerald-100 text-emerald-700' :
                              order.payment_status === 'Partial' ? 'bg-amber-100 text-amber-700' :
                              'bg-rose-100 text-rose-700'
                            }`}>
                              {order.payment_status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            
            <div className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-6 py-4 flex justify-between items-center shrink-0">
              <button 
                onClick={() => handlePrintIndividualLedger(viewingHistoryCustomer)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-[11px] font-semibold rounded-lg cursor-pointer hover:bg-indigo-700 transition-colors"
              >
                <FileText size={14} />
                <span>Print Statement PDF</span>
              </button>
              <button 
                onClick={() => setViewingHistoryCustomer(null)}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-[11px] font-semibold rounded-lg cursor-pointer hover:bg-slate-300 transition-colors"
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
