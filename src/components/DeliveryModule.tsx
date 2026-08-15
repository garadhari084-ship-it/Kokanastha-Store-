
import { PageHeader } from './PageHeader';
import React, { useEffect, useState, useMemo } from 'react';
import { formatWhatsAppPhone } from '../utils/formatters';
import { DeliveryReports } from './DeliveryReports';
import { 
  Truck, 
  Search, 
  MapPin, 
  CheckCircle2, 
  Calendar,
  Package,
  Phone,
  MessageCircle,
  Navigation,
  Printer,
  IndianRupee,
  Clock,
  AlertTriangle,
  X,
  Filter,
  Eye,
  CreditCard,
  QrCode,
  RotateCcw,
  Building2,
  LayoutGrid,
  LayoutList,
  Grid3X3,
  Banknote,
  XCircle,
  Sparkles,
  User,
  AlertCircle,
  PackageCheck,
  ArrowRight,
  AlertOctagon,
  ShieldAlert,
  FileText,
  Receipt,
  Undo2,
  Check
} from 'lucide-react';
import { dbStore } from '../services/store';
import { SalesOrder, Customer, UserProfile, OrderStatus } from '../types/erp';
import { TodayDeliveryModal } from './TodayDeliveryModal';

const DAMAGE_REASONS = [
  'Broken / Smashed in Transit (Courier Fault)',
  'Liquid Leakage / Wet Package',
  'Torn / Crushed Packaging with Product Damage',
  'Expired / Spoiled during Transit',
  'Manufacturing Defect Identified on Delivery',
  'Temperature / Storage Damage in Transit',
  'Lost / Pilfered Contents',
  'Other Transit Damage'
];

const REFUND_REASONS = [
  'Customer Refused / Cancelled at Doorstep',
  'Customer Not Available / Phone Unreachable',
  'Wrong Item Delivered (Good Condition)',
  'Customer Ordered by Mistake',
  'Delivery Address Untraceable',
  'Customer Changed Mind / Delayed Delivery',
  'Payment Refused by Customer',
  'Other Customer Return'
];

interface DeliveryModuleProps {
  businessId: string;
  user: UserProfile;
  triggerToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const DeliveryModule: React.FC<DeliveryModuleProps> = ({ 
  businessId, 
  user, 
  triggerToast
}) => {
  const [orders, setOrders] = useState<SalesOrder[]>(
    dbStore.getSalesOrders(businessId)
  );
  const [customers, setCustomers] = useState<Customer[]>(dbStore.getCustomers(businessId));
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [activeFilter, setActiveFilter] = useState<'All' | 'Pending Delivery' | 'Ready to Dispatch' | 'In Transit' | 'Delivered' | 'Returned' | 'Overdue'>('Pending Delivery');
  const [dateFilter, setDateFilter] = useState<string>('All');
  const [customDate, setCustomDate] = useState<string>('');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [activeView, setActiveView] = useState<'Operations' | 'PackingCompleted' | 'ReadyToDispatch' | 'InTransit' | 'Delivered' | 'Returned' | 'Reports'>('PackingCompleted');
  
  const reloadOrders = () => {
    setOrders(dbStore.getSalesOrders(businessId));
  };

  useEffect(() => {
    return dbStore.subscribe(() => {
      setCustomers(dbStore.getCustomers(businessId));
      reloadOrders();
      setDetailOrder(current => {
        if (!current) return null;
        const updated = dbStore.getSalesOrders(businessId).find(o => o.id === current.id);
        return updated || current;
      });
    });
  }, [businessId]);

  // Delivery confirmation modal state
  const [confirmingOrder, setConfirmingOrder] = useState<SalesOrder | null>(null);
  const [selectedPaymentMode, setSelectedPaymentMode] = useState<'Cash' | 'Card' | 'UPI' | 'Net Banking' | 'Not Paid' | null>(null);
  const [deliveryReceivedBy, setDeliveryReceivedBy] = useState<string>('Customer (Self)');
  const [deliveryReceivedByName, setDeliveryReceivedByName] = useState<string>('');
  const [deliveryProofNotes, setDeliveryProofNotes] = useState<string>('');
  const [codPaymentRef, setCodPaymentRef] = useState<string>('');

  // Refund / Damage Return Modal State
  const [returnModalOrder, setReturnModalOrder] = useState<SalesOrder | null>(null);
  const [returnType, setReturnType] = useState<'Refund' | 'Damage'>('Refund');
  const [returnReason, setReturnReason] = useState<string>('');
  const [returnNotes, setReturnNotes] = useState<string>('');
  const [damageCourierResponsible, setDamageCourierResponsible] = useState<string>('');

  const REFUND_REASONS = [
    'Customer Refused at Doorstep',
    'Customer Not Available / Phone Unreachable',
    'Wrong Item / Order Mismatch',
    'Delivery Delayed / Late Arrival',
    'Customer Cancelled / Changed Mind',
    'Address / Location Not Found',
    'Duplicate Order Placed',
    'Quality Dissatisfaction (Returned Intact)',
    'Other'
  ];

  const DAMAGE_REASONS = [
    'Damaged in Transit by Courier / Rider',
    'Package Broken / Crushed',
    'Liquid / Oil Leakage in Transit',
    'Perishable Goods Spoiled / Melted',
    'Packaging Torn / Seal Tampered',
    'Accident / Mishandled during Delivery',
    'Item Broken inside Parcel',
    'Other'
  ];

  const openDeliveryModal = (o: SalesOrder) => {
    setConfirmingOrder(o);
    const unpaid = Math.max(0, o.total_amount - (o.paid_amount || 0));
    if (o.payment_status === 'Paid' || unpaid <= 0) {
      setSelectedPaymentMode(null);
    } else {
      setSelectedPaymentMode('Cash');
    }
    setDeliveryReceivedBy('Customer (Self)');
    setDeliveryReceivedByName(o.customer_name || '');
    setDeliveryProofNotes('');
    setCodPaymentRef('');
  };

  const openReturnModal = (o: SalesOrder, type: 'Refund' | 'Damage' = 'Refund') => {
    setReturnModalOrder(o);
    setReturnType(type);
    setReturnReason('');
    setReturnNotes('');
    setDamageCourierResponsible(o.delivery_partner || 'Assigned Courier / Rider');
  };

  const [detailOrder, setDetailOrder] = useState<SalesOrder | null>(null);
  const [editRackLocation, setEditRackLocation] = useState('');
  const [editRackSection, setEditRackSection] = useState('');
  const [editTotalBags, setEditTotalBags] = useState<number>(1);
  const [isEditingStorage, setIsEditingStorage] = useState(false);

  // Dedicated Storage Rack & Ready for Delivery modal state
  const [storageModalOrder, setStorageModalOrder] = useState<SalesOrder | null>(null);
  const [storageRackLocation, setStorageRackLocation] = useState('');
  const [storageRackSection, setStorageRackSection] = useState('');
  const [storageTotalBags, setStorageTotalBags] = useState<number>(1);

  const openStorageRackModal = (o: SalesOrder) => {
    setStorageModalOrder(o);
    setStorageRackLocation(o.rack_location || '');
    setStorageRackSection(o.rack_section || '');
    setStorageTotalBags(o.total_bags || 1);
  };

  const handleSaveStorageAndMoveToDispatch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!storageModalOrder) return;

    dbStore.updateSalesOrder(storageModalOrder.id, {
      rack_location: storageRackLocation,
      rack_section: storageRackSection,
      total_bags: storageTotalBags,
      ready_for_dispatch: true
    });

