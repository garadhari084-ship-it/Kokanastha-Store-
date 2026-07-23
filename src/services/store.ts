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
  AuditLogEntry
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
    created_at: new Date().toISOString()
  }
];

// Seed profiles with email and clear password hashes
const PRE_SEEDED_PROFILES: (UserProfile & { password_hash: string })[] = [
  {
    id: 'admin_user',
    email: 'admin@admin.com',
    name: 'System Admin',
    role: 'Super Admin',
    business_id: BIZ_ID,
    active: true,
    created_at: new Date().toISOString(),
    password_hash: 'admin'
  }
];

const PRE_SEEDED_CATEGORIES: Category[] = [
  { id: 'cat-1', name: 'Festive Faral Boxes', parent_id: null, business_id: BIZ_ID, active: true, created_at: new Date().toISOString() },
  { id: 'cat-2', name: 'Savory Snacks & Chivda', parent_id: null, business_id: BIZ_ID, active: true, created_at: new Date().toISOString() },
  { id: 'cat-3', name: 'Ghee Sweets & Ladoo', parent_id: null, business_id: BIZ_ID, active: true, created_at: new Date().toISOString() }
];

const PRE_SEEDED_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    name: 'Kokanastha Special Faral Combo (1 kg)',
    sku: 'KF-CMB-01',
    barcode: '8901234500012',
    qr_code: 'KF-CMB-01-QR',
    category_id: 'cat-1',
    brand: 'Kokanastha Faral',
    unit: 'kg',
    hsn_code: '2106',
    gst_rate: 5,
    purchase_price: 450,
    selling_price: 750,
    mrp: 850,
    opening_stock: 150,
    current_stock: 84,
    minimum_stock: 20,
    maximum_stock: 300,
    image_url: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=300',
    description: 'Authentic festive assortment containing Chakli, Karanji, Besan Ladoo, Chivda & Shankarpali.',
    active: true,
    business_id: BIZ_ID,
    created_at: new Date().toISOString()
  },
  {
    id: 'prod-2',
    name: 'Crispy Poha Chivda (500g)',
    sku: 'KF-CHV-02',
    barcode: '8901234500029',
    qr_code: 'KF-CHV-02-QR',
    category_id: 'cat-2',
    brand: 'Kokanastha Faral',
    unit: 'pack',
    hsn_code: '2106',
    gst_rate: 5,
    purchase_price: 110,
    selling_price: 180,
    mrp: 200,
    opening_stock: 200,
    current_stock: 8, // Low stock demo
    minimum_stock: 15,
    maximum_stock: 400,
    image_url: 'https://images.unsplash.com/photo-1626132647523-66f5bf380027?w=300',
    description: 'Thin poha chivda fried in peanut oil with roasted nuts and curry leaves.',
    active: true,
    business_id: BIZ_ID,
    created_at: new Date().toISOString()
  },
  {
    id: 'prod-3',
    name: 'Pure Ghee Besan Ladoo (1 kg)',
    sku: 'KF-LAD-03',
    barcode: '8901234500036',
    qr_code: 'KF-LAD-03-QR',
    category_id: 'cat-3',
    brand: 'Kokanastha Faral',
    unit: 'kg',
    hsn_code: '2106',
    gst_rate: 5,
    purchase_price: 380,
    selling_price: 650,
    mrp: 700,
    opening_stock: 100,
    current_stock: 42,
    minimum_stock: 15,
    maximum_stock: 250,
    image_url: 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=300',
    description: 'Melt-in-mouth besan ladoo prepared in pure Cow Ghee with cardamom and pistachios.',
    active: true,
    business_id: BIZ_ID,
    created_at: new Date().toISOString()
  },
  {
    id: 'prod-4',
    name: 'Authentic Coconut Karanji (12 pcs)',
    sku: 'KF-KAR-04',
    barcode: '8901234500043',
    qr_code: 'KF-KAR-04-QR',
    category_id: 'cat-1',
    brand: 'Kokanastha Faral',
    unit: 'box',
    hsn_code: '2106',
    gst_rate: 5,
    purchase_price: 180,
    selling_price: 320,
    mrp: 360,
    opening_stock: 80,
    current_stock: 0, // Out of stock demo
    minimum_stock: 10,
    maximum_stock: 200,
    image_url: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=300',
    description: 'Flaky pastry stuffed with roasted grated coconut, poppy seeds and dry fruits.',
    active: true,
    business_id: BIZ_ID,
    created_at: new Date().toISOString()
  }
];

