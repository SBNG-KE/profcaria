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
