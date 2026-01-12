import { ROLE_CATEGORIES, RoleCategoryKey, getCategoryInfo } from './role-categories';

// Calculate similarity between two role strings (0-100)
export function calculateRoleSimilarity(role1: string, role2: string, jobCategory?: string): number {
    if (!role1 || !role2) return 0;

    role1 = role1.toLowerCase().trim();
    role2 = role2.toLowerCase().trim();

    // 1. Exact text match
    if (role1 === role2) return 100;
    if (role1.includes(role2) || role2.includes(role1)) return 90;

    // 2. Category-based matching
    const cat1 = detectRoleCategory(role1);
    const cat2 = detectRoleCategory(role2);

    // If job has explicit category, use it instead of detecting for role2 (which is the job title)
    const effectiveJobCategory = jobCategory ? (jobCategory as RoleCategoryKey) : cat2;

    // Same category match
    if (cat1 && effectiveJobCategory && cat1 === effectiveJobCategory) {
        return 80;
    }

    // Related category match
    if (cat1 && effectiveJobCategory) {
        const info1 = getCategoryInfo(cat1);
        const related = info1.related as readonly string[];
        if (related.includes(effectiveJobCategory)) {
            return 60;
        }
    }

    // 3. Keyword overlap (if categories didn't match or weren't found)
    const words1 = extractKeywords(role1);
    const words2 = extractKeywords(role2);

    const overlap = words1.filter(w => words2.includes(w)).length;
    if (overlap > 0) {
        // Boost if words are significant
        const score = Math.min(overlap * 30, 50);
        return score;
    }

    return 0;
}

// Helper to detect category from role text
export function detectRoleCategory(role: string): RoleCategoryKey | null {
    role = role.toLowerCase();

    let bestMatch: RoleCategoryKey | null = null;
    let maxKeywords = 0;

    Object.entries(ROLE_CATEGORIES).forEach(([key, val]) => {
        // Check for exact keywords
        const matches = val.keywords.filter(k => role.includes(k));

        if (matches.length > maxKeywords) {
            maxKeywords = matches.length;
            bestMatch = key as RoleCategoryKey;
        } else if (matches.length === maxKeywords && maxKeywords > 0) {
            // Tie-breaker? prioritize specific over general (e.g. software vs it)
            if (key.includes('engineering') && !bestMatch?.includes('engineering')) {
                bestMatch = key as RoleCategoryKey;
            }
        }
    });

    return bestMatch;
}

// Helper to extract meaningful words
function extractKeywords(text: string): string[] {
    const stopWords = ['a', 'an', 'the', 'senior', 'junior', 'lead', 'manager', 'director', 'intern', 'specialist', 'officer', 'executive', 'technician'];
    return text.toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .split(/\s+/)
        .filter(w => w.length > 2 && !stopWords.includes(w));
}

// Find all related roles for target matching
export function findRelatedRoles(role: string): string[] {
    const category = detectRoleCategory(role);
    if (!category) return [role];

    const info = getCategoryInfo(category);
    return [...info.keywords];
}
