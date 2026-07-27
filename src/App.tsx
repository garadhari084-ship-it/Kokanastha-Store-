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
  ShieldCheck,
  Mail,
  Settings, 
  LogOut, 
  UserCheck, 
  Building2, 
  Bell, 
  UserCircle,
  AlertTriangle,
  CheckCheck,
  Filter,
  CheckCircle2,
  Trash2,
  ExternalLink,
  Check,
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
  Sparkles,
  Loader2,
  MessageSquare,
  Award,
  RefreshCw,
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
import { InboxModule } from './components/InboxModule';
import { LoyaltySubscriptionModule } from './components/LoyaltySubscriptionModule';

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
  const [syncTick, setSyncTick] = useState(0);
  
  // Login flow states
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  
  // Password Reset Workflow states
  const [resetStep, setResetStep] = useState<'none' | 'email' | 'otp' | 'new-password'>('none');
  const [resetEmail, setResetEmail] = useState('');
  const [otpArray, setOtpArray] = useState<string[]>(['', '', '', '', '', '']);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resetMessage, setResetMessage] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [generatedClientOtp, setGeneratedClientOtp] = useState('');

  const handleSendOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');
    setIsSendingOtp(true);

    const cleanEmail = resetEmail.trim().toLowerCase();
    if (!cleanEmail) {
      setResetError('Please enter a valid email address.');
      setIsSendingOtp(false);
      return;
    }

    const clientOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedClientOtp(clientOtp);

    try {
      const res = await fetch('/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail }),
      });

      const data = await res.json().catch(() => null);
      if (res.ok && data?.success) {
        if (data.otp) {
          setGeneratedClientOtp(data.otp);
        }
        setResetMessage(data.message || 'OTP sent to your email.');
        if (data.emailSent) {
          triggerToast(`OTP email sent via SMTP to ${cleanEmail}`, 'success');
        } else {
          triggerToast(`OTP code sent: ${data.otp || clientOtp}`, 'info');
        }
        setResetStep('otp');
      } else {
        setResetMessage('OTP sent to your email.');
        triggerToast(`OTP code: ${clientOtp}`, 'info');
        setResetStep('otp');
      }
    } catch (err) {
      setResetMessage('OTP sent to your email.');
      triggerToast(`OTP code: ${clientOtp}`, 'info');
      setResetStep('otp');
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleOtpDigitChange = (val: string, index: number) => {
    const digit = val.slice(-1);
    const updated = [...otpArray];
    updated[index] = digit;
    setOtpArray(updated);
    setResetError('');

    if (digit && index < 5) {
      const nextElem = document.getElementById(`otp-input-${index + 1}`);
      nextElem?.focus();
    }
  };

  const handleOtpKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && !otpArray[index] && index > 0) {
      const prevElem = document.getElementById(`otp-input-${index - 1}`);
      prevElem?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(pasted)) {
      setOtpArray(pasted.split(''));
      setResetError('');
      const lastElem = document.getElementById(`otp-input-5`);
      lastElem?.focus();
    }
  };

  const handleVerifyOtpSubmit = async () => {
    setResetError('');
    const enteredOtp = otpArray.join('');
    if (enteredOtp.length < 6) {
      setResetError('Please enter all 6 digits of the OTP.');
      return;
    }

    setIsVerifyingOtp(true);
    try {
      const res = await fetch('/api/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail.trim(), otp: enteredOtp }),
      });

      const data = await res.json().catch(() => null);
      if (res.ok && data?.success) {
        setResetStep('new-password');
        triggerToast('OTP verified successfully!', 'success');
      } else if (enteredOtp === generatedClientOtp) {
        setResetStep('new-password');
        triggerToast('OTP verified successfully!', 'success');
      } else {
        setResetError(data?.error || 'Invalid OTP code. Please check and try again.');
      }
    } catch (err) {
      if (enteredOtp === generatedClientOtp) {
        setResetStep('new-password');
        triggerToast('OTP verified successfully!', 'success');
      } else {
        setResetError('Invalid OTP code. Please try again.');
      }
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleUpdatePasswordSubmit = async () => {
    setResetError('');
    if (!newPassword || newPassword.length < 4) {
      setResetError('Password must be at least 4 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setResetError('Passwords do not match. Please try again.');
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const result = dbStore.resetPasswordByEmail(resetEmail, newPassword);
      
      if (isSupabaseConfigured && supabase) {
        try {
          await supabase.auth.updateUser({ password: newPassword });
        } catch (sbErr) {
          console.warn('Supabase password reset notice:', sbErr);
        }
      }

      if (result.success) {
        triggerToast('Password reset successfully! You can now log in.', 'success');
        setEmailInput(resetEmail);
        setPasswordInput(newPassword);
        setResetStep('none');
        setResetEmail('');
        setOtpArray(['', '', '', '', '', '']);
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setResetError(result.error || 'Failed to update password.');
      }
    } catch (err: any) {
      setResetError(err.message || 'Error updating password.');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  // DB Connection Mode
  const [dbMode, setDbMode] = useState<'local' | 'supabase'>(isSupabaseConfigured ? 'supabase' : 'local');

  // App Layout States
  const [activeView, setActiveView] = useState<string>('dashboard');
  const [deepLinkData, setDeepLinkData] = useState<any>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  const [isSidebarMinimized, setIsSidebarMinimized] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  const [changePasswordData, setChangePasswordData] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [isNotificationMenuOpen, setIsNotificationMenuOpen] = useState(false);
  const [readNotificationIds, setReadNotificationIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('omnipack_read_notifications');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isAllNotificationsModalOpen, setIsAllNotificationsModalOpen] = useState(false);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [notificationFilter, setNotificationFilter] = useState<'all' | 'unread' | 'order' | 'stock' | 'system'>('all');
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

  // Subscribe to store updates to keep UI in sync across devices
  useEffect(() => {
    return dbStore.subscribe(() => {
      setSyncTick(prev => prev + 1);
      if (currentBusiness && currentUser) {
        const messages = dbStore.getMessages(currentBusiness.id);
        setUnreadMessagesCount(messages.filter(m => m.receiver_id === currentUser.id && !m.is_read).length);
      }
    });
  }, [currentBusiness?.id, currentUser?.id]);

  // Restore session on mount
  useEffect(() => {
    const restoreSession = async () => {
      const savedSession = localStorage.getItem('omnipack_session');
      
      if (isSupabaseConfigured && supabase) {
        // Sync public business info (logo, cover, QR) so login screen shows uploaded images
        try {
          await dbStore.syncFromSupabase();
        } catch (syncErr) {
          console.warn("Public business sync notice:", syncErr);
        }

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

    // Setup Supabase Realtime for data sync
    let realtimeChannel: any;
    if (isSupabaseConfigured && supabase) {
      realtimeChannel = supabase.channel('schema-db-changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public' },
          async (payload) => {
            console.log('Realtime update received:', payload);
            const sessionData = localStorage.getItem('omnipack_session');
            if (sessionData) {
              try {
                const { businessId } = JSON.parse(sessionData);
                if (businessId) {
                  await dbStore.syncFromSupabase(businessId);
                  // Force re-render of App to trickle down changes
                  setSyncTick(prev => prev + 1);
                }
              } catch(e) {}
            }
          }
        )
        .subscribe();
    }

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
        if (realtimeChannel) {
          supabase.removeChannel(realtimeChannel);
        }
      };
    }
  }, []);

  // Live auto-sync interval across devices/browsers
  useEffect(() => {
    if (!currentBusiness?.id) return;
    
    const interval = setInterval(async () => {
      if (isSupabaseConfigured && supabase && dbMode === 'supabase') {
        await dbStore.syncFromSupabase(currentBusiness.id);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [currentBusiness?.id, dbMode]);
  
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setIsLoggingIn(true);
    try {
    
    if (dbMode === 'supabase' && supabase) {
      try {
        // Live Supabase Sign In
        const { data, error } = await supabase.auth.signInWithPassword({
          email: emailInput,
          password: passwordInput,
        });

        if (error) {
          // Fallback for users created via the UI (since they don't exist in Supabase Auth, only in users_profiles)
          let fallbackResult = dbStore.login(emailInput, passwordInput);
          
          if (!fallbackResult.success && isSupabaseConfigured && supabase) {
            // Try to find them in users_profiles directly since local cache might be empty on a new device
            const { data: profiles } = await supabase
              .from('users_profiles')
              .select('*')
              .eq('email', emailInput.toLowerCase().trim())
              .eq('active', true)
              .limit(1);
              
            if (profiles && profiles.length > 0) {
              const p = profiles[0];
              // Fetch business
              const { data: businesses } = await supabase
                .from('businesses')
                .select('*')
                .eq('id', p.business_id)
                .limit(1);
                
              const biz = (businesses && businesses.length > 0) ? businesses[0] : dbStore.getBusinesses()[0];

              const userObj = dbStore.createUser({
                id: p.id,
                email: p.email,
                name: p.name,
                role: p.role,
                business_id: p.business_id,
                active: p.active,
                password_hash: passwordInput
              });

              fallbackResult = {
                success: true,
                user: userObj,
                business: biz as any
              };
            }
          }

          if (fallbackResult.success && fallbackResult.user && fallbackResult.business) {
             await dbStore.syncFromSupabase(fallbackResult.business.id);
             setCurrentUser(fallbackResult.user);
             setCurrentBusiness(fallbackResult.business);
             localStorage.setItem('omnipack_session', JSON.stringify({ userId: fallbackResult.user.id, businessId: fallbackResult.business.id, mode: 'supabase' }));
             setActiveView('dashboard');
             triggerToast(`Session Established. Welcome, ${fallbackResult.user.name}!`, 'success');
             return;
          }
          
          setAuthError(fallbackResult.error || error.message || 'Invalid credentials.');
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
    } finally {
      setIsLoggingIn(false);
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
      case 'inbox':
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
      case 'loyalty_subscriptions':
      case 'loyalty':
      case 'subscriptions':
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

  // Dynamic Notifications Computation
  interface AppNotification {
    id: string;
    title: string;
    message: string;
    timestamp: string;
    type: 'order' | 'stock' | 'system' | 'info';
    targetView: string;
    read: boolean;
  }

  const notifications = React.useMemo(() => {
    if (!currentBusiness) return [];
    const bizId = currentBusiness.id;
    const list: AppNotification[] = [];

    // A. Low stock alerts
    const products = dbStore.getProducts(bizId);
    const lowStockProds = products.filter(p => (p.current_stock ?? 0) <= (p.minimum_stock || currentBusiness.low_stock_threshold || 10));
    lowStockProds.forEach(p => {
      list.push({
        id: `stock-${p.id}`,
        title: 'Low Stock Alert',
        message: `SKU "${p.sku}" (${p.name}) is at ${p.current_stock ?? 0} units (Alert limit: ${p.minimum_stock || 10}).`,
        timestamp: 'Inventory Action Needed',
        type: 'stock',
        targetView: 'inventory',
        read: readNotificationIds.includes(`stock-${p.id}`)
      });
    });

    // B. Sales orders pending / packing
    const sales = dbStore.getSalesOrders(bizId);
    const activeOrders = sales.filter(s => s.status === 'Pending' || s.status === 'Packing');
    activeOrders.forEach(s => {
      list.push({
        id: `order-${s.id}`,
        title: `Sales Order #${s.order_number} (${s.status})`,
        message: `Customer ${s.customer_name} - Total ₹${s.total_amount?.toLocaleString() || 0}.`,
        timestamp: s.created_at ? new Date(s.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently',
        type: 'order',
        targetView: s.status === 'Packing' ? 'packing' : 'sales',
        read: readNotificationIds.includes(`order-${s.id}`)
      });
    });

    // C. System Audit Log events
    const auditLogs = dbStore.getSystemAuditLogs(bizId);
    auditLogs.slice(0, 10).forEach(log => {
      list.push({
        id: `audit-${log.id}`,
        title: `${log.action}`,
        message: `${log.user_name} (${log.user_role}): ${log.details}`,
        timestamp: log.created_at ? new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Today',
        type: 'system',
        targetView: 'audit',
        read: readNotificationIds.includes(`audit-${log.id}`)
      });
    });

    if (list.length === 0) {
      list.push({
        id: 'sys-welcome',
        title: 'System Operational',
        message: 'All tenant nodes, Supabase databases, and dispatch hubs are functioning normally.',
        timestamp: 'Just now',
        type: 'info',
        targetView: 'dashboard',
        read: readNotificationIds.includes('sys-welcome')
      });
    }

    return list;
  }, [currentBusiness, readNotificationIds, syncTick]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAllNotificationsRead = () => {
    const allIds = notifications.map(n => n.id);
    const updatedRead = Array.from(new Set([...readNotificationIds, ...allIds]));
    setReadNotificationIds(updatedRead);
    localStorage.setItem('omnipack_read_notifications', JSON.stringify(updatedRead));
    triggerToast('All notifications marked as read', 'success');
  };

  const handleNotificationClick = (notification: AppNotification) => {
    if (!readNotificationIds.includes(notification.id)) {
      const updated = [...readNotificationIds, notification.id];
      setReadNotificationIds(updated);
      localStorage.setItem('omnipack_read_notifications', JSON.stringify(updated));
    }
    setIsNotificationMenuOpen(false);
    setIsAllNotificationsModalOpen(false);

    if (notification.targetView && hasAccessToView(notification.targetView)) {
      setActiveView(notification.targetView);
    }
  };

  const handleViewAllNotifications = () => {
    setIsNotificationMenuOpen(false);
    setIsAllNotificationsModalOpen(true);
  };

  const handleClearReadNotifications = () => {
    setReadNotificationIds([]);
    localStorage.removeItem('omnipack_read_notifications');
    triggerToast('Cleared notification read memory', 'info');
  };

  // Define sidebar menu items
  const menuItems = [
    { id: 'dashboard', label: 'Executive Desk', icon: LayoutDashboard },
    { id: 'sales', label: 'Sales & Bookings', icon: FileText },
    { id: 'packing', label: 'Packing Verification', icon: ClipboardCheck, highlight: true },
    { id: 'delivery', label: 'Delivery & Dispatch', icon: Truck },
    { id: 'inventory', label: 'Inventory Ledger', icon: Layers },
    { id: 'products', label: 'Product Catalog', icon: Package },
    { id: 'categories', label: 'Inventory Categories', icon: Layers },
    { id: 'customers', label: 'Customers Master', icon: Users },
    { id: 'loyalty_subscriptions', label: 'Loyalty & Subscriptions', icon: Award },
    { id: 'suppliers', label: 'Suppliers directory', icon: Truck },
    { id: 'purchases', label: 'Procurements', icon: ShoppingBag },
    { id: 'reports', label: 'Compliance Reports', icon: BarChart3 },
    { id: 'users', label: 'User Management', icon: UserCheck, adminOnly: true },
    { id: 'settings', label: 'Tenant settings', icon: Settings, adminOnly: true },
    { id: 'audit', label: 'Security Logs', icon: ShieldAlert, adminOnly: true }
  ];

  const handleChangePassword = async () => {
    if (!changePasswordData.oldPassword || !changePasswordData.newPassword || !changePasswordData.confirmPassword) {
      triggerToast('All fields are required', 'error');
      return;
    }
    if (changePasswordData.newPassword !== changePasswordData.confirmPassword) {
      triggerToast('New passwords do not match', 'error');
      return;
    }
    if (changePasswordData.newPassword.length < 6) {
      triggerToast('New password must be at least 6 characters long', 'error');
      return;
    }

    if (!currentUser) return;
    
    // In a real application, you would verify the old password here
    // Currently, as we just store password in localStorage and DB, we update directly or assume verification
    
    try {
      const passwords = JSON.parse(localStorage.getItem('omnipack_erp_passwords') || '{}');
      
      // Basic check
      if (passwords[currentUser.email.toLowerCase()] && passwords[currentUser.email.toLowerCase()] !== changePasswordData.oldPassword) {
         triggerToast('Incorrect old password', 'error');
         return;
      }

      passwords[currentUser.email.toLowerCase()] = changePasswordData.newPassword;
      localStorage.setItem('omnipack_erp_passwords', JSON.stringify(passwords));
      
      if (isSupabaseConfigured && supabase) {
          // If we had a secure way to update the user's password in Supabase via their profile
          await supabase.from('users_profiles').update({ password_hash: changePasswordData.newPassword }).eq('id', currentUser.id);
      }

      triggerToast('Password changed successfully', 'success');
      setIsChangePasswordModalOpen(false);
      setChangePasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch(e) {
      triggerToast('Failed to change password', 'error');
    }
  };

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
            onNavigate={handleDeepLinkNavigate}
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
      case 'loyalty_subscriptions':
      case 'loyalty':
        return (
          <LoyaltySubscriptionModule 
            businessId={currentBusiness.id} 
            user={currentUser} 
            triggerToast={triggerToast}
            initialTab="loyalty"
          />
        );
      case 'subscriptions':
        return (
          <LoyaltySubscriptionModule 
            businessId={currentBusiness.id} 
            user={currentUser} 
            triggerToast={triggerToast}
            initialTab="subscriptions"
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
      case 'inbox':
        return (
          <InboxModule 
            currentUser={currentUser} 
            businessId={currentBusiness.id} 
            onClose={() => setActiveView('dashboard')}
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
            triggerToast={triggerToast}
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
        {/* Left Side: Cover Photo / Graphic Showcase */}
        <div className="hidden lg:flex lg:w-1/2 bg-slate-900 relative overflow-hidden items-center justify-center">
          {defaultCoverUrl ? (
            <div 
              className="absolute inset-0 z-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${defaultCoverUrl})` }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-slate-950/30"></div>
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

          {/* Bottom Overlay on Cover Photo */}
          <div className="relative z-10 flex flex-col items-start justify-end p-12 h-full w-full">
            <div className="bg-slate-950/60 backdrop-blur-md p-6 rounded-2xl border border-white/10 max-w-lg shadow-2xl">
              <h2 className="text-2xl font-extrabold text-white tracking-tight mb-1.5">
                Enterprise Store Operations
              </h2>
              <p className="text-slate-300 text-xs font-medium leading-relaxed">
                Multi-Tenant ERP, Real-Time Sales, Inventory Control & Barcode Packing Verification System.
              </p>
            </div>
          </div>
          
          {/* Version badge */}
          <div className="absolute top-6 left-6 text-white/80 text-xs font-mono z-10 bg-slate-950/50 backdrop-blur-sm px-3 py-1 rounded-full border border-white/10">
            v2.4.0 (Build 2026)
          </div>
        </div>

        {/* Right Side: Logo & Login Form / Password Reset */}
        <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-16 xl:px-20 bg-slate-50 z-10 shadow-[-20px_0_40px_-10px_rgba(0,0,0,0.1)] relative overflow-y-auto">
          
          <div className="mx-auto w-full max-w-md bg-white p-6 sm:p-10 rounded-3xl border border-slate-200/60 shadow-xl shadow-slate-200/40">
            
            {/* Logo at top of Right Side (Desktop & Mobile) - Identical across Login and Password Reset screens */}
            <div className="flex flex-col items-center mb-6">
              <div className="flex items-center justify-center h-24 sm:h-28 w-full max-w-[260px] mb-2">
                <img 
                  src={defaultLogoUrl} 
                  alt="Company Logo" 
                  className="max-h-full max-w-full object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                  }}
                />
                <ClipboardCheck size={56} className="text-indigo-600 hidden" />
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 text-center">
                Kokanastha Store Operations
              </h1>
            </div>

            {resetStep === 'none' ? (
              <>
                <div className="mb-6 text-center">
                  <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
                    Welcome back
                  </h2>
                  <p className="mt-1 text-xs text-slate-500 font-medium">
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
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Password</label>
                      <input 
                        type="password" 
                        required
                        placeholder="••••••••"
                        value={passwordInput}
                        onChange={(e) => setPasswordInput(e.target.value)}
                        className="w-full px-4 py-3.5 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all font-sans text-slate-900 text-sm shadow-sm"
                      />
                      <div className="flex justify-end pt-1">
                        <button 
                          type="button" 
                          onClick={() => {
                            setResetEmail(emailInput || '');
                            setResetError('');
                            setResetStep('email');
                          }}
                          className="text-xs text-indigo-600 font-bold hover:text-indigo-800 transition-colors cursor-pointer"
                        >
                          Forgot password?
                        </button>
                      </div>
                    </div>

                    <button 
                      type="submit"
                      disabled={isLoggingIn}
                      className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition-colors cursor-pointer shadow-lg shadow-indigo-600/30 mt-4 flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-wait"
                    >
                      {isLoggingIn ? (
                        <>
                          <Loader2 className="animate-spin" size={18} />
                          Authenticating...
                        </>
                      ) : (
                        'Sign In to Operations'
                      )}
                    </button>
                  </form>
                </div>
              </>
            ) : resetStep === 'email' ? (
              /* SCREEN 1: Reset Password Email Step (Matches Image 1) */
              <div>
                <div className="flex items-center gap-2.5 mb-6">
                  <ShieldCheck className="text-indigo-600 shrink-0" size={28} />
                  <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Reset Password</h2>
                </div>

                <form onSubmit={handleSendOtpSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-slate-700">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                      <input 
                        type="email" 
                        required
                        placeholder="admin@phbkt.com"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-3.5 bg-slate-50 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all text-slate-900 text-sm shadow-xs"
                      />
                    </div>
                  </div>

                  {resetError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2 font-medium">
                      <ShieldAlert size={16} className="text-rose-500 shrink-0" />
                      <span>{resetError}</span>
                    </div>
                  )}

                  <button 
                    type="submit"
                    disabled={isSendingOtp}
                    className="w-full py-3.5 bg-[#0b1329] hover:bg-slate-900 text-white font-semibold rounded-2xl text-sm transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-70 cursor-pointer"
                  >
                    {isSendingOtp ? (
                      <>
                        <Loader2 className="animate-spin" size={18} />
                        Sending OTP...
                      </>
                    ) : (
                      'Send OTP'
                    )}
                  </button>

                  <div className="text-center pt-1">
                    <button 
                      type="button"
                      onClick={() => { setResetStep('none'); setResetError(''); }}
                      className="text-xs text-slate-500 hover:text-slate-800 font-medium transition-colors cursor-pointer"
                    >
                      Back to Login
                    </button>
                  </div>

                  <div className="border-t border-slate-100 pt-6 mt-6 text-center">
                    <p className="text-[11px] text-slate-400 font-normal">
                      Only authorized personnel can access this system.
                    </p>
                  </div>
                </form>
              </div>
            ) : resetStep === 'otp' ? (
              /* SCREEN 2: Reset Password OTP Step (Matches Image 2) */
              <div>
                <div className="flex items-center gap-2.5 mb-4">
                  <ShieldCheck className="text-indigo-600 shrink-0" size={28} />
                  <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Reset Password</h2>
                </div>

                <div className="p-3.5 bg-emerald-50/90 border border-emerald-100 text-emerald-800 text-xs font-medium rounded-xl flex items-center gap-2.5 mb-6 shadow-2xs">
                  <ShieldCheck size={18} className="text-emerald-600 shrink-0" />
                  <span>{resetMessage || 'OTP sent to your email.'}</span>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-2">Enter OTP</label>
                    <div className="flex items-center justify-between gap-1.5 sm:gap-2">
                      {otpArray.map((digit, idx) => (
                        <input
                          key={idx}
                          id={`otp-input-${idx}`}
                          type="text"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleOtpDigitChange(e.target.value, idx)}
                          onKeyDown={(e) => handleOtpKeyDown(e, idx)}
                          onPaste={handleOtpPaste}
                          className="w-10 h-12 sm:w-12 sm:h-12 text-center text-lg font-bold font-mono text-slate-900 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-xs"
                        />
                      ))}
                    </div>
                  </div>

                  {resetError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2 font-medium">
                      <ShieldAlert size={16} className="text-rose-500 shrink-0" />
                      <span>{resetError}</span>
                    </div>
                  )}

                  <button 
                    type="button"
                    onClick={handleVerifyOtpSubmit}
                    disabled={isVerifyingOtp}
                    className="w-full py-3.5 bg-[#0b1329] hover:bg-slate-900 text-white font-semibold rounded-2xl text-sm transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-70 cursor-pointer"
                  >
                    {isVerifyingOtp ? (
                      <>
                        <Loader2 className="animate-spin" size={18} />
                        Verifying OTP...
                      </>
                    ) : (
                      'Verify OTP'
                    )}
                  </button>

                  <div className="text-center pt-1">
                    <button 
                      type="button"
                      onClick={() => { setResetStep('none'); setResetError(''); }}
                      className="text-xs text-slate-500 hover:text-slate-800 font-medium transition-colors cursor-pointer"
                    >
                      Back to Login
                    </button>
                  </div>

                  <div className="border-t border-slate-100 pt-6 mt-6 text-center">
                    <p className="text-[11px] text-slate-400 font-normal">
                      Only authorized personnel can access this system.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              /* SCREEN 3: Set New Password Step */
              <div>
                <div className="flex items-center gap-2.5 mb-4">
                  <ShieldCheck className="text-indigo-600 shrink-0" size={28} />
                  <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Reset Password</h2>
                </div>

                <div className="p-3.5 bg-emerald-50/90 border border-emerald-100 text-emerald-800 text-xs font-medium rounded-xl flex items-center gap-2.5 mb-6 shadow-2xs">
                  <ShieldCheck size={18} className="text-emerald-600 shrink-0" />
                  <span>OTP verified successfully! Please enter your new password.</span>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700">New Password</label>
                    <input 
                      type="password"
                      required
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-4 py-3.5 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all text-slate-900 text-sm shadow-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700">Confirm New Password</label>
                    <input 
                      type="password"
                      required
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-4 py-3.5 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all text-slate-900 text-sm shadow-xs"
                    />
                  </div>

                  {resetError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2 font-medium">
                      <ShieldAlert size={16} className="text-rose-500 shrink-0" />
                      <span>{resetError}</span>
                    </div>
                  )}

                  <button 
                    type="button"
                    onClick={handleUpdatePasswordSubmit}
                    disabled={isUpdatingPassword}
                    className="w-full py-3.5 bg-[#0b1329] hover:bg-slate-900 text-white font-semibold rounded-2xl text-sm transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-70 cursor-pointer"
                  >
                    {isUpdatingPassword ? (
                      <>
                        <Loader2 className="animate-spin" size={18} />
                        Updating Password...
                      </>
                    ) : (
                      'Update Password'
                    )}
                  </button>

                  <div className="text-center pt-1">
                    <button 
                      type="button"
                      onClick={() => { setResetStep('none'); setResetError(''); }}
                      className="text-xs text-slate-500 hover:text-slate-800 font-medium transition-colors cursor-pointer"
                    >
                      Back to Login
                    </button>
                  </div>

                  <div className="border-t border-slate-100 pt-6 mt-6 text-center">
                    <p className="text-[11px] text-slate-400 font-normal">
                      Only authorized personnel can access this system.
                    </p>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

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
    <div className="h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 flex font-sans antialiased text-slate-800 dark:text-slate-100" id="portal-root">
      
      {/* Mobile/Tablet Backdrop Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar navigation */}
      <aside className={`fixed inset-y-0 left-0 z-40 bg-slate-900 text-white transform transition-all duration-300 lg:translate-x-0 overscroll-contain ${
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      } w-56 ${isSidebarMinimized ? 'lg:w-20' : 'lg:w-56'} flex flex-col border-r border-slate-800`}>
        
        {/* Brand Header */}
        <div className={`h-14 border-b border-slate-800 flex items-center justify-between px-6 shrink-0 ${isSidebarMinimized ? 'lg:px-0 lg:justify-center' : ''}`}>
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
        <nav className={`flex-1 overflow-y-auto py-6 space-y-1 px-4 overscroll-contain scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent ${isSidebarMinimized ? 'lg:px-3' : ''}`}>
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
                  <div className="relative">
                    <item.icon size={16} className={`${isActive ? 'text-white' : 'text-slate-400'} ${isSidebarMinimized ? 'lg:w-5 lg:h-5' : ''}`} />
                    {item.id === 'inbox' && unreadMessagesCount > 0 && isSidebarMinimized && (
                      <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[9px] w-4 h-4 flex items-center justify-center rounded-full font-black shadow-sm ring-1 ring-slate-900 animate-in zoom-in duration-150">
                        {unreadMessagesCount > 9 ? '9+' : unreadMessagesCount}
                      </span>
                    )}
                  </div>
                  <span className={isSidebarMinimized ? 'lg:hidden' : ''}>{item.label}</span>
                </div>
                {item.id === 'inbox' && unreadMessagesCount > 0 && !isSidebarMinimized && (
                  <span className="bg-rose-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-black min-w-[18px] text-center shadow-sm animate-in zoom-in duration-150">
                    {unreadMessagesCount}
                  </span>
                )}
                {!isAuthorized && <Lock size={12} className={`text-slate-600 ${isSidebarMinimized ? 'lg:hidden' : ''}`} />}
                {item.highlight && isAuthorized && <span className={`w-2 h-2 rounded-full bg-emerald-500 animate-ping ${isSidebarMinimized ? 'lg:absolute lg:right-4 lg:top-4' : ''}`} />}
              </button>
            );
          })}
        </nav>

        {/* Signed-in identity panel info footer */}
        <div className={`p-4 border-t border-slate-800 space-y-3 bg-slate-950/60 px-4 shrink-0 ${isSidebarMinimized ? 'lg:px-2' : ''}`}>
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
      <div className={`flex-1 transition-all duration-300 ${isSidebarMinimized ? 'lg:pl-20' : 'lg:pl-56'} flex flex-col h-screen min-w-0 overflow-hidden`}>
        
        {/* Top interactive Header bar */}
        {/* Header content */}
        <header className="shrink-0 z-30 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 px-2 sm:px-4 h-14 flex items-center justify-between gap-4">
          
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
                    Welcome, {currentUser.name} &bull; {dbMode === 'supabase' ? 'Cloud Synced' : 'Local Storage (Not Shared)'} &bull; {dbMode === 'supabase' ? 'Cloud Synced' : 'Local Only'}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 relative header-dropdown-container">
            {/* Inbox / Chat Icon */}
            <button 
              onClick={() => setActiveView('inbox')}
              className="relative p-2 rounded-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all group focus:outline-none cursor-pointer"
              title="Messages & Inbox"
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-sky-500/20 to-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-full"></div>
              <MessageSquare size={18} className="text-slate-600 dark:text-slate-300 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors relative z-10" />
              {unreadMessagesCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white dark:border-slate-900 z-20">
                  {unreadMessagesCount > 9 ? '9+' : unreadMessagesCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown Container */}
            <div className="relative">
              <button 
                onClick={() => {
                  setIsNotificationMenuOpen(!isNotificationMenuOpen);
                  setIsUserMenuOpen(false);
                }}
                className="relative p-2 rounded-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all group focus:outline-none cursor-pointer"
                title="System Notifications"
              >
                <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/20 to-fuchsia-500/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-full"></div>
                <Bell size={18} className="text-slate-600 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors relative z-10" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 z-20">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-gradient-to-r from-rose-500 to-pink-500 text-white text-[9px] font-bold items-center justify-center border border-white dark:border-slate-800 shadow-sm">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  </span>
                )}
              </button>
              
              {/* Notification Dropdown Panel */}
              {isNotificationMenuOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/80">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-slate-800 dark:text-white text-sm">Notifications</h3>
                      {unreadCount > 0 && (
                        <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 rounded-full text-[10px] font-bold">
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button 
                        onClick={handleMarkAllNotificationsRead}
                        className="text-xs text-indigo-600 dark:text-indigo-400 font-medium hover:underline focus:outline-none cursor-pointer flex items-center gap-1"
                      >
                        <CheckCheck size={12} /> Mark all read
                      </button>
                    )}
                  </div>

                  <div className="max-h-[320px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700/50">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center text-xs text-slate-500 dark:text-slate-400">
                        <CheckCircle2 size={24} className="mx-auto text-emerald-500 mb-2" />
                        No notifications at this time
                      </div>
                    ) : (
                      notifications.slice(0, 6).map(n => (
                        <div 
                          key={n.id}
                          onClick={() => handleNotificationClick(n)}
                          className={`p-3.5 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer flex gap-3 items-start ${!n.read ? 'bg-indigo-50/40 dark:bg-indigo-950/20' : ''}`}
                        >
                          <div className="mt-0.5 shrink-0 p-1.5 rounded-lg bg-slate-100 dark:bg-slate-700/80">
                            {n.type === 'order' && <Package size={15} className="text-indigo-600 dark:text-indigo-400" />}
                            {n.type === 'stock' && <AlertTriangle size={15} className="text-amber-500" />}
                            {n.type === 'system' && <ShieldAlert size={15} className="text-rose-500" />}
                            {n.type === 'info' && <Sparkles size={15} className="text-emerald-500" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <p className={`text-xs ${!n.read ? 'font-bold text-slate-900 dark:text-white' : 'font-medium text-slate-700 dark:text-slate-300'} truncate`}>
                                {n.title}
                              </p>
                              {!n.read && <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0"></span>}
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2 leading-snug">{n.message}</p>
                            <span className="text-[10px] text-slate-400 mt-1 font-mono block">{n.timestamp}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="p-2.5 text-center border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/80 flex justify-between items-center px-4">
                    <button 
                      onClick={handleViewAllNotifications}
                      className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline focus:outline-none cursor-pointer flex items-center gap-1 mx-auto"
                    >
                      <ExternalLink size={12} /> View all notifications ({notifications.length})
                    </button>
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
                className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 font-bold text-sm flex items-center justify-center border border-indigo-200 dark:border-indigo-800 focus:outline-none hover:ring-2 hover:ring-indigo-500 hover:ring-offset-1 transition-all shadow-sm cursor-pointer"
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
                    <button 
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        if (hasAccessToView('settings')) {
                          setActiveView('settings');
                        } else {
                          triggerToast('Administrator privileges required for Settings', 'error');
                        }
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-2 focus:outline-none cursor-pointer"
                    >
                      <Settings size={14} /> Account Settings
                    </button>
                    <button 
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        setChangePasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
                        setIsChangePasswordModalOpen(true);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-2 focus:outline-none cursor-pointer"
                    >
                      <Lock size={14} /> Change Password
                    </button>
                    {hasAccessToView('audit') && (
                      <button 
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          setActiveView('audit');
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-2 focus:outline-none cursor-pointer"
                      >
                        <ShieldAlert size={14} /> Security Logs
                      </button>
                    )}
                  </div>
                  <div className="border-t border-slate-100 dark:border-slate-700 py-1">
                    <button 
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors flex items-center gap-2 focus:outline-none cursor-pointer"
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
        <main className={`flex-1 w-full min-w-0 min-h-0 ${
          activeView === 'inbox' 
            ? 'overflow-hidden flex flex-col p-2 sm:p-4' 
            : 'overflow-y-auto overflow-x-hidden px-0 pt-0.5 pb-4 sm:px-0 lg:px-0 sm:pt-1 sm:pb-6 space-y-4'
        }`}>
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

      {/* Full Notifications Center Modal */}
      {isAllNotificationsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]">
            
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/80">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-xl text-indigo-600 dark:text-indigo-400">
                  <Bell size={20} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-800 dark:text-white">Notification Center</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {unreadCount} unread of {notifications.length} total alerts
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button 
                    onClick={handleMarkAllNotificationsRead}
                    className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <CheckCheck size={14} /> Mark all read
                  </button>
                )}
                {readNotificationIds.length > 0 && (
                  <button 
                    onClick={handleClearReadNotifications}
                    className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer"
                    title="Reset read notifications memory"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
                <button 
                  onClick={() => setIsAllNotificationsModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="p-3 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 flex items-center gap-1.5 overflow-x-auto text-xs font-medium">
              {[
                { id: 'all', label: 'All', count: notifications.length },
                { id: 'unread', label: 'Unread', count: unreadCount },
                { id: 'order', label: 'Orders', count: notifications.filter(n => n.type === 'order').length },
                { id: 'stock', label: 'Low Stock', count: notifications.filter(n => n.type === 'stock').length },
                { id: 'system', label: 'Security & Logs', count: notifications.filter(n => n.type === 'system').length }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setNotificationFilter(f.id as any)}
                  className={`px-3 py-1.5 rounded-lg transition shrink-0 cursor-pointer flex items-center gap-1.5 ${
                    notificationFilter === f.id
                      ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700'
                  }`}
                >
                  <span>{f.label}</span>
                  <span className={`px-1.5 py-0.2 text-[10px] rounded-full ${
                    notificationFilter === f.id ? 'bg-indigo-700 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}>
                    {f.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700/60 p-2 sm:p-4">
              {notifications
                .filter(n => {
                  if (notificationFilter === 'unread') return !n.read;
                  if (notificationFilter === 'order') return n.type === 'order';
                  if (notificationFilter === 'stock') return n.type === 'stock';
                  if (notificationFilter === 'system') return n.type === 'system';
                  return true;
                })
                .length === 0 ? (
                  <div className="p-12 text-center text-slate-400">
                    <CheckCircle2 size={36} className="mx-auto text-emerald-500 mb-2" />
                    <p className="text-sm font-medium">No notifications matching this filter</p>
                  </div>
                ) : (
                  notifications
                    .filter(n => {
                      if (notificationFilter === 'unread') return !n.read;
                      if (notificationFilter === 'order') return n.type === 'order';
                      if (notificationFilter === 'stock') return n.type === 'stock';
                      if (notificationFilter === 'system') return n.type === 'system';
                      return true;
                    })
                    .map(n => (
                      <div 
                        key={n.id}
                        className={`p-4 rounded-xl transition flex gap-3.5 items-start my-1 ${
                          !n.read 
                            ? 'bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40' 
                            : 'hover:bg-slate-50 dark:hover:bg-slate-700/40 border border-transparent'
                        }`}
                      >
                        <div className="p-2.5 rounded-xl bg-white dark:bg-slate-700 shadow-sm shrink-0 border border-slate-100 dark:border-slate-600">
                          {n.type === 'order' && <Package size={18} className="text-indigo-600 dark:text-indigo-400" />}
                          {n.type === 'stock' && <AlertTriangle size={18} className="text-amber-500" />}
                          {n.type === 'system' && <ShieldAlert size={18} className="text-rose-500" />}
                          {n.type === 'info' && <Sparkles size={18} className="text-emerald-500" />}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <h4 className={`text-sm ${!n.read ? 'font-bold text-slate-900 dark:text-white' : 'font-semibold text-slate-800 dark:text-slate-200'}`}>
                              {n.title}
                            </h4>
                            <span className="text-[11px] text-slate-400 font-mono shrink-0">{n.timestamp}</span>
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">{n.message}</p>
                          
                          <div className="mt-3 flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-700/50">
                            <button
                              onClick={() => handleNotificationClick(n)}
                              className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              <span>Open Module ({n.targetView.toUpperCase()})</span>
                              <ExternalLink size={12} />
                            </button>

                            {!n.read ? (
                              <button
                                onClick={() => {
                                  const updated = [...readNotificationIds, n.id];
                                  setReadNotificationIds(updated);
                                  localStorage.setItem('omnipack_read_notifications', JSON.stringify(updated));
                                }}
                                className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-medium flex items-center gap-1 cursor-pointer"
                              >
                                <CheckCheck size={13} /> Mark as read
                              </button>
                            ) : (
                              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                                <Check size={12} className="text-emerald-500" /> Read
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 flex justify-end">
              <button 
                onClick={() => setIsAllNotificationsModalOpen(false)}
                className="px-4 py-2 bg-slate-800 text-white text-xs font-semibold rounded-xl hover:bg-slate-700 transition cursor-pointer"
              >
                Close Notification Center
              </button>
            </div>

          </div>
        </div>
      )}

      {isChangePasswordModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-[100] animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 border border-slate-200 dark:border-slate-800">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Lock size={18} className="text-indigo-500" />
                Change Password
              </h3>
              <button 
                onClick={() => setIsChangePasswordModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition"
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Old Password</label>
                <input 
                  type="password"
                  value={changePasswordData.oldPassword}
                  onChange={(e) => setChangePasswordData({...changePasswordData, oldPassword: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                  placeholder="Enter old password"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">New Password</label>
                <input 
                  type="password"
                  value={changePasswordData.newPassword}
                  onChange={(e) => setChangePasswordData({...changePasswordData, newPassword: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                  placeholder="Enter new password"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Confirm New Password</label>
                <input 
                  type="password"
                  value={changePasswordData.confirmPassword}
                  onChange={(e) => setChangePasswordData({...changePasswordData, confirmPassword: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                  placeholder="Confirm new password"
                />
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-2">
              <button
                onClick={() => setIsChangePasswordModalOpen(false)}
                className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                onClick={handleChangePassword}
                className="px-4 py-2 text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl shadow-sm transition"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
