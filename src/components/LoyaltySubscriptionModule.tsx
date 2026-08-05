import React, { useState, useEffect } from 'react';
import { PageHeader } from './PageHeader';
import { dbStore } from '../services/store';
import { 
  Customer, 
  LoyaltyConfig, 
  LoyaltyLog, 
  CustomerSubscription, 
  SubscriptionFrequency, 
  SubscriptionStatus,
  Product,
  UserProfile,
  SalesItem
} from '../types/erp';
import { 
  Award, 
  RefreshCw, 
  Calendar, 
  Plus, 
  Search, 
  Sparkles, 
  Gift, 
  Settings, 
  Users, 
  TrendingUp, 
  PauseCircle, 
  PlayCircle, 
  XCircle, 
  Send, 
  CheckCircle2, 
  History, 
  ShieldCheck, 
  DollarSign, 
  ChevronRight,
  UserPlus,
  Trash2,
  Edit,
  Package,
  Layers,
  PhoneCall,
  Clock,
  AlertTriangle
} from 'lucide-react';

interface LoyaltySubscriptionModuleProps {
  businessId: string;
  user: UserProfile;
  triggerToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  initialTab?: 'loyalty' | 'subscriptions';
}

export const LoyaltySubscriptionModule: React.FC<LoyaltySubscriptionModuleProps> = ({
  businessId,
  user,
  triggerToast,
  initialTab = 'loyalty'
}) => {
  const [activeTab, setActiveTab] = useState<'loyalty' | 'subscriptions'>(initialTab);
  const [syncTick, setSyncTick] = useState(0);

  // Search & Filter States
  const [loyaltySearch, setLoyaltySearch] = useState('');
  const [tierFilter, setTierFilter] = useState<string>('ALL');

  const [subSearch, setSubSearch] = useState('');
  const [subStatusFilter, setSubStatusFilter] = useState<string>('ALL');

  // Modals
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isAdjustPointsModalOpen, setIsAdjustPointsModalOpen] = useState(false);
  const [selectedCustomerForAdjust, setSelectedCustomerForAdjust] = useState<Customer | null>(null);
  const [adjustPointsValue, setAdjustPointsValue] = useState<number>(50);
  const [adjustType, setAdjustType] = useState<LoyaltyLog['type']>('Bonus');
  const [adjustNotes, setAdjustNotes] = useState('');

  const [isLedgerModalOpen, setIsLedgerModalOpen] = useState(false);
  const [selectedCustomerForLedger, setSelectedCustomerForLedger] = useState<Customer | null>(null);

  const [isBonusDispatchModalOpen, setIsBonusDispatchModalOpen] = useState(false);
  const [bonusEventName, setBonusEventName] = useState('Diwali Special Bonus');
  const [bonusPointsAmount, setBonusPointsAmount] = useState<number | string>(100);
  const [bonusTargetTier, setBonusTargetTier] = useState<string>('ALL');

  // Loyalty Membership Modal
  const [isMembershipModalOpen, setIsMembershipModalOpen] = useState(false);
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [enrollSearchQuery, setEnrollSearchQuery] = useState('');
  const [isManualEnroll, setIsManualEnroll] = useState(false);
  const [manualName, setManualName] = useState('');
  const [manualPhone, setManualPhone] = useState('');
  const [selectedCustomerForMembership, setSelectedCustomerForMembership] = useState<Customer | null>(null);
  const [membershipStartDate, setMembershipStartDate] = useState('');
  const [membershipEndDate, setMembershipEndDate] = useState('');
  const [membershipAutoRenew, setMembershipAutoRenew] = useState(false);
  const [membershipIsActive, setMembershipIsActive] = useState(false);

  // Subscription Modal
  const [isNewSubModalOpen, setIsNewSubModalOpen] = useState(false);
  const [deletingSub, setDeletingSub] = useState<CustomerSubscription | null>(null);
  const [cancellingSub, setCancellingSub] = useState<CustomerSubscription | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [subPlanName, setSubPlanName] = useState('Weekly Faral & Sweets Box');
  const [subFrequency, setSubFrequency] = useState<SubscriptionFrequency>('Weekly');
  const [subNextBillingDate, setSubNextBillingDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [subDeliveryArea, setSubDeliveryArea] = useState('');
  const [subDeliveryAddress, setSubDeliveryAddress] = useState('');
  const [subNotes, setSubNotes] = useState('');
  const [subItems, setSubItems] = useState<SalesItem[]>([]);
  const [selectedProdForSub, setSelectedProdForSub] = useState('');
  const [selectedQtyForSub, setSelectedQtyForSub] = useState(1);

  // Loyalty Config form
  const [configForm, setConfigForm] = useState<{
    enabled: boolean;
    spend_per_point: number | string;
    point_value: number | string;
    silver_min_spend: number | string;
    gold_min_spend: number | string;
    platinum_min_spend: number | string;
    gold_multiplier: number | string;
    platinum_multiplier: number | string;
    welcome_bonus_points: number | string;
    birthday_bonus_points: number | string;
    point_expiry_days: number | string;
  }>({
    enabled: true,
    spend_per_point: 100,
    point_value: 1,
    silver_min_spend: 0,
    gold_min_spend: 10000,
    platinum_min_spend: 20000,
    gold_multiplier: 1.25,
    platinum_multiplier: 1.5,
    welcome_bonus_points: 50,
    birthday_bonus_points: 100,
    point_expiry_days: 365
  });

  useEffect(() => {
    const unsub = dbStore.subscribe(() => setSyncTick(t => t + 1));
    return unsub;
  }, []);

  const business = dbStore.getBusiness(businessId);
  const currencySymbol = business?.currency_symbol || '₹';

  const loyaltyConfig = dbStore.getLoyaltyConfig(businessId);
  const customers = dbStore.getCustomers(businessId);
  const products = dbStore.getProducts(businessId);
  const subscriptions = dbStore.getSubscriptions(businessId);
  const loyaltyLogs = dbStore.getLoyaltyLogs(undefined, businessId);

  useEffect(() => {
    if (loyaltyConfig && !isConfigModalOpen) {
      setConfigForm({ ...loyaltyConfig });
    }
  }, [syncTick, businessId, isConfigModalOpen]);

  const handleOpenConfigModal = () => {
    const cfg = dbStore.getLoyaltyConfig(businessId);
    if (cfg) {
      setConfigForm({ ...cfg });
    }
    setIsConfigModalOpen(true);
  };

  // Handle Loyalty Config Save
  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    const parseNum = (val: any, defaultVal: number, min: number = 0) => {
      const num = Number(val);
      if (isNaN(num) || val === '') return defaultVal;
      return Math.max(min, num);
    };

    const cleanConfig: LoyaltyConfig = {
      enabled: !!configForm.enabled,
      spend_per_point: parseNum(configForm.spend_per_point, 100, 1),
      point_value: parseNum(configForm.point_value, 1, 0.01),
      silver_min_spend: parseNum(configForm.silver_min_spend, 0, 0),
      gold_min_spend: parseNum(configForm.gold_min_spend, 10000, 0),
      platinum_min_spend: parseNum(configForm.platinum_min_spend, 20000, 0),
      gold_multiplier: parseNum(configForm.gold_multiplier, 1, 1),
      platinum_multiplier: parseNum(configForm.platinum_multiplier, 1.5, 1),
      welcome_bonus_points: parseNum(configForm.welcome_bonus_points, 50, 0),
      birthday_bonus_points: parseNum(configForm.birthday_bonus_points, 100, 0),
      point_expiry_days: parseNum(configForm.point_expiry_days, 365, 1)
    };

    dbStore.updateLoyaltyConfig(businessId, cleanConfig);
    dbStore.logActivity(
      user.id,
      user.name,
      user.role,
      'Update Loyalty Rules',
      `Updated loyalty program settings (1 pt per ₹${cleanConfig.spend_per_point})`,
      businessId
    );
    triggerToast('Loyalty program rules saved successfully.', 'success');
    setIsConfigModalOpen(false);
  };
  
  const addOneYear = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    d.setFullYear(d.getFullYear() + 1);
    return d.toISOString().split('T')[0];
  };

  const handleUpdateMembershipDates = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerForMembership) return;

    dbStore.updateCustomer(selectedCustomerForMembership.id, {
      loyalty_start_date: membershipIsActive ? membershipStartDate : null,
      loyalty_end_date: membershipIsActive ? membershipEndDate : null,
      loyalty_auto_renew: membershipIsActive ? membershipAutoRenew : false,
      is_loyal_member: membershipIsActive 
    });

    dbStore.logActivity(
      user.id,
      user.name,
      user.role,
      membershipIsActive ? 'Update Loyalty Membership' : 'Remove Loyalty Membership',
      membershipIsActive 
        ? `Updated membership dates for ${selectedCustomerForMembership.name} (End: ${membershipEndDate}, Auto-Renew: ${membershipAutoRenew})`
        : `Removed loyalty membership for ${selectedCustomerForMembership.name}`,
      businessId
    );

    triggerToast(`Membership for ${selectedCustomerForMembership.name} updated successfully.`, 'success');
    
    // Clear states and close
    setMembershipStartDate('');
    setMembershipEndDate('');
    setMembershipAutoRenew(false);
    setSelectedCustomerForMembership(null);
    setSyncTick(prev => prev + 1); 
    setIsMembershipModalOpen(false);
  };

  // Handle Manual Loyalty Adjust
  const handlePerformPointsAdjust = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerForAdjust) return;
    if (adjustPointsValue === 0) return;

    const pointsDelta = adjustType === 'Redeemed' ? -Math.abs(adjustPointsValue) : Math.abs(adjustPointsValue);

    dbStore.addLoyaltyPoints(
      selectedCustomerForAdjust.id,
      pointsDelta,
      adjustType,
      adjustNotes || `Manual points ${adjustType.toLowerCase()} by Admin`,
      businessId
    );

    dbStore.logActivity(
      user.id,
      user.name,
      user.role,
      'Loyalty Points Adjust',
      `${adjustType} ${adjustPointsValue} pts for customer ${selectedCustomerForAdjust.name}`,
      businessId
    );

    triggerToast(`Adjusted ${pointsDelta > 0 ? '+' : ''}${pointsDelta} points for ${selectedCustomerForAdjust.name}.`, 'success');
    setIsAdjustPointsModalOpen(false);
    setSelectedCustomerForAdjust(null);
    setAdjustNotes('');
  };

  // Handle Mass Bonus Dispatcher
  const handleDispatchMassBonus = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(bonusPointsAmount);
    if (isNaN(amount) || amount < 0) {
      triggerToast('Please enter a valid bonus points amount.', 'error');
      return;
    }

    let targetCustomers = customers;
    if (bonusTargetTier !== 'ALL') {
      targetCustomers = customers.filter(c => (c.loyalty_tier || 'Silver') === bonusTargetTier);
    }

    if (targetCustomers.length === 0) {
      triggerToast('No matching customers found for bonus dispatch.', 'error');
      return;
    }

    targetCustomers.forEach(c => {
      dbStore.addLoyaltyPoints(
        c.id,
        amount,
        'Bonus',
        `Mass Event Bonus: ${bonusEventName}`,
        businessId
      );
    });

    dbStore.logActivity(
      user.id,
      user.name,
      user.role,
      'Mass Bonus Loyalty',
      `Dispatched ${amount} bonus points to ${targetCustomers.length} customers (${bonusEventName})`,
      businessId
    );

    triggerToast(`Successfully credited ${amount} bonus points to ${targetCustomers.length} customers!`, 'success');
    setIsBonusDispatchModalOpen(false);
  };

  // Subscription Item Operations
  const handleAddSubItem = () => {
    if (!selectedProdForSub) return;
    const prod = products.find(p => p.id === selectedProdForSub);
    if (!prod) return;

    const existingIndex = subItems.findIndex(i => i.product_id === prod.id);
    if (existingIndex !== -1) {
      const updated = [...subItems];
      updated[existingIndex].qty += selectedQtyForSub;
      setSubItems(updated);
    } else {
      setSubItems([
        ...subItems,
        {
          product_id: prod.id,
          qty: selectedQtyForSub,
          scanned_qty: 0,
          selling_price: prod.selling_price,
          gst_rate: prod.gst_rate
        }
      ]);
    }
    setSelectedProdForSub('');
    setSelectedQtyForSub(1);
  };

  const handleRemoveSubItem = (index: number) => {
    setSubItems(subItems.filter((_, i) => i !== index));
  };

  const subTotalAmount = subItems.reduce((acc, i) => acc + (i.qty * i.selling_price), 0);

  // Handle Subscription Creation
  const handleCreateSubscription = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId) {
      triggerToast('Please select a customer for the subscription.', 'error');
      return;
    }
    if (subItems.length === 0) {
      triggerToast('Please add at least one item to the subscription plan.', 'error');
      return;
    }

    const cust = customers.find(c => c.id === selectedCustomerId);
    if (!cust) return;

    const created = dbStore.createSubscription({
      customer_id: cust.id,
      customer_name: cust.name,
      customer_phone: cust.phone,
      plan_name: subPlanName,
      frequency: subFrequency,
      status: 'Active',
      items: subItems,
      total_amount: subTotalAmount,
      delivery_area: subDeliveryArea || cust.area || 'Standard',
      delivery_address: subDeliveryAddress || cust.shipping_address || cust.billing_address || 'Customer Address',
      next_billing_date: subNextBillingDate,
      auto_renew: true,
      notes: subNotes,
      business_id: businessId
    });

    dbStore.logActivity(
      user.id,
      user.name,
      user.role,
      'Create Subscription',
      `Created subscription ${created.subscription_number} (${created.plan_name}) for ${cust.name}`,
      businessId
    );

    triggerToast(`Subscription ${created.subscription_number} created successfully!`, 'success');
    setIsNewSubModalOpen(false);
    // Reset form
    setSelectedCustomerId('');
    setSubItems([]);
    setSubNotes('');
  };

  // Handle Subscription Auto-Renewal Generation
  const handleGenerateDueSubscriptionOrders = () => {
    const result = dbStore.generateSubscriptionOrders(businessId);
    if (result.generatedCount === 0) {
      triggerToast('No active subscriptions are due for billing today.', 'info');
    } else {
      triggerToast(`Auto-generated ${result.generatedCount} new Sales Orders from due subscriptions!`, 'success');
      dbStore.logActivity(
        user.id,
        user.name,
        user.role,
        'Auto-Renew Subscriptions',
        `Generated ${result.generatedCount} sales orders for due subscriptions`,
        businessId
      );
    }
  };

  // Handle Renewal Reminder Trigger
  const handleSendRenewalAlert = (sub: CustomerSubscription) => {
    const alertMessage = `Hello ${sub.customer_name}! Your subscription "${sub.plan_name}" (${currencySymbol}${sub.total_amount}) renewal is scheduled on ${sub.next_billing_date}. Reply YES to confirm delivery.`;
    
    triggerToast(`Dispatching WhatsApp & SMS renewal notice to ${sub.customer_phone}...`, 'info');
    setTimeout(() => {
      triggerToast(`Renewal alert sent successfully to ${sub.customer_name}!`, 'success');
    }, 800);
  };

  // Filtered Lists
  const filteredCustomers = customers.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(loyaltySearch.toLowerCase()) ||
                          c.phone.includes(loyaltySearch) ||
                          (c.email && c.email.toLowerCase().includes(loyaltySearch.toLowerCase()));
    const tier = c.loyalty_tier || 'Silver';
    const matchesTier = tierFilter === 'ALL' || tier === tierFilter;
    return matchesSearch && matchesTier;
  });

  const filteredSubscriptions = subscriptions.filter(s => {
    const matchesSearch = s.customer_name.toLowerCase().includes(subSearch.toLowerCase()) ||
                          s.subscription_number.toLowerCase().includes(subSearch.toLowerCase()) ||
                          s.plan_name.toLowerCase().includes(subSearch.toLowerCase());
    const matchesStatus = subStatusFilter === 'ALL' || s.status === subStatusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calculate Loyalty Metrics
  const totalLoyaltyPointsBalance = customers.reduce((acc, c) => acc + (c.loyalty_points || 0), 0);
  const totalLifetimeCustomerSpend = customers.reduce((acc, c) => acc + (c.lifetime_spend || 0), 0);
  const goldPlatinumMembersCount = customers.filter(c => (c.loyalty_tier === 'Gold' || c.loyalty_tier === 'Platinum')).length;

  // Calculate Subscription Metrics
  const activeSubs = subscriptions.filter(s => s.status === 'Active');
  const todayStr = new Date().toISOString().split('T')[0];
  const dueSubsCount = activeSubs.filter(s => s.next_billing_date <= todayStr).length;
  const mrr = activeSubs.reduce((acc, s) => {
    if (s.frequency === 'Weekly') return acc + (s.total_amount * 4);
    if (s.frequency === 'Bi-Weekly') return acc + (s.total_amount * 2);
    if (s.frequency === 'Monthly') return acc + s.total_amount;
    if (s.frequency === 'Quarterly') return acc + (s.total_amount / 3);
    return acc + s.total_amount;
  }, 0);

  return (
    <div className="space-y-4 max-w-full pb-8 px-0 font-sans text-slate-900 dark:text-slate-100 overflow-x-hidden" id="loyalty-subscription-module-root">
      
      {/* Header Bar */}
      <PageHeader
        title="Loyalty & Recurring Subscriptions"
        subtitle="In-House Core Customer Retention Engine & Auto-Billing Pipeline"
        icon={Award}
      >
        <div className="flex items-center gap-1.5 p-1 bg-white/10 dark:bg-slate-900/60 backdrop-blur-md rounded-xl border border-white/20 w-full justify-end">
          <button
            onClick={() => setActiveTab('loyalty')}
            className={`px-3.5 py-1.5 rounded-lg text-[10px] sm:text-[11px] font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'loyalty'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-200 hover:text-white hover:bg-white/10'
            }`}
          >
            <Award size={14} />
            Loyalty Program
          </button>
          <button
            onClick={() => setActiveTab('subscriptions')}
            className={`px-3.5 py-1.5 rounded-lg text-[10px] sm:text-[11px] font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'subscriptions'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-200 hover:text-white hover:bg-white/10'
            }`}
          >
            <RefreshCw size={14} />
            Subscriptions
            {dueSubsCount > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] font-black bg-amber-500 text-white rounded-full">
                {dueSubsCount}
              </span>
            )}
          </button>
        </div>
      </PageHeader>

      {/* ========================================================================= */}
      {/* TAB 1: LOYALTY PROGRAM (3.12) */}
      {/* ========================================================================= */}
      {activeTab === 'loyalty' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* Executive Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                  Active Members
                </span>
                <strong className="text-2xl font-black text-slate-900 dark:text-white mt-0.5 block">
                  {customers.length}
                </strong>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 mt-1">
                  <ShieldCheck size={12} /> 100% In-House Profile Link
                </span>
              </div>
              <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl">
                <Users size={22} />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                  Points Reserve Balance
                </span>
                <strong className="text-2xl font-black text-slate-900 dark:text-white mt-0.5 block">
                  {totalLoyaltyPointsBalance.toLocaleString()} pts
                </strong>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Worth {currencySymbol}{(totalLoyaltyPointsBalance * (loyaltyConfig.point_value || 1)).toLocaleString()} discount
                </span>
              </div>
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-xl">
                <Sparkles size={22} />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                  VIP Tiers (Gold/Platinum)
                </span>
                <strong className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-0.5 block">
                  {goldPlatinumMembersCount} Members
                </strong>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Earn up to {loyaltyConfig.platinum_multiplier || 1.5}x Points Multiplier
                </span>
              </div>
              <div className="p-3 bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 rounded-xl">
                <Award size={22} />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                  Lifetime Spend Log
                </span>
                <strong className="text-2xl font-black text-slate-900 dark:text-white mt-0.5 block">
                  {currencySymbol}{totalLifetimeCustomerSpend.toLocaleString()}
                </strong>
                <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold mt-1 block">
                  1 Pt per {currencySymbol}{loyaltyConfig.spend_per_point || 100} Spent
                </span>
              </div>
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl">
                <TrendingUp size={22} />
              </div>
            </div>

          </div>

          {/* Action Toolbar */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            
            <div className="flex flex-1 items-center gap-3">
              <div className="relative flex-1 max-w-md">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search customer name, phone or profile email..."
                  value={loyaltySearch}
                  onChange={e => setLoyaltySearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <select
                value={tierFilter}
                onChange={e => setTierFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="ALL">All Tiers</option>
                <option value="Silver">Silver 🥈</option>
                <option value="Gold">Gold 🥇</option>
                <option value="Platinum">Platinum 💎</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsEnrollModalOpen(true)}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <UserPlus size={15} />
                Enroll Member
              </button>

              <button
                onClick={() => setIsBonusDispatchModalOpen(true)}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Gift size={15} />
                Distribute Mass Bonus
              </button>

              <button
                onClick={handleOpenConfigModal}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Settings size={15} />
                Configure Rules
              </button>


            </div>

          </div>

          {/* Customer Loyalty Directory Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">Customer Loyalty Accounts</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Showing {filteredCustomers.length} registered profiles
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Customer Profile</th>
                    <th className="py-3 px-4">Loyalty Tier</th>
                    <th className="py-3 px-4">Available Balance</th>
                    <th className="py-3 px-4">Lifetime Spend</th>
                    <th className="py-3 px-4">Membership Period</th>
                    <th className="py-3 px-4">Special Dates</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {filteredCustomers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        No customer profiles found matching search criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredCustomers.map(cust => {
                      const tier = cust.loyalty_tier || 'Silver';
                      const points = cust.loyalty_points || 0;
                      const lifetime = cust.lifetime_spend || 0;

                      return (
                        <tr key={cust.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                          
                          <td className="py-3.5 px-4 font-medium">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 font-bold flex items-center justify-center text-xs shrink-0">
                                {cust.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <strong className="text-slate-900 dark:text-white text-xs block font-bold">
                                  {cust.name}
                                </strong>
                                <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-mono">
                                  {cust.phone} &bull; {cust.area || 'Standard'}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            {tier === 'Platinum' && (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300 border border-purple-200 dark:border-purple-800 inline-flex items-center gap-1">
                                💎 Platinum (1.5x)
                              </span>
                            )}
                            {tier === 'Gold' && (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800 inline-flex items-center gap-1">
                                🥇 Gold (1.25x)
                              </span>
                            )}
                            {tier === 'Silver' && (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700 inline-flex items-center gap-1">
                                🥈 Silver (1.0x)
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-4">
                            <span className="font-extrabold text-slate-900 dark:text-white text-sm">
                              {points.toLocaleString()} pts
                            </span>
                            <span className="text-[10px] text-slate-400 block font-mono">
                              Worth {currencySymbol}{(points * (loyaltyConfig.point_value || 1)).toLocaleString()} off
                            </span>
                          </td>

                          <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                            {currencySymbol}{lifetime.toLocaleString()}
                          </td>

                          <td className="py-3.5 px-4">
                            {cust.loyalty_start_date ? (
                              <div className="space-y-1">
                                <div className="text-[10px] text-slate-500 flex items-center gap-1">
                                  <Calendar size={10} /> {cust.loyalty_start_date} to
                                </div>
                                <div className={`text-[11px] font-bold ${cust.loyalty_end_date && new Date(cust.loyalty_end_date) < new Date() ? 'text-rose-600' : 'text-indigo-600'}`}>
                                  {cust.loyalty_end_date || 'Ongoing'}
                                  {cust.loyalty_auto_renew && (
                                    <span className="ml-1 text-[9px] text-emerald-600 bg-emerald-50 px-1 rounded" title="Auto-Renew Active">
                                      ↻
                                    </span>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <span className="text-slate-400 text-[10px] italic">Not set</span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                            {cust.birthday ? (
                              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                                <Gift size={12} /> {cust.birthday}
                              </span>
                            ) : (
                              <span className="text-slate-400">Not provided</span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <div className="flex flex-wrap justify-end gap-2 py-1">
                              <button
                                onClick={() => {
                                  setSelectedCustomerForMembership(cust);
                                  setMembershipStartDate(cust.loyalty_start_date || new Date().toISOString().split('T')[0]);
                                  setMembershipEndDate(cust.loyalty_end_date || addOneYear(cust.loyalty_start_date || new Date().toISOString().split('T')[0]));
                                  setMembershipAutoRenew(!!cust.loyalty_auto_renew);
                                  setIsMembershipModalOpen(true);
                                }}
                                className="px-3 py-1.5 bg-slate-900 dark:bg-black text-white hover:bg-slate-800 dark:hover:bg-slate-900 rounded-lg text-[11px] font-bold transition cursor-pointer shadow-sm active:scale-95 flex items-center gap-1.5"
                                title="Manage Membership Validity"
                              >
                                <ShieldCheck size={12} className="text-indigo-400" />
                                Membership
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedCustomerForAdjust(cust);
                                  setIsAdjustPointsModalOpen(true);
                                }}
                                className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-lg text-[11px] font-bold transition cursor-pointer border border-indigo-100 dark:border-indigo-800"
                                title="Adjust Points Balance"
                              >
                                Points
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedCustomerForLedger(cust);
                                  setIsLedgerModalOpen(true);
                                }}
                                className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-[11px] font-bold transition cursor-pointer border border-slate-200 dark:border-slate-700"
                                title="View Loyalty Ledger"
                              >
                                History
                              </button>
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
      )}

      {/* ========================================================================= */}
      {/* TAB 2: SUBSCRIPTION MANAGEMENT (3.13) */}
      {/* ========================================================================= */}
      {activeTab === 'subscriptions' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* Subscription Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                  Active Subscriptions
                </span>
                <strong className="text-2xl font-black text-slate-900 dark:text-white mt-0.5 block">
                  {activeSubs.length} Plans
                </strong>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 mt-1">
                  <CheckCircle2 size={12} /> Auto-Renewing Recurring Customers
                </span>
              </div>
              <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl">
                <RefreshCw size={22} />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                  Monthly Recurring Revenue (MRR)
                </span>
                <strong className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                  {currencySymbol}{mrr.toLocaleString()}
                </strong>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Estimated recurring monthly billing
                </span>
              </div>
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl">
                <TrendingUp size={22} />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                  Due Billing Today
                </span>
                <strong className={`text-2xl font-black mt-0.5 block ${dueSubsCount > 0 ? 'text-amber-500' : 'text-slate-900 dark:text-white'}`}>
                  {dueSubsCount} Due Today
                </strong>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Click auto-generate to create sales orders
                </span>
              </div>
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-xl">
                <Clock size={22} />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                  Pipeline Integration
                </span>
                <strong className="text-2xl font-black text-slate-900 dark:text-white mt-0.5 block">
                  ERP Order Flow
                </strong>
                <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold mt-1 block">
                  Received &rarr; Packing &rarr; Dispatched
                </span>
              </div>
              <div className="p-3 bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 rounded-xl">
                <Package size={22} />
              </div>
            </div>

          </div>

          {/* Subscription Controls & Action Toolbar */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            
            <div className="flex flex-1 items-center gap-3">
              <div className="relative flex-1 max-w-md">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search plan, customer name or subscription #..."
                  value={subSearch}
                  onChange={e => setSubSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <select
                value={subStatusFilter}
                onChange={e => setSubStatusFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="ALL">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Paused">Paused</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleGenerateDueSubscriptionOrders}
                className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                title="Run background job to convert due subscriptions into Sales Orders"
              >
                <RefreshCw size={15} />
                Generate Due Orders
              </button>

              <button
                onClick={() => setIsNewSubModalOpen(true)}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Plus size={15} />
                New Subscription
              </button>
            </div>

          </div>

          {/* Subscriptions Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">Customer Subscriptions Directory</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Showing {filteredSubscriptions.length} subscriptions
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Subscription #</th>
                    <th className="py-3 px-4">Customer Details</th>
                    <th className="py-3 px-4">Plan & Frequency</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Next Billing Date</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {filteredSubscriptions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        No customer subscriptions found.
                      </td>
                    </tr>
                  ) : (
                    filteredSubscriptions.map(sub => {
                      const isDueToday = sub.status === 'Active' && sub.next_billing_date <= todayStr;

                      return (
                        <tr key={sub.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                          
                          <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white">
                            {sub.subscription_number}
                          </td>

                          <td className="py-3.5 px-4">
                            <strong className="text-slate-900 dark:text-white block font-bold">
                              {sub.customer_name}
                            </strong>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono block">
                              {sub.customer_phone} &bull; {sub.delivery_area}
                            </span>
                          </td>

                          <td className="py-3.5 px-4">
                            <strong className="text-indigo-600 dark:text-indigo-400 font-bold block">
                              {sub.plan_name}
                            </strong>
                            <span className="text-[11px] text-slate-500 font-medium">
                              Recurring {sub.frequency}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 font-extrabold text-slate-900 dark:text-white text-sm">
                            {currencySymbol}{sub.total_amount.toLocaleString()}
                          </td>

                          <td className="py-3.5 px-4">
                            {sub.status === 'Active' && (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                Active
                              </span>
                            )}
                            {sub.status === 'Paused' && (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                                Paused
                              </span>
                            )}
                            {sub.status === 'Cancelled' && (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                                Cancelled
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 font-mono text-xs">
                            <span className={isDueToday ? 'text-amber-600 dark:text-amber-400 font-extrabold flex items-center gap-1' : 'text-slate-700 dark:text-slate-300'}>
                              {isDueToday && <AlertTriangle size={13} />}
                              {sub.next_billing_date}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 text-right space-x-1">
                            {sub.status === 'Active' && (
                              <button
                                onClick={() => {
                                  dbStore.updateSubscription(sub.id, { status: 'Paused' });
                                  triggerToast(`Subscription ${sub.subscription_number} paused.`, 'info');
                                }}
                                className="p-1.5 bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/50 rounded-lg transition cursor-pointer"
                                title="Pause Subscription"
                              >
                                <PauseCircle size={15} />
                              </button>
                            )}

                            {sub.status === 'Paused' && (
                              <button
                                onClick={() => {
                                  dbStore.updateSubscription(sub.id, { status: 'Active' });
                                  triggerToast(`Subscription ${sub.subscription_number} resumed.`, 'success');
                                }}
                                className="p-1.5 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 rounded-lg transition cursor-pointer"
                                title="Resume Subscription"
                              >
                                <PlayCircle size={15} />
                              </button>
                            )}

                            {sub.status !== 'Cancelled' && (
                              <button
                                onClick={() => setCancellingSub(sub)}
                                className="p-1.5 bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/50 rounded-lg transition cursor-pointer"
                                title="Cancel Subscription"
                              >
                                <XCircle size={15} />
                              </button>
                            )}

                            <button
                              onClick={() => setDeletingSub(sub)}
                              className="p-1.5 bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/50 rounded-lg transition cursor-pointer"
                              title="Delete Subscription Permanently"
                            >
                              <Trash2 size={15} />
                            </button>

                            <button
                              onClick={() => handleSendRenewalAlert(sub)}
                              className="p-1.5 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-lg transition cursor-pointer"
                              title="Send WhatsApp/SMS Renewal Reminder"
                            >
                              <Send size={15} />
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
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: CONFIGURE LOYALTY RULES */}
      {/* ========================================================================= */}
      {isConfigModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-lg overflow-hidden">
            
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/80">
              <div className="flex items-center gap-2">
                <Settings size={18} className="text-indigo-600 dark:text-indigo-400" />
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">Loyalty Rules & Tier Configuration</h3>
              </div>
              <button onClick={() => setIsConfigModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <XCircle size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveConfig} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              
              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-200 dark:border-slate-700">
                <div>
                  <strong className="text-xs font-bold text-slate-900 dark:text-white block">Enable Loyalty Program</strong>
                  <span className="text-[10px] text-slate-500">Calculate points automatically at billing</span>
                </div>
                <input
                  type="checkbox"
                  checked={configForm.enabled}
                  onChange={e => setConfigForm({ ...configForm, enabled: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 rounded cursor-pointer"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Spend Per Point ({currencySymbol})
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    step="any"
                    value={configForm.spend_per_point}
                    onFocus={e => e.target.select()}
                    onChange={e => setConfigForm({ ...configForm, spend_per_point: e.target.value === '' ? '' : Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">e.g. ₹100 spend = 1 pt</span>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Point Discount Value ({currencySymbol})
                  </label>
                  <input
                    type="number"
                    required
                    min={0.01}
                    step="any"
                    value={configForm.point_value}
                    onFocus={e => e.target.select()}
                    onChange={e => setConfigForm({ ...configForm, point_value: e.target.value === '' ? '' : Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">e.g. 1 point = ₹1 discount</span>
                </div>
              </div>

              <div className="border-t border-slate-100 dark:border-slate-700 pt-3 space-y-3">
                <h4 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Tier Thresholds & Multipliers</h4>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Gold Tier Min Spend ({currencySymbol})
                    </label>
                    <input
                      type="number"
                      min={0}
                      step="any"
                      value={configForm.gold_min_spend}
                      onFocus={e => e.target.select()}
                      onChange={e => setConfigForm({ ...configForm, gold_min_spend: e.target.value === '' ? '' : Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Gold Points Multiplier
                    </label>
                    <input
                      type="number"
                      min={0}
                      step="any"
                      value={configForm.gold_multiplier}
                      onFocus={e => e.target.select()}
                      onChange={e => setConfigForm({ ...configForm, gold_multiplier: e.target.value === '' ? '' : Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Platinum Tier Min Spend ({currencySymbol})
                    </label>
                    <input
                      type="number"
                      min={0}
                      step="any"
                      value={configForm.platinum_min_spend}
                      onFocus={e => e.target.select()}
                      onChange={e => setConfigForm({ ...configForm, platinum_min_spend: e.target.value === '' ? '' : Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Platinum Points Multiplier
                    </label>
                    <input
                      type="number"
                      min={0}
                      step="any"
                      value={configForm.platinum_multiplier}
                      onFocus={e => e.target.select()}
                      onChange={e => setConfigForm({ ...configForm, platinum_multiplier: e.target.value === '' ? '' : Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 dark:border-slate-700 pt-3 grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Welcome Bonus Points
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="any"
                    value={configForm.welcome_bonus_points}
                    onFocus={e => e.target.select()}
                    onChange={e => setConfigForm({ ...configForm, welcome_bonus_points: e.target.value === '' ? '' : Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Birthday Bonus Points
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="any"
                    value={configForm.birthday_bonus_points}
                    onFocus={e => e.target.select()}
                    onChange={e => setConfigForm({ ...configForm, birthday_bonus_points: e.target.value === '' ? '' : Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsConfigModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer shadow-sm"
                >
                  Save Configuration
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: MANUAL POINTS ADJUSTMENT */}
      {/* ========================================================================= */}
      {isAdjustPointsModalOpen && selectedCustomerForAdjust && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-md overflow-hidden">
            
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/80">
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-amber-500" />
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                  Adjust Loyalty Points - {selectedCustomerForAdjust.name}
                </h3>
              </div>
              <button onClick={() => setIsAdjustPointsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <XCircle size={18} />
              </button>
            </div>

            <form onSubmit={handlePerformPointsAdjust} className="p-5 space-y-4">
              
              <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Current Balance:</span>
                  <strong className="font-bold text-slate-900 dark:text-white">{selectedCustomerForAdjust.loyalty_points || 0} pts</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Loyalty Tier:</span>
                  <strong className="font-bold text-indigo-600 dark:text-indigo-400">{selectedCustomerForAdjust.loyalty_tier || 'Silver'}</strong>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Adjustment Type
                </label>
                <select
                  value={adjustType}
                  onChange={e => setAdjustType(e.target.value as LoyaltyLog['type'])}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none"
                >
                  <option value="Bonus">Bonus (+ Credit Points)</option>
                  <option value="Earned">Earned (+ Billing Credit)</option>
                  <option value="Redeemed">Redeemed (- Debit Discount)</option>
                  <option value="Adjustment">Adjustment (+/- Manual Override)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Points Quantity
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  value={adjustPointsValue}
                  onChange={e => setAdjustPointsValue(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Notes / Reason
                </label>
                <input
                  type="text"
                  placeholder="e.g., Birthday bonus, customer gesture, referral reward"
                  value={adjustNotes}
                  onChange={e => setAdjustNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsAdjustPointsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer shadow-sm"
                >
                  Apply Adjustment
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: MASS BONUS DISPATCHER */}
      {/* ========================================================================= */}
      {isBonusDispatchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-md overflow-hidden">
            
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/80">
              <div className="flex items-center gap-2">
                <Gift size={18} className="text-emerald-500" />
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                  Distribute Mass Bonus Points
                </h3>
              </div>
              <button onClick={() => setIsBonusDispatchModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <XCircle size={18} />
              </button>
            </div>

            <form onSubmit={handleDispatchMassBonus} className="p-5 space-y-4">
              
              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Campaign / Festival Event Name
                </label>
                <input
                  type="text"
                  required
                  value={bonusEventName}
                  onChange={e => setBonusEventName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Bonus Points Amount
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={bonusPointsAmount}
                    onChange={e => {
                      const val = e.target.value;
                      setBonusPointsAmount(val === '' ? '' : Number(val));
                    }}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Target Member Tier
                  </label>
                  <select
                    value={bonusTargetTier}
                    onChange={e => setBonusTargetTier(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none"
                  >
                    <option value="ALL">All Customers ({customers.length})</option>
                    <option value="Silver">Silver Only</option>
                    <option value="Gold">Gold Only</option>
                    <option value="Platinum">Platinum Only</option>
                  </select>
                </div>
              </div>

              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl text-xs text-emerald-800 dark:text-emerald-300">
                💡 This rule-based distribution credits points directly into customer accounts without any external third-party costs.
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsBonusDispatchModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer shadow-sm"
                >
                  Dispatch Bonus Points Now
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: LOYALTY HISTORY / LEDGER */}
      {/* ========================================================================= */}
      {isLedgerModalOpen && selectedCustomerForLedger && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-xl overflow-hidden flex flex-col max-h-[85vh]">
            
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/80">
              <div className="flex items-center gap-2">
                <History size={18} className="text-indigo-600 dark:text-indigo-400" />
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                  Loyalty Transaction History - {selectedCustomerForLedger.name}
                </h3>
              </div>
              <button onClick={() => setIsLedgerModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <XCircle size={18} />
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1 space-y-2">
              {dbStore.getLoyaltyLogs(selectedCustomerForLedger.id, businessId).length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  No loyalty transactions recorded yet for this customer profile.
                </div>
              ) : (
                dbStore.getLoyaltyLogs(selectedCustomerForLedger.id, businessId).map(log => (
                  <div key={log.id} className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-200 dark:border-slate-700/80 flex items-center justify-between text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          log.type === 'Earned' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' :
                          log.type === 'Redeemed' ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300' :
                          'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                        }`}>
                          {log.type}
                        </span>
                        <strong className="text-slate-900 dark:text-white font-bold">{log.notes}</strong>
                      </div>
                      <span className="text-[10px] text-slate-400 mt-0.5 block font-mono">
                        {new Date(log.created_at).toLocaleString()}
                      </span>
                    </div>

                    <span className={`font-black text-sm ${log.points > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                      {log.points > 0 ? '+' : ''}{log.points} pts
                    </span>
                  </div>
                ))
              )}
            </div>

            <div className="p-3 border-t border-slate-100 dark:border-slate-700 flex justify-end">
              <button
                onClick={() => setIsLedgerModalOpen(false)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
              >
                Close Ledger
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: CREATE NEW SUBSCRIPTION */}
      {/* ========================================================================= */}
      {isNewSubModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/80">
              <div className="flex items-center gap-2">
                <RefreshCw size={18} className="text-indigo-600 dark:text-indigo-400" />
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                  Create Customer Recurring Subscription Plan
                </h3>
              </div>
              <button onClick={() => setIsNewSubModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <XCircle size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateSubscription} className="p-5 space-y-4 overflow-y-auto flex-1">
              
              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Select Customer *
                </label>
                <select
                  required
                  value={selectedCustomerId}
                  onChange={e => {
                    setSelectedCustomerId(e.target.value);
                    const cust = customers.find(c => c.id === e.target.value);
                    if (cust) {
                      setSubDeliveryArea(cust.area || '');
                      setSubDeliveryAddress(cust.shipping_address || cust.billing_address || '');
                    }
                  }}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none"
                >
                  <option value="">-- Choose Customer --</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.phone}) - {c.area || 'Standard'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Subscription Plan Name
                  </label>
                  <input
                    type="text"
                    required
                    value={subPlanName}
                    onChange={e => setSubPlanName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Frequency
                  </label>
                  <select
                    value={subFrequency}
                    onChange={e => setSubFrequency(e.target.value as SubscriptionFrequency)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none"
                  >
                    <option value="Weekly">Weekly (Every 7 Days)</option>
                    <option value="Bi-Weekly">Bi-Weekly (Every 14 Days)</option>
                    <option value="Monthly">Monthly (Every Month)</option>
                    <option value="Quarterly">Quarterly (Every 3 Months)</option>
                  </select>
                </div>
              </div>

              {/* Items Selection */}
              <div className="border border-slate-200 dark:border-slate-700 p-3 rounded-xl space-y-3">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">Plan Products / Items Box</h4>
                
                <div className="flex gap-2">
                  <select
                    value={selectedProdForSub}
                    onChange={e => setSelectedProdForSub(e.target.value)}
                    className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none"
                  >
                    <option value="">-- Add Product to Subscription --</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({currencySymbol}{p.selling_price})
                      </option>
                    ))}
                  </select>

                  <input
                    type="number"
                    min={1}
                    value={selectedQtyForSub}
                    onChange={e => setSelectedQtyForSub(Number(e.target.value))}
                    className="w-16 px-2 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-xs text-center focus:outline-none"
                  />

                  <button
                    type="button"
                    onClick={handleAddSubItem}
                    className="px-3 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition cursor-pointer"
                  >
                    Add
                  </button>
                </div>

                <div className="space-y-1 divide-y divide-slate-100 dark:divide-slate-700">
                  {subItems.length === 0 ? (
                    <p className="text-[11px] text-slate-400 py-2 text-center">No items added to plan yet.</p>
                  ) : (
                    subItems.map((item, idx) => {
                      const prod = products.find(p => p.id === item.product_id);
                      return (
                        <div key={idx} className="flex justify-between items-center py-1.5 text-xs">
                          <span>{prod?.name || 'Product'} &times; {item.qty}</span>
                          <div className="flex items-center gap-3">
                            <span className="font-bold">{currencySymbol}{(item.qty * item.selling_price).toLocaleString()}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveSubItem(idx)}
                              className="text-rose-500 hover:text-rose-700 cursor-pointer"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between text-xs font-bold">
                  <span>Recurring Bill Total:</span>
                  <span className="text-indigo-600 dark:text-indigo-400 text-sm font-extrabold">{currencySymbol}{subTotalAmount.toLocaleString()}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Delivery Zone / Area
                  </label>
                  <input
                    type="text"
                    value={subDeliveryArea}
                    onChange={e => setSubDeliveryArea(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    First Billing Date
                  </label>
                  <input
                    type="date"
                    required
                    value={subNextBillingDate}
                    onChange={e => setSubNextBillingDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Delivery Address
                </label>
                <input
                  type="text"
                  value={subDeliveryAddress}
                  onChange={e => setSubDeliveryAddress(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsNewSubModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer shadow-sm"
                >
                  Create Subscription
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* MODAL: DELETE CONFIRMATION */}
      {deletingSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-md p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 rounded-full shrink-0">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">Delete Subscription</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  This action cannot be undone.
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
              Are you sure you want to permanently delete subscription <strong className="text-slate-900 dark:text-white font-mono">{deletingSub.subscription_number}</strong> ({deletingSub.plan_name}) for <strong className="text-slate-900 dark:text-white">{deletingSub.customer_name}</strong>?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingSub(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                No
              </button>
              <button
                type="button"
                onClick={() => {
                  const subNum = deletingSub.subscription_number;
                  dbStore.deleteSubscription(deletingSub.id);
                  triggerToast(`Subscription ${subNum} deleted successfully.`, 'success');
                  setDeletingSub(null);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition shadow-sm cursor-pointer"
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CANCEL CONFIRMATION */}
      {cancellingSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-md p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 rounded-full shrink-0">
                <XCircle size={24} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">Cancel Subscription</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                   Change status to Cancelled.
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
              Are you sure you want to cancel subscription <strong className="text-slate-900 dark:text-white font-mono">{cancellingSub.subscription_number}</strong> ({cancellingSub.plan_name}) for <strong className="text-slate-900 dark:text-white">{cancellingSub.customer_name}</strong>?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCancellingSub(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                No
              </button>
              <button
                type="button"
                onClick={() => {
                  const subNum = cancellingSub.subscription_number;
                  dbStore.updateSubscription(cancellingSub.id, { status: 'Cancelled' });
                  triggerToast(`Subscription ${subNum} cancelled.`, 'info');
                  setCancellingSub(null);
                }}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition shadow-sm cursor-pointer"
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: LOYALTY MEMBERSHIP VALIDITY */}
      {isMembershipModalOpen && selectedCustomerForMembership && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-sm overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                <ShieldCheck size={18} className="text-indigo-600" />
                Membership Validity
              </h3>
              <button 
                onClick={() => {
                  setIsMembershipModalOpen(false);
                  setSelectedCustomerForMembership(null);
                }} 
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <XCircle size={20} />
              </button>
            </div>

            <form onSubmit={handleUpdateMembershipDates} className="p-6 space-y-4">
              <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl border border-indigo-100 dark:border-indigo-800 mb-2">
                <p className="text-[10px] font-black text-indigo-700 dark:text-indigo-300 uppercase tracking-widest mb-1">Customer Profile</p>
                <p className="text-sm font-bold text-slate-900 dark:text-white">{selectedCustomerForMembership.name}</p>
                <p className="text-[11px] text-slate-500 font-mono">{selectedCustomerForMembership.phone}</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-indigo-50 dark:bg-indigo-900/40 rounded-xl border border-indigo-100 dark:border-indigo-800">
                  <div>
                    <p className="text-xs font-bold text-indigo-900 dark:text-indigo-200">Loyalty Membership Status</p>
                    <p className="text-[10px] text-indigo-600 dark:text-indigo-400">{membershipIsActive ? 'Member benefits are active' : 'Member benefits are disabled'}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMembershipIsActive(prev => !prev)}
                    className={`group relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 ${membershipIsActive ? 'bg-emerald-600' : 'bg-slate-200 dark:bg-slate-700'}`}
                  >
                    <span className="sr-only">Loyalty Status</span>
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${membershipIsActive ? 'translate-x-5' : 'translate-x-0'}`}
                    />
                  </button>
                </div>

                <div className={`space-y-4 transition-all duration-200 ${membershipIsActive ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5 ml-1">Subscription Start Date</label>
                    <div className="relative">
                      <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                        type="date"
                        value={membershipStartDate}
                        onChange={(e) => {
                          setMembershipStartDate(e.target.value);
                          if (!membershipEndDate) {
                            setMembershipEndDate(addOneYear(e.target.value));
                          }
                        }}
                        className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                        required={membershipIsActive}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5 ml-1">Subscription End Date</label>
                    <div className="relative">
                      <Clock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                        type="date"
                        value={membershipEndDate}
                        onChange={(e) => setMembershipEndDate(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                        required={membershipIsActive}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">Auto-Renew Subscription</p>
                      <p className="text-[10px] text-slate-500">Extend by 1 year automatically on expiry</p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setMembershipAutoRenew(prev => !prev);
                      }}
                      className={`group relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 ${membershipAutoRenew ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'}`}
                    >
                      <span className="sr-only">Auto-Renew Subscription</span>
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${membershipAutoRenew ? 'translate-x-5' : 'translate-x-0'}`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsMembershipModalOpen(false);
                    setSelectedCustomerForMembership(null);
                  }}
                  className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition shadow-sm shadow-indigo-500/20 active:scale-[0.98]"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ENROLL NEW LOYALTY MEMBER */}
      {isEnrollModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-md overflow-hidden flex flex-col max-h-[85vh]">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                  <UserPlus size={18} className="text-indigo-600" />
                  {isManualEnroll ? 'Add New Customer' : 'Enroll Loyalty Member'}
                </h3>
                <p className="text-[10px] text-slate-500 font-medium">
                  {isManualEnroll ? 'Enter details for the new customer' : 'Select an existing customer to join the loyalty program'}
                </p>
              </div>
              <button 
                onClick={() => { 
                  setIsEnrollModalOpen(false); 
                  setEnrollSearchQuery(''); 
                  setIsManualEnroll(false);
                  setManualName('');
                  setManualPhone('');
                }} 
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <XCircle size={20} />
              </button>
            </div>

            {!isManualEnroll ? (
              <>
                <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50/30 dark:bg-slate-900/30">
                  <div className="flex flex-col gap-3">
                    <button
                      onClick={() => setIsManualEnroll(true)}
                      className="w-full py-2.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800 rounded-xl text-xs font-bold hover:bg-indigo-100 transition flex items-center justify-center gap-2"
                    >
                      <UserPlus size={14} />
                      Add Customer Manually
                    </button>
                    
                    <div className="relative">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                        type="text"
                        placeholder="Search existing customers..."
                        value={enrollSearchQuery}
                        onChange={(e) => setEnrollSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2 min-h-[350px]">
                  {dbStore.getCustomers(businessId)
                    .filter(c => {
                      const search = enrollSearchQuery.toLowerCase();
                      return c.name.toLowerCase().includes(search) || c.phone.includes(search);
                    })
                    .map(cust => (
                      <div
                        key={cust.id}
                        onClick={() => {
                          setSelectedCustomerForMembership(cust);
                          setMembershipStartDate(cust.loyalty_start_date || new Date().toISOString().split('T')[0]);
                          setMembershipEndDate(cust.loyalty_end_date || addOneYear(new Date().toISOString().split('T')[0]));
                          setMembershipAutoRenew(!!cust.loyalty_auto_renew);
                          setMembershipIsActive(!!cust.is_loyal_member);
                          setIsEnrollModalOpen(false);
                          setIsMembershipModalOpen(true);
                        }}
                        className={`w-full flex items-center justify-between p-3 rounded-xl transition group text-left mb-1 cursor-pointer ${
                          cust.is_loyal_member 
                            ? 'bg-indigo-50/50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800' 
                            : 'bg-white dark:bg-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800 border border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                            cust.is_loyal_member 
                              ? 'bg-slate-200 dark:bg-slate-700 text-slate-500' 
                              : 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                          }`}>
                            {cust.name.charAt(0)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 transition">{cust.name}</p>
                              {cust.is_loyal_member && (
                                <span className="px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 text-[9px] font-bold rounded uppercase tracking-wider">Member</span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 font-mono">{cust.phone}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${cust.is_loyal_member ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
                            {cust.is_loyal_member ? 'On' : 'Off'}
                          </span>
                          <ChevronRight size={16} className="text-slate-300 group-hover:text-indigo-400 transition" />
                        </div>
                      </div>
                    ))
                  }
                  {dbStore.getCustomers(businessId).length === 0 && (
                    <div className="py-12 text-center">
                      <Users size={32} className="mx-auto text-slate-200 mb-3" />
                      <p className="text-sm text-slate-400 italic">No customers found.</p>
                      <button 
                        onClick={() => setIsManualEnroll(true)}
                        className="mt-4 text-indigo-600 dark:text-indigo-400 text-xs font-bold hover:underline"
                      >
                        Add your first customer
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="p-6 space-y-4">
                <div className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Full Name</label>
                    <input 
                      type="text"
                      value={manualName}
                      onChange={(e) => setManualName(e.target.value)}
                      placeholder="e.g. John Doe"
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Phone Number</label>
                    <input 
                      type="tel"
                      value={manualPhone}
                      onChange={(e) => setManualPhone(e.target.value)}
                      placeholder="e.g. 9876543210"
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    onClick={() => setIsManualEnroll(false)}
                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition"
                  >
                    Back to List
                  </button>
                  <button
                    onClick={() => {
                      if (!manualName || !manualPhone) {
                        triggerToast('Please enter both name and phone.', 'error');
                        return;
                      }
                      
                      const newCust = dbStore.createCustomer({
                        business_id: businessId,
                        name: manualName,
                        phone: manualPhone,
                        email: '',
                        billing_address: '',
                        shipping_address: '',
                        gstin: '',
                        pan: '',
                        group: 'Retail',
                        is_loyal_member: false,
                        active: true,
                        credit_limit: 0
                      });

                      setSelectedCustomerForMembership(newCust);
                      setMembershipStartDate(new Date().toISOString().split('T')[0]);
                      setMembershipEndDate(addOneYear(new Date().toISOString().split('T')[0]));
                      setMembershipAutoRenew(true);
                      
                      setIsManualEnroll(false);
                      setManualName('');
                      setManualPhone('');
                      setIsEnrollModalOpen(false);
                      setIsMembershipModalOpen(true);
                    }}
                    className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-sm shadow-indigo-500/20 active:scale-95"
                  >
                    Enroll Member
                  </button>
                </div>
              </div>
            )}

            <div className="p-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50/30">
              <button
                onClick={() => { 
                  setIsEnrollModalOpen(false); 
                  setEnrollSearchQuery(''); 
                  setIsManualEnroll(false);
                  setManualName('');
                  setManualPhone('');
                }}
                className="w-full py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-200 rounded-xl text-xs font-bold hover:bg-slate-50 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
