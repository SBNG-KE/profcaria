"use client"

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { CheckCircle, ArrowLeft, Activity } from 'lucide-react';
import { useCurrency } from '@/app/hooks/useCurrency';

export default function PricingPage() {
    const { currency: currencyCode, symbol: currencySymbol, rate: exchangeRate, loading: currencyLoading } = useCurrency();

    // Pricing Config State (fetched from API for consistency)
    const [pricing, setPricing] = useState({
        basic: 25,
        basicOffer: 0,
        pro: 99,
        proOffer: 0,
        enterprise: 250,
        enterpriseOffer: 0
    });

    useEffect(() => {
        const fetchPricing = async () => {
            try {
                // Fetch pricing from API (reads from environment variables)
                const res = await fetch('/api/pricing');
                if (res.ok) {
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

    return (
        <div className="min-h-screen bg-[#050b14] text-slate-200 font-sans selection:bg-blue-500/30">
            {/* Background Glows */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
                <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full" />
                <div className="absolute top-[20%] -right-[5%] w-[30%] h-[30%] bg-emerald-600/5 blur-[100px] rounded-full" />
            </div>

            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-[#050b14]/50 backdrop-blur-xl border-b border-white/5">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2">
                        <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400 tracking-tight">
                            PROFCARIA
                        </h1>
                    </Link>
                    <div className="flex items-center gap-4">
                        <Link
                            href="/"
                            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-bold"
                        >
                            <ArrowLeft size={16} />
                            Back
                        </Link>
                        <Link
                            href="/auth"
                            className="bg-white text-black px-6 py-2.5 rounded-full text-sm font-black uppercase tracking-widest hover:bg-blue-500 hover:text-white transition-all active:scale-95 shadow-lg shadow-white/5"
                        >
                            Launch
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="pt-32 pb-20 px-6 relative z-10">
                <div className="max-w-6xl mx-auto">
                    {/* Header */}
                    <div className="text-center mb-16 space-y-4">
                        <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight">
                            Simple, <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-emerald-400">Transparent</span> Pricing
                        </h1>
                        <p className="text-lg text-slate-400 max-w-2xl mx-auto">
                            Choose the plan that fits your hiring needs. All plans include our core security features.
                        </p>
                    </div>

                    {/* Currency Notice */}
                    {exchangeRate > 1 && (
                        <div className="max-w-2xl mx-auto mb-12 p-4 bg-slate-900/50 border border-slate-800 rounded-xl flex items-center gap-3 text-xs text-slate-400">
                            <Activity size={16} />
                            <span>Prices shown in {currencyCode}. Converted from USD based on current exchange rates.</span>
                        </div>
                    )}

                    {/* Pricing Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                        {/* Free Tier */}
                        <div className="bg-[#0f172a] border border-slate-800 p-6 rounded-[24px] flex flex-col relative overflow-hidden group hover:border-slate-700 transition-colors">
                            <div className="space-y-3 flex-1">
                                <h4 className="font-black text-xl text-white">Free</h4>
                                <div className="text-3xl font-black text-slate-500">
                                    {formatCurrency(0)}
                                    <span className="text-sm text-slate-600 font-bold ml-1">/mo</span>
                                </div>
                                <p className="text-xs text-slate-500 pb-2">Perfect for getting started</p>
                                <div className="pt-4 space-y-3 border-t border-slate-800">
                                    <div className="flex items-center gap-2 text-sm text-slate-300 font-medium">
                                        <CheckCircle size={14} className="text-slate-500 shrink-0" /> 1 Job Post/mo
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-slate-300 font-medium">
                                        <CheckCircle size={14} className="text-slate-500 shrink-0" /> 1 Year Analytics
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-slate-300 font-medium">
                                        <CheckCircle size={14} className="text-slate-500 shrink-0" /> Standard Candidates
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Basic Tier */}
                        <div className="bg-slate-900/30 border border-blue-500/20 p-6 rounded-[24px] flex flex-col relative overflow-hidden hover:border-blue-500/40 transition-colors">
                            <div className="space-y-3 flex-1">
                                <h4 className="font-black text-xl text-white flex items-center gap-2">
                                    Basic
                                    {pricing.basicOffer > 0 && (
                                        <span className="bg-green-500/20 text-green-400 text-[9px] px-1.5 py-0.5 rounded font-black tracking-wider">
                                            -{Math.round((1 - pricing.basicOffer / pricing.basic) * 100)}%
                                        </span>
                                    )}
                                </h4>
                                <div className="flex flex-col">
                                    {pricing.basicOffer > 0 ? (
                                        <>
                                            <span className="text-sm text-slate-500 line-through font-bold">
                                                {formatCurrency(pricing.basic)}
                                            </span>
                                            <div className="text-3xl font-black text-blue-400">
                                                <span className="text-sm text-blue-600 font-bold mr-0.5">{currencyCode}</span>
                                                {formatCurrency(pricing.basicOffer).replace(currencyCode, '').replace(currencySymbol, '')}
                                                <span className="text-sm text-blue-600/70 font-bold ml-1">/mo</span>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="text-3xl font-black text-blue-400">
                                            <span className="text-sm text-blue-600 font-bold mr-0.5">{currencyCode}</span>
                                            {formatCurrency(pricing.basic).replace(currencyCode, '').replace(currencySymbol, '')}
                                            <span className="text-sm text-blue-600/70 font-bold ml-1">/mo</span>
                                        </div>
                                    )}
                                </div>
                                <p className="text-xs text-slate-500 pb-2">For small teams</p>
                                <div className="pt-4 space-y-3 border-t border-blue-500/20">
                                    <div className="flex items-center gap-2 text-sm text-slate-200 font-medium">
                                        <CheckCircle size={14} className="text-blue-500 shrink-0" /> 5 Job Posts/mo
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-slate-200 font-medium">
                                        <CheckCircle size={14} className="text-blue-500 shrink-0" /> 3 Years Analytics
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-slate-200 font-medium">
                                        <CheckCircle size={14} className="text-blue-500 shrink-0" /> Top Match Access (Limited)
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Pro Tier - BEST VALUE */}
                        <div className="bg-gradient-to-b from-emerald-900/20 to-[#0f172a] border border-emerald-500/40 p-6 rounded-[24px] flex flex-col relative overflow-hidden shadow-xl shadow-emerald-900/10 scale-105 z-10">
                            <div className="absolute top-0 inset-x-0 h-1 bg-emerald-500"></div>
                            <div className="space-y-3 flex-1">
                                <h4 className="font-black text-xl text-white flex items-center gap-2">
                                    Pro <span className="px-2 py-0.5 rounded bg-emerald-500 text-white text-[9px] font-bold tracking-wide">BEST VALUE</span>
                                    {pricing.proOffer > 0 && (
                                        <span className="bg-emerald-500 text-white text-[9px] px-1.5 py-0.5 rounded font-black tracking-wider">
                                            -{Math.round((1 - pricing.proOffer / pricing.pro) * 100)}%
                                        </span>
                                    )}
                                </h4>
                                <div className="flex flex-col">
                                    {pricing.proOffer > 0 ? (
                                        <>
                                            <span className="text-sm text-slate-500 line-through font-bold">
                                                {formatCurrency(pricing.pro)}
                                            </span>
                                            <div className="text-3xl font-black text-emerald-400">
                                                <span className="text-sm text-emerald-600 font-bold mr-0.5">{currencyCode}</span>
                                                {formatCurrency(pricing.proOffer).replace(currencyCode, '').replace(currencySymbol, '')}
                                                <span className="text-sm text-emerald-600/70 font-bold ml-1">/mo</span>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="text-3xl font-black text-emerald-400">
                                            <span className="text-sm text-emerald-600 font-bold mr-0.5">{currencyCode}</span>
                                            {formatCurrency(pricing.pro).replace(currencyCode, '').replace(currencySymbol, '')}
                                            <span className="text-sm text-emerald-600/70 font-bold ml-1">/mo</span>
                                        </div>
                                    )}
                                </div>
                                <p className="text-xs text-slate-500 pb-2">For growing companies</p>
                                <div className="pt-4 space-y-3 border-t border-emerald-500/20">
                                    <div className="flex items-center gap-2 text-sm text-slate-200 font-medium">
                                        <CheckCircle size={14} className="text-emerald-500 shrink-0" /> <span className="text-white font-bold">30 Job Postings/mo</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-slate-200 font-medium">
                                        <CheckCircle size={14} className="text-emerald-500 shrink-0" /> Unlimited Analytics History
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-slate-200 font-medium">
                                        <CheckCircle size={14} className="text-emerald-500 shrink-0" /> Top Matches (Increased Limit)
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-slate-200 font-medium">
                                        <CheckCircle size={14} className="text-emerald-500 shrink-0" /> Access to Restricted Location Feature
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Enterprise Tier */}
                        <div className="bg-gradient-to-br from-purple-950/20 to-[#0f172a] border border-purple-500/20 p-6 rounded-[24px] flex flex-col relative overflow-hidden hover:border-purple-500/40 transition-colors">
                            <div className="space-y-3 flex-1">
                                <h4 className="font-black text-xl text-white flex items-center gap-2">
                                    Enterprise
                                    {pricing.enterpriseOffer > 0 && (
                                        <span className="bg-purple-500/20 text-purple-400 text-[9px] px-1.5 py-0.5 rounded font-black tracking-wider">
                                            -{Math.round((1 - pricing.enterpriseOffer / pricing.enterprise) * 100)}%
                                        </span>
                                    )}
                                </h4>
                                <div className="flex flex-col">
                                    {pricing.enterpriseOffer > 0 ? (
                                        <>
                                            <span className="text-sm text-slate-500 line-through font-bold">
                                                {formatCurrency(pricing.enterprise)}
                                            </span>
                                            <div className="text-3xl font-black text-purple-400">
                                                <span className="text-sm text-purple-600 font-bold mr-0.5">{currencyCode}</span>
                                                {formatCurrency(pricing.enterpriseOffer).replace(currencyCode, '').replace(currencySymbol, '')}
                                                <span className="text-sm text-purple-600/70 font-bold ml-1">/mo</span>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="text-3xl font-black text-purple-400">
                                            <span className="text-sm text-purple-600 font-bold mr-0.5">{currencyCode}</span>
                                            {formatCurrency(pricing.enterprise).replace(currencyCode, '').replace(currencySymbol, '')}
                                            <span className="text-sm text-purple-600/70 font-bold ml-1">/mo</span>
                                        </div>
                                    )}
                                </div>
                                <p className="text-xs text-slate-500 pb-2">For large organizations</p>
                                <div className="pt-4 space-y-3 border-t border-purple-500/20">
                                    <div className="flex items-center gap-2 text-sm text-slate-200 font-medium">
                                        <CheckCircle size={14} className="text-purple-500 shrink-0" /> Unlimited Job Postings
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-slate-200 font-medium">
                                        <CheckCircle size={14} className="text-purple-500 shrink-0" /> Unlimited Analytics History
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-slate-200 font-medium">
                                        <CheckCircle size={14} className="text-purple-500 shrink-0" /> Unlimited Top Matches (capped at 100)/job
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-slate-200 font-medium">
                                        <CheckCircle size={14} className="text-purple-500 shrink-0" /> Access to Restricted Location Feature
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer Note */}
                    <div className="mt-20 text-center">
                        <p className="text-slate-500 text-sm">
                            These prices are tailored for employers.
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
}
