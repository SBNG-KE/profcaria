"use client"

import React, { useState } from 'react';
import PostsPreview from '@/app/components/professional/PostsPreview';
import SlideOverPanel from '@/app/components/ui/SlideOverPanel';
import PostCard from '@/app/components/professional/PostCard';
import { useTheme } from '@/app/context/ThemeContext';
import { Loader2 } from 'lucide-react';

interface ProfessionalPostsSectionProps {
    userId: string;
    latestPost: any; // Initial latest post passed from server
}

export default function ProfessionalPostsSection({ userId, latestPost }: ProfessionalPostsSectionProps) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const [isSlideOverOpen, setIsSlideOverOpen] = useState(false);
    const [reposts, setReposts] = useState<any[]>([]);
    const [hasFetchedReposts, setHasFetchedReposts] = useState(false);
    const [isLoadingReposts, setIsLoadingReposts] = useState(false);

    const handleViewAll = async () => {
        setIsSlideOverOpen(true);
        if (!hasFetched) {
            setLoading(true);
            try {
                // Fetch all posts for this professional
                const res = await fetch(`/api/professional/posts?userId=${userId}`);
                if (res.ok) {
                    const data = await res.json();
                    setPosts(data.posts || []);
                }
            } catch (error) {
                console.error("Error fetching professional posts", error);
            } finally {
                setLoading(false);
                setHasFetched(true);
            }
        }
    };

    // Fetch Reposts when tab changes
    React.useEffect(() => {
        if (isSlideOverOpen && activeTab === 'REPOSTS' && !hasFetchedReposts) {
            const fetchReposts = async () => {
                setIsLoadingReposts(true);
                try {
                    const res = await fetch(`/api/professional/posts?userId=${userId}&type=reposts`);
                    if (res.ok) {
                        const data = await res.json();
                        setReposts(data.posts || []);
                    }
                } catch (error) {
                    console.error("Error fetching reposts", error);
                } finally {
                    setIsLoadingReposts(false);
                    setHasFetchedReposts(true);
                }
            };
            fetchReposts();
        }
    }, [activeTab, isSlideOverOpen, hasFetchedReposts, userId]);

    return (
        <>
            <PostsPreview
                isDark={isDark}
                latestPost={latestPost}
                onViewAll={handleViewAll}
                title="Activity"
                userId={userId}
                userType="professional"
            />

            <SlideOverPanel
                isOpen={isSlideOverOpen}
                onClose={() => setIsSlideOverOpen(false)}
                title="Activity"
                isDark={isDark}
                className="max-w-2xl"
            >
                {/* Tabs */}
                <div className={`flex items-center gap-8 mb-6 border-b ${isDark ? 'border-neutral-800' : 'border-neutral-200'}`}>
                    {['POSTS', 'REPOSTS'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab as 'POSTS' | 'REPOSTS')}
                            className={`pb-3 text-xs font-bold tracking-widest transition-colors relative ${activeTab === tab ? (isDark ? 'text-white' : 'text-black') : (isDark ? 'text-neutral-500 hover:text-neutral-300' : 'text-neutral-400 hover:text-neutral-600')}`}
                        >
                            {tab}
                            {activeTab === tab && (
                                <div className={`absolute bottom-0 left-0 right-0 h-0.5 ${isDark ? 'bg-white' : 'bg-black'}`} />
                            )}
                        </button>
                    ))}
                </div>

                <div className="space-y-6 pb-20">
                    {activeTab === 'POSTS' ? (
                        loading ? (
                            <div className="flex justify-center p-8">
                                <Loader2 className={`animate-spin ${isDark ? 'text-white' : 'text-black'}`} />
                            </div>
                        ) : posts.length > 0 ? (
                            posts.map(post => (
                                <PostCard
                                    key={post.id}
                                    post={post}
                                    isDark={isDark}
                                    currentUserId="" // View only
                                    onLike={() => { }}
                                    onRepost={() => { }}
                                    onShare={() => { }}
                                    onFollow={() => { }}
                                />
                            ))
                        ) : (
                            <div className="text-center p-8 text-neutral-500">No posts.</div>
                        )
                    ) : (
                        isLoadingReposts ? (
                            <div className="flex justify-center p-8">
                                <Loader2 className={`animate-spin ${isDark ? 'text-white' : 'text-black'}`} />
                            </div>
                        ) : reposts.length > 0 ? (
                            reposts.map(post => (
                                <PostCard
                                    key={post.repostId || post.id}
                                    post={post}
                                    isDark={isDark}
                                    currentUserId="" // View only
                                    onLike={() => { }}
                                    onRepost={() => { }}
                                    onShare={() => { }}
                                    onFollow={() => { }}
                                />
                            ))
                        ) : (
                            <div className="text-center p-8 text-neutral-500">No reposts yet.</div>
                        )
                    )}
                </div>
            </SlideOverPanel>
        </>
    );
}
