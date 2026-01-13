/**
 * Experience Level Detection Library
 * Determines experience level (Junior, Mid, Senior, Executive) from text
 */

export type ExperienceLevel = 'junior' | 'mid' | 'senior' | 'executive';

export const LEVEL_HIERARCHY: Record<ExperienceLevel, number> = {
    'junior': 1,
    'mid': 2,
    'senior': 3,
    'executive': 4
};

const EXPERIENCE_KEYWORDS = {
    junior: [
        'junior', 'jr', 'entry level', 'entry-level', 'graduate', 'intern', 'trainee', 'apprentice',
        '0-1 year', '0-2 years', '1-2 years', 'fresh graduate', 'fresher', 'associate', 'novice'
    ],
    mid: [
        'mid level', 'mid-level', 'intermediate', '2+ years', '3+ years', '4+ years', '3-5 years',
        '2-4 years', '2-5 years', 'experienced'
    ],
    senior: [
        'senior', 'sr', 'lead', 'principal', 'staff', 'expert', 'advanced', '5+ years', '7+ years',
        '8+ years', '10+ years', 'architect', 'mentor', 'specialist', 'manager'
    ],
    executive: [
        'director', 'vp', 'vice president', 'head of', 'chief', 'c-level', 'executive', 'founder',
        'partner', 'managing director'
    ]
};

/**
 * Detects the experience level from a string (job title or description)
 */
export function detectExperienceLevel(text: string): ExperienceLevel | null {
    if (!text) return null;

    // Check specific ordering: Exec > Senior > Mid > Junior (to avoid partial matches like "Senior" matching "Senior" but "Junior" matching "Junior Architect"?)
    // Actually, check in reverse order of seniority to catch highest implication?
    // "Junior Project Manager" -> Is it Junior or Manager (Senior)? Context matters.
    // Usually modifiers "Junior", "Senior" precede the title.

    const normalized = text.toLowerCase();

    for (const level of ['executive', 'senior', 'mid', 'junior'] as const) {
        if (EXPERIENCE_KEYWORDS[level].some(k => normalized.includes(k))) {
            return level;
        }
    }

    return null;
}

/**
 * Calculates a compatibility score between two levels (0-100)
 */
export function experienceLevelMatch(level1: ExperienceLevel | null, level2: ExperienceLevel | null): number {
    if (!level1 || !level2) return 50; // Neutral if unknown

    const rank1 = LEVEL_HIERARCHY[level1];
    const rank2 = LEVEL_HIERARCHY[level2];

    if (rank1 === rank2) return 100;
    if (Math.abs(rank1 - rank2) === 1) return 60; // One level apart (ok)
    if (Math.abs(rank1 - rank2) === 2) return 20; // Two levels apart (unlikely)

    return 0; // Too far apart (Junior vs Exec)
}

/**
 * Experience Year Ranges supported by preferences
 */
export const EXPERIENCE_YEAR_RANGES = [
    { value: '0-3', label: '0-3 Years', min: 0, max: 3 },
    { value: '4-7', label: '4-7 Years', min: 4, max: 7 },
    { value: '8-11', label: '8-11 Years', min: 8, max: 11 },
    { value: '12-15', label: '12-15 Years', min: 12, max: 15 },
    { value: '16+', label: '16+ Years', min: 16, max: 99 }
];

/**
 * Extracts years of experience required from job text
 * Returns the minimum years mentioned, or null if not found
 */
export function extractYearsFromText(text: string): number | null {
    if (!text) return null;

    const normalized = text.toLowerCase();

    // Patterns to match: "5+ years", "3-5 years", "minimum 5 years", "at least 3 years"
    const patterns = [
        /(\d+)\s*\+\s*years?/gi,                    // "5+ years"
        /(\d+)\s*-\s*\d+\s*years?/gi,               // "3-5 years" (take first number)
        /minimum\s*(?:of\s*)?(\d+)\s*years?/gi,     // "minimum 5 years"
        /at\s*least\s*(\d+)\s*years?/gi,            // "at least 3 years"
        /(\d+)\s*years?\s*(?:of\s*)?experience/gi,  // "5 years of experience"
        /experience[:\s]*(\d+)\s*years?/gi          // "experience: 5 years"
    ];

    let minYears: number | null = null;

    for (const pattern of patterns) {
        const matches = [...normalized.matchAll(pattern)];
        for (const match of matches) {
            const years = parseInt(match[1], 10);
            if (!isNaN(years) && (minYears === null || years < minYears)) {
                minYears = years;
            }
        }
    }

    return minYears;
}

/**
 * Checks if a years requirement falls within any of the selected ranges
 */
export function yearsMatchRange(years: number, ranges: string[]): boolean {
    if (!ranges || ranges.length === 0) return true; // No preference = match all

    for (const range of ranges) {
        const rangeConfig = EXPERIENCE_YEAR_RANGES.find(r => r.value === range);
        if (rangeConfig && years >= rangeConfig.min && years <= rangeConfig.max) {
            return true;
        }
    }
    return false;
}

/**
 * Calculates score based on years match (0-100)
 */
export function yearsMatchScore(jobYears: number | null, userRanges: string[]): number {
    if (!jobYears) return 50; // Unknown years = neutral
    if (!userRanges || userRanges.length === 0) return 50; // No preference = neutral

    if (yearsMatchRange(jobYears, userRanges)) {
        return 100; // Perfect match
    }

    // Check how far off the match is
    for (const range of userRanges) {
        const rangeConfig = EXPERIENCE_YEAR_RANGES.find(r => r.value === range);
        if (rangeConfig) {
            const distance = Math.min(
                Math.abs(jobYears - rangeConfig.min),
                Math.abs(jobYears - rangeConfig.max)
            );
            if (distance <= 2) return 60; // Close enough (1-2 years difference)
        }
    }

    return 20; // Too far from preferences
}
