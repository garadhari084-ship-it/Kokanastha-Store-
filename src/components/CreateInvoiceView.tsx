import React from 'react';
import { 
  PlusCircle, 
  User, 
  Printer, 
  Share2,
  Sparkles,
  ChevronDown,
  Clock,
  ScanLine,
  Plus,
  Minus,
  Loader2,
  UserPlus,
  Save,
  Phone,
  Building2,
  ChevronLeft,
  Calendar,
  Truck,
  Trash2,
  Percent,
  CheckCircle2,
  CreditCard,
  Receipt,
  PackagePlus,
  ArrowRight,
  ShieldCheck,
  Tag,
  AlertCircle
} from 'lucide-react';
import { SalesItem, Customer, Product, UserProfile, Business } from '../types/erp';
import { dbStore } from '../services/store';
import { calculateApplicablePrice, isLoyalMember, calculateOrderSavings } from '../utils/pricing';

interface CustomDropdownOption {
  value: string;
  label: string;
  searchKeywords?: string;
}

interface CustomDropdownProps {
  value: string;
  onChange: (val: string) => void;
  options: CustomDropdownOption[];
  placeholder?: string;
  className?: string;
  searchable?: boolean;
  disabled?: boolean;
  onAddNew?: (searchValue: string) => void;
  addNewLabel?: string;
}

