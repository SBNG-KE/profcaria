import { useState, useEffect } from 'react';

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

    useEffect(() => {
        const fetchData = async () => {
            try {
                // 1. Check Cache
                const cached = localStorage.getItem('profcaria_currency_v2');
                if (cached) {
                    const parsed = JSON.parse(cached);
                    // Cache valid for 1 hour (reduced from 24h for fresher rates)
                    if (Date.now() - parsed.timestamp < 3600000) {
                        setData(parsed.data);
                        return;
                    }
                }

                // 2. Get User Location & Currency Code
                let userCurrency = 'USD';
                try {
                    const ipRes = await fetch('/api/location');
                    if (ipRes.ok) {
                        const ipData = await ipRes.json();
                        userCurrency = ipData.currency || 'USD';
                    }
                } catch (e) {
                    console.warn('Location detection failed, defaulting to USD');
                }

                // 3. Get Exchange Rate
                let rate = 1;
                // Always fetch rate if not USD to ensure we have the latest fixed rate from env
                if (userCurrency !== 'USD') {
                    try {
                        const rateRes = await fetch('/api/config/exchange-rate');
                        if (rateRes.ok) {
                            const rateData = await rateRes.json();
                            // Ensure we use the rate if it's valid, otherwise fallback to 1
                            if (rateData.rate && !isNaN(rateData.rate)) {
                                rate = Number(rateData.rate);
                            }
                        }
                    } catch (e) {
                        console.error('Failed to fetch server rate', e);
                    }
                }

                // 4. Determine Symbol
                const symbol = getSymbol(userCurrency);

                const newData = {
                    currency: userCurrency,
                    symbol,
                    rate,
                    loading: false,
                    error: null
                };

                // 5. Cache Data
                localStorage.setItem('profcaria_currency_v2', JSON.stringify({
                    timestamp: Date.now(),
                    data: newData
                }));

                setData(newData);

            } catch (error) {
                console.error('Currency Error:', error);
                setData(prev => ({ ...prev, loading: false, error: 'Failed to load currency data' }));
            }
        };

        fetchData();
    }, []);

    const convert = (amountUSD: number) => {
        if (!amountUSD) return 0;
        // If rate is > 10 (implying broad integer currency like KES/NGN), round to nearest 10 or 100 for clean numbers?
        // For now, let's just round to integer.
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
    const symbols: Record<string, string> = {
        USD: '$',
        EUR: '€',
        GBP: '£',
        KES: 'KSh',
        NGN: '₦',
        GHS: '₵',
        ZAR: 'R',
        INR: '₹',
        JPY: '¥',
        CAD: 'C$',
        AUD: 'A$'
    };
    return symbols[currency] || currency + ' ';
}
