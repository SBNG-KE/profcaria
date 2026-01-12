import { ROLE_CATEGORIES, RoleCategoryKey, getCategoryInfo } from './role-categories';

// Calculate similarity between two role strings (0-100)
export function calculateRoleSimilarity(role1: string, role2: string, jobCategories?: string[] | string): number {
    if (!role1 || !role2) return 0;

    role1 = role1.toLowerCase().trim();
    role2 = role2.toLowerCase().trim();

    // 1. Exact text match
    if (role1 === role2) return 100;
    if (role1.includes(role2) || role2.includes(role1)) return 90;

    // 2. Category-based matching
    const cat1 = detectRoleCategory(role1);

    // Normalize job categories to array (support legacy single string)
    const normalizedJobCats: string[] = Array.isArray(jobCategories)
        ? jobCategories
        : jobCategories ? [jobCategories] : [];

    // If no explicit categories, try to detect from role2 (job title)
    if (normalizedJobCats.length === 0) {
        const cat2 = detectRoleCategory(role2);
        if (cat2) normalizedJobCats.push(cat2);
    }

    // Check against ANY of the job categories
    let maxCategoryScore = 0;

    if (cat1 && normalizedJobCats.length > 0) {
        for (const jobCat of normalizedJobCats) {
            // Same category match
            if (cat1 === jobCat) {
                maxCategoryScore = Math.max(maxCategoryScore, 80);
            } else {
                // Related category match
                const info1 = getCategoryInfo(cat1);
                const related = info1.related as readonly string[];
                if (related.includes(jobCat)) {
                    maxCategoryScore = Math.max(maxCategoryScore, 60);
                }
            }
        }
    }

    if (maxCategoryScore > 0) return maxCategoryScore;


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
