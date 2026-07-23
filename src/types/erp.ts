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
  tax_rate_default: number;
  created_at: string;
  logo_url?: string;
  login_cover_url?: string;
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

export interface PurchaseOrder {
  id: string;
  order_number: string;
  supplier_id: string;
  order_date: string;
  delivery_date: string;
  status: 'Draft' | 'Ordered' | 'Received' | 'Cancelled';
  payment_status: 'Unpaid' | 'Partial' | 'Paid';
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

export type OrderStatus = 'Pending' | 'Packing' | 'Packed' | 'Dispatched' | 'Delivered' | 'Cancelled';

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
  status: OrderStatus;
  payment_status: 'Unpaid' | 'Partial' | 'Paid';
  delivery_status: OrderStatus;
  items: SalesItem[];
  advance_booking: boolean;
  total_amount: number;
  business_id: string;
  created_at: string;
  qr_code_data: string; // Custom string packing verification scan
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
  type: 'In' | 'Out' | 'Adjustment' | 'Transfer' | 'Damage' | 'Return';
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
