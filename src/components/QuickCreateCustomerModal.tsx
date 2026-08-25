import React, { useState, useEffect } from 'react';
import { 
  X, 
  UserPlus, 
  Sparkles, 
  Save, 
  MapPin, 
  Phone, 
  Mail, 
  Building, 
  FileText, 
  Award,
  Plus,
  Check
} from 'lucide-react';
import { dbStore } from '../services/store';
import { Customer, UserProfile } from '../types/erp';

interface QuickCreateCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  businessId: string;
  user: UserProfile;
  initialName?: string;
  initialPhone?: string;
  currencySymbol?: string;
  onCustomerCreated: (newCustomer: Customer) => void;
  triggerToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const QuickCreateCustomerModal: React.FC<QuickCreateCustomerModalProps> = ({
  isOpen,
  onClose,
  businessId,
  user,
  initialName = '',
  initialPhone = '',
  currencySymbol = '₹',
  onCustomerCreated,
  triggerToast
}) => {
  const currentBiz = dbStore.getBusiness(businessId);
  const defaultZones = currentBiz?.area_zones && currentBiz.area_zones.length > 0 
    ? currentBiz.area_zones 
    : ['Dahisar', 'Borivali', 'Kandivali', 'Mira Road', 'Vasai', 'Virar', 'Malad', 'Goregaon', 'Andheri'];

  const [name, setName] = useState(initialName);
  const [phone, setPhone] = useState(initialPhone);
  const [email, setEmail] = useState('');
  const [group, setGroup] = useState('Retail');
  const [area, setArea] = useState(currentBiz?.default_dispatch_zone || defaultZones[0] || 'Dahisar');
  const [billingAddress, setBillingAddress] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [isSameShipping, setIsSameShipping] = useState(true);
  const [gstin, setGstin] = useState('');
  const [pan, setPan] = useState('');
  const [creditLimit, setCreditLimit] = useState<number | ''>(0);
  const [isLoyalMember, setIsLoyalMember] = useState(false);
  const [loyaltyTier, setLoyaltyTier] = useState('Silver');

  // Custom Area state
  const [isAddingArea, setIsAddingArea] = useState(false);
  const [newAreaInput, setNewAreaInput] = useState('');
  const [availableZones, setAvailableZones] = useState<string[]>(defaultZones);

  useEffect(() => {
    if (isOpen) {
      setName(initialName || '');
      setPhone(initialPhone || '');
      setEmail('');
      setGroup('Retail');
      const biz = dbStore.getBusiness(businessId);
      const zones = biz?.area_zones && biz.area_zones.length > 0 
        ? biz.area_zones 
        : ['Dahisar', 'Borivali', 'Kandivali', 'Mira Road', 'Vasai', 'Virar', 'Malad', 'Goregaon', 'Andheri'];
      setAvailableZones(zones);
      setArea(biz?.default_dispatch_zone || zones[0] || 'Dahisar');
      setBillingAddress('');
      setShippingAddress('');
      setIsSameShipping(true);
      setGstin('');
      setPan('');
      setCreditLimit(0);
      setIsLoyalMember(false);
      setLoyaltyTier('Silver');
      setIsAddingArea(false);
      setNewAreaInput('');
    }
  }, [isOpen, initialName, initialPhone, businessId]);

  const handleAddNewArea = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanArea = newAreaInput.trim();
    if (!cleanArea) return;
    if (!availableZones.includes(cleanArea)) {
      const updated = [...availableZones, cleanArea];
      setAvailableZones(updated);
      if (currentBiz) {
        dbStore.updateBusiness(businessId, {
          area_zones: updated
        });
      }
    }
    setArea(cleanArea);
    setNewAreaInput('');
    setIsAddingArea(false);
    triggerToast(`Added delivery zone "${cleanArea}"`, 'success');
  };

  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    const cleanPhone = phone.trim();
    const cleanBilling = billingAddress.trim();

    if (!cleanName) {
      triggerToast('Customer Name is required.', 'error');
      return;
    }
    if (!cleanPhone) {
      triggerToast('Mobile number is required.', 'error');
      return;
    }
    if (!cleanBilling) {
      triggerToast('Billing address is required.', 'error');
      return;
    }

    try {
      const finalShipping = isSameShipping ? cleanBilling : (shippingAddress.trim() || cleanBilling);
      const newCustomer = dbStore.createCustomer({
        name: cleanName,
        phone: cleanPhone,
        email: email.trim() || '',
        group: group || 'Retail',
        area: area || 'Dahisar',
        billing_address: cleanBilling,
        shipping_address: finalShipping,
        gstin: gstin.trim().toUpperCase() || '',
        pan: pan.trim().toUpperCase() || '',
        credit_limit: typeof creditLimit === 'number' ? creditLimit : 0,
        is_loyal_member: isLoyalMember,
        loyalty_tier: isLoyalMember ? (loyaltyTier as any) : undefined,
        business_id: businessId,
        active: true
      });

      dbStore.logActivity(
        user.id,
        user.name,
        user.role,
        'Create Customer',
        `Registered new customer "${cleanName}" (${cleanPhone}) from Create Invoice screen`,
        businessId
      );

      triggerToast(`Customer "${cleanName}" saved and selected!`, 'success');
      onCustomerCreated(newCustomer);
      onClose();
    } catch (err: any) {
      triggerToast(err.message || 'Failed to create customer', 'error');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Modal Header */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-indigo-600 via-indigo-700 to-indigo-800 text-white flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-xl backdrop-blur-xs border border-white/20">
              <UserPlus size={20} className="text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black tracking-wide uppercase">Add New Customer</h3>
                <span className="bg-emerald-400/20 text-emerald-200 border border-emerald-300/30 text-[9px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Sparkles size={10} /> Instant Sync to Invoice
                </span>
              </div>
              <p className="text-[11px] text-indigo-100/80 font-medium">Create a new customer profile and auto-select for billing</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/70 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition cursor-pointer"
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSaveCustomer} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          
          {/* Main Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1 sm:col-span-2">
              <label className="text-[11px] font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1">
                <span>Customer / Business Name *</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Ramesh Patel / Krishna Enterprises"
                autoFocus
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs rounded-xl border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1">
                <Phone size={13} className="text-indigo-500" />
                <span>Mobile Number *</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 9876543210"
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs rounded-xl border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1">
                <Mail size={13} className="text-indigo-500" />
                <span>Email Address (Optional)</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. customer@example.com"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs rounded-xl border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1">
                <Building size={13} className="text-indigo-500" />
                <span>Customer Group</span>
              </label>
              <select
                value={group}
                onChange={(e) => setGroup(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs rounded-xl border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold cursor-pointer"
              >
                <option value="Retail">Retail Consumer</option>
                <option value="Wholesale">Wholesale Merchant</option>
                <option value="Corporate">Corporate / B2B</option>
                <option value="Distributor">Distributor / Dealer</option>
              </select>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1">
                  <MapPin size={13} className="text-indigo-500" />
                  <span>Dispatch Area / Zone</span>
                </label>
                {!isAddingArea && (
                  <button
                    type="button"
                    onClick={() => setIsAddingArea(true)}
                    className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold hover:underline flex items-center gap-0.5 cursor-pointer"
                  >
                    <Plus size={11} />
                    <span>Add Zone</span>
                  </button>
                )}
              </div>

              {!isAddingArea ? (
                <select
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs rounded-xl border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold cursor-pointer"
                >
                  {availableZones.map(z => (
                    <option key={z} value={z}>{z}</option>
                  ))}
                  <option value="Other">Other Area</option>
                </select>
              ) : (
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={newAreaInput}
                    onChange={(e) => setNewAreaInput(e.target.value)}
                    placeholder="New Zone Name"
                    className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 text-xs rounded-lg border border-indigo-400 focus:outline-none"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={handleAddNewArea}
                    className="px-2.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold cursor-pointer"
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAddingArea(false)}
                    className="px-2 py-2 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Address Section */}
          <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
            <div className="space-y-1">
              <label className="text-[11px] font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                Billing Address / Street *
              </label>
              <textarea
                value={billingAddress}
                onChange={(e) => setBillingAddress(e.target.value)}
                placeholder="Building, Shop No, Street, Landmark, Pin Code"
                rows={2}
                required
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs rounded-xl border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium resize-none"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="same-shipping-modal"
                checked={isSameShipping}
                onChange={(e) => setIsSameShipping(e.target.checked)}
                className="h-4 w-4 text-indigo-600 rounded cursor-pointer"
              />
              <label htmlFor="same-shipping-modal" className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                Shipping / Delivery address is the same as Billing Address
              </label>
            </div>

            {!isSameShipping && (
              <div className="space-y-1 animate-in fade-in duration-150">
                <label className="text-[11px] font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  Shipping / Delivery Address
                </label>
                <textarea
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  placeholder="Delivery location if different from billing"
                  rows={2}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs rounded-xl border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium resize-none"
                />
              </div>
            )}
          </div>

          {/* Optional Tax & Loyalty */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-200 dark:border-slate-800">
            <div className="space-y-1">
              <label className="text-[11px] font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1">
                <FileText size={13} className="text-slate-500" />
                <span>GSTIN (Optional)</span>
              </label>
              <input
                type="text"
                value={gstin}
                onChange={(e) => setGstin(e.target.value)}
                placeholder="e.g. 27ABCDE1234F1Z5"
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs rounded-xl border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1">
                <Award size={13} className="text-amber-500" />
                <span>Loyalty Membership</span>
              </label>
              <div className="flex items-center gap-3 h-10">
                <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={isLoyalMember}
                    onChange={(e) => setIsLoyalMember(e.target.checked)}
                    className="h-4 w-4 text-amber-500 rounded cursor-pointer"
                  />
                  <span>Enroll as Member</span>
                </label>
                {isLoyalMember && (
                  <select
                    value={loyaltyTier}
                    onChange={(e) => setLoyaltyTier(e.target.value)}
                    className="px-2.5 py-1.5 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 text-xs rounded-lg border border-amber-300 dark:border-amber-700 font-bold"
                  >
                    <option value="Silver">Silver Tier</option>
                    <option value="Gold">Gold Tier (LMR)</option>
                    <option value="Platinum">Platinum Tier (LMR)</option>
                  </select>
                )}
              </div>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-xs font-black rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
            >
              <Save size={15} />
              <span>Save & Select Customer</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
