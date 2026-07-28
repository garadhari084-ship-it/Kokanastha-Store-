ALTER TABLE loyalty_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_loyalty_logs ON loyalty_logs;
DROP POLICY IF EXISTS tenant_isolation_customer_subscriptions ON customer_subscriptions;
DROP POLICY IF EXISTS tenant_isolation_chat_messages ON chat_messages;

DROP POLICY IF EXISTS dev_public_loyalty_logs ON loyalty_logs;
CREATE POLICY dev_public_loyalty_logs ON loyalty_logs FOR ALL USING (true);
DROP POLICY IF EXISTS dev_public_customer_subscriptions ON customer_subscriptions;
CREATE POLICY dev_public_customer_subscriptions ON customer_subscriptions FOR ALL USING (true);
DROP POLICY IF EXISTS dev_public_chat_messages ON chat_messages;
CREATE POLICY dev_public_chat_messages ON chat_messages FOR ALL USING (true);
ALTER TABLE loyalty_configs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_loyalty_configs ON loyalty_configs;
DROP POLICY IF EXISTS dev_public_loyalty_configs ON loyalty_configs;
CREATE POLICY dev_public_loyalty_configs ON loyalty_configs FOR ALL USING (true);
