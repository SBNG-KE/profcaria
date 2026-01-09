const DISCOUNT = parseFloat(process.env.YEARLY_DISCOUNT_PERCENT || '20') / 100;

const BASIC_MO = parseFloat(process.env.PRICE_BASIC_MONTHLY || '25');
const PRO_MO = parseFloat(process.env.PRICE_PRO_MONTHLY || '99');
const ENT_MO = parseFloat(process.env.PRICE_ENTERPRISE_MONTHLY || '250');

export const BILLING_PLANS = {
    free: {
        name: 'Free',
        priceMonthly: 0,
        priceYearly: 0,
        limits: {
            jobs: 1, // per month
            connections: 1, // per month
            analyticsHistoryYears: 1,
            topMatches: 0, // Access denied
            restrictedLocations: false,
        },
        features: [
            '1 Active Job Post',
            '1 Connection/mo',
            '1 Year Analytics History',
            'Standard Candidates'
        ]
    },
    basic: {
        name: 'Basic',
        priceMonthly: BASIC_MO,
        priceYearly: BASIC_MO * 12 * (1 - DISCOUNT),
        limits: {
            jobs: 5,
            connections: 9999, // Unspecified? "basics now is better with 5 jobs" -> implied unlim connections or standard? Assuming unlim for paying users unless specified. User said "free plan will have 1 active job... that means their connections or employment is just one per month... basic now is better..." -> implies Basic lifts this? I'll assume standard flow limits apply but connections per se might be effectively unlimited for paid.
            analyticsHistoryYears: 3,
            topMatches: 2, // per month
            restrictedLocations: true, // "basic... has access to top match... no restricted areas mentioned as denied"
        },
        features: [
            '5 Active Jobs',
            '3 Years Analytics History',
            'Top Match Access (Limited)',
            'Restricted Locations'
        ]
    },
    pro: {
        name: 'Pro',
        priceMonthly: PRO_MO,
        priceYearly: PRO_MO * 12 * (1 - DISCOUNT),
        limits: {
            jobs: 30, // per month
            connections: 9999,
            analyticsHistoryYears: 999, // Unlimited
            topMatches: 15, // per month (shared/overall)
            restrictedLocations: true,
        },
        features: [
            '30 Active Jobs',
            'Unlimited Analytics',
            'Priority Support',
            'More Top Matches'
        ]
    },
    enterprise: {
        name: 'Enterprise',
        priceMonthly: ENT_MO,
        priceYearly: ENT_MO * 12 * (1 - DISCOUNT),
        limits: {
            jobs: 9999, // Unlimited
            connections: 9999,
            analyticsHistoryYears: 999,
            topMatches: 9999, // "capped to 100 per job" - handled in logic
            restrictedLocations: true,
        },
        features: [
            'Unlimited Jobs',
            'Unlimited Analytics',
            'Dedicated Account Manager',
            'Max Top Matches'
        ]
    }
} as const;

export type PlanType = keyof typeof BILLING_PLANS;
