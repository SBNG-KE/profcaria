"use client"

import React from 'react';
import { ArrowRight, FileText } from 'lucide-react';

interface PostsPreviewProps {
    isDark: boolean;
    latestPost?: any;
    onViewAll?: () => void;
    userId?: string;
    userType?: 'professional' | 'employer';
}

const PostsPreview = ({ isDark, latestPost: initialPost, onViewAll, userId, userType }: PostsPreviewProps) => {
    const [fetchedPost, setFetchedPost] = React.useState<any>(null);
    const [loading, setLoading] = React.useState(false);

    React.useEffect(() => {
        if (!initialPost && userId) {
            setLoading(true);
            const endpoint = userType === 'employer' ? '/api/employer/posts' : `/api/professional/posts?userId=${userId}`;
            fetch(endpoint)
                .then(res => res.json())
                .then(data => {
                    const posts = data.posts || [];
                    if (posts.length > 0) setFetchedPost(posts[0]);
                })
                .catch(err => console.error(err))
                .finally(() => setLoading(false));
        }
    }, [userId, userType, initialPost]);

    const displayPost = initialPost || fetchedPost;

    if (loading && !displayPost) {
        return <div className="py-8 text-center text-sm opacity-50">Loading updates...</div>;
    }

    return (
        <div className="space-y-4 pt-8">
            <div className="flex items-center justify-between">
                <h2 className={`text-xl font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-black'}`}>
                    <FileText size={20} /> Latest Update
                </h2>
                {onViewAll && (
                    <button
                        onClick={onViewAll}
                        className={`flex items-center gap-2 text-sm font-bold hover:underline ${isDark ? 'text-neutral-400 hover:text-white' : 'text-neutral-500 hover:text-black'}`}
                    >
                        View All <ArrowRight size={16} />
                    </button>
                )}
            </div>

            {displayPost ? (
                <div className={`p-6 rounded-[32px] border group cursor-pointer transition-all hover:scale-[1.01] ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200 shadow-sm'}`} onClick={onViewAll}>
                    <p className={`line-clamp-3 text-sm leading-relaxed ${isDark ? 'text-neutral-300' : 'text-neutral-600'}`}>
                        {displayPost.content}
                    </p>
                    {/* Media Preview */}
                    {displayPost.media && displayPost.media.length > 0 && (
                        <div className="mt-4 h-48 w-full rounded-2xl overflow-hidden bg-neutral-100 dark:bg-neutral-800">
                            {displayPost.media[0].type === 'video' ? (
                                <video src={displayPost.media[0].url} className="w-full h-full object-cover" controls onClick={e => e.stopPropagation()} />
                            ) : (
                                <img src={displayPost.media[0].url} className="w-full h-full object-cover" alt="Post media" />
                            )}
                        </div>
                    )}

                    {/* Stats */}
                    <div className={`mt-4 flex items-center gap-4 text-xs font-bold uppercase tracking-widest ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>
                        <span>{displayPost.timestamp || 'Just now'}</span>
                        <span>•</span>
                        <span>{displayPost.likesCount || 0} Likes</span>
                    </div>
                </div>
            ) : (
                <div className={`p-8 rounded-[32px] border text-center ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200 shadow-sm'}`}>
                    <p className={`text-sm font-medium ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>No updates yet.</p>
                </div>
            )}
        </div>
    );
};

export default PostsPreview;
