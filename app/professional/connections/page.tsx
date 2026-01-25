"use client"

import React, { useEffect, useState } from 'react';
import { useTheme } from '@/app/context/ThemeContext';
import { Users, Building2, UserPlus, Loader2 } from 'lucide-react';
import NetworkCard from '@/app/components/network/NetworkCard';
import Link from 'next/link';

export default function ConnectionsPage() {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const [activeTab, setActiveTab] = useState<'companies' | 'people' | 'followers'>('companies');
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        try {
            let typeParam = 'following_companies';
            if (activeTab === 'people') typeParam = 'following_users';
            if (activeTab === 'followers') typeParam = 'followers';

            const res = await fetch(`/api/professional/follow?type=${typeParam}`);
            if (res.ok) {
                const json = await res.json();
                console.log("Fetch Result", json);
                // API returns { following: [...] } or { followers: [...] }
                const list = json.following || json.followers || [];
                setData(list);
            }
        } catch (error) {
            console.error("Error fetching connections", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const handleUnfollow = (id: string) => {
        // Optimistically remove from list if looking at "following" lists
        // If "Followers" tab, we don't remove them just because we toggle follow back (unless logic implies blocking, which it doesn't)
        // Wait, Unfollow removes from "Following" lists.
        // If I am in "Followers" tab, the button says "Follow/Following". Toggling it doesn't remove them from my followers list.

        if (activeTab !== 'followers') {
            setData(prev => prev.filter(item => item.id !== id));
        }
    };

    const TabButton = ({ id, label, icon: Icon }: any) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`
                flex-1 flex items-center justify-center gap-2 py-3 border-b-2 transition-colors font-medium text-sm
                ${activeTab === id
                    ? (isDark ? 'border-white text-white' : 'border-black text-black')
                    : (isDark ? 'border-transparent text-neutral-500 hover:text-neutral-300' : 'border-transparent text-neutral-400 hover:text-neutral-600')}
            `}
        >
            <Icon size={18} />
            {label}
        </button>
    );

    return (
        <div className="max-w-5xl mx-auto w-full h-full flex flex-col">
            {/* Header */}
            <header className="mb-6">
                <h1 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-black'}`}>My Network</h1>
                <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                    Manage your professional connections and company interests.
                </p>
            </header>

            {/* Tabs */}
            <div className={`flex border-b mb-6 ${isDark ? 'border-neutral-800' : 'border-neutral-200'}`}>
                <TabButton id="companies" label="Subscriptions" icon={Building2} />
                <TabButton id="people" label="Following" icon={Users} />
                <TabButton id="followers" label="Followers" icon={UserPlus} />
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex-1 flex items-center justify-center">
                    <Loader2 className={`animate-spin ${isDark ? 'text-white' : 'text-black'}`} size={32} />
                </div>
            ) : data.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-10">
                    {data.map((item) => (
                        <NetworkCard
                            key={item.id}
                            id={item.id}
                            name={item.name}
                            image={item.profileImage}
                            role={item.role}
                            type={item.type || (activeTab === 'companies' ? 'company' : 'user')}
                            isFollowing={activeTab !== 'followers' ? true : !!item.isFollowing}
                            onToggle={() => handleUnfollow(item.id)}
                        />
                    ))}
                </div>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center opacity-50 py-20">
                    <Users size={48} className="mb-4" />
                    <p className="text-lg font-medium">No connections yet</p>
                    <Link href="/professional/find" className={`mt-4 px-6 py-2 rounded-lg text-sm font-bold ${isDark ? 'bg-white text-black' : 'bg-black text-white'}`}>
                        Find Opportunities
                    </Link>
                </div>
            )}
        </div>
    );
}
