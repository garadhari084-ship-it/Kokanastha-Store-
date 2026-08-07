import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Customer, SalesOrder, UserProfile } from '../types/erp';
import { dbStore } from '../services/store';
import { Search, Plus, User, FileText, Phone, MapPin, Receipt, History, Upload, FileDown, FileSpreadsheet, X, AlertCircle } from 'lucide-react';
import { PageHeader } from './PageHeader';
import * as XLSX from 'xlsx';

interface PartiesModuleProps {
  businessId: string;
  user: UserProfile;
  triggerToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const PartiesModule: React.FC<PartiesModuleProps> = ({ businessId, user, triggerToast }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [customers, setCustomers] = useState<Customer[]>(() => dbStore.getCustomers(businessId));
  const [displayLimit, setDisplayLimit] = useState(50);

  useEffect(() => {
    setCustomers(dbStore.getCustomers(businessId));
    return dbStore.subscribe(() => {
      setCustomers(dbStore.getCustomers(businessId));
    });
  }, [businessId]);

  useEffect(() => {
    setDisplayLimit(50);
  }, [searchQuery]);

  const filteredCustomers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return customers;
    return customers.filter(c => 
      c.name.toLowerCase().includes(q) ||
      c.phone.includes(q)
    );
  }, [customers, searchQuery]);

  const visibleCustomers = useMemo(() => {
    return filteredCustomers.slice(0, displayLimit);
  }, [filteredCustomers, displayLimit]);

  const handleScrollList = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop - clientHeight < 150) {
      if (displayLimit < filteredCustomers.length) {
        setDisplayLimit(prev => Math.min(prev + 50, filteredCustomers.length));
      }
    }
  };

  const selectedCustomer = useMemo(() => {
    return customers.find(c => c.id === selectedCustomerId) || null;
  }, [customers, selectedCustomerId]);

  const customerHistory = useMemo(() => {
    return selectedCustomer ? dbStore.getSalesOrders(businessId).filter(o => o.customer_id === selectedCustomer.id) : [];
  }, [businessId, selectedCustomer]);

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

      ws['!cols'] = [
        { wch: 22 },
        { wch: 18 },
        { wch: 28 },
        { wch: 45 }
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
        triggerToast('Failed to parse Excel file. Please check file formatting.', 'error');
        setUploadProgress(null);
      }
    };

    reader.readAsArrayBuffer(file);

    if (e.target) {
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-4 max-w-full pb-8 font-sans text-slate-900 dark:text-slate-100 overflow-x-hidden h-full flex flex-col">
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleImportExcel} 
        accept=".xlsx, .xls, .csv" 
        className="hidden" 
      />

      <PageHeader 
        title="Parties / Customer History" 
        subtitle="Manage customer history, transactions, and balances."
        icon={History}
      >
        <div className="flex gap-2 flex-wrap justify-end">
          <button 
            onClick={handleDownloadSampleExcel}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 dark:hover:bg-amber-900/50 rounded-lg text-[10px] font-bold border border-amber-200/80 dark:border-amber-800/50 transition-colors"
            title="Download Sample Excel Format Template"
          >
            <FileDown size={13} className="text-amber-600 dark:text-amber-400" />
            <span>Sample Excel</span>
          </button>

          {user.role !== 'Viewer' && (
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-900/50 rounded-lg text-[10px] font-bold border border-emerald-200/80 dark:border-emerald-800/50 transition-colors"
              title="Import Customers from Excel File"
            >
              <Upload size={13} className="text-emerald-600 dark:text-emerald-400" />
              <span>Import Excel</span>
            </button>
          )}
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
          <div className="flex bg-slate-50 dark:bg-slate-800 p-2 text-[10px] font-bold text-slate-500 uppercase border-b border-slate-200 dark:border-slate-800 justify-between">
            <div>Party Name ({filteredCustomers.length})</div>
            <div className="w-20 text-right">Amount</div>
          </div>
          <div className="flex-1 overflow-y-auto" onScroll={handleScrollList}>
            {visibleCustomers.length === 0 ? (
              <div className="p-4 text-center text-slate-400 text-xs">No parties found.</div>
            ) : (
              visibleCustomers.map(cust => (
                <div 
                  key={cust.id} 
                  onClick={() => setSelectedCustomerId(cust.id)}
                  className={`flex p-3 border-b border-slate-100 dark:border-slate-800/50 cursor-pointer transition-colors ${selectedCustomerId === cust.id ? 'bg-indigo-50 dark:bg-indigo-900/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
                >
                  <div className="flex-1 flex flex-col min-w-0 pr-2">
                    <span className="text-[11px] font-bold truncate">{cust.name}</span>
                    <span className="text-[9px] text-slate-500">{cust.phone}</span>
                  </div>
                  <div className="w-20 text-right flex flex-col justify-center shrink-0">
                    <span className={`text-[11px] font-black ${cust.outstanding_amount > 0 ? 'text-rose-600' : 'text-slate-700 dark:text-slate-300'}`}>
                      ₹{cust.outstanding_amount.toLocaleString()}
                    </span>
                  </div>
                </div>
              ))
            )}
            {visibleCustomers.length < filteredCustomers.length && (
              <div className="p-2 text-center">
                <button
                  onClick={() => setDisplayLimit(prev => Math.min(prev + 50, filteredCustomers.length))}
                  className="w-full py-1.5 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded transition-colors"
                >
                  Load More ({filteredCustomers.length - visibleCustomers.length} remaining)
                </button>
              </div>
            )}
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
