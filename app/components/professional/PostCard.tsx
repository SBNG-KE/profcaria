"use client"

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    Heart, MessageCircle, Share2, MoreHorizontal, Repeat2, X, Send, Trash2, Flag, Edit2, TrendingUp, Bookmark
} from 'lucide-react';
import ProfileImage from '../ProfileImage';
import PromotePostModal from './PromotePostModal';
import VerificationBadge from '../VerificationBadge';

// Truncated Text Component for Mobile
const TruncatedText = ({ text, isDark, onHashtagClick }: { text: string, isDark: boolean, onHashtagClick?: (t: string) => void }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isTruncated, setIsTruncated] = useState(false);
    const textRef = React.useRef<HTMLDivElement>(null);

    // Use new RegExp to avoid parser issues
    const safeText = text || '';
    const parts = safeText.split(new RegExp('(\\s+|hashtag#[\\w]+|#[\\w]+)', 'g'));

    // Check if text is actually truncated by CSS
    useEffect(() => {
        const checkTruncation = () => {
            if (textRef.current) {
                // scrollHeight > clientHeight means content is overflowing
                setIsTruncated(textRef.current.scrollHeight > textRef.current.clientHeight);
            }
        };
        checkTruncation();
        // Re-check on window resize
        window.addEventListener('resize', checkTruncation);
        return () => window.removeEventListener('resize', checkTruncation);
    }, [text]);

    return (
        <div className={`relative ${isDark ? 'text-neutral-200' : 'text-neutral-800'}`}>
            <div
                ref={textRef}
                className={`text-base leading-relaxed whitespace-pre-wrap ${!isExpanded ? 'line-clamp-3' : ''}`}
            >
                {parts.map((part, i) => {
                    let displayPart = part;
                    let isHashtag = false;
                    if (part.match(new RegExp('^(hashtag)?#[\\w]+$', 'i'))) {
                        displayPart = part.replace(/^hashtag/i, '');
                        isHashtag = true;
                    }
                    if (isHashtag) {
                        return (
                            <button
                                key={i}
                                onClick={(e) => { e.stopPropagation(); onHashtagClick?.(displayPart.replace('#', '')); }}
                                className="hashtag font-medium hover:underline cursor-pointer"
                            >
                                {displayPart}
                            </button>
                        );
                    }
                    return part;
                })}
            </div>

            {/* Show button if text is truncated OR already expanded (to allow collapse) */}
            {(isTruncated || isExpanded) && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsExpanded(!isExpanded);
                    }}
                    className={`mt-1 text-sm font-semibold underline decoration-2 underline-offset-2 ${isDark ? 'text-neutral-300 hover:text-white' : 'text-neutral-600 hover:text-black'}`}
                >
                    {isExpanded ? 'Show less' : 'Show more'}
                </button>
            )}
        </div >
    );
};


// Scrollable Text Component
const ScrollableText = ({ text, isDark, onHashtagClick }: { text: string, isDark: boolean, onHashtagClick?: (t: string) => void }) => {
    const safeText = text || '';
    const parts = safeText.split(new RegExp('(\\s+|hashtag#[\\w]+|#[\\w]+)', 'g'));
    return (
        <div className={`max-h-72 overflow-y-auto text-base leading-relaxed pr-2 scrollbar-thin ${isDark ? 'text-neutral-200 scrollbar-thumb-neutral-700' : 'text-neutral-800 scrollbar-thumb-neutral-300'}`}>
            <p className="whitespace-pre-wrap">
                {parts.map((part, i) => {
                    let displayPart = part;
                    let isHashtag = false;
                    if (part.match(new RegExp('^(hashtag)?#[\\w]+$', 'i'))) {
                        displayPart = part.replace(/^hashtag/i, '');
                        isHashtag = true;
                    }
                    if (isHashtag) {
                        return (
                            <button
                                key={i}
                                onClick={(e) => { e.stopPropagation(); onHashtagClick?.(displayPart.replace('#', '')); }}
                                className="hashtag font-medium hover:underline cursor-pointer"
                            >
                                {displayPart}
                            </button>
                        );
                    }
                    return part;
                })}
            </p>
        </div>
    );
};

interface PostCardProps {
    post: any;
    isDark: boolean;
    currentUserId: string;
    onLike?: () => void;
    onRepost?: () => void;
    onShare?: () => void;
    onSave?: () => void;
    onFollow?: () => void;
    onReport?: (postId: string) => void;
    onDelete?: (postId: string) => void; // For original posts
    onDeleteRepost?: (repostId: string) => void; // Optional for deleting reposts
    onEdit?: (post: any) => void;
    onCommentAdded?: () => void;
    onHashtagClick?: (tag: string) => void;
    readOnly?: boolean;
    forceVertical?: boolean;
}


