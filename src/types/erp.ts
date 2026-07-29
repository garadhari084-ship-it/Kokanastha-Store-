export type UserRole = 'Super Admin' | 'Admin' | 'Manager' | 'Packing Staff' | 'Sales Staff' | 'Viewer';

export interface Business {
  id: string;
  name: string;
  gstin: string;
  pan: string;
  billing_address: string;
  shipping_address: string;
  email: string;
  phone: string;
  invoice_prefix: string;
  festive_invoice_prefix?: string;
  tax_rate_default: number;
  created_at: string;
  logo_url?: string;
  login_cover_url?: string;
  currency_symbol?: string;
  currency_default?: string;
  auto_backup?: boolean;
  low_stock_threshold?: number;
  audit_retention_days?: number;
  default_theme?: string;
  enable_auto_whatsapp?: boolean;
  enable_auto_sms?: boolean;
  default_dispatch_zone?: string;
  area_zones?: string[];
  last_supabase_sync?: string;
  upi_id?: string;
  upi_qr_url?: string;
  bank_name?: string;
  account_number?: string;
  ifsc_code?: string;
  account_holder?: string;
  whatsapp_api_key?: string;
  whatsapp_template?: string;
  sms_gateway_url?: string;
  google_maps_key?: string;
  loyalty_config?: LoyaltyConfig;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  business_id: string;
  active: boolean;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  parent_id: string | null;
  business_id: string;
  active: boolean;
  created_at: string;
}

export interface ComboItem {
  product_id: string;
  qty: number;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  barcode: string; // unique scan barcode
  qr_code: string; // custom qr contents or auto-generated
  category_id: string;
  brand: string;
  unit: string;
  hsn_code: string;
  gst_rate: number; // e.g., 18 for 18%
  purchase_price: number;
  selling_price: number;
  mrp: number;
  opening_stock: number;
  current_stock: number;
  minimum_stock: number;
  maximum_stock: number;
  image_url: string;
  description: string;
  active: boolean;
  business_id: string;
  created_at: string;
  
  // Combo Box / Product Bundle attributes
  is_combo?: boolean;
  combo_items?: ComboItem[];
}

export interface ComboHistoryLog {
  id: string;
  business_id: string;
  combo_id: string;
  combo_name: string;
  action: 'Created' | 'Updated' | 'Packed' | 'Unpacked' | 'Virtual Sale' | 'Packed Sale' | 'Auto-Broken';
  qty: number;
  performed_by: string;
  details: string;
  created_at: string;
}

export interface Customer {
  id: string;
  name: string;
  group: string; // e.g. 'Retail', 'Wholesale', 'Distributor'
  area?: string; // e.g. 'Dahisar', 'Borivali', 'Kandivali', 'Mira Road', 'Vasai', 'Virar'
  gstin: string;
  pan: string;
  billing_address: string;
  shipping_address: string;
  email: string;
  phone: string;
  credit_limit: number;
  outstanding_amount: number;
  loyalty_points?: number;
  lifetime_spend?: number;
  loyalty_tier?: 'Silver' | 'Gold' | 'Platinum';
  birthday?: string;
  anniversary?: string;
  business_id: string;
  active: boolean;
  created_at: string;
}

export interface Supplier {
  id: string;
  name: string;
  gstin: string;
  phone: string;
  email: string;
  address: string;
  outstanding_amount: number;
  business_id: string;
  created_at: string;
}

export interface PurchaseItem {
  product_id: string;
  qty: number;
  received_qty: number;
  purchase_price: number;
  gst_rate: number;
}

export interface PaymentRecord {
  id: string;
  order_id: string;
  order_number: string;
  type: 'Sales' | 'Purchase';
  amount: number;
  payment_mode: string;
  reference_no?: string;
  bank_account?: string;
  payment_date: string;
  notes?: string;
  receipt_number: string;
  collected_by: string;
  business_id: string;
  created_at: string;
}

export interface PurchaseOrder {
  id: string;
  order_number: string;
  supplier_id: string;
  order_date: string;
  delivery_date: string;
  status: 'Draft' | 'Ordered' | 'Received' | 'Cancelled';
  payment_status: 'Unpaid' | 'Partial' | 'Paid';
  paid_amount?: number;
  payment_mode?: 'Cash' | 'UPI' | 'Bank Transfer' | 'Cheque' | 'Credit Card' | 'Other' | string;
  payment_reference?: string;
  payment_bank?: string;
  payment_notes?: string;
  payment_date?: string;
  payment_history?: PaymentRecord[];
  items: PurchaseItem[];
  total_amount: number;
  business_id: string;
  created_at: string;
}

export interface SalesItem {
  product_id: string;
  qty: number;
  scanned_qty: number; // for packing verification
  selling_price: number;
  gst_rate: number;
}

export type OrderStatus = 'Pending' | 'Packing' | 'Packed' | 'Dispatched' | 'Delivered' | 'Cancelled' | 'Returned';

