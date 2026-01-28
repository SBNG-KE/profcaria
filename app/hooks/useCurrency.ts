import { useState, useEffect } from 'react';
import { COUNTRY_TO_CURRENCY, CURRENCY_SYMBOLS } from '@/lib/currency-map';

interface CurrencyData {
    currency: string;
    symbol: string;
    rate: number;
    loading: boolean;
    error: string | null;
}

export const useCurrency = () => {
    const [data, setData] = useState<CurrencyData>({
        currency: 'USD',
        symbol: '$',
        rate: 1,
        loading: true,
        error: null
    });

    const fetchCurrencyData = async () => {
        try {
            // 1. Get User Location & Currency Code
            // Priority: User Profile > IP Detection > Default USD
            let userCurrency = 'USD';

            // Try fetching user profile first (Professional)
            try {
                const profileRes = await fetch('/api/professional/profile');
                if (profileRes.ok) {
                    const profileData = await profileRes.json();
                    if (profileData.profile && profileData.profile.location) {
                        userCurrency = detectCurrencyFromLocation(profileData.profile.location);
                    }
                } else {
                    // If professional fetch fails (e.g. 401/403), try Employer Profile
                    const employerRes = await fetch('/api/employer/profile');
                    if (employerRes.ok) {
                        const empData = await employerRes.json();
                        if (empData.profile && empData.profile.location) {
                            userCurrency = detectCurrencyFromLocation(empData.profile.location);
                        }
                    }
                }
            } catch (e) {
                // Ignore profile fetch error (might be logged out)
            }

            if (userCurrency !== 'USD') {
                console.log('Detected currency from profile:', userCurrency);
            }

            // Fallback to IP if still USD (or if profile fetch failed/didn't have location)
            if (userCurrency === 'USD') {
                try {
                    const ipRes = await fetch('/api/location');
                    if (ipRes.ok) {
                        const ipData = await ipRes.json();
                        userCurrency = ipData.currency || 'USD';
                    }
                } catch (e) {
                    console.warn('Location detection failed, defaulting to USD');
                }
            }

            // 2. Get Exchange Rate
            let rate = 1;
            if (userCurrency !== 'USD') {
                try {
                    const rateRes = await fetch('/api/config/exchange-rate');
                    if (rateRes.ok) {
                        const rateData = await rateRes.json();
                        if (rateData.rate && !isNaN(rateData.rate)) {
                            rate = Number(rateData.rate);
                        }
                    }
                } catch (e) {
                    console.error('Failed to fetch server rate', e);
                }
            }

            // 3. Determine Symbol
            const symbol = getSymbol(userCurrency);

            const newData = {
                currency: userCurrency,
                symbol,
                rate,
                loading: false,
                error: null
            };

            // 4. Update State & Cache
            // Only update if data actually changed to avoid unnecessary renders
            setData(prev => {
                const isDifferent = prev.currency !== newData.currency || prev.rate !== newData.rate;
                if (isDifferent) {
                    localStorage.setItem('profcaria_currency_v3', JSON.stringify({
                        timestamp: Date.now(),
                        data: newData
                    }));
                    return newData;
                }
                return { ...prev, loading: false }; // Ensure loading is set to false even if data didn't change
            });

        } catch (error) {
            console.error('Currency Error:', error);
            setData(prev => ({ ...prev, loading: false, error: 'Failed to load currency data' }));
        }
    };

    useEffect(() => {
        // 1. Optimistic Load from Cache
        const cached = localStorage.getItem('profcaria_currency_v3');
        if (cached) {
            try {
                const parsed = JSON.parse(cached);
                // "Stale-While-Revalidate": Use cached data immediately
                setData({ ...parsed.data, loading: false }); // Show content instantly

                // If cache is older than 1 hour, definitely need to revalidate. 
                // However, with SWR, we usually revalidate ALWAYS on mount to be safe, unless very fresh.
                // Let's revalidate always on mount to ensure "stuck" issues are fixed.
            } catch (e) {
                console.error('Cache parse error', e);
                localStorage.removeItem('profcaria_currency_v3');
            }
        }

        // 2. Network Fetch (Always run to update/correct data)
        fetchCurrencyData();

        // 3. Re-validate on Window Focus (Optional but good for PWAs)
        const onFocus = () => fetchCurrencyData();
        window.addEventListener('focus', onFocus);
        return () => window.removeEventListener('focus', onFocus);
    }, []);

    const convert = (amountUSD: number) => {
        if (!amountUSD) return 0;
        return Math.round(amountUSD * data.rate);
    };

    const format = (amountUSD: number) => {
        const converted = convert(amountUSD);
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: data.currency,
            maximumFractionDigits: 0
        }).format(converted);
    };

    return { ...data, convert, format };
};

function getSymbol(currency: string): string {
    return CURRENCY_SYMBOLS[currency] || currency + ' ';
}

function detectCurrencyFromLocation(location: string): string {
    const loc = location.toLowerCase();
    if (loc.includes('kenya') || loc.includes('nairobi')) return 'KES';
    if (loc.includes('nigeria') || loc.includes('lagos')) return 'NGN';
    if (loc.includes('ghana') || loc.includes('accra')) return 'GHS';
    if (loc.includes('south africa') || loc.includes('johannesburg') || loc.includes('cape town')) return 'ZAR';
    if (loc.includes('india') || loc.includes('mumbai') || loc.includes('delhi')) return 'INR';
    if (loc.includes('uk') || loc.includes('united kingdom') || loc.includes('london')) return 'GBP';
    if (loc.includes('europe') || loc.includes('germany') || loc.includes('france') || loc.includes('spain')) return 'EUR';
    if (loc.includes('japan') || loc.includes('tokyo')) return 'JPY';
    if (loc.includes('canada') || loc.includes('toronto') || loc.includes('vancouver')) return 'CAD';
    if (loc.includes('australia') || loc.includes('sydney')) return 'AUD';
    return 'USD';
}
