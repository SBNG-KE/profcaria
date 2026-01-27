"use client"

/**
 * HangingSecurityCard.tsx
 * 
 * UNIFIED Security Setup + Verify in the Hanging Card.
 * 
 * CRITICAL: ALL LOGIC IS PRESERVED EXACTLY FROM:
 * - app/security/setup/page.tsx
 * - app/security/verify/page.tsx
 * 
 * Only the UI wrapper has been changed to match the Hanging Card style.
 */

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
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
    Trash2,
    Mail,
    ArrowRight,
    ArrowLeft,
    HelpCircle,
    CheckCircle2,
    X
} from 'lucide-react';
import { startRegistration, startAuthentication } from '@simplewebauthn/browser';
import { useTheme } from '../context/ThemeContext';

type SecurityStatus = {
    hasPasskey: boolean;
    hasTotp: boolean;
    hasEmail: boolean;
    is2faEnabled: boolean;
    defaultMethod?: 'passkey' | 'totp' | 'email' | null;
};

interface HangingSecurityCardProps {
    isOpen: boolean;
    onClose: () => void;
    initialMode?: 'setup' | 'verify';
}

export default function HangingSecurityCard({ isOpen, onClose, initialMode = 'setup' }: HangingSecurityCardProps) {
    const router = useRouter();
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const autoStarted = useRef(false);

    // === UNIFIED STATE ===
    const [loading, setLoading] = useState(true);
    const [verifying, setVerifying] = useState(false);
    const [status, setStatus] = useState<SecurityStatus | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Mode: 'setup' or 'verify'
    const [mode, setMode] = useState<'setup' | 'verify'>(initialMode);

    // Setup steps
    const [setupStep, setSetupStep] = useState<'selection' | 'totp_qr' | 'email_verify'>('selection');

    // Verify steps
    const [verifyStep, setVerifyStep] = useState<'selection' | 'method'>('selection');
    const [selectedMethod, setSelectedMethod] = useState<'passkey' | 'totp' | 'email' | null>(null);

    // TOTP State
    const [qrCode, setQrCode] = useState<string | null>(null);
    const [secret, setSecret] = useState<string | null>(null);
    const [totpCode, setTotpCode] = useState('');

    // Email OTP State (used in both setup email_verify and verify email)
    const [emailOtp, setEmailOtp] = useState('');
    const [phoneCode, setPhoneCode] = useState('');

    // =============================================
    // FETCH STATUS (UNCHANGED FROM ORIGINAL)
    // =============================================
    const fetchStatus = async () => {
        try {
            const res = await fetch('/api/auth/me', { cache: 'no-store' });
            const data = await res.json();
            if (data.security) {
                setStatus(data.security);

                // Determine initial mode based on status
                const hasMethod = data.security.hasPasskey || data.security.hasTotp || data.security.hasEmail;
                if (!hasMethod) {
                    setMode('setup');
                } else if (initialMode === 'verify') {
                    setMode('verify');
                    // Auto-select default method if available
                    if (data.security.defaultMethod && ['passkey', 'totp', 'email'].includes(data.security.defaultMethod)) {
                        setSelectedMethod(data.security.defaultMethod as any);
                        setVerifyStep('method');

                        // Removed auto-start passkey timeout to prevent ghost redirects

                        if (data.security.defaultMethod === 'email') {
                            fetch('/api/security/otp/setup', { method: 'POST' }).catch(console.error);
                        }
                    }
                }
            }
        } catch (err) {
            console.error(err);
            setError('Failed to load security status');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchStatus();
        }
    }, [isOpen]);

    // Auto-verify email OTP when 6 digits entered (SETUP mode)
    useEffect(() => {
        if (emailOtp.length === 6 && !loading && setupStep === 'email_verify') {
            verifyEmailOtpSetup();
        }
    }, [emailOtp]);

    // Auto-verify email OTP when 6 digits entered (VERIFY mode)
    useEffect(() => {
        if (phoneCode.length === 6 && selectedMethod === 'email' && !verifying) {
            verifyOtpMethod();
        }
    }, [phoneCode]);

    // =============================================
    // SETUP HANDLERS (UNCHANGED FROM setup/page.tsx)
    // =============================================
    const handleSetupSuccess = async () => {
        await fetchStatus();
        setSetupStep('selection');
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
            setSetupStep('totp_qr');
        } catch (err: any) {
            setError(err.message || 'Failed to start setup');
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
                    throw new Error('Passkey setup cancelled or timed out.');
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
                await handleSetupSuccess();
            } else {
                throw new Error(verificationJSON.error || 'Verification failed');
            }
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Passkey setup failed');
        } finally {
            setLoading(false);
        }
    };

    const verifyTotpSetup = async () => {
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
            await handleSetupSuccess();
        } catch (err: any) {
            setError(err.message || 'Invalid code');
        } finally {
            setLoading(false);
        }
    };

    const startEmailSetup = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/security/otp/setup', { method: 'POST' });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setSetupStep('email_verify');
        } catch (err: any) {
            setError(err.message || 'Failed to send email code');
        } finally {
            setLoading(false);
        }
    };

    const verifyEmailOtpSetup = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/security/otp/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: emailOtp, type: 'email' })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setSetupStep('selection');
            fetchStatus();
        } catch (err: any) {
            setError(err.message || 'Invalid code');
        } finally {
            setLoading(false);
        }
    };

    const removeMethod = async (methodType: 'passkey' | 'totp' | 'email') => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/security/${methodType}/remove`, { method: 'POST' });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            await fetchStatus();
        } catch (err: any) {
            setError(err.message || 'Failed to remove method');
        } finally {
            setLoading(false);
        }
    };

    // =============================================
    // VERIFY HANDLERS (UNCHANGED FROM verify/page.tsx)
    // =============================================
    const handleSetDefault = async (newDefault: boolean) => {
        if (!status) return;
        const methodToSet = newDefault ? selectedMethod : null;
        setStatus({ ...status, defaultMethod: methodToSet });
        try {
            await fetch('/api/security/default-method', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ method: methodToSet })
            });
        } catch (e) {
            console.error('Failed to set default', e);
        }
    };

    const verifyTotpMethod = async () => {
        setVerifying(true);
        setError(null);
        try {
            const res = await fetch('/api/security/totp/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: totpCode })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            // Check for password reset flow
            if (typeof window !== 'undefined') {
                const resetEmail = localStorage.getItem('reset_password_email');
                if (resetEmail) {
                    window.location.href = '/?resetPassword=true';
                    return;
                }
            }

            router.refresh();
            router.push(data.redirect || '/');
        } catch (err: any) {
            setError(err.message || 'Invalid code');
        } finally {
            setVerifying(false);
        }
    };

    const startPasskeyAuth = async () => {
        setVerifying(true);
        setError(null);
        try {
            const resp = await fetch('/api/security/passkey/authentication/options', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({})
            });
            const opts = await resp.json();
            if (!resp.ok) throw new Error(opts.error || 'Failed to get authentication options');

            let assertion;
            try {
                assertion = await startAuthentication({ optionsJSON: opts });
            } catch (e: any) {
                if (e.name === 'NotAllowedError') {
                    throw new Error('Passkey request was cancelled.');
                }
                throw e;
            }

            const verificationResp = await fetch('/api/security/passkey/authentication/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(assertion),
            });

            const verificationJSON = await verificationResp.json();
            if (!verificationResp.ok || !verificationJSON.verified) {
                throw new Error(verificationJSON.error || 'Passkey verification failed');
            }

            // Check for password reset flow
            if (typeof window !== 'undefined') {
                const resetEmail = localStorage.getItem('reset_password_email');
                if (resetEmail) {
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

    const verifyOtpMethod = async () => {
        setVerifying(true);
        setError(null);
        try {
            const res = await fetch('/api/security/otp/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: phoneCode, type: selectedMethod })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            // Check for password reset flow
            if (typeof window !== 'undefined') {
                const resetEmail = localStorage.getItem('reset_password_email');
                if (resetEmail) {
                    window.location.href = '/?resetPassword=true';
                    return;
                }
            }

            router.refresh();
            router.push(data.redirect || '/');
        } catch (err: any) {
            setError(err.message || 'Invalid code');
            setVerifying(false);
        }
    };

    const handleMethodSelect = (method: 'passkey' | 'totp' | 'email') => {
        setError(null);
        setSelectedMethod(method);
        setVerifyStep('method');
        if (method === 'passkey') {
            setTimeout(startPasskeyAuth, 100);
        } else if (method === 'email') {
            fetch('/api/security/otp/setup', { method: 'POST' }).catch(console.error);
        }
    };

    if (!isOpen) return null;

    // =============================================
    // RENDER
    // =============================================
    return (
        <div className="fixed inset-0 z-[100] flex justify-center items-start pt-24 pointer-events-none">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-auto" onClick={onClose} />

            {/* HANGING CARD */}
            <div
                className={`
                    relative pointer-events-auto mt-8 
                    w-[95vw] md:w-[90vw] max-w-[550px]
                    mx-auto lg:mx-0 lg:mr-[calc(4rem-250px)]
                    rounded-[2rem] p-6 md:p-8 shadow-2xl overflow-hidden overflow-y-auto max-h-[80vh]
                    transform transition-all duration-500 origin-top
                    ${isDark ? 'bg-black border border-neutral-800' : 'bg-white border text-black'}
                `}
                style={{
                    boxShadow: isDark ? '0 20px 60px -10px rgba(0,0,0,0.8)' : '0 20px 60px -10px rgba(0,0,0,0.2)',
                    animation: 'swing 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards'
                }}
            >
                {/* CLOSE BUTTON */}
                <button
                    onClick={onClose}
                    className={`absolute top-8 right-8 z-50 p-2 rounded-full transition-colors ${isDark ? 'hover:bg-neutral-900 text-neutral-500 hover:text-white' : 'hover:bg-neutral-100 text-neutral-400 hover:text-black'}`}
                >
                    <X size={20} />
                </button>

                {/* Loading State */}
                {loading && (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className={`animate-spin ${isDark ? 'text-white' : 'text-black'}`} size={32} />
                    </div>
                )}

                {/* Content */}
                {!loading && (
                    <div className="space-y-6">
                        {/* Header with Mode Tabs */}
                        <div className="text-center space-y-4">
                            <div className={`inline-flex items-center justify-center p-3 rounded-full ${isDark ? 'bg-neutral-900' : 'bg-neutral-100'}`}>
                                <ShieldCheck size={28} className={isDark ? 'text-white' : 'text-black'} />
                            </div>
                            <h2 className="text-2xl font-black tracking-tight">
                                {mode === 'setup' ? 'Secure Your Account' : 'Verify Identity'}
                            </h2>
                            <p className={`text-sm ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>
                                {mode === 'setup' ? 'Configure 2-factor authentication' : 'Confirm your identity to continue'}
                            </p>

                            {/* Mode Toggle */}
                            {status && (status.hasPasskey || status.hasTotp || status.hasEmail) && (
                                <div className="flex p-1 rounded-full bg-neutral-100/10 border border-neutral-500/20 max-w-xs mx-auto">
                                    {(['setup', 'verify'] as const).map((m) => (
                                        <button
                                            key={m}
                                            onClick={() => { setMode(m); setSetupStep('selection'); setVerifyStep('selection'); setError(null); }}
                                            className={`
                                                flex-1 py-2 px-4 rounded-full text-xs font-bold uppercase tracking-widest transition-all
                                                ${mode === m
                                                    ? (isDark ? 'bg-white text-black' : 'bg-black text-white')
                                                    : 'opacity-50 hover:opacity-100'}
                                            `}
                                        >
                                            {m}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Error */}
                        {error && (
                            <div className={`p-3 rounded-xl text-sm flex items-center gap-2 ${isDark ? 'bg-red-900/20 border border-red-500/20 text-red-400' : 'bg-red-100 text-red-600'}`}>
                                <AlertCircle size={16} /> {error}
                            </div>
                        )}

                        {/* ============ SETUP MODE ============ */}
                        {mode === 'setup' && setupStep === 'selection' && (
                            <div className="space-y-4">
                                {/* Active Methods */}
                                {status && (status.hasPasskey || status.hasTotp || status.hasEmail) && (
                                    <div className="space-y-3">
                                        <h3 className={`text-xs uppercase tracking-widest font-semibold ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>Active Methods</h3>
                                        {status.hasPasskey && (
                                            <div className={`flex items-center justify-between p-4 rounded-xl ${isDark ? 'bg-neutral-900 border border-neutral-800' : 'bg-neutral-100'}`}>
                                                <div className="flex items-center gap-3">
                                                    <Fingerprint size={20} />
                                                    <span className="font-medium">Passkey</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs text-green-500">Active</span>
                                                    <button onClick={() => removeMethod('passkey')} className="p-1 text-red-400 hover:bg-red-900/20 rounded"><Trash2 size={14} /></button>
                                                </div>
                                            </div>
                                        )}
                                        {status.hasTotp && (
                                            <div className={`flex items-center justify-between p-4 rounded-xl ${isDark ? 'bg-neutral-900 border border-neutral-800' : 'bg-neutral-100'}`}>
                                                <div className="flex items-center gap-3">
                                                    <Smartphone size={20} />
                                                    <span className="font-medium">Authenticator</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs text-green-500">Active</span>
                                                    <button onClick={() => removeMethod('totp')} className="p-1 text-red-400 hover:bg-red-900/20 rounded"><Trash2 size={14} /></button>
                                                </div>
                                            </div>
                                        )}
                                        {status.hasEmail && (
                                            <div className={`flex items-center justify-between p-4 rounded-xl ${isDark ? 'bg-neutral-900 border border-neutral-800' : 'bg-neutral-100'}`}>
                                                <div className="flex items-center gap-3">
                                                    <Mail size={20} />
                                                    <span className="font-medium">Email</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs text-green-500">Active</span>
                                                    <button onClick={() => removeMethod('email')} className="p-1 text-red-400 hover:bg-red-900/20 rounded"><Trash2 size={14} /></button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Add Methods */}
                                {status && (!status.hasPasskey || !status.hasTotp || !status.hasEmail) && (
                                    <div className="space-y-3">
                                        <h3 className={`text-xs uppercase tracking-widest font-semibold ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>Add Method</h3>
                                        <div className="grid grid-cols-1 gap-3">
                                            {!status.hasPasskey && (
                                                <button
                                                    onClick={startPasskeySetup}
                                                    disabled={loading}
                                                    className={`flex items-center gap-4 p-4 rounded-xl transition-all ${isDark ? 'bg-neutral-900 border border-neutral-800 hover:border-neutral-700' : 'bg-neutral-100 hover:bg-neutral-200'} disabled:opacity-50`}
                                                >
                                                    <Fingerprint size={24} />
                                                    <div className="text-left">
                                                        <div className="font-semibold">Passkey</div>
                                                        <div className={`text-xs ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>FaceID, TouchID, Windows Hello</div>
                                                    </div>
                                                </button>
                                            )}
                                            {!status.hasTotp && (
                                                <button
                                                    onClick={startTotpSetup}
                                                    disabled={loading}
                                                    className={`flex items-center gap-4 p-4 rounded-xl transition-all ${isDark ? 'bg-neutral-900 border border-neutral-800 hover:border-neutral-700' : 'bg-neutral-100 hover:bg-neutral-200'} disabled:opacity-50`}
                                                >
                                                    <Smartphone size={24} />
                                                    <div className="text-left">
                                                        <div className="font-semibold">Authenticator App</div>
                                                        <div className={`text-xs ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>Google Authenticator, Authy</div>
                                                    </div>
                                                </button>
                                            )}
                                            {!status.hasEmail && (
                                                <button
                                                    onClick={startEmailSetup}
                                                    disabled={loading}
                                                    className={`flex items-center gap-4 p-4 rounded-xl transition-all ${isDark ? 'bg-neutral-900 border border-neutral-800 hover:border-neutral-700' : 'bg-neutral-100 hover:bg-neutral-200'} disabled:opacity-50`}
                                                >
                                                    <Mail size={24} />
                                                    <div className="text-left">
                                                        <div className="font-semibold">Email Verification</div>
                                                        <div className={`text-xs ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>One-time codes via email</div>
                                                    </div>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Proceed to Verify */}
                                {status && (status.hasPasskey || status.hasTotp || status.hasEmail) && (
                                    <button
                                        onClick={() => setMode('verify')}
                                        className={`w-full py-4 rounded-xl font-bold uppercase tracking-widest text-sm transition-all ${isDark ? 'bg-white text-black hover:bg-neutral-200' : 'bg-black text-white hover:bg-neutral-800'}`}
                                    >
                                        Proceed to Verify
                                    </button>
                                )}
                            </div>
                        )}

                        {/* TOTP QR Setup */}
                        {mode === 'setup' && setupStep === 'totp_qr' && (
                            <div className="space-y-6 text-center">
                                <div className={`p-4 rounded-2xl inline-block ${isDark ? 'bg-white' : 'bg-neutral-100'}`}>
                                    {qrCode && <Image src={qrCode} alt="QR Code" width={180} height={180} unoptimized />}
                                </div>
                                <div className={`p-3 rounded-lg text-xs font-mono ${isDark ? 'bg-neutral-900' : 'bg-neutral-100'}`}>
                                    {secret}
                                    <button onClick={() => navigator.clipboard.writeText(secret || '')} className="ml-2"><Copy size={12} /></button>
                                </div>
                                <input
                                    type="text"
                                    value={totpCode}
                                    onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    className={`w-full text-center text-xl md:text-2xl tracking-[0.2em] md:tracking-[0.5em] p-4 rounded-xl border outline-none ${isDark ? 'bg-neutral-900 border-neutral-800 text-white' : 'bg-neutral-100 border-neutral-200'}`}
                                    placeholder="000000"
                                    autoFocus
                                />
                                <button
                                    onClick={verifyTotpSetup}
                                    disabled={totpCode.length !== 6 || loading}
                                    className={`w-full py-4 rounded-xl font-bold uppercase tracking-widest text-sm transition-all ${isDark ? 'bg-white text-black' : 'bg-black text-white'} disabled:opacity-50`}
                                >
                                    {loading ? 'Verifying...' : 'Verify & Enable'}
                                </button>
                                <button onClick={() => setSetupStep('selection')} className={`text-sm ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>Cancel</button>
                            </div>
                        )}

                        {/* Email Verify Setup */}
                        {mode === 'setup' && setupStep === 'email_verify' && (
                            <div className="space-y-6 text-center">
                                <Mail size={48} className={isDark ? 'text-neutral-500 mx-auto' : 'text-neutral-400 mx-auto'} />
                                <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>Enter the 6-digit code sent to your email</p>
                                <input
                                    type="text"
                                    value={emailOtp}
                                    onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    className={`w-full text-center text-xl md:text-2xl tracking-[0.2em] md:tracking-[0.5em] p-4 rounded-xl border outline-none ${isDark ? 'bg-neutral-900 border-neutral-800 text-white' : 'bg-neutral-100 border-neutral-200'}`}
                                    placeholder="000000"
                                    autoFocus
                                />
                                {loading && <Loader2 className="animate-spin mx-auto" />}
                                <button onClick={() => setSetupStep('selection')} className={`text-sm ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>Cancel</button>
                            </div>
                        )}

                        {/* ============ VERIFY MODE ============ */}
                        {mode === 'verify' && verifyStep === 'selection' && (
                            <div className="space-y-4">
                                <p className={`text-center text-sm ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>Choose a verification method:</p>
                                {status?.hasPasskey && (
                                    <button
                                        onClick={() => handleMethodSelect('passkey')}
                                        className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all ${isDark ? 'bg-neutral-900 border border-neutral-800 hover:border-neutral-700' : 'bg-neutral-100 hover:bg-neutral-200'}`}
                                    >
                                        <Fingerprint size={24} />
                                        <div className="text-left flex-1">
                                            <div className="font-semibold">Passkey</div>
                                            <div className={`text-xs ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>Fastest</div>
                                        </div>
                                        <ArrowRight size={18} className="opacity-50" />
                                    </button>
                                )}
                                {status?.hasTotp && (
                                    <button
                                        onClick={() => handleMethodSelect('totp')}
                                        className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all ${isDark ? 'bg-neutral-900 border border-neutral-800 hover:border-neutral-700' : 'bg-neutral-100 hover:bg-neutral-200'}`}
                                    >
                                        <Smartphone size={24} />
                                        <div className="text-left flex-1">
                                            <div className="font-semibold">Authenticator</div>
                                            <div className={`text-xs ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>6-digit code</div>
                                        </div>
                                        <ArrowRight size={18} className="opacity-50" />
                                    </button>
                                )}
                                {status?.hasEmail && (
                                    <button
                                        onClick={() => handleMethodSelect('email')}
                                        className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all ${isDark ? 'bg-neutral-900 border border-neutral-800 hover:border-neutral-700' : 'bg-neutral-100 hover:bg-neutral-200'}`}
                                    >
                                        <Mail size={24} />
                                        <div className="text-left flex-1">
                                            <div className="font-semibold">Email</div>
                                            <div className={`text-xs ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>Code via email</div>
                                        </div>
                                        <ArrowRight size={18} className="opacity-50" />
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Passkey Verify */}
                        {mode === 'verify' && verifyStep === 'method' && selectedMethod === 'passkey' && (
                            <div className="text-center space-y-6">
                                <div className={`p-6 rounded-full inline-block ${isDark ? 'bg-neutral-900' : 'bg-neutral-100'}`}>
                                    {verifying ? <Loader2 className="animate-spin" size={48} /> : <Fingerprint size={48} />}
                                </div>
                                <div>
                                    <h3 className="font-semibold text-lg">Verifying with Passkey</h3>
                                    <p className={`text-sm ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>Check your browser prompt</p>
                                </div>
                                {!verifying && <button onClick={startPasskeyAuth} className="text-sm underline">Retry</button>}
                                <button onClick={() => { setError(null); setVerifyStep('selection'); }} className={`text-sm ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>Other method</button>
                            </div>
                        )}

                        {/* TOTP Verify */}
                        {mode === 'verify' && verifyStep === 'method' && selectedMethod === 'totp' && (
                            <div className="space-y-6">
                                <input
                                    type="text"
                                    value={totpCode}
                                    onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    className={`w-full text-center text-xl md:text-2xl tracking-[0.2em] md:tracking-[0.5em] p-4 rounded-xl border outline-none ${isDark ? 'bg-neutral-900 border-neutral-800 text-white' : 'bg-neutral-100 border-neutral-200'}`}
                                    placeholder="000000"
                                    autoFocus
                                />
                                <button
                                    onClick={verifyTotpMethod}
                                    disabled={totpCode.length !== 6 || verifying}
                                    className={`w-full py-4 rounded-xl font-bold uppercase tracking-widest text-sm transition-all ${isDark ? 'bg-white text-black' : 'bg-black text-white'} disabled:opacity-50`}
                                >
                                    {verifying ? 'Verifying...' : 'Verify'}
                                </button>
                                <button onClick={() => { setError(null); setVerifyStep('selection'); }} className={`w-full text-center text-sm ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>Other method</button>
                            </div>
                        )}

                        {/* Email Verify */}
                        {mode === 'verify' && verifyStep === 'method' && selectedMethod === 'email' && (
                            <div className="space-y-6 text-center">
                                <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>Enter the code sent to your email</p>
                                <input
                                    type="text"
                                    value={phoneCode}
                                    onChange={(e) => setPhoneCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    className={`w-full text-center text-xl md:text-2xl tracking-[0.2em] md:tracking-[0.5em] p-4 rounded-xl border outline-none ${isDark ? 'bg-neutral-900 border-neutral-800 text-white' : 'bg-neutral-100 border-neutral-200'}`}
                                    placeholder="000000"
                                    autoFocus
                                />
                                {verifying && <Loader2 className="animate-spin mx-auto" />}
                                <button onClick={() => { setError(null); setVerifyStep('selection'); }} className={`text-sm ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>Other method</button>
                            </div>
                        )}

                    </div>
                )}
            </div>
        </div>
    );
}
