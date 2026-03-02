-- Create professional_radar_stats table
CREATE TABLE IF NOT EXISTS public.professional_radar_stats (
    professional_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    depth_score INTEGER NOT NULL CHECK (depth_score >= 0 AND depth_score <= 100),
    execution_speed INTEGER NOT NULL CHECK (execution_speed >= 0 AND execution_speed <= 100),
    collaboration_index INTEGER NOT NULL CHECK (collaboration_index >= 0 AND collaboration_index <= 100),
    creativity_score INTEGER NOT NULL CHECK (creativity_score >= 0 AND creativity_score <= 100),
    ai_reasoning TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.professional_radar_stats ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Public profiles are viewable by everyone." ON public.professional_radar_stats FOR SELECT USING (true);

CREATE POLICY "Users can update their own radar stats." ON public.professional_radar_stats FOR ALL USING (
    auth.uid() = professional_id
);

-- Realtime replication
alter publication supabase_realtime add table public.professional_radar_stats;