const PRE_SEEDED_CUSTOMERS: Customer[] = [
  { id: 'cust-1', name: 'Rahul Sharma', group: 'Retail', area: 'Dahisar', gstin: '', pan: '', billing_address: 'Flat 402, Sai Heights, Dahisar West', shipping_address: 'Flat 402, Sai Heights, Dahisar West', email: 'rahul.s@gmail.com', phone: '+91 98765 43210', credit_limit: 5000, outstanding_amount: 1250, business_id: BIZ_ID, active: true, created_at: new Date().toISOString() },
  { id: 'cust-2', name: 'Walk-in Customer', group: 'Retail', area: 'Borivali', gstin: '', pan: '', billing_address: 'Borivali Store Counter', shipping_address: 'Borivali Store Counter', email: 'walkin@store.com', phone: '+91 90000 00000', credit_limit: 0, outstanding_amount: 0, business_id: BIZ_ID, active: true, created_at: new Date().toISOString() },
  { id: 'cust-3', name: 'Swiggy Direct', group: 'Online Partner', area: 'Kandivali', gstin: '', pan: '', billing_address: 'Kandivali Delivery Hub', shipping_address: 'Kandivali Delivery Hub', email: 'orders@swiggy.com', phone: '+91 88888 77777', credit_limit: 50000, outstanding_amount: 420, business_id: BIZ_ID, active: true, created_at: new Date().toISOString() },
  { id: 'cust-4', name: 'Zomato Express', group: 'Online Partner', area: 'Mira Road', gstin: '', pan: '', billing_address: 'Mira Road Hub', shipping_address: 'Mira Road Hub', email: 'orders@zomato.com', phone: '+91 77777 66666', credit_limit: 50000, outstanding_amount: 950, business_id: BIZ_ID, active: true, created_at: new Date().toISOString() },
  { id: 'cust-5', name: 'Priya Mehta', group: 'Retail', area: 'Dahisar', gstin: '', pan: '', billing_address: 'B-12 Anand Nagar, Dahisar East', shipping_address: 'B-12 Anand Nagar, Dahisar East', email: 'priya.mehta@yahoo.com', phone: '+91 98211 44556', credit_limit: 10000, outstanding_amount: 1100, business_id: BIZ_ID, active: true, created_at: new Date().toISOString() },
  { id: 'cust-6', name: 'Aniket Joshi', group: 'Wholesale', area: 'Vasai', gstin: '', pan: '', billing_address: 'Sector 3, Vasai West', shipping_address: 'Sector 3, Vasai West', email: 'aniket.j@gmail.com', phone: '+91 99300 88221', credit_limit: 25000, outstanding_amount: 2400, business_id: BIZ_ID, active: true, created_at: new Date().toISOString() },
  { id: 'cust-7', name: 'Sneha Kulkarni', group: 'Retail', area: 'Virar', gstin: '', pan: '', billing_address: 'Gokul Dham, Virar West', shipping_address: 'Gokul Dham, Virar West', email: 'sneha.k@gmail.com', phone: '+91 98199 33221', credit_limit: 5000, outstanding_amount: 3100, business_id: BIZ_ID, active: true, created_at: new Date().toISOString() }
];

const PRE_SEEDED_SUPPLIERS: Supplier[] = [
  { id: 'sup-1', name: 'Konkan Agro Spices & Ghee', gstin: '27XYZ1234P1Z2', phone: '+91 98201 11223', email: 'sales@konkanagro.com', address: 'APMC Market, Vashi', outstanding_amount: 12500, business_id: BIZ_ID, created_at: new Date().toISOString() }
];

const PRE_SEEDED_PURCHASES: PurchaseOrder[] = [];

const todayDate = new Date().toISOString().split('T')[0];

