'use client';

import { useEffect, useRef } from 'react';

interface ProfileViewTrackerProps {
    targetId: string;
    targetType: 'professional' | 'company';
}

export default function ProfileViewTracker({ targetId, targetType }: ProfileViewTrackerProps) {
    const tracked = useRef(false);

    useEffect(() => {
        if (tracked.current) return;
        tracked.current = true;

        fetch('/api/profile/view', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ targetId, targetType }),
        }).catch(err => console.error('Error tracking profile view:', err));
    }, [targetId, targetType]);

    return null;
}
