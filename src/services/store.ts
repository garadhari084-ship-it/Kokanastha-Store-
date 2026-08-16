import { supabase, isSupabaseConfigured } from './supabase';
import {
  Business,
  UserProfile,
  Category,
  Product,
  Customer,
  Supplier,
  PurchaseOrder,
  SalesOrder,
  PackingSession,
  StockLog,
  SystemAuditLog,
  BusinessSettings,
  UserRole,
  OrderStatus,
  AuditLogEntry,
  ChatMessage,
  LoyaltyConfig,
  LoyaltyLog,
  CustomerSubscription,
  SubscriptionPlan,
  DEFAULT_LOYALTY_CONFIG,
  ComboItem,
  ComboHistoryLog,
  DraftInvoiceReservation,
  ActiveDeviceSession
} from '../types/erp';

// ====================================================================
// INITIAL PRE-SEEDED SEED DATA FOR MULTI-TENANCY
// ====================================================================

const BIZ_ID = 'b1111111-1111-1111-1111-111111111111';

const PRE_SEEDED_BUSINESSES: Business[] = [
  {
    id: BIZ_ID,
    name: 'Kokanastha Faral & Sweets',
    gstin: '27AABCK1234F1ZM',
    pan: 'AABCK1234F',
    billing_address: 'Shop 14, Station Road, Borivali West, Mumbai, MH 400092',
    shipping_address: 'Godown 3, Industrial Estate, Dahisar East, Mumbai, MH 400068',
    email: 'ops@kokanasthafaral.com',
    phone: '+91 98200 12345',
    invoice_prefix: 'KF-',
    festive_invoice_prefix: 'FEST-KF-',
    tax_rate_default: 5.00,
    currency_symbol: '₹',
    auto_backup: true,
    low_stock_threshold: 20,
    audit_retention_days: 90,
    default_theme: 'midnight-gold',
    enable_auto_whatsapp: true,
    enable_auto_sms: true,
    default_dispatch_zone: 'Dahisar',
    area_zones: ['Dahisar', 'Borivali', 'Kandivali', 'Mira Road', 'Vasai', 'Virar', 'Malad', 'Goregaon', 'Andheri'],
    upi_id: '9820769697@okicici',
    bank_name: 'NKGSB COOPERATIVE BANK LIMITED, DAHISAR EAST ASHOKVAN',
    account_number: '092110100000085',
    ifsc_code: 'NKGS0000092',
    account_holder: 'Kokanastha Faral & Sweets',
    created_at: new Date().toISOString()
  }
];

// Seed profiles with email and clear password hashes
const PRE_SEEDED_PROFILES: (UserProfile & { password_hash: string })[] = [
  {
    id: 'a1111111-1111-1111-1111-111111111111',
    email: 'admin@admin.com',
    name: 'System Admin',
    role: 'Super Admin',
    business_id: BIZ_ID,
    active: true,
    created_at: new Date().toISOString(),
    password_hash: 'admin'
  }
];

const CAT_1_ID = '11111111-2222-4333-8444-000000000001';

const PROD_1_ID = 'b1111111-1111-4111-8111-111111111111';
const PROD_2_ID = 'b2222222-2222-4222-8222-222222222222';
const PROD_3_ID = 'b3333333-3333-4333-8333-333333333333';

const CUST_1_ID = 'c1111111-1111-4111-8111-111111111111';
const CUST_2_ID = 'c2222222-2222-4222-8222-222222222222';
const CUST_3_ID = 'c3333333-3333-4333-8333-333333333333';

const SO_1001_ID = 'd1111111-1111-4111-8111-111111111001';
const SO_1002_ID = 'd1111111-1111-4111-8111-111111111002';
const SO_1003_ID = 'd1111111-1111-4111-8111-111111111003';
const SO_1004_ID = 'd1111111-1111-4111-8111-111111111004';
const SO_1005_ID = 'd1111111-1111-4111-8111-111111111005';
const SO_1006_ID = 'd1111111-1111-4111-8111-111111111006';
const SO_1007_ID = 'd1111111-1111-4111-8111-111111111007';
const SO_1008_ID = 'd1111111-1111-4111-8111-111111111008';

const PROD_4_COMBO_ID = 'b4444444-4444-4444-8444-444444444444';

export const legacyIdMap: Record<string, string> = {
    'biz-1': BIZ_ID,
    'c1': CUST_1_ID,
    'c2': CUST_2_ID,
    'c3': CUST_3_ID,
    'p1': PROD_1_ID,
    'p2': PROD_2_ID,
    'p3': PROD_3_ID,
    'p4': PROD_4_COMBO_ID,
    'cat1': CAT_1_ID,
    'cat1_1': CAT_1_ID,
    'cat1_2': CAT_1_ID,
    'so-1001': SO_1001_ID,
    'so-1002': SO_1002_ID,
    'so-1003': SO_1003_ID,
    'so-1004': SO_1004_ID,
    'so-1005': SO_1005_ID,
    'so-1006': SO_1006_ID,
    'so-1007': SO_1007_ID,
    'so-1008': SO_1008_ID,
    'l1': 'e1111111-1111-4111-8111-111111111001',
    'l2': 'e1111111-1111-4111-8111-111111111002',
    'l3': 'e1111111-1111-4111-8111-111111111003',
    'sub-1': 'f1111111-1111-4111-8111-111111111001',
    'sub-2': 'f1111111-1111-4111-8111-111111111002'
};

export const normalizeBusinessId = (id?: string | null): string => {
  if (!id) return BIZ_ID;
  if (legacyIdMap[id]) return legacyIdMap[id];
  if (id === 'biz-1') return BIZ_ID;
  return id;
};

export const isSameBusiness = (b1?: string | null, b2?: string | null): boolean => {
  if (!b1 && !b2) return true;
  if (!b1 || !b2) return true;
  const norm1 = normalizeBusinessId(b1);
  const norm2 = normalizeBusinessId(b2);
  return norm1 === norm2;
};

export function dedupeById<T extends { id?: string }>(items: T[]): T[] {
  if (!Array.isArray(items)) return [];
  const seen = new Set<string>();
  const result: T[] = [];
  for (const item of items) {
    if (!item) continue;
    const key = item.id || Math.random().toString();
    if (!seen.has(key)) {
      seen.add(key);
      result.push(item);
    }
  }
  return result;
}

const PRE_SEEDED_CATEGORIES: Category[] = [
  {
    id: CAT_1_ID,
    name: 'Faral & Festive Sweets',
    parent_id: null,
    business_id: BIZ_ID,
    active: true,
    created_at: new Date().toISOString()
  }
];

const PRE_SEEDED_PRODUCTS: Product[] = [
  {
    id: PROD_1_ID,
    name: 'Bhajani Chakli 1kg',
    sku: 'SKU-CHK-101',
    barcode: '8901234500001',
    qr_code: 'SKU-CHK-101-QR',
    category_id: CAT_1_ID,
    brand: 'Kokanastha Special',
    unit: 'Kg',
    hsn_code: '2106',
    gst_rate: 5,
    purchase_price: 220,
    selling_price: 320,
    mrp: 350,
    opening_stock: 0,
    current_stock: 0, // Loose stock set to 0 initially so auto-break (reverse packing) can be tested immediately!
    minimum_stock: 5,
    maximum_stock: 50,
    image_url: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=400&q=80',
    description: 'Crispy crunchy traditional Maharashtrian Bhajani Chakli.',
    active: true,
    business_id: BIZ_ID,
    created_at: new Date().toISOString()
  },
  {
    id: PROD_2_ID,
    name: 'Poha Chivda 500g',
    sku: 'SKU-CHV-102',
    barcode: '8901234500002',
    qr_code: 'SKU-CHV-102-QR',
    category_id: CAT_1_ID,
    brand: 'Kokanastha Special',
    unit: 'Pkt',
    hsn_code: '2106',
    gst_rate: 5,
    purchase_price: 110,
    selling_price: 180,
    mrp: 200,
    opening_stock: 15,
    current_stock: 15,
    minimum_stock: 5,
    maximum_stock: 50,
    image_url: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=400&q=80',
    description: 'Thin poha chivda fried with cashews and roasted peanuts.',
    active: true,
    business_id: BIZ_ID,
    created_at: new Date().toISOString()
  },
  {
    id: PROD_3_ID,
    name: 'Besan Laddu 500g',
    sku: 'SKU-LAD-103',
    barcode: '8901234500003',
    qr_code: 'SKU-LAD-103-QR',
    category_id: CAT_1_ID,
    brand: 'Kokanastha Special',
    unit: 'Box',
    hsn_code: '2106',
    gst_rate: 5,
    purchase_price: 160,
    selling_price: 240,
    mrp: 280,
    opening_stock: 12,
    current_stock: 12,
    minimum_stock: 5,
    maximum_stock: 50,
    image_url: 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?auto=format&fit=crop&w=400&q=80',
    description: 'Pure ghee roasted besan laddu with cardamom and pistachios.',
    active: true,
    business_id: BIZ_ID,
    created_at: new Date().toISOString()
  },
  {
    id: PROD_4_COMBO_ID,
    name: 'Diwali Festive Delight Combo Box',
    sku: 'SKU-CMB-201',
    barcode: '8901234500099',
    qr_code: 'SKU-CMB-201-QR',
    category_id: CAT_1_ID,
    brand: 'Festive Hampers',
    unit: 'Box',
    hsn_code: '2106',
    gst_rate: 5,
    purchase_price: 490,
    selling_price: 699,
    mrp: 830,
    opening_stock: 10,
    current_stock: 10, // 10 Packed Combos in finished goods inventory!
    minimum_stock: 2,
    maximum_stock: 20,
    image_url: 'https://images.unsplash.com/photo-1513201099705-a9746e1e201f?auto=format&fit=crop&w=400&q=80',
    description: 'Festive hamper containing Bhajani Chakli 1kg (x1), Poha Chivda 500g (x1), Besan Laddu 500g (x1).',
    active: true,
    business_id: BIZ_ID,
    created_at: new Date().toISOString(),
    is_combo: true,
    combo_items: [
      { product_id: PROD_1_ID, qty: 1 },
      { product_id: PROD_2_ID, qty: 1 },
      { product_id: PROD_3_ID, qty: 1 }
    ]
  }
];

const PRE_SEEDED_CUSTOMERS: Customer[] = [];

const PRE_SEEDED_LOYALTY_LOGS: LoyaltyLog[] = [];

const PRE_SEEDED_SUBSCRIPTIONS: CustomerSubscription[] = [];

const PRE_SEEDED_SUPPLIERS: Supplier[] = [];

const PRE_SEEDED_PURCHASES: PurchaseOrder[] = [];

const nowSeed = new Date();
const todaySeedStr = `${nowSeed.getFullYear()}-${String(nowSeed.getMonth() + 1).padStart(2, '0')}-${String(nowSeed.getDate()).padStart(2, '0')}`;

const ySeed = new Date(nowSeed);
ySeed.setDate(ySeed.getDate() - 1);
const yesterdaySeedStr = `${ySeed.getFullYear()}-${String(ySeed.getMonth() + 1).padStart(2, '0')}-${String(ySeed.getDate()).padStart(2, '0')}`;

const d3Seed = new Date(nowSeed);
d3Seed.setDate(d3Seed.getDate() - 3);
const days3SeedStr = `${d3Seed.getFullYear()}-${String(d3Seed.getMonth() + 1).padStart(2, '0')}-${String(d3Seed.getDate()).padStart(2, '0')}`;

const d10Seed = new Date(nowSeed);
d10Seed.setDate(d10Seed.getDate() - 10);
const days10SeedStr = `${d10Seed.getFullYear()}-${String(d10Seed.getMonth() + 1).padStart(2, '0')}-${String(d10Seed.getDate()).padStart(2, '0')}`;

const d40Seed = new Date(nowSeed);
d40Seed.setDate(d40Seed.getDate() - 40);
const days40SeedStr = `${d40Seed.getFullYear()}-${String(d40Seed.getMonth() + 1).padStart(2, '0')}-${String(d40Seed.getDate()).padStart(2, '0')}`;

const PRE_SEEDED_SALES: SalesOrder[] = [];

const PRE_SEEDED_SETTINGS: BusinessSettings[] = [
  {
    business_id: BIZ_ID,
    business_name: 'Kokanastha Faral & Sweets',
    gstin: '27AABCK1234F1ZM',
    invoice_prefix: 'KF-',
    low_stock_limit: 15,
    barcode_format: 'CODE-128',
    qr_size: 150,
    enable_email_alerts: true,
    enable_sms_alerts: true,
    theme: 'light'
  }
];

const PRE_SEEDED_STOCK_LOGS: StockLog[] = [];

const PRE_SEEDED_SYSTEM_AUDIT_LOGS: SystemAuditLog[] = [];

export type TimeHorizon = 'today' | 'yesterday' | '7days' | '30days' | 'all' | 'custom';

export function isComboProduct(p: Partial<Product> | null | undefined): boolean {
  if (!p) return false;
  
  // 1. Check explicit is_combo flag
  const flag = p.is_combo;
  const isComboFlag = flag === true || 
                     (flag as any) === 1 || 
                     String(flag).toLowerCase() === 'true';
  
  // 2. Check combo_items (recipe)
  // Check if it's a non-empty array
  let hasItems = false;
  if (Array.isArray(p.combo_items)) {
    hasItems = p.combo_items.length > 0;
  } else if (typeof p.combo_items === 'string') {
    try {
      const parsed = JSON.parse(p.combo_items);
      hasItems = Array.isArray(parsed) && parsed.length > 0;
    } catch (e) {
      hasItems = false;
    }
  }
  
  return Boolean(isComboFlag || hasItems);
}

