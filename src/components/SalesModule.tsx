import { PaymentCollectionModal } from './PaymentCollectionModal';
import { WhatsAppNotifyModal } from './WhatsAppNotifyModal';
import { PageHeader } from './PageHeader';
import { QuickCreateProductModal } from './QuickCreateProductModal';
import React, { useEffect, useState, useMemo, useRef } from 'react';
import { formatOrderTime } from '../utils/formatters';
import { 
  FileText, 
  PlusCircle, 
  Search, 
  User, 
  Calendar, 
  DollarSign, 
  X, 
  Check, 
  Printer, 
  Mail, 
  Eye, 
  Share2,
  CornerDownRight, 
  ExternalLink,
  ChevronRight,
  Sparkles,
  Palette,
  ChevronDown,
  Languages,
  Clock,
  Trash2,
  Download,
  Package,
  PackagePlus,
  CheckCircle2,
  CreditCard,
  FileDown,
  Filter,
  Send,
  ShoppingBag,
  MapPin,
  TrendingUp,
  Edit,
  RotateCcw,
  ScanLine,
  Plus,
  Minus,
  Loader2,
  UserPlus,
  Save,
  Phone,
  Building2
} from 'lucide-react';
import { dbStore, isOrderInTimeHorizon, TimeHorizon } from '../services/store';
import { SalesOrder, Customer, Product, UserProfile, SalesItem, OrderStatus } from '../types/erp';
import { calculateApplicablePrice, isLoyalMember, calculateOrderSavings } from '../utils/pricing';
import { generateBillOfSupplyHTML, generate3InchBillHTML } from '../utils/invoiceTemplate';
import { BillOfSupplyView } from './BillOfSupplyView';

interface CustomDropdownOption {
  value: string;
  label: string;
  disabled?: boolean;
  searchKeywords?: string;
}

interface CustomDropdownProps {
  value: string;
  onChange: (val: string) => void;
  options: CustomDropdownOption[];
  placeholder?: string;
  className?: string;
  searchable?: boolean;
  onAddNew?: (searchQuery?: string) => void;
  addNewLabel?: string;
}

