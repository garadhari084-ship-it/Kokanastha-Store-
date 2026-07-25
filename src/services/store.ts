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
  ChatMessage
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
    tax_rate_default: 5.00,
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

const PRE_SEEDED_CATEGORIES: Category[] = [];

const PRE_SEEDED_PRODUCTS: Product[] = [
  {
    id: 'p1',
    name: 'Ukadiche Modak (Pack of 6)',
    sku: 'MODAK-UKD-6',
    category_id: 'cat1',
    purchase_price: 220,
    selling_price: 350,
    mrp: 380,
    gst_rate: 5,
    unit: 'Pack',
    current_stock: 45,
    minimum_stock: 10,
    maximum_stock: 200,
    opening_stock: 50,
    brand: 'Kokanastha',
    hsn_code: '2106',
    qr_code: '8901234567101',
    image_url: 'https://images.unsplash.com/photo-1626132647523-66f5bf380027?auto=format&fit=crop&q=80&w=400&h=400',
    description: 'Fresh authentic Ukadiche Modak',
    business_id: BIZ_ID,
    active: true,
    barcode: '8901234567101',
    created_at: new Date().toISOString()
  },
  {
    id: 'p2',
    name: 'Kaju Katli Special (500g)',
    sku: 'SWT-KAJU-500',
    category_id: 'cat1',
    purchase_price: 180,
    selling_price: 280,
    mrp: 300,
    gst_rate: 5,
    unit: 'Box',
    current_stock: 30,
    minimum_stock: 10,
    maximum_stock: 200,
    opening_stock: 35,
    brand: 'Kokanastha',
    hsn_code: '2106',
    qr_code: '8901234567102',
    image_url: 'https://images.unsplash.com/photo-1599599810769-bcde5a160d32?auto=format&fit=crop&q=80&w=400&h=400',
    description: 'Rich Cashew Katli',
    business_id: BIZ_ID,
    active: true,
    barcode: '8901234567102',
    created_at: new Date().toISOString()
  },
  {
    id: 'p3',
    name: 'Special Diwali Faral Box (1kg)',
    sku: 'FRL-BOX-1KG',
    category_id: 'cat1',
    purchase_price: 320,
    selling_price: 520,
    mrp: 550,
    gst_rate: 5,
    unit: 'Box',
    current_stock: 25,
    minimum_stock: 10,
    maximum_stock: 200,
    opening_stock: 30,
    brand: 'Kokanastha',
    hsn_code: '2106',
    qr_code: '8901234567103',
    image_url: 'https://images.unsplash.com/photo-1589114473223-c091bc90a071?auto=format&fit=crop&q=80&w=400&h=400',
    description: 'Assorted Diwali Faral Snacks',
    business_id: BIZ_ID,
    active: true,
    barcode: '8901234567103',
    created_at: new Date().toISOString()
  }
];

const PRE_SEEDED_CUSTOMERS: Customer[] = [
  {
    id: 'c1',
    name: 'Aniket Sharma',
    group: 'Retail',
    area: 'Dahisar',
    gstin: '27AABCS1234F1Z1',
    pan: 'AABCS1234F',
    billing_address: 'Dahisar Resident',
    shipping_address: 'Dahisar Resident',
    email: 'aniket@gmail.com',
    phone: '+91 98200 11111',
    credit_limit: 10000,
    outstanding_amount: 0,
    business_id: BIZ_ID,
    active: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'c2',
    name: 'Priyanka Joshi',
    group: 'Retail',
    area: 'Borivali',
    gstin: '27AABCJ5678F1Z2',
    pan: 'AABCJ5678F',
    billing_address: 'Borivali Resident',
    shipping_address: 'Borivali Resident',
    email: 'priyanka@gmail.com',
    phone: '+91 98200 22222',
    credit_limit: 10000,
    outstanding_amount: 0,
    business_id: BIZ_ID,
    active: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'c3',
    name: 'Rajesh Kadam',
    group: 'Retail',
    area: 'Kandivali',
    gstin: '27AABCK9012F1Z3',
    pan: 'AABCK9012F',
    billing_address: 'Kandivali Resident',
    shipping_address: 'Kandivali Resident',
    email: 'rajesh@gmail.com',
    phone: '+91 98200 33333',
    credit_limit: 10000,
    outstanding_amount: 0,
    business_id: BIZ_ID,
    active: true,
    created_at: new Date().toISOString()
  }
];

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

