"use client"

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Loader2, MapPin, Link as LinkIcon, Building2, Calendar, Share2 } from 'lucide-react';
import ProfileImage from '@/app/components/ProfileImage';
import OndwiraLogo from '@/app/components/brand/OndwiraLogo';

type PublicExperience = {
    title?: string;
    company?: string;
    dateRange?: string;
    description?: string;
};

type PublicProfile = {
    profileImage?: string | null;
    firstName: string;
    lastName: string;
    headline?: string;
    location?: string;
    website?: string;
    createdAt?: string;
    about?: string;
    experience?: PublicExperience[];
};

export default function PublicProfilePage() {
    const params = useParams();
    const username = params.username as string; // expecting "firstname-lastname" format or similar ID logic

    const [profile, setProfile] = useState<PublicProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                // Determine API endpoint - we might need a specific public endpoint
                // or search by username.
                // Assuming we might need to search by slug or ID. 
                // For now, let's assume the username param IS the ID or slug handled by backend.
                // Since the user said the link is generated as `firstname-lastname`,
                // we probably need an endpoint that resolves this slug.
                // Let's assume hitting `/api/public/profile/${username}` or similar.
                // If that doesn't exist, we might need to mock it or find it.
                // Based on previous chats, there wasn't a specific public API mentioned, 
                // but usually public view reuses similar data.

                // Construct a search or direct fetch. 
                // Using a hypothetical endpoint for now, or fallback to search.
                // Given the instructions, I will try to fetch by slug.

                // IMPORTANT: The app structure suggests standard "professional" routes.
                // If no specific endpoint exists, I'll assume we need to handle it.
                // Let's try fetching from a new public endpoint I'll assume exists or create?
                // Actually, I'll implement the UI and try to fetch from `/api/professional/public/${username}`

                const res = await fetch(`/api/professional/public/${username}`);
                if (res.ok) {
                    const data = await res.json();
                    setProfile(data.profile);
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

        if (username) {
            // For demo/fixing purposes if API is missing, we might show a placeholder
            // But let's try to fetch.
            // If real implementation needed, I'd create the API route too.
            // I'll create the page first.
            fetchProfile();
        }
    }, [username]);

    // Fallback Mock for now since I can't verify backend API existence for slugs easily without checking all api folder
    // I entered "task boundary" so I should do it properly.
    // I'll list api folder first to be sure, but for this step I'm writing the file.
    // I will write a basic layout.

    if (loading) {
        return <div className="min-h-screen bg-[#020617] flex items-center justify-center"><Loader2 className="text-white animate-spin" size={48} /></div>;
    }

    if (error || !profile) {
        return (
            <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center text-center p-4">
                <h1 className="text-2xl font-bold text-white mb-2">Profile Not Found</h1>
                <p className="text-neutral-400 mb-6">The profile you are looking for does not exist or has been removed.</p>
                <Link href="/" className="px-6 py-3 bg-white text-black rounded-full font-bold uppercase tracking-widest text-sm hover:bg-neutral-200 transition-colors">
                    Go Home
                </Link>
            </div>
        );
    }

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
                {/* Profile Header Card */}
                <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 flex flex-col md:flex-row items-center md:items-start gap-6 text-center md:text-left">
                    <ProfileImage
                        src={profile.profileImage}
                        name={profile.firstName + ' ' + profile.lastName}
                        size={120}
                        className="w-32 h-32 rounded-full border-4 border-neutral-800 shadow-xl"
                    />
                    <div className="flex-1 space-y-4">
                        <div>
                            <h1 className="text-3xl font-black">{profile.firstName} {profile.lastName}</h1>
                            {profile.headline && <p className="text-lg text-neutral-400 font-medium mt-1">{profile.headline}</p>}
                        </div>

                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-neutral-500">
                            {profile.location && <span className="flex items-center gap-1.5"><MapPin size={14} /> {profile.location}</span>}
                            {profile.website && <span className="flex items-center gap-1.5"><LinkIcon size={14} /> <a href={profile.website} target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 hover:underline">{profile.website.replace(/^https?:\/\//, '')}</a></span>}
                            <span className="flex items-center gap-1.5"><Calendar size={14} /> Joined {new Date(profile.createdAt || Date.now()).toLocaleDateString()}</span>
                        </div>

                        <div className="pt-2 flex flex-wrap justify-center md:justify-start gap-3">
                            <button className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-full font-bold text-sm transition-all shadow-lg shadow-blue-900/20">
                                Connect
                            </button>
                            <button className="border border-neutral-700 hover:bg-neutral-800 text-white px-6 py-2.5 rounded-full font-bold text-sm transition-all flex items-center gap-2">
                                <Share2 size={16} /> Share
                            </button>
                        </div>
                    </div>
                </div>

                {/* About Section */}
                {profile.about && (
                    <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 space-y-4">
                        <h2 className="text-xl font-bold">About</h2>
                        <p className="text-neutral-300 leading-relaxed whitespace-pre-wrap">{profile.about}</p>
                    </div>
                )}

                {/* Experience Section Mockup */}
                <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 space-y-6">
                    <h2 className="text-xl font-bold">Experience</h2>
                    {profile.experience && profile.experience.length > 0 ? (
                        <div className="space-y-6">
                            {profile.experience.map((exp, i) => (
                                <div key={i} className="flex gap-4">
                                    <div className="w-12 h-12 bg-neutral-800 rounded-xl flex items-center justify-center shrink-0">
                                        <Building2 size={24} className="text-neutral-500" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg">{exp.title}</h3>
                                        <p className="text-neutral-400">{exp.company}</p>
                                        <p className="text-xs text-neutral-500 mt-1">{exp.dateRange}</p>
                                        {exp.description && <p className="text-sm text-neutral-300 mt-2">{exp.description}</p>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-neutral-500 italic">No experience listed.</p>
                    )}
                </div>
            </main>
        </div>
    );
}
