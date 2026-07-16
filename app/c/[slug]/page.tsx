"use client"

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Loader2, MapPin, Link as LinkIcon, Share2, Users, Briefcase, Mail } from 'lucide-react';
import ProfileImage from '@/app/components/ProfileImage';
import OndwiraLogo from '@/app/components/brand/OndwiraLogo';

type PublicCompany = {
    logo?: string | null;
    name: string;
    industry?: string;
    location?: string;
    website?: string;
    size?: string | number;
    about?: string;
    email?: string;
};

export default function PublicCompanyProfilePage() {
    const params = useParams();
    const slug = params.slug as string;

    const [company, setCompany] = useState<PublicCompany | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        const fetchCompany = async () => {
            try {
                const res = await fetch(`/api/employer/public/${slug}`);
                if (res.ok) {
                    const data = await res.json();
                    setCompany(data.company);
                } else {
                    setError(true);
                }
            } catch (err) {
                console.error(err);
                setError(true);
            } finally {
                setLoading(false);
            }
        };

        if (slug) {
            fetchCompany();
        }
    }, [slug]);

    if (loading) {
        return <div className="min-h-screen bg-[#020617] flex items-center justify-center"><Loader2 className="text-white animate-spin" size={48} /></div>;
    }

    if (error || !company) {
        return (
            <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center text-center p-4">
                <h1 className="text-2xl font-bold text-white mb-2">Company Not Found</h1>
                <p className="text-neutral-400 mb-6">The company you are looking for does not exist or has been removed.</p>
                <Link href="/" className="px-6 py-3 bg-white text-black rounded-full font-bold uppercase tracking-widest text-sm hover:bg-neutral-200 transition-colors">
                    Go Home
                </Link>
            </div>
        );
    }

    const handleShare = async () => {
        const url = window.location.href;
        if (navigator.share) {
            try {
                await navigator.share({ title: company.name, url });
            } catch (err) {
                console.error(err);
            }
        } else {
            try {
                await navigator.clipboard.writeText(url);
                alert('Link copied to clipboard!');
            } catch (err) {
                console.error(err);
            }
        }
    };

    return (
        <div className="min-h-screen bg-[#020617] text-white">
            {/* Simple Header */}
            <nav className="fixed top-0 inset-x-0 z-50 bg-[#020617]/80 backdrop-blur-md border-b border-white/5 h-16 flex items-center justify-between px-6">
                <Link href="/" aria-label="Ondwira home"><OndwiraLogo className="text-xl" markClassName="text-[#C56F4A]" /></Link>
                <Link href="/auth" className="text-xs font-bold uppercase tracking-widest px-4 py-2 border border-white/20 rounded-full hover:bg-white hover:text-black transition-all">
                    Log In
                </Link>
            </nav>

            <main className="pt-24 pb-20 px-4 max-w-4xl mx-auto space-y-6">
                {/* Company Header Card */}
                <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 flex flex-col md:flex-row items-center md:items-start gap-6 text-center md:text-left">
                    <ProfileImage
                        src={company.logo}
                        name={company.name}
                        size={120}
                        className="w-32 h-32 rounded-2xl border-4 border-neutral-800 shadow-xl"
                    />
                    <div className="flex-1 space-y-4">
                        <div>
                            <h1 className="text-3xl font-black">{company.name}</h1>
                            {company.industry && <p className="text-lg text-neutral-400 font-medium mt-1">{company.industry}</p>}
                        </div>

                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-neutral-500">
                            {company.location && <span className="flex items-center gap-1.5"><MapPin size={14} /> {company.location}</span>}
                            {company.website && (
                                <span className="flex items-center gap-1.5">
                                    <LinkIcon size={14} />
                                    <a href={company.website.startsWith('http') ? company.website : `https://${company.website}`} target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 hover:underline">
                                        {company.website.replace(/^https?:\/\//, '')}
                                    </a>
                                </span>
                            )}
                            {company.size && <span className="flex items-center gap-1.5"><Users size={14} /> {company.size} employees</span>}
                        </div>

                        <div className="pt-2 flex flex-wrap justify-center md:justify-start gap-3">
                            <Link href={`/auth?redirect=/professional/find?company=${slug}`} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-full font-bold text-sm transition-all shadow-lg shadow-blue-900/20">
                                View Jobs
                            </Link>
                            <button onClick={handleShare} className="border border-neutral-700 hover:bg-neutral-800 text-white px-6 py-2.5 rounded-full font-bold text-sm transition-all flex items-center gap-2">
                                <Share2 size={16} /> Share
                            </button>
                        </div>
                    </div>
                </div>

                {/* About Section */}
                {company.about && (
                    <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 space-y-4">
                        <h2 className="text-xl font-bold">About</h2>
                        <p className="text-neutral-300 leading-relaxed whitespace-pre-wrap">{company.about}</p>
                    </div>
                )}

                {/* Contact Section */}
                {company.email && (
                    <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 space-y-4">
                        <h2 className="text-xl font-bold">Contact</h2>
                        <div className="flex items-center gap-3 text-neutral-300">
                            <Mail size={18} className="text-neutral-500" />
                            <a href={`mailto:${company.email}`} className="hover:text-blue-400 hover:underline">{company.email}</a>
                        </div>
                    </div>
                )}

                {/* Open Positions Teaser */}
                <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold">Open Positions</h2>
                        <Briefcase size={20} className="text-neutral-500" />
                    </div>
                    <p className="text-neutral-400">Join our team and help us build the future.</p>
                    <Link href={`/auth?redirect=/professional/find?company=${slug}`} className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 font-medium">
                        View all opportunities →
                    </Link>
                </div>
            </main>
        </div>
    );
}
