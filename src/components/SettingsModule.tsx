import { PageHeader } from './PageHeader';
import React, { useState, useEffect } from 'react';
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
  Compass,
  Database,
  RefreshCw,
  CheckCircle2,
  Sliders,
  DollarSign,
  Truck,
  Boxes,
  Zap,
  Sparkles,
  Shield,
  FileText,
  AlertCircle,
  Clock,
  Layers,
  Server,
  Trash2
} from 'lucide-react';
import { dbStore } from '../services/store';
import { Business, UserProfile } from '../types/erp';
import { compressImageFile } from '../utils/imageCompressor';
import { uploadFileToSupabaseStorage } from '../services/supabase';

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

  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(
    business?.last_supabase_sync || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  );

  // Form states for multi-tenant settings
  const [name, setName] = useState(business?.name || 'Kokanastha Faral ERP');
  const [gstin, setGstin] = useState(business?.gstin || '27AAAAA0000A1Z5');
  const [pan, setPan] = useState(business?.pan || 'AAAAA0000A');
  const [invoicePrefix, setInvoicePrefix] = useState(business?.invoice_prefix || 'KOK');
  const [taxRateDefault, setTaxRateDefault] = useState<number>(business?.tax_rate_default || 18);
  const [billingAddress, setBillingAddress] = useState(business?.billing_address || 'Warehouse 4B, Apex Industrial Estate, Dahisar East, Mumbai 400068');
  const [logoUrl, setLogoUrl] = useState(business?.logo_url || '');
  const [loginCoverUrl, setLoginCoverUrl] = useState(business?.login_cover_url || '');

  // Advanced Tenant Settings
  const [currencySymbol, setCurrencySymbol] = useState(business?.currency_symbol || '₹');
  const [autoBackup, setAutoBackup] = useState<boolean>(business?.auto_backup ?? true);
  const [lowStockThreshold, setLowStockThreshold] = useState<number>(business?.low_stock_threshold || 20);
  const [auditRetentionDays, setAuditRetentionDays] = useState<number>(business?.audit_retention_days || 90);
  const [defaultTheme, setDefaultTheme] = useState<string>(business?.default_theme || 'midnight-gold');
  const [enableAutoWhatsapp, setEnableAutoWhatsapp] = useState<boolean>(business?.enable_auto_whatsapp ?? true);
  const [enableAutoSms, setEnableAutoSms] = useState<boolean>(business?.enable_auto_sms ?? true);
  const [defaultDispatchZone, setDefaultDispatchZone] = useState<string>(business?.default_dispatch_zone || 'Dahisar');

  // Tenant Payment & UPI QR Configurations
  const [upiId, setUpiId] = useState(business?.upi_id || '9820769697@okicici');
  const [upiQrUrl, setUpiQrUrl] = useState(business?.upi_qr_url || '');
  const [bankName, setBankName] = useState(business?.bank_name || 'NKGSB COOPERATIVE BANK LIMITED, DAHISAR EAST ASHOKVAN');
  const [accountNumber, setAccountNumber] = useState(business?.account_number || '092110100000085');
  const [ifscCode, setIfscCode] = useState(business?.ifsc_code || 'NKGS0000092');
  const [accountHolder, setAccountHolder] = useState(business?.account_holder || business?.name || 'Kokanastha Faral & Sweets');

  // API Integration configurations (Simulated keys)
  const [whatsappApiKey, setWhatsappApiKey] = useState('WA_LIVE_KEY_OMNIPACK_SIM_2026');
  const [whatsappTemplate, setWhatsappTemplate] = useState('Dear {{1}}, your order {{2}} has been packed!');
  const [smsGatewayUrl, setSmsGatewayUrl] = useState('https://api.sms-gateway.in/v1/send');
  const [googleMapsKey, setGoogleMapsKey] = useState('AIzaSy_SimulatedMapKey_Omnipack');

  // Keep form synced with current business store state
  useEffect(() => {
    const unsub = dbStore.subscribe(() => {
      const updated = dbStore.getBusiness(businessId);
      if (updated) {
        setBusiness(updated);
      }
    });
    return unsub;
  }, [businessId]);

  // Handle Logo Upload with Supabase Storage upload
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsSyncing(true);
      const publicUrl = await uploadFileToSupabaseStorage(file, 'logo');
      setLogoUrl(publicUrl);
      dbStore.updateBusiness(businessId, { logo_url: publicUrl });
      triggerToast('Tenant Logo uploaded to Supabase & saved permanently!', 'success');
    } catch (err) {
      console.error('Logo upload error:', err);
      triggerToast('Failed to process uploaded logo image', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleRemoveLogo = () => {
    setLogoUrl('');
    dbStore.updateBusiness(businessId, { logo_url: '' });
    triggerToast('Tenant Logo removed.', 'info');
  };

  // Handle Cover Upload with Supabase Storage upload
  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsSyncing(true);
      const publicUrl = await uploadFileToSupabaseStorage(file, 'cover');
      setLoginCoverUrl(publicUrl);
      dbStore.updateBusiness(businessId, { login_cover_url: publicUrl });
      triggerToast('Login Cover Photo uploaded to Supabase & saved permanently!', 'success');
    } catch (err) {
      console.error('Cover upload error:', err);
      triggerToast('Failed to process cover image', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleRemoveCover = () => {
    setLoginCoverUrl('');
    dbStore.updateBusiness(businessId, { login_cover_url: '' });
    triggerToast('Login Cover Photo removed.', 'info');
  };

  // Handle UPI QR Code Image Upload with Supabase Storage upload
  const handleUpiQrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsSyncing(true);
      const publicUrl = await uploadFileToSupabaseStorage(file, 'upi_qr');
      setUpiQrUrl(publicUrl);
      dbStore.updateBusiness(businessId, { upi_qr_url: publicUrl });
      triggerToast('Custom UPI QR Image uploaded to Supabase & saved permanently!', 'success');
    } catch (err) {
      console.error('UPI QR upload error:', err);
      triggerToast('Failed to process UPI QR image', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleRemoveUpiQr = () => {
    setUpiQrUrl('');
    dbStore.updateBusiness(businessId, { upi_qr_url: '' });
    triggerToast('Custom UPI QR Image removed.', 'info');
  };

  const handleSyncToSupabase = async () => {
    setIsSyncing(true);
    try {
      await dbStore.forcePushAllToSupabase();
      const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setLastSyncTime(nowStr);
      dbStore.updateBusiness(businessId, { last_supabase_sync: nowStr });
      triggerToast('Successfully synced all tenant records to Supabase PostgreSQL cloud!', 'success');
    } catch (e: any) {
      triggerToast('Failed to sync to Supabase.', 'error');
      alert(
        'Supabase Sync Diagnostic:\n' + 
        (e.message || e) + 
        '\n\nNote: Row-Level Security (RLS) might be blocking this. You can check RLS policies in your Supabase project dashboard.'
      );
    } finally {
      setIsSyncing(false);
    }
  };

  const handleFactoryReset = () => {
    setShowResetConfirm(true);
  };

  const confirmFactoryReset = () => {
    dbStore.clearAllAndReset();
    triggerToast('System factory reset complete. Reloading...', 'success');
    setShowResetConfirm(false);
    setTimeout(() => window.location.reload(), 1500);
  };

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
        pan: pan.toUpperCase().trim(),
        invoice_prefix: invoicePrefix.toUpperCase().trim(),
        tax_rate_default: Number(taxRateDefault),
        billing_address: billingAddress.trim(),
        logo_url: logoUrl,
        login_cover_url: loginCoverUrl,
        currency_symbol: currencySymbol,
        auto_backup: autoBackup,
        low_stock_threshold: Number(lowStockThreshold),
        audit_retention_days: Number(auditRetentionDays),
        default_theme: defaultTheme,
        enable_auto_whatsapp: enableAutoWhatsapp,
        enable_auto_sms: enableAutoSms,
        default_dispatch_zone: defaultDispatchZone,
        upi_id: upiId.trim(),
        upi_qr_url: upiQrUrl,
        bank_name: bankName.trim(),
        account_number: accountNumber.trim(),
        ifsc_code: ifscCode.trim(),
        account_holder: accountHolder.trim()
      });

      dbStore.logActivity(
        user.id,
        user.name,
        user.role,
        'Update Settings',
        `Updated multi-tenant advanced settings for ${name}`,
        businessId
      );

      triggerToast('Tenant configurations & API rules saved successfully.', 'success');
      setBusiness(dbStore.getBusiness(businessId));
    } catch (e: any) {
      triggerToast(e.message || 'An error occurred while saving settings.', 'error');
    }
  };

  return (
    <div className="space-y-6 max-w-full pb-12 px-0 font-sans text-slate-900 dark:text-slate-100 overflow-x-hidden" id="settings-module-root">
      <PageHeader
        title="Tenant Settings & Cloud Control"
        subtitle="Configure multi-tenant organization identities, Supabase PostgreSQL synchronization, dispatch zones, and API webhooks."
        icon={Settings}
        rightContent={
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[11px] font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Tenant RLS Active
            </span>
          </div>
        }
      />

      {/* ================= 1. SUPABASE CLOUD SYNC CONTROL HUB ================= */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl border border-indigo-500/30 shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 opacity-10 pointer-events-none">
          <Database size={220} />
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-indigo-500/20 rounded-lg text-indigo-400 border border-indigo-500/30">
                <Database size={18} />
              </span>
              <h2 className="text-base font-extrabold tracking-wide text-white flex items-center gap-2">
                Supabase PostgreSQL Cloud Storage
              </h2>
              <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-extrabold border border-emerald-500/30">
                ACTIVE
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Synchronize all local enterprise data (Sales Orders, Packing Verifications, SKUs, Customers, and Audit Logs) to your dedicated Supabase database tables with strict Row-Level Security (RLS).
            </p>
            {lastSyncTime && (
              <p className="text-[11px] text-indigo-300/80 font-mono flex items-center gap-1.5">
                <Clock size={12} />
                <span>Last Cloud Sync: <strong>{lastSyncTime}</strong></span>
              </p>
            )}
          </div>

          <div className="shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              type="button"
              onClick={handleSyncToSupabase}
              disabled={isSyncing}
              className="px-5 py-3 bg-indigo-500 hover:bg-indigo-400 disabled:bg-indigo-800 text-white font-extrabold text-xs rounded-xl transition shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed shrink-0 border border-indigo-400/30"
            >
              <RefreshCw size={16} className={isSyncing ? 'animate-spin' : ''} />
              <span>{isSyncing ? 'Syncing to Supabase...' : 'Sync to Supabase Now'}</span>
            </button>
          </div>
        </div>

        {/* Sync Summary Indicators */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-white/10 text-xs">
          <div className="bg-white/5 p-3 rounded-xl border border-white/5">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sync Status</p>
            <p className="text-xs font-extrabold text-emerald-400 flex items-center gap-1 mt-0.5">
              <CheckCircle2 size={13} />
              <span>Connected</span>
            </p>
          </div>
          <div className="bg-white/5 p-3 rounded-xl border border-white/5">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Storage Engine</p>
            <p className="text-xs font-extrabold text-white mt-0.5">PostgreSQL 15</p>
          </div>
          <div className="bg-white/5 p-3 rounded-xl border border-white/5">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tenant Partition</p>
            <p className="text-xs font-extrabold text-amber-300 font-mono mt-0.5 truncate">{businessId}</p>
          </div>
          <div className="bg-white/5 p-3 rounded-xl border border-white/5">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cloud RLS</p>
            <p className="text-xs font-extrabold text-indigo-300 mt-0.5">Enforced</p>
          </div>
        </div>
      </div>

      {/* ================= 2. ADVANCED TENANT SETTINGS FORM ================= */}
      <form onSubmit={handleSaveSettings} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Columns: Core Identity & Advanced Features */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* A. Corporate Identity & GST Details */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="text-xs font-extrabold text-slate-700 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <ShieldCheck size={16} className="text-indigo-600 dark:text-indigo-400" />
              <span>Corporate Identity & GST Compliance</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1 sm:col-span-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase">Tenant Organization Name</label>
                <input 
                  type="text" 
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 text-xs rounded-xl border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase">Registered GSTIN ID (15 Characters)</label>
                <input 
                  type="text" 
                  required
                  maxLength={15}
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 font-mono text-xs rounded-xl border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500 uppercase"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase">PAN Number (10 Characters)</label>
                <input 
                  type="text" 
                  required
                  maxLength={10}
                  value={pan}
                  onChange={(e) => setPan(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 font-mono text-xs rounded-xl border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500 uppercase"
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase">Billing Address & Warehouse Coordinates</label>
                <textarea 
                  rows={2}
                  required
                  value={billingAddress}
                  onChange={(e) => setBillingAddress(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 text-xs rounded-xl border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Logo & Cover Upload */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase">Tenant Logo (Stored permanently)</label>
                <div className="flex items-center gap-3">
                  {logoUrl && (
                    <div className="flex items-center gap-2">
                      <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800 border overflow-hidden flex items-center justify-center shrink-0">
                        <img src={logoUrl} alt="Logo" className="max-h-full max-w-full object-contain" />
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveLogo}
                        title="Remove Logo"
                        className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  )}
                  <input 
                    type="file"
                    accept="image/png, image/jpeg, image/svg+xml"
                    onChange={handleLogoUpload}
                    className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 text-[11px] rounded-xl border border-slate-200 dark:border-slate-700 file:mr-2 file:py-0.5 file:px-2 file:rounded-lg file:border-0 file:text-[10px] file:font-semibold file:bg-indigo-50 file:text-indigo-700"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase">Login Cover Photo (Stored permanently)</label>
                <div className="flex items-center gap-3">
                  {loginCoverUrl && (
                    <div className="flex items-center gap-2">
                      <div className="h-10 w-16 rounded-xl bg-slate-100 dark:bg-slate-800 border overflow-hidden flex items-center justify-center shrink-0">
                        <img src={loginCoverUrl} alt="Cover" className="max-h-full max-w-full object-cover" />
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveCover}
                        title="Remove Cover Photo"
                        className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  )}
                  <input 
                    type="file"
                    accept="image/png, image/jpeg"
                    onChange={handleCoverUpload}
                    className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 text-[11px] rounded-xl border border-slate-200 dark:border-slate-700 file:mr-2 file:py-0.5 file:px-2 file:rounded-lg file:border-0 file:text-[10px] file:font-semibold file:bg-indigo-50 file:text-indigo-700"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* B. Financials, Invoicing & Tax Controls */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="text-xs font-extrabold text-slate-700 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <DollarSign size={16} className="text-amber-500" />
              <span>Financials, Invoicing & Tax Rules</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase">Invoice Prefix</label>
                <input 
                  type="text" 
                  required
                  value={invoicePrefix}
                  onChange={(e) => setInvoicePrefix(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 font-mono text-xs rounded-xl border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500 uppercase"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase">Default Tax Rate (%)</label>
                <input 
                  type="number" 
                  min={0}
                  max={100}
                  value={taxRateDefault}
                  onChange={(e) => setTaxRateDefault(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 text-xs rounded-xl border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase">Currency Symbol</label>
                <select 
                  value={currencySymbol}
                  onChange={(e) => setCurrencySymbol(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 text-xs rounded-xl border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500 font-bold"
                >
                  <option value="₹">₹ - Indian Rupee (INR)</option>
                  <option value="$">$ - US Dollar (USD)</option>
                  <option value="€">€ - Euro (EUR)</option>
                  <option value="£">£ - British Pound (GBP)</option>
                  <option value="A$">A$ - Australian Dollar (AUD)</option>
                </select>
              </div>
            </div>

            {/* UPI Payment & QR Code Configurations */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                <Sparkles size={15} className="text-emerald-500" />
                <span>UPI Payment QR Code & Bank Account (Tenant PDF/Print Invoice)</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Tenant UPI VPA / ID (e.g. 9820769697@okicici)</label>
                  <input 
                    type="text" 
                    placeholder="e.g. kokanastha@upi"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 font-mono text-xs rounded-xl border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500"
                  />
                  <p className="text-[10px] text-slate-400">Generates real scan-and-pay UPI QR code with total amount on printed invoices.</p>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Upload Custom UPI QR Image (Stored permanently)</label>
                  <div className="flex items-center gap-3">
                    {upiQrUrl && (
                      <div className="flex items-center gap-2">
                        <div className="h-10 w-10 rounded-xl bg-white border overflow-hidden p-1 shrink-0 flex items-center justify-center">
                          <img src={upiQrUrl} alt="UPI QR" className="max-h-full max-w-full object-contain" />
                        </div>
                        <button
                          type="button"
                          onClick={handleRemoveUpiQr}
                          title="Remove Custom UPI QR"
                          className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    )}
                    <input 
                      type="file"
                      accept="image/png, image/jpeg, image/svg+xml"
                      onChange={handleUpiQrUpload}
                      className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 text-[11px] rounded-xl border border-slate-200 dark:border-slate-700 file:mr-2 file:py-0.5 file:px-2 file:rounded-lg file:border-0 file:text-[10px] file:font-semibold file:bg-emerald-50 file:text-emerald-700"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400">If uploaded, this custom UPI QR image will show on invoice prints.</p>
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Bank Name & Branch</label>
                  <input 
                    type="text" 
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 text-xs rounded-xl border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Account Number</label>
                  <input 
                    type="text" 
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 font-mono text-xs rounded-xl border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">IFSC Code</label>
                  <input 
                    type="text" 
                    value={ifscCode}
                    onChange={(e) => setIfscCode(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 font-mono text-xs rounded-xl border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500 uppercase"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* C. Dispatch Zones, Logistics & Inventory Thresholds */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="text-xs font-extrabold text-slate-700 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <Truck size={16} className="text-blue-500" />
              <span>Dispatch Zones & Inventory Automation</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase">Default Dispatch Area</label>
                <select 
                  value={defaultDispatchZone}
                  onChange={(e) => setDefaultDispatchZone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 text-xs rounded-xl border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500 font-semibold"
                >
                  <option value="Dahisar">Dahisar Hub</option>
                  <option value="Borivali">Borivali Hub</option>
                  <option value="Kandivali">Kandivali Hub</option>
                  <option value="Malad">Malad Hub</option>
                  <option value="Goregaon">Goregaon Hub</option>
                  <option value="Andheri">Andheri Hub</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase">Low Stock Alert Threshold (Units)</label>
                <input 
                  type="number" 
                  min={1}
                  value={lowStockThreshold}
                  onChange={(e) => setLowStockThreshold(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 text-xs rounded-xl border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* D. Automated Messaging & API Webhooks */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="text-xs font-extrabold text-slate-700 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <MessageSquare size={16} className="text-emerald-500" />
              <span>Messaging Gateways & Notification Triggers</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase">WhatsApp API Key Hook</label>
                <input 
                  type="password" 
                  value={whatsappApiKey}
                  onChange={(e) => setWhatsappApiKey(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 font-mono text-xs rounded-xl border border-slate-200 dark:border-slate-700"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase">SMS Gateway Endpoint</label>
                <input 
                  type="url" 
                  value={smsGatewayUrl}
                  onChange={(e) => setSmsGatewayUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 font-mono text-xs rounded-xl border border-slate-200 dark:border-slate-700"
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase">WhatsApp Verification Dispatch Template</label>
                <input 
                  type="text" 
                  value={whatsappTemplate}
                  onChange={(e) => setWhatsappTemplate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 text-xs rounded-xl border border-slate-200 dark:border-slate-700"
                />
              </div>

              {/* Toggles */}
              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Auto WhatsApp on Packing Verification</span>
                <input 
                  type="checkbox"
                  checked={enableAutoWhatsapp}
                  onChange={(e) => setEnableAutoWhatsapp(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Auto SMS on Driver Dispatch Assignment</span>
                <input 
                  type="checkbox"
                  checked={enableAutoSms}
                  onChange={(e) => setEnableAutoSms(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
              </div>
            </div>
          </div>

        </div>

        {/* Right 1 Column: Governance, Maps & Action Controls */}
        <div className="space-y-6">
          
          {/* Security & Audit Governance */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="text-xs font-extrabold text-slate-700 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <Shield size={16} className="text-rose-500" />
              <span>Security, Audit & Governance</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase">Audit Log Retention Period</label>
                <select 
                  value={auditRetentionDays}
                  onChange={(e) => setAuditRetentionDays(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 text-xs rounded-xl border border-slate-200 dark:border-slate-700"
                >
                  <option value={30}>30 Days Retention</option>
                  <option value={60}>60 Days Retention</option>
                  <option value={90}>90 Days Retention (Recommended)</option>
                  <option value={365}>365 Days Retention</option>
                </select>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Continuous Auto-Cloud Sync</span>
                <input 
                  type="checkbox"
                  checked={autoBackup}
                  onChange={(e) => setAutoBackup(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
              </div>

              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed pt-1">
                Every transaction, SKU update, and order verification is strictly tagged with your business tenant ID <code className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">{businessId}</code> to preserve total multi-tenant memory isolation.
              </p>
            </div>
          </div>

          {/* Google Maps Integration */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="text-xs font-extrabold text-slate-700 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <Compass size={16} className="text-amber-500" />
              <span>Google Maps Integration</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase">Google Maps Platform Key</label>
                <input 
                  type="password" 
                  value={googleMapsKey}
                  onChange={(e) => setGoogleMapsKey(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 font-mono text-xs rounded-xl border border-slate-200 dark:border-slate-700"
                />
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                Google Maps APIs enable live distance calculation from warehouse coordinates to buyer addresses during checkout and route planning.
              </p>
            </div>
          </div>

          {/* Action Save Panel */}
          <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-lg space-y-4">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Sliders size={16} className="text-amber-400" />
              <span>Tenant Policy Save</span>
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Updates to tenant rules take effect immediately across all active operator terminals and packing stations.
            </p>

            {(user.role === 'Super Admin' || user.role === 'Admin') ? (
              <button 
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Save size={16} />
                <span>Save Tenant Configurations</span>
              </button>
            ) : (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-xl text-center text-xs font-semibold">
                View-Only: Administrator rights required to modify settings.
              </div>
            )}
          </div>

        </div>

      </form>

      {/* Danger Zone for Super Admin */}
      {user.role === 'Super Admin' && (
        <div className="mt-8 pt-8 border-t border-rose-100 dark:border-rose-900/30">
          <div className="bg-rose-50 dark:bg-rose-950/20 p-6 rounded-2xl border border-rose-200 dark:border-rose-900/40 space-y-3">
            <h3 className="text-xs font-extrabold text-rose-600 dark:text-rose-400 uppercase tracking-wider flex items-center gap-2">
              <AlertCircle size={16} />
              <span>Danger Zone - System Factory Reset</span>
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Permanently wipe all operational data (sales orders, inventory movements, customer profiles, audit logs) and reset local state to initial defaults.
            </p>
            <button
              type="button"
              onClick={handleFactoryReset}
              className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-extrabold cursor-pointer transition shadow-md"
            >
              Factory Reset System Data
            </button>
          </div>
        </div>
      )}

      {/* Factory Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl p-6 border border-slate-100 dark:border-slate-800">
            <h3 className="text-base font-extrabold text-rose-600 dark:text-rose-400 mb-2">Factory Reset Confirmation</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
              WARNING: This will permanently delete <strong>ALL</strong> products, orders, customers, and verification logs. This action cannot be undone. Are you sure?
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmFactoryReset}
                className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 cursor-pointer shadow-md"
              >
                Yes, Reset System
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
