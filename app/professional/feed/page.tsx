"use client"

import React, { useState, useRef, useEffect, TouchEvent } from 'react';
import { useRouter } from 'next/navigation';
import {
    ChevronLeft, ChevronRight, Play, Pause, Maximize2, Volume2, VolumeX,
    Heart, MessageCircle, Share2, MoreHorizontal, Edit3, Repeat2, X, Image, Link2, Globe, MapPin, Users, Send, Trash2, Search, Flag, Edit2
} from 'lucide-react';
import { useTheme } from '@/app/context/ThemeContext';

// Scrollable Text Component - Fixed height with internal scroll
// Scrollable Text Component - With Hashtag Highlighting
const ScrollableText = ({ text, isDark }: { text: string, isDark: boolean }) => {
    // Parse hashtags
    const parts = text.split(/(\s+|#[\w]+)/g);

    return (
        <div className={`max-h-72 overflow-y-auto text-base leading-relaxed pr-2 scrollbar-thin ${isDark ? 'text-neutral-200 scrollbar-thumb-neutral-700' : 'text-neutral-800 scrollbar-thumb-neutral-300'}`}>
            <p className="whitespace-pre-wrap">
                {parts.map((part, i) => {
                    // Clean "hashtag#" prefix if present (e.g. hashtag#Cyber -> #Cyber)
                    let displayPart = part;
                    let isHashtag = false;

                    if (part.match(/^(hashtag)?#[\w]+$/i)) {
                        displayPart = part.replace(/^hashtag/i, '');
                        isHashtag = true;
                    }

                    if (isHashtag) {
                        return <span key={i} className="text-blue-500 font-medium hover:underline cursor-pointer">{displayPart}</span>;
                    }
                    return part;
                })}
            </p>
        </div>
    );
};

// Comment Modal Component
const CommentModal = ({
    isOpen,
    onClose,
    postId,
    isDark,
    onCommentAdded
}: {
    isOpen: boolean,
    onClose: () => void,
    postId: string,
    isDark: boolean,
    onCommentAdded: () => void
}) => {
    const [comments, setComments] = useState<any[]>([]);
    const [newComment, setNewComment] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSending, setIsSending] = useState(false);

    useEffect(() => {
        if (isOpen && postId) {
            fetchComments();
        }
    }, [isOpen, postId]);

    const fetchComments = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/professional/posts/${postId}/comments`);
            if (res.ok) {
                const data = await res.json();
                setComments(data.comments || []);
            }
        } catch (err) {
            console.error('Error fetching comments:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (!newComment.trim()) return;
        setIsSending(true);
        try {
            const res = await fetch(`/api/professional/posts/${postId}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: newComment.trim() })
            });
            if (res.ok) {
                setNewComment('');
                fetchComments();
                onCommentAdded();
            }
        } catch (err) {
            console.error('Error posting comment:', err);
        } finally {
            setIsSending(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className={`relative w-full max-w-lg max-h-[80vh] flex flex-col rounded-t-3xl sm:rounded-2xl overflow-hidden ${isDark ? 'bg-neutral-900' : 'bg-white'}`}>
                {/* Header */}
                <div className={`p-4 flex items-center justify-between border-b ${isDark ? 'border-neutral-800' : 'border-neutral-200'}`}>
                    <h2 className={`font-bold text-base ${isDark ? 'text-white' : 'text-black'}`}>Comments</h2>
                    <button onClick={onClose} className={`p-1.5 rounded-full ${isDark ? 'hover:bg-neutral-800 text-neutral-400' : 'hover:bg-neutral-100 text-neutral-500'}`}>
                        <X size={20} />
                    </button>
                </div>

                {/* Comments List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {isLoading ? (
                        <div className="flex justify-center py-8">
                            <div className={`animate-spin w-6 h-6 border-2 border-t-transparent rounded-full ${isDark ? 'border-white' : 'border-black'}`} />
                        </div>
                    ) : comments.length === 0 ? (
                        <p className={`text-center py-8 text-sm ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>
                            No comments yet. Be the first!
                        </p>
                    ) : (
                        comments.map((comment) => (
                            <div key={comment.id} className="flex gap-3">
                                <img
                                    src={comment.author.profileImage}
                                    alt={comment.author.name}
                                    className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                                />
                                <div className="flex-1">
                                    <div className={`px-3 py-2 rounded-xl ${isDark ? 'bg-neutral-800' : 'bg-neutral-100'}`}>
                                        <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-black'}`}>
                                            {comment.author.name}
                                        </p>
                                        <p className={`text-sm mt-0.5 ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}>
                                            {comment.content}
                                        </p>
                                    </div>
                                    <p className={`text-xs mt-1 ml-3 ${isDark ? 'text-neutral-600' : 'text-neutral-400'}`}>
                                        {new Date(comment.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Input */}
                <div className={`p-4 border-t flex gap-2 ${isDark ? 'border-neutral-800' : 'border-neutral-200'}`}>
                    <input
                        type="text"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Write a comment..."
                        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSubmit()}
                        className={`flex-1 px-4 py-2 rounded-full text-sm focus:outline-none ${isDark ? 'bg-neutral-800 text-white placeholder-neutral-500' : 'bg-neutral-100 text-black placeholder-neutral-400'}`}
                    />
                    <button
                        onClick={handleSubmit}
                        disabled={!newComment.trim() || isSending}
                        className={`p-2.5 rounded-full transition-all disabled:opacity-50 ${isDark ? 'bg-white text-black' : 'bg-black text-white'}`}
                    >
                        <Send size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
};

