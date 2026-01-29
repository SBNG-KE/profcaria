"use client"

import React, { useState } from 'react';
import { Mail, Globe, Copy, Check, MapPin, Link2, Phone } from 'lucide-react';

interface ContactInfoCardProps {
    email?: string | null;
    phone?: string | null;
    website?: string | null;
    city?: string | null;
    country?: string | null;
    profileLink: string;
}

export default function ContactInfoCard({ email, phone, website, city, country, profileLink, isDark = false }: ContactInfoCardProps & { isDark?: boolean }) {
    const [copiedField, setCopiedField] = useState<string | null>(null);

    const handleCopy = (text: string, field: string) => {
        navigator.clipboard.writeText(text);
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 2000);
    };

    const labelClass = `text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`;
    const valueClass = `flex items-center gap-2 font-medium truncate ${isDark ? 'text-neutral-300' : 'text-black'}`;
    const cardClass = `flex items-center justify-between p-2 rounded-xl border border-transparent overflow-hidden bg-transparent transition-colors ${isDark ? 'hover:bg-neutral-800' : 'hover:bg-neutral-50'}`;
    const iconButtonClass = `p-1.5 rounded-lg transition-all ${isDark ? 'text-neutral-400 hover:text-white hover:bg-white/10' : 'text-neutral-400 hover:text-black hover:bg-black/5'} opacity-0 group-hover:opacity-100`;

    return (
        <div className="flex-1 w-full space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Email */}
                {email && (
                    <div className="space-y-1 group">
                        <label className={labelClass}>Work Email</label>
                        <div className={cardClass}>
                            <div className={valueClass}>
                                <Mail size={16} /> <span className="truncate">{email}</span>
                            </div>
                            <button
                                onClick={() => handleCopy(email, 'email')}
                                className={iconButtonClass}
                                title="Copy Email"
                            >
                                {copiedField === 'email' ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                            </button>
                        </div>
                    </div>
                )}

                {/* Phone */}
                {phone && (
                    <div className="space-y-1 group">
                        <label className={labelClass}>Phone</label>
                        <div className={cardClass}>
                            <div className={valueClass}>
                                <Phone size={16} /> <span className="truncate">{phone}</span>
                            </div>
                            <button
                                onClick={() => handleCopy(phone, 'phone')}
                                className={iconButtonClass}
                                title="Copy Phone"
                            >
                                {copiedField === 'phone' ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                            </button>
                        </div>
                    </div>
                )}

                {/* Website */}
                {website && (
                    <div className="space-y-1 group">
                        <label className={labelClass}>Website</label>
                        <div className={cardClass}>
                            <a href={website} target="_blank" rel="noopener noreferrer" className={`${valueClass} hover:underline`}>
                                <Globe size={16} /> <span className="truncate">{website}</span>
                            </a>
                            <button
                                onClick={() => handleCopy(website, 'website')}
                                className={iconButtonClass}
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
                    <label className={labelClass}>Location</label>
                    <div className={`${valueClass} px-2`}>
                        <MapPin size={16} /> {city || ''}{city && country ? ', ' : ''}{country || ''}
                    </div>
                </div>
            )}

            {/* Profile Link */}
            <div className="space-y-2">
                <label className={labelClass}>Profile Link</label>
                <div className={`grid grid-cols-[1fr_auto] items-center p-1.5 rounded-xl border group ${isDark ? 'bg-neutral-950 border-neutral-800' : 'bg-white border-neutral-200'}`}>
                    <div className={`px-3 text-sm truncate min-w-0 ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                        {profileLink}
                    </div>
                    <button
                        onClick={() => handleCopy(profileLink, 'link')}
                        className={`p-2 rounded-lg transition-colors shrink-0 ${copiedField === 'link' ? 'bg-green-500/10 text-green-500' : isDark ? 'hover:bg-neutral-800 text-neutral-400' : 'hover:bg-neutral-100 text-neutral-400'}`}
                        title="Copy Profile Link"
                    >
                        {copiedField === 'link' ? <Check size={16} /> : <Copy size={16} />}
                    </button>
                </div>
            </div>
        </div>
    );
}
