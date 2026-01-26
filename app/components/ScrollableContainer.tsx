"use client"

import React, { useState, useRef, useEffect, ReactNode } from 'react';

export default function ScrollableContainer({ children, className = "" }: { children: ReactNode, className?: string }) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const [scrollProgress, setScrollProgress] = useState(0);
    const [showScrollbar, setShowScrollbar] = useState(false);

    const handleScroll = () => {
        const element = scrollRef.current;
        if (!element) return;
        const { scrollTop, scrollHeight, clientHeight } = element;

        const needsScroll = scrollHeight > clientHeight + 1;
        if (needsScroll !== showScrollbar) {
            setShowScrollbar(needsScroll);
        }

        if (needsScroll) {
            const scrollPercentage = scrollTop / (scrollHeight - clientHeight);
            setScrollProgress(scrollPercentage);
        }
    };

    useEffect(() => {
        const element = scrollRef.current;
        if (!element) return;

        const resizeObserver = new ResizeObserver(() => {
            handleScroll();
        });

        resizeObserver.observe(element);
        handleScroll();
        window.addEventListener('resize', handleScroll);
        return () => {
            resizeObserver.disconnect();
            window.removeEventListener('resize', handleScroll);
        };
    }, []);

    useEffect(() => {
        handleScroll();
    }, [children]);

    return (
        <div className="relative flex-1 min-h-0 overflow-hidden flex flex-col w-full h-full">
            <div
                ref={scrollRef}
                onScroll={handleScroll}
                className={`flex-1 overflow-y-auto scrollbar-hide ${className}`}
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                <div ref={contentRef}>
                    {children}
                </div>
            </div>

        </div>
    );
};
