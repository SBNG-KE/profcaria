"use client"

/**
 * TermsOfService.tsx
 * 
 * Full-screen blocking modal that displays the Terms of Service.
 * Users must Accept to proceed or Decline to be permanently banned.
 * Responsive, theme-aware, with smooth animations.
 */

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/app/context/ThemeContext';
import { Shield, ScrollText, ChevronDown, AlertTriangle, Loader2, Check, X } from 'lucide-react';

interface TermsOfServiceProps {
    onAccepted: () => void;
}

export default function TermsOfService({ onAccepted }: TermsOfServiceProps) {
    const router = useRouter();
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const [showDeclineConfirm, setShowDeclineConfirm] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Track scroll progress
    const handleScroll = () => {
        const el = scrollContainerRef.current;
        if (!el) return;
        const threshold = el.scrollHeight - el.clientHeight - 100;
        if (el.scrollTop >= threshold) {
            setHasScrolledToBottom(true);
        }
    };

    useEffect(() => {
        const el = scrollContainerRef.current;
        if (el) {
            el.addEventListener('scroll', handleScroll);
            // Check immediately in case content is short enough
            handleScroll();
            return () => el.removeEventListener('scroll', handleScroll);
        }
    }, []);

    const handleAccept = async () => {
        setIsSubmitting(true);
        try {
            const res = await fetch('/api/tos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'accept' })
            });
            const data = await res.json();
            if (data.success) {
                onAccepted();
            }
        } catch (err) {
            console.error('ToS Accept Error:', err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDecline = async () => {
        setIsSubmitting(true);
        try {
            await fetch('/api/tos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'reject' })
            });
            // Redirect to home — user is now banned
            router.push('/');
        } catch (err) {
            console.error('ToS Decline Error:', err);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className={`fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 ${isDark ? 'bg-black/95' : 'bg-white/95'}`}
            style={{ backdropFilter: 'blur(20px)' }}
        >
            <div className={`
                w-full max-w-3xl max-h-[95vh] sm:max-h-[90vh] flex flex-col rounded-2xl sm:rounded-3xl overflow-hidden
                border shadow-2xl
                ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'}
            `}
                style={{
                    animation: 'tosEnter 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                }}
            >
                {/* Header */}
                <div className={`shrink-0 px-4 sm:px-8 pt-6 sm:pt-8 pb-4 sm:pb-6 border-b ${isDark ? 'border-neutral-800' : 'border-neutral-100'}`}>
                    <div className="flex items-center gap-3 mb-3">
                        <div className={`p-2 sm:p-2.5 rounded-xl ${isDark ? 'bg-white/10' : 'bg-black/5'}`}>
                            <Shield size={20} className={isDark ? 'text-white' : 'text-black'} />
                        </div>
                        <div>
                            <h1 className="text-lg sm:text-xl font-black tracking-tight">Terms of Service</h1>
                            <p className={`text-[10px] sm:text-xs font-medium ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>
                                Version 1.0 — Effective March 10, 2026
                            </p>
                        </div>
                    </div>
                    <p className={`text-xs sm:text-sm leading-relaxed ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                        Please read these terms carefully before using Profcaria. By accepting, you agree to be bound by these terms.
                    </p>
                </div>

                {/* Scrollable Content */}
                <div
                    ref={scrollContainerRef}
                    className="flex-1 overflow-y-auto px-4 sm:px-8 py-4 sm:py-6"
                    style={{ scrollbarWidth: 'thin', scrollbarColor: isDark ? '#333 #111' : '#ccc #f5f5f5' }}
                >
                    <div className={`prose prose-sm max-w-none ${isDark ? 'prose-invert' : ''}`}>

                        {/* Section 1 */}
                        <Section num="1" title="Acceptance of Terms" isDark={isDark}>
                            <p>By creating an account, accessing, or using the Profcaria platform ("Platform"), you acknowledge
                                that you have read, understood, and agree to be bound by these Terms of Service ("Terms"), our
                                Privacy Policy, and all applicable laws and regulations.</p>
                            <p>If you do not agree to these Terms, you must not use the Platform. Declining these Terms will
                                result in the permanent suspension of your account and you will be unable to access the Platform
                                in the future.</p>
                            <p>These Terms constitute a legally binding agreement between you ("User," "you") and Profcaria
                                ("Company," "we," "us," "our"), the operator of the Platform accessible at
                                www.profcaria.com.</p>
                        </Section>

                        {/* Section 2 */}
                        <Section num="2" title="Account Registration & Eligibility" isDark={isDark}>
                            <p>To use the Platform, you must:</p>
                            <ul>
                                <li>Be at least 18 years of age or the age of legal majority in your jurisdiction.</li>
                                <li>Provide accurate, current, and complete information during registration.</li>
                                <li>Maintain the security of your account credentials, including passwords and two-factor authentication methods.</li>
                                <li>Immediately notify us of any unauthorized use of your account.</li>
                            </ul>
                            <p>You are solely responsible for all activities that occur under your account. We reserve the right
                                to suspend or terminate accounts that provide false, misleading, or fraudulent information.</p>
                            <p>Each user may only maintain one active account. Creating multiple accounts to circumvent bans,
                                restrictions, or platform rules is strictly prohibited.</p>
                        </Section>

                        {/* Section 3 */}
                        <Section num="3" title="User Responsibilities & Code of Conduct" isDark={isDark}>
                            <p>You agree to use the Platform in a professional, lawful, and ethical manner. You shall NOT:</p>
                            <ul>
                                <li>Post false, misleading, or fraudulent professional credentials, employment history, or qualifications.</li>
                                <li>Harass, abuse, threaten, discriminate against, or defame other users.</li>
                                <li>Upload content that is obscene, offensive, illegal, or infringes on intellectual property rights.</li>
                                <li>Attempt to reverse-engineer, hack, scrape, or exploit any part of the Platform.</li>
                                <li>Use the Platform for spam, phishing, or any unauthorized commercial solicitation.</li>
                                <li>Impersonate another person, company, or entity.</li>
                                <li>Circumvent security features, rate limits, or access controls.</li>
                                <li>Use automated bots, scripts, or crawlers without our express written permission.</li>
                            </ul>
                            <p>Violation of this Code of Conduct may result in immediate account suspension or permanent ban
                                without prior notice.</p>
                        </Section>

                        {/* Section 4 */}
                        <Section num="4" title="Data Collection, Privacy & Data Protection" isDark={isDark}>
                            <p>We take your privacy and data protection seriously. By using the Platform, you acknowledge and
                                consent to the following data practices:</p>

                            <h4 className="font-bold mt-4 mb-2">4.1 Data We Collect</h4>
                            <ul>
                                <li><strong>Account information:</strong> Name, email address, phone number (if provided), and account credentials.</li>
                                <li><strong>Professional information:</strong> Work history, skills, certifications, education, and career preferences.</li>
                                <li><strong>Company information:</strong> Company name, industry, logo, and job postings (for employer accounts).</li>
                                <li><strong>Usage data:</strong> Login timestamps, pages visited, features used, and interaction patterns.</li>
                                <li><strong>Device data:</strong> Browser type, operating system, IP address, and general geolocation (country/city level).</li>
                                <li><strong>Payment data:</strong> Transaction records processed through our third-party payment provider (Paystack). We do not store your full card details.</li>
                            </ul>

                            <h4 className="font-bold mt-4 mb-2">4.2 How We Use Your Data</h4>
                            <ul>
                                <li>To provide, maintain, and improve the Platform and its features.</li>
                                <li>To match professionals with relevant job opportunities using AI-powered algorithms.</li>
                                <li>To verify professional credentials and employment history.</li>
                                <li>To process payments and manage subscriptions.</li>
                                <li>To detect and prevent fraud, abuse, and security threats.</li>
                                <li>To send service-related communications (account updates, security alerts).</li>
                                <li>To generate anonymized, aggregated analytics to improve the Platform.</li>
                            </ul>

                            <h4 className="font-bold mt-4 mb-2">4.3 Data Sharing</h4>
                            <p>We do NOT sell your personal data. We may share data with:</p>
                            <ul>
                                <li><strong>Employers:</strong> Your professional profile information when you apply for jobs or set your status to "Open to Offers."</li>
                                <li><strong>Service providers:</strong> Third-party tools we use for hosting, analytics, payment processing, and email delivery, all bound by data processing agreements.</li>
                                <li><strong>Legal requirements:</strong> When required by law, court order, or governmental authority.</li>
                            </ul>

                            <h4 className="font-bold mt-4 mb-2">4.4 Data Retention</h4>
                            <p>We retain your data for as long as your account is active. If you request account deletion, we will
                                remove your personal data within 30 days, except where retention is required by law or for
                                legitimate business purposes (e.g., fraud prevention, legal disputes).</p>

                            <h4 className="font-bold mt-4 mb-2">4.5 Your Data Rights</h4>
                            <p>Subject to applicable law, you have the right to:</p>
                            <ul>
                                <li>Access and download a copy of your personal data.</li>
                                <li>Correct inaccurate or outdated information.</li>
                                <li>Request deletion of your personal data.</li>
                                <li>Withdraw consent for data processing (which may limit Platform functionality).</li>
                                <li>Lodge a complaint with a data protection authority in your jurisdiction.</li>
                            </ul>
                        </Section>

                        {/* Section 5 */}
                        <Section num="5" title="AI-Powered Features & Automated Processing" isDark={isDark}>
                            <p>Profcaria uses artificial intelligence and machine learning technologies to provide core Platform
                                features. By accepting these Terms, you consent to automated processing of your data for:</p>
                            <ul>
                                <li><strong>Career scoring & AI assessment:</strong> Automated evaluation of your professional profile to generate career scores, skill gap analyses, and growth recommendations.</li>
                                <li><strong>Smart matching:</strong> AI-driven matching between professionals and job opportunities based on skills, experience, preferences, and behavioral signals.</li>
                                <li><strong>Content moderation:</strong> Automated detection and removal of inappropriate, fraudulent, or policy-violating content.</li>
                                <li><strong>Recruiter AI:</strong> AI agents that assist employers in identifying and evaluating potential candidates.</li>
                                <li><strong>Career AI agent:</strong> Personalized AI assistant for career planning, interview preparation, and professional development.</li>
                            </ul>
                            <p>AI-generated insights and scores are advisory tools and do not constitute guarantees of employment,
                                career outcomes, or professional evaluations. You may contact us if you wish to understand or
                                contest an AI-driven decision that significantly affects you.</p>
                        </Section>

                        {/* Section 6 */}
                        <Section num="6" title="Encryption & Security" isDark={isDark}>
                            <p>We employ industry-standard encryption and security measures to protect your data:</p>
                            <ul>
                                <li><strong>Zero-knowledge encryption:</strong> Sensitive personal information (contact details, location) is encrypted before storage. Even our team cannot read your encrypted data.</li>
                                <li><strong>Blind indexing:</strong> Email lookups use cryptographic hashing so raw email addresses are never stored in plain text.</li>
                                <li><strong>Password security:</strong> Passwords are hashed using Argon2id, a state-of-the-art key derivation function.</li>
                                <li><strong>Session security:</strong> JWT-based sessions with HTTP-only, secure cookies. Two-factor authentication (TOTP, passkeys) is available.</li>
                                <li><strong>VPN/Proxy detection:</strong> Automated checks to prevent unauthorized access and maintain platform integrity.</li>
                            </ul>
                            <p>While we take extensive measures to secure your data, no system is completely infallible. You
                                acknowledge that you provide data at your own risk and are responsible for maintaining the
                                confidentiality of your login credentials.</p>
                        </Section>

                        {/* Section 7 */}
                        <Section num="7" title="Intellectual Property" isDark={isDark}>
                            <p><strong>Platform IP:</strong> The Profcaria name, logo, design, branding, software, algorithms,
                                and all original content are the exclusive intellectual property of the Company. You may not copy,
                                reproduce, distribute, or create derivative works without our written consent.</p>
                            <p><strong>User content:</strong> You retain ownership of the content you post on the Platform
                                (profiles, posts, comments). By posting content, you grant Profcaria a worldwide, non-exclusive,
                                royalty-free license to use, display, reproduce, and distribute your content solely for the
                                purpose of operating and promoting the Platform.</p>
                            <p>You represent that you have the right to post all content you share and that such content does not
                                infringe on third-party rights.</p>
                        </Section>

                        {/* Section 8 */}
                        <Section num="8" title="Payments, Subscriptions & Refunds" isDark={isDark}>
                            <p>Certain features of the Platform require a paid subscription. By purchasing a subscription:</p>
                            <ul>
                                <li>You authorize recurring charges to your payment method at the subscription rate displayed at the time of purchase.</li>
                                <li>Subscriptions automatically renew unless cancelled before the renewal date.</li>
                                <li>You may cancel your subscription at any time through your Settings page. Cancellation takes effect at the end of the current billing period.</li>
                                <li>All payments are processed through Paystack, our authorized payment processor. We do not store your full card details on our servers.</li>
                            </ul>
                            <p><strong>Refund Policy:</strong> Subscription fees are generally non-refundable. Refund requests
                                will be considered on a case-by-case basis and may be granted at our sole discretion in
                                exceptional circumstances.</p>
                            <p>Prices are displayed in the currency applicable to your region. We reserve the right to change
                                pricing with 30 days' prior notice to active subscribers.</p>
                        </Section>

                        {/* Section 9 */}
                        <Section num="9" title="Account Termination & Suspension" isDark={isDark}>
                            <p>We reserve the right to suspend or permanently terminate your account at our sole discretion if:</p>
                            <ul>
                                <li>You violate these Terms of Service.</li>
                                <li>You engage in fraudulent, abusive, or illegal activity.</li>
                                <li>You decline the Terms of Service (immediate permanent ban).</li>
                                <li>Your account has been inactive for an extended period (with prior notice).</li>
                                <li>Required by law enforcement or legal proceedings.</li>
                            </ul>
                            <p>You may voluntarily delete your account at any time through your Settings. Upon deletion, your
                                data will be permanently removed within 30 days, subject to legal retention requirements.</p>
                            <p>Users who are permanently banned may not create new accounts. Attempts to circumvent bans will
                                result in further action.</p>
                        </Section>

                        {/* Section 10 */}
                        <Section num="10" title="Limitation of Liability" isDark={isDark}>
                            <p>To the maximum extent permitted by applicable law:</p>
                            <ul>
                                <li>The Platform is provided "AS IS" and "AS AVAILABLE" without warranties of any kind, express or implied.</li>
                                <li>We do not guarantee that the Platform will be uninterrupted, error-free, or completely secure.</li>
                                <li>We are not liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Platform.</li>
                                <li>We are not responsible for the actions, content, or conduct of other users on the Platform.</li>
                                <li>We are not liable for employment decisions made by employers, or career outcomes based on AI recommendations.</li>
                                <li>Our total aggregate liability shall not exceed the amount you have paid to us in the 12 months preceding the claim.</li>
                            </ul>
                        </Section>

                        {/* Section 11 */}
                        <Section num="11" title="Indemnification" isDark={isDark}>
                            <p>You agree to indemnify, defend, and hold harmless Profcaria, its officers, directors, employees,
                                and agents from any claims, damages, losses, liabilities, and expenses (including legal fees)
                                arising from:</p>
                            <ul>
                                <li>Your use of the Platform.</li>
                                <li>Your violation of these Terms.</li>
                                <li>Your violation of any rights of a third party.</li>
                                <li>Any content you post or share on the Platform.</li>
                            </ul>
                        </Section>

                        {/* Section 12 */}
                        <Section num="12" title="Dispute Resolution & Governing Law" isDark={isDark}>
                            <p>These Terms shall be governed by and construed in accordance with the laws of the Republic of
                                Kenya, without regard to conflict of law principles.</p>
                            <p>Any disputes arising from these Terms or the use of the Platform shall first be attempted to
                                be resolved through good-faith negotiation. If negotiation fails, disputes shall be submitted
                                to binding arbitration in Nairobi, Kenya, in accordance with the Arbitration Act of Kenya.</p>
                            <p>Nothing in this clause shall prevent either party from seeking injunctive relief in a court of
                                competent jurisdiction where necessary to protect intellectual property rights or prevent
                                irreparable harm.</p>
                        </Section>

                        {/* Section 13 */}
                        <Section num="13" title="Changes to These Terms" isDark={isDark}>
                            <p>We may update these Terms from time to time. When we make material changes:</p>
                            <ul>
                                <li>We will update the "Effective Date" at the top of these Terms.</li>
                                <li>We will notify you via email or an in-app notification at least 14 days before the changes take effect.</li>
                                <li>Continued use of the Platform after the effective date constitutes acceptance of the updated Terms.</li>
                            </ul>
                            <p>If you do not agree with the updated Terms, you must stop using the Platform and may request
                                account deletion.</p>
                        </Section>

                        {/* Section 14 */}
                        <Section num="14" title="Miscellaneous" isDark={isDark}>
                            <ul>
                                <li><strong>Severability:</strong> If any provision of these Terms is found invalid or unenforceable, the remaining provisions shall remain in full force and effect.</li>
                                <li><strong>Entire Agreement:</strong> These Terms, together with our Privacy Policy, constitute the entire agreement between you and Profcaria regarding the Platform.</li>
                                <li><strong>Waiver:</strong> Our failure to enforce any right or provision does not constitute a waiver of that right or provision.</li>
                                <li><strong>Assignment:</strong> We may assign or transfer our rights under these Terms. You may not assign your rights without our prior written consent.</li>
                            </ul>
                        </Section>

                        {/* Section 15 */}
                        <Section num="15" title="Contact Information" isDark={isDark}>
                            <p>For questions, concerns, or requests regarding these Terms, please contact us:</p>
                            <ul>
                                <li><strong>Email:</strong> legal@profcaria.com</li>
                                <li><strong>Platform:</strong> www.profcaria.com</li>
                                <li><strong>Support:</strong> Available through the in-app Support page</li>
                            </ul>
                        </Section>

                    </div>

                    {/* Scroll indicator */}
                    {!hasScrolledToBottom && (
                        <div className={`sticky bottom-0 flex justify-center py-3 ${isDark ? 'bg-gradient-to-t from-neutral-900 via-neutral-900/80 to-transparent' : 'bg-gradient-to-t from-white via-white/80 to-transparent'}`}>
                            <div className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest animate-bounce ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>
                                <ChevronDown size={14} />
                                <span>Scroll to read all terms</span>
                                <ChevronDown size={14} />
                            </div>
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                <div className={`shrink-0 px-4 sm:px-8 py-4 sm:py-6 border-t ${isDark ? 'border-neutral-800 bg-neutral-900/80' : 'border-neutral-100 bg-neutral-50/80'}`}
                    style={{ backdropFilter: 'blur(10px)' }}
                >
                    {/* Warning */}
                    <div className={`flex items-start gap-2 mb-4 p-3 rounded-xl text-xs ${isDark ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-50 text-amber-700'}`}>
                        <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                        <span>
                            Declining these terms will permanently suspend your account. This action cannot be undone.
                        </span>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                        <button
                            onClick={() => setShowDeclineConfirm(true)}
                            disabled={isSubmitting}
                            className={`
                                flex-1 sm:flex-none px-6 py-3.5 rounded-xl font-bold text-xs uppercase tracking-widest
                                transition-all duration-200 border
                                ${isDark
                                    ? 'border-neutral-700 text-neutral-400 hover:border-red-500 hover:text-red-400 hover:bg-red-500/10'
                                    : 'border-neutral-300 text-neutral-500 hover:border-red-500 hover:text-red-500 hover:bg-red-50'
                                }
                                disabled:opacity-50 disabled:cursor-not-allowed
                            `}
                        >
                            Decline
                        </button>
                        <button
                            onClick={handleAccept}
                            disabled={isSubmitting || !hasScrolledToBottom}
                            className={`
                                flex-1 py-3.5 rounded-xl font-bold text-xs uppercase tracking-widest
                                transition-all duration-200 flex items-center justify-center gap-2
                                ${isDark
                                    ? 'bg-white text-black hover:bg-neutral-200'
                                    : 'bg-black text-white hover:bg-neutral-800'
                                }
                                disabled:opacity-40 disabled:cursor-not-allowed
                            `}
                        >
                            {isSubmitting ? (
                                <Loader2 size={16} className="animate-spin" />
                            ) : (
                                <>
                                    <Check size={16} />
                                    <span>I Accept the Terms of Service</span>
                                </>
                            )}
                        </button>
                    </div>

                    {!hasScrolledToBottom && (
                        <p className={`text-center text-[10px] mt-2 ${isDark ? 'text-neutral-600' : 'text-neutral-400'}`}>
                            Please scroll through the entire document to enable the Accept button.
                        </p>
                    )}
                </div>
            </div>

            {/* Decline Confirmation Dialog */}
            {showDeclineConfirm && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4"
                    style={{ backdropFilter: 'blur(10px)' }}
                >
                    <div className="absolute inset-0 bg-black/60" onClick={() => setShowDeclineConfirm(false)} />
                    <div className={`
                        relative w-full max-w-md p-6 sm:p-8 rounded-2xl sm:rounded-3xl border shadow-2xl
                        ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'}
                    `}
                        style={{ animation: 'tosEnter 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2.5 rounded-xl bg-red-500/10">
                                <AlertTriangle size={22} className="text-red-500" />
                            </div>
                            <h2 className="text-lg font-black tracking-tight">Confirm Permanent Ban</h2>
                        </div>

                        <p className={`text-sm leading-relaxed mb-6 ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                            Are you absolutely sure you want to decline the Terms of Service?
                            <strong className="text-red-500"> Your account will be permanently suspended and you will never be able to use Profcaria again.</strong>
                            {' '}This action is irreversible.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-3">
                            <button
                                onClick={() => setShowDeclineConfirm(false)}
                                disabled={isSubmitting}
                                className={`
                                    flex-1 py-3.5 rounded-xl font-bold text-xs uppercase tracking-widest
                                    transition-all duration-200
                                    ${isDark
                                        ? 'bg-neutral-800 text-white hover:bg-neutral-700'
                                        : 'bg-neutral-100 text-black hover:bg-neutral-200'
                                    }
                                `}
                            >
                                Go Back
                            </button>
                            <button
                                onClick={handleDecline}
                                disabled={isSubmitting}
                                className="flex-1 py-3.5 rounded-xl font-bold text-xs uppercase tracking-widest bg-red-600 text-white hover:bg-red-700 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {isSubmitting ? (
                                    <Loader2 size={16} className="animate-spin" />
                                ) : (
                                    <>
                                        <X size={16} />
                                        <span>Decline & Ban My Account</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Animation Keyframes */}
            <style jsx>{`
                @keyframes tosEnter {
                    from {
                        opacity: 0;
                        transform: scale(0.95) translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1) translateY(0);
                    }
                }
            `}</style>
        </div>
    );
}

// Section Component
function Section({ num, title, isDark, children }: {
    num: string;
    title: string;
    isDark: boolean;
    children: React.ReactNode;
}) {
    return (
        <div className="mb-6 sm:mb-8">
            <div className="flex items-baseline gap-2 mb-3">
                <span className={`
                    text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md
                    ${isDark ? 'bg-white/10 text-neutral-400' : 'bg-black/5 text-neutral-500'}
                `}>
                    §{num}
                </span>
                <h3 className="text-sm sm:text-base font-black tracking-tight">{title}</h3>
            </div>
            <div className={`text-xs sm:text-sm leading-relaxed space-y-2 ${isDark ? 'text-neutral-300' : 'text-neutral-700'} [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_li]:leading-relaxed [&_h4]:text-xs [&_h4]:sm:text-sm ${isDark ? '[&_strong]:text-white' : '[&_strong]:text-black'}`}>
                {children}
            </div>
        </div>
    );
}