// Post Card Component - Horizontal Layout with Inline Comments Panel
const PostCard = ({ post, isDark, currentUserId, onLike, onRepost, onShare, onFollow, onReport, onDelete, onEdit, onCommentAdded }: {
    post: any,
    isDark: boolean,
    currentUserId: string,
    onLike: () => void,
    onRepost: () => void,
    onShare: () => void,
    onFollow: () => void,
    onReport: (postId: string) => void,
    onDelete: (postId: string) => void,
    onEdit: (post: any) => void,
    onCommentAdded: () => void
}) => {
    const isProfessional = post.author.type === 'professional';
    const hasMedia = post.media && post.media.length > 0;
    const isOwnPost = post.author.id === currentUserId;



    const [showMenu, setShowMenu] = useState(false);
    const [showComments, setShowComments] = useState(false);
    const [comments, setComments] = useState<any[]>([]);
    const [newComment, setNewComment] = useState('');
    const [isLoadingComments, setIsLoadingComments] = useState(false);
    const [isSending, setIsSending] = useState(false);

    const fetchComments = async () => {
        setIsLoadingComments(true);
        try {
            const res = await fetch(`/api/professional/posts/${post.id}/comments`);
            if (res.ok) {
                const data = await res.json();
                setComments(data.comments || []);
            }
        } catch (err) { console.error(err); } finally { setIsLoadingComments(false); }
    };

    const handleSubmitComment = async () => {
        if (!newComment.trim()) return;
        setIsSending(true);
        try {
            const res = await fetch(`/api/professional/posts/${post.id}/comments`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: newComment.trim() })
            });
            if (res.ok) { setNewComment(''); fetchComments(); onCommentAdded(); }
        } catch (err) { console.error(err); } finally { setIsSending(false); }
    };

    const toggleComments = () => {
        if (!showComments) { fetchComments(); }
        setShowComments(!showComments);
    };

    return (
        <div className={`rounded-xl border overflow-hidden ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200 shadow-sm'}`}>
            <div className="flex flex-col sm:flex-row">
                {/* Left: Media (Top on Mobile) */}
                {(hasMedia || post.linkPreview) && (
                    <div className={`flex-shrink-0 transition-all duration-300 ${showComments ? 'w-full sm:w-[35%]' : 'w-full sm:w-[55%]'}`}>
                        <div className="relative overflow-hidden bg-black/5 dark:bg-white/5 flex items-center justify-center min-h-[250px] sm:min-h-[300px] max-h-[600px]">
                            {post.media && post.media.length > 0 ? (
                                <>
                                    {post.media[0].type === 'video' || post.media[0].url.match(/\.(mp4|webm|ogg|mov)$/i) ? (
                                        <video
                                            src={post.media[0].url}
                                            className="w-full h-full max-h-[600px] object-contain"
                                            muted
                                            loop
                                            autoPlay
                                            playsInline
                                            controls
                                        />
                                    ) : (
                                        <>
                                            {/* Blurred Background Layer for "Premium" feel */}
                                            <div
                                                className="absolute inset-0 bg-cover bg-center opacity-30 blur-xl scale-110"
                                                style={{ backgroundImage: `url(${post.media[0].url})` }}
                                            />
                                            <img
                                                src={post.media[0].url}
                                                alt="Post media"
                                                className="relative z-10 w-full h-auto max-h-[600px] object-contain"
                                            />
                                        </>
                                    )}
                                    {post.media.length > 1 && (
                                        <div className={`absolute top-3 right-3 z-20 px-2 py-1 rounded-lg text-xs font-bold ${isDark ? 'bg-black/70 text-white' : 'bg-white/90 text-black'}`}>+{post.media.length - 1}</div>
                                    )}
                                </>
                            ) : post.linkPreview ? (
                                <a href={(post.linkPreview.url && !post.linkPreview.url.match(/^https?:\/\//i)) ? `https://${post.linkPreview.url}` : post.linkPreview.url || '#'} target="_blank" rel="noopener noreferrer" className="absolute inset-0 z-30 block w-full h-full cursor-pointer">
                                    {post.linkPreview.image ? (
                                        <div className="w-full h-full relative">
                                            <img src={post.linkPreview.image} alt={post.linkPreview.title} className="w-full h-full object-cover" />
                                            <div className="absolute inset-x-0 bottom-0 bg-black/60 backdrop-blur-sm p-3 text-white">
                                                <p className="font-bold text-sm truncate">{post.linkPreview.title}</p>
                                                <p className="text-xs opacity-80 truncate">{post.linkPreview.siteName}</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className={`w-full h-full flex flex-col items-center justify-center p-6 text-center ${isDark ? 'bg-neutral-800' : 'bg-neutral-100'}`}>
                                            {/* Fallback to Favicon if no image */}
                                            <img
                                                src={`https://www.google.com/s2/favicons?domain=${post.linkPreview.url || post.linkPreview.siteName || 'google.com'}&sz=128`}
                                                alt={post.linkPreview.siteName}
                                                onError={(e) => e.currentTarget.style.display = 'none'}
                                                className="w-16 h-16 mb-3 rounded-lg shadow-sm"
                                            />
                                            <p className={`font-bold line-clamp-2 ${isDark ? 'text-white' : 'text-black'}`}>{post.linkPreview.title || post.linkPreview.siteName}</p>
                                            <p className={`text-xs mt-1 truncate max-w-full px-4 ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>{post.linkPreview.siteName}</p>
                                        </div>
                                    )}
                                </a>
                            ) : null}
                        </div>
                    </div>
                )}

                {/* Middle: Content */}
                <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${showComments && (hasMedia || post.linkPreview) ? 'sm:max-w-[30%]' : ''}`}>
                    {/* Header */}
                    <div className="p-4 flex items-start justify-between">
                        <div className="flex items-start gap-3">
                            <div className="flex flex-col items-center gap-1">
                                <img
                                    src={post.author.profileImage || '/default-logo.png'}
                                    onError={(e) => { e.currentTarget.src = '/default-logo.png'; }}
                                    alt={post.author.name}
                                    className="w-12 h-12 rounded-full object-cover bg-neutral-100 dark:bg-neutral-800"
                                />
                                {((post.author.followerCount !== undefined && post.author.followerCount !== null)) && (
                                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${isDark ? 'bg-neutral-800 text-neutral-400' : 'bg-neutral-100 text-neutral-500'}`}>
                                        {new Intl.NumberFormat('en-US', { notation: "compact", compactDisplay: "short" }).format(post.author.followerCount)}
                                        {post.author.type === 'employer' ? ' subs' : ' followers'}
                                    </span>
                                )}
                            </div>
                            <div className="min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                    <h3 className={`font-bold text-base truncate ${isDark ? 'text-white' : 'text-black'}`}>{post.author.name}</h3>
                                    {!isOwnPost && !post.author.isFollowing && (
                                        <><span className={`${isDark ? 'text-neutral-600' : 'text-neutral-400'}`}>•</span><button onClick={onFollow} className={`text-xs font-semibold ${isDark ? 'text-neutral-400 hover:text-white' : 'text-neutral-600 hover:text-black'}`}>{post.author.type === 'employer' ? 'Subscribe' : 'Follow'}</button></>
                                    )}
                                </div>
                                <div className={`flex items-center gap-1.5 text-xs ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>
                                    {isProfessional && post.author.role && <span className="truncate max-w-[100px]">{post.author.role}</span>}
                                    <span>•</span><span>{post.timestamp}</span>
                                </div>
                            </div>
                        </div>
                        <div className="relative">
                            <button onClick={() => setShowMenu(!showMenu)} className={`p-1 rounded-full ${isDark ? 'hover:bg-neutral-800 text-neutral-500' : 'hover:bg-neutral-100 text-neutral-400'}`}><MoreHorizontal size={16} /></button>
                            {showMenu && (
                                <div className={`absolute right-0 top-8 w-40 rounded-lg shadow-lg border z-50 ${isDark ? 'bg-neutral-800 border-neutral-700' : 'bg-white border-neutral-200'}`}>
                                    {isOwnPost && (
                                        <>
                                            <button onClick={() => { setShowMenu(false); onEdit(post); }} className={`w-full px-4 py-2.5 text-left text-sm flex items-center gap-2 ${isDark ? 'hover:bg-neutral-700 text-white' : 'hover:bg-neutral-100 text-black'}`}><Edit2 size={14} /> Edit</button>
                                            <button onClick={() => { setShowMenu(false); onDelete(post.id); }} className={`w-full px-4 py-2.5 text-left text-sm flex items-center gap-2 text-red-500 ${isDark ? 'hover:bg-neutral-700' : 'hover:bg-neutral-100'}`}><Trash2 size={14} /> Delete</button>
                                        </>
                                    )}
                                    <button onClick={() => { setShowMenu(false); onReport(post.id); }} className={`w-full px-4 py-2.5 text-left text-sm flex items-center gap-2 ${isDark ? 'hover:bg-neutral-700 text-white' : 'hover:bg-neutral-100 text-black'}`}><Flag size={14} /> Report</button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Content */}
                    <div className={`px-4 py-2 flex-1 ${showComments ? 'min-h-[100px]' : 'min-h-[200px]'}`}>
                        <ScrollableText text={post.content} isDark={isDark} />
                    </div>

                    {/* Engagement */}
                    {(post.likesCount > 0 || post.commentsCount > 0 || post.repostsCount > 0) && (
                        <div className={`px-3 py-1.5 flex items-center justify-between text-[10px] ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>
                            <div className="flex items-center gap-2">
                                {post.likesCount > 0 && <span className="flex items-center gap-1"><span className="w-3.5 h-3.5 rounded-full bg-red-500 flex items-center justify-center"><Heart size={7} className="text-white" fill="white" /></span>{post.likesCount}</span>}
                            </div>
                            <div className="flex items-center gap-2">
                                {post.commentsCount > 0 && <span>{post.commentsCount} comments</span>}
                                {post.repostsCount > 0 && <span>{post.repostsCount} reposts</span>}
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className={`px-1 py-1 flex items-center justify-around border-t ${isDark ? 'border-neutral-800' : 'border-neutral-200'}`}>
                        <button onClick={onLike} className={`flex-1 flex items-center justify-center gap-1 py-3 sm:py-2 rounded-lg transition-colors text-xs ${post.isLiked ? 'text-red-500' : isDark ? 'text-neutral-400 hover:bg-neutral-800' : 'text-neutral-600 hover:bg-neutral-100'}`}><Heart size={16} fill={post.isLiked ? 'currentColor' : 'none'} /><span className="font-medium inline">Like</span></button>
                        <button onClick={toggleComments} className={`flex-1 flex items-center justify-center gap-1 py-3 sm:py-2 rounded-lg transition-colors text-xs ${showComments ? 'text-blue-500' : isDark ? 'text-neutral-400 hover:bg-neutral-800' : 'text-neutral-600 hover:bg-neutral-100'}`}><MessageCircle size={16} fill={showComments ? 'currentColor' : 'none'} /><span className="font-medium inline">Comment</span></button>
                        {!isOwnPost && <button onClick={onRepost} className={`flex-1 flex items-center justify-center gap-1 py-3 sm:py-2 rounded-lg transition-colors text-xs ${post.isReposted ? 'text-green-500' : isDark ? 'text-neutral-400 hover:bg-neutral-800' : 'text-neutral-600 hover:bg-neutral-100'}`}><Repeat2 size={16} /><span className="font-medium inline">Repost</span></button>}
                        <button onClick={onShare} className={`flex-1 flex items-center justify-center gap-1 py-3 sm:py-2 rounded-lg transition-colors text-xs ${isDark ? 'text-neutral-400 hover:bg-neutral-800' : 'text-neutral-600 hover:bg-neutral-100'}`}><Share2 size={16} /><span className="font-medium inline">Share</span></button>
                    </div>
                </div>

                {/* Right: Comments Panel (Slides in) */}
                {showComments && (
                    <div className={`w-full sm:w-[35%] sm:min-w-[280px] flex flex-col border-t sm:border-t-0 sm:border-l transition-all duration-300 ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-neutral-50 border-neutral-200'}`}>
                        {/* Comments Header with X */}
                        <div className={`p-3 flex items-center justify-between border-b ${isDark ? 'border-neutral-800' : 'border-neutral-200'}`}>
                            <h3 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-black'}`}>Comments</h3>
                            <button onClick={() => setShowComments(false)} className={`p-1 rounded-full ${isDark ? 'hover:bg-neutral-800 text-neutral-400' : 'hover:bg-neutral-200 text-neutral-500'}`}><X size={16} /></button>
                        </div>

                        {/* Comment Input at Top */}
                        <div className={`p-3 border-b flex gap-2 ${isDark ? 'border-neutral-800' : 'border-neutral-200'}`}>
                            <input
                                type="text"
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                placeholder="Write a comment..."
                                onKeyDown={(e) => e.key === 'Enter' && handleSubmitComment()}
                                className={`flex-1 px-3 py-2 rounded-lg text-sm focus:outline-none ${isDark ? 'bg-neutral-800 text-white placeholder-neutral-500' : 'bg-white text-black placeholder-neutral-400 border border-neutral-200'}`}
                            />
                            <button onClick={handleSubmitComment} disabled={!newComment.trim() || isSending} className={`p-2 rounded-lg transition-all disabled:opacity-50 ${isDark ? 'bg-white text-black' : 'bg-black text-white'}`}><Send size={14} /></button>
                        </div>

                        {/* Comments List */}
                        <div className="flex-1 overflow-y-auto p-3 space-y-3">
                            {isLoadingComments ? (
                                <div className="flex justify-center py-4"><div className={`animate-spin w-5 h-5 border-2 border-t-transparent rounded-full ${isDark ? 'border-white' : 'border-black'}`} /></div>
                            ) : comments.length === 0 ? (
                                <p className={`text-center py-4 text-xs ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>No comments yet. Be the first!</p>
                            ) : (
                                comments.map((c) => (
                                    <div key={c.id} className="flex gap-2">
                                        <img src={c.author.profileImage} alt={c.author.name} className="w-7 h-7 rounded-full object-cover flex-shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <div className={`px-2.5 py-1.5 rounded-lg ${isDark ? 'bg-neutral-800' : 'bg-white border border-neutral-200'}`}>
                                                <p className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-black'}`}>{c.author.name}</p>
                                                <p className={`text-xs mt-0.5 ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}>{c.content}</p>
                                            </div>
                                            <p className={`text-[10px] mt-0.5 ml-2 ${isDark ? 'text-neutral-600' : 'text-neutral-400'}`}>{new Date(c.createdAt).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};


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
            <div className={`relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl ${isDark ? 'bg-neutral-900' : 'bg-white'}`}>
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

export default function FeedPage() {
    const router = useRouter();
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const [posts, setPosts] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showPostModal, setShowPostModal] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<string>('');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [editingPost, setEditingPost] = useState<any>(null);

    useEffect(() => {
        if (!searchQuery.trim()) {
            setSearchResults([]);
            setIsSearching(false);
            return;
        }
        setIsSearching(true);
        const timer = setTimeout(async () => {
            try {
                const res = await fetch(`/api/search/users?q=${encodeURIComponent(searchQuery)}`);
                if (res.ok) {
                    const data = await res.json();
                    setSearchResults(data.results || []);
                }
            } catch (err) { console.error(err); }
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    useEffect(() => {
        fetchPosts();
        fetchCurrentUser();
    }, []);



    const fetchCurrentUser = async () => {
        try {
            const res = await fetch('/api/professional/profile');
            if (res.ok) {
                const data = await res.json();
                setCurrentUserId(data.profile?.id || '');
            }
        } catch (err) { console.error(err); }
    };

    const fetchPosts = async () => {
        try {
            const res = await fetch('/api/professional/posts');
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
                fetchPosts();
                setEditingPost(null);
            }
        } catch (err) {
            console.error('Error saving post:', err);
        }
    };

    const handleLike = async (postId: string) => {
        try {
            await fetch(`/api/professional/posts/${postId}/like`, { method: 'POST' });
            fetchPosts();
        } catch (err) { console.error(err); }
    };

    const handleRepost = async (postId: string) => {
        try {
            await fetch(`/api/professional/posts/${postId}/repost`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({})
            });
            fetchPosts();
        } catch (err) { console.error(err); }
    };

    const handleShare = async (postId: string) => {
        try {
            const res = await fetch(`/api/shared/posts/${postId}/share`);
            if (res.ok) {
                const { link } = await res.json();
                if (navigator.share) {
                    await navigator.share({ title: 'Check out this post', url: link });
                } else {
                    await navigator.clipboard.writeText(link);
                    alert('Short link copied to clipboard!');
                }
            } else {
                // Fallback
                const url = `${window.location.origin}/professional/feed?post=${postId}`;
                await navigator.clipboard.writeText(url);
                alert('Link copied to clipboard!');
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleFollow = async (userId: string, type: string = 'user') => {
        try {
            await fetch('/api/professional/follow', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, type })
            });
            fetchPosts();
        } catch (err) { console.error(err); }
    };

    const handleReport = (postId: string) => {
        router.push(`/professional/support?reportPost=${postId}`);
    };

    const handleDeletePost = async (postId: string) => {
        if (!confirm('Are you sure you want to delete this post?')) return;

        // Optimistic UI update
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

    return (
        <div className="min-h-full pb-20 relative">
            {/* Search Overlay/Blur */}
            {isSearching && (
                <div
                    className="fixed inset-0 bg-white/60 dark:bg-black/60 backdrop-blur-md z-[35]"
                    onClick={() => { setIsSearching(false); setSearchQuery(''); }}
                />
            )}

            {/* Search and Post Button */}
            <div className={`sticky top-0 z-40 py-3 px-4 flex items-center gap-3 transition-colors ${isSearching ? 'bg-transparent' : ''}`}>
                <div className={`relative flex-1 ${isSearching ? 'z-[45]' : ''}`}>
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${isDark ? 'bg-neutral-800' : 'bg-neutral-100'}`}>
                        <Search size={16} className={isDark ? 'text-neutral-400' : 'text-neutral-500'} />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onFocus={() => { if (searchQuery) setIsSearching(true); }}
                            placeholder="Search"
                            className={`flex-1 bg-transparent text-sm focus:outline-none ${isDark ? 'text-white placeholder-neutral-500' : 'text-black placeholder-neutral-400'}`}
                        />
                        {searchQuery && (
                            <button onClick={() => { setSearchQuery(''); setIsSearching(false); }} className={`p-0.5 rounded-full ${isDark ? 'bg-neutral-700 text-neutral-400' : 'bg-neutral-200 text-neutral-500'}`}><X size={12} /></button>
                        )}
                    </div>

                    {/* Search Dropdown */}
                    {isSearching && searchResults.length > 0 && (
                        <div className={`absolute top-full left-0 right-0 mt-2 rounded-xl shadow-2xl border overflow-hidden ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'}`}>
                            {searchResults.map((result) => (
                                <button
                                    key={result.id}
                                    className={`w-full px-4 py-3 flex items-center gap-3 text-left transition-colors ${isDark ? 'hover:bg-neutral-800' : 'hover:bg-neutral-50'}`}
                                >
                                    <img src={result.image} alt={result.name} className="w-10 h-10 rounded-full object-cover" />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-1.5">
                                            <span className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-black'}`}>{result.name}</span>
                                            {result.type === 'employer' && <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-500 text-white">CORP</span>}
                                        </div>
                                        <div className={`text-xs ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>
                                            {result.followers} followers
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
                <button
                    onClick={() => setShowPostModal(true)}
                    className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold relative z-40 ${isDark ? 'bg-white text-black hover:bg-neutral-200' : 'bg-black text-white hover:bg-neutral-800'}`}
                >
                    <Edit3 size={16} />
                    Start a post
                </button>
            </div>

            {/* Feed Posts */}
            <div className="max-w-4xl mx-auto space-y-4 px-4">
                {isLoading ? (
                    <div className={`p-8 text-center rounded-xl ${isDark ? 'bg-neutral-900' : 'bg-white'}`}>
                        <div className={`animate-spin w-8 h-8 border-2 border-t-transparent rounded-full mx-auto mb-3 ${isDark ? 'border-white' : 'border-black'}`} />
                        <p className={`text-sm ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>Loading feed...</p>
                    </div>
                ) : posts.length === 0 ? (
                    <div className={`p-8 text-center rounded-xl border ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'}`}>
                        <p className={`text-base font-medium ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>No posts yet</p>
                        <p className={`text-sm mt-1 ${isDark ? 'text-neutral-600' : 'text-neutral-400'}`}>Be the first to share something!</p>
                    </div>
                ) : (
                    posts.map((post) => (
                        <PostCard
                            key={post.id}
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
                            onCommentAdded={fetchPosts}
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
