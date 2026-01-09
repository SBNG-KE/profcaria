
'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

function CallbackContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const reference = searchParams.get('reference') || searchParams.get('trxref');
    const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');

    useEffect(() => {
        if (!reference) {
            setStatus('error');
            return;
        }

        const verify = async () => {
            try {
                const res = await fetch(`/api/payments/verify?reference=${reference}`);
                if (res.ok) {
                    setStatus('success');
                    // Wait a moment then redirect
                    setTimeout(() => {
                        router.push('/employer/settings?tab=billing&payment=success');
                    }, 2000);
                } else {
                    setStatus('error');
                    setTimeout(() => {
                        router.push('/employer/settings?tab=billing&payment=failed');
                    }, 3000);
                }
            } catch (e) {
                setStatus('error');
            }
        };

        verify();
    }, [reference, router]);

    return (
        <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4">
            <div className="bg-[#0f172a] border border-slate-800 p-8 rounded-3xl max-w-sm w-full text-center space-y-6 shadow-2xl">
                {status === 'verifying' && (
                    <>
                        <Loader2 className="animate-spin text-emerald-500 mx-auto" size={48} />
                        <h2 className="text-xl font-bold text-white">Verifying Payment...</h2>
                        <p className="text-slate-400 text-sm">Please wait while we confirm your subscription.</p>
                    </>
                )}
                {status === 'success' && (
                    <>
                        <CheckCircle className="text-emerald-500 mx-auto" size={48} />
                        <h2 className="text-xl font-bold text-white">Payment Successful!</h2>
                        <p className="text-slate-400 text-sm">Your plan has been updated.</p>
                        <p className="text-xs text-slate-500 animate-pulse">Redirecting...</p>
                    </>
                )}
                {status === 'error' && (
                    <>
                        <XCircle className="text-red-500 mx-auto" size={48} />
                        <h2 className="text-xl font-bold text-white">Verification Failed</h2>
                        <p className="text-slate-400 text-sm">We couldn't verify the payment. Please contact support if you were charged.</p>
                    </>
                )}
            </div>
        </div>
    );
}

export default function PaymentCallbackPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#020617]" />}>
            <CallbackContent />
        </Suspense>
    );
}
