
-- Create Short Links Table
CREATE TABLE IF NOT EXISTS public.short_links (
    id text PRIMARY KEY, -- The short code (e.g., 'AbCd12')
    original_url text NOT NULL,
    created_at timestamptz DEFAULT now(),
    expires_at timestamptz
);

-- Enable RLS (Read Public, Write Admin/Service Role)
ALTER TABLE public.short_links ENABLE ROW LEVEL SECURITY;

-- Allow public read access (for redirection)
CREATE POLICY "Allow public read access" ON public.short_links
    FOR SELECT USING (true);

-- Allow service role full access
-- (Supabase service role bypasses RLS by default, but good to be explicit if needed, 
-- though typically we rely on service_role key in the API)
