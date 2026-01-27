"use client"

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function SecuritySetupRedirect() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/?mode=setup');
    }, [router]);

    return (
        <div className="min-h-screen bg-[#050b14] flex items-center justify-center text-slate-500 text-sm">
            <Loader2 className="animate-spin mr-2" /> Redirecting...
        </div>
    );
}