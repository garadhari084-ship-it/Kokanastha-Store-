import { PageHeader } from './PageHeader';
import React, { useEffect, useState, useRef, useMemo } from 'react';
import { 
  Users, Search, Filter, UserPlus, Edit, Trash2, FileSpreadsheet, FileText, DollarSign, History, X, Plus, MapPin, Phone, Mail, CheckCircle, ExternalLink, ShieldAlert, Building, SearchX, Upload, FileDown, AlertCircle, Check
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
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
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedGroup]);
  
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
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formIsLoyalMember, setFormIsLoyalMember] = useState<boolean>(false);
  const [formLoyaltyTier, setFormLoyaltyTier] = useState<string>('');
  
  // Custom Area additions
  const [isAddingArea, setIsAddingArea] = useState(false);
  const [newArea, setNewArea] = useState('');

  // Excel Import / Sample Download States & Handlers
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadProgress, setUploadProgress] = useState<{
    fileName: string;
    progressPercent: number;
    statusText: string;
    processedRows: number;
    totalRows: number;
  } | null>(null);

  const [importSummary, setImportSummary] = useState<{
    total: number;
    added: number;
    skipped: number;
    skippedDetails: { row: number; name: string; phone: string; email: string; reason: string }[];
  } | null>(null);

  const handleDownloadSampleExcel = () => {
    try {
      const sampleRows = [
        {
          'Customer Name': 'Rahul Sharma',
          'Mobile Number': '9876543210',
          'Email': 'rahul.sharma@example.com',
          'Customer Address': '123 Station Road, Andheri West, Mumbai, Maharashtra 400058'
        },
        {
          'Customer Name': 'Priya Patel',
          'Mobile Number': '9123456789',
          'Email': 'priya.patel@example.com',
          'Customer Address': '456 FC Road, Shivaji Nagar, Pune, Maharashtra 411005'
        },
        {
          'Customer Name': 'Amit Verma',
          'Mobile Number': '9988776655',
          'Email': 'amit.verma@example.com',
          'Customer Address': '789 Commercial Street, Bangalore, Karnataka 560001'
        }
      ];

      const ws = XLSX.utils.json_to_sheet(sampleRows, {
        header: ['Customer Name', 'Mobile Number', 'Email', 'Customer Address']
      });

      // Format column widths for Excel
      ws['!cols'] = [
        { wch: 22 }, // Col A: Customer Name
        { wch: 18 }, // Col B: Mobile Number
        { wch: 28 }, // Col C: Email
        { wch: 45 }  // Col D: Customer Address
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Sample_Customers');
      XLSX.writeFile(wb, 'Customer_Import_Sample.xlsx');

      triggerToast('Sample Excel template downloaded successfully.', 'success');
      dbStore.logActivity(user.id, user.name, user.role, 'Download Template', 'Downloaded Customer Import Excel sample template', businessId);
    } catch (err: any) {
      console.error('Failed to download sample excel:', err);
      triggerToast('Failed to download sample excel template.', 'error');
    }
  };

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadProgress({
      fileName: file.name,
      progressPercent: 5,
      statusText: 'Reading Excel file...',
      processedRows: 0,
      totalRows: 0
    });

    const reader = new FileReader();

    reader.onerror = () => {
      triggerToast('Failed to read file. Please try again.', 'error');
      setUploadProgress(null);
    };

    reader.onload = async (evt) => {
      try {
        const arrayBuffer = evt.target?.result;
        if (!arrayBuffer) {
          triggerToast('Could not read file buffer.', 'error');
          setUploadProgress(null);
          return;
        }

        setUploadProgress({
          fileName: file.name,
          progressPercent: 20,
          statusText: 'Parsing Excel workbook...',
          processedRows: 0,
          totalRows: 0
        });

        const wb = XLSX.read(arrayBuffer, { type: 'array', cellFormula: false, raw: false, cellDates: true });
        const wsName = wb.SheetNames[0];
        if (!wsName) {
          triggerToast('Invalid or empty Excel file.', 'error');
          setUploadProgress(null);
          return;
        }
        const ws = wb.Sheets[wsName];

        // Read raw sheet rows as array of arrays
        const rawMatrix = XLSX.utils.sheet_to_json<any>(ws, { header: 1, raw: false, defval: '' });

        if (!rawMatrix || rawMatrix.length === 0) {
          triggerToast('The uploaded Excel file contains no data.', 'error');
          setUploadProgress(null);
          return;
        }

        let startIdx = 0;
        let nameIdx = 0;
        let mobileIdx = 1;
        let emailIdx = 2;
        let addressIdx = 3;

        const firstRow = rawMatrix[0];
        if (Array.isArray(firstRow) && firstRow.some(cell => {
          const str = String(cell || '').toLowerCase();
          return str.includes('name') || str.includes('mobile') || str.includes('phone') || str.includes('email') || str.includes('address') || str.includes('customer');
        })) {
          startIdx = 1;
          firstRow.forEach((cell, colIdx) => {
            const str = String(cell || '').toLowerCase().trim();
            if (/name|customer|party/i.test(str) && nameIdx === 0) nameIdx = colIdx;
            else if (/mobile|phone|contact|number|cell/i.test(str)) mobileIdx = colIdx;
            else if (/email|mail/i.test(str)) emailIdx = colIdx;
            else if (/address|location|billing|shipping/i.test(str)) addressIdx = colIdx;
          });
        }

        const dataRows = rawMatrix.slice(startIdx).filter((row: any) => 
          Array.isArray(row) && row.some((cell: any) => cell !== null && cell !== undefined && String(cell).trim() !== '')
        );

        if (dataRows.length === 0) {
          triggerToast('No valid customer data rows found in Excel sheet.', 'error');
          setUploadProgress(null);
          return;
        }

        const totalRows = dataRows.length;
        setUploadProgress({
          fileName: file.name,
          progressPercent: 50,
          statusText: `Processing ${totalRows} customer record(s)...`,
          processedRows: 0,
          totalRows
        });

        const currentCustomers = dbStore.getCustomers(businessId);
        const existingNames = new Set(
          currentCustomers.map(c => c.name ? c.name.trim().toLowerCase() : '').filter(Boolean)
        );
        const existingPhones = new Set(
          currentCustomers.map(c => c.phone ? c.phone.replace(/\D/g, '') : '').filter(Boolean)
        );
        const existingEmails = new Set(
          currentCustomers.map(c => c.email ? c.email.trim().toLowerCase() : '').filter(Boolean)
        );

        const batchNames = new Set<string>();
        const batchPhones = new Set<string>();
        const batchEmails = new Set<string>();

        let skippedCount = 0;
        const skippedDetails: { row: number; name: string; phone: string; email: string; reason: string }[] = [];
        const newCustomersToCreate: any[] = [];

        // Fast chunked in-memory processing
        const CHUNK_SIZE = 500;
        for (let i = 0; i < totalRows; i += CHUNK_SIZE) {
          const end = Math.min(i + CHUNK_SIZE, totalRows);
          for (let rowIndex = i; rowIndex < end; rowIndex++) {
            const row = dataRows[rowIndex];

            const rawName = row[nameIdx] ?? row[0] ?? '';
            const rawMobile = row[mobileIdx] ?? row[1] ?? '';
            const rawEmail = row[emailIdx] ?? row[2] ?? '';
            const rawAddress = row[addressIdx] ?? row[3] ?? '';

            const name = String(rawName).trim();
            const cleanName = name.toLowerCase();

            let mobileStr = String(rawMobile).trim();
            if (mobileStr.includes('e+') || mobileStr.includes('E+')) {
              const num = Number(mobileStr);
              if (!isNaN(num)) mobileStr = num.toFixed(0);
            }

            let cleanPhone = mobileStr.replace(/\D/g, '');
            if (cleanPhone.length === 12 && cleanPhone.startsWith('91')) {
              cleanPhone = cleanPhone.slice(2);
            }
            const cleanEmail = String(rawEmail).trim().toLowerCase();
            const address = String(rawAddress).trim();

            if (!name && !cleanPhone && !cleanEmail) {
              continue;
            }

            // Dedup check: Find via name, mobile or email in database or current import batch
            const nameExists = cleanName.length > 0 && (existingNames.has(cleanName) || batchNames.has(cleanName));
            const phoneExists = cleanPhone.length > 0 && (existingPhones.has(cleanPhone) || batchPhones.has(cleanPhone));
            const emailExists = cleanEmail.length > 0 && (existingEmails.has(cleanEmail) || batchEmails.has(cleanEmail));

            if (nameExists || phoneExists || emailExists) {
              skippedCount++;
              let reason = '';
              if (nameExists) {
                reason = `Customer name "${name}" already exists`;
              } else if (phoneExists && emailExists) {
                reason = 'Mobile number & Email already exist';
              } else if (phoneExists) {
                reason = `Mobile number (${cleanPhone}) already exists`;
              } else {
                reason = `Email (${cleanEmail}) already exists`;
              }

              skippedDetails.push({
                row: startIdx + rowIndex + 1,
                name: name || 'N/A',
                phone: cleanPhone || mobileStr || 'N/A',
                email: cleanEmail || 'N/A',
                reason
              });
            } else {
              newCustomersToCreate.push({
                name: name || `Customer ${cleanPhone}`,
                group: 'Retail',
                billing_address: address || 'N/A',
                shipping_address: address || 'N/A',
                email: cleanEmail,
                phone: cleanPhone,
                credit_limit: 0,
                business_id: businessId,
                active: true,
                gstin: '',
                pan: '',
                area: ''
              });

              if (cleanName) {
                existingNames.add(cleanName);
                batchNames.add(cleanName);
              }
              if (cleanPhone) {
                existingPhones.add(cleanPhone);
                batchPhones.add(cleanPhone);
              }
              if (cleanEmail) {
                existingEmails.add(cleanEmail);
                batchEmails.add(cleanEmail);
              }
            }
          }

          if (totalRows > 500) {
            setUploadProgress({
              fileName: file.name,
              progressPercent: Math.min(95, Math.floor((end / totalRows) * 90) + 5),
              statusText: `Validating & importing ${end} of ${totalRows}...`,
              processedRows: end,
              totalRows
            });
            await new Promise(r => setTimeout(r, 0));
          }
        }

        // Bulk batch insert all new customers in a single database operation!
        if (newCustomersToCreate.length > 0) {
          dbStore.createCustomersBatch(newCustomersToCreate);
        }

        const addedCount = newCustomersToCreate.length;

        setUploadProgress(null);
        setCustomers(dbStore.getCustomers(businessId));
        dbStore.logActivity(user.id, user.name, user.role, 'Import Customers', `Imported ${addedCount} customers from Excel file (${skippedCount} duplicates skipped)`, businessId);

        setImportSummary({
          total: totalRows,
          added: addedCount,
          skipped: skippedCount,
          skippedDetails
        });

        if (addedCount > 0) {
          triggerToast(`Successfully imported ${addedCount} new customer(s).`, 'success');
        } else if (totalRows > 0) {
          triggerToast(`0 customers added. All ${skippedCount} customer(s) already exist in database.`, 'info');
        } else {
          triggerToast('No valid customer entries found in Excel file.', 'error');
        }

      } catch (err: any) {
        console.error('Import processing error:', err);
        triggerToast('Failed to parse Excel file. Please ensure valid file format.', 'error');
        setUploadProgress(null);
      }
    };

    reader.readAsArrayBuffer(file);

    if (e.target) {
      e.target.value = '';
    }
  };

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
    setFormImageUrl('');
    setFormIsLoyalMember(false);
    setFormLoyaltyTier('');
    
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
    setFormImageUrl(cust.image_url || '');
    setFormIsLoyalMember(cust.is_loyal_member || false);
    setFormLoyaltyTier(cust.loyalty_tier || '');
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
          credit_limit: formCreditLimit,
          is_loyal_member: formIsLoyalMember,
          loyalty_tier: formLoyaltyTier || undefined,
          image_url: formImageUrl
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
          is_loyal_member: formIsLoyalMember,
          loyalty_tier: formLoyaltyTier || undefined,
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

  const filteredCustomers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return customers.filter(cust => {
      const matchesSearch = !q ||
        cust.name.toLowerCase().includes(q) ||
        cust.phone.includes(q) ||
        (cust.email && cust.email.toLowerCase().includes(q)) ||
        (cust.gstin && cust.gstin.toLowerCase().includes(q));

      const matchesGroup = selectedGroup === 'All' || cust.group === selectedGroup;

      return matchesSearch && matchesGroup;
    });
  }, [customers, searchQuery, selectedGroup]);

  const totalPages = Math.ceil(filteredCustomers.length / pageSize) || 1;

  const paginatedCustomers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredCustomers.slice(start, start + pageSize);
  }, [filteredCustomers, currentPage, pageSize]);

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
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImportExcel} 
            accept=".xlsx, .xls, .csv" 
            className="hidden" 
          />
          
          <button 
            onClick={handleDownloadSampleExcel} 
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-xl text-[10px] sm:text-[11px] font-bold cursor-pointer shadow-sm transition-all whitespace-nowrap shrink-0 border border-amber-400/30"
            title="Download Sample Excel Format Template"
          >
            <FileDown size={14} className="text-amber-400" />
            <span>Sample Excel</span>
          </button>

          {user.role !== 'Viewer' && (
            <button 
              onClick={() => fileInputRef.current?.click()} 
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/30 hover:bg-emerald-600/40 text-emerald-300 rounded-xl text-[10px] sm:text-[11px] font-bold cursor-pointer shadow-sm transition-all whitespace-nowrap shrink-0 border border-emerald-400/30"
              title="Import Customers from Excel File"
            >
              <Upload size={14} className="text-emerald-400" />
              <span>Import Excel</span>
            </button>
          )}

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
          <table className="w-full text-left text-[11px] border-collapse">
            <thead className="bg-slate-700 dark:bg-slate-600 text-white font-bold uppercase tracking-wider border-b border-black dark:border-white text-[10px] sm:text-[11px]">
              <tr>
                <th className="py-2.5 px-2.5 max-w-[200px] sm:max-w-[240px]">Customer Details</th>
                <th className="py-2.5 px-2">Compliance</th>
                <th className="py-2.5 px-2 max-w-[140px]">Location/Area</th>
                <th className="py-2.5 px-2">Outstanding / Limit</th>
                <th className="py-2.5 px-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black dark:divide-white bg-white dark:bg-slate-900 text-[11px]">
              {paginatedCustomers.length === 0 ? (
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
                paginatedCustomers.map((cust, idx) => {
                  const isOverLimit = cust.outstanding_amount > cust.credit_limit;
                  const headroom = cust.credit_limit - cust.outstanding_amount;
                  
                  return (
                    <tr key={`${cust.id}-${idx}`} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-2 px-2.5 max-w-[200px] sm:max-w-[240px] cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => handleOpenEditModal(cust)}>
                        <div className="flex items-center gap-2 overflow-hidden">
                          {cust.image_url ? (
                            <img src={cust.image_url} alt={cust.name} className="w-7 h-7 rounded-full object-cover shrink-0 border border-slate-200" />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700 text-slate-500">
                              <Users size={12} />
                            </div>
                          )}
                          <div className="flex flex-col min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="font-bold text-slate-800 dark:text-slate-200 truncate text-[11px]" title={cust.name}>{cust.name}</span>
                              <span className={`text-[8px] font-bold px-1.5 py-0.2 rounded-full shrink-0 ${
                                cust.group === 'Wholesale' ? 'bg-violet-50 text-violet-700 border border-violet-200 dark:bg-violet-900/30 dark:border-violet-800 dark:text-violet-300' :
                                cust.group === 'Distributor' ? 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/30 dark:border-amber-800 dark:text-amber-300' :
                                'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/30 dark:border-emerald-800 dark:text-emerald-300'
                              }`}>
                                {cust.group}
                              </span>
                              {cust.loyalty_tier && (
                                <span className="text-[8px] font-bold px-1.5 py-0.2 rounded-full shrink-0 bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-900/30 dark:border-indigo-800 dark:text-indigo-300">
                                  {cust.loyalty_tier}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-[9px] mt-0.5 min-w-0 truncate">
                              <span className="flex items-center gap-0.5 text-slate-500 font-mono shrink-0"><Phone size={9} /> {cust.phone}</span>
                              {cust.email && <span className="flex items-center gap-0.5 text-slate-500 truncate"><Mail size={9} /> {cust.email}</span>}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-2 px-2">
                        <div className="flex flex-col font-mono text-[10px] space-y-0.5">
                          <p><span className="text-slate-400 uppercase mr-1">GST:</span><span className="font-bold">{cust.gstin || 'Unregistered'}</span></p>
                          <p><span className="text-slate-400 uppercase mr-1">PAN:</span><span className="font-bold">{cust.pan || 'N/A'}</span></p>
                        </div>
                      </td>
                      <td className="py-2 px-2 max-w-[140px]">
                        <div className="flex flex-col max-w-[140px]">
                          <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1 truncate">
                            <MapPin size={9} className="text-slate-400 shrink-0" />
                            <span className="truncate">{cust.area || 'No Area Assigned'}</span>
                          </span>
                          <span className="text-[9px] text-slate-500 truncate mt-0.5" title={cust.billing_address}>
                            {cust.billing_address}
                          </span>
                        </div>
                      </td>
                      <td className="py-2 px-2">
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
                      <td className="py-2 px-2.5 text-right">
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
                              {user.role === 'Super Admin' && (
                                <button
                                  onClick={() => handleDeleteCustomer(cust.id, cust.name)}
                                  className="p-1.5 text-slate-500 hover:text-rose-600 bg-slate-50 hover:bg-rose-50 dark:bg-slate-800 dark:hover:bg-rose-900/30 rounded transition-colors border border-slate-200 dark:border-slate-700"
                                  title="Delete Customer"
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
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

        {/* Pagination Controls */}
        {filteredCustomers.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 text-[11px] rounded-b-3xl">
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 font-medium">
              <span>
                Showing <strong className="text-slate-900 dark:text-white font-black">{Math.min((currentPage - 1) * pageSize + 1, filteredCustomers.length)}</strong> to <strong className="text-slate-900 dark:text-white font-black">{Math.min(currentPage * pageSize, filteredCustomers.length)}</strong> of <strong className="text-slate-900 dark:text-white font-black">{filteredCustomers.length}</strong> customers
              </span>
              <span className="hidden sm:inline text-slate-300 dark:text-slate-700">|</span>
              <div className="flex items-center gap-1">
                <span className="hidden sm:inline">Rows per page:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-2 py-0.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-[11px] font-bold focus:outline-none"
                >
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value={250}>250</option>
                  <option value={500}>500</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="px-2 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded font-bold text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                title="First Page"
              >
                « First
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded font-bold text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                ‹ Prev
              </button>

              <span className="px-2 font-bold text-slate-800 dark:text-slate-200">
                Page {currentPage} of {totalPages}
              </span>

              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage >= totalPages}
                className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded font-bold text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                Next ›
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage >= totalPages}
                className="px-2 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded font-bold text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                title="Last Page"
              >
                Last »
              </button>
            </div>
          </div>
        )}
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
            
            <form onSubmit={handleSaveCustomer} className="p-6 space-y-4 overflow-y-auto flex-1" onKeyDown={(e) => { if (e.key === 'Enter' && (e.target as HTMLElement).tagName === 'INPUT') e.preventDefault(); }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1 md:col-span-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Customer Profile Image</label>
                  <div className="flex items-center gap-4">
                    {formImageUrl ? (
                      <img src={formImageUrl} alt="Preview" className="w-16 h-16 rounded-full object-cover border border-slate-200" />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 text-slate-400">
                        <Users size={24} />
                      </div>
                    )}
                    <div className="flex-1">
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setFormImageUrl(reader.result as string);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="w-full text-[11px]"
                      />
                      <p className="text-[9px] text-slate-400 mt-1">Upload a shop or profile picture (max 1MB recommended).</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Loyalty Tier (Override)</label>
                  <select 
                    value={formLoyaltyTier}
                    onChange={(e) => setFormLoyaltyTier(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 text-[11px] rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-hidden"
                  >
                    <option value="">Auto (Spend-based)</option>
                    <option value="Silver">Silver</option>
                    <option value="Gold">Gold</option>
                    <option value="Platinum">Platinum</option>
                  </select>
                </div>

                
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

                <div className="col-span-full p-3 bg-indigo-50/70 dark:bg-indigo-950/40 rounded-xl border border-indigo-200 dark:border-indigo-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base">👑</span>
                    <div>
                      <div className="text-[11px] font-black text-indigo-950 dark:text-indigo-200">
                        Kokanastha Loyal Membership Program
                      </div>
                      <div className="text-[9.5px] text-indigo-700 dark:text-indigo-300 font-medium">
                        Enrolls customer for LMR (Loyal Membership Rate - Lowest Price)
                      </div>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={formIsLoyalMember} 
                      onChange={(e) => setFormIsLoyalMember(e.target.checked)}
                      className="sr-only peer" 
                    />
                    <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
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

      {/* Excel Upload Progress Modal */}
      {uploadProgress && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-2xl animate-pulse">
                <Upload size={22} />
              </div>
              <div className="overflow-hidden">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Uploading & Parsing Excel File</h3>
                <p className="text-xs text-slate-500 font-mono truncate max-w-[240px]">{uploadProgress.fileName}</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-slate-700 dark:text-slate-300">{uploadProgress.statusText}</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-mono">{uploadProgress.progressPercent}%</span>
              </div>
              
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden p-0.5 border border-slate-200 dark:border-slate-700">
                <div 
                  className="bg-emerald-500 h-full rounded-full transition-all duration-300 ease-out shadow-sm"
                  style={{ width: `${uploadProgress.progressPercent}%` }}
                />
              </div>

              {uploadProgress.totalRows > 0 && (
                <p className="text-[11px] text-right text-slate-400 font-medium">
                  Processed {uploadProgress.processedRows} of {uploadProgress.totalRows} rows
                </p>
              )}
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-[11px] text-slate-500 flex items-center gap-2 border border-slate-100 dark:border-slate-800">
              <AlertCircle size={14} className="text-amber-500 shrink-0" />
              <span>Validating mobile numbers & emails against database...</span>
            </div>
          </div>
        </div>
      )}

      {/* Excel Import Results Modal */}
      {importSummary && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl">
                  <FileSpreadsheet size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">Excel Customer Import Results</h3>
                  <p className="text-[11px] text-slate-500">Deduplication & Validation Report</p>
                </div>
              </div>
              <button 
                onClick={() => setImportSummary(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800 text-center">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Rows</p>
                <p className="text-xl font-black text-slate-900 dark:text-white mt-0.5">{importSummary.total}</p>
              </div>
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200/50 dark:border-emerald-800/30 text-center">
                <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Imported</p>
                <p className="text-xl font-black text-emerald-700 dark:text-emerald-400 mt-0.5">+{importSummary.added}</p>
              </div>
              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-2xl border border-amber-200/50 dark:border-amber-800/30 text-center">
                <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">Skipped (Dupes)</p>
                <p className="text-xl font-black text-amber-700 dark:text-amber-400 mt-0.5">{importSummary.skipped}</p>
              </div>
            </div>

            {importSummary.skippedDetails.length > 0 && (
              <div className="space-y-2">
                <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <AlertCircle size={14} className="text-amber-500" />
                  Skipped Existing Customers (Found via Mobile / Email in DB):
                </p>
                <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 text-[10px]">
                  {importSummary.skippedDetails.map((item, idx) => (
                    <div key={idx} className="p-2 bg-amber-50/50 dark:bg-amber-950/10 flex flex-col gap-0.5">
                      <div className="flex justify-between items-center font-bold text-slate-800 dark:text-slate-200">
                        <span>Row {item.row}: {item.name}</span>
                        <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 font-mono">Already Exists</span>
                      </div>
                      <div className="text-slate-500 flex gap-3 text-[10px]">
                        <span>Mobile: {item.phone || 'N/A'}</span>
                        <span>Email: {item.email || 'N/A'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setImportSummary(null)}
                className="px-5 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold rounded-xl hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
