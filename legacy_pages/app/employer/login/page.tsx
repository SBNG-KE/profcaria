"use client"

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function EmployerLoginRedirect() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/?auth=login&role=employer');
    }, [router]);

    return (
        <div className="min-h-screen bg-[#050b14] flex items-center justify-center text-slate-500 text-sm">
            <Loader2 className="animate-spin mr-2" /> Redirecting...
        </div>
    );
}