const DropdownField: React.FC<CustomDropdownProps> = ({
  value,
  onChange,
  options,
  placeholder = '-- Select --',
  className = '',
  searchable = false,
  disabled = false,
  onAddNew,
  addNewLabel = '+ Add New'
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  React.useEffect(() => {
    if (isOpen && searchable) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearch('');
    }
  }, [isOpen, searchable]);

  const filteredOptions = React.useMemo(() => {
    if (!search.trim()) return options;
    const query = search.toLowerCase().trim();
    return options.filter(opt => {
      const matchLabel = opt.label.toLowerCase().includes(query);
      const matchValue = opt.value.toLowerCase().includes(query);
      const matchKeywords = opt.searchKeywords ? opt.searchKeywords.toLowerCase().includes(query) : false;
      return matchLabel || matchValue || matchKeywords;
    });
  }, [options, search]);

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full min-h-[38px] px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs rounded-xl border-2 border-slate-300 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-600 focus:outline-none placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 flex items-center justify-between gap-2 text-left transition-all ${
          disabled ? 'opacity-50 cursor-not-allowed bg-slate-100 dark:bg-slate-900' : 'cursor-pointer shadow-2xs'
        } ${className}`}
      >
        <span className={`truncate font-extrabold ${!selectedOption ? 'text-slate-600 dark:text-slate-300' : ''}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown size={14} className={`text-slate-400 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180 text-indigo-500' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full min-w-[260px] bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100 max-h-72 flex flex-col">
          {searchable && (
            <div className="p-2 border-b border-slate-100 dark:border-slate-700/60 bg-slate-50/50 dark:bg-slate-900/40">
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Type to search..."
                className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 rounded-lg text-xs focus:outline-none placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 dark:text-slate-100"
              />
            </div>
          )}
          
          <div className="overflow-y-auto divide-y divide-slate-100/50 dark:divide-slate-700/30 flex-1">
            {filteredOptions.length === 0 ? (
              <div className="p-3 text-center text-xs text-slate-400 dark:text-slate-500 italic">
                No matching results found
              </div>
            ) : (
              filteredOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={`w-full px-3 py-2 text-left text-xs transition-colors flex items-center justify-between cursor-pointer ${
                    opt.value === value
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200'
                  }`}
                >
                  <span className="truncate">{opt.label}</span>
                  {opt.value === value && <span className="text-indigo-600 dark:text-indigo-400 ml-2">✓</span>}
                </button>
              ))
            )}
          </div>

          {onAddNew && (
            <div className="p-1.5 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onAddNew(search);
                }}
                className="w-full px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/80 text-indigo-600 dark:text-indigo-400 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus size={13} />
                <span>{addNewLabel}</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export interface CreateInvoiceViewProps {
  businessId: string;
  user: UserProfile;
  currentBiz?: Business;
  editingOrderId: string | null;
  customInvoiceNumber: string;
  setCustomInvoiceNumber?: (val: string) => void;
  isFestiveBooking: boolean;
  isAdvanceBooking: boolean;
  isFulfilledImmediately: boolean;
  orderDate: string;
  orderTime: string;
  deliveryDate: string;
  deliveryType: string;
  selectedCustomerId: string;
  selectedCustomerPhone: string;
  selectedCustomerAddress: string;
  selectedCustomerShippingAddress: string;
  isSameShippingAddress: boolean;
  selectedArea: string;
  pointsToRedeem: number;
  paymentStatus: 'Paid' | 'Partial' | 'Unpaid' | '';
  paymentMode: string;
  paidAmount: number | string;
  customDiscountPercentage: number | string;
  customDiscountAmount: number | string;
  discountType: 'Percentage' | 'Value';
  additionalCharges: number | string;
  deliveryCharges: number | string;
  additionalChargeType: string;
  orderItems: SalesItem[];
  customers: Customer[];
  products: Product[];
  defaultTenantTax: number;
  currencySymbol: string;
  isSubmitting: boolean;
  isSubmitDropdownOpen: boolean;
  fastScanInputRef: React.RefObject<HTMLInputElement>;
  rowProductId: string;
  rowQty: number | string;
  rowPrice: number | string;
  rowTaxRate: number | string;
  calculatedTotals: {
    taxableVal: number;
    taxVal: number;
    subtotalBeforeDiscount: number;
    discountAmount: number;
    discountPercentage: number;
    displayDiscountPerc: number | string;
    displayDiscountAmt: number | string;
    finalAmount: number;
    computedPaid: number;
    balance: number;
    actualRedeem: number;
  };
  upcoming7DaysLoad: Array<{ date: string; label: string; count: number }>;
  scheduledCountForSelectedDate: number;

  onClose: () => void;
  onSaveOrder: (afterAction: 'close' | 'print' | 'share') => void;
  onOpenQuickCreateCustomer: (name?: string) => void;
  onOpenQuickCreateProduct: (name?: string) => void;
  onToggleAdvanceBooking: (checked: boolean) => void;
  onToggleFestiveBooking: (checked: boolean) => void;
  onSetBookingType?: (isAdvance: boolean, isFestive: boolean, isDelivered?: boolean) => void;
  setIsFulfilledImmediately: (val: boolean) => void;
  setOrderDate: (val: string) => void;
  setDeliveryDate: (val: string) => void;
  setDeliveryType: (val: string) => void;
  setSelectedCustomerId: (val: string) => void;
  setSelectedCustomerPhone: (val: string) => void;
  setSelectedCustomerAddress: (val: string) => void;
  setSelectedCustomerShippingAddress: (val: string) => void;
  setIsSameShippingAddress: (val: boolean) => void;
  setSelectedArea: (val: string) => void;
  setPointsToRedeem: (val: number) => void;
  setPaymentStatus: (val: 'Paid' | 'Partial' | 'Unpaid' | '') => void;
  setPaymentMode: (val: string) => void;
  setPaidAmount: (val: string | number) => void;
  setCustomDiscountPercentage: (val: string | number) => void;
  setCustomDiscountAmount: (val: string | number) => void;
  setDiscountType: (val: 'Percentage' | 'Value') => void;
  setAdditionalCharges: (val: string | number) => void;
  setDeliveryCharges: (val: string | number) => void;
  setOrderItems: React.Dispatch<React.SetStateAction<SalesItem[]>>;
  setRowProductId: (val: string) => void;
  setRowQty: (val: number | string) => void;
  setRowPrice: (val: number | string) => void;
  setRowTaxRate: (val: number | string) => void;
  setIsSubmitDropdownOpen: (val: boolean) => void;
  onAddLineItem: () => void;
  onRemoveLineItem: (idx: number) => void;
  setOutOfStockProduct: (p: Product | null) => void;
  triggerToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  getSuggestedInvoiceNumber: (festive: boolean, advance: boolean) => string;
  recalculateOrderPrices: (items: SalesItem[], customer?: Customer, isAdvance?: boolean, isFestive?: boolean) => SalesItem[];
}

export const CreateInvoiceView: React.FC<CreateInvoiceViewProps> = ({
  businessId,
  user,
  currentBiz,
  editingOrderId,
  customInvoiceNumber,
  setCustomInvoiceNumber,
  isFestiveBooking,
  isAdvanceBooking,
  isFulfilledImmediately,
  orderDate,
  deliveryDate,
  deliveryType,
  selectedCustomerId,
  selectedCustomerPhone,
  selectedCustomerAddress,
  selectedCustomerShippingAddress,
  isSameShippingAddress,
  selectedArea,
  pointsToRedeem,
  paymentStatus,
  paymentMode,
  paidAmount,
  customDiscountPercentage,
  customDiscountAmount,
  discountType,
  additionalCharges,
  deliveryCharges,
  orderItems,
  customers,
  products,
  defaultTenantTax,
  currencySymbol,
  isSubmitting,
  isSubmitDropdownOpen,
  fastScanInputRef,
  rowProductId,
  rowQty,
  rowPrice,
  rowTaxRate,
  calculatedTotals,
  upcoming7DaysLoad,
  scheduledCountForSelectedDate,

  onClose,
  onSaveOrder,
  onOpenQuickCreateCustomer,
  onOpenQuickCreateProduct,
  onToggleAdvanceBooking,
  onToggleFestiveBooking,
  onSetBookingType,
  setIsFulfilledImmediately,
  setOrderDate,
  setDeliveryDate,
  setDeliveryType,
  setSelectedCustomerId,
  setSelectedCustomerPhone,
  setSelectedCustomerAddress,
  setSelectedCustomerShippingAddress,
  setIsSameShippingAddress,
  setSelectedArea,
  setPointsToRedeem,
  setPaymentStatus,
  setPaymentMode,
  setPaidAmount,
  setCustomDiscountPercentage,
  setCustomDiscountAmount,
  setDiscountType,
  setAdditionalCharges,
  setDeliveryCharges,
  setOrderItems,
  setRowProductId,
  setRowQty,
  setRowPrice,
  setRowTaxRate,
  setIsSubmitDropdownOpen,
  onAddLineItem,
  onRemoveLineItem,
  setOutOfStockProduct,
  triggerToast,
  getSuggestedInvoiceNumber,
  recalculateOrderPrices
}) => {
  const selectedCust = customers.find(c => c.id === selectedCustomerId);
  const savingsInfo = calculateOrderSavings(orderItems, products);
  const totalItemQty = orderItems.reduce((acc, it) => acc + (Number(it.qty) || 0), 0);

  const {
    taxableVal,
    taxVal,
    discountAmount,
    finalAmount,
    computedPaid,
    balance,
    actualRedeem
  } = calculatedTotals;

  return (
    <div className="w-full space-y-4 animate-in fade-in duration-150 pb-12">
      {/* 1. TOP COMMAND BAR WITH INVOICE #, CUSTOMER & BOOKING TYPE */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs p-3">
        <div className="flex flex-col xl:flex-row items-stretch xl:items-center gap-2.5">
          {/* Back Button */}
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs shrink-0 self-start xl:self-center"
            title="Return to Sales Orders List"
          >
            <ChevronLeft size={16} />
            <span>Back</span>
          </button>

          <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 hidden xl:block shrink-0" />

          {/* Form Fields: Invoice #, Customer Party & Booking / Order Type */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 items-center flex-1">
            
            {/* 1. Invoice Number (3 cols) */}
            <div className="md:col-span-3 flex items-center gap-2 bg-slate-50 dark:bg-slate-800/80 px-3 py-1.5 rounded-xl border-2 border-slate-300 dark:border-slate-600">
              <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase whitespace-nowrap">
                Inv #
              </span>
              <input
                type="text"
                value={customInvoiceNumber}
                onChange={(e) => setCustomInvoiceNumber ? setCustomInvoiceNumber(e.target.value) : undefined}
                placeholder={getSuggestedInvoiceNumber(isFestiveBooking, isAdvanceBooking)}
                className="w-full bg-transparent text-slate-900 dark:text-slate-100 text-xs font-black focus:outline-none placeholder:text-slate-500 dark:placeholder:text-slate-400"
              />
              <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-amber-50 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 shrink-0">
                Auto
              </span>
            </div>

            {/* 2. Customer Selector Dropdown (6 cols) */}
            <div className="md:col-span-6 flex items-center gap-1.5">
              <div className="flex-1 min-w-0">
                <DropdownField 
                  value={selectedCustomerId}
                  onChange={(val) => {
                    setSelectedCustomerId(val);
                    const c = customers.find(cust => cust.id === val);
                    if (c) {
                      setSelectedCustomerPhone(c.phone || '');
                      setSelectedCustomerAddress(c.billing_address || '');
                      setSelectedCustomerShippingAddress(c.shipping_address || c.billing_address || '');
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
                  placeholder="-- Select Customer Party * --"
                  searchable={true}
                  onAddNew={(searchVal) => onOpenQuickCreateCustomer(searchVal || '')}
                  addNewLabel="Create & Add New Customer"
                  className="h-9"
                  options={[
                    { value: 'WALK_IN', label: 'Walk-in Customer (Instant POS Counter)' },
                    ...customers.map(c => ({
                      value: c.id,
                      label: `${c.name} (Outstanding: ${currencySymbol}${c.outstanding_amount.toLocaleString()} | Points: ${c.loyalty_points || 0})`
                    }))
                  ]}
                />
              </div>
              <button
                type="button"
                onClick={() => onOpenQuickCreateCustomer('')}
                className="h-9 px-2.5 bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-slate-700 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 rounded-xl text-[11px] font-bold transition flex items-center gap-1 cursor-pointer shadow-2xs shrink-0"
                title="Create New Customer"
              >
                <UserPlus size={12} />
                <span>+ New</span>
              </button>
            </div>

            {/* 3. Booking / Order Type Dropdown (3 cols) */}
            <div className="md:col-span-3">
              <DropdownField 
                value={
                  isFulfilledImmediately 
                    ? 'delivered' 
                    : (isFestiveBooking && isAdvanceBooking) 
                    ? 'festive_advance' 
                    : isFestiveBooking 
                    ? 'festive' 
                    : isAdvanceBooking 
                    ? 'advance' 
                    : 'regular'
                }
                onChange={(val) => {
                  if (onSetBookingType) {
                    if (val === 'advance') {
                      onSetBookingType(true, false, false);
                    } else if (val === 'festive') {
                      onSetBookingType(false, true, false);
                    } else if (val === 'festive_advance') {
                      onSetBookingType(true, true, false);
                    } else if (val === 'delivered') {
                      onSetBookingType(false, false, true);
                    } else {
                      onSetBookingType(false, false, false);
                    }
                  } else {
                    if (val === 'advance') {
                      onToggleAdvanceBooking(true);
                      onToggleFestiveBooking(false);
                      setIsFulfilledImmediately(false);
                    } else if (val === 'festive') {
                      onToggleAdvanceBooking(false);
                      onToggleFestiveBooking(true);
                      setIsFulfilledImmediately(false);
                    } else if (val === 'festive_advance') {
                      onToggleAdvanceBooking(true);
                      onToggleFestiveBooking(true);
                      setIsFulfilledImmediately(false);
                    } else if (val === 'delivered') {
                      onToggleAdvanceBooking(false);
                      onToggleFestiveBooking(false);
                      setIsFulfilledImmediately(true);
                      setPaymentStatus('Paid');
                    } else {
                      onToggleAdvanceBooking(false);
                      onToggleFestiveBooking(false);
                      setIsFulfilledImmediately(false);
                    }
                  }
                }}
                options={[
                  { value: 'regular', label: 'Standard / Regular Order' },
                  { value: 'advance', label: 'Advance Booking' },
                  { value: 'festive', label: 'Festive Booking' },
                  { value: 'festive_advance', label: 'Festive Advance Booking' },
                  { value: 'delivered', label: 'Delivered (Direct POS)' }
                ]}
                className="h-9 font-bold"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 2. MAIN 2-COLUMN WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* ========================================================= */}
        {/* LEFT COLUMN: Customer, Dates & Product Lines (8 Columns) */}
        {/* ========================================================= */}
        <div className="lg:col-span-8 space-y-4">
          
          {/* Card A: Customer Contact & Delivery Logistics */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
            <div className="px-4 py-3 bg-slate-50/80 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User size={15} className="text-indigo-600 dark:text-indigo-400" />
                <h2 className="text-xs font-black uppercase text-slate-800 dark:text-slate-200 tracking-wider">
                  Contact & Delivery Logistics
                </h2>
              </div>
            </div>

            <div className="p-4 space-y-4">

              {/* 2-Column Quick Contact & Logistics Details */}
              <div className="bg-slate-50/70 dark:bg-slate-800/40 p-3.5 rounded-xl border-2 border-slate-300 dark:border-slate-600/80 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* 1. Mobile */}
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-800 dark:text-slate-200 uppercase flex items-center gap-1">
                    <Phone size={11} className="text-indigo-500" />
                    <span>Mobile Number</span>
                  </label>
                  <input
                    type="text"
                    value={selectedCustomerPhone}
                    onChange={(e) => setSelectedCustomerPhone(e.target.value)}
                    placeholder="10-digit Mobile"
                    className="w-full h-8 px-2.5 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs font-extrabold rounded-lg border-2 border-slate-300 dark:border-slate-600 focus:outline-none placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                {/* 2. Customer Address */}
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-800 dark:text-slate-200 uppercase flex items-center gap-1">
                    <Building2 size={11} className="text-indigo-500" />
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
                    placeholder="Full Address"
                    className="w-full h-8 px-2.5 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs font-extrabold rounded-lg border-2 border-slate-300 dark:border-slate-600 focus:outline-none placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Order Date, Delivery Date & Mode */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                <div className="space-y-1">
                  <label className="text-[11px] font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider block">
                    Invoice / Order Date *
                  </label>
                  <input 
                    type="date"
                    value={orderDate}
                    onChange={(e) => setOrderDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs rounded-xl border-2 border-slate-300 dark:border-slate-600 focus:outline-none placeholder:text-slate-500 dark:placeholder:text-slate-400 font-medium cursor-pointer"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider block">
                      Target Delivery Date
                    </label>
                    {deliveryDate && (
                      <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full ${
                        scheduledCountForSelectedDate === 0
                          ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                          : scheduledCountForSelectedDate <= 4
                          ? 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                          : 'bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                      }`}>
                        {scheduledCountForSelectedDate} Scheduled
                      </span>
                    )}
                  </div>
                  <input 
                    type="date"
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs rounded-xl border-2 border-slate-300 dark:border-slate-600 focus:outline-none placeholder:text-slate-500 dark:placeholder:text-slate-400 font-medium cursor-pointer"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider block">
                    Delivery / Pickup Mode
                  </label>
                  <DropdownField 
                    value={deliveryType}
                    onChange={(val) => setDeliveryType(val)}
                    options={[
                      { value: 'Self delivery', label: 'Self Delivery (Fleet)' },
                      { value: 'Domestic courier', label: 'Domestic Courier' },
                      { value: 'Out of india courier', label: 'International Courier' },
                      { value: 'Third party app delivery', label: 'Third Party App Delivery' },
                      { value: 'Self pickup', label: 'Counter / Self Pickup' }
                    ]}
                    placeholder="Select delivery type"
                  />
                </div>
              </div>

              {/* 7-Day Live Delivery Load Tracker Chip Bar */}
              <div className="bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border-2 border-slate-300 dark:border-slate-600/80 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider flex items-center gap-1">
                    <Clock size={11} className="text-amber-500" />
                    <span>Upcoming Delivery Schedule (Next 7 Days)</span>
                  </span>
                  <span className="text-[9px] text-slate-400 italic">Click date chip to auto-set</span>
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
                            ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-xs ring-1 ring-amber-400 font-black'
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

              {/* Customer Loyalty Banner (if registered customer with loyalty) */}
              {selectedCust && selectedCustomerId !== 'WALK_IN' && (
                <div className="p-3 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 rounded-xl border border-amber-200 dark:border-amber-800/60 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-500 text-slate-950 rounded-xl font-black text-xs text-center min-w-[70px]">
                      <div className="text-[9px] uppercase tracking-wider opacity-80">Tier</div>
                      <div>{selectedCust.loyalty_tier || 'Silver'}</div>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-slate-900 dark:text-white">{selectedCust.name}</span>
                        <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/60 px-2 py-0.5 rounded-full">
                          {selectedCust.loyalty_points || 0} Points Available
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                        1 Point = {currencySymbol}{dbStore.getLoyaltyConfig(businessId)?.point_value || 1} • Lifetime Spend: {currencySymbol}{(selectedCust.lifetime_spend || 0).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase">Redeem:</label>
                    <input
                      type="number"
                      min={0}
                      max={selectedCust.loyalty_points || 0}
                      value={pointsToRedeem === 0 ? '' : pointsToRedeem}
                      placeholder="0"
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '') setPointsToRedeem(0);
                        else {
                          const num = parseInt(val, 10);
                          setPointsToRedeem(isNaN(num) ? 0 : Math.min(selectedCust.loyalty_points || 0, Math.max(0, num)));
                        }
                      }}
                      className="w-16 h-8 px-2 bg-white dark:bg-slate-800 text-center font-mono font-bold text-xs rounded-lg border border-amber-300 dark:border-amber-700 focus:outline-none placeholder:text-slate-500 dark:placeholder:text-slate-400"
                    />
                    {(selectedCust.loyalty_points || 0) > 0 && (
                      <button
                        type="button"
                        onClick={() => setPointsToRedeem(pointsToRedeem === (selectedCust.loyalty_points || 0) ? 0 : (selectedCust.loyalty_points || 0))}
                        className="h-8 px-2.5 bg-amber-100 hover:bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-100 text-[10px] font-extrabold rounded-lg transition border border-amber-300 cursor-pointer"
                      >
                        {pointsToRedeem === (selectedCust.loyalty_points || 0) ? 'Clear' : 'Max'}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Card B: Product Line Items & Scan Bar */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
            <div className="px-4 py-3 bg-slate-50/80 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2 min-w-[200px]">
                <div className="h-2 w-2 rounded-full bg-indigo-500 shrink-0"></div>
                <h2 className="text-xs font-black uppercase text-slate-800 dark:text-slate-200 tracking-wider">
                  Product Line Items <span className="text-[10px] text-slate-500 font-bold ml-1">({orderItems.length} items, {totalItemQty} units)</span>
                </h2>
              </div>

              <div className="flex items-center gap-2 flex-1 justify-end min-w-[300px]">
                {/* Fast Barcode Scanner Input */}
                <div className="relative w-full max-w-[280px]">
                  <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-indigo-500">
                    <ScanLine size={14} />
                  </div>
                  <input 
                    ref={fastScanInputRef}
                    type="text" 
                    defaultValue=""
                    placeholder="Scan barcode / SKU..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const inputElem = e.currentTarget as HTMLInputElement;
                        const code = inputElem.value.trim();
                        if (!code) return;
                        
                        const latestProducts = dbStore.getProducts(businessId);
                        const searchCode = code.toLowerCase();
                        const p = latestProducts.find(prod => 
                          String(prod.sku || '').trim().toLowerCase() === searchCode || 
                          String(prod.name || '').trim().toLowerCase() === searchCode || 
                          String(prod.id || '').trim() === code || 
                          String(prod.barcode || '').trim().toLowerCase() === searchCode
                        );
                        
                        if (p) {
                          if ((p.current_stock ?? 0) <= 0 && !isAdvanceBooking && !isFestiveBooking) {
                            setOutOfStockProduct(p);
                            inputElem.value = '';
                            setTimeout(() => fastScanInputRef.current?.focus(), 10);
                            return;
                          }

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
                            
                          const existingItem = orderItems.find(it => it.product_id === p.id);
                          if (existingItem) {
                            triggerToast('Item quantity updated.', 'success');
                            setOrderItems(prevItems => prevItems.map(it => 
                              it.product_id === p.id 
                                ? { ...it, qty: it.qty + 1 }
                                : it
                            ));
                          } else {
                            const newItem = {
                              id: crypto.randomUUID(),
                              product_id: p.id,
                              product_name: p.name,
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
                            setOrderItems(prevItems => [...prevItems, newItem]);
                          }
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
                    className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-600 rounded-lg text-xs font-extrabold focus:outline-none placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-slate-100 transition-all shadow-sm"
                  />
                </div>

                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold bg-slate-100 dark:bg-slate-800 px-2 py-1.5 rounded hidden xl:inline-block whitespace-nowrap">
                  Tax: {defaultTenantTax}%
                </span>
                <button
                  type="button"
                  onClick={() => onOpenQuickCreateProduct('')}
                  className="px-2.5 py-1.5 bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-slate-700 text-indigo-600 dark:text-indigo-400 border-2 border-indigo-200 dark:border-indigo-800 rounded-lg text-[10px] font-extrabold transition flex items-center gap-1 cursor-pointer shadow-2xs shrink-0 whitespace-nowrap"
                >
                  <PackagePlus size={12} />
                  <span className="hidden sm:inline">+ New</span>
                </button>
              </div>
            </div>

            <div className="p-4 space-y-3">
              {/* Manual Row Picker Bar */}
              <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border-2 border-slate-300 dark:border-slate-600/80 grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end">
                {/* SKU Dropdown */}
                <div className="sm:col-span-5 space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider block">
                    Choose Product SKU
                  </label>
                  <DropdownField 
                    value={rowProductId}
                    onChange={(val) => {
                      if (!val) {
                        setRowProductId('');
                        return;
                      }
                      const latestProds = dbStore.getProducts(businessId);
                      const p = products.find(prod => prod.id === val) || latestProds.find(prod => prod.id === val);
                      if (p) {
                        setRowProductId(val);
                        const selCust = customers.find(c => c.id === selectedCustomerId);
                        const evalRes = calculateApplicablePrice(p, {
                          isLoyalMember: isLoyalMember(selCust),
                          isAdvanceBooking,
                          isDiwaliSale: isFestiveBooking,
                          business: currentBiz,
                          orderDate
                        });
                        setRowPrice(evalRes.appliedPrice);
                        const defaultTax = (defaultTenantTax === 0 || p.gst_rate === 18 || typeof p.gst_rate !== 'number' || isNaN(p.gst_rate)) 
                          ? defaultTenantTax 
                          : (p.gst_rate || defaultTenantTax);
                        setRowTaxRate(defaultTax);

                        if ((p.current_stock ?? 0) <= 0 && !isAdvanceBooking && !isFestiveBooking) {
                          setOutOfStockProduct(p);
                        }
                      }
                    }}
                    placeholder="-- Select Product --"
                    searchable={true}
                    onAddNew={(searchVal) => onOpenQuickCreateProduct(searchVal || '')}
                    addNewLabel="Create & Add New Product"
                    options={[
                      { value: '', label: '-- Choose Product SKU --' },
                      ...products.map(p => {
                        const isOut = (p.current_stock ?? 0) <= 0;
                        const selCust = customers.find(c => c.id === selectedCustomerId);
                        const evalRes = calculateApplicablePrice(p, {
                          isLoyalMember: isLoyalMember(selCust),
                          isAdvanceBooking,
                          isDiwaliSale: isFestiveBooking,
                          business: currentBiz,
                          orderDate
                        });
                        const stockBadge = isOut 
                          ? ` [⚠️ OUT OF STOCK]` 
                          : ` [Stock: ${p.current_stock ?? 0} ${p.unit || ''}]`;
                        return {
                          value: p.id,
                          label: `${p.name} (${currencySymbol}${evalRes.appliedPrice.toLocaleString()})${stockBadge}`,
                          searchKeywords: `${p.barcode} ${p.sku} ${isOut ? 'out of stock 0' : ''}`
                        };
                      })
                    ]}
                  />
                </div>

                {/* Qty Spinner */}
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider block">
                    Qty
                  </label>
                  <div className="flex items-center">
                    <button
                      type="button"
                      onClick={() => setRowQty(Math.max(1, (Number(rowQty) || 1) - 1))}
                      className="h-[38px] px-2 bg-white dark:bg-slate-700 hover:bg-slate-100 text-slate-700 dark:text-slate-200 rounded-l-lg border-2 border-r-0 border-slate-300 dark:border-slate-600 cursor-pointer"
                    >
                      <Minus size={11} />
                    </button>
                    <input 
                      type="number" 
                      min={1}
                      value={rowQty}
                      onChange={(e) => setRowQty(e.target.value === '' ? '' : Math.max(1, parseInt(e.target.value, 10) || 1))}
                      className="w-full h-[38px] px-1 text-center bg-white dark:bg-slate-800 text-xs font-mono font-bold border-2 border-slate-300 dark:border-slate-600 focus:outline-none placeholder:text-slate-500 dark:placeholder:text-slate-400"
                    />
                    <button
                      type="button"
                      onClick={() => setRowQty((Number(rowQty) || 0) + 1)}
                      className="h-[38px] px-2 bg-white dark:bg-slate-700 hover:bg-slate-100 text-slate-700 dark:text-slate-200 rounded-r-lg border-2 border-l-0 border-slate-300 dark:border-slate-600 cursor-pointer"
                    >
                      <Plus size={11} />
                    </button>
                  </div>
                </div>

                {/* Unit Price */}
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider block">
                    Price ({currencySymbol})
                  </label>
                  <input 
                    type="number" 
                    min={0}
                    step="any"
                    value={rowPrice}
                    onChange={(e) => setRowPrice(e.target.value === '' ? '' : parseFloat(e.target.value) || 0)}
                    className="w-full h-[38px] px-2.5 bg-white dark:bg-slate-800 text-xs font-mono rounded-lg border-2 border-slate-300 dark:border-slate-600 focus:outline-none placeholder:text-slate-500 dark:placeholder:text-slate-400"
                  />
                </div>

                {/* Tax Rate % */}
                <div className="sm:col-span-1 space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider block">
                    GST%
                  </label>
                  <input 
                    type="number" 
                    min={0}
                    max={100}
                    value={rowTaxRate}
                    onChange={(e) => setRowTaxRate(e.target.value === '' ? '' : parseFloat(e.target.value) || 0)}
                    className="w-full h-[38px] px-1 text-center bg-white dark:bg-slate-800 text-xs font-mono rounded-lg border-2 border-slate-300 dark:border-slate-600 focus:outline-none placeholder:text-slate-500 dark:placeholder:text-slate-400"
                  />
                </div>

                {/* Add Item Button */}
                <div className="sm:col-span-2">
                  <button 
                    type="button" 
                    onClick={onAddLineItem}
                    className="w-full h-[38px] bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition cursor-pointer shadow-xs active:scale-95 flex items-center justify-center gap-1"
                  >
                    <Plus size={14} />
                    <span>Add Item</span>
                  </button>
                </div>
              </div>

              {/* Data Table */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/80 text-[10px] font-black uppercase text-slate-900 dark:text-slate-100 border-b-2 border-slate-300 dark:border-slate-800">
                      <th className="p-3">#</th>
                      <th className="p-3">Product Description</th>
                      <th className="p-3 text-center">Qty</th>
                      <th className="p-3 text-right">Price ({currencySymbol})</th>
                      <th className="p-3 text-right">GST %</th>
                      <th className="p-3 text-right">Total (Incl. Tax)</th>
                      <th className="p-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
                    {orderItems.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-slate-400 dark:text-slate-500 font-sans italic">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <Receipt size={28} className="text-slate-300 dark:text-slate-600" />
                            <span>No items added yet. Scan a barcode above or select a product SKU.</span>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      orderItems.map((it, idx) => {
                        const p = products.find(prod => prod.id === it.product_id) || dbStore.getProducts(businessId).find(prod => prod.id === it.product_id);
                        const itemQty = Number(it.qty) || 0;
                        const itemPrice = Number(it.selling_price) || 0;
                        const itemTax = Number(it.gst_rate) || 0;
                        const baseVal = itemQty * itemPrice;
                        const taxVal = baseVal * (itemTax / 100);
                        const itemTotal = baseVal + taxVal;

                        return (
                          <tr key={it.id || idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                            <td className="p-3 font-sans font-bold text-slate-400">{idx + 1}</td>
                            <td className="p-3 font-sans">
                              <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 flex-wrap">
                                <span>{p?.name || (it as any).product_name || 'Product'}</span>
                                {it.rate_type === 'LMR' && (
                                  <span className="text-[9px] px-1.5 py-0.5 bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-extrabold rounded">
                                    👑 LMR
                                  </span>
                                )}
                                {it.rate_type === 'ABR' && (
                                  <span className="text-[9px] px-1.5 py-0.5 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-extrabold rounded">
                                    📅 ABR
                                  </span>
                                )}
                                {it.rate_type === 'DDR' && (
                                  <span className="text-[9px] px-1.5 py-0.5 bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-extrabold rounded">
                                    ✨ Festive
                                  </span>
                                )}
                              </div>
                              {it.rate_reason && (
                                <div className="text-[10px] text-slate-400 font-normal mt-0.5">
                                  {it.rate_reason}
                                </div>
                              )}
                            </td>

                            {/* Qty Steppers in Row */}
                            <td className="p-3 text-center">
                              <div className="inline-flex items-center">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = [...orderItems];
                                    const curQty = Number(updated[idx].qty) || 1;
                                    updated[idx].qty = Math.max(1, curQty - 1);
                                    setOrderItems(updated);
                                  }}
                                  className="h-6 px-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-l cursor-pointer"
                                >
                                  <Minus size={9} />
                                </button>
                                <input 
                                  type="number" 
                                  min={1}
                                  value={it.qty}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    const updated = [...orderItems];
                                    if (val === '') (updated[idx] as any).qty = '';
                                    else updated[idx].qty = Math.max(1, parseInt(val, 10) || 1);
                                    setOrderItems(updated);
                                  }}
                                  className="w-12 h-6 px-1 text-center bg-slate-50 dark:bg-slate-800 border-y border-slate-200 dark:border-slate-700 text-xs font-bold font-mono"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = [...orderItems];
                                    const curQty = Number(updated[idx].qty) || 0;
                                    updated[idx].qty = curQty + 1;
                                    setOrderItems(updated);
                                  }}
                                  className="h-6 px-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-r cursor-pointer"
                                >
                                  <Plus size={9} />
                                </button>
                              </div>
                            </td>

                            {/* Unit Price Input */}
                            <td className="p-3 text-right">
                              <input 
                                type="number" 
                                min={0}
                                step="any"
                                value={it.selling_price}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  const updated = [...orderItems];
                                  if (val === '') (updated[idx] as any).selling_price = '';
                                  else {
                                    updated[idx].selling_price = parseFloat(val) || 0;
                                    updated[idx].is_overridden = true;
                                    updated[idx].rate_type = 'OVERRIDE';
                                    updated[idx].rate_reason = 'Admin Price Override';
                                  }
                                  setOrderItems(updated);
                                }}
                                className="w-20 px-1.5 py-1 text-right bg-slate-50 dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 rounded text-xs"
                              />
                            </td>

                            {/* Tax Rate % Input */}
                            <td className="p-3 text-right">
                              <input 
                                type="number" 
                                min={0}
                                max={100}
                                step={0.1}
                                value={it.gst_rate}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  const updated = [...orderItems];
                                  if (val === '') (updated[idx] as any).gst_rate = '';
                                  else updated[idx].gst_rate = parseFloat(val) || 0;
                                  setOrderItems(updated);
                                }}
                                className="w-14 px-1 py-1 text-right bg-slate-50 dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 rounded text-xs"
                              />
                            </td>

                            {/* Total Line Amount */}
                            <td className="p-3 text-right font-bold text-indigo-600 dark:text-indigo-400">
                              {currencySymbol}{itemTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>

                            {/* Delete Action */}
                            <td className="p-3 text-center">
                              <button 
                                type="button"
                                onClick={() => onRemoveLineItem(idx)}
                                className="p-1 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded cursor-pointer transition"
                                title="Remove item"
                              >
                                <Trash2 size={13} />
                              </button>
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

        {/* ========================================================== */}
        {/* RIGHT COLUMN: Invoice Ledger Summary & Settlement (4 Cols) */}
        {/* ========================================================== */}
        <div className="lg:col-span-4 space-y-4 sticky top-4">
          
          {/* Card C: Financial Breakdown & Settlement */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden flex flex-col">
            <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard size={15} className="text-amber-400" />
                <h3 className="text-xs font-black uppercase tracking-wider">
                  Summary & Settlement
                </h3>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 font-bold">
                {orderItems.length} Items
              </span>
            </div>

            {/* Savings celebration banner */}
            {savingsInfo.totalSavings > 0 && (
              <div className="px-3 py-2 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border-b border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <span>🎉</span> Member Benefit
                </span>
                <span className="font-mono font-black">
                  Saved: {currencySymbol}{savingsInfo.totalSavings.toLocaleString()}
                </span>
              </div>
            )}

            <div className="p-4 space-y-3.5">
              {/* Financial Ledger Items */}
              <div className="space-y-2 text-xs divide-y divide-slate-100 dark:divide-slate-800/80">
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 pt-1">
                  <span>Taxable Subtotal</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                    {currencySymbol}{taxableVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 pt-2">
                  <span className="flex items-center gap-1">
                    <span>Tax (GST)</span>
                    <span className="text-[9px] text-slate-400">Total</span>
                  </span>
                  <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                    +{currencySymbol}{taxVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>

                {/* Loyalty points discount row */}
                {actualRedeem > 0 && (
                  <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 pt-2 font-bold">
                    <span>Loyalty Points (-{actualRedeem} pts)</span>
                    <span className="font-mono">
                      -{currencySymbol}{(actualRedeem * (dbStore.getLoyaltyConfig(businessId)?.point_value || 1)).toLocaleString()}
                    </span>
                  </div>
                )}

                {/* Custom Discount Box */}
                <div className="pt-2 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                      <Percent size={11} className="text-rose-500" />
                      <span>Special Discount</span>
                    </span>
                    <div className="flex items-center gap-1 text-[10px]">
                      <button
                        type="button"
                        onClick={() => setDiscountType('Percentage')}
                        className={`px-1.5 py-0.5 rounded cursor-pointer ${discountType === 'Percentage' ? 'bg-rose-100 text-rose-700 font-bold' : 'text-slate-400'}`}
                      >
                        %
                      </button>
                      <button
                        type="button"
                        onClick={() => setDiscountType('Value')}
                        className={`px-1.5 py-0.5 rounded cursor-pointer ${discountType === 'Value' ? 'bg-rose-100 text-rose-700 font-bold' : 'text-slate-400'}`}
                      >
                        {currencySymbol}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="relative">
                      <input 
                        type="number"
                        min={0}
                        step="any"
                        placeholder="0 %"
                        value={customDiscountPercentage}
                        onFocus={() => setDiscountType('Percentage')}
                        onChange={(e) => {
                          setDiscountType('Percentage');
                          setCustomDiscountPercentage(e.target.value);
                          setCustomDiscountAmount('');
                        }}
                        className="w-full h-8 px-2 text-right bg-slate-50 dark:bg-slate-800 text-xs font-mono font-bold rounded-lg border-2 border-slate-300 dark:border-slate-600 focus:outline-none placeholder:text-slate-500 dark:placeholder:text-slate-400"
                      />
                      <span className="absolute left-2 top-2 text-[10px] text-slate-400 font-bold">%</span>
                    </div>

                    <div className="relative">
                      <input 
                        type="number"
                        min={0}
                        step="any"
                        placeholder="0.00"
                        value={customDiscountAmount}
                        onFocus={() => setDiscountType('Value')}
                        onChange={(e) => {
                          setDiscountType('Value');
                          setCustomDiscountAmount(e.target.value);
                          setCustomDiscountPercentage('');
                        }}
                        className="w-full h-8 px-2 text-right bg-slate-50 dark:bg-slate-800 text-xs font-mono font-bold rounded-lg border-2 border-slate-300 dark:border-slate-600 focus:outline-none placeholder:text-slate-500 dark:placeholder:text-slate-400"
                      />
                      <span className="absolute left-2 top-2 text-[10px] text-slate-400 font-bold">{currencySymbol}</span>
                    </div>
                  </div>
                </div>

                {/* Additional & Delivery Charges */}
                <div className="pt-2 grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider block">
                      Delivery ({currencySymbol})
                    </label>
                    <input 
                      type="number"
                      min={0}
                      placeholder="0"
                      value={deliveryCharges}
                      onChange={(e) => setDeliveryCharges(e.target.value === '' ? '' : parseFloat(e.target.value) || 0)}
                      className="w-full h-8 px-2 text-right bg-slate-50 dark:bg-slate-800 text-xs font-mono rounded-lg border-2 border-slate-300 dark:border-slate-600 focus:outline-none placeholder:text-slate-500 dark:placeholder:text-slate-400"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider block">
                      Addl. Fee ({currencySymbol})
                    </label>
                    <input 
                      type="number"
                      min={0}
                      placeholder="0"
                      value={additionalCharges}
                      onChange={(e) => setAdditionalCharges(e.target.value === '' ? '' : parseFloat(e.target.value) || 0)}
                      className="w-full h-8 px-2 text-right bg-slate-50 dark:bg-slate-800 text-xs font-mono rounded-lg border-2 border-slate-300 dark:border-slate-600 focus:outline-none placeholder:text-slate-500 dark:placeholder:text-slate-400"
                    />
                  </div>
                </div>
              </div>

              {/* Grand Total Display Banner */}
              <div className="p-3.5 bg-slate-900 text-white rounded-xl flex items-center justify-between shadow-md">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">
                    Grand Total
                  </span>
                  <span className="text-[10px] text-emerald-400 font-medium">
                    All Taxes & Discounts Included
                  </span>
                </div>
                <div className="text-2xl font-black font-mono text-emerald-400">
                  {currencySymbol}{finalAmount.toLocaleString()}
                </div>
              </div>

              {/* Settlement Section */}
              <div className="space-y-2.5 pt-1">
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider block">
                    Payment Status *
                  </label>
                  <DropdownField 
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
                    }}
                    placeholder="-- Select Payment Status --"
                    options={[
                      { value: 'Paid', label: '✅ Fully Paid (Settled)' },
                      { value: 'Partial', label: '⏳ Partial / Advance Received' },
                      { value: 'Unpaid', label: '📌 Unpaid / On Credit' }
                    ]}
                  />
                </div>

                {(paymentStatus === 'Paid' || paymentStatus === 'Partial') && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider block">
                      Payment Mode
                    </label>
                    <DropdownField 
                      value={paymentMode}
                      onChange={(val) => setPaymentMode(val)}
                      options={[
                        { value: 'Cash', label: '💵 Cash' },
                        { value: 'UPI / QR', label: '📱 UPI / QR Code' },
                        { value: 'Card', label: '💳 Card (POS Terminal)' },
                        { value: 'Bank Transfer', label: '🏦 Bank Transfer / NEFT' },
                        { value: 'Credit / On Account', label: '📒 Credit / Account' }
                      ]}
                    />
                  </div>
                )}

                {paymentStatus === 'Partial' && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider block">
                      Advance / Received ({currencySymbol})
                    </label>
                    <input 
                      type="number"
                      min={0}
                      placeholder="Enter advance amount"
                      value={paidAmount}
                      onChange={(e) => setPaidAmount(e.target.value)}
                      className="w-full h-8 px-2.5 bg-slate-50 dark:bg-slate-800 text-xs font-mono font-bold text-emerald-600 rounded-lg border-2 border-slate-300 dark:border-slate-600 focus:outline-none placeholder:text-slate-500 dark:placeholder:text-slate-400"
                    />
                  </div>
                )}

                {/* Balance Due / Status Indicator */}
                <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border-2 border-slate-300 dark:border-slate-600 flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-500">Balance Due:</span>
                  <span className={`font-mono ${balance > 0 ? 'text-rose-600 dark:text-rose-400 font-black' : 'text-emerald-600 dark:text-emerald-400'}`}>
                    {currencySymbol}{balance.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                <div className="relative flex shadow-sm rounded-xl">
                  <button 
                    type="button" 
                    disabled={isSubmitting}
                    onClick={() => onSaveOrder('close')}
                    className={`flex-1 py-3 text-xs font-black transition cursor-pointer flex items-center justify-center gap-2 rounded-l-xl ${
                      isSubmitting 
                        ? 'bg-slate-700 cursor-not-allowed text-slate-400' 
                        : 'bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white'
                    }`}
                  >
                    {isSubmitting ? <Loader2 className="animate-spin" size={15} /> : <Save size={15} />}
                    <span>{editingOrderId ? 'Update Order & Invoice' : 'Save & Create Invoice'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsSubmitDropdownOpen(!isSubmitDropdownOpen)}
                    className="px-3 py-3 bg-indigo-700 hover:bg-indigo-600 text-white border-l border-indigo-500/50 transition cursor-pointer flex items-center rounded-r-xl"
                  >
                    <ChevronDown size={15} className={`transition-transform duration-200 ${isSubmitDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {isSubmitDropdownOpen && (
                    <div className="absolute bottom-full right-0 mb-2 w-52 bg-slate-800 text-slate-100 rounded-xl shadow-2xl border border-slate-700 overflow-hidden z-50 animate-in slide-in-from-bottom-2 duration-150">
                      <button 
                        type="button"
                        onClick={() => onSaveOrder('print')}
                        className="w-full px-4 py-3 text-left text-xs font-bold hover:bg-slate-700 flex items-center justify-between transition cursor-pointer group"
                      >
                        <span className="group-hover:text-indigo-400">Save & Print Bill</span>
                        <Printer size={14} className="text-slate-400 group-hover:text-indigo-400" />
                      </button>
                      <button 
                        type="button"
                        onClick={() => onSaveOrder('share')}
                        className="w-full px-4 py-3 text-left text-xs font-bold hover:bg-slate-700 flex items-center justify-between border-t border-slate-700/60 transition cursor-pointer group"
                      >
                        <span className="group-hover:text-indigo-400">Save & WhatsApp Share</span>
                        <Share2 size={14} className="text-slate-400 group-hover:text-indigo-400" />
                      </button>
                    </div>
                  )}
                </div>

                <button 
                  type="button" 
                  onClick={onClose}
                  className="w-full py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Cancel / Discard
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
