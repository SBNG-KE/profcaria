'use client';

import { useEffect, useRef } from 'react';
import { recordProfileView } from '@/app/actions/profile';

interface ProfileViewTrackerProps {
    targetId: string;
    targetType: 'professional' | 'company';
}

export default function ProfileViewTracker({ targetId, targetType }: ProfileViewTrackerProps) {
    const trackedId = useRef('');

    useEffect(() => {
        if (!targetId || trackedId.current === targetId) return;
        trackedId.current = targetId;

        // We are deliberately catching errors quietly so it doesn't break the UI
        recordProfileView(targetId, targetType).catch(() => { });
    }, [targetId, targetType]);

    return null;
}
