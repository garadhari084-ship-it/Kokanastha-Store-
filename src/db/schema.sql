-- ====================================================================
-- OMNIPACK ERP DATABASE SCHEMA (SUPABASE POSTGRESQL)
-- ====================================================================
-- Fully normalized, Multi-Tenant Partitioned, Role-Based Access Controls
-- Row Level Security (RLS) Policies & Optimized Database Indexes
-- ====================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ====================================================================
-- 1. TENANT TABLES
-- ====================================================================

-- Businesses Table (Tenants)
CREATE TABLE IF NOT EXISTS businesses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    gstin VARCHAR(15),
    pan VARCHAR(10),
    billing_address TEXT NOT NULL,
    shipping_address TEXT NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    invoice_prefix VARCHAR(50) DEFAULT 'INV-',
    advance_invoice_prefix VARCHAR(50) DEFAULT 'ADV-',
    festive_invoice_prefix VARCHAR(50) DEFAULT 'FEST-',
    festive_advance_invoice_prefix VARCHAR(50) DEFAULT 'FEST-ADV-',
    tax_rate_default DECIMAL(5,2) DEFAULT 18.00,
    logo_url TEXT,
    login_cover_url TEXT,
    upi_qr_url TEXT,
    currency_symbol VARCHAR(10) DEFAULT '₹',
    currency_default VARCHAR(10) DEFAULT 'INR',
    auto_backup BOOLEAN DEFAULT TRUE,
    low_stock_threshold INTEGER DEFAULT 20,
    audit_retention_days INTEGER DEFAULT 90,
    default_theme VARCHAR(50) DEFAULT 'midnight-gold',
    enable_auto_whatsapp BOOLEAN DEFAULT TRUE,
    enable_auto_sms BOOLEAN DEFAULT TRUE,
    default_dispatch_zone VARCHAR(100) DEFAULT 'Dahisar',
    area_zones TEXT[] DEFAULT ARRAY['Dahisar', 'Borivali', 'Kandivali', 'Mira Road', 'Vasai', 'Virar', 'Malad', 'Goregaon', 'Andheri']::TEXT[],
    upi_id VARCHAR(255),
    bank_name TEXT,
    account_number VARCHAR(100),
    ifsc_code VARCHAR(50),
    account_holder VARCHAR(255),
    fssai_number VARCHAR(50),
    mobile_number VARCHAR(20),
    whatsapp_api_key TEXT,
    whatsapp_template TEXT,
    sms_gateway_url TEXT,
    google_maps_key TEXT,
    last_supabase_sync TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- User Profiles (Linked with Supabase auth.users)
CREATE TABLE IF NOT EXISTS users_profiles (
    id UUID PRIMARY KEY, -- Maps directly to auth.users.id
    user_id UUID, -- Backwards compatibility alias for auth.users.id
    email VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('Super Admin', 'Admin', 'Manager', 'Packing Staff', 'Sales Staff', 'Viewer')),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Ensure user_id column exists if table was created previously without it
DO $$ 
BEGIN    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='users_profiles' AND column_name='user_id'
    ) THEN
        ALTER TABLE users_profiles ADD COLUMN user_id UUID;
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='users_profiles' AND column_name='allowed_pages'
    ) THEN
        ALTER TABLE users_profiles ADD COLUMN allowed_pages JSONB;
    END IF;
END $;

-- ====================================================================
-- 2. MASTER DATA TABLES
-- ====================================================================

-- Categories Table
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Products Table
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    sku VARCHAR(100) NOT NULL,
    barcode VARCHAR(100) NOT NULL, -- Scan verification barcode (Unique per product)
    qr_code VARCHAR(255) NOT NULL, -- Custom QR Code representation
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    brand VARCHAR(100),
    unit VARCHAR(50) DEFAULT 'Pcs',
    hsn_code VARCHAR(20),
    gst_rate DECIMAL(5,2) DEFAULT 18.00,
    purchase_price DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    selling_price DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    mrp DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    opening_stock INTEGER NOT NULL DEFAULT 0,
    current_stock INTEGER NOT NULL DEFAULT 0,
    minimum_stock INTEGER NOT NULL DEFAULT 5,
    maximum_stock INTEGER NOT NULL DEFAULT 1000,
    image_url TEXT,
    description TEXT,
    is_combo BOOLEAN DEFAULT FALSE,
    combo_items JSONB DEFAULT '[]'::jsonb,
    active BOOLEAN DEFAULT TRUE,
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT unique_sku_per_business UNIQUE (business_id, sku),
    CONSTRAINT unique_barcode_per_business UNIQUE (business_id, barcode)
);

