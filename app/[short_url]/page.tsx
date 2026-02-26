import { notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase';
import { decryptData } from '@/lib/security';
import Link from 'next/link';
import { MapPin, Link as LinkIcon, Calendar, Building2, Share2 } from 'lucide-react';

export const revalidate = 60; // Cache the public profile page for 60 seconds

export default async function PublicSlugPage({ params }: { params: Promise<{ short_url: string }> }) {
    const { short_url } = await params;

    // 1. Try to find a professional
    let { data: isProf } = await supabaseAdmin
        .schema('professional')
        .from('users')
        .select('*')
        .eq('short_url', short_url)
        .maybeSingle();

    if (isProf) {
        // Professional Profile
        const firstName = decryptData(isProf.enc_first_name) || '';
        const lastName = decryptData(isProf.enc_last_name) || '';
        const headline = decryptData(isProf.enc_current_role) || '';
        const about = decryptData(isProf.enc_about) || '';
        const location = decryptData(isProf.enc_location) || decryptData(isProf.enc_city) || '';
        const profileImage = decryptData(isProf.enc_profile_image_url) || '/default-avatar.png';
        const createdAt = isProf.created_at;

        return (
            <div className="min-h-screen bg-[#020617] text-white">
                <nav className="fixed top-0 inset-x-0 z-50 bg-[#020617]/80 backdrop-blur-md border-b border-white/5 h-16 flex items-center justify-between px-6">
                    <Link href="/" className="font-black text-xl tracking-tight">PROFCARIA</Link>
                    <Link href="/auth" className="text-xs font-bold uppercase tracking-widest px-4 py-2 border border-white/20 rounded-full hover:bg-white hover:text-black transition-all">
                        Log In
                    </Link>
                </nav>
                <main className="pt-24 pb-20 px-4 max-w-4xl mx-auto space-y-6">
                    <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 flex flex-col md:flex-row items-center md:items-start gap-6 text-center md:text-left">
                        <img src={profileImage} alt={firstName} className="w-32 h-32 rounded-full border-4 border-neutral-800 shadow-xl object-cover" />
                        <div className="flex-1 space-y-4">
                            <div>
                                <h1 className="text-3xl font-black">{firstName} {lastName}</h1>
                                {headline && <p className="text-lg text-neutral-400 font-medium mt-1">{headline}</p>}
                            </div>
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-neutral-500">
                                {location && <span className="flex items-center gap-1.5"><MapPin size={14} /> {location}</span>}
                                <span className="flex items-center gap-1.5"><Calendar size={14} /> Joined {new Date(createdAt || Date.now()).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>
                    {about && (
                        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 space-y-4">
                            <h2 className="text-xl font-bold">About</h2>
                            <p className="text-neutral-300 leading-relaxed whitespace-pre-wrap">{about}</p>
                        </div>
                    )}
                </main>
            </div>
        );
    }

    // 2. Try to find an employer
    let { data: isEmp } = await supabaseAdmin
        .schema('employer')
        .from('companies')
        .select('*')
        .eq('short_url', short_url)
        .maybeSingle();

    if (isEmp) {
        // Employer Profile
        const companyName = decryptData(isEmp.enc_company_name) || '';
        const website = decryptData(isEmp.enc_website) || '';
        const about = decryptData(isEmp.enc_about) || '';
        const logoUrl = decryptData(isEmp.enc_logo_url) || '/default-logo.png';
        const location = (isEmp.city && isEmp.country) ? `${isEmp.city}, ${isEmp.country}` : '';

        return (
            <div className="min-h-screen bg-[#020617] text-white">
                <nav className="fixed top-0 inset-x-0 z-50 bg-[#020617]/80 backdrop-blur-md border-b border-white/5 h-16 flex items-center justify-between px-6">
                    <Link href="/" className="font-black text-xl tracking-tight">PROFCARIA</Link>
                    <Link href="/auth" className="text-xs font-bold uppercase tracking-widest px-4 py-2 border border-white/20 rounded-full hover:bg-white hover:text-black transition-all">
                        Log In
                    </Link>
                </nav>
                <main className="pt-24 pb-20 px-4 max-w-4xl mx-auto space-y-6">
                    <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 flex flex-col md:flex-row items-center md:items-start gap-6 text-center md:text-left">
                        <img src={logoUrl} alt={companyName} className="w-32 h-32 rounded-2xl border-4 border-neutral-800 shadow-xl object-cover bg-white" />
                        <div className="flex-1 space-y-4">
                            <div>
                                <h1 className="text-3xl font-black">{companyName}</h1>
                            </div>
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-neutral-500">
                                {location && <span className="flex items-center gap-1.5"><MapPin size={14} /> {location}</span>}
                                {website && <span className="flex items-center gap-1.5"><LinkIcon size={14} /> <a href={website} target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 hover:underline">{website.replace(/^https?:\/\//, '')}</a></span>}
                            </div>
                        </div>
                    </div>
                    {about && (
                        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 space-y-4">
                            <h2 className="text-xl font-bold">About</h2>
                            <p className="text-neutral-300 leading-relaxed whitespace-pre-wrap">{about}</p>
                        </div>
                    )}
                </main>
            </div>
        );
    }

    // 3. Not found
    notFound();
}
