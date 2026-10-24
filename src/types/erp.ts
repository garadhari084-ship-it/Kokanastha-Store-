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
  advance_invoice_prefix?: string;
  festive_invoice_prefix?: string;
  festive_advance_invoice_prefix?: string;
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
  enable_ddr?: boolean;
  ddr_start_date?: string;
  ddr_end_date?: string;
  default_dispatch_zone?: string;
  area_zones?: string[];
  last_supabase_sync?: string;
  upi_id?: string;
  upi_qr_url?: string;
  bank_name?: string;
  account_number?: string;
  ifsc_code?: string;
  account_holder?: string;
  fssai_number?: string;
  mobile_number?: string;
  whatsapp_api_key?: string;
  whatsapp_template?: string;
  sms_gateway_url?: string;
  google_maps_key?: string;
  loyalty_config?: LoyaltyConfig;
  mfg_address?: string;
  barcode_phone?: string;
  barcode_address?: string;
  barcode_fssai?: string;
  barcode_ingredients?: string;
  barcode_company_name?: string;
  barcode_show_company?: boolean;
  barcode_label_size?: string;
  barcode_other_info?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  business_id: string;
  active: boolean;
  created_at: string;
  allowed_pages?: string[];
  session_token?: string;
}

export interface ActiveDeviceSession {
  userId: string;
  deviceId: string;
  sessionToken: string;
  lastHeartbeat: number;
  businessId?: string;
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

export interface NutritionFacts {
  serving_size?: string;
  servings_per_container?: string;
  energy_kcal?: number;
  protein_g?: number;
  carbohydrates_g?: number;
  total_sugars_g?: number;
  added_sugars_g?: number;
  total_fat_g?: number;
  saturated_fat_g?: number;
  trans_fat_g?: number;
  cholesterol_mg?: number;
  sodium_mg?: number;
  dietary_fiber_g?: number;
  calcium_mg?: number;
  iron_mg?: number;
}

export interface FoodPackagingInfo {
  dietary_type?: 'veg' | 'non_veg' | 'vegan' | 'egg';
  ingredients?: string;
  allergen_info?: string;
  fssai_license?: string;
  net_weight?: string;
  batch_no?: string;
  mfg_date?: string;
  shelf_life_days?: number;
  best_before_text?: string;
  storage_instructions?: string;
  mfg_by?: string;
  mkt_by?: string;
  customer_care?: string;
  customer_care_phone?: string;
  created_by?: string;
  created_at?: string;
  business_id?: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  barcode: string;
  category_id: string;
  category_name?: string;
  unit: string;
  selling_unit?: string;
  purchase_price: number;
  selling_price: number;
  min_price?: number;
  mrp?: number;
  gst_rate: number;
  hsn_code: string;
  stock_quantity?: number;
  current_stock?: number;
  opening_stock?: number;
  auto_conversion?: boolean;
  pack_size?: number;
  purchase_unit?: string;
  booked_quantity?: number;
  min_stock_level?: number;
  minimum_stock?: number;
  maximum_stock?: number;
  brand?: string;
  description?: string;
  image_url?: string;
  qr_code?: string;
  is_combo?: boolean;
  combo_items?: ComboItem[];
  batch_no?: string;
  mfg_date?: string;
  expiry_date?: string;
  rate_nr?: number;
  rate_lmr?: number;
  rate_abr?: number;
  rate_ddr?: number;
  business_id: string;
  active: boolean;
  created_at: string;
  food_packaging?: FoodPackagingInfo;
  packaging_info?: FoodPackagingInfo;
  nutrition_facts?: NutritionFacts;
  custom_attributes?: Record<string, any>;
}

export interface Customer {
  id: string;
  name: string;
  image_url?: string;
  group: string;
  area?: string;
  gstin: string;
  pan: string;
  billing_address: string;
  shipping_address: string;
  pin_code?: string;
  email: string;
  phone: string;
  credit_limit: number;
  outstanding_amount: number;
  loyalty_points?: number;
  lifetime_spend?: number;
  loyalty_tier?: LoyaltyTier;
  loyalty_tier_override?: LoyaltyTier;
  loyalty_plan?: string;
  is_loyal_member?: boolean;
  loyalty_start_date?: string;
  loyalty_end_date?: string;
  loyalty_auto_renew?: boolean;
  loyalty_discount_percentage?: number;
  birthday?: string;
  anniversary?: string;
  preferred_delivery_mode?: string;
  business_id: string;
  active: boolean;
  created_at: string;
}

export interface Supplier {
  id: string;
  name: string;
  contact_person?: string;
  gstin: string;
  pan?: string;
  address: string;
  email: string;
  phone: string;
  outstanding_amount: number;
  bank_account?: string;
  ifsc?: string;
  business_id: string;
  active?: boolean;
  created_at: string;
}

export interface PurchaseItem {
  product_id: string;
  product_name?: string;
  sku?: string;
  qty: number;
  received_qty: number;
  purchase_price: number;
  gst_rate: number;
  tax_amount?: number;
  total_amount?: number;
}

export interface PurchaseOrder {
  id: string;
  po_number: string;
  order_number?: string;
  supplier_id: string;
  supplier_name: string;
  order_date: string;
  expected_delivery_date?: string;
  delivery_date?: string;
  status: 'Draft' | 'Ordered' | 'Partially Received' | 'Received' | 'Cancelled';
  items: PurchaseItem[];
  subtotal: number;
  tax_amount: number;
  discount_amount?: number;
  total_amount: number;
  paid_amount: number;
  payment_status: 'Unpaid' | 'Partial' | 'Paid';
  payment_mode?: string;
  payment_notes?: string;
  payment_reference?: string;
  payment_date?: string;
  notes?: string;
  payment_bank?: string;
  payment_history?: any[];
  is_bill?: boolean;
  business_id: string;
  created_at: string;
}

export type OrderStatus = 'Pending' | 'Packing' | 'Packed' | 'Dispatched' | 'Delivered' | 'Cancelled' | 'Returned';

export interface SalesItem {
  id?: string;
  product_id: string;
  product_name: string;
  sku?: string;
  unit?: string;
  qty: number;
  packed_qty?: number;
  scanned_qty?: number;
  price?: number;
  selling_price?: number;
  original_price?: number;
  normal_rate?: number;
  rate_reason?: string;
  rate_type?: string;
  is_overridden?: boolean;
  unit_savings?: number;
  mrp?: number;
  gst_rate: number;
  tax_amount?: number;
  discount_amount?: number;
  discount_percent?: number;
  total_amount?: number;
  hsn_code?: string;
  batch_no?: string;
  mfg_date?: string;
  expiry_date?: string;
}

export interface SalesOrder {
  id: string;
  order_number: string;
  legacy_order_number?: string;
  customer_id: string;
  customer_name: string;
  customer_phone?: string;
  customer_address?: string;
  customer_shipping_address?: string;
  customer_pin_code?: string;
  pin_code?: string;
  customer_gstin?: string;
  billing_address?: string;
  shipping_address?: string;
  order_date: string;
  due_date?: string;
  status: OrderStatus;
  items: SalesItem[];
  subtotal?: number;
  tax_amount?: number;
  discount_amount?: number;
  points_redeemed?: number;
  special_discount_amount?: number;
  delivery_charge?: number;
  delivery_charges?: number;
  additional_charges?: number;
  additional_charges_type?: string;
  round_off?: number;
  total_amount: number;
  paid_amount?: number;
  payment_status?: 'Unpaid' | 'Partial' | 'Paid';
  payment_mode?: string;
  payment_reference?: string;
  payment_date?: string;
  invoice_type?: 'Regular' | 'Festive' | 'Advance' | 'Festive_Advance';
  delivery_type?: 'Delivery' | 'Pickup';
  delivery_boy?: string;
  delivery_person_name?: string;
  delivery_person_phone?: string;
  delivered_to?: string;
  dispatch_zone?: string;
  area?: string;
  delivery_date?: string;
  time?: string;
  packed_by?: string;
  dispatched_at?: string;
  delivered_at?: string;
  packing_completed_at?: string;
  return_reason?: string;
  return_notes?: string;
  qr_code_data?: string;
  packing_started_at?: string;
  delivery_status?: string;
  advance_booking?: boolean;
  ready_for_dispatch?: boolean;
  is_overdue?: boolean;
  discount_percentage?: number;
  notes?: string;
  channel?: string;
  dispatch_notes?: string;
  payment_notes?: string;
  festive_booking?: boolean;
  payment_history?: any[];
  return_type?: string;
  delivery_partner?: string;
  rack_location?: string;
  rack_section?: string;
  total_bags?: number;
  is_partially_packed?: boolean;
  tracking_number?: string;
  cod_collected?: boolean;
  cod_collected_amount?: number;
  is_updated?: boolean;
  updated_at?: string;
  subscription_id?: string;
  delivery_notes?: string;
  returned_at?: string;
  payment_bank?: string;
  inventory_restocked?: boolean;
  is_live_order?: boolean;
  business_id: string;
  created_at: string;
}

export interface PackingSession {
  id: string;
  order_id: string;
  order_number: string;
  status: 'In Progress' | 'Completed' | 'Aborted' | 'Packed';
  packed_by: string;
  packing_staff_id?: string;
  total_scans?: number;
  start_time: string;
  end_time?: string;
  logs?: any[];
  items_packed: {
    product_id: string;
    scanned_qty: number;
    required_qty: number;
  }[];
  business_id: string;
}

export interface StockLog {
  id: string;
  product_id: string;
  product_name?: string;
  type: 'In' | 'Out' | 'Adjustment' | 'Order Booking' | 'Order Cancellation' | 'Order Return' | 'Adjusted' | 'Return';
  quantity?: number;
  change_qty?: number;
  previous_stock?: number;
  new_stock?: number;
  reference_type?: string;
  reference_id?: string;
  notes?: string;
  created_by: string;
  created_at: string;
  business_id: string;
}

export interface SystemAuditLog {
  id: string;
  user_id: string;
  user_name: string;
  user_role: string;
  action: string;
  details: string;
  created_at: string;
  business_id: string;
}

export type AuditLogEntry = SystemAuditLog;

export interface ComboHistoryLog {
  id: string;
  combo_id: string;
  combo_name: string;
  type: 'Build' | 'Break' | 'Stock Change' | string;
  action?: string;
  quantity?: number;
  qty?: number;
  performed_by: string;
  details: string;
  created_at: string;
  business_id: string;
}

export interface PaymentRecord {
  id: string;
  reference_no?: string;
  order_id?: string;
  order_number?: string;
  type: 'Sales' | 'Purchase';
  amount: number;
  payment_mode: string;
  payment_date: string;
  notes?: string;
  receipt_number?: string;
  bank_account?: string;
  payment_reference?: string;
  collected_by: string;
  business_id: string;
  created_at: string;
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

export type LoyaltyTier = 'Silver' | 'Gold' | 'Platinum' | 'None';

export interface LoyaltyConfig {
  enabled: boolean;
  spend_per_point: number;
  point_value: number;
  silver_min_spend: number;
  silver_multiplier?: number;
  gold_min_spend: number;
  platinum_min_spend: number;
  gold_multiplier: number;
  platinum_multiplier: number;
  silver_bonus_points: number;
  gold_bonus_points: number;
  platinum_bonus_points: number;
  welcome_bonus_points: number;
  birthday_bonus_points: number;
  point_expiry_days: number;
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
  silver_bonus_points: 0,
  gold_bonus_points: 500,
  platinum_bonus_points: 1000,
  welcome_bonus_points: 50,
  birthday_bonus_points: 100,
  point_expiry_days: 365
};

export interface DraftInvoiceReservation {
  id: string;
  userId: string;
  userName?: string;
  businessId: string;
  invoiceNumber: string;
  isFestive: boolean;
  isAdvance: boolean;
  timestamp: number;
}
