-- Add enc_website column to employer.companies
ALTER TABLE "employer"."companies" ADD COLUMN IF NOT EXISTS "enc_website" text;