export interface SalesOrder {
  id: string;
  order_number: string;
  customer_id: string;
  customer_name?: string;
  area?: string; // Dahisar, Borivali, Kandivali, Mira Road, Vasai, Virar, Other
  channel?: string; // Walk-in, Direct, Swiggy, Zomato, Phone Order
  time?: string; // e.g. '10:15 AM'
  is_overdue?: boolean;
  order_date: string;
  delivery_date?: string;
  status: OrderStatus;
  payment_status: 'Unpaid' | 'Partial' | 'Paid';
  payment_mode?: 'Cash' | 'UPI / QR' | 'Card' | 'Bank Transfer' | 'Credit / On Account' | string;
  paid_amount?: number;
  payment_reference?: string;
  payment_bank?: string;
  payment_notes?: string;
  payment_date?: string;
  payment_history?: PaymentRecord[];
  delivery_status: OrderStatus;
  items: SalesItem[];
  advance_booking: boolean;
  festive_booking?: boolean;
  total_amount: number;
  is_updated?: boolean;
  business_id: string;
  created_at: string;
  qr_code_data: string; // Custom string packing verification scan
  delivery_partner?: string; // Rapido, Dunzo, Courier, In-House, etc.
  delivery_person_name?: string;
  delivery_person_phone?: string;
  tracking_number?: string;
  dispatch_notes?: string;
  dispatched_at?: string;
  packing_started_at?: string;
  packing_completed_at?: string;
  rack_location?: string;
  rack_section?: string;
  points_earned?: number;
  points_redeemed?: number;
  loyalty_discount?: number;
  subscription_id?: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  barcode: string;
  success: boolean;
  message: string;
}

export interface PackingSession {
  id: string;
  order_id: string;
  packing_staff_id: string;
  start_time: string;
  end_time: string | null;
  total_scans: number;
  status: 'Packing' | 'Packed' | 'Failed';
  logs: AuditLogEntry[];
  business_id: string;
}

export interface StockLog {
  id: string;
  product_id: string;
  change_qty: number;
  type: 'In' | 'Out' | 'Adjusted' | 'Transfer' | 'Damage' | 'Return';
  notes: string;
  created_by: string;
  created_at: string;
  business_id: string;
}

export interface SystemAuditLog {
  id: string;
  user_id: string;
  user_name: string;
  user_role: string;
  action: string; // e.g. 'Login', 'Create Customer', 'Scan Barcode', 'Complete Packing'
  details: string;
  created_at: string;
  business_id: string;
}

export interface ChatMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  is_read: boolean;
  business_id: string;
}

export interface BusinessSettings {
  business_id: string;
  business_name: string;
  gstin: string;
  invoice_prefix: string;
  low_stock_limit: number;
  barcode_format: 'EAN-13' | 'CODE-128';
  qr_size: number;
  enable_email_alerts: boolean;
  enable_sms_alerts: boolean;
  theme: 'light' | 'dark';
}

// ==================== LOYALTY PROGRAM TYPES ====================
export type LoyaltyTier = 'Silver' | 'Gold' | 'Platinum';

export interface LoyaltyConfig {
  enabled: boolean;
  spend_per_point: number; // e.g., 100 => 1 point per ₹100 spent
  point_value: number; // e.g., 1 => 1 point = ₹1 discount
  silver_min_spend: number; // 0
  gold_min_spend: number; // 5000
  platinum_min_spend: number; // 20000
  gold_multiplier: number; // 1.25
  platinum_multiplier: number; // 1.5
  welcome_bonus_points: number; // 50
  birthday_bonus_points: number; // 100
  point_expiry_days: number; // 365
}

export interface LoyaltyLog {
  id: string;
  customer_id: string;
  type: 'Earned' | 'Redeemed' | 'Bonus' | 'Expired' | 'Adjusted';
  points: number;
  amount_spent?: number;
  order_id?: string;
  notes: string;
  created_at: string;
  business_id: string;
}

// ==================== SUBSCRIPTION MANAGEMENT TYPES ====================
export type SubscriptionFrequency = 'Weekly' | 'Bi-Weekly' | 'Monthly' | 'Quarterly';
export type SubscriptionStatus = 'Active' | 'Paused' | 'Cancelled';

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  frequency: SubscriptionFrequency;
  price: number;
  items: SalesItem[];
  active: boolean;
  business_id: string;
}

export interface CustomerSubscription {
  id: string;
  subscription_number: string;
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  plan_name: string;
  frequency: SubscriptionFrequency;
  status: SubscriptionStatus;
  items: SalesItem[];
  total_amount: number;
  delivery_area: string;
  delivery_address: string;
  next_billing_date: string;
  last_order_date?: string;
  last_order_id?: string;
  auto_renew: boolean;
  notes?: string;
  business_id: string;
  created_at: string;
}

export const DEFAULT_LOYALTY_CONFIG: LoyaltyConfig = {
  enabled: true,
  spend_per_point: 100,
  point_value: 1,
  silver_min_spend: 0,
  gold_min_spend: 10000,
  platinum_min_spend: 20000,
  gold_multiplier: 1.25,
  platinum_multiplier: 1.5,
  welcome_bonus_points: 50,
  birthday_bonus_points: 100,
  point_expiry_days: 365
};

