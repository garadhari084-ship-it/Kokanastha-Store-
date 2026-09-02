import { PaymentCollectionModal } from './PaymentCollectionModal';
import { WhatsAppNotifyModal } from './WhatsAppNotifyModal';
import { PageHeader } from './PageHeader';
import { QuickCreateProductModal } from './QuickCreateProductModal';
import { QuickCreateCustomerModal } from './QuickCreateCustomerModal';
import { OutOfStockRestockModal } from './OutOfStockRestockModal';
import { CreateInvoiceView } from './CreateInvoiceView';
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
  Building2,
  ChevronLeft
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
    
    // Add notification to packing staff only
    const orderNum = orders.find(o => o.id === orderId)?.order_number || orderId;
    const statusMsg = `Sales Order ${orderNum} status has been updated to ${newStatus}.`;
    
    const allUsers = dbStore.getUsers(businessId);
    const packingStaff = allUsers.filter(u => u.role && (u.role === 'Packing Staff' || u.role.toLowerCase().includes('pack')));

    if (packingStaff.length > 0) {
      packingStaff.forEach(staff => {
        dbStore.sendMessage({
          sender_id: user.id,
          receiver_id: staff.id,
          content: statusMsg,
          business_id: businessId
        });
      });
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
  const [selectedPincode, setSelectedPincode] = useState('');
  const [isSameShippingAddress, setIsSameShippingAddress] = useState(true);

  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [isSubmitDropdownOpen, setIsSubmitDropdownOpen] = useState(false);
  const [customInvoiceNumber, setCustomInvoiceNumber] = useState<string>('');
  const draftSessionIdRef = useRef<string>(openAddModalInitially && !selectedOrderIdInitially ? crypto.randomUUID() : '');
  const isCreateModalOpenRef = useRef<boolean>(openAddModalInitially && !selectedOrderIdInitially);

  const getSuggestedInvoiceNumber = (isFestive: boolean, isAdvance: boolean) => {
    return dbStore.getNextAvailableInvoiceNumber(
      businessId,
      isFestive,
      isAdvance,
      draftSessionIdRef.current
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
    if (!editingOrderId && isCreateModalOpenRef.current && draftSessionIdRef.current) {
      const allocated = dbStore.reserveDraftInvoiceNumber(
        businessId,
        user.id,
        user.name,
        draftSessionIdRef.current,
        isFestiveBooking,
        val
      );
      setCustomInvoiceNumber(allocated);
    }
    const cust = customers.find(c => c.id === selectedCustomerId);
    setOrderItems(prev => recalculateOrderPrices(prev, cust, val, isFestiveBooking));
  };

  const handleToggleFestiveBooking = (val: boolean) => {
    setIsFestiveBooking(val);
    if (!editingOrderId && isCreateModalOpenRef.current && draftSessionIdRef.current) {
      const allocated = dbStore.reserveDraftInvoiceNumber(
        businessId,
        user.id,
        user.name,
        draftSessionIdRef.current,
        val,
        isAdvanceBooking
      );
      setCustomInvoiceNumber(allocated);
    }
    const cust = customers.find(c => c.id === selectedCustomerId);
    setOrderItems(prev => recalculateOrderPrices(prev, cust, isAdvanceBooking, val));
  };

  const handleSetBookingType = (isAdvance: boolean, isFestive: boolean, isDelivered: boolean = false) => {
    setIsAdvanceBooking(isAdvance);
    setIsFestiveBooking(isFestive);
    setIsFulfilledImmediately(isDelivered);
    if (isDelivered) {
      setPaymentStatus('Paid');
    }
    if (!editingOrderId && isCreateModalOpenRef.current && draftSessionIdRef.current) {
      const allocated = dbStore.reserveDraftInvoiceNumber(
        businessId,
        user.id,
        user.name,
        draftSessionIdRef.current,
        isFestive,
        isAdvance
      );
      setCustomInvoiceNumber(allocated);
    }
    const cust = customers.find(c => c.id === selectedCustomerId);
    setOrderItems(prev => recalculateOrderPrices(prev, cust, isAdvance, isFestive));
  };

  // Quick line-item row helper
  const [rowProductId, setRowProductId] = useState('');
  const fastScanInputRef = useRef<HTMLInputElement>(null);
  const [rowQty, setRowQty] = useState<number | string>(1);
  const [rowPrice, setRowPrice] = useState<number | string>(0);
  const [rowTaxRate, setRowTaxRate] = useState<number | string>(defaultTenantTax);

  // Out of Stock Restock Modal state
  const [outOfStockProduct, setOutOfStockProduct] = useState<Product | null>(null);

  // Quick Create Customer Modal state
  const [isQuickCreateCustomerOpen, setIsQuickCreateCustomerOpen] = useState(false);
  const [quickCreateCustomerInitialName, setQuickCreateCustomerInitialName] = useState('');

  // Quick Create Product Modal state
  const [isQuickCreateProductOpen, setIsQuickCreateProductOpen] = useState(false);
  const [quickCreateInitialName, setQuickCreateInitialName] = useState('');

  const handleDirectAddProduct = (prod: Product, qty: number = 1, customPrice?: number, customTax?: number) => {
    const finalQty = Math.max(1, qty || 1);
    const selCust = customers.find(c => c.id === selectedCustomerId);
    const evalRes = calculateApplicablePrice(prod, {
      isLoyalMember: isLoyalMember(selCust),
      isAdvanceBooking,
      isDiwaliSale: isFestiveBooking,
      business: currentBiz,
      orderDate
    });

    const isCustomPrice = typeof customPrice === 'number' && !isNaN(customPrice) && customPrice !== evalRes.appliedPrice;
    const finalPrice = typeof customPrice === 'number' && !isNaN(customPrice) ? customPrice : evalRes.appliedPrice;
    
    const defaultTax = typeof customTax === 'number' && !isNaN(customTax) && customTax >= 0
      ? customTax
      : ((defaultTenantTax === 0 || prod.gst_rate === 18 || typeof prod.gst_rate !== 'number' || isNaN(prod.gst_rate))
          ? defaultTenantTax
          : (prod.gst_rate || defaultTenantTax));

    const newItem: SalesItem = {
      id: crypto.randomUUID(),
      product_id: prod.id,
      qty: finalQty,
      scanned_qty: 0,
      selling_price: finalPrice,
      gst_rate: defaultTax,
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

    const existingItem = orderItems.find(it => it.product_id === prod.id);
    if (existingItem) {
      triggerToast(`Updated qty to ${(Number(existingItem.qty) || 0) + finalQty}x ${prod.name}`, 'info');
      setOrderItems(prevItems => {
        const existingItemIndex = prevItems.findIndex(it => it.product_id === prod.id);
        if (existingItemIndex >= 0) {
          const updatedItems = [...prevItems];
          updatedItems[existingItemIndex] = {
            ...updatedItems[existingItemIndex],
            qty: (Number(updatedItems[existingItemIndex].qty) || 0) + finalQty
          };
          return updatedItems;
        }
        return [...prevItems, newItem];
      });
    } else {
      triggerToast(`Added ${finalQty}x "${prod.name}" to order`, 'success');
      setOrderItems(prevItems => [...prevItems, newItem]);
    }
  };

  const handleOpenQuickCreateCustomer = (searchName: string = '') => {
    setQuickCreateCustomerInitialName(searchName);
    setIsQuickCreateCustomerOpen(true);
  };

  const handleCustomerCreatedFromModal = (newCust: Customer) => {
    const latestCustomers = dbStore.getCustomers(businessId);
    setCustomers(latestCustomers);
    setSelectedCustomerId(newCust.id);
    setSelectedCustomerPhone(newCust.phone || '');
    setSelectedCustomerAddress(newCust.billing_address || '');
    setSelectedCustomerShippingAddress(newCust.shipping_address || newCust.billing_address || '');
    setSelectedPincode(newCust.pin_code || '');
    setIsSameShippingAddress(!newCust.shipping_address || newCust.shipping_address === newCust.billing_address);
    setPointsToRedeem(0);
    if (newCust.area && newCust.area !== 'Other') {
      setSelectedArea(newCust.area);
    } else {
      setSelectedArea(currentBiz?.default_dispatch_zone || 'Dahisar');
    }
    setOrderItems(prev => recalculateOrderPrices(prev, newCust, isAdvanceBooking, isFestiveBooking));
  };

  const handleOpenQuickCreateProduct = (searchName: string = '') => {
    setQuickCreateInitialName(searchName);
    setIsQuickCreateProductOpen(true);
  };

  const handleRestockSuccessFromModal = (
    updatedProd: Product, 
    addedStock: number, 
    action: 'add_to_order' | 'select_only',
    orderQty: number = 1
  ) => {
    const latestProducts = dbStore.getProducts(businessId);
    setProducts(latestProducts);
    const freshProd = latestProducts.find(p => p.id === updatedProd.id) || updatedProd;

    if (action === 'add_to_order') {
      handleDirectAddProduct(freshProd, orderQty);
      setRowProductId('');
      setRowQty(1);
      setOutOfStockProduct(null);
      triggerToast(`Restocked +${addedStock} ${freshProd.unit || 'units'} & added ${orderQty}x "${freshProd.name}" to order!`, 'success');
    } else {
      // select_only
      setRowProductId(freshProd.id);
      const selCust = customers.find(c => c.id === selectedCustomerId);
      const evalRes = calculateApplicablePrice(freshProd, {
        isLoyalMember: isLoyalMember(selCust),
        isAdvanceBooking,
        isDiwaliSale: isFestiveBooking,
        business: currentBiz,
        orderDate
      });
      setRowPrice(evalRes.appliedPrice);
      const defaultTax = (defaultTenantTax === 0 || freshProd.gst_rate === 18 || typeof freshProd.gst_rate !== 'number' || isNaN(freshProd.gst_rate)) 
        ? defaultTenantTax 
        : freshProd.gst_rate;
      setRowTaxRate(defaultTax);
      setRowQty(Math.max(1, orderQty || 1));
      setOutOfStockProduct(null);
      triggerToast(`Restocked +${addedStock} ${freshProd.unit || 'units'}. Product ready in order row.`, 'success');
    }
  };

  const handleProductCreatedFromModal = (newProd: Product, action: 'select' | 'add_to_order', initialQty: number = 1) => {
    const latestProducts = dbStore.getProducts(businessId);
    setProducts(latestProducts);

    if (action === 'add_to_order') {
      const targetProd = latestProducts.find(p => p.id === newProd.id) || newProd;
      handleDirectAddProduct(targetProd, initialQty);
      setRowProductId('');
      setRowQty(1);
      setRowPrice(0);
      setRowTaxRate(defaultTenantTax);
      return;
    }

    if (action === 'select') {
      if ((newProd.current_stock ?? 0) <= 0 && !isAdvanceBooking && !isFestiveBooking) {
        setOutOfStockProduct(newProd);
        return;
      }
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
    setSelectedPincode('');
    setIsSameShippingAddress(true);
    setRowProductId('');
    setRowQty(1);
    setRowPrice(0);
    setRowTaxRate(typeof biz?.tax_rate_default === 'number' && !isNaN(biz.tax_rate_default) ? biz.tax_rate_default : 0);
    setIsSubmitDropdownOpen(false);
  };

  useEffect(() => {
    isCreateModalOpenRef.current = isCreateModalOpen;
    if (isCreateModalOpen && !editingOrderId && draftSessionIdRef.current) {
      // Keep reservation fresh while modal stays open (heartbeat every 3 seconds)
      const interval = setInterval(() => {
        if (draftSessionIdRef.current && isCreateModalOpenRef.current) {
          dbStore.renewDraftReservation(draftSessionIdRef.current);
        }
      }, 3000);

      return () => {
        clearInterval(interval);
      };
    }
  }, [isCreateModalOpen, editingOrderId]);

  // Clean up any held reservation when module unmounts or browser tab closes
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (draftSessionIdRef.current) {
        dbStore.releaseDraftReservation(draftSessionIdRef.current);
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (draftSessionIdRef.current) {
        dbStore.releaseDraftReservation(draftSessionIdRef.current);
      }
    };
  }, []);

  useEffect(() => {
    return dbStore.subscribe(() => {
      setOrders(dbStore.getSalesOrders(businessId));
      setCustomers(dbStore.getCustomers(businessId));
      setProducts(dbStore.getProducts(businessId));

      // Live synchronize invoice number if Create Order modal is actively open
      if (isCreateModalOpenRef.current && !editingOrderId && draftSessionIdRef.current) {
        const activeRes = dbStore.getActiveDraftReservations(businessId).find(r => r.id === draftSessionIdRef.current);
        if (activeRes && activeRes.invoiceNumber) {
          setCustomInvoiceNumber(activeRes.invoiceNumber);
        }
      }
    });
  }, [businessId, editingOrderId]);

  const handleOpenAddModal = () => {
    const newDraftId = crypto.randomUUID();
    draftSessionIdRef.current = newDraftId;
    isCreateModalOpenRef.current = true;
    resetForm();
    const allocatedNum = dbStore.reserveDraftInvoiceNumber(
      businessId,
      user.id,
      user.name,
      newDraftId,
      false,
      false
    );
    setCustomInvoiceNumber(allocatedNum);
    setIsCreateModalOpen(true);
  };

  const handleCloseCreateModal = () => {
    isCreateModalOpenRef.current = false;
    const activeDraftId = draftSessionIdRef.current;
    draftSessionIdRef.current = '';
    if (activeDraftId) {
      dbStore.releaseDraftReservation(activeDraftId);
    }
    setIsCreateModalOpen(false);
    resetForm();
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
      setSelectedPincode(c.pin_code || '');
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

  const lastHandledTsRef = useRef<number | string | null>(null);

  useEffect(() => {
    const handleGlobalCreateOrder = () => {
      handleOpenAddModal();
    };
    window.addEventListener('open-create-order', handleGlobalCreateOrder);
    return () => window.removeEventListener('open-create-order', handleGlobalCreateOrder);
  }, [businessId, user]);

  useEffect(() => {
    const currentTs = deepLinkData?._ts || (deepLinkData?.openAddModal ? 'add' : (deepLinkData?.orderId ? `order-${deepLinkData.orderId}` : null));
    if (deepLinkData?.openAddModal || (openAddModalInitially && !deepLinkData && lastHandledTsRef.current === null)) {
      if (currentTs && lastHandledTsRef.current === currentTs) return;
      lastHandledTsRef.current = currentTs;
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
    } else if (deepLinkData?.orderId) {
      if (currentTs && lastHandledTsRef.current === currentTs) return;
      lastHandledTsRef.current = currentTs;
      const orderToView = orders.find(o => o.id === deepLinkData.orderId);
      if (orderToView) {
        setViewingInvoiceOrder(orderToView);
      }
    }
  }, [deepLinkData, openAddModalInitially, selectedOrderIdInitially, orders]);

  const handleAddLineItem = () => {
    if (!rowProductId) {
      triggerToast('Choose a product SKU first.', 'error');
      return;
    }
    const finalQty = Math.max(1, Number(rowQty) || 1);
    const latestProds = dbStore.getProducts(businessId);
    const prod = products.find(p => p.id === rowProductId) || latestProds.find(p => p.id === rowProductId);
    if (!prod) {
      triggerToast('Product not found. Please reselect.', 'error');
      return;
    }

    if ((prod.current_stock ?? 0) <= 0 && !isAdvanceBooking && !isFestiveBooking) {
      setOutOfStockProduct(prod);
      return;
    }

    const isCustomPrice = rowPrice !== '' && !isNaN(Number(rowPrice));
    const customPriceNum = isCustomPrice ? Number(rowPrice) : undefined;
    const isCustomTax = rowTaxRate !== '' && !isNaN(Number(rowTaxRate));
    const customTaxNum = isCustomTax ? Number(rowTaxRate) : undefined;

    handleDirectAddProduct(prod, finalQty, customPriceNum, customTaxNum);

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

    // Auto-capture pending row item if product was selected in row input
    let itemsToProcess = [...orderItems];
    if (itemsToProcess.length === 0 && rowProductId) {
      const selectedProd = products.find(p => p.id === rowProductId) || dbStore.getProducts(businessId).find(p => p.id === rowProductId);
      if (selectedProd) {
        const selCust = customers.find(c => c.id === selectedCustomerId);
        const evalRes = calculateApplicablePrice(selectedProd, {
          isLoyalMember: isLoyalMember(selCust),
          isAdvanceBooking,
          isDiwaliSale: isFestiveBooking,
          business: currentBiz,
          orderDate
        });
        const finalPrice = rowPrice !== '' && !isNaN(Number(rowPrice)) ? Number(rowPrice) : evalRes.appliedPrice;
        const finalTax = rowTaxRate !== '' && !isNaN(Number(rowTaxRate)) ? Number(rowTaxRate) : (selectedProd.gst_rate || defaultTenantTax);
        const finalQuantity = Math.max(1, Number(rowQty) || 1);

        itemsToProcess.push({
          id: crypto.randomUUID(),
          product_id: selectedProd.id,
          product_name: selectedProd.name,
          qty: finalQuantity,
          scanned_qty: 0,
          selling_price: finalPrice,
          gst_rate: finalTax,
          normal_rate: evalRes.normalRate,
          rate_type: evalRes.rateType,
          rate_reason: evalRes.rateReason,
          unit_savings: evalRes.unitSavings,
          is_overridden: Number(rowPrice) !== evalRes.appliedPrice
        });
        setOrderItems(itemsToProcess);
      }
    }

    if (itemsToProcess.length === 0) {
      triggerToast('Please select a Product SKU and add at least one line item to the order.', 'error');
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
      triggerToast('Warning: UNPAID order for Walk-in Customer. Debt tracking not available.', 'info');
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
            if (selectedCustomerPhone.trim() || selectedCustomerAddress.trim() || selectedCustomerShippingAddress.trim() || selectedPincode.trim()) {
              dbStore.updateCustomer(cObj.id, {
                phone: selectedCustomerPhone.trim() || cObj.phone,
                billing_address: selectedCustomerAddress.trim() || cObj.billing_address,
                shipping_address: isSameShippingAddress ? (selectedCustomerAddress.trim() || cObj.billing_address) : (selectedCustomerShippingAddress.trim() || cObj.shipping_address),
                pin_code: selectedPincode.trim() || cObj.pin_code
              });
            }
         }
      }

      const cleanItems: SalesItem[] = itemsToProcess.map(it => {
        const p = products.find(prod => prod.id === it.product_id) || dbStore.getProducts(businessId).find(prod => prod.id === it.product_id);
        return {
          ...it,
          id: it.id || crypto.randomUUID(),
          product_name: (it as any).product_name || p?.name || 'Faral / Sweet Item',
          qty: Math.max(1, Number(it.qty) || 1),
          selling_price: Math.max(0, Number(it.selling_price) || 0),
          gst_rate: Math.max(0, Number(it.gst_rate) || 0),
        };
      });

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
           triggerToast(`CREDIT LIMIT WARNING! Transaction overrides authorized limit.`, 'info');
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
          status: (isFulfilledImmediately || isWalkIn) ? 'Delivered' : existingOrder?.status === 'Packed' ? 'Packing' : (existingOrder?.status || 'Pending'),
          delivery_status: (isFulfilledImmediately || isWalkIn) ? 'Delivered' : existingOrder?.delivery_status || 'Pending',
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
          qr_code_data: `${orderNum}|${finalCustomerId}|${finalCustomerName}|${cleanItems.length} items`,
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

        // Send message to packaging users and Order System for any edit
        const itemsCount = cleanItems.reduce((acc: number, i: any) => acc + (Number(i.qty) || Number(i.quantity) || 0), 0);
        const editOrderMsg = `Sales Order ${orderNum} has been updated.\n\nCustomer: ${finalCustomerName || 'N/A'}\nDelivery Date: ${deliveryDate || 'N/A'}\nType: ${deliveryType || 'Standard'}\nItems: ${itemsCount} units`;
        
        const allUsers = dbStore.getUsers(businessId);
        const packingStaff = allUsers.filter(u => u.role && (u.role === 'Packing Staff' || u.role.toLowerCase().includes('pack')));

        if (packingStaff.length > 0 && !isWalkIn && !isFulfilledImmediately) {
          packingStaff.forEach(staff => {
            dbStore.sendMessage({
              sender_id: user.id,
              receiver_id: staff.id,
              content: editOrderMsg,
              business_id: businessId
            });
          });
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
          status: (isFulfilledImmediately || isWalkIn) ? 'Delivered' : 'Pending',
          payment_status: finalPaymentStatusToSave as any,
          payment_mode: paymentMode,
          paid_amount: actualPaid,
          delivery_status: (isFulfilledImmediately || isWalkIn) ? 'Delivered' : 'Pending',
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
          qr_code_data: `${orderNum}|${finalCustomerId}|${finalCustomerName}|${cleanItems.length} items`,
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

        // Send message from Order System with order details
        const itemsSummary = cleanItems.map((i: any) => `${i.product_name || 'Product'} (x${i.qty || i.quantity || 1})`).join(', ');
        const itemsCount = cleanItems.reduce((acc: number, i: any) => acc + (Number(i.qty) || Number(i.quantity) || 0), 0);
        const newOrderMsg = `📦 New Sales Order: ${createdOrder.order_number}\n\nCustomer: ${finalCustomerName || 'Walk-in'}\nTotal Amount: ${currencySymbol}${finalAmount.toLocaleString()}\nItems (${itemsCount} units): ${itemsSummary}\nDelivery Date: ${deliveryDate || 'Standard Delivery'}\nDelivery Type: ${deliveryType || 'Standard'}\nStatus: ${(isFulfilledImmediately || isWalkIn) ? 'Delivered' : 'Pending Packing'}`;
        
        const allUsers = dbStore.getUsers(businessId);
        const packingStaff = allUsers.filter(u => u.role && (u.role === 'Packing Staff' || u.role.toLowerCase().includes('pack')));

        if (packingStaff.length > 0) {
          packingStaff.forEach(staff => {
            dbStore.sendMessage({
              sender_id: user.id,
              receiver_id: staff.id,
              content: newOrderMsg,
              business_id: businessId
            });
          });
        }

        if (isWalkIn || isFulfilledImmediately) {
          triggerToast(`Order ${createdOrder.order_number} created and marked as delivered.`, 'success');
        } else {
          triggerToast(`Order ${createdOrder.order_number} compiled. Added to pending packing list.`, 'success');
        }
      }

      setOrders(dbStore.getSalesOrders(businessId));
      
      // Ensure payment confirmation popup is not displayed after completing invoice
      setIsPaymentModalOpen(false);
      setSelectedOrderForPayment(null);
      
      // Release draft lock
      const curDraftId = draftSessionIdRef.current;
      if (curDraftId) {
        dbStore.releaseDraftReservation(curDraftId);
      }

      // Post-save actions
      if (postAction === 'save_new') {
        const nextDraftId = crypto.randomUUID();
        draftSessionIdRef.current = nextDraftId;
        isCreateModalOpenRef.current = true;
        resetForm();
        const nextNum = dbStore.reserveDraftInvoiceNumber(
          businessId,
          user.id,
          user.name,
          nextDraftId,
          false,
          false
        );
        setCustomInvoiceNumber(nextNum);
      } else if (postAction === 'print' && finalCreatedOrder) {
        isCreateModalOpenRef.current = false;
        draftSessionIdRef.current = '';
        resetForm();
        setIsCreateModalOpen(false);
        setViewingInvoiceOrder(finalCreatedOrder);
        setTimeout(() => {
          const btn = document.getElementById('print-invoice-btn');
          if (btn) btn.click();
        }, 300);
      } else if (postAction === 'share' && finalCreatedOrder) {
        isCreateModalOpenRef.current = false;
        draftSessionIdRef.current = '';
        resetForm();
        setIsCreateModalOpen(false);
        setViewingInvoiceOrder(finalCreatedOrder);
        setTimeout(() => {
          const btn = document.getElementById('email-invoice-btn');
          if (btn) btn.click();
        }, 300);
      } else {
        isCreateModalOpenRef.current = false;
        draftSessionIdRef.current = '';
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
      {!isCreateModalOpen && (
        <>
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
                      <span>{(o.items || []).length} Items</span>
                      <span className="text-slate-500">Qty: {(o.items || []).reduce((acc, it) => acc + (Number(it.qty) || Number(it.quantity) || 0), 0)}</span>
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
                      {/* Edit Order */}
                      <button 
                        onClick={() => setInvoiceToEdit(o)}
                        className="p-1.5 hover:bg-amber-100 dark:hover:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg transition cursor-pointer"
                        title="Edit Order"
                      >
                        <Edit size={15} />
                      </button>
                      
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
      </>
      )}

      {/* Sales Order Placement view */}
      {isCreateModalOpen && (
        <CreateInvoiceView
          businessId={businessId}
          user={user}
          currentBiz={currentBiz}
          editingOrderId={editingOrderId}
          customInvoiceNumber={customInvoiceNumber}
          setCustomInvoiceNumber={setCustomInvoiceNumber}
          isFestiveBooking={isFestiveBooking}
          isAdvanceBooking={isAdvanceBooking}
          isFulfilledImmediately={isFulfilledImmediately}
          orderDate={orderDate}
          orderTime={orderTime}
          deliveryDate={deliveryDate}
          deliveryType={deliveryType}
          selectedCustomerId={selectedCustomerId}
          selectedCustomerPhone={selectedCustomerPhone}
          selectedCustomerAddress={selectedCustomerAddress}
          selectedCustomerShippingAddress={selectedCustomerShippingAddress}
          selectedPincode={selectedPincode}
          isSameShippingAddress={isSameShippingAddress}
          selectedArea={selectedArea}
          pointsToRedeem={pointsToRedeem}
          paymentStatus={paymentStatus}
          paymentMode={paymentMode}
          paidAmount={paidAmount}
          customDiscountPercentage={customDiscountPercentage}
          customDiscountAmount={customDiscountAmount}
          discountType={discountType}
          additionalCharges={additionalCharges}
          deliveryCharges={deliveryCharges}
          additionalChargeType={additionalChargeType}
          orderItems={orderItems}
          customers={customers}
          products={products}
          defaultTenantTax={defaultTenantTax}
          currencySymbol={currencySymbol}
          isSubmitting={isSubmitting}
          isSubmitDropdownOpen={isSubmitDropdownOpen}
          fastScanInputRef={fastScanInputRef}
          rowProductId={rowProductId}
          rowQty={rowQty}
          rowPrice={rowPrice}
          rowTaxRate={rowTaxRate}
          calculatedTotals={calculatedTotals}
          upcoming7DaysLoad={upcoming7DaysLoad}
          scheduledCountForSelectedDate={scheduledCountForSelectedDate}
          onClose={handleCloseCreateModal}
          onSaveOrder={handleCreateSalesOrder}
          onOpenQuickCreateCustomer={handleOpenQuickCreateCustomer}
          onOpenQuickCreateProduct={handleOpenQuickCreateProduct}
          onToggleAdvanceBooking={handleToggleAdvanceBooking}
          onToggleFestiveBooking={handleToggleFestiveBooking}
          onSetBookingType={handleSetBookingType}
          setIsFulfilledImmediately={setIsFulfilledImmediately}
          setOrderDate={setOrderDate}
          setDeliveryDate={setDeliveryDate}
          setDeliveryType={setDeliveryType}
          setSelectedCustomerId={setSelectedCustomerId}
          setSelectedCustomerPhone={setSelectedCustomerPhone}
          setSelectedCustomerAddress={setSelectedCustomerAddress}
          setSelectedCustomerShippingAddress={setSelectedCustomerShippingAddress}
          setSelectedPincode={setSelectedPincode}
          setIsSameShippingAddress={setIsSameShippingAddress}
          setSelectedArea={setSelectedArea}
          setPointsToRedeem={setPointsToRedeem}
          setPaymentStatus={setPaymentStatus}
          setPaymentMode={setPaymentMode}
          setPaidAmount={setPaidAmount}
          setCustomDiscountPercentage={setCustomDiscountPercentage}
          setCustomDiscountAmount={setCustomDiscountAmount}
          setDiscountType={setDiscountType}
          setAdditionalCharges={setAdditionalCharges}
          setDeliveryCharges={setDeliveryCharges}
          setOrderItems={setOrderItems}
          setRowProductId={setRowProductId}
          setRowQty={setRowQty}
          setRowPrice={setRowPrice}
          setRowTaxRate={setRowTaxRate}
          setIsSubmitDropdownOpen={setIsSubmitDropdownOpen}
          onAddLineItem={handleAddLineItem}
          onRemoveLineItem={handleRemoveLineItem}
          setOutOfStockProduct={setOutOfStockProduct}
          triggerToast={triggerToast}
          getSuggestedInvoiceNumber={getSuggestedInvoiceNumber}
          recalculateOrderPrices={recalculateOrderPrices}
        />
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

      {/* Quick Create Customer Modal */}
      {isQuickCreateCustomerOpen && (
        <QuickCreateCustomerModal
          isOpen={isQuickCreateCustomerOpen}
          onClose={() => setIsQuickCreateCustomerOpen(false)}
          businessId={businessId}
          user={user}
          initialName={quickCreateCustomerInitialName}
          currencySymbol={currencySymbol}
          onCustomerCreated={handleCustomerCreatedFromModal}
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

      {/* Out of Stock & Quick Inventory Restock Modal */}
      {outOfStockProduct && (
        <OutOfStockRestockModal
          isOpen={!!outOfStockProduct}
          product={outOfStockProduct}
          businessId={businessId}
          user={user}
          currencySymbol={currencySymbol}
          onClose={() => setOutOfStockProduct(null)}
          onRestockSuccess={handleRestockSuccessFromModal}
          triggerToast={triggerToast}
        />
      )}
    </div>
  );
};