const PostCard = ({ post, isDark, currentUserId, onLike, onRepost, onShare, onSave, onFollow, onReport, onDelete, onDeleteRepost, onEdit, onCommentAdded, onHashtagClick, forceVertical = false }: PostCardProps) => {
    const isProfessional = post.author.type === 'professional';
    const hasMedia = post.media && post.media.length > 0;
    const isOwnPost = post.isOwnPost !== undefined ? post.isOwnPost : post.author.id === currentUserId;
    const isRepostContext = !!post.repostContext; // Check if this is being viewed as a repost in Profile list

    const [showMenu, setShowMenu] = useState(false);
    const [showComments, setShowComments] = useState(false);
    const [showPromoteModal, setShowPromoteModal] = useState(false);
    const [comments, setComments] = useState<any[]>([]);
    const [newComment, setNewComment] = useState('');
    const [isLoadingComments, setIsLoadingComments] = useState(false);
    const [isSending, setIsSending] = useState(false);

    // ... (fetchComments, handleSubmitComment, toggleComments remain unchanged)
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
            if (res.ok) { setNewComment(''); fetchComments(); onCommentAdded?.(); }
        } catch (err) { console.error(err); } finally { setIsSending(false); }
    };

    const toggleComments = () => {
        if (!showComments) { fetchComments(); }
        setShowComments(!showComments);
    };

    // Shared Header Component
    const PostHeader = ({ isMobile = false }) => (
        <div className={`flex items-start justify-between ${isMobile ? 'p-4 pb-2' : 'p-4'}`}>
            <div className="flex items-start gap-3">
                <Link href={post.author.type === 'employer' ? `/professional/companies/${post.author.id}` : `/professional/people/${post.author.id}`} className="flex flex-col items-center gap-1 group">
                    <ProfileImage
                        src={post.author.profileImage}
                        type={post.author.type}
                        name={post.author.name}
                        size={24}
                        className="w-12 h-12 rounded-full group-hover:opacity-80 transition-opacity"
                        badge={post.author.badgeType}
                    />
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${isDark ? 'bg-neutral-800 text-neutral-400' : 'bg-neutral-100 text-neutral-500'}`}>
                        {new Intl.NumberFormat('en-US', { notation: "compact", compactDisplay: "short" }).format(post.author.followerCount)}
                        {post.author.type === 'employer' ? ' subscribers' : ' followers'}
                    </span>
                </Link>
                <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                        <Link href={post.author.type === 'employer' ? `/professional/companies/${post.author.id}` : `/professional/people/${post.author.id}`} className={`font-bold text-base truncate hover:underline flex items-center gap-1 ${isDark ? 'text-white' : 'text-black'}`}>
                            {post.author.name}
                            <VerificationBadge tier={post.author.badgeType} size={24} />
                        </Link>
                        {!isOwnPost && !post.author.isFollowing && post.currentUserType !== 'employer' && (
                            <><span className={`${isDark ? 'text-neutral-600' : 'text-neutral-400'}`}>•</span><button onClick={onFollow} className={`text-xs font-semibold ${isDark ? 'text-neutral-400 hover:text-white' : 'text-neutral-600 hover:text-black'}`}>{post.author.type === 'employer' ? 'Subscribe' : 'Follow'}</button></>
                        )}
                    </div>
                    <div className={`flex items-center gap-1.5 text-xs ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>
                        {isProfessional && post.author.role && <span className="truncate max-w-[100px]">{post.author.role}</span>}
                        <span>•</span><span>{post.timestamp}</span>
                        {post.isAd && <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-500 font-bold uppercase text-[10px]">Promoted</span>}
                    </div>
                </div>
            </div>
            <div className="relative">
                <button onClick={() => setShowMenu(!showMenu)} className={`p-1 rounded-full ${isDark ? 'hover:bg-neutral-800 text-neutral-500' : 'hover:bg-neutral-100 text-neutral-400'}`}><MoreHorizontal size={16} /></button>
                {showMenu && (
                    <div className={`absolute right-0 top-8 w-40 rounded-lg shadow-lg border z-50 ${isDark ? 'bg-neutral-800 border-neutral-700' : 'bg-white border-neutral-200'}`}>
                        {isOwnPost && (
                            <>
                                <button onClick={() => { setShowMenu(false); setShowPromoteModal(true); }} className={`w-full px-4 py-2.5 text-left text-sm flex items-center gap-2 text-blue-500 ${isDark ? 'hover:bg-neutral-700' : 'hover:bg-neutral-100'}`}><TrendingUp size={14} /> Promote Post</button>
                                <button onClick={() => { setShowMenu(false); onEdit?.(post); }} className={`w-full px-4 py-2.5 text-left text-sm flex items-center gap-2 ${isDark ? 'hover:bg-neutral-700 text-white' : 'hover:bg-neutral-100 text-black'}`}><Edit2 size={14} /> Edit</button>
                                <button onClick={() => { setShowMenu(false); onDelete?.(post.id); }} className={`w-full px-4 py-2.5 text-left text-sm flex items-center gap-2 text-red-500 ${isDark ? 'hover:bg-neutral-700' : 'hover:bg-neutral-100'}`}><Trash2 size={14} /> Delete Post</button>
                            </>
                        )}
                        {isRepostContext && onDeleteRepost && (
                            <button onClick={() => { setShowMenu(false); if (post.repostId) onDeleteRepost(post.repostId); }} className={`w-full px-4 py-2.5 text-left text-sm flex items-center gap-2 text-red-500 ${isDark ? 'hover:bg-neutral-700' : 'hover:bg-neutral-100'}`}><Trash2 size={14} /> Delete Repost</button>
                        )}
                        {!isOwnPost && (
                            <button onClick={() => { setShowMenu(false); onReport?.(post.id); }} className={`w-full px-4 py-2.5 text-left text-sm flex items-center gap-2 ${isDark ? 'hover:bg-neutral-700 text-white' : 'hover:bg-neutral-100 text-black'}`}><Flag size={14} /> Report</button>
                        )}
                    </div>
                )}
            </div>

            <PromotePostModal
                post={post}
                isOpen={showPromoteModal}
                onClose={() => setShowPromoteModal(false)}
                onSuccess={() => {
                    // Ideally refresh post to show 'Promoted' status
                    setShowPromoteModal(false);
                }}
                isDark={isDark}
            />
        </div>
    );

    return (
        <div className={`rounded-xl border overflow-hidden ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200 shadow-sm'}`}>
            {/* Repost Header Context (if in profile list) */}
            {post.repostContext && (
                <div className={`px-4 py-2 flex items-center gap-2 text-xs font-bold border-b ${isDark ? 'bg-neutral-800/50 border-neutral-800 text-neutral-400' : 'bg-neutral-50 border-neutral-200 text-neutral-500'}`}>
                    <Repeat2 size={12} />
                    {post.repostContext.reposterImage && (
                        <img src={post.repostContext.reposterImage} alt="" className="w-4 h-4 rounded-full object-cover" />
                    )}
                    <span>{post.repostContext.reposterName ? `${post.repostContext.reposterName} reposted` : 'You reposted'}</span>
                </div>
            )}

            <div className={`flex flex-col ${forceVertical ? '' : 'sm:flex-row'}`}>
                {/* Mobile Header (Visible only on mobile) */}
                <div className="sm:hidden">
                    <PostHeader isMobile={true} />
                </div>

                {/* Mobile Text (Visible only on mobile) */}
                <div className="sm:hidden px-4 pb-3">
                    <TruncatedText text={post.content} isDark={isDark} onHashtagClick={onHashtagClick} />
                </div>

                {/* Media (Center on Mobile, Left on Desktop) */}
                {(hasMedia || post.linkPreview) && (
                    <div className={`flex-shrink-0 transition-all duration-300 sm:order-first ${showComments ? 'w-full sm:w-[35%]' : 'w-full sm:w-[55%]'}`}>
                        <div className="relative overflow-hidden bg-black/5 dark:bg-white/5 flex items-center justify-center min-h-[200px] sm:min-h-[300px] max-h-[600px]">
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

                {/* Content (Desktop: Right Side | Mobile: Bottom Actions) */}
                <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${showComments && (hasMedia || post.linkPreview) ? 'sm:max-w-[30%]' : ''}`}>

                    {/* Desktop Header (Hidden on Mobile) */}
                    <div className="hidden sm:block">
                        <PostHeader />
                    </div>

                    {/* Desktop Content (Hidden on Mobile) */}
                    <div className={`hidden sm:block px-4 py-2 flex-1 ${showComments ? 'min-h-[100px]' : 'min-h-[200px]'}`}>
                        <ScrollableText text={post.content} isDark={isDark} onHashtagClick={onHashtagClick} />
                    </div>

                    {/* Engagement - Visible on both (but logically belongs here) */}
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
                    <div className={`px-2 py-2 flex flex-wrap items-center justify-between gap-1 border-t ${isDark ? 'border-neutral-800' : 'border-neutral-200'}`}>
                        <button onClick={() => onLike?.()} disabled={!onLike} className={`flex-1 min-w-[60px] flex items-center justify-center gap-1 py-2 rounded-lg transition-colors text-xs ${post.isLiked ? 'text-red-500' : isDark ? 'text-neutral-400 hover:bg-neutral-800' : 'text-neutral-600 hover:bg-neutral-100'} ${!onLike ? 'opacity-50 cursor-default' : ''}`}><Heart size={16} fill={post.isLiked ? 'currentColor' : 'none'} /><span className="font-medium hidden xs:inline">Like</span></button>
                        <button onClick={toggleComments} className={`flex-1 min-w-[60px] flex items-center justify-center gap-1 py-2 rounded-lg transition-colors text-xs ${showComments ? 'text-blue-500' : isDark ? 'text-neutral-400 hover:bg-neutral-800' : 'text-neutral-600 hover:bg-neutral-100'} ${!onLike ? 'opacity-50 cursor-default' : ''}`}><MessageCircle size={16} fill={showComments ? 'currentColor' : 'none'} /><span className="font-medium hidden xs:inline">Comment</span></button>
                        {!isOwnPost && <button onClick={() => onRepost?.()} disabled={!onRepost} className={`flex-1 min-w-[60px] flex items-center justify-center gap-1 py-2 rounded-lg transition-colors text-xs ${post.isReposted ? 'text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20' : isDark ? 'text-neutral-400 hover:bg-neutral-800' : 'text-neutral-600 hover:bg-neutral-100'} ${!onRepost ? 'opacity-50 cursor-default' : ''}`}><Repeat2 size={16} /><span className="font-medium hidden xs:inline">{post.isReposted ? 'Reposted' : 'Repost'}</span></button>}
                        <button onClick={() => onSave?.()} className={`flex-1 min-w-[60px] flex items-center justify-center gap-1 py-2 rounded-lg transition-colors text-xs ${post.isSaved ? 'text-blue-500' : isDark ? 'text-neutral-400 hover:bg-neutral-800' : 'text-neutral-600 hover:bg-neutral-100'}`}><Bookmark size={16} fill={post.isSaved ? 'currentColor' : 'none'} /><span className="font-medium hidden xs:inline">{post.isSaved ? 'Saved' : 'Save'}</span></button>
                        <button onClick={() => onShare?.()} disabled={!onShare} className={`flex-1 min-w-[60px] flex items-center justify-center gap-1 py-2 rounded-lg transition-colors text-xs ${isDark ? 'text-neutral-400 hover:bg-neutral-800' : 'text-neutral-600 hover:bg-neutral-100'} ${!onShare ? 'opacity-50 cursor-default' : ''}`}><Share2 size={16} /><span className="font-medium hidden xs:inline">Share</span></button>
                    </div>
                </div>

                {/* Comments Panel - Slide-in Drawer on Mobile | Inline on Desktop */}
                {showComments && (
                    <div className={`
                        fixed inset-y-0 right-0 z-50 w-full sm:static sm:z-auto sm:inset-auto 
                        sm:w-[35%] sm:min-w-[280px] flex flex-col 
                        border-t sm:border-t-0 sm:border-l transition-all duration-300 shadow-2xl sm:shadow-none
                        ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'}
                    `}>
                        {/* Mobile Back/Close Button */}
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
                                comments.map((c) => {
                                    const authorType = c.author.type || 'professional';
                                    const authorLink = authorType === 'employer'
                                        ? `/professional/companies/${c.author.id}`
                                        : `/professional/people/${c.author.id}`;

                                    return (
                                        <div key={c.id} className="flex gap-2">
                                            <Link href={authorLink}>
                                                <ProfileImage
                                                    src={c.author.profileImage}
                                                    name={c.author.name}
                                                    type={authorType}
                                                    size={14}
                                                    className="w-7 h-7 rounded-full flex-shrink-0 hover:opacity-80 transition-opacity"
                                                />
                                            </Link>
                                            <div className="flex-1 min-w-0">
                                                <div className={`px-2.5 py-1.5 rounded-lg ${isDark ? 'bg-neutral-800' : 'bg-white border border-neutral-200'}`}>
                                                    <Link href={authorLink} className={`text-xs font-semibold hover:underline ${isDark ? 'text-white' : 'text-black'}`}>{c.author.name}</Link>
                                                    <p className={`text-xs mt-0.5 ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}>{c.content}</p>
                                                </div>
                                                <p className={`text-[10px] mt-0.5 ml-2 ${isDark ? 'text-neutral-600' : 'text-neutral-400'}`}>{new Date(c.createdAt).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PostCard;
