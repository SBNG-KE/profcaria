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
        keywords: ['developer', 'software engineer', 'programmer', 'full stack', 'backend', 'frontend', 'devops', 'sre', 'web developer', 'mobile developer', 'ios', 'android', 'react', 'node', 'python', 'java', 'typescript'],
        related: ['engineering-data', 'it-general', 'design-product']
    },
    'engineering-civil': {
        label: 'Civil & Structural Engineering',
        keywords: ['civil engineer', 'structural engineer', 'construction engineer', 'site engineer', 'building engineer', 'infrastructure', 'project engineer', 'quantity surveyor'],
        related: ['engineering-mechanical', 'engineering-architecture']
    },
    'engineering-mechanical': {
        label: 'Mechanical Engineering',
        keywords: ['mechanical engineer', 'hvac engineer', 'automotive engineer', 'manufacturing engineer', 'maintenance engineer', 'plant engineer'],
        related: ['engineering-civil', 'engineering-electrical']
    },
    'engineering-electrical': {
        label: 'Electrical & Electronics',
        keywords: ['electrical engineer', 'electronics engineer', 'power engineer', 'embedded systems', 'control systems', 'instrumentation'],
        related: ['engineering-mechanical', 'it-general']
    },
    'engineering-data': {
        label: 'Data Engineering & Science',
        keywords: ['data engineer', 'data scientist', 'machine learning', 'ml engineer', 'ai engineer', 'data analyst', 'bi analyst', 'analytics', 'big data'],
        related: ['engineering-software', 'it-general']
    },
    'engineering-architecture': {
        label: 'Architecture',
        keywords: ['architect', 'urban planner', 'interior designer', 'landscape architect', 'building designer'],
        related: ['engineering-civil', 'design-creative']
    },

    // IT & TECHNOLOGY
    'it-general': {
        label: 'IT & Technology',
        keywords: ['it', 'information technology', 'systems administrator', 'network engineer', 'it support', 'helpdesk', 'technical support', 'it manager', 'system analyst'],
        related: ['engineering-software', 'it-security']
    },
    'it-security': {
        label: 'Cybersecurity',
        keywords: ['security engineer', 'cybersecurity', 'infosec', 'penetration tester', 'soc analyst', 'security analyst', 'information security'],
        related: ['it-general', 'engineering-software']
    },

    // HEALTHCARE
    'healthcare-nursing': {
        label: 'Nursing',
        keywords: ['nurse', 'registered nurse', 'rn', 'clinical nurse', 'health nurse', 'staff nurse', 'nurse practitioner', 'nursing officer', 'ward nurse', 'icu nurse', 'it health nurse'],
        related: ['healthcare-medical', 'healthcare-allied']
    },
    'healthcare-medical': {
        label: 'Medical & Physicians',
        keywords: ['doctor', 'physician', 'surgeon', 'medical officer', 'consultant', 'specialist', 'general practitioner', 'gp', 'dentist', 'psychiatrist'],
        related: ['healthcare-nursing', 'healthcare-allied']
    },
    'healthcare-allied': {
        label: 'Allied Health',
        keywords: ['pharmacist', 'physiotherapist', 'therapist', 'lab technician', 'radiologist', 'radiographer', 'medical technologist', 'optometrist', 'nutritionist', 'dietitian'],
        related: ['healthcare-nursing', 'healthcare-medical']
    },

    // BUSINESS
    'business-marketing': {
        label: 'Marketing & Advertising',
        keywords: ['marketing', 'digital marketing', 'brand manager', 'marketing manager', 'seo', 'sem', 'content marketing', 'social media manager', 'growth', 'advertising', 'communications'],
        related: ['business-sales', 'design-creative']
    },
    'business-sales': {
        label: 'Sales & Business Development',
        keywords: ['sales', 'account executive', 'business development', 'sales manager', 'sales representative', 'account manager', 'bd manager', 'key account'],
        related: ['business-marketing', 'business-management']
    },
    'business-finance': {
        label: 'Finance & Accounting',
        keywords: ['finance', 'accountant', 'auditor', 'financial analyst', 'controller', 'cfo', 'bookkeeper', 'tax', 'treasury', 'investment'],
        related: ['business-management']
    },
    'business-hr': {
        label: 'Human Resources',
        keywords: ['hr', 'human resources', 'recruiter', 'talent acquisition', 'people ops', 'hr manager', 'compensation', 'benefits', 'employee relations'],
        related: ['business-management', 'admin']
    },
    'business-management': {
        label: 'Management & Operations',
        keywords: ['manager', 'director', 'operations manager', 'coo', 'project manager', 'program manager', 'general manager', 'team lead', 'supervisor', 'head of'],
        related: ['business-hr', 'business-sales', 'business-finance']
    },

    // DESIGN
    'design-creative': {
        label: 'Design & Creative',
        keywords: ['designer', 'ux designer', 'ui designer', 'graphic designer', 'creative director', 'visual designer', 'brand designer', 'illustrator', 'animator'],
        related: ['business-marketing', 'engineering-software']
    },
    'design-product': {
        label: 'Product Design & Management',
        keywords: ['product manager', 'product designer', 'pm', 'product owner', 'product lead', 'ux researcher', 'product strategist'],
        related: ['design-creative', 'engineering-software']
    },

    // LEGAL & ADMIN
    'legal': {
        label: 'Legal',
        keywords: ['lawyer', 'attorney', 'legal counsel', 'paralegal', 'legal officer', 'advocate', 'barrister', 'solicitor', 'compliance'],
        related: ['business-management']
    },
    'admin': {
        label: 'Administration & Office',
        keywords: ['admin', 'administrative assistant', 'secretary', 'receptionist', 'office manager', 'executive assistant', 'personal assistant', 'clerk'],
        related: ['business-hr']
    },

    // EDUCATION
    'education': {
        label: 'Education & Training',
        keywords: ['teacher', 'instructor', 'professor', 'lecturer', 'trainer', 'tutor', 'education', 'academic', 'curriculum', 'teaching'],
        related: ['business-hr']
    },

    // CUSTOMER SERVICE
    'customer-service': {
        label: 'Customer Service & Support',
        keywords: ['customer service', 'customer support', 'call center', 'client relations', 'customer success', 'support specialist'],
        related: ['business-sales', 'admin']
    },

    // LOGISTICS
    'logistics': {
        label: 'Logistics & Supply Chain',
        keywords: ['logistics', 'supply chain', 'warehouse', 'inventory', 'procurement', 'shipping', 'distribution', 'fleet'],
        related: ['business-management']
    },

    // OTHER
    'other': {
        label: 'Other',
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