const PRE_SEEDED_SALES: SalesOrder[] = [
  {
    id: 'so-1024',
    order_number: '#1024',
    customer_id: 'cust-1',
    customer_name: 'Rahul Sharma',
    area: 'Dahisar',
    channel: 'Direct Order',
    time: '10:15 AM',
    is_overdue: false,
    order_date: todayDate,
    status: 'Dispatched',
    payment_status: 'Unpaid',
    delivery_status: 'Dispatched',
    items: [{ product_id: 'prod-1', qty: 1, scanned_qty: 1, selling_price: 750, gst_rate: 5 }, { product_id: 'prod-2', qty: 2, scanned_qty: 2, selling_price: 250, gst_rate: 5 }],
    advance_booking: true,
    total_amount: 1250,
    business_id: BIZ_ID,
    created_at: new Date().toISOString(),
    qr_code_data: '#1024'
  },
  {
    id: 'so-1025',
    order_number: '#1025',
    customer_id: 'cust-2',
    customer_name: 'Walk-in Customer',
    area: 'Borivali',
    channel: 'Store Counter',
    time: '09:45 AM',
    is_overdue: false,
    order_date: todayDate,
    status: 'Dispatched',
    payment_status: 'Paid',
    delivery_status: 'Dispatched',
    items: [{ product_id: 'prod-2', qty: 1, scanned_qty: 1, selling_price: 180, gst_rate: 5 }],
    advance_booking: false,
    total_amount: 180,
    business_id: BIZ_ID,
    created_at: new Date(Date.now() - 15 * 60000).toISOString(),
    qr_code_data: '#1025'
  },
  {
    id: 'so-1026',
    order_number: '#1026',
    customer_id: 'cust-3',
    customer_name: 'Swiggy Direct',
    area: 'Kandivali',
    channel: 'Swiggy',
    time: '09:30 AM',
    is_overdue: false,
    order_date: todayDate,
    status: 'Packing',
    payment_status: 'Partial',
    delivery_status: 'Packing',
    items: [{ product_id: 'prod-2', qty: 2, scanned_qty: 1, selling_price: 180, gst_rate: 5 }],
    advance_booking: false,
    total_amount: 420,
    business_id: BIZ_ID,
    created_at: new Date(Date.now() - 30 * 60000).toISOString(),
    qr_code_data: '#1026'
  },
  {
    id: 'so-1027',
    order_number: '#1027',
    customer_id: 'cust-4',
    customer_name: 'Zomato Express',
    area: 'Mira Road',
    channel: 'Zomato',
    time: '09:10 AM',
    is_overdue: false,
    order_date: todayDate,
    status: 'Pending',
    payment_status: 'Unpaid',
    delivery_status: 'Pending',
    items: [{ product_id: 'prod-1', qty: 1, scanned_qty: 0, selling_price: 750, gst_rate: 5 }, { product_id: 'prod-2', qty: 1, scanned_qty: 0, selling_price: 200, gst_rate: 5 }],
    advance_booking: false,
    total_amount: 950,
    business_id: BIZ_ID,
    created_at: new Date(Date.now() - 50 * 60000).toISOString(),
    qr_code_data: '#1027'
  },
  {
    id: 'so-1028',
    order_number: '#1028',
    customer_id: 'cust-5',
    customer_name: 'Priya Mehta',
    area: 'Dahisar',
    channel: 'Phone Order',
    time: '08:50 AM',
    is_overdue: true,
    order_date: todayDate,
    status: 'Pending',
    payment_status: 'Unpaid',
    delivery_status: 'Pending',
    items: [{ product_id: 'prod-3', qty: 1, scanned_qty: 0, selling_price: 650, gst_rate: 5 }, { product_id: 'prod-1', qty: 1, scanned_qty: 0, selling_price: 450, gst_rate: 5 }],
    advance_booking: true,
    total_amount: 1100,
    business_id: BIZ_ID,
    created_at: new Date(Date.now() - 70 * 60000).toISOString(),
    qr_code_data: '#1028'
  },
  {
    id: 'so-1029',
    order_number: '#1029',
    customer_id: 'cust-6',
    customer_name: 'Aniket Joshi',
    area: 'Vasai',
    channel: 'Direct Order',
    time: '08:30 AM',
    is_overdue: false,
    order_date: todayDate,
    status: 'Packing',
    payment_status: 'Partial',
    delivery_status: 'Packing',
    items: [{ product_id: 'prod-3', qty: 3, scanned_qty: 2, selling_price: 650, gst_rate: 5 }],
    advance_booking: true,
    total_amount: 2400,
    business_id: BIZ_ID,
    created_at: new Date(Date.now() - 90 * 60000).toISOString(),
    qr_code_data: '#1029'
  },
  {
    id: 'so-1030',
    order_number: '#1030',
    customer_id: 'cust-7',
    customer_name: 'Sneha Kulkarni',
    area: 'Virar',
    channel: 'Direct Order',
    time: '08:15 AM',
    is_overdue: true,
    order_date: todayDate,
    status: 'Packing',
    payment_status: 'Unpaid',
    delivery_status: 'Packing',
    items: [{ product_id: 'prod-1', qty: 3, scanned_qty: 1, selling_price: 750, gst_rate: 5 }],
    advance_booking: false,
    total_amount: 3100,
    business_id: BIZ_ID,
    created_at: new Date(Date.now() - 110 * 60000).toISOString(),
    qr_code_data: '#1030'
  },
  {
    id: 'so-1031',
    order_number: '#1031',
    customer_id: 'cust-2',
    customer_name: 'Vijay Patil',
    area: 'Borivali',
    channel: 'Walk-in',
    time: '08:00 AM',
    is_overdue: false,
    order_date: todayDate,
    status: 'Packed',
    payment_status: 'Paid',
    delivery_status: 'Packed',
    items: [{ product_id: 'prod-3', qty: 2, scanned_qty: 2, selling_price: 650, gst_rate: 5 }],
    advance_booking: false,
    total_amount: 1850,
    business_id: BIZ_ID,
    created_at: new Date(Date.now() - 130 * 60000).toISOString(),
    qr_code_data: '#1031'
  },
  {
    id: 'so-1032',
    order_number: '#1032',
    customer_id: 'cust-5',
    customer_name: 'Sunita Deshmukh',
    area: 'Dahisar',
    channel: 'Phone Order',
    time: '07:45 AM',
    is_overdue: false,
    order_date: todayDate,
    status: 'Packing',
    payment_status: 'Partial',
    delivery_status: 'Packing',
    items: [{ product_id: 'prod-1', qty: 4, scanned_qty: 2, selling_price: 750, gst_rate: 5 }],
    advance_booking: true,
    total_amount: 4200,
    business_id: BIZ_ID,
    created_at: new Date(Date.now() - 150 * 60000).toISOString(),
    qr_code_data: '#1032'
  },
  {
    id: 'so-1033',
    order_number: '#1033',
    customer_id: 'cust-1',
    customer_name: 'Vikram Shinde',
    area: 'Kandivali',
    channel: 'Direct Order',
    time: '07:30 AM',
    is_overdue: false,
    order_date: todayDate,
    status: 'Delivered',
    payment_status: 'Paid',
    delivery_status: 'Delivered',
    items: [{ product_id: 'prod-3', qty: 2, scanned_qty: 2, selling_price: 650, gst_rate: 5 }],
    advance_booking: false,
    total_amount: 2150,
    business_id: BIZ_ID,
    created_at: new Date(Date.now() - 170 * 60000).toISOString(),
    qr_code_data: '#1033'
  },
  {
    id: 'so-1034',
    order_number: '#1034',
    customer_id: 'cust-1',
    customer_name: 'Rajesh More',
    area: 'Dahisar',
    channel: 'Direct Order',
    time: '07:10 AM',
    is_overdue: false,
    order_date: todayDate,
    status: 'Packing',
    payment_status: 'Unpaid',
    delivery_status: 'Packing',
    items: [{ product_id: 'prod-1', qty: 5, scanned_qty: 2, selling_price: 750, gst_rate: 5 }],
    advance_booking: true,
    total_amount: 5600,
    business_id: BIZ_ID,
    created_at: new Date(Date.now() - 190 * 60000).toISOString(),
    qr_code_data: '#1034'
  },
  {
    id: 'so-1035',
    order_number: '#1035',
    customer_id: 'cust-4',
    customer_name: 'Amit Sawant',
    area: 'Mira Road',
    channel: 'Direct Order',
    time: '06:50 AM',
    is_overdue: true,
    order_date: todayDate,
    status: 'Packing',
    payment_status: 'Unpaid',
    delivery_status: 'Packing',
    items: [{ product_id: 'prod-1', qty: 3, scanned_qty: 1, selling_price: 750, gst_rate: 5 }],
    advance_booking: true,
    total_amount: 3200,
    business_id: BIZ_ID,
    created_at: new Date(Date.now() - 210 * 60000).toISOString(),
    qr_code_data: '#1035'
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

// ====================================================================
// STORAGE STATE CLASS (LOCALSTORAGE BACKED)
// ====================================================================

class ERPStorage {
  private cache: {
    businesses: Business[];
    profiles: (UserProfile & { password_hash: string })[];
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
  };

  constructor() {
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
      packingSessions: this.load('packingSessions', [])
    };
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

  private save(key: keyof typeof this.cache) {
    try {
      localStorage.setItem(`omnipack_erp_${key}`, JSON.stringify(this.cache[key]));
    } catch (e) {
      console.error(`Error saving state for key ${key}`, e);
    }
  }

  // Auth Operations
  public login(email: string, password_raw: string): { success: boolean; user?: UserProfile; business?: Business; error?: string } {
    const profile = this.cache.profiles.find(p => p.email.toLowerCase() === email.trim().toLowerCase());
    if (!profile) {
      return { success: false, error: 'User account not found.' };
    }
    if (!profile.active) {
      return { success: false, error: 'This user account is suspended.' };
    }
    if (profile.password_hash !== password_raw) {
      return { success: false, error: 'Incorrect password.' };
    }
    const business = this.cache.businesses.find(b => b.id === profile.business_id);
    
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
      this.save('businesses');
      return this.cache.businesses[index];
    }
    throw new Error('Business not found');
  }

  // Profiles (Super Admin can create)
  public getUsers(businessId: string): UserProfile[] {
    return this.cache.profiles.filter(u => u.business_id === businessId);
  }

  public createUser(user: Omit<UserProfile, 'id' | 'created_at'> & { id?: string; password_hash: string }): UserProfile {
    if (user.id) {
      const existing = this.cache.profiles.find(p => p.id === user.id);
      if (existing) {
        return existing;
      }
    }

    const newProfile: UserProfile & { password_hash: string } = {
      ...user,
      id: user.id || `u-${Math.random().toString(36).substr(2, 9)}`,
      created_at: new Date().toISOString()
    };
    this.cache.profiles.push(newProfile);
    this.save('profiles');
    return newProfile;
  }

  public updateUser(id: string, updates: Partial<UserProfile>): UserProfile {
    const index = this.cache.profiles.findIndex(p => p.id === id);
    if (index !== -1) {
      this.cache.profiles[index] = { ...this.cache.profiles[index], ...updates };
      this.save('profiles');
      return this.cache.profiles[index];
    }
    throw new Error('User not found');
  }

  // Category Operations
  public getCategories(businessId: string): Category[] {
    return this.cache.categories.filter(c => c.business_id === businessId);
  }

  public createCategory(cat: Omit<Category, 'id' | 'created_at'>): Category {
    const newCat: Category = {
      ...cat,
      id: `cat-${Math.random().toString(36).substr(2, 9)}`,
      created_at: new Date().toISOString()
    };
    this.cache.categories.push(newCat);
    this.save('categories');
    return newCat;
  }

  public updateCategory(id: string, updates: Partial<Category>): Category {
    const index = this.cache.categories.findIndex(c => c.id === id);
    if (index !== -1) {
      this.cache.categories[index] = { ...this.cache.categories[index], ...updates };
      this.save('categories');
      return this.cache.categories[index];
    }
    throw new Error('Category not found');
  }

  public deleteCategory(id: string): boolean {
    const initialLen = this.cache.categories.length;
    this.cache.categories = this.cache.categories.filter(c => c.id !== id);
    if (this.cache.categories.length !== initialLen) {
      this.save('categories');
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
      id: `p-${Math.random().toString(36).substr(2, 9)}`,
      current_stock: prod.opening_stock,
      created_at: new Date().toISOString()
    };
    this.cache.products.push(newProd);
    this.save('products');

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
      this.save('products');
      return this.cache.products[index];
    }
    throw new Error('Product not found');
  }

  public deleteProduct(id: string): boolean {
    const initialLen = this.cache.products.length;
    this.cache.products = this.cache.products.filter(p => p.id !== id);
    if (this.cache.products.length !== initialLen) {
      this.save('products');
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
      id: `cust-${Math.random().toString(36).substr(2, 9)}`,
      outstanding_amount: 0,
      created_at: new Date().toISOString()
    };
    this.cache.customers.push(newCust);
    this.save('customers');
    return newCust;
  }

  public updateCustomer(id: string, updates: Partial<Customer>): Customer {
    const index = this.cache.customers.findIndex(c => c.id === id);
    if (index !== -1) {
      this.cache.customers[index] = { ...this.cache.customers[index], ...updates };
      this.save('customers');
      return this.cache.customers[index];
    }
    throw new Error('Customer not found');
  }

  public deleteCustomer(id: string): boolean {
    const initialLen = this.cache.customers.length;
    this.cache.customers = this.cache.customers.filter(c => c.id !== id);
    if (this.cache.customers.length !== initialLen) {
      this.save('customers');
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
      id: `sup-${Math.random().toString(36).substr(2, 9)}`,
      outstanding_amount: 0,
      created_at: new Date().toISOString()
    };
    this.cache.suppliers.push(newSup);
    this.save('suppliers');
    return newSup;
  }

  public updateSupplier(id: string, updates: Partial<Supplier>): Supplier {
    const index = this.cache.suppliers.findIndex(s => s.id === id);
    if (index !== -1) {
      this.cache.suppliers[index] = { ...this.cache.suppliers[index], ...updates };
      this.save('suppliers');
      return this.cache.suppliers[index];
    }
    throw new Error('Supplier not found');
  }

  public deleteSupplier(id: string): boolean {
    const initialLen = this.cache.suppliers.length;
    this.cache.suppliers = this.cache.suppliers.filter(s => s.id !== id);
    if (this.cache.suppliers.length !== initialLen) {
      this.save('suppliers');
      return true;
    }
    return false;
  }

  // Purchase Order Operations
  public getPurchaseOrders(businessId: string): PurchaseOrder[] {
    return this.cache.purchases.filter(p => p.business_id === businessId);
  }

  public createPurchaseOrder(po: Omit<PurchaseOrder, 'id' | 'created_at'>): PurchaseOrder {
    const newPO: PurchaseOrder = {
      ...po,
      id: `po-${Math.random().toString(36).substr(2, 9)}`,
      created_at: new Date().toISOString()
    };
    this.cache.purchases.push(newPO);
    this.save('purchases');

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
      this.save('purchases');

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
    return this.cache.sales.filter(s => s.business_id === businessId);
  }

  public createSalesOrder(so: Omit<SalesOrder, 'id' | 'created_at'>): SalesOrder {
    const newSO: SalesOrder = {
      ...so,
      id: `so-${Math.random().toString(36).substr(2, 9)}`,
      created_at: new Date().toISOString()
    };
    this.cache.sales.push(newSO);
    this.save('sales');
    return newSO;
  }

  public updateSalesOrder(id: string, updates: Partial<SalesOrder>): SalesOrder {
    const index = this.cache.sales.findIndex(s => s.id === id);
    if (index !== -1) {
      const oldSO = this.cache.sales[index];
      const newSO = { ...oldSO, ...updates };
      this.cache.sales[index] = newSO;
      this.save('sales');

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
      id: `sl-${Math.random().toString(36).substr(2, 9)}`,
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
      this.save('products');
    }

    this.cache.stockLogs.push(newLog);
    this.save('stockLogs');
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

    // Find the product matching the scanned barcode in the business scope
    const product = this.cache.products.find(p => p.business_id === businessId && p.barcode === barcode);
    if (!product) {
      return {
        success: false,
        error_type: 'wrong_product',
        error_message: 'Wrong Barcode! Product does not exist in the database.'
      };
    }

    // Verify if product belongs to this order
    const orderItemIndex = order.items.findIndex(item => item.product_id === product.id);
    if (orderItemIndex === -1) {
      return {
        success: false,
        product,
        error_type: 'wrong_product',
        error_message: `Wrong Product! "${product.name}" is not part of this order.`
      };
    }

    const item = order.items[orderItemIndex];

    // Verify extra product or quantity overflow
    if (item.scanned_qty >= item.qty) {
      return {
        success: false,
        product,
        error_type: 'extra_product',
        error_message: `Extra item scanned! "${product.name}" already has 100% verified quantity (${item.qty}/${item.qty}).`
      };
    }

    // Increment scanned count
    item.scanned_qty += 1;
    this.save('sales');

    const remaining = item.qty - item.scanned_qty;

    return {
      success: true,
      product,
      scanned_qty: item.scanned_qty,
      required_qty: item.qty,
      remaining_qty: remaining
    };
  }

  public completePackingSession(
    businessId: string,
    orderId: string,
    staffId: string,
    staffName: string,
    totalScans: number,
    auditLogs: AuditLogEntry[]
  ): { success: boolean; order?: SalesOrder; error?: string } {
    const orderIndex = this.cache.sales.findIndex(o => o.id === orderId && o.business_id === businessId);
    if (orderIndex === -1) {
      return { success: false, error: 'Sales Order not found' };
    }

    const order = this.cache.sales[orderIndex];

    // Double check if all items are 100% verified
    const allVerified = order.items.every(item => item.scanned_qty === item.qty);
    if (!allVerified) {
      return { success: false, error: 'Cannot complete packing! Some items have missing/insufficient scans.' };
    }

    // Record packing session log
    const session: PackingSession = {
      id: `ps-${Math.random().toString(36).substr(2, 9)}`,
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
    this.save('packingSessions');

    // Update order status to "Packed" and delivery status to "Packed"
    order.status = 'Packed';
    order.delivery_status = 'Packed';
    this.save('sales');

    // Log to system audit trail
    this.logActivity(
      staffId,
      staffName,
      'Packing Staff',
      'Complete Packing',
      `Successfully completed packing & verification check for order ${order.order_number}. Total items: ${order.items.reduce((acc, it) => acc + it.qty, 0)}`,
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
      id: `sal-${Math.random().toString(36).substr(2, 9)}`,
      user_id: userId,
      user_name: userName,
      user_role: userRole,
      action,
      details,
      created_at: new Date().toISOString(),
      business_id: businessId
    };
    this.cache.auditLogs.unshift(newLog); // newer logs first
    this.save('auditLogs');
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
      this.save('settings');
    }
    return setting;
  }

  public updateSettings(businessId: string, updates: Partial<BusinessSettings>): BusinessSettings {
    const index = this.cache.settings.findIndex(s => s.business_id === businessId);
    if (index !== -1) {
      this.cache.settings[index] = { ...this.cache.settings[index], ...updates };
      this.save('settings');
      return this.cache.settings[index];
    } else {
      const current = this.getSettings(businessId);
      const merged = { ...current, ...updates };
      this.cache.settings.push(merged);
      this.save('settings');
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
      packingSessions: []
    };
  }

  // Metrics Generator for Dashboard (isolated by business_id)
  public getDashboardMetrics(businessId: string) {
    const todayStr = new Date().toISOString().split('T')[0];
    const products = this.getProducts(businessId);
    const orders = this.getSalesOrders(businessId);

    // Filter today's orders
    const todayOrders = orders.filter(o => o.order_date === todayStr);
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
    const toPackToday = orders.filter(o => o.status === 'Pending' || o.status === 'Packing').length;
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
          .filter(o => o.status !== 'Cancelled')
          .flatMap(o => o.items)
          .filter(item => item.product_id === p.id)
          .reduce((sum, item) => sum + item.qty, 0);
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
      todayOrders: todayOrders.length,
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
}

export const dbStore = new ERPStorage();
