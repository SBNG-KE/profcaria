"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminPromoEmailsPage() {
    const router = useRouter();
    const [isDark, setIsDark] = useState(true);
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [adminEmail, setAdminEmail] = useState<string>('');

    useEffect(() => {
        // Check dark mode
        const darkPref = localStorage.getItem('theme');
        setIsDark(darkPref !== 'light');

        // Check session
        checkAuthorization();
    }, []);

    const checkAuthorization = async () => {
        try {
            const res = await fetch('/api/employer/session');
            if (!res.ok) {
                router.push('/employer/login');
                return;
            }
            const session = await res.json();

            // Get company details to check admin email
            const companyRes = await fetch('/api/employer/company');
            if (!companyRes.ok) {
                router.push('/employer/login');
                return;
            }
            const company = await companyRes.json();

            // Store the admin email for API call
            setAdminEmail(company.adminEmail || '');
            setIsAuthorized(true);
        } catch (err) {
            router.push('/employer/login');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSendEmails = async () => {
        setIsSending(true);
        setError(null);
        setResult(null);

        try {
            const res = await fetch('/api/admin/promo-emails', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ adminEmail })
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || 'Failed to send emails');
            } else {
                setResult(data);
            }
        } catch (err: any) {
            setError(err.message || 'Failed to send emails');
        } finally {
            setIsSending(false);
        }
    };

    if (isLoading) {
        return (
            <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-black' : 'bg-neutral-50'}`}>
                <div className={`animate-spin w-8 h-8 border-3 border-t-transparent rounded-full ${isDark ? 'border-white' : 'border-black'}`} />
            </div>
        );
    }

    if (!isAuthorized) {
        return (
            <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-black text-white' : 'bg-neutral-50 text-black'}`}>
                <p>Not authorized</p>
            </div>
        );
    }

    return (
        <div className={`min-h-screen p-8 ${isDark ? 'bg-black text-white' : 'bg-neutral-50 text-black'}`}>
            <div className="max-w-2xl mx-auto">
                <h1 className="text-3xl font-black mb-2">Admin: Promo Welcome Emails</h1>
                <p className={`mb-8 ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                    Send welcome emails to existing promo users who haven't received them yet.
                </p>

                <div className={`p-6 rounded-2xl border ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'}`}>
                    <h2 className="text-lg font-bold mb-4">How it works</h2>
                    <ul className={`space-y-2 mb-6 text-sm ${isDark ? 'text-neutral-300' : 'text-neutral-600'}`}>
                        <li>• Finds all promo claims where email hasn't been sent</li>
                        <li>• Sends welcome email with plan details and expiry date</li>
                        <li>• Marks each as sent (won't receive duplicate emails)</li>
                        <li>• Safe to run multiple times</li>
                    </ul>

                    <button
                        onClick={handleSendEmails}
                        disabled={isSending}
                        className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${isSending
                                ? 'bg-neutral-700 text-neutral-400 cursor-not-allowed'
                                : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:opacity-90'
                            }`}
                    >
                        {isSending ? 'Sending...' : '🎁 Send Welcome Emails'}
                    </button>
                </div>

                {error && (
                    <div className="mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500">
                        <p className="font-bold">Error</p>
                        <p className="text-sm">{error}</p>
                    </div>
                )}

                {result && (
                    <div className="mt-6 p-6 rounded-xl bg-green-500/10 border border-green-500/30">
                        <p className="font-bold text-green-500 mb-4">✅ {result.message}</p>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className={`p-4 rounded-lg ${isDark ? 'bg-neutral-800' : 'bg-neutral-100'}`}>
                                <p className="font-bold mb-2">Employers</p>
                                <p>Sent: {result.results.employers.sent}</p>
                                <p>Failed: {result.results.employers.failed}</p>
                                <p>Skipped: {result.results.employers.skipped}</p>
                            </div>
                            <div className={`p-4 rounded-lg ${isDark ? 'bg-neutral-800' : 'bg-neutral-100'}`}>
                                <p className="font-bold mb-2">Professionals</p>
                                <p>Sent: {result.results.professionals.sent}</p>
                                <p>Failed: {result.results.professionals.failed}</p>
                                <p>Skipped: {result.results.professionals.skipped}</p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="mt-8 text-center">
                    <button
                        onClick={() => router.push('/employer/dashboard')}
                        className={`text-sm ${isDark ? 'text-neutral-500 hover:text-white' : 'text-neutral-400 hover:text-black'}`}
                    >
                        ← Back to Dashboard
                    </button>
                </div>
            </div>
        </div>
    );
}
