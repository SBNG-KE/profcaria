"use client"

import React, { useState, useEffect } from 'react';
import { UserPlus, UserCheck, Loader2, Check, Plus } from 'lucide-react';
import { useTheme } from '@/app/context/ThemeContext';

interface FollowButtonProps {
    targetId: string;
    type: 'user' | 'company';
    initialIsFollowing?: boolean;
    onToggle?: (isFollowing: boolean) => void;
    className?: string;
    variant?: 'primary' | 'outline' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
}

export default function FollowButton({
    targetId,
    type,
    initialIsFollowing,
    onToggle,
    className = '',
    variant = 'primary',
    size = 'md'
}: FollowButtonProps) {
    const [isFollowing, setIsFollowing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isChecking, setIsChecking] = useState(initialIsFollowing === undefined);
    const [hasChecked, setHasChecked] = useState(false);

    const { theme } = useTheme();
    const isDark = theme === 'dark';

    useEffect(() => {
        if (initialIsFollowing !== undefined) {
            setIsFollowing(initialIsFollowing);
            setIsChecking(false);
            setHasChecked(true);
        } else if (!hasChecked) {
            setIsChecking(true);
            fetch(`/api/professional/follow?type=check&entityType=${type}&targetId=${targetId}`)
                .then(res => res.json())
                .then(data => {
                    setIsFollowing(data.isFollowing);
                    setHasChecked(true);
                })
                .catch(err => console.error("Error checking follow status", err))
                .finally(() => setIsChecking(false));
        }
    }, [initialIsFollowing, targetId, type, hasChecked]);

    const handleToggle = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (isLoading || isChecking) return;
        setIsLoading(true);

        try {
            const res = await fetch('/api/professional/follow', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: targetId, type })
            });

            if (res.ok) {
                const data = await res.json();
                setIsFollowing(data.following);
                if (onToggle) onToggle(data.following);
            }
        } catch (error) {
            console.error('Error toggling follow', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Styles
    const baseStyles = "flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200 disabled:opacity-50";

    const sizeStyles = {
        sm: "px-3 py-1.5 text-xs",
        md: "px-4 py-2 text-sm",
        lg: "px-6 py-3 text-base"
    };

    const variantStyles = {
        primary: isFollowing
            ? (isDark
                ? "bg-neutral-800 text-neutral-300 hover:bg-neutral-700 hover:text-white border border-neutral-700"
                : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 hover:text-black border border-neutral-200")
            : (isDark
                ? "bg-white text-black hover:bg-blue-50 hover:text-blue-600"
                : "bg-black text-white hover:bg-neutral-800"),
        outline: isFollowing
            ? (isDark
                ? "border border-neutral-700 text-neutral-400 hover:text-white hover:border-neutral-500"
                : "border border-neutral-300 text-neutral-600 hover:text-black hover:border-neutral-400")
            : (isDark
                ? "border border-white/50 text-white hover:bg-white/10"
                : "border border-black/50 text-black hover:bg-black/5"),
        ghost: "hover:bg-neutral-100 dark:hover:bg-neutral-800"
    };

    const getIcon = () => {
        if (isLoading || isChecking) return <Loader2 size={size === 'sm' ? 14 : 18} className="animate-spin" />;
        if (type === 'company') {
            return isFollowing ? <Check size={size === 'sm' ? 14 : 18} /> : <Plus size={size === 'sm' ? 14 : 18} />;
        }
        if (isFollowing) return <UserCheck size={size === 'sm' ? 14 : 18} />;
        return <UserPlus size={size === 'sm' ? 14 : 18} />;
    };

    const getLabel = () => {
        if (isChecking) return 'Checking...';
        if (type === 'company') {
            if (isLoading) return isFollowing ? 'Unsubscribing...' : 'Subscribing...';
            return isFollowing ? 'Subscribed' : 'Subscribe';
        }
        if (isLoading) return isFollowing ? 'Unfollowing...' : 'Following...';
        return isFollowing ? 'Following' : 'Follow';
    };

    return (
        <button
            onClick={handleToggle}
            disabled={isLoading || isChecking}
            className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
        >
            {getIcon()}
            <span>{getLabel()}</span>
        </button>
    );
}
