-- Create saved_posts table
CREATE TABLE IF NOT EXISTS public.saved_posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    professional_post_id UUID REFERENCES professional.posts(id) ON DELETE CASCADE,
    employer_post_id UUID REFERENCES employer.posts(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT one_post_reference_required CHECK (
        (professional_post_id IS NOT NULL AND employer_post_id IS NULL) OR
        (professional_post_id IS NULL AND employer_post_id IS NOT NULL)
    ),
    CONSTRAINT unique_save_per_user_prof UNIQUE (user_id, professional_post_id),
    CONSTRAINT unique_save_per_user_emp UNIQUE (user_id, employer_post_id)
);

-- Enable RLS
ALTER TABLE public.saved_posts ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own saved posts"
    ON public.saved_posts FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can save posts"
    ON public.saved_posts FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unsave posts"
    ON public.saved_posts FOR DELETE
    USING (auth.uid() = user_id);

-- Add index for performance
CREATE INDEX idx_saved_posts_user ON public.saved_posts(user_id);

-- Grant Permissions
GRANT ALL ON TABLE public.saved_posts TO postgres;
GRANT ALL ON TABLE public.saved_posts TO service_role;
GRANT SELECT, INSERT, DELETE ON TABLE public.saved_posts TO authenticated;
