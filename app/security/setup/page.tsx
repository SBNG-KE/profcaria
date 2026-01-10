//app/security/setup/page.tsx

"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    ShieldCheck,
    Smartphone,
    Fingerprint,
    Lock,
    AlertCircle,
    Database,
    CheckCircle,
    Loader2,
    Copy,
    Plus,
    MessageSquare,
    Trash2,
    Mail
} from "lucide-react";
import Image from "next/image";
import { startRegistration } from '@simplewebauthn/browser';

type SecurityStatus = {
    hasPasskey: boolean;
    hasTotp: boolean;
    hasPhone: boolean;
    is2faEnabled: boolean;
};

export default function SecuritySetupPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState<"selection" | "setup" | "verify" | "email_verify">("selection");
    const [status, setStatus] = useState<SecurityStatus | null>(null);

    // TOTP State
    const [qrCode, setQrCode] = useState<string | null>(null);
    const [secret, setSecret] = useState<string | null>(null);
    const [totpCode, setTotpCode] = useState("");
    const [emailOtp, setEmailOtp] = useState("");
    const [error, setError] = useState<string | null>(null);

    // Fetch Status with NO CACHE to ensure fresh data
    const fetchStatus = async () => {
        try {
            const res = await fetch('/api/auth/me', { cache: 'no-store' });
            const data = await res.json();
            if (data.security) {
                setStatus(data.security);
            }
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchStatus();
    }, []);

    // Auto-verify when 6 digits are entered
    useEffect(() => {
        if (emailOtp.length === 6 && !loading) {
            verifyEmailOtp();
        }
    }, [emailOtp]);

    const handleSuccess = async () => {
        // 1. Refresh global status
        await fetchStatus();

        // 2. Clear router cache to ensure Verify page sees new data
        router.refresh();

        // 3. Stay on page to show active status
        setStep('selection');
        setLoading(false);
    };

    const startTotpSetup = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/security/totp/setup', { method: 'POST' });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            setQrCode(data.qrCode);
            setSecret(data.secret);
            setStep('setup');
        } catch (err: any) {
            setError(err.message || "Failed to start setup");
        } finally {
            setLoading(false);
        }
    };

    const startPasskeySetup = async () => {
        setLoading(true);
        setError(null);
        try {
            const resp = await fetch('/api/security/passkey/registration/options');
            const opts = await resp.json();
            if (!resp.ok) throw new Error(opts.error);

            let attResp;
            try {
                attResp = await startRegistration(opts);
            } catch (e: any) {
                if (e.name === 'NotAllowedError') {
                    throw new Error("Passkey setup cancelled or timed out.");
                }
                throw e;
            }

            const verificationResp = await fetch('/api/security/passkey/registration/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(attResp),
            });

            const verificationJSON = await verificationResp.json();
            if (verificationJSON && verificationJSON.verified) {
                await handleSuccess();
            } else {
                throw new Error(verificationJSON.error || "Verification failed");
            }

        } catch (err: any) {
            console.error(err);
            setError(err.message || "Passkey setup failed");
        } finally {
            setLoading(false);
        }
    };

    const verifyTotp = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/security/totp/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: totpCode })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            await handleSuccess();
        } catch (err: any) {
            setError(err.message || "Invalid code");
        } finally {
            setLoading(false);
        }
    };

    const startEmailSetup = async () => {
        setLoading(true);
        setError(null);
        try {
            // Call the shared setup endpoint (sends code via Resend)
            const res = await fetch('/api/security/otp/setup', { method: 'POST' });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            // CHANGED: Verify INLINE instead of redirecting
            setStep('email_verify');
        } catch (err: any) {
            setError(err.message || "Failed to send email code");
        } finally {
            setLoading(false);
        }
    };

    const verifyEmailOtp = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/security/otp/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: emailOtp })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            // Success! Immediately update UI to unblock user
            setStep('selection');
            setLoading(false);

            // Refresh data in background
            fetchStatus().then(() => router.refresh());

        } catch (err: any) {
            setError(err.message || "Invalid code");
            setLoading(false);
        }
    };

    // Remove a method
    const removeMethod = async (methodType: 'passkey' | 'totp' | 'phone') => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/security/${methodType}/remove`, {
                method: 'POST',
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            await fetchStatus();
        } catch (err: any) {
            setError(err.message || "Failed to remove method");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#050b14] text-slate-200 font-sans flex flex-col items-center justify-center p-4 relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 z-0 mix-blend-overlay"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-900/10 blur-[120px] rounded-full pointer-events-none"></div>

            <div className="relative z-10 w-full max-w-2xl animate-in zoom-in-95 duration-500 fade-in">

                {/* Header */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center p-4 bg-slate-900/50 border border-slate-700/50 rounded-2xl mb-6 shadow-2xl shadow-blue-900/10 backdrop-blur-md relative overflow-hidden group">
                        <div className="absolute inset-0 bg-blue-500/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
                        <ShieldCheck size={42} className="text-blue-500 relative z-10" />
                    </div>
                    <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400 mb-3 tracking-tight">
                        Secure Your Account
                    </h1>
                    <p className="text-slate-500 text-sm max-w-sm mx-auto">
                        Configure multifactor authentication to keep your workspace safe.
                    </p>
                </div>

                <div className="bg-[#0f172a]/80 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-1 shadow-2xl overflow-hidden ring-1 ring-white/5">
                    <div className="space-y-6 bg-[#0f172a]/40 rounded-[22px] p-6 md:p-8 min-h-[400px] flex flex-col">

                        {error && (
                            <div className="p-4 bg-red-900/20 border border-red-500/20 text-red-400 rounded-xl text-sm mb-2 text-center flex items-center justify-center gap-2">
                                <AlertCircle size={16} /> {error}
                            </div>
                        )}

                        {step === "selection" ? (
                            <>
                                {/* SECTION 1: ACTIVE METHODS */}
                                {status && (status.hasPasskey || status.hasTotp || status.hasPhone) && (
                                    <div className="space-y-4">
                                        <h3 className="text-xs uppercase tracking-widest text-slate-500 font-semibold mb-2">Active Methods</h3>
                                        <div className="grid gap-3">
                                            {status.hasPasskey && (
                                                <div className="flex items-center justify-between p-4 bg-blue-900/10 border border-blue-500/30 rounded-xl hover:border-blue-400/50 transition-all">
                                                    <div className="flex items-center gap-4">
                                                        <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
                                                            <Fingerprint size={24} />
                                                        </div>
                                                        <div>
                                                            <h4 className="font-semibold text-white">Passkey</h4>
                                                            <p className="text-xs text-blue-400">Enabled • Biometric</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <div className="text-emerald-500 flex items-center gap-1.5 text-xs font-medium px-3 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                                                            <CheckCircle size={12} /> Active
                                                        </div>
                                                        <button
                                                            onClick={() => removeMethod('passkey')}
                                                            className="p-2 text-red-400 hover:bg-red-900/20 rounded-lg transition-colors"
                                                            title="Remove passkey"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                            )}

                                            {status.hasTotp && (
                                                <div className="flex items-center justify-between p-4 bg-slate-800/20 border border-slate-700/50 rounded-xl hover:border-slate-500/50 transition-all">
                                                    <div className="flex items-center gap-4">
                                                        <div className="p-2 bg-slate-700/50 rounded-lg text-slate-400">
                                                            <Smartphone size={24} />
                                                        </div>
                                                        <div>
                                                            <h4 className="font-semibold text-slate-200">Authenticator App</h4>
                                                            <p className="text-xs text-slate-500">Enabled • Code Generator</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <div className="text-emerald-500 flex items-center gap-1.5 text-xs font-medium px-3 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                                                            <CheckCircle size={12} /> Active
                                                        </div>
                                                        <button
                                                            onClick={() => removeMethod('totp')}
                                                            className="p-2 text-red-400 hover:bg-red-900/20 rounded-lg transition-colors"
                                                            title="Remove authenticator"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                            )}

                                            {status.hasPhone && (
                                                <div className="flex items-center justify-between p-4 bg-slate-800/20 border border-slate-700/50 rounded-xl hover:border-slate-500/50 transition-all">
                                                    <div className="flex items-center gap-4">
                                                        <div className="p-2 bg-slate-700/50 rounded-lg text-slate-400">
                                                            <Mail size={24} />
                                                        </div>
                                                        <div>
                                                            <h4 className="font-semibold text-slate-200">Email Verification</h4>
                                                            <p className="text-xs text-slate-500">Enabled • OTP via Email</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <div className="text-emerald-500 flex items-center gap-1.5 text-xs font-medium px-3 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                                                            <CheckCircle size={12} /> Active
                                                        </div>
                                                        {/* No remove method for phone currently implemented, or use existing stub */}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* DIVIDER */}
                                {status && (status.hasPasskey || status.hasTotp || status.hasPhone) && (!status.hasPasskey || !status.hasTotp || !status.hasPhone) && (
                                    <div className="relative py-4">
                                        <div className="absolute inset-0 flex items-center">
                                            <div className="w-full border-t border-slate-800"></div>
                                        </div>
                                        <div className="relative flex justify-center">
                                            <span className="bg-[#050b14] px-2 text-slate-600"><Plus size={16} /></span>
                                        </div>
                                    </div>
                                )}

                                {/* SECTION 2: AVAILABLE METHODS */}
                                {status && (!status.hasPasskey || !status.hasTotp || !status.hasPhone) && (
                                    <div className="space-y-4">
                                        <h3 className="text-xs uppercase tracking-widest text-slate-500 font-semibold mb-2">
                                            {!status.hasPasskey && !status.hasTotp ? "Add Security Method" : "Add Another Method"}
                                        </h3>
                                        <div className="grid md:grid-cols-2 gap-4">
                                            {!status.hasPasskey && (
                                                <button
                                                    onClick={startPasskeySetup}
                                                    disabled={loading}
                                                    className="flex flex-col items-center p-6 bg-blue-900/10 border border-blue-500/30 rounded-xl hover:border-blue-400 hover:bg-blue-900/20 transition-all text-center disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    <div className="p-4 bg-blue-500/20 rounded-full text-blue-400 mb-3">
                                                        <Fingerprint size={32} />
                                                    </div>
                                                    <h4 className="font-semibold text-white mb-1">Passkey</h4>
                                                    <p className="text-xs text-blue-400">Biometric authentication</p>
                                                    <p className="text-[10px] text-slate-500 mt-2">(FaceID, TouchID, Windows Hello)</p>
                                                </button>
                                            )}

                                            {!status.hasTotp && (
                                                <button
                                                    onClick={startTotpSetup}
                                                    disabled={loading}
                                                    className="flex flex-col items-center p-6 bg-slate-800/20 border border-slate-700/50 rounded-xl hover:border-slate-500 hover:bg-slate-800/40 transition-all text-center disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    <div className="p-4 bg-slate-700/50 rounded-full text-slate-400 mb-3">
                                                        <Smartphone size={32} />
                                                    </div>
                                                    <h4 className="font-semibold text-slate-200 mb-1">Authenticator App</h4>
                                                    <p className="text-xs text-slate-500">Time-based codes</p>
                                                    <p className="text-[10px] text-slate-500 mt-2">(Google Authenticator, Authy)</p>
                                                </button>
                                            )}

                                            {!status.hasPhone && (
                                                <button
                                                    onClick={startEmailSetup}
                                                    disabled={loading}
                                                    className="flex flex-col items-center p-6 bg-slate-800/20 border border-slate-700/50 rounded-xl hover:border-slate-500 hover:bg-slate-800/40 transition-all text-center disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    <div className="p-4 bg-slate-700/50 rounded-full text-slate-400 mb-3">
                                                        <Mail size={32} />
                                                    </div>
                                                    <h4 className="font-semibold text-slate-200 mb-1">Email Verification</h4>
                                                    <p className="text-xs text-slate-500">One-time codes</p>
                                                    <p className="text-[10px] text-slate-500 mt-2">(Confirms ownership of email)</p>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {status && (status.hasPasskey || status.hasTotp || status.hasPhone) && (
                                    <div className="text-center py-6 space-y-4">
                                        <div className="inline-flex items-center gap-2 p-3 bg-emerald-900/10 border border-emerald-500/20 rounded-full">
                                            <CheckCircle className="text-emerald-500" size={16} />
                                            <p className="text-sm text-emerald-400">Security methods configured</p>
                                        </div>
                                        <div className="flex flex-col gap-3">
                                            <button
                                                onClick={() => router.push('/security/verify')}
                                                className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition-all shadow-lg shadow-blue-900/20"
                                            >
                                                Proceed to Verification
                                            </button>
                                        </div>
                                        <p className="text-xs text-slate-500 mt-2">
                                            Verify now or continue to your dashboard
                                        </p>
                                    </div>
                                )}

                                {(!status || (!status.hasPasskey && !status.hasTotp && !status.hasPhone)) && loading === false && status !== null && (
                                    <div className="mt-4 p-4 bg-amber-900/10 border border-amber-500/10 rounded-xl flex items-center gap-3">
                                        <AlertCircle className="text-amber-500 shrink-0" size={20} />
                                        <p className="text-sm text-amber-500">You must set up at least one security method to continue.</p>
                                    </div>
                                )}
                            </>
                        ) : step === "setup" ? (
                            // TOTP QR VIEW
                            <div className="animate-in slide-in-from-right-8 fade-in h-full flex flex-col items-center">
                                <h3 className="text-xl font-bold text-white mb-6">Setup Authenticator App</h3>

                                <div className="p-4 bg-white rounded-2xl shadow-xl mb-6">
                                    <Image src={qrCode || ''} alt="QR Code" width={180} height={180} className="rounded-lg" unoptimized />
                                </div>

                                <div className="w-full max-w-xs mb-8">
                                    <p className="text-sm text-slate-400 mb-2 text-center">Can't scan? Enter this code manually:</p>
                                    <div className="flex items-center gap-2 p-3 bg-slate-950 rounded-lg border border-slate-800">
                                        <code className="flex-1 text-center font-mono text-sm text-slate-300 tracking-wider overflow-hidden text-ellipsis">
                                            {secret}
                                        </code>
                                        <button
                                            onClick={() => navigator.clipboard.writeText(secret || "")}
                                            className="p-2 hover:bg-slate-800 rounded-md text-slate-500 hover:text-white transition-colors"
                                        >
                                            <Copy size={14} />
                                        </button>
                                    </div>
                                </div>

                                <div className="w-full max-w-xs space-y-4">
                                    <div className="space-y-2">
                                        <label className="block text-xs font-medium text-slate-400">Enter the 6-digit code from your app:</label>
                                        <input
                                            type="text"
                                            value={totpCode}
                                            onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                            className="w-full bg-slate-900/50 border border-slate-700 text-center text-2xl tracking-[0.5em] text-white p-4 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder-slate-700 font-mono"
                                            placeholder="000000"
                                            autoFocus
                                        />
                                    </div>

                                    <button
                                        onClick={verifyTotp}
                                        disabled={loading || totpCode.length !== 6}
                                        className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-blue-900/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {loading ? <Loader2 className="animate-spin" /> : "Verify & Enable"}
                                    </button>

                                    <button
                                        onClick={() => { setStep('selection'); }}
                                        className="w-full py-2 text-sm text-slate-500 hover:text-slate-300"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        ) : step === "email_verify" ? (
                            // EMAIL OTP VIEW
                            <div className="animate-in slide-in-from-right-8 fade-in h-full flex flex-col items-center">
                                <h3 className="text-xl font-bold text-white mb-6">Verify Email Code</h3>

                                <div className="p-4 bg-slate-800/50 rounded-full mb-6 text-slate-400">
                                    <Mail size={48} />
                                </div>

                                <div className="w-full max-w-xs space-y-4">
                                    <div className="space-y-2">
                                        <label className="block text-xs font-medium text-slate-400 text-center">Enter the 6-digit code sent to your email:</label>
                                        <input
                                            type="text"
                                            value={emailOtp}
                                            onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                            className="w-full bg-slate-900/50 border border-slate-700 text-center text-2xl tracking-[0.5em] text-white p-4 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder-slate-700 font-mono"
                                            placeholder="000000"
                                            autoFocus
                                        />
                                    </div>

                                    {loading && (
                                        <div className="w-full py-4 flex items-center justify-center gap-2 text-blue-500">
                                            <Loader2 className="animate-spin" /> Verifying...
                                        </div>
                                    )}

                                    <button
                                        onClick={() => { setStep('selection'); }}
                                        className="w-full py-2 text-sm text-slate-500 hover:text-slate-300"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        ) : null}
                    </div>
                </div>

                <div className="mt-8 text-center opacity-60 hover:opacity-100 transition-opacity">
                    <div className="flex items-center justify-center gap-6 text-[10px] tracking-widest font-mono text-slate-600 uppercase">
                        <span className="flex items-center gap-2"><Database size={10} /> Encrypted Vault</span>
                        <span className="flex items-center gap-2"><Lock size={10} /> Zero Knowledge</span>
                    </div>
                </div>
            </div>
        </div>
    );
}