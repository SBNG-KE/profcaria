import React from 'react';
import { notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase';
import { decryptData } from '@/lib/security';
import { Building2, MapPin, Globe, Users, Link2, Mail, Check } from 'lucide-react';
import FollowButton from '@/app/components/network/FollowButton';

export const dynamic = 'force-dynamic';

export default async function CompanyProfilePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    // Fetch Company Data
    const { data: company, error } = await supabaseAdmin
        .schema('employer')
        .from('companies')
        .select('*')
        .eq('id', id)
        .single();

    if (error || !company) {
        notFound();
    }

    // Decrypt Data
    const name = decryptData(company.enc_company_name) || 'Unnamed Company';
    const logoUrl = decryptData(company.enc_logo_url);
    const about = decryptData(company.enc_about);
    const location = decryptData(company.enc_location);
    const website = decryptData(company.enc_website);
    const industry = company.industry;
    const foundedYear = decryptData(company.enc_founded_year);
    const imagePosition = company.image_position || '50% 50%';

    // Fetch Other Profiles (Social Links)
    let otherProfiles: any[] = [];
    if (company.user_id) {
        const { data: profiles } = await supabaseAdmin
            .schema('professional')
            .from('other_profiles')
            .select('*')
            .eq('user_id', company.user_id);
        if (profiles) otherProfiles = profiles;
    }

    // Determine current user status to show appropriate follow button
    // Actually FollowButton handles strict "follower/following" logic internally via API check.

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-neutral-900 p-6 pb-20">
            <div className="max-w-5xl mx-auto space-y-8">

                {/* Header Card with Logo (Static View) */}
                <div className="rounded-2xl border overflow-hidden bg-white border-neutral-200 shadow-sm dark:bg-neutral-900 dark:border-neutral-800">
                    <div className="h-32 bg-gradient-to-r from-neutral-100 to-neutral-200 dark:from-neutral-800 dark:to-neutral-900" />
                    <div className="px-6 pb-6">
                        <div className="flex items-end gap-4 -mt-12">
                            <div className="relative">
                                <div className="w-24 h-24 rounded-2xl border-4 overflow-hidden flex items-center justify-center bg-white border-white shadow-lg dark:bg-neutral-800 dark:border-neutral-900">
                                    {logoUrl ? (
                                        <img src={logoUrl} alt="Company Logo" className="w-full h-full object-cover" />
                                    ) : (
                                        <Building2 size={40} className="text-neutral-400 dark:text-neutral-600" />
                                    )}
                                </div>
                            </div>
                            <div className="flex-1 pb-2">
                                <div className="px-4 py-2 rounded-xl inline-block mt-4 font-bold text-lg bg-white text-black border border-neutral-200 shadow-sm dark:bg-neutral-800 dark:text-white dark:border-neutral-700">
                                    {industry || 'Company'}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 1. Identity Card */}
                <div className="p-8 rounded-[40px] bg-white border border-neutral-200 shadow-sm dark:bg-neutral-900 dark:border-neutral-800">
                    <div className="flex flex-col md:flex-row gap-8 items-start">
                        {/* Left: Company Logo */}
                        <div className="flex-shrink-0 relative group">
                            <div className="w-40 h-40 md:w-48 md:h-48 rounded-[2rem] overflow-hidden border-4 flex items-center justify-center bg-white border-white shadow-lg dark:border-neutral-800">
                                {logoUrl ? (
                                    <img
                                        src={logoUrl}
                                        alt="Company Logo"
                                        className="w-full h-full object-cover"
                                        style={{ objectPosition: imagePosition }}
                                        draggable={false}
                                    />
                                ) : (
                                    <Building2 size={48} className="text-neutral-300" />
                                )}
                            </div>
                        </div>

                        {/* Right: Details */}
                        <div className="flex-1 w-full space-y-6">

                            {/* Name & Founded */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <h1 className="text-4xl md:text-5xl font-black vide-tighter text-black dark:text-white">
                                        {name}
                                    </h1>
                                    <div className="min-w-[140px]">
                                        <FollowButton
                                            targetId={company.id}
                                            type="company"
                                        />
                                    </div>
                                </div>
                                <p className="text-xl font-medium text-neutral-500 dark:text-neutral-400">
                                    Founded {foundedYear || 'Unknown'}
                                </p>
                            </div>

                            <div className="h-px w-full bg-neutral-100 dark:bg-neutral-800"></div>

                            {/* Contact Info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {website && (
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 dark:text-neutral-500">Website</label>
                                        <div className="flex items-center gap-2">
                                            <div className="flex items-center gap-2 font-medium text-neutral-700 dark:text-neutral-300">
                                                <Globe size={16} />
                                                <a href={website.startsWith('http') ? website : `https://${website}`} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                                    {website}
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {location && (
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 dark:text-neutral-500">Location</label>
                                        <div className="flex items-center gap-2">
                                            <div className="flex items-center gap-2 font-medium text-neutral-700 dark:text-neutral-300">
                                                <MapPin size={16} /> {location}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                        </div>
                    </div>
                </div>

                {/* 2. Analytics Card (Followers) */}
                <div className="p-8 rounded-[40px] border bg-white border-neutral-200 shadow-sm dark:bg-neutral-900 dark:border-neutral-800">
                    <div className="flex flex-col items-center justify-center space-y-1">
                        <div className="text-4xl font-black text-black dark:text-white">{company.follower_count || 0}</div>
                        <div className="text-xs font-bold uppercase tracking-widest text-neutral-400 dark:text-neutral-500">Subscribers</div>
                    </div>
                </div>

                {/* 3. About Section */}
                {about && (
                    <div className="p-8 rounded-[40px] space-y-4 border bg-white border-neutral-200 shadow-sm dark:bg-neutral-900 dark:border-neutral-800">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-bold flex items-center gap-2 text-black dark:text-white">About</h3>
                        </div>
                        <p className="leading-relaxed whitespace-pre-wrap text-neutral-600 dark:text-neutral-400">
                            {about}
                        </p>
                    </div>
                )}

                {/* 4. Other Profiles */}
                {(otherProfiles && otherProfiles.length > 0) && (
                    <div className="p-8 rounded-[40px] border bg-white border-neutral-200 shadow-sm dark:bg-neutral-900 dark:border-neutral-800">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold flex items-center gap-2 text-black dark:text-white">
                                <Link2 size={20} /> Other Profiles
                            </h3>
                        </div>
                        <div className="space-y-4">
                            {otherProfiles.map((prof: any) => (
                                <div key={prof.id} className="group flex items-center justify-between p-4 rounded-2xl border bg-white border-neutral-200 dark:bg-neutral-800 dark:border-neutral-700">
                                    <div className="flex items-center gap-4">
                                        <Link2 size={20} className="text-neutral-500 dark:text-neutral-400" />
                                        <div>
                                            <h4 className="font-bold text-black dark:text-white">{prof.network}</h4>
                                            <a href={prof.url} target="_blank" rel="noopener noreferrer" className="text-sm hover:underline text-neutral-600 dark:text-neutral-400">{prof.url}</a>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