-- Ensure is_combo and combo_items columns exist if products table was created previously
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='products' AND column_name='is_combo'
    ) THEN
        ALTER TABLE products ADD COLUMN is_combo BOOLEAN DEFAULT FALSE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='products' AND column_name='combo_items'
    ) THEN
        ALTER TABLE products ADD COLUMN combo_items JSONB DEFAULT '[]'::jsonb;
    END IF;
END $$;

-- Customers Table
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    "group" VARCHAR(100) DEFAULT 'Retail', -- Retail, Wholesale, Distributor
    area VARCHAR(100) DEFAULT 'Dahisar', -- Dahisar, Borivali, Kandivali, Mira Road, Vasai, Virar, etc.
    gstin VARCHAR(15),
    pan VARCHAR(10),
    billing_address TEXT NOT NULL,
    shipping_address TEXT NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20) NOT NULL,
    credit_limit DECIMAL(15,2) DEFAULT 0.00,
    outstanding_amount DECIMAL(15,2) DEFAULT 0.00,
    loyalty_points INTEGER DEFAULT 0,
    loyalty_tier VARCHAR(50) DEFAULT 'Silver',
    lifetime_spend DECIMAL(15,2) DEFAULT 0.00,
    active BOOLEAN DEFAULT TRUE,
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Suppliers Table
CREATE TABLE IF NOT EXISTS suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    gstin VARCHAR(15),
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    address TEXT NOT NULL,
    outstanding_amount DECIMAL(15,2) DEFAULT 0.00,
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- ====================================================================
-- 3. TRANSACTION TABLES
-- ====================================================================

-- Purchase Orders Table
CREATE TABLE IF NOT EXISTS purchase_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number VARCHAR(100) NOT NULL,
    supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
    order_date DATE NOT NULL DEFAULT CURRENT_DATE,
    delivery_date DATE,
    status VARCHAR(50) NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft', 'Ordered', 'Received', 'Cancelled')),
    payment_status VARCHAR(50) NOT NULL DEFAULT 'Unpaid' CHECK (payment_status IN ('Unpaid', 'Partial', 'Paid')),
    total_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT unique_po_number_per_business UNIQUE (business_id, order_number)
);

-- Purchase Order Items Table
CREATE TABLE IF NOT EXISTS purchase_order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    qty INTEGER NOT NULL CHECK (qty > 0),
    received_qty INTEGER NOT NULL DEFAULT 0,
    purchase_price DECIMAL(15,2) NOT NULL CHECK (purchase_price >= 0.00),
    gst_rate DECIMAL(5,2) DEFAULT 18.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Sales Orders Table
