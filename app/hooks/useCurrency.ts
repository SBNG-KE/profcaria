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
                const cached = localStorage.getItem('profcaria_currency_v1');
                if (cached) {
                    const parsed = JSON.parse(cached);
                    // Cache valid for 24h
                    if (Date.now() - parsed.timestamp < 86400000) {
                        setData(parsed.data);
                        return;
                    }
                }

                // 2. Get User Location & Currency Code
                let userCurrency = 'USD';
                try {
                    // Fetch from internal proxy to avoid ad-blockers/CORS
                    const ipRes = await fetch('/api/location');
                    if (ipRes.ok) {
                        const ipData = await ipRes.json();
                        userCurrency = ipData.currency || 'USD';
                    }
                } catch (e) {
                    console.warn('Location detection failed, defaulting to USD');
                }

                //3. Get Exchange Rate (USD Base)
                let rate = 1;
                if (userCurrency !== 'USD') {
                    try {
                        const rateRes = await fetch(`https://api.exchangerate-api.com/v4/latest/USD`);
                        if (rateRes.ok) {
                            const rateData = await rateRes.json();
                            rate = rateData.rates[userCurrency] || 1;
                        }
                    } catch (e) {
                        // Rate fetch failed, revert to USD
                        userCurrency = 'USD';
                        rate = 1;
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
                localStorage.setItem('profcaria_currency_v1', JSON.stringify({
                    timestamp: Date.now(),
                    data: newData
                }));

                setData(newData);

            } catch (error) {
                console.error('Currency Error:', error);
                // Fallback to USD on error
                setData(prev => ({ ...prev, loading: false, error: 'Failed to load currency data' }));
            }
        };

        fetchData();
    }, []);

    const convert = (amountUSD: number) => {
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
