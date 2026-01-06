"use client"

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

function CallbackContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');

    useEffect(() => {
        const reference = searchParams.get('reference');
        if (reference) {
            handleVerify(reference);
        } else {
            setStatus('error');
        }
    }, [searchParams]);

    const handleVerify = async (reference: string) => {
        try {
            const res = await fetch('/api/payments/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reference })
            });

            if (res.ok) {
                setStatus('success');
                // Wait 2 seconds then redirect to settings
                setTimeout(() => {
                    router.push('/employer/settings?tab=billing');
                }, 2000);
            } else {
                setStatus('error');
            }
        } catch (error) {
            console.error(error);
            setStatus('error');
        }
    };

    return (
        <div className="flex flex-col items-center gap-6 p-8 bg-[#0f172a] border border-slate-800 rounded-3xl shadow-2xl max-w-md w-full text-center">
            {status === 'verifying' && (
                <>
                    <Loader2 className="animate-spin text-blue-500" size={48} />
                    <h2 className="text-xl font-bold text-white">Verifying Payment...</h2>
                    <p className="text-slate-400">Please wait while we confirm your transaction.</p>
                </>
            )}
            {status === 'success' && (
                <>
                    <CheckCircle className="text-emerald-500" size={48} />
                    <h2 className="text-xl font-bold text-white">Payment Successful!</h2>
                    <p className="text-emerald-400/80">Updating your account permissions...</p>
                </>
            )}
            {status === 'error' && (
                <>
                    <XCircle className="text-red-500" size={48} />
                    <h2 className="text-xl font-bold text-white">Verification Failed</h2>
                    <p className="text-slate-400">We couldn't verify the payment. Please contact support.</p>
                    <button
                        onClick={() => router.push('/employer/settings')}
                        className="px-6 py-2 bg-slate-800 rounded-xl text-white font-bold hover:bg-slate-700"
                    >
                        Return to Settings
                    </button>
                </>
            )}
        </div>
    );
}

export default function PaymentCallbackPage() {
    return (
        <div className="min-h-screen bg-[#050b14] flex items-center justify-center p-4">
            <Suspense fallback={<div>Loading...</div>}>
                <CallbackContent />
            </Suspense>
        </div>
    );
}
