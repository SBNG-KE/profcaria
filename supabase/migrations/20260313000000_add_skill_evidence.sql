-- Migration to add evidence link column to professional skills
ALTER TABLE professional.skills ADD COLUMN IF NOT EXISTS enc_document_url TEXT;
