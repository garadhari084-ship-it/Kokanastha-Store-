import { PaymentCollectionModal } from './PaymentCollectionModal';
import { PageHeader } from './PageHeader';
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
  Plus,
  Minus,
  Loader2,
  UserPlus,
  Save
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
}

interface CustomDropdownProps {
  value: string;
  onChange: (val: string) => void;
  options: CustomDropdownOption[];
  placeholder?: string;
  className?: string;
  searchable?: boolean;
}

const CustomDropdown: React.FC<CustomDropdownProps> = ({
  value,
  onChange,
  options,
  placeholder = 'Select...',
  className = '',
  searchable = false
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
    opt.label.toLowerCase().includes(searchTerm.toLowerCase())
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
              <div className="px-3 py-4 text-center text-[10px] text-slate-400 italic">
                No matching options found
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
    const packingStaff = allUsers.filter(u => u.role && (u.role === 'Packing Staff' || u.role.toLowerCase().includes('pack')));
    
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

  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedArea, setSelectedArea] = useState('Dahisar');
  const [orderDate, setOrderDate] = useState<string>(getLocalTodayDate);
  const [orderTime, setOrderTime] = useState<string>(getLocalCurrentTimeInput);
  const [deliveryDate, setDeliveryDate] = useState<string>('');
  const [isAdvanceBooking, setIsAdvanceBooking] = useState(false);
  const [isFulfilledImmediately, setIsFulfilledImmediately] = useState(false);
  const [isFestiveBooking, setIsFestiveBooking] = useState(false);
  const [deliveryType, setDeliveryType] = useState<string>('Self delivery');
  const [paymentStatus, setPaymentStatus] = useState<'Paid' | 'Partial' | 'Unpaid' | ''>('');
  const [paymentMode, setPaymentMode] = useState<string>('Cash');
  const [paidAmount, setPaidAmount] = useState<number | string>('');
  const [pointsToRedeem, setPointsToRedeem] = useState<number>(0);
  const [customDiscount, setCustomDiscount] = useState<number | string>('');
  const [orderItems, setOrderItems] = useState<SalesItem[]>([]);
  const [isNewCustomerSelected, setIsNewCustomerSelected] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerAddress, setNewCustomerAddress] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');

  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [isSubmitDropdownOpen, setIsSubmitDropdownOpen] = useState(false);
  const [customInvoiceNumber, setCustomInvoiceNumber] = useState<string>('');

  const getSuggestedInvoiceNumber = (isFestive: boolean, isAdvance: boolean) => {
    const biz = dbStore.getBusiness(businessId);
    const standardPrefix = biz?.invoice_prefix ? biz.invoice_prefix.trim() : 'SO-2026-';
    const festivePrefix = biz?.festive_invoice_prefix ? biz.festive_invoice_prefix.trim() : 'FEST-KF-';
    const prefix = isFestive ? festivePrefix : standardPrefix;
    
    const allOrders = dbStore.getSalesOrders(businessId);
    const existingPrefixOrders = allOrders.filter(o => o.order_number && o.order_number.startsWith(prefix));
    let maxSeq = 0;
    existingPrefixOrders.forEach(o => {
      const numPart = o.order_number.replace(prefix, '').replace('AB-', '');
      const parsed = parseInt(numPart, 10);
      if (!isNaN(parsed) && parsed > maxSeq) {
        maxSeq = parsed;
      }
    });
    const nextSeq = maxSeq + 1;
    return isAdvance ? `${prefix}AB-${nextSeq}` : `${prefix}${nextSeq}`;
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
  const [rowQty, setRowQty] = useState<number | string>(1);
  const [rowPrice, setRowPrice] = useState<number | string>(0);
  const [rowTaxRate, setRowTaxRate] = useState<number | string>(defaultTenantTax);

  const resetForm = () => {
    setEditingOrderId(null);
    const biz = dbStore.getBusiness(businessId);
    setCustomInvoiceNumber(getSuggestedInvoiceNumber(false, false));
    setSelectedCustomerId('');
    setSelectedArea(biz?.default_dispatch_zone || 'Dahisar');
    setOrderDate(getLocalTodayDate());
    setOrderTime(getLocalCurrentTimeInput());
    setDeliveryDate('');
    setDeliveryType('Self delivery');
    setIsAdvanceBooking(false);
    setIsFulfilledImmediately(false);
    setIsFestiveBooking(false);
    setPaymentStatus('');
    setPaymentMode('Cash');
    setPaidAmount('');
    setPointsToRedeem(0);
    setCustomDiscount('');
    setOrderItems([]);
    setIsNewCustomerSelected(false);
    setNewCustomerName('');
    setNewCustomerAddress('');
    setNewCustomerPhone('');
    setRowProductId('');
    setRowQty(1);
    setRowPrice(0);
    setRowTaxRate(typeof biz?.tax_rate_default === 'number' && !isNaN(biz.tax_rate_default) ? biz.tax_rate_default : 0);
  };
  useEffect(() => {
    if (isCreateModalOpen && !editingOrderId && !customInvoiceNumber) {
      setCustomInvoiceNumber(getSuggestedInvoiceNumber(isFestiveBooking, isAdvanceBooking));
    }
  }, [isCreateModalOpen, editingOrderId, customInvoiceNumber, isFestiveBooking, isAdvanceBooking]);

  useEffect(() => {
    return dbStore.subscribe(() => {
      setOrders(dbStore.getSalesOrders(businessId));
      setCustomers(dbStore.getCustomers(businessId));
      setProducts(dbStore.getProducts(businessId));
    });
  }, [businessId]);


  const handleOpenAddModal = () => {
    resetForm();
    setIsCreateModalOpen(true);
  };

  const handleCloseCreateModal = () => {
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
    if (order.delivery_status === 'Delivered') {
      triggerToast('Cannot edit an order that is already delivered.', 'error');
      return;
    }
    if (order.status === 'Packed') {
      triggerToast('Note: Editing a packed order will revert its status to Pending.', 'info');
    }
    
    setEditingOrderId(order.id);
    setCustomInvoiceNumber(order.order_number);
    setSelectedCustomerId(order.customer_id);
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
    setCustomDiscount(order.discount_amount || 0);
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

    if (orderItems.some(it => it.product_id === rowProductId)) {
      triggerToast('Item already listed in order line.', 'error');
      return;
    }

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

    const newItem: SalesItem = {
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

    setOrderItems([...orderItems, newItem]);
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
    
    const discountAmount = customDiscount !== '' && !isNaN(Number(customDiscount))
      ? Math.max(0, Number(customDiscount))
      : (actualRedeem * pointVal);
    
    const finalAmount = Math.max(0, subtotalBeforeDiscount - discountAmount);
    
    let computedPaid = 0;
    if (paymentStatus === 'Paid') {
      computedPaid = finalAmount;
    } else if (paymentStatus === 'Partial') {
      computedPaid = Math.min(finalAmount, Math.max(0, Number(paidAmount) || 0));
    } else {
      computedPaid = 0;
    }
    
    const balance = Math.max(0, finalAmount - computedPaid);

    return {
      taxableVal,
      taxVal,
      subtotalBeforeDiscount,
      discountAmount,
      finalAmount,
      computedPaid,
      balance,
      actualRedeem
    };
  }, [orderItems, pointsToRedeem, customDiscount, paymentStatus, paidAmount, selectedCustomerId, customers, businessId]);

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
    if (paymentStatus === 'Partial' && (!paidAmount || Number(paidAmount) <= 0)) {
      finalPaymentStatusToSave = 'Unpaid';
      triggerToast('Amount is 0, saving as Unpaid / On Credit.', 'info');
    }

    if (paymentStatus === 'Unpaid' && selectedCustomerId === 'WALK_IN') {
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
      } else if (selectedCustomerId === 'WALK_IN') {
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
      const actualPaid = computedPaid;
      
      let customerObj = customers.find(c => c.id === finalCustomerId);
      // Fallback for newly created customer in this same turn
      if (!customerObj && finalCustomerId && finalCustomerId !== 'WALK_IN') {
        const allCusts = dbStore.getCustomers(businessId);
        customerObj = allCusts.find(c => c.id === finalCustomerId);
      }

      const isWalkIn = customerObj?.name === 'Walk-in Customer' || finalCustomerId === 'WALK_IN';

      if (customerObj && !isWalkIn && (unpaidBalance > 0) && ((customerObj.outstanding_amount || 0) + unpaidBalance > (customerObj.credit_limit || 0))) {
        const confirmed = window.confirm(
          `CREDIT LIMIT WARNING!\nThis transaction will increase debt by ${currencySymbol}${unpaidBalance.toLocaleString()} and breach authorized limit of ${currencySymbol}${(customerObj.credit_limit || 0).toLocaleString()}.\nDo you want to override and bypass credit check?`
        );
        if (!confirmed) {
          setIsSubmitting(false);
          return;
        }
      }

      if (editingOrderId) {
        // Edit flow
        const existingOrder = orders.find(o => o.id === editingOrderId);
        const oldUnpaidBalance = existingOrder ? (Number(existingOrder.total_amount) - Number(existingOrder.paid_amount || 0)) : 0;
        const orderNum = customInvoiceNumber.trim() || (existingOrder ? existingOrder.order_number : `${currentBiz?.invoice_prefix || 'SO-'}${Math.floor(1000 + Math.random() * 9000)}`);
        
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
          status: isFulfilledImmediately || isWalkIn ? 'Delivered' : existingOrder?.status === 'Packed' ? 'Pending' : (existingOrder?.status || 'Pending'),
          delivery_status: isFulfilledImmediately || isWalkIn ? 'Delivered' : existingOrder?.delivery_status || 'Pending',
          payment_status: finalPaymentStatusToSave as any,
          payment_mode: paymentMode,
          paid_amount: actualPaid,
          advance_booking: isAdvanceBooking,
          festive_booking: isFestiveBooking,
          total_amount: finalAmount,
          discount_amount: calculatedDiscount,
          points_redeemed: actualRedeem,
          is_updated: true,
          qr_code_data: `${orderNum}|${finalCustomerId}|${finalCustomerName}|${orderItems.length} items`,
        });

        finalCreatedOrder = dbStore.getSalesOrders(businessId).find(o => o.id === editingOrderId) || null;

        // Update customer outstanding debt for edits
        if (customerObj && !isWalkIn) {
          const debtChange = unpaidBalance - oldUnpaidBalance;
          if (debtChange !== 0) {
            dbStore.updateCustomer(finalCustomerId, {
              outstanding_amount: Math.max(0, (customerObj.outstanding_amount || 0) + debtChange)
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
          status: isFulfilledImmediately || isWalkIn ? 'Delivered' : 'Pending',
          payment_status: finalPaymentStatusToSave as any,
          payment_mode: paymentMode,
          paid_amount: actualPaid,
          delivery_status: isFulfilledImmediately || isWalkIn ? 'Delivered' : 'Pending',
          items: cleanItems,
          advance_booking: isAdvanceBooking,
          festive_booking: isFestiveBooking,
          total_amount: finalAmount,
          discount_amount: calculatedDiscount,
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
            triggerToast(`Customer earned +${loyaltyResult.pointsEarned} loyalty points on Order #${orderNum}!`, 'info');
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
          `Placed Sales Order: ${orderNum} totaling ${currencySymbol}${finalAmount.toLocaleString()} (${isAdvanceBooking ? 'Advance Booking' : 'Standard Delivery'})`,
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
              content: `New Sales Order ${orderNum} has been placed. Please prepare for packing.`,
              business_id: businessId
            });
          });
        }

        triggerToast(`Order ${orderNum} compiled. Added to pending packing list.`, 'success');
      }

      setOrders(dbStore.getSalesOrders(businessId));
      
      if (postAction === 'save_new') {
        resetForm();
        setIsCreateModalOpen(true);
        setCustomInvoiceNumber('');
      } else if (postAction === 'print' && finalCreatedOrder) {
        resetForm();
        setIsCreateModalOpen(false);
        setViewingInvoiceOrder(finalCreatedOrder);
        // Small delay to ensure state update and modal close
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
      const query = searchQuery.toLowerCase().trim();
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

                      {/* Collect / Record Payment */}
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
                    if (selectedOrderForDetail.delivery_status === 'Delivered') {
                      triggerToast('Note: This order is already delivered. Any changes will update the inventory records.', 'info');
                    }
                    setInvoiceToEdit(selectedOrderForDetail);
                    setSelectedOrderForDetail(null);
                  }}
                  className={`w-full py-3 rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5 ${selectedOrderForDetail.delivery_status === 'Delivered' ? 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500 cursor-not-allowed' : 'bg-sky-100 hover:bg-sky-200 text-sky-700 dark:bg-sky-900/40 dark:hover:bg-sky-900/60 dark:text-sky-300 cursor-pointer'}`}
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
              <div className="bg-slate-950 text-white px-6 py-4 flex items-center justify-between">
                <div>
                  <h2 className="text-[11px] font-bold uppercase tracking-wider">Commercial Tax Invoice</h2>
                  <p className="text-[10px] text-slate-400">Order: {viewingInvoiceOrder.order_number}</p>
                </div>
                <button onClick={() => setViewingInvoiceOrder(null)} className="text-slate-300 hover:text-white cursor-pointer">
                  <X size={18} />
                </button>
              </div>              {/* Printable Area block */}
              <div className="flex-1 overflow-y-auto p-4 bg-slate-100 dark:bg-slate-950" id="printable-tax-invoice">
                <BillOfSupplyView 
                  order={viewingInvoiceOrder} 
                  customer={custObj} 
                  businessObj={businessObj} 
                  products={products} 
                />
              </div>

              {/* Action buttons in two distinct rows */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 space-y-2">
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
                      if (viewingInvoiceOrder.delivery_status === 'Delivered') {
                        triggerToast('Cannot edit an order that is already delivered.', 'error');
                        return;
                      }
                      setInvoiceToEdit(viewingInvoiceOrder);
                      setViewingInvoiceOrder(null);
                    }}
                    className={`py-2 px-2 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition ${viewingInvoiceOrder.delivery_status === 'Delivered' ? 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500 cursor-not-allowed' : 'bg-sky-100 dark:bg-sky-950/60 hover:bg-sky-200 dark:hover:bg-sky-900/80 text-sky-700 dark:text-sky-300 cursor-pointer'}`}
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
          <div className="bg-white dark:bg-slate-900 w-full h-full flex flex-col animate-in zoom-in duration-150 overflow-hidden">
            <div className="bg-slate-50 dark:bg-slate-800 px-6 py-4 border-b flex items-center justify-between">
              <div>
                <h2 className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 text-slate-900 dark:text-white">
                  <PlusCircle className="text-amber-500" />
                  <span>{editingOrderId ? 'Update Sales Order Invoice' : 'Compile New Sales Order Invoice'}</span>
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] bg-indigo-50 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300 font-extrabold px-2 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-800">
                    Currency: {currencySymbol} ({currentBiz?.currency_symbol || currentBiz?.currency_default || 'INR'})
                  </span>
                  <span className="text-[10px] bg-emerald-50 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 font-extrabold px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                    Default Tax: {defaultTenantTax}% GST
                  </span>
                </div>
              </div>
              <button onClick={handleCloseCreateModal} className="text-slate-400 hover:text-slate-600 cursor-pointer p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition"><X size={18} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider block">
                    <span>Invoice Number *</span>
                  </label>
                  <input 
                    type="text"
                    value={customInvoiceNumber || getSuggestedInvoiceNumber(isFestiveBooking, isAdvanceBooking)}
                    readOnly
                    placeholder="Auto-Generated Invoice #"
                    className="w-full px-3 py-2 bg-amber-50/70 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 text-[11px] rounded-lg border border-amber-300 dark:border-amber-800/80 focus:outline-hidden font-black cursor-not-allowed select-none"
                  />
                </div>

                <div className="md:col-span-2 space-y-1">
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
                          setPointsToRedeem(c.loyalty_points || 0);
                          if (c.area && c.area !== 'Other') {
                            setSelectedArea(c.area);
                          } else {
                            setSelectedArea(currentBiz?.default_dispatch_zone || 'Dahisar');
                          }
                          setOrderItems(prev => recalculateOrderPrices(prev, c, isAdvanceBooking, isFestiveBooking));
                        } else {
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
                          setPointsToRedeem(newCust.loyalty_points || 0);
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

                <div className="space-y-1">
                  <label className="text-[11px] font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider">Area Zone Location</label>
                  {(() => {
                    const areaZoneList = currentBiz?.area_zones && currentBiz.area_zones.length > 0 
                      ? currentBiz.area_zones 
                      : ['Dahisar', 'Borivali', 'Kandivali', 'Mira Road', 'Vasai', 'Virar', 'Malad', 'Goregaon', 'Andheri'];
                    return (
                      <CustomDropdown 
                        value={selectedArea}
                        onChange={(val) => setSelectedArea(val)}
                        options={areaZoneList.map(aZone => ({ value: aZone, label: aZone }))}
                        className="font-bold text-slate-700 dark:text-slate-200"
                      />
                    );
                  })()}
                </div>

                {/* Loyalty Account Banner */}
                {selectedCustomerId && selectedCustomerId !== 'WALK_IN' && (() => {
                  const selCust = customers.find(c => c.id === selectedCustomerId);
                  if (!selCust) return null;
                  const pts = selCust.loyalty_points || 0;
                  const tier = selCust.loyalty_tier || 'Silver';
                  const config = dbStore.getLoyaltyConfig(businessId);
                  const pointVal = config?.point_value || 1;

                  // Calculate estimated points earned for current order
                  const taxableVal = orderItems.reduce((sum, item) => sum + (item.qty * item.selling_price), 0);
                  const taxVal = orderItems.reduce((sum, item) => sum + (item.qty * item.selling_price * (item.gst_rate / 100)), 0);
                  const totalOrderAmount = Math.round(taxableVal + taxVal);
                  
                  const actualRedeem = Math.min(pts, pointsToRedeem);
                  const discountAmount = actualRedeem * pointVal;
                  const netSpend = Math.max(0, totalOrderAmount - discountAmount);
                  
                  const basePoints = Math.floor(netSpend / (config.spend_per_point || 100));
                  const newLifetimeSpend = (selCust.lifetime_spend || 0) + totalOrderAmount;
                  const newTier = dbStore.calculateCustomerTier(newLifetimeSpend, config);
                  
                  let multiplier = 1.0;
                  if (newTier === 'Gold') multiplier = config.gold_multiplier || 1.25;
                  if (newTier === 'Platinum') multiplier = config.platinum_multiplier || 1.5;
                  const pointsEarned = Math.floor(basePoints * multiplier);

                  return (
                    <div className="md:col-span-4 p-2.5 bg-gradient-to-r from-amber-50 to-indigo-50 dark:from-amber-950/40 dark:to-indigo-950/40 rounded-xl border border-amber-200/80 dark:border-amber-800/60 flex flex-wrap items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="p-1.5 bg-amber-500 text-white rounded-lg font-black text-[10px]">
                          {tier === 'Platinum' ? '💎 PLATINUM' : tier === 'Gold' ? '🥇 GOLD' : '🥈 SILVER'}
                        </span>
                        <div>
                          <span className="font-bold text-slate-900 dark:text-white block text-[11px]">
                            {selCust.name} Loyalty Account: <strong className="text-amber-600 dark:text-amber-400 font-extrabold">{pts} Points</strong>
                          </span>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400">
                            Available Discount Value: {currencySymbol}{(pts * pointVal).toLocaleString()}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        {pointsEarned > 0 && (
                          <div className="flex flex-col items-end">
                            <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                              Expected Bonus
                            </span>
                            <span className="font-black text-indigo-700 dark:text-indigo-300">
                              +{pointsEarned} Pts
                            </span>
                          </div>
                        )}

                        <div className="flex items-center gap-2 border-l border-slate-200 dark:border-slate-700 pl-4">
                          <label className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                            Redeem Points:
                          </label>
                          <input
                            type="number"
                            min={0}
                            max={pts > 0 ? pts : undefined}
                            value={pointsToRedeem}
                            onFocus={e => e.target.select()}
                            onChange={e => {
                              const valStr = e.target.value;
                              if (valStr === '') {
                                setPointsToRedeem(0);
                                setCustomDiscount(0);
                              } else {
                                const num = parseInt(valStr, 10);
                                if (!isNaN(num)) {
                                  const clamped = Math.max(0, pts > 0 ? Math.min(pts, num) : num);
                                  setPointsToRedeem(clamped);
                                  setCustomDiscount(clamped * pointVal);
                                }
                              }
                            }}
                            className="w-20 px-2 py-1 bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700 rounded-lg font-mono font-bold text-center text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-sm"
                            placeholder="0"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })()}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider">Delivery Date</label>
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

                <div className="space-y-1 flex flex-col justify-end pb-1.5">
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <input 
                        type="checkbox" 
                        id="advance-chk"
                        checked={isAdvanceBooking}
                        onChange={(e) => handleToggleAdvanceBooking(e.target.checked)}
                        className="h-4 w-4 text-indigo-600 cursor-pointer rounded"
                      />
                      <label htmlFor="advance-chk" className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase flex items-center gap-1 cursor-pointer">
                        <Sparkles size={14} className="text-indigo-500" />
                        <span>Advance Booking</span>
                      </label>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <input 
                        type="checkbox" 
                        id="fulfilled-chk"
                        checked={isFulfilledImmediately}
                        onChange={(e) => {
                          setIsFulfilledImmediately(e.target.checked);
                          if (e.target.checked) {
                            setPaymentStatus('Paid');
                          }
                        }}
                        className="h-4 w-4 text-emerald-600 cursor-pointer rounded"
                      />
                      <label htmlFor="fulfilled-chk" className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase flex items-center gap-1 cursor-pointer">
                        <CheckCircle2 size={14} className="text-emerald-500" />
                        <span>Delivered / Handed Over</span>
                      </label>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <input 
                        type="checkbox" 
                        id="festive-chk"
                        checked={isFestiveBooking}
                        onChange={(e) => handleToggleFestiveBooking(e.target.checked)}
                        className="h-4 w-4 text-amber-600 cursor-pointer rounded"
                      />
                      <label htmlFor="festive-chk" className="text-[11px] font-bold text-amber-700 dark:text-amber-400 uppercase flex items-center gap-1 cursor-pointer">
                        <Sparkles size={14} className="text-amber-500" />
                        <span>Festive Booking</span>
                      </label>
                    </div>
                  </div>
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
                  <div className="md:col-span-4">
                    <label className="text-[11px] font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider block mb-1">Product SKU *</label>
                    <CustomDropdown 
                      value={rowProductId}
                      onChange={(pId) => {
                        setRowProductId(pId);
                        const prod = products.find(p => p.id === pId);
                        if (prod) {
                          const selCust = customers.find(c => c.id === selectedCustomerId);
                          const evalRes = calculateApplicablePrice(prod, {
                            isLoyalMember: isLoyalMember(selCust),
                            isAdvanceBooking,
                            isDiwaliSale: isFestiveBooking,
                            business: currentBiz,
                            orderDate
                          });
                          setRowPrice(evalRes.appliedPrice);
                          const defaultTax = (defaultTenantTax === 0 || prod.gst_rate === 18 || typeof prod.gst_rate !== 'number' || isNaN(prod.gst_rate))
                            ? defaultTenantTax
                            : prod.gst_rate;
                          setRowTaxRate(defaultTax);
                        }
                      }}
                      placeholder="-- Choose Product SKU --"
                      searchable={true}
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
                            label: `${p.name} (SKU: ${p.sku} | ${evalRes.rateType}: ${currencySymbol}${evalRes.appliedPrice.toLocaleString()})`
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
                          setIsFulfilledImmediately(true);
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
              const { taxableVal, taxVal, discountAmount, finalAmount, actualRedeem } = calculatedTotals;
              const totalVal = finalAmount;
              const savingsInfo = calculateOrderSavings(orderItems, products);

              return (
                <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-3">
                  {savingsInfo.totalSavings > 0 && (
                    <div className="px-3 py-2 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/80 dark:to-teal-950/80 border border-emerald-300 dark:border-emerald-800 rounded-xl text-emerald-950 dark:text-emerald-200 text-xs font-bold flex items-center justify-between gap-2 shadow-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-base">🎉</span>
                        <span className="font-extrabold">{savingsInfo.bannerMessage}</span>
                      </div>
                      <span className="text-[10px] font-mono font-black text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded border border-emerald-300 dark:border-emerald-700">
                        Total Member Savings: {currencySymbol}{savingsInfo.totalSavings.toLocaleString()}
                      </span>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div className="flex items-center gap-4 text-left font-mono text-[11px]">
                    <div>
                      <span className="text-[10px] text-slate-900 dark:text-slate-100 uppercase block font-black tracking-wider mb-0.5">Base Subtotal</span>
                      <strong className="font-bold text-slate-700 dark:text-slate-300">
                        {currencySymbol}{taxableVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-900 dark:text-slate-100 uppercase block font-black tracking-wider mb-0.5">Total Tax (GST)</span>
                      <strong className="font-bold text-emerald-600 dark:text-emerald-400">
                        +{currencySymbol}{taxVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-rose-600 dark:text-rose-400 uppercase block font-black tracking-wider mb-0.5">
                        Discount ({currencySymbol})
                      </span>
                      <input 
                        type="number"
                        min={0}
                        step="any"
                        placeholder="0"
                        value={customDiscount}
                        onFocus={(e) => e.target.select()}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === '') {
                            setCustomDiscount('');
                          } else {
                            const num = parseFloat(val);
                            setCustomDiscount(isNaN(num) ? '' : Math.max(0, num));
                          }
                        }}
                        className="w-24 px-2 py-1 bg-white dark:bg-slate-800 border border-rose-300 dark:border-rose-700 rounded-lg text-xs font-mono font-bold text-rose-600 dark:text-rose-400 focus:outline-hidden focus:ring-2 focus:ring-rose-500 shadow-xs text-right"
                      />
                    </div>
                    <div className="border-l border-slate-200 dark:border-slate-700 pl-4">
                      <span className="text-[11px] text-indigo-700 dark:text-indigo-400 uppercase block font-black tracking-widest mb-0.5">Grand Total Value</span>
                      <strong className="text-lg font-black text-indigo-600 dark:text-indigo-400">
                        {currencySymbol}{totalVal.toLocaleString()}
                      </strong>
                    </div>
                  </div>

                  <div className="flex gap-2 w-full sm:w-auto justify-end">
                    <button 
                      type="button" 
                      onClick={handleCloseCreateModal}
                      className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-[11px] font-semibold hover:bg-slate-300 cursor-pointer"
                    >
                      Cancel
                    </button>
                    
                    <div className="relative flex">
                      <button 
                        type="button" 
                        disabled={isSubmitting}
                        onClick={() => handleCreateSalesOrder('save_new')}
                        className={`px-4 py-2 rounded-l-lg text-[11px] font-bold shadow-md cursor-pointer transition flex items-center gap-1.5 ${isSubmitting ? 'bg-slate-400 cursor-not-allowed text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}
                      >
                        {isSubmitting ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
                        {editingOrderId ? 'Update Order' : 'Save & New'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsSubmitDropdownOpen(!isSubmitDropdownOpen)}
                        className="px-2 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-r-lg border-l border-indigo-500 transition-colors cursor-pointer"
                      >
                        <ChevronDown size={14} className={`transition-transform duration-200 ${isSubmitDropdownOpen ? 'rotate-180' : ''}`} />
                      </button>
                      
                      {isSubmitDropdownOpen && (
                        <div className="absolute bottom-full right-0 mb-2 w-44 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden z-50 animate-in slide-in-from-bottom-2 duration-150">
                           <button 
                             type="button"
                             onClick={() => handleCreateSalesOrder('share')}
                             className="w-full px-4 py-3 text-left text-[11px] font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center justify-between transition-colors cursor-pointer group"
                           >
                             <span className="group-hover:text-indigo-600 transition-colors">Share</span>
                             <Share2 size={13} className="text-slate-400 group-hover:text-indigo-500" />
                           </button>
                           <button 
                             type="button"
                             onClick={() => handleCreateSalesOrder('print')}
                             className="w-full px-4 py-3 text-left text-[11px] font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center justify-between border-t border-slate-100 dark:border-slate-700 transition-colors cursor-pointer group"
                           >
                             <span className="group-hover:text-indigo-600 transition-colors">Print</span>
                             <Printer size={13} className="text-slate-400 group-hover:text-indigo-500" />
                           </button>
                           <button 
                             type="button"
                             onClick={() => handleCreateSalesOrder('save_new')}
                             className="w-full px-4 py-3 text-left text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 flex items-center justify-between border-t border-slate-100 dark:border-slate-700 transition-colors cursor-pointer"
                           >
                             <span>Save & New</span>
                             <Save size={13} />
                           </button>
                        </div>
                      )}
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

      {/* WhatsApp / SMS Tracking Modal */}
      {selectedOrderForNotify && (
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedOrderForNotify(null);
          }}
          className="fixed inset-0 z-[70] bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
        >
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto custom-scrollbar">
            
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider block">CUSTOMER ALERT</span>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">Send WhatsApp Tracking</h3>
              </div>
              <button onClick={() => setSelectedOrderForNotify(null)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full bg-slate-100 dark:bg-slate-800 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-[11px]">
              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 font-mono text-[11px] text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                {`Hello ${selectedOrderForNotify.customer_name || 'Customer'},\nYour Kokanastha Faral order ${selectedOrderForNotify.order_number}.\nThank you for visiting!`}
              </div>

              <div className="flex gap-1.5">
                <button 
                  onClick={() => {
                    const cust = customers.find(c => c.id === selectedOrderForNotify.customer_id);
                    const phone = cust?.phone ? cust.phone.replace(/\D/g, '') : '';
                    const message = `Hello ${selectedOrderForNotify.customer_name || 'Customer'},\nYour Kokanastha Faral order ${selectedOrderForNotify.order_number}.\nThank you for visiting!`;
                    if (phone) {
                      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
                    } else {
                      triggerToast('Customer phone number not available.', 'error');
                    }
                    setSelectedOrderForNotify(null);
                  }}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-extrabold transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Send size={15} /> Send via WhatsApp
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
