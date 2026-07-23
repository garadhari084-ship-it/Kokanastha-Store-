-- Run this in your Supabase SQL Editor to seed the initial business and settings

INSERT INTO public.businesses (id, name, gstin, pan, billing_address, shipping_address, email, phone, invoice_prefix, tax_rate_default)
VALUES (
  'b1111111-1111-1111-1111-111111111111', 
  'Kokanastha Faral & Sweets', 
  '27AABCK1234F1ZM', 
  'AABCK1234F', 
  'Shop 14, Station Road, Borivali West, Mumbai, MH 400092', 
  'Godown 3, Industrial Estate, Dahisar East, Mumbai, MH 400068', 
  'ops@kokanasthafaral.com', 
  '+91 98200 12345', 
  'KF-', 
  5.00
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.business_settings (business_id, low_stock_limit, barcode_format, qr_size, enable_email_alerts, enable_sms_alerts, theme)
VALUES (
  'b1111111-1111-1111-1111-111111111111',
  10,
  'CODE-128',
  150,
  false,
  false,
  'light'
) ON CONFLICT (business_id) DO NOTHING;

INSERT INTO public.categories (id, name, business_id, active)
VALUES (
  'c1111111-1111-1111-1111-111111111111',
  'Sweets',
  'b1111111-1111-1111-1111-111111111111',
  true
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.categories (id, name, business_id, active)
VALUES (
  'c2222222-2222-2222-2222-222222222222',
  'Namkeen',
  'b1111111-1111-1111-1111-111111111111',
  true
) ON CONFLICT (id) DO NOTHING;

