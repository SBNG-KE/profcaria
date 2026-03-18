"use client"

import React, { useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { X, MessageCircle, Briefcase, Users, Bot, Shield, Link2, Zap, Globe, Share2, Search, Bell, BarChart3, GraduationCap, Building2, Handshake } from 'lucide-react';

export default function HangingDocsCard({
    isOpen,
    onClose
}: {
    isOpen: boolean;
    onClose: () => void;
}) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    useEffect(() => {
        if (isOpen) {
            document.documentElement.style.overflow = 'hidden';
            document.body.style.overflow = 'hidden';
        } else {
            document.documentElement.style.overflow = '';
            document.body.style.overflow = '';
        }
        return () => {
            document.documentElement.style.overflow = '';
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const sections = [
        {
            title: "About Profcaria",
            content: "Profcaria is an all-in-one professional and social ecosystem designed to transform how professionals and employers connect. Unlike traditional job boards or purely professional networks, Profcaria combines chatting with friends, curated social feeds, verified skill matching, and AI mentorship. Built from the ground up with privacy, security, and verified evidence at its core — no ads, no data selling, just career growth and genuine social connections."
        },
        {
            title: "Messaging & Social",
            items: [
                "Direct messaging with your social contacts, connections, and colleagues",
                "Create and manage groups with friends, contacts, or professional circles",
                "Company groups auto-created and updated based on employment status",
                "Share jobs, opportunities, and insights with anyone in your network",
                "Last active indicators so you know who's available",
                "Find contacts already on Profcaria using your phone contacts",
                "Separate social and connection spaces — message anyone without needing to add them to your social circle"
            ]
        },
        {
            title: "Job Posting & Discovery",
            items: [
                "Post jobs with detailed requirements, work mode, and employment type",
                "AI-powered 'For You' feed tailored to your skills, experience, and preferences",
                "Browse all available jobs or let AI filter the best matches for you",
                "Real-time job alerts and notifications for new opportunities",
                "Share jobs to friends, groups, connections, or colleagues instantly",
                "Track your applications, invites, and employment status in one place",
                "Filter by experience years, remote/onsite/hybrid, and employment type"
            ]
        },
        {
            title: "Smart Linking & Employment",
            items: [
                "Automatic employee-employer connections through verified employment",
                "Company groups that auto-update as employees join or leave",
                "View contacts and connections who are employed within the system",
                "Employment verification that builds trust and credibility",
                "Mutual follow system for professional networking in the feed",
                "Add connections to your social circle or keep them as professional contacts"
            ]
        },
        {
            title: "AI-Powered Career Tools",
            items: [
                "Career AI — your personal AI career advisor with multiple AI model choices",
                "Recruiter AI — intelligent screening, matching, and candidate analysis for employers",
                "Interview Preparation — AI-driven mock interviews and real-time feedback",
                "Skills Gap Analysis — identify what you need to learn to reach your career goals",
                "AI-powered job matching based on your verified skills and career trajectory",
                "Smart search across people, conversations, and opportunities",
                "All AI tools available with Plus and Pro subscription plans"
            ]
        },
        {
            title: "Verified Evidence",
            items: [
                "Link real projects, repositories, or certificates directly to each skill",
                "Interactive skills graph that proves your expertise visually",
                "Evidence-based matching prioritizes verified professionals",
                "Career vault for secure storage of professional documents",
                "Career score calculated from your real data and verified achievements",
                "Stand out with proof, not just claims — undeniable professional credibility"
            ]
        },
        {
            title: "Security & Privacy",
            items: [
                "Two-factor authentication with email verification for account changes",
                "End-to-end secure communications across all messaging",
                "No ads, no data selling — your career data stays yours",
                "Secure career vault with encrypted document storage",
                "Enterprise-grade security infrastructure",
                "Location-aware features that respect your privacy preferences"
            ]
        },
        {
            title: "For Employers",
            items: [
                "Dedicated employer dashboard with real-time analytics",
                "Recruiter AI for intelligent candidate screening and shortlisting",
                "Post and manage job listings with advanced filtering",
                "Company profile with branding and culture showcase",
                "Manage company groups and communicate with your team",
                "Reached out section — track professionals and companies you've contacted",
                "Deep teal design language for a premium employer experience"
            ]
        }
    ];

    return (
        <div className="fixed inset-0 z-[100] pointer-events-auto">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-md transition-opacity duration-300"
                onClick={onClose}
            />

            {/* Full-page scroll container */}
            <div className="fixed inset-0 overflow-y-auto custom-scrollbar" data-lenis-prevent="true">
                <div className="flex min-h-full items-start justify-center p-4 md:p-8">
                    {/* CARD */}
                    <div
                        className={`
                            relative w-full max-w-[900px] mx-auto
                            rounded-[2rem] p-6 md:p-10 pb-10 md:pb-14
                            transform transition-all duration-500 origin-top
                            ${isDark
                                ? 'glass-card border-[#1B2A4A]/50 text-white'
                                : 'glass-card-light border-[#1B2A4A]/20 text-[#0A0F1A]'}
                        `}
                        style={{
                            animation: 'swing 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards'
                        }}
                    >
                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            className={`
                                absolute top-6 right-6 p-2 rounded-full transition-all duration-300 z-10
                                ${isDark ? 'bg-[#111827] hover:bg-[#1B2A4A] text-white' : 'bg-[#F0F2F5] hover:bg-[#E8EBF0] text-[#0A0F1A]'}
                            `}
                        >
                            <X size={18} />
                        </button>

                        {/* Content */}
                        <div className="mt-4 md:mt-6 space-y-16">
                            {/* Header */}
                            <div className="text-center">
                                <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tight leading-none mb-4">
                                    <span className={`font-pixel ${isDark ? 'text-[#3B5998]' : 'text-[#1B2A4A]'}`}>Profcaria</span>{' '}
                                    <span className="opacity-40">Docs</span>
                                </h2>
                                <p className={`text-sm font-medium ${isDark ? 'text-neutral-400' : 'text-[#4A5568]'}`}>
                                    Everything you need to know about the platform
                                </p>
                                <div className={`w-16 h-1 mt-6 mx-auto ${isDark ? 'bg-[#3B5998]' : 'bg-[#1B2A4A]'}`}></div>
                            </div>

                            {/* Sections */}
                            {sections.map((section, idx) => (
                                <div key={idx} className="space-y-5">
                                    <h3 className={`text-xl md:text-2xl font-black uppercase tracking-wide font-pixel ${isDark ? 'text-[#3B5998]' : 'text-[#1B2A4A]'}`}>
                                        {section.title}
                                    </h3>

                                    {section.content && (
                                        <p className={`text-sm md:text-base leading-relaxed font-medium ${isDark ? 'text-neutral-300' : 'text-[#4A5568]'}`}>
                                            {section.content}
                                        </p>
                                    )}

                                    {section.items && (
                                        <ul className="space-y-3">
                                            {section.items.map((item, i) => (
                                                <li key={i} className="flex items-start gap-3">
                                                    <div className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${isDark ? 'bg-[#3B5998]' : 'bg-[#1B2A4A]'}`} />
                                                    <span className={`text-sm md:text-base leading-relaxed ${isDark ? 'text-neutral-400' : 'text-[#4A5568]'}`}>
                                                        {item}
                                                    </span>
                                                </li>
                                            ))}
                                        </ul>
                                    )}

                                    {idx < sections.length - 1 && (
                                        <div className={`h-px mt-8 ${isDark ? 'bg-[#1B2A4A]/30' : 'bg-[#1B2A4A]/10'}`} />
                                    )}
                                </div>
                            ))}

                            {/* Footer */}
                            <div className="text-center pt-8">
                                <p className={`text-xs font-bold uppercase tracking-widest ${isDark ? 'text-neutral-600' : 'text-neutral-400'}`}>
                                    &copy; {new Date().getFullYear()} Profcaria — The AI Career Operating System
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
