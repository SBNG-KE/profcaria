"use client"

import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { X, CheckCircle, Activity, Zap, TrendingUp, Star, Users } from 'lucide-react';
import { useCurrency } from '@/app/hooks/useCurrency';

export default function HangingPricingCard({
    isOpen,
    onClose,
    onGetStarted
}: {
    isOpen: boolean;
    onClose: () => void;
    onGetStarted: (role: 'professional' | 'employer') => void;
}) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const [activeTab, setActiveTab] = useState<'professional' | 'employer'>('professional');

    // Pricing Config State (same as employer billing)
    const [pricing, setPricing] = useState({
        basic: 25,
        basicOffer: 0,
        pro: 99,
        proOffer: 0,
        enterprise: 250,
        enterpriseOffer: 0
    });

    // Currency Hook (Uses IP address based conversion inside the hook)
    const { currency: currencyCode, symbol: currencySymbol, rate: exchangeRate, loading: currencyLoading } = useCurrency();

    useEffect(() => {
        const fetchPricing = async () => {
            try {
                // Let's use the public pricing api if available or employer billing api.
                // Assuming /api/pricing exists from before, or we fallback to defaults.
                const res = await fetch('/api/pricing').catch(() => null);
                if (res && res.ok) {
                    const data = await res.json();
                    setPricing({
                        basic: data.basic || 25,
                        basicOffer: data.basicOffer || 0,
                        pro: data.pro || 99,
                        proOffer: data.proOffer || 0,
                        enterprise: data.enterprise || 250,
                        enterpriseOffer: data.enterpriseOffer || 0
                    });
                }
            } catch (error) {
                console.error('Error fetching pricing:', error);
            }
        };
        fetchPricing();
    }, []);

    // Currency Formatter
    const formatCurrency = (usdAmount: number) => {
        if (currencyLoading) return '...';
        const converted = Math.round(usdAmount * exchangeRate);
        return `${currencySymbol}${new Intl.NumberFormat().format(converted)}`;
    };

    // Prevent scrolling when open
    useEffect(() => {
        if (isOpen) {
            document.documentElement.style.overflow = 'hidden';
            document.body.style.overflow = 'hidden';
        } else {
            document.documentElement.style.overflow = '';
            document.body.style.overflow = '';
        }
        return () => {
            document.documentElement.style.overflow = '';
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] pointer-events-auto">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-md transition-opacity duration-300"
                onClick={onClose}
            />

            {/* Overlay Scroll Container */}
            <div className="fixed inset-0 overflow-y-auto custom-scrollbar" data-lenis-prevent="true">
                <div className="flex min-h-full items-start justify-center p-4 md:p-8 text-left">
                    {/* CARD - Enhanced Glassmorphism */}
                    <div
                        className={`
                            relative w-full max-w-[1000px] mx-auto
                            rounded-[2rem] p-6 md:p-8 pb-10 md:pb-12
                            transform transition-all duration-500 origin-top
                            ${isDark
                                ? 'glass-card border-neutral-700/50 glow-white text-white'
                                : 'glass-card-light border-neutral-200 text-black'}
                `}
                        style={{
                            animation: 'swing 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards'
                        }}
                    >
                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            className={`
                        absolute top-6 right-6 p-2 rounded-full transition-all duration-300 z-50
                        ${isDark ? 'bg-neutral-900 hover:bg-neutral-800 text-white' : 'bg-neutral-100 hover:bg-neutral-200 text-black'}
                    `}
                        >
                            <X size={18} className="font-black" />
                        </button>

                        {/* Content */}
                        <div className="mt-4 md:mt-2 space-y-8 relative">
                            {/* Header with mixed fonts */}
                            <div className="text-center">
                                <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tight leading-none mb-4">
                                    Transparent <br className="md:hidden" />
                                    <span className="font-pixel text-amber-500 md:ml-4 text-3xl md:text-5xl">Pricing</span>
                                </h2>
                                <div className={`w-16 h-1 mt-6 mx-auto ${isDark ? 'bg-white' : 'bg-black'}`}></div>
                            </div>

                            {/* TABS (Prof/Emp) */}
                            <div className="flex gap-2 justify-start md:justify-start">
                                {(['professional', 'employer'] as const).map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        className={`
                                    py-2 px-6 rounded-full text-xs font-bold uppercase tracking-widest transition-all
                                    ${activeTab === tab
                                                ? (isDark ? 'bg-white text-black shadow-lg' : 'bg-black text-white shadow-lg')
                                                : (isDark ? 'bg-neutral-800 text-neutral-400 hover:text-white' : 'bg-neutral-200 text-neutral-600 hover:text-black')}
                                `}
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </div>

                            {/* Exhange Rate Notice */}
                            {exchangeRate > 1 && activeTab === 'employer' && (
                                <div className={`p-4 border rounded-xl flex items-center justify-center gap-3 text-xs max-w-2xl mx-auto ${isDark ? 'bg-neutral-900/50 border-neutral-800 text-neutral-400' : 'bg-neutral-50 border-neutral-200 text-neutral-600'}`}>
                                    <Activity size={16} />
                                    <span>Prices are dynamically converted from USD based on your current location.</span>
                                </div>
                            )}

                            {/* PROFESSIONAL TAB CONTENT */}
                            {activeTab === 'professional' && (
                                <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">

                                    <div className={`p-8 md:p-12 rounded-[32px] border flex flex-col items-center text-center ${isDark ? 'bg-neutral-900/50 border-neutral-800' : 'bg-neutral-50 border-neutral-200'}`}>
                                        <h3 className="text-3xl font-black uppercase tracking-wide mb-4">
                                            The Network is <span className="text-emerald-500 font-pixel text-4xl">Free.</span>
                                        </h3>
                                        <p className={`max-w-2xl text-lg font-medium leading-relaxed mb-10 ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                                            Connect, network, apply to jobs, and grow your career with the content you post. There is absolutely NO need to pay to be known or to access opportunities, unlike other legacy platforms.
                                        </p>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl text-left">
                                            <div className={`p-6 rounded-2xl ${isDark ? 'bg-neutral-950' : 'bg-white shadow-sm'}`}>
                                                <div className="text-emerald-500 mb-4"><Zap size={24} /></div>
                                                <h4 className="font-bold text-lg mb-2">Build Your Brand</h4>
                                                <p className={`text-sm ${isDark ? 'text-neutral-500' : 'text-neutral-500'}`}>Post content, showcase your verified experience, and build an authentic following entirely for free.</p>
                                            </div>
                                            <div className={`p-6 rounded-2xl ${isDark ? 'bg-neutral-950' : 'bg-white shadow-sm'}`}>
                                                <div className="text-blue-500 mb-4"><Users size={24} /></div>
                                                <h4 className="font-bold text-lg mb-2">Unlimited Networking</h4>
                                                <p className={`text-sm ${isDark ? 'text-neutral-500' : 'text-neutral-500'}`}>Directly connect and chat with peers, mentors, and employers without paywalls throttling your reach.</p>
                                            </div>
                                            <div className={`p-6 rounded-2xl ${isDark ? 'bg-neutral-950' : 'bg-white shadow-sm'}`}>
                                                <div className="text-purple-500 mb-4"><Star size={24} /></div>
                                                <h4 className="font-bold text-lg mb-2">Apply Securely</h4>
                                                <p className={`text-sm ${isDark ? 'text-neutral-500' : 'text-neutral-500'}`}>Find your ambition and apply to authentic, verified jobs with total privacy controls forever free.</p>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => onGetStarted('professional')}
                                            className={`mt-10 px-10 py-4 font-black uppercase tracking-[0.2em] rounded-full transition-all hover:scale-105 ${isDark ? 'bg-white text-black hover:bg-neutral-200 shadow-[0_0_30px_rgba(255,255,255,0.1)]' : 'bg-black text-white hover:bg-neutral-800'}`}
                                        >
                                            Join Now
                                        </button>
                                    </div>

                                    {/* Boost A Post Section */}
                                    <div className="max-w-3xl mx-auto space-y-6">
                                        <div className="flex items-center gap-4">
                                            <div className="h-px bg-neutral-500/30 flex-1"></div>
                                            <span className={`text-xs font-bold uppercase tracking-widest ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>Optional Extras</span>
                                            <div className="h-px bg-neutral-500/30 flex-1"></div>
                                        </div>

                                        <div className={`p-8 rounded-[24px] border ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'}`}>
                                            <h4 className="text-xl font-black uppercase flex items-center gap-3 mb-2">
                                                <TrendingUp className="text-amber-500" /> Boost a Post
                                            </h4>
                                            <p className={`text-sm font-medium ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                                                Want extra visibility for a specific post or announcement? Reach a targeted audience beyond your followers. Flexible duration options are available as an in-app add-on.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}


                            {/* EMPLOYER TAB CONTENT */}
                            {activeTab === 'employer' && (
                                <div className="space-y-12 animate-in fade-in slide-in-from-right-4 duration-500">

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        {/* Basic Tier */}
                                        <div className={`border p-6 rounded-[24px] flex flex-col relative overflow-hidden transition-all duration-300 ${isDark ? 'bg-neutral-900/50 border-neutral-800' : 'bg-white border-neutral-200 hover:shadow-md'}`}>
                                            <div className="space-y-4 flex-1">
                                                <h4 className={`font-black text-xl flex items-center gap-2 ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                                                    Basic
                                                    {pricing.basicOffer > 0 && (
                                                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-black tracking-wider ${isDark ? 'bg-white/20 text-white' : 'bg-black/10 text-black'}`}>
                                                            -{Math.round((1 - pricing.basicOffer / pricing.basic) * 100)}%
                                                        </span>
                                                    )}
                                                </h4>

                                                <div className="flex flex-col">
                                                    {pricing.basicOffer > 0 ? (
                                                        <>
                                                            <span className="text-xs text-neutral-500 line-through font-bold">
                                                                {formatCurrency(pricing.basic)}
                                                            </span>
                                                            <div className={`text-4xl font-black ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                                                                <span className="text-sm text-neutral-400 font-bold mr-0.5">{currencyCode}</span>
                                                                {formatCurrency(pricing.basicOffer).replace(currencyCode, '').replace(currencySymbol, '')}
                                                                <span className={`text-xs font-bold ml-1 ${isDark ? 'text-neutral-500' : 'text-neutral-500'}`}>/mo</span>
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <div className={`text-4xl font-black ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                                                            <span className="text-sm text-neutral-400 font-bold mr-0.5">{currencyCode}</span>
                                                            {formatCurrency(pricing.basic).replace(currencyCode, '').replace(currencySymbol, '')}
                                                            <span className={`text-xs font-bold ml-1 ${isDark ? 'text-neutral-500' : 'text-neutral-500'}`}>/mo</span>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="pt-2 space-y-3">
                                                    <div className={`flex items-center gap-2 text-xs font-medium ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                                                        <CheckCircle size={14} className={`${isDark ? "text-white" : "text-black"} shrink-0`} /> 3 Job Posts/mo
                                                    </div>
                                                    <div className={`flex items-center gap-2 text-xs font-medium ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                                                        <CheckCircle size={14} className={`${isDark ? "text-white" : "text-black"} shrink-0`} /> 3 Years Analytics History
                                                    </div>
                                                    <div className={`flex items-center gap-2 text-xs font-medium ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                                                        <CheckCircle size={14} className={`${isDark ? "text-white" : "text-black"} shrink-0`} /> 5 AI Top Match Credits/job
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="mt-8 pt-6">
                                                <button
                                                    onClick={() => onGetStarted('employer')}
                                                    className={`w-full py-3 font-black rounded-xl text-xs uppercase tracking-widest transition-all ${isDark ? 'bg-white hover:bg-neutral-200 text-black' : 'bg-black hover:bg-neutral-800 text-white'}`}
                                                >
                                                    Get Started
                                                </button>
                                            </div>
                                        </div>

                                        {/* Pro Tier ($99) - BEST OFFER */}
                                        <div className={`border p-6 rounded-[24px] flex flex-col relative overflow-hidden transition-all duration-300 shadow-xl z-10 scale-[1.02] md:scale-105 ${isDark ? 'bg-neutral-900 border-neutral-600' : 'bg-white border-neutral-300 shadow-neutral-200'}`}>
                                            <div className={`absolute top-0 inset-x-0 h-1.5 ${isDark ? 'bg-amber-500' : 'bg-amber-500'}`}></div>
                                            <div className="space-y-4 flex-1">
                                                <h4 className={`font-black text-xl flex items-center gap-2 ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                                                    Pro <span className={`px-2 py-0.5 rounded text-[9px] font-bold tracking-wide bg-amber-500 text-black`}>BEST VALUE</span>
                                                    {pricing.proOffer > 0 && (
                                                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-black tracking-wider ${isDark ? 'bg-white/20 text-white' : 'bg-black/10 text-black'}`}>
                                                            -{Math.round((1 - pricing.proOffer / pricing.pro) * 100)}%
                                                        </span>
                                                    )}
                                                </h4>

                                                <div className="flex flex-col">
                                                    {pricing.proOffer > 0 ? (
                                                        <>
                                                            <span className="text-xs text-neutral-500 line-through font-bold">
                                                                {formatCurrency(pricing.pro)}
                                                            </span>
                                                            <div className={`text-4xl font-black ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                                                                <span className="text-sm text-neutral-400 font-bold mr-0.5">{currencyCode}</span>
                                                                {formatCurrency(pricing.proOffer).replace(currencyCode, '').replace(currencySymbol, '')}
                                                                <span className={`text-xs font-bold ml-1 ${isDark ? 'text-neutral-500' : 'text-neutral-500'}`}>/mo</span>
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <div className={`text-4xl font-black ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                                                            <span className="text-sm text-neutral-400 font-bold mr-0.5">{currencyCode}</span>
                                                            {formatCurrency(pricing.pro).replace(currencyCode, '').replace(currencySymbol, '')}
                                                            <span className={`text-xs font-bold ml-1 ${isDark ? 'text-neutral-500' : 'text-neutral-500'}`}>/mo</span>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="pt-2 space-y-3">
                                                    <div className={`flex items-center gap-2 text-xs font-medium ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}>
                                                        <CheckCircle size={14} className="text-amber-500 shrink-0" /> <span className="font-bold">15 Job Posts/mo</span>
                                                    </div>
                                                    <div className={`flex items-center gap-2 text-xs font-medium ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}>
                                                        <CheckCircle size={14} className="text-amber-500 shrink-0" /> Unlimited Analytics History
                                                    </div>
                                                    <div className={`flex items-center gap-2 text-xs font-medium ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}>
                                                        <CheckCircle size={14} className="text-amber-500 shrink-0" /> 30 AI Top Match Credits/job
                                                    </div>
                                                    <div className={`flex items-center gap-2 text-xs font-medium ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}>
                                                        <CheckCircle size={14} className="text-amber-500 shrink-0" /> Location-Restricted Jobs
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="mt-8 pt-6">
                                                <button
                                                    onClick={() => onGetStarted('employer')}
                                                    className={`w-full py-4 font-black rounded-xl text-xs uppercase tracking-widest transition-all shadow-lg active:scale-95 bg-amber-500 hover:bg-amber-400 text-black shadow-amber-500/20`}
                                                >
                                                    Get Pro
                                                </button>
                                            </div>
                                        </div>

                                        {/* Enterprise Tier */}
                                        <div className={`border p-6 rounded-[24px] flex flex-col relative overflow-hidden transition-all duration-300 ${isDark ? 'bg-neutral-900/50 border-neutral-800' : 'bg-white border-neutral-200 hover:shadow-md'}`}>
                                            <div className="space-y-4 flex-1">
                                                <h4 className={`font-black text-xl flex items-center gap-2 ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                                                    Enterprise
                                                    {pricing.enterpriseOffer > 0 && (
                                                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-black tracking-wider ${isDark ? 'bg-white/20 text-white' : 'bg-black/10 text-black'}`}>
                                                            -{Math.round((1 - pricing.enterpriseOffer / pricing.enterprise) * 100)}%
                                                        </span>
                                                    )}
                                                </h4>

                                                <div className="flex flex-col">
                                                    {pricing.enterpriseOffer > 0 ? (
                                                        <>
                                                            <span className="text-xs text-neutral-500 line-through font-bold">
                                                                {formatCurrency(pricing.enterprise)}
                                                            </span>
                                                            <div className={`text-4xl font-black ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                                                                <span className="text-sm text-neutral-400 font-bold mr-0.5">{currencyCode}</span>
                                                                {formatCurrency(pricing.enterpriseOffer).replace(currencyCode, '').replace(currencySymbol, '')}
                                                                <span className={`text-xs font-bold ml-1 ${isDark ? 'text-neutral-500' : 'text-neutral-500'}`}>/mo</span>
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <div className={`text-4xl font-black ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                                                            <span className="text-sm text-neutral-400 font-bold mr-0.5">{currencyCode}</span>
                                                            {formatCurrency(pricing.enterprise).replace(currencyCode, '').replace(currencySymbol, '')}
                                                            <span className={`text-xs font-bold ml-1 ${isDark ? 'text-neutral-500' : 'text-neutral-500'}`}>/mo</span>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="pt-2 space-y-3">
                                                    <div className={`flex items-center gap-2 text-xs font-medium ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                                                        <CheckCircle size={14} className={`${isDark ? "text-white" : "text-black"} shrink-0`} /> Unlimited Job Postings
                                                    </div>
                                                    <div className={`flex items-center gap-2 text-xs font-medium ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                                                        <CheckCircle size={14} className={`${isDark ? "text-white" : "text-black"} shrink-0`} /> Unlimited Analytics History
                                                    </div>
                                                    <div className={`flex items-center gap-2 text-xs font-medium ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                                                        <CheckCircle size={14} className={`${isDark ? "text-white" : "text-black"} shrink-0`} /> Unlimited AI Top Matches
                                                    </div>
                                                    <div className={`flex items-center gap-2 text-xs font-medium ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                                                        <CheckCircle size={14} className={`${isDark ? "text-white" : "text-black"} shrink-0`} /> Priority Support
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="mt-8 pt-6">
                                                <button
                                                    onClick={() => onGetStarted('employer')}
                                                    className={`w-full py-3 font-black rounded-xl text-xs uppercase tracking-widest transition-all ${isDark ? 'bg-white hover:bg-neutral-200 text-black' : 'bg-black hover:bg-neutral-800 text-white'}`}
                                                >
                                                    Get Enterprise
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Boost A Job Section */}
                                    <div className="max-w-3xl mx-auto space-y-6 mt-12">
                                        <div className="flex items-center gap-4">
                                            <div className="h-px bg-neutral-500/30 flex-1"></div>
                                            <span className={`text-xs font-bold uppercase tracking-widest ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>Optional Extras</span>
                                            <div className="h-px bg-neutral-500/30 flex-1"></div>
                                        </div>

                                        <div className={`p-8 rounded-[24px] border ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'}`}>
                                            <h4 className="text-xl font-black uppercase flex items-center gap-3 mb-2">
                                                <TrendingUp className="text-amber-500" /> Boost a Job or Post
                                            </h4>
                                            <p className={`text-sm font-medium ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                                                Need to fill a role urgently or maximize brand reach? Boost your content across the entire network. Flexible duration options are available as an in-app add-on.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
