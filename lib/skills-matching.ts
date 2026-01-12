/**
 * Skills Matching Library
 * Extracts and matches skills from unrestricted text (job descriptions, user profiles)
 */

const SKILL_KEYWORDS = {
    // PROGRAMMING & DEV
    programming: [
        'javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'ruby', 'php', 'swift', 'kotlin', 'go', 'rust',
        'react', 'angular', 'vue', 'next.js', 'node.js', 'express', 'django', 'flask', 'spring boot', 'laravel',
        'sql', 'postgresql', 'mysql', 'mongodb', 'redis', 'firebase', 'supabase', 'aws', 'azure', 'gcp', 'docker', 'kubernetes',
        'git', 'ci/cd', 'jenkins', 'github actions', 'graphql', 'rest api', 'microservices'
    ],

    // DATA & AI
    data: [
        'machine learning', 'deep learning', 'nlp', 'computer vision', 'tensorflow', 'pytorch', 'scikit-learn', 'pandas', 'numpy',
        'data analysis', 'data visualization', 'tableau', 'power bi', 'looker', 'sql', 'big query', 'snowflake', 'databricks',
        'spark', 'hadoop', 'kafka', 'etl', 'data warehousing', 'statistics', 'mathematics', 'a/b testing'
    ],

    // DESIGN
    design: [
        'figma', 'sketch', 'adobe xd', 'photoshop', 'illustrator', 'indesign', 'after effects', 'premiere pro',
        'ui design', 'ux design', 'user research', 'prototyping', 'wireframing', 'interaction design', 'visual design',
        'brand identity', 'typography', 'color theory', 'accessibility', 'wcag'
    ],

    // MARKETING
    marketing: [
        'seo', 'sem', 'google ads', 'facebook ads', 'instagram ads', 'linkedin ads', 'content marketing', 'copywriting',
        'social media marketing', 'email marketing', 'mailchimp', 'hubspot', 'google analytics', 'ga4', 'crm', 'salesforce',
        'market research', 'branding', 'pr', 'public relations', 'communications', 'growth hacking'
    ],

    // HEALTHCARE
    healthcare: [
        'patient care', 'electronic health records', 'ehr', 'emr', 'hippaa', 'bls', 'acls', 'cpr', 'triage',
        'clinical trials', 'medical terminology', 'phlebotomy', 'medication administration', 'vital signs',
        'patient education', 'care planning', 'diagnostic imaging', 'laboratory safety', 'infection control'
    ],

    // ENGINEERING (NON-SW)
    engineering: [
        'autocad', 'solidworks', 'revit', 'catia', 'ansys', 'matlab', 'simulink', 'plc', 'scada',
        'civil 3d', 'structural analysis', 'hvac', 'circuit design', 'pcb design', 'fpga', 'verilog',
        'manufacturing processes', 'six sigma', 'lean manufacturing', 'quality control', 'iso 9001'
    ],

    // BUSINESS & MANAGEMENT
    business: [
        'project management', 'agile', 'scrum', 'kanban', 'jira', 'confluence', 'asana', 'trello', 'monday.com',
        'strategic planning', 'business strategy', 'financial analysis', 'budgeting', 'forecasting', 'excel',
        'accounting', 'bookkeeping', 'quickbooks', 'xero', 'negotiation', 'leadership', 'team building',
        'risk management', 'supply chain', 'operations management'
    ],

    // LEGAL & ADMIN
    legal: [
        'contract law', 'corporate law', 'compliance', 'legal research', 'litigation', 'intellectual property',
        'administrative support', 'calendar management', 'travel arrangements', 'data entry', 'typing',
        'microsoft office', 'customer service', 'reception'
    ]
};

// Flattened list for fast searching
const ALL_SKILLS = Object.values(SKILL_KEYWORDS).flat();

/**
 * Extracts known skills from a block of text
 */
export function extractSkillsFromText(text: string): string[] {
    if (!text) return [];

    const normalizedText = text.toLowerCase();
    const foundSkills: Set<string> = new Set();

    // Checking for each skill - Optimized approach could be trie-based but this works for <1000 skills
    ALL_SKILLS.forEach(skill => {
        // Determine word boundaries to avoid partial matches (e.g. "java" in "javascript")
        // Simple regex: \bSKILL\b (escaped for special chars)
        const escapedSkill = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`\\b${escapedSkill}\\b`, 'i');

        if (regex.test(normalizedText)) {
            foundSkills.add(skill);
        }
    });

    return Array.from(foundSkills);
}

/**
 * Calculates overlap score between two skill sets (0-100)
 */
export function calculateSkillOverlap(skills1: string[], skills2: string[]): number {
    if (!skills1.length || !skills2.length) return 0;

    // Find intersection
    const intersection = skills1.filter(s => skills2.includes(s));

    if (intersection.length === 0) return 0;

    // Union size
    const unionSize = new Set([...skills1, ...skills2]).size;

    // Jaccard Index * 100
    // Formula: (Intersection / Union) * 100
    // But we want to favor matches even if one list is much longer, so let's use a modified score
    // Score based on coverage of the SMALLER set (usually the job requirements)
    const smallerSetSize = Math.min(skills1.length, skills2.length);
    const coverage = (intersection.length / smallerSetSize) * 100;

    return Math.round(coverage);
}