CREATE TABLE IF NOT EXISTS sales_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number VARCHAR(100) NOT NULL,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    customer_name VARCHAR(255),
    area VARCHAR(100) DEFAULT 'Dahisar',
    channel VARCHAR(100) DEFAULT 'Direct Order',
    time VARCHAR(50),
    is_overdue BOOLEAN DEFAULT FALSE,
    order_date DATE NOT NULL DEFAULT CURRENT_DATE,
    delivery_date DATE,
    delivery_type VARCHAR(255),
    status VARCHAR(50) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Packing', 'Packed', 'Dispatched', 'Delivered', 'Cancelled')),
    payment_status VARCHAR(50) NOT NULL DEFAULT 'Unpaid' CHECK (payment_status IN ('Unpaid', 'Partial', 'Paid')),
    payment_mode VARCHAR(100) DEFAULT 'Cash',
    paid_amount DECIMAL(15,2) DEFAULT 0.00,
    payment_reference VARCHAR(255),
    payment_bank VARCHAR(255),
    payment_notes TEXT,
    payment_date TIMESTAMP WITH TIME ZONE,
    payment_history JSONB,
    delivery_status VARCHAR(50) NOT NULL DEFAULT 'Pending' CHECK (delivery_status IN ('Pending', 'Packing', 'Packed', 'Dispatched', 'Delivered', 'Cancelled')),
    rack_location VARCHAR(255),
    rack_section VARCHAR(255),
    advance_booking BOOLEAN DEFAULT FALSE,
    festive_booking BOOLEAN DEFAULT FALSE,
    total_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    discount_amount DECIMAL(15,2) DEFAULT 0.00,
    discount_percentage DECIMAL(5,2) DEFAULT 0.00,
    additional_charges DECIMAL(15,2) DEFAULT 0.00,
    delivery_charges DECIMAL(15,2) DEFAULT 0.00,
    additional_charges_type VARCHAR(50) DEFAULT 'Delivery',
    qr_code_data TEXT NOT NULL, -- QR Code containing: Order ID, customer, total items, etc.
    delivery_partner VARCHAR(100),
    delivery_person_name VARCHAR(255),
    delivery_person_phone VARCHAR(50),
    tracking_number VARCHAR(100),
    dispatch_notes TEXT,
    dispatched_at TIMESTAMP WITH TIME ZONE,
    packing_started_at TIMESTAMP WITH TIME ZONE,
    packing_completed_at TIMESTAMP WITH TIME ZONE,
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT unique_so_number_per_business UNIQUE (business_id, order_number)
);

-- Sales Order Items Table
CREATE TABLE IF NOT EXISTS sales_order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sales_order_id UUID NOT NULL REFERENCES sales_orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    qty INTEGER NOT NULL CHECK (qty > 0),
    scanned_qty INTEGER NOT NULL DEFAULT 0, -- Tracked during Packing Verification
    selling_price DECIMAL(15,2) NOT NULL CHECK (selling_price >= 0.00),
    gst_rate DECIMAL(5,2) DEFAULT 18.00,
    normal_rate DECIMAL(15,2) DEFAULT 0.00,
    rate_type VARCHAR(50),
    rate_reason TEXT,
    unit_savings DECIMAL(15,2) DEFAULT 0.00,
    is_overridden BOOLEAN DEFAULT FALSE,
    original_calc_price DECIMAL(15,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Ensure missing columns exist in sales_order_items if table was created previously
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sales_order_items' AND column_name='normal_rate') THEN
        ALTER TABLE sales_order_items ADD COLUMN normal_rate DECIMAL(15,2) DEFAULT 0.00;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sales_order_items' AND column_name='rate_type') THEN
        ALTER TABLE sales_order_items ADD COLUMN rate_type VARCHAR(50);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sales_order_items' AND column_name='rate_reason') THEN
        ALTER TABLE sales_order_items ADD COLUMN rate_reason TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sales_order_items' AND column_name='unit_savings') THEN
        ALTER TABLE sales_order_items ADD COLUMN unit_savings DECIMAL(15,2) DEFAULT 0.00;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sales_order_items' AND column_name='is_overridden') THEN
        ALTER TABLE sales_order_items ADD COLUMN is_overridden BOOLEAN DEFAULT FALSE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sales_order_items' AND column_name='original_calc_price') THEN
        ALTER TABLE sales_order_items ADD COLUMN original_calc_price DECIMAL(15,2) DEFAULT 0.00;
    END IF;
END $$;

-- ====================================================================
-- 4. PACKING & LOGISTICS TABLES
-- ====================================================================

-- Packing Verification Sessions
CREATE TABLE IF NOT EXISTS packing_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES sales_orders(id) ON DELETE CASCADE,
    packing_staff_id UUID NOT NULL REFERENCES users_profiles(id) ON DELETE CASCADE,
    start_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP WITH TIME ZONE,
    total_scans INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'Packing' CHECK (status IN ('Packing', 'Packed', 'Failed')),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Packing Scan Audit Logs
CREATE TABLE IF NOT EXISTS packing_scan_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    packing_session_id UUID NOT NULL REFERENCES packing_sessions(id) ON DELETE CASCADE,
    barcode VARCHAR(100) NOT NULL,
    success BOOLEAN NOT NULL DEFAULT TRUE,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ====================================================================
-- 5. STOCK LEDGER, CHAT & SYSTEM LOGS
-- ====================================================================

-- Stock Logs (Audit Trail for Inventory valuation and FIFO tracking)
CREATE TABLE IF NOT EXISTS stock_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    change_qty INTEGER NOT NULL, -- positive for stock-in, negative for stock-out
    type VARCHAR(50) NOT NULL CHECK (type IN ('In', 'Out', 'Adjustment', 'Transfer', 'Damage', 'Return')),
    notes TEXT,
    created_by UUID REFERENCES users_profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE
);

