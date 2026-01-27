"use client"

import React, { useState } from 'react';
import { Mail, Globe, Copy, Check, MapPin, Link2 } from 'lucide-react';

interface ContactInfoCardProps {
    email?: string | null;
    website?: string | null;
    city?: string | null;
    country?: string | null;
    profileLink: string;
}

export default function ContactInfoCard({ email, website, city, country, profileLink }: ContactInfoCardProps) {
    const [copiedField, setCopiedField] = useState<string | null>(null);

    const handleCopy = (text: string, field: string) => {
        navigator.clipboard.writeText(text);
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 2000);
    };

    return (
        <div className="flex-1 w-full space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Email */}
                {email && (
                    <div className="space-y-1 group">
                        <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Work Email</label>
                        <div className="flex items-center justify-between p-2 rounded-xl border border-transparent hover:bg-neutral-50 dark:hover:bg-neutral-800 overflow-hidden bg-transparent transition-colors">
                            <div className="flex items-center gap-2 font-medium text-neutral-700 dark:text-neutral-300 truncate">
                                <Mail size={16} /> <span className="truncate">{email}</span>
                            </div>
                            <button
                                onClick={() => handleCopy(email, 'email')}
                                className="p-1.5 rounded-lg text-neutral-400 hover:text-black dark:hover:text-white bg-transparent hover:bg-black/5 dark:hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-all"
                                title="Copy Email"
                            >
                                {copiedField === 'email' ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                            </button>
                        </div>
                    </div>
                )}

                {/* Website */}
                {website && (
                    <div className="space-y-1 group">
                        <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Website</label>
                        <div className="flex items-center justify-between p-2 rounded-xl border border-transparent hover:bg-neutral-50 dark:hover:bg-neutral-800 overflow-hidden bg-transparent transition-colors">
                            <a href={website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 font-medium hover:underline text-neutral-700 dark:text-neutral-300 truncate">
                                <Globe size={16} /> <span className="truncate">{website}</span>
                            </a>
                            <button
                                onClick={() => handleCopy(website, 'website')}
                                className="p-1.5 rounded-lg text-neutral-400 hover:text-black dark:hover:text-white bg-transparent hover:bg-black/5 dark:hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-all"
                                title="Copy Website Link"
                            >
                                {copiedField === 'website' ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Location */}
            {(city || country) && (
                <div className="space-y-1 pt-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Location</label>
                    <div className="flex items-center gap-2 font-medium text-neutral-700 dark:text-neutral-300 px-2">
                        <MapPin size={16} /> {city || ''}{city && country ? ', ' : ''}{country || ''}
                    </div>
                </div>
            )}

            {/* Profile Link */}
            <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Profile Link</label>
                <div className="flex items-center p-1.5 rounded-xl border bg-white border-neutral-200 dark:bg-neutral-950 dark:border-neutral-800 group">
                    <div className="px-3 text-sm truncate flex-1 text-neutral-600 dark:text-neutral-400">
                        {profileLink}
                    </div>
                    <button
                        onClick={() => handleCopy(profileLink, 'link')}
                        className={`p-2 rounded-lg transition-colors ${copiedField === 'link' ? 'bg-green-500/10 text-green-500' : 'hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400'}`}
                        title="Copy Profile Link"
                    >
                        {copiedField === 'link' ? <Check size={16} /> : <Copy size={16} />}
                    </button>
                </div>
            </div>
        </div>
    );
}
