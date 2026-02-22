const BASIC_MO = parseFloat(process.env.PRICE_BASIC_MONTHLY || '0');
const BASIC_OFFER = parseFloat(process.env.PRICE_BASIC_MONTHLY_OFFER || '0');

const PRO_MO = parseFloat(process.env.PRICE_PRO_MONTHLY || '0');
const PRO_OFFER = parseFloat(process.env.PRICE_PRO_MONTHLY_OFFER || '0');

const ENT_MO = parseFloat(process.env.PRICE_ENTERPRISE_MONTHLY || '0');
const ENT_OFFER = parseFloat(process.env.PRICE_ENTERPRISE_MONTHLY_OFFER || '0');

export const BILLING_PLANS = {
    free: {
        name: 'Free',
        priceMonthly: 0,
        priceMonthlyOffer: 0,
        limits: {
            jobs: 1, // per month
            connections: 1, // per month
            analyticsHistoryYears: 1,
            topMatchesPerJob: 2, // 2 credits for the single job
            maxProfileViewPerJob: 2,
            restrictedLocations: false,
            maxApplicationsPerJob: 9999, // Unlimited applications
        },
        features: [
            '1 Job Post per month',
            '1 Year Analytics History',
            '2 AI Top Match Credits'
        ]
    },
    basic: {
        name: 'Basic',
        priceMonthly: BASIC_MO,
        priceMonthlyOffer: BASIC_OFFER > 0 ? BASIC_OFFER : null,
        limits: {
            jobs: 3,
            connections: 9999,
            analyticsHistoryYears: 3,
            topMatchesPerJob: 5, // 5 credits per job post
            maxProfileViewPerJob: 5,
            restrictedLocations: false,
            maxApplicationsPerJob: 9999, // Unlimited applications
        },
        features: [
            '3 Job Posts per month',
            '3 Years Analytics History',
            '5 AI Top Match Credits/job'
        ]
    },
    pro: {
        name: 'Pro',
        priceMonthly: PRO_MO,
        priceMonthlyOffer: PRO_OFFER > 0 ? PRO_OFFER : null,
        limits: {
            jobs: 15,
            connections: 9999,
            analyticsHistoryYears: 999,
            topMatchesPerJob: 30, // 30 credits per job post
            maxProfileViewPerJob: 30,
            restrictedLocations: true,
            maxApplicationsPerJob: 9999, // Unlimited applications
        },
        features: [
            '15 Job Posts per month',
            'Unlimited Analytics History',
            '30 AI Top Match Credits/job',
            'Location-Restricted Jobs',
            'Priority Support'
        ]
    },
    enterprise: {
        name: 'Enterprise',
        priceMonthly: ENT_MO,
        priceMonthlyOffer: ENT_OFFER > 0 ? ENT_OFFER : null,
        limits: {
            jobs: 9999,
            connections: 9999,
            analyticsHistoryYears: 999,
            topMatchesPerJob: 9999, // Unlimited
            maxProfileViewPerJob: 100, // Show 100 at a time (paginated)
            restrictedLocations: true,
            maxApplicationsPerJob: 9999, // Unlimited applications
        },
        features: [
            'Unlimited Job Posts',
            'Unlimited Analytics',
            'Unlimited AI Top Matches',
            'Location-Restricted Jobs'
        ]
    }
} as const;

export type PlanType = keyof typeof BILLING_PLANS;

// --- FOLLOWER-BASED BADGE TIERS (Shared for BOTH Professionals & Employers) ---
// Badges are EARNED via follower count, not purchased.
export const BADGE_TIERS = {
    none: {
        name: 'Standard',
        badge: 'none',
        minFollowers: 0,
        label: 'Standard Account'
    },
    gray: {
        name: 'Verified',
        badge: 'gray',
        minFollowers: 5_000,
        label: 'Verified Account'
    },
    blue: {
        name: 'Notable',
        badge: 'blue',
        minFollowers: 100_000,
        label: 'Notable Account'
    },
    gold: {
        name: 'Top',
        badge: 'gold',
        minFollowers: 1_000_000,
        label: 'Top Account'
    }
} as const;

export type BadgeTier = keyof typeof BADGE_TIERS;

/**
 * Determine the badge tier from a follower count.
 * Works for both professionals and employers.
 */
export function getBadgeForFollowerCount(followerCount: number): BadgeTier {
    if (followerCount >= BADGE_TIERS.gold.minFollowers) return 'gold';
    if (followerCount >= BADGE_TIERS.blue.minFollowers) return 'blue';
    if (followerCount >= BADGE_TIERS.gray.minFollowers) return 'gray';
    return 'none';
}

/**
 * Get the next badge tier info for progress display.
 * Returns null if already at the highest tier.
 */
export function getNextBadgeTier(followerCount: number): { tier: BadgeTier; followersNeeded: number } | null {
    if (followerCount >= BADGE_TIERS.gold.minFollowers) return null; // Already top
    if (followerCount >= BADGE_TIERS.blue.minFollowers) {
        return { tier: 'gold', followersNeeded: BADGE_TIERS.gold.minFollowers - followerCount };
    }
    if (followerCount >= BADGE_TIERS.gray.minFollowers) {
        return { tier: 'blue', followersNeeded: BADGE_TIERS.blue.minFollowers - followerCount };
    }
    return { tier: 'gray', followersNeeded: BADGE_TIERS.gray.minFollowers - followerCount };
}

// --- DEPRECATED: Keep for backward compatibility during transition ---
export const PROFESSIONAL_PLANS = {
    free: { name: 'Free', badge: 'none', priceMonthly: 0, features: ['Standard Profile', 'Full Feed Access'] },
    basic: { name: 'Basic', badge: 'gray', priceMonthly: 0, features: ['Earned at 5,000 followers'] },
    standard: { name: 'Standard', badge: 'blue', priceMonthly: 0, features: ['Earned at 100,000 followers'] },
    premium: { name: 'Premium', badge: 'gold', priceMonthly: 0, features: ['Earned at 1,000,000 followers'] }
} as const;

export type ProfessionalPlanType = keyof typeof PROFESSIONAL_PLANS;

// --- AD PACKAGES (One-time purchases) ---
// Prices configurable via environment variables (in USD)
const BOOST_1K_PRICE = parseFloat(process.env.NEXT_PUBLIC_BOOST_1K_PRICE || '10');
const BOOST_5K_PRICE = parseFloat(process.env.NEXT_PUBLIC_BOOST_5K_PRICE || '40');

export const AD_PACKAGES = {
    'boost_1k': {
        id: 'boost_1k',
        name: '1,000 Views Boost',
        price: BOOST_1K_PRICE,
        credits: 10,
        description: 'Get approx 1000 extra views on your post.'
    },
    'boost_5k': {
        id: 'boost_5k',
        name: '5,000 Views Boost',
        price: BOOST_5K_PRICE,
        credits: 40,
        description: 'Significant reach expansion for major announcements.'
    }
} as const;
