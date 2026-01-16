"use client";

import React, { useState, useEffect, useRef } from 'react';
import { X, ExternalLink, Loader2 } from 'lucide-react';

interface LinkMetadata {
    title: string | null;
    description: string | null;
    image: string | null;
    favicon: string | null;
    siteName: string | null;
}

interface LinkPreviewProps {
    url: string;
    onClose: () => void;
    onInsert?: (metadata: LinkMetadata) => void;
    position?: { x: number; y: number };
    className?: string;
}

export default function LinkPreview({ url, onClose, onInsert, position, className = '' }: LinkPreviewProps) {
    const [metadata, setMetadata] = useState<LinkMetadata | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const previewRef = useRef<HTMLDivElement>(null);
    const fetchedUrlRef = useRef<string | null>(null);
    const onCloseRef = useRef(onClose);

    // Keep onClose ref updated
    useEffect(() => {
        onCloseRef.current = onClose;
    }, [onClose]);

    useEffect(() => {
        // Prevent re-fetching if we already fetched this URL
        if (fetchedUrlRef.current === url) {
            return;
        }

        const fetchMetadata = async () => {
            fetchedUrlRef.current = url;
            setLoading(true);
            setError(null);

            try {
                const response = await fetch(`/api/link-preview?url=${encodeURIComponent(url)}`);

                if (!response.ok) {
                    throw new Error('Failed to fetch preview');
                }

                const data = await response.json();
                setMetadata(data);
            } catch (e) {
                setError('Could not load preview');
                // Auto-close after error
                setTimeout(() => onCloseRef.current(), 2000);
            } finally {
                setLoading(false);
            }
        };

        fetchMetadata();
    }, [url]); // Only depend on url, not onClose

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (previewRef.current && !previewRef.current.contains(e.target as Node)) {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    // Close on Escape
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    const positionStyle = position
        ? { position: 'fixed' as const, left: position.x, top: position.y }
        : {};

    if (loading) {
        return (
            <div
                ref={previewRef}
                style={positionStyle}
                className={`bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-4 w-72 z-50 ${className}`}
            >
                <div className="flex items-center gap-3">
                    <Loader2 size={16} className="animate-spin text-blue-400" />
                    <span className="text-sm text-slate-400">Loading preview...</span>
                </div>
            </div>
        );
    }

    if (error || !metadata) {
        return (
            <div
                ref={previewRef}
                style={positionStyle}
                className={`bg-slate-900 border border-red-500/30 rounded-xl shadow-2xl p-4 w-72 z-50 ${className}`}
            >
                <div className="flex items-center gap-3">
                    <span className="text-sm text-red-400">{error || 'No preview available'}</span>
                </div>
            </div>
        );
    }

    return (
        <div
            ref={previewRef}
            style={positionStyle}
            className={`bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden w-80 z-50 animate-in fade-in zoom-in-95 duration-200 ${className}`}
        >
            {/* Header with favicon and site name */}
            <div className="flex items-center justify-between px-3 py-2 bg-slate-800/50 border-b border-slate-700/50">
                <div className="flex items-center gap-2 min-w-0">
                    {metadata.favicon && (
                        <img
                            src={metadata.favicon}
                            alt=""
                            className="w-4 h-4 rounded-sm object-contain flex-shrink-0"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                    )}
                    <span className="text-xs text-slate-400 truncate font-medium">
                        {metadata.siteName || new URL(url).hostname}
                    </span>
                </div>
                <button
                    onClick={onClose}
                    className="p-1 text-slate-500 hover:text-white hover:bg-slate-700 rounded transition-all"
                >
                    <X size={14} />
                </button>
            </div>

            {/* Image preview */}
            {metadata.image && (
                <div className="w-full h-32 overflow-hidden bg-slate-800">
                    <img
                        src={metadata.image}
                        alt=""
                        className="w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                </div>
            )}

            {/* Content */}
            <div className="p-3">
                {metadata.title && (
                    <h4 className="text-sm font-semibold text-white line-clamp-2 mb-1">
                        {metadata.title}
                    </h4>
                )}
                {metadata.description && (
                    <p className="text-xs text-slate-400 line-clamp-2">
                        {metadata.description}
                    </p>
                )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-800/30 border-t border-slate-700/50">
                <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-lg transition-all"
                >
                    <ExternalLink size={12} />
                    Open
                </a>
                {onInsert && (
                    <button
                        onClick={() => onInsert(metadata)}
                        className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-xs font-medium rounded-lg transition-all"
                    >
                        Insert Link
                    </button>
                )}
            </div>
        </div>
    );
}
