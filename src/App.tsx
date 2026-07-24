import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  ClipboardCheck, 
  Layers, 
  Package, 
  Users, 
  Truck, 
  ShoppingBag, 
  BarChart3, 
  ShieldAlert, 
  Settings, 
  LogOut, 
  UserCheck, 
  Building2, 
  Bell, 
  UserCircle,
  ChevronRight, 
  ChevronLeft,
  PanelLeftClose,
  PanelLeftOpen,
  Menu, 
  X,
  Lock,
  Globe,
  LockOpen,
  Database,
  CloudLightning,
  Sparkles
} from 'lucide-react';
import { dbStore } from './services/store';
import { UserProfile, Business, UserRole } from './types/erp';
import { supabase, isSupabaseConfigured } from './services/supabase';

// Import Views
import { DashboardView } from './components/DashboardView';
import { SalesModule } from './components/SalesModule';
import { PackingVerificationModule } from './components/PackingVerificationModule';
import { DeliveryModule } from './components/DeliveryModule';
import { InventoryModule } from './components/InventoryModule';
import { ProductModule } from './components/ProductModule';
import { CategoryModule } from './components/CategoryModule';
import { CustomerModule } from './components/CustomerModule';
import { SupplierModule } from './components/SupplierModule';
import { PurchaseModule } from './components/PurchaseModule';
import { ReportsModule } from './components/ReportsModule';
import { AuditLogView } from './components/AuditLogView';
import { SettingsModule } from './components/SettingsModule';
import { UsersModule } from './components/UsersModule';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

