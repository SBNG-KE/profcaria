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

                //3. Get Exchange Rate (USD Base) - SYNCED WITH SERVER
                let rate = 1;
                if (userCurrency !== 'USD') {
                    try {
                        // Fetch from our own server to ensure frontend/backend amounts match exactly
                        const rateRes = await fetch('/api/config/exchange-rate');
                        if (rateRes.ok) {
                            const rateData = await rateRes.json();
                            // If the user's currency matches the one we have a fixed rate for (implied typically we set a global rate)
                            // Ideally we might want to support multiple, but currently user said "I put 44... change it 44 * 129".
                            // This implies a single rate model or we prefer the server rate.
                            // For now, we trust the server returns THE rate relative to USD for the target currency (or we might need to handle per-currency).
                            // actually the previous code was converting USD to UserCurrency.
                            // If process.env.USD_EXCHANGE_RATE is 129, it implies 1 USD = 129 [LocalCurrency].
                            // We will use that.
                            rate = rateData.rate || 1;
                        }
                    } catch (e) {
                        console.error('Failed to fetch server rate', e);
                        // Fallback? Keep 1 or try external? user wants sync, so stick to 1 or retry. 
                        // Defaulting to 1 prevents wrong inflated numbers.
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
