-- Run this in your Supabase SQL Editor

-- 1. Businesses
CREATE TABLE public.businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  gstin TEXT,
  pan TEXT,
  billing_address TEXT,
  shipping_address TEXT,
  email TEXT,
  phone TEXT,
  invoice_prefix TEXT,
  tax_rate_default NUMERIC DEFAULT 0,
  logo_url TEXT,
  login_cover_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. User Profiles
CREATE TABLE public.users_profiles (
  id UUID PRIMARY KEY, -- links to auth.users if needed
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Categories
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  parent_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Products
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  sku TEXT,
  barcode TEXT,
  qr_code TEXT,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  brand TEXT,
  unit TEXT,
  hsn_code TEXT,
  gst_rate NUMERIC DEFAULT 0,
  purchase_price NUMERIC DEFAULT 0,
  selling_price NUMERIC DEFAULT 0,
  mrp NUMERIC DEFAULT 0,
  opening_stock NUMERIC DEFAULT 0,
  current_stock NUMERIC DEFAULT 0,
  minimum_stock NUMERIC DEFAULT 0,
  maximum_stock NUMERIC DEFAULT 0,
  image_url TEXT,
  description TEXT,
  active BOOLEAN DEFAULT TRUE,
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Customers
CREATE TABLE public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  "group" TEXT,
  area TEXT,
  gstin TEXT,
  pan TEXT,
  billing_address TEXT,
  shipping_address TEXT,
  email TEXT,
  phone TEXT,
  credit_limit NUMERIC DEFAULT 0,
  outstanding_amount NUMERIC DEFAULT 0,
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Suppliers
CREATE TABLE public.suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  gstin TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  outstanding_amount NUMERIC DEFAULT 0,
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Purchase Orders
CREATE TABLE public.purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT NOT NULL,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE CASCADE,
  order_date DATE,
  delivery_date DATE,
  status TEXT NOT NULL,
  payment_status TEXT NOT NULL,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_amount NUMERIC DEFAULT 0,
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Sales Orders
CREATE TABLE public.sales_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT NOT NULL,
  customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
  customer_name TEXT,
  area TEXT,
  channel TEXT,
  time TEXT,
  is_overdue BOOLEAN DEFAULT FALSE,
  order_date DATE,
  status TEXT NOT NULL,
  payment_status TEXT NOT NULL,
  delivery_status TEXT NOT NULL,
  rack_location TEXT,
  rack_section TEXT,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  advance_booking BOOLEAN DEFAULT FALSE,
  total_amount NUMERIC DEFAULT 0,
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
  qr_code_data TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Packing Sessions
CREATE TABLE public.packing_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.sales_orders(id) ON DELETE CASCADE,
  packing_staff_id UUID REFERENCES public.users_profiles(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  total_scans INTEGER DEFAULT 0,
  status TEXT NOT NULL,
  logs JSONB NOT NULL DEFAULT '[]'::jsonb,
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE
);

-- 10. Stock Logs
CREATE TABLE public.stock_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  change_qty NUMERIC NOT NULL,
  type TEXT NOT NULL,
  notes TEXT,
  created_by UUID REFERENCES public.users_profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE
);

-- 11. System Audit Logs
CREATE TABLE public.system_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users_profiles(id) ON DELETE CASCADE,
  user_name TEXT,
  user_role TEXT,
  action TEXT NOT NULL,
  details TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE
);

-- 12. Business Settings
CREATE TABLE public.business_settings (
  business_id UUID PRIMARY KEY REFERENCES public.businesses(id) ON DELETE CASCADE,
  business_name TEXT,
  gstin TEXT,
  invoice_prefix TEXT,
  low_stock_limit NUMERIC DEFAULT 10,
  barcode_format TEXT DEFAULT 'EAN-13',
  qr_size NUMERIC DEFAULT 150,
  enable_email_alerts BOOLEAN DEFAULT FALSE,
  enable_sms_alerts BOOLEAN DEFAULT FALSE,
  theme TEXT DEFAULT 'light'
);

-- Enable RLS (Row Level Security) - Optional but recommended for production
-- ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Users can access their business products" ON public.products FOR ALL USING (business_id = auth.uid()); -- Note: needs correct auth setup.

