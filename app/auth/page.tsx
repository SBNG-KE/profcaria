"use client"

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import {
    User,
    Briefcase,
    ArrowRight,
    Lock,
    Mail,
    Upload,
    Phone,
    FileText,
    X,
    Shield,
    AlertCircle,
    CheckCircle,
    Eye,
    EyeOff
} from 'lucide-react';

// 1. The Pillar Component
const Pillar = ({ className }: { className?: string }) => (
    <div className={`relative h-full w-24 flex-shrink-0 flex flex-col items-center justify-end ${className}`}>
        <div className="w-32 h-12 bg-gradient-to-b from-slate-600 to-slate-800 rounded-t-sm shadow-2xl mb-1 border-b border-black/50 z-10" />
        <div className="flex-grow w-24 bg-[#1e293b] shadow-2xl relative overflow-hidden flex justify-center border-x border-slate-900">
            <div className="w-full h-full flex justify-between px-2 opacity-50">
                <div className="w-2 h-full bg-gradient-to-r from-black/60 to-transparent"></div>
                <div className="w-2 h-full bg-gradient-to-r from-black/60 to-transparent"></div>
                <div className="w-2 h-full bg-gradient-to-r from-black/60 to-transparent"></div>
                <div className="w-2 h-full bg-gradient-to-r from-black/60 to-transparent"></div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-black/60 pointer-events-none"></div>
        </div>
        <div className="w-36 h-14 bg-gradient-to-t from-slate-800 to-slate-700 rounded-sm shadow-xl mt-1 border-t border-slate-600/50 z-10" />
    </div>
);

// 2. Input Component with show/hide password
const ModernInput = ({
    type = "text",
    placeholder,
    icon: Icon,
    value,
    onChange,
    onFocus,
    className,
    showPasswordToggle = false,
    passwordVisible = false,
    onTogglePassword
}: {
    type?: string;
    placeholder: string;
    icon?: React.ElementType;
    value?: string;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onFocus?: () => void;
    className?: string;
    showPasswordToggle?: boolean;
    passwordVisible?: boolean;
    onTogglePassword?: () => void;
}) => (
    <div className={`relative group ${className}`}>
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 group-focus-within:text-blue-400 transition-colors">
            {Icon && <Icon size={18} />}
        </div>
        <input
            type={showPasswordToggle ? (passwordVisible ? "text" : "password") : type}
            onFocus={onFocus}
            className={`w-full bg-slate-900/80 border border-slate-700 text-slate-200 text-sm rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent block pl-10 ${showPasswordToggle ? 'pr-10' : 'pr-4'} p-3.5 placeholder-slate-600 transition-all duration-300 backdrop-blur-md hover:bg-slate-800/80 shadow-inner`}
            placeholder={placeholder}
            value={value}
            onChange={onChange}
        />
        {showPasswordToggle && onTogglePassword && (
            <button
                type="button"
                onClick={onTogglePassword}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
            >
                {passwordVisible ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
        )}
    </div>
);

// 3. Animated Button Component with press effect
const AnimatedSubmitButton = ({
    onClick,
    disabled,
    loading,
    color = 'blue',
    icon: Icon = ArrowRight
}: {
    onClick: () => void;
    disabled: boolean;
    loading: boolean;
    color?: 'blue' | 'emerald';
    icon?: React.ElementType;
}) => {
    const [isPressed, setIsPressed] = useState(false);

    const handleClick = () => {
        if (disabled || loading) return;

        // Press animation
        setIsPressed(true);
        setTimeout(() => setIsPressed(false), 200);

        // Trigger the actual click
        onClick();
    };

    const baseClass = color === 'blue'
        ? 'bg-gradient-to-r from-blue-700 to-blue-600 hover:from-blue-600 hover:to-blue-500'
        : 'bg-gradient-to-r from-emerald-800 to-emerald-700 hover:from-emerald-700 hover:to-emerald-600';

    return (
        <button
            disabled={disabled || loading}
            onClick={handleClick}
            className={`
        relative p-5 rounded-full shadow-xl transition-all duration-200
        ${baseClass}
        ${isPressed ? 'scale-90 shadow-inner' : 'scale-100 hover:scale-105'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        active:scale-90
      `}
        >
            <div className="relative">
                <div className={`absolute inset-0 rounded-full bg-white opacity-0 ${isPressed ? 'animate-ping opacity-20' : ''}`}></div>
                <Icon size={28} className="text-white relative z-10" />
            </div>
            {loading && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white"></div>
                </div>
            )}
        </button>
    );
};