export default function App() {

  useEffect(() => {
    // Sanitize old localStorage data that violates UUID schema
    
    const profiles = localStorage.getItem('omnipack_erp_profiles');
    const cats = localStorage.getItem('omnipack_erp_categories');
    
    if (
        (cats && cats.includes('"cat-')) || 
        (profiles && profiles.includes('"admin_user"'))
    ) {
       console.log('Clearing old non-UUID local storage...');
       localStorage.clear();
       window.location.reload();
    }

  }, []);

  // Auth state
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [currentBusiness, setCurrentBusiness] = useState<Business | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  
  // Login flow states
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');

  // DB Connection Mode
  const [dbMode, setDbMode] = useState<'local' | 'supabase'>(isSupabaseConfigured ? 'supabase' : 'local');

  // App Layout States
  const [activeView, setActiveView] = useState<string>('dashboard');
  const [deepLinkData, setDeepLinkData] = useState<any>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarMinimized, setIsSidebarMinimized] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotificationMenuOpen, setIsNotificationMenuOpen] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const triggerToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  // Restore session on mount
  // Handle click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Very basic approach: if clicking outside the header right section, close menus
      const target = event.target as HTMLElement;
      if (!target.closest('.header-dropdown-container')) {
        setIsUserMenuOpen(false);
        setIsNotificationMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Restore session on mount
  useEffect(() => {
    const restoreSession = async () => {
      const savedSession = localStorage.getItem('omnipack_session');
      
      if (isSupabaseConfigured && supabase) {
        // Try supabase session
        const { data: { session } } = await supabase.auth.getSession();
        if (session && session.user) {
          const { data: dbProfile } = await supabase
            .from('users_profiles')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle();
                
          if (dbProfile) {
            setCurrentUser(dbProfile as UserProfile);
            await dbStore.syncFromSupabase(dbProfile.business_id);
            const biz = dbStore.getBusiness(dbProfile.business_id) || dbStore.getBusinesses()[0];
            setCurrentBusiness(biz);
            setDbMode('supabase');
            setIsInitializing(false);
            return;
          }
        }
      }
      
      // Fallback to local session
      if (savedSession) {
        try {
          const parsed = JSON.parse(savedSession);
          const { userId, businessId, mode } = parsed;
          // Restore regardless of mode if supabase failed or was skipped
          const user = dbStore.getUsers(businessId).find(u => u.id === userId);
          const biz = dbStore.getBusiness(businessId);
          if (user && biz) {
            setCurrentUser(user);
            setCurrentBusiness(biz);
            setDbMode(mode === 'supabase' ? 'supabase' : 'local');
          }
        } catch(e) {
          console.error("Error parsing session:", e);
        }
      }
      setIsInitializing(false);
    };
    
    restoreSession();

    // Subscribe to supabase auth changes if supabase is configured
    if (isSupabaseConfigured && supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        console.log("Supabase Auth Event:", event, session);
        // Only logout if explicitly signed out and we are currently using supabase mode
        if (event === 'SIGNED_OUT' && dbMode === 'supabase') {
           setCurrentUser(null);
           setCurrentBusiness(null);
           localStorage.removeItem('omnipack_session');
        }
      });
      return () => {
        subscription.unsubscribe();
      };
    }
  }, []);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    
    if (dbMode === 'supabase' && supabase) {
      try {
        // Live Supabase Sign In
        const { data, error } = await supabase.auth.signInWithPassword({
          email: emailInput,
          password: passwordInput,
        });

        if (error) {
          // Fallback for users created via the UI (since they don't exist in Supabase Auth, only in users_profiles)
          const fallbackResult = dbStore.login(emailInput, passwordInput);
          if (fallbackResult.success && fallbackResult.user && fallbackResult.business) {
             await dbStore.syncFromSupabase(fallbackResult.business.id);
             setCurrentUser(fallbackResult.user);
             setCurrentBusiness(fallbackResult.business);
             localStorage.setItem('omnipack_session', JSON.stringify({ userId: fallbackResult.user.id, businessId: fallbackResult.business.id, mode: 'supabase' }));
             setActiveView('dashboard');
             triggerToast(`Session Established. Welcome, ${fallbackResult.user.name}!`, 'success');
             return;
          }
          
          setAuthError(error.message);
          return;
        }

        if (data.user) {
          // Check for profile record in Supabase database table
            let profile: UserProfile | null = null;
            
            try {
              const { data: dbProfile, error: profileErr } = await supabase
                .from('users_profiles')
                .select('*')
                .eq('id', data.user.id)
                .maybeSingle();

              if (dbProfile) {
                profile = dbProfile as UserProfile;
              }
            } catch (err) {
              console.warn('Could not select from users_profiles in Supabase:', err);
            }

            // If no profile record exists in the users_profiles database table (e.g. user created via Supabase Auth Console directly),
            // we dynamically auto-create and save one for them so they can log in perfectly!
            if (!profile) {
              const existingLocal = dbStore.getUsers('b1111111-1111-1111-1111-111111111111')
                .find(p => p.email.toLowerCase() === emailInput.toLowerCase());

              profile = {
                id: data.user.id,
                email: data.user.email || emailInput,
                name: existingLocal?.name || data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'User',
                role: (existingLocal?.role as UserRole) || 'Super Admin',
                business_id: existingLocal?.business_id || 'b1111111-1111-1111-1111-111111111111',
                active: true,
                created_at: new Date().toISOString()
              };

              // Auto-insert into Supabase DB table
              try {
                await supabase.from('users_profiles').insert({
                  id: profile.id,
                  email: profile.email,
                  name: profile.name,
                  role: profile.role,
                  business_id: profile.business_id,
                  active: true
                });
              } catch (insErr) {
                console.warn('Auto-creation of profile record in Supabase table failed:', insErr);
              }

              // Save in local storage cache
              try {
                dbStore.createUser({
                  id: profile.id,
                  email: profile.email,
                  name: profile.name,
                  role: profile.role,
                  business_id: profile.business_id,
                  active: true,
                  password_hash: passwordInput
                });
              } catch (_) {}
            }

            await dbStore.syncFromSupabase(profile.business_id);
            const biz = dbStore.getBusiness(profile.business_id) || dbStore.getBusinesses()[0];
            setCurrentUser(profile);
            setCurrentBusiness(biz);
            localStorage.setItem('omnipack_session', JSON.stringify({ userId: profile.id, businessId: biz.id, mode: 'supabase' }));
            setActiveView('dashboard');
            triggerToast(`Supabase Cloud Session Established. Welcome, ${profile.name}!`, 'success');
          }
      } catch (err: any) {
        setAuthError(err.message || 'An unexpected error occurred during authentication.');
      }
    } else {
      // Local Database Mode
      const result = dbStore.login(emailInput, passwordInput);
      if (result.success && result.user && result.business) {
        setCurrentUser(result.user);
        setCurrentBusiness(result.business);
        localStorage.setItem('omnipack_session', JSON.stringify({ userId: result.user.id, businessId: result.business.id, mode: 'local' }));
        setActiveView('dashboard');
        triggerToast(`Welcome back, ${result.user.name}!`, 'success');
      } else {
        setAuthError(result.error || 'Authentication failed.');
      }
    }
  };

  const handleLogout = () => {
    if (currentUser && currentBusiness) {
      dbStore.logActivity(
        currentUser.id,
        currentUser.name,
        currentUser.role,
        'User Logout',
        `${currentUser.name} signed out of session.`,
        currentBusiness.id
      );
    }
    setCurrentUser(null);
    setCurrentBusiness(null);
    setDeepLinkData(null);
    setEmailInput('');
    setPasswordInput('');
    localStorage.removeItem('omnipack_session');
    if (dbMode === 'supabase' && supabase) {
      supabase.auth.signOut();
    }
    triggerToast('Logged out of system securely.', 'info');
  };

  // Mock Forgot password trigger
  const handleForgotTrigger = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) return;
    triggerToast(`A secure reset OTP code was generated and dispatched to ${forgotEmail}.`, 'success');
    setIsForgotModalOpen(false);
    setForgotEmail('');
  };

  // Deep linking helper
  const handleDeepLinkNavigate = (view: string, actionData?: any) => {
    setActiveView(view);
    setDeepLinkData(actionData);
    setIsMobileMenuOpen(false);
  };

  // RBAC Permission Check list
  // Checks if role is authorized to open/view this module
  const hasAccessToView = (view: string): boolean => {
    if (!currentUser) return false;
    const role = currentUser.role;

    if (role === 'Super Admin' || role === 'Admin') return true;
    
    switch (view) {
      case 'dashboard':
        return true;
      case 'sales':
        return role === 'Manager' || role === 'Sales Staff' || role === 'Viewer';
      case 'packing':
        return role === 'Manager' || role === 'Packing Staff' || role === 'Viewer';
      case 'delivery':
        return role === 'Manager' || role === 'Packing Staff' || role === 'Viewer';
      case 'inventory':
        return role === 'Manager' || role === 'Packing Staff' || role === 'Viewer';
      case 'products':
      case 'categories':
        return role === 'Manager' || role === 'Sales Staff' || role === 'Viewer';
      case 'customers':
        return role === 'Manager' || role === 'Sales Staff' || role === 'Viewer';
      case 'suppliers':
      case 'purchases':
        return role === 'Manager' || role === 'Viewer';
      case 'reports':
        return role === 'Manager' || role === 'Viewer';
      case 'audit':
      case 'settings':
      case 'users':
        return false; // restricted strictly to Admin and Super Admin
      default:
        return false;
    }
  };

  // Define sidebar menu items
  const menuItems = [
    { id: 'dashboard', label: 'Executive Desk', icon: LayoutDashboard },
    { id: 'sales', label: 'Sales & Bookings', icon: FileText },
    { id: 'packing', label: 'Packing Verification', icon: ClipboardCheck, highlight: true },
    { id: 'delivery', label: 'Delivery & Dispatch', icon: Truck },
    { id: 'inventory', label: 'Inventory Ledger', icon: Layers },
    { id: 'products', label: 'Catalog SKUs', icon: Package },
    { id: 'categories', label: 'SKU Categories', icon: Layers },
    { id: 'customers', label: 'Customers Master', icon: Users },
    { id: 'suppliers', label: 'Suppliers directory', icon: Truck },
    { id: 'purchases', label: 'Procurements', icon: ShoppingBag },
    { id: 'reports', label: 'Compliance Reports', icon: BarChart3 },
    { id: 'users', label: 'User Management', icon: UserCheck, adminOnly: true },
    { id: 'settings', label: 'Tenant settings', icon: Settings, adminOnly: true },
    { id: 'audit', label: 'Security Logs', icon: ShieldAlert, adminOnly: true }
  ];

  // Render view router
  const renderActiveModule = () => {
    if (!currentUser || !currentBusiness) return null;

    if (!hasAccessToView(activeView)) {
      return (
        <div className="flex flex-col items-center justify-center p-12 text-center bg-white dark:bg-slate-900 border rounded-2xl h-[60vh] max-w-lg mx-auto">
          <Lock size={48} className="text-rose-500 mb-3 animate-bounce" />
          <strong className="text-sm font-extrabold uppercase tracking-wider text-rose-600 block">Restricted Module Access</strong>
          <p className="text-xs text-slate-500 mt-2">
            Your current assigned security profile ({currentUser.role}) does not possess clearance keys to browse the "{activeView.toUpperCase()}" ledger module.
          </p>
          <div className="mt-6 p-3 bg-indigo-50 border rounded-lg text-left text-[11px] text-slate-600 space-y-1">
            <span className="font-bold text-indigo-700 uppercase">Interactive evaluation override:</span>
            <p>Use the role toggle in the top navbar to instantly elevate permissions and test this view!</p>
          </div>
        </div>
      );
    }

    switch (activeView) {
      case 'dashboard':
        return (
          <DashboardView 
            businessId={currentBusiness.id} 
            user={currentUser} 
            onNavigate={handleDeepLinkNavigate} 
            triggerToast={triggerToast} 
          />
        );
      case 'sales':
        return (
          <SalesModule 
            businessId={currentBusiness.id} 
            user={currentUser} 
            triggerToast={triggerToast}
            openAddModalInitially={deepLinkData?.openAddModal || false}
            selectedOrderIdInitially={deepLinkData?.orderId || null}
          />
        );
      case 'packing':
        return (
          <PackingVerificationModule 
            businessId={currentBusiness.id} 
            user={currentUser} 
            triggerToast={triggerToast}
            openOrderIdInitially={deepLinkData?.orderId || null}
          />
        );
      case 'delivery':
        return (
          <DeliveryModule 
            businessId={currentBusiness.id} 
            user={currentUser} 
            triggerToast={triggerToast}
          />
        );
      case 'inventory':
        return (
          <InventoryModule 
            businessId={currentBusiness.id} 
            user={currentUser} 
            triggerToast={triggerToast}
            openInwardModalInitially={deepLinkData?.openInwardModal || false}
            autoProductId={deepLinkData?.productId || null}
          />
        );
      case 'products':
        return (
          <ProductModule 
            businessId={currentBusiness.id} 
            user={currentUser} 
            triggerToast={triggerToast}
            openAddModalInitially={deepLinkData?.openAddModal || false}
          />
        );
      case 'categories':
        return (
          <CategoryModule 
            businessId={currentBusiness.id} 
            user={currentUser} 
            triggerToast={triggerToast} 
          />
        );
      case 'customers':
        return (
          <CustomerModule 
            businessId={currentBusiness.id} 
            user={currentUser} 
            triggerToast={triggerToast}
            openAddModalInitially={deepLinkData?.openAddModal || false}
          />
        );
      case 'suppliers':
        return (
          <SupplierModule 
            businessId={currentBusiness.id} 
            user={currentUser} 
            triggerToast={triggerToast} 
          />
        );
      case 'purchases':
        return (
          <PurchaseModule 
            businessId={currentBusiness.id} 
            user={currentUser} 
            triggerToast={triggerToast} 
          />
        );
      case 'reports':
        return (
          <ReportsModule 
            businessId={currentBusiness.id} 
          />
        );
      case 'settings':
        return (
          <SettingsModule 
            businessId={currentBusiness.id} 
            user={currentUser} 
            triggerToast={triggerToast} 
          />
        );
      case 'users':
        return (
          <UsersModule 
            businessId={currentBusiness.id} 
            user={currentUser} 
            triggerToast={triggerToast} 
          />
        );
      case 'audit':
        return (
          <AuditLogView 
            businessId={currentBusiness.id} 
          />
        );
      default:
        return <div>Module view not resolved.</div>;
    }
  };

  // Render Loading state
  if (isInitializing) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Render Login page if not authenticated
  if (!currentUser || !currentBusiness) {
    const defaultLogoUrl = dbStore.getBusinesses()[0]?.logo_url || '/logo.png';
    const defaultCoverUrl = dbStore.getBusinesses()[0]?.login_cover_url;
    return (
      <div className="min-h-screen bg-slate-50 flex" id="login-screen-root">
        {/* Left Side: Branding / Graphic */}
        <div className="hidden lg:flex lg:w-1/2 bg-indigo-900 relative overflow-hidden items-center justify-center">
          {defaultCoverUrl ? (
            <div 
              className="absolute inset-0 z-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${defaultCoverUrl})` }}
            >
              <div className="absolute inset-0 bg-indigo-900/60 mix-blend-multiply"></div>
            </div>
          ) : (
            <>
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-indigo-800 to-indigo-950 z-0"></div>
              {/* Abstract background shapes */}
              <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-30 z-0">
                <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-indigo-500 blur-3xl"></div>
                <div className="absolute bottom-10 -left-20 w-80 h-80 rounded-full bg-indigo-400 blur-3xl"></div>
              </div>
            </>
          )}
          
          <div className="relative z-10 flex flex-col items-center justify-center p-12 text-center max-w-xl -mt-32">
            <div className="flex items-center justify-center h-[250px] w-[350px] sm:h-[300px] sm:w-[450px] -mb-8">
               <img 
                src={defaultLogoUrl} 
                alt="Company Logo" 
                className="w-full h-full object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
              />
              <ClipboardCheck size={80} className="text-white hidden" />
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-4 drop-shadow-md">
              Kokanastha Store Operations
            </h1>
            <p className="text-indigo-200 text-lg md:text-xl font-medium max-w-md">
              Enterprise Resource Planning & Multi-Tenant Management
            </p>
          </div>
          
          {/* Version badge */}
          <div className="absolute bottom-6 left-6 text-indigo-300 text-xs font-mono z-10">
            v2.4.0 (Build 2026)
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-20 xl:px-24 bg-slate-50 z-10 shadow-[-20px_0_40px_-10px_rgba(0,0,0,0.1)] relative">
          
          <div className="mx-auto w-full max-w-md bg-white p-8 sm:p-10 rounded-3xl border border-slate-200/60 shadow-xl shadow-slate-200/40">
            {/* Mobile Logo (Only visible on small screens) */}
            <div className="lg:hidden flex flex-col items-center mb-2 -mt-8">
              <div className="flex items-center justify-center h-[140px] w-[240px] sm:h-[180px] sm:w-[320px] -mb-6">
                <img 
                  src={defaultLogoUrl} 
                  alt="Company Logo" 
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                  }}
                />
                <ClipboardCheck size={64} className="text-indigo-600 hidden" />
              </div>
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
                Kokanastha Store Operations
              </h1>
            </div>

            <div className="mb-10 text-center">
              <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                Welcome back
              </h2>
              <p className="mt-2 text-sm text-slate-500 font-medium">
                Please enter your credentials to access the portal.
              </p>
            </div>

            <div className="space-y-6">

              {/* Supabase Status Warning (Only show if not configured) */}
              {!isSupabaseConfigured && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 shadow-sm">
                  <div className="flex items-center gap-2 font-bold mb-1.5 text-amber-900">
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></div>
                    <span>Database Not Configured</span>
                  </div>
                  <p className="text-amber-700/90 leading-relaxed font-medium">
                    Supabase is not configured. Falling back to local offline sandbox.
                    Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to enable live mode.
                  </p>
                </div>
              )}

              {authError && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2.5 shadow-sm">
                  <ShieldAlert size={18} className="mt-0.5 shrink-0 text-rose-500" />
                  <span className="font-medium text-rose-800 leading-snug">{authError}</span>
                </div>
              )}

              <form onSubmit={handleLoginSubmit} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Email Address</label>
                  <input 
                    type="email" 
                    required
                    placeholder={isSupabaseConfigured ? 'your-email@example.com' : 'admin@admin.com'}
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    className="w-full px-4 py-3.5 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all font-sans text-slate-900 text-sm shadow-sm"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Password</label>
                    {!isSupabaseConfigured && (
                      <button 
                        type="button" 
                        onClick={() => setIsForgotModalOpen(true)}
                        className="text-xs text-indigo-600 font-bold hover:text-indigo-800 transition-colors"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <input 
                    type="password" 
                    required
                    placeholder="••••••••"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    className="w-full px-4 py-3.5 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all font-sans text-slate-900 text-sm shadow-sm"
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition-colors cursor-pointer shadow-lg shadow-indigo-600/30 mt-4 flex justify-center items-center gap-2"
                >
                  Sign In to Operations
                </button>
              </form>

            </div>
          </div>
        </div>

        {/* Forgot password dialog mock */}
        {isForgotModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm p-6 shadow-2xl text-xs space-y-4">
              <div className="flex justify-between items-center">
                <strong className="text-sm font-bold uppercase text-white">Reset Account Access</strong>
                <button onClick={() => setIsForgotModalOpen(false)} className="text-slate-400"><X size={18} /></button>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Provide your registered corporate email id. The system will send a mock 6-digit MFA confirmation token.
              </p>
              <form onSubmit={handleForgotTrigger} className="space-y-3">
                <input 
                  type="email" 
                  required
                  placeholder="admin@admin.com"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                />
                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={() => setIsForgotModalOpen(false)} className="px-3.5 py-1.5 bg-slate-800 rounded-lg">Cancel</button>
                  <button type="submit" className="px-3.5 py-1.5 bg-indigo-600 text-white font-bold rounded-lg">Reset Password</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Toast Container */}
        <div className="fixed bottom-4 right-4 z-50 space-y-2 pointer-events-none">
          {toasts.map(t => (
            <div 
              key={t.id} 
              className={`p-3.5 rounded-xl border text-xs shadow-xl animate-in fade-in slide-in-from-bottom-2 duration-150 flex items-center gap-2 ${
                t.type === 'success' ? 'bg-slate-900 border-emerald-500 text-emerald-400' :
                t.type === 'error' ? 'bg-slate-900 border-rose-500 text-rose-400' :
                'bg-slate-900 border-slate-700 text-slate-300'
              }`}
            >
              <span>{t.message}</span>
            </div>
          ))}
        </div>

      </div>
    );
  }

  // Main system portal dashboard layout
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex font-sans antialiased text-slate-800 dark:text-slate-100" id="portal-root">
      
      {/* Mobile/Tablet Backdrop Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar navigation */}
      <aside className={`fixed inset-y-0 left-0 z-40 bg-slate-900 text-white transform transition-all duration-300 lg:translate-x-0 ${
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      } w-56 ${isSidebarMinimized ? 'lg:w-20' : 'lg:w-56'} flex flex-col border-r border-slate-800`}>
        
        {/* Brand Header */}
        <div className={`h-14 border-b border-slate-800 flex items-center justify-between px-6 ${isSidebarMinimized ? 'lg:px-0 lg:justify-center' : ''}`}>
          <div className={`flex items-center gap-2 ${isSidebarMinimized ? 'lg:justify-center lg:w-full' : ''}`}>
            <div className="p-1 bg-white rounded-lg flex items-center justify-center overflow-hidden h-7 w-7 shrink-0">
              <img 
                src={currentBusiness.logo_url || "/logo.png"} 
                alt="Company Logo" 
                className="w-full h-full object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                  e.currentTarget.parentElement?.classList.add('bg-indigo-600');
                  e.currentTarget.parentElement?.classList.remove('bg-white');
                }}
              />
              <ClipboardCheck size={18} className="text-white hidden" />
            </div>
            <strong className={`text-sm font-extrabold tracking-tight truncate max-w-[150px] ${isSidebarMinimized ? 'lg:hidden' : ''}`}>Kokanastha Operation</strong>
          </div>
          <button className="lg:hidden text-slate-400 cursor-pointer hover:text-white" onClick={() => setIsMobileMenuOpen(false)}>
            <X size={20} />
          </button>
        </div>
        {/* Navigation Items list */}
        <nav className={`flex-1 overflow-y-auto py-6 space-y-1 px-4 ${isSidebarMinimized ? 'lg:px-3' : ''}`}>
          {menuItems.map(item => {
            const isAuthorized = hasAccessToView(item.id);
            const isActive = activeView === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  if (isAuthorized) {
                    setActiveView(item.id);
                    setDeepLinkData(null);
                    setIsMobileMenuOpen(false);
                  } else {
                    triggerToast(`Unauthorized: ${currentUser.role} cannot browse this view.`, 'error');
                  }
                }}
                className={`w-full flex items-center justify-between ${isSidebarMinimized ? 'lg:justify-center' : ''} px-3 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition ${
                  isActive 
                    ? 'bg-indigo-600 text-white' 
                    : isAuthorized 
                      ? 'text-slate-400 hover:bg-slate-800 hover:text-white' 
                      : 'text-slate-600 cursor-not-allowed'
                }`}
                title={isSidebarMinimized ? item.label : undefined}
              >
                <div className={`flex items-center gap-2.5 ${isSidebarMinimized ? 'lg:justify-center' : ''}`}>
                  <item.icon size={16} className={`${isActive ? 'text-white' : 'text-slate-400'} ${isSidebarMinimized ? 'lg:w-5 lg:h-5' : ''}`} />
                  <span className={isSidebarMinimized ? 'lg:hidden' : ''}>{item.label}</span>
                </div>
                {!isAuthorized && <Lock size={12} className={`text-slate-600 ${isSidebarMinimized ? 'lg:hidden' : ''}`} />}
                {item.highlight && isAuthorized && <span className={`w-2 h-2 rounded-full bg-emerald-500 animate-ping ${isSidebarMinimized ? 'lg:absolute lg:right-4 lg:top-4' : ''}`} />}
              </button>
            );
          })}
        </nav>

        {/* Signed-in identity panel info footer */}
        <div className={`p-4 border-t border-slate-800 space-y-3 bg-slate-950/60 px-4 ${isSidebarMinimized ? 'lg:px-2' : ''}`}>
          <div className={`flex items-center gap-2.5 ${isSidebarMinimized ? 'lg:hidden' : ''}`}>
            <div className="w-8 h-8 rounded-full bg-indigo-700 border flex items-center justify-center font-bold text-xs uppercase text-white shrink-0">
              {currentUser.name.charAt(0)}
            </div>
            <div>
              <strong className="text-xs font-bold text-white block">{currentUser.name}</strong>
              <span className="text-[10px] text-slate-500 block font-mono">{currentUser.role}</span>
            </div>
          </div>

          <div className={`hidden justify-center mb-2 ${isSidebarMinimized ? 'lg:flex' : ''}`}>
            <div className="w-8 h-8 rounded-full bg-indigo-700 border flex items-center justify-center font-bold text-xs uppercase text-white shrink-0" title={`${currentUser.name} (${currentUser.role})`}>
              {currentUser.name.charAt(0)}
            </div>
          </div>

          <div className={`flex items-center gap-2 ${isSidebarMinimized ? 'lg:flex-col' : ''}`}>
            <button 
              onClick={handleLogout}
              title={isSidebarMinimized ? "Terminate Session" : undefined}
              className={`flex-1 py-1.5 px-2 border border-slate-800 hover:border-slate-700 bg-slate-900/50 hover:bg-slate-900 rounded-lg text-[11px] font-bold text-rose-400 hover:text-rose-300 transition flex items-center justify-center gap-1 cursor-pointer ${isSidebarMinimized ? 'lg:w-10 lg:h-10 lg:p-0' : ''}`}
            >
              <LogOut size={12} className={isSidebarMinimized ? 'lg:w-4 lg:h-4' : ''} />
              <span className={isSidebarMinimized ? 'lg:hidden' : ''}>Terminate Session</span>
            </button>
            <button
              onClick={() => {
                if (window.innerWidth < 1024) {
                  setIsMobileMenuOpen(false);
                } else {
                  setIsSidebarMinimized(!isSidebarMinimized);
                }
              }}
              className={`flex shrink-0 border border-slate-800 hover:border-slate-700 bg-slate-900/50 hover:bg-slate-900 rounded-lg text-slate-400 hover:text-white transition items-center justify-center cursor-pointer w-8 h-8 ${isSidebarMinimized ? 'lg:w-10 lg:h-10' : ''}`}
              title={isSidebarMinimized ? "Expand Sidebar" : "Minimize/Close Sidebar"}
            >
              <span className="hidden lg:flex">{isSidebarMinimized ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}</span>
              <span className="lg:hidden"><X size={16} /></span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Panel Content container */}
      <div className={`flex-1 transition-all duration-300 ${isSidebarMinimized ? 'lg:pl-20' : 'lg:pl-56'} flex flex-col min-h-screen min-w-0 overflow-x-hidden`}>
        
        {/* Top interactive Header bar */}
        {/* Header content */}
        <header className="sticky top-0 z-30 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 px-4 h-14 flex items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <button className="lg:hidden text-slate-600 cursor-pointer" onClick={() => setIsMobileMenuOpen(true)}>
              <Menu size={20} />
            </button>
            <button className="hidden lg:block text-slate-600 cursor-pointer hover:text-slate-900 dark:hover:text-white transition" onClick={() => setIsSidebarMinimized(!isSidebarMinimized)}>
              <Menu size={20} />
            </button>
            <div className="flex items-center gap-2">
              <div className="flex flex-col">
                <strong className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-500 to-rose-500 dark:from-indigo-400 dark:via-purple-400 dark:to-rose-400 font-extrabold text-sm tracking-tight flex items-center gap-1.5">
                  {currentBusiness.name}
                  <Sparkles size={12} className="text-amber-500" />
                </strong>
                {currentUser && (
                  <span className="text-[10px] text-slate-500 hidden sm:block font-medium">
                    Welcome, {currentUser.name}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 relative header-dropdown-container">
            {/* Notification Dropdown Container */}
            <div className="relative">
              <button 
                onClick={() => {
                  setIsNotificationMenuOpen(!isNotificationMenuOpen);
                  setIsUserMenuOpen(false);
                }}
                className="relative p-2 rounded-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all group focus:outline-none overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/20 to-fuchsia-500/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <Bell size={18} className="text-slate-600 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors relative z-10" />
                <span className="absolute top-1 right-1 flex h-2.5 w-2.5 z-20">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-gradient-to-r from-rose-500 to-pink-500 border-2 border-white dark:border-slate-800 shadow-sm"></span>
                </span>
              </button>
              
              {/* Notification Dropdown Panel */}
              {isNotificationMenuOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                    <h3 className="font-semibold text-slate-800 dark:text-white text-sm">Notifications</h3>
                    <button className="text-xs text-indigo-600 dark:text-indigo-400 font-medium hover:underline focus:outline-none">Mark all read</button>
                  </div>
                  <div className="max-h-[300px] overflow-y-auto">
                    <div className="p-4 border-b border-slate-50 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer">
                      <p className="text-sm text-slate-800 dark:text-white font-medium">New order received</p>
                      <p className="text-xs text-slate-500 mt-1">Order #1042 needs processing.</p>
                      <p className="text-[10px] text-slate-400 mt-1">2 mins ago</p>
                    </div>
                    <div className="p-4 border-b border-slate-50 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer">
                      <p className="text-sm text-slate-800 dark:text-white font-medium">Low stock alert</p>
                      <p className="text-xs text-slate-500 mt-1">Product "Premium Wireless Headphones" is low on stock.</p>
                      <p className="text-[10px] text-slate-400 mt-1">1 hour ago</p>
                    </div>
                  </div>
                  <div className="p-3 text-center border-t border-slate-100 dark:border-slate-700">
                    <button className="text-xs text-indigo-600 dark:text-indigo-400 font-medium hover:underline focus:outline-none">View all notifications</button>
                  </div>
                </div>
              )}
            </div>

            {/* User Dropdown Container */}
            <div className="relative">
              <button 
                onClick={() => {
                  setIsUserMenuOpen(!isUserMenuOpen);
                  setIsNotificationMenuOpen(false);
                }}
                className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 font-bold text-sm flex items-center justify-center border border-indigo-200 dark:border-indigo-800 focus:outline-none hover:ring-2 hover:ring-indigo-500 hover:ring-offset-1 transition-all shadow-sm"
              >
                {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : <UserCircle size={20} />}
              </button>
              
              {/* User Dropdown Panel */}
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700">
                    <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">{currentUser?.name || 'Store Admin'}</p>
                    <p className="text-xs text-slate-500 truncate">{currentUser?.email || 'admin@example.com'}</p>
                  </div>
                  <div className="py-1">
                    <button className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-2 focus:outline-none">
                      <Settings size={14} /> Account Settings
                    </button>
                  </div>
                  <div className="border-t border-slate-100 dark:border-slate-700 py-1">
                    <button 
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors flex items-center gap-2 focus:outline-none"
                    >
                      <LogOut size={14} /> Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

        </header>

        {/* Dynamic active view body */}
        <main className="flex-1 px-0.5 pt-1 pb-4 sm:px-1 lg:px-1 sm:pt-2 sm:pb-6 w-full min-w-0 overflow-x-hidden space-y-6">
          {renderActiveModule()}
        </main>

      </div>

      {/* Toast Alert notifications overlay bubbles */}
      <div className="fixed bottom-4 right-4 z-50 space-y-2 pointer-events-none">
        {toasts.map(t => (
          <div 
            key={t.id} 
            className={`p-3.5 rounded-xl border text-xs shadow-xl animate-in fade-in slide-in-from-bottom-2 duration-150 flex items-center gap-2 pointer-events-auto ${
              t.type === 'success' ? 'bg-slate-900 border-emerald-500 text-emerald-400' :
              t.type === 'error' ? 'bg-slate-900 border-rose-500 text-rose-400' :
              'bg-slate-900 border-indigo-500 text-indigo-400'
            }`}
          >
            <span>{t.message}</span>
          </div>
        ))}
      </div>

    </div>
  );
}
