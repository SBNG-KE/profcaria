"use client"

import React, { useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    Heart, MessageCircle, Share2, MoreHorizontal, Edit3, Repeat2, X, Image, Link2, MapPin, Users, Send, Search, Flag, Edit2, Trash2, ChevronLeft
} from 'lucide-react';
import { useTheme } from '@/app/context/ThemeContext';
import PostCard from '@/app/components/professional/PostCard';


// Post Creation/Edit Modal
// Duplicate of Professional's for now, should be unified in components/shared
const PostCreationModal = ({ isOpen, onClose, isDark, onPost, initialData }: {
    isOpen: boolean,
    onClose: () => void,
    isDark: boolean,
    onPost: (data: { content: string, mediaUrls: string[], linkMedia?: string }) => void,
    initialData?: { content: string, mediaUrls: string[], linkMedia?: string } | null
}) => {
    const [content, setContent] = useState('');
    const [images, setImages] = useState<string[]>([]);
    const [linkMedia, setLinkMedia] = useState('');
    const [linkPreview, setLinkPreview] = useState<any>(null);
    const [showLinkInput, setShowLinkInput] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [isFetchingPreview, setIsFetchingPreview] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [userDismissedLink, setUserDismissedLink] = useState(false);

    // Mentions State
    const [mentionQuery, setMentionQuery] = useState<string | null>(null);
    const [mentionResults, setMentionResults] = useState<any[]>([]);
    const [mentionIndex, setMentionIndex] = useState<number>(-1);
    const [mentionsList, setMentionsList] = useState<{ id: string, name: string, type: string }[]>([]);
    const [isSearchingMentions, setIsSearchingMentions] = useState(false);

    // Initialize with data if editing
    useEffect(() => {
        if (isOpen && initialData) {
            setContent(initialData.content);
            setImages(initialData.mediaUrls || []);
            setLinkMedia(initialData.linkMedia || '');
            if (initialData.linkMedia) setShowLinkInput(true);
        } else if (isOpen && !initialData) {
            // Reset if opening fresh
            setContent('');
            setImages([]);
            setLinkMedia('');
            setLinkPreview(null);
            setShowLinkInput(false);
            setUserDismissedLink(false);
        }
    }, [isOpen, initialData]);

    // Auto-detect link in content
    useEffect(() => {
        if (initialData) return;
        if (images.length > 0 || linkMedia || userDismissedLink) return;

        // Robust URL detection (http/https/www/domain.com)
        const urlMatch = content.match(/((?:https?:\/\/|www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,10}\b(?:[-a-zA-Z0-9@:%_\+.~#?&//=]*))/i);
        if (urlMatch) {
            setLinkMedia(urlMatch[0]);
        }
    }, [content, images.length, linkMedia, userDismissedLink, initialData]);

    // Mentions Detection
    useEffect(() => {
        const lastChar = content.slice(-1);
        const matches = content.match(/@(\w*)$/);
        if (matches) {
            setMentionQuery(matches[1]);
            setMentionIndex(matches.index!);
        } else {
            setMentionQuery(null);
            setMentionResults([]);
        }
    }, [content]);

    // Fetch Mentions
    useEffect(() => {
        if (mentionQuery === null) return;

        setIsSearchingMentions(true);
        const timer = setTimeout(async () => {
            try {
                const res = await fetch(`/api/search/users?q=${encodeURIComponent(mentionQuery)}`);
                if (res.ok) {
                    const data = await res.json();
                    setMentionResults(data.results || []);
                }
            } catch (err) { console.error(err); } finally { setIsSearchingMentions(false); }
        }, 300);
        return () => clearTimeout(timer);
    }, [mentionQuery]);

    const insertMention = (user: { id: string, name: string, type: string }) => {
        const before = content.slice(0, mentionIndex);
        const after = content.slice(mentionIndex + (mentionQuery?.length || 0) + 1);
        const newContent = `${before}@${user.name} ${after}`;
        setContent(newContent);
        setMentionsList(prev => [...prev, { id: user.id, name: user.name, type: user.type }]);
        setMentionQuery(null);
        setMentionResults([]);
    };

    // Fetch link preview
    useEffect(() => {
        if (!linkMedia) {
            setLinkPreview(null);
            return;
        }
        const fetchPreview = async () => {
            setIsFetchingPreview(true);
            try {
                const res = await fetch(`/api/link-preview?url=${encodeURIComponent(linkMedia)}`);
                if (res.ok) {
                    const data = await res.json();
                    setLinkPreview(data);
                }
            } catch (err) { console.error(err); } finally { setIsFetchingPreview(false); }
        };
        const timer = setTimeout(fetchPreview, 500); // Debounce
        return () => clearTimeout(timer);
    }, [linkMedia]);
    const wordCount = content.trim().split(/\s+/).filter(w => w.length > 0).length;

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length) return;
        setIsUploading(true);
        try {
            const file = e.target.files[0];
            const res = await fetch(`/api/upload?filename=${encodeURIComponent(file.name)}`, { method: 'POST', body: file });
            if (res.ok) { const { url } = await res.json(); setImages(prev => [...prev, url]); setLinkMedia(''); }
        } catch (err) { console.error(err); } finally { setIsUploading(false); }
    };

    const handlePost = () => {
        const hasContent = content.trim().length > 0;
        const hasMedia = images.length > 0 || !!linkPreview;

        if ((!hasContent && !hasMedia) || wordCount > 500) return;
        onPost({
            content: content.trim(),
            mediaUrls: images,
            linkMedia: linkMedia || undefined,
            linkPreview: linkPreview || undefined,
            mentions: mentionsList
        } as any);
        setContent(''); setImages([]); setLinkMedia(''); onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className={`relative w-full h-[100dvh] sm:h-auto max-w-xl sm:max-h-[90vh] overflow-y-auto rounded-none sm:rounded-2xl flex flex-col ${isDark ? 'bg-neutral-900' : 'bg-white'}`}>
                <div className={`sticky top-0 z-10 p-4 flex items-center justify-between border-b ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'}`}>
                    <button onClick={onClose} className={`p-1.5 rounded-full ${isDark ? 'hover:bg-neutral-800 text-neutral-400' : 'hover:bg-neutral-100 text-neutral-500'}`}><X size={20} /></button>
                    <h2 className={`font-bold text-base ${isDark ? 'text-white' : 'text-black'}`}>{initialData ? 'Edit Post' : 'Create Post'}</h2>
                    <div className="w-8" />
                </div>
                <div className={`p-3 flex items-center gap-2 border-b ${isDark ? 'border-neutral-800' : 'border-neutral-200'}`}>
                    <input ref={fileInputRef} type="file" accept="image/*,video/mp4,video/webm,video/ogg,video/quicktime" className="hidden" onChange={handleImageUpload} />
                    <button onClick={() => fileInputRef.current?.click()} disabled={isUploading || !!linkMedia} className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium ${isDark ? 'bg-neutral-800 text-white' : 'bg-neutral-100 text-black'}`}><Image size={16} />{isUploading ? 'Uploading...' : 'Add Media'}</button>
                    <button onClick={() => setShowLinkInput(!showLinkInput)} disabled={images.length > 0} className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium ${isDark ? 'bg-neutral-800 text-white' : 'bg-neutral-100 text-black'}`}><Link2 size={16} />Link as Media</button>
                </div>
                {showLinkInput && images.length === 0 && (
                    <div className={`p-3 border-b ${isDark ? 'border-neutral-800' : 'border-neutral-200'}`}>
                        <input type="url" value={linkMedia} onChange={(e) => setLinkMedia(e.target.value)} placeholder="Paste link URL..." className={`w-full px-3 py-2 rounded-lg text-sm ${isDark ? 'bg-neutral-800 text-white placeholder-neutral-500' : 'bg-neutral-100 text-black placeholder-neutral-400'}`} />
                    </div>
                )}

                {images.length > 0 && (
                    <div className={`p-3 border-b ${isDark ? 'border-neutral-800' : 'border-neutral-200'}`}>
                        <div className="grid grid-cols-2 gap-2">
                            {images.map((url, idx) => (
                                <div key={idx} className="relative aspect-video rounded-lg overflow-hidden">
                                    {url.match(/\.(mp4|webm|ogg|mov)$/i) ? (
                                        <video src={url} className="w-full h-full object-cover" controls />
                                    ) : (
                                        <img src={url} alt="" className="w-full h-full object-contain bg-neutral-100 dark:bg-neutral-800" />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                <div className="p-4 relative">
                    <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="What do you want to talk about?" className={`w-full min-h-[150px] resize-none text-base focus:outline-none ${isDark ? 'bg-transparent text-white placeholder-neutral-500' : 'bg-transparent text-black placeholder-neutral-400'}`} />

                    {/* Mentions Dropdown */}
                    {mentionQuery !== null && (
                        <div className={`absolute bottom-full left-4 mb-2 w-64 max-h-48 overflow-y-auto rounded-xl border shadow-xl z-20 ${isDark ? 'bg-neutral-800 border-neutral-700' : 'bg-white border-neutral-200'}`}>
                            {isSearchingMentions ? (
                                <div className="p-3 text-xs text-neutral-500 text-center">Searching...</div>
                            ) : mentionResults.length === 0 ? (
                                <div className="p-3 text-xs text-neutral-500 text-center">No matching users found.</div>
                            ) : (
                                mentionResults.map(user => (
                                    <button
                                        key={user.id}
                                        onClick={() => insertMention(user)}
                                        className={`w-full px-3 py-2 text-left flex items-center gap-2 ${isDark ? 'hover:bg-neutral-700 text-white' : 'hover:bg-neutral-50 text-black'}`}
                                    >
                                        <div className="w-6 h-6 rounded-full overflow-hidden bg-neutral-200">
                                            {user.image && <img src={user.image} className="w-full h-full object-cover" />}
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold">{user.name}</p>
                                            <p className="text-[10px] opacity-60">{user.headline || user.role || 'User'}</p>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    )}
                </div>

                {/* Link Preview Card (Moved to Bottom) */}
                {linkMedia && (
                    <div className={`mx-4 mb-4 rounded-xl overflow-hidden border ${isDark ? 'border-neutral-800' : 'border-neutral-200'}`}>
                        {isFetchingPreview ? (
                            <div className="p-4 flex items-center gap-3 text-sm text-neutral-500">
                                <div className="animate-spin w-4 h-4 border-2 border-t-transparent border-neutral-500 rounded-full" />
                                <span className={isDark ? 'text-neutral-400' : 'text-neutral-500'}>Generating preview...</span>
                            </div>
                        ) : linkPreview ? (
                            <div className="relative group">
                                <button
                                    onClick={() => { setLinkMedia(''); setLinkPreview(null); setUserDismissedLink(true); }}
                                    className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                >
                                    <X size={12} />
                                </button>
                                {linkPreview.image && (
                                    <div className="h-48 w-full overflow-hidden bg-neutral-100 dark:bg-neutral-800">
                                        <img src={linkPreview.image} alt="" className="w-full h-full object-cover" />
                                    </div>
                                )}
                                <div className={`p-3 ${isDark ? 'bg-neutral-800' : 'bg-neutral-50'}`}>
                                    <p className={`font-semibold text-sm truncate ${isDark ? 'text-white' : 'text-black'}`}>{linkPreview.title}</p>
                                    <p className={`text-xs truncate ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>{linkPreview.siteName}</p>
                                </div>
                            </div>
                        ) : null}
                    </div>
                )}
                <div className={`sticky bottom-0 p-4 flex items-center justify-between border-t ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'}`}>
                    <span className={`text-sm ${wordCount > 500 ? 'text-red-500' : isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>{wordCount}/500</span>
                    <button onClick={handlePost} disabled={(!content.trim() && images.length === 0 && !linkPreview) || wordCount > 500 || isFetchingPreview} className={`px-5 py-2.5 rounded-full text-sm font-bold disabled:opacity-50 ${isDark ? 'bg-white text-black' : 'bg-black text-white'}`}>{initialData ? 'Save' : 'Post'}</button>
                </div>
            </div>
        </div>
    );
};

function EmployerFeedContent() {
    const router = useRouter();
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const searchParams = useSearchParams();
    const deepLinkPostId = searchParams.get('post');

    const [posts, setPosts] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showPostModal, setShowPostModal] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<string>('');
    const [editingPost, setEditingPost] = useState<any>(null);

    // Single Post View State
    const [singlePost, setSinglePost] = useState<any | null>(null);
    const [viewMode, setViewMode] = useState<'feed' | 'single'>('feed');


    useEffect(() => {
        fetchCurrentUser();
    }, []);

    useEffect(() => {
        if (deepLinkPostId) {
            setViewMode('single');
            fetchSinglePost(deepLinkPostId);
        } else {
            setViewMode('feed');
            fetchPosts();
        }
    }, [deepLinkPostId]);

    const fetchCurrentUser = async () => {
        try {
            const res = await fetch('/api/employer/profile');
            if (res.ok) {
                const data = await res.json();
                setCurrentUserId(data.profile?.id || data.employer?.id || '');
            }
        } catch (err) { console.error(err); }
    };

    const fetchSinglePost = async (id: string) => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/professional/posts/${id}`);
            if (res.ok) {
                const data = await res.json();
                setSinglePost(data.post);
            } else {
                setShowPostModal(false);
                router.push('/employer/feed');
            }
        } catch (err) {
            console.error('Error fetching single post:', err);
            router.push('/employer/feed');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchPosts = async () => {
        try {
            const res = await fetch('/api/professional/posts');
            if (res.ok) { const data = await res.json(); setPosts(data.posts || []); }
        } catch (err) { console.error(err); } finally { setIsLoading(false); }
    };

    const handleCreatePost = async (data: { content: string, mediaUrls: string[], linkMedia?: string }) => {
        try {
            const url = editingPost ? `/api/professional/posts/${editingPost.id}` : '/api/professional/posts';
            const method = editingPost ? 'PUT' : 'POST';
            const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
            if (res.ok) {
                if (viewMode === 'single' && singlePost) fetchSinglePost(singlePost.id);
                else fetchPosts();
                setEditingPost(null);
            }
        } catch (err) { console.error(err); }
    };

    const handleLike = async (postId: string) => {
        const targetPost = viewMode === 'single' ? singlePost : posts.find(p => p.id === postId);
        if (!targetPost) return;

        const wasLiked = targetPost.isLiked;
        const newLikedStatus = !wasLiked;
        const countDelta = newLikedStatus ? 1 : -1;

        // Optimistic Update
        if (viewMode === 'single' && singlePost) {
            setSinglePost({ ...singlePost, isLiked: newLikedStatus, likesCount: singlePost.likesCount + countDelta });
        } else {
            setPosts(prev => prev.map(p => p.id === postId ? { ...p, isLiked: newLikedStatus, likesCount: p.likesCount + countDelta } : p));
        }

        try {
            const res = await fetch(`/api/professional/posts/${postId}/like`, { method: 'POST' });
            if (!res.ok) throw new Error('Like failed');
        } catch (err) {
            console.error(err);
            // Revert on error
            if (viewMode === 'single' && singlePost) {
                setSinglePost({ ...singlePost, isLiked: wasLiked, likesCount: singlePost.likesCount - countDelta });
            } else {
                setPosts(prev => prev.map(p => p.id === postId ? { ...p, isLiked: wasLiked, likesCount: p.likesCount - countDelta } : p));
            }
        }
    };

    const handleRepost = async (postId: string) => {
        const targetPost = viewMode === 'single' ? singlePost : posts.find(p => p.id === postId);
        if (!targetPost) return;

        const isReposting = !targetPost.isReposted;

        const updateState = (reposted: boolean, countDelta: number) => {
            if (viewMode === 'single' && singlePost) {
                setSinglePost({ ...singlePost, isReposted: reposted, repostsCount: singlePost.repostsCount + countDelta });
            } else {
                setPosts(prev => prev.map(p => p.id === postId ? { ...p, isReposted: reposted, repostsCount: p.repostsCount + countDelta } : p));
            }
        };

        updateState(isReposting, isReposting ? 1 : -1);

        try {
            const method = isReposting ? 'POST' : 'DELETE';
            const res = await fetch(`/api/professional/posts/${postId}/repost`, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({})
            });

            if (isReposting && res.status === 409) return; // Already reposted = Success
            if (!res.ok) throw new Error();
        } catch (err) {
            console.error(err);
            updateState(!isReposting, isReposting ? -1 : 1);
        }
    };

    const handleShare = async (postId: string) => {
        const url = `${window.location.origin}/employer/feed?post=${postId}`;

        if (typeof navigator !== 'undefined' && navigator.share) {
            try {
                await navigator.share({ title: 'Check out this post', url });
                return;
            } catch (err: any) {
                if (err.name === 'AbortError') return;
                console.error('Share failed, trying fallback:', err);
            }
        }

        try {
            // Simplified fallback
            await navigator.clipboard.writeText(url);
            alert('Link copied to clipboard!');
        } catch (err) {
            console.error(err);
            prompt('Copy this link:', url);
        }
    };

    const handleSave = async (postId: string, authorType: string) => {
        const targetPost = viewMode === 'single' ? singlePost : posts.find(p => p.id === postId);
        if (!targetPost) return;

        const newStatus = !targetPost.isSaved;

        // Optimistic Update
        if (viewMode === 'single' && singlePost) {
            setSinglePost({ ...singlePost, isSaved: newStatus });
        } else {
            setPosts(prev => prev.map(p => p.id === postId ? { ...p, isSaved: newStatus } : p));
        }

        try {
            const res = await fetch(`/api/professional/posts/${postId}/save`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: authorType })
            });
            if (!res.ok) throw new Error();
        } catch (err) {
            console.error(err);
            // Revert
            if (viewMode === 'single' && singlePost) {
                setSinglePost({ ...singlePost, isSaved: !newStatus });
            } else {
                setPosts(prev => prev.map(p => p.id === postId ? { ...p, isSaved: !newStatus } : p));
            }
        }
    };



    const handleReport = (postId: string) => {
        router.push(`/employer/support?reportPost=${postId}`);
    };

    const handleDeletePost = async (postId: string) => {
        if (!confirm('Are you sure you want to delete this post?')) return;

        if (viewMode === 'single') {
            router.push('/employer/feed');
            // Optimistic deletion from feed if we were to return? 
            // In single mode, just go back.
        } else {
            setPosts(prev => prev.filter(p => p.id !== postId));
        }

        try {
            const res = await fetch(`/api/professional/posts/${postId}`, { method: 'DELETE' });
            if (!res.ok) {
                fetchPosts();
                alert('Failed to delete post');
            }
        } catch (err) { console.error(err); fetchPosts(); }
    };

    const handleStartEdit = (post: any) => {
        setEditingPost({
            id: post.id,
            content: post.content,
            mediaUrls: post.media?.map((m: any) => m.url) || [],
            linkMedia: post.linkPreview?.url || undefined
        });
        setShowPostModal(true);
    };

    const handleFollow = async (userId: string) => {
        // Optimistic Update
        const updateFollowStatus = (isFollowing: boolean) => {
            if (viewMode === 'single' && singlePost && singlePost.author.id === userId) {
                setSinglePost({ ...singlePost, author: { ...singlePost.author, isFollowing } });
            } else {
                setPosts(prev => prev.map(p => p.author.id === userId ? { ...p, author: { ...p.author, isFollowing } } : p));
            }
        };

        updateFollowStatus(true);

        try {
            const res = await fetch('/api/professional/follow', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, type: 'user' })
            });
            if (!res.ok) throw new Error('Follow failed');
        } catch (err) {
            console.error(err);
            // Revert on error
            updateFollowStatus(false);
        }
    };

    return (
        <div className="min-h-full pb-20 relative">
            <div className={`sticky top-0 z-40 py-2 px-3 flex items-center justify-end gap-2 transition-colors`}>
                <div className="flex-1" /> {/* Spacer */}
                <button
                    onClick={() => setShowPostModal(true)}
                    className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold relative z-40 ${isDark ? 'bg-white text-black hover:bg-neutral-200' : 'bg-black text-white hover:bg-neutral-800'}`}
                >
                    <Edit3 size={14} />
                    <span className="hidden xs:inline">Post</span>
                </button>
            </div>

            {/* Single Post Header */}
            {viewMode === 'single' && (
                <div className="max-w-4xl mx-auto px-4 mb-4">
                    <button
                        onClick={() => router.push('/employer/feed')}
                        className={`flex items-center gap-2 mb-4 text-sm font-medium ${isDark ? 'text-neutral-400 hover:text-white' : 'text-neutral-500 hover:text-black'}`}
                    >
                        <ChevronLeft size={16} />
                        Back to Feed
                    </button>
                </div>
            )}

            <div className="max-w-4xl mx-auto space-y-4 px-4">
                {isLoading ? (
                    <div className={`p-8 text-center rounded-xl ${isDark ? 'bg-neutral-900' : 'bg-white'}`}><div className={`animate-spin w-8 h-8 border-2 border-t-transparent rounded-full mx-auto mb-3 ${isDark ? 'border-white' : 'border-black'}`} /></div>
                ) : viewMode === 'single' ? (
                    singlePost ? (
                        <PostCard
                            key={singlePost.id}
                            post={singlePost}
                            isDark={isDark}
                            currentUserId={currentUserId}
                            onLike={() => handleLike(singlePost.id)}
                            onRepost={() => handleRepost(singlePost.id)}
                            onShare={() => handleShare(singlePost.id)}
                            onReport={handleReport}
                            onDelete={handleDeletePost}
                            onEdit={handleStartEdit}
                            onCommentAdded={() => setSinglePost((prev: any) => prev ? { ...prev, commentsCount: (prev.commentsCount || 0) + 1 } : prev)}
                            onFollow={() => handleFollow(singlePost.author.id)}
                            onSave={() => handleSave(singlePost.id, singlePost.author.type)}
                        />
                    ) : (
                        <div className={`p-8 text-center rounded-xl border ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'}`}>
                            <p className={isDark ? 'text-neutral-400' : 'text-neutral-500'}>Post not found</p>
                            <button onClick={() => router.push('/employer/feed')} className="mt-2 text-blue-500 hover:underline">Go to Feed</button>
                        </div>
                    )
                ) : posts.length === 0 ? (
                    <div className={`p-8 text-center rounded-xl border ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'}`}><p className={isDark ? 'text-neutral-400' : 'text-neutral-500'}>No posts yet</p></div>
                ) : posts.map((post) => (
                    <PostCard
                        key={post.repostId || post.id}
                        post={post}
                        isDark={isDark}
                        currentUserId={currentUserId}
                        onLike={() => handleLike(post.id)}
                        onRepost={() => handleRepost(post.id)}
                        onShare={() => handleShare(post.id)}
                        onReport={handleReport}
                        onDelete={handleDeletePost}
                        onEdit={handleStartEdit}
                        onCommentAdded={() => setPosts((prev: any[]) => prev.map(p => p.id === post.id ? { ...p, commentsCount: (p.commentsCount || 0) + 1 } : p))}
                        onFollow={() => handleFollow(post.author.id)}
                        onSave={() => handleSave(post.id, post.author.type)}
                    />
                ))}
            </div>
            <PostCreationModal isOpen={showPostModal} onClose={() => { setShowPostModal(false); setEditingPost(null); }} isDark={isDark} onPost={handleCreatePost} initialData={editingPost} />
        </div>
    );
}

export default function EmployerFeedPage() {
    return (
        <React.Suspense fallback={
            <div className="flex items-center justify-center p-8">
                <div className="animate-spin w-8 h-8 border-2 border-t-transparent border-neutral-500 rounded-full" />
            </div>
        }>
            <EmployerFeedContent />
        </React.Suspense>
    );
}
