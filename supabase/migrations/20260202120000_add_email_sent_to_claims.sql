-- Add email_sent column to promotion_claims table
ALTER TABLE public.promotion_claims ADD COLUMN IF NOT EXISTS email_sent boolean DEFAULT false;
