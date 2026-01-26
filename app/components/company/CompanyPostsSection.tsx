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
    const [activeTab, setActiveTab] = useState<'POSTS' | 'REPOSTS'>('POSTS');
    const [reposts, setReposts] = useState<any[]>([]);
    const [hasFetchedReposts, setHasFetchedReposts] = useState(false);
    const [isLoadingReposts, setIsLoadingReposts] = useState(false);

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

    // Fetch Reposts when tab changes
    useEffect(() => {
        if (isSlideOverOpen && activeTab === 'REPOSTS' && !hasFetchedReposts) {
            const fetchReposts = async () => {
                setIsLoadingReposts(true);
                try {
                    const res = await fetch(`/api/employer/posts?companyId=${companyId}&type=reposts`);
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
    }, [activeTab, isSlideOverOpen, hasFetchedReposts, companyId]);

    const updatePostState = (postId: string, updates: any) => {
        setPosts(prev => prev.map(p => p.id === postId ? { ...p, ...updates } : p));
        setReposts(prev => prev.map(p => p.id === postId ? { ...p, ...updates } : p));
    };

    const handleLike = async (post: any) => {
        const isLiking = !post.isLiked;
        const newCount = post.likesCount + (isLiking ? 1 : -1);
        updatePostState(post.id, { isLiked: isLiking, likesCount: newCount });

        try {
            await fetch(`/api/professional/posts/${post.id}/like`, { method: 'POST' });
        } catch (error) {
            updatePostState(post.id, { isLiked: !isLiking, likesCount: post.likesCount });
        }
    };

    const handleRepost = async (post: any) => {
        const isReposting = !post.isReposted;
        const newCount = post.repostsCount + (isReposting ? 1 : -1);
        updatePostState(post.id, { isReposted: isReposting, repostsCount: newCount });

        try {
            const method = isReposting ? 'POST' : 'DELETE';
            const res = await fetch(`/api/professional/posts/${post.id}/repost`, { method });

            // If we tried to repost and got 409 (Already Reposted), treat as success.
            // The optimistic update set it to true, so we keep it true.
            if (isReposting && res.status === 409) {
                return;
            }

            if (!res.ok) throw new Error();
        } catch (error) {
            updatePostState(post.id, { isReposted: !isReposting, repostsCount: post.repostsCount });
        }
    };

    return (
        <>
            <PostsPreview
                isDark={isDark}
                latestPost={latestPost}
                onViewAll={handleViewAll}
                title="Posts"
                userId={companyId}
                userType="employer"
            />

            <SlideOverPanel
                isOpen={isSlideOverOpen}
                onClose={() => setIsSlideOverOpen(false)}
                title="Company Posts"
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
                                    post={{ ...post, author: { ...post.author, type: 'employer' } }}
                                    isDark={isDark}
                                    currentUserId=""
                                    onLike={() => handleLike(post)}
                                    onRepost={() => handleRepost(post)}
                                    onShare={() => { }}
                                    onFollow={() => { }}
                                />
                            ))
                        ) : (
                            <div className="text-center p-8 text-neutral-500">No posts found.</div>
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
                                    currentUserId=""
                                    onLike={() => handleLike(post)}
                                    onRepost={() => handleRepost(post)}
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
