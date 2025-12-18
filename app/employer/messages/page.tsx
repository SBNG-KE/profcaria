"use client"

import React, { useState } from 'react';
import {
    Send, Search, User, CheckCircle2, XCircle,
    MoreVertical, Paperclip, Smile, Image as ImageIcon
} from 'lucide-react';

const ChatListItem = ({ chat, active, onClick }: { chat: any, active: boolean, onClick: () => void }) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center gap-4 p-4 transition-all border-l-2 ${active ? 'bg-emerald-500/5 border-emerald-500' : 'hover:bg-white/[0.02] border-transparent'}`}
    >
        <div className="w-12 h-12 rounded-full bg-slate-800 border border-white/5 flex items-center justify-center text-slate-500 relative">
            <User size={20} />
            {chat.online && <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-[#050b14] rounded-full"></div>}
        </div>
        <div className="flex-1 text-left overflow-hidden">
            <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-bold text-white truncate">{chat.name}</span>
                <span className="text-[10px] text-slate-600 font-mono">{chat.time}</span>
            </div>
            <p className="text-xs text-slate-500 truncate">{chat.lastMessage}</p>
        </div>
    </button>
);

export default function MessagesPage() {
    const [activeChat, setActiveChat] = useState<number>(1);
    const [message, setMessage] = useState('');

    const chats = [
        { id: 1, name: 'Alex Johnson', lastMessage: "I've reviewed your certificates. Let's talk.", time: '10:42 AM', online: true, status: 'Shortlisted' },
        { id: 2, name: 'Sarah Smith', lastMessage: 'Thank you for the opportunity!', time: 'Yesterday', online: false, status: 'Accepted' },
        { id: 3, name: 'Michael Chen', lastMessage: 'Sent a notification regarding the technical round.', time: '2 days ago', online: false, status: 'Pending' },
    ];

    return (
        <div className="flex h-full bg-[#050b14] overflow-hidden">
            {/* Sidebar List */}
            <div className="w-80 border-r border-white/5 flex flex-col">
                <div className="p-6 border-b border-white/5">
                    <h2 className="text-xl font-black text-white uppercase tracking-tighter mb-4">Notifications</h2>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                        <input
                            type="text"
                            placeholder="Find a conversation..."
                            className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
                        />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto scrollbar-hide">
                    {chats.map(chat => (
                        <ChatListItem
                            key={chat.id}
                            chat={chat}
                            active={activeChat === chat.id}
                            onClick={() => setActiveChat(chat.id)}
                        />
                    ))}
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col">
                {/* Chat Header */}
                <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                            <User size={20} />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-white">{chats.find(c => c.id === activeChat)?.name}</h3>
                            <div className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                                <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">In Contention</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="p-2 hover:bg-white/5 rounded-lg text-slate-500 transition-colors"><MoreVertical size={20} /></button>
                    </div>
                </div>

                {/* Messages Feed */}
                <div className="flex-1 p-8 overflow-y-auto space-y-6">
                    <div className="flex justify-center">
                        <span className="text-[10px] bg-slate-800/50 text-slate-500 px-3 py-1 rounded-full uppercase tracking-[0.2em] font-bold">Conversation Started</span>
                    </div>

                    {/* Employer Message */}
                    <div className="flex justify-end">
                        <div className="max-w-[70%] bg-emerald-600 text-white p-4 rounded-[24px] rounded-tr-none shadow-lg">
                            <p className="text-sm">Hello Alex, we really liked your portfolio. Are you available for a brief call tomorrow?</p>
                            <span className="text-[9px] text-emerald-100/70 block mt-2 text-right">10:45 AM</span>
                        </div>
                    </div>

                    {/* Candidate Message */}
                    <div className="flex justify-start">
                        <div className="max-w-[70%] bg-slate-800/80 text-slate-200 p-4 rounded-[24px] rounded-tl-none border border-white/5">
                            <p className="text-sm">Hi! Yes, I'm available at 2 PM. Looking forward to it.</p>
                            <span className="text-[9px] text-slate-500 block mt-2">11:02 AM</span>
                        </div>
                    </div>
                </div>

                {/* Input Area */}
                <div className="p-6 border-t border-white/5 bg-white/[0.01]">
                    <div className="flex items-center gap-4 bg-slate-900/50 border border-white/5 rounded-[24px] p-2 pr-4 focus-within:border-emerald-500/50 transition-all">
                        <button className="p-2 hover:bg-white/5 rounded-full text-slate-500 transition-colors"><Paperclip size={20} /></button>
                        <input
                            type="text"
                            placeholder="Type a notification or response..."
                            className="flex-1 bg-transparent border-none text-sm text-slate-200 focus:outline-none py-2"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                        />
                        <button className="p-2 hover:bg-white/5 rounded-full text-slate-500 transition-colors"><Smile size={20} /></button>
                        <button className="bg-emerald-600 hover:bg-emerald-500 text-white p-2.5 rounded-full shadow-lg shadow-emerald-900/20 transition-all active:scale-95">
                            <Send size={18} />
                        </button>
                    </div>
                    <p className="mt-4 text-[10px] text-slate-600 text-center uppercase tracking-widest font-bold">Only candidates in contention can respond to notifications.</p>
                </div>
            </div>
        </div>
    );
}
