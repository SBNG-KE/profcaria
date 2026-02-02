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
            maxProfileViewPerJob: 0,
            restrictedLocations: false,
            maxApplicationsPerJob: 9999, // Unlimited applications
        },
        features: [
            '1 Job Post per month',
            '1 Year Analytics History',
            'Basic Candidate Search'
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
            topMatches: 5, // 5 Total Credits
            maxProfileViewPerJob: 1, // Show 1 at a time
            restrictedLocations: false,
            maxApplicationsPerJob: 9999, // Unlimited applications
        },
        features: [
            '5 Job Posts per month',
            '3 Years Analytics History',
            '5 AI Top Match Credits',
            'Preview 1 Top Candidate/Job'
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
            topMatches: 15, // 15 Total Credits
            maxProfileViewPerJob: 2, // 2 per job view
            restrictedLocations: true,
            maxApplicationsPerJob: 9999, // Unlimited applications
        },
        features: [
            '30 Job Posts per month',
            'Unlimited Analytics History',
            '15 AI Top Match Credits (3/job)',
            'Preview 2 Top Candidates/Job',
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
            topMatches: 9999, // Unlimited
            maxProfileViewPerJob: 100, // Show 100 at a time
            restrictedLocations: true,
            maxApplicationsPerJob: 9999, // Unlimited applications
        },
        features: [
            'Unlimited Job Posts',
            'Unlimited Analytics',
            'Unlimited AI Top Matches',
            'Preview 100 Candidates/Job',
            'Location-Restricted Jobs',
            'Personal Account Manager'
        ]
    }
} as const;

export type PlanType = keyof typeof BILLING_PLANS;

// --- PROFESSIONAL PLANS ---
const PROF_BASIC = parseFloat(process.env.NEXT_PUBLIC_PRICE_PROF_BASIC || '5');
const PROF_STANDARD = parseFloat(process.env.NEXT_PUBLIC_PRICE_PROF_STANDARD || '15');
const PROF_PREMIUM = parseFloat(process.env.NEXT_PUBLIC_PRICE_PROF_PREMIUM || '30');

export const PROFESSIONAL_PLANS = {
    free: {
        name: 'Free',
        badge: 'none',
        priceMonthly: 0,
        features: [
            'Standard Profile',
            'Basic Feed Access'
        ]
    },
    basic: {
        name: 'Basic',
        badge: 'gray', // Gray Checkmark
        priceMonthly: PROF_BASIC,
        features: [
            'Gray Verification Badge',
            '1.5x Boost Visibility',
            'Appear in Verified Filters'
        ]
    },
    standard: {
        name: 'Standard',
        badge: 'blue', // Blue Checkmark
        priceMonthly: PROF_STANDARD,
        features: [
            'Blue Verification Badge',
            '3.5x Boost Visibility',
            'Stand Out to Employers',
            'Enhanced Profile Views'
        ]
    },
    premium: {
        name: 'Premium',
        badge: 'gold', // Gold Checkmark
        priceMonthly: PROF_PREMIUM,
        features: [
            'Gold Verification Badge',
            '8x Maximum Visibility',
            'Top of Employer Searches',
            'Get Contacted First'
        ]
    }
} as const;

export type ProfessionalPlanType = keyof typeof PROFESSIONAL_PLANS;

// --- AD PACKAGES (One-time purchases) ---
export const AD_PACKAGES = {
    'boost_1k': {
        id: 'boost_1k',
        name: '1,000 Views Boost',
        price: 10, // $10
        credits: 10, // Internal currency
        description: 'Get approx 1000 extra views on your post.'
    },
    'boost_5k': {
        id: 'boost_5k',
        name: '5,000 Views Boost',
        price: 40, // $40
        credits: 40,
        description: 'Significant reach expansion for major announcements.'
    }
} as const;
