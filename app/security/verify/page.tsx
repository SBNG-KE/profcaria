//app/security/verify/page.tsx

"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    ShieldCheck,
    Smartphone,
    Fingerprint,
    Loader2,
    ArrowRight,
    HelpCircle,
    AlertCircle,
    CheckCircle2,
    MessageSquare
} from "lucide-react";
import { startAuthentication } from '@simplewebauthn/browser';

type SecurityStatus = {
    hasPasskey: boolean;
    hasTotp: boolean;
    hasPhone: boolean;
    is2faEnabled: boolean;
};

export default function SecurityVerifyPage() {
    const router = useRouter();
    const autoStarted = useRef(false);
    const [loading, setLoading] = useState(true);
    const [verifying, setVerifying] = useState(false);
    const [status, setStatus] = useState<SecurityStatus | null>(null);
    const [step, setStep] = useState<"selection" | "method">("selection");
    const [method, setMethod] = useState<"passkey" | "totp" | "phone" | null>(null);

    // Code State
    const [totpCode, setTotpCode] = useState("");
    const [phoneCode, setPhoneCode] = useState("");
    const [error, setError] = useState<string | null>(null);

    // 1. Fetch Status
    useEffect(() => {
    console.log('🔍 DEBUG: Fetching security status from /api/auth/me');
    fetch('/api/auth/me')
        .then(res => res.json())
        .then(data => {
            console.log('🔍 DEBUG: Received data from /api/auth/me:', data);
            if (data.security) {
                console.log('🔍 DEBUG: Security status:', data.security);
                setStatus(data.security);

                // Check if user is coming from password reset
                if (typeof window !== 'undefined') {
                    const resetEmail = localStorage.getItem('reset_password_email');
                    if (resetEmail) {
                        console.log('🔍 DEBUG: User is resetting password, email stored:', resetEmail);
                    }
                }

                if (!data.security.is2faEnabled) {
                    console.log('🔍 DEBUG: 2FA not enabled, redirecting to /security/setup');
                    router.push('/security/setup');
                } else if (data.security.hasPasskey && !autoStarted.current) {
                    console.log('🔍 DEBUG: Has passkey, auto-triggering passkey auth');
                    autoStarted.current = true;
                    setMethod('passkey');
                    setStep('method');
                    setTimeout(startPasskeyAuth, 100);
                } else {
                    console.log('🔍 DEBUG: Showing selection');
                    setStep('selection');
                }
            } else {
                console.log('🔍 DEBUG: No security data in response');
            }
            setLoading(false);
        })
        .catch(err => {
            console.error('🔍 DEBUG: Error fetching security status:', err);
            setError("Failed to load security status");
            setLoading(false);
        });
}, []);

    const verifyTotp = async () => {
    setVerifying(true);
    setError(null);
    try {
        const res = await fetch('/api/security/totp/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code: totpCode })
        });
        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.error);
        }

        // Check if we're coming from password reset
        if (typeof window !== 'undefined') {
            const resetEmail = localStorage.getItem('reset_password_email');
            if (resetEmail) {
                // Redirect back to the page with modal
                window.location.href = '/?resetPassword=true';
                return;
            }
        }

        router.refresh();
        router.push(data.redirect || '/');
    } catch (err: any) {
        setError(err.message || "Invalid code");
    } finally {
        setVerifying(false);
    }
};

