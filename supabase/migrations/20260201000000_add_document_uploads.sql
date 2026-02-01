-- Migration: Add Document Uploads Support
-- This creates the uploaded_documents table for storing file metadata
-- and adds default_doc_mode preference to the users table

-- 1. Create uploaded_documents table in professional schema
CREATE TABLE IF NOT EXISTS professional.uploaded_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    enc_name TEXT NOT NULL,
    enc_blob_url TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_uploaded_documents_user_id 
ON professional.uploaded_documents(user_id);

-- 3. Add RLS policies
ALTER TABLE professional.uploaded_documents ENABLE ROW LEVEL SECURITY;

-- Allow users to manage their own uploaded documents
CREATE POLICY "Users can manage own uploaded docs"
ON professional.uploaded_documents
FOR ALL
USING (auth.uid() = user_id);

-- Service role full access
CREATE POLICY "Service role full access to uploaded docs"
ON professional.uploaded_documents
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 4. Add default_doc_mode preference to users table
ALTER TABLE professional.users 
ADD COLUMN IF NOT EXISTS default_doc_mode TEXT DEFAULT 'writing' 
CHECK (default_doc_mode IN ('writing', 'upload'));

-- 5. Grant permissions
GRANT ALL ON professional.uploaded_documents TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON professional.uploaded_documents TO authenticated;