    triggerToast(`Order #${storageModalOrder.order_number} rack storage updated and moved to Ready to Dispatch!`, 'success');
    setStorageModalOrder(null);
    reloadOrders();
  };

  const openDetailModal = (o: SalesOrder) => {
    setDetailOrder(o);
    setEditRackLocation(o.rack_location || '');
    setEditRackSection(o.rack_section || '');
    setEditTotalBags(o.total_bags || 1);
    setIsEditingStorage(false);
  };
  
  const saveStorageInfo = () => {
    if (detailOrder) {
      dbStore.updateSalesOrder(detailOrder.id, {
        rack_location: editRackLocation,
        rack_section: editRackSection,
        total_bags: editTotalBags
      });
      triggerToast('Storage info updated successfully', 'success');
      
      const updatedOrder = {...detailOrder, rack_location: editRackLocation, rack_section: editRackSection, total_bags: editTotalBags};
      console.log('Updating order details with:', updatedOrder);
      
      setDetailOrder(updatedOrder);
      setIsEditingStorage(false);
      reloadOrders();
    }
  };

  // Delivery Partner & Dispatch Station State
  const [dispatchingOrder, setDispatchingOrder] = useState<SalesOrder | null>(null);
  const [deliveryPartner, setDeliveryPartner] = useState<string>('Rapido');
  const [personName, setPersonName] = useState<string>('');
  const [personPhone, setPersonPhone] = useState<string>('');
    const [trackingNumber, setTrackingNumber] = useState<string>('');
  const [showTodayModal, setShowTodayModal] = useState(false);

  useEffect(() => {
    // Show modal on module load to highlight today's priorities
    const timer = setTimeout(() => {
      setShowTodayModal(true);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleModalAction = (order: SalesOrder) => {
    setShowTodayModal(false);
    if (order.status === 'Dispatched') {
      openDeliveryModal(order);
    } else {
      setDispatchingOrder(order);
      // Reset dispatch form defaults
      setDeliveryPartner('Rapido');
      setPersonName('');
      setPersonPhone('');
      setTrackingNumber('');
    }
  };

  const handleCompleteDispatchAssignment = (targetOrder: SalesOrder, e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!targetOrder) return;

    try {
      const isCustomPerson = deliveryPartner === 'In-House Agent' || deliveryPartner === 'Customer Pickup';
      const updateData: Partial<SalesOrder> = {
        status: 'Dispatched',
        delivery_status: 'Dispatched',
        delivery_partner: deliveryPartner,
        delivery_person_name: isCustomPerson ? personName : undefined,
        delivery_person_phone: isCustomPerson ? personPhone : undefined,
        tracking_number: !isCustomPerson ? trackingNumber : undefined,
      };

      dbStore.updateSalesOrder(targetOrder.id, updateData);
      triggerToast(`Order #${targetOrder.order_number} dispatched & assigned to ${deliveryPartner}!`, 'success');

      // Send notification message to sales/manager staff
      const orderNum = targetOrder.order_number || targetOrder.id;
      const allUsers = dbStore.getUsers(businessId);
      const salesStaff = allUsers.filter(u => u.role && (u.role === 'Sales Staff' || u.role === 'Manager'));
      salesStaff.forEach(staff => {
        dbStore.sendMessage({
          sender_id: user.id,
          receiver_id: staff.id,
          content: `Order #${orderNum} has been assigned to ${deliveryPartner} and dispatched for delivery.`,
          business_id: businessId
        });
      });

      setDispatchingOrder(null);
      setPersonName('');
      setPersonPhone('');
      setTrackingNumber('');
      reloadOrders();
    } catch (err: any) {
      triggerToast(err.message || 'Error assigning delivery partner', 'error');
    }
  };

  const handleUpdateStatus = (order: SalesOrder, newStatus: OrderStatus) => {
    if (newStatus === 'Delivered') {
      openDeliveryModal(order);
      return;
    }
    if (newStatus === 'Returned') {
      openReturnModal(order, 'Refund');
      return;
    }
    performStatusUpdate(order, newStatus);
  };

  const handleProcessDelivery = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!confirmingOrder) return;

    const unpaidBal = Math.max(0, confirmingOrder.total_amount - (confirmingOrder.paid_amount || 0));
    const isCOD = unpaidBal > 0 && confirmingOrder.payment_status !== 'Paid';

    if (isCOD && !selectedPaymentMode) {
      triggerToast('Please select a payment mode for COD order or select "Not Paid"', 'error');
      return;
    }

    try {
      const updateData: Partial<SalesOrder> = {
        status: 'Delivered',
        delivery_status: 'Delivered',
        delivered_at: new Date().toISOString(),
        delivered_to: deliveryReceivedBy ? `${deliveryReceivedBy}${deliveryReceivedByName ? ` (${deliveryReceivedByName})` : ''}` : 'Customer',
        delivery_notes: deliveryProofNotes.trim() || undefined
      };

      if (isCOD && selectedPaymentMode && selectedPaymentMode !== 'Not Paid') {
        const modeMap: Record<string, string> = {
          'Cash': 'Cash',
          'Card': 'Card',
          'UPI': 'UPI / QR',
          'Net Banking': 'Bank Transfer'
        };
        updateData.payment_status = 'Paid';
        updateData.payment_mode = modeMap[selectedPaymentMode] || selectedPaymentMode;
        updateData.paid_amount = confirmingOrder.total_amount;
        updateData.payment_date = new Date().toISOString().split('T')[0];
        updateData.payment_reference = codPaymentRef.trim() || undefined;
        updateData.cod_collected = true;
        updateData.cod_collected_amount = unpaidBal;
      }

      dbStore.updateSalesOrder(confirmingOrder.id, updateData);

      if (isCOD && selectedPaymentMode && selectedPaymentMode !== 'Not Paid') {
        triggerToast(`Order #${confirmingOrder.order_number} marked Delivered & COD ₹${unpaidBal.toLocaleString()} collected via ${selectedPaymentMode}!`, 'success');
      } else {
        triggerToast(`Order #${confirmingOrder.order_number} marked Delivered successfully!`, 'success');
      }

      const orderNum = confirmingOrder.order_number || confirmingOrder.id;
      const allUsers = dbStore.getUsers(businessId);
      const salesStaff = allUsers.filter(u => u.role && (u.role === 'Sales Staff' || u.role === 'Manager'));
      salesStaff.forEach(staff => {
        dbStore.sendMessage({
          sender_id: user.id,
          receiver_id: staff.id,
          content: `Order #${orderNum} has been successfully delivered to ${updateData.delivered_to || 'Customer'}.`,
          business_id: businessId
        });
      });

      setConfirmingOrder(null);
      setSelectedPaymentMode(null);
      reloadOrders();
    } catch (err: any) {
      triggerToast(err.message || 'Error completing delivery', 'error');
    }
  };

  const handleProcessReturn = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!returnModalOrder) return;

    if (!returnReason) {
      triggerToast('Please select a reason from the dropdown', 'error');
      return;
    }

    try {
      const isDamage = returnType === 'Damage';

      const updateData: Partial<SalesOrder> = {
        status: 'Returned',
        delivery_status: 'Returned',
        return_type: returnType,
        return_reason: returnReason,
        return_notes: [
          returnNotes.trim(),
          isDamage && damageCourierResponsible ? `Courier Responsible: ${damageCourierResponsible}` : ''
        ].filter(Boolean).join(' | ') || undefined,
        returned_at: new Date().toISOString(),
        inventory_restocked: !isDamage,
      };

      dbStore.updateSalesOrder(returnModalOrder.id, updateData);

      if (isDamage) {
        triggerToast(`Order #${returnModalOrder.order_number} marked as Damaged (${returnReason}). Inventory NOT restocked (Scrap Write-off).`, 'info');
      } else {
        triggerToast(`Order #${returnModalOrder.order_number} processed for Refund (${returnReason}). Products successfully added back to inventory!`, 'success');
      }

      const orderNum = returnModalOrder.order_number || returnModalOrder.id;
      const allUsers = dbStore.getUsers(businessId);
      const staff = allUsers.filter(u => u.role && (u.role === 'Sales Staff' || u.role === 'Manager' || u.role === 'Admin'));
      staff.forEach(s => {
        dbStore.sendMessage({
          sender_id: user.id,
          receiver_id: s.id,
          content: isDamage 
            ? `⚠️ Order #${orderNum} marked DAMAGED in transit (${returnReason}). Write-off recorded, inventory not restocked.`
            : `🔄 Order #${orderNum} REFUNDED/RETURNED (${returnReason}). Items restocked back into inventory.`,
          business_id: businessId
        });
      });

      setReturnModalOrder(null);
      setReturnReason('');
      setReturnNotes('');
      reloadOrders();
    } catch (err: any) {
      triggerToast(err.message || 'Error processing return', 'error');
    }
  };

  const performStatusUpdate = (
    order: SalesOrder, 
    newStatus: OrderStatus,
    paymentOption?: 'Cash' | 'Card' | 'UPI' | 'Net Banking' | 'Not Paid' | null
  ) => {
    try {
      const updateData: Partial<SalesOrder> = { 
        status: newStatus,
        delivery_status: newStatus
      };

      if (newStatus === 'Delivered') {
        if (paymentOption && paymentOption !== 'Not Paid') {
          const modeMap: Record<string, string> = {
            'Cash': 'Cash',
            'Card': 'Card',
            'UPI': 'UPI / QR',
            'Net Banking': 'Bank Transfer'
          };
          updateData.payment_status = 'Paid';
          updateData.payment_mode = modeMap[paymentOption] || paymentOption;
          updateData.paid_amount = order.total_amount;
        }
      }

      dbStore.updateSalesOrder(order.id, updateData);
      
      if (newStatus === 'Delivered' && paymentOption && paymentOption !== 'Not Paid') {
        triggerToast(`Order #${order.order_number} marked Delivered & Paid via ${paymentOption}!`, 'success');
      } else {
        triggerToast(`Order status updated to ${newStatus}`, 'success');
      }

      reloadOrders();
      
      const orderNum = order.order_number || order.id;
      
      if (newStatus === 'Dispatched') {
         const allUsers = dbStore.getUsers(businessId);
         const salesStaff = allUsers.filter(u => u.role && (u.role === 'Sales Staff' || u.role === 'Manager'));
         salesStaff.forEach(staff => {
            dbStore.sendMessage({
               sender_id: user.id,
               receiver_id: staff.id,
               content: `Order ${orderNum} has been dispatched and is out for delivery.`,
               business_id: businessId
            });
         });
      }
      if (newStatus === 'Delivered') {
         const allUsers = dbStore.getUsers(businessId);
         const salesStaff = allUsers.filter(u => u.role && (u.role === 'Sales Staff' || u.role === 'Manager'));
         salesStaff.forEach(staff => {
            dbStore.sendMessage({
               sender_id: user.id,
               receiver_id: staff.id,
               content: `Order ${orderNum} has been successfully delivered.`,
               business_id: businessId
            });
         });
      }

    } catch (err: any) {
      triggerToast(err.message || 'Error updating order', 'error');
    }
  };

  const formatToYYYYMMDD = (d: Date | string) => {
    if (!d) return '';
    if (typeof d === 'string') {
      const clean = d.trim();
      if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) return clean;
      if (clean.includes('-') && clean.split('-').length === 3) {
        const parts = clean.split('-').map(Number);
        if (parts[0] > 1000) {
          return `${parts[0]}-${String(parts[1]).padStart(2, '0')}-${String(parts[2]).padStart(2, '0')}`;
        } else {
          return `${parts[2]}-${String(parts[1]).padStart(2, '0')}-${String(parts[0]).padStart(2, '0')}`;
        }
      }
      if (clean.includes('/') && clean.split('/').length === 3) {
        const parts = clean.split('/').map(Number);
        if (parts[2] > 1000) {
          return `${parts[2]}-${String(parts[1]).padStart(2, '0')}-${String(parts[0]).padStart(2, '0')}`;
        }
      }
      const dt = new Date(clean);
      if (!isNaN(dt.getTime())) {
        return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
      }
      return clean;
    }
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const dateTabs = useMemo(() => {
    const now = new Date();
    const todayStr = formatToYYYYMMDD(now);
    
    // Count orders for a specific date in current view
    const countForDate = (dateKey: string) => {
      return orders.filter(o => {
        if (activeView === 'PackingCompleted') {
          if (o.status !== 'Packed' || o.ready_for_dispatch) return false;
        } else if (activeView === 'ReadyToDispatch') {
          if (o.status !== 'Packed' || !o.ready_for_dispatch) return false;
        } else if (activeView === 'InTransit') {
          if (o.status !== 'Dispatched') return false;
        } else if (activeView === 'Delivered') {
          if (o.status !== 'Delivered') return false;
        } else if (activeView === 'Returned') {
          if (o.status !== 'Returned') return false;
        } else {
          if (activeFilter === 'Pending Delivery') {
            if (o.status !== 'Pending' && o.status !== 'Packing') return false;
          } else if (activeFilter === 'Ready to Dispatch') {
            if (o.status !== 'Packed' || !o.ready_for_dispatch) return false;
          } else if (activeFilter === 'In Transit') {
            if (o.status !== 'Dispatched') return false;
          } else if (activeFilter === 'Delivered') {
            if (o.status !== 'Delivered') return false;
          } else if (activeFilter === 'Returned') {
            if (o.status !== 'Returned') return false;
          } else if (activeFilter === 'All') {
            if (o.status === 'Packed' && !o.ready_for_dispatch) return false;
          }
        }

        const dateStr = (o.delivery_date || o.order_date || '').trim();
        if (!dateStr || dateStr === 'Unknown Date') return false;
        return formatToYYYYMMDD(dateStr) === dateKey;
      }).length;
    };

    const tabs: { id: string; label: string; count?: number }[] = [
      { id: 'All', label: 'All Dates' },
      { id: 'Today', label: "Today's Delivery", count: countForDate(todayStr) },
    ];

    // Tomorrow (i=1) and Next 5 Days (i=2..6) -> 6 upcoming days total
    for (let i = 1; i <= 6; i++) {
      const futureDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
      const dateStr = formatToYYYYMMDD(futureDate);
      const dayName = futureDate.toLocaleDateString('en-US', { weekday: 'short' });
      const monthName = futureDate.toLocaleDateString('en-US', { month: 'short' });
      const dayNum = futureDate.getDate();

      const label = i === 1 
        ? `Tomorrow (${dayNum} ${monthName})` 
        : `${dayName}, ${dayNum} ${monthName}`;

      tabs.push({
        id: dateStr,
        label,
        count: countForDate(dateStr)
      });
    }

    return tabs;
  }, [orders, activeView, activeFilter]);

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      // Apply status filter based on view or internal filter
      if (activeView === 'PackingCompleted') {
        if (o.status !== 'Packed' || o.ready_for_dispatch) return false;
      } else if (activeView === 'ReadyToDispatch') {
        if (o.status !== 'Packed' || !o.ready_for_dispatch) return false;
      } else if (activeView === 'InTransit') {
        if (o.status !== 'Dispatched') return false;
      } else if (activeView === 'Delivered') {
        if (o.status !== 'Delivered') return false;
      } else if (activeView === 'Returned') {
        if (o.status !== 'Returned') return false;
      } else {
        if (activeFilter === 'Pending Delivery') {
          if (o.status !== 'Pending' && o.status !== 'Packing') return false;
        } else if (activeFilter === 'Ready to Dispatch') {
          if (o.status !== 'Packed' || !o.ready_for_dispatch) return false;
        } else if (activeFilter === 'In Transit') {
          if (o.status !== 'Dispatched') return false;
        } else if (activeFilter === 'Delivered') {
          if (o.status !== 'Delivered') return false;
        } else if (activeFilter === 'Returned') {
          if (o.status !== 'Returned') return false;
        } else if (activeFilter === 'Overdue') {
          const todayStart = new Date();
          todayStart.setHours(0, 0, 0, 0);
          if (o.status === 'Delivered' || o.status === 'Returned' || !o.delivery_date || new Date(o.delivery_date) >= todayStart) return false;
        } else if (activeFilter === 'All') {
          if (o.status === 'Packed' && !o.ready_for_dispatch) return false;
        }
      }
      
      // Apply date filter
      if (dateFilter !== 'All') {
        const dateStr = (o.delivery_date || o.order_date || '').trim();
        if (!dateStr || dateStr === 'Unknown Date') return false;
        
        const orderDateFormatted = formatToYYYYMMDD(dateStr);
        const now = new Date();
        const todayFormatted = formatToYYYYMMDD(now);
        
        if (dateFilter === 'Today') {
          if (orderDateFormatted !== todayFormatted) return false;
        } else if (dateFilter === 'Custom') {
          if (!customDate || orderDateFormatted !== customDate) return false;
        } else {
          // Exact date string (Tomorrow or next 5 days)
          if (orderDateFormatted !== dateFilter) return false;
        }
      }
      
      if (searchQuery) {
        const cust = customers.find(c => c.id === o.customer_id);
        const q = searchQuery.toLowerCase();
        return o.order_number.toLowerCase().includes(q) || 
               (cust && cust.name.toLowerCase().includes(q));
      }
      
      return true;
    }).sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
  }, [orders, customers, searchQuery, activeFilter, dateFilter, customDate, activeView]);

  const groupedOrders = useMemo(() => {
    const groups: Record<string, SalesOrder[]> = {};
    filteredOrders.forEach(o => {
      const date = o.delivery_date || o.order_date || 'Unknown Date';
      if (!groups[date]) groups[date] = [];
      groups[date].push(o);
    });
    
    return Object.entries(groups).sort(([dateA], [dateB]) => dateA.localeCompare(dateB));
  }, [filteredOrders]);

  const getRelativeDateLabel = (dateString: string) => {
    if (!dateString || dateString === 'Unknown Date') return dateString || 'Unknown Date';
    
    const formatted = formatToYYYYMMDD(dateString);
    const now = new Date();
    const todayFormatted = formatToYYYYMMDD(now);
    
    const tmrw = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const tmrwFormatted = formatToYYYYMMDD(tmrw);
    
    if (formatted === todayFormatted) return `Today's Delivery (${dateString})`;
    if (formatted === tmrwFormatted) return `Tomorrow's Delivery (${dateString})`;
    
    try {
      const parts = formatted.split('-').map(Number);
      if (parts.length === 3) {
        const d = new Date(parts[0], parts[1] - 1, parts[2]);
        const dayName = d.toLocaleDateString('en-US', { weekday: 'long' });
        const monthName = d.toLocaleDateString('en-US', { month: 'short' });
        return `Delivery on ${dayName}, ${parts[2]} ${monthName} (${dateString})`;
      }
    } catch {
      // fallback
    }

    return `Delivery on ${dateString}`;
  };

  // Metrics
  const pendingCount = orders.filter(o => o.status === 'Pending' || o.status === 'Packing').length;
  const packingCompletedCount = orders.filter(o => o.status === 'Packed' && !o.ready_for_dispatch).length;
  const readyCount = orders.filter(o => o.status === 'Packed' && o.ready_for_dispatch).length;
  const transitCount = orders.filter(o => o.status === 'Dispatched').length;
  const deliveredCount = orders.filter(o => o.status === 'Delivered').length;
  const returnedCount = orders.filter(o => o.status === 'Returned').length;
  const codPendingCount = orders.filter(o => (o.status === 'Dispatched' || (o.status === 'Packed' && o.ready_for_dispatch)) && o.payment_status !== 'Paid').length;
  const codPendingAmount = orders.filter(o => (o.status === 'Dispatched' || (o.status === 'Packed' && o.ready_for_dispatch)) && o.payment_status !== 'Paid')
    .reduce((sum, o) => sum + Math.max(0, o.total_amount - (o.paid_amount || 0)), 0);

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const overdueCount = orders.filter(o => 
    o.status !== 'Delivered' && 
    o.status !== 'Returned' && 
    o.delivery_date && 
    new Date(o.delivery_date) < todayStart
  ).length;

  const handlePrintNote = (order: SalesOrder) => {
    const cust = customers.find(c => c.id === order.customer_id);
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Dispatch Note - ${order.order_number}</title>
          <style>
            body { font-family: system-ui, sans-serif; padding: 2rem; max-width: 800px; margin: 0 auto; color: #1e293b; }
            h1 { font-size: 1.5rem; margin-bottom: 0.5rem; font-weight: 900; }
            .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2rem; border-bottom: 2px solid #e2e8f0; padding-bottom: 1rem; }
            .badge { display: inline-block; padding: 0.25rem 0.5rem; border-radius: 999px; font-size: 0.75rem; font-weight: 700; background: #e2e8f0; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-bottom: 2rem; }
            .box { padding: 1rem; border: 1px solid #e2e8f0; border-radius: 0.5rem; }
            .box h3 { font-size: 0.75rem; text-transform: uppercase; color: #64748b; margin-top: 0; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 2rem; }
            th { text-align: left; padding: 0.75rem; border-bottom: 1px solid #cbd5e1; font-size: 0.875rem; }
            td { padding: 0.75rem; border-bottom: 1px solid #e2e8f0; font-size: 0.875rem; }
            .totals { text-align: right; }
            .totals strong { font-size: 1.25rem; }
            .cod-alert { background: #fee2e2; color: #991b1b; padding: 1rem; border-radius: 0.5rem; text-align: center; font-weight: bold; margin-bottom: 1rem; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1>DISPATCH NOTE</h1>
              <p>Order: <strong>${order.order_number}</strong> &bull; Date: ${order.order_date}</p>
            </div>
            <div class="badge">${order.status.toUpperCase()}</div>
          </div>
          
          ${order.payment_status !== 'Paid' ? `
            <div class="cod-alert">
              PAYMENT PENDING / CASH ON DELIVERY: ₹${Math.max(0, order.total_amount - (order.paid_amount || 0)).toLocaleString()}
            </div>
          ` : `
            <div style="background: #dcfce7; color: #166534; padding: 1rem; border-radius: 0.5rem; text-align: center; font-weight: bold; margin-bottom: 1rem;">
              PREPAID ORDER - DO NOT COLLECT CASH
            </div>
          `}
          
          <div class="info-grid">
            <div class="box">
              <h3>Delivery To</h3>
              <strong>${cust?.name || 'Customer'}</strong><br/>
              ${cust?.shipping_address || 'No address provided'}<br/><br/>
              ${cust?.phone ? `Phone: \${${cust.phone}}` : ''}
            </div>
            <div class="box">
              <h3>Order Info</h3>
              Area: ${order.area || 'N/A'}<br/>
              Payment Status: ${order.payment_status}<br/>
              Channel: ${order.channel || 'Direct'}
            </div>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th style="text-align: right">Qty</th>
              </tr>
            </thead>
            <tbody>
              ${(order.items || []).map(item => `
                <tr>
                  <td>${dbStore.getProducts(businessId).find(p => p.id === item.product_id)?.name || 'Unknown'}</td>
                  <td style="text-align: right"><strong>${item.qty}</strong></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="totals">
            Total Value: <strong>₹${order.total_amount.toLocaleString()}</strong>
          </div>
          
          <div style="margin-top: 4rem; text-align: center; font-size: 0.875rem; color: #64748b;">
            ___________________________<br/><br/>
            Receiver Signature
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  return (
    <div className="space-y-4 max-w-full pb-8 px-0 font-sans text-slate-900 dark:text-slate-100 overflow-x-hidden" id="delivery-module-root">
      <PageHeader
        title="Delivery & Dispatch Operations"
        subtitle="Manage orders that are ready for dispatch and track delivery fulfillment."
        icon={Truck}
        action={
          <button
            onClick={() => setShowTodayModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition-all active:scale-95"
          >
            <Clock className="w-4 h-4" />
            <span className="text-sm">Today's Deliveries</span>
          </button>
        }
      />

      <div className="px-0.5 sm:px-1 space-y-4">
        {/* Toggle View */}
        <div className="flex gap-4 sm:gap-6 border-b border-slate-200 dark:border-slate-800 mb-4 px-2 overflow-x-auto custom-scrollbar">
          <button
            onClick={() => setActiveView('PackingCompleted')}
            className={`pb-3 font-bold text-sm transition-colors relative flex items-center gap-2 whitespace-nowrap ${
              activeView === 'PackingCompleted'
                ? 'text-orange-600 dark:text-orange-400'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <span>Packing Completed</span>
            {packingCompletedCount > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] font-black rounded-full bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800">
                {packingCompletedCount}
              </span>
            )}
            {activeView === 'PackingCompleted' && (
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-orange-600 dark:bg-orange-400 rounded-t-full" />
            )}
          </button>

          <button
            onClick={() => setActiveView('ReadyToDispatch')}
            className={`pb-3 font-bold text-sm transition-colors relative flex items-center gap-2 whitespace-nowrap ${
              activeView === 'ReadyToDispatch'
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <span>Ready to Dispatch</span>
            {readyCount > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] font-black rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                {readyCount}
              </span>
            )}
            {activeView === 'ReadyToDispatch' && (
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-emerald-600 dark:text-emerald-400 rounded-t-full" />
            )}
          </button>

          <button
            onClick={() => setActiveView('InTransit')}
            className={`pb-3 font-bold text-sm transition-colors relative flex items-center gap-2 whitespace-nowrap ${
              activeView === 'InTransit'
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <span>In Transit</span>
            {transitCount > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] font-black rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                {transitCount}
              </span>
            )}
            {activeView === 'InTransit' && (
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 dark:bg-blue-400 rounded-t-full" />
            )}
          </button>

          <button
            onClick={() => setActiveView('Delivered')}
            className={`pb-3 font-bold text-sm transition-colors relative flex items-center gap-2 whitespace-nowrap ${
              activeView === 'Delivered'
                ? 'text-teal-600 dark:text-teal-400'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <span>Delivered</span>
            {deliveredCount > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] font-black rounded-full bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                {deliveredCount}
              </span>
            )}
            {activeView === 'Delivered' && (
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-teal-600 dark:bg-teal-400 rounded-t-full" />
            )}
          </button>

          <button
            onClick={() => setActiveView('Returned')}
            className={`pb-3 font-bold text-sm transition-colors relative flex items-center gap-2 whitespace-nowrap ${
              activeView === 'Returned'
                ? 'text-rose-600 dark:text-rose-400'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <span>Returned</span>
            {returnedCount > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] font-black rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                {returnedCount}
              </span>
            )}
            {activeView === 'Returned' && (
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-rose-600 dark:bg-rose-400 rounded-t-full" />
            )}
          </button>

          <button
            onClick={() => setActiveView('Operations')}
            className={`pb-3 font-bold text-sm transition-colors relative flex items-center gap-2 whitespace-nowrap ${
              activeView === 'Operations'
                ? 'text-indigo-600 dark:text-indigo-400'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <span>Dispatch Operations</span>
            {activeView === 'Operations' && (
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-t-full" />
            )}
          </button>

          <button
            onClick={() => setActiveView('Reports')}
            className={`pb-3 font-bold text-sm transition-colors relative whitespace-nowrap ${
              activeView === 'Reports'
                ? 'text-violet-600 dark:text-violet-400'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            Fulfillment Reports
            {activeView === 'Reports' && (
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-violet-600 dark:bg-violet-400 rounded-t-full" />
            )}
          </button>
        </div>

        {activeView === 'Reports' ? (
          <DeliveryReports businessId={businessId} />
        ) : (
          <>
            {activeView === 'Operations' && (
              <>
                {/* Advanced Metrics Cards (Matched to SalesModule) */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-2">

        <div 
          onClick={() => setActiveFilter('Overdue')}
          className={`bg-white dark:bg-slate-900 border p-2 sm:p-3 rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between gap-1 ${
            activeFilter === 'Overdue' ? 'border-rose-500 ring-2 ring-rose-500/20' : 'border-slate-200/80 dark:border-slate-800 hover:border-rose-400 dark:hover:border-rose-600'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <div className="p-1.5 bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 rounded-lg group-hover:scale-110 transition-transform shrink-0">
              <AlertTriangle size={14} />
            </div>
            <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">OVERDUE</span>
          </div>
          <div className="text-right mt-1">
            <span className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
              {overdueCount}
            </span>
          </div>
        </div>

        <div 
          onClick={() => setActiveFilter('Pending Delivery')}
          className={`bg-white dark:bg-slate-900 border p-2 sm:p-3 rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between gap-1 ${
            activeFilter === 'Pending Delivery' ? 'border-amber-500 ring-2 ring-amber-500/20' : 'border-slate-200/80 dark:border-slate-800 hover:border-amber-400 dark:hover:border-amber-600'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <div className="p-1.5 bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-lg group-hover:scale-110 transition-transform shrink-0">
              <Clock size={14} />
            </div>
            <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">PENDING DELIVERY</span>
          </div>
          <div className="text-right mt-1">
            <span className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
              {pendingCount}
            </span>
          </div>
        </div>

        <div 
          onClick={() => setActiveFilter('In Transit')}
          className={`bg-white dark:bg-slate-900 border p-2 sm:p-3 rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between gap-1 ${
            activeFilter === 'In Transit' ? 'border-indigo-500 ring-2 ring-indigo-500/20' : 'border-slate-200/80 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <div className="p-1.5 bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-lg group-hover:scale-110 transition-transform shrink-0">
              <Truck size={14} />
            </div>
            <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">IN TRANSIT</span>
          </div>
          <div className="text-right mt-1">
            <span className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
              {transitCount}
            </span>
          </div>
        </div>

        <div 
          onClick={() => setActiveFilter('Delivered')}
          className={`bg-white dark:bg-slate-900 border p-2 sm:p-3 rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between gap-1 ${
            activeFilter === 'Delivered' ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-slate-200/80 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-600'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <div className="p-1.5 bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-lg group-hover:scale-110 transition-transform shrink-0">
              <CheckCircle2 size={14} />
            </div>
            <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">DELIVERED</span>
          </div>
          <div className="text-right mt-1">
            <span className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
              {deliveredCount}
            </span>
          </div>
        </div>

        <div 
          onClick={() => setActiveFilter('All')}
          className={`bg-white dark:bg-slate-900 border p-2 sm:p-3 rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between gap-1 border-slate-200/80 dark:border-slate-800 hover:border-rose-400 dark:hover:border-rose-600`}
        >
          <div className="flex items-center gap-1.5">
            <div className="p-1.5 bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 rounded-lg group-hover:scale-110 transition-transform shrink-0">
              <IndianRupee size={14} />
            </div>
            <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">COD PENDING</span>
          </div>
          <div className="text-right mt-1">
            <span className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
              ₹{codPendingAmount.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
      </>
      )}

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        <div className="flex flex-col gap-2 w-full">
          {/* Date Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1 sm:pb-0">
            {dateTabs.map((tab) => {
              const isSelected = dateFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setDateFilter(tab.id);
                    setCustomDate('');
                  }}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-black transition-all whitespace-nowrap cursor-pointer border flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs ring-1 ring-emerald-600/30'
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <span>{tab.label}</span>
                  {tab.count !== undefined && tab.count !== null && tab.count > 0 && (
                    <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-black ${
                      isSelected 
                        ? 'bg-white/25 text-white' 
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}

            {/* Custom Date Select Option */}
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black border transition-all shrink-0 ${
              dateFilter === 'Custom' && customDate
                ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 text-emerald-800 dark:text-emerald-300 ring-2 ring-emerald-500/20'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
            }`}>
              <Calendar size={13} className={dateFilter === 'Custom' && customDate ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'} />
              <label htmlFor="delivery-custom-date" className="text-[10px] font-black uppercase tracking-wider cursor-pointer whitespace-nowrap">
                {dateFilter === 'Custom' && customDate ? 'Custom:' : 'Custom Date:'}
              </label>
              <input
                id="delivery-custom-date"
                type="date"
                value={customDate}
                onChange={(e) => {
                  const val = e.target.value;
                  setCustomDate(val);
                  if (val) {
                    setDateFilter('Custom');
                  } else {
                    setDateFilter('All');
                  }
                }}
                className="bg-transparent text-[11px] font-bold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
              />
              {customDate && (
                <button
                  type="button"
                  onClick={() => {
                    setCustomDate('');
                    setDateFilter('All');
                  }}
                  className="p-0.5 text-slate-400 hover:text-rose-500 rounded-full cursor-pointer transition-colors"
                  title="Clear custom date"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>
          
          {/* Status Filter Tabs */}
          {activeView === 'Operations' && (
            <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1 sm:pb-0">
              {[
                { id: 'All', label: 'All Orders' },
                { id: 'Pending Delivery', label: `Pending Delivery (${pendingCount})` },
                { id: 'Ready to Dispatch', label: `Ready to Dispatch (${readyCount})` },
                { id: 'In Transit', label: `In Transit (${transitCount})` },
                { id: 'Delivered', label: `Delivered (${deliveredCount})` },
                { id: 'Returned', label: `Returned (${returnedCount})` },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveFilter(tab.id as any)}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-black transition-all whitespace-nowrap cursor-pointer border ${
                    activeFilter === tab.id
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}

        </div>
        <div className="flex items-center gap-3 w-full lg:w-auto">
          <div className="flex items-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-0.5 shadow-xs">
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
              title="List View"
            >
              <LayoutList size={16} />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
              title="Grid View"
            >
              <Grid3X3 size={16} />
            </button>
          </div>
          <div className="flex-1 max-w-md flex items-center bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-full px-3 py-1.5 shadow-xs focus-within:ring-2 focus-within:ring-indigo-500 transition-shadow">
          <Search size={15} className="text-slate-400 mr-2 shrink-0" />
          <input 
            type="text" 
            placeholder="Search orders by number or customer..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-[11px] sm:text-xs outline-hidden text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
              <X size={14} />
            </button>
          )}
        </div>
        </div>
      </div>

      {/* DELIVERY PARTNER & DISPATCH MODAL POPUP */}
      {dispatchingOrder && (() => {
        const targetCust = customers.find(c => c.id === dispatchingOrder.customer_id);
        const packedList = orders.filter(o => o.status === 'Packed');

        return (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-3xl p-5 sm:p-6 space-y-4 my-auto relative">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3.5">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl flex items-center justify-center bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 shrink-0">
                    <Truck size={22} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-black text-slate-900 dark:text-white">Delivery Partner & Dispatch</h3>
                      <span className="px-2.5 py-0.5 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 text-xs font-extrabold rounded-lg">
                        #{dispatchingOrder.order_number}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Customer: <strong className="text-slate-800 dark:text-slate-200">{targetCust?.name || 'Customer'}</strong> • Total: <strong className="text-emerald-600 dark:text-emerald-400">₹{dispatchingOrder.total_amount.toLocaleString()}</strong>
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setDispatchingOrder(null);
                    setPersonName('');
                    setPersonPhone('');
                    setTrackingNumber('');
                  }}
                  className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={(e) => handleCompleteDispatchAssignment(dispatchingOrder, e)} className="space-y-4">
                {/* Select Delivery Mode */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                      SELECT DELIVERY MODE
                    </label>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {[
                      { id: 'Rapido', label: 'Rapido', desc: 'BIKE EXPRESS' },
                      { id: 'Dunzo / Swiggy', label: 'Dunzo / Swiggy', desc: 'HYPERLOCAL' },
                      { id: 'Porter', label: 'Porter', desc: 'LOCAL DRIVER' },
                      { id: 'Courier Logistics', label: 'Courier', desc: 'BLUEDART/DELHIVERY' },
                      { id: 'In-House Agent', label: 'In-House', desc: 'COMPANY DRIVER' },
                      { id: 'Customer Pickup', label: 'Self Pickup', desc: 'STORE COUNTER' }
                    ].map((mode) => (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() => setDeliveryPartner(mode.id)}
                        className={`p-3.5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer min-h-[76px] ${
                          deliveryPartner === mode.id
                            ? 'bg-gradient-to-br from-indigo-600 to-indigo-700 border-indigo-700 text-white shadow-md shadow-indigo-600/20 scale-[1.02]'
                            : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        <strong className="text-xs font-black block">{mode.label}</strong>
                        <span className={`text-[9.5px] font-bold uppercase tracking-wider mt-1.5 ${deliveryPartner === mode.id ? 'text-indigo-200' : 'text-slate-500'}`}>
                          {mode.desc}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tracking / Driver Details */}
                <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800">
                  {(deliveryPartner === 'In-House Agent' || deliveryPartner === 'Customer Pickup') ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                          <User size={12} className="text-slate-400" /> {deliveryPartner === 'Customer Pickup' ? 'Collector / Person Name' : 'Driver / Exec Name'}
                        </label>
                        <input 
                          type="text" 
                          placeholder={deliveryPartner === 'Customer Pickup' ? 'e.g. Customer Name' : 'e.g. Rahul Sharma'}
                          value={personName}
                          onChange={(e) => setPersonName(e.target.value)}
                          className="w-full px-3 py-2 bg-white dark:bg-slate-900 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all placeholder:font-normal placeholder:text-slate-400"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                          <Phone size={12} className="text-slate-400" /> Contact Mobile Number (10 Digits)
                        </label>
                        <input 
                          type="tel" 
                          maxLength={10}
                          placeholder="e.g. 9876543210"
                          value={personPhone}
                          onChange={(e) => setPersonPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                          className="w-full px-3 py-2 bg-white dark:bg-slate-900 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all placeholder:font-normal placeholder:text-slate-400"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                        <Navigation size={12} className="text-slate-400" /> TRACKING / WAYBILL NUMBER
                      </label>
                      <input 
                        type="text" 
                        placeholder="e.g. TRK-99214"
                        value={trackingNumber}
                        onChange={(e) => setTrackingNumber(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all placeholder:font-normal placeholder:text-slate-400"
                      />
                    </div>
                  )}
                </div>

                {/* Footer Buttons */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setDispatchingOrder(null);
                      setPersonName('');
                      setPersonPhone('');
                      setTrackingNumber('');
                    }}
                    className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black shadow-md shadow-emerald-600/20 flex items-center gap-2 cursor-pointer transition-all active:scale-95"
                  >
                    <Sparkles size={15} />
                    <span>Ready to Dispatch & Assign</span>
                    <span className="bg-emerald-700/50 px-2 py-0.5 rounded text-[10px]">{deliveryPartner}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {viewMode === 'grid' ? (
        <div className="mt-4 space-y-8">
          {groupedOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 py-12 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 border-dashed">
              <Package size={32} className="mb-3 opacity-30" />
              <p className="font-bold text-sm">
                {activeView === 'PackingCompleted'
                  ? 'No packed orders awaiting storage rack assignment.'
                  : activeView === 'ReadyToDispatch'
                  ? 'No orders currently ready to dispatch.'
                  : activeView === 'InTransit'
                  ? 'No orders currently in transit / out for delivery.'
                  : activeView === 'Delivered'
                  ? 'No delivered orders found.'
                  : activeView === 'Returned'
                  ? 'No returned orders found.'
                  : `No active deliveries found for filter "${activeFilter}".`}
              </p>
              <p className="text-xs mt-1">
                {activeView === 'PackingCompleted'
                  ? 'Orders packed at the packing station will appear here to assign rack location.'
                  : activeView === 'ReadyToDispatch'
                  ? 'Orders with rack assigned from Packing Completed will appear here ready to assign delivery partners.'
                  : activeView === 'InTransit'
                  ? 'Orders dispatched with delivery partners will appear here out for delivery.'
                  : activeView === 'Delivered'
                  ? 'Orders successfully fulfilled and delivered will appear here.'
                  : activeView === 'Returned'
                  ? 'Orders returned or cancelled during delivery will appear here for return processing.'
                  : 'Orders in the delivery pipeline will appear here.'}
              </p>
            </div>
          ) : (
            groupedOrders.map(([date, dateOrders]) => (
              <div key={date} className="space-y-3">
                <div className="flex items-center gap-3">
                  <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest">{getRelativeDateLabel(date)}</h3>
                  <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800"></div>
                  <span className="text-[10px] font-black bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 py-1 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700">
                    {dateOrders.length} ORDER{dateOrders.length > 1 ? 'S' : ''}
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {dateOrders.map((o) => {
                    const cust = customers.find(c => c.id === o.customer_id);
                    const isCOD = o.payment_status !== 'Paid';
                    const todayStart = new Date();
                    todayStart.setHours(0, 0, 0, 0);
                    const isOverdue = o.delivery_date && new Date(o.delivery_date) < todayStart && o.status !== 'Delivered' && o.status !== 'Returned';
                    
                    return (
                      <div key={o.id} className={`bg-white dark:bg-slate-900 rounded-2xl border ${isOverdue ? 'border-rose-300 dark:border-rose-900 shadow-rose-500/10' : 'border-slate-200 dark:border-slate-800'} shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow`}>
                        {/* Header */}
                        <div className={`px-4 py-3 border-b ${isOverdue ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-100 dark:border-rose-900/50' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800'} flex items-center justify-between`}>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">{o.order_number}</span>
                            {isOverdue && (
                              <span className="text-[9px] font-black text-rose-700 dark:text-rose-400 bg-rose-200/50 dark:bg-rose-900/50 px-1.5 py-0.5 rounded flex items-center gap-1">
                                <AlertTriangle size={10} /> OVERDUE
                              </span>
                            )}
                          </div>
                          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-lg border uppercase tracking-wider ${
                            o.status === 'Dispatched' ? 'bg-blue-100 border-blue-200 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800' :
                            o.status === 'Delivered' ? 'bg-emerald-100 border-emerald-200 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800' :
                            o.status === 'Packed' ? (o.ready_for_dispatch ? 'bg-emerald-100 border-emerald-200 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800' : 'bg-yellow-100 border-yellow-200 text-yellow-700 dark:bg-yellow-950/60 dark:text-yellow-300 dark:border-yellow-800') :
                            o.status === 'Returned' ? 'bg-rose-100 border-rose-200 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800' :
                            'bg-slate-100 border-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                          }`}>
                            {o.status === 'Packed' ? (o.ready_for_dispatch ? 'Ready to Dispatch' : 'Packing Completed') : o.status === 'Dispatched' ? 'In Transit' : o.status}
                          </span>
                        </div>
                        
                        {/* Body */}
                        <div className="p-4 space-y-4 flex-1">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate pr-2 max-w-[180px]">
                                {cust?.name || 'Walk-in Customer'}
                              </p>
                              <div className="flex items-center gap-1 text-[10px] text-slate-500 mt-1">
                                <MapPin size={10} className="text-emerald-500" />
                                <span className="font-medium truncate max-w-[150px]">{o.area || 'Unknown Zone'}</span>
                              </div>
                            </div>
                            <button onClick={() => openDetailModal(o)} className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-indigo-500 transition-colors" title="View Details">
                              <Eye size={16} />
                            </button>
                          </div>
                          
                          {/* Storage / Partner Info */}
                          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 border border-slate-100 dark:border-slate-700/50 grid grid-cols-2 gap-2">
                            <div>
                              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                                {o.delivery_partner ? 'Partner' : 'Location'}
                              </span>
                              <span className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5 truncate">
                                {o.delivery_partner ? (
                                  <>
                                    <Truck size={12} className="text-indigo-500 shrink-0" />
                                    <span className="truncate">{o.delivery_partner}</span>
                                  </>
                                ) : (
                                  <>
                                    <LayoutGrid size={12} className="text-emerald-500 shrink-0" />
                                    <span className="truncate">{o.rack_location || '-'}</span>
                                  </>
                                )}
                              </span>
                            </div>
                            <div>
                              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                                {o.delivery_person_name || o.tracking_number ? 'Rider / Track' : 'Packages'}
                              </span>
                              <span className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5 truncate">
                                {o.delivery_person_name || o.tracking_number ? (
                                  <span className="truncate">{o.delivery_person_name || o.tracking_number}</span>
                                ) : (
                                  <>
                                    <Package size={12} className="text-indigo-500 shrink-0" />
                                    <span>{o.total_bags || 1} Bag{o.total_bags !== 1 ? 's' : ''}</span>
                                  </>
                                )}
                              </span>
                            </div>
                          </div>
                          {/* Return details banner if returned */}
                          {o.status === 'Returned' && (
                            <div className={`p-2.5 rounded-xl text-[10px] font-bold border ${
                              o.return_type === 'Damage' 
                                ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/60 text-rose-900 dark:text-rose-200' 
                                : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200'
                            }`}>
                              <div className="flex items-center justify-between font-black mb-1">
                                <span className="flex items-center gap-1.5">
                                  {o.return_type === 'Damage' ? (
                                    <AlertOctagon size={13} className="text-rose-600 dark:text-rose-400" />
                                  ) : (
                                    <RotateCcw size={13} className="text-amber-600 dark:text-amber-400" />
                                  )}
                                  <span>{o.return_type === 'Damage' ? 'Damaged in Transit' : 'Customer Refund'}</span>
                                </span>
                                <span className={`text-[9px] px-1.5 py-0.5 rounded font-black ${
                                  o.inventory_restocked 
                                    ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300' 
                                    : 'bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-300'
                                }`}>
                                  {o.inventory_restocked ? '✓ Restocked' : '✗ Scrap (No Restock)'}
                                </span>
                              </div>
                              {o.return_reason && (
                                <p className="text-[10px] opacity-90 truncate">
                                  <span className="font-semibold">Reason:</span> {o.return_reason}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                        
                        {/* Footer */}
                        <div className="px-4 py-3 bg-slate-50/50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800/50 space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-lg font-black text-slate-900 dark:text-white tracking-tight">₹{o.total_amount.toLocaleString()}</span>
                            <span className={`text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider ${isCOD ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'}`}>
                              {isCOD ? 'COD PENDING' : 'PREPAID'}
                            </span>
                          </div>
                          
                          <div className="flex gap-2">
                            {activeView !== 'InTransit' && (
                              <button
                                onClick={() => handlePrintNote(o)}
                                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-[10px] font-bold transition-colors cursor-pointer"
                              >
                                <Printer size={12} /> Print
                              </button>
                            )}
                            
                            {activeView === 'PackingCompleted' ? (
                              <button
                                onClick={() => openStorageRackModal(o)}
                                className="flex-[2] flex items-center justify-center gap-1.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg text-[10px] font-black transition-all shadow-xs active:scale-95 cursor-pointer whitespace-nowrap"
                              >
                                <PackageCheck size={12} /> Ready for Delivery
                              </button>
                            ) : activeView === 'ReadyToDispatch' ? (
                              <button
                                onClick={() => {
                                  setDispatchingOrder(o);
                                  setDeliveryPartner(o.delivery_partner || 'Rapido');
                                  setPersonName(o.delivery_person_name || '');
                                  setPersonPhone(o.delivery_person_phone || '');
                                  setTrackingNumber(o.tracking_number || '');
                                }}
                                className="flex-[2] flex items-center justify-center gap-1.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg text-[10px] font-black transition-all shadow-xs active:scale-95 cursor-pointer whitespace-nowrap"
                              >
                                <Sparkles size={12} /> Assign & Dispatch
                              </button>
                            ) : activeView === 'InTransit' ? (
                              <div className="w-full flex gap-1.5">
                                <button
                                  onClick={() => openDeliveryModal(o)}
                                  className="flex-[2.5] flex items-center justify-center gap-1.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg text-[10px] font-black transition-all shadow-xs active:scale-95 cursor-pointer whitespace-nowrap"
                                  title="Mark Delivery & Record COD"
                                >
                                  <CheckCircle2 size={12} /> Mark Delivery
                                </button>
                                <button
                                  onClick={() => openReturnModal(o, 'Refund')}
                                  className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:hover:bg-amber-900/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded-lg text-[10px] font-black transition-all cursor-pointer whitespace-nowrap"
                                  title="Refund (Restock to Inventory)"
                                >
                                  <RotateCcw size={11} /> Refund
                                </button>
                                <button
                                  onClick={() => openReturnModal(o, 'Damage')}
                                  className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-lg text-[10px] font-black transition-all cursor-pointer whitespace-nowrap"
                                  title="Damage (Do NOT Restock to Inventory)"
                                >
                                  <AlertOctagon size={11} /> Damage
                                </button>
                              </div>
                            ) : activeView === 'Delivered' ? (
                              <button
                                onClick={() => openDetailModal(o)}
                                className="flex-[2] flex items-center justify-center gap-1.5 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-lg text-[10px] font-black transition-all cursor-pointer"
                              >
                                <CheckCircle2 size={12} /> Fulfilled
                              </button>
                            ) : activeView === 'Returned' ? (
                              <button
                                onClick={() => handleUpdateStatus(o, 'Packed')}
                                className="flex-[2] flex items-center justify-center gap-1.5 py-1.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white rounded-lg text-[10px] font-black transition-all shadow-xs active:scale-95 cursor-pointer whitespace-nowrap"
                              >
                                <RotateCcw size={12} /> Re-dispatch
                              </button>
                            ) : (
                              <>
                                {o.status === 'Packed' && (
                                  <button
                                    onClick={() => handleModalAction(o)}
                                    className="flex-[2] flex items-center justify-center gap-1.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-bold transition-colors shadow-sm cursor-pointer"
                                  >
                                    <Truck size={12} /> Dispatch
                                  </button>
                                )}
                                
                                {o.status === 'Dispatched' && (
                                  <button
                                    onClick={() => handleModalAction(o)}
                                    className="flex-[2] flex items-center justify-center gap-1.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold transition-colors shadow-sm cursor-pointer"
                                  >
                                    <CheckCircle2 size={12} /> Mark Delivered
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
      <div className="bg-white dark:bg-slate-900 overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm mt-3">
        <table className="w-full text-left text-[11px]">
          <thead className="bg-slate-800 dark:bg-slate-800 text-white font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
            <tr>
              <th className="py-2.5 px-3">Order ID</th>
              <th className="py-2.5 px-3">Date / Delivery</th>
              <th className="py-2.5 px-3">Customer</th>
              <th className="py-2.5 px-3">Contact</th>
              {activeView !== 'PackingCompleted' && <th className="py-2.5 px-3">Area Zone</th>}
              {(activeView === 'PackingCompleted' || activeView === 'ReadyToDispatch' || activeView === 'Operations') && (
                <th className="py-2.5 px-3">Storage Rack</th>
              )}
              {(activeView === 'InTransit' || activeView === 'Delivered' || activeView === 'Returned' || activeView === 'Operations') && (
                <th className="py-2.5 px-3">Delivery Partner</th>
              )}
              <th className="py-2.5 px-3">Amount</th>
              <th className="py-2.5 px-3">Status</th>
              <th className="py-2.5 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
            {groupedOrders.length === 0 ? (
              <tr>
                <td colSpan={activeView === 'Operations' ? 10 : activeView === 'PackingCompleted' ? 8 : 9} className="py-8 text-center">
                  <div className="flex flex-col items-center justify-center text-slate-500 dark:text-slate-400">
                    <Package size={24} className="mb-2 opacity-50" />
                    <p className="font-bold text-xs">
                      {activeView === 'PackingCompleted' 
                        ? 'No packed orders awaiting storage rack assignment.' 
                        : activeView === 'ReadyToDispatch'
                        ? 'No orders currently ready to dispatch.'
                        : activeView === 'InTransit'
                        ? 'No orders currently in transit / out for delivery.'
                        : activeView === 'Delivered'
                        ? 'No delivered orders found.'
                        : activeView === 'Returned'
                        ? 'No returned orders found.'
                        : `No active deliveries found for filter "${activeFilter}".`}
                    </p>
                    <p className="text-[10px]">
                      {activeView === 'PackingCompleted' 
                        ? 'Orders packed at the packing station will appear here to assign rack location.' 
                        : activeView === 'ReadyToDispatch'
                        ? 'Orders with rack assigned from Packing Completed will appear here ready to assign delivery partners.'
                        : activeView === 'InTransit'
                        ? 'Orders dispatched with delivery partners will appear here out for delivery.'
                        : activeView === 'Delivered'
                        ? 'Orders successfully fulfilled and delivered will appear here.'
                        : activeView === 'Returned'
                        ? 'Orders returned or cancelled during delivery will appear here for return processing.'
                        : 'Orders in the delivery pipeline will appear here.'}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              groupedOrders.map(([date, dateOrders]) => (
                <React.Fragment key={date}>
                  <tr className="bg-slate-100 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-700/50">
                    <td colSpan={activeView === 'Operations' ? 10 : activeView === 'PackingCompleted' ? 8 : 9} className="py-2.5 px-4 font-bold text-slate-700 dark:text-slate-300 text-xs">
                      {getRelativeDateLabel(date)}
                      <span className="ml-2 text-[10px] font-medium bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 py-0.5 px-2 rounded-full border border-slate-200 dark:border-slate-700">
                        {dateOrders.length} order{dateOrders.length > 1 ? 's' : ''}
                      </span>
                    </td>
                  </tr>
                  {dateOrders.map((o) => {
                const cust = customers.find(c => c.id === o.customer_id);
                const isCOD = o.payment_status !== 'Paid';
                const unpaidBalance = Math.max(0, o.total_amount - (o.paid_amount || 0));
                const todayStart = new Date();
                todayStart.setHours(0, 0, 0, 0);
                const isOverdue = o.delivery_date && new Date(o.delivery_date) < todayStart && o.status !== 'Delivered' && o.status !== 'Returned';
                
                return (
                  <tr key={o.id} className={`transition-colors ${isOverdue ? 'bg-rose-50/70 hover:bg-rose-100/70 dark:bg-rose-950/20 dark:hover:bg-rose-900/30' : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/40'}`}>
                    <td className="py-2.5 px-3 font-black text-slate-900 dark:text-white">
                      <button 
                        onClick={() => openDetailModal(o)}
                        className="hover:text-indigo-500 cursor-pointer text-left transition-colors flex items-center gap-1.5"
                      >
                        <Eye size={12} className="text-indigo-400" />
                        {o.order_number}
                      </button>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex flex-col">
                        <span className="text-slate-800 dark:text-slate-200 font-semibold text-[10px]">
                          {o.order_date || new Date(o.created_at).toLocaleDateString()}
                        </span>
                        {o.delivery_date && (
                          <span className="text-indigo-600 dark:text-indigo-400 font-bold mt-0.5 text-[9px]">Del: {o.delivery_date}</span>
                        )}
                      </div>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800 dark:text-slate-200">{cust?.name || 'Walk-in Customer'}</span>
                        <span className="text-[9px] text-slate-500 truncate max-w-[150px]">{cust?.shipping_address || 'No address'}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3">
                      {cust?.phone ? (
                        <div className="flex gap-1.5">
                          <a href={`tel:${cust.phone}`} className="p-1 bg-sky-50 dark:bg-sky-900/20 text-sky-600 rounded hover:bg-sky-100 transition-colors" title="Call">
                            <Phone size={12} />
                          </a>
                          <a href={`https://wa.me/${formatWhatsAppPhone(cust.phone)}`} target="_blank" rel="noreferrer" className="p-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded hover:bg-emerald-100 transition-colors" title="WhatsApp">
                            <MessageCircle size={12} />
                          </a>
                          <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((cust?.shipping_address || '') + ' ' + (cust?.area || ''))}`} target="_blank" rel="noreferrer" className="p-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded hover:bg-slate-200 transition-colors" title="Maps">
                            <Navigation size={12} />
                          </a>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[10px]">No phone</span>
                      )}
                    </td>
                    {activeView !== 'PackingCompleted' && (
                      <td className="py-2.5 px-3 font-bold text-slate-700 dark:text-slate-300">
                        {o.area || 'Unknown'}
                      </td>
                    )}
                    {(activeView === 'PackingCompleted' || activeView === 'ReadyToDispatch' || activeView === 'Operations') && (
                      <td className="py-2.5 px-3">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200 uppercase">
                            {o.rack_location ? o.rack_location : '-'}
                          </span>
                          {o.rack_section && <span className="text-[9px] text-slate-500">Sec: {o.rack_section}</span>}
                          {o.total_bags ? <span className="text-[9px] text-indigo-500 font-bold">{o.total_bags} Bags</span> : null}
                        </div>
                      </td>
                    )}
                    {(activeView === 'InTransit' || activeView === 'Delivered' || activeView === 'Returned' || activeView === 'Operations') && (
                      <td className="py-2.5 px-3">
                        {o.delivery_partner ? (
                          <div className="flex flex-col">
                            <span className="font-bold text-indigo-600 dark:text-indigo-400 text-[10px]">{o.delivery_partner}</span>
                            {(o.delivery_person_name || o.tracking_number) && (
                              <span className="text-[9px] text-slate-500 truncate max-w-[120px]">
                                {o.delivery_person_name || o.tracking_number}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[10px]">Not assigned</span>
                        )}
                        {(o.rack_location || o.rack_section) && activeView === 'Operations' && (
                          <div className="mt-1 flex items-center gap-1 text-[9px] font-bold text-amber-700 bg-amber-100 dark:bg-amber-900/30 px-1.5 py-0.5 rounded-md inline-flex w-fit">
                            <LayoutGrid size={10} />
                            {[o.rack_location, o.rack_section].filter(Boolean).join(' • ')}
                          </div>
                        )}
                      </td>
                    )}
                    <td className="py-2.5 px-3">
                      <div className="flex flex-col">
                        <span className="font-black text-slate-900 dark:text-white">₹{o.total_amount.toLocaleString()}</span>
                        {isCOD ? (
                          <span className="text-[9px] font-bold text-rose-600 flex items-center gap-0.5"><AlertTriangle size={8} /> COD (₹{unpaidBalance})</span>
                        ) : (
                          <span className="text-[9px] font-bold text-emerald-600">Prepaid</span>
                        )}
                      </div>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                        o.status === 'Delivered' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/80 dark:text-emerald-300' :
                        o.status === 'Returned' ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/80 dark:text-rose-300' :
                        o.status === 'Dispatched' ? 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/80 dark:text-indigo-300' :
                        'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/80 dark:text-amber-300'
                      }`}>
                        {o.status === 'Packed' ? (o.ready_for_dispatch ? 'Ready to Dispatch' : 'Packing Completed') : o.status === 'Dispatched' ? 'In Transit' : o.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right flex justify-end gap-1.5 items-center h-full">
                      {activeView !== 'InTransit' && (
                        <button
                          onClick={() => handlePrintNote(o)}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 dark:bg-slate-800 dark:hover:bg-indigo-900/30 rounded transition-colors border border-slate-200 dark:border-slate-700 cursor-pointer"
                          title="Print Dispatch Note"
                        >
                          <Printer size={12} />
                        </button>
                      )}

                      {activeView === 'PackingCompleted' ? (
                        <button 
                          onClick={() => openStorageRackModal(o)}
                          className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg font-black text-[10px] transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 whitespace-nowrap"
                          title="Edit Rack Storage Information"
                        >
                          <PackageCheck size={12} /> Ready for Delivery
                        </button>
                      ) : activeView === 'ReadyToDispatch' ? (
                        <div className="flex gap-1.5 items-center">
                          <button 
                            onClick={() => openStorageRackModal(o)}
                            className="p-1.5 text-slate-500 hover:text-emerald-600 bg-slate-50 hover:bg-emerald-50 dark:bg-slate-800 dark:hover:bg-emerald-900/30 rounded transition-colors border border-slate-200 dark:border-slate-700 cursor-pointer"
                            title="Edit Storage Rack Location"
                          >
                            <LayoutGrid size={12} />
                          </button>
                          <button 
                            onClick={() => {
                              setDispatchingOrder(o);
                              setDeliveryPartner(o.delivery_partner || 'Rapido');
                              setPersonName(o.delivery_person_name || '');
                              setPersonPhone(o.delivery_person_phone || '');
                              setTrackingNumber(o.tracking_number || '');
                            }}
                            className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg font-black text-[10px] transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 whitespace-nowrap"
                          >
                            <Sparkles size={12} /> Assign & Dispatch
                          </button>
                        </div>
                      ) : activeView === 'InTransit' ? (
                        <div className="flex gap-1.5 items-center">
                          <button 
                            onClick={() => {
                              setDispatchingOrder(o);
                              setDeliveryPartner(o.delivery_partner || 'Rapido');
                              setPersonName(o.delivery_person_name || '');
                              setPersonPhone(o.delivery_person_phone || '');
                              setTrackingNumber(o.tracking_number || '');
                            }}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 dark:bg-slate-800 dark:hover:bg-indigo-900/30 rounded transition-colors border border-slate-200 dark:border-slate-700 cursor-pointer"
                            title="Edit Delivery Partner & Rider Info"
                          >
                            <Truck size={12} />
                          </button>
                          <button 
                            onClick={() => openDeliveryModal(o)}
                            className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg font-black text-[10px] transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 whitespace-nowrap"
                            title="Mark Delivery & Record COD Details"
                          >
                            <CheckCircle2 size={12} /> Mark Delivery
                          </button>
                          <button 
                            onClick={() => openReturnModal(o, 'Refund')}
                            className="px-2 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:hover:bg-amber-900/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded-lg text-[10px] font-black transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap"
                            title="Refund (Restock to Inventory)"
                          >
                            <RotateCcw size={11} /> Refund
                          </button>
                          <button 
                            onClick={() => openReturnModal(o, 'Damage')}
                            className="px-2 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-lg text-[10px] font-black transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap"
                            title="Damage (Do NOT Restock to Inventory)"
                          >
                            <AlertOctagon size={11} /> Damage
                          </button>
                        </div>
                      ) : activeView === 'Delivered' ? (
                        <div className="flex gap-1.5 items-center">
                          <button 
                            onClick={() => openDetailModal(o)}
                            className="px-2.5 py-1 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 rounded-lg text-[10px] font-bold transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <Eye size={11} /> Details
                          </button>
                          <span className="px-2 py-0.5 rounded-md text-[9px] font-black bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 inline-flex items-center gap-1">
                            <CheckCircle2 size={10} /> Fulfilled
                          </span>
                        </div>
                      ) : activeView === 'Returned' ? (
                        <div className="flex gap-1.5 items-center">
                          <div className="flex flex-col text-left mr-1">
                            <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded ${
                              o.return_type === 'Damage' 
                                ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300' 
                                : 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300'
                            }`}>
                              {o.return_type === 'Damage' ? '⚠️ Damaged (Scrap)' : '🔄 Refund (Restocked)'}
                            </span>
                            {o.return_reason && (
                              <span className="text-[8px] text-slate-500 truncate max-w-[120px]" title={o.return_reason}>
                                {o.return_reason}
                              </span>
                            )}
                          </div>
                          <button 
                            onClick={() => openDetailModal(o)}
                            className="p-1.5 text-slate-500 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 rounded transition-colors border border-slate-200 dark:border-slate-700 cursor-pointer"
                            title="View Details"
                          >
                            <Eye size={12} />
                          </button>
                          <button 
                            onClick={() => handleUpdateStatus(o, 'Packed')}
                            className="px-3 py-1.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white rounded-lg font-black text-[10px] transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 whitespace-nowrap"
                            title="Return to Packed state for re-dispatch"
                          >
                            <RotateCcw size={12} /> Re-dispatch
                          </button>
                        </div>
                      ) : (
                        <>
                          {/* Quick Pipeline Status Updater (Moved from Sales Module) */}
                          <select
                            value={o.status}
                            onChange={(e) => handleUpdateStatus(o, e.target.value as any)}
                            className="text-[10px] font-bold py-1 px-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg cursor-pointer focus:outline-none focus:ring-1 focus:ring-amber-500"
                            title="Quick Update Pipeline Status"
                          >
                            <option value="Pending">Pending</option>
                            <option value="Packing">Packing</option>
                            <option value="Packed">Ready</option>
                            <option value="Dispatched">Out for Delivery</option>
                            <option value="Delivered">Completed</option>
                            <option value="Returned">Returned</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>

                          {o.status === 'Packed' && (
                            <button 
                              onClick={() => {
                                setDispatchingOrder(o);
                                setDeliveryPartner(o.delivery_partner || 'Rapido');
                                setPersonName(o.delivery_person_name || '');
                                setPersonPhone(o.delivery_person_phone || '');
                                setTrackingNumber(o.tracking_number || '');
                              }}
                              className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg font-black text-[10px] transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 whitespace-nowrap"
                            >
                              <Sparkles size={12} /> Assign & Dispatch
                            </button>
                          )}
                          
                          {o.status === 'Dispatched' && (
                            <div className="flex gap-1 items-center">
                              <button 
                                onClick={() => handleUpdateStatus(o, 'Delivered')}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-black text-[10px] transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 whitespace-nowrap"
                              >
                                <CheckCircle2 size={12} /> Deliver
                              </button>
                            </div>
                          )}
                          
                          {o.status === 'Delivered' && (
                            <div className="flex gap-1">
                              <div className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 rounded font-bold text-[10px] flex items-center gap-1 border border-slate-200 dark:border-slate-700">
                                <CheckCircle2 size={12} /> Done
                              </div>
                              <button 
                                onClick={() => {
                                  if (window.confirm("Mark as Returned? Product will be added back to inventory.")) {
                                    performStatusUpdate(o, 'Returned');
                                  }
                                }}
                                className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded border border-rose-200 dark:border-rose-800 cursor-pointer"
                                title="Return Order"
                              >
                                <RotateCcw size={12} />
                              </button>
                            </div>
                          )}
                          
                          {o.status === 'Returned' && (
                            <div className="px-2.5 py-1.5 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded font-bold text-[10px] flex items-center gap-1 border border-rose-200 dark:border-rose-800">
                              <RotateCcw size={12} /> Returned
                            </div>
                          )}
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
              </React.Fragment>
            )))}
          </tbody>
        </table>
      </div>
      )}

      {/* Mark Delivery Modal */}
      {confirmingOrder && (
        <div className="fixed inset-0 z-[100] bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in duration-200 flex flex-col overflow-hidden my-6">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center shrink-0">
                  <CheckCircle2 size={22} />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                    Mark Order Delivered
                  </h3>
                  <p className="text-[11px] text-slate-500 font-bold">
                    Order #{confirmingOrder.order_number} • {customers.find(c => c.id === confirmingOrder.customer_id)?.name || 'Customer'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setConfirmingOrder(null);
                  setSelectedPaymentMode(null);
                }}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleProcessDelivery} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* Order & Delivery Summary Card */}
              <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl p-3.5 border border-slate-200/70 dark:border-slate-700/60 space-y-2">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Customer & Phone</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 truncate block">
                      {customers.find(c => c.id === confirmingOrder.customer_id)?.name || 'Customer'}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {customers.find(c => c.id === confirmingOrder.customer_id)?.phone || 'No phone'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Delivery Rider / Partner</span>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400 truncate block">
                      {confirmingOrder.delivery_partner || 'Direct Staff'}
                    </span>
                    <span className="text-[10px] text-slate-500 truncate block">
                      {confirmingOrder.delivery_person_name || confirmingOrder.tracking_number || 'Self Delivery'}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60 flex items-start gap-1.5 text-[11px] text-slate-600 dark:text-slate-400">
                  <MapPin size={13} className="text-emerald-500 shrink-0 mt-0.5" />
                  <span className="line-clamp-2">
                    {confirmingOrder.shipping_address || customers.find(c => c.id === confirmingOrder.customer_id)?.address || confirmingOrder.area || 'Address not specified'}
                  </span>
                </div>
              </div>

              {/* COD & Payment Information Section */}
              {(() => {
                const unpaid = Math.max(0, confirmingOrder.total_amount - (confirmingOrder.paid_amount || 0));
                const isCOD = unpaid > 0 && confirmingOrder.payment_status !== 'Paid';

                if (!isCOD) {
                  return (
                    <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/70 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-emerald-200/60 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold">
                          ₹
                        </div>
                        <div>
                          <span className="text-xs font-black text-emerald-900 dark:text-emerald-200 block">
                            Prepaid Order (Fully Paid)
                          </span>
                          <span className="text-[11px] text-emerald-700 dark:text-emerald-400">
                            Total: ₹{confirmingOrder.total_amount.toLocaleString()} ({confirmingOrder.payment_mode || 'Paid Online'})
                          </span>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 bg-emerald-200/70 dark:bg-emerald-900/70 text-emerald-900 dark:text-emerald-200 text-[10px] font-black rounded-lg uppercase tracking-wider">
                        No Cash to Collect
                      </span>
                    </div>
                  );
                }

                return (
                  <div className="space-y-3 p-4 bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-2xl">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Receipt size={18} className="text-amber-600 dark:text-amber-400" />
                        <div>
                          <span className="text-xs font-black text-amber-900 dark:text-amber-200 uppercase tracking-wide block">
                            Cash On Delivery (COD) Collection
                          </span>
                          <span className="text-[10px] text-amber-700 dark:text-amber-400">
                            Amount to collect from customer upon handover
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-black text-amber-900 dark:text-amber-100 block">
                          ₹{unpaid.toLocaleString()}
                        </span>
                        <span className="text-[9px] font-bold text-amber-700 dark:text-amber-400 uppercase">
                          Balance Due
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                        Select Collected Payment Mode <span className="text-rose-500">*</span>
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { id: 'Cash', label: 'Cash', icon: Banknote, color: 'text-emerald-600' },
                          { id: 'UPI', label: 'UPI / QR Code', icon: QrCode, color: 'text-purple-600' },
                          { id: 'Card', label: 'Card / POS', icon: CreditCard, color: 'text-indigo-600' },
                          { id: 'Net Banking', label: 'Bank Transfer', icon: Building2, color: 'text-blue-600' },
                        ].map((mode) => {
                          const Icon = mode.icon;
                          const isSelected = selectedPaymentMode === mode.id;
                          return (
                            <button
                              key={mode.id}
                              type="button"
                              onClick={() => setSelectedPaymentMode(mode.id as any)}
                              className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-900 dark:text-emerald-200 ring-2 ring-emerald-500/30 font-bold'
                                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-50 text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-emerald-200/50 dark:bg-emerald-900/50' : 'bg-slate-100 dark:bg-slate-700'}`}>
                                <Icon size={15} className={mode.color} />
                              </div>
                              <span className="text-xs font-black flex-1">{mode.label}</span>
                              {isSelected && <Check size={14} className="text-emerald-600 shrink-0" />}
                            </button>
                          );
                        })}
                      </div>

                      {/* Payment Ref field */}
                      {selectedPaymentMode && selectedPaymentMode !== 'Cash' && (
                        <div className="mt-2.5">
                          <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                            Transaction / UPI Ref Number (Optional)
                          </label>
                          <input
                            type="text"
                            value={codPaymentRef}
                            onChange={(e) => setCodPaymentRef(e.target.value)}
                            placeholder="e.g. UPI Ref #402910482012 or POS Auth Code"
                            className="w-full text-xs font-semibold px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Handover & Delivery Details */}
              <div className="space-y-3 pt-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      Received Handover By
                    </label>
                    <select
                      value={deliveryReceivedBy}
                      onChange={(e) => setDeliveryReceivedBy(e.target.value)}
                      className="w-full text-xs font-bold px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                    >
                      <option value="Customer">Customer In-Person</option>
                      <option value="Family Member">Family Member</option>
                      <option value="Security / Guard">Security Guard / Gate</option>
                      <option value="Reception / Office">Reception / Front Desk</option>
                      <option value="Neighbor">Neighbor</option>
                      <option value="Other">Other Contact</option>
                    </select>
                  </div>

                  {deliveryReceivedBy !== 'Customer' && (
                    <div>
                      <label className="block text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                        Receiver's Name / Details
                      </label>
                      <input
                        type="text"
                        value={deliveryReceivedByName}
                        onChange={(e) => setDeliveryReceivedByName(e.target.value)}
                        placeholder="e.g. Brother (Rahul) / Gate 2 Guard"
                        className="w-full text-xs font-semibold px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Delivery Notes / Remarks (Optional)
                  </label>
                  <input
                    type="text"
                    value={deliveryProofNotes}
                    onChange={(e) => setDeliveryProofNotes(e.target.value)}
                    placeholder="e.g. Left with reception with OTP confirmation"
                    className="w-full text-xs font-semibold px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setConfirmingOrder(null);
                    setSelectedPaymentMode(null);
                  }}
                  className="cursor-pointer py-2.5 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="cursor-pointer py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all shadow-md shadow-emerald-500/20 active:scale-95 flex items-center justify-center gap-2"
                >
                  <CheckCircle2 size={16} /> Confirm Delivery
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Return & Damage Processing Modal */}
      {returnModalOrder && (
        <div className="fixed inset-0 z-[100] bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in duration-200 flex flex-col overflow-hidden my-6">
            {/* Header */}
            <div className={`p-4 border-b flex justify-between items-center ${
              returnType === 'Damage' 
                ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-100 dark:border-rose-900/50' 
                : 'bg-amber-50 dark:bg-amber-950/40 border-amber-100 dark:border-amber-900/50'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  returnType === 'Damage'
                    ? 'bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-300'
                    : 'bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-300'
                }`}>
                  {returnType === 'Damage' ? <AlertOctagon size={22} /> : <RotateCcw size={22} />}
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    {returnType === 'Damage' ? 'Record Transit Damage' : 'Process Order Return / Refund'}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-bold">
                    Order #{returnModalOrder.order_number} • ₹{returnModalOrder.total_amount.toLocaleString()}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setReturnModalOrder(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleProcessReturn} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* Type Switcher Tabs */}
              <div>
                <label className="block text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
                  Select Return Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setReturnType('Refund');
                      setReturnReason('Customer Cancelled at Doorstep');
                    }}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      returnType === 'Refund'
                        ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-500 text-amber-900 dark:text-amber-200 ring-2 ring-amber-500/30'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center justify-between font-black text-xs mb-1">
                      <span className="flex items-center gap-1.5">
                        <RotateCcw size={14} className="text-amber-600" /> Customer Refund
                      </span>
                      {returnType === 'Refund' && <Check size={14} className="text-amber-600" />}
                    </div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block leading-tight">
                      Order returned in good condition.
                    </span>
                    <span className="inline-block mt-2 text-[9px] font-black px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300">
                      ✓ Product Added back to Inventory
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setReturnType('Damage');
                      setReturnReason('Broken / Smashed in Transit');
                    }}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      returnType === 'Damage'
                        ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-500 text-rose-900 dark:text-rose-200 ring-2 ring-rose-500/30'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center justify-between font-black text-xs mb-1">
                      <span className="flex items-center gap-1.5">
                        <AlertOctagon size={14} className="text-rose-600" /> Damaged in Transit
                      </span>
                      {returnType === 'Damage' && <Check size={14} className="text-rose-600" />}
                    </div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block leading-tight">
                      Item broken / damaged / unusable.
                    </span>
                    <span className="inline-block mt-2 text-[9px] font-black px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300">
                      ✗ NOT Added to Inventory (Scrap)
                    </span>
                  </button>
                </div>
              </div>

              {/* Reason Dropdown based on return type */}
              <div>
                <label className="block text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  {returnType === 'Damage' ? 'Damage Reason' : 'Refund / Return Reason'} <span className="text-rose-500">*</span>
                </label>
                <select
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  className="w-full text-xs font-bold px-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
                >
                  <option value="">-- Select a reason --</option>
                  {(returnType === 'Damage' ? DAMAGE_REASONS : REFUND_REASONS).map((reason) => (
                    <option key={reason} value={reason}>
                      {reason}
                    </option>
                  ))}
                </select>
              </div>

              {/* If damage, select courier responsible */}
              {returnType === 'Damage' && (
                <div>
                  <label className="block text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Responsible Logistics / Courier Partner
                  </label>
                  <select
                    value={damageCourierResponsible}
                    onChange={(e) => setDamageCourierResponsible(e.target.value)}
                    className="w-full text-xs font-semibold px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500 cursor-pointer"
                  >
                    <option value="Rapido">Rapido</option>
                    <option value="Porter">Porter</option>
                    <option value="In-House Agent">In-House Rider</option>
                    <option value="BlueDart">BlueDart</option>
                    <option value="Delhivery">Delhivery</option>
                    <option value="Dunzo">Dunzo</option>
                    <option value="Shadowfax">Shadowfax</option>
                    <option value="Customer Handling">Customer Handling</option>
                    <option value="Warehouse Handling">Warehouse Packaging</option>
                  </select>
                </div>
              )}

              {/* Return Notes */}
              <div>
                <label className="block text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Detailed Notes / Remarks
                </label>
                <textarea
                  rows={2}
                  value={returnNotes}
                  onChange={(e) => setReturnNotes(e.target.value)}
                  placeholder={
                    returnType === 'Damage'
                      ? 'Describe package condition, damage details, photos taken, etc.'
                      : 'Customer explanation, condition of items, reason for refund'
                  }
                  className="w-full text-xs font-semibold p-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Summary notice banner */}
              <div className={`p-3 rounded-xl border text-xs font-medium ${
                returnType === 'Damage'
                  ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900 text-rose-900 dark:text-rose-300'
                  : 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900 text-emerald-900 dark:text-emerald-300'
              }`}>
                {returnType === 'Damage' ? (
                  <p className="flex items-start gap-2">
                    <ShieldAlert size={16} className="text-rose-600 shrink-0 mt-0.5" />
                    <span>
                      <strong>Inventory Policy:</strong> Because this is marked as <strong>Damaged</strong>, the goods will <strong>NOT</strong> be added back to sellable inventory. It will be recorded as scrap write-off.
                    </span>
                  </p>
                ) : (
                  <p className="flex items-start gap-2">
                    <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                    <span>
                      <strong>Inventory Policy:</strong> Because this is a standard <strong>Refund / Customer Return</strong> in good condition, items will be <strong>automatically restocked</strong> back into inventory.
                    </span>
                  </p>
                )}
              </div>

              {/* Modal Actions */}
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setReturnModalOrder(null)}
                  className="cursor-pointer py-2.5 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`cursor-pointer py-2.5 px-4 text-white rounded-xl text-xs font-black transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 ${
                    returnType === 'Damage'
                      ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-500/20'
                      : 'bg-amber-600 hover:bg-amber-700 shadow-amber-500/20'
                  }`}
                >
                  {returnType === 'Damage' ? <AlertOctagon size={16} /> : <RotateCcw size={16} />}
                  Confirm {returnType}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

            {/* Today's Delivery Summary Modal - Auto triggered */}
      <TodayDeliveryModal 
        isOpen={showTodayModal}
        onClose={() => setShowTodayModal(false)}
        businessId={businessId}
        orders={orders}
        customers={customers}
        onAction={handleModalAction}
      />

      {/* Order Details Modal */}
      {detailOrder && (
        <div className="fixed inset-0 z-[100] bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-xl shadow-xl border border-slate-200 dark:border-slate-800 animate-in zoom-in duration-200 flex flex-col overflow-hidden max-h-[90vh]">
            <div className="flex justify-between items-center p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
              <div>
                <h3 className="font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Package size={16} className="text-indigo-500" /> Invoice Details
                </h3>
                <p className="text-[10px] text-slate-500 font-bold mt-0.5 uppercase tracking-wider">
                  {detailOrder.order_number}
                </p>
              </div>
              <button onClick={() => setDetailOrder(null)} className="cursor-pointer text-slate-400 hover:text-slate-600 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-full transition-colors">
                <X size={16} />
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto custom-scrollbar flex-1 space-y-4">
              {/* Top Meta */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Date</span>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{detailOrder.order_date || (new Date(detailOrder.created_at).toLocaleDateString())}</span>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Customer</span>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate block" title={detailOrder.customer_name || 'Walk-in'}>
                    {detailOrder.customer_name || 'Walk-in'}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Status</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 inline-block">
                    {detailOrder.status}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Payment</span>
                  <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                    ₹{(detailOrder.total_amount || 0).toLocaleString()}
                  </span>
                  <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ml-1 ${detailOrder.payment_status === 'Paid' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'}`}>
                    {detailOrder.payment_status}
                  </span>
                </div>
              </div>

              {/* Edit Store Location Form */}
              <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                <div className="bg-slate-100 dark:bg-slate-800 px-3 py-2 flex items-center justify-between">
                  <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                    <LayoutGrid size={13} className="text-amber-500" />
                    Store Location (Rack)
                  </h4>
                  {!isEditingStorage ? (
                    <button onClick={() => setIsEditingStorage(true)} className="text-[10px] font-bold bg-white dark:bg-slate-900 px-2 py-1 rounded shadow-2xs border border-slate-200 dark:border-slate-700 text-indigo-600 dark:text-indigo-400 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800">
                      Edit/Update
                    </button>
                  ) : (
                    <button onClick={saveStorageInfo} className="text-[10px] font-bold bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1 rounded shadow-2xs cursor-pointer">
                      Save Location
                    </button>
                  )}
                </div>
                
                {isEditingStorage ? (
                  <div className="p-3 bg-white dark:bg-slate-900 grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Rack Location</label>
                      <input 
                        type="text" 
                        value={editRackLocation} 
                        onChange={e => setEditRackLocation(e.target.value)} 
                        className="w-full text-xs p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                        placeholder="e.g. Rack A"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Section/Shelf</label>
                      <input 
                        type="text" 
                        value={editRackSection} 
                        onChange={e => setEditRackSection(e.target.value)} 
                        className="w-full text-xs p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                        placeholder="e.g. Shelf 2"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Total Bags</label>
                      <input 
                        type="number" 
                        value={editTotalBags} 
                        onChange={e => setEditTotalBags(Number(e.target.value))} 
                        className="w-full text-xs p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                        min="1"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-white dark:bg-slate-900 flex flex-wrap items-center gap-4 text-xs font-bold text-slate-700 dark:text-slate-300">
                    <div>Rack: <span className="text-slate-900 dark:text-white font-black">{detailOrder.rack_location || '-'}</span></div>
                    <div>Section: <span className="text-slate-900 dark:text-white font-black">{detailOrder.rack_section || '-'}</span></div>
                    <div>Bags: <span className="text-slate-900 dark:text-white font-black text-indigo-600 dark:text-indigo-400">{detailOrder.total_bags || 1}</span></div>
                  </div>
                )}
              </div>

              {/* Items List */}
              <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 text-[10px] font-black uppercase tracking-widest text-slate-500">
                    <tr>
                      <th className="px-3 py-2 border-b border-slate-100 dark:border-slate-700">Item</th>
                      <th className="px-3 py-2 border-b border-slate-100 dark:border-slate-700 text-right">Qty</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs">
                    {(detailOrder.items || []).map((item, idx) => (
                      <tr key={idx} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="px-3 py-2.5 font-bold text-slate-800 dark:text-slate-200">
                          {dbStore.getProducts(businessId).find(p => p.id === item.product_id)?.name || 'Unknown'}
                        </td>
                        <td className="px-3 py-2.5 text-right font-black text-indigo-600 dark:text-indigo-400">
                          {item.qty}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setDetailOrder(null)}
                className="cursor-pointer py-2 px-6 bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 dark:hover:bg-slate-600 text-white rounded-xl text-xs font-bold transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Storage Rack & Move to Dispatch Operation Modal */}
      {storageModalOrder && (
        <div className="fixed inset-0 z-[100] bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-xl">
                  <LayoutGrid size={18} />
                </div>
                <div>
                  <h3 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    Edit Rack Storage Information
                  </h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                    Order #{storageModalOrder.order_number}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setStorageModalOrder(null)} 
                className="cursor-pointer text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-full transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Form Content */}
            <form onSubmit={handleSaveStorageAndMoveToDispatch} className="p-5 space-y-4">
              {/* Order Details Brief Banner */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/60 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Customer</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 truncate block">
                    {customers.find(c => c.id === storageModalOrder.customer_id)?.name || storageModalOrder.customer_name || 'Walk-in'}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Delivery Date</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {storageModalOrder.delivery_date || storageModalOrder.order_date || 'Standard'}
                  </span>
                </div>
              </div>

              {/* Rack Storage Inputs */}
              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Rack Location <span className="text-amber-500">*</span>
                  </label>
                  <input 
                    type="text" 
                    value={storageRackLocation} 
                    onChange={(e) => setStorageRackLocation(e.target.value)} 
                    placeholder="e.g. Rack A, Shelf 3, Bay 1, Cold Storage" 
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all placeholder:font-normal placeholder:text-slate-400"
                    required
                  />
                  {/* Quick Suggestions */}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {['Rack A', 'Rack B', 'Rack C', 'Rack D', 'Cold Storage', 'Dispatch Bay'].map(r => (
                      <button
                        type="button"
                        key={r}
                        onClick={() => setStorageRackLocation(r)}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border transition-colors cursor-pointer ${
                          storageRackLocation === r 
                            ? 'bg-amber-100 dark:bg-amber-950/60 border-amber-400 text-amber-800 dark:text-amber-200' 
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      Section / Shelf
                    </label>
                    <input 
                      type="text" 
                      value={storageRackSection} 
                      onChange={(e) => setStorageRackSection(e.target.value)} 
                      placeholder="e.g. Shelf 2, Tier B" 
                      className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all placeholder:font-normal placeholder:text-slate-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      Total Bags / Packages <span className="text-amber-500">*</span>
                    </label>
                    <input 
                      type="number" 
                      min={1}
                      value={storageTotalBags} 
                      onChange={(e) => setStorageTotalBags(Math.max(1, parseInt(e.target.value) || 1))} 
                      className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Informative helper */}
              <div className="p-2.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/40 rounded-xl text-[11px] text-amber-900 dark:text-amber-300">
                Saving rack storage coordinates marks this order as ready and transfers it directly into <strong>Dispatch Operations</strong>.
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setStorageModalOrder(null)}
                  className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl shadow-md shadow-emerald-600/20 flex items-center gap-2 cursor-pointer transition-all active:scale-95"
                >
                  <Truck size={14} />
                  <span>Save & Move to Dispatch Operation</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
</>
        )}
      </div>
    </div>
  );
};
