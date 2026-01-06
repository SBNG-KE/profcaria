-- Add Stripe Customer ID to companies
ALTER TABLE employer.companies 
ADD COLUMN IF NOT EXISTS stripe_customer_id_index TEXT,
ADD COLUMN IF NOT EXISTS enc_stripe_customer_id TEXT;

-- Create Subscriptions Table
CREATE TABLE IF NOT EXISTS employer.subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES employer.companies(id) ON DELETE CASCADE,
    stripe_subscription_id TEXT NOT NULL,
    status TEXT NOT NULL, -- active, incomplete, canceled, past_due
    current_period_end TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Payments Table
CREATE TABLE IF NOT EXISTS employer.payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES employer.companies(id) ON DELETE CASCADE,
    stripe_payment_id TEXT UNIQUE NOT NULL,
    amount INTEGER NOT NULL, -- In cents
    currency TEXT NOT NULL DEFAULT 'usd',
    status TEXT NOT NULL, -- succeeded, failed
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE employer.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE employer.payments ENABLE ROW LEVEL SECURITY;

-- Allow companies to view their own subscriptions
CREATE POLICY "Companies can view own subscriptions" ON employer.subscriptions
    FOR SELECT
    USING (auth.uid() = company_id);

-- Allow companies to view their own payments
CREATE POLICY "Companies can view own payments" ON employer.payments
    FOR SELECT
    USING (auth.uid() = company_id);

-- Grants
GRANT ALL ON employer.subscriptions TO postgres, service_role;
GRANT SELECT ON employer.subscriptions TO authenticated;

GRANT ALL ON employer.payments TO postgres, service_role;
GRANT SELECT ON employer.payments TO authenticated;
