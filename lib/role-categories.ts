/**
 * Role Categories for Job Matching Algorithm
 * Used by:
 * 1. Job creation dropdown (employer selects category)
 * 2. Algorithm scoring (match professionals to jobs)
 */

export const ROLE_CATEGORIES = {
    // ENGINEERING - SOFTWARE
    'engineering-software': {
        label: 'Software Engineering',
        keywords: ['developer', 'software engineer', 'programmer', 'full stack', 'backend', 'frontend', 'devops', 'sre', 'web developer', 'mobile developer', 'ios', 'android', 'react', 'node', 'python', 'java', 'typescript', 'coding'],
        related: ['engineering-data', 'it-general', 'design-product']
    },
    'engineering-civil': {
        label: 'Civil & Structural Engineering',
        keywords: ['civil engineer', 'structural engineer', 'construction engineer', 'site engineer', 'building engineer', 'infrastructure', 'project engineer', 'quantity surveyor', 'highway engineer'],
        related: ['engineering-mechanical', 'engineering-architecture']
    },
    'engineering-mechanical': {
        label: 'Mechanical Engineering',
        keywords: ['mechanical engineer', 'hvac engineer', 'automotive engineer', 'manufacturing engineer', 'maintenance engineer', 'plant engineer', 'piping engineer', 'thermal'],
        related: ['engineering-civil', 'engineering-electrical']
    },
    'engineering-electrical': {
        label: 'Electrical & Electronics',
        keywords: ['electrical engineer', 'electronics engineer', 'power engineer', 'embedded systems', 'control systems', 'instrumentation', 'pcb designer', 'telecom engineer'],
        related: ['engineering-mechanical', 'it-general']
    },
    'engineering-chemical': {
        label: 'Chemical & Manufacturing',
        keywords: ['chemical engineer', 'process engineer', 'manufacturing engineer', 'quality control', 'production engineer', 'biochemical', 'petrochemical'],
        related: ['engineering-mechanical', 'science-general']
    },
    'engineering-data': {
        label: 'Data Engineering & Science',
        keywords: ['data engineer', 'data scientist', 'machine learning', 'ml engineer', 'ai engineer', 'data analyst', 'bi analyst', 'analytics', 'big data', 'statistician'],
        related: ['engineering-software', 'it-general']
    },
    'engineering-architecture': {
        label: 'Architecture & Planning',
        keywords: ['architect', 'urban planner', 'interior designer', 'landscape architect', 'building designer', 'draftsman', 'autocad', 'revit'],
        related: ['engineering-civil', 'design-creative']
    },
    'engineering-general': {
        label: 'General Engineering',
        keywords: ['engineer', 'engineering manager', 'project engineer', 'technical lead', 'chief engineer'],
        related: ['engineering-mechanical', 'engineering-civil']
    },

    // IT & TECHNOLOGY
    'it-general': {
        label: 'IT & Technology Support',
        keywords: ['it', 'information technology', 'systems administrator', 'network engineer', 'it support', 'helpdesk', 'technical support', 'it manager', 'system analyst', 'desktop support'],
        related: ['engineering-software', 'it-security']
    },
    'it-security': {
        label: 'Cybersecurity',
        keywords: ['security engineer', 'cybersecurity', 'infosec', 'penetration tester', 'soc analyst', 'security analyst', 'information security', 'ethical hacker'],
        related: ['it-general', 'engineering-software']
    },
    'it-network': {
        label: 'Networking & Infrastructure',
        keywords: ['network administrator', 'network engineer', 'cloud architect', 'cloud engineer', 'infrastructure engineer', 'cissp', 'ccna', 'aws', 'azure'],
        related: ['it-general', 'engineering-software']
    },

    // HEALTHCARE
    'healthcare-nursing': {
        label: 'Nursing',
        keywords: ['nurse', 'registered nurse', 'rn', 'clinical nurse', 'health nurse', 'staff nurse', 'nurse practitioner', 'nursing officer', 'ward nurse', 'icu nurse', 'it health nurse', 'midwife'],
        related: ['healthcare-medical', 'healthcare-allied']
    },
    'healthcare-medical': {
        label: 'Medical & Physicians',
        keywords: ['doctor', 'physician', 'surgeon', 'medical officer', 'consultant', 'specialist', 'general practitioner', 'gp', 'dentist', 'psychiatrist', 'cardiologist', 'pediatrician'],
        related: ['healthcare-nursing', 'healthcare-allied']
    },
    'healthcare-allied': {
        label: 'Allied Health',
        keywords: ['pharmacist', 'physiotherapist', 'therapist', 'lab technician', 'radiologist', 'radiographer', 'medical technologist', 'optometrist', 'nutritionist', 'dietitian', 'occupational therapist'],
        related: ['healthcare-nursing', 'healthcare-medical']
    },
    'healthcare-care': {
        label: 'Care & Social Services',
        keywords: ['caregiver', 'care assistant', 'social worker', 'support worker', 'disability support', 'aged care', 'childcare', 'nanny'],
        related: ['healthcare-nursing']
    },
    'healthcare-pharma': {
        label: 'Pharmaceutical & Biotech',
        keywords: ['pharmacist', 'pharmacy technician', 'clinical research', 'regulatory affairs', 'medical affairs', 'drug safety', 'biotech'],
        related: ['healthcare-medical', 'science-general']
    },

    // BUSINESS & FINANCE
    'business-marketing': {
        label: 'Marketing & Advertising',
        keywords: ['marketing', 'digital marketing', 'brand manager', 'marketing manager', 'seo', 'sem', 'content marketing', 'social media manager', 'growth', 'advertising', 'communications', 'pr', 'public relations'],
        related: ['business-sales', 'design-creative']
    },
    'business-sales': {
        label: 'Sales & Business Development',
        keywords: ['sales', 'account executive', 'business development', 'sales manager', 'sales representative', 'account manager', 'bd manager', 'key account', 'inside sales', 'telesales'],
        related: ['business-marketing', 'business-management']
    },
    'business-finance': {
        label: 'Finance & Accounting',
        keywords: ['finance', 'accountant', 'auditor', 'financial analyst', 'controller', 'cfo', 'bookkeeper', 'tax', 'treasury', 'investment', 'payroll', 'credit analyst'],
        related: ['business-management']
    },
    'business-hr': {
        label: 'Human Resources',
        keywords: ['hr', 'human resources', 'recruiter', 'talent acquisition', 'people ops', 'hr manager', 'compensation', 'benefits', 'employee relations', 'training', 'l&d'],
        related: ['business-management', 'admin']
    },
    'business-management': {
        label: 'Management & Operations',
        keywords: ['manager', 'director', 'operations manager', 'coo', 'project manager', 'program manager', 'general manager', 'team lead', 'supervisor', 'head of', 'executive', 'ceo'],
        related: ['business-hr', 'business-sales', 'business-finance']
    },
    'business-consulting': {
        label: 'Consulting & Strategy',
        keywords: ['consultant', 'management consultant', 'strategy', 'business analyst', 'advisor', 'researcher'],
        related: ['business-management', 'business-finance']
    },

    // DESIGN & CREATIVE
    'design-creative': {
        label: 'Design & Creative',
        keywords: ['designer', 'ux designer', 'ui designer', 'graphic designer', 'creative director', 'visual designer', 'brand designer', 'illustrator', 'animator', 'art director'],
        related: ['business-marketing', 'engineering-software']
    },
    'design-product': {
        label: 'Product Design & Management',
        keywords: ['product manager', 'product designer', 'pm', 'product owner', 'product lead', 'ux researcher', 'product strategist'],
        related: ['design-creative', 'engineering-software']
    },
    'media-arts': {
        label: 'Arts, Media & Entertainment',
        keywords: ['writer', 'editor', 'journalist', 'content creator', 'videographer', 'photographer', 'musician', 'actor', 'artist', 'producer', 'director'],
        related: ['design-creative', 'business-marketing']
    },

    // LEGAL & ADMIN
    'legal': {
        label: 'Legal',
        keywords: ['lawyer', 'attorney', 'legal counsel', 'paralegal', 'legal officer', 'advocate', 'barrister', 'solicitor', 'compliance', 'judge'],
        related: ['business-management']
    },
    'admin': {
        label: 'Administration & Office',
        keywords: ['admin', 'administrative assistant', 'secretary', 'receptionist', 'office manager', 'executive assistant', 'personal assistant', 'clerk', 'data entry'],
        related: ['business-hr']
    },

    // EDUCATION & SCIENCE
    'education': {
        label: 'Education & Training',
        keywords: ['teacher', 'instructor', 'professor', 'lecturer', 'trainer', 'tutor', 'education', 'academic', 'curriculum', 'teaching', 'early childhood', 'principal'],
        related: ['business-hr']
    },
    'science-general': {
        label: 'Science & Research',
        keywords: ['scientist', 'researcher', 'biologist', 'chemist', 'physicist', 'technician', 'lab assistant', 'environmentalist', 'geologist'],
        related: ['engineering-chemical', 'healthcare-medical']
    },

    // SERVICE & HOSPITALITY
    'customer-service': {
        label: 'Customer Service & Support',
        keywords: ['customer service', 'customer support', 'call center', 'client relations', 'customer success', 'support specialist', 'guest service'],
        related: ['business-sales', 'admin']
    },
    'hospitality': {
        label: 'Hospitality & Tourism',
        keywords: ['chef', 'cook', 'waiter', 'bartender', 'hotel manager', 'travel agent', 'restaurant manager', 'hostess', 'housekeeping', 'concierge'],
        related: ['customer-service']
    },
    'retail': {
        label: 'Retail & Consumer',
        keywords: ['store manager', 'retail assistant', 'sales associate', 'merchandiser', 'cashier', 'shop assistant', 'buyer'],
        related: ['business-sales', 'customer-service']
    },

    // TRADES & MANUAL
    'logistics': {
        label: 'Logistics & Supply Chain',
        keywords: ['logistics', 'supply chain', 'warehouse', 'inventory', 'procurement', 'shipping', 'distribution', 'fleet', 'driver', 'truck driver', 'courier'],
        related: ['business-management', 'trades']
    },
    'trades': {
        label: 'Trades & Services',
        keywords: ['electrician', 'plumber', 'carpenter', 'mechanic', 'welder', 'technician', 'construction worker', 'painter', 'hvac technician', 'landscaper'],
        related: ['engineering-civil', 'logistics']
    },
    'manufacturing': {
        label: 'Manufacturing & Production',
        keywords: ['machine operator', 'production worker', 'assembler', 'factory worker', 'supervisor', 'qa', 'packer'],
        related: ['engineering-mechanical', 'logistics']
    },

    // OTHER SECTORS
    'real-estate': {
        label: 'Real Estate & Property',
        keywords: ['real estate agent', 'property manager', 'leasing agent', 'broker', 'valuer', 'facility manager'],
        related: ['business-sales', 'engineering-civil']
    },
    'agriculture': {
        label: 'Agriculture & Farming',
        keywords: ['farmer', 'agronomist', 'farm manager', 'agricultural', 'horticulture', 'veterinarian'],
        related: ['science-general']
    },
    'non-profit': {
        label: 'Non-Profit & NGO',
        keywords: ['ngo', 'non-profit', 'volunteer', 'fundraiser', 'community manager', 'program coordinator'],
        related: ['business-management', 'social-services']
    },
    'security': {
        label: 'Security & Safety',
        keywords: ['security guard', 'safety officer', 'hse', 'investigator', 'police', 'firefighter'],
        related: ['legal', 'trades']
    },

    // GENERAL
    'other': {
        label: 'Other / Uncategorized',
        keywords: [],
        related: []
    }
} as const;

export type RoleCategoryKey = keyof typeof ROLE_CATEGORIES;

// Dropdown options for UI
export const ROLE_CATEGORY_OPTIONS = Object.entries(ROLE_CATEGORIES).map(([key, val]) => ({
    value: key,
    label: val.label
}));

// Get category info
export function getCategoryInfo(categoryKey: string) {
    return ROLE_CATEGORIES[categoryKey as RoleCategoryKey] || ROLE_CATEGORIES.other;
}

// Get all keywords for a category including related categories
export function getExpandedKeywords(categoryKey: string): string[] {
    const category = getCategoryInfo(categoryKey);
    const keywords = [...category.keywords];

    // Add keywords from related categories (with lower priority later in matching)
    category.related.forEach(relatedKey => {
        const relatedCategory = ROLE_CATEGORIES[relatedKey as RoleCategoryKey];
        if (relatedCategory) {
            keywords.push(...relatedCategory.keywords);
        }
    });

    return keywords;
}
