CREATE TABLE IF NOT EXISTS loyalty_configs (
    business_id UUID PRIMARY KEY REFERENCES businesses(id) ON DELETE CASCADE,
    enabled BOOLEAN DEFAULT true,
    spend_per_point NUMERIC DEFAULT 100,
    point_value NUMERIC DEFAULT 1,
    silver_min_spend NUMERIC DEFAULT 0,
    gold_min_spend NUMERIC DEFAULT 10000,
    platinum_min_spend NUMERIC DEFAULT 20000,
    gold_multiplier NUMERIC DEFAULT 1.25,
    platinum_multiplier NUMERIC DEFAULT 1.5,
    welcome_bonus_points NUMERIC DEFAULT 50,
    birthday_bonus_points NUMERIC DEFAULT 100,
    point_expiry_days NUMERIC DEFAULT 365,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
ALTER TABLE loyalty_configs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS dev_public_loyalty_configs ON loyalty_configs;
CREATE POLICY dev_public_loyalty_configs ON loyalty_configs FOR ALL USING (true);
