-- Reference Requests table to track requests sent to previous employers
-- Run this migration in the Supabase SQL Editor

CREATE TABLE IF NOT EXISTS employer.reference_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Who is requesting the reference (current employer)
    requesting_company_id UUID NOT NULL,
    requesting_application_id UUID NOT NULL,
    
    -- Who is being asked for the reference (previous employer)
    target_company_id UUID NOT NULL,
    target_company_email TEXT NOT NULL,
    
    -- The professional being referenced
    professional_id UUID NOT NULL,
    
    -- The employment record being referenced (from target company)
    target_employment_id UUID NOT NULL,
    
    -- Request details (encrypted)
    enc_questions BYTEA, -- JSON array of selected question IDs
    enc_custom_message BYTEA, -- Optional custom message
    
    -- Status tracking
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'viewed', 'responded', 'declined')),
    
    -- Response (encrypted)
    enc_response BYTEA,
    responded_at TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_ref_requests_requesting_company ON employer.reference_requests(requesting_company_id);
CREATE INDEX IF NOT EXISTS idx_ref_requests_target_company ON employer.reference_requests(target_company_id);
CREATE INDEX IF NOT EXISTS idx_ref_requests_professional ON employer.reference_requests(professional_id);
CREATE INDEX IF NOT EXISTS idx_ref_requests_status ON employer.reference_requests(status);

-- Enable RLS
ALTER TABLE employer.reference_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Companies can view requests they sent or received
CREATE POLICY "Companies can view their reference requests" ON employer.reference_requests
    FOR SELECT USING (
        requesting_company_id = auth.uid() OR target_company_id = auth.uid()
    );

-- Policy: Companies can insert requests they are sending
CREATE POLICY "Companies can create reference requests" ON employer.reference_requests
    FOR INSERT WITH CHECK (
        requesting_company_id = auth.uid()
    );

-- Policy: Target companies can update requests they received (to respond)
CREATE POLICY "Target companies can respond to requests" ON employer.reference_requests
    FOR UPDATE USING (
        target_company_id = auth.uid()
    );

-- Grant permissions
GRANT ALL ON employer.reference_requests TO authenticated;
GRANT ALL ON employer.reference_requests TO service_role;

-- Add comment for documentation
COMMENT ON TABLE employer.reference_requests IS 'Tracks reference requests sent between employers for professional verification';
