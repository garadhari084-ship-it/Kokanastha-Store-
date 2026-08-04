import { PageHeader } from './PageHeader';
import React, { useEffect, useState } from 'react';
import { 
  Users, Search, Filter, PlusCircle, Edit, Trash2, FileSpreadsheet, FileText, DollarSign, History, X, MapPin, Phone, Mail, Building, SearchX, Truck, ClipboardList, ShoppingBag
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { dbStore } from '../services/store';
import { Supplier, PurchaseOrder, UserProfile } from '../types/erp';

interface SupplierModuleProps {
  businessId: string;
  user: UserProfile;
  triggerToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  openAddModalInitially?: boolean;
}

export const SupplierModule: React.FC<SupplierModuleProps> = ({ 
  businessId, 
  user, 
  triggerToast,
  openAddModalInitially = false
}) => {
  const [suppliers, setSuppliers] = useState<Supplier[]>(dbStore.getSuppliers(businessId));
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(dbStore.getPurchaseOrders(businessId));
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(openAddModalInitially);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [viewingHistorySupplier, setViewingHistorySupplier] = useState<Supplier | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formGstin, setFormGstin] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formAddress, setFormAddress] = useState('');

  useEffect(() => {
    return dbStore.subscribe(() => {
      setSuppliers(dbStore.getSuppliers(businessId));
      setPurchaseOrders(dbStore.getPurchaseOrders(businessId));
    });
  }, [businessId]);

  const handleOpenAddModal = () => {
    setFormName('');
    setFormGstin('');
    setFormPhone('');
    setFormEmail('');
    setFormAddress('');
    
    setEditingSupplier(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (sup: Supplier) => {
    setEditingSupplier(sup);
    setFormName(sup.name);
    setFormGstin(sup.gstin || '');
    setFormAddress(sup.address);
    setFormEmail(sup.email || '');
    setFormPhone(sup.phone);
    setIsModalOpen(true);
  };

  const handleSaveSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formPhone.trim() || !formAddress.trim()) return;

    const cleanPhone = formPhone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      triggerToast('Mobile number must be exactly 10 digits.', 'error');
      return;
    }

    try {
      if (editingSupplier) {
        dbStore.updateSupplier(editingSupplier.id, {
          name: formName.trim(),
          gstin: formGstin.toUpperCase(),
          address: formAddress,
          email: formEmail,
          phone: cleanPhone
        });
        dbStore.logActivity(user.id, user.name, user.role, 'Update Vendor', `Updated vendor profile: ${formName}`, businessId);
        triggerToast('Vendor updated successfully.', 'success');
      } else {
        dbStore.createSupplier({
          name: formName.trim(),
          gstin: formGstin.toUpperCase(),
          address: formAddress,
          email: formEmail,
          phone: cleanPhone,
          business_id: businessId,
          
        });
        dbStore.logActivity(user.id, user.name, user.role, 'Create Vendor', `Registered new vendor: ${formName}`, businessId);
        triggerToast('Vendor created successfully.', 'success');
      }
      setIsModalOpen(false);
    } catch (e: any) {
      triggerToast(e.message || 'An error occurred.', 'error');
    }
  };

  const handleDeleteSupplier = (id: string, name: string) => {
    if (user.role === 'Viewer') {
      triggerToast('Unauthorized to perform deletion.', 'error');
      return;
    }

    const sup = suppliers.find(s => s.id === id);
    if (sup && sup.outstanding_amount > 0) {
      triggerToast(`Cannot delete: Vendor has an outstanding payable balance of Rs. ${sup.outstanding_amount}`, 'error');
      return;
    }

    if (window.confirm(`Are you sure you want to delete vendor "${name}"? This action cannot be undone.`)) {
      try {
        dbStore.deleteSupplier(id);
        dbStore.logActivity(user.id, user.name, user.role, 'Delete Vendor', `Deleted vendor: ${name}`, businessId);
        triggerToast('Vendor removed from master.', 'success');
      } catch (e: any) {
         triggerToast(e.message || 'Failed to delete vendor', 'error');
      }
    }
  };

  const handleExportCSV = () => {
    dbStore.logActivity(user.id, user.name, user.role, 'Export Excel', 'Exported Vendors directory to Excel format', businessId);
    
    const headers = ['ID', 'Name', 'GSTIN', 'Phone', 'Email', 'Outstanding Payable', 'Warehouse Address'];
    const rows = filteredSuppliers.map(s => [
      s.id,
      s.name,
      s.gstin,
      s.phone,
      s.email,
      s.outstanding_amount,
      `"${s.address.replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `vendors_export_${businessId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    triggerToast('Excel sheet export initiated successfully.', 'success');
  };

  const handleExportPDF = () => {
    dbStore.logActivity(user.id, user.name, user.role, 'Export PDF', 'Exported Vendor payable report to PDF', businessId);
    
    try {
      const doc = new jsPDF();
      
      doc.setFontSize(18);
      doc.setTextColor(30, 41, 59);
      doc.text('Vendor Payable Management Report', 14, 22);
      
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);
      doc.text(`Business ID: ${businessId}`, 14, 35);
      doc.text(`Exported by: ${user.name} (${user.role})`, 14, 40);
      
      const tableColumn = ["Vendor Name", "Phone", "GSTIN", "Outstanding Payable"];
      const tableRows = filteredSuppliers.map(s => [
        s.name,
        s.phone,
        s.gstin || 'Unregistered',
        `Rs. ${s.outstanding_amount.toLocaleString()}`
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

      doc.save(`vendor_payable_report_${businessId}_${new Date().toISOString().split('T')[0]}.pdf`);
      
      setTimeout(() => {
        triggerToast('Vendor payable PDF generation complete. Download initiated.', 'success');
      }, 500);
    } catch (err) {
      console.error('PDF Generation Error:', err);
      triggerToast('Failed to generate PDF. Please try again.', 'error');
    }
  };

  const handlePrintIndividualLedger = (sup: Supplier) => {
    dbStore.logActivity(user.id, user.name, user.role, 'Print Ledger', `Printed individual ledger for ${sup.name}`, businessId);
    
    try {
      const doc = new jsPDF();
      const history = getSupplierHistory(sup.id);
      
      doc.setFontSize(18);
      doc.setTextColor(30, 41, 59);
      doc.text('Vendor Ledger Statement', 14, 22);
      
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text(`Vendor: ${sup.name}`, 14, 30);
      doc.text(`Phone: ${sup.phone}`, 14, 35);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 40);
      doc.text(`Business ID: ${businessId}`, 14, 45);
      
      autoTable(doc, {
        body: [
          ['Total Outstanding Payable', `Rs. ${sup.outstanding_amount.toLocaleString()}`]
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

      doc.save(`ledger_${sup.name.replace(/\s+/g, '_').toLowerCase()}_${new Date().toISOString().split('T')[0]}.pdf`);
      triggerToast('Individual ledger PDF generated successfully.', 'success');
    } catch (err) {
      console.error('Individual PDF Error:', err);
      triggerToast('Failed to generate ledger PDF.', 'error');
    }
  };

  const filteredSuppliers = suppliers.filter(sup => {
    const matchesSearch = 
      sup.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sup.phone.includes(searchQuery) ||
      (sup.email && sup.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (sup.gstin && sup.gstin.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesSearch;
  });

  const getSupplierHistory = (supplierId: string): PurchaseOrder[] => {
    return purchaseOrders.filter(o => o.supplier_id === supplierId);
  };

  // KPI Calculations
  const totalSuppliers = suppliers.length;
  const totalPayable = suppliers.reduce((sum, s) => sum + s.outstanding_amount, 0);
  const avgPayable = totalSuppliers > 0 ? Math.round(totalPayable / totalSuppliers) : 0;
  const activePOsCount = purchaseOrders.filter(po => po.status === 'Ordered' || po.status === 'Draft').length;

  return (
    <div className="space-y-4 max-w-full pb-8 px-0 font-sans text-slate-900 dark:text-slate-100 overflow-x-hidden" id="supplier-module-root">
      <PageHeader
        title="Supplier & Vendor Master"
        subtitle="Add, edit, delete, and audit vendor profiles and payable histories."
        icon={Truck}
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
            <span>Print Payable PDF</span>
          </button>
          {user.role !== 'Viewer' && (
            <button 
              onClick={handleOpenAddModal} 
              className="flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white rounded-xl text-[10px] sm:text-[11px] font-bold cursor-pointer shadow-md transition-all whitespace-nowrap shrink-0 border border-indigo-400/30"
            >
              <PlusCircle size={14} />
              <span>Register Vendor</span>
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
                <Truck size={14} />
              </div>
              <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">TOTAL VENDORS</span>
            </div>
            <div className="text-right mt-1">
              <span className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
                {totalSuppliers}
              </span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-2 sm:p-3 rounded-xl shadow-xs hover:shadow-md hover:border-indigo-400 dark:hover:border-indigo-600 transition-all cursor-default group flex flex-col justify-between gap-1">
            <div className="flex items-center gap-1.5">
              <div className="p-1.5 bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-lg group-hover:scale-110 transition-transform shrink-0">
                <DollarSign size={14} />
              </div>
              <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">TOTAL PAYABLE</span>
            </div>
            <div className="text-right mt-1">
              <span className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
                ₹{totalPayable.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-2 sm:p-3 rounded-xl shadow-xs hover:shadow-md hover:border-emerald-400 dark:hover:border-emerald-600 transition-all cursor-default group flex flex-col justify-between gap-1">
            <div className="flex items-center gap-1.5">
              <div className="p-1.5 bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-lg group-hover:scale-110 transition-transform shrink-0">
                <Building size={14} />
              </div>
              <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">AVG PAYABLE</span>
            </div>
            <div className="text-right mt-1">
              <span className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
                ₹{avgPayable.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-2 sm:p-3 rounded-xl shadow-xs hover:shadow-md hover:border-amber-400 dark:hover:border-amber-600 transition-all cursor-default group flex flex-col justify-between gap-1">
            <div className="flex items-center gap-1.5">
              <div className="p-1.5 bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-lg group-hover:scale-110 transition-transform shrink-0">
                <ShoppingBag size={14} />
              </div>
              <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">PENDING POS</span>
            </div>
            <div className="text-right mt-1">
              <span className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
                {activePOsCount}
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
              placeholder="Search vendors by name, phone, email, GSTIN..." 
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
        </div>

        {/* Compact List View */}
        <div className="bg-white dark:bg-slate-900 overflow-x-auto rounded-3xl border border-black dark:border-white shadow-sm mt-5">
          <table className="w-full text-left text-[11px]">
            <thead className="bg-slate-700 dark:bg-slate-600 text-white font-bold uppercase tracking-wider border-b border-black dark:border-white text-[11px]">
              <tr>
                <th className="py-2.5 px-4">Vendor Details</th>
                <th className="py-2.5 px-4">Compliance Codes</th>
                <th className="py-2.5 px-4">Warehouse Address</th>
                <th className="py-2.5 px-4">Outstanding Payable</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black dark:divide-white bg-white dark:bg-slate-900 text-[11px]">
              {filteredSuppliers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-500 dark:text-slate-400">
                      <SearchX size={24} className="mb-2 opacity-50" />
                      <p className="font-bold text-xs">No vendors found.</p>
                      <p className="text-[10px]">Try adjusting search or register a new vendor.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredSuppliers.map((sup, idx) => (
                  <tr key={`${sup.id}-${idx}`} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-2 px-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800 dark:text-slate-200 line-clamp-1 text-[12px]">{sup.name}</span>
                        <div className="flex items-center gap-3 text-[9px] mt-0.5">
                          <span className="flex items-center gap-0.5 text-slate-500 font-mono"><Phone size={10} /> {sup.phone}</span>
                          {sup.email && <span className="flex items-center gap-0.5 text-slate-500"><Mail size={10} /> {sup.email}</span>}
                        </div>
                      </div>
                    </td>
                    <td className="py-2 px-4">
                      <div className="flex flex-col font-mono text-[10px] space-y-0.5">
                        <p><span className="text-slate-400 uppercase mr-1">GST:</span><span className="font-bold">{sup.gstin || 'Unregistered'}</span></p>
                      </div>
                    </td>
                    <td className="py-2 px-4">
                      <div className="flex flex-col max-w-[200px]">
                        <span className="text-[9px] text-slate-600 dark:text-slate-300 truncate" title={sup.address}>
                          <MapPin size={10} className="inline mr-1 text-slate-400" />
                          {sup.address}
                        </span>
                      </div>
                    </td>
                    <td className="py-2 px-4">
                      <div className="flex flex-col">
                        <span className="font-black text-[12px] text-slate-900 dark:text-white">
                          ₹{sup.outstanding_amount.toLocaleString()}
                        </span>
                      </div>
                    </td>
                    <td className="py-2 px-4 text-right">
                      <div className="flex justify-end gap-1.5 items-center">
                        <button
                          onClick={() => setViewingHistorySupplier(sup)}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 dark:bg-slate-800 dark:hover:bg-indigo-900/30 rounded transition-colors border border-slate-200 dark:border-slate-700"
                          title="View Ledger History"
                        >
                          <History size={14} />
                        </button>
                        {user.role !== 'Viewer' && (
                          <>
                            <button
                              onClick={() => handleOpenEditModal(sup)}
                              className="p-1.5 text-slate-500 hover:text-sky-600 bg-slate-50 hover:bg-sky-50 dark:bg-slate-800 dark:hover:bg-sky-900/30 rounded transition-colors border border-slate-200 dark:border-slate-700"
                              title="Edit Vendor"
                            >
                              <Edit size={14} />
                            </button>
                            {user.role === 'Super Admin' && (
                              <button
                                onClick={() => handleDeleteSupplier(sup.id, sup.name)}
                                className="p-1.5 text-slate-500 hover:text-rose-600 bg-slate-50 hover:bg-rose-50 dark:bg-slate-800 dark:hover:bg-rose-900/30 rounded transition-colors border border-slate-200 dark:border-slate-700"
                                title="Delete Vendor"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Main Add/Edit Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-xl animate-in zoom-in duration-150">
            <div className="bg-slate-50 dark:bg-slate-800 px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between shrink-0">
              <h2 className="text-xs font-bold uppercase tracking-wider">
                {editingSupplier ? 'Update Vendor Profile' : 'Register New Vendor'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer transition-colors">
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleSaveSupplier} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                <div className="space-y-1 md:col-span-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Vendor / Trade Name *</label>
                  <input 
                    type="text" 
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Maharashtra Agro Cooperative"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 text-[11px] rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                  />
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
                    placeholder="sales@vendor.com"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 text-[11px] rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1 md:col-span-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Indian GSTIN (15 Characters)</label>
                  <input 
                    type="text" 
                    maxLength={15}
                    value={formGstin}
                    onChange={(e) => setFormGstin(e.target.value)}
                    placeholder="27MAMCO9988G1ZE"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 text-[11px] rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 font-mono uppercase"
                  />
                </div>

                <div className="space-y-1 md:col-span-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Corporate Warehouse Address *</label>
                  <textarea 
                    rows={3}
                    required
                    value={formAddress}
                    onChange={(e) => setFormAddress(e.target.value)}
                    placeholder="Full physical billing and delivery location of supplier..."
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 text-[11px] rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
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
                  Save Vendor Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Vendor Ledger History Modal */}
      {viewingHistorySupplier && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-xl animate-in zoom-in duration-150">
            <div className="bg-slate-950 text-white px-6 py-4 flex items-center justify-between shrink-0">
              <h2 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                <History size={16} />
                Ledger Statement: {viewingHistorySupplier.name}
              </h2>
              <button onClick={() => setViewingHistorySupplier(null)} className="text-slate-400 hover:text-white cursor-pointer transition-colors">
                <X size={18} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto bg-slate-50 dark:bg-slate-900 flex-1">
              {/* Ledger Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                  <p className="text-[10px] text-slate-500 font-bold uppercase">Outstanding Payable</p>
                  <p className="text-xl font-black text-rose-600 mt-1">₹{viewingHistorySupplier.outstanding_amount.toLocaleString()}</p>
                </div>
              </div>

              {/* Transaction History */}
              <h3 className="text-[11px] font-bold text-slate-800 dark:text-slate-200 uppercase mb-3 px-1 border-b border-slate-200 dark:border-slate-700 pb-2">Recent Purchase Orders</h3>
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
                    {getSupplierHistory(viewingHistorySupplier.id).length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-500">No transactions recorded yet.</td>
                      </tr>
                    ) : (
                      getSupplierHistory(viewingHistorySupplier.id).map((order, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                          <td className="py-2.5 px-4 font-mono font-bold">{order.order_number}</td>
                          <td className="py-2.5 px-4 text-slate-600 dark:text-slate-400">{order.order_date}</td>
                          <td className="py-2.5 px-4 font-black">₹{order.total_amount.toLocaleString()}</td>
                          <td className="py-2.5 px-4">
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                              order.status === 'Draft' ? 'bg-slate-100 text-slate-600' :
                              order.status === 'Ordered' ? 'bg-sky-100 text-sky-700' :
                              order.status === 'Received' ? 'bg-emerald-100 text-emerald-700' :
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
                onClick={() => handlePrintIndividualLedger(viewingHistorySupplier)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-[11px] font-semibold rounded-lg cursor-pointer hover:bg-indigo-700 transition-colors"
              >
                <FileText size={14} />
                <span>Print Statement PDF</span>
              </button>
              <button 
                onClick={() => setViewingHistorySupplier(null)}
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
