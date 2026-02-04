"use client";

import React, { useState, useEffect, useRef } from 'react';
import { ExternalLink, Loader2 } from 'lucide-react';

interface LinkMetadata {
    title: string | null;
    description: string | null;
    image: string | null;
    favicon: string | null;
    siteName: string | null;
}

interface InlineLinkPreviewProps {
    url: string;
    className?: string;
}

// Cache for link metadata to avoid refetching
const metadataCache = new Map<string, LinkMetadata>();

export default function InlineLinkPreview({ url, className = '' }: InlineLinkPreviewProps) {
    const [metadata, setMetadata] = useState<LinkMetadata | null>(metadataCache.get(url) || null);
    const [loading, setLoading] = useState(!metadataCache.has(url));
    const [error, setError] = useState(false);
    const fetchedRef = useRef(false);

    useEffect(() => {
        // If already cached, don't fetch
        if (metadataCache.has(url)) {
            setMetadata(metadataCache.get(url)!);
            setLoading(false);
            return;
        }

        // Prevent duplicate fetches
        if (fetchedRef.current) return;
        fetchedRef.current = true;

        const fetchMetadata = async () => {
            try {
                const response = await fetch(`/api/link-preview?url=${encodeURIComponent(url)}`);
                if (!response.ok) throw new Error('Failed');

                const data = await response.json();
                metadataCache.set(url, data);
                setMetadata(data);
            } catch {
                setError(true);
            } finally {
                setLoading(false);
            }
        };

        fetchMetadata();
    }, [url]);

    // Don't show anything if error or no useful metadata
    if (error) return null;
    if (!loading && (!metadata || (!metadata.title && !metadata.description && !metadata.image))) {
        return null;
    }

    if (loading) {
        return (
            <div className={`mt-2 bg-black/20 rounded-lg p-2 flex items-center gap-2 ${className}`}>
                <Loader2 size={12} className="animate-spin opacity-50" />
                <span className="text-xs opacity-50">Loading preview...</span>
            </div>
        );
    }

    return (
        <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className={`mt-2 block bg-black/20 rounded-lg overflow-hidden hover:bg-black/30 transition-colors ${className}`}
            onClick={(e) => e.stopPropagation()}
        >
            {/* Image */}
            {metadata?.image && (
                <div className="w-full h-24 overflow-hidden bg-black/10">
                    <img
                        src={metadata.image}
                        alt=""
                        className="w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                </div>
            )}

            {/* Content */}
            <div className="p-2">
                {/* Site info */}
                <div className="flex items-center gap-1.5 mb-1">
                    {metadata?.favicon && (
                        <img
                            src={metadata.favicon}
                            alt=""
                            className="w-3 h-3 rounded-sm object-contain"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                    )}
                    <span className="text-[10px] opacity-60 font-medium truncate">
                        {metadata?.siteName || new URL(url).hostname}
                    </span>
                    <ExternalLink size={8} className="opacity-40 shrink-0" />
                </div>

                {/* Title */}
                {metadata?.title && (
                    <h4 className="text-xs font-semibold line-clamp-2 leading-tight">
                        {metadata.title}
                    </h4>
                )}

                {/* Description */}
                {metadata?.description && (
                    <p className="text-[10px] opacity-70 line-clamp-2 mt-0.5 leading-tight">
                        {metadata.description}
                    </p>
                )}
            </div>
        </a>
    );
}

// Helper function to extract first URL from text
export function extractFirstUrl(text: string): string | null {
    // Matches https://, http://, www., or just domain.com (but requires at least one dot and 2+ char TLD)
    // Avoids matching simple filenames or short typos by requiring 2 char TLD
    const urlPattern = /(?:https?:\/\/|www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,10}\b(?:[-a-zA-Z0-9@:%_\+.~#?&//=]*)/gi;
    const matches = text.match(urlPattern);
    return matches ? matches[0] : null;
}