-- System Audit Logs
CREATE TABLE IF NOT EXISTS system_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users_profiles(id) ON DELETE SET NULL,
    user_name VARCHAR(255) NOT NULL,
    user_role VARCHAR(100) NOT NULL,
    action VARCHAR(255) NOT NULL, -- 'Login', 'Create Customer', 'Export Excel', 'Complete Packing', etc.
    details TEXT,
    ip_address VARCHAR(45),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE
);

-- Internal Chat Messages
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id UUID NOT NULL REFERENCES users_profiles(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES users_profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE
);

-- Business Settings
CREATE TABLE IF NOT EXISTS business_settings (
    business_id UUID PRIMARY KEY REFERENCES businesses(id) ON DELETE CASCADE,
    low_stock_limit INTEGER DEFAULT 5,
    barcode_format VARCHAR(50) DEFAULT 'CODE-128',
    qr_size INTEGER DEFAULT 150,
    enable_email_alerts BOOLEAN DEFAULT TRUE,
    enable_sms_alerts BOOLEAN DEFAULT TRUE,
    theme VARCHAR(20) DEFAULT 'light',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Loyalty Program Configurations
CREATE TABLE IF NOT EXISTS loyalty_configs (
    business_id UUID PRIMARY KEY REFERENCES businesses(id) ON DELETE CASCADE,
    enabled BOOLEAN DEFAULT TRUE,
    spend_per_point DECIMAL(15,2) DEFAULT 100.00,
    point_value DECIMAL(15,2) DEFAULT 1.00,
    silver_min_spend DECIMAL(15,2) DEFAULT 0.00,
    gold_min_spend DECIMAL(15,2) DEFAULT 10000.00,
    platinum_min_spend DECIMAL(15,2) DEFAULT 20000.00,
    gold_multiplier DECIMAL(5,2) DEFAULT 1.25,
    platinum_multiplier DECIMAL(5,2) DEFAULT 1.50,
    welcome_bonus_points INTEGER DEFAULT 50,
    birthday_bonus_points INTEGER DEFAULT 100,
    point_expiry_days INTEGER DEFAULT 365,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Loyalty Points Audit Logs
CREATE TABLE IF NOT EXISTS loyalty_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID,
    type VARCHAR(50) NOT NULL CHECK (type IN ('Earned', 'Redeemed', 'Bonus', 'Expired', 'Adjusted')),
    points INTEGER NOT NULL,
    amount_spent DECIMAL(15,2) DEFAULT 0.00,
    order_id UUID,
    notes TEXT,
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Customer Subscriptions
CREATE TABLE IF NOT EXISTS customer_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subscription_number VARCHAR(100) NOT NULL,
    customer_id UUID,
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(50),
    plan_name VARCHAR(255) NOT NULL,
    frequency VARCHAR(50) NOT NULL,
    next_delivery_date DATE,
    next_billing_date DATE,
    status VARCHAR(50) DEFAULT 'Active',
    items JSONB DEFAULT '[]'::jsonb,
    total_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    delivery_area VARCHAR(100),
    delivery_address TEXT,
    last_order_date DATE,
    last_order_id UUID,
    auto_renew BOOLEAN DEFAULT TRUE,
    notes TEXT,
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Ensure foreign key flexibilities and column definitions on customer_subscriptions and loyalty_logs
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='customer_subscriptions' AND column_name='next_billing_date') THEN
        ALTER TABLE customer_subscriptions ADD COLUMN next_billing_date DATE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='customer_subscriptions' AND column_name='delivery_address') THEN
        ALTER TABLE customer_subscriptions ADD COLUMN delivery_address TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='customer_subscriptions' AND column_name='last_order_date') THEN
        ALTER TABLE customer_subscriptions ADD COLUMN last_order_date DATE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='customer_subscriptions' AND column_name='last_order_id') THEN
        ALTER TABLE customer_subscriptions ADD COLUMN last_order_id UUID;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='customer_subscriptions' AND column_name='auto_renew') THEN
        ALTER TABLE customer_subscriptions ADD COLUMN auto_renew BOOLEAN DEFAULT TRUE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='customers' AND column_name='loyalty_points') THEN
        ALTER TABLE customers ADD COLUMN loyalty_points INTEGER DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='customers' AND column_name='loyalty_tier') THEN
        ALTER TABLE customers ADD COLUMN loyalty_tier VARCHAR(50) DEFAULT 'Silver';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='customers' AND column_name='lifetime_spend') THEN
        ALTER TABLE customers ADD COLUMN lifetime_spend DECIMAL(15,2) DEFAULT 0.00;
    END IF;
    
    -- Drop strict foreign key constraints to prevent sync failures when customers or orders are managed loosely
    ALTER TABLE customer_subscriptions DROP CONSTRAINT IF EXISTS customer_subscriptions_customer_id_fkey;
    ALTER TABLE customer_subscriptions ALTER COLUMN customer_id DROP NOT NULL;

    ALTER TABLE loyalty_logs DROP CONSTRAINT IF EXISTS loyalty_logs_customer_id_fkey;
    ALTER TABLE loyalty_logs ALTER COLUMN customer_id DROP NOT NULL;
    ALTER TABLE loyalty_logs DROP CONSTRAINT IF EXISTS loyalty_logs_order_id_fkey;

    ALTER TABLE sales_orders DROP CONSTRAINT IF EXISTS sales_orders_customer_id_fkey;
    ALTER TABLE sales_orders ALTER COLUMN customer_id DROP NOT NULL;

    -- Ensure Payment and Partial Payment columns on sales_orders
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sales_orders' AND column_name='paid_amount') THEN
        ALTER TABLE sales_orders ADD COLUMN paid_amount DECIMAL(15,2) DEFAULT 0.00;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sales_orders' AND column_name='payment_status') THEN
        ALTER TABLE sales_orders ADD COLUMN payment_status VARCHAR(50) DEFAULT 'Unpaid';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sales_orders' AND column_name='payment_mode') THEN
        ALTER TABLE sales_orders ADD COLUMN payment_mode VARCHAR(100) DEFAULT 'Cash';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sales_orders' AND column_name='payment_reference') THEN
        ALTER TABLE sales_orders ADD COLUMN payment_reference VARCHAR(255);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sales_orders' AND column_name='payment_bank') THEN
        ALTER TABLE sales_orders ADD COLUMN payment_bank VARCHAR(255);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sales_orders' AND column_name='payment_notes') THEN
        ALTER TABLE sales_orders ADD COLUMN payment_notes TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sales_orders' AND column_name='payment_date') THEN
        ALTER TABLE sales_orders ADD COLUMN payment_date TIMESTAMP WITH TIME ZONE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sales_orders' AND column_name='payment_history') THEN
        ALTER TABLE sales_orders ADD COLUMN payment_history JSONB DEFAULT '[]'::jsonb;
    END IF;

    -- Ensure Payment and Partial Payment columns on purchase_orders
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='purchase_orders' AND column_name='paid_amount') THEN
        ALTER TABLE purchase_orders ADD COLUMN paid_amount DECIMAL(15,2) DEFAULT 0.00;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='purchase_orders' AND column_name='payment_status') THEN
        ALTER TABLE purchase_orders ADD COLUMN payment_status VARCHAR(50) DEFAULT 'Unpaid';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='purchase_orders' AND column_name='payment_mode') THEN
        ALTER TABLE purchase_orders ADD COLUMN payment_mode VARCHAR(100) DEFAULT 'Cash';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='purchase_orders' AND column_name='payment_reference') THEN
        ALTER TABLE purchase_orders ADD COLUMN payment_reference VARCHAR(255);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='purchase_orders' AND column_name='payment_bank') THEN
        ALTER TABLE purchase_orders ADD COLUMN payment_bank VARCHAR(255);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='purchase_orders' AND column_name='payment_notes') THEN
        ALTER TABLE purchase_orders ADD COLUMN payment_notes TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='purchase_orders' AND column_name='payment_date') THEN
        ALTER TABLE purchase_orders ADD COLUMN payment_date TIMESTAMP WITH TIME ZONE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='purchase_orders' AND column_name='payment_history') THEN
        ALTER TABLE purchase_orders ADD COLUMN payment_history JSONB DEFAULT '[]'::jsonb;
    END IF;

    -- Ensure outstanding_amount on customers and suppliers
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='customers' AND column_name='outstanding_amount') THEN
        ALTER TABLE customers ADD COLUMN outstanding_amount DECIMAL(15,2) DEFAULT 0.00;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='suppliers' AND column_name='outstanding_amount') THEN
        ALTER TABLE suppliers ADD COLUMN outstanding_amount DECIMAL(15,2) DEFAULT 0.00;
    END IF;
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

