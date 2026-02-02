"use client"

import React, { useState, useRef, useEffect, TouchEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    ChevronLeft, ChevronRight, Play, Pause, Maximize2, Volume2, VolumeX,
    Heart, MessageCircle, Share2, MoreHorizontal, Edit3, Repeat2, X, Image, Link2, Globe, MapPin, Users, Send, Trash2, Search, Flag, Edit2,
    RefreshCw // Added RefreshCw
} from 'lucide-react';
import { useTheme } from '@/app/context/ThemeContext';

import PostCard from '@/app/components/professional/PostCard';




// Post Creation Modal
// Post Creation/Edit Modal
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
    const [isUploading, setIsUploading] = useState(false);
    const [showLinkInput, setShowLinkInput] = useState(false);
    const [isFetchingPreview, setIsFetchingPreview] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Auto-detect link in content
    const [userDismissedLink, setUserDismissedLink] = useState(false);

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
        if (initialData) return; // Don't auto-detect if editing (unless they type new?) - simplicity: disable auto-detect on edit initial load, but enable on typing?
        // Actually, if they are editing, we just respect what's there. 
        // If they type a new link, we might want to detect it. 
        // Let's keep existing behavior but maybe guard against overwriting existing linkMedia?

        if (images.length > 0 || linkMedia || userDismissedLink) return;
        const urlMatch = content.match(/(https?:\/\/[^\s]+)/);
        if (urlMatch) {
            setLinkMedia(urlMatch[0]);
        }
    }, [content, images.length, linkMedia, userDismissedLink, initialData]);

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
    const isOverLimit = wordCount > 500;

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length) return;
        setIsUploading(true);
        try {
            const file = e.target.files[0];
            const res = await fetch(`/api/upload?filename=${encodeURIComponent(file.name)}`, {
                method: 'POST',
                body: file
            });
            if (res.ok) {
                const { url } = await res.json();
                setImages(prev => [...prev, url]);
                setLinkMedia('');
            }
        } catch (err) {
            console.error('Upload error:', err);
        } finally {
            setIsUploading(false);
        }
    };

    const removeImage = (index: number) => {
        setImages(prev => prev.filter((_, i) => i !== index));
    };

    const handlePost = () => {
        if (!content.trim() || isOverLimit) return;
        onPost({
            content: content.trim(),
            mediaUrls: images,
            linkMedia: linkMedia || undefined
        });
        setContent('');
        setImages([]);
        setLinkMedia('');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className={`relative w-full h-[100dvh] sm:h-auto max-w-xl sm:max-h-[90vh] overflow-y-auto rounded-none sm:rounded-2xl flex flex-col ${isDark ? 'bg-neutral-900' : 'bg-white'}`}>
                {/* Header */}
                <div className={`sticky top-0 z-10 p-4 flex items-center justify-between border-b ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'}`}>
                    <button onClick={onClose} className={`p-1.5 rounded-full ${isDark ? 'hover:bg-neutral-800 text-neutral-400' : 'hover:bg-neutral-100 text-neutral-500'}`}>
                        <X size={20} />
                    </button>
                    <h2 className={`font-bold text-base ${isDark ? 'text-white' : 'text-black'}`}>{initialData ? 'Edit Post' : 'Create Post'}</h2>
                    <div className="w-8" />
                </div>

                {/* Media Tools */}
                <div className={`p-3 flex items-center gap-2 border-b ${isDark ? 'border-neutral-800' : 'border-neutral-200'}`}>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*,video/mp4,video/webm,video/ogg,video/quicktime"
                        className="hidden"
                        onChange={handleImageUpload}
                    />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={!!linkMedia || isUploading}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${isDark ? 'bg-neutral-800 text-white hover:bg-neutral-700 disabled:opacity-50' : 'bg-neutral-100 text-black hover:bg-neutral-200 disabled:opacity-50'}`}
                    >
                        <Image size={16} />
                        {isUploading ? 'Uploading...' : 'Add Media'}
                    </button>
                    <button
                        onClick={() => setShowLinkInput(!showLinkInput)}
                        disabled={images.length > 0}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${isDark ? 'bg-neutral-800 text-white hover:bg-neutral-700 disabled:opacity-50' : 'bg-neutral-100 text-black hover:bg-neutral-200 disabled:opacity-50'}`}
                    >
                        <Link2 size={16} />
                        Link as Media
                    </button>
                </div>

                {/* Link Input */}
                {showLinkInput && images.length === 0 && (
                    <div className={`p-3 border-b ${isDark ? 'border-neutral-800' : 'border-neutral-200'}`}>
                        <input
                            type="url"
                            value={linkMedia}
                            onChange={(e) => setLinkMedia(e.target.value)}
                            placeholder="Paste link URL..."
                            className={`w-full px-3 py-2 rounded-lg text-sm ${isDark ? 'bg-neutral-800 text-white placeholder-neutral-500' : 'bg-neutral-100 text-black placeholder-neutral-400'}`}
                        />
                    </div>
                )}

                {/* Link Preview Card (In Modal) */}
                {linkMedia && (
                    <div className={`p-3 border-b ${isDark ? 'border-neutral-800' : 'border-neutral-200'}`}>
                        {isFetchingPreview ? (
                            <div className="flex items-center gap-2 text-sm text-neutral-500">
                                <div className="animate-spin w-4 h-4 border-2 border-t-transparent border-neutral-500 rounded-full" />
                                Generating preview...
                            </div>
                        ) : linkPreview ? (
                            <div className="relative group rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-800">
                                <button
                                    onClick={() => { setLinkMedia(''); setLinkPreview(null); setUserDismissedLink(true); }}
                                    className="absolute top-2 right-2 p-1 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                >
                                    <X size={12} />
                                </button>
                                {linkPreview.image && (
                                    <div className="h-32 w-full overflow-hidden">
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

                {/* Image Preview Grid */}
                {images.length > 0 && (
                    <div className={`p-3 border-b ${isDark ? 'border-neutral-800' : 'border-neutral-200'}`}>
                        <div className={`grid gap-2 ${images.length === 1 ? 'grid-cols-1' : images.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                            {images.map((url, idx) => (
                                <div key={idx} className="relative aspect-video rounded-lg overflow-hidden group">
                                    {url.match(/\.(mp4|webm|ogg|mov)$/i) ? (
                                        <video src={url} className="w-full h-full object-cover" controls />
                                    ) : (
                                        <img src={url} alt="" className="w-full h-full object-contain bg-neutral-100 dark:bg-neutral-800" />
                                    )}
                                    <button
                                        onClick={() => removeImage(idx)}
                                        className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <X size={12} />
                                    </button>
                                </div>
                            ))}
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className={`aspect-video rounded-lg border-2 border-dashed flex items-center justify-center ${isDark ? 'border-neutral-700 text-neutral-500 hover:border-neutral-600' : 'border-neutral-300 text-neutral-400 hover:border-neutral-400'}`}
                            >
                                <span className="text-2xl">+</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* Text Area */}
                <div className="p-4">
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="What do you want to talk about?"
                        className={`w-full min-h-[150px] resize-none text-base focus:outline-none ${isDark ? 'bg-transparent text-white placeholder-neutral-500' : 'bg-transparent text-black placeholder-neutral-400'}`}
                    />
                </div>

                {/* Footer */}
                <div className={`sticky bottom-0 p-4 flex items-center justify-between border-t ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'}`}>
                    <span className={`text-sm ${isOverLimit ? 'text-red-500' : isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>
                        {wordCount}/500 words
                    </span>
                    <button
                        onClick={handlePost}
                        disabled={!content.trim() || isOverLimit}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all disabled:opacity-50 ${isDark ? 'bg-white text-black hover:bg-neutral-200' : 'bg-black text-white hover:bg-neutral-800'}`}
                    >
                        {initialData ? 'Save' : 'Post'}
                    </button>
                </div>
            </div>
        </div>
    );
};

function FeedContent() {
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

    // Scroll Direction & Refresh Button Logic
    const [showRefreshButton, setShowRefreshButton] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            // Show button after scrolling down 300px
            if (window.scrollY > 300) {
                setShowRefreshButton(true);
            } else {
                setShowRefreshButton(false);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleRefresh = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        // Small delay to allow scroll up before refreshing (visual feedback)
        setTimeout(() => {
            fetchPosts();
        }, 500);
    };

    // Single Post View State
    const [singlePost, setSinglePost] = useState<any | null>(null);
    const [viewMode, setViewMode] = useState<'feed' | 'single'>('feed');

    const [activeHashtag, setActiveHashtag] = useState<string | null>(null);



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
    }, [deepLinkPostId, activeHashtag]); // Re-fetch if activeHashtag changes

    const fetchCurrentUser = async () => {
        try {
            const res = await fetch('/api/professional/profile');
            if (res.ok) {
                const data = await res.json();
                setCurrentUserId(data.profile?.id || '');
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
                // If not found, revert to feed
                setShowPostModal(false);
                router.push('/professional/feed');
            }
        } catch (err) {
            console.error('Error fetching single post:', err);
            router.push('/professional/feed');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchPosts = async () => {
        setIsLoading(true);
        try {
            let url = '/api/professional/posts';
            if (activeHashtag) {
                url += `?hashtag=${encodeURIComponent(activeHashtag)}`;
            }
            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                setPosts(data.posts || []);
            }
        } catch (err) {
            console.error('Error fetching posts:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreatePost = async (data: { content: string, mediaUrls: string[], linkMedia?: string }) => {
        try {
            const url = editingPost ? `/api/professional/posts/${editingPost.id}` : '/api/professional/posts';
            const method = editingPost ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            if (res.ok) {
                if (viewMode === 'single' && singlePost) {
                    fetchSinglePost(singlePost.id);
                } else {
                    fetchPosts();
                }
                setEditingPost(null);
            }
        } catch (err) {
            console.error('Error saving post:', err);
        }
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
        // Find post to get current state
        const targetPost = viewMode === 'single' ? singlePost : posts.find(p => p.id === postId);
        if (!targetPost) return;

        const isReposting = !targetPost.isReposted;

        // Helper to update state
        const updateState = (reposted: boolean, countDelta: number) => {
            if (viewMode === 'single' && singlePost) {
                setSinglePost({ ...singlePost, isReposted: reposted, repostsCount: singlePost.repostsCount + countDelta });
            } else {
                setPosts(prev => prev.map(p => p.id === postId ? { ...p, isReposted: reposted, repostsCount: p.repostsCount + countDelta } : p));
            }
        };

        // Optimistic Update
        updateState(isReposting, isReposting ? 1 : -1);

        try {
            const method = isReposting ? 'POST' : 'DELETE';
            const res = await fetch(`/api/professional/posts/${postId}/repost`, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({})
            });

            // If 409 (Conflict) on POST, it means already reposted. Treat as success.
            if (isReposting && res.status === 409) {
                return;
            }

            if (!res.ok) throw new Error();
        } catch (err) {
            console.error(err);
            // Revert on error
            updateState(!isReposting, isReposting ? -1 : 1);
        }
    };

    const handleShare = async (postId: string) => {
        const url = `${window.location.origin}/professional/feed?post=${postId}`;

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

            if (!res.ok) {
                const data = await res.json();
                console.error('Save failed:', data);
                alert(`Save failed: ${data.error || 'Unknown error'} \n\nCode: ${data.code || 'N/A'}\nDetails: ${data.details || 'N/A'}`);
                throw new Error(data.error || 'Request failed');
            }
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

    const handleFollow = async (userId: string, type: string = 'user') => {
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
                body: JSON.stringify({ userId, type })
            });
            if (!res.ok) throw new Error('Follow failed');
        } catch (err) {
            console.error(err);
            // Revert on error
            updateFollowStatus(false);
        }
    };

    const handleReport = (postId: string) => {
        router.push(`/professional/support?reportPost=${postId}`);
    };

    const handleDeletePost = async (postId: string) => {
        if (!confirm('Are you sure you want to delete this post?')) return;

        // Optimistic UI update
        if (viewMode === 'single') {
            router.push('/professional/feed');
            return;
        }

        setPosts(prev => prev.filter(p => p.id !== postId));

        try {
            const res = await fetch(`/api/professional/posts/${postId}`, { method: 'DELETE' });
            if (!res.ok) {
                // Revert if failed (fetch posts again)
                fetchPosts();
                alert('Failed to delete post');
            }
        } catch (err) {
            console.error('Error deleting post:', err);
            fetchPosts();
        }
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

    const handleHashtagClick = (tag: string) => {
        setActiveHashtag(tag);
        setViewMode('feed');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const clearHashtag = () => {
        setActiveHashtag(null);
    };

    return (
        <div className="min-h-full pb-20 relative">
            {/* Search Overlay/Blur */}
            {/* Refresh Pill Button (Sticky below Search Logic) */}
            <div className={`fixed top-[3.5rem] left-0 right-0 z-30 flex justify-center pointer-events-none transition-all duration-300 ${showRefreshButton ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
                <button
                    onClick={handleRefresh}
                    className={`
                        pointer-events-auto flex items-center gap-2 px-4 py-2 rounded-full shadow-lg text-xs font-bold uppercase tracking-widest backdrop-blur-md
                        ${isDark ? 'bg-neutral-800/80 text-white border border-neutral-700' : 'bg-white/80 text-black border border-neutral-200'}
                    `}
                >
                    <RefreshCw size={12} />
                    <span>New Posts</span>
                </button>
            </div>

            {/* Post Button (Aligned Right) */}
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
                        onClick={() => router.push('/professional/feed')}
                        className={`flex items-center gap-2 mb-4 text-sm font-medium ${isDark ? 'text-neutral-400 hover:text-white' : 'text-neutral-500 hover:text-black'}`}
                    >
                        <ChevronLeft size={16} />
                        Back to Feed
                    </button>
                </div>
            )}

            {/* Hashtag Filtering Banner */}
            {activeHashtag && (
                <div className="max-w-4xl mx-auto px-4 mb-4">
                    <div className={`flex items-center justify-between p-3 rounded-xl border ${isDark ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 'bg-blue-50 border-blue-100 text-blue-600'}`}>
                        <div className="flex items-center gap-2">
                            <div className="font-bold text-sm">#{activeHashtag}</div>
                            <span className="text-xs opacity-70">Filtering feed</span>
                        </div>
                        <button onClick={clearHashtag} className="p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors">
                            <X size={14} />
                        </button>
                    </div>
                </div>
            )}

            {/* Feed Posts */}
            <div className="max-w-4xl mx-auto space-y-4 px-4">
                {isLoading ? (
                    <div className={`p-8 text-center rounded-xl ${isDark ? 'bg-neutral-900' : 'bg-white'}`}>
                        <div className={`animate-spin w-8 h-8 border-2 border-t-transparent rounded-full mx-auto mb-3 ${isDark ? 'border-white' : 'border-black'}`} />
                        <p className={`text-sm ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>Loading...</p>
                    </div>
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
                            onFollow={() => handleFollow(singlePost.author.id, singlePost.author.type === 'employer' ? 'company' : 'user')}
                            onReport={handleReport}
                            onDelete={handleDeletePost}
                            onEdit={handleStartEdit}
                            onCommentAdded={() => setSinglePost((prev: any) => prev ? { ...prev, commentsCount: (prev.commentsCount || 0) + 1 } : prev)}
                            onHashtagClick={handleHashtagClick}
                            onSave={() => handleSave(singlePost.id, singlePost.author.type)}
                        />
                    ) : (
                        <div className={`p-8 text-center rounded-xl border ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'}`}>
                            <p className={`text-base font-medium ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>Post not found</p>
                            <button onClick={() => router.push('/professional/feed')} className="mt-2 text-blue-500 hover:underline">Go to Feed</button>
                        </div>
                    )
                ) : posts.length === 0 ? (
                    <div className={`p-8 text-center rounded-xl border ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'}`}>
                        {activeHashtag ? (
                            <>
                                <p className={`text-base font-medium ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>No posts found for #{activeHashtag}</p>
                                <button onClick={clearHashtag} className="mt-2 text-blue-500 hover:underline">Clear filter</button>
                            </>
                        ) : (
                            <>
                                <p className={`text-base font-medium ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>No posts yet</p>
                                <p className={`text-sm mt-1 ${isDark ? 'text-neutral-600' : 'text-neutral-400'}`}>Be the first to share something!</p>
                            </>
                        )}
                    </div>
                ) : (
                    posts.map((post) => (
                        <PostCard
                            key={post.repostId || post.id}
                            post={post}
                            isDark={isDark}
                            currentUserId={currentUserId}
                            onLike={() => handleLike(post.id)}
                            onRepost={() => handleRepost(post.id)}
                            onShare={() => handleShare(post.id)}
                            onFollow={() => handleFollow(post.author.id, post.author.type === 'employer' ? 'company' : 'user')}
                            onReport={handleReport}
                            onDelete={handleDeletePost}
                            onEdit={handleStartEdit}
                            onCommentAdded={() => setPosts((prev: any[]) => prev.map(p => p.id === post.id ? { ...p, commentsCount: (p.commentsCount || 0) + 1 } : p))}
                            onHashtagClick={handleHashtagClick}
                            onSave={() => handleSave(post.id, post.author.type)}
                        />
                    ))
                )}
            </div>

            {/* Post Creation Modal */}
            <PostCreationModal
                isOpen={showPostModal}
                onClose={() => { setShowPostModal(false); setEditingPost(null); }}
                isDark={isDark}
                onPost={handleCreatePost}
                initialData={editingPost}
            />

        </div>
    );
}

export default function FeedPage() {
    return (
        <React.Suspense fallback={
            <div className="flex h-[50vh] items-center justify-center">
                <div className="animate-spin w-8 h-8 border-2 border-t-transparent border-neutral-500 rounded-full" />
            </div>
        }>
            <FeedContent />
        </React.Suspense>
    );
}