const PRE_SEEDED_SALES: SalesOrder[] = [
  {
    id: 'so-1001',
    order_number: '#1036',
    customer_id: 'c1',
    customer_name: 'Aniket Sharma',
    area: 'Dahisar',
    channel: 'Direct Order',
    time: '10:30 AM',
    is_overdue: false,
    order_date: todaySeedStr,
    status: 'Pending',
    payment_status: 'Unpaid',
    delivery_status: 'Pending',
    items: [{ product_id: 'p1', qty: 2, scanned_qty: 0, selling_price: 350, gst_rate: 5 }],
    advance_booking: false,
    total_amount: 700,
    business_id: BIZ_ID,
    created_at: new Date().toISOString(),
    qr_code_data: '#1036'
  },
  {
    id: 'so-1002',
    order_number: '#1037',
    customer_id: 'c2',
    customer_name: 'Priyanka Joshi',
    area: 'Borivali',
    channel: 'WhatsApp Store',
    time: '11:15 AM',
    is_overdue: false,
    order_date: todaySeedStr,
    status: 'Packing',
    payment_status: 'Paid',
    delivery_status: 'Packing',
    items: [{ product_id: 'p2', qty: 3, scanned_qty: 1, selling_price: 280, gst_rate: 5 }],
    advance_booking: false,
    total_amount: 840,
    business_id: BIZ_ID,
    created_at: new Date().toISOString(),
    qr_code_data: '#1037'
  },
  {
    id: 'so-1003',
    order_number: '#1038',
    customer_id: 'c3',
    customer_name: 'Rajesh Kadam',
    area: 'Kandivali',
    channel: 'Direct Order',
    time: '01:45 PM',
    is_overdue: false,
    order_date: todaySeedStr,
    status: 'Packed',
    payment_status: 'Paid',
    delivery_status: 'Packed',
    items: [{ product_id: 'p3', qty: 1, scanned_qty: 1, selling_price: 520, gst_rate: 5 }],
    advance_booking: false,
    total_amount: 520,
    business_id: BIZ_ID,
    created_at: new Date().toISOString(),
    qr_code_data: '#1038'
  },
  {
    id: 'so-1004',
    order_number: '#1034',
    customer_id: 'c1',
    customer_name: 'Aniket Sharma',
    area: 'Dahisar',
    channel: 'Direct Order',
    time: '03:10 PM',
    is_overdue: false,
    order_date: yesterdaySeedStr,
    status: 'Dispatched',
    payment_status: 'Paid',
    delivery_status: 'Dispatched',
    items: [{ product_id: 'p1', qty: 1, scanned_qty: 1, selling_price: 350, gst_rate: 5 }],
    advance_booking: false,
    total_amount: 350,
    business_id: BIZ_ID,
    created_at: new Date().toISOString(),
    qr_code_data: '#1034'
  },
  {
    id: 'so-1005',
    order_number: '#1035',
    customer_id: 'c2',
    customer_name: 'Priyanka Joshi',
    area: 'Mira Road',
    channel: 'Phone Booking',
    time: '04:20 PM',
    is_overdue: false,
    order_date: yesterdaySeedStr,
    status: 'Delivered',
    payment_status: 'Paid',
    delivery_status: 'Delivered',
    items: [{ product_id: 'p2', qty: 2, scanned_qty: 2, selling_price: 280, gst_rate: 5 }],
    advance_booking: false,
    total_amount: 560,
    business_id: BIZ_ID,
    created_at: new Date().toISOString(),
    qr_code_data: '#1035'
  },
  {
    id: 'so-1006',
    order_number: '#1031',
    customer_id: 'c3',
    customer_name: 'Rajesh Kadam',
    area: 'Vasai',
    channel: 'Direct Order',
    time: '09:00 AM',
    is_overdue: false,
    order_date: days3SeedStr,
    status: 'Delivered',
    payment_status: 'Paid',
    delivery_status: 'Delivered',
    items: [{ product_id: 'p3', qty: 2, scanned_qty: 2, selling_price: 520, gst_rate: 5 }],
    advance_booking: false,
    total_amount: 1040,
    business_id: BIZ_ID,
    created_at: new Date().toISOString(),
    qr_code_data: '#1031'
  },
  {
    id: 'so-1007',
    order_number: '#1025',
    customer_id: 'c1',
    customer_name: 'Aniket Sharma',
    area: 'Virar',
    channel: 'WhatsApp Store',
    time: '02:00 PM',
    is_overdue: false,
    order_date: days10SeedStr,
    status: 'Delivered',
    payment_status: 'Paid',
    delivery_status: 'Delivered',
    items: [{ product_id: 'p1', qty: 4, scanned_qty: 4, selling_price: 350, gst_rate: 5 }],
    advance_booking: false,
    total_amount: 1400,
    business_id: BIZ_ID,
    created_at: new Date().toISOString(),
    qr_code_data: '#1025'
  },
  {
    id: 'so-1008',
    order_number: '#1010',
    customer_id: 'c2',
    customer_name: 'Priyanka Joshi',
    area: 'Borivali',
    channel: 'Direct Order',
    time: '11:00 AM',
    is_overdue: false,
    order_date: days40SeedStr,
    status: 'Delivered',
    payment_status: 'Paid',
    delivery_status: 'Delivered',
    items: [{ product_id: 'p2', qty: 5, scanned_qty: 5, selling_price: 280, gst_rate: 5 }],
    advance_booking: false,
    total_amount: 1400,
    business_id: BIZ_ID,
    created_at: new Date().toISOString(),
    qr_code_data: '#1010'
  }
];

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