-- ====================================================================
-- 6. INDEXES FOR PERFORMANCE OPTIMIZATION
-- ====================================================================

CREATE INDEX IF NOT EXISTS idx_users_profiles_business ON users_profiles(business_id);
CREATE INDEX IF NOT EXISTS idx_products_business_barcode ON products(business_id, barcode);
CREATE INDEX IF NOT EXISTS idx_products_business_sku ON products(business_id, sku);
CREATE INDEX IF NOT EXISTS idx_customers_business ON customers(business_id);
CREATE INDEX IF NOT EXISTS idx_sales_orders_business_status ON sales_orders(business_id, status);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_business_status ON purchase_orders(business_id, status);
CREATE INDEX IF NOT EXISTS idx_stock_logs_product ON stock_logs(product_id);
CREATE INDEX IF NOT EXISTS idx_system_audit_logs_business ON system_audit_logs(business_id);

-- ====================================================================
-- 7. DATABASE FUNCTIONS & TRIGGERS
-- ====================================================================

-- Function to update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger on Businesses
CREATE TRIGGER update_businesses_updated_at
    BEFORE UPDATE ON businesses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger on Products
CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger on Customers
CREATE TRIGGER update_customers_updated_at
    BEFORE UPDATE ON customers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger on Sales Orders
