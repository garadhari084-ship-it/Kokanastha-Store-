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
  ComboHistoryLog
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
    loyaltyLogs: LoyaltyLog[];
    subscriptions: CustomerSubscription[];
    comboLogs: ComboHistoryLog[];
  };

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
      loyaltyLogs: this.load('loyaltyLogs', PRE_SEEDED_LOYALTY_LOGS),
      subscriptions: this.load('subscriptions', PRE_SEEDED_SUBSCRIPTIONS),
      comboLogs: this.load('comboLogs', [])
    };

    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.bc = new BroadcastChannel('omnipack_erp_sync_channel');
        this.bc.onmessage = (event) => {
          if (event.data && event.data.type === 'SYNC_STATE') {
            this.reloadFromLocalStorage();
          }
        };
      } catch (e) {}
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key && e.key.startsWith('omnipack_erp_')) {
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
      loyaltyLogs: this.load('loyaltyLogs', PRE_SEEDED_LOYALTY_LOGS),
      subscriptions: this.load('subscriptions', PRE_SEEDED_SUBSCRIPTIONS),
      comboLogs: this.load('comboLogs', [])
    };
    this.notify();
  }

  private load<T>(key: string, defaultValue: T): T {
    try {
      const data = localStorage.getItem(`omnipack_erp_${key}`);
      return data ? JSON.parse(data) : defaultValue;
    } catch (e) {
      console.error(`Error loading state for key ${key}`, e);
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

  public async syncFromSupabase(businessId?: string) {
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
       subscriptions: 'customer_subscriptions',
       comboLogs: 'combo_history_logs'
    };
       const syncPromises = Object.entries(tables).map(async ([key, table]) => {
       try {
       let query = supabase.from(table).select('*');
       if (businessId && table !== 'businesses') {
          query = query.eq('business_id', businessId);
       } else if (businessId && table === 'businesses') {
          query = query.eq('id', businessId);
       }
          
       const { data, error } = await query;
       if (!error && data) {
          if (data.length === 0) {
             if (key !== 'businesses' && key !== 'profiles' && key !== 'settings') {
                (this.cache as any)[key] = [];
                localStorage.setItem(`omnipack_erp_${key}`, JSON.stringify([]));
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

             const mergedProfiles = data.map((p: any) => ({
               ...p,
               password_hash: (p as any).password_hash || existingPasswords[p.email?.toLowerCase()?.trim()] || undefined
             }));
             this.cache.profiles = mergedProfiles;
             localStorage.setItem(`omnipack_erp_profiles`, JSON.stringify(mergedProfiles));
          } else if (key === 'sales') {
             const { data: itemsData } = await supabase.from('sales_order_items').select('*');
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
               const rawItems = (itemsByOrder[so.id] && itemsByOrder[so.id].length > 0) ? itemsByOrder[so.id] : (so.items || []);
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
             const mergedCustomers = (data || []).map((cust: any) => {
               const existingCust = (this.cache.customers || []).find(c => c.id === cust.id);
               return {
                 ...existingCust,
                 ...cust,
                 area: cust.area || existingCust?.area || undefined
               };
             });
             this.cache.customers = mergedCustomers;
             localStorage.setItem('omnipack_erp_customers', JSON.stringify(mergedCustomers));
          } else if (key === 'purchases') {
             const { data: itemsData } = await supabase.from('purchase_order_items').select('*');
             const itemsByPO: Record<string, any[]> = {};
             (itemsData || []).forEach((item: any) => {
               if (!itemsByPO[item.purchase_order_id]) itemsByPO[item.purchase_order_id] = [];
               itemsByPO[item.purchase_order_id].push(item);
             });
             const mergedPurchases = (data || []).map((po: any) => ({
               ...po,
               items: (itemsByPO[po.id] && itemsByPO[po.id].length > 0) ? itemsByPO[po.id] : (po.items || [])
             }));
             this.cache.purchases = mergedPurchases;
             localStorage.setItem('omnipack_erp_purchases', JSON.stringify(mergedPurchases));
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
         console.error(`Supabase delete error on ${tableName}:`, JSON.stringify(error));
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
           if (tableName === 'customers') {
               delete clean.area;
               if (clean.pan) clean.pan = String(clean.pan).substring(0, 10);
               if (clean.gstin) clean.gstin = String(clean.gstin).substring(0, 15);
           }
           if (tableName === 'suppliers') {
               if (clean.pan) clean.pan = String(clean.pan).substring(0, 10);
               if (clean.gstin) clean.gstin = String(clean.gstin).substring(0, 15);
           }
           if (tableName === 'products') {
               clean.category_id = sanitizeUUID(clean.category_id, true);
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
                       purchaseItems.push(pi);
                   });
               }
               delete clean.items;
           }
           if (tableName === 'users_profiles') {
               // We intentionally preserve password_hash so users created via UI can log in
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
               if (clean.customer_id && Array.isArray(this.cache.customers) && !this.cache.customers.some((c: any) => c.id === clean.customer_id)) {
                   clean.customer_id = null;
               }
               clean.order_id = sanitizeUUID(clean.order_id, true);
               if (clean.order_id && Array.isArray(this.cache.sales) && !this.cache.sales.some((s: any) => s.id === clean.order_id)) {
                   clean.order_id = null;
               }
           }
           if (tableName === 'customer_subscriptions') {
               clean.customer_id = sanitizeUUID(clean.customer_id, true);
               if (clean.customer_id && Array.isArray(this.cache.customers) && !this.cache.customers.some((c: any) => c.id === clean.customer_id)) {
                   clean.customer_id = null;
               }
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
       
       if (Array.isArray(payload)) {
           payload = payload.map(cleanItem);
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
         console.error(`Supabase sync error on ${tableName}:`, JSON.stringify(error));
         return error;
       }
       
       if (tableName === 'sales_orders' && salesItems.length > 0) {
           const { error: err2 } = await supabase.from('sales_order_items').upsert(salesItems);
           if (err2 && err2.code !== 'PGRST205') console.error('Supabase sync error on sales_order_items:', JSON.stringify(err2));
       }
       
       if (tableName === 'purchase_orders' && purchaseItems.length > 0) {
           const { error: err3 } = await supabase.from('purchase_order_items').upsert(purchaseItems);
           if (err3 && err3.code !== 'PGRST205') console.error('Supabase sync error on purchase_order_items:', JSON.stringify(err3));
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
      console.error(`Error saving state for key ${key}`, e);
    }
    if (this.bc) {
      try {
        this.bc.postMessage({ type: 'SYNC_STATE', key });
      } catch (e) {}
    }
    this.notify();
  }

  // Auth Operations
  public login(email: string, password_raw: string): { success: boolean; user?: UserProfile; business?: Business; error?: string } {
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

  // Tenant / Business Management
  public getBusinesses(): Business[] {
    return this.cache.businesses;
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
    return this.cache.profiles.filter(u => u.business_id === businessId);
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
    return this.cache.categories.filter(c => c.business_id === businessId);
  }

  public createCategory(cat: Omit<Category, 'id' | 'created_at'>): Category {
    const newCat: Category = {
      ...cat,
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
    return this.cache.products
      .filter(p => p.business_id === businessId)
      .map(p => ({
        ...p,
        is_combo: isComboProduct(p)
      }));
  }

  public createProduct(prod: Omit<Product, 'id' | 'created_at' | 'current_stock'>): Product {
    const newProd: Product = {
      ...prod,
      id: crypto.randomUUID(),
      current_stock: 0, // Initialized to 0, will be updated by addStockLog below
      is_combo: false,
      created_at: new Date().toISOString()
    };
    this.cache.products.push(newProd);
    this.save('products', newProd);

    // Add stock log for opening stock - this will trigger the DB to update current_stock
    if (prod.opening_stock > 0) {
      this.addStockLog(newProd.id, prod.opening_stock, 'In', 'Opening Stock Entry', 'System', prod.business_id);
    }

    return newProd;
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
    return [...logs].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
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
    return this.cache.customers.filter(c => c.business_id === businessId);
  }

  public createCustomer(cust: Omit<Customer, 'id' | 'created_at' | 'outstanding_amount'>): Customer {
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
    const biz = this.getBusiness(businessId);
    return biz?.loyalty_config || DEFAULT_LOYALTY_CONFIG;
  }

  public updateLoyaltyConfig(businessId: string, updates: Partial<LoyaltyConfig>): LoyaltyConfig {
    const currentConfig = this.getLoyaltyConfig(businessId);
    const updated = { ...currentConfig, ...updates };
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

  public calculateCustomerTier(lifetimeSpend: number, config: LoyaltyConfig): 'Silver' | 'Gold' | 'Platinum' {
    if (lifetimeSpend >= (config.platinum_min_spend || 20000)) return 'Platinum';
    if (lifetimeSpend >= (config.gold_min_spend || 10000)) return 'Gold';
    return 'Silver';
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
    const newLifetimeSpend = (cust.lifetime_spend || 0) + orderAmount;
    const newTier = this.calculateCustomerTier(newLifetimeSpend, config);

    // Tier Multiplier
    let multiplier = 1.0;
    if (newTier === 'Gold') multiplier = config.gold_multiplier || 1.25;
    if (newTier === 'Platinum') multiplier = config.platinum_multiplier || 1.5;

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
    return subs.filter(s => s.business_id === businessId);
  }

  public createSubscription(
    subData: Omit<CustomerSubscription, 'id' | 'subscription_number' | 'created_at'>
  ): CustomerSubscription {
    const num = `SUB-${Math.floor(1000 + Math.random() * 9000)}`;
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
    return this.cache.suppliers.filter(s => s.business_id === businessId);
  }

  public createSupplier(sup: Omit<Supplier, 'id' | 'created_at' | 'outstanding_amount'>): Supplier {
    const newSup: Supplier = {
      ...sup,
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
    return (this.cache.purchases || [])
      .filter(p => p.business_id === businessId)
      .map(p => ({ ...p, items: p.items || [] }));
  }

  public createPurchaseOrder(po: Omit<PurchaseOrder, 'id' | 'created_at'>): PurchaseOrder {
    const newPO: PurchaseOrder = {
      ...po,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString()
    };
    this.cache.purchases.push(newPO);
    this.save('purchases', newPO);

    // If order received immediately, trigger stock ledger in-movement
    if (newPO.status === 'Received') {
      newPO.items.forEach(item => {
        this.addStockLog(item.product_id, item.qty, 'In', `Received purchase order ${newPO.order_number}`, 'System', newPO.business_id);
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
          this.addStockLog(item.product_id, item.qty, 'In', `Received purchase order ${newPO.order_number}`, 'System', newPO.business_id);
        });
      }

      return newPO;
    }
    throw new Error('Purchase Order not found');
  }

  // Sales Order Operations
  public getSalesOrders(businessId: string): SalesOrder[] {
    const customers = this.getCustomers(businessId);
    const customerMap = new Map(customers.map(c => [c.id, c]));

    return (this.cache.sales || [])
      .filter(s => s.business_id === businessId)
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
      .sort((a, b) => new Date(b.created_at || b.order_date).getTime() - new Date(a.created_at || a.order_date).getTime());
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

    const newSO: SalesOrder = {
      ...so,
      id: crypto.randomUUID(),
      created_at: createdAtStr
    };
    this.cache.sales.unshift(newSO);
    this.save('sales', newSO);

    // Ensure stock is reduced if order is created in a dispatched/delivered state
    this.syncOrderStock(newSO);

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
      return true;
    }
    return false;
  }

  public updateSalesOrder(id: string, updates: Partial<SalesOrder>): SalesOrder {
    const index = this.cache.sales.findIndex(s => s.id === id);
    if (index !== -1) {
      const oldSO = this.cache.sales[index];
      const newSO = { ...oldSO, ...updates };
      this.cache.sales[index] = newSO;
      this.save('sales', newSO);

      // Handle stock synchronization
      this.syncOrderStock(newSO, oldSO.status);

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
      const logType: StockLog['type'] = order.status === 'Returned' ? 'Return' : 'In';
      const logNote = order.status === 'Returned' ? `Order ${order.order_number} returned` : `Order ${order.order_number} cancelled`;
      
      order.items.forEach(item => {
        const prod = this.cache.products.find(p => p.id === item.product_id);
        if (prod) {
          this.addStockLog(item.product_id, item.qty, logType, logNote, 'System', order.business_id);
        }
      });
    }
  }

  // Stock log and Inventory operations
  public getStockLogs(businessId: string): StockLog[] {
    return this.cache.stockLogs.filter(s => s.business_id === businessId);
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
    // Finds active order matching this qr_code or order number
    const order = this.cache.sales.find(
      s => s.business_id === businessId &&
      (s.qr_code_data === qrCodeContent || s.order_number === qrCodeContent || s.id === qrCodeContent)
    );

    if (!order) {
      return { success: false, error: 'Order QR Code not found.' };
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
          p.barcode?.trim().toLowerCase() === cleanCode ||
          p.sku?.trim().toLowerCase() === cleanCode ||
          p.name?.trim().toLowerCase() === cleanCode ||
          p.id === barcode.trim()
        ) {
          product = p;
          break;
        }
      }
    }

    // 2. If not found in order items, search all products in the database
    if (!product) {
      product = this.cache.products.find(p => p.business_id === businessId && (
        p.barcode?.trim().toLowerCase() === cleanCode ||
        p.sku?.trim().toLowerCase() === cleanCode ||
        p.name?.trim().toLowerCase() === cleanCode ||
        p.id === barcode.trim()
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
    return this.cache.packingSessions.filter(p => p.business_id === businessId);
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
      business_id: businessId
    };
    this.cache.auditLogs.unshift(newLog); // newer logs first
    this.save('auditLogs', newLog);
  }

  public getSystemAuditLogs(businessId: string): SystemAuditLog[] {
    return this.cache.auditLogs.filter(a => a.business_id === businessId);
  }

  // Business Settings
  public getSettings(businessId: string): BusinessSettings {
    let setting = this.cache.settings.find(s => s.business_id === businessId);
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
      this.save('settings', this.cache.settings.find(s => s.business_id === businessId));
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
        console.error('Failed to wipe Supabase on reset', e);
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
    return (this.cache.messages || []).filter(m => m.business_id === businessId);
  }

  public sendMessage(msg: Omit<ChatMessage, 'id' | 'created_at' | 'is_read'>): ChatMessage {
    const newMsg: ChatMessage = {
      ...msg,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      is_read: false
    };
    if (!this.cache.messages) this.cache.messages = []; this.cache.messages.push(newMsg);
    this.save('messages', newMsg);
    return newMsg;
  }

  public markMessageAsRead(id: string) {
    const index = this.cache.messages.findIndex(m => m.id === id);
    if (index !== -1) {
      this.cache.messages[index].is_read = true;
      this.save('messages', this.cache.messages[index]);
    }
  }

  public markConversationRead(senderId: string, receiverId: string) {
    let changed = false;
    this.cache.messages.forEach(m => {
      if (m.sender_id === senderId && m.receiver_id === receiverId && !m.is_read) {
        m.is_read = true;
        changed = true;
      }
    });
    if (changed) {
      this.save('messages', this.cache.messages);
    }
  }
}

export const dbStore = new ERPStorage();
