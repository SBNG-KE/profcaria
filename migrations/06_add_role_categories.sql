-- Create role_categories table
CREATE TABLE IF NOT EXISTS role_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug TEXT UNIQUE NOT NULL, -- key used in code (e.g. 'engineering-software')
    label TEXT NOT NULL,
    keywords TEXT[] DEFAULT '{}',
    related TEXT[] DEFAULT '{}',
    is_custom BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE role_categories ENABLE ROW LEVEL SECURITY;

-- Policies
-- Everyone can read categories
CREATE POLICY "Public read access" ON role_categories
    FOR SELECT USING (true);

-- Authenticated users can create new categories (via the 'Add New' feature)
CREATE POLICY "authenticated_insert" ON role_categories
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Grants
GRANT SELECT, INSERT ON role_categories TO authenticated;
GRANT SELECT ON role_categories TO anon;

-- Seed Data (Massive List + New Requests)
INSERT INTO role_categories (slug, label, keywords, related, is_custom) VALUES
-- ENGINEERING
('engineering-software', 'Software Engineering', ARRAY['developer', 'software engineer', 'programmer', 'full stack', 'backend', 'frontend', 'devops', 'sre', 'ai software engineer', 'coding'], ARRAY['engineering-data', 'it-general'], FALSE),
('engineering-civil', 'Civil & Structural Engineering', ARRAY['civil engineer', 'structural engineer', 'construction', 'site engineer'], ARRAY['engineering-architecture'], FALSE),
('engineering-mechanical', 'Mechanical Engineering', ARRAY['mechanical engineer', 'hvac', 'automotive', 'manufacturing', 'robotics'], ARRAY['engineering-electrical'], FALSE),
('engineering-electrical', 'Electrical Engineering', ARRAY['electrical engineer', 'electronics', 'power', 'circuit', 'pcb'], ARRAY['engineering-mechanical'], FALSE),
('engineering-data', 'Data Engineering & Science', ARRAY['data engineer', 'data scientist', 'machine learning', 'ml engineer', 'ai engineer', 'ai researcher'], ARRAY['engineering-software'], FALSE),
('engineering-prompt', 'Prompt Engineering', ARRAY['prompt engineer', 'llm specialist', 'ai trainer'], ARRAY['engineering-software'], FALSE),
('engineering-robotics', 'Robotics Engineering', ARRAY['robotics engineer', 'automation', 'mechatronics'], ARRAY['engineering-mechanical', 'engineering-software'], FALSE),
('engineering-chemical', 'Chemical Engineering', ARRAY['chemical engineer', 'process engineer'], ARRAY['science-general'], FALSE),

-- HEALTHCARE
('healthcare-nursing', 'Nursing', ARRAY['nurse', 'rn', 'midwife'], ARRAY['healthcare-medical'], FALSE),
('healthcare-medical', 'Medical & Physicians', ARRAY['doctor', 'physician', 'surgeon', 'specialist'], ARRAY['healthcare-nursing'], FALSE),
('healthcare-allied', 'Allied Health', ARRAY['pharmacist', 'therapist', 'radiologist'], ARRAY['healthcare-medical'], FALSE),

-- BUSINESS
('business-marketing', 'Marketing & Advertising', ARRAY['marketing', 'brand', 'seo', 'social media', 'advertising'], ARRAY['business-sales'], FALSE),
('business-sales', 'Sales & Business Development', ARRAY['sales', 'account executive', 'bd'], ARRAY['business-marketing'], FALSE),
('business-hr', 'Human Resources', ARRAY['hr', 'recruiter', 'talent'], ARRAY['admin'], FALSE),
('business-finance', 'Finance & Accounting', ARRAY['accountant', 'finance', 'auditor'], ARRAY['business-management'], FALSE),
('business-management', 'Management & Operations', ARRAY['manager', 'director', 'operations', 'executive'], ARRAY['business-hr'], FALSE),

-- DESIGN & MEDIA
('design-creative', 'Design & Creative', ARRAY['designer', 'graphic', 'ui/ux', 'creative'], ARRAY['design-product'], FALSE),
('design-product', 'Product Design & Management', ARRAY['product manager', 'product designer', 'pm'], ARRAY['engineering-software'], FALSE),
('media-arts', 'Arts, Media & Entertainment', ARRAY['writer', 'editor', 'artist', 'musician', 'video'], ARRAY['design-creative'], FALSE),

-- TRADES & SERVICES
('trades', 'Trades & Services', ARRAY['electrician', 'plumber', 'mechanic', 'technician'], ARRAY['engineering-general'], FALSE),
('hospitality', 'Hospitality & Tourism', ARRAY['chef', 'hotel', 'waiter', 'travel'], ARRAY['customer-service'], FALSE),
('customer-service', 'Customer Service', ARRAY['support', 'call center'], ARRAY['business-sales'], FALSE),
('security', 'Security & Safety', ARRAY['security guard', 'police', 'safety'], ARRAY['legal'], FALSE),

-- SCIENCE & ED
('science-general', 'Science & Research', ARRAY['scientist', 'biologist', 'chemist', 'researcher'], ARRAY['education'], FALSE),
('education', 'Education & Training', ARRAY['teacher', 'tutor', 'professor'], ARRAY['science-general'], FALSE),

-- OTHER
('legal', 'Legal', ARRAY['lawyer', 'attorney', 'legal'], ARRAY['business-management'], FALSE),
('logistics', 'Logistics & Supply Chain', ARRAY['logistics', 'driver', 'warehouse'], ARRAY['trades'], FALSE),
('real-estate', 'Real Estate', ARRAY['real estate agent', 'property manager'], ARRAY['business-sales'], FALSE),
('agriculture', 'Agriculture', ARRAY['farmer', 'agronomist'], ARRAY['science-general'], FALSE),
('other', 'Other', ARRAY[''], ARRAY[''], FALSE)

ON CONFLICT (slug) DO NOTHING;