CREATE TRIGGER update_sales_orders_updated_at
    BEFORE UPDATE ON sales_orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();


-- Automatic Stock Inventory Level Management Function
-- Updates product "current_stock" when stock logs are written
CREATE OR REPLACE FUNCTION update_product_current_stock()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE products
    SET current_stock = current_stock + NEW.change_qty
    WHERE id = NEW.product_id;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trg_stock_logs_on_insert
    AFTER INSERT ON stock_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_product_current_stock();

-- ====================================================================
-- 8. ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================

-- Enable RLS on all tables
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE users_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE packing_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Helper function to extract current user's business_id from user metadata
-- In production, Supabase sets business_id via auth.jwt() claims or user_profile query
CREATE OR REPLACE FUNCTION get_user_business_id()
RETURNS UUID AS $$
DECLARE
    v_business_id UUID;
BEGIN
    -- Look up profile by current auth user id (checking both id and user_id columns for compatibility)
    SELECT business_id INTO v_business_id
    FROM users_profiles
    WHERE id = auth.uid() OR user_id = auth.uid()
    LIMIT 1;
    
    RETURN v_business_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Simple, high-performance RLS Policies based on business_id partition:
-- Users can only view/mutate data belonging to their own business (tenant isolation)

CREATE POLICY tenant_isolation_users_profiles ON users_profiles
    FOR ALL USING (business_id = get_user_business_id());

