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
        priceMonthlyOffer: BASIC_OFFER > 0 ? BASIC_OFFER : null,
        limits: {
            jobs: 5,
            connections: 9999,
            analyticsHistoryYears: 3,
            topMatches: 2,
            restrictedLocations: true,
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
        priceMonthlyOffer: PRO_OFFER > 0 ? PRO_OFFER : null,
        limits: {
            jobs: 30,
            connections: 9999,
            analyticsHistoryYears: 999,
            topMatches: 15,
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
        priceMonthlyOffer: ENT_OFFER > 0 ? ENT_OFFER : null,
        limits: {
            jobs: 9999,
            connections: 9999,
            analyticsHistoryYears: 999,
            topMatches: 9999,
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
