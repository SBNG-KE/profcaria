"use client"

import React from 'react';
import { ArrowRight, FileText } from 'lucide-react';
import PostCard from './PostCard';

interface PostsPreviewProps {
    isDark: boolean;
    latestPost?: any;
    onViewAll?: () => void;
    userId?: string;
    userType?: 'professional' | 'employer';
    title?: string;
    currentUserId?: string;
}

const PostsPreview = ({ isDark, latestPost: initialPost, onViewAll, userId, userType, title = "Latest Update", currentUserId = "" }: PostsPreviewProps) => {
    const [fetchedPost, setFetchedPost] = React.useState<any>(null);
    const [loading, setLoading] = React.useState(false);

    React.useEffect(() => {
        if (!initialPost && userId) {
            setLoading(true);
            const endpoint = userType === 'employer' ? `/api/employer/posts?companyId=${userId}` : `/api/professional/posts?userId=${userId}`;
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
                    <FileText size={20} /> {title}
                </h2>
                {onViewAll && (
                    <button
                        onClick={onViewAll}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${isDark ? 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700 hover:text-white' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 hover:text-black'}`}
                    >
                        View All <ArrowRight size={16} />
                    </button>
                )}
            </div>

            {displayPost ? (
                <div onClick={onViewAll} className="cursor-pointer">
                    <PostCard
                        post={displayPost}
                        isDark={isDark}
                        currentUserId={currentUserId}
                        readOnly={true}
                        forceVertical={true}
                    // Disable actions since it's a preview
                    />
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