const CustomDropdown: React.FC<CustomDropdownProps> = ({
  value,
  onChange,
  options,
  placeholder = 'Select...',
  className = '',
  searchable = false,
  onAddNew,
  addNewLabel
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find(o => o.value === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter(opt => 
    opt.label.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (opt.searchKeywords && opt.searchKeywords.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
    if (!isOpen) {
      setSearchTerm('');
      setActiveIndex(0);
    }
  }, [isOpen, searchable]);

  // Reset active index when search term changes
  useEffect(() => {
    setActiveIndex(0);
  }, [searchTerm]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex(prev => (prev + 1) % Math.max(1, filteredOptions.length));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex(prev => (prev - 1 + filteredOptions.length) % Math.max(1, filteredOptions.length));
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredOptions[activeIndex] && !filteredOptions[activeIndex].disabled) {
          onChange(filteredOptions[activeIndex].value);
          setIsOpen(false);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        break;
      case 'Tab':
        setIsOpen(false);
        break;
    }
  };

  return (
    <div ref={containerRef} className="relative w-full" onKeyDown={handleKeyDown}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-[11px] rounded-lg border border-slate-200 dark:border-slate-700 focus-within:ring-1 focus-within:ring-indigo-500 flex items-center justify-between gap-2 text-left cursor-pointer transition-colors hover:border-slate-300 dark:hover:border-slate-600 ${className} ${isOpen ? 'ring-1 ring-indigo-500' : ''}`}
      >
        <div className="flex-1 flex items-center overflow-hidden">
          {isOpen && searchable ? (
            <div className="flex items-center w-full group">
              <Search size={12} className="text-indigo-500 mr-2 shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Type to search..."
                className="w-full bg-transparent border-none outline-none text-[11px] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 font-bold"
                onClick={(e) => e.stopPropagation()}
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSearchTerm('');
                    searchInputRef.current?.focus();
                  }}
                  className="px-1.5 py-0.5 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded text-[9px] font-black text-rose-500 hover:text-rose-600 transition-colors cursor-pointer border border-rose-200 dark:border-rose-800/50 flex items-center gap-1"
                >
                  <RotateCcw size={10} />
                  <span>CLEAR</span>
                </button>
              )}
            </div>
          ) : (
            <span className="truncate font-medium">
              {selectedOption ? selectedOption.label : <span className="text-slate-400">{placeholder}</span>}
            </span>
          )}
        </div>
        <ChevronDown size={14} className={`text-slate-400 transition-transform duration-150 shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl max-h-64 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-100">
          {onAddNew && (
            <div className="p-1.5 border-b border-slate-100 dark:border-slate-700/80 bg-indigo-50/70 dark:bg-indigo-950/40">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(false);
                  onAddNew(searchTerm);
                }}
                className="w-full py-1.5 px-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[11px] font-black flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer transition active:scale-98"
              >
                <Plus size={12} className="stroke-[3]" />
                <span className="truncate">
                  {addNewLabel 
                    ? (searchTerm ? `${addNewLabel}: "${searchTerm}"` : addNewLabel) 
                    : `+ Create New ${searchTerm ? `"${searchTerm}"` : ''}`}
                </span>
              </button>
            </div>
          )}

          <div className="overflow-y-auto py-1 max-h-60">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt, idx) => (
                <button
                  key={`${opt.value}-${idx}`}
                  type="button"
                  disabled={opt.disabled}
                  onMouseEnter={() => setActiveIndex(idx)}
                  onClick={() => {
                    if (!opt.disabled) {
                      onChange(opt.value);
                      setIsOpen(false);
                    }
                  }}
                  className={`w-full text-left px-3 py-2 text-[11px] font-medium transition-colors cursor-pointer truncate block ${
                    opt.value === value
                      ? 'bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 font-bold border-l-2 border-indigo-500'
                      : idx === activeIndex
                        ? 'bg-slate-100 dark:bg-slate-700 text-indigo-600 dark:text-indigo-400'
                        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60'
                  } ${opt.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {opt.label}
                </button>
              ))
            ) : (
              <div className="px-3 py-4 text-center space-y-2">
                <p className="text-[10px] text-slate-400 italic">No matching options found</p>
                {onAddNew && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsOpen(false);
                      onAddNew(searchTerm);
                    }}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-black inline-flex items-center gap-1 shadow-xs cursor-pointer"
                  >
                    <Plus size={11} className="stroke-[3]" />
                    <span>Create "{searchTerm || 'New Item'}"</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const getLocalTodayDate = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const getLocalCurrentTimeInput = () => {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

const format12HourTime = (time24: string) => {
  if (!time24) return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const parts = time24.split(':');
  if (parts.length < 2) return time24;
  let h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  if (isNaN(h) || isNaN(m)) return time24;
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  if (h === 0) h = 12;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')} ${ampm}`;
};

interface SalesModuleProps {
  businessId: string;
  user: UserProfile;
  triggerToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  openAddModalInitially?: boolean;
  selectedOrderIdInitially?: string | null;
  deepLinkData?: any;
  onClearDeepLink?: () => void;
}

export const SalesModule: React.FC<SalesModuleProps> = ({ 
  businessId, 
  user, 
  triggerToast,
  openAddModalInitially = false,
  selectedOrderIdInitially = null,
  deepLinkData = null,
  onClearDeepLink
}) => {
  const [orders, setOrders] = useState<SalesOrder[]>(dbStore.getSalesOrders(businessId));
  const [customers, setCustomers] = useState<Customer[]>(dbStore.getCustomers(businessId));
  const [products, setProducts] = useState<Product[]>(dbStore.getProducts(businessId));
  const [searchQuery, setSearchQuery] = useState('');
  
  // Theme & Language Settings (Dashboard UI Match)
  type ColorTheme = 'midnight-gold' | 'emerald-pro' | 'royal-sapphire' | 'titanium-dark';
      const [timeHorizon, setTimeHorizon] = useState<'today' | 'yesterday' | '7days' | '30days' | 'all'>('today');
  const [bookingFilter, setBookingFilter] = useState<'all' | 'regular' | 'festive'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isTopFilterMenuOpen, setIsTopFilterMenuOpen] = useState(false);
  const topFilterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (topFilterRef.current && !topFilterRef.current.contains(event.target as Node)) {
        setIsTopFilterMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [selectedOrderForNotify, setSelectedOrderForNotify] = useState<SalesOrder | null>(null);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedOrderIds(filteredOrders.map(o => o.id));
    } else {
      setSelectedOrderIds([]);
    }
  };

  const handleToggleSelectOrder = (id: string) => {
    setSelectedOrderIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleQuickStatusChange = (orderId: string, newStatus: OrderStatus) => {
    dbStore.updateSalesOrder(orderId, { status: newStatus });
    
    // Add notification
    const orderNum = orders.find(o => o.id === orderId)?.order_number || orderId;
    const allUsers = dbStore.getUsers(businessId);
    let packingStaff = allUsers.filter(u => u.role && (u.role === 'Packing Staff' || u.role.toLowerCase().includes('pack')));
    if (packingStaff.length === 0) {
      packingStaff = allUsers;
    }
    
    if (packingStaff.length > 0) {
      packingStaff.forEach(staff => {
        dbStore.sendMessage({
          sender_id: user.id,
          receiver_id: staff.id,
          content: `Sales Order ${orderNum} status has been updated to ${newStatus}.`,
          business_id: businessId
        });
      });
      triggerToast(`Notification sent to ${packingStaff.length} packaging staff member(s).`, 'success');
    }

    setOrders(dbStore.getSalesOrders(businessId));
    triggerToast(`Order status updated to ${newStatus}`, 'success');
  };

  
  
  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(openAddModalInitially && !selectedOrderIdInitially);
  const [invoiceToDelete, setInvoiceToDelete] = useState<{id: string, orderNumber: string} | null>(null);
  const [invoiceToEdit, setInvoiceToEdit] = useState<SalesOrder | null>(null);
  const [selectedOrderForDetail, setSelectedOrderForDetail] = useState<SalesOrder | null>(null);
  const [selectedOrderForPayment, setSelectedOrderForPayment] = useState<SalesOrder | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'Cash' | 'Card'>('UPI');
  const [viewingInvoiceOrder, setViewingInvoiceOrder] = useState<SalesOrder | null>(
    selectedOrderIdInitially && !openAddModalInitially ? orders.find(o => o.id === selectedOrderIdInitially) || null : null
  );

  // New Order Form States
  const currentBiz = dbStore.getBusiness(businessId);
  const currencySymbol = useMemo(() => {
    const cur = currentBiz?.currency_symbol || currentBiz?.currency_default;
    if (!cur) return '₹';
    if (cur.includes(' - ')) return cur.split(' - ')[0].trim();
    return cur.trim();
  }, [currentBiz?.currency_symbol, currentBiz?.currency_default]);

  const defaultTenantTax = useMemo(() => {
    return typeof currentBiz?.tax_rate_default === 'number' && !isNaN(currentBiz.tax_rate_default)
      ? currentBiz.tax_rate_default
      : 0;
  }, [currentBiz?.tax_rate_default]);

  const [selectedCustomerId, setSelectedCustomerId] = useState('WALK_IN');
  const [selectedArea, setSelectedArea] = useState('Dahisar');
  const [orderDate, setOrderDate] = useState<string>(getLocalTodayDate);
  const [orderTime, setOrderTime] = useState<string>(getLocalCurrentTimeInput);
  const [deliveryDate, setDeliveryDate] = useState<string>('');
  const [isAdvanceBooking, setIsAdvanceBooking] = useState(false);
  const [isFulfilledImmediately, setIsFulfilledImmediately] = useState(false);
  const [isFestiveBooking, setIsFestiveBooking] = useState(false);
  const [deliveryType, setDeliveryType] = useState<string>('Self delivery');
  const [paymentStatus, setPaymentStatus] = useState<'Paid' | 'Partial' | 'Unpaid' | ''>('Paid');
  const [paymentMode, setPaymentMode] = useState<string>('Cash');
  const [paidAmount, setPaidAmount] = useState<number | string>('');
  const [pointsToRedeem, setPointsToRedeem] = useState<number>(0);
  const [customDiscountPercentage, setCustomDiscountPercentage] = useState<number | string>('');
  const [customDiscountAmount, setCustomDiscountAmount] = useState<number | string>('');
  const [discountType, setDiscountType] = useState<'Percentage' | 'Value'>('Percentage');
  const [additionalCharges, setAdditionalCharges] = useState<number | string>('');
  const [deliveryCharges, setDeliveryCharges] = useState<number | string>('');
  const [additionalChargeType, setAdditionalChargeType] = useState<'Delivery' | 'Additional'>('Delivery');
  const [orderItems, setOrderItems] = useState<SalesItem[]>([]);
  const [isNewCustomerSelected, setIsNewCustomerSelected] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerAddress, setNewCustomerAddress] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');

  // Editable fields for selected existing customer
  const [selectedCustomerPhone, setSelectedCustomerPhone] = useState('');
  const [selectedCustomerAddress, setSelectedCustomerAddress] = useState('');
  const [selectedCustomerShippingAddress, setSelectedCustomerShippingAddress] = useState('');
  const [isSameShippingAddress, setIsSameShippingAddress] = useState(true);

  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [isSubmitDropdownOpen, setIsSubmitDropdownOpen] = useState(false);
  const [customInvoiceNumber, setCustomInvoiceNumber] = useState<string>('');
  const draftSessionIdRef = useRef<string>(crypto.randomUUID());

  const getSuggestedInvoiceNumber = (isFestive: boolean, isAdvance: boolean) => {
    return dbStore.reserveDraftInvoiceNumber(
      businessId,
      user.id,
      user.name,
      draftSessionIdRef.current,
      isFestive,
      isAdvance
    );
  };

  const recalculateOrderPrices = (
    items: SalesItem[],
    cust: Customer | undefined,
    advBooking: boolean,
    festBooking: boolean
  ): SalesItem[] => {
    const isLoyal = isLoyalMember(cust);
    return items.map(it => {
      if (it.is_overridden) return it;
      const p = products.find(prod => prod.id === it.product_id);
      if (!p) return it;

      const evalRes = calculateApplicablePrice(p, {
        isLoyalMember: isLoyal,
        isAdvanceBooking: advBooking,
        isDiwaliSale: festBooking,
        business: currentBiz,
        orderDate
      });

      return {
        ...it,
        selling_price: evalRes.appliedPrice,
        normal_rate: evalRes.normalRate,
        rate_type: evalRes.rateType,
        rate_reason: evalRes.rateReason,
        unit_savings: evalRes.unitSavings
      };
    });
  };

  const handleToggleAdvanceBooking = (val: boolean) => {
    setIsAdvanceBooking(val);
    if (!editingOrderId) {
      setCustomInvoiceNumber(getSuggestedInvoiceNumber(isFestiveBooking, val));
    }
    const cust = customers.find(c => c.id === selectedCustomerId);
    setOrderItems(prev => recalculateOrderPrices(prev, cust, val, isFestiveBooking));
  };

  const handleToggleFestiveBooking = (val: boolean) => {
    setIsFestiveBooking(val);
    if (!editingOrderId) {
      setCustomInvoiceNumber(getSuggestedInvoiceNumber(val, isAdvanceBooking));
    }
    const cust = customers.find(c => c.id === selectedCustomerId);
    setOrderItems(prev => recalculateOrderPrices(prev, cust, isAdvanceBooking, val));
  };

  // Quick line-item row helper
  const [rowProductId, setRowProductId] = useState('');
  const fastScanInputRef = useRef<HTMLInputElement>(null);
  const [rowQty, setRowQty] = useState<number | string>(1);
  const [rowPrice, setRowPrice] = useState<number | string>(0);
  const [rowTaxRate, setRowTaxRate] = useState<number | string>(defaultTenantTax);

  // Quick Create Product Modal state
  const [isQuickCreateProductOpen, setIsQuickCreateProductOpen] = useState(false);
  const [quickCreateInitialName, setQuickCreateInitialName] = useState('');

  const handleOpenQuickCreateProduct = (searchName: string = '') => {
    setQuickCreateInitialName(searchName);
    setIsQuickCreateProductOpen(true);
  };

  const handleProductCreatedFromModal = (newProd: Product, action: 'select' | 'add_to_order', initialQty: number = 1) => {
    const latestProducts = dbStore.getProducts(businessId);
    setProducts(latestProducts);

    if (action === 'select') {
      setRowProductId(newProd.id);
      const selCust = customers.find(c => c.id === selectedCustomerId);
      const evalRes = calculateApplicablePrice(newProd, {
        isLoyalMember: isLoyalMember(selCust),
        isAdvanceBooking,
        isDiwaliSale: isFestiveBooking,
        business: currentBiz,
        orderDate
      });
      setRowPrice(evalRes.appliedPrice);
      const defaultTax = (defaultTenantTax === 0 || newProd.gst_rate === 18 || typeof newProd.gst_rate !== 'number' || isNaN(newProd.gst_rate)) 
        ? defaultTenantTax 
        : newProd.gst_rate;
      setRowTaxRate(defaultTax);
      setRowQty(initialQty || 1);
    } else if (action === 'add_to_order') {
      const selCust = customers.find(c => c.id === selectedCustomerId);
      const evalRes = calculateApplicablePrice(newProd, {
        isLoyalMember: isLoyalMember(selCust),
        isAdvanceBooking,
        isDiwaliSale: isFestiveBooking,
        business: currentBiz,
        orderDate
      });
      const defaultTax = (defaultTenantTax === 0 || newProd.gst_rate === 18 || typeof newProd.gst_rate !== 'number' || isNaN(newProd.gst_rate)) 
        ? defaultTenantTax 
        : newProd.gst_rate;

      const finalQty = Math.max(1, initialQty || 1);
      const newItem: SalesItem = {
        product_id: newProd.id,
        qty: finalQty,
        scanned_qty: 0,
        selling_price: evalRes.appliedPrice,
        gst_rate: defaultTax,
        normal_rate: evalRes.normalRate,
        rate_type: evalRes.rateType,
        rate_reason: evalRes.rateReason,
        unit_savings: Math.max(0, evalRes.normalRate - evalRes.appliedPrice),
        is_overridden: false
      };

      setOrderItems(prev => {
        const idx = prev.findIndex(item => item.product_id === newProd.id);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = { ...updated[idx], qty: updated[idx].qty + finalQty };
          return updated;
        }
        return [...prev, newItem];
      });

      triggerToast(`Added ${finalQty}x ${newProd.name} directly to order!`, 'success');
      setRowProductId('');
      setRowQty(1);
    }
  };

  const resetForm = () => {
    setEditingOrderId(null);
    const biz = dbStore.getBusiness(businessId);
    if (isCreateModalOpen) {
      setCustomInvoiceNumber(getSuggestedInvoiceNumber(false, false));
    }
    setSelectedCustomerId('WALK_IN');
    setSelectedArea(biz?.default_dispatch_zone || 'Dahisar');
    setOrderDate(getLocalTodayDate());
    setOrderTime(getLocalCurrentTimeInput());
    setDeliveryDate('');
    setDeliveryType('Self delivery');
    setIsAdvanceBooking(false);
    setIsFulfilledImmediately(false);
    setIsFestiveBooking(false);
    setPaymentStatus('Paid');
    setPaymentMode('Cash');
    setPaidAmount('');
    setPointsToRedeem(0);
    setCustomDiscountPercentage('');
    setCustomDiscountAmount('');
    setDiscountType('Percentage');
    setAdditionalCharges('');
    setAdditionalChargeType('Delivery');
    setOrderItems([]);
    setIsNewCustomerSelected(false);
    setNewCustomerName('');
    setNewCustomerAddress('');
    setNewCustomerPhone('');
    setSelectedCustomerPhone('');
    setSelectedCustomerAddress('');
    setSelectedCustomerShippingAddress('');
    setIsSameShippingAddress(true);
    setRowProductId('');
    setRowQty(1);
    setRowPrice(0);
    setRowTaxRate(typeof biz?.tax_rate_default === 'number' && !isNaN(biz.tax_rate_default) ? biz.tax_rate_default : 0);
    setIsSubmitDropdownOpen(false);
  };

  useEffect(() => {
    if (isCreateModalOpen && !editingOrderId) {
      const allocatedNum = dbStore.reserveDraftInvoiceNumber(
        businessId,
        user.id,
        user.name,
        draftSessionIdRef.current,
        isFestiveBooking,
        isAdvanceBooking
      );
      setCustomInvoiceNumber(allocatedNum);

      // Keep reservation fresh while modal stays open
      const interval = setInterval(() => {
        dbStore.renewDraftReservation(draftSessionIdRef.current);
      }, 10000);

      return () => {
        clearInterval(interval);
      };
    } else if (!isCreateModalOpen) {
      dbStore.releaseDraftReservation(draftSessionIdRef.current);
    }
  }, [isCreateModalOpen, editingOrderId, isFestiveBooking, isAdvanceBooking, businessId, user.id, user.name]);

  // Clean up any held reservation when module unmounts
  useEffect(() => {
    return () => {
      dbStore.releaseDraftReservation(draftSessionIdRef.current);
    };
  }, []);

  useEffect(() => {
    return dbStore.subscribe(() => {
      setOrders(dbStore.getSalesOrders(businessId));
      setCustomers(dbStore.getCustomers(businessId));
      setProducts(dbStore.getProducts(businessId));

      // Live synchronize invoice number if Create Order modal is actively open
      if (isCreateModalOpen && !editingOrderId) {
        const liveNum = dbStore.reserveDraftInvoiceNumber(
          businessId,
          user.id,
          user.name,
          draftSessionIdRef.current,
          isFestiveBooking,
          isAdvanceBooking
        );
        setCustomInvoiceNumber(liveNum);
      }
    });
  }, [businessId, isCreateModalOpen, editingOrderId, isFestiveBooking, isAdvanceBooking, user.id, user.name]);

  const handleOpenAddModal = () => {
    draftSessionIdRef.current = crypto.randomUUID();
    resetForm();
    setIsCreateModalOpen(true);
  };

  const handleCloseCreateModal = () => {
    dbStore.releaseDraftReservation(draftSessionIdRef.current);
    setIsCreateModalOpen(false);
    resetForm();
    if (onClearDeepLink) {
      onClearDeepLink();
    }
  };

  useEffect(() => {
    if (invoiceToEdit) {
      handleOpenEditModal(invoiceToEdit);
      setInvoiceToEdit(null);
    }
  }, [invoiceToEdit]);

  const handleOpenEditModal = (order: SalesOrder) => {
    if (order.status === 'Dispatched') {
      triggerToast('Cannot edit an order that is out for delivery (Dispatched).', 'error');
      return;
    }
    if (order.delivery_status === 'Delivered') {
      triggerToast('Note: This order is already delivered. Any changes will update the inventory records.', 'info');
    }
    if (order.status === 'Packed') {
      triggerToast('Note: Editing a packed order will revert its status to Packing.', 'info');
    }
    
    setEditingOrderId(order.id);
    setCustomInvoiceNumber(order.order_number);
    setSelectedCustomerId(order.customer_id || 'WALK_IN');

    const c = customers.find(cust => cust.id === order.customer_id);
    if (c) {
      setSelectedCustomerPhone(c.phone || '');
      setSelectedCustomerAddress(c.billing_address || c.address || '');
      setSelectedCustomerShippingAddress(c.shipping_address || c.billing_address || c.address || '');
      setIsSameShippingAddress(!c.shipping_address || c.shipping_address === c.billing_address);
    }
    setPointsToRedeem(order.points_redeemed || 0);
    setSelectedArea(order.area || 'Dahisar');
    setOrderDate(order.order_date || getLocalTodayDate());
    setOrderTime(order.time || getLocalCurrentTimeInput());
    setDeliveryDate(order.delivery_date || '');
    setDeliveryType(order.delivery_type || 'Self pickup');
    setIsAdvanceBooking(order.advance_booking || false);
    setIsFulfilledImmediately(order.status === 'Delivered');
    setIsFestiveBooking(order.festive_booking || false);
    setPaymentStatus(order.payment_status);
    setPaymentMode(order.payment_mode || 'Cash');
    setPaidAmount(order.paid_amount || 0);
    if (order.discount_percentage && order.discount_percentage > 0) {
      setDiscountType('Percentage');
      setCustomDiscountPercentage(order.discount_percentage);
      setCustomDiscountAmount(order.discount_amount || '');
    } else if (order.discount_amount && order.discount_amount > 0) {
      setDiscountType('Value');
      setCustomDiscountAmount(order.discount_amount);
      setCustomDiscountPercentage(order.discount_percentage || '');
    } else {
      setDiscountType('Percentage');
      setCustomDiscountPercentage('');
      setCustomDiscountAmount('');
    }
    setAdditionalCharges(order.additional_charges || 0);
    setDeliveryCharges(order.delivery_charges || 0);
    setAdditionalChargeType(order.additional_charges_type || 'Delivery');
    setOrderItems([...order.items]);
    setIsCreateModalOpen(true);
    
    // reset row item inputs
    setRowProductId('');
    setRowQty(1);
    setRowPrice(0);
  };

  useEffect(() => {
    if (deepLinkData?.openAddModal || (openAddModalInitially && !deepLinkData)) {
      if (deepLinkData?.orderId || selectedOrderIdInitially) {
        const targetId = deepLinkData?.orderId || selectedOrderIdInitially;
        const orderToEdit = orders.find(o => o.id === targetId);
        if (orderToEdit) {
          handleOpenEditModal(orderToEdit);
          setViewingInvoiceOrder(null);
        }
      } else {
        handleOpenAddModal();
      }
      if (onClearDeepLink) {
        onClearDeepLink();
      }
    } else if (deepLinkData?.orderId) {
      const orderToView = orders.find(o => o.id === deepLinkData.orderId);
      if (orderToView) {
        setViewingInvoiceOrder(orderToView);
      }
      if (onClearDeepLink) {
        onClearDeepLink();
      }
    }
  }, [deepLinkData, openAddModalInitially, selectedOrderIdInitially]);

  const handleAddLineItem = () => {
    if (!rowProductId) {
      triggerToast('Choose a product SKU to append.', 'error');
      return;
    }
    const finalQty = Math.max(1, Number(rowQty) || 1);
    if (finalQty <= 0) {
      triggerToast('Quantity must be greater than zero.', 'error');
      return;
    }
    const prod = products.find(p => p.id === rowProductId);
    if (!prod) return;

    setOrderItems(prevItems => {
    const existingItemIndex = prevItems.findIndex(it => it.product_id === rowProductId);
    if (existingItemIndex >= 0) {
      triggerToast('Item quantity updated.', 'success');
      const updatedItems = [...prevItems];
      updatedItems[existingItemIndex] = {
        ...updatedItems[existingItemIndex],
        qty: updatedItems[existingItemIndex].qty + finalQty
      };
      return updatedItems;
    } else {
      const selCust = customers.find(c => c.id === selectedCustomerId);
      const evalRes = calculateApplicablePrice(prod, {
        isLoyalMember: isLoyalMember(selCust),
        isAdvanceBooking,
        isDiwaliSale: isFestiveBooking,
        business: currentBiz,
        orderDate
      });
      
      const isCustomPrice = rowPrice !== '' && !isNaN(Number(rowPrice)) && Number(rowPrice) !== evalRes.appliedPrice;
      const finalPrice = rowPrice !== '' && !isNaN(Number(rowPrice)) ? Number(rowPrice) : evalRes.appliedPrice;
      const finalTax = rowTaxRate !== '' && !isNaN(Number(rowTaxRate))
        ? Number(rowTaxRate)
        : (typeof prod.gst_rate === 'number' && !isNaN(prod.gst_rate) && prod.gst_rate >= 0 ? prod.gst_rate : defaultTenantTax);
        
      const newItem = {
        product_id: rowProductId,
        qty: finalQty,
        scanned_qty: 0,
        selling_price: finalPrice,
        gst_rate: finalTax,
        normal_rate: evalRes.normalRate,
        rate_type: isCustomPrice ? 'OVERRIDE' : evalRes.rateType,
        rate_reason: isCustomPrice ? 'Admin Price Override' : evalRes.rateReason,
        unit_savings: Math.max(0, evalRes.normalRate - finalPrice),
        is_overridden: isCustomPrice
      };
      
      if (isCustomPrice) {
        dbStore.logActivity(
          user.id,
          user.name,
          user.role,
          'Price Override',
          `Admin price override for ${prod.name} (SKU: ${prod.sku}): calculated ${evalRes.rateType} ₹${evalRes.appliedPrice} -> overridden to ₹${finalPrice}`,
          businessId
        );
      }
      return [...prevItems, newItem];
    }
  });
    
    setRowProductId('');
    setRowQty(1);
    setRowPrice(0);
    setRowTaxRate(defaultTenantTax);
  };

  const handleRemoveLineItem = (idx: number) => {
    setOrderItems(orderItems.filter((_, i) => i !== idx));
  };

  const calculatedTotals = useMemo(() => {
    const taxableVal = orderItems.reduce((sum, item) => sum + ((Number(item.qty) || 0) * (Number(item.selling_price) || 0)), 0);
    const taxVal = orderItems.reduce((sum, item) => sum + ((Number(item.qty) || 0) * (Number(item.selling_price) || 0) * ((Number(item.gst_rate) || 0) / 100)), 0);
    const subtotalBeforeDiscount = Math.round(taxableVal + taxVal);

    const config = dbStore.getLoyaltyConfig(businessId);
    const pointVal = config?.point_value || 1;
    const selCust = customers.find(c => c.id === selectedCustomerId);
    const pts = selCust?.loyalty_points || 0;
    const actualRedeem = Math.min(pts, Number(pointsToRedeem) || 0);
    
    let percDiscVal = customDiscountPercentage !== '' && !isNaN(Number(customDiscountPercentage)) ? Math.max(0, Number(customDiscountPercentage)) : 0;
    let amtDiscVal = customDiscountAmount !== '' && !isNaN(Number(customDiscountAmount)) ? Math.max(0, Number(customDiscountAmount)) : 0;

    let discAmt = actualRedeem * pointVal;
    if (discountType === 'Percentage') {
      discAmt += (subtotalBeforeDiscount * percDiscVal) / 100;
    } else {
      discAmt += amtDiscVal;
    }

    const discountAmount = Math.round(discAmt);
    
    const addCharges = additionalCharges !== '' && !isNaN(Number(additionalCharges)) ? Math.max(0, Number(additionalCharges)) : 0;
    const delCharges = deliveryCharges !== '' && !isNaN(Number(deliveryCharges)) ? Math.max(0, Number(deliveryCharges)) : 0;
    
    const finalAmount = Math.max(0, subtotalBeforeDiscount - discountAmount + addCharges + delCharges);
    
    let computedPaid = 0;
    if (paymentStatus === 'Paid') {
      computedPaid = finalAmount;
    } else if (paymentStatus === 'Partial') {
      computedPaid = Math.min(finalAmount, Math.max(0, Number(paidAmount) || 0));
    } else {
      computedPaid = 0;
    }
    
    const balance = Math.max(0, finalAmount - computedPaid);

    const calculatedDiscountPerc = discountType === 'Percentage'
      ? percDiscVal
      : (subtotalBeforeDiscount > 0 ? Number(((amtDiscVal / subtotalBeforeDiscount) * 100).toFixed(2)) : 0);

    const displayDiscountPerc = discountType === 'Percentage'
      ? customDiscountPercentage
      : (customDiscountAmount !== '' && subtotalBeforeDiscount > 0
          ? Number(((Number(customDiscountAmount) / subtotalBeforeDiscount) * 100).toFixed(2))
          : (customDiscountAmount !== '' ? 0 : ''));

    const displayDiscountAmt = discountType === 'Value'
      ? customDiscountAmount
      : (customDiscountPercentage !== ''
          ? Number(((subtotalBeforeDiscount * Number(customDiscountPercentage)) / 100).toFixed(2))
          : (customDiscountAmount !== '' ? Number(customDiscountAmount) : ''));

    return {
      taxableVal,
      taxVal,
      subtotalBeforeDiscount,
      discountAmount,
      discountPercentage: calculatedDiscountPerc,
      displayDiscountPerc,
      displayDiscountAmt,
      finalAmount,
      computedPaid,
      balance,
      actualRedeem,
      addCharges,
      delCharges
    };
  }, [orderItems, pointsToRedeem, customDiscountPercentage, customDiscountAmount, discountType, additionalCharges, deliveryCharges, paymentStatus, paidAmount, selectedCustomerId, customers, businessId]);

  const scheduledCountForSelectedDate = useMemo(() => {
    if (!deliveryDate) return 0;
    return orders.filter(o => o.delivery_date === deliveryDate && o.status !== 'Cancelled').length;
  }, [deliveryDate, orders]);

  const upcoming7DaysLoad = useMemo(() => {
    const list: Array<{ date: string; label: string; count: number }> = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const count = orders.filter(o => o.delivery_date === dateStr && o.status !== 'Cancelled').length;
      const dayName = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-US', { weekday: 'short' });
      list.push({
        date: dateStr,
        label: `${dayName} (${d.getDate()}/${d.getMonth()+1})`,
        count
      });
    }
    return list;
  }, [orders]);

  const handleCreateSalesOrder = async (postAction: 'close' | 'save_new' | 'print' | 'share' = 'close') => {
    if (isSubmitting) return;

    if (!selectedCustomerId && !isNewCustomerSelected && selectedCustomerId !== 'WALK_IN') {
      triggerToast('Please choose a customer profile.', 'error');
      return;
    }

    if (isNewCustomerSelected) {
      if (!newCustomerName.trim()) {
        triggerToast('Please enter new customer name.', 'error');
        return;
      }
      if (!newCustomerPhone.trim()) {
        triggerToast('Please enter new customer mobile number.', 'error');
        return;
      }
      if (!newCustomerAddress.trim()) {
        triggerToast('Please enter new customer address.', 'error');
        return;
      }
    }

    if (orderItems.length === 0) {
      triggerToast('Add at least one line item.', 'error');
      return;
    }

    if (paymentStatus === '') {
      triggerToast('Please select a Payment Status (Paid, Partial, or Unpaid).', 'error');
      return;
    }

    let finalPaymentStatusToSave = paymentStatus;
    // Defensive check: if it is partial but paid amount is 0, it is effectively unpaid
    if (paymentStatus === 'Partial' && (!paidAmount || Number(paidAmount) <= 0)) {
      finalPaymentStatusToSave = 'Unpaid';
      triggerToast('Amount is 0, saving as Unpaid / On Credit.', 'info');
    }

    // Safety return if Walk-in Unpaid without confirmation
    // Only warn for actual walk-ins, not for new customers being registered
    if (finalPaymentStatusToSave === 'Unpaid' && selectedCustomerId === 'WALK_IN' && !isNewCustomerSelected) {
      const confirmUnpaidWalkin = window.confirm(
        "You are creating an UNPAID order for a Walk-in Customer.\nDebt tracking is not available for walk-ins. Are you sure you want to proceed?"
      );
      if (!confirmUnpaidWalkin) return;
    }

    setIsSubmitting(true);
    try {
      let finalCreatedOrder: SalesOrder | null = null;
      // Handle Walk-in / New Customer dynamic creation
      let finalCustomerId = selectedCustomerId;
      let finalCustomerName = '';
      let finalCustomerArea = selectedArea || 'Dahisar';
      
      if (isNewCustomerSelected) {
        const newCust = dbStore.createCustomer({
          name: newCustomerName.trim(),
          group: 'Retail',
          area: selectedArea || 'Dahisar',
          gstin: '',
          pan: '',
          billing_address: newCustomerAddress.trim(),
          shipping_address: newCustomerAddress.trim(),
          email: '',
          phone: newCustomerPhone.trim(),
          credit_limit: 0,
          business_id: businessId,
          active: true
        });
        finalCustomerId = newCust.id;
        finalCustomerName = newCust.name;
        finalCustomerArea = selectedArea || 'Dahisar';
        triggerToast(`New customer "${newCust.name}" registered successfully.`, 'success');
      } else if (selectedCustomerId === 'WALK_IN' || selectedCustomerId === '') {
         let walkIn = customers.find(c => c.name === 'Walk-in Customer');
         if (!walkIn) {
            walkIn = dbStore.createCustomer({
               name: 'Walk-in Customer',
               group: 'Retail',
               area: selectedArea || 'Dahisar',
               gstin: '',
               pan: '',
               billing_address: 'Retail POS',
               shipping_address: 'Retail POS',
               email: '',
               phone: '',
               credit_limit: 0,
               business_id: businessId,
               active: true
            });
         }
         finalCustomerId = walkIn.id;
         finalCustomerName = walkIn.name;
         finalCustomerArea = selectedArea || 'Dahisar';
      } else {
         const cObj = customers.find(c => c.id === selectedCustomerId);
         if (cObj) {
            finalCustomerName = cObj.name;
            finalCustomerArea = selectedArea || (cObj.area && cObj.area !== 'Other' ? cObj.area : 'Dahisar');
            // Save updated customer contact & addresses if changed inline
            if (selectedCustomerPhone.trim() || selectedCustomerAddress.trim() || selectedCustomerShippingAddress.trim()) {
              dbStore.updateCustomer(cObj.id, {
                phone: selectedCustomerPhone.trim() || cObj.phone,
                billing_address: selectedCustomerAddress.trim() || cObj.billing_address,
                shipping_address: isSameShippingAddress ? (selectedCustomerAddress.trim() || cObj.billing_address) : (selectedCustomerShippingAddress.trim() || cObj.shipping_address)
              });
            }
         }
      }

      const cleanItems: SalesItem[] = orderItems.map(it => ({
        ...it,
        qty: Math.max(1, Number(it.qty) || 1),
        selling_price: Math.max(0, Number(it.selling_price) || 0),
        gst_rate: Math.max(0, Number(it.gst_rate) || 0),
      }));

      // Use pre-calculated values
      const { finalAmount, computedPaid, balance: unpaidBalance, actualRedeem, discountAmount: calculatedDiscount } = calculatedTotals;
      const actualPaid = Number(computedPaid) || 0;
      const actualBalance = Number(unpaidBalance) || 0;
      
      let customerObj = customers.find(c => c.id === finalCustomerId);
      // Fallback for newly created customer in this same turn
      if (!customerObj && finalCustomerId) {
        const allCusts = dbStore.getCustomers(businessId);
        customerObj = allCusts.find(c => c.id === finalCustomerId);
      }

      const isWalkIn = customerObj?.name === 'Walk-in Customer' || finalCustomerId === 'WALK_IN' || !finalCustomerId;

      // Credit limit bypass check for registered customers with actual debt
      // Only warn if a positive credit limit is set for the customer
      if (customerObj && !isWalkIn && (actualBalance > 0)) {
        const currentDebt = Number(customerObj.outstanding_amount) || 0;
        const limit = Number(customerObj.credit_limit) || 0;
        if (limit > 0 && currentDebt + actualBalance > limit) {
           const confirmed = window.confirm(
             `CREDIT LIMIT WARNING!\n\n` +
             `This transaction will increase debt by ${currencySymbol}${actualBalance.toLocaleString()} and breach authorized limit of ${currencySymbol}${limit.toLocaleString()}.\n\n` +
             `Current Outstanding: ${currencySymbol}${currentDebt.toLocaleString()}\n` +
             `New Total: ${currencySymbol}${(currentDebt + actualBalance).toLocaleString()}\n\n` +
             `Do you want to override and bypass credit check?`
           );
           if (!confirmed) {
             setIsSubmitting(false);
             return;
           }
        }
      }

      if (editingOrderId) {
        // Edit flow
        const existingOrder = orders.find(o => o.id === editingOrderId);
        const oldUnpaidBalance = existingOrder ? (Number(existingOrder.total_amount) - Number(existingOrder.paid_amount || 0)) : 0;
        const orderNum = customInvoiceNumber.trim() || (existingOrder ? existingOrder.order_number : dbStore.getNextAvailableInvoiceNumber(businessId, isFestiveBooking, isAdvanceBooking));
        
        dbStore.updateSalesOrder(editingOrderId, {
          order_number: orderNum,
          customer_id: finalCustomerId,
          customer_name: finalCustomerName,
          area: finalCustomerArea,
          channel: isWalkIn ? 'Walk-in' : 'Direct Order',
          time: orderTime ? format12HourTime(orderTime) : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          order_date: orderDate || getLocalTodayDate(),
          delivery_date: deliveryDate || null,
          delivery_type: deliveryType,
          status: isFulfilledImmediately ? 'Delivered' : existingOrder?.status === 'Packed' ? 'Packing' : (existingOrder?.status || 'Pending'),
          delivery_status: isFulfilledImmediately ? 'Delivered' : existingOrder?.delivery_status || 'Pending',
          payment_status: finalPaymentStatusToSave as any,
          payment_mode: paymentMode,
          paid_amount: actualPaid,
          advance_booking: isAdvanceBooking,
          festive_booking: isFestiveBooking,
          total_amount: finalAmount,
          discount_amount: calculatedDiscount,
          discount_percentage: calculatedTotals.discountPercentage,
          additional_charges: Number(additionalCharges) || 0,
          delivery_charges: Number(deliveryCharges) || 0,
          additional_charges_type: additionalChargeType,
          points_redeemed: actualRedeem,
          items: cleanItems,
          is_updated: true,
          qr_code_data: `${orderNum}|${finalCustomerId}|${finalCustomerName}|${orderItems.length} items`,
        });

        finalCreatedOrder = dbStore.getSalesOrders(businessId).find(o => o.id === editingOrderId) || null;

        // Update customer outstanding debt for edits
        if (customerObj && !isWalkIn) {
          const debtChange = actualBalance - oldUnpaidBalance;
          if (debtChange !== 0) {
            dbStore.updateCustomer(finalCustomerId, {
              outstanding_amount: Math.max(0, (Number(customerObj.outstanding_amount) || 0) + debtChange)
            });
          }
        }

        // Send message to packaging users for any edit
        const allUsers = dbStore.getUsers(businessId);
        const packingStaff = allUsers.filter(u => u.role && (u.role === 'Packing Staff' || u.role.toLowerCase().includes('pack')));
        
        if (packingStaff.length > 0) {
          packingStaff.forEach(staff => {
            dbStore.sendMessage({
              sender_id: user.id,
              receiver_id: staff.id,
              content: `Sales Order ${orderNum} has been updated. Please check the new details.`,
              business_id: businessId
            });
          });
          triggerToast(`Notification sent to ${packingStaff.length} packaging staff member(s).`, 'success');
        }

        dbStore.logActivity(
          user.id,
          user.name,
          user.role,
          'Edit Order',
          `Updated Sales Order: ${orderNum} totaling ${currencySymbol}${finalAmount.toLocaleString()}`,
          businessId
        );

        triggerToast(`Order ${orderNum} updated successfully.`, 'success');
      } else {
        // Create flow
        const orderNum = customInvoiceNumber.trim() || getSuggestedInvoiceNumber(isFestiveBooking, isAdvanceBooking);

        const createdOrder = dbStore.createSalesOrder({
          order_number: orderNum,
          customer_id: finalCustomerId,
          customer_name: finalCustomerName,
          area: finalCustomerArea,
          channel: isWalkIn ? 'Walk-in' : 'Direct Order',
          time: orderTime ? format12HourTime(orderTime) : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          order_date: orderDate || getLocalTodayDate(),
          delivery_date: deliveryDate || null,
          delivery_type: deliveryType,
          status: isFulfilledImmediately ? 'Delivered' : 'Pending',
          payment_status: finalPaymentStatusToSave as any,
          payment_mode: paymentMode,
          paid_amount: actualPaid,
          delivery_status: isFulfilledImmediately ? 'Delivered' : 'Pending',
          items: cleanItems,
          advance_booking: isAdvanceBooking,
          festive_booking: isFestiveBooking,
          total_amount: finalAmount,
          discount_amount: calculatedDiscount,
          discount_percentage: calculatedTotals.discountPercentage,
          additional_charges: Number(additionalCharges) || 0,
          delivery_charges: Number(deliveryCharges) || 0,
          additional_charges_type: additionalChargeType,
          points_redeemed: actualRedeem,
          qr_code_data: `${orderNum}|${finalCustomerId}|${finalCustomerName}|${orderItems.length} items`,
          business_id: businessId
        });

        finalCreatedOrder = createdOrder;

        // Process Loyalty Points calculation & redemption
        if (finalCustomerId && !isWalkIn) {
          const loyaltyResult = dbStore.processOrderLoyalty(
            finalCustomerId,
            finalAmount,
            pointsToRedeem,
            createdOrder.id,
            businessId
          );
          if (loyaltyResult.pointsEarned > 0) {
            triggerToast(`Customer earned +${loyaltyResult.pointsEarned} loyalty points on Order #${createdOrder.order_number}!`, 'info');
          }
        }

        // Update customer outstanding debt with the remaining unpaid balance!
        if (customerObj && !isWalkIn) {
          dbStore.updateCustomer(finalCustomerId, {
            outstanding_amount: Math.max(0, (customerObj.outstanding_amount || 0) + unpaidBalance)
          });
        }

        dbStore.logActivity(
          user.id,
          user.name,
          user.role,
          'Create Order',
          `Placed Sales Order: ${createdOrder.order_number} totaling ${currencySymbol}${finalAmount.toLocaleString()} (${isAdvanceBooking ? 'Advance Booking' : 'Standard Delivery'})`,
          businessId
        );

        // Send message to packaging users for new order
        const allUsers = dbStore.getUsers(businessId);
        const packingStaff = allUsers.filter(u => u.role && (u.role === 'Packing Staff' || u.role.toLowerCase().includes('pack')));
        
        if (packingStaff.length > 0) {
          packingStaff.forEach(staff => {
            dbStore.sendMessage({
              sender_id: user.id,
              receiver_id: staff.id,
              content: `New Sales Order ${createdOrder.order_number} has been placed. Please prepare for packing.`,
              business_id: businessId
            });
          });
        }

        triggerToast(`Order ${createdOrder.order_number} compiled. Added to pending packing list.`, 'success');
      }

      setOrders(dbStore.getSalesOrders(businessId));
      
      // Ensure payment confirmation popup is not displayed after completing invoice
      setIsPaymentModalOpen(false);
      setSelectedOrderForPayment(null);
      
      // Release draft lock
      dbStore.releaseDraftReservation(draftSessionIdRef.current);

      // Post-save actions
      if (postAction === 'save_new') {
        draftSessionIdRef.current = crypto.randomUUID();
        resetForm();
        setCustomInvoiceNumber(getSuggestedInvoiceNumber(false, false));
      } else if (postAction === 'print' && finalCreatedOrder) {
        resetForm();
        setIsCreateModalOpen(false);
        setViewingInvoiceOrder(finalCreatedOrder);
        setTimeout(() => {
          const btn = document.getElementById('print-invoice-btn');
          if (btn) btn.click();
        }, 300);
      } else if (postAction === 'share' && finalCreatedOrder) {
        resetForm();
        setIsCreateModalOpen(false);
        setViewingInvoiceOrder(finalCreatedOrder);
        setTimeout(() => {
          const btn = document.getElementById('email-invoice-btn');
          if (btn) btn.click();
        }, 300);
      } else {
        setIsCreateModalOpen(false);
        resetForm();
      }

    } catch (err: any) {
      console.error(err); triggerToast(err.message || 'Error occurred.', 'error');
    } finally {
      setIsSubmitting(false);
      setIsSubmitDropdownOpen(false);
    }
  };

  // Mock Actions
  const handleDeleteInvoice = (orderId: string, orderNumber: string) => {
    setInvoiceToDelete({ id: orderId, orderNumber });
  };

  const confirmDeleteInvoice = () => {
    if (!invoiceToDelete) return;
    try {
      dbStore.deleteSalesOrder(invoiceToDelete.id);
      dbStore.logActivity(user.id, user.name, user.role, 'Delete Invoice', `Deleted invoice ${invoiceToDelete.orderNumber}`, businessId);
      triggerToast(`Invoice ${invoiceToDelete.orderNumber} deleted successfully.`, 'success');
      setOrders(dbStore.getSalesOrders(businessId));
      setViewingInvoiceOrder(null);
      setInvoiceToDelete(null);
    } catch (err: any) {
      triggerToast(err.message || 'Failed to delete invoice.', 'error');
    }
  };

  const handlePrintInvoice = async (order: SalesOrder) => {
    triggerToast(`Sent Bill of Supply for "${order.order_number}" to system print spooler.`, 'success');
    dbStore.logActivity(user.id, user.name, user.role, 'Print Invoice', `Printed Bill of Supply for ${order.order_number}`, businessId);

    const cust = customers.find(c => c.id === order.customer_id);
    const businessObj = dbStore.getBusiness(businessId);
    const printHtml = await generateBillOfSupplyHTML(order, cust, businessObj, products);

    try {
      let printFrame = document.getElementById('tax-invoice-print-frame') as HTMLIFrameElement;
      if (!printFrame) {
        printFrame = document.createElement('iframe');
        printFrame.id = 'tax-invoice-print-frame';
        printFrame.style.position = 'fixed';
        printFrame.style.right = '0';
        printFrame.style.bottom = '0';
        printFrame.style.width = '0';
        printFrame.style.height = '0';
        printFrame.style.border = '0';
        document.body.appendChild(printFrame);
      }

      const doc = printFrame.contentWindow?.document;
      if (doc) {
        doc.open();
        doc.write(printHtml);
        doc.close();

        setTimeout(() => {
          try {
            printFrame.contentWindow?.focus();
            printFrame.contentWindow?.print();
          } catch (e) {
            window.print();
          }
        }, 500);
      } else {
        window.print();
      }
    } catch (err) {
      console.error('Print error:', err);
      window.print();
    }
  };

  const handleDownload3InchBill = async (order: SalesOrder) => {
    const cust = customers.find(c => c.id === order.customer_id);
    const businessObj = dbStore.getBusiness(businessId);
    const fullHtml = await generate3InchBillHTML(order, cust, businessObj, products);

    const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    // Download as HTML (similar to standard PDF download feature which uses HTML)
    const a = document.createElement('a');
    a.href = url;
    a.download = `3_Inch_Bill_${order.order_number}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    // Also open print window directly for convenience
    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if (printWindow) {
      printWindow.document.open();
      printWindow.document.write(fullHtml);
      printWindow.document.close();
      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
      }, 500);
    }

    triggerToast(`3-Inch Bill for "${order.order_number}" downloaded & opened for printing!`, 'success');
    dbStore.logActivity(user.id, user.name, user.role, 'Download 3-Inch Bill', `Downloaded 3-Inch bill for ${order.order_number}`, businessId);
  };

  const handleDownloadPDFInvoice = async (order: SalesOrder) => {
    const cust = customers.find(c => c.id === order.customer_id);
    const businessObj = dbStore.getBusiness(businessId);
    const fullHtml = await generateBillOfSupplyHTML(order, cust, businessObj, products);

    const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Bill_of_Supply_${order.order_number}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    triggerToast(`Bill of Supply for "${order.order_number}" downloaded & opening print spooler!`, 'success');
    dbStore.logActivity(user.id, user.name, user.role, 'Download Invoice', `Downloaded Bill of Supply for ${order.order_number}`, businessId);

    handlePrintInvoice(order);
  };

  const handleEmailInvoice = (orderNumber: string, emailStr: string) => {
    triggerToast(`Invoice summary dispatched successfully to email inbox: ${emailStr}`, 'success');
    dbStore.logActivity(user.id, user.name, user.role, 'Email Invoice', `Emailed invoice copy for ${orderNumber} to ${emailStr}`, businessId);
  };


  // Filter orders strictly by time horizon and booking filter for the entire page (metrics & table)
  const horizonOrders = useMemo(() => {
    return orders.filter(o => {
      if (!isOrderInTimeHorizon(o, timeHorizon)) return false;
      if (bookingFilter === 'regular' && o.festive_booking) return false;
      if (bookingFilter === 'festive' && !o.festive_booking) return false;
      return true;
    });
  }, [orders, timeHorizon, bookingFilter]);

  // Filtered Orders for the Table (applies search & status filter on top of time horizon)
  const filteredOrders = useMemo(() => {
    return horizonOrders.filter(o => {
      if (statusFilter !== 'all' && o.status !== statusFilter) return false;
      const cust = customers.find(c => c.id === o.customer_id);
      const custName = o.customer_name || (cust ? cust.name : '');
      let query = searchQuery.toLowerCase().trim();
      
      // If the scanned text is a full URL from the Bill QR code, extract the order number
      if (query.includes('?inv=')) {
        try {
          const urlObj = new URL(searchQuery.trim());
          const invParam = urlObj.searchParams.get('inv');
          if (invParam) {
            query = invParam.toLowerCase().trim();
          }
        } catch (e) {
          // fallback regex if new URL fails
          const match = query.match(/inv=([^&]+)/);
          if (match) {
            query = decodeURIComponent(match[1]).toLowerCase().trim();
          }
        }
      }
      return !query || 
             o.order_number.toLowerCase().includes(query) || 
             custName.toLowerCase().includes(query) ||
             (o.area || '').toLowerCase().includes(query) ||
             (o.channel || '').toLowerCase().includes(query);
    });
  }, [horizonOrders, customers, searchQuery, statusFilter]);

  // Metric counts computed directly from time-horizon filtered orders
  const adjustedTotalOrders = horizonOrders.length;
  const adjustedPending = horizonOrders.filter(o => o.status === 'Pending' || o.status === 'Packing').length;
  const adjustedCompleted = horizonOrders.filter(o => o.status === 'Delivered').length;
  const adjustedTotalRevenue = horizonOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0);

  const horizonLabel = useMemo(() => {
    switch (timeHorizon) {
      case 'today': return 'Today';
      case 'yesterday': return 'Yesterday';
      case '7days': return 'Last 7 Days';
      case '30days': return 'Last 30 Days';
      case 'all': default: return 'All Time';
    }
  }, [timeHorizon]);


  return (
    <div className="space-y-4 max-w-full pb-8 px-0 font-sans text-slate-900 dark:text-slate-100 overflow-x-hidden" id="sales-module-root">
      <PageHeader
        title="Sales & Bookings Master"
        subtitle="Manage B2B/B2C pipelines, bulk orders, and corporate billing cycles"
        icon={FileText}
        rightContent={
          <div className="flex items-center gap-3">
            {/* Top Time Filter Dropdown */}
            <div className="relative shrink-0" ref={topFilterRef}>
              <button 
                onClick={() => setIsTopFilterMenuOpen(!isTopFilterMenuOpen)}
                className="h-8 px-3 flex items-center gap-2 bg-white/10 border border-white/10 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500 text-slate-200 cursor-pointer hover:bg-white/20 transition-colors text-[10px] font-bold"
                title="Filter by Time"
              >
                <Filter size={14} className="text-amber-500 shrink-0" />
                <span className="hidden sm:inline-block text-amber-400 font-extrabold">{horizonLabel}</span>
                <ChevronDown size={12} className="text-slate-400" />
              </button>
              
              {isTopFilterMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-700 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 text-slate-100">
                  <div className="p-2 space-y-1">
                    {['today', 'yesterday', '7days', '30days', 'all'].map((horizon) => (
                      <button
                        key={horizon}
                        onClick={() => {
                          setTimeHorizon(horizon as 'today'|'yesterday'|'7days'|'30days'|'all');
                          setIsTopFilterMenuOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-xl text-[11px] font-bold transition flex items-center justify-between ${
                          timeHorizon === horizon 
                             ? 'bg-amber-900/40 text-amber-500' 
                             : 'text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        {horizon === 'today' ? 'Today' : 
                         horizon === 'yesterday' ? 'Yesterday' : 
                         horizon === '7days' ? 'Last 7 Days' : 
                         horizon === '30days' ? 'Last 30 Days' : 'All Time'}
                        {timeHorizon === horizon && <CheckCircle2 size={14} className="text-amber-500" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        }
      />

      <div className="px-0.5 sm:px-1 space-y-4">
        {/* KPI Summary Cards Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Total Sales */}
          <div className="bg-blue-50/80 dark:bg-blue-950/30 border-l-4 border-l-blue-500 border-y border-r border-blue-200 dark:border-blue-800/60 p-3 sm:p-3.5 rounded-2xl shadow-xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between gap-2 h-28">
            <div className="flex items-center justify-between gap-1.5">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-lg shrink-0">
                  <FileText size={16} />
                </div>
                <span className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">TOTAL SALES</span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">Total</span>
            </div>
            <div className="flex items-baseline justify-between mt-auto">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[120px]">Orders processed</span>
              <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {adjustedTotalOrders.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Pending Orders */}
          <div className="bg-amber-50/80 dark:bg-amber-950/30 border-l-4 border-l-amber-500 border-y border-r border-amber-200 dark:border-amber-800/60 p-3 sm:p-3.5 rounded-2xl shadow-xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between gap-2 h-28">
            <div className="flex items-center justify-between gap-1.5">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-lg shrink-0">
                  <Clock size={16} />
                </div>
                <span className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">PENDING ORDERS</span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300">Pending</span>
            </div>
            <div className="flex items-baseline justify-between mt-auto">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[120px]">Awaiting packing</span>
              <span className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400 tracking-tight">
                {adjustedPending.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Completed Orders */}
          <div className="bg-emerald-50/80 dark:bg-emerald-950/30 border-l-4 border-l-emerald-500 border-y border-r border-emerald-200 dark:border-emerald-800/60 p-3 sm:p-3.5 rounded-2xl shadow-xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between gap-2 h-28">
            <div className="flex items-center justify-between gap-1.5">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-lg shrink-0">
                  <CheckCircle2 size={16} />
                </div>
                <span className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">COMPLETED</span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300">Delivered</span>
            </div>
            <div className="flex items-baseline justify-between mt-auto">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[120px]">Fulfilled & delivered</span>
              <span className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
                {adjustedCompleted.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Total Value */}
          <div className="bg-indigo-50/80 dark:bg-indigo-950/30 border-l-4 border-l-indigo-500 border-y border-r border-indigo-200 dark:border-indigo-800/60 p-3 sm:p-3.5 rounded-2xl shadow-xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between gap-2 h-28">
            <div className="flex items-center justify-between gap-1.5">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-lg shrink-0">
                  <TrendingUp size={16} />
                </div>
                <span className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">TOTAL VALUE</span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300">Revenue</span>
            </div>
            <div className="flex items-baseline justify-between mt-auto">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[120px]">Gross turnover</span>
              <span className="text-xl sm:text-2xl font-black text-indigo-600 dark:text-indigo-400 tracking-tight">
                ₹{adjustedTotalRevenue.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

      {/* Unified Search & Consolidated Filters Toolbar */}
      <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
        {/* Top Row: Search Input & Time Horizon Filter Chips */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[240px]">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search Order #, Customer name, Area zone..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-8 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 w-full text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X size={14} />
              </button>
            )}
          </div>

          {/* Horizon Time Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            <span className="text-[10px] uppercase font-bold text-slate-400 mr-1 shrink-0">Time:</span>
            {(['today', 'yesterday', '7days', '30days', 'all'] as const).map((h) => {
              const labels: Record<string, string> = { today: 'Today', yesterday: 'Yesterday', '7days': '7 Days', '30days': '30 Days', all: 'All Time' };
              const isActive = timeHorizon === h;
              return (
                <button
                  key={h}
                  onClick={() => setTimeHorizon(h)}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition cursor-pointer whitespace-nowrap border ${
                    isActive 
                      ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-xs font-extrabold' 
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200/80 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {labels[h]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Bottom Row: Pipeline Status Chips & Booking Type Chip */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
          {/* Pipeline Status Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
            <span className="text-[10px] uppercase font-bold text-slate-400 mr-1 shrink-0">Pipeline:</span>
            {[
              { id: 'all', label: `All (${horizonOrders.length})` },
              { id: 'Pending', label: `Pending (${horizonOrders.filter(o=>o.status==='Pending').length})` },
              { id: 'Packing', label: `Packing Started (${horizonOrders.filter(o=>o.status==='Packing').length})` },
              { id: 'Dispatched', label: `Out for Delivery (${horizonOrders.filter(o=>o.status==='Dispatched').length})` },
              { id: 'Delivered', label: `Completed (${horizonOrders.filter(o=>o.status==='Delivered').length})` },
            ].map((chip) => {
              const isActive = statusFilter === chip.id;
              return (
                <button
                  key={chip.id}
                  onClick={() => setStatusFilter(chip.id)}
                  className={`px-3 py-1 rounded-full text-[11px] font-bold transition cursor-pointer border whitespace-nowrap ${
                    isActive 
                      ? 'bg-slate-900 text-white border-slate-900 dark:bg-amber-500 dark:text-slate-950 dark:border-amber-500 shadow-xs' 
                      : 'bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  {chip.label}
                </button>
              );
            })}
          </div>

          {/* Booking Type Filter Chip */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] uppercase font-bold text-slate-400 shrink-0">Booking:</span>
            <button
              onClick={() => setBookingFilter(prev => prev === 'all' ? 'regular' : prev === 'regular' ? 'festive' : 'all')}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold transition cursor-pointer border ${
                bookingFilter === 'regular'
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : bookingFilter === 'festive'
                  ? 'bg-amber-500 text-slate-950 border-amber-500 font-black'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
              }`}
            >
              <Sparkles size={13} className={bookingFilter === 'festive' ? 'text-slate-950' : bookingFilter === 'regular' ? 'text-white' : 'text-amber-500'} />
              <span className="uppercase">{bookingFilter}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Primary orders table */}
      <div className="bg-white dark:bg-slate-900 overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs mt-3">
        <table className="w-full text-left text-[11px]">
          <thead className="bg-slate-100 dark:bg-slate-800/90 text-slate-700 dark:text-slate-200 font-extrabold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700 text-[10px]">
            <tr>
              <th className="py-2.5 px-3">Order ID</th>
              <th className="py-2.5 px-3">Customer</th>
              <th className="py-2.5 px-3">Area Zone</th>
              <th className="py-2.5 px-3">Items / Qty</th>
              <th className="py-2.5 px-3">Amount</th>
              <th className="py-2.5 px-3">Pipeline Status</th>
              <th className="py-2.5 px-3">Payment</th>
              <th className="py-2.5 px-3">Ordered / Delivery</th>
              <th className="py-2.5 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
            {filteredOrders.map((o) => {
              const cust = customers.find(c => c.id === o.customer_id);
              const custName = o.customer_name || (cust ? cust.name : 'Walk-in Customer');
              const isSelected = selectedOrderIds.includes(o.id);

              return (
                <tr 
                  key={o.id}
                  className={`hover:bg-slate-100/80 dark:hover:bg-slate-800/60 even:bg-slate-50/50 dark:even:bg-slate-800/20 transition-colors ${
                    isSelected ? 'bg-amber-50/60 dark:bg-amber-900/20' : ''
                  }`}
                >
                  <td className="py-2 px-3 font-black text-slate-900 dark:text-white">
                    <div className="flex items-center gap-1.5">
                      <button 
                        onClick={() => setSelectedOrderForDetail(o)}
                        className="hover:text-amber-500 cursor-pointer text-left transition-colors font-mono"
                      >
                        {o.order_number}
                      </button>
                      {o.festive_booking && (
                        <span className="px-1.5 py-0.2 rounded bg-amber-500/15 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 text-[9px] font-black border border-amber-300 dark:border-amber-700/80">
                          Festive
                        </span>
                      )}
                      {o.advance_booking && (
                        <span className="px-1.5 py-0.2 rounded bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 text-[9px] font-extrabold border border-indigo-200/80 dark:border-indigo-800/60">
                          Advance
                        </span>
                      )}
                      {o.is_updated && (
                        <span className="px-1.5 py-0.2 rounded bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-400 text-[9px] font-extrabold border border-sky-200/80 dark:border-sky-800/60">
                          Updated
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="py-2 px-3 font-semibold text-slate-800 dark:text-slate-200">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span>{custName}</span>
                      {o.channel && (
                        <span className="text-[10px] text-slate-400 font-normal">
                          ({o.channel})
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="py-2 px-3 font-semibold text-slate-700 dark:text-slate-300 text-xs">
                    <span className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200/80 dark:border-slate-700 font-medium text-[10px] text-slate-700 dark:text-slate-300">
                      📍 {o.area || 'Dahisar'}
                    </span>
                  </td>

                  <td className="py-2 px-3">
                    <div className="flex flex-col text-[10px] font-semibold text-slate-700 dark:text-slate-300">
                      <span>{o.items.length} Items</span>
                      <span className="text-slate-500">Qty: {o.items.reduce((acc, it) => acc + it.qty, 0)}</span>
                    </div>
                  </td>

                  <td className="py-2 px-3 font-black text-slate-900 dark:text-white">
                    {currencySymbol}{o.total_amount.toLocaleString()}
                  </td>

                  <td className="py-2 px-3">
                    <span className={`inline-flex items-center text-[10px] font-bold px-3 py-1 rounded-full border ${
                      o.status === 'Delivered' ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700' :
                      o.status === 'Returned' ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-700' :
                      o.status === 'Dispatched' ? 'bg-sky-100 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 border-sky-300 dark:border-sky-700' :
                      o.status === 'Packed' ? 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700' :
                      o.status === 'Packing' ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border-purple-300 dark:border-purple-700' :
                      o.status === 'Cancelled' ? 'bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700' :
                      'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700'
                    }`}>
                      {o.status === 'Packing' ? 'Packing Started' :
                       o.status === 'Packed' ? 'Ready / Packed' :
                       o.status === 'Dispatched' ? 'Out for Delivery' :
                       o.status === 'Delivered' ? 'Completed' : 
                       o.status === 'Returned' ? 'Returned' : o.status}
                    </span>
                  </td>

                  <td className="py-2 px-3">
                    <div className="flex flex-col gap-1">
                      <span className={`inline-flex w-fit items-center text-[9px] font-bold px-2 py-0.5 rounded border ${
                        o.payment_status === 'Paid' 
                          ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700' 
                          : o.payment_status === 'Partial'
                          ? 'bg-orange-100 dark:bg-orange-950/60 text-orange-800 dark:text-orange-300 border-orange-300 dark:border-orange-700'
                          : 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-700'
                      }`}>
                        {o.payment_status || 'Unpaid'}
                      </span>
                      {o.payment_status !== 'Unpaid' && o.payment_mode && (
                        <span className="text-[9px] font-semibold text-slate-500 dark:text-slate-400">
                          {(() => {
                            const m = (o.payment_mode || '').toLowerCase();
                            if (m.includes('cash')) return 'Cash';
                            if (m.includes('upi') || m.includes('qr')) return 'UPI';
                            if (m.includes('card')) return 'Card';
                            if (m.includes('bank') || m.includes('net')) return 'Net Banking';
                            if (m.includes('credit') || m.includes('account')) return 'On Credit';
                            return o.payment_mode;
                          })()}
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="py-2 px-3 text-slate-500 font-medium text-[10px]">
                    <div className="flex flex-col">
                      <span className="text-slate-800 dark:text-slate-200 font-semibold">{o.order_date || new Date(o.created_at).toLocaleDateString()}</span>
                      <span className="text-[9px]">{formatOrderTime(o.time, o.created_at)}</span>
                      {o.delivery_date && (
                        <span className="text-indigo-600 dark:text-indigo-400 font-bold mt-1 text-[9px]">Del: {o.delivery_date}</span>
                      )}
                    </div>
                  </td>

                  <td className="py-2 px-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {/* View Order Specification / Details */}
                      <button 
                        onClick={() => setSelectedOrderForDetail(o)}
                        className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg transition cursor-pointer"
                        title="View Order Details"
                      >
                        <Eye size={15} />
                      </button>

                      {/* Collect / Record Payment - Only for Partial / Advance Received and Unpaid / On Credit */}
                      {o.payment_status !== 'Paid' && (o.total_amount - (o.paid_amount || 0)) > 0.01 && (
                        <button 
                          onClick={() => {
                            setSelectedOrderForPayment(o);
                            setIsPaymentModalOpen(true);
                          }}
                          className="p-1.5 hover:bg-emerald-100 dark:hover:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-lg transition cursor-pointer"
                          title="Collect Payment / Record Receipt"
                        >
                          <CreditCard size={15} />
                        </button>
                      )}

                      {/* Print Invoice */}
                      <button 
                        onClick={() => handlePrintInvoice(o)}
                        className="p-1.5 hover:bg-indigo-100 dark:hover:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-lg transition cursor-pointer"
                        title="Print Invoice"
                      >
                        <Printer size={15} />
                      </button>

                      {/* Send Customer Tracking via WhatsApp */}
                      <button 
                        onClick={() => setSelectedOrderForNotify(o)}
                        className="p-1.5 hover:bg-amber-100 dark:hover:bg-amber-950/50 text-amber-600 dark:text-amber-400 rounded-lg transition cursor-pointer"
                        title="WhatsApp Tracking Link"
                      >
                        <Send size={15} />
                      </button>

                    </div>
                  </td>
                </tr>
              );
            })}

            {filteredOrders.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center py-12 text-slate-400 font-medium">
                  <div className="flex flex-col items-center justify-center gap-1.5">
                    <ShoppingBag size={28} className="text-slate-300 dark:text-slate-600" />
                    <p className="font-bold text-slate-600 dark:text-slate-300 text-xs">
                      No orders found.
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Try switching to "All Time" or reset your search & area filters to see more orders.
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ================= ORDER SPECIFICATIONS & RECEIPT MODAL ================= */}
      {selectedOrderForDetail && (
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedOrderForDetail(null);
          }}
          className="fixed inset-0 z-[70] bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
        >
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto custom-scrollbar">
            
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">
                  INVOICE & SPECIFICATIONS
                </span>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">
                  {selectedOrderForDetail.order_number}
                </h3>
              </div>
              <button 
                onClick={() => setSelectedOrderForDetail(null)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-full bg-slate-100 dark:bg-slate-800 cursor-pointer transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Order Content */}
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <strong className="text-sm font-extrabold text-slate-900 dark:text-white block">
                    {selectedOrderForDetail.customer_name || 'Walk-in Customer'}
                  </strong>
                  <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5 font-medium">
                    <MapPin size={12} className="text-amber-500 shrink-0" />
                    {selectedOrderForDetail.area || 'Dahisar'} zone
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-slate-400 block font-mono">Date: {selectedOrderForDetail.order_date}</span>
                  {selectedOrderForDetail.delivery_date && (
                    <span className="text-[11px] text-indigo-600 dark:text-indigo-400 block font-mono font-bold">Delivery: {selectedOrderForDetail.delivery_date}</span>
                  )}
                  <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 block">Time: {formatOrderTime(selectedOrderForDetail.time, selectedOrderForDetail.created_at)}</span>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Items Ordered</span>
                {(selectedOrderForDetail.items || []).map((it, idx) => {
                  const pObj = products.find(p => p.id === it.product_id);
                  return (
                    <div key={idx} className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-slate-100 dark:border-slate-800 text-xs">
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {pObj ? pObj.name : `Product ID #${it.product_id}`} × {it.qty}
                      </span>
                      <span className="font-black text-slate-900 dark:text-white">
                        {currencySymbol}{(it.selling_price * it.qty).toLocaleString()}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Total Summary */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Total Payable Amount</span>
                <span className="text-2xl font-black text-slate-900 dark:text-white">
                  {currencySymbol}{selectedOrderForDetail.total_amount.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Vertically stacked action buttons matching the attached image */}
            <div className="flex flex-col space-y-2.5 pt-2">
              <button 
                onClick={() => {
                  setViewingInvoiceOrder(selectedOrderForDetail);
                  setSelectedOrderForDetail(null);
                }}
                className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-2xl font-black text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <Printer size={16} /> Preview & Print Tax Invoice
              </button>
              <button
                onClick={() => handleDownload3InchBill(selectedOrderForDetail)}
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-md"
                title="Download 3-Inch Thermal Bill"
              >
                <Printer size={16} /> 3" Bill
              </button>
              <button
                onClick={() => handleDownloadPDFInvoice(selectedOrderForDetail)}
                className="w-full py-3.5 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white rounded-2xl font-black text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-md"
                title="Save & Download Tax Invoice PDF"
              >
                <Download size={16} /> Save PDF
              </button>
              {selectedOrderForDetail.payment_status !== 'Paid' && (selectedOrderForDetail.total_amount - (selectedOrderForDetail.paid_amount || 0)) > 0.01 && (
                <button 
                  onClick={() => {
                    setSelectedOrderForPayment(selectedOrderForDetail);
                    setSelectedOrderForDetail(null);
                    setIsPaymentModalOpen(true);
                  }}
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  <DollarSign size={16} /> Collect Payment
                </button>
              )}

              {selectedOrderForDetail.status === 'Delivered' && (
                <button 
                  onClick={() => {
                    if (window.confirm("Mark this order as Returned? Products will be added back to inventory and order status will be updated to 'Returned'.")) {
                      handleQuickStatusChange(selectedOrderForDetail.id, 'Returned');
                      setSelectedOrderForDetail(null);
                    }
                  }}
                  className="w-full py-3.5 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl font-black text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-md border-2 border-rose-400"
                >
                  <RotateCcw size={16} /> Return Order & Refund
                </button>
              )}

              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100 dark:border-slate-800 mt-2">
                <button
                  onClick={() => {
                    if (selectedOrderForDetail.status === 'Dispatched') {
                      triggerToast('Cannot edit an order that is out for delivery (Dispatched).', 'error');
                      return;
                    }
                    if (selectedOrderForDetail.delivery_status === 'Delivered') {
                      triggerToast('Note: This order is already delivered. Any changes will update the inventory records.', 'info');
                    }
                    setInvoiceToEdit(selectedOrderForDetail);
                    setSelectedOrderForDetail(null);
                  }}
                  className={`w-full py-3 rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5 ${selectedOrderForDetail.status === 'Dispatched' ? 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500 cursor-not-allowed' : 'bg-sky-100 hover:bg-sky-200 text-sky-700 dark:bg-sky-900/40 dark:hover:bg-sky-900/60 dark:text-sky-300 cursor-pointer'}`}
                >
                  <Edit size={14} /> Edit / Update
                </button>
                <button
                  onClick={() => {
                    setInvoiceToDelete({ id: selectedOrderForDetail.id, orderNumber: selectedOrderForDetail.order_number });
                    setSelectedOrderForDetail(null);
                  }}
                  className="w-full py-3 bg-rose-100 hover:bg-rose-200 text-rose-700 dark:bg-rose-900/40 dark:hover:bg-rose-900/60 dark:text-rose-300 rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Trash2 size={14} /> Delete Invoice
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ================= PAYMENT COLLECTION MODAL ================= */}
      {isPaymentModalOpen && selectedOrderForPayment && (
        <PaymentCollectionModal
          businessId={businessId}
          user={user}
          order={selectedOrderForPayment}
          type="Sales"
          onClose={() => {
            setIsPaymentModalOpen(false);
            setSelectedOrderForPayment(null);
          }}
          onSuccess={(updatedOrder) => {
            setOrders(dbStore.getSalesOrders(businessId));
          }}
          triggerToast={triggerToast}
        />
      )}

      {/* Invoice Detail printable popup modal */}
      {viewingInvoiceOrder && (() => {
        const custObj = customers.find(c => c.id === viewingInvoiceOrder.customer_id);
        const businessObj = dbStore.getBusiness(businessId);
        
        return (
          <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-2xl h-[90vh] flex flex-col shadow-2xl animate-in zoom-in duration-150 overflow-hidden">
              <div className="bg-slate-950 text-white px-6 py-4 flex items-center justify-between print:hidden">
                <div>
                  <h2 className="text-[11px] font-bold uppercase tracking-wider">Commercial Tax Invoice</h2>
                  <p className="text-[10px] text-slate-400">Order: {viewingInvoiceOrder.order_number}</p>
                </div>
                <button onClick={() => setViewingInvoiceOrder(null)} className="text-slate-300 hover:text-white cursor-pointer">
                  <X size={18} />
                </button>
              </div>              {/* Printable Area block */}
              <div className="flex-1 overflow-y-auto p-4 bg-slate-100 dark:bg-slate-950 print:p-0 print:bg-white" id="printable-tax-invoice">
                <BillOfSupplyView 
                  order={viewingInvoiceOrder} 
                  customer={custObj} 
                  businessObj={businessObj} 
                  products={products} 
                />
              </div>

              {/* Action buttons in two distinct rows */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 space-y-2 print:hidden">
                {/* Row 1 */}
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => handleDownloadPDFInvoice(viewingInvoiceOrder)}
                    className="py-2 px-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[11px] font-bold cursor-pointer flex items-center justify-center gap-1.5 shadow-xs transition"
                    title="Save / Download PDF Invoice Copy"
                  >
                    <Download size={14} className="shrink-0" />
                    <span className="truncate">Save / Download PDF</span>
                  </button>
                  <button
                    onClick={() => handleDownload3InchBill(viewingInvoiceOrder)}
                    className="py-2 px-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[11px] font-bold cursor-pointer flex items-center justify-center gap-1.5 shadow-xs transition"
                    title="Download 3-Inch Thermal Bill"
                  >
                    <Printer size={14} className="shrink-0" />
                    <span className="truncate">3" Bill</span>
                  </button>
                  <button 
                    id="email-invoice-btn"
                    onClick={() => handleEmailInvoice(viewingInvoiceOrder.order_number, custObj?.email || 'customer@omnipack.com')}
                    className="py-2 px-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 rounded-xl text-[11px] font-bold cursor-pointer flex items-center justify-center gap-1.5 transition"
                    title="Email PDF Invoice to Customer"
                  >
                    <Mail size={14} className="shrink-0" />
                    <span className="truncate">Email PDF Invoice</span>
                  </button>
                </div>

                {/* Row 2 */}
                <div className="grid grid-cols-4 gap-2">
                  <button 
                    onClick={() => {
                      if (viewingInvoiceOrder.status === 'Dispatched') {
                        triggerToast('Cannot edit an order that is out for delivery (Dispatched).', 'error');
                        return;
                      }
                      if (viewingInvoiceOrder.delivery_status === 'Delivered') {
                        triggerToast('Note: This order is already delivered. Any changes will update the inventory records.', 'info');
                      }
                      setInvoiceToEdit(viewingInvoiceOrder);
                      setViewingInvoiceOrder(null);
                    }}
                    className={`py-2 px-2 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition ${viewingInvoiceOrder.status === 'Dispatched' ? 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500 cursor-not-allowed' : 'bg-sky-100 dark:bg-sky-950/60 hover:bg-sky-200 dark:hover:bg-sky-900/80 text-sky-700 dark:text-sky-300 cursor-pointer'}`}
                    title="Edit Invoice"
                  >
                    <Edit size={14} className="shrink-0" />
                    <span className="truncate">Edit</span>
                  </button>
                  {user.role === 'Super Admin' ? (
                    <button 
                      onClick={() => handleDeleteInvoice(viewingInvoiceOrder.id, viewingInvoiceOrder.order_number)}
                      className="py-2 px-2 bg-rose-100 dark:bg-rose-950/60 hover:bg-rose-200 dark:hover:bg-rose-900/80 text-rose-700 dark:text-rose-300 rounded-xl text-[11px] font-bold cursor-pointer flex items-center justify-center gap-1.5 transition"
                      title="Delete Invoice"
                    >
                      <Trash2 size={14} className="shrink-0" />
                      <span className="truncate">Delete</span>
                    </button>
                  ) : (
                    <div />
                  )}
                  <button 
                    onClick={() => setViewingInvoiceOrder(null)}
                    className="py-2 px-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-xl text-[11px] font-bold cursor-pointer flex items-center justify-center gap-1.5 transition"
                  >
                    <X size={14} className="shrink-0" />
                    <span className="truncate">Close</span>
                  </button>
                  <button 
                    id="print-invoice-btn"
                    onClick={() => handlePrintInvoice(viewingInvoiceOrder)}
                    className="py-2 px-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-[11px] font-black cursor-pointer flex items-center justify-center gap-1.5 shadow-xs transition"
                  >
                    <Printer size={14} className="shrink-0" />
                    <span className="truncate">Print</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      </div>

      {/* Sales Order Placement modal dialog */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-0">
          <div className="bg-white dark:bg-slate-900 w-full h-[100dvh] flex flex-col animate-in zoom-in duration-150 overflow-hidden">
            <div className="bg-slate-50 dark:bg-slate-800 px-6 py-3.5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2 text-slate-900 dark:text-white">
                <PlusCircle className="text-amber-500" size={18} />
                <span>{editingOrderId ? 'Update Sales Order' : 'Create Sales Order'}</span>
              </h2>
              <button onClick={handleCloseCreateModal} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition"><X size={18} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div className="space-y-1 flex flex-col justify-end">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider block">
                      <span>Invoice Number *</span>
                    </label>
                    <span 
                      title="Real-time multi-user concurrency lock active. Guaranteed unique invoice number."
                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-300/60 dark:border-emerald-800/60 shadow-2xs select-none"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      Live Synced
                    </span>
                  </div>
                  <input 
                    type="text"
                    value={customInvoiceNumber || getSuggestedInvoiceNumber(isFestiveBooking, isAdvanceBooking)}
                    readOnly
                    placeholder="Auto-Generated Invoice #"
                    className="w-full px-3 py-2 bg-amber-50/70 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 text-[11px] rounded-lg border border-amber-300 dark:border-amber-800/80 focus:outline-hidden font-black cursor-not-allowed select-none"
                  />
                </div>
                <div className="md:col-span-3 space-y-1 flex flex-col justify-end">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider">Select Customer Party</label>
                    <button
                      type="button"
                      onClick={() => {
                        const nextState = !isNewCustomerSelected;
                        setIsNewCustomerSelected(nextState);
                        if (nextState) {
                          setSelectedCustomerId('');
                          setSelectedArea(currentBiz?.default_dispatch_zone || 'Dahisar');
                          setOrderItems(prev => recalculateOrderPrices(prev, undefined, isAdvanceBooking, isFestiveBooking));
                        } else {
                          setSelectedCustomerId('WALK_IN');
                          setOrderItems(prev => recalculateOrderPrices(prev, undefined, isAdvanceBooking, isFestiveBooking));
                        }
                      }}
                      className={`text-[11px] font-bold px-3 py-1 rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer ${
                        isNewCustomerSelected 
                          ? 'bg-rose-600 border-rose-500 text-white shadow-sm' 
                          : 'bg-white dark:bg-slate-800 border-indigo-200 dark:border-indigo-800 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-700 shadow-sm'
                      }`}
                    >
                      {isNewCustomerSelected ? <RotateCcw size={12} /> : <UserPlus size={12} />}
                      {isNewCustomerSelected ? 'Cancel' : 'Add New Customer'}
                    </button>
                  </div>

                  {!isNewCustomerSelected ? (
                    <CustomDropdown 
                      value={selectedCustomerId}
                      onChange={(val) => {
                        setSelectedCustomerId(val);
                        const c = customers.find(cust => cust.id === val);
                        if (c) {
                          setSelectedCustomerPhone(c.phone || '');
                          setSelectedCustomerAddress(c.billing_address || c.address || '');
                          setSelectedCustomerShippingAddress(c.shipping_address || c.billing_address || c.address || '');
                          setIsSameShippingAddress(!c.shipping_address || c.shipping_address === c.billing_address);
                          setPointsToRedeem(0);
                          if (c.area && c.area !== 'Other') {
                            setSelectedArea(c.area);
                          } else {
                            setSelectedArea(currentBiz?.default_dispatch_zone || 'Dahisar');
                          }
                          setOrderItems(prev => recalculateOrderPrices(prev, c, isAdvanceBooking, isFestiveBooking));
                        } else {
                          setSelectedCustomerPhone('');
                          setSelectedCustomerAddress('');
                          setSelectedCustomerShippingAddress('');
                          setIsSameShippingAddress(true);
                          setPointsToRedeem(0);
                          setSelectedArea(currentBiz?.default_dispatch_zone || 'Dahisar');
                          setOrderItems(prev => recalculateOrderPrices(prev, undefined, isAdvanceBooking, isFestiveBooking));
                        }
                      }}
                      placeholder="-- Select Customer --"
                      searchable={true}
                      options={[
                        { value: 'WALK_IN', label: 'Walk-in Customer (Instant POS)' },
                        ...customers.map(c => ({
                          value: c.id,
                          label: `${c.name} (Credit outstanding: ${currencySymbol}${c.outstanding_amount.toLocaleString()} | Points: ${c.loyalty_points || 0})`
                        }))
                      ]}
                    />
                  ) : (
                    <div className="h-10 px-3 flex items-center bg-indigo-50/50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-xl text-indigo-600 dark:text-indigo-400 text-xs font-bold italic">
                      <Sparkles size={14} className="mr-2 animate-pulse" />
                      Creating New Customer Profile...
                    </div>
                  )}
                </div>

                {isNewCustomerSelected && (
                  <div className="md:col-span-4 grid grid-cols-1 md:grid-cols-4 gap-4 bg-indigo-50/30 dark:bg-indigo-950/20 p-4 rounded-xl border border-indigo-200/50 dark:border-indigo-800/50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase">Customer Name *</label>
                      <input 
                        type="text"
                        value={newCustomerName}
                        onChange={(e) => setNewCustomerName(e.target.value)}
                        placeholder="Full Name"
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-[11px] rounded-lg border border-indigo-200 dark:border-indigo-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase">Mobile Number *</label>
                      <input 
                        type="text"
                        value={newCustomerPhone}
                        onChange={(e) => setNewCustomerPhone(e.target.value)}
                        placeholder="10-digit Mobile"
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-[11px] rounded-lg border border-indigo-200 dark:border-indigo-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase">Address / Street *</label>
                      <input 
                        type="text"
                        value={newCustomerAddress}
                        onChange={(e) => setNewCustomerAddress(e.target.value)}
                        placeholder="Billing Address"
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-[11px] rounded-lg border border-indigo-200 dark:border-indigo-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                      />
                    </div>
                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={() => {
                          if (!newCustomerName.trim() || !newCustomerPhone.trim() || !newCustomerAddress.trim()) {
                            triggerToast('Name, Phone and Address are required.', 'error');
                            return;
                          }
                          const newCust = dbStore.createCustomer({
                            name: newCustomerName.trim(),
                            group: 'Retail',
                            area: selectedArea || 'Dahisar',
                            gstin: '',
                            pan: '',
                            billing_address: newCustomerAddress.trim(),
                            shipping_address: newCustomerAddress.trim(),
                            email: '',
                            phone: newCustomerPhone.trim(),
                            credit_limit: 0,
                            business_id: businessId,
                            active: true
                          });
                          setSelectedCustomerId(newCust.id);
                          setPointsToRedeem(0);
                          setIsNewCustomerSelected(false);
                          setOrderItems(prev => recalculateOrderPrices(prev, newCust, isAdvanceBooking, isFestiveBooking));
                          triggerToast(`New customer "${newCust.name}" saved and selected.`, 'success');
                        }}
                        className="w-full h-10 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[11px] font-bold flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer"
                      >
                        <Save size={14} />
                        <span>Save Customer</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Inline Editable Customer Details Card in ONE ROW */}
                {!isNewCustomerSelected && (
                  <div className="md:col-span-4 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2.5 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-700/80 pb-1.5">
                      <div className="flex items-center gap-1.5">
                        <User size={13} className="text-indigo-600 dark:text-indigo-400" />
                        <span className="text-[10px] font-black uppercase text-slate-800 dark:text-slate-200 tracking-wider">
                          Customer Contact & Delivery Information
                        </span>
                      </div>
                      <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                        Inline Details
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 items-end">
                      {/* 1. Contact Number * */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase flex items-center gap-1">
                          <Phone size={10} />
                          <span>Contact Number *</span>
                        </label>
                        <input
                          type="text"
                          value={selectedCustomerPhone}
                          onChange={(e) => setSelectedCustomerPhone(e.target.value)}
                          placeholder="10-digit Mobile"
                          className="w-full h-8 px-2.5 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-[11px] font-bold rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>

                      {/* 2. Customer Address */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase flex items-center gap-1">
                          <MapPin size={10} />
                          <span>Customer Address</span>
                        </label>
                        <input
                          type="text"
                          value={selectedCustomerAddress}
                          onChange={(e) => {
                            setSelectedCustomerAddress(e.target.value);
                            if (isSameShippingAddress) {
                              setSelectedCustomerShippingAddress(e.target.value);
                            }
                          }}
                          placeholder="Street / Billing Address"
                          className="w-full h-8 px-2.5 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-[11px] font-medium rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>

                      {/* 3. Shipping Address */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase flex items-center gap-1">
                            <Building2 size={10} />
                            <span>Shipping Address</span>
                          </label>
                          <label className="inline-flex items-center gap-1 text-[9px] text-slate-500 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isSameShippingAddress}
                              onChange={(e) => {
                                setIsSameShippingAddress(e.target.checked);
                                if (e.target.checked) {
                                  setSelectedCustomerShippingAddress(selectedCustomerAddress);
                                }
                              }}
                              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <span>Same</span>
                          </label>
                        </div>
                        <input
                          type="text"
                          disabled={isSameShippingAddress}
                          value={isSameShippingAddress ? selectedCustomerAddress : selectedCustomerShippingAddress}
                          onChange={(e) => setSelectedCustomerShippingAddress(e.target.value)}
                          placeholder="Shipping / Delivery Address"
                          className={`w-full h-8 px-2.5 text-[11px] font-medium rounded-lg border focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                            isSameShippingAddress
                              ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700 cursor-not-allowed'
                              : 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-700'
                          }`}
                        />
                      </div>

                      {/* 4. Area Zone Location */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase flex items-center gap-1">
                          <MapPin size={10} className="text-indigo-500" />
                          <span>Area Zone Location</span>
                        </label>
                        {(() => {
                          const areaZoneList = currentBiz?.area_zones && currentBiz.area_zones.length > 0 
                            ? currentBiz.area_zones 
                            : ['Dahisar', 'Borivali', 'Kandivali', 'Mira Road', 'Vasai', 'Virar', 'Malad', 'Goregaon', 'Andheri'];
                          return (
                            <CustomDropdown 
                              value={selectedArea}
                              onChange={(val) => setSelectedArea(val)}
                              options={areaZoneList.map(aZone => ({ value: aZone, label: aZone }))}
                              className="font-bold text-slate-700 dark:text-slate-200 h-8 text-[11px]"
                            />
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                )}

                {/* Loyalty Account Banner */}
                {selectedCustomerId && selectedCustomerId !== 'WALK_IN' && (() => {
                  const selCust = customers.find(c => c.id === selectedCustomerId);
                  if (!selCust) return null;
                  const pts = selCust.loyalty_points || 0;
                  const tier = selCust.loyalty_tier || 'Silver';
                  const config = dbStore.getLoyaltyConfig(businessId);
                  const pointVal = config?.point_value || 1;
                  const isLoyal = selCust.is_loyal_member || tier === 'Gold' || tier === 'Platinum';

                  // Calculate estimated points earned for current order
                  const taxableVal = orderItems.reduce((sum, item) => sum + (item.qty * item.selling_price), 0);
                  const taxVal = orderItems.reduce((sum, item) => sum + (item.qty * item.selling_price * (item.gst_rate / 100)), 0);
                  const totalOrderAmount = Math.round(taxableVal + taxVal);
                  
                  const actualRedeem = Math.min(pts, pointsToRedeem);
                  const discountAmount = actualRedeem * pointVal;
                  const netSpend = Math.max(0, totalOrderAmount - discountAmount);
                  
                  const basePoints = Math.floor(netSpend / (config.spend_per_point || 100));
                  const newLifetimeSpend = (selCust.lifetime_spend || 0) + totalOrderAmount;
                  const newTier = dbStore.calculateCustomerTier(newLifetimeSpend, config, selCust.loyalty_tier);
                  
                  let multiplier = 1.0;
                  if (newTier === 'Gold') multiplier = config.gold_multiplier || 1.25;
                  if (newTier === 'Platinum') multiplier = config.platinum_multiplier || 1.5;
                  const pointsEarned = Math.floor(basePoints * multiplier);

                  return (
                    <div className={`md:col-span-4 p-3 rounded-xl border flex flex-wrap items-center justify-between gap-3 text-xs shadow-sm transition-all duration-300 ${isLoyal ? 'bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/40 border-amber-300 dark:border-amber-700 ring-2 ring-amber-500/20' : 'bg-gradient-to-r from-slate-50 to-indigo-50 dark:from-slate-900/40 dark:to-indigo-900/40 border-slate-200 dark:border-slate-700'}`}>
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl flex flex-col items-center justify-center min-w-[80px] ${tier === 'Platinum' ? 'bg-indigo-600 text-white' : tier === 'Gold' ? 'bg-amber-500 text-white' : 'bg-slate-500 text-white'}`}>
                          <span className="font-black text-[10px] tracking-tighter">{tier.toUpperCase()}</span>
                          <span className="text-[9px] opacity-90 font-bold">{isLoyal ? 'MEMBER' : 'TIER'}</span>
                        </div>
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-black text-slate-900 dark:text-white text-[12px]">
                              {selCust.name}
                            </span>
                            {isLoyal && (
                              <span className="px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 rounded text-[9px] font-black uppercase tracking-widest">LOYAL</span>
                            )}
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <span className="font-bold text-amber-600 dark:text-amber-400 text-[11px]">
                              {pts.toLocaleString()} Loyalty Points Available
                            </span>
                            <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                              <span>Value: {currencySymbol}{(pts * pointVal).toLocaleString()}</span>
                              {selCust.loyalty_end_date && (
                                <span className="flex items-center gap-1 before:content-['•'] before:mr-1">
                                  Expiry: <strong className={new Date(selCust.loyalty_end_date) < new Date() ? 'text-rose-500' : 'text-emerald-500'}>{new Date(selCust.loyalty_end_date).toLocaleDateString()}</strong>
                                </span>
                              )}
                            </div>
                            {Number(pointsToRedeem) > 0 && (
                              <div className="flex items-center gap-1.5 mt-1 text-[10px] font-mono">
                                <span className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-200 font-extrabold border border-amber-300 dark:border-amber-700 flex items-center gap-1">
                                  <span>Redeemed:</span>
                                  <strong className="font-black text-amber-950 dark:text-amber-100">-{Math.min(pts, Number(pointsToRedeem))} Pts</strong>
                                  <span className="text-amber-700 dark:text-amber-300">(-{currencySymbol}{(Math.min(pts, Number(pointsToRedeem)) * pointVal).toLocaleString()})</span>
                                </span>
                                <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/80 text-emerald-900 dark:text-emerald-200 font-extrabold border border-emerald-300 dark:border-emerald-700 flex items-center gap-1">
                                  <span>Remaining:</span>
                                  <strong className="font-black text-emerald-950 dark:text-emerald-100">{Math.max(0, pts - Math.min(pts, Number(pointsToRedeem))).toLocaleString()} Pts</strong>
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 ml-auto">
                        {pointsEarned > 0 && (
                          <div className="flex flex-col items-end px-4 border-r border-slate-200 dark:border-slate-700">
                            <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                              Earnings
                            </span>
                            <span className="font-black text-indigo-700 dark:text-indigo-300 text-sm">
                              +{pointsEarned} Pts
                            </span>
                          </div>
                        )}

                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                            Redeem Points
                          </label>
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              min={0}
                              max={pts > 0 ? pts : undefined}
                              value={pointsToRedeem === 0 ? '' : pointsToRedeem}
                              onFocus={e => e.target.select()}
                              onChange={e => {
                                const valStr = e.target.value;
                                if (valStr === '') {
                                  setPointsToRedeem(0);
                                } else {
                                  const num = parseInt(valStr, 10);
                                  if (!isNaN(num)) {
                                    const clamped = Math.max(0, pts > 0 ? Math.min(pts, num) : num);
                                    setPointsToRedeem(clamped);
                                  }
                                }
                              }}
                              className="w-20 px-2 py-1.5 bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700 rounded-lg font-mono font-bold text-center text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-xs transition-all"
                              placeholder="0"
                            />
                            {pts > 0 && (
                              <button 
                                type="button"
                                onClick={() => {
                                  if (pointsToRedeem === pts) {
                                    setPointsToRedeem(0);
                                  } else {
                                    setPointsToRedeem(pts);
                                  }
                                }}
                                className="px-2 py-1 bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/60 dark:hover:bg-amber-800 text-amber-800 dark:text-amber-200 text-[10px] font-extrabold rounded-lg transition-colors border border-amber-300 dark:border-amber-700 cursor-pointer shrink-0"
                                title={pointsToRedeem === pts ? 'Reset to 0 points' : `Redeem maximum ${pts} points`}
                              >
                                {pointsToRedeem === pts ? 'Clear' : 'Use Max'}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
                
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider">Invoice / Order Date *</label>
                    <input 
                      type="date"
                      value={orderDate}
                      onChange={(e) => setOrderDate(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-[11px] rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none font-medium cursor-pointer"
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                        Delivery Date
                      </label>
                      {deliveryDate && (
                        <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full ${
                          scheduledCountForSelectedDate === 0
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800'
                            : scheduledCountForSelectedDate <= 4
                            ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800'
                            : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-300 dark:border-rose-800 animate-pulse'
                        }`}>
                          {scheduledCountForSelectedDate} Scheduled
                        </span>
                      )}
                    </div>
                    <input 
                      type="date"
                      value={deliveryDate}
                      onChange={(e) => setDeliveryDate(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-[11px] rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none font-medium cursor-pointer"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider">Delivery Type</label>
                    <CustomDropdown 
                      value={deliveryType}
                      onChange={(val) => setDeliveryType(val)}
                      options={[
                        { value: 'Self delivery', label: 'Self delivery' },
                        { value: 'Out of india courier', label: 'Out of india courier' },
                        { value: 'Domestic courier', label: 'Domestic courier' },
                        { value: 'Third party app delivery', label: 'Third party app delivery' },
                        { value: 'Self pickup', label: 'Self pickup' }
                      ]}
                      placeholder="Select delivery type"
                    />
                  </div>
                </div>

                {/* 7-Day Live Delivery Load Tracker Chip Bar */}
                <div className="bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider flex items-center gap-1">
                      <Clock size={11} className="text-amber-500" />
                      <span>Delivery Load Tracker (Upcoming 7 Days)</span>
                    </span>
                    <span className="text-[9px] text-slate-400 italic">Click date chip to select</span>
                  </div>
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                    {upcoming7DaysLoad.map((item) => {
                      const isSelected = deliveryDate === item.date;
                      return (
                        <button
                          key={item.date}
                          type="button"
                          onClick={() => setDeliveryDate(item.date)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition flex items-center gap-1.5 shrink-0 border cursor-pointer ${
                            isSelected
                              ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-sm ring-1 ring-amber-400 font-black'
                              : item.count === 0
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-100'
                              : item.count <= 4
                              ? 'bg-amber-50/80 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/60 hover:bg-amber-100'
                              : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800/60 hover:bg-rose-100'
                          }`}
                        >
                          <span>{item.label}:</span>
                          <span className={`px-1 rounded text-[9px] font-black ${
                            isSelected ? 'bg-slate-950 text-amber-400' : 'bg-slate-200 dark:bg-slate-700'
                          }`}>
                            {item.count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

              <div className="pt-1 flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    id="advance-chk-sub"
                    checked={isAdvanceBooking}
                    onChange={(e) => handleToggleAdvanceBooking(e.target.checked)}
                    className="h-4 w-4 text-indigo-600 cursor-pointer rounded"
                  />
                  <label htmlFor="advance-chk-sub" className="text-[11px] font-black text-slate-900 dark:text-slate-100 uppercase flex items-center gap-1 cursor-pointer tracking-wider">
                    <Sparkles size={14} className="text-indigo-500" />
                    <span>Flag as Advance Booking</span>
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    id="fulfilled-chk-sub"
                    checked={isFulfilledImmediately}
                    onChange={(e) => {
                      setIsFulfilledImmediately(e.target.checked);
                      if (e.target.checked) setPaymentStatus('Paid');
                    }}
                    className="h-4 w-4 text-emerald-600 cursor-pointer rounded"
                  />
                  <label htmlFor="fulfilled-chk-sub" className="text-[11px] font-black text-emerald-700 dark:text-emerald-400 uppercase flex items-center gap-1 cursor-pointer tracking-wider">
                    <CheckCircle2 size={14} className="text-emerald-500" />
                    <span>Delivered / Handed Over</span>
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    id="festive-chk-sub"
                    checked={isFestiveBooking}
                    onChange={(e) => handleToggleFestiveBooking(e.target.checked)}
                    className="h-4 w-4 text-amber-600 cursor-pointer rounded"
                  />
                  <label htmlFor="festive-chk-sub" className="text-[11px] font-black text-amber-800 dark:text-amber-300 uppercase flex items-center gap-1 cursor-pointer tracking-wider">
                    <Sparkles size={14} className="text-amber-500" />
                    <span>Festive Booking</span>
                  </label>
                </div>
              </div>

              {/* Add item rows */}
              <div className="bg-slate-50 dark:bg-slate-850 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-[12px] font-black text-indigo-700 dark:text-indigo-300 uppercase tracking-widest flex items-center gap-2">
                    <div className="h-1 w-8 bg-indigo-500 rounded-full"></div>
                    Add Product Line
                  </h4>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded">
                      Default Tax Rate: {defaultTenantTax}%
                    </span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded">
                      Currency: {currencySymbol}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                  <div className="md:col-span-12 flex items-end mb-2">
                    <div className="w-full">
                      <label className="text-[11px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1 mb-1">
                        <ScanLine size={14} /> Fast Barcode Scan
                      </label>
                      <input 
                        ref={fastScanInputRef}
                        type="text" 
                        defaultValue=""
                        placeholder="Scan or type barcode here and press Enter..."
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const inputElem = e.currentTarget as HTMLInputElement;
                            const code = inputElem.value.trim();
                            if (!code) return;
                            
                            // Find product by SKU or exact name match from latest store data
                            const latestProducts = dbStore.getProducts(businessId);
                            const searchCode = code.toLowerCase();
                            const p = latestProducts.find(prod => 
                              String(prod.sku || '').trim().toLowerCase() === searchCode || 
                              String(prod.name || '').trim().toLowerCase() === searchCode || 
                              String(prod.id || '').trim() === code || 
                              String(prod.barcode || '').trim().toLowerCase() === searchCode
                            );
                            
                            if (p) {
                              const selCust = customers.find(c => c.id === selectedCustomerId);
                              const evalRes = calculateApplicablePrice(p, {
                                isLoyalMember: isLoyalMember(selCust),
                                isAdvanceBooking,
                                isDiwaliSale: isFestiveBooking,
                                business: currentBiz,
                                orderDate
                              });
                              
                              const defaultTax = (defaultTenantTax === 0 || p.gst_rate === 18 || typeof p.gst_rate !== 'number' || isNaN(p.gst_rate))
                                ? defaultTenantTax
                                : p.gst_rate;
                                
                              setOrderItems(prevItems => {
    const existingItem = prevItems.find(it => it.product_id === p.id);
    if (existingItem) {
      triggerToast('Item quantity updated.', 'success');
      return prevItems.map(it => 
        it.product_id === p.id 
          ? { ...it, qty: it.qty + 1 }
          : it
      );
    } else {
      const newItem = {
        product_id: p.id,
        qty: 1,
        scanned_qty: 0,
        selling_price: evalRes.appliedPrice,
        gst_rate: defaultTax,
        normal_rate: evalRes.normalRate,
        rate_type: evalRes.rateType,
        rate_reason: evalRes.rateReason,
        unit_savings: Math.max(0, evalRes.normalRate - evalRes.appliedPrice),
        is_overridden: false
      };
      triggerToast('Added: ' + p.name, 'success');
      return [...prevItems, newItem];
    }
  });
  inputElem.value = '';
  setTimeout(() => fastScanInputRef.current?.focus(), 10);
                            } else {
                              triggerToast('Product not found for barcode: ' + code, 'error');
  inputElem.value = '';
  setTimeout(() => fastScanInputRef.current?.focus(), 10);
                            }
                          }
                        }}
                        autoFocus
                        className="w-full px-4 py-2.5 bg-indigo-50/50 dark:bg-indigo-950/20 border-2 border-indigo-200 dark:border-indigo-800 rounded-xl text-sm font-black focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 text-slate-900 dark:text-slate-100 placeholder:text-indigo-300 dark:placeholder:text-indigo-700/50 transition-all"
                      />
                    </div>
                  </div>
                  
                  <div className="md:col-span-4">
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider block">Product SKU *</label>
                      <button
                        type="button"
                        onClick={() => handleOpenQuickCreateProduct('')}
                        className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/80 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 transition-all flex items-center gap-1 cursor-pointer shadow-2xs hover:shadow-xs active:scale-95"
                        title="Create new product and save directly to product catalogue"
                      >
                        <Plus size={11} className="stroke-[3]" />
                        <span>New Product</span>
                      </button>
                    </div>
                    <CustomDropdown 
                      value={rowProductId}
                      onChange={(val) => {
                        setRowProductId(val);
                        // set price according to selection
                        const p = products.find(prod => prod.id === val);
                        if (p) {
                          const selCust = customers.find(c => c.id === selectedCustomerId);
                          const evalRes = calculateApplicablePrice(p, {
                            isLoyalMember: isLoyalMember(selCust),
                            isAdvanceBooking,
                            isDiwaliSale: isFestiveBooking,
                            business: currentBiz,
                            orderDate
                          });
                          setRowPrice(evalRes.appliedPrice);
                          // Default to tenant default tax unless product has a specific valid GST rate
                          const defaultTax = (defaultTenantTax === 0 || p.gst_rate === 18 || typeof p.gst_rate !== 'number' || isNaN(p.gst_rate)) 
                            ? defaultTenantTax 
                            : p.gst_rate;
                          setRowTaxRate(defaultTax);
                        }
                      }}
                      placeholder="-- Choose Product SKU --"
                      searchable={true}
                      onAddNew={(searchVal) => handleOpenQuickCreateProduct(searchVal || '')}
                      addNewLabel="Create & Add New Product"
                      options={[
                        { value: '', label: '-- Choose Product SKU --' },
                        ...products.map(p => {
                          const selCust = customers.find(c => c.id === selectedCustomerId);
                          const evalRes = calculateApplicablePrice(p, {
                            isLoyalMember: isLoyalMember(selCust),
                            isAdvanceBooking,
                            isDiwaliSale: isFestiveBooking,
                            business: currentBiz,
                            orderDate
                          });
                          return {
                            value: p.id,
                            label: `${p.name} (SKU: ${p.sku} | ${evalRes.rateType}: ${currencySymbol}${evalRes.appliedPrice.toLocaleString()})`,
                            searchKeywords: `${p.barcode} ${p.sku}`
                          };
                        })
                      ]}
                      className="bg-white dark:bg-slate-800 font-medium"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-[11px] font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider block mb-1">Qty</label>
                    <div className="flex items-center">
                      <button
                        type="button"
                        onClick={() => setRowQty(Math.max(1, (Number(rowQty) || 1) - 1))}
                        className="px-2 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-l-lg border border-r-0 border-slate-200 dark:border-slate-700 font-bold cursor-pointer transition-colors"
                        title="Decrease Quantity"
                      >
                        <Minus size={12} />
                      </button>
                      <input 
                        type="number" 
                        min={1}
                        placeholder="Qty"
                        value={rowQty}
                        onFocus={(e) => e.target.select()}
                        onChange={(e) => {
                          const v = e.target.value;
                          if (v === '') {
                            setRowQty('');
                          } else {
                            const num = parseInt(v, 10);
                            setRowQty(isNaN(num) ? '' : Math.max(1, num));
                          }
                        }}
                        onBlur={() => {
                          if (rowQty === '' || Number(rowQty) < 1) {
                            setRowQty(1);
                          }
                        }}
                        className="w-full px-2 py-2 bg-white dark:bg-slate-800 text-[11px] text-center border border-slate-200 dark:border-slate-700 focus:outline-hidden font-mono text-slate-900 dark:text-slate-100 font-bold"
                      />
                      <button
                        type="button"
                        onClick={() => setRowQty((Number(rowQty) || 0) + 1)}
                        className="px-2 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-r-lg border border-l-0 border-slate-200 dark:border-slate-700 font-bold cursor-pointer transition-colors"
                        title="Increase Quantity"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-[11px] font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider block mb-1">Price ({currencySymbol})</label>
                    <input 
                      type="number" 
                      min={0}
                      step="any"
                      placeholder="Unit Price"
                      value={rowPrice}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (v === '') {
                          setRowPrice('');
                        } else {
                          const num = parseFloat(v);
                          setRowPrice(isNaN(num) ? '' : num);
                        }
                      }}
                      onBlur={() => {
                        if (rowPrice === '') {
                          setRowPrice(0);
                        }
                      }}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 text-[11px] rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-hidden font-mono text-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-[11px] font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider block mb-1">Tax Rate (%)</label>
                    <input 
                      type="number" 
                      min={0}
                      max={100}
                      step={0.1}
                      placeholder="Tax %"
                      value={rowTaxRate}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (v === '') {
                          setRowTaxRate('');
                        } else {
                          const num = parseFloat(v);
                          setRowTaxRate(isNaN(num) ? '' : num);
                        }
                      }}
                      onBlur={() => {
                        if (rowTaxRate === '') {
                          setRowTaxRate(defaultTenantTax);
                        }
                      }}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 text-[11px] rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-hidden font-mono text-slate-900 dark:text-slate-100 font-bold text-indigo-600 dark:text-indigo-400"
                    />
                  </div>
                  <div className="md:col-span-2 flex items-end">
                    <button 
                      type="button" 
                      onClick={handleAddLineItem}
                      className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[11px] font-bold transition-colors cursor-pointer"
                    >
                      + Add Item
                    </button>
                  </div>
                </div>
              </div>

              {/* Lines Grid Table */}
              <div className="space-y-2">
                <h4 className="text-[12px] font-black text-emerald-700 dark:text-emerald-300 uppercase tracking-widest flex items-center gap-2">
                  <div className="h-1 w-8 bg-emerald-500 rounded-full"></div>
                  Line Items Billing Grid
                </h4>
                <div className="border border-slate-100 dark:border-slate-800 rounded-xl overflow-x-auto text-[11px]">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-100 dark:bg-slate-800 text-[10px] font-black uppercase text-slate-900 dark:text-slate-100 tracking-wider">
                        <th className="p-3">Product Name</th>
                        <th className="p-3 text-right font-mono">Qty</th>
                        <th className="p-3 text-right font-mono">Selling Price ({currencySymbol})</th>
                        <th className="p-3 text-right font-mono">Tax Rate (%)</th>
                        <th className="p-3 text-right font-mono">Subtotal (Incl. Tax)</th>
                        <th className="p-3 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                      {orderItems.map((it, idx) => {
                        const p = products.find(prod => prod.id === it.product_id);
                        const itemQty = Number(it.qty) || 0;
                        const itemPrice = Number(it.selling_price) || 0;
                        const itemTax = Number(it.gst_rate) || 0;
                        const baseVal = itemQty * itemPrice;
                        const taxVal = baseVal * (itemTax / 100);
                        const itemTotal = baseVal + taxVal;
                        return (
                          <tr key={idx}>
                            <td className="p-3 font-sans font-semibold text-slate-900 dark:text-white">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span>{p?.name || 'Unknown Item'}</span>
                                {it.rate_type === 'LMR' && (
                                  <span className="text-[9px] px-1.5 py-0.5 bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-extrabold rounded border border-indigo-200 dark:border-indigo-800">
                                    👑 LMR
                                  </span>
                                )}
                                {it.rate_type === 'ABR' && (
                                  <span className="text-[9px] px-1.5 py-0.5 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-extrabold rounded border border-blue-200 dark:border-blue-800">
                                    📅 ABR
                                  </span>
                                )}
                                {it.rate_type === 'DDR' && (
                                  <span className="text-[9px] px-1.5 py-0.5 bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-extrabold rounded border border-amber-200 dark:border-amber-800">
                                    ✨ DDR
                                  </span>
                                )}
                                {it.is_overridden && (
                                  <span className="text-[9px] px-1.5 py-0.5 bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-extrabold rounded border border-rose-200 dark:border-rose-800">
                                    ⚙️ OVERRIDE
                                  </span>
                                )}
                              </div>
                              {it.rate_reason && (
                                <div className="text-[9.5px] text-slate-500 font-normal">
                                  {it.rate_reason}
                                </div>
                              )}
                            </td>
                            <td className="p-3 text-right font-sans font-bold">
                              <div className="flex items-center justify-end">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = [...orderItems];
                                    const curQty = Number(updated[idx].qty) || 1;
                                    updated[idx].qty = Math.max(1, curQty - 1);
                                    setOrderItems(updated);
                                  }}
                                  className="px-1.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-l border border-r-0 border-slate-200 dark:border-slate-700 font-bold cursor-pointer transition-colors"
                                  title="Decrease Quantity"
                                >
                                  <Minus size={10} />
                                </button>
                                <input 
                                  type="number" 
                                  min={1}
                                  value={it.qty}
                                  onFocus={(e) => e.target.select()}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    const updated = [...orderItems];
                                    if (val === '') {
                                      (updated[idx] as any).qty = '';
                                    } else {
                                      const num = parseInt(val, 10);
                                      (updated[idx] as any).qty = isNaN(num) ? '' : Math.max(1, num);
                                    }
                                    setOrderItems(updated);
                                  }}
                                  onBlur={() => {
                                    if (it.qty === ('' as any) || Number(it.qty) < 1) {
                                      const updated = [...orderItems];
                                      updated[idx].qty = 1;
                                      setOrderItems(updated);
                                    }
                                  }}
                                  className="w-12 px-1 py-1 text-center bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] focus:outline-hidden text-slate-900 dark:text-slate-100 font-bold"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = [...orderItems];
                                    const curQty = Number(updated[idx].qty) || 0;
                                    updated[idx].qty = curQty + 1;
                                    setOrderItems(updated);
                                  }}
                                  className="px-1.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-r border border-l-0 border-slate-200 dark:border-slate-700 font-bold cursor-pointer transition-colors"
                                  title="Increase Quantity"
                                >
                                  <Plus size={10} />
                                </button>
                              </div>
                            </td>
                            <td className="p-3 text-right">
                              <input 
                                type="number" 
                                min={0}
                                step="any"
                                value={it.selling_price}
                                onFocus={(e) => e.target.select()}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  const updated = [...orderItems];
                                  if (val === '') {
                                    (updated[idx] as any).selling_price = '';
                                  } else {
                                    const num = parseFloat(val);
                                    (updated[idx] as any).selling_price = isNaN(num) ? '' : num;
                                    updated[idx].is_overridden = true;
                                    updated[idx].rate_type = 'OVERRIDE';
                                    updated[idx].rate_reason = 'Admin Price Override';
                                  }
                                  setOrderItems(updated);
                                }}
                                onBlur={() => {
                                  if (it.selling_price === ('' as any) || isNaN(Number(it.selling_price))) {
                                    const updated = [...orderItems];
                                    updated[idx].selling_price = 0;
                                    setOrderItems(updated);
                                  }
                                }}
                                className="w-24 px-2 py-1 text-right bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-[11px] focus:outline-hidden text-slate-900 dark:text-slate-100"
                              />
                            </td>
                            <td className="p-3 text-right">
                              <input 
                                type="number" 
                                min={0}
                                max={100}
                                step={0.1}
                                value={it.gst_rate}
                                onFocus={(e) => e.target.select()}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  const updated = [...orderItems];
                                  if (val === '') {
                                    (updated[idx] as any).gst_rate = '';
                                  } else {
                                    const num = parseFloat(val);
                                    (updated[idx] as any).gst_rate = isNaN(num) ? '' : num;
                                  }
                                  setOrderItems(updated);
                                }}
                                onBlur={() => {
                                  if (it.gst_rate === ('' as any) || isNaN(Number(it.gst_rate))) {
                                    const updated = [...orderItems];
                                    updated[idx].gst_rate = 0;
                                    setOrderItems(updated);
                                  }
                                }}
                                className="w-16 px-2 py-1 text-right bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-[11px] focus:outline-hidden text-slate-900 dark:text-slate-100"
                              />
                            </td>
                            <td className="p-3 text-right font-bold text-indigo-600 dark:text-indigo-400">
                              {currencySymbol}{itemTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td className="p-3 text-center">
                              <button 
                                type="button"
                                onClick={() => handleRemoveLineItem(idx)}
                                className="text-rose-500 hover:underline font-sans font-semibold cursor-pointer"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                      {orderItems.length === 0 && (
                        <tr>
                          <td colSpan={6} className="text-center py-10 text-slate-400 font-sans">No line items added yet.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Payment Settlement Options */}
              <div className="bg-slate-50 dark:bg-slate-850 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/60 dark:border-slate-800 pb-2">
                  <h4 className="text-[12px] font-black text-indigo-700 dark:text-indigo-300 uppercase tracking-widest flex items-center gap-2">
                    <div className="h-1 w-8 bg-indigo-500 rounded-full"></div>
                    Payment & Settlement Options
                  </h4>
                  {(() => {
                    const { finalAmount, computedPaid, balance } = calculatedTotals;

                    return (
                      <div className="flex items-center gap-3 text-[11px] font-bold">
                        <span className="text-slate-500 dark:text-slate-400">
                          Total: <span className="font-mono text-slate-800 dark:text-slate-100">{currencySymbol}{finalAmount.toLocaleString()}</span>
                        </span>
                        <span className="text-slate-500 dark:text-slate-400">
                          Paid: <span className="font-mono text-emerald-600 dark:text-emerald-400">{currencySymbol}{computedPaid.toLocaleString()}</span>
                        </span>
                        <span className="text-slate-500 dark:text-slate-400">
                          Balance: <span className={`font-mono ${balance > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-600 dark:text-slate-400'}`}>{currencySymbol}{balance.toLocaleString()}</span>
                        </span>
                      </div>
                    );
                  })()}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider block">
                      Payment Status <span className="text-rose-500">*</span>
                    </label>
                    <CustomDropdown 
                      value={paymentStatus}
                      onChange={(val) => {
                        const st = val as 'Paid' | 'Partial' | 'Unpaid' | '';
                        setPaymentStatus(st);
                        if (st === 'Unpaid') {
                          setPaymentMode('Credit / On Account');
                          setPaidAmount('');
                        } else if (st === 'Paid') {
                          setPaymentMode('Cash');
                          setPaidAmount('');
                        } else if (st === 'Partial') {
                          if (paymentMode === 'Credit / On Account') {
                            setPaymentMode('Cash');
                          }
                        }
                        // Auto-fulfill if Paid and Walk-in
                        if (st === 'Paid' && selectedCustomerId === 'WALK_IN') {
                          // We no longer auto-fulfill because it locks the edit button.
                          // setIsFulfilledImmediately(true);
                        }
                      }}
                      placeholder="-- Select Payment Status --"
                      options={[
                        { value: '', label: '-- Select Payment Status --' },
                        { value: 'Paid', label: 'Fully Paid (Settled)' },
                        { value: 'Partial', label: 'Partial / Advance Received' },
                        { value: 'Unpaid', label: 'Unpaid / On Credit' }
                      ]}
                      className={`bg-white dark:bg-slate-800 font-bold ${!paymentStatus ? 'border-amber-300 dark:border-amber-700' : ''}`}
                    />
                  </div>

                  {(paymentStatus === 'Paid' || paymentStatus === 'Partial') && (
                    <div className="space-y-1">
                      <label className="text-[11px] font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider block">Payment Method / Mode</label>
                      <CustomDropdown 
                        value={paymentMode}
                        onChange={(val) => setPaymentMode(val)}
                        options={[
                          { value: 'Cash', label: 'Cash' },
                          { value: 'UPI / QR', label: 'UPI / QR Code' },
                          { value: 'Card', label: 'Card (Credit/Debit)' },
                          { value: 'Bank Transfer', label: 'Bank Transfer / NEFT' },
                          { value: 'Credit / On Account', label: 'Credit / On Account' }
                        ]}
                        className="bg-white dark:bg-slate-800"
                      />
                    </div>
                  )}

                  {paymentStatus === 'Partial' && (
                    <div className="space-y-1">
                      <label className="text-[11px] font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider block">Advance / Received Amount ({currencySymbol})</label>
                      <input 
                        type="number"
                        min={0}
                        placeholder="Enter advance/received amount"
                        value={paidAmount}
                        onChange={(e) => setPaidAmount(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-[11px] rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-hidden font-mono font-bold text-emerald-600 dark:text-emerald-400"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Actions Footer */}
            {(() => {
              const {
                taxableVal,
                taxVal,
                subtotalBeforeDiscount,
                discountAmount,
                displayDiscountPerc,
                displayDiscountAmt,
                finalAmount,
                actualRedeem
              } = calculatedTotals;
              const totalVal = finalAmount;
              const savingsInfo = calculateOrderSavings(orderItems, products);
              const selectedCust = customers.find(c => c.id === selectedCustomerId);
              const pointVal = dbStore.getLoyaltyConfig(businessId)?.point_value || 1;

              return (
                <div className="p-4 bg-slate-900 text-white border-t border-slate-800 flex flex-col gap-3 rounded-b-2xl shadow-xl">
                  {savingsInfo.totalSavings > 0 && (
                    <div className="px-3 py-2 bg-gradient-to-r from-emerald-900/80 to-teal-900/80 border border-emerald-500/50 rounded-xl text-emerald-100 text-xs font-bold flex items-center justify-between gap-2 shadow-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-base">🎉</span>
                        <span className="font-extrabold">{savingsInfo.bannerMessage}</span>
                      </div>
                      <span className="text-[10px] font-mono font-black text-emerald-300 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-700">
                        Total Member Savings: {currencySymbol}{savingsInfo.totalSavings.toLocaleString()}
                      </span>
                    </div>
                  )}

                  {actualRedeem > 0 && selectedCust && (
                    <div className="bg-amber-950/60 px-3 py-2 rounded-xl border border-amber-600/50 flex items-center justify-between gap-3 text-[11px] font-mono">
                      <span className="text-amber-300 font-extrabold uppercase tracking-wider text-[10px]">Loyalty Points Status</span>
                      <div className="flex items-center gap-3">
                        <span className="text-amber-300 font-bold">
                          Redeemed: -{actualRedeem} Pts (-{currencySymbol}{(actualRedeem * pointVal).toLocaleString()})
                        </span>
                        <span className="text-emerald-400 font-bold border-l border-amber-800/80 pl-3">
                          Remaining: {Math.max(0, (selectedCust.loyalty_points || 0) - actualRedeem).toLocaleString()} Pts
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center pt-1">
                    {/* Left 7 Columns: Adjustment Controls Grid */}
                    <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-800/80 p-3 rounded-xl border border-slate-700/80">
                      <div>
                        <span className="text-[10px] text-rose-400 uppercase block font-black tracking-wider mb-1">
                          Discount (%)
                        </span>
                        <div className="flex items-stretch rounded-lg overflow-hidden border border-rose-500/50 bg-slate-900 focus-within:ring-2 focus-within:ring-rose-500">
                          <div className="px-2 bg-rose-950/80 text-rose-400 text-xs font-bold font-mono flex items-center justify-center border-r border-rose-800">
                            %
                          </div>
                          <input 
                            type="number"
                            min={0}
                            step="any"
                            placeholder="0"
                            value={customDiscountPercentage}
                            onFocus={(e) => {
                              e.target.select();
                              setDiscountType('Percentage');
                            }}
                            onChange={(e) => {
                              const val = e.target.value;
                              setDiscountType('Percentage');
                              setCustomDiscountPercentage(val);
                              setCustomDiscountAmount('');
                            }}
                            className="w-full pl-2 py-1.5 always-show-spinners bg-transparent text-xs font-mono font-bold text-rose-300 focus:outline-none text-right min-w-0"
                          />
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] text-rose-400 uppercase block font-black tracking-wider mb-1">
                          Discount ({currencySymbol})
                        </span>
                        <div className="flex items-stretch rounded-lg overflow-hidden border border-rose-500/50 bg-slate-900 focus-within:ring-2 focus-within:ring-rose-500">
                          <div className="px-2 bg-rose-950/80 text-rose-400 text-xs font-bold font-mono flex items-center justify-center border-r border-rose-800">
                            {currencySymbol}
                          </div>
                          <input 
                            type="number"
                            min={0}
                            step="any"
                            placeholder="0.00"
                            value={customDiscountAmount}
                            onFocus={(e) => {
                              e.target.select();
                              setDiscountType('Value');
                            }}
                            onChange={(e) => {
                              const val = e.target.value;
                              setDiscountType('Value');
                              setCustomDiscountAmount(val);
                              setCustomDiscountPercentage('');
                            }}
                            className="w-full pl-2 py-1.5 always-show-spinners bg-transparent text-xs font-mono font-bold text-rose-300 focus:outline-none text-right min-w-0"
                          />
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] text-amber-400 uppercase block font-black tracking-wider mb-1">
                          Addl. Chg ({currencySymbol})
                        </span>
                        <input 
                          type="text"
                          inputMode="decimal"
                          placeholder="0"
                          value={additionalCharges}
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9.]/g, '');
                            if (val === '') {
                              setAdditionalCharges('');
                            } else {
                              const num = parseFloat(val);
                              setAdditionalCharges(isNaN(num) ? '' : Math.max(0, num));
                            }
                          }}
                          className="w-full pl-2.5 py-1.5 always-show-spinners bg-slate-900 border border-amber-500/50 rounded-lg text-xs font-mono font-bold text-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-right"
                        />
                      </div>

                      <div>
                        <span className="text-[10px] text-amber-400 uppercase block font-black tracking-wider mb-1">
                          Del. Chg ({currencySymbol})
                        </span>
                        <input 
                          type="text"
                          inputMode="decimal"
                          placeholder="0"
                          value={deliveryCharges}
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9.]/g, '');
                            if (val === '') {
                              setDeliveryCharges('');
                            } else {
                              const num = parseFloat(val);
                              setDeliveryCharges(isNaN(num) ? '' : Math.max(0, num));
                            }
                          }}
                          className="w-full pl-2.5 py-1.5 always-show-spinners bg-slate-900 border border-amber-500/50 rounded-lg text-xs font-mono font-bold text-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-right"
                        />
                      </div>
                    </div>

                    {/* Right 5 Columns: Totals & Action Buttons */}
                    <div className="lg:col-span-5 flex flex-col justify-between items-end gap-3 pl-2">
                      <div className="flex items-center justify-end gap-4 text-right w-full">
                        <div>
                          <span className="text-[9.5px] text-slate-400 uppercase font-black tracking-wider block">Base Subtotal</span>
                          <span className="font-mono text-xs font-bold text-slate-200">
                            {currencySymbol}{taxableVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div>
                          <span className="text-[9.5px] text-emerald-400 uppercase font-black tracking-wider block">Tax (GST)</span>
                          <span className="font-mono text-xs font-bold text-emerald-400">
                            +{currencySymbol}{taxVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="pl-3 border-l border-slate-700">
                          <span className="text-[10.5px] text-indigo-300 uppercase font-black tracking-widest block">Grand Total Value</span>
                          <span className="text-xl font-mono font-black text-emerald-400">
                            {currencySymbol}{totalVal.toLocaleString()}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 justify-end w-full pt-1">
                        <button 
                          type="button" 
                          onClick={handleCloseCreateModal}
                          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 active:bg-slate-800 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs select-none touch-manipulation"
                        >
                          Cancel
                        </button>
                        
                        <div className="relative flex shadow-md shadow-indigo-950/60 rounded-xl">
                          <button 
                            type="button" 
                            disabled={isSubmitting}
                            onClick={() => handleCreateSalesOrder('close')}
                            className={`px-5 py-2 text-xs font-bold transition-all cursor-pointer flex items-center gap-2 rounded-l-xl select-none touch-manipulation ${
                              isSubmitting 
                                ? 'bg-slate-700 cursor-not-allowed text-slate-400' 
                                : 'bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white'
                            }`}
                          >
                            {isSubmitting ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
                            {editingOrderId ? 'Update Order' : 'Save Order'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsSubmitDropdownOpen(!isSubmitDropdownOpen)}
                            className="px-2.5 py-2 bg-indigo-700 hover:bg-indigo-600 text-white border-l border-indigo-500/50 transition-colors cursor-pointer flex items-center rounded-r-xl select-none touch-manipulation"
                          >
                            <ChevronDown size={14} className={`transition-transform duration-200 ${isSubmitDropdownOpen ? 'rotate-180' : ''}`} />
                          </button>
                          
                          {isSubmitDropdownOpen && (
                            <div className="absolute bottom-full right-0 mb-2 w-48 bg-slate-800 text-slate-100 rounded-xl shadow-2xl border border-slate-700 overflow-hidden z-50 animate-in slide-in-from-bottom-2 duration-150">
                               <button 
                                 type="button"
                                 onClick={() => handleCreateSalesOrder('print')}
                                 className="w-full px-4 py-3 text-left text-xs font-bold hover:bg-slate-700 flex items-center justify-between transition-colors cursor-pointer group"
                               >
                                 <span className="group-hover:text-indigo-400 transition-colors">Save & Print</span>
                                 <Printer size={14} className="text-slate-400 group-hover:text-indigo-400" />
                               </button>
                               <button 
                                 type="button"
                                 onClick={() => handleCreateSalesOrder('share')}
                                 className="w-full px-4 py-3 text-left text-xs font-bold hover:bg-slate-700 flex items-center justify-between border-t border-slate-700/60 transition-colors cursor-pointer group"
                               >
                                 <span className="group-hover:text-indigo-400 transition-colors">Save & Share</span>
                                 <Share2 size={14} className="text-slate-400 group-hover:text-indigo-400" />
                               </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
      {/* Delete Confirmation Modal */}
      {invoiceToDelete && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl p-6 text-center animate-in zoom-in-95 duration-150">
            <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/30 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 size={32} />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Delete Invoice</h3>
            <p className="text-[13px] text-slate-500 mb-6">
              Are you sure you want to delete invoice <strong>{invoiceToDelete.orderNumber}</strong>? This action cannot be undone.
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setInvoiceToDelete(null)}
                className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-[13px] rounded-xl transition cursor-pointer"
              >
                No, Cancel
              </button>
              <button
                onClick={confirmDeleteInvoice}
                className="flex-1 py-3 px-4 bg-rose-600 hover:bg-rose-500 text-white font-bold text-[13px] rounded-xl shadow-md transition cursor-pointer"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Confirmation Modal */}
      {invoiceToEdit && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl p-6 text-center animate-in zoom-in-95 duration-150">
            <div className="w-16 h-16 bg-sky-100 dark:bg-sky-900/30 text-sky-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Edit size={32} />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Edit Invoice</h3>
            <p className="text-[13px] text-slate-500 mb-6">
              Do you want to edit or update invoice <strong>{invoiceToEdit.order_number}</strong>?
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setInvoiceToEdit(null)}
                className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-[13px] rounded-xl transition cursor-pointer"
              >
                No, Cancel
              </button>
              <button
                onClick={() => {
                  handleOpenEditModal(invoiceToEdit);
                  setInvoiceToEdit(null);
                }}
                className="flex-1 py-3 px-4 bg-sky-600 hover:bg-sky-500 text-white font-bold text-[13px] rounded-xl shadow-md transition cursor-pointer"
              >
                Yes, Edit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WhatsApp Invoice Dispatch Modal */}
      {selectedOrderForNotify && (
        <WhatsAppNotifyModal
          order={selectedOrderForNotify}
          onClose={() => setSelectedOrderForNotify(null)}
          customers={customers}
          business={dbStore.getBusiness(businessId)}
          triggerToast={triggerToast}
        />
      )}

      {/* Quick Create Product Modal */}
      {isQuickCreateProductOpen && (
        <QuickCreateProductModal
          isOpen={isQuickCreateProductOpen}
          onClose={() => setIsQuickCreateProductOpen(false)}
          businessId={businessId}
          user={user}
          initialName={quickCreateInitialName}
          currencySymbol={currencySymbol}
          defaultTenantTax={defaultTenantTax}
          onProductCreated={handleProductCreatedFromModal}
          triggerToast={triggerToast}
        />
      )}
    </div>
  );
};
