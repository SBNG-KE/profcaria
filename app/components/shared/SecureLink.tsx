"use client";

import React, { useState, useEffect } from 'react';
import { ExternalLink, ShieldAlert, ShieldCheck, ShieldQuestion, ShieldX, Loader2 } from 'lucide-react';

interface SecureLinkProps {
    href: string;
    children: React.ReactNode;
    className?: string;
    checkOnHover?: boolean; // Only check when user hovers
    showIndicator?: boolean; // Show security indicator icon
}

interface UrlSecurityStatus {
    status: 'unknown' | 'safe' | 'suspicious' | 'malicious' | 'blocked';
    strikeCount?: number;
    threatType?: string;
    message?: string;
    isBlocked?: boolean;
}

export default function SecureLink({
    href,
    children,
    className = '',
    checkOnHover = true,
    showIndicator = true
}: SecureLinkProps) {
    const [securityStatus, setSecurityStatus] = useState<UrlSecurityStatus | null>(null);
    const [isChecking, setIsChecking] = useState(false);
    const [showWarning, setShowWarning] = useState(false);
    const [hasChecked, setHasChecked] = useState(false);

    // Check URL security status
    const checkUrlSecurity = async () => {
        if (hasChecked || isChecking) return;

        setIsChecking(true);
        try {
            const response = await fetch(`/api/security/check-url?url=${encodeURIComponent(href)}`);
            const data = await response.json();
            setSecurityStatus(data);
            setHasChecked(true);
        } catch (error) {
            console.error('Error checking URL security:', error);
            setSecurityStatus({ status: 'unknown' });
        } finally {
            setIsChecking(false);
        }
    };

    // Check immediately if not set to hover-only
    useEffect(() => {
        if (!checkOnHover) {
            checkUrlSecurity();
        }
    }, [href, checkOnHover]);

    const handleClick = (e: React.MouseEvent) => {
        // Block click if permanently blocked
        if (securityStatus?.status === 'blocked' || securityStatus?.isBlocked) {
            e.preventDefault();
            setShowWarning(true);
            return;
        }

        // Show warning for malicious/suspicious links
        if (securityStatus?.status === 'malicious' || securityStatus?.status === 'suspicious') {
            e.preventDefault();
            setShowWarning(true);
        }
    };

    const handleProceed = () => {
        setShowWarning(false);
        window.open(href, '_blank', 'noopener,noreferrer');
    };

    // Get icon based on status
    const getStatusIcon = () => {
        if (isChecking) {
            return <Loader2 className="w-3 h-3 animate-spin text-neutral-400" />;
        }

        switch (securityStatus?.status) {
            case 'blocked':
                return <ShieldX className="w-3 h-3 text-red-600" />;
            case 'malicious':
                return <ShieldAlert className="w-3 h-3 text-red-500" />;
            case 'suspicious':
                return <ShieldQuestion className="w-3 h-3 text-amber-500" />;
            case 'safe':
                return <ShieldCheck className="w-3 h-3 text-emerald-500" />;
            default:
                return null;
        }
    };

    // Get status label/badge
    const getStatusBadge = () => {
        if (securityStatus?.status === 'blocked') {
            return (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-600/20 text-red-500 text-[9px] font-black uppercase tracking-wider rounded-full border border-red-500/30 animate-pulse">
                    <ShieldX className="w-3 h-3" />
                    MALICIOUS - BLOCKED ({securityStatus.strikeCount}/10)
                </span>
            );
        }
        if (securityStatus?.status === 'malicious') {
            return (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-600/20 text-red-500 text-[9px] font-black uppercase tracking-wider rounded-full border border-red-500/30">
                    <ShieldAlert className="w-3 h-3" />
                    DANGEROUS ({securityStatus.strikeCount}/10)
                </span>
            );
        }
        if (securityStatus?.status === 'suspicious') {
            return (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-600/20 text-amber-500 text-[9px] font-black uppercase tracking-wider rounded-full border border-amber-500/30">
                    <ShieldQuestion className="w-3 h-3" />
                    SUSPICIOUS
                </span>
            );
        }
        return null;
    };

    const isBlocked = securityStatus?.status === 'blocked' || securityStatus?.isBlocked;

    return (
        <>
            <span className="inline-flex items-center gap-1 group relative">
                <a
                    href={isBlocked ? undefined : href}
                    onClick={handleClick}
                    onMouseEnter={checkOnHover ? checkUrlSecurity : undefined}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`
                        ${className}
                        ${isBlocked
                            ? 'line-through opacity-50 cursor-not-allowed text-red-500'
                            : securityStatus?.status === 'malicious'
                                ? 'text-red-400 hover:text-red-300'
                                : securityStatus?.status === 'suspicious'
                                    ? 'text-amber-400 hover:text-amber-300'
                                    : 'text-blue-400 hover:text-blue-300'
                        }
                        transition-colors
                    `}
                >
                    {children}
                </a>
                {showIndicator && getStatusIcon()}
                <ExternalLink className="w-3 h-3 opacity-50" />

                {/* Badge on hover */}
                {getStatusBadge() && (
                    <span className="absolute bottom-full left-0 mb-1 opacity-0 group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap">
                        {getStatusBadge()}
                    </span>
                )}
            </span>

            {/* Warning Modal */}
            {showWarning && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999] animate-in fade-in">
                    <div className="bg-neutral-900 border border-neutral-700 rounded-2xl p-8 max-w-md mx-4 space-y-6 animate-in zoom-in-95">
                        <div className="flex items-center gap-4">
                            {isBlocked ? (
                                <div className="p-4 bg-red-600/20 rounded-full">
                                    <ShieldX className="w-8 h-8 text-red-500" />
                                </div>
                            ) : (
                                <div className="p-4 bg-amber-600/20 rounded-full">
                                    <ShieldAlert className="w-8 h-8 text-amber-500" />
                                </div>
                            )}
                            <div>
                                <h3 className="text-xl font-black text-white">
                                    {isBlocked ? 'Link Blocked' : 'Security Warning'}
                                </h3>
                                <p className="text-neutral-400 text-sm">
                                    {isBlocked
                                        ? 'This link has been permanently blocked.'
                                        : 'This link may be dangerous.'
                                    }
                                </p>
                            </div>
                        </div>

                        <div className="bg-neutral-800/50 border border-neutral-700 rounded-xl p-4 space-y-2">
                            <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Target URL</p>
                            <p className="text-sm text-white font-mono break-all">{href}</p>
                            {securityStatus?.threatType && (
                                <p className="text-xs text-red-400">
                                    Threat Type: {securityStatus.threatType}
                                </p>
                            )}
                            {securityStatus?.strikeCount && (
                                <p className="text-xs text-neutral-400">
                                    Strike Count: {securityStatus.strikeCount}/10
                                </p>
                            )}
                        </div>

                        {isBlocked ? (
                            <div className="bg-red-900/20 border border-red-700/50 rounded-xl p-4">
                                <p className="text-sm text-red-300">
                                    This link has exceeded our safety threshold and has been permanently blocked to protect you.
                                    It has been flagged as dangerous by our security systems multiple times.
                                </p>
                            </div>
                        ) : (
                            <div className="bg-amber-900/20 border border-amber-700/50 rounded-xl p-4">
                                <p className="text-sm text-amber-300">
                                    Our security system has detected potential threats with this URL.
                                    Proceed only if you trust the source and understand the risks.
                                </p>
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowWarning(false)}
                                className="flex-1 px-6 py-3 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl font-bold transition-all"
                            >
                                Go Back
                            </button>
                            {!isBlocked && (
                                <button
                                    onClick={handleProceed}
                                    className="flex-1 px-6 py-3 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-600/30 rounded-xl font-bold transition-all"
                                >
                                    Proceed Anyway
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
