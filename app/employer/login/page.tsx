"use client"

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function EmployerLoginRedirect() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/auth?mode=login&userType=employer');
    }, [router]);

    return (
        <div className="min-h-screen bg-[#050b14] flex items-center justify-center text-slate-500 text-sm">
            Redirecting to login...
        </div>
    );
}