export function isOrderInTimeHorizon(order: SalesOrder, horizon: 'today' | 'yesterday' | '7days' | '30days' | 'all'): boolean {
  if (horizon === 'all') return true;

  const rawDateStr = order.order_date || (order.created_at ? order.created_at.split('T')[0] : '');

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const date = now.getDate();

  const todayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`;

  const yesterdayDate = new Date(year, month, date - 1);
  const yesterdayStr = `${yesterdayDate.getFullYear()}-${String(yesterdayDate.getMonth() + 1).padStart(2, '0')}-${String(yesterdayDate.getDate()).padStart(2, '0')}`;

  if (!rawDateStr) {
    return horizon === 'today';
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
      messages: this.load('messages', [])
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
      messages: this.load('messages', [])
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
       messages: 'chat_messages'
    };
    
    for (const [key, table] of Object.entries(tables)) {
       try {
       let query = supabase.from(table).select('*');
       if (businessId && table !== 'businesses') {
          query = query.eq('business_id', businessId);
       } else if (businessId && table === 'businesses') {
          query = query.eq('id', businessId);
       }
       
       const { data, error } = await query;
       if (!error && data && data.length > 0) {
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
               return {
                 ...existing,
                 ...b,
                 logo_url: b.logo_url || existing?.logo_url || undefined,
                 login_cover_url: b.login_cover_url || existing?.login_cover_url || undefined,
                 upi_qr_url: b.upi_qr_url || existing?.upi_qr_url || undefined,
               };
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
    }

    // Auto-discover uploaded assets directly from Supabase Storage tenant-assets bucket
    try {
      if (this.cache.businesses && this.cache.businesses.length > 0) {
        const biz = this.cache.businesses[0];
        let assetUpdated = false;

        // Check logo
        const { data: logoFiles } = await supabase.storage.from("tenant-assets").list("logo", { limit: 1, sortBy: { column: "created_at", order: "desc" } });
        if (logoFiles && logoFiles.length > 0) {
          const { data: pUrl } = supabase.storage.from("tenant-assets").getPublicUrl(`logo/${logoFiles[0].name}`);
          if (pUrl?.publicUrl) {
            biz.logo_url = pUrl.publicUrl;
            assetUpdated = true;
          }
        }

        // Check cover
        const { data: coverFiles } = await supabase.storage.from("tenant-assets").list("cover", { limit: 1, sortBy: { column: "created_at", order: "desc" } });
        if (coverFiles && coverFiles.length > 0) {
          const { data: pUrl } = supabase.storage.from("tenant-assets").getPublicUrl(`cover/${coverFiles[0].name}`);
          if (pUrl?.publicUrl) {
            biz.login_cover_url = pUrl.publicUrl;
            assetUpdated = true;
          }
        }

        // Check upi_qr
        const { data: qrFiles } = await supabase.storage.from("tenant-assets").list("upi_qr", { limit: 1, sortBy: { column: "created_at", order: "desc" } });
        if (qrFiles && qrFiles.length > 0) {
          const { data: pUrl } = supabase.storage.from("tenant-assets").getPublicUrl(`upi_qr/${qrFiles[0].name}`);
          if (pUrl?.publicUrl) {
            biz.upi_qr_url = pUrl.publicUrl;
            assetUpdated = true;
          }
        }

        if (assetUpdated) {
          localStorage.setItem("omnipack_erp_businesses", JSON.stringify(this.cache.businesses));
        }
      }
    } catch (storageErr) {
      console.warn("Storage asset auto-discovery warning:", storageErr);
    }

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
       messages: 'chat_messages'
    };
    
    const tableName = tables[key];
    if (!tableName) return;

    if (dataItem) {
        if (Array.isArray(dataItem)) {
            dataItem.forEach((item: any) => { if (item && item.id) this.pendingUploads.add(item.id) });
        } else if (dataItem.id) {
            this.pendingUploads.add(dataItem.id);
        }
    }
    
    if (isDelete && deleteId) {
       const { error } = await supabase.from(tableName).delete().eq(tableName === 'business_settings' ? 'business_id' : 'id', deleteId);
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
       
       const cleanItem = (item) => {
           const clean = { ...item };
           if (tableName === 'business_settings') {
               delete clean.business_name;
               delete clean.gstin;
               delete clean.invoice_prefix;
           }
           if (tableName === 'customers') {
               delete clean.area;
           }
           if (tableName === 'sales_orders') {
               delete clean.area;
               if (clean.items) {
                   clean.items.forEach(i => {
                       // The table might not have 'id' if we just created the order items inline,
                       // so we should let Supabase generate it or generate one here.
                       const si = { ...i, sales_order_id: clean.id };
                       if(!si.id) si.id = crypto.randomUUID();
                       salesItems.push(si);
                   });
               }
               delete clean.items;
           }
           if (tableName === 'purchase_orders') {
               if (clean.items) {
                   clean.items.forEach(i => {
                       const pi = { ...i, purchase_order_id: clean.id };
                       if(!pi.id) pi.id = crypto.randomUUID();
                       purchaseItems.push(pi);
                   });
               }
               delete clean.items;
           }
           if (tableName === 'users_profiles') {
               delete clean.password_hash;
           }
            if (tableName === 'businesses') {
                delete clean.last_supabase_sync;
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

  public deleteCategory(id: string): boolean {
    const initialLen = this.cache.categories.length;
    this.cache.categories = this.cache.categories.filter(c => c.id !== id);
    if (this.cache.categories.length !== initialLen) {
      this.save('categories', null, true, id);
      return true;
    }
    return false;
  }

  // Product Operations
  public getProducts(businessId: string): Product[] {
    return this.cache.products.filter(p => p.business_id === businessId);
  }

  public createProduct(prod: Omit<Product, 'id' | 'created_at' | 'current_stock'>): Product {
    const newProd: Product = {
      ...prod,
      id: crypto.randomUUID(),
      current_stock: prod.opening_stock,
      created_at: new Date().toISOString()
    };
    this.cache.products.push(newProd);
    this.save('products', newProd);

    // Add stock log for opening stock
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

  public deleteProduct(id: string): boolean {
    const initialLen = this.cache.products.length;
    this.cache.products = this.cache.products.filter(p => p.id !== id);
    if (this.cache.products.length !== initialLen) {
      this.save('products', null, true, id);
      return true;
    }
    return false;
  }

  // Customer Operations
  public getCustomers(businessId: string): Customer[] {
    return this.cache.customers.filter(c => c.business_id === businessId);
  }

  public createCustomer(cust: Omit<Customer, 'id' | 'created_at' | 'outstanding_amount'>): Customer {
    const newCust: Customer = {
      ...cust,
      id: crypto.randomUUID(),
      outstanding_amount: 0,
      created_at: new Date().toISOString()
    };
    this.cache.customers.push(newCust);
    this.save('customers', newCust);
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
        const resolvedArea = s.area || cust?.area || (cust?.shipping_address ? cust.shipping_address.replace(/ Resident$/i, '').trim() : undefined) || 'Dahisar';
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
    const newSO: SalesOrder = {
      ...so,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString()
    };
    this.cache.sales.unshift(newSO);
    this.save('sales', newSO);
    return newSO;
  }

  public deleteSalesOrder(id: string): boolean {
    const index = this.cache.sales.findIndex(s => s.id === id);
    if (index !== -1) {
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

      // Handle stock out when order becomes Dispatched or Delivered
      const isDispatched = (status: OrderStatus) => status === 'Dispatched' || status === 'Delivered';
      if (!isDispatched(oldSO.status) && isDispatched(newSO.status)) {
        newSO.items.forEach(item => {
          this.addStockLog(item.product_id, -item.qty, 'Out', `Dispatch for order ${newSO.order_number}`, 'System', newSO.business_id);
        });
      }

      return newSO;
    }
    throw new Error('Sales Order not found');
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

    // Update product current stock level in memory
    const productIndex = this.cache.products.findIndex(p => p.id === productId);
    if (productIndex !== -1) {
      this.cache.products[productIndex].current_stock += changeQty;
      this.save('products', this.cache.products[productIndex]);
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
    if (deliveryDetails && deliveryDetails.partner) {
      finalPartner = deliveryDetails.partner;
      this.updateSalesOrder(orderId, {
        status: 'Dispatched',
        delivery_status: 'Dispatched',
        delivery_partner: deliveryDetails.partner,
        delivery_person_name: deliveryDetails.personName,
        delivery_person_phone: deliveryDetails.personPhone,
        tracking_number: deliveryDetails.trackingNumber,
        dispatch_notes: deliveryDetails.notes,
        dispatched_at: new Date().toISOString()
      });
    } else {
      this.updateSalesOrder(orderId, {
        status: 'Packed',
        delivery_status: 'Packed'
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
  public clearAllAndReset() {
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
      messages: []
    };
  }

  // Metrics Generator for Dashboard (isolated by business_id)
  public getDashboardMetrics(
    businessId: string, 
    timeHorizon: 'today' | 'yesterday' | '7days' | '30days' | 'all' = 'today'
  ) {
    const products = this.getProducts(businessId);
    const allOrders = this.getSalesOrders(businessId);

    // Filter orders strictly by time horizon
    const orders = allOrders.filter(o => isOrderInTimeHorizon(o, timeHorizon));

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
    const readyForDispatch = orders.filter(o => o.status === 'Packed').length;
    const deliveriesToday = orders.filter(o => o.status === 'Dispatched' || o.status === 'Delivered').length;
    const overdueOrdersCount = orders.filter(o => o.is_overdue || o.status === 'Pending').length;
    const pendingPaymentsCount = orders.filter(o => o.payment_status === 'Unpaid' || o.payment_status === 'Partial').length;
    const totalOrdersCount = orders.length;
    const outstandingAmount = orders
      .filter(o => o.payment_status === 'Unpaid' || o.payment_status === 'Partial')
      .reduce((sum, o) => sum + (o.payment_status === 'Partial' ? o.total_amount * 0.5 : o.total_amount), 0);

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
    this.cache.messages.push(newMsg);
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
