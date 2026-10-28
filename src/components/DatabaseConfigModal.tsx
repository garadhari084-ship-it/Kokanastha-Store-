import React, { useState, useEffect } from 'react';
import { 
  Database, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  X, 
  Key, 
  ExternalLink,
  Trash2,
  Check,
  UploadCloud,
  AlertTriangle,
  RotateCw
} from 'lucide-react';
import { 
  getSupabaseConfig, 
  saveSupabaseConfig, 
  clearSupabaseConfig, 
  testSupabaseConnection, 
  isSupabaseConfigured,
  getSupabaseProjectRef
} from '../services/supabase';
import { dbStore } from '../services/store';

interface DatabaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const DatabaseConfigModal: React.FC<DatabaseConfigModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const currentConfig = getSupabaseConfig();
  const [url, setUrl] = useState(currentConfig.url);
  const [key, setKey] = useState(currentConfig.key);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; isDatabaseNotUsable?: boolean; projectRef?: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncingOrders, setIsSyncingOrders] = useState(false);
  const [ordersSyncStatus, setOrdersSyncStatus] = useState<string | null>(null);

  const currentProjectRef = getSupabaseProjectRef();

  // Test on mount if configured
  useEffect(() => {
    if (isOpen && url.trim() && key.trim()) {
      testSupabaseConnection(url, key).then(res => {
        if (!res.success) {
          setTestResult({
            success: false,
            message: res.error || 'Connection failed',
            isDatabaseNotUsable: res.isDatabaseNotUsable,
            projectRef: res.projectRef || currentProjectRef
          });
        }
      }).catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSyncAllOrders = async () => {
    setIsSyncingOrders(true);
    setOrdersSyncStatus(null);
    try {
      const res = await dbStore.syncAllOrdersToSupabase();
      if (res.success) {
        setOrdersSyncStatus(`Successfully uploaded ${res.count} orders to your Supabase database!`);
      } else {
        setOrdersSyncStatus(`Sync failed: ${res.error}`);
      }
    } catch (err: any) {
      setOrdersSyncStatus(`Error: ${err.message || 'Failed to sync orders'}`);
    } finally {
      setIsSyncingOrders(false);
    }
  };

  const handleTest = async () => {
    if (!url.trim() || !key.trim()) {
      setTestResult({ success: false, message: 'Please enter both the Project URL and Anon API Key.' });
      return;
    }
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await testSupabaseConnection(url, key);
      if (res.success) {
        setTestResult({ success: true, message: 'Connected successfully to Supabase database!' });
      } else {
        setTestResult({ 
          success: false, 
          message: res.error || 'Connection failed.',
          isDatabaseNotUsable: res.isDatabaseNotUsable,
          projectRef: res.projectRef || currentProjectRef
        });
      }
    } catch (err: any) {
      setTestResult({ success: false, message: err.message || 'Connection test failed.' });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = async () => {
    if (!url.trim() || !key.trim()) {
      setTestResult({ success: false, message: 'Please enter both the Project URL and Anon API Key.' });
      return;
    }
    setIsSaving(true);
    try {
      await saveSupabaseConfig(url, key);
      if (onSuccess) onSuccess();
      // Reload window so all services, realtime listeners and stores initialize with the new credentials
      window.location.reload();
    } catch (err: any) {
      setTestResult({ success: false, message: 'Failed to save configuration: ' + err.message });
      setIsSaving(false);
    }
  };

  const handleDisconnect = async () => {
    if (window.confirm('Are you sure you want to disconnect the cloud database? The app will switch to local mode.')) {
      await clearSupabaseConfig();
      window.location.reload();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-emerald-700 to-teal-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-xl">
              <Database className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <h3 className="font-bold text-base tracking-tight">Cloud Database Connection</h3>
              <p className="text-xs text-emerald-100/90 font-medium">Save all store data directly to your database</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[80vh]">
          {/* Status Badge */}
          <div className="flex items-center justify-between p-3.5 rounded-xl border bg-slate-50 border-slate-200">
            <div className="flex items-center gap-2.5">
              <div className={`w-3 h-3 rounded-full ${isSupabaseConfigured ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50' : 'bg-amber-500 shadow-sm shadow-amber-500/50'}`} />
              <span className="text-xs font-semibold text-slate-700">
                Current Status: <span className={isSupabaseConfigured ? 'text-emerald-700 font-bold' : 'text-amber-700 font-bold'}>{isSupabaseConfigured ? 'Connected to Cloud DB' : 'Not Connected (Local Sandbox)'}</span>
              </span>
            </div>
            {isSupabaseConfigured && (
              <button
                type="button"
                onClick={handleDisconnect}
                className="text-xs font-semibold text-rose-600 hover:text-rose-800 flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" /> Disconnect
              </button>
            )}
          </div>

          {/* Sync All Orders to Database Action */}
          {isSupabaseConfigured && (
            <div className="p-3.5 rounded-xl border border-indigo-100 bg-indigo-50/60 dark:bg-indigo-950/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-xs font-bold text-indigo-950 dark:text-indigo-200">Sync All Orders to Database</h4>
                <p className="text-[11px] text-indigo-700/80 dark:text-indigo-300">Push all local sales orders and items directly to Supabase cloud</p>
              </div>
              <button
                type="button"
                onClick={handleSyncAllOrders}
                disabled={isSyncingOrders}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-xs shrink-0"
              >
                {isSyncingOrders ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UploadCloud className="w-3.5 h-3.5" />}
                {isSyncingOrders ? 'Uploading...' : 'Sync Orders Now'}
              </button>
            </div>
          )}

          {ordersSyncStatus && (
            <div className="p-3 rounded-xl border text-xs bg-slate-50 border-slate-200 text-slate-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{ordersSyncStatus}</span>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Supabase Project URL
              </label>
              <div className="relative">
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://your-project-ref.supabase.co"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                />
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">
                Found in your Supabase Dashboard: Project Settings &gt; API &gt; Project URL
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Supabase Anon / Public API Key
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                />
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">
                Found in your Supabase Dashboard: Project Settings &gt; API &gt; Project API keys &gt; anon / public
              </span>
            </div>
          </div>

          {/* Test Result Notice */}
          {testResult && (
            <div className={`p-4 rounded-xl border text-xs flex flex-col gap-2.5 ${
              testResult.success 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                : testResult.isDatabaseNotUsable
                ? 'bg-amber-50 border-amber-300 text-amber-950'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}>
              <div className="flex items-start gap-2.5">
                {testResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                ) : testResult.isDatabaseNotUsable ? (
                  <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm mb-1">
                    {testResult.success 
                      ? 'Database Connection Successful' 
                      : testResult.isDatabaseNotUsable 
                      ? 'Supabase Health Error: Database Not Usable' 
                      : 'Connection Failed'}
                  </div>
                  <span className="font-medium leading-relaxed block">{testResult.message}</span>
                </div>
              </div>

              {testResult.isDatabaseNotUsable && (
                <div className="mt-2 pt-2.5 border-t border-amber-200/80 space-y-2">
                  <p className="text-[11px] font-semibold text-amber-900">
                    Why this happens: Your Supabase PostgreSQL database project is paused or sleeping and did not accept connection.
                  </p>
                  <div className="bg-white/90 p-3 rounded-lg border border-amber-200 text-[11px] text-amber-900 space-y-1">
                    <p className="font-bold text-amber-950">How to fix in 1 minute:</p>
                    <ol className="list-decimal pl-4 space-y-1">
                      <li>Click the button below to open your Supabase Project Settings</li>
                      <li>Click <strong className="text-amber-950">"Restart Project"</strong> (or "Restore Project" if paused)</li>
                      <li>Wait ~60 seconds for status to turn active, then return here and click <strong className="text-amber-950">"Test Connection"</strong> & <strong className="text-amber-950">"Sync Orders Now"</strong></li>
                    </ol>
                  </div>
                  <div className="flex items-center gap-2 pt-1 flex-wrap">
                    <a
                      href={`https://supabase.com/dashboard/project/${testResult.projectRef || currentProjectRef}/project-settings/general`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition inline-flex items-center gap-1.5 shadow-xs"
                    >
                      Open Supabase Settings to Restart <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                    <a
                      href={`https://supabase.com/dashboard/project/${testResult.projectRef || currentProjectRef}/advisors/health`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 bg-white border border-amber-300 hover:bg-amber-100 text-amber-900 rounded-lg text-xs font-bold transition inline-flex items-center gap-1.5"
                    >
                      View Health Advisor <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Helper Tips */}
          <div className="p-4 bg-emerald-50/70 border border-emerald-100 rounded-xl text-xs text-emerald-900 space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-emerald-950">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>No .env File Required</span>
            </div>
            <p className="text-emerald-800 text-[11px] leading-relaxed">
              Your credentials will be saved directly into the application so that all orders, inventory, products, and customer records persist in your Supabase cloud database automatically across all your devices.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleTest}
            disabled={isTesting || !url.trim() || !key.trim()}
            className="px-4 py-2.5 border border-slate-300 text-slate-700 bg-white hover:bg-slate-100 disabled:opacity-50 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
          >
            {isTesting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Key className="w-3.5 h-3.5" />}
            Test Connection
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-slate-600 hover:text-slate-800 text-xs font-semibold rounded-xl hover:bg-slate-200/60 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving || !url.trim() || !key.trim()}
              className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-sm hover:shadow transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer"
            >
              {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              Save &amp; Connect Database
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
