import { PageHeader } from './PageHeader';
import React, { useState } from 'react';
import { 
  Settings, 
  MapPin, 
  Percent, 
  MessageSquare, 
  Bell, 
  Globe, 
  Lock, 
  ShieldCheck,
  Save,
  Compass
} from 'lucide-react';
import { dbStore } from '../services/store';
import { Business, UserProfile } from '../types/erp';

interface SettingsModuleProps {
  businessId: string;
  user: UserProfile;
  triggerToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const SettingsModule: React.FC<SettingsModuleProps> = ({ 
  businessId, 
  user, 
  triggerToast 
}) => {
  const [business, setBusiness] = useState<Business | null>(dbStore.getBusiness(businessId) || null);

  // Form states for multi-tenant settings
  const [name, setName] = useState(business?.name || '');
  const [gstin, setGstin] = useState(business?.gstin || '');
  const [billingAddress, setBillingAddress] = useState(business?.billing_address || '');
  const [logoUrl, setLogoUrl] = useState(business?.logo_url || '');
  const [loginCoverUrl, setLoginCoverUrl] = useState(business?.login_cover_url || '');

  // Handle Logo Upload
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1024 * 500) {
      triggerToast('Logo size should be less than 500KB', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Handle Cover Upload
  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1024 * 2000) {
      triggerToast('Cover size should be less than 2MB', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setLoginCoverUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };
  
  // API Integration configurations (Simulated values stored in local states)
  const [whatsappApiKey, setWhatsappApiKey] = useState('WA_LIVE_KEY_OMNIPACK_SIM_2026');
  const [whatsappTemplate, setWhatsappTemplate] = useState('Dear {{1}}, your order {{2}} has been packed!');
  const [smsGatewayUrl, setSmsGatewayUrl] = useState('https://api.sms-gateway.in/v1/send');
  const [googleMapsKey, setGoogleMapsKey] = useState('AIzaSy_SimulatedMapKey_Omnipack');

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();

    if (user.role !== 'Super Admin' && user.role !== 'Admin') {
      triggerToast('Unauthorized: Only Super Admins or Admins can modify tenant parameters.', 'error');
      return;
    }

    try {
      dbStore.updateBusiness(businessId, {
        name: name.trim(),
        gstin: gstin.toUpperCase().trim(),
        billing_address: billingAddress.trim(),
        logo_url: logoUrl,
        login_cover_url: loginCoverUrl
      });

      dbStore.logActivity(
        user.id,
        user.name,
        user.role,
        'Update Settings',
        `Updated multi-tenant settings for ${name}`,
        businessId
      );

      triggerToast('Business profile and API configurations updated.', 'success');
      setBusiness(dbStore.getBusiness(businessId));
    } catch (e: any) {
      triggerToast(e.message || 'An error occurred.', 'error');
    }
  };

  return (
    <div className="space-y-6 max-w-full pb-12 px-0 font-sans text-slate-900 dark:text-slate-100 overflow-x-hidden" id="settings-module-root">
      <PageHeader
        title="Multi-Tenant Settings & API Integrations"
        subtitle="Manage business information, regional tax configurations, and external communications webhooks."
        icon={Settings}
        rightContent={
          <>

          </>
        }
      />

      <form onSubmit={handleSaveSettings} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Tenant configurations */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-100 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 border-b pb-2">
              <ShieldCheck size={16} />
              <span>Corporate Identity & GST Details</span>
            </h3>

            <div className="space-y-4 text-[11px]">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase">Tenant Organization Name</label>
                <input 
                  type="text" 
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 text-[11px] rounded-lg border focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase">Tenant Logo (Max 500KB)</label>
                <div className="flex items-center gap-4">
                  {logoUrl && (
                    <div className="h-12 w-12 rounded bg-slate-100 border overflow-hidden flex items-center justify-center shrink-0">
                      <img src={logoUrl} alt="Logo Preview" className="max-h-full max-w-full object-contain" />
                    </div>
                  )}
                  <input 
                    type="file"
                    accept="image/png, image/jpeg, image/svg+xml"
                    onChange={handleLogoUpload}
                    className="w-full px-3 py-2 bg-slate-50 text-[11px] rounded-lg border focus:ring-1 focus:ring-indigo-500 file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-[11px] file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase">Login Cover Photo (Max 2MB)</label>
                <div className="flex items-center gap-4">
                  {loginCoverUrl && (
                    <div className="h-12 w-20 rounded bg-slate-100 border overflow-hidden flex items-center justify-center shrink-0">
                      <img src={loginCoverUrl} alt="Cover Preview" className="max-h-full max-w-full object-cover" />
                    </div>
                  )}
                  <input 
                    type="file"
                    accept="image/png, image/jpeg"
                    onChange={handleCoverUpload}
                    className="w-full px-3 py-2 bg-slate-50 text-[11px] rounded-lg border focus:ring-1 focus:ring-indigo-500 file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-[11px] file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase">Registered GSTIN ID (15 Characters)</label>
                <input 
                  type="text" 
                  required
                  maxLength={15}
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 font-mono text-[11px] rounded-lg border focus:ring-1"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase">Billing Address & Warehouse Coordinates</label>
                <textarea 
                  rows={3}
                  required
                  value={billingAddress}
                  onChange={(e) => setBillingAddress(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 text-[11px] rounded-lg border focus:ring-1"
                />
              </div>
            </div>
          </div>

          {/* Webhook notification integrations */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-100 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 border-b pb-2">
              <MessageSquare size={16} />
              <span>Simulated Messaging & SMS Gateways</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[11px]">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase">WhatsApp API Key Hook</label>
                <input 
                  type="password" 
                  value={whatsappApiKey}
                  onChange={(e) => setWhatsappApiKey(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 font-mono text-[11px] rounded-lg border"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase">SMS Gateway Rest URL</label>
                <input 
                  type="url" 
                  value={smsGatewayUrl}
                  onChange={(e) => setSmsGatewayUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 font-mono text-[11px] rounded-lg border"
                />
              </div>

              <div className="space-y-1 col-span-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase">WhatsApp Verification Dispatch Template</label>
                <input 
                  type="text" 
                  value={whatsappTemplate}
                  onChange={(e) => setWhatsappTemplate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 text-[11px] rounded-lg border"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Info panels */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-100 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 border-b pb-2">
              <Compass size={16} />
              <span>Google Maps Integration</span>
            </h3>

            <div className="space-y-3 text-[11px]">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase">Google Maps Platform Key</label>
                <input 
                  type="password" 
                  value={googleMapsKey}
                  onChange={(e) => setGoogleMapsKey(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 font-mono text-[11px] rounded-lg border"
                />
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Google Maps APIs are actively utilized during checkout to calculate distance-to-warehouse logistics and validate zip codes.
              </p>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/40 p-5 rounded-xl border space-y-4">
            <h4 className="text-[11px] font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wide">Multi-Tenant Access Policy</h4>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Every data model (SKUs, Customers, Ledgers, Invoices, Orders) is hard-locked by your unique business ID. Secure Row-Level Security (RLS) is applied at database level to prevent cross-tenant memory contamination.
            </p>

            {(user.role === 'Super Admin' || user.role === 'Admin') ? (
              <button 
                type="submit"
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <Save size={14} />
                <span>Save Configuration</span>
              </button>
            ) : (
              <div className="p-2.5 bg-rose-50 border border-rose-100 text-rose-800 rounded-lg text-center text-[11px] font-semibold">
                View-Only: Insufficient clearance to modify.
              </div>
            )}
          </div>
        </div>

      </form>
    </div>
  );
};
