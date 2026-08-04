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
  Trash2,
  Plus,
  X
} from 'lucide-react';
import { dbStore } from '../services/store';
import { Business, UserProfile } from '../types/erp';
import { compressImageFile } from '../utils/imageCompressor';
import { uploadFileToSupabaseStorage, supabase, isSupabaseConfigured } from '../services/supabase';

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
  const [invoicePrefix, setInvoicePrefix] = useState(business?.invoice_prefix || 'KOK-');
  const [festiveInvoicePrefix, setFestiveInvoicePrefix] = useState(business?.festive_invoice_prefix || 'FEST-KF-');
  const [taxRateDefault, setTaxRateDefault] = useState<number>(business?.tax_rate_default ?? 18);
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
  const [enableDdr, setEnableDdr] = useState<boolean>(business?.enable_ddr ?? false);
  const [ddrStartDate, setDdrStartDate] = useState<string>(business?.ddr_start_date || '2026-10-01');
  const [ddrEndDate, setDdrEndDate] = useState<string>(business?.ddr_end_date || '2026-10-20');
  const [defaultDispatchZone, setDefaultDispatchZone] = useState<string>(business?.default_dispatch_zone || 'Dahisar');
  
  // Dynamic Area Zone Locations
  const [areaZones, setAreaZones] = useState<string[]>(
    business?.area_zones && business.area_zones.length > 0 
      ? business.area_zones 
      : ['Dahisar', 'Borivali', 'Kandivali', 'Mira Road', 'Vasai', 'Virar', 'Malad', 'Goregaon', 'Andheri']
  );
  const [newAreaInput, setNewAreaInput] = useState('');

  // Tenant Payment & UPI QR Configurations
  const [upiId, setUpiId] = useState(business?.upi_id || '9820769697@okicici');
  const [upiQrUrl, setUpiQrUrl] = useState(business?.upi_qr_url || '');
  const [bankName, setBankName] = useState(business?.bank_name || 'NKGSB COOPERATIVE BANK LIMITED, DAHISAR EAST ASHOKVAN');
  const [accountNumber, setAccountNumber] = useState(business?.account_number || '092110100000085');
  const [ifscCode, setIfscCode] = useState(business?.ifsc_code || 'NKGS0000092');
  const [accountHolder, setAccountHolder] = useState(business?.account_holder || business?.name || 'Kokanastha Faral & Sweets');

  // API Integration configurations
  const [whatsappApiKey, setWhatsappApiKey] = useState(business?.whatsapp_api_key || 'WA_LIVE_KEY_OMNIPACK_SIM_2026');
  const [whatsappTemplate, setWhatsappTemplate] = useState(business?.whatsapp_template || 'Dear {{1}}, your order {{2}} has been packed!');
  const [smsGatewayUrl, setSmsGatewayUrl] = useState(business?.sms_gateway_url || 'https://api.sms-gateway.in/v1/send');
  const [googleMapsKey, setGoogleMapsKey] = useState(business?.google_maps_key || 'AIzaSy_SimulatedMapKey_Omnipack');

  const syncFromBusiness = (bId: string) => {
    const updated = dbStore.getBusiness(bId);
    if (updated) {
      setBusiness(updated);
      setName(updated.name || '');
      setGstin(updated.gstin || '');
      setPan(updated.pan || '');
      setInvoicePrefix(updated.invoice_prefix || 'KF-');
      setFestiveInvoicePrefix(updated.festive_invoice_prefix || 'FEST-KF-');
      setTaxRateDefault(updated.tax_rate_default ?? 5);
      setBillingAddress(updated.billing_address || '');
      setLogoUrl(updated.logo_url || '');
      setLoginCoverUrl(updated.login_cover_url || '');
      setCurrencySymbol(updated.currency_symbol || '₹');
      setAutoBackup(updated.auto_backup ?? true);
      setLowStockThreshold(updated.low_stock_threshold || 20);
      setAuditRetentionDays(updated.audit_retention_days || 90);
      setDefaultTheme(updated.default_theme || 'midnight-gold');
      setEnableAutoWhatsapp(updated.enable_auto_whatsapp ?? true);
      setEnableAutoSms(updated.enable_auto_sms ?? true);
      setEnableDdr(updated.enable_ddr ?? false);
      setDdrStartDate(updated.ddr_start_date || '2026-10-01');
      setDdrEndDate(updated.ddr_end_date || '2026-10-20');
      setDefaultDispatchZone(updated.default_dispatch_zone || 'Dahisar');
      if (updated.area_zones && updated.area_zones.length > 0) {
        setAreaZones(updated.area_zones);
      }
      setUpiId(updated.upi_id || '');
      setUpiQrUrl(updated.upi_qr_url || '');
      setBankName(updated.bank_name || '');
      setAccountNumber(updated.account_number || '');
      setIfscCode(updated.ifsc_code || '');
      setAccountHolder(updated.account_holder || '');
      setWhatsappApiKey(updated.whatsapp_api_key || 'WA_LIVE_KEY_OMNIPACK_SIM_2026');
      setWhatsappTemplate(updated.whatsapp_template || 'Dear {{1}}, your order {{2}} has been packed!');
      setSmsGatewayUrl(updated.sms_gateway_url || 'https://api.sms-gateway.in/v1/send');
      setGoogleMapsKey(updated.google_maps_key || 'AIzaSy_SimulatedMapKey_Omnipack');
    }
  };

  useEffect(() => {
    syncFromBusiness(businessId);
  }, [businessId]);

  const handleAddAreaZone = () => {
    const trimmed = newAreaInput.trim();
    if (!trimmed) return;
    if (areaZones.some(a => a.toLowerCase() === trimmed.toLowerCase())) {
      triggerToast(`Area Zone "${trimmed}" already exists.`, 'info');
      return;
    }
    const updated = [...areaZones, trimmed];
    setAreaZones(updated);
    setNewAreaInput('');
    try {
      dbStore.updateBusiness(businessId, { area_zones: updated });
      triggerToast(`Added Area Zone Location "${trimmed}".`, 'success');
    } catch (err: any) {
      triggerToast(err.message || 'Failed to update Area Zone.', 'error');
    }
  };

  const handleRemoveAreaZone = (zoneToRemove: string) => {
    if (areaZones.length <= 1) {
      triggerToast('At least one Area Zone Location is required.', 'error');
      return;
    }
    const updated = areaZones.filter(z => z !== zoneToRemove);
    setAreaZones(updated);
    let newDefault = defaultDispatchZone;
    if (defaultDispatchZone === zoneToRemove) {
      newDefault = updated[0] || 'Dahisar';
      setDefaultDispatchZone(newDefault);
    }
    try {
      dbStore.updateBusiness(businessId, { area_zones: updated, default_dispatch_zone: newDefault });
      triggerToast(`Removed Area Zone Location "${zoneToRemove}".`, 'info');
    } catch (err: any) {
      triggerToast(err.message || 'Failed to remove Area Zone.', 'error');
    }
  };

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

  const confirmFactoryReset = async () => {
    setIsSyncing(true);
    await dbStore.clearAllAndReset(businessId);
    triggerToast('System factory reset complete. Reloading...', 'success');
    if (isSupabaseConfigured && supabase) {
      await supabase.channel('schema-db-changes').send({
        type: 'broadcast',
        event: 'factory_reset',
        payload: { businessId }
      });
    }
    setShowResetConfirm(false);
    setIsSyncing(false);
    setTimeout(() => window.location.reload(), 1500);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();

    if (user.role !== 'Super Admin') {
      triggerToast('Unauthorized: Only Super Admins can modify organization-wide tenant parameters.', 'error');
      return;
    }

    try {
      dbStore.updateBusiness(businessId, {
        name: name.trim(),
        gstin: gstin.toUpperCase().trim().substring(0, 15),
        pan: pan.toUpperCase().trim().substring(0, 10),
        invoice_prefix: invoicePrefix.toUpperCase().trim().substring(0, 10),
        festive_invoice_prefix: festiveInvoicePrefix.toUpperCase().trim().substring(0, 50),
        tax_rate_default: Number(taxRateDefault),
        billing_address: billingAddress.trim(),
        logo_url: logoUrl,
        login_cover_url: loginCoverUrl,
        currency_symbol: currencySymbol.substring(0, 10),
        auto_backup: autoBackup,
        low_stock_threshold: Number(lowStockThreshold),
        audit_retention_days: Number(auditRetentionDays),
        default_theme: defaultTheme,
        enable_auto_whatsapp: enableAutoWhatsapp,
        enable_auto_sms: enableAutoSms,
        enable_ddr: enableDdr,
        ddr_start_date: ddrStartDate,
        ddr_end_date: ddrEndDate,
        default_dispatch_zone: defaultDispatchZone,
        area_zones: areaZones,
        upi_id: upiId.trim().substring(0, 255),
        upi_qr_url: upiQrUrl,
        bank_name: bankName.trim(),
        account_number: accountNumber.trim().substring(0, 100),
        ifsc_code: ifscCode.trim().substring(0, 50),
        account_holder: accountHolder.trim().substring(0, 255),
        whatsapp_api_key: whatsappApiKey.trim(),
        whatsapp_template: whatsappTemplate.trim(),
        sms_gateway_url: smsGatewayUrl.trim(),
        google_maps_key: googleMapsKey.trim()
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
      syncFromBusiness(businessId);
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
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-bold uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Tenant RLS Active
            </span>
          </div>
        }
      />

      <div className="px-0.5 sm:px-1 space-y-6">
      {/* ================= ADVANCED TENANT SETTINGS FORM ================= */}
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
                    accept="image/*"
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
                    accept="image/*"
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

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase">Standard Invoice Prefix</label>
                <input 
                  type="text" 
                  required
                  value={invoicePrefix}
                  onChange={(e) => setInvoicePrefix(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 font-mono text-xs rounded-xl border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500 uppercase"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase flex items-center gap-1">
                  <span>Festive Invoice Prefix</span>
                </label>
                <input 
                  type="text" 
                  value={festiveInvoicePrefix}
                  onChange={(e) => setFestiveInvoicePrefix(e.target.value)}
                  placeholder="FEST-KF-"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 font-mono text-xs rounded-xl border border-amber-300 dark:border-amber-700 focus:ring-2 focus:ring-amber-500 uppercase"
                />
              </div>

              {/* Diwali Discount Rate (DDR) Auto-Pricing Settings */}
              <div className="col-span-1 sm:col-span-2 lg:col-span-4 p-4 bg-amber-50/70 dark:bg-amber-950/30 rounded-2xl border border-amber-200 dark:border-amber-800 space-y-3">
                <div className="flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
                  <div className="flex items-center gap-2">
                    <Sparkles className="text-amber-600 dark:text-amber-400 shrink-0" size={18} />
                    <div>
                      <h4 className="text-xs font-black text-amber-950 dark:text-amber-200 uppercase tracking-wide">
                        Diwali Discount Rate (DDR) Auto-Festival Pricing
                      </h4>
                      <p className="text-[10px] text-amber-700 dark:text-amber-300 font-medium">
                        Automatically applies Diwali Discount Rate (DDR) during your configured festival dates on Create Order
                      </p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input 
                      type="checkbox" 
                      checked={enableDdr} 
                      onChange={(e) => setEnableDdr(e.target.checked)} 
                      className="sr-only peer" 
                    />
                    <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600"></div>
                  </label>
                </div>

                {enableDdr && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-amber-200/60 dark:border-amber-800/60">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-amber-800 dark:text-amber-300 uppercase">
                        Festive Start Date (e.g. 1st Oct)
                      </label>
                      <input 
                        type="date" 
                        value={ddrStartDate}
                        onChange={(e) => setDdrStartDate(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 text-xs font-mono font-bold text-slate-800 dark:text-slate-200 rounded-xl border border-amber-300 dark:border-amber-700 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-amber-800 dark:text-amber-300 uppercase">
                        Festive End Date (e.g. 20th Oct)
                      </label>
                      <input 
                        type="date" 
                        value={ddrEndDate}
                        onChange={(e) => setDdrEndDate(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 text-xs font-mono font-bold text-slate-800 dark:text-slate-200 rounded-xl border border-amber-300 dark:border-amber-700 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase">Default Tax Rate (%)</label>
                <select 
                  value={taxRateDefault}
                  onChange={(e) => setTaxRateDefault(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 text-xs rounded-xl border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500 font-medium"
                >
                  <option value={0}>0% GST (Exempted / Zero Tax)</option>
                  <option value={5}>5% GST (Sweets, Faral & Foods)</option>
                  <option value={12}>12% GST (Processed Foods & Goods)</option>
                  <option value={18}>18% GST (Standard Commercial Goods)</option>
                  <option value={28}>28% GST (Luxury / De merit Items)</option>
                </select>
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

              <div className="space-y-1 sm:col-span-3">
                <label className="text-[11px] font-bold text-slate-500 uppercase">System Theme Preset</label>
                <select 
                  value={defaultTheme}
                  onChange={(e) => setDefaultTheme(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 text-xs rounded-xl border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500 font-medium"
                >
                  <option value="midnight-gold">✨ Midnight Gold (Luxury Dark Canvas)</option>
                  <option value="emerald-erp">🌿 Emerald ERP (Corporate Green Accent)</option>
                  <option value="sapphire-enterprise">💎 Sapphire Enterprise (Classic Royal Blue)</option>
                  <option value="dark-twilight">🌙 Dark Twilight (Minimalist Obsidian)</option>
                  <option value="slate-light">☀️ Slate Light (Clean Modern White)</option>
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
                      accept="image/*"
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
                  {areaZones.map(zone => (
                    <option key={zone} value={zone}>📍 {zone} Zone</option>
                  ))}
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

            {/* Area Zone Location Management */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <MapPin size={14} className="text-rose-500" />
                    <span>Area Zone Locations (Used in Create Order & Customer Profiles)</span>
                  </label>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Configure dispatch locations. These options populate the Area dropdown when creating sales orders.
                  </p>
                </div>
              </div>

              {/* Add Area Location Form */}
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="e.g. Mira Road, Thane West, Vasai East..."
                  value={newAreaInput}
                  onChange={(e) => setNewAreaInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddAreaZone();
                    }
                  }}
                  className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 text-xs rounded-xl border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-amber-500 font-medium"
                />
                <button
                  type="button"
                  onClick={handleAddAreaZone}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl transition flex items-center gap-1 shrink-0 cursor-pointer shadow-xs"
                >
                  <Plus size={14} />
                  <span>Add Location</span>
                </button>
              </div>

              {/* Active Area Zone Badges/Pills */}
              <div className="flex flex-wrap gap-2 pt-1">
                {areaZones.map((zone) => (
                  <span 
                    key={zone}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/60 text-xs font-bold rounded-full shadow-2xs"
                  >
                    <span>📍 {zone}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveAreaZone(zone)}
                      className="p-0.5 hover:bg-amber-200/60 dark:hover:bg-amber-800/60 text-amber-700 dark:text-amber-300 rounded-full transition cursor-pointer"
                      title={`Remove ${zone}`}
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* D. Automated Messaging & API Webhooks */}
          {/* <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
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
          </div> */}

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
            </div>
          </div>

          {/* Google Maps Integration */}
          {/* <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
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
          </div> */}

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
      {/* {user.role === 'Super Admin' && (
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
      )} */}

      </div>

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
