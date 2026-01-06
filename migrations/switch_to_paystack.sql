-- Rename Columns in Employer Companies
ALTER TABLE employer.companies 
DROP COLUMN IF EXISTS enc_stripe_customer_id,
DROP COLUMN IF EXISTS stripe_customer_id_index;

ALTER TABLE employer.companies
ADD COLUMN IF NOT EXISTS enc_paystack_customer_code TEXT,
ADD COLUMN IF NOT EXISTS paystack_customer_code_index TEXT;

-- Rename Columns in Subscriptions
ALTER TABLE employer.subscriptions
DROP COLUMN IF EXISTS stripe_subscription_id;

ALTER TABLE employer.subscriptions
ADD COLUMN IF NOT EXISTS paystack_subscription_code TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS paystack_email_token TEXT; -- Helpful for managing subs

-- Rename Columns in Payments
ALTER TABLE employer.payments
DROP COLUMN IF EXISTS stripe_payment_id;

ALTER TABLE employer.payments
ADD COLUMN IF NOT EXISTS paystack_reference TEXT UNIQUE;