export function isOrderInTimeHorizon(
  order: SalesOrder, 
  horizon: TimeHorizon,
  customStartDate?: string,
  customEndDate?: string
): boolean {
  if (horizon === 'all') return true;

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const date = now.getDate();

  const todayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`;

  const yesterdayDate = new Date(year, month, date - 1);
  const yesterdayStr = `${yesterdayDate.getFullYear()}-${String(yesterdayDate.getMonth() + 1).padStart(2, '0')}-${String(yesterdayDate.getDate()).padStart(2, '0')}`;

  // Normalize order date to YYYY-MM-DD
  let rawDateStr = '';
  if (order.order_date) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(order.order_date)) {
      rawDateStr = order.order_date;
    } else {
      const d = new Date(order.order_date);
      if (!isNaN(d.getTime())) {
        rawDateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      } else {
        rawDateStr = order.order_date.split('T')[0];
      }
    }
  } else if (order.created_at) {
    const d = new Date(order.created_at);
    if (!isNaN(d.getTime())) {
      rawDateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    } else {
      rawDateStr = order.created_at.split('T')[0];
    }
  }

  if (!rawDateStr) {
    return horizon === 'today';
  }

  if (horizon === 'custom') {
    if (!customStartDate || !customEndDate) return true;
    return rawDateStr >= customStartDate && rawDateStr <= customEndDate;
  }

  if (horizon === 'today') {
    return rawDateStr === todayStr;
  }

  if (horizon === 'yesterday') {
    return rawDateStr === yesterdayStr;
  }

  const parts = rawDateStr.split('-');
  if (parts.length < 3) return true;
  const oYear = parseInt(parts[0], 10);
  const oMonth = parseInt(parts[1], 10) - 1;
  const oDay = parseInt(parts[2], 10);

  const orderDateObj = new Date(oYear, oMonth, oDay);
  const todayObj = new Date(year, month, date);

  const diffMs = todayObj.getTime() - orderDateObj.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (horizon === '7days') {
    return diffDays >= 0 && diffDays < 7;
  }

  if (horizon === '30days') {
    return diffDays >= 0 && diffDays < 30;
  }

  return true;
}

// ====================================================================
// STORAGE STATE CLASS (LOCALSTORAGE BACKED)
// ====================================================================

class ERPStorage {
  private listeners: (() => void)[] = [];
  private pendingUploads = new Set<string>();
  private realtimeChannel: any = null;
  
  public setRealtimeChannel(channel: any) {
    this.realtimeChannel = channel;
  }

  public getRealtimeChannel(): any {
    return this.realtimeChannel;
  }

  public broadcastForceLogout(userId: string, newSessionToken: string, activeDeviceId?: string) {
    if (this.realtimeChannel) {
      this.realtimeChannel.send({
        type: 'broadcast',
        event: 'force_logout',
        payload: { userId, newSessionToken, activeDeviceId }
      }).catch(() => {});
    }
    if (this.bc) {
      try {
        this.bc.postMessage({ type: 'FORCE_LOGOUT', payload: { userId, newSessionToken, activeDeviceId } });
      } catch (e) {}
    }
  }

  public broadcastForceLogoutAll(userId: string, reason: string = 'CONCURRENT_DEVICE_LOGIN') {
    if (this.realtimeChannel) {
      try {
        this.realtimeChannel.send({
          type: 'broadcast',
          event: 'force_logout_all',
          payload: { userId, reason }
        }).catch(() => {});
      } catch (e) {}
    }
    if (this.bc) {
      try {
        this.bc.postMessage({ type: 'FORCE_LOGOUT_ALL', payload: { userId, reason } });
      } catch (e) {}
    }
  }

  public subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => { this.listeners = this.listeners.filter(l => l !== listener); };
  }
  private notify() {
    this.listeners.forEach(l => l());
  }
  private cache: {
    businesses: Business[];
    profiles: (UserProfile & { password_hash?: string })[];
    categories: Category[];
    products: Product[];
    customers: Customer[];
    suppliers: Supplier[];
    purchases: PurchaseOrder[];
    sales: SalesOrder[];
    settings: BusinessSettings[];
    stockLogs: StockLog[];
    auditLogs: SystemAuditLog[];
    packingSessions: PackingSession[];
    messages: ChatMessage[];
    loyaltyConfigs: LoyaltyConfig[];
    loyaltyLogs: LoyaltyLog[];
    subscriptions: CustomerSubscription[];
    comboLogs: ComboHistoryLog[];
  };

  private draftReservations: DraftInvoiceReservation[] = [];
  private activeDeviceSessions: ActiveDeviceSession[] = [];
  private bc: BroadcastChannel | null = null;

  constructor() {
    const catStr = localStorage.getItem('omnipack_erp_categories');
    if (catStr && catStr.includes('"cat-')) {
       console.log('Clearing old invalid local storage with non-UUIDs...');
       localStorage.clear();
    }
    this.cache = {
      businesses: this.load('businesses', PRE_SEEDED_BUSINESSES),
      profiles: this.load('profiles', PRE_SEEDED_PROFILES),
      categories: this.load('categories', PRE_SEEDED_CATEGORIES),
      products: this.load('products', PRE_SEEDED_PRODUCTS),
      customers: this.load('customers', PRE_SEEDED_CUSTOMERS),
      suppliers: this.load('suppliers', PRE_SEEDED_SUPPLIERS),
      purchases: this.load('purchases', PRE_SEEDED_PURCHASES),
      sales: this.load('sales', PRE_SEEDED_SALES),
      settings: this.load('settings', PRE_SEEDED_SETTINGS),
      stockLogs: this.load('stockLogs', PRE_SEEDED_STOCK_LOGS),
      auditLogs: this.load('auditLogs', PRE_SEEDED_SYSTEM_AUDIT_LOGS),
      packingSessions: this.load('packingSessions', []),
      messages: this.load('messages', []),
      loyaltyConfigs: this.load('loyaltyConfigs', []),
      loyaltyLogs: this.load('loyaltyLogs', PRE_SEEDED_LOYALTY_LOGS),
      subscriptions: this.load('subscriptions', PRE_SEEDED_SUBSCRIPTIONS),
      comboLogs: this.load('comboLogs', [])
    };
    this.draftReservations = this.load('draftReservations', []);
    this.activeDeviceSessions = this.load('deviceSessions', []);

    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.bc = new BroadcastChannel('omnipack_erp_sync_channel');
        this.bc.onmessage = (event) => {
          if (event.data) {
            if (event.data.type === 'SYNC_STATE') {
              this.reloadFromLocalStorage();
            } else if (event.data.type === 'SYNC_DRAFT_RESERVATIONS') {
              if (event.data.reservations && Array.isArray(event.data.reservations)) {
                this.syncIncomingDraftReservations(event.data.reservations);
              } else {
                this.getActiveDraftReservations();
                this.notify();
              }
            } else if (event.data.type === 'SYNC_DEVICE_SESSIONS') {
              if (event.data.sessions && Array.isArray(event.data.sessions)) {
                this.syncIncomingDeviceSessions(event.data.sessions);
              } else {
                this.getActiveDeviceSessions();
                this.notify();
              }
            } else if (event.data.type === 'FORCE_LOGOUT' || event.data.type === 'FORCE_LOGOUT_ALL') {
              // Trigger a state change to app
              this.notify();
            }
          }
        };
      } catch (e) {}
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key === 'omnipack_erp_draftReservations') {
          this.draftReservations = this.load('draftReservations', []);
          this.notify();
        } else if (e.key === 'omnipack_erp_deviceSessions') {
          this.activeDeviceSessions = this.load('deviceSessions', []);
          this.notify();
        } else if (e.key && e.key.startsWith('omnipack_erp_')) {
          this.reloadFromLocalStorage();
        }
      });
    }
  }

  public reloadFromLocalStorage() {
    this.cache = {
      businesses: this.load('businesses', PRE_SEEDED_BUSINESSES),
      profiles: this.load('profiles', PRE_SEEDED_PROFILES),
      categories: this.load('categories', PRE_SEEDED_CATEGORIES),
      products: this.load('products', PRE_SEEDED_PRODUCTS),
      customers: this.load('customers', PRE_SEEDED_CUSTOMERS),
      suppliers: this.load('suppliers', PRE_SEEDED_SUPPLIERS),
      purchases: this.load('purchases', PRE_SEEDED_PURCHASES),
      sales: this.load('sales', PRE_SEEDED_SALES),
      settings: this.load('settings', PRE_SEEDED_SETTINGS),
      stockLogs: this.load('stockLogs', PRE_SEEDED_STOCK_LOGS),
      auditLogs: this.load('auditLogs', PRE_SEEDED_SYSTEM_AUDIT_LOGS),
      packingSessions: this.load('packingSessions', []),
      messages: this.load('messages', []),
      loyaltyConfigs: this.load('loyaltyConfigs', []),
      loyaltyLogs: this.load('loyaltyLogs', PRE_SEEDED_LOYALTY_LOGS),
      subscriptions: this.load('subscriptions', PRE_SEEDED_SUBSCRIPTIONS),
      comboLogs: this.load('comboLogs', [])
    };
    this.draftReservations = this.load('draftReservations', []);
    this.notify();
  }

  private load<T>(key: string, defaultValue: T): T {
    try {
      const data = localStorage.getItem(`omnipack_erp_${key}`);
      return data ? JSON.parse(data) : defaultValue;
    } catch (e) {
      console.warn(`Error loading state for key ${key}`, e);
      return defaultValue;
    }
  }


  
  public async forcePushAllToSupabase() {
    if (!isSupabaseConfigured || !supabase) throw new Error('Supabase not configured');
    console.log('Force pushing local pre-seeded data to Supabase...');
    
    const errors = [];
    let err;

    // Order matters for foreign keys!
    err = await this.syncToSupabase('businesses', this.cache.businesses);
    if (err) errors.push('businesses: ' + err.message);

    err = await this.syncToSupabase('settings', this.cache.settings);
    if (err) errors.push('settings: ' + err.message);
    
    // Skip profiles since they are managed by Supabase Auth
    
    err = await this.syncToSupabase('categories', this.cache.categories);
    if (err) errors.push('categories: ' + err.message);

    err = await this.syncToSupabase('products', this.cache.products);
    if (err) errors.push('products: ' + err.message);

    err = await this.syncToSupabase('customers', this.cache.customers);
    if (err) errors.push('customers: ' + err.message);

    err = await this.syncToSupabase('suppliers', this.cache.suppliers);
    if (err) errors.push('suppliers: ' + err.message);

    err = await this.syncToSupabase('purchases', this.cache.purchases);
    if (err) errors.push('purchases: ' + err.message);

    err = await this.syncToSupabase('sales', this.cache.sales);
    if (err) errors.push('sales: ' + err.message);

    err = await this.syncToSupabase('loyaltyLogs', this.cache.loyaltyLogs);
    if (err) errors.push('loyaltyLogs: ' + err.message);

    err = await this.syncToSupabase('subscriptions', this.cache.subscriptions);
    if (err) errors.push('subscriptions: ' + err.message);

    if (errors.length > 0) {
       throw new Error(errors.join('\n'));
    }
  }

  public async syncFromSupabase(businessId?: string, targetTable?: string) {
    if (!isSupabaseConfigured || !supabase) return;
    
    console.log('Syncing from Supabase...');
    try {
    const tables = {
       businesses: 'businesses',
       profiles: 'users_profiles',
       categories: 'categories',
       products: 'products',
       customers: 'customers',
       suppliers: 'suppliers',
       purchases: 'purchase_orders',
       sales: 'sales_orders',
       packingSessions: 'packing_sessions',
       stockLogs: 'stock_logs',
       auditLogs: 'system_audit_logs',
       settings: 'business_settings',
       messages: 'chat_messages',
       loyaltyLogs: 'loyalty_logs',
       loyaltyConfigs: 'loyalty_configs',
       subscriptions: 'customer_subscriptions',
       comboLogs: 'combo_history_logs'
    };

    const fetchAllFromTable = async (tableName: string, bId?: string) => {
      let allRows: any[] = [];
      let start = 0;
      const CHUNK_SIZE = 200;
      const normBId = bId ? normalizeBusinessId(bId) : undefined;
      while (true) {
        let q = supabase.from(tableName).select('*').order(tableName === 'business_settings' || tableName === 'loyalty_configs' ? 'business_id' : 'id');
        if (normBId && tableName !== 'businesses' && tableName !== 'users_profiles') {
          q = q.eq('business_id', normBId);
        } else if (normBId && tableName === 'businesses') {
          q = q.eq('id', normBId);
        }
        q = q.range(start, start + CHUNK_SIZE - 1);
        const { data: pageData, error: pageErr } = await q;
        if (pageErr) {
          console.warn(`Supabase fetchAllFromTable error on ${tableName}:`, pageErr);
          break;
        }
        if (!pageData || pageData.length === 0) break;
        allRows.push(...pageData);
        start += pageData.length;
      }
      return allRows;
    };

       const syncPromises = Object.entries(tables)
      .filter(([_, table]) => !targetTable || table === targetTable)
      .map(async ([key, table]) => {
       try {
       const data = await fetchAllFromTable(table, businessId);
       if (data) {
          if (data.length === 0) {
             if (key !== 'businesses' && key !== 'profiles' && key !== 'settings' && key !== 'loyaltyConfigs') {
                // Only clear if local cache is also empty or missing
                if (!this.cache[key as keyof typeof this.cache] || (this.cache[key as keyof typeof this.cache] as any[]).length === 0) {
                  (this.cache as any)[key] = [];
                  localStorage.setItem(`omnipack_erp_${key}`, JSON.stringify([]));
                }
             }
             return;
          }
          if (key === 'profiles') {
             const existingPasswords: Record<string, string> = {};
             this.cache.profiles.forEach(p => {
               if (p.email && (p as any).password_hash) {
                 existingPasswords[p.email.toLowerCase().trim()] = (p as any).password_hash;
               }
             });
             try {
               const saved = JSON.parse(localStorage.getItem('omnipack_erp_passwords') || '{}');
               Object.assign(existingPasswords, saved);
             } catch(e) {}
             const mergedProfiles = data.map((p: any) => {
               const localUser = this.cache.profiles.find(localP => localP.id === p.id);
               return {
                 ...p,
                 password_hash: (p as any).password_hash || existingPasswords[p.email?.toLowerCase()?.trim()] || undefined,
                 allowed_pages: p.allowed_pages || localUser?.allowed_pages || undefined
               };
             });
             this.cache.profiles = mergedProfiles;
             localStorage.setItem(`omnipack_erp_profiles`, JSON.stringify(mergedProfiles));
          } else if (key === 'sales') {
             const itemsData = await fetchAllFromTable('sales_order_items');
             const itemsByOrder: Record<string, any[]> = {};
             (itemsData || []).forEach((item: any) => {
               if (!itemsByOrder[item.sales_order_id]) itemsByOrder[item.sales_order_id] = [];
               itemsByOrder[item.sales_order_id].push(item);
             });

             const mergedSales = (data || []).map((so: any) => {
               const existingSO = (this.cache.sales || []).find(s => s.id === so.id);
               if (existingSO && this.pendingUploads.has(existingSO.id)) return existingSO;
               if (so.status === 'Cancelled' && so.dispatch_notes?.includes('[SYSTEM_RETURNED]')) {
                 so.status = 'Returned';
               }
               const hasRemoteItems = itemsByOrder[so.id] && itemsByOrder[so.id].length > 0;
               const rawItems = hasRemoteItems 
                 ? itemsByOrder[so.id] 
                 : (existingSO?.items && existingSO.items.length > 0 ? existingSO.items : (so.items || []));
               const mergedItems = rawItems.map((rit: any) => {
                 const existingItem = existingSO?.items?.find((eit: any) => eit.product_id === rit.product_id || eit.id === rit.id);
                 const existingScanned = typeof existingItem?.scanned_qty === 'number' && !isNaN(existingItem.scanned_qty) ? existingItem.scanned_qty : 0;
                 const remoteScanned = typeof rit.scanned_qty === 'number' && !isNaN(rit.scanned_qty) ? rit.scanned_qty : 0;
                 return {
                   ...rit,
                   scanned_qty: Math.max(existingScanned, remoteScanned)
                 };
               });
               return {
                 ...existingSO,
                 ...so,
                 area: so.area || existingSO?.area || undefined,
                 channel: so.channel || existingSO?.channel || undefined,
                 time: so.time || existingSO?.time || undefined,
                 items: mergedItems
               };
             });
             this.cache.sales = mergedSales;
             localStorage.setItem('omnipack_erp_sales', JSON.stringify(mergedSales));
          } else if (key === 'customers') {
             const remoteMap = new Map((data || []).map((cust: any) => [cust.id, cust]));
             const mergedMap = new Map<string, any>();

             (this.cache.customers || []).forEach((localCust: any) => {
               const remoteCust = remoteMap.get(localCust.id);
               if (remoteCust) {
                 mergedMap.set(localCust.id, {
                   ...localCust,
                   ...remoteCust,
                   area: remoteCust.area || localCust?.area || undefined,
                   loyalty_points: typeof remoteCust.loyalty_points === 'number' ? remoteCust.loyalty_points : (localCust?.loyalty_points || 0),
                   loyalty_tier: remoteCust.loyalty_tier || localCust?.loyalty_tier || 'Silver',
                   lifetime_spend: typeof remoteCust.lifetime_spend === 'number' ? remoteCust.lifetime_spend : (localCust?.lifetime_spend || 0)
                 });
               } else {
                 mergedMap.set(localCust.id, localCust);
               }
             });

             (data || []).forEach((remoteCust: any) => {
               if (!mergedMap.has(remoteCust.id)) {
                 mergedMap.set(remoteCust.id, remoteCust);
               }
             });

             const mergedCustomers = Array.from(mergedMap.values());
             this.cache.customers = mergedCustomers;
             localStorage.setItem('omnipack_erp_customers', JSON.stringify(mergedCustomers));
          } else if (key === 'purchases') {
             const itemsData = await fetchAllFromTable('purchase_order_items');
             const itemsByPO: Record<string, any[]> = {};
             (itemsData || []).forEach((item: any) => {
               if (!itemsByPO[item.purchase_order_id]) itemsByPO[item.purchase_order_id] = [];
               itemsByPO[item.purchase_order_id].push(item);
             });
             const mergedPurchases = (data || []).map((po: any) => {
               const existingPO = (this.cache.purchases || []).find(p => p.id === po.id);
               return {
                 ...existingPO,
                 ...po,
                 items: (itemsByPO[po.id] && itemsByPO[po.id].length > 0)
                   ? itemsByPO[po.id]
                   : (existingPO?.items && existingPO.items.length > 0 ? existingPO.items : (po.items || []))
               };
             });
             this.cache.purchases = mergedPurchases;
             localStorage.setItem('omnipack_erp_purchases', JSON.stringify(mergedPurchases));
          } else if (key === 'products') {
             const remoteMap = new Map((data || []).map((prod: any) => [prod.id, prod]));
             const mergedMap = new Map<string, any>();

             (this.cache.products || []).forEach((localProd: any) => {
               const remoteProd = remoteMap.get(localProd.id);
               if (remoteProd) {
                 mergedMap.set(localProd.id, {
                   ...localProd,
                   ...remoteProd,
                   business_id: normalizeBusinessId(remoteProd.business_id || localProd.business_id),
                   purchase_unit: remoteProd.purchase_unit || localProd?.purchase_unit || undefined,
                   selling_unit: remoteProd.selling_unit || localProd?.selling_unit || undefined,
                   auto_conversion: remoteProd.auto_conversion ?? localProd?.auto_conversion,
                   rate_nr: typeof remoteProd.rate_nr === 'number' ? remoteProd.rate_nr : localProd?.rate_nr,
                   rate_lmr: typeof remoteProd.rate_lmr === 'number' ? remoteProd.rate_lmr : localProd?.rate_lmr,
                   rate_abr: typeof remoteProd.rate_abr === 'number' ? remoteProd.rate_abr : localProd?.rate_abr,
                   rate_ddr: typeof remoteProd.rate_ddr === 'number' ? remoteProd.rate_ddr : localProd?.rate_ddr,
                   is_combo: remoteProd.is_combo ?? localProd?.is_combo,
                   combo_items: remoteProd.combo_items || localProd?.combo_items,
                   current_stock: typeof remoteProd.current_stock === 'number' ? remoteProd.current_stock : (localProd?.current_stock || 0)
                 });
               } else {
                 mergedMap.set(localProd.id, {
                   ...localProd,
                   business_id: normalizeBusinessId(localProd.business_id)
                 });
               }
             });

             (data || []).forEach((remoteProd: any) => {
               if (!mergedMap.has(remoteProd.id)) {
                 mergedMap.set(remoteProd.id, {
                   ...remoteProd,
                   business_id: normalizeBusinessId(remoteProd.business_id)
                 });
               }
             });

             const mergedProducts = Array.from(mergedMap.values());
             this.cache.products = mergedProducts;
             localStorage.setItem('omnipack_erp_products', JSON.stringify(mergedProducts));
          } else if (key === 'categories') {
             const remoteMap = new Map((data || []).map((cat: any) => [cat.id, cat]));
             const mergedMap = new Map<string, any>();

             (this.cache.categories || []).forEach((localCat: any) => {
               const remoteCat = remoteMap.get(localCat.id);
               if (remoteCat) {
                 mergedMap.set(localCat.id, { ...localCat, ...remoteCat });
               } else {
                 mergedMap.set(localCat.id, localCat);
               }
             });

             (data || []).forEach((remoteCat: any) => {
               if (!mergedMap.has(remoteCat.id)) {
                 mergedMap.set(remoteCat.id, remoteCat);
               }
             });

             const mergedCategories = Array.from(mergedMap.values());
             this.cache.categories = mergedCategories;
             localStorage.setItem('omnipack_erp_categories', JSON.stringify(mergedCategories));
          } else if (key === 'suppliers') {
             const remoteMap = new Map((data || []).map((sup: any) => [sup.id, sup]));
             const mergedMap = new Map<string, any>();

             (this.cache.suppliers || []).forEach((localSup: any) => {
               const remoteSup = remoteMap.get(localSup.id);
               if (remoteSup) {
                 mergedMap.set(localSup.id, { ...localSup, ...remoteSup });
               } else {
                 mergedMap.set(localSup.id, localSup);
               }
             });

             (data || []).forEach((remoteSup: any) => {
               if (!mergedMap.has(remoteSup.id)) {
                 mergedMap.set(remoteSup.id, remoteSup);
               }
             });

             const mergedSuppliers = Array.from(mergedMap.values());
             this.cache.suppliers = mergedSuppliers;
             localStorage.setItem('omnipack_erp_suppliers', JSON.stringify(mergedSuppliers));
          } else if (key === 'businesses') {
             const mergedBusinesses = (data || []).map((b: any) => {
                const existing = (this.cache.businesses || []).find(eb => eb.id === b.id);
                if (!existing) return b;
                return { ...existing, ...b };
             });
             this.cache.businesses = mergedBusinesses.length > 0 ? mergedBusinesses : this.cache.businesses;
             localStorage.setItem('omnipack_erp_businesses', JSON.stringify(this.cache.businesses));
          } else {
             (this.cache as any)[key] = data;
             localStorage.setItem(`omnipack_erp_${key}`, JSON.stringify(data));
          }
       }
       } catch (tableErr) {
         console.warn(`Supabase query failed for ${table}:`, tableErr);
       }
    });

    await Promise.all(syncPromises);

    this.notify();
    } catch (err) {
      console.warn('Supabase syncFromSupabase network error:', err);
    }
  }

  private async syncToSupabase(key: keyof typeof this.cache, dataItem: any, isDelete = false, deleteId?: string) {
    if (!isSupabaseConfigured || !supabase) return;
    try {
    
    const tables: any = {
       businesses: 'businesses',
       profiles: 'users_profiles',
       categories: 'categories',
       products: 'products',
       customers: 'customers',
       suppliers: 'suppliers',
       purchases: 'purchase_orders',
       sales: 'sales_orders',
       packingSessions: 'packing_sessions',
       stockLogs: 'stock_logs',
       auditLogs: 'system_audit_logs',
       settings: 'business_settings',
       messages: 'chat_messages',
       loyaltyLogs: 'loyalty_logs',
       loyaltyConfigs: 'loyalty_configs',
       subscriptions: 'customer_subscriptions',
       comboLogs: 'combo_history_logs'
    };
    
    const tableName = tables[key];
    if (!tableName) return;

    const isValidUUID = (val: any): boolean => {
        if (typeof val !== 'string') return false;
        return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
    };

    const legacyIdMap: Record<string, string> = {
        'biz-1': BIZ_ID,
        'c1': CUST_1_ID,
        'c2': CUST_2_ID,
        'c3': CUST_3_ID,
        'p1': PROD_1_ID,
        'p2': PROD_2_ID,
        'p3': PROD_3_ID,
        'p4': PROD_4_COMBO_ID,
        'cat1': CAT_1_ID,
        'cat1_1': CAT_1_ID,
        'cat1_2': CAT_1_ID,
        'so-1001': SO_1001_ID,
        'so-1002': SO_1002_ID,
        'so-1003': SO_1003_ID,
        'so-1004': SO_1004_ID,
        'so-1005': SO_1005_ID,
        'so-1006': SO_1006_ID,
        'so-1007': SO_1007_ID,
        'so-1008': SO_1008_ID,
        'l1': 'e1111111-1111-4111-8111-111111111001',
        'l2': 'e1111111-1111-4111-8111-111111111002',
        'l3': 'e1111111-1111-4111-8111-111111111003',
        'sub-1': 'f1111111-1111-4111-8111-111111111001',
        'sub-2': 'f1111111-1111-4111-8111-111111111002'
    };

    if (dataItem) {
        if (Array.isArray(dataItem)) {
            dataItem.forEach((item: any) => { if (item && item.id) this.pendingUploads.add(item.id) });
        } else if (dataItem.id) {
            this.pendingUploads.add(dataItem.id);
        }
    }
    
    if (isDelete && deleteId) {
       const finalDeleteId = legacyIdMap[deleteId] || deleteId;
       
       // Handle manual cascading deletes for products to avoid foreign key errors in Supabase
       if (tableName === 'products') {
         try {
           await supabase.from('stock_logs').delete().eq('product_id', finalDeleteId);
           await supabase.from('combo_history_logs').delete().eq('combo_id', finalDeleteId);
         } catch (e) {
           console.warn('Cascading delete warning:', e);
         }
       }

       const { error } = await supabase.from(tableName).delete().eq(tableName === 'business_settings' ? 'business_id' : 'id', finalDeleteId);
       if (error) {
         if (error.code === 'PGRST205') return; // Ignore missing table
         console.warn(`Supabase delete error on ${tableName}:`, JSON.stringify(error));
         return error;
       }
    } else if (dataItem) {
       if (Array.isArray(dataItem) && dataItem.length === 0) return;
       
       let payload = Array.isArray(dataItem) ? [...dataItem] : { ...dataItem };
       let salesItems = [];
       let purchaseItems = [];

       const sanitizeUUID = (val: any, isNullable = false): string | null => {
           if (!val) return isNullable ? null : crypto.randomUUID();
           if (isValidUUID(val)) return val;
           if (legacyIdMap[val]) return legacyIdMap[val];
           if (isNullable) return null;
           return crypto.randomUUID();
       };
       
       let activeBusinessId: string | null = null;
       try {
           const sess = JSON.parse(localStorage.getItem('omnipack_session') || '{}');
           if (sess.businessId) activeBusinessId = sess.businessId;
       } catch (e) {}
       
       const cleanItem = (item: any) => {
           const clean = { ...item };
           if (clean.id && tableName !== 'business_settings') {
               clean.id = sanitizeUUID(clean.id, false);
           }
           if (clean.business_id) {
               clean.business_id = sanitizeUUID(clean.business_id, false);
           } else if (activeBusinessId && tableName !== 'users_profiles' && tableName !== 'businesses') {
               clean.business_id = sanitizeUUID(activeBusinessId, false);
           }
           
           if (tableName === 'business_settings') {
               delete clean.business_name;
               delete clean.gstin;
               delete clean.invoice_prefix;
               clean.business_id = sanitizeUUID(clean.business_id, false);
           }
           if (tableName === 'loyalty_configs') {
               clean.business_id = sanitizeUUID(clean.business_id, false);
           }
           if (tableName === 'customers') {
               delete clean.area;
               if (clean.pan) clean.pan = String(clean.pan).substring(0, 10);
               if (clean.gstin) clean.gstin = String(clean.gstin).substring(0, 15);
               clean.loyalty_points = Number(clean.loyalty_points || 0);
               clean.lifetime_spend = Number(clean.lifetime_spend || 0);
               if (!clean.loyalty_tier) clean.loyalty_tier = 'Silver';
           }
           if (tableName === 'suppliers') {
               if (clean.pan) clean.pan = String(clean.pan).substring(0, 10);
               if (clean.gstin) clean.gstin = String(clean.gstin).substring(0, 15);
           }
           if (tableName === 'products') {
               clean.category_id = sanitizeUUID(clean.category_id, true);
               if (clean.sku === '' || clean.sku === null) {
                   clean.sku = 'SKU-' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase();
               }
               if (!clean.barcode) {
                   clean.barcode = 'BAR-' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase();
               }
           }
           if (tableName === 'categories') {
               clean.parent_id = sanitizeUUID(clean.parent_id, true);
           }
           if (tableName === 'sales_orders') {
               delete clean.area;
               if (clean.status === 'Returned') {
                 clean.status = 'Cancelled';
                 clean.dispatch_notes = (clean.dispatch_notes || '') + ' [SYSTEM_RETURNED]';
               }
               clean.customer_id = sanitizeUUID(clean.customer_id, true);
               if (clean.customer_id && Array.isArray(this.cache.customers) && !this.cache.customers.some((c: any) => c.id === clean.customer_id)) {
                   clean.customer_id = null;
               }
               if (clean.items) {
                   clean.items.forEach((i: any) => {
                       const si = { ...i, sales_order_id: clean.id };
                       si.id = sanitizeUUID(si.id, false);
                       si.product_id = sanitizeUUID(si.product_id, false);
                       delete si.is_overridden; delete si.normal_rate; delete si.rate_type; delete si.rate_reason; delete si.unit_savings; delete si.original_calc_price;
                       salesItems.push(si);
                   });
               }
               delete clean.items;
           }
           if (tableName === 'purchase_orders') {
               clean.supplier_id = sanitizeUUID(clean.supplier_id, false);
               if (clean.items) {
                   clean.items.forEach((i: any) => {
                       const pi = { ...i, purchase_order_id: clean.id };
                       pi.id = sanitizeUUID(pi.id, false);
                       pi.product_id = sanitizeUUID(pi.product_id, false);
                       delete pi.is_overridden;
                       purchaseItems.push(pi);
                   });
               }
               delete clean.items;
           }
           if (tableName === 'users_profiles') {
               // We intentionally preserve password_hash so users created via UI can log in
               delete clean.session_token;
           }
           if (tableName === 'stock_logs') {
               clean.product_id = sanitizeUUID(clean.product_id, false);
               clean.created_by = sanitizeUUID(clean.created_by, true);
           }
           if (tableName === 'system_audit_logs') {
               clean.user_id = sanitizeUUID(clean.user_id, true);
           }
           if (tableName === 'packing_sessions') {
               clean.order_id = sanitizeUUID(clean.order_id, false);
               clean.packing_staff_id = sanitizeUUID(clean.packing_staff_id, false);
           }
           if (tableName === 'chat_messages') {
               clean.sender_id = sanitizeUUID(clean.sender_id, false);
               clean.receiver_id = sanitizeUUID(clean.receiver_id, false);
           }
           if (tableName === 'businesses') {
               delete clean.last_supabase_sync;
               delete clean.loyalty_config;
               if (clean.invoice_prefix) clean.invoice_prefix = String(clean.invoice_prefix).substring(0, 10);
               if (clean.festive_invoice_prefix) clean.festive_invoice_prefix = String(clean.festive_invoice_prefix).substring(0, 50);
               if (clean.currency_symbol) clean.currency_symbol = String(clean.currency_symbol).substring(0, 10);
               if (clean.pan) clean.pan = String(clean.pan).substring(0, 10);
               if (clean.gstin) clean.gstin = String(clean.gstin).substring(0, 15);
               if (clean.upi_id) clean.upi_id = String(clean.upi_id).substring(0, 255);
               if (clean.account_number) clean.account_number = String(clean.account_number).substring(0, 100);
               if (clean.ifsc_code) clean.ifsc_code = String(clean.ifsc_code).substring(0, 50);
               if (clean.account_holder) clean.account_holder = String(clean.account_holder).substring(0, 255);
           }
           if (tableName === 'loyalty_logs') {
               clean.customer_id = sanitizeUUID(clean.customer_id, true);
               clean.order_id = sanitizeUUID(clean.order_id, true);
           }
           if (tableName === 'customer_subscriptions') {
               clean.customer_id = sanitizeUUID(clean.customer_id, true);
               clean.last_order_id = sanitizeUUID(clean.last_order_id, true);
               if (!clean.next_delivery_date && clean.next_billing_date) {
                   clean.next_delivery_date = clean.next_billing_date;
               }
               if (!clean.next_billing_date && clean.next_delivery_date) {
                   clean.next_billing_date = clean.next_delivery_date;
               }
               if (Array.isArray(clean.items)) {
                   clean.items = clean.items.map((it: any) => ({
                       ...it,
                       product_id: sanitizeUUID(it.product_id, true)
                   }));
               }
           }
           return clean;
       };
       
       const doUpsert = async (items: any) => {
         let upsertRes = await supabase.from(tableName).upsert(items);
         let error = upsertRes.error;
         let attempts = 0;
         while (error && error.code === 'PGRST204' && attempts < 30) {
           attempts++;
           const match = error.message.match(/Could not find the '([^']+)' column/i);
           if (match && match[1]) {
             const missingCol = match[1];
             const stripCol = (item: any) => {
               if (item && typeof item === 'object') {
                 const copy = { ...item };
                 delete copy[missingCol];
                 return copy;
               }
               return item;
             };
             items = Array.isArray(items) ? items.map(stripCol) : stripCol(items);
             upsertRes = await supabase.from(tableName).upsert(items);
             error = upsertRes.error;
           } else {
             break;
           }
         }
         if (error && error.code === '23503') {
           const stripFks = (item: any) => {
             if (item && typeof item === 'object') {
               const copy = { ...item };
               if ('order_id' in copy) copy.order_id = null;
               if ('customer_id' in copy) copy.customer_id = null;
               if ('last_order_id' in copy) copy.last_order_id = null;
               if ('product_id' in copy) copy.product_id = null;
               return copy;
             }
             return item;
           };
           items = Array.isArray(items) ? items.map(stripFks) : stripFks(items);
           upsertRes = await supabase.from(tableName).upsert(items);
           error = upsertRes.error;
         }
         return error;
       };

       if (Array.isArray(payload)) {
           payload = payload.map(cleanItem);
           const CHUNK_SIZE = 200;
           for (let i = 0; i < payload.length; i += CHUNK_SIZE) {
             const chunk = payload.slice(i, i + CHUNK_SIZE);
             const err = await doUpsert(chunk);
             if (err && err.code !== 'PGRST205') {
               console.warn(`Supabase sync error on chunk of ${tableName}:`, JSON.stringify(err));
             }
           }
           return;
       } else {
           payload = cleanItem(payload);
       }

       let upsertRes = await supabase.from(tableName).upsert(payload);
       let error = upsertRes.error;
       let attempts = 0;
       while (error && error.code === 'PGRST204' && attempts < 30) {
         attempts++;
         const match = error.message.match(/Could not find the '([^']+)' column/i);
         if (match && match[1]) {
           const missingCol = match[1];
           console.warn(`Supabase schema cache missing '${missingCol}' on '${tableName}'. Stripping column and retrying...`);
           const stripCol = (item: any) => {
             if (item && typeof item === 'object') {
               const copy = { ...item };
               delete copy[missingCol];
               return copy;
             }
             return item;
           };
           payload = Array.isArray(payload) ? payload.map(stripCol) : stripCol(payload);
           upsertRes = await supabase.from(tableName).upsert(payload);
           error = upsertRes.error;
         } else {
           break;
         }
       }
       if (error && error.code === '23503') {
         console.warn(`Foreign key violation on ${tableName} (${error.message}). Clearing unlinked foreign key IDs and retrying...`);
         const stripFks = (item: any) => {
           if (item && typeof item === 'object') {
             const copy = { ...item };
             if ('order_id' in copy) copy.order_id = null;
             if ('customer_id' in copy) copy.customer_id = null;
             if ('last_order_id' in copy) copy.last_order_id = null;
             if ('product_id' in copy) copy.product_id = null;
             return copy;
           }
           return item;
         };
         payload = Array.isArray(payload) ? payload.map(stripFks) : stripFks(payload);
         upsertRes = await supabase.from(tableName).upsert(payload);
         error = upsertRes.error;
       }
       if (error) {
         if (error.code === 'PGRST205') {
           // Table doesn't exist in Supabase schema (likely a local-only feature for this user)
           return;
         }
         console.warn(`Supabase sync error on ${tableName}:`, JSON.stringify(error));
         return error;
       }
       
       if (tableName === 'sales_orders' && salesItems.length > 0) {
           const { error: err2 } = await supabase.from('sales_order_items').upsert(salesItems);
           if (err2 && err2.code !== 'PGRST205') console.warn('Supabase sync error on sales_order_items:', JSON.stringify(err2));
       }
       
       if (tableName === 'purchase_orders' && purchaseItems.length > 0) {
           const { error: err3 } = await supabase.from('purchase_order_items').upsert(purchaseItems);
           if (err3 && err3.code !== 'PGRST205') console.warn('Supabase sync error on purchase_order_items:', JSON.stringify(err3));
       }
       
       if (dataItem) {
           if (Array.isArray(dataItem)) {
               dataItem.forEach((item: any) => { if (item && item.id) this.pendingUploads.delete(item.id) });
           } else if (dataItem.id) {
               this.pendingUploads.delete(dataItem.id);
           }
       }
       
       if (activeBusinessId && this.realtimeChannel) {
           this.realtimeChannel.send({
               type: 'broadcast',
               event: 'sync_update',
               payload: { businessId: activeBusinessId, key }
           }).catch(() => {});
       }
    }
    } catch (err: any) {
      console.warn(`Supabase sync error on ${key}:`, err);
      return err;
    }
  }

  private save(key: keyof typeof this.cache, dataItem?: any, isDelete = false, deleteId?: string) {
    this.syncToSupabase(key, dataItem, isDelete, deleteId);
    try {
      localStorage.setItem(`omnipack_erp_${key}`, JSON.stringify(this.cache[key]));
    } catch (e) {
      console.warn(`Error saving state for key ${key}`, e);
    }
    if (this.bc) {
      try {
        this.bc.postMessage({ type: 'SYNC_STATE', key });
      } catch (e) {}
    }
    this.notify();
  }

  // Auth Operations
  public login(email: string, password_raw: string, deviceId?: string): { success: boolean; user?: UserProfile; business?: Business; error?: string; conflictDetected?: boolean } {
    const cleanEmail = email.trim().toLowerCase();
    const profile = this.cache.profiles.find(p => p.email.toLowerCase().trim() === cleanEmail);
    if (!profile) {
      return { success: false, error: 'User account not found.' };
    }
    if (!profile.active) {
      return { success: false, error: 'This user account is suspended.' };
    }
    
    // If password_hash is defined and doesn't match
    if (profile.password_hash && profile.password_hash !== password_raw) {
      return { success: false, error: 'Incorrect password.' };
    }

    // Persist password in local storage cache for seamless future syncs
    profile.password_hash = password_raw;
    // Generate new unique session token to enforce single active session (logs out all other devices)
    profile.session_token = 'st_' + Date.now() + '_' + Math.random().toString(36).substring(2, 11);
    this.updateUser(profile.id, { password_hash: password_raw, session_token: profile.session_token });

    if (deviceId) {
      this.registerDeviceSession(profile.id, deviceId, profile.session_token, profile.business_id);
    }

    try {
      const saved = JSON.parse(localStorage.getItem('omnipack_erp_passwords') || '{}');
      saved[cleanEmail] = password_raw;
      localStorage.setItem('omnipack_erp_passwords', JSON.stringify(saved));
    } catch (e) {}

    const business = this.cache.businesses.find(b => b.id === profile.business_id) || this.cache.businesses[0];
    
    // Add audit log
    this.logActivity(profile.id, profile.name, profile.role, 'User Login', `Logged in successfully via email: ${email}`, profile.business_id);

    return { success: true, user: profile, business };
  }

  public getUserById(id: string): UserProfile | undefined {
    return this.cache.profiles.find(u => u.id === id);
  }

  // Tenant / Business Management
  public getBusinesses(): Business[] {
    return dedupeById(this.cache.businesses);
  }

  public getBusiness(id: string): Business | undefined {
    return this.cache.businesses.find(b => b.id === id);
  }

  public updateBusiness(id: string, updates: Partial<Business>): Business {
    const index = this.cache.businesses.findIndex(b => b.id === id);
    if (index !== -1) {
      this.cache.businesses[index] = { ...this.cache.businesses[index], ...updates };
      this.save('businesses', this.cache.businesses.find(b => b.id === id));
      return this.cache.businesses[index];
    }
    throw new Error('Business not found');
  }

  // Profiles (Super Admin can create)
  public getUsers(businessId: string): UserProfile[] {
    return dedupeById(this.cache.profiles.filter(u => u.business_id === businessId));
  }

  public createUser(user: Omit<UserProfile, 'id' | 'created_at'> & { id?: string; password_hash?: string }): UserProfile {
    if (user.email && user.password_hash) {
      try {
        const saved = JSON.parse(localStorage.getItem('omnipack_erp_passwords') || '{}');
        saved[user.email.toLowerCase().trim()] = user.password_hash;
        localStorage.setItem('omnipack_erp_passwords', JSON.stringify(saved));
      } catch (e) {}
    }

    if (user.id) {
      const existing = this.cache.profiles.find(p => p.id === user.id);
      if (existing) {
        if (user.password_hash) {
          (existing as any).password_hash = user.password_hash;
        }
        return existing;
      }
    }

    const newProfile: UserProfile & { password_hash?: string } = {
      ...user,
      id: user.id || crypto.randomUUID(),
      created_at: new Date().toISOString()
    };
    this.cache.profiles.push(newProfile);
    this.save('profiles', newProfile);
    return newProfile;
  }

  public updateUser(id: string, updates: Partial<UserProfile & { password_hash?: string }>): UserProfile {
    const index = this.cache.profiles.findIndex(p => p.id === id);
    if (index !== -1) {
      this.cache.profiles[index] = { ...this.cache.profiles[index], ...updates };
      if (this.cache.profiles[index].email && updates.password_hash) {
        try {
          const saved = JSON.parse(localStorage.getItem('omnipack_erp_passwords') || '{}');
          saved[this.cache.profiles[index].email.toLowerCase().trim()] = updates.password_hash;
          localStorage.setItem('omnipack_erp_passwords', JSON.stringify(saved));
        } catch (e) {}
      }
      this.save('profiles', this.cache.profiles[index]);
      return this.cache.profiles[index];
    }
    throw new Error('User not found');
  }

  public resetPasswordByEmail(email: string, newPassword_hash: string): { success: boolean; error?: string; user?: UserProfile } {
    const cleanEmail = email.trim().toLowerCase();
    const profile = this.cache.profiles.find(p => p.email.trim().toLowerCase() === cleanEmail);
    if (!profile) {
      return { success: false, error: 'User account not found for this email address.' };
    }
    (profile as any).password_hash = newPassword_hash;
    try {
      const saved = JSON.parse(localStorage.getItem('omnipack_erp_passwords') || '{}');
      saved[cleanEmail] = newPassword_hash;
      localStorage.setItem('omnipack_erp_passwords', JSON.stringify(saved));
    } catch (e) {}
    this.save('profiles', profile);
    return { success: true, user: profile };
  }

  public deleteUser(id: string): boolean {
    const index = this.cache.profiles.findIndex(p => p.id === id);
    if (index !== -1) {
      this.cache.profiles.splice(index, 1);
      this.save('profiles', null, true, id);
      return true;
    }
    return false;
  }

  // Category Operations
  public getCategories(businessId: string): Category[] {
    let cats = this.cache.categories.filter(c => !c.business_id || isSameBusiness(c.business_id, businessId));
    if (cats.length === 0) {
      const defaultCatNames = [
        'Faral & Festive Sweets',
        'Snacks & Namkeen',
        'Bakery & Confectionery',
        'Spices & Masalas',
        'Dry Fruits & Nuts',
        'Beverages & Syrups',
        'General & Grocery'
      ];
      defaultCatNames.forEach(name => {
        const newCat: Category = {
          id: crypto.randomUUID(),
          name,
          parent_id: null,
          business_id: normalizeBusinessId(businessId),
          active: true,
          created_at: new Date().toISOString()
        };
        this.cache.categories.push(newCat);
      });
      try {
        localStorage.setItem('omnipack_erp_categories', JSON.stringify(this.cache.categories));
      } catch (e) {}
      cats = this.cache.categories.filter(c => !c.business_id || isSameBusiness(c.business_id, businessId));
    }
    return dedupeById(cats);
  }

  public createCategory(cat: Omit<Category, 'id' | 'created_at'>): Category {
    const normBizId = normalizeBusinessId(cat.business_id);
    const newCat: Category = {
      ...cat,
      business_id: normBizId,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString()
    };
    this.cache.categories.push(newCat);
    this.save('categories', newCat);
    return newCat;
  }

  public updateCategory(id: string, updates: Partial<Category>): Category {
    const index = this.cache.categories.findIndex(c => c.id === id);
    if (index !== -1) {
      this.cache.categories[index] = { ...this.cache.categories[index], ...updates };
      this.save('categories', this.cache.categories[index]);
      return this.cache.categories[index];
    }
    throw new Error('Category not found');
  }

  public deleteCategory(id: string): { success: boolean; error?: string } {
    if (!id) return { success: false, error: 'Category ID is missing.' };
    
    // Check if category is used by any products
    const isUsedByProduct = this.cache.products.some(p => p.category_id === id);
    if (isUsedByProduct) {
      return { success: false, error: 'Cannot delete category: it is currently assigned to one or more products.' };
    }

    // Check if it has subcategories
    const hasChildren = this.cache.categories.some(c => c.parent_id === id);
    if (hasChildren) {
      return { success: false, error: 'Cannot delete category: it has subcategories. Please remove or reassign subcategories first.' };
    }

    const initialLen = this.cache.categories.length;
    this.cache.categories = this.cache.categories.filter(c => c.id !== id);
    if (this.cache.categories.length !== initialLen) {
      this.save('categories', null, true, id);
      return { success: true };
    }
    return { success: false, error: 'Category not found.' };
  }

  // Product Operations
  public getProducts(businessId: string): Product[] {
    return dedupeById(
      this.cache.products
        .filter(p => isSameBusiness(p.business_id, businessId))
        .map(p => ({
          ...p,
          is_combo: isComboProduct(p)
        }))
    );
  }

  public createProduct(prod: Omit<Product, 'id' | 'created_at' | 'current_stock'>): Product {
    if (!prod.sku || prod.sku.trim() === '') {
      prod.sku = 'SKU-' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase();
    }
    const initialStock = prod.opening_stock > 0 ? prod.opening_stock : 0;
    const normBizId = normalizeBusinessId(prod.business_id);
    const newProd: Product = {
      ...prod,
      business_id: normBizId,
      id: crypto.randomUUID(),
      current_stock: initialStock,
      is_combo: false,
      created_at: new Date().toISOString()
    };
    this.cache.products.push(newProd);
    this.save('products', newProd);

    // Add stock log for opening stock - this will trigger the DB to update current_stock
    if (prod.opening_stock > 0) {
      this.addStockLog(newProd.id, prod.opening_stock, 'In', 'Opening Stock Entry', 'System', normBizId);
    }

    return newProd;
  }

  public createProductsBatch(prods: Omit<Product, 'id' | 'created_at' | 'current_stock'>[]): Product[] {
    if (!prods || prods.length === 0) return [];
    const newProducts: Product[] = [];
    const newStockLogs: StockLog[] = [];

    for (const prod of prods) {
      if (!prod.sku || prod.sku.trim() === '') {
        prod.sku = 'SKU-' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase();
      }
      const initialStock = prod.opening_stock > 0 ? prod.opening_stock : 0;
      const normBizId = normalizeBusinessId(prod.business_id);
      const newProd: Product = {
        ...prod,
        business_id: normBizId,
        id: crypto.randomUUID(),
        current_stock: initialStock,
        is_combo: false,
        created_at: new Date().toISOString()
      };
      this.cache.products.push(newProd);
      newProducts.push(newProd);

      if (prod.opening_stock > 0) {
        newStockLogs.push({
          id: crypto.randomUUID(),
          product_id: newProd.id,
          change_qty: prod.opening_stock,
          type: 'In',
          notes: 'Opening Stock Entry',
          created_by: 'System',
          created_at: new Date().toISOString(),
          business_id: normBizId
        });
      }
    }

    this.save('products', newProducts);

    if (newStockLogs.length > 0) {
      this.cache.stockLogs.push(...newStockLogs);
      this.save('stockLogs', newStockLogs);
    }

    return newProducts;
  }

  public updateProduct(id: string, updates: Partial<Product>): Product {
    const index = this.cache.products.findIndex(p => p.id === id);
    if (index !== -1) {
      this.cache.products[index] = { ...this.cache.products[index], ...updates };
      this.save('products', this.cache.products[index]);
      return this.cache.products[index];
    }
    throw new Error('Product not found');
  }

  public deleteProduct(id: string): { success: boolean; error?: string } {
    if (!id) return { success: false, error: 'Product ID is missing.' };
    
    // Normalize ID - some parts of the system might use legacy short IDs (p1, p2...)
    // while others use full UUIDs. We must handle both.
    const legacyIdMap: Record<string, string> = {
      'p1': PROD_1_ID,
      'p2': PROD_2_ID,
      'p3': PROD_3_ID,
      'p4': PROD_4_COMBO_ID
    };

    let lookupId = id;
    let legacyId = null;

    if (legacyIdMap[id]) {
      // Input was a legacy key (e.g. 'p1')
      lookupId = legacyIdMap[id];
      legacyId = id;
    } else {
      // Input was likely a UUID, check if it maps to a legacy key
      const foundKey = Object.keys(legacyIdMap).find(k => legacyIdMap[k] === id);
      if (foundKey) {
        legacyId = foundKey;
      }
    }

    // 1. Check if used in any Sales Orders
    const usedInSales = this.cache.sales.some(order => 
      order.items && order.items.some((item: any) => 
        item.product_id === lookupId || (legacyId && item.product_id === legacyId)
      )
    );
    if (usedInSales) {
      return { success: false, error: 'Cannot delete product: it is linked to one or more Sales Orders. Consider marking it as inactive instead.' };
    }

    // 2. Check if used in any Purchase Orders
    const usedInPurchases = this.cache.purchases.some(order => 
      order.items && order.items.some((item: any) => 
        item.product_id === lookupId || (legacyId && item.product_id === legacyId)
      )
    );
    if (usedInPurchases) {
      return { success: false, error: 'Cannot delete product: it is linked to one or more Purchase Orders.' };
    }

    // 3. Check if used as a component in any Combo products (EXCLUDING the product itself if it is a combo)
    const usedInCombos = this.cache.products.some(p => {
      if (p.id === lookupId || (legacyId && p.id === legacyId)) return false; 
      
      let items: any[] = [];
      if (Array.isArray(p.combo_items)) items = p.combo_items;
      else if (typeof p.combo_items === 'string') {
        try { items = JSON.parse(p.combo_items); } catch(e) {}
      }
      return items.some((item: any) => 
        item.product_id === lookupId || (legacyId && item.product_id === legacyId)
      );
    });
    if (usedInCombos) {
      return { success: false, error: 'Cannot delete product: it is a component in one or more Combo Bundles.' };
    }
    
    const initialLen = this.cache.products.length;
    this.cache.products = this.cache.products.filter(p => 
      p.id !== lookupId && (!legacyId || p.id !== legacyId)
    );
    
    if (this.cache.products.length !== initialLen) {
      // Delete associated stock logs and combo history locally
      this.cache.stockLogs = this.cache.stockLogs.filter(log => 
        log.product_id !== lookupId && (!legacyId || log.product_id !== legacyId)
      );
      localStorage.setItem('omnipack_erp_stockLogs', JSON.stringify(this.cache.stockLogs));
      
      this.cache.comboLogs = (this.cache.comboLogs || []).filter((log: any) => 
        log.combo_id !== lookupId && (!legacyId || log.combo_id !== legacyId)
      );
      localStorage.setItem('omnipack_erp_comboLogs', JSON.stringify(this.cache.comboLogs));
      
      this.save('products', null, true, lookupId);
      this.notify();
      return { success: true };
    }
    
    return { success: false, error: 'Product not found in catalog.' };
  }

  // ==================== COMBO BOX (PRODUCT BUNDLE) OPERATIONS ====================
  public getComboLogs(businessId: string, comboId?: string): ComboHistoryLog[] {
    let logs = this.cache.comboLogs || [];
    if (businessId) logs = logs.filter(l => l.business_id === businessId);
    if (comboId) logs = logs.filter(l => l.combo_id === comboId);
    return dedupeById([...logs].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
  }

  public addComboLog(
    businessId: string,
    comboId: string,
    comboName: string,
    action: ComboHistoryLog['action'],
    qty: number,
    performedBy: string,
    details: string
  ): ComboHistoryLog {
    const newLog: ComboHistoryLog = {
      id: crypto.randomUUID(),
      business_id: businessId,
      combo_id: comboId,
      combo_name: comboName,
      action,
      qty,
      performed_by: performedBy,
      details,
      created_at: new Date().toISOString()
    };
    if (!this.cache.comboLogs) this.cache.comboLogs = [];
    this.cache.comboLogs.unshift(newLog);
    this.save('comboLogs', newLog);
    return newLog;
  }

  public createComboBox(
    comboData: Omit<Product, 'id' | 'created_at' | 'current_stock'> & { combo_items: { product_id: string; qty: number }[] },
    userName: string
  ): Product {
    const openingStock = comboData.opening_stock || 0;
    const newCombo: Product = {
      ...comboData,
      id: crypto.randomUUID(),
      is_combo: true,
      current_stock: openingStock,
      created_at: new Date().toISOString()
    };
    this.cache.products.push(newCombo);
    this.save('products', newCombo);

    // Automatically reduce regular component product stock for initial combo opening stock
    if (openingStock > 0 && comboData.combo_items && comboData.combo_items.length > 0) {
      comboData.combo_items.forEach(item => {
        const reqQty = item.qty * openingStock;
        const prod = this.cache.products.find(p => p.id === item.product_id);
        if (prod) {
          this.addStockLog(
            prod.id,
            -reqQty,
            'Out',
            `Allocated to initial stock of Combo Box '${newCombo.name}' (x${openingStock})`,
            userName,
            comboData.business_id
          );
        }
      });
    }

    this.addComboLog(
      comboData.business_id,
      newCombo.id,
      newCombo.name,
      'Created',
      newCombo.current_stock,
      userName,
      `Created Combo Box template with ${comboData.combo_items.length} component items.${openingStock > 0 ? ` Reduced component stocks for ${openingStock} initial combo box(es).` : ''}`
    );

    return newCombo;
  }

  public updateComboBox(
    id: string,
    updates: Partial<Product>,
    userName: string
  ): Product {
    const index = this.cache.products.findIndex(p => p.id === id);
    if (index !== -1) {
      const old = this.cache.products[index];
      
      // 1. Handle Recipe (combo_items) Changes
      // If the recipe changes, we need to adjust stock of components based on CURRENT combo stock
      if (updates.combo_items && old.current_stock > 0) {
        const oldItems = old.combo_items || [];
        const newItems = updates.combo_items;
        const currentComboStock = old.current_stock;

        // Detect additions or quantity increases in the recipe
        newItems.forEach(newItem => {
          const oldItem = oldItems.find(oi => oi.product_id === newItem.product_id);
          const oldQty = oldItem ? oldItem.qty : 0;
          const qtyDiff = newItem.qty - oldQty;

          if (qtyDiff !== 0) {
            const prod = this.cache.products.find(p => p.id === newItem.product_id);
            if (prod) {
              this.addStockLog(
                prod.id,
                -(qtyDiff * currentComboStock),
                qtyDiff > 0 ? 'Out' : 'In',
                `Recipe modified for Combo Box '${old.name}'`,
                userName,
                old.business_id
              );
            }
          }
        });

        // Detect removals from the recipe
        oldItems.forEach(oldItem => {
          if (!newItems.find(ni => ni.product_id === oldItem.product_id)) {
            const prod = this.cache.products.find(p => p.id === oldItem.product_id);
            if (prod) {
              this.addStockLog(
                prod.id,
                oldItem.qty * currentComboStock,
                'In',
                `Item removed from recipe of Combo Box '${old.name}'`,
                userName,
                old.business_id
              );
            }
          }
        });
      }

      // 2. Handle Stock Quantity Changes (Packed Stock Adjustment)
      const newStock = updates.opening_stock ?? updates.current_stock ?? old.current_stock;
      const stockDiff = newStock - old.current_stock;

      const updated = { ...old, ...updates, current_stock: newStock, is_combo: true };
      this.cache.products[index] = updated;
      this.save('products', updated);

      // Adjust component product stocks if combo box stock changed (using the NEW recipe)
      if (stockDiff !== 0 && updated.combo_items && updated.combo_items.length > 0) {
        updated.combo_items.forEach(item => {
          const adjQty = item.qty * stockDiff;
          const prod = this.cache.products.find(p => p.id === item.product_id);
          if (prod) {
            this.addStockLog(
              prod.id,
              -adjQty,
              stockDiff > 0 ? 'Out' : 'In',
              `Stock adjustment for Combo Box '${updated.name}' (${stockDiff > 0 ? '+' : ''}${stockDiff})`,
              userName,
              updated.business_id
            );
          }
        });
      }

      this.addComboLog(
        updated.business_id,
        updated.id,
        updated.name,
        'Updated',
        stockDiff,
        userName,
        `Updated Combo Box specifications and component product mappings.${stockDiff !== 0 ? ` Adjusted components by ${stockDiff} unit(s).` : ''}`
      );

      return updated;
    }
    throw new Error('Combo Box not found');
  }

  public packCombo(
    businessId: string,
    comboId: string,
    packQty: number,
    userName: string
  ): { 
    success: boolean; 
    error?: string; 
    missingItems?: { productName: string; required: number; available: number; missing: number }[];
    combo?: Product;
  } {
    if (packQty <= 0) return { success: false, error: 'Packing quantity must be greater than zero.' };

    const combo = this.cache.products.find(p => p.id === comboId && p.business_id === businessId);
    if (!combo || !isComboProduct(combo) || !combo.combo_items || combo.combo_items.length === 0) {
      return { success: false, error: 'Invalid Combo Box template selected.' };
    }

    // Step 1: Validate stock availability of all component items
    const missingItems: { productName: string; required: number; available: number; missing: number }[] = [];
    combo.combo_items.forEach(item => {
      const prod = this.cache.products.find(p => p.id === item.product_id);
      const reqQty = item.qty * packQty;
      const availQty = prod ? prod.current_stock : 0;
      if (availQty < reqQty) {
        missingItems.push({
          productName: prod ? prod.name : 'Unknown Product',
          required: reqQty,
          available: availQty,
          missing: reqQty - availQty
        });
      }
    });

    if (missingItems.length > 0) {
      return {
        success: false,
        error: `Insufficient stock of component products to pack ${packQty} combo box(es).`,
        missingItems
      };
    }

    // Step 2: Deduct required component stocks & log stock movements
    combo.combo_items.forEach(item => {
      const reqQty = item.qty * packQty;
      const prod = this.cache.products.find(p => p.id === item.product_id);
      if (prod) {
        this.addStockLog(
          prod.id,
          -reqQty,
          'Out',
          `Packed into Combo Box '${combo.name}' (x${packQty})`,
          userName,
          businessId
        );
      }
    });

    // Step 3: Increase finished Combo Box stock
    this.addStockLog(
      combo.id,
      packQty,
      'In',
      `Packed ${packQty} finished Combo Box(es)`,
      userName,
      businessId
    );

    // Step 4: Record Combo Audit Trail
    this.addComboLog(
      businessId,
      combo.id,
      combo.name,
      'Packed',
      packQty,
      userName,
      `Packed ${packQty} finished units. Components deducted from loose product inventory.`
    );

    const updatedCombo = this.cache.products.find(p => p.id === comboId);
    return { success: true, combo: updatedCombo };
  }

  public breakCombo(
    businessId: string,
    comboId: string,
    breakQty: number,
    userName: string,
    reason: string = 'Manual breakdown'
  ): { success: boolean; error?: string; combo?: Product } {
    if (breakQty <= 0) return { success: false, error: 'Breakdown quantity must be greater than zero.' };

    const combo = this.cache.products.find(p => p.id === comboId && p.business_id === businessId);
    if (!combo || !isComboProduct(combo) || !combo.combo_items || combo.combo_items.length === 0) {
      return { success: false, error: 'Invalid Combo Box template selected.' };
    }

    if (combo.current_stock < breakQty) {
      return {
        success: false,
        error: `Cannot break ${breakQty} unit(s). Only ${combo.current_stock} packed '${combo.name}' available in stock.`
      };
    }

    // Step 1: Reduce finished Combo Box stock
    this.addStockLog(
      combo.id,
      -breakQty,
      'Out',
      `Unpacked/Broken Combo Box (x${breakQty}): ${reason}`,
      userName,
      businessId
    );

    // Step 2: Return component products back to loose inventory
    combo.combo_items.forEach(item => {
      const returnQty = item.qty * breakQty;
      const prod = this.cache.products.find(p => p.id === item.product_id);
      if (prod) {
        this.addStockLog(
          prod.id,
          returnQty,
          'In',
          `Returned from broken Combo '${combo.name}' (x${breakQty})`,
          userName,
          businessId
        );
      }
    });

    // Step 3: Record Combo Audit Trail
    this.addComboLog(
      businessId,
      combo.id,
      combo.name,
      'Unpacked',
      breakQty,
      userName,
      `Unpacked/Broken ${breakQty} unit(s). Reason: ${reason}. Component items returned to loose stock.`
    );

    const updatedCombo = this.cache.products.find(p => p.id === comboId);
    return { success: true, combo: updatedCombo };
  }

  public autoBreakComboForMissingItem(
    businessId: string,
    productId: string,
    requiredQty: number,
    userName: string
  ): { success: boolean; brokenCount: number; message?: string } {
    const prod = this.cache.products.find(p => p.id === productId && p.business_id === businessId);
    if (!prod) return { success: false, brokenCount: 0, message: 'Product not found' };

    let currentStock = prod.current_stock;
    if (currentStock >= requiredQty) {
      return { success: true, brokenCount: 0 };
    }

    let deficit = requiredQty - currentStock;

    // Find candidate packed combo boxes containing this product
    const candidateCombos = this.cache.products.filter(
      p => p.business_id === businessId &&
      isComboProduct(p) &&
      p.current_stock > 0 &&
      p.combo_items?.some(ci => ci.product_id === productId)
    );

    if (candidateCombos.length === 0) {
      return { success: false, brokenCount: 0, message: `No packed combo boxes contain "${prod.name}" to auto-break.` };
    }

    let totalBroken = 0;
    for (const combo of candidateCombos) {
      const ci = combo.combo_items?.find(i => i.product_id === productId);
      if (!ci || ci.qty <= 0) continue;

      const unitsPerCombo = ci.qty;
      const combosNeeded = Math.ceil(deficit / unitsPerCombo);
      const combosToBreak = Math.min(combosNeeded, combo.current_stock);

      if (combosToBreak > 0) {
        const result = this.breakCombo(
          businessId,
          combo.id,
          combosToBreak,
          userName,
          `Auto-break (reverse packing) to fulfill out-of-stock item '${prod.name}'`
        );

        if (result.success) {
          totalBroken += combosToBreak;
          this.addComboLog(
            businessId,
            combo.id,
            combo.name,
            'Auto-Broken',
            combosToBreak,
            userName,
            `Auto-broken ${combosToBreak} box(es) to fulfill customer request for ${requiredQty}x '${prod.name}'. Remaining items returned to stock.`
          );

          // Re-fetch current stock
          const freshProd = this.cache.products.find(p => p.id === productId);
          currentStock = freshProd ? freshProd.current_stock : currentStock;
          deficit = requiredQty - currentStock;

          if (deficit <= 0) break;
        }
      }
    }

    return {
      success: deficit <= 0,
      brokenCount: totalBroken,
      message: totalBroken > 0 
        ? `Auto-broke ${totalBroken} packed Combo Box(es) to satisfy stock requirement for ${prod.name}.`
        : `Insufficient packed combos to supply missing ${deficit} units of ${prod.name}.`
    };
  }

  public processComboSale(
    businessId: string,
    comboId: string,
    sellQty: number,
    userName: string
  ): { 
    success: boolean; 
    fromPacked: number; 
    fromVirtual: number; 
    error?: string;
    missingItems?: { productName: string; required: number; available: number; missing: number }[];
  } {
    const combo = this.cache.products.find(p => p.id === comboId && p.business_id === businessId);
    if (!combo || !isComboProduct(combo)) return { success: false, fromPacked: 0, fromVirtual: 0, error: 'Not a valid combo box' };

    const fromPacked = sellQty;
    const fromVirtual = 0;

    // Validate virtual combo component availability
    if (fromVirtual > 0) {
      const missingItems: { productName: string; required: number; available: number; missing: number }[] = [];
      combo.combo_items?.forEach(item => {
        let prod = this.cache.products.find(p => p.id === item.product_id);
        const reqQty = item.qty * fromVirtual;
        let availQty = prod ? prod.current_stock : 0;

        // Try auto-break if component stock is insufficient
        if (prod && availQty < reqQty) {
          this.autoBreakComboForMissingItem(businessId, prod.id, reqQty, userName);
          prod = this.cache.products.find(p => p.id === item.product_id);
          availQty = prod ? prod.current_stock : 0;
        }

        if (availQty < reqQty) {
          missingItems.push({
            productName: prod ? prod.name : 'Component Product',
            required: reqQty,
            available: availQty,
            missing: reqQty - availQty
          });
        }
      });

      if (missingItems.length > 0) {
        return {
          success: false,
          fromPacked: 0,
          fromVirtual: 0,
          error: `Insufficient component stock to fulfill Virtual Combo sale of ${fromVirtual} unit(s).`,
          missingItems
        };
      }
    }

    // Step 1: Process Packed portion
    if (fromPacked > 0) {
      this.addStockLog(
        combo.id,
        -fromPacked,
        'Out',
        `Sold Packed Combo Box (x${fromPacked})`,
        userName,
        businessId
      );
      this.addComboLog(
        businessId,
        combo.id,
        combo.name,
        'Packed Sale',
        fromPacked,
        userName,
        `Sold ${fromPacked} packed unit(s) directly from finished goods inventory.`
      );
    }

    // Step 2: Process Virtual portion
    if (fromVirtual > 0) {
      combo.combo_items?.forEach(item => {
        const reqQty = item.qty * fromVirtual;
        const prod = this.cache.products.find(p => p.id === item.product_id);
        if (prod) {
          this.addStockLog(
            prod.id,
            -reqQty,
            'Out',
            `Sold Virtual Combo '${combo.name}' (x${fromVirtual})`,
            userName,
            businessId
          );
        }
      });
      this.addComboLog(
        businessId,
        combo.id,
        combo.name,
        'Virtual Sale',
        fromVirtual,
        userName,
        `Sold ${fromVirtual} virtual combo unit(s). Deducted component product stocks dynamically.`
      );
    }

    return { success: true, fromPacked, fromVirtual };
  }

  // Customer Operations
  public getCustomers(businessId: string): Customer[] {
    const raw = this.cache.customers.filter(c => isSameBusiness(c.business_id, businessId));
    
    // Deduplicate by normalized customer name and 10-digit mobile number
    const seenNames = new Set<string>();
    const seenPhones = new Set<string>();
    const uniqueCustomers: Customer[] = [];

    // Prioritize customer records with outstanding amounts, contact details, or GSTIN
    const sorted = [...raw].sort((a, b) => {
      const aScore = (a.outstanding_amount ? 100 : 0) + (a.phone ? 20 : 0) + (a.email ? 10 : 0) + (a.gstin ? 5 : 0);
      const bScore = (b.outstanding_amount ? 100 : 0) + (b.phone ? 20 : 0) + (b.email ? 10 : 0) + (b.gstin ? 5 : 0);
      return bScore - aScore;
    });

    for (const cust of sorted) {
      const normName = cust.name ? cust.name.trim().toLowerCase() : '';
      const normPhone = cust.phone ? cust.phone.replace(/\D/g, '') : '';

      if (normName && seenNames.has(normName)) {
        continue;
      }
      if (normPhone && normPhone.length === 10 && seenPhones.has(normPhone)) {
        continue;
      }

      if (normName) seenNames.add(normName);
      if (normPhone && normPhone.length === 10) seenPhones.add(normPhone);

      uniqueCustomers.push(cust);
    }

    return uniqueCustomers;
  }

  public createCustomer(cust: Omit<Customer, 'id' | 'created_at' | 'outstanding_amount'>): Customer {
    const normName = cust.name ? cust.name.trim().toLowerCase() : '';
    const normPhone = cust.phone ? cust.phone.replace(/\D/g, '') : '';
    const normBizId = normalizeBusinessId(cust.business_id);

    // Reuse existing customer if name or phone already exists
    const existing = this.cache.customers.find(c => 
      isSameBusiness(c.business_id, normBizId) && (
        (normName && c.name && c.name.trim().toLowerCase() === normName) ||
        (normPhone && normPhone.length === 10 && c.phone && c.phone.replace(/\D/g, '') === normPhone)
      )
    );

    if (existing) {
      return existing;
    }

    const config = this.getLoyaltyConfig(cust.business_id);
    const welcomeBonus = config?.welcome_bonus_points || 50;

    const newCust: Customer = {
      ...cust,
      id: crypto.randomUUID(),
      outstanding_amount: 0,
      loyalty_points: welcomeBonus,
      lifetime_spend: 0,
      loyalty_tier: 'Silver',
      created_at: new Date().toISOString()
    };
    this.cache.customers.push(newCust);
    this.save('customers', newCust);

    if (welcomeBonus > 0) {
      this.addLoyaltyPoints(
        newCust.id,
        welcomeBonus,
        'Bonus',
        'Welcome registration loyalty bonus points',
        cust.business_id
      );
    }

    return newCust;
  }

  public createCustomersBatch(custs: Omit<Customer, 'id' | 'created_at' | 'outstanding_amount'>[]): Customer[] {
    if (!custs || custs.length === 0) return [];

    const bizId = custs[0].business_id;
    const existing = this.cache.customers.filter(c => c.business_id === bizId);
    const existingNames = new Set(existing.map(c => c.name ? c.name.trim().toLowerCase() : '').filter(Boolean));
    const existingPhones = new Set(existing.map(c => c.phone ? c.phone.replace(/\D/g, '') : '').filter(Boolean));
    const existingEmails = new Set(existing.map(c => c.email ? c.email.trim().toLowerCase() : '').filter(Boolean));

    const uniqueToCreate: Omit<Customer, 'id' | 'created_at' | 'outstanding_amount'>[] = [];

    for (const cust of custs) {
      const cleanName = cust.name ? cust.name.trim().toLowerCase() : '';
      const cleanPhone = cust.phone ? cust.phone.replace(/\D/g, '') : '';
      const cleanEmail = cust.email ? cust.email.trim().toLowerCase() : '';

      const nameExists = cleanName.length > 0 && existingNames.has(cleanName);
      const phoneExists = cleanPhone.length > 0 && existingPhones.has(cleanPhone);
      const emailExists = cleanEmail.length > 0 && existingEmails.has(cleanEmail);

      if (nameExists || phoneExists || emailExists) {
        continue;
      }

      if (cleanName) existingNames.add(cleanName);
      if (cleanPhone) existingPhones.add(cleanPhone);
      if (cleanEmail) existingEmails.add(cleanEmail);

      uniqueToCreate.push(cust);
    }

    if (uniqueToCreate.length === 0) return [];

    const config = this.getLoyaltyConfig(bizId);
    const welcomeBonus = config?.welcome_bonus_points || 50;
    const now = new Date().toISOString();

    const newCustomers: Customer[] = uniqueToCreate.map(cust => ({
      ...cust,
      id: crypto.randomUUID(),
      outstanding_amount: 0,
      loyalty_points: welcomeBonus,
      lifetime_spend: 0,
      loyalty_tier: 'Silver',
      created_at: now
    }));

    this.cache.customers.push(...newCustomers);
    this.save('customers', newCustomers);

    if (welcomeBonus > 0) {
      const logs = newCustomers.map(c => ({
        id: crypto.randomUUID(),
        customer_id: c.id,
        points: welcomeBonus,
        type: 'Bonus' as const,
        notes: 'Welcome registration loyalty bonus points',
        created_at: now,
        business_id: c.business_id
      }));
      this.cache.loyaltyLogs.push(...logs);
      this.save('loyaltyLogs', logs);
    }

    return newCustomers;
  }

  public updateCustomer(id: string, updates: Partial<Customer>): Customer {
    const index = this.cache.customers.findIndex(c => c.id === id);
    if (index !== -1) {
      this.cache.customers[index] = { ...this.cache.customers[index], ...updates };
      this.save('customers', this.cache.customers[index]);
      return this.cache.customers[index];
    }
    throw new Error('Customer not found');
  }

  public deleteCustomer(id: string): boolean {
    const initialLen = this.cache.customers.length;
    this.cache.customers = this.cache.customers.filter(c => c.id !== id);
    if (this.cache.customers.length !== initialLen) {
      this.save('customers', null, true, id);
      return true;
    }
    return false;
  }

  // ==================== LOYALTY & SUBSCRIPTION OPERATIONS ====================
  public getLoyaltyConfig(businessId: string): LoyaltyConfig {
    if (this.cache.loyaltyConfigs) {
      const cfg = this.cache.loyaltyConfigs.find(l => (l as any).business_id === businessId);
      if (cfg) return cfg;
    }
    const biz = this.getBusiness(businessId);
    return biz?.loyalty_config || DEFAULT_LOYALTY_CONFIG;
  }

  public updateLoyaltyConfig(businessId: string, updates: Partial<LoyaltyConfig>): LoyaltyConfig {
    const currentConfig = this.getLoyaltyConfig(businessId);
    const updated = { ...currentConfig, ...updates, business_id: businessId };
    if (!this.cache.loyaltyConfigs) this.cache.loyaltyConfigs = [];
    const idx = this.cache.loyaltyConfigs.findIndex(l => (l as any).business_id === businessId);
    if (idx !== -1) {
      this.cache.loyaltyConfigs[idx] = updated;
    } else {
      this.cache.loyaltyConfigs.push(updated);
    }
    this.save('loyaltyConfigs', updated);
    this.updateBusiness(businessId, { loyalty_config: updated });
    return updated;
  }

  public getLoyaltyLogs(customerId?: string, businessId?: string): LoyaltyLog[] {
    let logs = this.cache.loyaltyLogs || [];
    if (businessId) logs = logs.filter(l => l.business_id === businessId);
    if (customerId) logs = logs.filter(l => l.customer_id === customerId);
    return [...logs].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public addLoyaltyPoints(
    customerId: string, 
    points: number, 
    type: LoyaltyLog['type'], 
    notes: string, 
    businessId: string,
    orderId?: string, 
    amountSpent?: number
  ): void {
    const cust = this.cache.customers.find(c => c.id === customerId);
    if (!cust) return;

    const currentPoints = cust.loyalty_points || 0;
    const newPoints = Math.max(0, currentPoints + points);

    this.updateCustomer(customerId, {
      loyalty_points: newPoints
    });

    const newLog: LoyaltyLog = {
      id: crypto.randomUUID(),
      customer_id: customerId,
      type,
      points,
      notes,
      business_id: businessId,
      order_id: orderId,
      amount_spent: amountSpent,
      created_at: new Date().toISOString()
    };

    if (!this.cache.loyaltyLogs) this.cache.loyaltyLogs = [];
    this.cache.loyaltyLogs.push(newLog);
    this.save('loyaltyLogs', newLog);
  }

  public calculateCustomerTier(lifetimeSpend: number, config: LoyaltyConfig, overrideTier?: string): 'Silver' | 'Gold' | 'Platinum' {
    if (overrideTier === 'Platinum' || overrideTier === 'Gold' || overrideTier === 'Silver') return overrideTier;
    if (lifetimeSpend >= (config.platinum_min_spend || 20000)) return 'Platinum';
    if (lifetimeSpend >= (config.gold_min_spend || 10000)) return 'Gold';
    if (config.silver_min_spend !== undefined && lifetimeSpend >= config.silver_min_spend) return 'Silver';
    return 'Silver'; // Default
  }

  public processOrderLoyalty(
    customerId: string,
    orderAmount: number,
    pointsToRedeem: number,
    orderId: string,
    businessId: string
  ): { pointsEarned: number; discountAmount: number } {
    if (!customerId || customerId === 'WALK_IN') {
      return { pointsEarned: 0, discountAmount: 0 };
    }

    const config = this.getLoyaltyConfig(businessId);
    if (!config.enabled) return { pointsEarned: 0, discountAmount: 0 };

    const cust = this.cache.customers.find(c => c.id === customerId);
    if (!cust) return { pointsEarned: 0, discountAmount: 0 };

    let discountAmount = 0;
    // 1. Redeem points
    if (pointsToRedeem > 0) {
      const availablePoints = cust.loyalty_points || 0;
      const actualRedeem = Math.min(availablePoints, pointsToRedeem);
      discountAmount = actualRedeem * (config.point_value || 1);

      this.addLoyaltyPoints(
        customerId,
        -actualRedeem,
        'Redeemed',
        `Redeemed ${actualRedeem} points for discount ₹${discountAmount} on Order #${orderId}`,
        businessId,
        orderId
      );
    }

    // 2. Calculate tier & spend
    const oldTier = cust.loyalty_tier || 'Silver';
    const newLifetimeSpend = (cust.lifetime_spend || 0) + orderAmount;
    const newTier = this.calculateCustomerTier(newLifetimeSpend, config, cust.loyalty_tier_override);

    // Tier Bonus Points (if moved to a higher tier)
    if (newTier !== oldTier) {
      let bonusPoints = 0;
      if (newTier === 'Gold' && oldTier === 'Silver') {
        bonusPoints = Number(config.gold_bonus_points) || 0;
      } else if (newTier === 'Platinum') {
        bonusPoints = Number(config.platinum_bonus_points) || 0;
      }

      if (bonusPoints > 0) {
        this.addLoyaltyPoints(
          customerId,
          bonusPoints,
          'Bonus',
          `Tier Upgrade Bonus: Welcome to ${newTier} Tier!`,
          businessId,
          orderId
        );
      }
    }

    // Tier Multiplier
    let multiplier = 1.0;
    if (newTier === 'Gold') multiplier = Number(config.gold_multiplier) || 1.25;
    if (newTier === 'Platinum') multiplier = Number(config.platinum_multiplier) || 1.5;
    if (newTier === 'Silver') multiplier = Number(config.silver_multiplier) || 1.0;

    // 3. Earn points on net spend (per ₹100 spend)
    const netSpend = Math.max(0, orderAmount - discountAmount);
    const basePoints = Math.floor(netSpend / (config.spend_per_point || 100));
    const pointsEarned = Math.floor(basePoints * multiplier);

    if (pointsEarned > 0) {
      this.addLoyaltyPoints(
        customerId,
        pointsEarned,
        'Earned',
        `Earned ${pointsEarned} points for spend ₹${netSpend.toLocaleString()} (${newTier} Tier ${multiplier}x)`,
        businessId,
        orderId,
        orderAmount
      );
    }

    // Update lifetime spend & tier
    this.updateCustomer(customerId, {
      lifetime_spend: newLifetimeSpend,
      loyalty_tier: newTier
    });

    return { pointsEarned, discountAmount };
  }

  // Subscription Operations
  public getSubscriptions(businessId: string): CustomerSubscription[] {
    const subs = this.cache.subscriptions || [];
    return dedupeById(subs.filter(s => s.business_id === businessId));
  }

  public createSubscription(
    subData: Omit<CustomerSubscription, 'id' | 'subscription_number' | 'created_at'>
  ): CustomerSubscription {
    const existingSubs = this.cache.subscriptions || [];
    const usedSequences = new Set<number>();
    existingSubs.forEach(s => {
      if (s.subscription_number) {
        const match = s.subscription_number.match(/(\d+)$/);
        if (match) {
          const parsed = parseInt(match[1], 10);
          if (!isNaN(parsed) && parsed > 0 && parsed < 10000000) {
            usedSequences.add(parsed);
          }
        }
      }
    });
    let nextSeq = 1;
    if (usedSequences.size > 0) {
      nextSeq = Math.max(...Array.from(usedSequences)) + 1;
    }
    while (existingSubs.some(s => s.subscription_number === `SUB-${nextSeq}`)) {
      nextSeq++;
    }
    const num = `SUB-${nextSeq}`;
    const newSub: CustomerSubscription = {
      ...subData,
      id: crypto.randomUUID(),
      subscription_number: num,
      created_at: new Date().toISOString()
    };
    if (!this.cache.subscriptions) this.cache.subscriptions = [];
    this.cache.subscriptions.push(newSub);
    this.save('subscriptions', newSub);
    return newSub;
  }

  public updateSubscription(id: string, updates: Partial<CustomerSubscription>): CustomerSubscription {
    const index = (this.cache.subscriptions || []).findIndex(s => s.id === id);
    if (index !== -1) {
      this.cache.subscriptions[index] = { ...this.cache.subscriptions[index], ...updates };
      this.save('subscriptions', this.cache.subscriptions[index]);
      return this.cache.subscriptions[index];
    }
    throw new Error('Subscription not found');
  }

  public deleteSubscription(id: string): boolean {
    const initialLen = (this.cache.subscriptions || []).length;
    this.cache.subscriptions = (this.cache.subscriptions || []).filter(s => s.id !== id);
    if (this.cache.subscriptions.length !== initialLen) {
      this.save('subscriptions', null, true, id);
      return true;
    }
    return false;
  }

  public generateSubscriptionOrders(businessId: string): { generatedCount: number; orders: SalesOrder[] } {
    const subs = this.getSubscriptions(businessId).filter(s => s.status === 'Active');
    const todayStr = new Date().toISOString().split('T')[0];
    const generatedOrders: SalesOrder[] = [];

    const biz = this.getBusiness(businessId);
    const prefix = biz?.invoice_prefix ? biz.invoice_prefix.trim() : 'SO-2026-';

    subs.forEach(sub => {
      // Check if billing date is today or in past
      if (sub.next_billing_date <= todayStr) {
        const existingPrefixOrders = this.cache.sales.filter(o => o.business_id === businessId && o.order_number && o.order_number.startsWith(prefix));
        let maxSeq = 0;
        existingPrefixOrders.forEach(o => {
          const numPart = o.order_number.replace(prefix, '').replace('SUB-', '').replace('AB-', '');
          const parsed = parseInt(numPart, 10);
          if (!isNaN(parsed) && parsed > maxSeq) {
            maxSeq = parsed;
          }
        });
        const orderNum = `${prefix}SUB-${maxSeq + 1}`;

        const newOrder = this.createSalesOrder({
          order_number: orderNum,
          customer_id: sub.customer_id,
          customer_name: sub.customer_name,
          area: sub.delivery_area || 'Standard',
          channel: 'Subscription Auto-Renewal',
          time: '08:00 AM',
          order_date: todayStr,
          delivery_date: todayStr,
          status: 'Pending',
          payment_status: 'Unpaid',
          delivery_status: 'Pending',
          items: sub.items,
          advance_booking: false,
          total_amount: sub.total_amount,
          qr_code_data: `${orderNum}|${sub.customer_id}|${sub.customer_name}|Auto-Subscription`,
          subscription_id: sub.id,
          business_id: businessId
        });

        generatedOrders.push(newOrder);

        // Advance next billing date based on frequency
        const nextDate = new Date(sub.next_billing_date || todayStr);
        if (sub.frequency === 'Weekly') nextDate.setDate(nextDate.getDate() + 7);
        else if (sub.frequency === 'Bi-Weekly') nextDate.setDate(nextDate.getDate() + 14);
        else if (sub.frequency === 'Monthly') nextDate.setMonth(nextDate.getMonth() + 1);
        else if (sub.frequency === 'Quarterly') nextDate.setMonth(nextDate.getMonth() + 3);

        const newNextBillingStr = nextDate.toISOString().split('T')[0];

        this.updateSubscription(sub.id, {
          next_billing_date: newNextBillingStr,
          last_order_date: todayStr,
          last_order_id: newOrder.id
        });
      }
    });

    return { generatedCount: generatedOrders.length, orders: generatedOrders };
  }

  // Supplier Operations
  public getSuppliers(businessId: string): Supplier[] {
    return dedupeById(this.cache.suppliers.filter(s => isSameBusiness(s.business_id, businessId)));
  }

  public createSupplier(sup: Omit<Supplier, 'id' | 'created_at' | 'outstanding_amount'>): Supplier {
    const newSup: Supplier = {
      ...sup,
      business_id: normalizeBusinessId(sup.business_id),
      id: crypto.randomUUID(),
      outstanding_amount: 0,
      created_at: new Date().toISOString()
    };
    this.cache.suppliers.push(newSup);
    this.save('suppliers', newSup);
    return newSup;
  }

  public updateSupplier(id: string, updates: Partial<Supplier>): Supplier {
    const index = this.cache.suppliers.findIndex(s => s.id === id);
    if (index !== -1) {
      this.cache.suppliers[index] = { ...this.cache.suppliers[index], ...updates };
      this.save('suppliers', this.cache.suppliers[index]);
      return this.cache.suppliers[index];
    }
    throw new Error('Supplier not found');
  }

  public deleteSupplier(id: string): boolean {
    const initialLen = this.cache.suppliers.length;
    this.cache.suppliers = this.cache.suppliers.filter(s => s.id !== id);
    if (this.cache.suppliers.length !== initialLen) {
      this.save('suppliers', null, true, id);
      return true;
    }
    return false;
  }

  // Purchase Order Operations
  public getPurchaseOrders(businessId: string): PurchaseOrder[] {
    return dedupeById(
      (this.cache.purchases || [])
        .filter(p => isSameBusiness(p.business_id, businessId))
        .map(p => ({ ...p, items: p.items || [] }))
    );
  }

  public getNextAvailablePONumber(businessId: string): string {
    const normBiz = normalizeBusinessId(businessId);
    const existingPOs = this.cache.purchases.filter(p => isSameBusiness(p.business_id, normBiz));
    const prefix = 'PO-';
    const usedSequences = new Set<number>();

    existingPOs.forEach(p => {
      if (p.order_number) {
        // Extract sequence number
        const match = p.order_number.match(/(\d+)$/);
        if (match) {
          const parsed = parseInt(match[1], 10);
          if (!isNaN(parsed) && parsed > 0 && parsed < 10000000) {
            usedSequences.add(parsed);
          }
        }
      }
    });

    let nextSeq = 1;
    while (
      usedSequences.has(nextSeq) ||
      existingPOs.some(p => p.order_number === `${prefix}${nextSeq}`)
    ) {
      nextSeq++;
    }

    return `${prefix}${nextSeq}`;
  }

  public createPurchaseOrder(po: Omit<PurchaseOrder, 'id' | 'created_at'>): PurchaseOrder {
    const normBiz = normalizeBusinessId(po.business_id);
    let finalOrderNumber = po.order_number?.trim();
    const existingPOs = this.cache.purchases.filter(p => isSameBusiness(p.business_id, normBiz));
    
    // Ensure unique purchase order number via continuous sequence
    if (!finalOrderNumber || existingPOs.some(p => p.order_number === finalOrderNumber)) {
      finalOrderNumber = this.getNextAvailablePONumber(normBiz);
    }

    const newPO: PurchaseOrder = {
      ...po,
      order_number: finalOrderNumber,
      business_id: normBiz,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString()
    };
    this.cache.purchases.push(newPO);
    this.save('purchases', newPO);

    // If order received immediately, trigger stock ledger in-movement
    if (newPO.status === 'Received') {
      newPO.items.forEach(item => {
        let actualQty = item.qty;
        const prod = this.cache.products.find(p => p.id === item.product_id);
        if (prod && prod.auto_conversion && prod.pack_size) {
            if (prod.purchase_unit === 'Kg' || prod.purchase_unit === 'Ltr') {
                actualQty = (item.qty * 1000) / prod.pack_size;
            } else {
                actualQty = item.qty * prod.pack_size;
            }
        }
        this.addStockLog(item.product_id, actualQty, 'In', `Received purchase order ${newPO.order_number}`, 'System', newPO.business_id);
      });
    }

    return newPO;
  }

  public updatePurchaseOrder(id: string, updates: Partial<PurchaseOrder>): PurchaseOrder {
    const index = this.cache.purchases.findIndex(p => p.id === id);
    if (index !== -1) {
      const oldPO = this.cache.purchases[index];
      const newPO = { ...oldPO, ...updates };
      this.cache.purchases[index] = newPO;
      this.save('purchases', newPO);

      // Check transition from non-received to received
      if (oldPO.status !== 'Received' && newPO.status === 'Received') {
        newPO.items.forEach(item => {
          let actualQty = item.qty;
          const prod = this.cache.products.find(p => p.id === item.product_id);
          if (prod && prod.auto_conversion && prod.pack_size) {
              if (prod.purchase_unit === 'Kg' || prod.purchase_unit === 'Ltr') {
                  actualQty = (item.qty * 1000) / prod.pack_size;
              } else {
                  actualQty = item.qty * prod.pack_size;
              }
          }
          this.addStockLog(item.product_id, actualQty, 'In', `Received purchase order ${newPO.order_number}`, 'System', newPO.business_id);
        });
      }

      return newPO;
    }
    throw new Error('Purchase Order not found');
  }

  // ==================== CONCURRENT DEVICE SESSION ENFORCEMENT ====================
  public getActiveDeviceSessions(userId?: string): ActiveDeviceSession[] {
    const now = Date.now();
    const EXPIRY_MS = 25 * 1000; // 25 seconds expiry for inactive device heartbeats

    // Load freshest from localStorage
    const localSessions = this.load<ActiveDeviceSession[]>('deviceSessions', []);
    const validSessions = (Array.isArray(localSessions) ? localSessions : []).filter(
      s => s && s.userId && s.deviceId && (now - s.lastHeartbeat) < EXPIRY_MS
    );

    this.activeDeviceSessions = validSessions;

    if (userId) {
      return this.activeDeviceSessions.filter(s => s.userId === userId);
    }
    return this.activeDeviceSessions;
  }

  public syncIncomingDeviceSessions(incoming: ActiveDeviceSession[]): void {
    if (!Array.isArray(incoming)) return;
    const now = Date.now();
    const EXPIRY_MS = 25 * 1000;

    const validIncoming = incoming.filter(
      s => s && s.userId && s.deviceId && (now - s.lastHeartbeat) < EXPIRY_MS
    );

    const localSessions = this.load<ActiveDeviceSession[]>('deviceSessions', []);
    const validLocal = (Array.isArray(localSessions) ? localSessions : []).filter(
      s => s && s.userId && s.deviceId && (now - s.lastHeartbeat) < EXPIRY_MS
    );

    // Identify which users are present in the incoming payload
    const incomingUserIds = new Set(validIncoming.map(s => s.userId));

    // Preserve local sessions for users NOT mentioned in the incoming broadcast
    const localSessionsForOtherUsers = validLocal.filter(s => !incomingUserIds.has(s.userId));

    // Combine unmentioned users' local sessions with incoming authoritative user sessions
    this.activeDeviceSessions = [...localSessionsForOtherUsers, ...validIncoming];
    this.saveDeviceSessions();
    this.notify();
  }

  private saveDeviceSessions() {
    try {
      localStorage.setItem('omnipack_erp_deviceSessions', JSON.stringify(this.activeDeviceSessions));
    } catch (e) {}
  }

  public broadcastDeviceSessions() {
    if (this.bc) {
      try {
        this.bc.postMessage({ type: 'SYNC_DEVICE_SESSIONS', sessions: this.activeDeviceSessions });
      } catch (e) {}
    }
    if (this.realtimeChannel) {
      try {
        this.realtimeChannel.send({
          type: 'broadcast',
          event: 'device_sessions_changed',
          payload: { sessions: this.activeDeviceSessions }
        }).catch(() => {});
      } catch (e) {}
    }
  }

  public registerDeviceSession(
    userId: string,
    deviceId: string,
    sessionToken: string,
    businessId?: string
  ): { success: boolean; conflictDetected: boolean; error?: string } {
    if (!userId || !deviceId) {
      return { success: false, conflictDetected: false, error: 'Invalid user or device identifier' };
    }

    const now = Date.now();
    const EXPIRY_MS = 25 * 1000;
    const localSessions = this.load<ActiveDeviceSession[]>('deviceSessions', []);

    // Filter out all prior sessions for this user (so only this new device is active)
    const otherUsersSessions = (Array.isArray(localSessions) ? localSessions : []).filter(
      s => s && s.userId !== userId && (now - s.lastHeartbeat) < EXPIRY_MS
    );

    // Add current device session as the active session
    otherUsersSessions.push({
      userId,
      deviceId,
      sessionToken,
      lastHeartbeat: now,
      businessId
    });

    this.activeDeviceSessions = otherUsersSessions;
    this.saveDeviceSessions();
    this.broadcastDeviceSessions();

    // Instantly notify and force logout all other devices/windows holding older tokens
    this.broadcastForceLogout(userId, sessionToken, deviceId);
    this.notify();

    return { success: true, conflictDetected: false };
  }

  public heartbeatDeviceSession(
    userId: string,
    deviceId: string,
    sessionToken: string
  ): { active: boolean; conflictDetected: boolean; superseded?: boolean } {
    if (!userId || !deviceId) {
      return { active: false, conflictDetected: false, superseded: true };
    }

    // Check profile session_token if available
    const profile = this.cache.profiles.find(p => p.id === userId);
    if (profile && profile.session_token && sessionToken && profile.session_token !== sessionToken) {
      let dbTs = 0;
      let localTs = 0;
      if (profile.session_token.startsWith('st_')) {
        dbTs = parseInt(profile.session_token.split('_')[1] || '0', 10);
      }
      if (sessionToken.startsWith('st_')) {
        localTs = parseInt(sessionToken.split('_')[1] || '0', 10);
      }
      
      if (dbTs > localTs) {
        // Newer session was established on another device
        return { active: false, conflictDetected: false, superseded: true };
      }
    }

    const activeUserSessions = this.getActiveDeviceSessions(userId);
    const currentDeviceSession = activeUserSessions.find(s => s.deviceId === deviceId);
    if (!currentDeviceSession) {
      // Session was superseded by a newer login on another device or expired
      return { active: false, conflictDetected: false, superseded: true };
    }

    if (sessionToken && currentDeviceSession.sessionToken && currentDeviceSession.sessionToken !== sessionToken) {
      // Token mismatch - superseded
      return { active: false, conflictDetected: false, superseded: true };
    }

    // Update heartbeat timestamp
    currentDeviceSession.lastHeartbeat = Date.now();
    if (sessionToken) {
      currentDeviceSession.sessionToken = sessionToken;
    }

    this.saveDeviceSessions();
    return { active: true, conflictDetected: false, superseded: false };
  }

  public removeDeviceSession(userId: string, deviceId: string): void {
    if (!userId || !deviceId) return;
    const now = Date.now();
    const EXPIRY_MS = 25 * 1000;
    const localSessions = this.load<ActiveDeviceSession[]>('deviceSessions', []);
    
    this.activeDeviceSessions = (Array.isArray(localSessions) ? localSessions : []).filter(
      s => s && !(s.userId === userId && s.deviceId === deviceId) && (now - s.lastHeartbeat) < EXPIRY_MS
    );
    
    this.saveDeviceSessions();
    this.broadcastDeviceSessions();
    this.notify();
  }

  public terminateAllUserSessions(userId: string, reason: string = 'Concurrent login detected on multiple devices'): void {
    if (!userId) return;
    const now = Date.now();
    const EXPIRY_MS = 25 * 1000;
    const localSessions = this.load<ActiveDeviceSession[]>('deviceSessions', []);

    // Remove all sessions for this userId
    this.activeDeviceSessions = (Array.isArray(localSessions) ? localSessions : []).filter(
      s => s && s.userId !== userId && (now - s.lastHeartbeat) < EXPIRY_MS
    );

    // Clear session_token in profile
    const profile = this.cache.profiles.find(p => p.id === userId);
    if (profile) {
      profile.session_token = undefined;
      this.save('profiles', profile);
      this.logActivity(
        profile.id,
        profile.name,
        profile.role,
        'Security Alert',
        `Automatic security logout triggered for all active devices: ${reason}`,
        profile.business_id
      );
    }

    this.saveDeviceSessions();
    this.broadcastDeviceSessions();
    this.broadcastForceLogoutAll(userId, reason);
    this.notify();
  }

  // ==================== CONCURRENT DRAFT INVOICE RESERVATION ====================
  public getActiveDraftReservations(businessId?: string): DraftInvoiceReservation[] {
    const now = Date.now();
    const EXPIRY_MS = 2 * 60 * 1000; // 2 minutes auto-expiry for stale drafts (renewed every 3-5s by active popups)

    // Dynamically load freshest draft reservations from localStorage
    const localDrafts = this.load<DraftInvoiceReservation[]>('draftReservations', []);
    const validDrafts = (Array.isArray(localDrafts) ? localDrafts : []).filter(
      r => r && r.id && r.invoiceNumber && (now - r.timestamp) < EXPIRY_MS
    );

    this.draftReservations = validDrafts;

    if (businessId) {
      return this.draftReservations.filter(r => isSameBusiness(r.businessId, businessId));
    }
    return this.draftReservations;
  }

  public syncIncomingDraftReservations(incoming: DraftInvoiceReservation[]): void {
    if (!Array.isArray(incoming)) return;
    const now = Date.now();
    const EXPIRY_MS = 2 * 60 * 1000;

    const validDrafts = incoming.filter(
      r => r && r.id && r.invoiceNumber && (now - r.timestamp) < EXPIRY_MS
    );

    this.draftReservations = validDrafts;
    this.saveDraftReservations();
    this.notify();
  }

  public reserveDraftInvoiceNumber(
    businessId: string,
    userId: string,
    userName: string,
    draftId: string,
    isFestive: boolean,
    isAdvance: boolean
  ): string {
    if (!draftId) return '';
    const normBiz = normalizeBusinessId(businessId);
    this.getActiveDraftReservations(); // purge expired & reload latest storage

    // Check if this draft already has an active reservation of the same type
    const existing = this.draftReservations.find(r => r.id === draftId);
    if (existing && existing.isFestive === isFestive && existing.isAdvance === isAdvance && isSameBusiness(existing.businessId, normBiz)) {
      // Check if another submitted order took this invoiceNumber in the meantime
      const allOrders = this.getSalesOrders(normBiz);
      const isTaken = allOrders.some(o => o.order_number === existing.invoiceNumber);
      if (!isTaken) {
        existing.timestamp = Date.now();
        this.saveDraftReservations();
        this.broadcastDraftReservations();
        return existing.invoiceNumber;
      }
    }

    // Allocate a guaranteed fresh non-colliding number across all active orders and concurrent drafts
    const invoiceNumber = this.getNextAvailableInvoiceNumber(normBiz, isFestive, isAdvance, draftId);

    const newReservation: DraftInvoiceReservation = {
      id: draftId,
      userId,
      userName,
      businessId: normBiz,
      invoiceNumber,
      isFestive,
      isAdvance,
      timestamp: Date.now()
    };

    const idx = this.draftReservations.findIndex(r => r.id === draftId);
    if (idx !== -1) {
      this.draftReservations[idx] = newReservation;
    } else {
      this.draftReservations.push(newReservation);
    }

    this.saveDraftReservations();
    this.broadcastDraftReservations();
    return invoiceNumber;
  }

  public renewDraftReservation(draftId: string): void {
    if (!draftId) return;
    this.getActiveDraftReservations();
    const res = this.draftReservations.find(r => r.id === draftId);
    if (res) {
      res.timestamp = Date.now();
      this.saveDraftReservations();
    }
  }

  public releaseDraftReservation(draftId: string): void {
    if (!draftId) return;
    const now = Date.now();
    const EXPIRY_MS = 2 * 60 * 1000;
    const localDrafts = this.load<DraftInvoiceReservation[]>('draftReservations', []);
    
    this.draftReservations = (Array.isArray(localDrafts) ? localDrafts : []).filter(
      r => r && r.id !== draftId && (now - r.timestamp) < EXPIRY_MS
    );
    
    this.saveDraftReservations();
    this.broadcastDraftReservations();
    this.notify();
  }

  public releaseDraftReservationByInvoice(invoiceNumber: string): void {
    if (!invoiceNumber) return;
    const now = Date.now();
    const EXPIRY_MS = 2 * 60 * 1000;
    const localDrafts = this.load<DraftInvoiceReservation[]>('draftReservations', []);
    
    this.draftReservations = (Array.isArray(localDrafts) ? localDrafts : []).filter(
      r => r && r.invoiceNumber !== invoiceNumber && (now - r.timestamp) < EXPIRY_MS
    );
    
    this.saveDraftReservations();
    this.broadcastDraftReservations();
    this.notify();
  }

  public getNextAvailableInvoiceNumber(
    businessId: string,
    isFestive: boolean,
    isAdvance: boolean,
    excludeDraftId?: string
  ): string {
    const normBiz = normalizeBusinessId(businessId);
    const biz = this.getBusiness(normBiz);
    const standardPrefix = typeof biz?.invoice_prefix === 'string' ? biz.invoice_prefix.trim() : 'KF-';
    const festivePrefix = typeof biz?.festive_invoice_prefix === 'string' ? biz.festive_invoice_prefix.trim() : 'FEST-KF-';
    const prefix = isFestive ? festivePrefix : standardPrefix;
    const targetPrefix = isAdvance ? `${prefix}AB-` : prefix;

    const allOrders = this.getSalesOrders(normBiz);
    const activeDrafts = this.getActiveDraftReservations(normBiz).filter(d => d.id !== excludeDraftId);

    // Sort orders by creation date (newest first) to accurately locate the last created order
    const sortedOrders = [...allOrders].sort((a, b) => {
      const tA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const tB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return tB - tA;
    });

    const usedSequences = new Set<number>();
    const orderSequences: number[] = [];
    let detectedDigitPadding = 0;
    let detectedPrefix = targetPrefix;

    // Helper to safely extract integer sequence and pattern from an invoice number
    const extractSeq = (invNum: string | undefined | null, isFromOrder = false) => {
      if (!invNum) return;
      const clean = invNum.trim();
      
      // Match exact prefix for this series (e.g. KF- or KF-AB- or FEST-KF- or INV-2026-)
      if (clean.startsWith(targetPrefix)) {
        const numPart = clean.slice(targetPrefix.length);
        const match = numPart.match(/^(\d+)$/);
        if (match) {
          const parsed = parseInt(match[1], 10);
          if (!isNaN(parsed) && parsed > 0 && parsed < 10000000) {
            usedSequences.add(parsed);
            if (isFromOrder) {
              orderSequences.push(parsed);
              if (match[1].length > 1 && match[1].startsWith('0')) {
                detectedDigitPadding = Math.max(detectedDigitPadding, match[1].length);
              }
            }
            return;
          }
        }
      }

      // Check if matches series prefix with AB / FEST variants
      if (clean.startsWith(prefix)) {
        const remaining = clean.slice(prefix.length);
        const hasAB = remaining.startsWith('AB-');
        if (hasAB === isAdvance) {
          const numPart = remaining.replace(/^AB-/, '').replace(/^SUB-/, '');
          const match = numPart.match(/^(\d+)$/);
          if (match) {
            const parsed = parseInt(match[1], 10);
            if (!isNaN(parsed) && parsed > 0 && parsed < 10000000) {
              usedSequences.add(parsed);
              if (isFromOrder) {
                orderSequences.push(parsed);
                if (match[1].length > 1 && match[1].startsWith('0')) {
                  detectedDigitPadding = Math.max(detectedDigitPadding, match[1].length);
                }
              }
              return;
            }
          }
        }
      }

      // Fallback: extract trailing digits and prefix from invoice number
      const trailingMatch = clean.match(/^(.*?)(\d+)$/);
      if (trailingMatch) {
        const parsed = parseInt(trailingMatch[2], 10);
        if (!isNaN(parsed) && parsed > 0 && parsed < 10000000) {
          usedSequences.add(parsed);
          if (isFromOrder) {
            orderSequences.push(parsed);
            if (trailingMatch[2].length > 1 && trailingMatch[2].startsWith('0')) {
              detectedDigitPadding = Math.max(detectedDigitPadding, trailingMatch[2].length);
            }
            // If the latest order used a custom prefix like INV-2026-, adopt it if default prefix was unused
            if (!isFestive && !isAdvance && trailingMatch[1] && orderSequences.length === 1 && !clean.startsWith(targetPrefix)) {
              detectedPrefix = trailingMatch[1];
            }
          }
        }
      }
    };

    // Extract sequences from all orders (most recent first) and active drafts
    sortedOrders.forEach(o => extractSeq(o.order_number, true));
    activeDrafts.forEach(d => extractSeq(d.invoiceNumber, false));

    const finalPrefix = detectedPrefix || targetPrefix;

    // Determine the base starting sequence:
    // If existing orders exist, start from the minimum sequence of the series or 1 if min <= 1
    let startSeq = 1;
    if (orderSequences.length > 0) {
      const minOrderSeq = Math.min(...orderSequences);
      const maxOrderSeq = Math.max(...orderSequences);
      // If minOrderSeq is higher than 1 (e.g. business started sequence at 90 or 1001), start from minOrderSeq
      if (minOrderSeq > 1 && maxOrderSeq >= minOrderSeq) {
        startSeq = minOrderSeq;
      }
    }

    // Find the next available unused sequence (filling any gaps or incrementing past max)
    let nextSeq = startSeq;
    const formatNumber = (num: number) => {
      const numStr = detectedDigitPadding > 1 ? String(num).padStart(detectedDigitPadding, '0') : String(num);
      return `${finalPrefix}${numStr}`;
    };

    while (
      usedSequences.has(nextSeq) ||
      allOrders.some(o => o.order_number === formatNumber(nextSeq)) ||
      activeDrafts.some(d => d.invoiceNumber === formatNumber(nextSeq))
    ) {
      nextSeq++;
    }

    return formatNumber(nextSeq);
  }

  private saveDraftReservations() {
    try {
      localStorage.setItem('omnipack_erp_draftReservations', JSON.stringify(this.draftReservations));
    } catch (e) {}
  }

  private broadcastDraftReservations() {
    if (this.bc) {
      try {
        this.bc.postMessage({ type: 'SYNC_DRAFT_RESERVATIONS', reservations: this.draftReservations });
      } catch (e) {}
    }
    if (this.realtimeChannel) {
      try {
        this.realtimeChannel.send({
          type: 'broadcast',
          event: 'draft_reservation_changed',
          payload: { reservations: this.draftReservations }
        }).catch(() => {});
      } catch (e) {}
    }
  }

  // Sales Order Operations
  public getSalesOrders(businessId: string): SalesOrder[] {
    const customers = this.getCustomers(businessId);
    const customerMap = new Map(customers.map(c => [c.id, c]));

    return dedupeById(
      (this.cache.sales || [])
        .filter(s => isSameBusiness(s.business_id, businessId))
        .map(s => {
          const cust = customerMap.get(s.customer_id);
          const resolvedArea = (s.area && s.area !== 'Other') 
            ? s.area 
            : (cust?.area && cust.area !== 'Other') 
            ? cust.area 
            : (cust?.shipping_address && !/Other/i.test(cust.shipping_address) ? cust.shipping_address.replace(/ Resident$/i, '').trim() : undefined) || 'Dahisar';
          return {
            ...s,
            area: resolvedArea,
            customer_name: s.customer_name || cust?.name || 'Walk-in Customer',
            items: (s.items || []).map(it => ({
              ...it,
              scanned_qty: typeof it.scanned_qty === 'number' && !isNaN(it.scanned_qty) ? it.scanned_qty : 0
            }))
          };
        })
        .sort((a, b) => new Date(b.created_at || b.order_date).getTime() - new Date(a.created_at || a.order_date).getTime())
    );
  }

  public async findSalesOrderByNumber(orderNumber: string): Promise<SalesOrder | null> {
    const rawClean = orderNumber.trim();
    const clean = rawClean.toLowerCase();
    if (!clean) return null;

    const salesList = this.cache.sales || [];

    // 1. Exact match
    let foundLocal = salesList.find(s => (s.order_number || '').trim().toLowerCase() === clean);

    // 2. Normalized prefix-stripped match (e.g. INV-2026-67 vs SO-2026-67 vs 2026-67)
    if (!foundLocal) {
      const numOnly = clean.replace(/^(inv|so)-?/i, '');
      foundLocal = salesList.find(s => {
        const sNum = (s.order_number || '').trim().toLowerCase();
        const sNumOnly = sNum.replace(/^(inv|so)-?/i, '');
        return sNumOnly === numOnly || sNum === clean;
      });
    }

    // 3. Substring match fallback
    if (!foundLocal) {
      foundLocal = salesList.find(s => {
        const sNum = (s.order_number || '').trim().toLowerCase();
        return (sNum && clean.includes(sNum)) || (sNum && sNum.includes(clean));
      });
    }

    if (foundLocal) {
      const custs = this.getCustomers(foundLocal.business_id);
      const cust = custs.find(c => c.id === foundLocal.customer_id);
      return {
        ...foundLocal,
        customer_name: foundLocal.customer_name || cust?.name || 'Customer'
      };
    }

    if (isSupabaseConfigured && supabase) {
      try {
        const { data } = await supabase
          .from('sales_orders')
          .select('*')
          .or(`order_number.ilike.%${clean}%,order_number.ilike.%${clean.replace(/^(inv|so)-?/i, '')}%`)
          .limit(1);

        if (data && data.length > 0) {
          return data[0] as SalesOrder;
        }
      } catch (err) {
        console.warn("Error finding sales order from Supabase:", err);
      }
    }

    return null;
  }

  public createSalesOrder(so: Omit<SalesOrder, 'id' | 'created_at'>): SalesOrder {
    let createdAtStr = new Date().toISOString();
    if (so.order_date) {
      const timeParts = (so.time || '12:00').match(/(\d+):(\d+)\s*(AM|PM)?/i);
      let hours = 12;
      let minutes = 0;
      if (timeParts) {
        hours = parseInt(timeParts[1], 10);
        minutes = parseInt(timeParts[2], 10);
        const ampm = timeParts[3];
        if (ampm) {
          if (ampm.toUpperCase() === 'PM' && hours < 12) hours += 12;
          if (ampm.toUpperCase() === 'AM' && hours === 12) hours = 0;
        }
      }
      const [y, m, d] = so.order_date.split('-').map(Number);
      if (y && m && d) {
        const orderDateTime = new Date(y, m - 1, d, hours, minutes);
        createdAtStr = orderDateTime.toISOString();
      }
    }

    const numPaid = typeof so.paid_amount === 'number' ? so.paid_amount : Number(so.paid_amount) || 0;
    
    // ENSURE UNIQUE INVOICE NUMBER
    let finalOrderNumber = so.order_number;
    const existingOrders = this.cache.sales.filter(o => isSameBusiness(o.business_id, so.business_id));
    if (existingOrders.some(o => o.order_number === finalOrderNumber)) {
      finalOrderNumber = this.getNextAvailableInvoiceNumber(so.business_id, !!so.festive_booking, !!so.advance_booking);
    }

    // Release any active draft reservation held for this invoice number
    this.releaseDraftReservationByInvoice(finalOrderNumber);

    const newSO: SalesOrder = {
      ...so,
      order_number: finalOrderNumber,
      paid_amount: numPaid,
      id: crypto.randomUUID(),
      created_at: createdAtStr
    };

    if (newSO.paid_amount > 0 && (!newSO.payment_history || newSO.payment_history.length === 0)) {
      newSO.payment_history = [{
        id: crypto.randomUUID(),
        order_id: newSO.id,
        order_number: newSO.order_number,
        type: 'Sales',
        amount: newSO.paid_amount,
        payment_mode: newSO.payment_mode || 'Cash',
        bank_account: 'Main Cash / Bank Account',
        payment_date: newSO.order_date || new Date().toISOString().split('T')[0],
        notes: 'Advance / Partial Payment Received on Order Creation',
        receipt_number: `RCT-${newSO.order_number}`,
        collected_by: 'Staff',
        business_id: newSO.business_id,
        created_at: new Date().toISOString()
      }];
    }

    this.cache.sales.unshift(newSO);
    this.save('sales', newSO);

    // Ensure stock is reduced if order is created in a dispatched/delivered state
    this.syncOrderStock(newSO);
    this.notify();

    return newSO;
  }

  public deleteSalesOrder(id: string): boolean {
    const index = this.cache.sales.findIndex(s => s.id === id);
    if (index !== -1) {
      const order = this.cache.sales[index];
      // Return stock if order was active (not already cancelled)
      this.syncOrderStock({ ...order, status: 'Cancelled' }, order.status);

      this.cache.sales.splice(index, 1);
      this.save('sales', null, true, id);
      this.notify();
      return true;
    }
    return false;
  }

  public updateSalesOrder(id: string, updates: Partial<SalesOrder>): SalesOrder {
    const index = this.cache.sales.findIndex(s => s.id === id);
    if (index !== -1) {
      const oldSO = this.cache.sales[index];
      const updatedPaidAmount = updates.paid_amount !== undefined 
        ? (typeof updates.paid_amount === 'number' ? updates.paid_amount : Number(updates.paid_amount) || 0) 
        : oldSO.paid_amount;

      const newSO = { 
        ...oldSO, 
        ...updates, 
        paid_amount: updatedPaidAmount 
      };
      this.cache.sales[index] = newSO;
      this.save('sales', newSO);

      // Handle stock synchronization
      this.syncOrderStock(newSO, oldSO.status);
      this.notify();

      return newSO;
    }
    throw new Error('Sales Order not found');
  }

  private syncOrderStock(order: SalesOrder, oldStatus?: OrderStatus) {
    const isStockAffecting = (status: OrderStatus) => status !== 'Cancelled' && status !== 'Returned';
    const wasAffecting = oldStatus ? isStockAffecting(oldStatus) : false;
    const nowAffecting = isStockAffecting(order.status);

    if (!wasAffecting && nowAffecting) {
      // Stock OUT: Order became active (created or un-cancelled/un-returned)
      order.items.forEach(item => {
        const prod = this.cache.products.find(p => p.id === item.product_id);
        if (prod && isComboProduct(prod)) {
          this.processComboSale(order.business_id, item.product_id, item.qty, 'System');
        } else if (prod) {
          // Individual product: check if auto-break combo is required for missing stock
          if (prod.current_stock < item.qty) {
            this.autoBreakComboForMissingItem(order.business_id, item.product_id, item.qty, 'System');
          }
          this.addStockLog(item.product_id, -item.qty, 'Out', `Order ${order.order_number} ${order.status}`, 'System', order.business_id);
        }
      });
    } else if (wasAffecting && !nowAffecting) {
      // Stock IN: Order became inactive (cancelled or returned)
      // Check if it's a damaged item return (Damage => DO NOT add to inventory)
      if (order.status === 'Returned' && order.return_type === 'Damage') {
        // Damaged goods are written off - DO NOT increase stock!
        order.items.forEach(item => {
          const prod = this.cache.products.find(p => p.id === item.product_id);
          if (prod) {
            const newLog: StockLog = {
              id: crypto.randomUUID(),
              product_id: item.product_id,
              change_qty: 0,
              type: 'Out',
              notes: `Order ${order.order_number} returned as DAMAGED (${order.return_reason || 'Damage in Transit'}) - Inventory NOT restocked (Scrap Write-off)`,
              created_by: 'Delivery System',
              created_at: new Date().toISOString(),
              business_id: order.business_id
            };
            this.cache.stockLogs.push(newLog);
            this.save('stockLogs', newLog);
          }
        });
      } else {
        // Regular return or refund => ADD BACK TO INVENTORY
        const logType: StockLog['type'] = order.status === 'Returned' ? 'Return' : 'In';
        const logNote = order.status === 'Returned' 
          ? `Order ${order.order_number} refunded/returned (${order.return_reason || 'Customer Return'}) - Restocked to Inventory` 
          : `Order ${order.order_number} cancelled - Restocked to Inventory`;
        
        order.items.forEach(item => {
          const prod = this.cache.products.find(p => p.id === item.product_id);
          if (prod) {
            this.addStockLog(item.product_id, item.qty, logType, logNote, 'System', order.business_id);
          }
        });
      }
    }
  }

  // Stock log and Inventory operations
  public getStockLogs(businessId: string): StockLog[] {
    return this.cache.stockLogs.filter(s => isSameBusiness(s.business_id, businessId));
  }

  public addStockLog(
    productId: string,
    changeQty: number,
    type: StockLog['type'],
    notes: string,
    createdBy: string,
    businessId: string
  ): StockLog {
    const newLog: StockLog = {
      id: crypto.randomUUID(),
      product_id: productId,
      change_qty: changeQty,
      type,
      notes,
      created_by: createdBy,
      created_at: new Date().toISOString(),
      business_id: businessId
    };

    // Update product current stock level in memory cache for immediate UI feedback.
    // IMPORTANT: We DO NOT call this.save('products', ...) here because there is a 
    // database trigger (trg_stock_logs_on_insert) in Supabase that automatically 
    // updates the products table when a new stock_log is inserted. 
    // Manual updates here would cause a double reduction/increase bug.
    const productIndex = this.cache.products.findIndex(p => p.id === productId);
    if (productIndex !== -1) {
      this.cache.products[productIndex].current_stock += changeQty;
    }

    this.cache.stockLogs.push(newLog);
    this.save('stockLogs', newLog);
    return newLog;
  }

  // Packing Verification Operations (Mandatory Core Feature)
  public scanOrderQR(businessId: string, qrCodeContent: string): { success: boolean; order?: SalesOrder; error?: string } {
    const rawContent = (qrCodeContent || '').trim();
    if (!rawContent) {
      return { success: false, error: 'Empty QR code content.' };
    }

    // Extract clean order number from various possible QR code formats
    let extractedOrderNum = rawContent;

    if (rawContent.includes('inv=')) {
      const match = rawContent.match(/inv=([^&]+)/i);
      if (match) extractedOrderNum = decodeURIComponent(match[1]).trim();
    } else if (rawContent.includes('tr=')) {
      const match = rawContent.match(/tr=([^&]+)/i);
      if (match) extractedOrderNum = decodeURIComponent(match[1]).trim();
    } else if (rawContent.includes('tn=')) {
      const match = rawContent.match(/tn=([^&]+)/i);
      if (match) {
        const tnText = decodeURIComponent(match[1]);
        const orderMatch = tnText.match(/(SO-?\d+|INV-?\d+|[A-Za-z0-9_-]{3,})/i);
        if (orderMatch) extractedOrderNum = orderMatch[0].trim();
      }
    } else if (rawContent.includes('Invoice No')) {
      const match = rawContent.match(/Invoice No\s*:\s*([^\s\n\r]+)/i);
      if (match) extractedOrderNum = match[1].trim();
    } else if (rawContent.includes('|')) {
      extractedOrderNum = rawContent.split('|')[0].trim();
    } else {
      const generalMatch = rawContent.match(/(SO-?\d+|INV-?\d+)/i);
      if (generalMatch) extractedOrderNum = generalMatch[0].trim();
    }

    // Find active order matching in store
    const order = this.cache.sales.find(
      s => s.business_id === businessId &&
      (
        s.order_number === rawContent ||
        s.qr_code_data === rawContent ||
        s.id === rawContent ||
        s.order_number === extractedOrderNum ||
        (extractedOrderNum && s.order_number.toLowerCase() === extractedOrderNum.toLowerCase()) ||
        (s.qr_code_data && s.qr_code_data.startsWith(extractedOrderNum))
      )
    );

    if (!order) {
      return { success: false, error: `Order "${extractedOrderNum || rawContent}" not found.` };
    }

    if (order.status === 'Packed' || order.status === 'Dispatched' || order.status === 'Delivered') {
      return { success: false, error: `This order is already marked as ${order.status}.` };
    }

    if (order.status === 'Cancelled') {
      return { success: false, error: 'This order has been cancelled.' };
    }

    return { success: true, order };
  }

  public verifyPackingBarcode(
    businessId: string,
    orderId: string,
    barcode: string
  ): {
    success: boolean;
    product?: Product;
    scanned_qty?: number;
    required_qty?: number;
    remaining_qty?: number;
    error_type?: 'wrong_product' | 'extra_product' | 'duplicate_scan' | 'inactive';
    error_message?: string;
  } {
    const orderIndex = this.cache.sales.findIndex(o => o.id === orderId && o.business_id === businessId);
    if (orderIndex === -1) {
      return { success: false, error_message: 'Sales Order not found' };
    }

    const order = this.cache.sales[orderIndex];
    const cleanCode = barcode.trim().toLowerCase();

    // 1. Try matching directly among items in this order first
    let product: Product | undefined;
    for (const item of (order.items || [])) {
      const p = this.cache.products.find(prod => prod.id === item.product_id);
      if (p) {
        if (
          String(p.barcode || '').trim().toLowerCase() === cleanCode ||
          String(p.sku || '').trim().toLowerCase() === cleanCode ||
          String(p.name || '').trim().toLowerCase() === cleanCode ||
          String(p.id || '').trim() === barcode.trim()
        ) {
          product = p;
          break;
        }
      }
    }

    // 2. If not found in order items, search all products in the database
    if (!product) {
      product = this.cache.products.find(p => p.business_id === businessId && (
        String(p.barcode || '').trim().toLowerCase() === cleanCode ||
        String(p.sku || '').trim().toLowerCase() === cleanCode ||
        String(p.name || '').trim().toLowerCase() === cleanCode ||
        String(p.id || '').trim() === barcode.trim()
      ));
    }

    if (!product) {
      return {
        success: false,
        error_type: 'wrong_product',
        error_message: `Unrecognized Barcode/SKU "${barcode}". Product not found in inventory.`
      };
    }

    // Verify if product belongs to this order
    const orderItemIndex = (order.items || []).findIndex(item => item.product_id === product!.id);
    if (orderItemIndex === -1) {
      return {
        success: false,
        product,
        error_type: 'wrong_product',
        error_message: `Wrong Product! "${product.name}" is not part of Order #${order.order_number}.`
      };
    }

    const item = order.items[orderItemIndex];

    // Ensure item.scanned_qty and item.qty are valid numbers
    const currentScanned = (typeof item.scanned_qty === 'number' && !isNaN(item.scanned_qty)) ? item.scanned_qty : 0;
    const requiredQty = typeof item.qty === 'number' ? item.qty : 1;

    // Verify extra product or quantity overflow
    if (currentScanned >= requiredQty) {
      return {
        success: false,
        product,
        error_type: 'extra_product',
        error_message: `Extra item scanned! "${product.name}" already has 100% verified quantity (${currentScanned}/${requiredQty}).`
      };
    }

    // Increment scanned count
    const updatedScanned = currentScanned + 1;
    const updatedItems = (order.items || []).map((it, idx) => {
      if (idx === orderItemIndex) {
        return {
          ...it,
          scanned_qty: updatedScanned
        };
      }
      return { ...it };
    });

    const updatedOrder = {
      ...order,
      items: updatedItems
    };

    this.cache.sales[orderIndex] = updatedOrder;
    this.save('sales', updatedOrder);

    const remaining = Math.max(0, requiredQty - updatedScanned);

    return {
      success: true,
      product,
      scanned_qty: updatedScanned,
      required_qty: requiredQty,
      remaining_qty: remaining
    };
  }

  public completePackingSession(
    businessId: string,
    orderId: string,
    staffId: string,
    staffName: string,
    totalScans: number,
    auditLogs: AuditLogEntry[],
    deliveryDetails?: {
      partner?: string;
      personName?: string;
      personPhone?: string;
      trackingNumber?: string;
      notes?: string;
      rackLocation?: string;
      rackSection?: string;
    }
  ): { success: boolean; order?: SalesOrder; error?: string } {
    const orderIndex = this.cache.sales.findIndex(o => o.id === orderId && o.business_id === businessId);
    if (orderIndex === -1) {
      return { success: false, error: 'Sales Order not found' };
    }

    const order = this.cache.sales[orderIndex];

    // Double check if all items are 100% verified
    const allVerified = (order.items || []).every(item => item.scanned_qty === item.qty);
    if (!allVerified) {
      return { success: false, error: 'Cannot complete packing! Some items have missing/insufficient scans.' };
    }

    // Record packing session log
    const session: PackingSession = {
      id: crypto.randomUUID(),
      order_id: orderId,
      packing_staff_id: staffId,
      start_time: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // Simulated 5 min duration
      end_time: new Date().toISOString(),
      total_scans: totalScans,
      status: 'Packed',
      logs: auditLogs,
      business_id: businessId
    };

    this.cache.packingSessions.push(session);
    this.save('packingSessions', session);

    // Update order status & delivery details
    let finalPartner = 'Packed';
    if (deliveryDetails && (deliveryDetails.partner || deliveryDetails.rackLocation || deliveryDetails.rackSection)) {
      finalPartner = deliveryDetails.partner;
      this.updateSalesOrder(orderId, {
        status: 'Packed',
        delivery_status: 'Packed',
        delivery_partner: deliveryDetails.partner,
        delivery_person_name: deliveryDetails.personName,
        delivery_person_phone: deliveryDetails.personPhone,
        tracking_number: deliveryDetails.trackingNumber,
        dispatch_notes: deliveryDetails.notes,
        rack_location: deliveryDetails.rackLocation,
        rack_section: deliveryDetails.rackSection,
        packing_completed_at: new Date().toISOString()
      });
    } else {
      this.updateSalesOrder(orderId, {
        status: 'Packed',
        delivery_status: 'Packed',
        packing_completed_at: new Date().toISOString()
      });
    }

    // Log to system audit trail
    this.logActivity(
      staffId,
      staffName,
      'Packing Staff',
      'Complete Packing',
      `Completed packing & assigned delivery (${finalPartner}) for order ${order.order_number}.`,
      businessId
    );

    return { success: true, order };
  }

  public getPackingSessions(businessId: string): PackingSession[] {
    return this.cache.packingSessions.filter(p => isSameBusiness(p.business_id, businessId));
  }

  // System Activity Logger
  public logActivity(userId: string, userName: string, userRole: string, action: string, details: string, businessId: string) {
    const newLog: SystemAuditLog = {
      id: crypto.randomUUID(),
      user_id: userId,
      user_name: userName,
      user_role: userRole,
      action,
      details,
      created_at: new Date().toISOString(),
      business_id: normalizeBusinessId(businessId)
    };
    this.cache.auditLogs.unshift(newLog); // newer logs first
    this.save('auditLogs', newLog);
  }

  public getSystemAuditLogs(businessId: string): SystemAuditLog[] {
    return dedupeById(this.cache.auditLogs.filter(a => isSameBusiness(a.business_id, businessId)));
  }

  // Business Settings
  public getSettings(businessId: string): BusinessSettings {
    let setting = this.cache.settings.find(s => isSameBusiness(s.business_id, businessId));
    if (!setting) {
      // fallback
      const business = this.getBusiness(businessId);
      setting = {
        business_id: businessId,
        business_name: business ? business.name : 'Unknown Company',
        gstin: business ? business.gstin : '',
        invoice_prefix: 'INV-',
        low_stock_limit: 10,
        barcode_format: 'CODE-128',
        qr_size: 150,
        enable_email_alerts: true,
        enable_sms_alerts: false,
        theme: 'light'
      };
      this.cache.settings.push(setting);
      try {
        localStorage.setItem('omnipack_erp_settings', JSON.stringify(this.cache.settings));
      } catch (e) {}
    }
    return setting;
  }

  public updateSettings(businessId: string, updates: Partial<BusinessSettings>): BusinessSettings {
    const index = this.cache.settings.findIndex(s => s.business_id === businessId);
    if (index !== -1) {
      this.cache.settings[index] = { ...this.cache.settings[index], ...updates };
      this.save('settings', this.cache.settings[index]);
      return this.cache.settings[index];
    } else {
      const current = this.getSettings(businessId);
      const merged = { ...current, ...updates };
      this.cache.settings.push(merged);
      this.save('settings', merged);
      return merged;
    }
  }

  // Reset Storage helper
  public async clearAllAndReset(businessId?: string) {
    if (businessId && isSupabaseConfigured && supabase) {
      try {
        const tables = [
          'categories', 'products', 'customers', 'suppliers', 
          'purchase_orders', 'sales_orders', 'stock_logs', 
          'system_audit_logs', 'packing_sessions', 'chat_messages', 
          'loyalty_logs', 'customer_subscriptions'
        ];
        for (const table of tables) {
          await supabase.from(table).delete().eq('business_id', businessId);
        }
        await supabase.from('business_settings').update({ updated_at: new Date().toISOString() }).eq('business_id', businessId);
      } catch (e) {
        console.warn('Failed to wipe Supabase on reset', e);
      }
    }

    localStorage.removeItem('omnipack_erp_businesses');
    localStorage.removeItem('omnipack_erp_profiles');
    localStorage.removeItem('omnipack_erp_categories');
    localStorage.removeItem('omnipack_erp_products');
    localStorage.removeItem('omnipack_erp_customers');
    localStorage.removeItem('omnipack_erp_suppliers');
    localStorage.removeItem('omnipack_erp_purchases');
    localStorage.removeItem('omnipack_erp_sales');
    localStorage.removeItem('omnipack_erp_settings');
    localStorage.removeItem('omnipack_erp_stockLogs');
    localStorage.removeItem('omnipack_erp_auditLogs');
    localStorage.removeItem('omnipack_erp_packingSessions');
    localStorage.removeItem('omnipack_erp_messages');
    localStorage.removeItem('omnipack_erp_loyaltyLogs');
    localStorage.removeItem('omnipack_erp_subscriptions');
    localStorage.removeItem('omnipack_erp_comboLogs');

    this.cache = {
      businesses: PRE_SEEDED_BUSINESSES,
      profiles: PRE_SEEDED_PROFILES,
      categories: PRE_SEEDED_CATEGORIES,
      products: PRE_SEEDED_PRODUCTS,
      customers: PRE_SEEDED_CUSTOMERS,
      suppliers: PRE_SEEDED_SUPPLIERS,
      purchases: PRE_SEEDED_PURCHASES,
      sales: PRE_SEEDED_SALES,
      settings: PRE_SEEDED_SETTINGS,
      stockLogs: PRE_SEEDED_STOCK_LOGS,
      auditLogs: PRE_SEEDED_SYSTEM_AUDIT_LOGS,
      packingSessions: [],
      messages: [],
      loyaltyConfigs: [],
      loyaltyLogs: PRE_SEEDED_LOYALTY_LOGS,
      subscriptions: PRE_SEEDED_SUBSCRIPTIONS,
      comboLogs: []
    };
  }

  // Metrics Generator for Dashboard (isolated by business_id)
  public getDashboardMetrics(
    businessId: string, 
    timeHorizon: TimeHorizon = 'today',
    customStartDate?: string,
    customEndDate?: string
  ) {
    const products = this.getProducts(businessId);
    const allOrders = this.getSalesOrders(businessId);

    // Filter orders strictly by time horizon
    const orders = allOrders.filter(o => isOrderInTimeHorizon(o, timeHorizon, customStartDate, customEndDate));

    const todaySalesAmount = orders
      .filter(o => o.status !== 'Cancelled')
      .reduce((sum, o) => sum + o.total_amount, 0);

    const pendingOrders = orders.filter(o => o.status === 'Pending').length;
    const packingOrders = orders.filter(o => o.status === 'Packing').length;
    const packedOrders = orders.filter(o => o.status === 'Packed').length;
    const dispatchedOrders = orders.filter(o => o.status === 'Dispatched').length;
    const deliveredOrders = orders.filter(o => o.status === 'Delivered').length;
    const cancelledOrders = orders.filter(o => o.status === 'Cancelled').length;
    const advanceBookingOrders = orders.filter(o => o.advance_booking).length;

    // Specific KPI values matching operational snapshot
    const toPackToday = allOrders.filter(o => o.status === 'Pending' || o.status === 'Packing').length;
    const readyForDispatch = allOrders.filter(o => o.status === 'Packed').length;
    const deliveriesToday = allOrders.filter(o => o.status === 'Dispatched' || o.status === 'Delivered').length;
    const overdueOrdersCount = allOrders.filter(o => o.is_overdue || o.status === 'Pending' || o.status === 'Packing').length;
    const pendingPaymentsCount = allOrders.filter(o => o.payment_status === 'Unpaid' || o.payment_status === 'Partial').length;
    const totalOrdersCount = orders.length;
    const outstandingAmount = allOrders
      .filter(o => o.payment_status === 'Unpaid' || o.payment_status === 'Partial')
      .reduce((sum, o) => sum + Math.max(0, o.total_amount - (o.paid_amount || 0)), 0);

    // Pipeline counts
    const statusPipeline = {
      bookingReceived: orders.filter(o => o.status === 'Pending' && !o.advance_booking).length,
      productionStarted: orders.filter(o => o.status === 'Pending' && o.advance_booking).length || 1,
      packingStarted: orders.filter(o => o.status === 'Packing').length,
      packingCompleted: orders.filter(o => o.status === 'Packed').length,
      readyForDispatch: orders.filter(o => o.status === 'Packed').length,
      outForDelivery: orders.filter(o => o.status === 'Dispatched').length,
      delivered: orders.filter(o => o.status === 'Delivered').length,
      cancelled: orders.filter(o => o.status === 'Cancelled').length,
    };

    // Area breakdown
    const areaCountsMap: Record<string, number> = {};
    orders.forEach(o => {
      const area = o.area || 'Other';
      areaCountsMap[area] = (areaCountsMap[area] || 0) + 1;
    });

    // Ensure standard areas are present
    const defaultAreas = ['Dahisar', 'Borivali', 'Kandivali', 'Mira Road', 'Vasai', 'Virar', 'Other'];
    defaultAreas.forEach(a => {
      if (!(a in areaCountsMap)) {
        areaCountsMap[a] = 0;
      }
    });

    const activeOrdersByArea = Object.entries(areaCountsMap).map(([area, count]) => ({
      area,
      count
    })).sort((a, b) => b.count - a.count);

    const lowStockThreshold = this.getSettings(businessId).low_stock_limit;
    const lowStock = products.filter(p => p.current_stock > 0 && p.current_stock <= lowStockThreshold).length;
    const outOfStock = products.filter(p => p.current_stock === 0).length;

    // Inventory Valuation
    const totalInventoryValue = products.reduce((sum, p) => sum + (p.current_stock * p.purchase_price), 0);
    const totalSalesValue = products.reduce((sum, p) => sum + (p.current_stock * p.selling_price), 0);

    // Monthly revenue simulation (6 months trailing)
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonthIdx = new Date().getMonth();
    const trailingMonths = Array.from({ length: 6 }, (_, idx) => {
      const targetIdx = (currentMonthIdx - 5 + idx + 12) % 12;
      return months[targetIdx];
    });

    const baseRevenue = 26400;
    const monthlyRevenueGraph = trailingMonths.map((m, idx) => {
      const val = idx === 5 
        ? Math.round(todaySalesAmount || baseRevenue)
        : Math.round(baseRevenue * (0.7 + (idx * 0.08)));
      return { month: m, revenue: val };
    });

    // Top selling products simulation
    const topProducts = products
      .map(p => {
        const qtySold = orders
          .filter(o => o && o.status !== 'Cancelled')
          .flatMap(o => o.items || [])
          .filter(item => item && item.product_id === p.id)
          .reduce((sum, item) => sum + (item.qty || 0), 0);
        return {
          id: p.id,
          name: p.name,
          sku: p.sku,
          sold: qtySold > 0 ? qtySold : Math.round(Math.random() * 15 + 1),
          revenue: p.selling_price * (qtySold > 0 ? qtySold : Math.round(Math.random() * 15 + 1))
        };
      })
      .sort((a, b) => b.sold - a.sold)
      .slice(0, 5);

    return {
      toPackToday,
      readyForDispatch,
      deliveriesToday,
      overdueOrdersCount,
      pendingPaymentsCount,
      totalOrdersCount,
      todaySalesAmount,
      outstandingAmount,
      todayOrders: orders.length,
      pendingOrders,
      packingOrders,
      packedOrders,
      dispatchedOrders,
      deliveredOrders,
      cancelledOrders,
      advanceBookingOrders,
      statusPipeline,
      activeOrdersByArea,
      lowStock,
      outOfStock,
      totalInventoryValue,
      totalSalesValue,
      monthlyRevenueGraph,
      topProducts,
      recentOrders: orders.slice().sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 10)
    };
  }

  // Chat Operations
  public getMessages(businessId: string): ChatMessage[] {
    return dedupeById((this.cache.messages || []).filter(m => isSameBusiness(m.business_id, businessId)));
  }

  public sendMessage(msg: Omit<ChatMessage, 'id' | 'created_at' | 'is_read'>): ChatMessage {
    const newMsg: ChatMessage = {
      ...msg,
      business_id: normalizeBusinessId(msg.business_id),
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      is_read: false
    };
    if (!this.cache.messages) this.cache.messages = []; this.cache.messages.push(newMsg);
    this.save('messages', newMsg);
    return newMsg;
  }

  public markMessageAsRead(id: string) {
    if (!this.cache.messages) return;
    const index = this.cache.messages.findIndex(m => m.id === id);
    if (index !== -1 && !this.cache.messages[index].is_read) {
      this.cache.messages[index].is_read = true;
      this.save('messages', this.cache.messages[index]);
    }
  }

  public markConversationRead(senderId: string, receiverId: string) {
    if (!this.cache.messages) return;
    const updated: ChatMessage[] = [];
    this.cache.messages.forEach(m => {
      if (m.sender_id === senderId && m.receiver_id === receiverId && !m.is_read) {
        m.is_read = true;
        updated.push(m);
      }
    });
    if (updated.length > 0) {
      this.save('messages', updated);
    }
  }

  public markAllMessagesRead(receiverId?: string) {
    if (!this.cache.messages) return;
    const updated: ChatMessage[] = [];
    this.cache.messages.forEach(m => {
      if ((!receiverId || m.receiver_id === receiverId) && !m.is_read) {
        m.is_read = true;
        updated.push(m);
      }
    });
    if (updated.length > 0) {
      this.save('messages', updated);
    }
  }

  public markMessagesForOrderRead(orderNumberOrId: string, receiverId?: string) {
    if (!this.cache.messages || !orderNumberOrId) return;
    const cleanSearch = orderNumberOrId.trim().toLowerCase().replace(/^#/, '');
    
    // Resolve order_number if orderNumberOrId was an ID
    const foundOrder = (this.cache.sales || []).find(o => 
      o.id === orderNumberOrId || 
      o.order_number.toLowerCase() === cleanSearch ||
      o.order_number.toLowerCase().replace(/^#/, '') === cleanSearch
    );
    const orderNumToMatch = foundOrder ? foundOrder.order_number.toLowerCase().replace(/^#/, '') : cleanSearch;

    const updated: ChatMessage[] = [];
    this.cache.messages.forEach(m => {
      if ((!receiverId || m.receiver_id === receiverId) && !m.is_read) {
        const contentLower = m.content.toLowerCase();
        if (
          (cleanSearch && contentLower.includes(cleanSearch)) ||
          (orderNumToMatch && contentLower.includes(orderNumToMatch))
        ) {
          m.is_read = true;
          updated.push(m);
        }
      }
    });
    if (updated.length > 0) {
      this.save('messages', updated);
    }
  }
}

export const dbStore = new ERPStorage();