// 4. Forgot Password Modal Component
const ForgotPasswordModal = ({
    isOpen,
    onClose,
    userType,
    email,
    onEmailChange,
    onReset,
    loading,
    error,
    success,
    requires2FA
}: {
    isOpen: boolean;
    onClose: () => void;
    userType: 'professional' | 'employer';
    email: string;
    onEmailChange: (email: string) => void;
    onReset: (email: string, newPassword: string) => void;
    loading: boolean;
    error: string | null;
    success: boolean;
    requires2FA: boolean;
}) => {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordVisible, setPasswordVisible] = useState(false);
    const [step, setStep] = useState<'email' | 'verify' | 'reset'>('email');
    const [verificationComplete, setVerificationComplete] = useState(false);

    // Store email in localStorage so security/verify page can read it
    const storeResetEmail = (email: string) => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('reset_password_email', email);
            localStorage.setItem('reset_password_userType', userType);
            localStorage.setItem('reset_password_timestamp', Date.now().toString());
        }
    };

    // Check if user is returning from 2FA verification
    useEffect(() => {
        if (isOpen && typeof window !== 'undefined') {
            const email = localStorage.getItem('reset_password_email');
            const userType = localStorage.getItem('reset_password_userType');
            const timestamp = localStorage.getItem('reset_password_timestamp');

            // Check if returning within 15 minutes
            if (email && userType && timestamp) {
                const timeDiff = Date.now() - parseInt(timestamp);
                if (timeDiff < 15 * 60 * 1000) { // 15 minutes
                    setVerificationComplete(true);
                    onEmailChange(email);
                    setStep('reset');
                    // Clear storage after reading
                    localStorage.removeItem('reset_password_email');
                    localStorage.removeItem('reset_password_userType');
                    localStorage.removeItem('reset_password_timestamp');
                }
            }
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleReset = () => {
        if (newPassword !== confirmPassword) {
            alert("Passwords don't match!");
            return;
        }
        onReset(email, newPassword);
    };

    const handle2FARedirect = () => {
        // Store email before redirecting
        storeResetEmail(email);
        window.location.href = '/security/verify';
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#0f172a] border border-slate-700 rounded-2xl w-full max-w-md p-6 animate-in zoom-in-95">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-white">Reset Password</h3>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        <X size={20} className="text-slate-400" />
                    </button>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-900/20 border border-red-500/20 text-red-400 rounded-lg text-sm flex items-center gap-2">
                        <AlertCircle size={16} /> {error}
                    </div>
                )}

                {success ? (
                    <div className="text-center py-8">
                        <div className="inline-flex items-center justify-center p-3 bg-emerald-900/20 rounded-full text-emerald-400 mb-4">
                            <CheckCircle size={32} />
                        </div>
                        <h4 className="text-lg font-semibold text-white mb-2">Password Reset Successful!</h4>
                        <p className="text-slate-400 text-sm">You can now log in with your new password.</p>
                        <button
                            onClick={onClose}
                            className="mt-6 px-6 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white font-medium transition-colors"
                        >
                            Close
                        </button>
                    </div>
                ) : verificationComplete ? (
                    <div className="space-y-4">
                        <div className="mb-4 p-3 bg-emerald-900/20 border border-emerald-500/20 text-emerald-400 rounded-lg text-sm flex items-center gap-2">
                            <CheckCircle size={16} /> 2FA Verification Complete
                        </div>
                        <p className="text-slate-400 text-sm">Now enter your new password.</p>
                        <ModernInput
                            type="password"
                            placeholder="New Password"
                            icon={Lock}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            showPasswordToggle
                            passwordVisible={passwordVisible}
                            onTogglePassword={() => setPasswordVisible(!passwordVisible)}
                        />
                        <ModernInput
                            type="password"
                            placeholder="Confirm New Password"
                            icon={Lock}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            showPasswordToggle
                            passwordVisible={passwordVisible}
                            onTogglePassword={() => setPasswordVisible(!passwordVisible)}
                        />
                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={handleReset}
                                disabled={loading || !newPassword || !confirmPassword}
                                className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white font-medium transition-colors"
                            >
                                {loading ? 'Resetting...' : 'Reset Password'}
                            </button>
                            <button
                                onClick={() => setStep('email')}
                                className="px-4 py-3 border border-slate-700 hover:bg-slate-800 rounded-lg text-slate-400 transition-colors"
                            >
                                Back
                            </button>
                        </div>
                    </div>
                ) : requires2FA && step === 'email' ? (
                    <div className="text-center py-6">
                        <div className="inline-flex items-center justify-center p-3 bg-amber-900/20 rounded-full text-amber-400 mb-4">
                            <Shield size={32} />
                        </div>
                        <h4 className="text-lg font-semibold text-white mb-2">2-Step Verification Required</h4>
                        <p className="text-slate-400 text-sm mb-6">
                            You have two-factor authentication enabled. Please verify your identity first, then you'll be able to reset your password.
                        </p>
                        <div className="space-y-3">
                            <button
                                onClick={handle2FARedirect}
                                className="w-full py-3 bg-blue-600 hover:bg-blue-500 rounded-lg text-white font-medium transition-colors"
                            >
                                Go to 2FA Verification
                            </button>
                            <button
                                onClick={onClose}
                                className="w-full py-2 text-slate-400 hover:text-slate-300 text-sm"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                ) : step === 'email' ? (
                    <div className="space-y-4">
                        <p className="text-slate-400 text-sm">
                            Enter your {userType === 'professional' ? 'email' : 'work email'} to reset your password.
                        </p>
                        <ModernInput
                            type="email"
                            placeholder={userType === 'professional' ? "Email Address" : "Work Email"}
                            icon={Mail}
                            value={email}
                            onChange={(e) => onEmailChange(e.target.value)}
                        />
                        <button
                            onClick={() => setStep('reset')}
                            disabled={loading || !email}
                            className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white font-medium transition-colors"
                        >
                            {loading ? 'Checking...' : 'Continue'}
                        </button>
                    </div>
                ) : step === 'reset' ? (
                    <div className="space-y-4">
                        <p className="text-slate-400 text-sm">Enter your new password.</p>
                        <ModernInput
                            type="password"
                            placeholder="New Password"
                            icon={Lock}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            showPasswordToggle
                            passwordVisible={passwordVisible}
                            onTogglePassword={() => setPasswordVisible(!passwordVisible)}
                        />
                        <ModernInput
                            type="password"
                            placeholder="Confirm New Password"
                            icon={Lock}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            showPasswordToggle
                            passwordVisible={passwordVisible}
                            onTogglePassword={() => setPasswordVisible(!passwordVisible)}
                        />
                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={handleReset}
                                disabled={loading || !newPassword || !confirmPassword}
                                className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white font-medium transition-colors"
                            >
                                {loading ? 'Resetting...' : 'Reset Password'}
                            </button>
                            <button
                                onClick={() => setStep('email')}
                                className="px-4 py-3 border border-slate-700 hover:bg-slate-800 rounded-lg text-slate-400 transition-colors"
                            >
                                Back
                            </button>
                        </div>
                    </div>
                ) : null}
            </div>
        </div>
    );
};