// In startPasskeyAuth function, update the success part:
const startPasskeyAuth = async () => {
    setVerifying(true);
    setError(null);

    try {
        const resp = await fetch(
            '/api/security/passkey/authentication/options',
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({})
            }
        );

        const opts = await resp.json();
        if (!resp.ok) {
            throw new Error(opts.error || 'Failed to get authentication options');
        }

        let assertion;
        try {
            assertion = await startAuthentication({ optionsJSON: opts });
        } catch (e: any) {
            if (e.name === 'NotAllowedError') {
                throw new Error('Passkey request was cancelled.');
            }
            throw e;
        }

        const verificationResp = await fetch(
            '/api/security/passkey/authentication/verify',
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(assertion),
            }
        );

        const verificationJSON = await verificationResp.json();
        if (!verificationResp.ok || !verificationJSON.verified) {
            throw new Error(verificationJSON.error || 'Passkey verification failed');
        }

        // Check if we're coming from password reset
        if (typeof window !== 'undefined') {
            const resetEmail = localStorage.getItem('reset_password_email');
            if (resetEmail) {
                // Redirect back to the page with modal
                window.location.href = '/?resetPassword=true';
                return;
            }
        }

        router.refresh();
        router.push(verificationJSON.redirect || '/');

    } catch (err: any) {
        console.error('Passkey Auth Error:', err);
        setError(err.message || 'Passkey authentication failed');
    } finally {
        setVerifying(false);
    }
};




    const verifyPhone = async () => {
        setVerifying(true);
        setError(null);
        try {
            const res = await fetch('/api/security/phone/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: phoneCode })
            });
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error);
            }

            router.refresh();
            router.push(data.redirect || '/');
        } catch (err: any) {
            setError(err.message || "Invalid code");
        } finally {
            setVerifying(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent, type: 'totp' | 'phone') => {
        if (e.key === 'Enter') {
            if (type === 'totp' && totpCode.length === 6) verifyTotp();
            if (type === 'phone' && phoneCode.length === 6) verifyPhone();
        }
    };

    const handleMethodSelect = (selected: "passkey" | "totp" | "phone") => {
        setError(null);
        setMethod(selected);
        setStep("method");
        if (selected === "passkey") {
            setTimeout(() => startPasskeyAuth(), 100);
        } else if (selected === 'phone') {
            // Trigger SMS send on selection? Usually good UX.
            // Re-using the Setup endpoint? No, we need a "Send Verification Code" endpoint.
            // Setup endpoint generates a new code. We can REUSE it for now as "Request Code".
            // Since we don't have a distinct "send-otp" endpoint, I will use setup logic call
            // OR I need to make a "send-otp" endpoint? 
            // Reuse setup/route.ts? It just sends OTP. It doesn't check if user has phone, but SETUP does check user.
            // SETUP route generates code. That's fine.
            fetch('/api/security/phone/setup', { method: 'POST' }).catch(console.error);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#050b14] flex items-center justify-center text-slate-400">
                <Loader2 className="animate-spin" size={32} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#050b14] text-slate-200 font-sans flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Background Texture */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 z-0 mix-blend-overlay"></div>

            {/* Blue Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-900/10 blur-[120px] rounded-full pointer-events-none"></div>

            <div className="relative z-10 w-full max-w-md animate-in zoom-in-95 duration-500 fade-in">

                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center p-4 bg-slate-900/50 border border-slate-700/50 rounded-2xl mb-6 shadow-2xl shadow-blue-900/10 backdrop-blur-md relative group overflow-hidden">
                        <div className="absolute inset-0 bg-blue-500/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
                        <ShieldCheck size={32} className="text-blue-500 relative z-10" />
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">
                        Security Verification
                    </h1>
                    <p className="text-slate-500 text-sm">
                        Confirm your identity to continue.
                    </p>
                </div>

                {/* Main Card */}
                <div className="bg-[#0f172a]/80 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-1 shadow-2xl overflow-hidden ring-1 ring-white/5">
                    <div className="bg-[#0f172a]/40 rounded-[22px] p-6 md:p-8 min-h-[300px] flex flex-col items-center justify-center">

                        {error && (
                            <div className="w-full p-3 bg-red-900/20 border border-red-500/20 text-red-400 rounded-xl text-sm mb-6 text-center animate-in fade-in slide-in-from-top-2 flex items-center justify-center gap-2">
                                <AlertCircle size={16} />
                                {error}
                            </div>
                        )}

                        {/* SELECTION SCREEN */}
                        {step === "selection" && (
                            <div className="w-full space-y-4">
                                <p className="text-center text-slate-400 text-sm mb-6">Choose a verification method:</p>

                                {status?.hasPasskey && (
                                    <button
                                        onClick={() => handleMethodSelect('passkey')}
                                        className="w-full relative group flex items-center gap-4 p-4 rounded-xl bg-gradient-to-br from-blue-900/20 to-slate-900/50 border border-slate-700 hover:border-blue-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-blue-900/20"
                                    >
                                        <div className="p-3 bg-blue-500/20 rounded-lg text-blue-400 group-hover:scale-110 transition-transform">
                                            <Fingerprint size={24} />
                                        </div>
                                        <div className="text-left">
                                            <h3 className="text-white font-semibold">Passkey</h3>
                                            <p className="text-xs text-slate-500">Fastest (FaceID, TouchID)</p>
                                        </div>
                                        <ArrowRight className="ml-auto text-slate-600 group-hover:text-white transition-colors" size={18} />
                                    </button>
                                )}

                                {status?.hasTotp && (
                                    <button
                                        onClick={() => handleMethodSelect('totp')}
                                        className="w-full relative group flex items-center gap-4 p-4 rounded-xl bg-slate-900/30 border border-slate-700 hover:border-slate-500 transition-all duration-300 hover:bg-slate-800/50"
                                    >
                                        <div className="p-3 bg-slate-800 rounded-lg text-slate-400 group-hover:text-slate-200 transition-colors">
                                            <Smartphone size={24} />
                                        </div>
                                        <div className="text-left">
                                            <h3 className="text-slate-200 font-semibold">Authenticator App</h3>
                                            <p className="text-xs text-slate-500">Enter 6-digit code</p>
                                        </div>
                                        <ArrowRight className="ml-auto text-slate-600 group-hover:text-white transition-colors" size={18} />
                                    </button>
                                )}

                                {status?.hasPhone && (
                                    <button
                                        onClick={() => handleMethodSelect('phone')}
                                        className="w-full relative group flex items-center gap-4 p-4 rounded-xl bg-slate-900/30 border border-slate-700 hover:border-slate-500 transition-all duration-300 hover:bg-slate-800/50"
                                    >
                                        <div className="p-3 bg-slate-800 rounded-lg text-slate-400 group-hover:text-slate-200 transition-colors">
                                            <MessageSquare size={24} />
                                        </div>
                                        <div className="text-left">
                                            <h3 className="text-slate-200 font-semibold">SMS Verification</h3>
                                            <p className="text-xs text-slate-500">Code via Text Message</p>
                                        </div>
                                        <ArrowRight className="ml-auto text-slate-600 group-hover:text-white transition-colors" size={18} />
                                    </button>
                                )}

                                {(!status?.hasPasskey && !status?.hasTotp && !status?.hasPhone) && (
                                    <div className="text-center p-4">
                                        <p className="text-amber-500 text-sm">No security methods configured.</p>
                                        <button
                                            onClick={() => {
                                                console.log('🔍 DEBUG: "Set up now" button clicked');
                                                console.log('🔍 DEBUG: Status:', status);
                                                router.push('/security/setup');
                                            }}
                                            className="mt-4 text-blue-400 hover:underline text-sm"
                                        >
                                            Set up now
                                        </button>
                                    </div>
                                )}


                                <div className="mt-8 pt-4 border-t border-slate-800/50 text-center">
                                    <button
                                        onClick={() => {
                                            console.log('🔍 DEBUG: Security Setup button clicked');
                                            console.log('🔍 DEBUG: Current router:', router);
                                            console.log('🔍 DEBUG: Attempting to navigate to /security/setup');
                                            router.push('/security/setup');
                                            console.log('🔍 DEBUG: router.push() called');
                                        }}
                                        className="text-xs text-slate-500 hover:text-blue-400 transition-colors flex items-center justify-center gap-1 mx-auto cursor-pointer"
                                    >
                                        Go to Security Setup and choose your options
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* METHOD: PASSKEY */}
                        {step === "method" && method === "passkey" && (
                            <div className="w-full flex flex-col items-center space-y-6 animate-in fade-in slide-in-from-right-8">
                                <div className="p-6 rounded-full bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/20">
                                    {verifying ? <Loader2 className="animate-spin" size={48} /> : <Fingerprint size={48} />}
                                </div>
                                <div className="text-center">
                                    <h3 className="text-lg font-semibold text-white mb-1">Verifying with Passkey</h3>
                                    <p className="text-sm text-slate-500">Check your browser prompt.</p>
                                </div>
                                <button
                                    onClick={() => { setError(null); setStep('selection'); }}
                                    className="text-sm text-slate-500 hover:text-slate-300"
                                >
                                    Choose another method
                                </button>
                                {/* Manual retry if auto-start failed or dismissed */}
                                {!verifying && (
                                    <button onClick={startPasskeyAuth} className="text-blue-400 text-sm hover:underline">Retry</button>
                                )}
                            </div>
                        )}

                        {/* METHOD: TOTP */}
                        {step === "method" && method === "totp" && (
                            <div className="w-full space-y-6 animate-in fade-in slide-in-from-right-8">
                                <div className="space-y-2">
                                    <label className="block text-xs font-medium text-slate-400 text-center uppercase tracking-wider">Authentication Code</label>
                                    <input
                                        type="text"
                                        value={totpCode}
                                        onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                        onKeyDown={(e) => handleKeyDown(e, 'totp')}
                                        className="w-full bg-slate-900/50 border border-slate-700 text-center text-3xl tracking-[0.5em] text-white p-4 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder-slate-800 font-mono"
                                        placeholder="000000"
                                        autoFocus
                                    />
                                </div>

                                <button
                                    onClick={verifyTotp}
                                    disabled={verifying || totpCode.length !== 6}
                                    className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-blue-900/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {verifying ? <Loader2 className="animate-spin" /> : "Verify Access"}
                                </button>

                                <div className="text-center">
                                    <button
                                        onClick={() => { setError(null); setStep('selection'); }}
                                        className="text-sm text-slate-500 hover:text-slate-300"
                                    >
                                        Choose another method
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* METHOD: PHONE */}
                        {step === "method" && method === "phone" && (
                            <div className="w-full space-y-6 animate-in fade-in slide-in-from-right-8">
                                <div className="space-y-2">
                                    <label className="block text-xs font-medium text-slate-400 text-center uppercase tracking-wider">SMS Code</label>
                                    <p className="text-[10px] text-slate-600 text-center mb-2">Code sent to your phone</p>
                                    <input
                                        type="text"
                                        value={phoneCode}
                                        onChange={(e) => setPhoneCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                        onKeyDown={(e) => handleKeyDown(e, 'phone')}
                                        className="w-full bg-slate-900/50 border border-slate-700 text-center text-3xl tracking-[0.5em] text-white p-4 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder-slate-800 font-mono"
                                        placeholder="000000"
                                        autoFocus
                                    />
                                </div>

                                <button
                                    onClick={verifyPhone}
                                    disabled={verifying || phoneCode.length !== 6}
                                    className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-blue-900/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {verifying ? <Loader2 className="animate-spin" /> : "Verify Access"}
                                </button>

                                <div className="text-center">
                                    <button
                                        onClick={() => { setError(null); setStep('selection'); }}
                                        className="text-sm text-slate-500 hover:text-slate-300"
                                    >
                                        Choose another method
                                    </button>
                                </div>
                            </div>
                        )}

                    </div>
                </div>

                <div className="mt-6 text-center">
                    <button className="text-slate-600 text-xs hover:text-slate-400 transition-colors flex items-center justify-center gap-1 mx-auto">
                        <HelpCircle size={12} /> Contact Support
                    </button>
                </div>

            </div>
        </div>
    );
}
