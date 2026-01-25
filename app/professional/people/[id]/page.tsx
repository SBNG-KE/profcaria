
import React from 'react';
import { notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase';
import { decryptData } from '@/lib/security';
import { User, MapPin, Calendar, Briefcase, Users, Link as LinkIcon, Building2 } from 'lucide-react';
import FollowButton from '@/app/components/network/FollowButton';
import { getAuthenticatedUser } from '@/lib/auth-helper';

export const dynamic = 'force-dynamic';

export default async function PublicProfilePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const currentUser = await getAuthenticatedUser();

    // Fetch User Data
    const { data: user, error } = await supabaseAdmin
        .schema('professional')
        .from('users')
        .select('*')
        .eq('id', id)
        .single();

    if (error || !user) {
        notFound();
    }

    // Decrypt Data
    const firstName = decryptData(user.enc_first_name) || '';
    const lastName = decryptData(user.enc_last_name) || '';
    const fullName = `${firstName} ${lastName}`.trim() || 'Professional';
    const profileImage = decryptData(user.enc_profile_image_url);
    const about = decryptData(user.enc_about);
    const location = decryptData(user.enc_location);
    const role = user.primary_role;
    const headline = decryptData(user.enc_headline) || role;

    // Check generic follower status server-side or let FollowButton handle it client-side.
    // FollowButton handles it client-side via API 'check'.
    // But we pass initialIsFollowing if possible to avoid flicker?
    // Let's keep it simple and let FollowButton check.

    // Also fetch generic stats (connections etc) if needed, but follower_count is on user.

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-neutral-900 pb-20">
            {/* Header / Cover */}
            <div className="h-48 bg-gradient-to-r from-blue-600 to-indigo-700 relative">
                {/* Back Button handled by Layout usually, or browser */}
            </div>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 relative -mt-20">
                {/* Profile Card */}
                <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-800 p-6 sm:p-8">
                    <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6">
                        {/* Avatar */}
                        <div className="relative">
                            <div className="w-40 h-40 rounded-full border-4 border-white dark:border-neutral-900 overflow-hidden bg-white shadow-md">
                                {profileImage ? (
                                    <img src={profileImage} alt={fullName} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-neutral-100 text-neutral-400">
                                        <User size={64} />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Basic Info */}
                        <div className="flex-1 text-center sm:text-left space-y-2 pb-2">
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{fullName}</h1>
                            {headline && <p className="text-lg font-medium text-gray-600 dark:text-neutral-300">{headline}</p>}

                            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-sm text-gray-500 dark:text-neutral-400 mt-2">
                                {location && (
                                    <div className="flex items-center gap-1">
                                        <MapPin size={16} />
                                        <span>{location}</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-1">
                                    <Users size={16} />
                                    <span>{user.follower_count || 0} followers</span>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col gap-3 min-w-[140px]">
                            {currentUser?.id !== user.id && (
                                <FollowButton
                                    targetId={user.id}
                                    type="user"
                                    size="lg"
                                    className="w-full"
                                />
                            )}
                            {/* Message button placeholder */}
                            {/* <button className="px-4 py-2 rounded-lg border border-neutral-300 font-medium hover:bg-neutral-50 dark:border-neutral-700 dark:text-white dark:hover:bg-neutral-800">
                                Message
                            </button> */}
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="h-px bg-neutral-200 dark:bg-neutral-800 my-8" />

                    {/* About Section */}
                    {about && (
                        <div className="space-y-4">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">About</h2>
                            <p className="whitespace-pre-wrap text-gray-600 dark:text-neutral-300 leading-relaxed">
                                {about}
                            </p>
                        </div>
                    )}

                    {!about && (
                        <div className="text-center py-8 text-neutral-500 italic">
                            No about information provided.
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}
