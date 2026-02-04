import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    Heart, MessageCircle, Share2, MoreHorizontal, Repeat2, X, Send, Trash2, Flag, Edit2, TrendingUp, Bookmark, Link2, UserCircle, Search, Zap, Building2, CheckCheck, Plus, ChevronLeft, ChevronRight
} from 'lucide-react';
import ProfileImage from '../ProfileImage';
import PromotePostModal from './PromotePostModal';
import VerificationBadge from '../VerificationBadge';
import { useCurrency } from '@/app/hooks/useCurrency';

// Truncated Text Component for Mobile
const TruncatedText = ({ text, isDark, onHashtagClick }: { text: string, isDark: boolean, onHashtagClick?: (t: string) => void }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isTruncated, setIsTruncated] = useState(false);
    const textRef = React.useRef<HTMLDivElement>(null);

    // Updated RegExp to split: URLs, Hashtags, Mentions, newlines (same as ScrollableText)
    const safeText = text || '';
    const parts = safeText.split(new RegExp('((?:(?:https?://)?(?:www\\.)?[\\w-]+\\.\\w{2,}(?:/[\\w-./?%&=]*)?)|(?:hashtag#[\\w]+|#[\\w]+)|(?:@[\\w]+(?:\\s+[\\w]+)?)|\\n)', 'g'));

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
                    // Match URL (broader check)
                    if (part.match(/(?:https?:\/\/)?(?:www\.)?[\w-]+\.\w{2,}/)) {
                        let href = part;
                        if (!href.match(/^https?:\/\//)) href = `https://${href}`;
                        return (
                            <a key={i} href={href} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="text-blue-500 hover:underline relative z-10">
                                {part}
                            </a>
                        );
                    }
                    // Match Mention
                    if (part.match(/^@/)) {
                        return (
                            <span key={i} className="text-blue-500 font-semibold cursor-pointer hover:underline relative z-10">
                                {part}
                            </span>
                        );
                    }
                    // Match Hashtag
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
                                className="hashtag font-medium hover:underline cursor-pointer relative z-10"
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
                    className={`mt-1 text-sm font-semibold underline decoration-2 underline-offset-2 relative z-10 ${isDark ? 'text-neutral-300 hover:text-white' : 'text-neutral-600 hover:text-black'}`}
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
    // Updated Regex to split: URLs (including simple domains), Hashtags, Mentions, newlines
    const parts = safeText.split(new RegExp('((?:(?:https?://)?(?:www\\.)?[\\w-]+\\.\\w{2,}(?:/[\\w-./?%&=]*)?)|(?:hashtag#[\\w]+|#[\\w]+)|(?:@[\\w]+(?:\\s+[\\w]+)?)|\\n)', 'g'));

    return (
        <div className={`max-h-72 overflow-y-auto text-base leading-relaxed pr-2 scrollbar-thin ${isDark ? 'text-neutral-200 scrollbar-thumb-neutral-700' : 'text-neutral-800 scrollbar-thumb-neutral-300'}`}>
            <p className="whitespace-pre-wrap">
                {parts.map((part, i) => {
                    // Match URL (broader check)
                    if (part.match(/(?:https?:\/\/)?(?:www\.)?[\w-]+\.\w{2,}/)) {
                        let href = part;
                        if (!href.match(/^https?:\/\//)) href = `https://${href}`;
                        return (
                            <a key={i} href={href} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="text-blue-500 hover:underline">
                                {part}
                            </a>
                        );
                    }
                    // Match Mention
                    if (part.match(/^@/)) {
                        return (
                            <span key={i} className="text-blue-500 font-semibold cursor-pointer hover:underline">
                                {part}
                            </span>
                        );
                    }
                    // Match Hashtag
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
    const { symbol: currencySymbol } = useCurrency();
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

    // Carousel State
    const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
    const [touchStart, setTouchStart] = useState<number | null>(null);
    const [touchEnd, setTouchEnd] = useState<number | null>(null);

    // Min swipe distance
    const minSwipeDistance = 50;

    const onTouchStart = (e: React.TouchEvent) => {
        setTouchEnd(null);
        setTouchStart(e.targetTouches[0].clientX);
    };

    const onTouchMove = (e: React.TouchEvent) => {
        setTouchEnd(e.targetTouches[0].clientX);
    };

    const onTouchEnd = () => {
        if (!touchStart || !touchEnd) return;
        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > minSwipeDistance;
        const isRightSwipe = distance < -minSwipeDistance;

        if (isLeftSwipe) {
            // Next
            if (post.media && post.media.length > 1) {
                setCurrentMediaIndex(prev => prev === post.media.length - 1 ? 0 : prev + 1);
            }
        }
        if (isRightSwipe) {
            // Prev
            if (post.media && post.media.length > 1) {
                setCurrentMediaIndex(prev => prev === 0 ? post.media.length - 1 : prev - 1);
            }
        }
    };

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
                <Link href={post.author.type === 'employer' ? `/public/companies/${post.author.id}` : `/public/people/${post.author.id}`} className="flex flex-col items-center gap-1 group">
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
                        <Link href={post.author.type === 'employer' ? `/public/companies/${post.author.id}` : `/public/people/${post.author.id}`} className={`font-bold text-base truncate hover:underline flex items-center gap-1 ${isDark ? 'text-white' : 'text-black'}`}>
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
                        <div
                            className="relative overflow-hidden bg-black/5 dark:bg-white/5 flex items-center justify-center min-h-[200px] sm:min-h-[300px] max-h-[600px] group/media touch-pan-y"
                            onTouchStart={onTouchStart}
                            onTouchMove={onTouchMove}
                            onTouchEnd={onTouchEnd}
                        >
                            {post.media && post.media.length > 0 ? (
                                <>
                                    {post.media[currentMediaIndex].type === 'video' || post.media[currentMediaIndex].url.match(/\.(mp4|webm|ogg|mov)$/i) ? (
                                        <video
                                            src={post.media[currentMediaIndex].url}
                                            className="w-full h-full max-h-[600px] object-contain"
                                            muted
                                            loop
                                            autoPlay
                                            playsInline
                                            controls
                                        />
                                    ) : (
                                        <img
                                            src={post.media[currentMediaIndex].url}
                                            alt="Post content"
                                            className="w-full h-full max-h-[600px] object-contain"
                                        />
                                    )}

                                    {/* Carousel Controls */}
                                    {post.media.length > 1 && (
                                        <>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setCurrentMediaIndex(prev => prev === 0 ? post.media.length - 1 : prev - 1);
                                                }}
                                                className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/50 text-white hover:bg-black/70 opacity-0 group-hover/media:opacity-100 transition-opacity"
                                            >
                                                <ChevronLeft size={20} />
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setCurrentMediaIndex(prev => prev === post.media.length - 1 ? 0 : prev + 1);
                                                }}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/50 text-white hover:bg-black/70 opacity-0 group-hover/media:opacity-100 transition-opacity"
                                            >
                                                <ChevronRight size={20} />
                                            </button>
                                            {/* Dots */}
                                            <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5 z-10">
                                                {post.media.map((_: any, idx: number) => (
                                                    <div
                                                        key={idx}
                                                        className={`w-1.5 h-1.5 rounded-full transition-all ${idx === currentMediaIndex ? 'bg-white scale-125' : 'bg-white/50'}`}
                                                    />
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </>
                            ) : post.linkPreview ? (
                                <img
                                    src={post.linkPreview.image}
                                    alt="Link preview"
                                    className="w-full h-full object-cover"
                                />
                            ) : null}
                        </div>
                    </div>
                )}

                {/* Content (Title, Text, Interactions) */}
                <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${forceVertical ? 'w-full' : ''}`}>
                    <div className={`p-4 flex-1 flex flex-col ${isDark ? 'text-neutral-200' : 'text-neutral-800'}`}>

                        {/* Desktop Header */}
                        <div className="hidden sm:block">
                            <PostHeader isMobile={false} />
                        </div>

                        {/* Desktop Text */}
                        <div className="hidden sm:block mt-1 mb-3">
                            <ScrollableText text={post.content} isDark={isDark} onHashtagClick={onHashtagClick} />
                        </div>

                        {/* Link Preview Details */}
                        {post.linkPreview && (
                            <a
                                href={post.linkPreview.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`block mb-3 p-3 rounded-lg border text-sm hover:opacity-80 transition-opacity ${isDark ? 'bg-neutral-800 border-neutral-700' : 'bg-neutral-50 border-neutral-200'}`}
                            >
                                <div className="font-semibold truncate mb-0.5">{post.linkPreview.title}</div>
                                <div className={`text-xs truncate ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>{post.linkPreview.description}</div>
                                <div className={`text-[10px] mt-1 flex items-center gap-1 ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>
                                    <Link2 size={10} /> {new URL(post.linkPreview.url).hostname}
                                </div>
                            </a>
                        )}

                        {/* Metrics & Actions */}
                        <div className="mt-auto pt-3 border-t border-dashed border-neutral-200 dark:border-neutral-800">
                            <div className="flex items-center justify-between text-sm">
                                <div className="flex gap-4">
                                    <button
                                        onClick={() => onLike?.()}
                                        className={`flex items-center gap-1.5 transition-colors group ${post.isLiked ? 'text-rose-500' : (isDark ? 'text-neutral-400 hover:text-rose-400' : 'text-neutral-500 hover:text-rose-500')}`}
                                    >
                                        <Heart size={18} className={`transition-transform duration-300 ${post.isLiked ? 'fill-current scale-110' : 'group-hover:scale-110'}`} />
                                        {post.likesCount > 0 && <span className="font-medium text-xs">{post.likesCount}</span>}
                                    </button>

                                    <button
                                        onClick={(e) => { e.stopPropagation(); toggleComments(); }}
                                        className={`flex items-center gap-1.5 transition-colors group ${showComments ? 'text-blue-500' : (isDark ? 'text-neutral-400 hover:text-blue-400' : 'text-neutral-500 hover:text-blue-500')}`}
                                    >
                                        <MessageCircle size={18} className="transition-transform duration-300 group-hover:scale-110" />
                                        {post.commentsCount > 0 && <span className="font-medium text-xs">{post.commentsCount}</span>}
                                    </button>

                                    <button
                                        onClick={(e) => { e.stopPropagation(); onShare?.(); }}
                                        className={`flex items-center gap-1.5 transition-colors group ${isDark ? 'text-neutral-400 hover:text-green-400' : 'text-neutral-500 hover:text-green-500'}`}
                                    >
                                        <Share2 size={18} className="transition-transform duration-300 group-hover:scale-110" />
                                    </button>
                                </div>

                                <div className="flex gap-1">

                                    <button
                                        onClick={(e) => { e.stopPropagation(); onSave?.(); }}
                                        className={`p-1.5 rounded-full transition-colors ${post.isSaved ? (isDark ? 'text-yellow-400 bg-yellow-400/10' : 'text-yellow-600 bg-yellow-50') : (isDark ? 'text-neutral-400 hover:text-yellow-400' : 'text-neutral-500 hover:text-yellow-600')}`}
                                    >
                                        <Bookmark size={18} className={post.isSaved ? 'fill-current' : ''} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Dropdown Menu */}
                    {showMenu && (
                        <div className={`absolute top-12 right-4 w-48 rounded-xl shadow-xl border overflow-hidden z-20 animate-in fade-in zoom-in-95 duration-200 ${isDark ? 'bg-neutral-800 border-neutral-700' : 'bg-white border-neutral-200'}`}>
                            {isOwnPost ? (
                                <>
                                    <button onClick={() => { setShowMenu(false); onEdit?.(post); }} className={`w-full px-4 py-2.5 text-left text-sm flex items-center gap-2 ${isDark ? 'hover:bg-neutral-700 text-white' : 'hover:bg-neutral-100 text-black'}`}><Edit2 size={14} /> Edit Post</button>
                                    <button onClick={() => { setShowMenu(false); onDelete?.(post.id); }} className={`w-full px-4 py-2.5 text-left text-sm flex items-center gap-2 text-red-500 ${isDark ? 'hover:bg-neutral-700' : 'hover:bg-neutral-100'}`}><Trash2 size={14} /> Delete Post</button>
                                </>
                            ) : (
                                <button onClick={() => { setShowMenu(false); onReport?.(post.id); }} className={`w-full px-4 py-2.5 text-left text-sm flex items-center gap-2 ${isDark ? 'hover:bg-neutral-700 text-white' : 'hover:bg-neutral-100 text-black'}`}><Flag size={14} /> Report</button>
                            )}
                            {isRepostContext && onDeleteRepost && (
                                <button onClick={() => { setShowMenu(false); if (post.repostId) onDeleteRepost(post.repostId); }} className={`w-full px-4 py-2.5 text-left text-sm flex items-center gap-2 text-red-500 ${isDark ? 'hover:bg-neutral-700' : 'hover:bg-neutral-100'}`}><Trash2 size={14} /> Delete Repost</button>
                            )}

                        </div>
                    )}
                </div>

                {/* Comments Section */}
                {showComments && (
                    <div className={`border-t ${isDark ? 'border-neutral-800 bg-neutral-900' : 'border-neutral-100 bg-neutral-50'}`}>
                        <div className="p-3 space-y-3 max-h-60 overflow-y-auto custom-scrollbar">
                            {isLoadingComments ? (
                                <div className="flex justify-center p-4"><div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full text-neutral-400"></div></div>
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

            <PromotePostModal
                post={post}
                isOpen={showPromoteModal}
                onClose={() => setShowPromoteModal(false)}
                onSuccess={() => {
                    setShowPromoteModal(false);
                }}
                isDark={isDark}
            />
        </div>
    );
}

export default PostCard;
