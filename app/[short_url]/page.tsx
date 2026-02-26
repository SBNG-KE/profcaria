import { notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase';
import { decryptData } from '@/lib/security';
import Link from 'next/link';
import {
    MapPin, Link as LinkIcon, Calendar, Building2,
    Briefcase, GraduationCap, Award, BadgeCheck, Mail, Phone, ExternalLink
} from 'lucide-react';

export const revalidate = 60;

export default async function PublicSlugPage({ params }: { params: Promise<{ short_url: string }> }) {
    const { short_url } = await params;

    // --- PROFESSIONAL LOOKUP ---
    let { data: isProf } = await supabaseAdmin
        .schema('professional')
        .from('users')
        .select('*')
        .eq('short_url', short_url)
        .maybeSingle();

    if (isProf) {
        const userId = isProf.id;
        const firstName = decryptData(isProf.enc_first_name) || '';
        const lastName = decryptData(isProf.enc_last_name) || '';
        const role = decryptData(isProf.enc_current_role) || '';
        const about = decryptData(isProf.enc_about) || '';
        const email = decryptData(isProf.enc_email) || '';
        const phone = decryptData(isProf.enc_phone_number) || '';
        const location = decryptData(isProf.enc_location) || decryptData(isProf.enc_city) || '';
        const profileImage = decryptData(isProf.enc_profile_image_url) || '/default-avatar.png';
        const createdAt = isProf.created_at;

        // Fetch extra sections (Parallel for speed)
        const [empRes, eduRes, skillRes, certRes, awardRes, linksRes, postsRes] = await Promise.all([
            supabaseAdmin.schema('professional').from('employment_history').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
            supabaseAdmin.schema('professional').from('education').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
            supabaseAdmin.schema('professional').from('skills').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
            supabaseAdmin.schema('professional').from('certifications').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
            supabaseAdmin.schema('professional').from('awards').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
            supabaseAdmin.schema('professional').from('other_profiles').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
            supabaseAdmin.schema('professional').from('posts').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(5)
        ]);

        const experience = (empRes.data || []).map((e: any) => ({
            id: e.id,
            title: decryptData(e.enc_title),
            company: decryptData(e.enc_company),
            type: decryptData(e.enc_type),
            location: decryptData(e.enc_location),
            startDate: decryptData(e.enc_start_date),
            endDate: decryptData(e.enc_end_date),
            isCurrent: e.is_current,
            description: decryptData(e.enc_description)
        }));

        const education = (eduRes.data || []).map((e: any) => ({
            id: e.id,
            school: decryptData(e.enc_school),
            degree: decryptData(e.enc_degree),
            field: decryptData(e.enc_field_of_study),
            startDate: decryptData(e.enc_start_date),
            endDate: decryptData(e.enc_end_date),
            description: decryptData(e.enc_description)
        }));

        const skills = (skillRes.data || []).map((s: any) => decryptData(s.enc_name)).filter(Boolean);

        const certs = (certRes.data || []).map((c: any) => ({
            name: decryptData(c.enc_name),
            issuer: decryptData(c.enc_issuer),
            date: decryptData(c.enc_issue_date),
            url: decryptData(c.enc_credential_url)
        }));

        const awards = (awardRes.data || []).map((a: any) => ({
            title: decryptData(a.enc_title),
            issuer: decryptData(a.enc_issuer),
            date: decryptData(a.enc_date),
            description: decryptData(a.enc_description)
        }));

        const otherProfiles = (linksRes.data || []).map((l: any) => ({
            network: decryptData(l.enc_network),
            url: decryptData(l.enc_url)
        }));

        const recentPosts = (postsRes.data || []).map((p: any) => ({
            id: p.id,
            content: p.content,
            date: p.created_at,
            mediaUrls: p.media_urls
        }));

        return (
            <div className="min-h-screen bg-[#020617] text-white">
                <nav className="fixed top-0 inset-x-0 z-50 bg-[#020617]/80 backdrop-blur-md border-b border-white/5 h-16 flex items-center justify-between px-6">
                    <Link href="/" className="font-black text-xl tracking-tight">PROFCARIA</Link>
                    <Link href="/auth" className="text-xs font-bold uppercase tracking-widest px-4 py-2 border border-white/20 rounded-full hover:bg-white hover:text-black transition-all">
                        Log In
                    </Link>
                </nav>
                <main className="pt-24 pb-20 px-4 max-w-4xl mx-auto space-y-6">
                    {/* Header */}
                    <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 flex flex-col md:flex-row items-center md:items-start gap-6 text-center md:text-left">
                        <img src={profileImage} alt={firstName} className="w-32 h-32 rounded-full border-4 border-neutral-800 shadow-xl object-cover" />
                        <div className="flex-1 space-y-4">
                            <div>
                                <h1 className="text-3xl font-black">{firstName} {lastName}</h1>
                                {role && <p className="text-lg text-neutral-400 font-medium mt-1">{role}</p>}
                            </div>
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-neutral-500">
                                {location && <span className="flex items-center gap-1.5"><MapPin size={14} /> {location}</span>}
                                {email && <span className="flex items-center gap-1.5"><Mail size={14} /> {email}</span>}
                                {phone && <span className="flex items-center gap-1.5"><Phone size={14} /> {phone}</span>}
                                <span className="flex items-center gap-1.5"><Calendar size={14} /> Joined {new Date(createdAt || Date.now()).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>

                    {/* About */}
                    {about && (
                        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 space-y-4">
                            <h2 className="text-xl font-bold flex items-center gap-2"><Briefcase size={20} className="text-blue-500" /> About</h2>
                            <p className="text-neutral-300 leading-relaxed whitespace-pre-wrap">{about}</p>
                        </div>
                    )}

                    {/* Experience */}
                    {experience.length > 0 && (
                        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 space-y-6">
                            <h2 className="text-xl font-bold flex items-center gap-2"><Building2 size={20} className="text-purple-500" /> Experience</h2>
                            <div className="space-y-6">
                                {experience.map((exp: any) => (
                                    <div key={exp.id} className="border-l-2 border-neutral-800 pl-4 py-1">
                                        <h3 className="font-bold text-lg">{exp.title}</h3>
                                        <p className="text-neutral-400 font-medium">{exp.company}</p>
                                        <p className="text-xs text-neutral-500 mt-1">
                                            {exp.startDate ? new Date(exp.startDate).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : ''} -
                                            {exp.isCurrent ? ' Present' : (exp.endDate ? ' ' + new Date(exp.endDate).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : '')}
                                        </p>
                                        {exp.description && <p className="text-sm text-neutral-300 mt-3 whitespace-pre-wrap">{exp.description}</p>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Education */}
                    {education.length > 0 && (
                        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 space-y-6">
                            <h2 className="text-xl font-bold flex items-center gap-2"><GraduationCap size={20} className="text-green-500" /> Education</h2>
                            <div className="space-y-6">
                                {education.map((edu: any) => (
                                    <div key={edu.id} className="border-l-2 border-neutral-800 pl-4 py-1">
                                        <h3 className="font-bold text-lg">{edu.school}</h3>
                                        <p className="text-neutral-400 font-medium">{edu.degree} {edu.field && `in ${edu.field}`}</p>
                                        <p className="text-xs text-neutral-500 mt-1">
                                            {edu.startDate ? new Date(edu.startDate).getFullYear() : ''} -
                                            {edu.endDate ? ' ' + new Date(edu.endDate).getFullYear() : ' Present'}
                                        </p>
                                        {edu.description && <p className="text-sm text-neutral-300 mt-2">{edu.description}</p>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Skills & Certs Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {skills.length > 0 && (
                            <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 space-y-4">
                                <h2 className="text-xl font-bold flex items-center gap-2"><BadgeCheck size={20} className="text-yellow-500" /> Skills</h2>
                                <div className="flex flex-wrap gap-2">
                                    {skills.map((s: string, i: number) => (
                                        <span key={i} className="px-3 py-1 bg-neutral-800 rounded-full text-sm font-medium border border-neutral-700">{s}</span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {certs.length > 0 && (
                            <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 space-y-4">
                                <h2 className="text-xl font-bold flex items-center gap-2"><Award size={20} className="text-orange-500" /> Certifications</h2>
                                <div className="space-y-4">
                                    {certs.map((c: any, i: number) => (
                                        <div key={i} className="flex flex-col">
                                            <span className="font-bold">{c.name}</span>
                                            <span className="text-sm text-neutral-400">{c.issuer}</span>
                                            {c.url && <a href={c.url} target="_blank" rel="noreferrer" className="text-xs text-blue-400 flex items-center gap-1 mt-1 hover:underline"><ExternalLink size={12} /> View Credential</a>}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Awards */}
                    {awards.length > 0 && (
                        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 space-y-4">
                            <h2 className="text-xl font-bold flex items-center gap-2"><Award size={20} className="text-pink-500" /> Honors & Awards</h2>
                            <div className="space-y-4">
                                {awards.map((a: any, i: number) => (
                                    <div key={i} className="border-l-2 border-neutral-800 pl-4 py-1">
                                        <h3 className="font-bold">{a.title}</h3>
                                        <p className="text-sm text-neutral-400">{a.issuer}</p>
                                        {a.description && <p className="text-sm text-neutral-300 mt-1">{a.description}</p>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Other Profiles & Links */}
                    {otherProfiles.length > 0 && (
                        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 space-y-4">
                            <h2 className="text-xl font-bold flex items-center gap-2"><LinkIcon size={20} className="text-teal-500" /> Profiles & Links</h2>
                            <div className="flex flex-wrap gap-4">
                                {otherProfiles.map((p: any, i: number) => (
                                    <a key={i} href={p.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 transition border border-neutral-700 rounded-xl text-sm font-bold">
                                        <LinkIcon size={14} /> {p.network || 'Link'}
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Posts */}
                    {recentPosts.length > 0 && (
                        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 space-y-6">
                            <h2 className="text-xl font-bold">Recent Posts</h2>
                            <div className="space-y-4">
                                {recentPosts.map((p: any) => (
                                    <div key={p.id} className="p-4 bg-black/50 border border-neutral-800 rounded-xl">
                                        <p className="text-sm text-neutral-300 whitespace-pre-wrap">{p.content}</p>
                                        {p.mediaUrls && p.mediaUrls.length > 0 && (
                                            <div className="mt-3 flex gap-2 overflow-x-auto">
                                                {p.mediaUrls.map((url: string, i: number) => (
                                                    <img key={i} src={url} alt="post media" className="h-32 object-cover rounded-lg border border-neutral-800" />
                                                ))}
                                            </div>
                                        )}
                                        <p className="text-xs text-neutral-600 mt-3">{new Date(p.date).toLocaleDateString()}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </main>
            </div>
        );
    }

    // --- EMPLOYER LOOKUP ---
    let { data: isEmp } = await supabaseAdmin
        .schema('employer')
        .from('companies')
        .select('*')
        .eq('short_url', short_url)
        .maybeSingle();

    if (isEmp) {
        const companyId = isEmp.id;
        const companyName = decryptData(isEmp.enc_company_name) || '';
        const website = decryptData(isEmp.enc_website) || '';
        const email = decryptData(isEmp.enc_work_email) || '';
        const about = decryptData(isEmp.enc_about) || '';
        const founded = decryptData(isEmp.enc_founded_year) || '';
        const industry = isEmp.industry || '';
        const logoUrl = decryptData(isEmp.enc_logo_url) || '/default-logo.png';
        const location = (isEmp.city && isEmp.country) ? `${isEmp.city}, ${isEmp.country}` : '';
        const careersLink = isEmp.careers_link || '';

        // Fetch extra sections for employer
        const [linksRes, postsRes] = await Promise.all([
            supabaseAdmin.schema('employer').from('other_profiles').select('*').eq('company_id', companyId).order('created_at', { ascending: false }),
            supabaseAdmin.schema('employer').from('posts').select('*').eq('company_id', companyId).order('created_at', { ascending: false }).limit(5)
        ]);

        const otherProfiles = (linksRes.data || []).map((l: any) => ({
            network: decryptData(l.enc_network),
            url: decryptData(l.enc_url)
        }));

        const recentPosts = (postsRes.data || []).map((p: any) => ({
            id: p.id,
            content: p.content,
            date: p.created_at,
            mediaUrls: p.media_urls
        }));

        return (
            <div className="min-h-screen bg-[#020617] text-white">
                <nav className="fixed top-0 inset-x-0 z-50 bg-[#020617]/80 backdrop-blur-md border-b border-white/5 h-16 flex items-center justify-between px-6">
                    <Link href="/" className="font-black text-xl tracking-tight">PROFCARIA</Link>
                    <Link href="/auth" className="text-xs font-bold uppercase tracking-widest px-4 py-2 border border-white/20 rounded-full hover:bg-white hover:text-black transition-all">
                        Log In
                    </Link>
                </nav>
                <main className="pt-24 pb-20 px-4 max-w-4xl mx-auto space-y-6">
                    {/* Header */}
                    <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 flex flex-col md:flex-row items-center md:items-start gap-6 text-center md:text-left">
                        <img src={logoUrl} alt={companyName} className="w-32 h-32 rounded-2xl border-4 border-neutral-800 shadow-xl object-cover bg-white p-1" />
                        <div className="flex-1 space-y-4">
                            <div>
                                <h1 className="text-3xl font-black">{companyName}</h1>
                                {industry && <p className="text-lg text-blue-400 font-bold mt-1 uppercase tracking-wider text-sm">{industry}</p>}
                            </div>
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-neutral-400">
                                {location && <span className="flex items-center gap-1.5"><MapPin size={14} /> {location}</span>}
                                {founded && <span className="flex items-center gap-1.5"><Calendar size={14} /> Founded: {founded}</span>}
                                {email && <span className="flex items-center gap-1.5"><Mail size={14} /> {email}</span>}
                            </div>
                            <div className="pt-2 flex flex-wrap justify-center md:justify-start gap-3">
                                {website && (
                                    <a href={website} target="_blank" rel="noreferrer" className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-full font-bold text-sm transition-all shadow-lg flex items-center gap-2">
                                        <ExternalLink size={16} /> Website
                                    </a>
                                )}
                                {careersLink && (
                                    <a href={careersLink} target="_blank" rel="noreferrer" className="border border-neutral-700 hover:bg-neutral-800 text-white px-6 py-2.5 rounded-full font-bold text-sm transition-all flex items-center gap-2">
                                        <Briefcase size={16} /> Careers Page
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* About */}
                    {about && (
                        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 space-y-4">
                            <h2 className="text-xl font-bold flex items-center gap-2"><Building2 size={20} className="text-blue-500" /> About Company</h2>
                            <p className="text-neutral-300 leading-relaxed whitespace-pre-wrap">{about}</p>
                        </div>
                    )}

                    {/* Other Profiles & Links */}
                    {otherProfiles.length > 0 && (
                        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 space-y-4">
                            <h2 className="text-xl font-bold flex items-center gap-2"><LinkIcon size={20} className="text-teal-500" /> Socials & Links</h2>
                            <div className="flex flex-wrap gap-4">
                                {otherProfiles.map((p: any, i: number) => (
                                    <a key={i} href={p.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 transition border border-neutral-700 rounded-xl text-sm font-bold">
                                        <LinkIcon size={14} /> {p.network || 'Link'}
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Posts */}
                    {recentPosts.length > 0 && (
                        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 space-y-6">
                            <h2 className="text-xl font-bold">Recent Updates</h2>
                            <div className="space-y-4">
                                {recentPosts.map((p: any) => (
                                    <div key={p.id} className="p-4 bg-black/50 border border-neutral-800 rounded-xl">
                                        <p className="text-sm text-neutral-300 whitespace-pre-wrap">{p.content}</p>
                                        {p.mediaUrls && p.mediaUrls.length > 0 && (
                                            <div className="mt-3 flex gap-2 overflow-x-auto">
                                                {p.mediaUrls.map((url: string, i: number) => (
                                                    <img key={i} src={url} alt="post media" className="h-32 object-cover rounded-lg border border-neutral-800" />
                                                ))}
                                            </div>
                                        )}
                                        <p className="text-xs text-neutral-600 mt-3">{new Date(p.date).toLocaleDateString()}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </main>
            </div>
        );
    }

    // 3. Not found
    notFound();
}
