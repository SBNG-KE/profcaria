"use client"

import React, { useEffect, useState } from 'react';
import { X, Search, User } from 'lucide-react';
import { useTheme } from '@/app/context/ThemeContext';

interface Subscriber {
    id: string;
    name: string;
    profileImage: string | null;
    role: string;
    type: 'user'; // Subscribers are always users for now
}

interface SubscribersModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function SubscribersModal({ isOpen, onClose }: SubscribersModalProps) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (isOpen) {
            fetchSubscribers();
        }
    }, [isOpen]);

    const fetchSubscribers = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/professional/follow?type=followers');
            if (res.ok) {
                const data = await res.json();
                setSubscribers(data.followers || []);
            }
        } catch (error) {
            console.error('Error fetching subscribers:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredSubscribers = subscribers.filter(sub =>
        sub.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sub.role?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className={`relative w-full max-w-md max-h-[80vh] flex flex-col rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 ${isDark ? 'bg-neutral-900 border border-neutral-800' : 'bg-white border border-neutral-200'}`}>

                {/* Header */}
                <div className={`p-5 flex items-center justify-between border-b ${isDark ? 'border-neutral-800' : 'border-neutral-200'}`}>
                    <h3 className={`font-black text-lg uppercase tracking-tight ${isDark ? 'text-white' : 'text-black'}`}>
                        Subscribers
                    </h3>
                    <button
                        onClick={onClose}
                        className={`p-2 rounded-full transition-colors ${isDark ? 'hover:bg-neutral-800 text-neutral-400' : 'hover:bg-neutral-100 text-neutral-500'}`}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Search */}
                <div className={`p-4 border-b ${isDark ? 'border-neutral-800' : 'border-neutral-200'}`}>
                    <div className="relative">
                        <Search className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`} size={16} />
                        <input
                            type="text"
                            placeholder="Search subscribers..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm font-medium outline-none transition-all ${isDark ? 'bg-neutral-800 text-white placeholder-neutral-500 focus:bg-neutral-700' : 'bg-neutral-100 text-black placeholder-neutral-400 focus:bg-white focus:ring-2 focus:ring-black/5'}`}
                        />
                    </div>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {isLoading ? (
                        <div className="flex justify-center py-12">
                            <div className={`animate-spin w-6 h-6 border-2 border-t-transparent rounded-full ${isDark ? 'border-white' : 'border-black'}`} />
                        </div>
                    ) : filteredSubscribers.length === 0 ? (
                        <div className={`text-center py-12 ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>
                            <p className="text-sm font-medium">No subscribers found</p>
                        </div>
                    ) : (
                        filteredSubscribers.map(sub => (
                            <div key={sub.id} className={`flex items-center gap-3 p-3 rounded-2xl transition-colors ${isDark ? 'hover:bg-neutral-800' : 'hover:bg-neutral-50'}`}>
                                <div className={`w-10 h-10 rounded-full overflow-hidden flex items-center justify-center shrink-0 ${isDark ? 'bg-neutral-800' : 'bg-neutral-200'}`}>
                                    {sub.profileImage ? (
                                        <img src={sub.profileImage} alt={sub.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <User size={20} className={isDark ? 'text-neutral-500' : 'text-neutral-400'} />
                                    )}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h4 className={`text-sm font-bold truncate ${isDark ? 'text-white' : 'text-black'}`}>
                                        {sub.name}
                                    </h4>
                                    <p className={`text-xs truncate ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                                        {sub.role || 'Professional'}
                                    </p>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer Stats */}
                <div className={`p-4 border-t text-center text-xs font-bold uppercase tracking-wider ${isDark ? 'border-neutral-800 text-neutral-500' : 'border-neutral-200 text-neutral-400'}`}>
                    {subscribers.length} Total Subscribers
                </div>
            </div>
        </div>
    );
}
