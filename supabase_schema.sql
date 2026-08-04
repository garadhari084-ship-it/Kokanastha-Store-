-- SUPABASE POSTGRESQL SCHEMA FOR KOKANASTHA FARAL ERP
-- This schema represents the entities used in the application.

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Business
CREATE TABLE businesses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    gstin TEXT,
    pan TEXT,
    billing_address TEXT,
    shipping_address TEXT,
    email TEXT,
    phone TEXT,
    invoice_prefix TEXT,
    festive_invoice_prefix TEXT,
    tax_rate_default NUMERIC,
    currency_symbol TEXT,
    auto_backup BOOLEAN,
    low_stock_threshold INTEGER,
    audit_retention_days INTEGER,
    default_theme TEXT,
    enable_auto_whatsapp BOOLEAN,
    enable_auto_sms BOOLEAN,
    default_dispatch_zone TEXT,
    area_zones TEXT[],
    upi_id TEXT,
    bank_name TEXT,
    account_number TEXT,
    ifsc_code TEXT,
    account_holder TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Users
CREATE TABLE users_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    active BOOLEAN DEFAULT TRUE,
    password_hash TEXT,
    allowed_pages TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Categories
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Products
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    sku TEXT UNIQUE,
    barcode TEXT,
    qr_code TEXT,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    brand TEXT,
    unit TEXT,
    purchase_price NUMERIC,
    selling_price NUMERIC,
    mrp NUMERIC,
    gst_rate NUMERIC,
    hsn_code TEXT,
    current_stock INTEGER DEFAULT 0,
    min_stock_level INTEGER DEFAULT 10,
    batch_no TEXT,
    expiry_date DATE,
    rack_location TEXT,
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    rate_lmr NUMERIC,
    rate_abr NUMERIC,
    rate_ddr NUMERIC,
    rate_nr NUMERIC,
    purchase_unit TEXT,
    selling_unit TEXT,
    pack_size NUMERIC,
    auto_conversion BOOLEAN DEFAULT FALSE,
    is_combo BOOLEAN DEFAULT FALSE,
    combo_items JSONB
);

-- Customers
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    customer_group TEXT,
    area TEXT,
    gstin TEXT,
    pan TEXT,
    billing_address TEXT,
    shipping_address TEXT,
    email TEXT,
    phone TEXT,
    credit_limit NUMERIC DEFAULT 0,
    outstanding_amount NUMERIC DEFAULT 0,
    loyalty_points NUMERIC DEFAULT 0,
    lifetime_spend NUMERIC DEFAULT 0,
    loyalty_tier TEXT,
    is_loyal_member BOOLEAN DEFAULT FALSE,
    birthday DATE,
    anniversary DATE,
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Suppliers
CREATE TABLE suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    gstin TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    outstanding_amount NUMERIC DEFAULT 0,
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Purchase Orders
CREATE TABLE purchase_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number TEXT NOT NULL,
    supplier_id UUID REFERENCES suppliers(id),
    order_date DATE,
    delivery_date DATE,
    status TEXT,
    payment_status TEXT,
    paid_amount NUMERIC DEFAULT 0,
    payment_mode TEXT,
    payment_reference TEXT,
    payment_bank TEXT,
    payment_notes TEXT,
    payment_date DATE,
    payment_history JSONB,
    items JSONB NOT NULL,
    total_amount NUMERIC NOT NULL,
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sales Orders
CREATE TABLE sales_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number TEXT NOT NULL,
    customer_id UUID REFERENCES customers(id),
    customer_name TEXT,
    area TEXT,
    channel TEXT,
    time TEXT,
    is_overdue BOOLEAN DEFAULT FALSE,
    order_date DATE,
    delivery_date DATE,
    status TEXT,
    payment_status TEXT,
    payment_mode TEXT,
    paid_amount NUMERIC DEFAULT 0,
    payment_reference TEXT,
    payment_bank TEXT,
    payment_notes TEXT,
    payment_date DATE,
    payment_history JSONB,
    delivery_status TEXT,
    items JSONB NOT NULL,
    advance_booking BOOLEAN DEFAULT FALSE,
    festive_booking BOOLEAN DEFAULT FALSE,
    total_amount NUMERIC NOT NULL,
    is_updated BOOLEAN DEFAULT FALSE,
    discount_amount NUMERIC DEFAULT 0,
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    qr_code_data TEXT,
    delivery_partner TEXT,
    delivery_person_name TEXT,
    delivery_person_phone TEXT,
    tracking_number TEXT,
    dispatch_notes TEXT,
    dispatched_at TIMESTAMP WITH TIME ZONE,
    packing_started_at TIMESTAMP WITH TIME ZONE,
    packing_completed_at TIMESTAMP WITH TIME ZONE,
    rack_location TEXT,
    rack_section TEXT,
    points_earned NUMERIC DEFAULT 0,
    points_redeemed NUMERIC DEFAULT 0,
    loyalty_discount NUMERIC DEFAULT 0,
    subscription_id UUID
);

-- Stock Logs
CREATE TABLE stock_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    change_qty INTEGER NOT NULL,
    type TEXT NOT NULL,
    notes TEXT,
    created_by TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE
);

