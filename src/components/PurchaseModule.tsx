import { PaymentCollectionModal } from './PaymentCollectionModal';
import { SearchableProductSelect } from './SearchableProductSelect';
import { PageHeader } from './PageHeader';
import React, { useEffect, useState, useRef } from 'react';
import { 
  ShoppingBag, PlusCircle, Search, Truck, FileText, Calendar, DollarSign, X, Check, CheckCircle, 
  Clock, Package, Download, Building, ArrowRight, Printer, AlertTriangle, ChevronRight, 
  FileSpreadsheet, Store, CreditCard, QrCode, Wallet, CheckCircle2, Receipt, Banknote, 
  PackagePlus, Edit, Trash2, Users, Filter, Eye, Phone, Mail, MapPin, ExternalLink,
  ChevronDown, ArrowUpRight, ShieldCheck, History, MoreVertical
} from 'lucide-react';
import { dbStore } from '../services/store';
import { PurchaseOrder, Supplier, Product, UserProfile, PurchaseItem, PaymentRecord } from '../types/erp';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface PurchaseModuleProps {
  businessId: string;
  user: UserProfile;
  triggerToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const PurchaseModule: React.FC<PurchaseModuleProps> = ({ 
  businessId, 
  user, 
  triggerToast 
}) => {
  const [purchases, setPurchases] = useState<PurchaseOrder[]>(dbStore.getPurchaseOrders(businessId));
  const [suppliers, setSuppliers] = useState<Supplier[]>(dbStore.getSuppliers(businessId));
  const [products, setProducts] = useState<Product[]>(dbStore.getProducts(businessId));
  
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'orders' | 'vendors'>('orders');

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [vendorFilter, setVendorFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  
  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [viewingOrder, setViewingOrder] = useState<PurchaseOrder | null>(null);
  const [activeActionMenuPoId, setActiveActionMenuPoId] = useState<string | null>(null);
  const [poToDelete, setPoToDelete] = useState<PurchaseOrder | null>(null);
  
  // Edit PO & Items Modal State
  const [editingOrder, setEditingOrder] = useState<PurchaseOrder | null>(null);
  const [editSupplierId, setEditSupplierId] = useState('');
  const [editDeliveryDate, setEditDeliveryDate] = useState('');
  const [editStatus, setEditStatus] = useState<PurchaseOrder['status']>('Draft');
  const [editItems, setEditItems] = useState<PurchaseItem[]>([]);
  const [editRowProductId, setEditRowProductId] = useState('');
  const [editRowQty, setEditRowQty] = useState(1);
  const [editRowPrice, setEditRowPrice] = useState(0);
  const [editRowGst, setEditRowGst] = useState(0);
  const [editPaymentStatus, setEditPaymentStatus] = useState<'Unpaid' | 'Partial' | 'Paid'>('Unpaid');
  const [editPaidAmount, setEditPaidAmount] = useState<number>(0);
  const [editPaymentMode, setEditPaymentMode] = useState<string>('UPI');
  const [editPaymentNotes, setEditPaymentNotes] = useState<string>('');
  const [editDueDate, setEditDueDate] = useState<string>('');

  // Vendor Add / Edit Modal State
  const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Supplier | null>(null);
  const [vendorFormName, setVendorFormName] = useState('');
  const [vendorFormPhone, setVendorFormPhone] = useState('');
  const [vendorFormGstin, setVendorFormGstin] = useState('');
  const [vendorFormEmail, setVendorFormEmail] = useState('');
  const [vendorFormAddress, setVendorFormAddress] = useState('');
  const [vendorModalContext, setVendorModalContext] = useState<'standalone' | 'create_po' | 'edit_po'>('standalone');

  // Vendor Detail / Ledger Modal State
  const [viewingVendorLedger, setViewingVendorLedger] = useState<Supplier | null>(null);
  
  // State for Purchase to Inventory Auto Conversion Modal
  const [orderToReceive, setOrderToReceive] = useState<PurchaseOrder | null>(null);

  // Payment Modal State
  const [paymentModalPO, setPaymentModalPO] = useState<PurchaseOrder | null>(null);
  const [paymentModalInitialMode, setPaymentModalInitialMode] = useState<'full' | 'partial'>('full');

  // Form states for creating a new PO
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [items, setItems] = useState<PurchaseItem[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);
  
  // Initial Payment Form states on Create PO
  const [initialOrderStatus, setInitialOrderStatus] = useState<'Draft' | 'Ordered' | 'Received'>('Received');
  const [initialPaymentStatus, setInitialPaymentStatus] = useState<'Unpaid' | 'Partial' | 'Paid'>('Unpaid');
  const [pendingPOToConfirm, setPendingPOToConfirm] = useState<any>(null);
  const [uploadedInvoice, setUploadedInvoice] = useState<string | null>(null);
  const [initialPaidAmount, setInitialPaidAmount] = useState<number>(0);
  const [initialPaymentMode, setInitialPaymentMode] = useState<'Cash' | 'UPI' | 'Bank Transfer' | 'Cheque' | 'Credit Card' | 'Other'>('UPI');
  const [initialPaymentNotes, setInitialPaymentNotes] = useState<string>('');
  const [initialDueDate, setInitialDueDate] = useState<string>(
    new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );

  // Quick item add row state in Create PO
  const [rowProductId, setRowProductId] = useState('');
  const [rowQty, setRowQty] = useState(10);
  const [rowPrice, setRowPrice] = useState(0);
  const [rowGst, setRowGst] = useState(0);

  const resetCreateForm = () => {
    setSelectedSupplierId(suppliers[0]?.id || '');
    setDeliveryDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    setItems([]);
    setInitialOrderStatus('Received');
    setInitialPaymentStatus('Unpaid');
    setInitialPaidAmount(0);
    setInitialPaymentMode('UPI');
    setInitialPaymentNotes('');
    setInitialDueDate(new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    setRowProductId('');
    setRowQty(10);
    setRowPrice(0);
    setRowGst(0);
    setUploadedInvoice(null);
  };

  useEffect(() => {
    return dbStore.subscribe(() => {
      setPurchases(dbStore.getPurchaseOrders(businessId));
      setSuppliers(dbStore.getSuppliers(businessId));
      setProducts(dbStore.getProducts(businessId));
    });
  }, [businessId]);

  const getProductName = (id: string) => products.find(p => p.id === id)?.name || 'Unknown Product';
  const getProductSku = (id: string) => products.find(p => p.id === id)?.sku || '';
  const getSupplierName = (id: string) => suppliers.find(s => s.id === id)?.name || 'Unknown Vendor';
  const getSupplierObj = (id: string) => suppliers.find(s => s.id === id);

  // ==================== VENDOR MANAGEMENT ====================
  const handleOpenAddVendorModal = (context: 'standalone' | 'create_po' | 'edit_po' = 'standalone') => {
    setEditingVendor(null);
    setVendorFormName('');
    setVendorFormPhone('');
    setVendorFormGstin('');
    setVendorFormEmail('');
    setVendorFormAddress('');
    setVendorModalContext(context);
    setIsVendorModalOpen(true);
  };

  const handleOpenEditVendorModal = (sup: Supplier) => {
    setEditingVendor(sup);
    setVendorFormName(sup.name || '');
    setVendorFormPhone(sup.phone || '');
    setVendorFormGstin(sup.gstin || '');
    setVendorFormEmail(sup.email || '');
    setVendorFormAddress(sup.address || '');
    setVendorModalContext('standalone');
    setIsVendorModalOpen(true);
  };

  const handleSaveVendor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorFormName.trim()) {
      triggerToast('Vendor name is required.', 'error');
      return;
    }
    const cleanPhone = vendorFormPhone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      triggerToast('Mobile number must be exactly 10 digits.', 'error');
      return;
    }
    if (!vendorFormAddress.trim()) {
      triggerToast('Vendor address is required.', 'error');
      return;
    }

    try {
      if (editingVendor) {
        const updated = dbStore.updateSupplier(editingVendor.id, {
          name: vendorFormName.trim(),
          phone: cleanPhone,
          gstin: vendorFormGstin.trim().toUpperCase(),
          email: vendorFormEmail.trim(),
          address: vendorFormAddress.trim()
        });
        dbStore.logActivity(user.id, user.name, user.role, 'Update Vendor', `Updated vendor profile: ${updated.name}`, businessId);
        triggerToast(`Vendor "${updated.name}" updated successfully.`, 'success');
        setSuppliers(dbStore.getSuppliers(businessId));
        if (viewingVendorLedger && viewingVendorLedger.id === updated.id) {
          setViewingVendorLedger(updated);
        }
      } else {
        const created = dbStore.createSupplier({
          name: vendorFormName.trim(),
          phone: cleanPhone,
          gstin: vendorFormGstin.trim().toUpperCase(),
          email: vendorFormEmail.trim(),
          address: vendorFormAddress.trim(),
          business_id: businessId
        });
        dbStore.logActivity(user.id, user.name, user.role, 'Create Vendor', `Registered new vendor: ${created.name}`, businessId);
        triggerToast(`Vendor "${created.name}" created successfully.`, 'success');
        setSuppliers(dbStore.getSuppliers(businessId));
        
        // Auto-select if in PO creation or edit
        if (vendorModalContext === 'create_po') {
          setSelectedSupplierId(created.id);
        } else if (vendorModalContext === 'edit_po') {
          setEditSupplierId(created.id);
        }
      }
      setIsVendorModalOpen(false);
    } catch (err: any) {
      triggerToast(err.message || 'Error saving vendor', 'error');
    }
  };

  const handleDeleteVendor = (id: string, name: string) => {
    if (user.role === 'Viewer') {
      triggerToast('Viewers cannot delete vendors.', 'error');
      return;
    }
    const vendorPOs = purchases.filter(p => p.supplier_id === id && p.status !== 'Cancelled');
    const hasDues = vendorPOs.some(p => {
      const paid = p.paid_amount || (p.payment_status === 'Paid' ? p.total_amount : 0);
      return (p.total_amount - paid) > 0.01;
    });

    if (hasDues) {
      triggerToast(`Cannot delete vendor "${name}": There are pending/unpaid purchase orders.`, 'error');
      return;
    }

    if (window.confirm(`Are you sure you want to remove vendor "${name}"? This action cannot be undone.`)) {
      try {
        dbStore.deleteSupplier(id);
        dbStore.logActivity(user.id, user.name, user.role, 'Delete Vendor', `Removed vendor: ${name}`, businessId);
        triggerToast(`Vendor "${name}" removed.`, 'success');
        setSuppliers(dbStore.getSuppliers(businessId));
        if (viewingVendorLedger && viewingVendorLedger.id === id) {
          setViewingVendorLedger(null);
        }
      } catch (err: any) {
        triggerToast(err.message || 'Failed to delete vendor', 'error');
      }
    }
  };

  // Helper for vendor financials
  const getVendorMetrics = (vendorId: string) => {
    const vPOs = purchases.filter(p => p.supplier_id === vendorId && p.status !== 'Cancelled');
    const totalSpend = vPOs.reduce((sum, p) => sum + (Number(p.total_amount) || 0), 0);
    const totalPaid = vPOs.reduce((sum, p) => {
      if (p.payment_status === 'Paid') return sum + (Number(p.total_amount) || 0);
      if (p.payment_status === 'Partial') return sum + (Number(p.paid_amount) || 0);
      return sum;
    }, 0);
    const outstandingDues = Math.max(0, totalSpend - totalPaid);
    const orderCount = vPOs.length;
    const unpaidCount = vPOs.filter(p => p.payment_status !== 'Paid').length;
    return { totalSpend, totalPaid, outstandingDues, orderCount, unpaidCount, orders: vPOs };
  };

  // ==================== PO SCANNING & CREATION ====================
  const handleScanInvoice = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      triggerToast('Please upload an image file.', 'error');
      return;
    }

    setIsScanning(true);
    triggerToast('Scanning invoice, please wait...', 'info');

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        setUploadedInvoice(base64String);
        try {
          const res = await fetch('/api/scan-invoice', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageBase64: base64String })
          });

          if (!res.ok) {
            throw new Error('Failed to scan invoice');
          }

          const data = await res.json();
          
          if (data.supplierName) {
            const sName = (data.supplierName || '').toLowerCase().trim();
            const sPhone = (data.supplierPhone || '').trim();
            let supplier = suppliers.find(s => s.name.toLowerCase().trim() === sName || (sPhone && s.phone === sPhone));
            if (!supplier) {
              const newSupplier: any = {
                name: (data.supplierName || '').trim() || 'Scanned Supplier',
                phone: sPhone,
                address: '',
                gstin: data.supplierGstin || '',
                business_id: businessId,
                email: ''
              };
              supplier = dbStore.createSupplier(newSupplier);
              setSuppliers(dbStore.getSuppliers(businessId));
            }
            setSelectedSupplierId(supplier.id);
          }

          if (data.items && data.items.length > 0) {
            const newItems: PurchaseItem[] = [];
            for (const it of data.items) {
              const searchName = (it.name || '').toLowerCase().trim();
              let prod = dbStore.getProducts(businessId).find(p => p.name.toLowerCase().trim() === searchName);
              if (!prod) {
                const newProd: any = {
                  name: (it.name || '').trim() || 'Scanned Item',
                  category: 'Uncategorized',
                  hsn_code: '',
                  purchase_price: it.price || 0,
                  selling_price: (it.price || 0) * 1.2,
                  gst_rate: it.gst_rate || 0,
                  min_stock_level: 5,
                  unit: 'Unit',
                  purchase_unit: 'Unit',
                  business_id: businessId,
                  auto_conversion: false,
                  sku: '',
                  barcode: '',
                  qr_code: '',
                  category_id: ''
                };
                prod = dbStore.createProduct(newProd);
              }
              newItems.push({
                product_id: prod.id,
                qty: it.qty || 1,
                received_qty: 0,
                purchase_price: it.price || prod.purchase_price,
                gst_rate: it.gst_rate || prod.gst_rate
              });
            }
            setItems(newItems);
            setProducts(dbStore.getProducts(businessId));
          }
          
          triggerToast('Invoice scanned and mapped successfully!', 'success');
        } catch(err: any) {
          triggerToast(err.message || 'Error processing invoice', 'error');
        } finally {
          setIsScanning(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
          if (uploadInputRef.current) uploadInputRef.current.value = '';
        }
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      triggerToast(err.message || 'Error reading image', 'error');
      setIsScanning(false);
    }
  };

  const handleOpenAddModal = (presetVendorId?: string) => {
    if (suppliers.length === 0) {
      handleOpenAddVendorModal('create_po');
      triggerToast('Please create your first vendor to start purchasing.', 'info');
      return;
    }
    if (products.length === 0) {
      triggerToast('Please add products in the Inventory module first.', 'error');
      return;
    }
    resetCreateForm();
    if (presetVendorId) {
      setSelectedSupplierId(presetVendorId);
    }
    setIsCreateModalOpen(true);
  };

  const handleProductSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const pId = e.target.value;
    setRowProductId(pId);
    const prod = products.find(p => p.id === pId);
    if (prod) {
      setRowPrice(prod.purchase_price);
      setRowGst(prod.gst_rate);
    }
  };

  const handleAddRowItem = () => {
    if (!rowProductId) {
      triggerToast('Please select a product first.', 'error');
      return;
    }
    if (rowQty <= 0) {
      triggerToast('Quantity must be greater than zero.', 'error');
      return;
    }
    
    const prod = products.find(p => p.id === rowProductId);
    if (!prod) return;

    if (items.some(it => it.product_id === rowProductId)) {
      triggerToast('Product already in order list. Update its quantity instead.', 'error');
      return;
    }

    const newItem: PurchaseItem = {
      product_id: rowProductId,
      qty: rowQty,
      received_qty: 0,
      purchase_price: rowPrice,
      gst_rate: rowGst
    };

    setItems([...items, newItem]);
    setRowProductId('');
    setRowQty(10);
    setRowPrice(0);
    setRowGst(0);
  };

  const handleRemoveItem = (prodId: string) => {
    setItems(items.filter(i => i.product_id !== prodId));
  };

  const handleSavePO = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplierId) {
      triggerToast('Please select a vendor.', 'error');
      return;
    }
    if (items.length === 0) {
      triggerToast('Please add at least one item to the PO.', 'error');
      return;
    }

    let totalAmount = 0;
    items.forEach(i => {
      const lineTotal = i.qty * i.purchase_price;
      const tax = lineTotal * (i.gst_rate / 100);
      totalAmount += (lineTotal + tax);
    });

    const poNumber = dbStore.getNextAvailablePONumber(businessId);

    let calcPaidAmount = 0;
    let finalPayStatus = initialPaymentStatus;
    if (initialPaymentStatus === 'Paid') {
      calcPaidAmount = totalAmount;
    } else if (initialPaymentStatus === 'Partial') {
      calcPaidAmount = Math.min(totalAmount, Math.max(0, initialPaidAmount));
      if (calcPaidAmount >= totalAmount) {
        finalPayStatus = 'Paid';
      }
    } else {
      calcPaidAmount = 0;
    }

    const initialHistory: PaymentRecord[] = calcPaidAmount > 0 ? [{
      id: crypto.randomUUID(),
      order_id: '',
      order_number: poNumber,
      type: 'Purchase',
      amount: calcPaidAmount,
      payment_mode: initialPaymentMode,
      payment_date: new Date().toISOString().split('T')[0],
      notes: initialPaymentNotes.trim() || 'Initial Payment on Order Creation',
      receipt_number: `PAY-${poNumber}-1`,
      collected_by: user.name || 'Staff',
      business_id: businessId,
      created_at: new Date().toISOString()
    }] : [];
    
    const newPOData = {
      order_number: poNumber,
      supplier_id: selectedSupplierId,
      order_date: new Date().toISOString().split('T')[0],
      delivery_date: deliveryDate,
      status: initialOrderStatus,
      payment_status: finalPayStatus,
      paid_amount: calcPaidAmount,
      payment_mode: initialPaymentMode,
      payment_notes: initialPaymentNotes.trim(),
      payment_date: calcPaidAmount > 0 ? new Date().toISOString().split('T')[0] : undefined,
      payment_history: initialHistory,
      invoice_image: uploadedInvoice,
      items: items,
      total_amount: totalAmount,
      business_id: businessId
    };

    if (initialOrderStatus === 'Received') {
      const hasAutoConversion = items.some(item => {
        const prod = products.find(p => p.id === item.product_id);
        return prod && prod.auto_conversion;
      });
      if (hasAutoConversion) {
        setPendingPOToConfirm(newPOData);
        return;
      }
    }

    executeSavePO(newPOData);
  };

  const executeSavePO = (poData: any) => {
    try {
      const createdPO = dbStore.createPurchaseOrder(poData);
      dbStore.logActivity(user.id, user.name, user.role, 'Create PO', `Generated new Purchase Order: ${createdPO.order_number}`, businessId);
      triggerToast(`Purchase Order ${createdPO.order_number} created successfully.`, 'success');
      setIsCreateModalOpen(false);
      setPendingPOToConfirm(null);
      setPurchases(dbStore.getPurchaseOrders(businessId));
    } catch (e: any) {
      triggerToast(e.message || 'Error creating PO', 'error');
    }
  };

  // ==================== EDIT PURCHASE ORDER & ORDER ITEMS ====================
  const handleOpenEditPO = (po: PurchaseOrder) => {
    setEditingOrder(po);
    setEditSupplierId(po.supplier_id);
    setEditDeliveryDate(po.delivery_date || '');
    setEditStatus(po.status);
    setEditItems(po.items.map(it => ({ ...it })));
    setEditRowProductId('');
    setEditRowQty(1);
    setEditRowPrice(0);
    setEditRowGst(0);

    const currPaid = Number(po.paid_amount) || (po.payment_status === 'Paid' ? po.total_amount : 0);
    const statusVal: 'Unpaid' | 'Partial' | 'Paid' = po.payment_status || (currPaid >= po.total_amount - 0.01 ? 'Paid' : currPaid > 0 ? 'Partial' : 'Unpaid');
    setEditPaymentStatus(statusVal);
    setEditPaidAmount(currPaid);
    setEditPaymentMode(po.payment_mode || 'UPI');
    setEditPaymentNotes(po.payment_notes || '');
    setEditDueDate(new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  };

  const handleEditProductSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const pId = e.target.value;
    setEditRowProductId(pId);
    const prod = products.find(p => p.id === pId);
    if (prod) {
      setEditRowPrice(prod.purchase_price);
      setEditRowGst(prod.gst_rate);
    }
  };

  const handleAddEditRowItem = () => {
    if (!editRowProductId) {
      triggerToast('Please select a product first.', 'error');
      return;
    }
    if (editRowQty <= 0) {
      triggerToast('Quantity must be greater than zero.', 'error');
      return;
    }
    if (editItems.some(it => it.product_id === editRowProductId)) {
      triggerToast('Product already exists in this order. Adjust its quantity in the table.', 'error');
      return;
    }
    const newItem: PurchaseItem = {
      product_id: editRowProductId,
      qty: editRowQty,
      received_qty: 0,
      purchase_price: editRowPrice,
      gst_rate: editRowGst
    };
    setEditItems([...editItems, newItem]);
    setEditRowProductId('');
    setEditRowQty(1);
    setEditRowPrice(0);
    setEditRowGst(0);
  };

  const handleRemoveEditItem = (prodId: string) => {
    if (editItems.length <= 1) {
      triggerToast('A purchase order must have at least one line item.', 'error');
      return;
    }
    setEditItems(editItems.filter(i => i.product_id !== prodId));
  };

  const handleSaveEditedPO = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrder) return;
    if (!editSupplierId) {
      triggerToast('Please select a valid vendor.', 'error');
      return;
    }
    if (editItems.length === 0) {
      triggerToast('Order must contain at least one line item.', 'error');
      return;
    }

    // Recalculate total amount
    let newTotalAmount = 0;
    editItems.forEach(i => {
      const lineTotal = i.qty * i.purchase_price;
      const tax = lineTotal * (i.gst_rate / 100);
      newTotalAmount += (lineTotal + tax);
    });

    let finalPaid = editPaidAmount;
    let finalPayStatus: 'Unpaid' | 'Partial' | 'Paid' = editPaymentStatus;

    if (editPaymentStatus === 'Paid') {
      finalPaid = newTotalAmount;
      finalPayStatus = 'Paid';
    } else if (editPaymentStatus === 'Unpaid') {
      finalPaid = 0;
      finalPayStatus = 'Unpaid';
    } else {
      if (editPaidAmount >= newTotalAmount - 0.01) {
        finalPayStatus = 'Paid';
        finalPaid = newTotalAmount;
      } else if (editPaidAmount <= 0) {
        finalPayStatus = 'Unpaid';
        finalPaid = 0;
      } else {
        finalPayStatus = 'Partial';
        finalPaid = editPaidAmount;
      }
    }

    try {
      const updated = dbStore.updatePurchaseOrder(editingOrder.id, {
        supplier_id: editSupplierId,
        delivery_date: editDeliveryDate,
        status: editStatus,
        items: editItems,
        total_amount: newTotalAmount,
        paid_amount: finalPaid,
        payment_status: finalPayStatus,
        payment_mode: editPaymentMode,
        payment_notes: editPaymentNotes
      });

      dbStore.logActivity(
        user.id, user.name, user.role,
        'Edit PO Items',
        `Updated PO ${editingOrder.order_number} items & totals (New Total: ₹${newTotalAmount.toLocaleString()})`,
        businessId
      );

      triggerToast(`PO ${editingOrder.order_number} and order items updated successfully!`, 'success');
      setPurchases(dbStore.getPurchaseOrders(businessId));
      if (viewingOrder && viewingOrder.id === editingOrder.id) {
        setViewingOrder(updated);
      }
      setEditingOrder(null);
    } catch (err: any) {
      triggerToast(err.message || 'Failed to update Purchase Order', 'error');
    }
  };

  const handleDeletePO = (po: PurchaseOrder) => {
    if (user.role === 'Viewer') {
      triggerToast('Viewers cannot delete orders.', 'error');
      return;
    }
    setPoToDelete(po);
  };

  const executeDeletePO = (po: PurchaseOrder) => {
    if (user.role === 'Viewer') {
      triggerToast('Viewers cannot delete orders.', 'error');
      return;
    }
    try {
      dbStore.deletePurchaseOrder(po.id);
      dbStore.logActivity(user.id, user.name, user.role, 'Delete PO', `Deleted Purchase Order ${po.order_number}`, businessId);
      triggerToast(`Purchase Order ${po.order_number} has been permanently deleted.`, 'success');
      setPurchases(dbStore.getPurchaseOrders(businessId));
      if (viewingOrder && viewingOrder.id === po.id) {
        setViewingOrder(null);
      }
    } catch (err: any) {
      triggerToast(err.message || 'Failed to delete PO', 'error');
    }
  };

  // ==================== STATUS & PAYMENTS ====================
  const handleUpdateStatus = (poId: string, newStatus: PurchaseOrder['status']) => {
    try {
      const updated = dbStore.updatePurchaseOrder(poId, { status: newStatus });
      dbStore.logActivity(user.id, user.name, user.role, 'Update PO', `Updated PO status to ${newStatus}`, businessId);
      triggerToast(`Order status updated to ${newStatus}`, 'success');
      setPurchases(dbStore.getPurchaseOrders(businessId));
      if (viewingOrder && viewingOrder.id === poId) {
        setViewingOrder(updated);
      }
    } catch (err: any) {
      triggerToast(err.message || 'Error updating status', 'error');
    }
  };

  const handleOpenPaymentModal = (po: PurchaseOrder, mode: 'full' | 'partial' = 'full') => {
    setPaymentModalPO(po);
    setPaymentModalInitialMode(mode);
  };

  const handlePayVendorOldestDue = (vendorId: string, mode: 'full' | 'partial' = 'full') => {
    const vPOs = purchases.filter(p => p.supplier_id === vendorId && p.status !== 'Cancelled' && p.payment_status !== 'Paid');
    if (vPOs.length === 0) {
      triggerToast('All purchase orders for this vendor are already fully settled!', 'info');
      return;
    }
    // Pick first unpaid or partial PO
    handleOpenPaymentModal(vPOs[0], mode);
  };

  // ==================== PDF EXPORT & PRINTING ====================
  const handlePrintPO = (po: PurchaseOrder) => {
    try {
      const doc = new jsPDF();
      const sup = suppliers.find(s => s.id === po.supplier_id);
      
      doc.setFontSize(22);
      doc.setTextColor(30, 41, 59);
      doc.text('PURCHASE ORDER', 14, 22);
      
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text(`PO Number: ${po.order_number}`, 14, 32);
      doc.text(`Order Date: ${po.order_date}`, 14, 38);
      doc.text(`Delivery Date: ${po.delivery_date}`, 14, 44);
      doc.text(`Lifecycle Status: ${po.status}`, 14, 50);
      doc.text(`Payment Status: ${po.payment_status || 'Unpaid'}`, 14, 56);
      
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(12);
      doc.text('Vendor / Supplier Details', 120, 32);
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text(sup?.name || 'Unknown Vendor', 120, 38);
      doc.text(`Phone: ${sup?.phone || '-'}`, 120, 44);
      doc.text(`GSTIN: ${sup?.gstin || '-'}`, 120, 50);
      doc.text(`Address: ${sup?.address || '-'}`, 120, 56);

      const tableColumn = ["Product Name", "Qty", "Unit Price", "GST %", "Total"];
      const tableRows = po.items.map(item => {
        const prod = products.find(p => p.id === item.product_id);
        const lineTotal = item.qty * item.purchase_price;
        const tax = lineTotal * (item.gst_rate / 100);
        return [
          prod?.name || 'Unknown Product',
          item.qty.toString(),
          `Rs. ${item.purchase_price.toLocaleString()}`,
          `${item.gst_rate}%`,
          `Rs. ${(lineTotal + tax).toLocaleString()}`
        ];
      });

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 68,
        theme: 'striped',
        headStyles: { fillColor: [79, 70, 229], textColor: 255, fontSize: 10, fontStyle: 'bold' },
        bodyStyles: { fontSize: 9 },
        alternateRowStyles: { fillColor: [248, 250, 252] },
      });

      const finalY = (doc as any).lastAutoTable.finalY + 12;
      doc.setFontSize(11);
      doc.setTextColor(30, 41, 59);
      const paid = po.paid_amount || (po.payment_status === 'Paid' ? po.total_amount : 0);
      const balance = Math.max(0, po.total_amount - paid);

      doc.text(`Total Order Amount: Rs. ${po.total_amount.toLocaleString()}`, 14, finalY);
      doc.text(`Amount Paid: Rs. ${paid.toLocaleString()}`, 14, finalY + 6);
      doc.text(`Balance Outstanding: Rs. ${balance.toLocaleString()}`, 14, finalY + 12);
      
      doc.save(`${po.order_number}.pdf`);
      triggerToast('Purchase Order PDF generated.', 'success');
      dbStore.logActivity(user.id, user.name, user.role, 'Print PO', `Printed Purchase Order: ${po.order_number}`, businessId);
    } catch (err) {
      console.error(err);
      triggerToast('Failed to generate PDF.', 'error');
    }
  };

  const handlePrintVendorStatement = (sup: Supplier) => {
    try {
      const doc = new jsPDF();
      const metrics = getVendorMetrics(sup.id);

      doc.setFontSize(20);
      doc.setTextColor(30, 41, 59);
      doc.text('VENDOR PROCUREMENT STATEMENT', 14, 22);

      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text(`Vendor: ${sup.name}`, 14, 32);
      doc.text(`GSTIN: ${sup.gstin || 'N/A'}`, 14, 38);
      doc.text(`Phone: ${sup.phone} | Email: ${sup.email || 'N/A'}`, 14, 44);
      doc.text(`Address: ${sup.address}`, 14, 50);

      doc.setFontSize(11);
      doc.setTextColor(30, 41, 59);
      doc.text(`Total Spend: Rs. ${metrics.totalSpend.toLocaleString()}`, 120, 32);
      doc.text(`Total Settled: Rs. ${metrics.totalPaid.toLocaleString()}`, 120, 38);
      doc.setTextColor(225, 29, 72);
      doc.text(`Net Outstanding Dues: Rs. ${metrics.outstandingDues.toLocaleString()}`, 120, 44);

      const tableColumn = ["PO #", "Date", "Status", "Total Amount", "Paid", "Balance Due", "Payment Status"];
      const tableRows = metrics.orders.map(po => {
        const paid = po.paid_amount || (po.payment_status === 'Paid' ? po.total_amount : 0);
        const due = Math.max(0, po.total_amount - paid);
        return [
          po.order_number,
          po.order_date,
          po.status,
          `Rs. ${po.total_amount.toLocaleString()}`,
          `Rs. ${paid.toLocaleString()}`,
          `Rs. ${due.toLocaleString()}`,
          po.payment_status || 'Unpaid'
        ];
      });

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 58,
        theme: 'striped',
        headStyles: { fillColor: [15, 23, 42], textColor: 255, fontSize: 9, fontStyle: 'bold' },
        bodyStyles: { fontSize: 8 },
      });

      doc.save(`Vendor_Statement_${sup.name.replace(/\s+/g, '_')}.pdf`);
      triggerToast(`Statement for ${sup.name} downloaded successfully!`, 'success');
    } catch (err) {
      console.error(err);
      triggerToast('Failed to generate statement.', 'error');
    }
  };

  const handleExportCSV = () => {
    if (activeTab === 'orders') {
      const headers = ['PO Number', 'Vendor', 'Order Date', 'Delivery Date', 'Status', 'Payment Status', 'Total Amount', 'Paid Amount', 'Due Amount'];
      const rows = filteredPurchases.map(po => {
        const paid = po.paid_amount || (po.payment_status === 'Paid' ? po.total_amount : 0);
        const due = Math.max(0, po.total_amount - paid);
        return [
          po.order_number,
          `"${getSupplierName(po.supplier_id).replace(/"/g, '""')}"`,
          po.order_date,
          po.delivery_date,
          po.status,
          po.payment_status || 'Unpaid',
          po.total_amount,
          paid,
          due
        ];
      });
      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `Purchase_Orders_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      triggerToast('Purchase Orders exported to CSV.', 'success');
    } else {
      const headers = ['Vendor Name', 'GSTIN', 'Phone', 'Email', 'Address', 'Total Orders', 'Total Spend', 'Total Settled', 'Outstanding Dues'];
      const rows = filteredSuppliers.map(sup => {
        const m = getVendorMetrics(sup.id);
        return [
          `"${sup.name.replace(/"/g, '""')}"`,
          sup.gstin || '',
          sup.phone,
          sup.email || '',
          `"${sup.address.replace(/"/g, '""')}"`,
          m.orderCount,
          m.totalSpend,
          m.totalPaid,
          m.outstandingDues
        ];
      });
      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `Vendors_Payables_Ledger_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      triggerToast('Vendors directory exported to CSV.', 'success');
    }
  };

  // ==================== FILTERING & METRICS ====================
  const filteredPurchases = purchases.filter(po => {
    const matchesSearch = po.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      getSupplierName(po.supplier_id).toLowerCase().includes(searchQuery.toLowerCase()) ||
      po.items.some(i => getProductName(i.product_id).toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesVendor = vendorFilter === 'all' || po.supplier_id === vendorFilter;
    const matchesStatus = statusFilter === 'all' || po.status === statusFilter;
    const matchesPayment = paymentFilter === 'all' || (po.payment_status || 'Unpaid') === paymentFilter;

    return matchesSearch && matchesVendor && matchesStatus && matchesPayment;
  }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const filteredSuppliers = suppliers.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.phone.includes(searchQuery) ||
      (s.gstin && s.gstin.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (s.address && s.address.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSearch;
  }).sort((a, b) => {
    // Sort suppliers with highest dues first
    const dueA = getVendorMetrics(a.id).outstandingDues;
    const dueB = getVendorMetrics(b.id).outstandingDues;
    return dueB - dueA;
  });

  // Overall KPIs
  const totalPOAmount = purchases.reduce((sum, po) => sum + (Number(po.total_amount) || 0), 0);
  const totalPaidAmount = purchases.reduce((sum, po) => {
    if (po.payment_status === 'Paid') return sum + (Number(po.total_amount) || 0);
    if (po.payment_status === 'Partial') return sum + (Number(po.paid_amount) || 0);
    return sum;
  }, 0);
  const totalOutstandingAmount = Math.max(0, totalPOAmount - totalPaidAmount);
  const pendingDeliveries = purchases.filter(po => po.status === 'Ordered').length;

  return (
    <div className="space-y-4 max-w-full pb-8 px-0 font-sans text-slate-900 dark:text-slate-100 overflow-x-hidden animate-in fade-in duration-300">
      <PageHeader
        title="Procurement & Purchase Lifecycle"
        subtitle="Manage supplier purchase orders, edit order items, record partial & full payments, and track vendor accounts payable."
        icon={ShoppingBag}
      >
        <div className="flex flex-wrap gap-2 w-full justify-end">
          <button 
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-[10px] sm:text-[11px] font-bold cursor-pointer shadow-sm transition-all whitespace-nowrap border border-white/10"
          >
            <FileSpreadsheet size={14} className="text-emerald-400" />
            <span>Export CSV</span>
          </button>
          
          {user.role !== 'Viewer' && (
            <>
              <button 
                onClick={() => handleOpenAddVendorModal('standalone')}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] sm:text-[11px] font-bold cursor-pointer shadow-md transition-all whitespace-nowrap border border-emerald-400/30"
              >
                <Building size={14} />
                <span>+ Add Vendor</span>
              </button>

              <button 
                onClick={() => handleOpenAddModal()} 
                className="flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white rounded-xl text-[10px] sm:text-[11px] font-bold cursor-pointer shadow-md transition-all whitespace-nowrap border border-indigo-400/30"
              >
                <PlusCircle size={14} />
                <span>Create Purchase Order</span>
              </button>
            </>
          )}
        </div>
      </PageHeader>

      <div className="px-0.5 sm:px-1 space-y-4">
        {/* Advanced KPI Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-3 sm:p-4 rounded-xl shadow-xs hover:shadow-md hover:border-indigo-400 dark:hover:border-indigo-600 transition-all cursor-default group flex flex-col justify-between gap-1">
            <div className="flex items-center gap-1.5">
              <div className="p-1.5 bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-lg group-hover:scale-110 transition-transform shrink-0">
                <DollarSign size={14} />
              </div>
              <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">TOTAL SPEND</span>
            </div>
            <div className="flex flex-col gap-0.5 mt-0.5">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">Total procurement value</span>
            </div>
            <div className="text-right mt-1">
              <span className="text-xl sm:text-2xl font-black text-indigo-600 dark:text-indigo-400 tracking-tight">
                ₹{totalPOAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-3 sm:p-4 rounded-xl shadow-xs hover:shadow-md hover:border-emerald-400 dark:hover:border-emerald-600 transition-all cursor-default group flex flex-col justify-between gap-1">
            <div className="flex items-center gap-1.5">
              <div className="p-1.5 bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-lg group-hover:scale-110 transition-transform shrink-0">
                <CheckCircle2 size={14} />
              </div>
              <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">SETTLED PAYMENTS</span>
            </div>
            <div className="flex flex-col gap-0.5 mt-0.5">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">Paid to vendors</span>
            </div>
            <div className="text-right mt-1">
              <span className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
                ₹{totalPaidAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-3 sm:p-4 rounded-xl shadow-xs hover:shadow-md hover:border-amber-400 dark:hover:border-amber-600 transition-all cursor-default group flex flex-col justify-between gap-1">
            <div className="flex items-center gap-1.5">
              <div className="p-1.5 bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-lg group-hover:scale-110 transition-transform shrink-0">
                <Receipt size={14} />
              </div>
              <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">OUTSTANDING DUES</span>
            </div>
            <div className="flex flex-col gap-0.5 mt-0.5">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">Pending & part payments</span>
            </div>
            <div className="text-right mt-1">
              <span className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400 tracking-tight">
                ₹{totalOutstandingAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-3 sm:p-4 rounded-xl shadow-xs hover:shadow-md hover:border-sky-400 dark:hover:border-sky-600 transition-all cursor-default group flex flex-col justify-between gap-1">
            <div className="flex items-center gap-1.5">
              <div className="p-1.5 bg-sky-500/10 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400 rounded-lg group-hover:scale-110 transition-transform shrink-0">
                <Building size={14} />
              </div>
              <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">ACTIVE VENDORS</span>
            </div>
            <div className="flex flex-col gap-0.5 mt-0.5">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">{pendingDeliveries} inbound shipments</span>
            </div>
            <div className="text-right mt-1">
              <span className="text-xl sm:text-2xl font-black text-sky-600 dark:text-sky-400 tracking-tight">
                {suppliers.length}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pt-2">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('orders')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                activeTab === 'orders'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
            >
              <ShoppingBag size={15} />
              <span>Purchase Orders & Lifecycle</span>
              <span className="px-1.5 py-0.2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-full text-[10px] font-bold">
                {purchases.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('vendors')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                activeTab === 'vendors'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
            >
              <Building size={15} />
              <span>Vendors & Payables Ledger</span>
              <span className="px-1.5 py-0.2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-full text-[10px] font-bold">
                {suppliers.length}
              </span>
            </button>
          </div>
        </div>

        {/* Toolbar & Filter Bar */}
        <div className="flex flex-col lg:flex-row gap-2.5 items-stretch lg:items-center justify-between">
          <div className="relative flex-1 flex items-center">
            <Search size={14} className="absolute left-3 text-slate-400" />
            <input 
              type="text" 
              placeholder={activeTab === 'orders' ? "Search PO #, vendor name, or line item..." : "Search vendor by name, phone, or GSTIN..."} 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-white dark:bg-slate-900 text-xs font-medium rounded-xl border border-slate-300 dark:border-slate-700 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-400"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 text-slate-400 hover:text-slate-600">
                <X size={14} />
              </button>
            )}
          </div>

          {activeTab === 'orders' && (
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {/* Vendor Filter */}
              <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-2 py-1">
                <Building size={12} className="text-slate-400" />
                <select 
                  value={vendorFilter} 
                  onChange={(e) => setVendorFilter(e.target.value)}
                  className="bg-transparent text-xs font-semibold focus:outline-none cursor-pointer max-w-[140px] truncate"
                >
                  <option value="all">All Vendors</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              {/* Lifecycle Status Filter */}
              <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-2 py-1">
                <Truck size={12} className="text-slate-400" />
                <select 
                  value={statusFilter} 
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-transparent text-xs font-semibold focus:outline-none cursor-pointer"
                >
                  <option value="all">All Lifecycle</option>
                  <option value="Draft">Draft</option>
                  <option value="Ordered">Ordered</option>
                  <option value="Received">Received</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              {/* Payment Filter */}
              <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-2 py-1">
                <DollarSign size={12} className="text-slate-400" />
                <select 
                  value={paymentFilter} 
                  onChange={(e) => setPaymentFilter(e.target.value)}
                  className="bg-transparent text-xs font-semibold focus:outline-none cursor-pointer"
                >
                  <option value="all">All Payments</option>
                  <option value="Paid">Paid (Full)</option>
                  <option value="Partial">Part Payment</option>
                  <option value="Unpaid">Unpaid</option>
                </select>
              </div>

              {(vendorFilter !== 'all' || statusFilter !== 'all' || paymentFilter !== 'all' || searchQuery) && (
                <button
                  onClick={() => {
                    setVendorFilter('all');
                    setStatusFilter('all');
                    setPaymentFilter('all');
                    setSearchQuery('');
                  }}
                  className="px-2 py-1 text-[11px] font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg cursor-pointer transition-colors"
                >
                  Reset
                </button>
              )}
            </div>
          )}
        </div>

        {/* TAB 1: PURCHASE ORDERS */}
        {activeTab === 'orders' && (
          <div className="bg-white dark:bg-slate-900 overflow-x-auto rounded-xl border border-slate-300 dark:border-slate-700 shadow-xs mt-2">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700 text-[10px]">
                <tr>
                  <th className="py-3 px-4">PO Details</th>
                  <th className="py-3 px-4">Vendor</th>
                  <th className="py-3 px-4 text-center">Lifecycle Status</th>
                  <th className="py-3 px-4 text-center">Payment Status & Dues</th>
                  <th className="py-3 px-4 text-right">Items & Total Value</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredPurchases.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500">
                      <Store size={28} className="mx-auto mb-2 opacity-30" />
                      <p className="font-semibold text-sm">No purchase orders found.</p>
                      <p className="text-xs text-slate-400 mt-1">Try adjusting your filters or create a new purchase order.</p>
                      {user.role !== 'Viewer' && (
                        <button
                          onClick={() => handleOpenAddModal()}
                          className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 cursor-pointer shadow-sm"
                        >
                          <PlusCircle size={13} /> Create Purchase Order
                        </button>
                      )}
                    </td>
                  </tr>
                ) : (
                  filteredPurchases.map(po => {
                    const currPaid = Number(po.paid_amount) || (po.payment_status === 'Paid' ? po.total_amount : 0);
                    const balance = Math.max(0, po.total_amount - currPaid);
                    const itemsCount = po.items.length;
                    const totalQty = po.items.reduce((s, it) => s + (Number(it.qty) || 0), 0);
                    const percentPaid = po.total_amount > 0 ? Math.min(100, Math.round((currPaid / po.total_amount) * 100)) : 0;
                    
                    return (
                      <tr key={po.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="py-2.5 px-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-900 dark:text-white font-mono text-[13px]">{po.order_number}</span>
                            <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-500">
                              <span className="flex items-center gap-1"><Calendar size={10}/> Order: {po.order_date}</span>
                              <span className="flex items-center gap-1"><Truck size={10}/> Est: {po.delivery_date}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-2.5 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0">
                              <Building size={12} className="text-slate-500" />
                            </div>
                            <div className="flex flex-col">
                              <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[160px]">
                                {getSupplierName(po.supplier_id)}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                {getSupplierObj(po.supplier_id)?.phone || ''}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            po.status === 'Draft' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800' :
                            po.status === 'Ordered' ? 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400 border border-sky-200 dark:border-sky-800' :
                            po.status === 'Received' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800' :
                            'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                          }`}>
                            {po.status === 'Draft' && <Clock size={10} className="mr-1" />}
                            {po.status === 'Ordered' && <Truck size={10} className="mr-1" />}
                            {po.status === 'Received' && <CheckCircle size={10} className="mr-1" />}
                            {po.status === 'Cancelled' && <X size={10} className="mr-1" />}
                            {po.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-4">
                          <div className="flex flex-col items-center gap-1 min-w-[155px]">
                            {po.payment_status === 'Paid' ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                                <CheckCircle2 size={10} className="mr-1 text-emerald-600 dark:text-emerald-400" /> Fully Paid
                              </span>
                            ) : po.payment_status === 'Partial' ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                                <Banknote size={10} className="mr-1 text-amber-600 dark:text-amber-400" /> Part Payment
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                                <Clock size={10} className="mr-1 text-rose-600 dark:text-rose-400" /> Unpaid
                              </span>
                            )}

                            {/* Clear Paid & Pending Figures in the List */}
                            <div className="w-full bg-slate-50 dark:bg-slate-800/80 rounded-lg p-1.5 border border-slate-200 dark:border-slate-700/60 text-left space-y-0.5 mt-0.5">
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="text-slate-500 font-medium">Paid:</span>
                                <span className="font-black text-emerald-600 dark:text-emerald-400 font-mono">
                                  ₹{currPaid.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                                </span>
                              </div>
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="text-slate-500 font-medium">Pending:</span>
                                <span className={`font-black font-mono ${balance > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400'}`}>
                                  ₹{balance.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                                </span>
                              </div>

                              {/* Settlement progress bar */}
                              <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden mt-1">
                                <div 
                                  className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                                  style={{ width: `${percentPaid}%` }}
                                />
                              </div>
                              <div className="flex justify-between items-center text-[9px] text-slate-400 font-medium pt-0.5">
                                <span>{percentPaid}% settled</span>
                                <span className={balance > 0 ? 'text-rose-500 font-bold' : 'text-emerald-500 font-bold'}>
                                  {balance > 0 ? `Due: ₹${balance.toLocaleString()}` : 'Cleared'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          <div className="flex flex-col items-end">
                            <span className="font-black text-[13px] text-slate-900 dark:text-white">
                              ₹{po.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </span>
                            <span className="text-[10px] text-slate-500">
                              {itemsCount} {itemsCount === 1 ? 'item' : 'items'} ({totalQty} units)
                            </span>
                          </div>
                        </td>
                        <td className="py-2.5 px-4 text-right relative">
                          <div className="flex items-center justify-end">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveActionMenuPoId(activeActionMenuPoId === po.id ? null : po.id);
                              }}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg border border-slate-300 dark:border-slate-600 text-xs font-bold transition-all cursor-pointer shadow-xs"
                              title="Order Actions Menu"
                            >
                              <MoreVertical size={15} />
                              <span className="text-[11px]">Action</span>
                              <ChevronDown size={12} className={`transition-transform duration-200 ${activeActionMenuPoId === po.id ? 'rotate-180' : ''}`} />
                            </button>

                            {/* Dropdown Popup Menu */}
                            {activeActionMenuPoId === po.id && (
                              <>
                                {/* Transparent Backdrop for Outside Click */}
                                <div 
                                  className="fixed inset-0 z-40" 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveActionMenuPoId(null);
                                  }} 
                                />

                                <div 
                                  className="absolute right-4 top-full mt-1 z-50 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl p-1.5 animate-in fade-in zoom-in-95 duration-100 text-left"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <div className="px-2.5 py-1.5 border-b border-slate-100 dark:border-slate-800 mb-1 flex items-center justify-between">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                      PO #{po.order_number}
                                    </span>
                                    <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">
                                      {balance > 0 ? `Due: ₹${balance.toLocaleString()}` : 'Fully Paid'}
                                    </span>
                                  </div>

                                  {/* Action 1: View Details */}
                                  <button
                                    onClick={() => {
                                      setActiveActionMenuPoId(null);
                                      setViewingOrder(po);
                                    }}
                                    className="w-full flex items-center gap-2 px-2.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                                  >
                                    <Eye size={14} className="text-indigo-500" />
                                    View Summary & Details
                                  </button>

                                  {user.role !== 'Viewer' && (
                                    <>
                                      {balance > 0 ? (
                                        <>
                                          {/* Action 2: Pay Full */}
                                          <button
                                            onClick={() => {
                                              setActiveActionMenuPoId(null);
                                              handleOpenPaymentModal(po, 'full');
                                            }}
                                            className="w-full flex items-center gap-2 px-2.5 py-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg transition-colors cursor-pointer"
                                          >
                                            <CheckCircle2 size={14} className="text-emerald-600" />
                                            Pay Full (₹{balance.toLocaleString()})
                                          </button>

                                          {/* Action 3: Partial Payment */}
                                          <button
                                            onClick={() => {
                                              setActiveActionMenuPoId(null);
                                              handleOpenPaymentModal(po, 'partial');
                                            }}
                                            className="w-full flex items-center gap-2 px-2.5 py-2 text-xs font-semibold text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-lg transition-colors cursor-pointer"
                                          >
                                            <Banknote size={14} className="text-amber-500" />
                                            Partial Payment
                                          </button>
                                        </>
                                      ) : (
                                        <div className="px-2.5 py-1.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 rounded-lg my-0.5 flex items-center gap-1.5">
                                          <Check size={12} /> Payment Cleared
                                        </div>
                                      )}

                                      {/* Action 4: Edit Order & Items */}
                                      <button
                                        onClick={() => {
                                          setActiveActionMenuPoId(null);
                                          handleOpenEditPO(po);
                                        }}
                                        className="w-full flex items-center gap-2 px-2.5 py-2 text-xs font-semibold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-lg transition-colors cursor-pointer"
                                      >
                                        <Edit size={14} className="text-indigo-600" />
                                        Edit Order & Line Items
                                      </button>

                                      <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

                                      {/* Action 5: Delete Option */}
                                      <button
                                        onClick={() => {
                                          setActiveActionMenuPoId(null);
                                          setPoToDelete(po);
                                        }}
                                        className="w-full flex items-center gap-2 px-2.5 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                                      >
                                        <Trash2 size={14} className="text-rose-500" />
                                        Delete Purchase Order
                                      </button>
                                    </>
                                  )}
                                </div>
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
        )}

        {/* TAB 2: VENDORS & PAYABLES LEDGER */}
        {activeTab === 'vendors' && (
          <div className="space-y-3">
            <div className="bg-white dark:bg-slate-900 overflow-x-auto rounded-xl border border-slate-300 dark:border-slate-700 shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700 text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Vendor Name & Contact</th>
                    <th className="py-3 px-4">GSTIN & Address</th>
                    <th className="py-3 px-4 text-center">Orders Placed</th>
                    <th className="py-3 px-4 text-right">Total Purchases</th>
                    <th className="py-3 px-4 text-right">Settled Amount</th>
                    <th className="py-3 px-4 text-right">Outstanding Dues</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredSuppliers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-500">
                        <Building size={28} className="mx-auto mb-2 opacity-30" />
                        <p className="font-semibold text-sm">No vendors found.</p>
                        <p className="text-xs text-slate-400 mt-1">Register suppliers to begin managing procurement and payables.</p>
                        {user.role !== 'Viewer' && (
                          <button
                            onClick={() => handleOpenAddVendorModal('standalone')}
                            className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 cursor-pointer shadow-sm"
                          >
                            <Building size={13} /> + Add First Vendor
                          </button>
                        )}
                      </td>
                    </tr>
                  ) : (
                    filteredSuppliers.map(sup => {
                      const m = getVendorMetrics(sup.id);
                      return (
                        <tr key={sup.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center shrink-0">
                                <Building size={14} className="text-indigo-600 dark:text-indigo-400" />
                              </div>
                              <div className="flex flex-col">
                                <span className="font-bold text-slate-900 dark:text-white text-xs">{sup.name}</span>
                                <span className="text-[10px] text-slate-500 flex items-center gap-1">
                                  <Phone size={10} /> {sup.phone}
                                </span>
                                {sup.email && (
                                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                    <Mail size={10} /> {sup.email}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex flex-col max-w-[200px]">
                              {sup.gstin ? (
                                <span className="text-[10px] font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-1.5 py-0.5 rounded border border-indigo-200 dark:border-indigo-800 w-fit mb-0.5">
                                  {sup.gstin}
                                </span>
                              ) : (
                                <span className="text-[10px] text-slate-400 italic">No GSTIN</span>
                              )}
                              <span className="text-[10px] text-slate-500 truncate" title={sup.address}>
                                {sup.address || 'No address specified'}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="inline-flex flex-col items-center">
                              <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                                {m.orderCount}
                              </span>
                              {m.unpaidCount > 0 && (
                                <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-1.5 py-0.2 rounded-full border border-amber-200 dark:border-amber-800">
                                  {m.unpaidCount} unpaid/partial
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right font-black text-slate-800 dark:text-slate-200">
                            ₹{m.totalSpend.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-3 px-4 text-right font-black text-emerald-600 dark:text-emerald-400">
                            ₹{m.totalPaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-3 px-4 text-right">
                            {m.outstandingDues > 0 ? (
                              <div className="flex flex-col items-end">
                                <span className="font-black text-rose-600 dark:text-rose-400 text-xs">
                                  ₹{m.outstandingDues.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </span>
                                <span className="text-[9px] text-rose-500 uppercase font-bold">Payable Due</span>
                              </div>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                                <Check size={10} /> Cleared
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5 flex-wrap">
                              {user.role !== 'Viewer' && (
                                <>
                                  {m.outstandingDues > 0 && (
                                    <>
                                      <button
                                        onClick={() => handlePayVendorOldestDue(sup.id, 'full')}
                                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-600 text-white hover:bg-emerald-700 rounded text-[11px] font-bold transition-colors cursor-pointer shadow-xs"
                                        title="Record full payment against oldest outstanding purchase order"
                                      >
                                        <CheckCircle2 size={11} /> Pay Due
                                      </button>
                                      <button
                                        onClick={() => handlePayVendorOldestDue(sup.id, 'partial')}
                                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-500 text-white hover:bg-amber-600 rounded text-[11px] font-bold transition-colors cursor-pointer shadow-xs"
                                        title="Record partial payment against oldest outstanding purchase order"
                                      >
                                        <Banknote size={11} /> Part Pay
                                      </button>
                                    </>
                                  )}

                                  <button
                                    onClick={() => handleOpenAddModal(sup.id)}
                                    className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 rounded text-[11px] font-bold transition-colors cursor-pointer"
                                    title="Create Purchase Order for this vendor"
                                  >
                                    <PlusCircle size={12} /> PO
                                  </button>
                                </>
                              )}

                              <button
                                onClick={() => setViewingVendorLedger(sup)}
                                className="inline-flex items-center gap-1 px-2 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded hover:bg-slate-50 text-[11px] font-bold transition-colors cursor-pointer"
                                title="View vendor summary, order history & payments"
                              >
                                <Eye size={12} /> Ledger
                              </button>

                              <button
                                onClick={() => handlePrintVendorStatement(sup)}
                                className="inline-flex items-center gap-1 px-2 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded hover:bg-slate-50 text-[11px] font-bold transition-colors cursor-pointer"
                                title="Print / Download PDF Statement"
                              >
                                <Printer size={12} />
                              </button>

                              {user.role !== 'Viewer' && (
                                <>
                                  <button
                                    onClick={() => handleOpenEditVendorModal(sup)}
                                    className="p-1 text-slate-400 hover:text-indigo-600 rounded hover:bg-indigo-50 dark:hover:bg-indigo-950/30 cursor-pointer"
                                    title="Edit Vendor"
                                  >
                                    <Edit size={14} />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteVendor(sup.id, sup.name)}
                                    className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer"
                                    title="Delete Vendor"
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
        )}
      </div>

      {/* ==================== MODAL: EDIT PURCHASE ORDER & ORDER ITEMS ==================== */}
      {editingOrder && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800">
            {/* Header */}
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-400/30">
                  <Edit size={16} />
                </div>
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-wider">Edit Purchase Order & Order Items</h2>
                  <p className="text-[10px] text-slate-400 font-mono">Order Number: {editingOrder.order_number}</p>
                </div>
              </div>
              <button 
                onClick={() => setEditingOrder(null)} 
                className="text-slate-400 hover:text-white transition-colors cursor-pointer p-1 rounded-full hover:bg-white/10"
              >
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto bg-slate-50 dark:bg-slate-900/50 flex-1 space-y-6">
              {/* Order Meta details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Vendor *</label>
                    <button 
                      type="button" 
                      onClick={() => handleOpenAddVendorModal('edit_po')} 
                      className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                    >
                      + Add New Vendor
                    </button>
                  </div>
                  <select 
                    value={editSupplierId} 
                    onChange={(e) => setEditSupplierId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-600 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                  >
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.name} - {s.phone}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Expected Delivery Date</label>
                  <input 
                    type="date" 
                    value={editDeliveryDate} 
                    onChange={(e) => setEditDeliveryDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 text-xs font-semibold font-mono rounded-lg border border-slate-300 dark:border-slate-600 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Lifecycle Status</label>
                  <select 
                    value={editStatus} 
                    onChange={(e) => setEditStatus(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-600 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="Draft">Draft</option>
                    <option value="Ordered">Ordered (In Transit / Pending)</option>
                    <option value="Received">Received (Goods In Stock)</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              {/* Order Items Table & Live Editor */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Package size={14} className="text-indigo-600" /> Order Items ({editItems.length})
                  </h3>
                  <span className="text-[11px] text-slate-500">Edit quantities, rates, and tax. Totals recalculate instantly.</span>
                </div>

                {/* Add Line Item Row */}
                <div className="flex flex-wrap md:flex-nowrap items-end gap-3 bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
                  <div className="flex-[2.5] min-w-[320px] md:min-w-[400px] space-y-1">
                    <label className="text-[10px] font-semibold text-slate-500">Add Product *</label>
                    <SearchableProductSelect 
                      products={products}
                      selectedProductId={editRowProductId}
                      onSelectProduct={(prod) => {
                        if (prod) {
                          setEditRowProductId(prod.id);
                          setEditRowPrice(prod.purchase_price ?? 0);
                          setEditRowGst(prod.gst_rate ?? 0);
                        } else {
                          setEditRowProductId('');
                          setEditRowPrice(0);
                          setEditRowGst(0);
                        }
                      }}
                      placeholder="-- Search or choose product to add --"
                    />
                  </div>
                  <div className="w-24 space-y-1">
                    <label className="text-[10px] font-semibold text-slate-500">Qty</label>
                    <input 
                      type="number" 
                      min="1"
                      value={editRowQty}
                      onChange={(e) => setEditRowQty(parseInt(e.target.value) || 1)}
                      className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-900 text-xs rounded border border-slate-300 dark:border-slate-600 text-right"
                    />
                  </div>
                  <div className="w-28 space-y-1">
                    <label className="text-[10px] font-semibold text-slate-500">Unit Price (₹)</label>
                    <input 
                      type="number" 
                      min="0"
                      value={editRowPrice}
                      onChange={(e) => setEditRowPrice(parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-900 text-xs rounded border border-slate-300 dark:border-slate-600 text-right"
                    />
                  </div>
                  <div className="w-20 space-y-1">
                    <label className="text-[10px] font-semibold text-slate-500">GST %</label>
                    <input 
                      type="number" 
                      min="0"
                      value={editRowGst}
                      onChange={(e) => setEditRowGst(parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-900 text-xs rounded border border-slate-300 dark:border-slate-600 text-right"
                    />
                  </div>
                  <button 
                    type="button"
                    onClick={handleAddEditRowItem}
                    className="px-4 py-1.5 h-[34px] bg-indigo-600 text-white text-xs font-bold rounded cursor-pointer hover:bg-indigo-700 transition-colors shadow-xs"
                  >
                    + Add Item
                  </button>
                </div>

                {/* Items Editable Table */}
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="py-2.5 px-4">Product Name</th>
                        <th className="py-2.5 px-3 text-right">Order Qty</th>
                        <th className="py-2.5 px-3 text-right">Unit Rate (₹)</th>
                        <th className="py-2.5 px-3 text-right">GST Rate</th>
                        <th className="py-2.5 px-4 text-right">Line Total</th>
                        <th className="py-2.5 px-3 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                      {editItems.map((item, idx) => {
                        const lineBase = (item.qty || 0) * (item.purchase_price || 0);
                        const lineTax = lineBase * ((item.gst_rate || 0) / 100);
                        const lineTotal = lineBase + lineTax;

                        return (
                          <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                            <td className="py-2.5 px-4">
                              <div className="flex flex-col">
                                <span className="font-semibold text-slate-800 dark:text-slate-200">{getProductName(item.product_id)}</span>
                                <span className="text-[10px] text-slate-400 font-mono">{getProductSku(item.product_id)}</span>
                              </div>
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <input 
                                type="number" 
                                min="1" 
                                value={item.qty} 
                                onChange={(e) => {
                                  const val = Math.max(1, parseInt(e.target.value) || 1);
                                  const updated = [...editItems];
                                  updated[idx].qty = val;
                                  setEditItems(updated);
                                }}
                                className="w-20 px-2 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded text-xs text-right font-bold"
                              />
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <span className="text-slate-400">₹</span>
                                <input 
                                  type="number" 
                                  min="0" 
                                  value={item.purchase_price} 
                                  onChange={(e) => {
                                    const val = Math.max(0, parseFloat(e.target.value) || 0);
                                    const updated = [...editItems];
                                    updated[idx].purchase_price = val;
                                    setEditItems(updated);
                                  }}
                                  className="w-24 px-2 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded text-xs text-right font-semibold"
                                />
                              </div>
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <input 
                                  type="number" 
                                  min="0" 
                                  value={item.gst_rate} 
                                  onChange={(e) => {
                                    const val = Math.max(0, parseFloat(e.target.value) || 0);
                                    const updated = [...editItems];
                                    updated[idx].gst_rate = val;
                                    setEditItems(updated);
                                  }}
                                  className="w-16 px-2 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded text-xs text-right"
                                />
                                <span className="text-slate-500">%</span>
                              </div>
                            </td>
                            <td className="py-2.5 px-4 text-right font-black text-indigo-600 dark:text-indigo-400">
                              ₹{lineTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <button 
                                type="button"
                                onClick={() => handleRemoveEditItem(item.product_id)}
                                className="p-1 text-slate-400 hover:text-rose-500 rounded hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer"
                                title="Remove Line Item"
                              >
                                <X size={14} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-slate-50 dark:bg-slate-900 font-bold border-t border-slate-200 dark:border-slate-700">
                      <tr>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-400 uppercase text-[10px]">Total Order Quantity:</td>
                        <td className="py-3 px-3 text-right text-slate-900 dark:text-white font-black">
                          {editItems.reduce((s, it) => s + (it.qty || 0), 0)}
                        </td>
                        <td colSpan={2} className="py-3 px-4 text-right text-slate-600 dark:text-slate-400 uppercase text-[10px]">
                          Grand Total PO Value:
                        </td>
                        <td className="py-3 px-4 text-right font-black text-sm text-indigo-600 dark:text-indigo-400">
                          ₹{editItems.reduce((sum, i) => {
                            const b = (i.qty || 0) * (i.purchase_price || 0);
                            return sum + (b * (1 + (i.gst_rate || 0)/100));
                          }, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Payment Adjustment Setup Section */}
              <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center justify-between">
                  <span className="flex items-center gap-1.5"><CreditCard size={14} className="text-emerald-600" /> Payment Status & Amount Adjustment</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                    editPaymentStatus === 'Paid' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                    editPaymentStatus === 'Partial' ? 'bg-amber-100 text-amber-800 border-amber-300' :
                    'bg-rose-100 text-rose-800 border-rose-300'
                  }`}>
                    {editPaymentStatus}
                  </span>
                </h3>

                {(() => {
                  const newTotal = editItems.reduce((sum, i) => {
                    const b = (i.qty || 0) * (i.purchase_price || 0);
                    return sum + (b * (1 + (i.gst_rate || 0)/100));
                  }, 0);
                  const effectivePaid = editPaymentStatus === 'Paid' ? newTotal : editPaymentStatus === 'Unpaid' ? 0 : Math.min(newTotal, Math.max(0, editPaidAmount));
                  const newBalance = Math.max(0, newTotal - effectivePaid);

                  return (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Payment Status *</label>
                          <select
                            value={editPaymentStatus}
                            onChange={(e) => {
                              const st = e.target.value as 'Unpaid' | 'Partial' | 'Paid';
                              setEditPaymentStatus(st);
                              if (st === 'Paid') setEditPaidAmount(newTotal);
                              else if (st === 'Unpaid') setEditPaidAmount(0);
                              else if (editPaidAmount === 0 && newTotal > 0) setEditPaidAmount(Math.round(newTotal * 0.5));
                            }}
                            className="w-full px-3 py-2 bg-white dark:bg-slate-900 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-600 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                          >
                            <option value="Unpaid">Unpaid (Full Credit)</option>
                            <option value="Partial">Part Payment (Partial)</option>
                            <option value="Paid">Payment Done (Fully Paid)</option>
                          </select>
                        </div>

                        {editPaymentStatus === 'Partial' && (
                          <div className="space-y-1 md:col-span-2">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex justify-between">
                              <span>Paid Amount (₹) *</span>
                              <span className="text-slate-400 font-normal">Select preset or type amount</span>
                            </label>
                            
                            {/* Percentage Presets for Partial Payment */}
                            <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                              <button
                                type="button"
                                onClick={() => setEditPaidAmount(Math.round(newTotal * 0.10))}
                                className="px-2 py-0.5 text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 rounded border border-indigo-200 dark:border-indigo-800 transition-colors cursor-pointer"
                              >
                                10% Advance
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditPaidAmount(Math.round(newTotal * 0.25))}
                                className="px-2 py-0.5 text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 rounded border border-indigo-200 dark:border-indigo-800 transition-colors cursor-pointer"
                              >
                                25%
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditPaidAmount(Math.round(newTotal * 0.3333))}
                                className="px-2 py-0.5 text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 rounded border border-indigo-200 dark:border-indigo-800 transition-colors cursor-pointer"
                              >
                                33%
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditPaidAmount(Math.round(newTotal * 0.50))}
                                className="px-2 py-0.5 text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 rounded border border-indigo-200 dark:border-indigo-800 transition-colors cursor-pointer"
                              >
                                50% Half
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditPaidAmount(Math.round(newTotal * 0.75))}
                                className="px-2 py-0.5 text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 rounded border border-indigo-200 dark:border-indigo-800 transition-colors cursor-pointer"
                              >
                                75%
                              </button>
                            </div>

                            <input
                              type="number"
                              min="0"
                              max={newTotal}
                              value={editPaidAmount}
                              onChange={(e) => setEditPaidAmount(parseFloat(e.target.value) || 0)}
                              className="w-full px-3 py-2 bg-white dark:bg-slate-900 text-xs font-bold font-mono rounded-lg border border-slate-300 dark:border-slate-600"
                              placeholder="e.g. 5000"
                            />
                          </div>
                        )}

                        {editPaymentStatus !== 'Unpaid' && (
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Payment Mode *</label>
                            <select
                              value={editPaymentMode}
                              onChange={(e) => setEditPaymentMode(e.target.value)}
                              className="w-full px-3 py-2 bg-white dark:bg-slate-900 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-600"
                            >
                              <option value="Cash">Cash</option>
                              <option value="UPI">UPI / QR Code</option>
                              <option value="Bank Transfer">Bank Transfer / NEFT</option>
                              <option value="Cheque">Cheque</option>
                              <option value="Credit Card">Credit / Debit Card</option>
                              <option value="Other">Other Mode</option>
                            </select>
                          </div>
                        )}

                        {editPaymentStatus === 'Partial' && (
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Next Due Date</label>
                            <input
                              type="date"
                              value={editDueDate}
                              onChange={(e) => setEditDueDate(e.target.value)}
                              className="w-full px-3 py-2 bg-white dark:bg-slate-900 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-600"
                            />
                          </div>
                        )}
                      </div>

                      {editPaymentStatus !== 'Unpaid' && (
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Payment Reference / Notes</label>
                          <input
                            type="text"
                            value={editPaymentNotes}
                            onChange={(e) => setEditPaymentNotes(e.target.value)}
                            placeholder="e.g. Updated settlement notes"
                            className="w-full px-3 py-2 bg-white dark:bg-slate-900 text-xs rounded-lg border border-slate-300 dark:border-slate-600"
                          />
                        </div>
                      )}

                      {/* Recalculation Summary Banner */}
                      <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700/80 flex flex-wrap items-center justify-between text-xs gap-2">
                        <div className="flex items-center gap-4">
                          <div>
                            <span className="text-slate-400 text-[10px] uppercase font-bold block">New Order Total</span>
                            <span className="font-black font-mono text-slate-800 dark:text-slate-200">₹{newTotal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 text-[10px] uppercase font-bold block">Total Paid</span>
                            <span className="font-black font-mono text-emerald-600 dark:text-emerald-400">₹{effectivePaid.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 text-[10px] uppercase font-bold block">Remaining Due</span>
                            <span className={`font-black font-mono ${newBalance > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400'}`}>
                              ₹{newBalance.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold text-slate-500">
                            {newTotal > 0 ? Math.round((effectivePaid / newTotal) * 100) : 0}% Settled
                          </span>
                          <div className="w-16 bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                            <div 
                              className="bg-emerald-500 h-full transition-all duration-300" 
                              style={{ width: `${newTotal > 0 ? Math.min(100, (effectivePaid / newTotal) * 100) : 0}%` }} 
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Footer */}
            <div className="bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 px-6 py-4 flex justify-between items-center shrink-0">
              <button 
                type="button" 
                onClick={() => setEditingOrder(null)}
                className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold hover:bg-slate-50 cursor-pointer transition-colors shadow-xs"
              >
                Cancel
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDeletePO(editingOrder)}
                  className="px-3 py-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-bold rounded-lg cursor-pointer transition-colors"
                >
                  Delete PO
                </button>
                <button 
                  onClick={handleSaveEditedPO}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 cursor-pointer shadow-md transition-colors flex items-center gap-1.5"
                >
                  <Check size={14} /> Save All Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODAL: ADD / EDIT VENDOR ==================== */}
      {isVendorModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Building size={16} className="text-emerald-400" />
                <h2 className="text-sm font-bold uppercase tracking-wider">
                  {editingVendor ? 'Edit Vendor Profile' : 'Register New Vendor / Supplier'}
                </h2>
              </div>
              <button 
                onClick={() => setIsVendorModalOpen(false)} 
                className="text-slate-400 hover:text-white cursor-pointer p-1"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveVendor} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Vendor / Company Name *</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Kokan Organic Spices & Cashews"
                  value={vendorFormName}
                  onChange={(e) => setVendorFormName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-600 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Phone / Mobile (10 Digits) *</label>
                  <input 
                    type="tel" 
                    required
                    maxLength={10}
                    placeholder="e.g. 9820123456"
                    value={vendorFormPhone}
                    onChange={(e) => setVendorFormPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 text-xs font-mono font-medium rounded-lg border border-slate-300 dark:border-slate-600 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">GSTIN Number</label>
                  <input 
                    type="text" 
                    maxLength={15}
                    placeholder="e.g. 27AAAAA0000A1Z5"
                    value={vendorFormGstin}
                    onChange={(e) => setVendorFormGstin(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 text-xs font-mono uppercase rounded-lg border border-slate-300 dark:border-slate-600 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Email Address</label>
                <input 
                  type="email" 
                  placeholder="e.g. billing@vendor.com"
                  value={vendorFormEmail}
                  onChange={(e) => setVendorFormEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 text-xs rounded-lg border border-slate-300 dark:border-slate-600 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Address / Warehouse Location *</label>
                <textarea 
                  rows={2}
                  required
                  placeholder="Plot 4, MIDC Industrial Area, Ratnagiri..."
                  value={vendorFormAddress}
                  onChange={(e) => setVendorFormAddress(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 text-xs rounded-lg border border-slate-300 dark:border-slate-600 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsVendorModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold hover:bg-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold cursor-pointer shadow-md transition-colors flex items-center gap-1.5"
                >
                  <Check size={14} /> {editingVendor ? 'Update Vendor' : 'Save Vendor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL: VENDOR LEDGER & SUMMARY ==================== */}
      {viewingVendorLedger && (() => {
        const metrics = getVendorMetrics(viewingVendorLedger.id);
        return (
          <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800">
              <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-400/30">
                    <Building size={18} />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold uppercase tracking-wider">{viewingVendorLedger.name}</h2>
                    <p className="text-[10px] text-slate-400">Vendor Procurement Summary & Ledger</p>
                  </div>
                </div>
                <button 
                  onClick={() => setViewingVendorLedger(null)} 
                  className="text-slate-400 hover:text-white cursor-pointer p-1"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 overflow-y-auto bg-slate-50 dark:bg-slate-900/50 flex-1 space-y-6">
                {/* Vendor Summary Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                    <p className="text-[10px] font-bold text-slate-500 uppercase">Total Orders</p>
                    <p className="text-lg font-black text-slate-900 dark:text-white mt-1">{metrics.orderCount}</p>
                  </div>
                  <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                    <p className="text-[10px] font-bold text-slate-500 uppercase">Total Spend</p>
                    <p className="text-lg font-black text-indigo-600 dark:text-indigo-400 mt-1">₹{metrics.totalSpend.toLocaleString()}</p>
                  </div>
                  <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                    <p className="text-[10px] font-bold text-slate-500 uppercase">Settled Payments</p>
                    <p className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-1">₹{metrics.totalPaid.toLocaleString()}</p>
                  </div>
                  <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                    <p className="text-[10px] font-bold text-slate-500 uppercase">Outstanding Dues</p>
                    <p className="text-lg font-black text-rose-600 dark:text-rose-400 mt-1">₹{metrics.outstandingDues.toLocaleString()}</p>
                  </div>
                </div>

                {/* Vendor Info Box */}
                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-4 text-xs">
                  <div className="space-y-1">
                    <p><span className="text-slate-500 font-semibold">Phone:</span> <span className="font-mono font-bold text-slate-900 dark:text-white">{viewingVendorLedger.phone}</span></p>
                    <p><span className="text-slate-500 font-semibold">Email:</span> <span>{viewingVendorLedger.email || 'N/A'}</span></p>
                  </div>
                  <div className="space-y-1">
                    <p><span className="text-slate-500 font-semibold">GSTIN:</span> <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{viewingVendorLedger.gstin || 'Unregistered'}</span></p>
                    <p><span className="text-slate-500 font-semibold">Address:</span> <span className="text-slate-700 dark:text-slate-300">{viewingVendorLedger.address}</span></p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handlePrintVendorStatement(viewingVendorLedger)}
                      className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Printer size={13} /> Statement PDF
                    </button>
                    {user.role !== 'Viewer' && metrics.outstandingDues > 0 && (
                      <button
                        onClick={() => {
                          setViewingVendorLedger(null);
                          handlePayVendorOldestDue(viewingVendorLedger.id);
                        }}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
                      >
                        <DollarSign size={13} /> Record Payment
                      </button>
                    )}
                  </div>
                </div>

                {/* Orders under this vendor */}
                <div>
                  <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                    Purchase Orders under this Vendor ({metrics.orders.length})
                  </h3>
                  <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xs">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 text-[10px] uppercase font-bold text-slate-600 dark:text-slate-400">
                        <tr>
                          <th className="py-2.5 px-4">PO #</th>
                          <th className="py-2.5 px-3">Date</th>
                          <th className="py-2.5 px-3 text-center">Status</th>
                          <th className="py-2.5 px-3 text-center">Payment</th>
                          <th className="py-2.5 px-3 text-right">Order Value</th>
                          <th className="py-2.5 px-3 text-right">Balance Due</th>
                          <th className="py-2.5 px-4 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                        {metrics.orders.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="py-6 text-center text-slate-500">
                              No purchase orders created for this vendor yet.
                            </td>
                          </tr>
                        ) : (
                          metrics.orders.map(po => {
                            const paid = po.paid_amount || (po.payment_status === 'Paid' ? po.total_amount : 0);
                            const due = Math.max(0, po.total_amount - paid);
                            return (
                              <tr key={po.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                                <td className="py-2.5 px-4 font-mono font-bold text-slate-900 dark:text-white">
                                  {po.order_number}
                                </td>
                                <td className="py-2.5 px-3 text-slate-500">{po.order_date}</td>
                                <td className="py-2.5 px-3 text-center">
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 dark:bg-slate-800">
                                    {po.status}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 text-center">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                    po.payment_status === 'Paid' ? 'bg-emerald-100 text-emerald-800' :
                                    po.payment_status === 'Partial' ? 'bg-amber-100 text-amber-800' :
                                    'bg-rose-100 text-rose-800'
                                  }`}>
                                    {po.payment_status || 'Unpaid'}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 text-right font-black">₹{po.total_amount.toLocaleString()}</td>
                                <td className="py-2.5 px-3 text-right font-black text-rose-600">₹{due.toLocaleString()}</td>
                                <td className="py-2.5 px-4 text-right relative">
                                  <div className="flex items-center justify-end">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setActiveActionMenuPoId(activeActionMenuPoId === po.id ? null : po.id);
                                      }}
                                      className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded text-[10px] font-bold cursor-pointer"
                                    >
                                      <MoreVertical size={13} />
                                      Action
                                      <ChevronDown size={10} className={`transition-transform duration-200 ${activeActionMenuPoId === po.id ? 'rotate-180' : ''}`} />
                                    </button>

                                    {activeActionMenuPoId === po.id && (
                                      <>
                                        <div 
                                          className="fixed inset-0 z-40" 
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setActiveActionMenuPoId(null);
                                          }} 
                                        />
                                        <div 
                                          className="absolute right-4 top-full mt-1 z-50 w-52 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl p-1.5 animate-in fade-in zoom-in-95 duration-100 text-left"
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          <button
                                            onClick={() => {
                                              setActiveActionMenuPoId(null);
                                              setViewingVendorLedger(null);
                                              setViewingOrder(po);
                                            }}
                                            className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
                                          >
                                            <Eye size={13} className="text-indigo-500" /> View Details
                                          </button>

                                          {user.role !== 'Viewer' && (
                                            <>
                                              {due > 0 && (
                                                <button
                                                  onClick={() => {
                                                    setActiveActionMenuPoId(null);
                                                    setViewingVendorLedger(null);
                                                    handleOpenPaymentModal(po, 'partial');
                                                  }}
                                                  className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg cursor-pointer"
                                                >
                                                  <Banknote size={13} className="text-emerald-500" /> Record Payment
                                                </button>
                                              )}

                                              <button
                                                onClick={() => {
                                                  setActiveActionMenuPoId(null);
                                                  setViewingVendorLedger(null);
                                                  handleOpenEditPO(po);
                                                }}
                                                className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-lg cursor-pointer"
                                              >
                                                <Edit size={13} className="text-indigo-600" /> Edit Order Items
                                              </button>

                                              <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

                                              <button
                                                onClick={() => {
                                                  setActiveActionMenuPoId(null);
                                                  setViewingVendorLedger(null);
                                                  setPoToDelete(po);
                                                }}
                                                className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg cursor-pointer"
                                              >
                                                <Trash2 size={13} className="text-rose-500" /> Delete Order
                                              </button>
                                            </>
                                          )}
                                        </div>
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
              </div>
            </div>
          </div>
        );
      })()}

      {/* ==================== MODAL: VIEW PO DETAILS ==================== */}
      {viewingOrder && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                  <Package size={16} className="text-white" />
                </div>
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-wider">Purchase Order Overview</h2>
                  <p className="text-[10px] text-slate-400 font-mono">{viewingOrder.order_number}</p>
                </div>
              </div>
              <button onClick={() => setViewingOrder(null)} className="text-slate-400 hover:text-white transition-colors cursor-pointer p-1">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto bg-slate-50 dark:bg-slate-900/50 flex-1 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-6">
                
                {/* Items Table */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Line Items ({viewingOrder.items.length})</h3>
                    {user.role !== 'Viewer' && (
                      <button
                        onClick={() => {
                          const poToEdit = viewingOrder;
                          setViewingOrder(null);
                          handleOpenEditPO(poToEdit);
                        }}
                        className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Edit size={12} /> Edit Order Items
                      </button>
                    )}
                  </div>

                  <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xs">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
                          <th className="py-2.5 px-4 font-bold text-slate-600 dark:text-slate-400">Product</th>
                          <th className="py-2.5 px-4 font-bold text-slate-600 dark:text-slate-400 text-right">Qty</th>
                          <th className="py-2.5 px-4 font-bold text-slate-600 dark:text-slate-400 text-right">Price</th>
                          <th className="py-2.5 px-4 font-bold text-slate-600 dark:text-slate-400 text-right">Tax</th>
                          <th className="py-2.5 px-4 font-bold text-slate-600 dark:text-slate-400 text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                        {viewingOrder.items.map((item, idx) => {
                          const lineBase = item.qty * item.purchase_price;
                          const lineTax = lineBase * (item.gst_rate / 100);
                          return (
                            <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                              <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">{getProductName(item.product_id)}</td>
                              <td className="py-3 px-4 text-right font-black text-slate-900 dark:text-white">{item.qty}</td>
                              <td className="py-3 px-4 text-right">₹{item.purchase_price.toLocaleString()}</td>
                              <td className="py-3 px-4 text-right text-[10px] text-slate-500">{item.gst_rate}%</td>
                              <td className="py-3 px-4 text-right font-bold text-indigo-600 dark:text-indigo-400">₹{(lineBase + lineTax).toLocaleString(undefined, {minimumFractionDigits:2})}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot className="bg-slate-100 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700">
                        <tr>
                          <td className="py-2.5 px-4 font-bold text-slate-600 dark:text-slate-400">Total</td>
                          <td className="py-2.5 px-4 text-right font-black text-slate-900 dark:text-white">
                            {viewingOrder.items.reduce((sum, item) => sum + item.qty, 0)}
                          </td>
                          <td colSpan={2}></td>
                          <td className="py-2.5 px-4 text-right font-bold text-indigo-600 dark:text-indigo-400">
                            ₹{viewingOrder.total_amount.toLocaleString(undefined, {minimumFractionDigits:2})}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                {/* Payment History Log */}
                <div>
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <History size={13} className="text-emerald-600" /> Payment History & Receipts
                  </h3>
                  <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xs">
                    {viewingOrder.payment_history && viewingOrder.payment_history.length > 0 ? (
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 text-[10px] uppercase font-bold text-slate-500">
                          <tr>
                            <th className="py-2 px-3">Receipt #</th>
                            <th className="py-2 px-3">Date</th>
                            <th className="py-2 px-3">Mode</th>
                            <th className="py-2 px-3 text-right">Amount</th>
                            <th className="py-2 px-3">Ref / Notes</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                          {viewingOrder.payment_history.map(rc => (
                            <tr key={rc.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                              <td className="py-2 px-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">{rc.receipt_number}</td>
                              <td className="py-2 px-3 text-slate-500">{rc.payment_date}</td>
                              <td className="py-2 px-3">{rc.payment_mode}</td>
                              <td className="py-2 px-3 text-right font-black text-emerald-600">₹{rc.amount.toLocaleString()}</td>
                              <td className="py-2 px-3 text-slate-500 text-[11px] truncate max-w-[120px]">{rc.reference_no || rc.notes || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div className="p-4 text-center text-slate-500 text-xs">
                        No installment receipts recorded yet for this order.
                      </div>
                    )}
                  </div>
                </div>

                {/* Status Transitions */}
                {user.role !== 'Viewer' && viewingOrder.status !== 'Received' && viewingOrder.status !== 'Cancelled' && (
                  <div className="bg-indigo-50/50 dark:bg-indigo-900/10 rounded-xl p-4 border border-indigo-100 dark:border-indigo-900/30 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-indigo-900 dark:text-indigo-300 uppercase tracking-wider flex items-center gap-1.5"><ArrowRight size={14}/> Advance Lifecycle Status</h4>
                      <p className="text-[11px] text-indigo-700 dark:text-indigo-400 mt-1">Move this PO to the next stage in procurement.</p>
                    </div>
                    <div className="flex gap-2">
                      {viewingOrder.status === 'Draft' && (
                        <button 
                          onClick={() => handleUpdateStatus(viewingOrder.id, 'Ordered')}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg cursor-pointer transition-colors shadow-sm"
                        >
                          Mark as Ordered
                        </button>
                      )}
                      {viewingOrder.status === 'Ordered' && (
                        <button 
                          onClick={() => {
                            const hasAutoConversion = viewingOrder.items.some(item => {
                              const prod = products.find(p => p.id === item.product_id);
                              return prod && prod.auto_conversion;
                            });
                            
                            if (hasAutoConversion) {
                              setOrderToReceive(viewingOrder);
                            } else {
                              if (window.confirm('Receiving this PO will automatically increase inventory stock in the ledger. Proceed?')) {
                                handleUpdateStatus(viewingOrder.id, 'Received');
                              }
                            }
                          }}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg cursor-pointer transition-colors shadow-sm flex items-center gap-1.5"
                        >
                          <CheckCircle size={14} /> Receive Goods
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Sidebar Info */}
              <div className="space-y-4">
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm">
                  <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3">Order Summary</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-700/50">
                      <span className="text-xs text-slate-600 dark:text-slate-400">Status</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        viewingOrder.status === 'Draft' ? 'bg-amber-100 text-amber-700' :
                        viewingOrder.status === 'Ordered' ? 'bg-sky-100 text-sky-700' :
                        viewingOrder.status === 'Received' ? 'bg-emerald-100 text-emerald-700' :
                        'bg-rose-100 text-rose-700'
                      }`}>
                        {viewingOrder.status}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-700/50">
                      <span className="text-xs text-slate-600 dark:text-slate-400">Total Value</span>
                      <span className="text-sm font-black text-slate-900 dark:text-white">₹{viewingOrder.total_amount.toLocaleString(undefined, {minimumFractionDigits:2})}</span>
                    </div>
                    <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-700/50">
                      <span className="text-xs text-slate-600 dark:text-slate-400">Vendor</span>
                      <span className="text-xs font-semibold text-slate-900 dark:text-white truncate max-w-[120px]">{getSupplierName(viewingOrder.supplier_id)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-600 dark:text-slate-400">Est. Delivery</span>
                      <span className="text-xs font-mono text-slate-900 dark:text-white">{viewingOrder.delivery_date}</span>
                    </div>
                  </div>
                </div>

                {/* Payment & Settlement Card */}
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      <CreditCard size={12} className="text-emerald-600" /> Payment & Settlement
                    </h3>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      viewingOrder.payment_status === 'Paid' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                      viewingOrder.payment_status === 'Partial' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                      'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                    }`}>
                      {viewingOrder.payment_status || 'Unpaid'}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-700/50">
                      <span className="text-slate-500">Amount Paid:</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        ₹{(viewingOrder.paid_amount || (viewingOrder.payment_status === 'Paid' ? viewingOrder.total_amount : 0)).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-700/50">
                      <span className="text-slate-500">Outstanding:</span>
                      <span className="font-bold text-rose-600 dark:text-rose-400">
                        ₹{Math.max(0, viewingOrder.total_amount - (viewingOrder.paid_amount || (viewingOrder.payment_status === 'Paid' ? viewingOrder.total_amount : 0))).toLocaleString()}
                      </span>
                    </div>
                    {viewingOrder.payment_mode && (
                      <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-700/50">
                        <span className="text-slate-500">Last Mode:</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{viewingOrder.payment_mode}</span>
                      </div>
                    )}
                  </div>

                  {user.role !== 'Viewer' && (
                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/50 space-y-2">
                      {Math.max(0, viewingOrder.total_amount - (viewingOrder.paid_amount || (viewingOrder.payment_status === 'Paid' ? viewingOrder.total_amount : 0))) > 0 ? (
                        <>
                          <button
                            type="button"
                            onClick={() => handleOpenPaymentModal(viewingOrder, 'full')}
                            className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors text-center flex items-center justify-center gap-1.5 shadow-sm"
                          >
                            <CheckCircle2 size={14} /> Pay Full Balance (₹{Math.max(0, viewingOrder.total_amount - (viewingOrder.paid_amount || (viewingOrder.payment_status === 'Paid' ? viewingOrder.total_amount : 0))).toLocaleString()})
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenPaymentModal(viewingOrder, 'partial')}
                            className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors text-center flex items-center justify-center gap-1.5 shadow-sm"
                          >
                            <Banknote size={14} /> Make Partial Payment (Installment)
                          </button>
                        </>
                      ) : (
                        <div className="w-full py-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 rounded-lg text-xs font-bold text-center flex items-center justify-center gap-1.5">
                          <CheckCircle2 size={14} /> Order Fully Paid & Cleared
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {user.role !== 'Viewer' && (
                  <button 
                    onClick={() => {
                      const poToEdit = viewingOrder;
                      setViewingOrder(null);
                      handleOpenEditPO(poToEdit);
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 text-xs font-bold rounded-xl transition-colors cursor-pointer border border-indigo-200 dark:border-indigo-800"
                  >
                    <Edit size={14} /> Edit Order Details & Items
                  </button>
                )}

                <button 
                  onClick={() => handlePrintPO(viewingOrder)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl transition-colors cursor-pointer border border-slate-300 dark:border-slate-600"
                >
                  <Printer size={16} /> Print Official PO Document
                </button>

                {user.role !== 'Viewer' && viewingOrder.status === 'Draft' && (
                  <button 
                    onClick={() => {
                      if (window.confirm('Are you sure you want to cancel this PO?')) {
                        handleUpdateStatus(viewingOrder.id, 'Cancelled');
                      }
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    Cancel Order
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODAL: PAYMENT COLLECTION MODAL ==================== */}
      {paymentModalPO && (
        <PaymentCollectionModal
          businessId={businessId}
          user={user}
          order={paymentModalPO}
          type="Purchase"
          initialMode={paymentModalInitialMode}
          onClose={() => setPaymentModalPO(null)}
          onSuccess={(updatedPO) => {
            setPurchases(dbStore.getPurchaseOrders(businessId));
            setSuppliers(dbStore.getSuppliers(businessId));
            if (viewingOrder && viewingOrder.id === updatedPO.id) {
              setViewingOrder(updatedPO as PurchaseOrder);
            }
          }}
          triggerToast={triggerToast}
        />
      )}

      {/* ==================== MODAL: CREATE NEW PURCHASE ORDER ==================== */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-in fade-in duration-200 border border-slate-200 dark:border-slate-800">
            <div className="bg-slate-50 dark:bg-slate-800 px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-4">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <PlusCircle size={16} className="text-indigo-600" />
                  Draft New Purchase Order
                </h2>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      ref={fileInputRef}
                      onChange={handleScanInvoice}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isScanning}
                      className="px-3 py-1.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-lg text-xs font-bold hover:bg-emerald-200 flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-colors"
                    >
                      {isScanning ? 'Scanning...' : 'Camera'}
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      ref={uploadInputRef}
                      onChange={handleScanInvoice}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => uploadInputRef.current?.click()}
                      disabled={isScanning}
                      className="px-3 py-1.5 bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 rounded-lg text-xs font-bold hover:bg-indigo-200 flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-colors"
                    >
                      {isScanning ? 'Uploading...' : 'Upload'}
                    </button>
                  </div>
                </div>
              </div>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer transition-colors p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700">
                <X size={18} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {/* Header Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50/50 dark:bg-slate-800/30 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Select Vendor *</label>
                    <button 
                      type="button" 
                      onClick={() => handleOpenAddVendorModal('create_po')} 
                      className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                    >
                      + Add New Vendor
                    </button>
                  </div>
                  <select 
                    value={selectedSupplierId}
                    onChange={(e) => setSelectedSupplierId(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-600 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                  >
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.name} - {s.phone}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Expected Delivery Date *</label>
                  <input 
                    type="date"
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 text-xs font-semibold font-mono rounded-lg border border-slate-300 dark:border-slate-600 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {uploadedInvoice && (
                <div className="mb-4">
                  <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">Invoice Attachment</p>
                  <div className="relative inline-block border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                    <img src={uploadedInvoice} alt="Invoice" className="h-32 object-contain" />
                    <button type="button" onClick={() => setUploadedInvoice(null)} className="absolute top-1 right-1 bg-rose-500 text-white rounded p-1 hover:bg-rose-600">
                      <X size={12} />
                    </button>
                  </div>
                </div>
              )}

              {/* Add Item Row */}
              <div>
                <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 border-b border-slate-200 dark:border-slate-700 pb-2">Add Line Items</h3>
                <div className="flex flex-wrap md:flex-nowrap items-end gap-3 bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div className="flex-[2.5] min-w-[320px] md:min-w-[400px] space-y-1">
                    <label className="text-[10px] font-semibold text-slate-500">Product *</label>
                    <SearchableProductSelect 
                      products={products}
                      selectedProductId={rowProductId}
                      onSelectProduct={(prod) => {
                        if (prod) {
                          setRowProductId(prod.id);
                          setRowPrice(prod.purchase_price ?? 0);
                          setRowGst(prod.gst_rate ?? 0);
                        } else {
                          setRowProductId('');
                          setRowPrice(0);
                          setRowGst(0);
                        }
                      }}
                      placeholder="-- Search product by name, SKU, or barcode --"
                    />
                  </div>
                  <div className="w-24 space-y-1">
                    <label className="text-[10px] font-semibold text-slate-500">PO Qty</label>
                    <input 
                      type="number" 
                      min="1"
                      value={rowQty}
                      onChange={(e) => setRowQty(parseInt(e.target.value) || 0)}
                      className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-900 text-xs rounded border border-slate-300 dark:border-slate-600 text-right"
                    />
                  </div>
                  <div className="w-28 space-y-1">
                    <label className="text-[10px] font-semibold text-slate-500">Unit Price (₹)</label>
                    <input 
                      type="number" 
                      min="0"
                      value={rowPrice}
                      onChange={(e) => setRowPrice(parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-900 text-xs rounded border border-slate-300 dark:border-slate-600 text-right"
                    />
                  </div>
                  <div className="w-24 space-y-1">
                    <label className="text-[10px] font-semibold text-slate-500">GST %</label>
                    <input 
                      type="number" 
                      min="0"
                      value={rowGst}
                      onChange={(e) => setRowGst(parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-900 text-xs rounded border border-slate-300 dark:border-slate-600 text-right"
                    />
                  </div>
                  
                  <button 
                    type="button"
                    onClick={handleAddRowItem}
                    className="px-4 py-1.5 h-[34px] bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold rounded cursor-pointer hover:bg-slate-700 dark:hover:bg-white transition-colors"
                  >
                    Add Item
                  </button>
                </div>
              </div>

              {/* Items List */}
              {items.length > 0 && (
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="py-2.5 px-4 font-semibold text-slate-600 dark:text-slate-400">Item</th>
                        <th className="py-2.5 px-4 font-semibold text-slate-600 dark:text-slate-400 text-right">Qty</th>
                        <th className="py-2.5 px-4 font-semibold text-slate-600 dark:text-slate-400 text-right">Unit Rate</th>
                        <th className="py-2.5 px-4 font-semibold text-slate-600 dark:text-slate-400 text-right">GST</th>
                        <th className="py-2.5 px-4 font-semibold text-slate-600 dark:text-slate-400 text-right">Line Total</th>
                        <th className="py-2.5 px-4"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                      {items.map((item, idx) => {
                        const lineBase = item.qty * item.purchase_price;
                        const lineTax = lineBase * (item.gst_rate / 100);
                        const lineTotal = lineBase + lineTax;
                        return (
                          <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                            <td className="py-2.5 px-4 font-medium">{getProductName(item.product_id)}</td>
                            <td className="py-2.5 px-2 text-right font-bold">
                              <input 
                                type="number" 
                                min="1" 
                                value={item.qty} 
                                onChange={(e) => {
                                  const newItems = [...items];
                                  newItems[idx].qty = parseFloat(e.target.value) || 0;
                                  setItems(newItems);
                                }}
                                className="w-20 px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded text-xs text-right font-bold inline-block"
                              />
                            </td>
                            <td className="py-2.5 px-2 text-right flex items-center justify-end gap-1">
                              ₹ <input 
                                type="number" 
                                min="0" 
                                value={item.purchase_price} 
                                onChange={(e) => {
                                  const newItems = [...items];
                                  newItems[idx].purchase_price = parseFloat(e.target.value) || 0;
                                  setItems(newItems);
                                }}
                                className="w-20 px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded text-xs text-right"
                              />
                            </td>
                            <td className="py-2.5 px-2 text-right">
                              <input 
                                type="number" 
                                min="0" 
                                value={item.gst_rate} 
                                onChange={(e) => {
                                  const newItems = [...items];
                                  newItems[idx].gst_rate = parseFloat(e.target.value) || 0;
                                  setItems(newItems);
                                }}
                                className="w-16 px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded text-xs text-right inline-block"
                              /> %
                            </td>
                            <td className="py-2.5 px-4 text-right font-black text-indigo-600 dark:text-indigo-400">₹{lineTotal.toLocaleString()}</td>
                            <td className="py-2.5 px-2 text-center">
                              <button 
                                onClick={() => handleRemoveItem(item.product_id)}
                                className="text-slate-400 hover:text-rose-500 cursor-pointer p-1 rounded hover:bg-rose-50 dark:hover:bg-rose-900/20"
                              >
                                <X size={14} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700">
                      <tr>
                        <td className="py-3 px-4 font-bold text-slate-600 dark:text-slate-400 uppercase text-[10px] tracking-wider">
                          Total Quantity:
                        </td>
                        <td className="py-3 px-2 text-right font-black text-slate-900 dark:text-white">
                          {items.reduce((sum, i) => sum + i.qty, 0)}
                        </td>
                        <td colSpan={1} className="py-3 px-4 text-right font-bold text-slate-600 dark:text-slate-400 uppercase text-[10px] tracking-wider">
                          Gross PO Value:
                        </td>
                        <td colSpan={2} className="py-3 px-4 text-right font-black text-sm text-slate-900 dark:text-white">
                          ₹{items.reduce((sum, i) => sum + (i.qty * i.purchase_price) * (1 + i.gst_rate/100), 0).toLocaleString(undefined, {minimumFractionDigits: 2})}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
              
              {items.length > 0 && selectedSupplierId && (
                <div className="mt-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm">
                  <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Party / Vendor Details (As Per Invoice)</h3>
                  <div className="text-xs text-slate-700 dark:text-slate-300 grid grid-cols-2 gap-2">
                    <p><span className="font-semibold">Name:</span> {suppliers.find(s => s.id === selectedSupplierId)?.name || 'Unknown'}</p>
                    <p><span className="font-semibold">Phone:</span> {suppliers.find(s => s.id === selectedSupplierId)?.phone || 'N/A'}</p>
                    <p><span className="font-semibold">GSTIN:</span> {suppliers.find(s => s.id === selectedSupplierId)?.gstin || 'N/A'}</p>
                    <p className="col-span-2"><span className="font-semibold">Address:</span> {suppliers.find(s => s.id === selectedSupplierId)?.address || 'N/A'}</p>
                  </div>
                </div>
              )}

              {/* Payment Details Section */}
              <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4 border-b border-slate-200 dark:border-slate-700 pb-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Purchase Entry Status *</label>
                    <select
                      value={initialOrderStatus}
                      onChange={(e) => setInitialOrderStatus(e.target.value as any)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-600 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="Draft">Save as Draft</option>
                      <option value="Ordered">Mark as Ordered (Pending Delivery)</option>
                      <option value="Received">Direct Purchase (Received Goods)</option>
                    </select>
                  </div>
                </div>
                <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <CreditCard size={14} className="text-emerald-600" /> Initial Payment Setup
                </h3>

                <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center justify-between">
                  <span className="flex items-center gap-1.5"><CreditCard size={14} className="text-emerald-600" /> Initial Payment Setup</span>
                  {initialPaymentStatus === 'Partial' && (
                    <span className="text-[10px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800">
                      Partial Payment Mode
                    </span>
                  )}
                </h3>

                {(() => {
                  const grossTotal = items.reduce((sum, i) => sum + (i.qty * i.purchase_price) * (1 + i.gst_rate/100), 0);
                  const effectivePaid = initialPaymentStatus === 'Paid' ? grossTotal : initialPaymentStatus === 'Unpaid' ? 0 : Math.min(grossTotal, Math.max(0, initialPaidAmount));
                  const pendingDue = Math.max(0, grossTotal - effectivePaid);

                  return (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Payment Status *</label>
                          <select
                            value={initialPaymentStatus}
                            onChange={(e) => {
                              const st = e.target.value as 'Unpaid' | 'Partial' | 'Paid';
                              setInitialPaymentStatus(st);
                              if (st === 'Paid') setInitialPaidAmount(grossTotal);
                              else if (st === 'Unpaid') setInitialPaidAmount(0);
                              else if (initialPaidAmount === 0 && grossTotal > 0) setInitialPaidAmount(Math.round(grossTotal * 0.5));
                            }}
                            className="w-full px-3 py-2 bg-white dark:bg-slate-900 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-600 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                          >
                            <option value="Unpaid">Unpaid (Full Credit)</option>
                            <option value="Partial">Part Payment (Partial)</option>
                            <option value="Paid">Payment Done (Fully Paid)</option>
                          </select>
                        </div>

                        {initialPaymentStatus === 'Partial' && (
                          <div className="space-y-1 md:col-span-2">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex justify-between">
                              <span>Initial Paid Amount (₹) *</span>
                              <span className="text-slate-400 font-normal">Select percentage or enter amount</span>
                            </label>
                            
                            {/* Preset Buttons for Quick Selection */}
                            <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                              <button
                                type="button"
                                onClick={() => setInitialPaidAmount(Math.round(grossTotal * 0.10))}
                                className="px-2 py-0.5 text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 rounded border border-indigo-200 dark:border-indigo-800 transition-colors cursor-pointer"
                              >
                                10% Advance
                              </button>
                              <button
                                type="button"
                                onClick={() => setInitialPaidAmount(Math.round(grossTotal * 0.25))}
                                className="px-2 py-0.5 text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 rounded border border-indigo-200 dark:border-indigo-800 transition-colors cursor-pointer"
                              >
                                25%
                              </button>
                              <button
                                type="button"
                                onClick={() => setInitialPaidAmount(Math.round(grossTotal * 0.3333))}
                                className="px-2 py-0.5 text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 rounded border border-indigo-200 dark:border-indigo-800 transition-colors cursor-pointer"
                              >
                                33%
                              </button>
                              <button
                                type="button"
                                onClick={() => setInitialPaidAmount(Math.round(grossTotal * 0.50))}
                                className="px-2 py-0.5 text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 rounded border border-indigo-200 dark:border-indigo-800 transition-colors cursor-pointer"
                              >
                                50% Half
                              </button>
                              <button
                                type="button"
                                onClick={() => setInitialPaidAmount(Math.round(grossTotal * 0.75))}
                                className="px-2 py-0.5 text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 rounded border border-indigo-200 dark:border-indigo-800 transition-colors cursor-pointer"
                              >
                                75%
                              </button>
                            </div>

                            <input
                              type="number"
                              min="1"
                              max={grossTotal}
                              value={initialPaidAmount}
                              onChange={(e) => setInitialPaidAmount(parseFloat(e.target.value) || 0)}
                              className="w-full px-3 py-2 bg-white dark:bg-slate-900 text-xs font-bold font-mono rounded-lg border border-slate-300 dark:border-slate-600 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                              placeholder="e.g. 5000"
                            />
                          </div>
                        )}

                        {initialPaymentStatus !== 'Unpaid' && (
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Payment Mode *</label>
                            <select
                              value={initialPaymentMode}
                              onChange={(e) => setInitialPaymentMode(e.target.value as any)}
                              className="w-full px-3 py-2 bg-white dark:bg-slate-900 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-600 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                            >
                              <option value="Cash">Cash</option>
                              <option value="UPI">UPI / QR Code</option>
                              <option value="Bank Transfer">Bank Transfer / NEFT</option>
                              <option value="Cheque">Cheque</option>
                              <option value="Credit Card">Credit / Debit Card</option>
                              <option value="Other">Other Mode</option>
                            </select>
                          </div>
                        )}

                        {initialPaymentStatus === 'Partial' && (
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Next Due Date</label>
                            <input
                              type="date"
                              value={initialDueDate}
                              onChange={(e) => setInitialDueDate(e.target.value)}
                              className="w-full px-3 py-2 bg-white dark:bg-slate-900 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-600 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                            />
                          </div>
                        )}
                      </div>

                      {initialPaymentStatus !== 'Unpaid' && (
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Payment Reference / Notes</label>
                          <input
                            type="text"
                            value={initialPaymentNotes}
                            onChange={(e) => setInitialPaymentNotes(e.target.value)}
                            placeholder="e.g. Partial advance paid via UPI, Transaction ID #928301"
                            className="w-full px-3 py-2 bg-white dark:bg-slate-900 text-xs rounded-lg border border-slate-300 dark:border-slate-600"
                          />
                        </div>
                      )}

                      {/* Live Calculated Payment & Balance Preview Card */}
                      <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700/80 flex flex-wrap items-center justify-between text-xs gap-2">
                        <div className="flex items-center gap-4">
                          <div>
                            <span className="text-slate-400 text-[10px] uppercase font-bold block">Gross Total</span>
                            <span className="font-black font-mono text-slate-800 dark:text-slate-200">₹{grossTotal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 text-[10px] uppercase font-bold block">Paid Amount</span>
                            <span className="font-black font-mono text-emerald-600 dark:text-emerald-400">₹{effectivePaid.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 text-[10px] uppercase font-bold block">Remaining Pending</span>
                            <span className={`font-black font-mono ${pendingDue > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400'}`}>
                              ₹{pendingDue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold text-slate-500">
                            {grossTotal > 0 ? Math.round((effectivePaid / grossTotal) * 100) : 0}% Settled
                          </span>
                          <div className="w-16 bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                            <div 
                              className="bg-emerald-500 h-full transition-all duration-300" 
                              style={{ width: `${grossTotal > 0 ? Math.min(100, (effectivePaid / grossTotal) * 100) : 0}%` }} 
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 px-6 py-4 flex justify-between items-center shrink-0">
              <button 
                type="button" 
                onClick={() => setIsCreateModalOpen(false)}
                className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors shadow-sm"
              >
                Cancel
              </button>
              <button 
                onClick={handleSavePO}
                disabled={items.length === 0}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 cursor-pointer shadow-sm transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <Check size={14} /> Submit Purchase Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== PURCHASE TO INVENTORY CONVERSION MODAL ==================== */}
      {(orderToReceive || pendingPOToConfirm) && (
        <div className="fixed inset-0 z-[60] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in duration-200 border border-slate-200 dark:border-slate-800">
            <div className="bg-indigo-600 text-white px-6 py-4 flex items-center gap-2">
              <PackagePlus size={18} />
              <h2 className="text-sm font-bold uppercase tracking-wider">Inventory Auto Conversion</h2>
            </div>
            
            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">
                The following items will be automatically converted into your selling units. The Purchase Bill will remain exactly as received from the supplier.
              </p>
              
              <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-1">
                {(orderToReceive || pendingPOToConfirm).items.map((item: any, idx: number) => {
                  const prod = products.find(p => p.id === item.product_id);
                  if (!prod || !prod.auto_conversion || !prod.pack_size) return null;
                  
                  let calculatedPackets = 0;
                  if (prod.purchase_unit === 'Kg' || prod.purchase_unit === 'Ltr') {
                    calculatedPackets = (item.qty * 1000) / prod.pack_size;
                  } else {
                    calculatedPackets = item.qty * prod.pack_size;
                  }

                  return (
                    <div key={idx} className="bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 rounded-xl p-3">
                      <p className="font-bold text-slate-800 dark:text-slate-200 text-sm mb-2">{prod.name}</p>
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Supplier Invoice:</span>
                          <span className="font-bold text-slate-700 dark:text-slate-300">{item.qty} {prod.purchase_unit}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Pack Size:</span>
                          <span className="font-bold text-slate-700 dark:text-slate-300">
                            {prod.pack_size} {prod.purchase_unit === 'Kg' ? 'g' : prod.purchase_unit === 'Ltr' ? 'ml' : 'units'}
                          </span>
                        </div>
                        <div className="flex justify-between border-t border-indigo-200/50 dark:border-indigo-800/50 pt-1 mt-1">
                          <span className="font-bold text-indigo-700 dark:text-indigo-400">Inventory to be Added:</span>
                          <span className="font-black text-indigo-700 dark:text-indigo-400">
                            {calculatedPackets} {prod.selling_unit}s
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => { setOrderToReceive(null); setPendingPOToConfirm(null); }}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (pendingPOToConfirm) {
                      executeSavePO(pendingPOToConfirm);
                    } else if (orderToReceive) {
                      handleUpdateStatus(orderToReceive.id, 'Received');
                      setOrderToReceive(null);
                    }
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg flex items-center gap-2 shadow-md transition-colors"
                >
                  <CheckCircle size={14} /> Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== DELETE PO CONFIRMATION MODAL ==================== */}
      {poToDelete && (
        <div className="fixed inset-0 z-[70] bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-150">
            <div className="bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 px-6 py-4 flex items-center justify-between border-b border-rose-200 dark:border-rose-900/60">
              <div className="flex items-center gap-2 font-bold text-sm">
                <AlertTriangle size={18} />
                <span>Confirm Order Deletion</span>
              </div>
              <button 
                onClick={() => setPoToDelete(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
              >
                <X size={16} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                Are you sure you want to permanently delete Purchase Order <span className="font-bold text-slate-900 dark:text-white">#{poToDelete.order_number}</span>?
              </p>
              
              <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Vendor:</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">{poToDelete.supplier_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Order Total:</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">₹{poToDelete.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Status:</span>
                  <span className="font-bold text-amber-600 dark:text-amber-400">{poToDelete.status}</span>
                </div>
              </div>

              <div className="p-3 bg-rose-50 dark:bg-rose-950/30 rounded-xl border border-rose-200 dark:border-rose-900/40 text-[11px] text-rose-700 dark:text-rose-300 flex items-start gap-2">
                <AlertTriangle size={15} className="shrink-0 mt-0.5" />
                <span>Warning: This order and all associated line items will be removed permanently. This action cannot be undone.</span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setPoToDelete(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  No, Keep Order
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const po = poToDelete;
                    setPoToDelete(null);
                    if (po) executeDeletePO(po);
                  }}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-md shadow-rose-600/20 flex items-center gap-1.5"
                >
                  <Trash2 size={14} />
                  Yes, Delete Order
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
