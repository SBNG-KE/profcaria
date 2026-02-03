
"use client"

import React, { useState } from 'react';
import { X, TrendingUp, CheckCircle, Loader2 } from 'lucide-react';
import { useCurrency } from '@/app/hooks/useCurrency';
import { usePayment } from '@/app/hooks/usePayment';

interface PromotePostModalProps {
    post: any;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    isDark: boolean;
}

const AD_PACKAGES = {
    basic: {
        id: 'ad_basic',
        name: 'Starter Boost',
        views: '1,000',
        price: 10, // $10
        features: ['1,000 Guaranteed Views', 'Standard Feed Priority']
    },
    pro: {
        id: 'ad_pro',
        name: 'Pro Boost',
        views: '5,000',
        price: 40, // $40
        features: ['5,000 Guaranteed Views', 'High Feed Priority', 'Analytics Report']
    }
};

export default function PromotePostModal({ post, isOpen, onClose, onSuccess, isDark }: PromotePostModalProps) {
    // State for Sliders
    const [dailyBudget, setDailyBudget] = useState(5); // Default $5 daily
    const [duration, setDuration] = useState(3); // Default 3 days

    const { currency: currencyCode, symbol: currencySymbol, rate: exchangeRate, loading: currencyLoading } = useCurrency();
    const { startPayment, isLoading: paymentLoading } = usePayment();
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // SYSTEM CONSTANTS (Simulated for AI Logic)
    const TOTAL_USERS = 500000; // Simulated user base for "Reach" calculation visualization (User request: "see how it will look")
    // In production, this would be fetched. For now, we mock it to show the UI scaling.

    if (!isOpen) return null;

    const formatPrice = (usd: number) => {
        if (currencyLoading) return '...';
        return `${currencySymbol}${new Intl.NumberFormat(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(usd * exchangeRate)}`;
    };

    const totalCost = dailyBudget * duration;

    // Dynamic Reach Calculation (AI Simulation)
    // Base CPM assumption: $5 CPM => 200 views per $1.
    // Reach Range: +/- 20% variance based on "AI matching"
    const viewsPerDollar = 150;
    const baseReach = dailyBudget * viewsPerDollar;
    const minReach = Math.floor(baseReach * 0.8);
    const maxReach = Math.floor(baseReach * 1.4);

    const formatNumber = (num: number) => {
        return new Intl.NumberFormat('en-US', { notation: "compact", compactDisplay: "short" }).format(num);
    };

    const handlePromote = () => {
        setMessage(null);

        startPayment({
            plan: 'custom_boost',
            isAd: true,
            postId: post.id,
            budget: totalCost, // Payment processes TOTAL
            duration: duration,
            onSuccess: () => {
                setMessage({ type: 'success', text: 'Promotion active! Your investment has been received.' });
                setTimeout(() => {
                    onSuccess();
                    onClose();
                }, 2000);
            },
            onError: (err) => setMessage({ type: 'error', text: err })
        });
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className={`relative w-full max-w-lg rounded-3xl p-8 shadow-2xl scale-100 animate-in zoom-in-95 duration-200 ${isDark ? 'bg-neutral-900 border border-neutral-800' : 'bg-white'}`}>
                <button
                    onClick={onClose}
                    className={`absolute top-4 right-4 p-2 rounded-full transition-colors ${isDark ? 'hover:bg-neutral-800 text-neutral-400' : 'hover:bg-neutral-100 text-neutral-500'}`}
                >
                    <X size={20} />
                </button>

                <div className="text-center mb-8">
                    <div className="mx-auto w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center mb-4">
                        <TrendingUp className="text-blue-500" size={24} />
                    </div>
                    <h2 className={`text-2xl font-black uppercase tracking-tight ${isDark ? 'text-white' : 'text-black'}`}>Boost Your Post</h2>
                    <p className={`mt-2 text-sm ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>How much do you want to invest?</p>
                </div>

                {message && (
                    <div className={`mb-6 p-4 rounded-xl text-center text-sm font-bold ${message.type === 'success' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                        {message.text}
                    </div>
                )}

                <div className="space-y-8 mb-8">
                    {/* Daily Budget Slider */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-end">
                            <label className={`text-xs font-bold uppercase tracking-widest ${isDark ? 'text-neutral-500' : 'text-neutral-500'}`}>Daily Budget</label>
                            <div className={`text-2xl font-black ${isDark ? 'text-white' : 'text-black'}`}>{formatPrice(dailyBudget)}</div>
                        </div>
                        <input
                            type="range"
                            min="0.4"
                            max="800"
                            step="0.1"
                            value={dailyBudget}
                            onChange={(e) => setDailyBudget(parseFloat(e.target.value))}
                            className="w-full h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer dark:bg-neutral-700 accent-blue-500"
                        />
                        <div className="flex justify-between text-[10px] font-bold text-neutral-400 uppercase">
                            <span>{formatPrice(0.4)}</span>
                            <span>{formatPrice(800)}</span>
                        </div>
                    </div>

                    {/* Duration Slider */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-end">
                            <label className={`text-xs font-bold uppercase tracking-widest ${isDark ? 'text-neutral-500' : 'text-neutral-500'}`}>Duration</label>
                            <div className={`text-2xl font-black ${isDark ? 'text-white' : 'text-black'}`}>{duration} Days</div>
                        </div>
                        <input
                            type="range"
                            min="1"
                            max="30"
                            step="1"
                            value={duration}
                            onChange={(e) => setDuration(parseInt(e.target.value))}
                            className="w-full h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer dark:bg-neutral-700 accent-purple-500"
                        />
                        <div className="flex justify-between text-[10px] font-bold text-neutral-400 uppercase">
                            <span>1 Day</span>
                            <span>30 Days</span>
                        </div>
                    </div>

                    {/* Est Reach Card & Total Investment */}
                    <div className={`p-4 rounded-xl space-y-4 border ${isDark ? 'bg-neutral-800/50 border-neutral-700' : 'bg-neutral-50 border-neutral-200'}`}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500"><TrendingUp size={18} /></div>
                                <div>
                                    <div className={`text-xs font-bold uppercase ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>Est. Reach (Daily)</div>
                                    <div className={`text-lg font-black ${isDark ? 'text-white' : 'text-black'}`}>
                                        {formatNumber(minReach)} - {formatNumber(maxReach)} <span className="text-sm font-medium text-neutral-500">people</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className={`h-px ${isDark ? 'bg-neutral-700' : 'bg-neutral-200'}`}></div>

                        <div className="flex items-center justify-between">
                            <div className={`text-xs font-bold uppercase ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>Total Investment</div>
                            <div className={`text-xl font-black ${isDark ? 'text-white' : 'text-black'}`}>{formatPrice(totalCost)}</div>
                        </div>
                    </div>
                </div>

                <button
                    onClick={handlePromote}
                    disabled={paymentLoading}
                    className={`w-full py-4 rounded-xl font-black uppercase tracking-widest text-sm transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 ${isDark ? 'bg-white text-black hover:bg-neutral-200' : 'bg-black text-white hover:bg-neutral-800'
                        }`}
                >
                    {paymentLoading ? <Loader2 className="animate-spin" /> : `Invest • ${formatPrice(totalCost)}`}
                </button>
            </div>
        </div>
    );
}
