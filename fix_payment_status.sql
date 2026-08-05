-- Fix check constraints for payment_status
ALTER TABLE sales_orders DROP CONSTRAINT IF EXISTS sales_orders_payment_status_check;
ALTER TABLE sales_orders ADD CONSTRAINT sales_orders_payment_status_check CHECK (payment_status IN ('Unpaid', 'Partial', 'Paid'));

ALTER TABLE purchase_orders DROP CONSTRAINT IF EXISTS purchase_orders_payment_status_check;
ALTER TABLE purchase_orders ADD CONSTRAINT purchase_orders_payment_status_check CHECK (payment_status IN ('Unpaid', 'Partial', 'Paid'));
