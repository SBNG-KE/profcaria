'use client';

import React, { useState, useEffect } from 'react';
import { Gift, Sparkles, X, Loader2 } from 'lucide-react';

interface PromoBannerProps {
    type: 'professional' | 'employer';
    isDark?: boolean;
}

export default function EarlyAdopterBanner({ type, isDark = true }: PromoBannerProps) {
    const [status, setStatus] = useState<'loading' | 'eligible' | 'claimed' | 'expired' | 'hidden'>('loading');
    const [promoData, setPromoData] = useState<any>(null);
    const [claiming, setClaiming] = useState(false);
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        checkEligibility();
    }, []);

    const checkEligibility = async () => {
        try {
            const endpoint = type === 'professional'
                ? '/api/professional/promo/claim'
                : '/api/employer/promo/claim';

            const res = await fetch(endpoint);
            const data = await res.json();

            if (data.already_claimed) {
                setStatus('claimed');
                setPromoData(data);
            } else if (data.eligible) {
                setStatus('eligible');
                setPromoData(data);
            } else {
                setStatus('hidden'); // Not eligible, don't show banner
            }
        } catch (error) {
            setStatus('hidden');
        }
    };

    const claimPromo = async () => {
        setClaiming(true);
        try {
            const endpoint = type === 'professional'
                ? '/api/professional/promo/claim'
                : '/api/employer/promo/claim';

            const res = await fetch(endpoint, { method: 'POST' });
            const data = await res.json();

            if (data.success) {
                setStatus('claimed');
                setPromoData(data);
                // Refresh page to show new subscription
                setTimeout(() => window.location.reload(), 1500);
            }
        } catch (error) {
            console.error('Failed to claim promo:', error);
        } finally {
            setClaiming(false);
        }
    };

    if (status === 'loading') {
        return null; // Don't show anything while loading
    }

    if (status === 'hidden' || dismissed) {
        return null;
    }

    const planName = type === 'professional' ? 'Premium' : 'Pro';
    const duration = type === 'professional' ? '2 months' : '1 month';
    const spotsText = promoData?.spots_remaining
        ? `Only ${promoData.spots_remaining} spots left!`
        : '';

    if (status === 'claimed') {
        const expiryDate = new Date(promoData?.expires_at).toLocaleDateString();
        return (
            <div className={`relative p-6 rounded-2xl border mb-8 ${isDark ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-emerald-50 border-emerald-200'}`}>
                <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl ${isDark ? 'bg-emerald-500/20' : 'bg-emerald-100'}`}>
                        <Sparkles className="text-emerald-500" size={24} />
                    </div>
                    <div className="flex-1">
                        <h3 className={`font-bold text-lg ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
                            🎉 Early Adopter Bonus Active!
                        </h3>
                        <p className={`text-sm mt-1 ${isDark ? 'text-emerald-300/80' : 'text-emerald-600'}`}>
                            You're enjoying FREE {planName} until <strong>{expiryDate}</strong>. Thank you for being one of our first users!
                        </p>
                    </div>
                    <button
                        onClick={() => setDismissed(true)}
                        className={`p-1 rounded hover:bg-emerald-500/20 transition-colors ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}
                    >
                        <X size={18} />
                    </button>
                </div>
            </div>
        );
    }

    if (status === 'eligible') {
        return (
            <div className={`relative p-6 rounded-2xl border mb-8 overflow-hidden ${isDark ? 'bg-gradient-to-r from-yellow-500/10 via-orange-500/10 to-pink-500/10 border-yellow-500/30' : 'bg-gradient-to-r from-yellow-50 via-orange-50 to-pink-50 border-yellow-200'}`}>
                {/* Animated background */}
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/5 via-transparent to-pink-500/5 animate-pulse" />

                <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <div className={`p-3 rounded-xl ${isDark ? 'bg-yellow-500/20' : 'bg-yellow-100'}`}>
                        <Gift className="text-yellow-500" size={28} />
                    </div>
                    <div className="flex-1">
                        <h3 className={`font-bold text-lg flex items-center gap-2 ${isDark ? 'text-white' : 'text-black'}`}>
                            <Sparkles className="text-yellow-500" size={18} />
                            Exclusive Early Adopter Offer!
                        </h3>
                        <p className={`text-sm mt-1 ${isDark ? 'text-neutral-300' : 'text-neutral-600'}`}>
                            Get <strong className={isDark ? 'text-yellow-400' : 'text-yellow-600'}>{duration} FREE {planName}</strong> as one of our first users.
                            {spotsText && <span className={`ml-1 ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>{spotsText}</span>}
                        </p>
                    </div>
                    <button
                        onClick={claimPromo}
                        disabled={claiming}
                        className={`px-6 py-3 rounded-xl font-bold text-sm uppercase tracking-wider transition-all whitespace-nowrap flex items-center gap-2 ${isDark
                            ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-black hover:from-yellow-400 hover:to-orange-400 shadow-lg shadow-yellow-500/20'
                            : 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white hover:from-yellow-400 hover:to-orange-400 shadow-lg'
                            } ${claiming ? 'opacity-70 cursor-wait' : 'active:scale-95'}`}
                    >
                        {claiming ? (
                            <>
                                <Loader2 className="animate-spin" size={16} />
                                Claiming...
                            </>
                        ) : (
                            'Claim Now'
                        )}
                    </button>
                </div>
            </div>
        );
    }

    return null;
}
