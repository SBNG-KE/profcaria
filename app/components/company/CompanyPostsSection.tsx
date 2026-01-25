"use client"

import React, { useState, useEffect } from 'react';
import PostsPreview from '@/app/components/professional/PostsPreview';
import SlideOverPanel from '@/app/components/ui/SlideOverPanel';
import PostCard from '@/app/components/professional/PostCard';
import { useTheme } from '@/app/context/ThemeContext';
import { Loader2 } from 'lucide-react';

interface CompanyPostsSectionProps {
    companyId: string;
    latestPost: any; // Initial latest post passed from server
}

export default function CompanyPostsSection({ companyId, latestPost }: CompanyPostsSectionProps) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const [isSlideOverOpen, setIsSlideOverOpen] = useState(false);
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [hasFetched, setHasFetched] = useState(false);

    const handleViewAll = async () => {
        setIsSlideOverOpen(true);
        if (!hasFetched) {
            setLoading(true);
            try {
                // Fetch all posts for this company
                const res = await fetch(`/api/employer/posts?companyId=${companyId}`);
                if (res.ok) {
                    const data = await res.json();
                    setPosts(data.posts || []);
                }
            } catch (error) {
                console.error("Error fetching company posts", error);
            } finally {
                setLoading(false);
                setHasFetched(true);
            }
        }
    };

    return (
        <>
            <PostsPreview
                isDark={isDark}
                latestPost={latestPost}
                onViewAll={handleViewAll}
            />

            <SlideOverPanel
                isOpen={isSlideOverOpen}
                onClose={() => setIsSlideOverOpen(false)}
                title="Company Posts"
                isDark={isDark}
            >
                <div className="space-y-6 pb-20">
                    {loading ? (
                        <div className="flex justify-center p-8">
                            <Loader2 className={`animate-spin ${isDark ? 'text-white' : 'text-black'}`} />
                        </div>
                    ) : posts.length > 0 ? (
                        posts.map(post => (
                            <PostCard
                                key={post.id}
                                post={{ ...post, author: { ...post.author, type: 'employer' } }} // Ensure type is employer
                                isDark={isDark}
                                currentUserId="" // View only mostly
                                // Disable actions for now or implement if needed
                                onLike={() => { }}
                                onRepost={() => { }}
                                onShare={() => { }}
                                onFollow={() => { }}
                                onReport={() => { }}
                                onDelete={() => { }}
                                onEdit={() => { }}
                                onCommentAdded={() => { }}
                            />
                        ))
                    ) : (
                        <div className="text-center p-8 text-neutral-500">No posts found.</div>
                    )}
                </div>
            </SlideOverPanel>
        </>
    );
}