export default function ProfcariaAuth() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [globalMode, setGlobalMode] = useState<'login' | 'signup'>('login');
    const [activeSection, setActiveSection] = useState<'professional' | 'employer' | null>(null);
    const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
    const [forgotPasswordType, setForgotPasswordType] = useState<'professional' | 'employer'>('professional');
    const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
    const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
    const [forgotPasswordError, setForgotPasswordError] = useState<string | null>(null);
    const [forgotPasswordSuccess, setForgotPasswordSuccess] = useState(false);
    const [requires2FA, setRequires2FA] = useState(false);
    const [passwordVisible, setPasswordVisible] = useState(false);

    // Validation Helper
    const validatePassword = (password: string) => {
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumbers = /\d/.test(password);
        const hasNonalphas = /\W/.test(password);
        const minLength = password.length >= 12;
        return hasUpperCase && hasLowerCase && hasNumbers && hasNonalphas && minLength;
    };

    useEffect(() => {
        // Check if returning from 2FA verification for password reset
        if (typeof window !== 'undefined') {
            const urlParams = new URLSearchParams(window.location.search);
            const resetPassword = urlParams.get('resetPassword');

            if (resetPassword === 'true') {
                const resetEmail = localStorage.getItem('reset_password_email');
                const userType = localStorage.getItem('reset_password_userType');

                if (resetEmail && userType) {
                    setForgotPasswordEmail(resetEmail);
                    setForgotPasswordType(userType as 'professional' | 'employer');
                    setForgotPasswordOpen(true);

                    // Clear URL param
                    window.history.replaceState({}, '', '/auth');
                }
            }
        }
    }, []);

    // Professional State
    const [profFirstName, setProfFirstName] = useState('');
    const [profLastName, setProfLastName] = useState('');
    const [profEmail, setProfEmail] = useState('');
    const [profPassword, setProfPassword] = useState('');
    const [profRole, setProfRole] = useState('');

    // Employer State
    const [empCompanyName, setEmpCompanyName] = useState('');
    const [empWorkEmail, setEmpWorkEmail] = useState('');
    const [empPassword, setEmpPassword] = useState('');

    const getOpacity = (section: 'professional' | 'employer') => {
        if (activeSection === null) return 'opacity-100 grayscale-0';
        return activeSection === section ? 'opacity-100 grayscale-0 scale-[1.01]' : 'opacity-30 grayscale blur-[1px]';
    };

    const handleForgotPassword = async (type: 'professional' | 'employer') => {
        setForgotPasswordType(type);
        setForgotPasswordLoading(true);
        setForgotPasswordError(null);

        try {
            const emailToCheck = type === 'professional' ? profEmail : empWorkEmail;

            const checkRes = await fetch(`/api/${type}/check-email`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: emailToCheck }),
            });

            if (!checkRes.ok) {
                throw new Error('User not found');
            }

            const checkData = await checkRes.json();

            if (checkData.requires_2fa) {
                setRequires2FA(true);
            } else {
                setRequires2FA(false);
            }

            setForgotPasswordEmail(emailToCheck);
            setForgotPasswordOpen(true);
        } catch (err: any) {
            setForgotPasswordError(err.message || 'Failed to check account');
        } finally {
            setForgotPasswordLoading(false);
        }
    };

    const handlePasswordReset = async (email: string, newPassword: string) => {
        setForgotPasswordLoading(true);
        setForgotPasswordError(null);

        try {
            const res = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: email,
                    newPassword: newPassword,
                    userType: forgotPasswordType
                })
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || 'Failed to reset password');
            }

            setForgotPasswordSuccess(true);

            // Clear localStorage
            localStorage.removeItem('reset_password_email');
            localStorage.removeItem('reset_password_userType');
            localStorage.removeItem('reset_password_timestamp');

        } catch (err: any) {
            setForgotPasswordError(err.message || 'Failed to reset password');
        } finally {
            setForgotPasswordLoading(false);
        }
    };

    // URL Params for Redirects
    const searchParams = useSearchParams();
    const refToken = searchParams.get('ref');

    const getRedirectPath = (userType: 'professional' | 'employer') => {
        if (userType === 'professional' && refToken) {
            return `/professional/find?ref=${refToken}`;
        }
        return userType === 'professional' ? '/professional/home' : '/employer/home';
    };

    const handleLogin = async (type: 'professional' | 'employer') => {
        setLoading(true);
        try {
            const endpoint = type === 'professional' ? '/api/professional/login' : '/api/employer/login';
            const email = type === 'professional' ? profEmail : empWorkEmail;
            const password = type === 'professional' ? profPassword : empPassword;

            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();
            router.push(data.redirect || getRedirectPath(type));
        } catch (err: any) {
            alert(err.message || 'Authentication failed');
        } finally {
            setLoading(false);
        }
    };

    const handleSignup = async (type: 'professional' | 'employer') => {
        setLoading(true);
        try {
            const endpoint = type === 'professional' ? '/api/professional/signup' : '/api/employer/signup';

            const payload = type === 'professional' ? {
                email: profEmail,
                password: profPassword,
                firstName: profFirstName,
                lastName: profLastName,
                role: profRole
            } : {
                companyName: empCompanyName,
                workEmail: empWorkEmail,
                password: empPassword,

            };

            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await res.json();
            router.push(data.redirect || getRedirectPath(type));
        } catch (err: any) {
            alert(err.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    // Validation Checks
    const isProfessionalValid = globalMode === 'login'
        ? (profEmail && profPassword)
        : (profFirstName && profLastName && profEmail && validatePassword(profPassword));

    const isEmployerValid = globalMode === 'login'
        ? (empWorkEmail && empPassword)
        : (empCompanyName && empWorkEmail && validatePassword(empPassword));

    return (
        <div className="min-h-screen bg-[#050b14] text-slate-200 font-sans selection:bg-blue-500/30 overflow-hidden flex flex-col relative">

            {/* Background Texture */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 z-0 mix-blend-overlay"></div>

            {/* Original Profcaria name at top left */}
            <div className="absolute top-6 left-6 z-40 cursor-pointer" onClick={() => router.push('/')}>
                <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400 tracking-tight">
                    Profcaria
                </h1>
            </div>



            {/* Header with Sign/Get Started - Added mb-8 for spacing below */}
            <header className="relative z-20 w-full p-4 flex flex-col items-center justify-center mt-20 mb-8">
                <div className="flex bg-slate-900 p-1.5 rounded-xl border border-slate-800 shadow-2xl w-[300px]">
                    <button
                        onClick={() => { setGlobalMode('login'); setActiveSection(null); }}
                        className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-300 ${globalMode === 'login' ? 'bg-slate-700 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        Sign In
                    </button>
                    <button
                        onClick={() => { setGlobalMode('signup'); setActiveSection(null); }}
                        className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-300 ${globalMode === 'signup' ? 'bg-slate-700 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        Get Started
                    </button>
                </div>
            </header>

            {/* Main Layout */}
            <main className="flex-grow flex flex-col lg:flex-row justify-center items-stretch relative z-10 px-0 md:px-8 pb-4 max-w-[1920px] mx-auto w-full h-full">

                {/* PILLAR 1 */}
                <Pillar className="hidden lg:flex" />

                {/* SECTION 1: PROFESSIONAL */}
                <section
                    className={`order-1 lg:order-none flex-1 min-w-[320px] max-w-xl flex flex-col p-6 transition-all duration-500 ${getOpacity('professional')}`}
                    onClick={() => setActiveSection('professional')}
                >
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-2 bg-blue-900/20 rounded-xl text-blue-400 shadow-inner border border-blue-900/30">
                            <User size={24} />
                        </div>
                        <h2 className="text-xl font-bold text-slate-100 tracking-wide">Professional</h2>
                    </div>

                    <div className="space-y-3">
                        {globalMode === 'signup' && (
                            <div className="grid grid-cols-2 gap-2">
                                <ModernInput
                                    onFocus={() => setActiveSection('professional')}
                                    placeholder="First Name"
                                    icon={User}
                                    value={profFirstName}
                                    onChange={(e) => setProfFirstName(e.target.value)}
                                />
                                <ModernInput
                                    onFocus={() => setActiveSection('professional')}
                                    placeholder="Last Name"
                                    value={profLastName}
                                    onChange={(e) => setProfLastName(e.target.value)}
                                />
                            </div>
                        )}

                        <ModernInput
                            onFocus={() => setActiveSection('professional')}
                            placeholder="Email Address"
                            type="email"
                            icon={Mail}
                            value={profEmail}
                            onChange={(e) => setProfEmail(e.target.value)}
                        />

                        <ModernInput
                            onFocus={() => setActiveSection('professional')}
                            placeholder="Password"
                            type="password"
                            icon={Lock}
                            value={profPassword}
                            onChange={(e) => setProfPassword(e.target.value)}
                            showPasswordToggle
                            passwordVisible={passwordVisible}
                            onTogglePassword={() => setPasswordVisible(!passwordVisible)}
                        />

                        {globalMode === 'login' && (
                            <div className="flex justify-end pt-1">
                                <button
                                    onClick={() => handleForgotPassword('professional')}
                                    className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                                    disabled={forgotPasswordLoading}
                                >
                                    {forgotPasswordLoading ? 'Checking...' : 'Forgot Password?'}
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="mt-3 flex justify-end">
                        <AnimatedSubmitButton
                            onClick={() => globalMode === 'login'
                                ? handleLogin('professional')
                                : handleSignup('professional')
                            }
                            disabled={loading || !isProfessionalValid}
                            loading={loading}
                            color="blue"
                        />
                    </div>
                </section>

                {/* PILLAR 2 */}
                <Pillar className="hidden md:flex" />

                {/* CENTRAL SECTION */}
                <section className="order-2 lg:order-none flex-1 min-w-[300px] max-w-md flex items-center justify-center relative pb-24">
                    <div className="w-48 h-48 rounded-full bg-gradient-to-br from-blue-900/20 to-emerald-900/20 border-2 border-slate-700/50 shadow-2xl flex items-center justify-center relative overflow-hidden">
                        <div className="w-40 h-40 rounded-full bg-slate-900/50 flex items-center justify-center border border-slate-700/30 overflow-hidden">
                            <Image
                                src="/profcaria.png"
                                alt="Profcaria Logo"
                                width={160}
                                height={160}
                                className="object-contain"
                                priority
                            />
                        </div>
                    </div>
                </section>

                {/* PILLAR 3 */}
                <Pillar className="hidden md:flex" />

                {/* SECTION 3: EMPLOYER */}
                <section
                    className={`order-3 lg:order-none flex-1 min-w-[320px] max-w-xl flex flex-col p-6 transition-all duration-500 ${getOpacity('employer')}`}
                    onClick={() => setActiveSection('employer')}
                >
                    <div className="flex items-center gap-4 mb-4 justify-end md:justify-start">
                        <div className="p-2 bg-emerald-900/20 rounded-xl text-emerald-400 shadow-inner border border-emerald-900/30">
                            <Briefcase size={24} />
                        </div>
                        <h2 className="text-xl font-bold text-slate-100 tracking-wide">Employer</h2>
                    </div>

                    <div className="space-y-3">
                        {globalMode === 'signup' && (
                            <div className="space-y-3">
                                <ModernInput
                                    onFocus={() => setActiveSection('employer')}
                                    placeholder="Company Name"
                                    icon={Briefcase}
                                    value={empCompanyName}
                                    onChange={(e) => setEmpCompanyName(e.target.value)}
                                />
                            </div>
                        )}

                        <ModernInput
                            onFocus={() => setActiveSection('employer')}
                            placeholder="Work Email"
                            type="email"
                            icon={Mail}
                            value={empWorkEmail}
                            onChange={(e) => setEmpWorkEmail(e.target.value)}
                        />

                        <ModernInput
                            onFocus={() => setActiveSection('employer')}
                            placeholder="Password"
                            type="password"
                            icon={Lock}
                            value={empPassword}
                            onChange={(e) => setEmpPassword(e.target.value)}
                            showPasswordToggle
                            passwordVisible={passwordVisible}
                            onTogglePassword={() => setPasswordVisible(!passwordVisible)}
                        />

                        {globalMode === 'login' && (
                            <div className="flex justify-start pt-1">
                                <button
                                    onClick={() => handleForgotPassword('employer')}
                                    className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
                                    disabled={forgotPasswordLoading}
                                >
                                    {forgotPasswordLoading ? 'Checking...' : 'Forgot Password?'}
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="mt-3 flex justify-start">
                        <AnimatedSubmitButton
                            onClick={() => globalMode === 'login'
                                ? handleLogin('employer')
                                : handleSignup('employer')
                            }
                            disabled={loading || !isEmployerValid}
                            loading={loading}
                            color="emerald"
                        />
                    </div>
                </section>

                {/* PILLAR 4 */}
                <Pillar className="hidden lg:flex" />

            </main>

            <ForgotPasswordModal
                isOpen={forgotPasswordOpen}
                onClose={() => {
                    setForgotPasswordOpen(false);
                    setForgotPasswordError(null);
                    setForgotPasswordSuccess(false);
                }}
                userType={forgotPasswordType}
                email={forgotPasswordEmail}
                onEmailChange={setForgotPasswordEmail}
                onReset={handlePasswordReset}
                loading={forgotPasswordLoading}
                error={forgotPasswordError}
                success={forgotPasswordSuccess}
                requires2FA={requires2FA}
            />

        </div>
    );
}
