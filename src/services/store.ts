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

const PRE_SEEDED_PRODUCTS: Product[] = [];

const PRE_SEEDED_CUSTOMERS: Customer[] = [];

const PRE_SEEDED_SUPPLIERS: Supplier[] = [];

const PRE_SEEDED_PURCHASES: PurchaseOrder[] = [];

const todayDate = new Date().toISOString().split('T')[0];

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
       settings: 'business_settings'
    };
    
    for (const [key, table] of Object.entries(tables)) {
       let query = supabase.from(table).select('*');
       if (businessId && table !== 'businesses') {
          query = query.eq('business_id', businessId);
       } else if (businessId && table === 'businesses') {
          query = query.eq('id', businessId);
       }
       
       const { data, error } = await query;
       if (!error && data && data.length > 0) {
          (this.cache as any)[key] = data;
          localStorage.setItem(`omnipack_erp_${key}`, JSON.stringify(data));
       }
    }
  }

  private async syncToSupabase(key: keyof typeof this.cache, dataItem: any, isDelete = false, deleteId?: string) {
    if (!isSupabaseConfigured || !supabase) return;
    
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
       settings: 'business_settings'
    };
    
    const tableName = tables[key];
    if (!tableName) return;

    if (isDelete && deleteId) {
       const { error } = await supabase.from(tableName).delete().eq(tableName === 'business_settings' ? 'business_id' : 'id', deleteId);
       if (error) {
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
           if (tableName === 'sales_orders') {
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
           return clean;
       };
       
       if (Array.isArray(payload)) {
           payload = payload.map(cleanItem);
       } else {
           payload = cleanItem(payload);
       }

       const { error } = await supabase.from(tableName).upsert(payload);
       if (error) {
         console.error(`Supabase sync error on ${tableName}:`, JSON.stringify(error));
         return error;
       }
       
       if (tableName === 'sales_orders' && salesItems.length > 0) {
           const { error: err2 } = await supabase.from('sales_order_items').upsert(salesItems);
           if (err2) console.error('Supabase sync error on sales_order_items:', JSON.stringify(err2));
       }
       
       if (tableName === 'purchase_orders' && purchaseItems.length > 0) {
           const { error: err3 } = await supabase.from('purchase_order_items').upsert(purchaseItems);
           if (err3) console.error('Supabase sync error on purchase_order_items:', JSON.stringify(err3));
       }
    }
  }

  private save(key: keyof typeof this.cache, dataItem?: any, isDelete = false, deleteId?: string) {
    this.syncToSupabase(key, dataItem, isDelete, deleteId);
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
      this.save('businesses', this.cache.businesses.find(b => b.id === id));
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
      id: user.id || crypto.randomUUID(),
      created_at: new Date().toISOString()
    };
    this.cache.profiles.push(newProfile);
    this.save('profiles', newProfile);
    return newProfile;
  }

  public updateUser(id: string, updates: Partial<UserProfile>): UserProfile {
    const index = this.cache.profiles.findIndex(p => p.id === id);
    if (index !== -1) {
      this.cache.profiles[index] = { ...this.cache.profiles[index], ...updates };
      this.save('profiles', this.cache.profiles[index]);
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
      this.save('categories');
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
      this.save('products');
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
      this.save('customers');
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
      this.save('suppliers');
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
    return this.cache.purchases.filter(p => p.business_id === businessId);
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
      id: crypto.randomUUID(),
      created_at: new Date().toISOString()
    };
    this.cache.sales.push(newSO);
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
      this.save('settings', this.cache.settings.find(s => s.business_id === businessId));
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