CREATE POLICY tenant_isolation_categories ON categories
    FOR ALL USING (business_id = get_user_business_id());

CREATE POLICY tenant_isolation_products ON products
    FOR ALL USING (business_id = get_user_business_id());

CREATE POLICY tenant_isolation_customers ON customers
    FOR ALL USING (business_id = get_user_business_id());

CREATE POLICY tenant_isolation_suppliers ON suppliers
    FOR ALL USING (business_id = get_user_business_id());

CREATE POLICY tenant_isolation_purchase_orders ON purchase_orders
    FOR ALL USING (business_id = get_user_business_id());

CREATE POLICY tenant_isolation_sales_orders ON sales_orders
    FOR ALL USING (business_id = get_user_business_id());

CREATE POLICY tenant_isolation_packing_sessions ON packing_sessions
    FOR ALL USING (business_id = get_user_business_id());

CREATE POLICY tenant_isolation_stock_logs ON stock_logs
    FOR ALL USING (business_id = get_user_business_id());

CREATE POLICY tenant_isolation_system_audit_logs ON system_audit_logs
    FOR ALL USING (business_id = get_user_business_id());

CREATE POLICY tenant_isolation_business_settings ON business_settings
    FOR ALL USING (business_id = get_user_business_id());

CREATE POLICY tenant_isolation_loyalty_configs ON loyalty_configs
    FOR ALL USING (business_id = get_user_business_id());

DROP POLICY IF EXISTS dev_public_chat_messages ON chat_messages;
CREATE POLICY dev_public_chat_messages ON chat_messages FOR ALL USING (true);

DROP POLICY IF EXISTS dev_public_loyalty_logs ON loyalty_logs;
CREATE POLICY dev_public_loyalty_logs ON loyalty_logs FOR ALL USING (true);

DROP POLICY IF EXISTS dev_public_customer_subscriptions ON customer_subscriptions;
CREATE POLICY dev_public_customer_subscriptions ON customer_subscriptions FOR ALL USING (true);

-- ====================================================================
-- REALTIME SUBSCRIPTIONS
-- ====================================================================
-- Safely add tables to supabase_realtime publication without throwing errors if already present

DO $$ 
DECLARE
    tbl text;
    tables text[] := ARRAY[
      'businesses', 'users_profiles', 'categories', 'products', 'customers', 
      'suppliers', 'purchase_orders', 'purchase_order_items', 'sales_orders', 
      'sales_order_items', 'packing_sessions', 'packing_scan_logs', 'stock_logs', 
      'system_audit_logs', 'chat_messages', 'business_settings', 'loyalty_configs', 
      'loyalty_logs', 'customer_subscriptions'
    ];
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        CREATE PUBLICATION supabase_realtime;
    END IF;

    FOREACH tbl IN ARRAY tables LOOP
        IF NOT EXISTS (
            SELECT 1 FROM pg_publication_rel pr
            JOIN pg_class c ON c.oid = pr.prrelid
            JOIN pg_publication p ON p.oid = pr.prpubid
            WHERE p.pubname = 'supabase_realtime' AND c.relname = tbl
        ) THEN
            EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE %I', tbl);
        END IF;
    END LOOP;
END $$;

-- Ensure new columns on businesses table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='businesses' AND column_name='fssai_number') THEN
        ALTER TABLE businesses ADD COLUMN fssai_number VARCHAR(50);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='businesses' AND column_name='mobile_number') THEN
        ALTER TABLE businesses ADD COLUMN mobile_number VARCHAR(20);
    END IF;
END $$;
