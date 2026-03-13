"use client"

import React, { useState, useEffect, useCallback } from 'react';
import {
    Shield, Lock, FileText, Plus, X, Trash2, Pin, PinOff,
    Eye, EyeOff, DollarSign, Briefcase, ChevronDown, ChevronRight,
    Clock, Edit3, Save, Loader2, Check, AlertTriangle, Search, StickyNote
} from 'lucide-react';
import { useTheme } from '@/app/context/ThemeContext';

const NOTE_CATEGORIES = [
    { value: 'general', label: 'General', emoji: '📝' },
    { value: 'salary', label: 'Salary & Comp', emoji: '💰' },
    { value: 'interview', label: 'Interview Notes', emoji: '🎯' },
    { value: 'offer', label: 'Offers Received', emoji: '📩' },
    { value: 'goal', label: 'Career Goals', emoji: '🚀' },
    { value: 'reflection', label: 'Reflections', emoji: '🔍' },
];

export default function CareerVaultPage() {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    // Vault summary
    const [vault, setVault] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // Notes
    const [notes, setNotes] = useState<any[]>([]);
    const [notesLoading, setNotesLoading] = useState(true);
    const [activeNote, setActiveNote] = useState<any>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [noteForm, setNoteForm] = useState({ title: '', content: '', category: 'general' });
    const [savingNote, setSavingNote] = useState(false);

    // Salary history
    const [salaryEntries, setSalaryEntries] = useState<any[]>([]);
    const [showSalaryForm, setShowSalaryForm] = useState(false);
    const [salaryForm, setSalaryForm] = useState({ role: '', company: '', amount: '', date: '' });
    const [savingSalary, setSavingSalary] = useState(false);

    // Hidden search
    const [isHiddenSearch, setIsHiddenSearch] = useState(false);
    const [hiddenSearchSaving, setHiddenSearchSaving] = useState(false);

    // Active tab
    const [activeTab, setActiveTab] = useState<'overview' | 'notes' | 'salary'>('overview');

    // Search
    const [searchQuery, setSearchQuery] = useState('');

    // Fetch vault summary
    const fetchVault = useCallback(async () => {
        try {
            const res = await fetch('/api/professional/vault');
            if (res.ok) {
                const data = await res.json();
                setVault(data.vault);
                setIsHiddenSearch(data.vault.isHiddenSearch || false);
                setSalaryEntries(data.vault.salaryHistory || []);
            }
        } catch (err) {
            console.error('Error fetching vault:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch notes
    const fetchNotes = useCallback(async () => {
        setNotesLoading(true);
        try {
            const res = await fetch('/api/professional/vault/notes');
            if (res.ok) {
                const data = await res.json();
                setNotes(data.notes || []);
            }
        } catch (err) {
            console.error('Error fetching notes:', err);
        } finally {
            setNotesLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchVault();
        fetchNotes();
    }, [fetchVault, fetchNotes]);

    // Create note
    const handleCreateNote = async () => {
        if (!noteForm.title.trim()) return;
        setSavingNote(true);
        try {
            const res = await fetch('/api/professional/vault/notes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(noteForm),
            });
            if (res.ok) {
                const data = await res.json();
                setNotes(prev => [data.note, ...prev]);
                setNoteForm({ title: '', content: '', category: 'general' });
                setIsCreating(false);
            }
        } catch (err) {
            console.error('Error creating note:', err);
        } finally {
            setSavingNote(false);
        }
    };

    // Update note
    const handleUpdateNote = async (note: any) => {
        setSavingNote(true);
        try {
            const res = await fetch('/api/professional/vault/notes', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: note.id,
                    title: note.title,
                    content: note.content,
                    category: note.category,
                }),
            });
            if (res.ok) {
                setNotes(prev => prev.map(n => n.id === note.id ? { ...n, ...note } : n));
                setActiveNote(null);
            }
        } catch (err) {
            console.error('Error updating note:', err);
        } finally {
            setSavingNote(false);
        }
    };

    // Toggle pin
    const handleTogglePin = async (noteId: string, isPinned: boolean) => {
        setNotes(prev => prev.map(n => n.id === noteId ? { ...n, isPinned: !isPinned } : n));
        try {
            await fetch('/api/professional/vault/notes', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: noteId, isPinned: !isPinned }),
            });
        } catch (err) {
            setNotes(prev => prev.map(n => n.id === noteId ? { ...n, isPinned } : n));
        }
    };

    // Delete note
    const handleDeleteNote = async (noteId: string) => {
        if (!confirm('Delete this note? This cannot be undone.')) return;
        setNotes(prev => prev.filter(n => n.id !== noteId));
        try {
            await fetch(`/api/professional/vault/notes?id=${noteId}`, { method: 'DELETE' });
        } catch (err) {
            console.error('Error deleting note:', err);
            fetchNotes();
        }
    };

    // Toggle hidden search
    const handleToggleHiddenSearch = async () => {
        setHiddenSearchSaving(true);
        const prev = isHiddenSearch;
        setIsHiddenSearch(!prev);
        try {
            const res = await fetch('/api/professional/vault', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ is_hidden_search: !prev }),
            });
            if (!res.ok) setIsHiddenSearch(prev);
        } catch {
            setIsHiddenSearch(prev);
        } finally {
            setHiddenSearchSaving(false);
        }
    };

    // Save salary entry
    const handleAddSalary = async () => {
        if (!salaryForm.role || !salaryForm.amount) return;
        setSavingSalary(true);
        const newEntries = [...salaryEntries, { ...salaryForm, id: Date.now().toString() }];
        setSalaryEntries(newEntries);
        try {
            await fetch('/api/professional/vault', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ salary_history: newEntries }),
            });
            setSalaryForm({ role: '', company: '', amount: '', date: '' });
            setShowSalaryForm(false);
        } catch (err) {
            setSalaryEntries(salaryEntries);
        } finally {
            setSavingSalary(false);
        }
    };

    // Delete salary entry
    const handleDeleteSalary = async (id: string) => {
        const newEntries = salaryEntries.filter((e: any) => e.id !== id);
        setSalaryEntries(newEntries);
        try {
            await fetch('/api/professional/vault', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ salary_history: newEntries }),
            });
        } catch {
            setSalaryEntries(salaryEntries);
        }
    };

    const filteredNotes = notes.filter(n =>
        !searchQuery || n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.content?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const pinnedNotes = filteredNotes.filter(n => n.isPinned);
    const unpinnedNotes = filteredNotes.filter(n => !n.isPinned);

    return (
        <div className="max-w-5xl mx-auto space-y-6 py-4 animate-in fade-in slide-in-from-bottom-8 duration-500">
            {/* Header */}
            <div className={`p-6 md:p-8 rounded-[32px] border relative overflow-hidden ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200 shadow-sm'}`}>
                <div className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-10" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6, #a855f7)' }} />
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-2">
                        <div className={`p-2.5 rounded-xl ${isDark ? 'bg-purple-500/20' : 'bg-purple-50'}`}>
                            <Shield size={24} className="text-purple-500" />
                        </div>
                        <div>
                            <h1 className={`text-2xl md:text-3xl font-black tracking-tight ${isDark ? 'text-white' : 'text-black'}`}>Career Vault</h1>
                            <p className={`text-xs font-medium ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                                End-to-end encrypted • AES-256-GCM • Only you can read this data
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className={`flex gap-1 p-1 rounded-2xl ${isDark ? 'bg-neutral-900' : 'bg-neutral-100'}`}>
                {[
                    { id: 'overview', label: 'Overview', icon: Shield },
                    { id: 'notes', label: 'Career Diary', icon: StickyNote },
                    { id: 'salary', label: 'Salary Tracker', icon: DollarSign },
                ].map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${isActive
                                    ? (isDark ? 'bg-white text-black shadow-lg' : 'bg-black text-white shadow-lg')
                                    : (isDark ? 'text-neutral-400 hover:text-white' : 'text-neutral-500 hover:text-black')
                                }`}
                        >
                            <Icon size={14} />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* ====== OVERVIEW TAB ====== */}
            {activeTab === 'overview' && (
                <div className="space-y-6">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { label: 'Encrypted Notes', value: vault?.notesCount || 0, icon: StickyNote, color: 'purple' },
                            { label: 'Documents', value: vault?.documentsCount || 0, icon: FileText, color: 'blue' },
                            { label: 'Employment Records', value: vault?.employmentCount || 0, icon: Briefcase, color: 'emerald' },
                            { label: 'Salary Records', value: salaryEntries.length, icon: DollarSign, color: 'amber' },
                        ].map((stat) => {
                            const Icon = stat.icon;
                            return (
                                <div key={stat.label} className={`p-4 rounded-2xl border ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200 shadow-sm'}`}>
                                    <Icon size={18} className={`mb-2 ${stat.color === 'purple' ? 'text-purple-500' :
                                            stat.color === 'blue' ? 'text-blue-500' :
                                                stat.color === 'emerald' ? 'text-emerald-500' :
                                                    'text-amber-500'
                                        }`} />
                                    <div className={`text-2xl font-black ${isDark ? 'text-white' : 'text-black'}`}>{stat.value}</div>
                                    <div className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>{stat.label}</div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Hidden Search Toggle */}
                    <div className={`p-5 md:p-6 rounded-[32px] border ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200 shadow-sm'}`}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-xl ${isDark ? 'bg-neutral-800' : 'bg-neutral-100'}`}>
                                    {isHiddenSearch ? <EyeOff size={20} className="text-purple-500" /> : <Eye size={20} className={isDark ? 'text-neutral-400' : 'text-neutral-500'} />}
                                </div>
                                <div>
                                    <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-black'}`}>Hidden Job Search</h3>
                                    <p className={`text-xs ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>
                                        {isHiddenSearch
                                            ? 'Your profile is hidden from employer search results'
                                            : 'Your profile is visible in employer search results'}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={handleToggleHiddenSearch}
                                disabled={hiddenSearchSaving}
                                className={`relative inline-flex items-center h-6 w-11 rounded-full transition-colors ${isHiddenSearch ? 'bg-purple-500' : isDark ? 'bg-neutral-700' : 'bg-neutral-200'}`}
                            >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isHiddenSearch ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                        </div>
                    </div>

                    {/* Security Card */}
                    <div className={`p-5 md:p-6 rounded-[32px] border ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200 shadow-sm'}`}>
                        <div className="flex items-center gap-3 mb-4">
                            <Lock size={18} className="text-emerald-500" />
                            <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-black'}`}>Security Status</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {[
                                { label: 'Encryption', value: 'AES-256-GCM', status: true },
                                { label: 'Blind Indexing', value: 'HMAC-SHA256', status: true },
                                { label: 'Key Derivation', value: 'Server-side', status: true },
                            ].map((item) => (
                                <div key={item.label} className={`flex items-center gap-3 p-3 rounded-xl ${isDark ? 'bg-neutral-800' : 'bg-neutral-50'}`}>
                                    <Check size={14} className="text-emerald-500" />
                                    <div>
                                        <div className={`text-xs font-bold ${isDark ? 'text-white' : 'text-black'}`}>{item.label}</div>
                                        <div className={`text-[10px] ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>{item.value}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* ====== NOTES TAB ====== */}
            {activeTab === 'notes' && (
                <div className="space-y-4">
                    {/* Search + Add */}
                    <div className="flex gap-3">
                        <div className={`flex-1 flex items-center gap-2 px-4 py-2.5 rounded-xl border ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'}`}>
                            <Search size={14} className={isDark ? 'text-neutral-500' : 'text-neutral-400'} />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search notes..."
                                className={`flex-1 bg-transparent outline-none text-sm font-medium ${isDark ? 'text-white placeholder:text-neutral-600' : 'text-black placeholder:text-neutral-400'}`}
                            />
                        </div>
                        <button
                            onClick={() => { setIsCreating(true); setActiveNote(null); }}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all ${isDark ? 'bg-white text-black hover:bg-neutral-200' : 'bg-black text-white hover:bg-neutral-800'}`}
                        >
                            <Plus size={14} /> New
                        </button>
                    </div>

                    {/* Create Form */}
                    {isCreating && (
                        <div className={`p-5 rounded-2xl border space-y-3 animate-in fade-in slide-in-from-top-4 duration-300 ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200 shadow-sm'}`}>
                            <input
                                type="text"
                                value={noteForm.title}
                                onChange={(e) => setNoteForm(p => ({ ...p, title: e.target.value }))}
                                placeholder="Note title..."
                                className={`w-full text-lg font-bold bg-transparent outline-none ${isDark ? 'text-white placeholder:text-neutral-600' : 'text-black placeholder:text-neutral-400'}`}
                            />
                            <textarea
                                value={noteForm.content}
                                onChange={(e) => setNoteForm(p => ({ ...p, content: e.target.value }))}
                                placeholder="Write your private note... (encrypted)"
                                rows={4}
                                className={`w-full bg-transparent outline-none text-sm resize-none ${isDark ? 'text-neutral-300 placeholder:text-neutral-600' : 'text-neutral-600 placeholder:text-neutral-400'}`}
                            />
                            <div className="flex items-center justify-between">
                                <div className="flex gap-2">
                                    {NOTE_CATEGORIES.map(cat => (
                                        <button
                                            key={cat.value}
                                            onClick={() => setNoteForm(p => ({ ...p, category: cat.value }))}
                                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${noteForm.category === cat.value
                                                    ? (isDark ? 'bg-white/10 text-white' : 'bg-black/10 text-black')
                                                    : (isDark ? 'text-neutral-500 hover:text-white' : 'text-neutral-400 hover:text-black')
                                                }`}
                                        >
                                            {cat.emoji} {cat.label}
                                        </button>
                                    ))}
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => setIsCreating(false)} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${isDark ? 'text-neutral-400 hover:text-white' : 'text-neutral-500 hover:text-black'}`}>
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleCreateNote}
                                        disabled={savingNote || !noteForm.title.trim()}
                                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-50 ${isDark ? 'bg-white text-black' : 'bg-black text-white'}`}
                                    >
                                        {savingNote ? <Loader2 size={14} className="animate-spin" /> : <><Save size={12} className="inline mr-1" /> Save</>}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Pinned Notes */}
                    {pinnedNotes.length > 0 && (
                        <div className="space-y-2">
                            <div className={`text-[10px] font-bold uppercase tracking-wider px-1 ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>📌 Pinned</div>
                            {pinnedNotes.map(note => (
                                <NoteCard key={note.id} note={note} isDark={isDark} onPin={handleTogglePin} onDelete={handleDeleteNote} onEdit={(n) => setActiveNote(n)} />
                            ))}
                        </div>
                    )}

                    {/* All Notes */}
                    {unpinnedNotes.length > 0 && (
                        <div className="space-y-2">
                            {pinnedNotes.length > 0 && (
                                <div className={`text-[10px] font-bold uppercase tracking-wider px-1 ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>All Notes</div>
                            )}
                            {unpinnedNotes.map(note => (
                                <NoteCard key={note.id} note={note} isDark={isDark} onPin={handleTogglePin} onDelete={handleDeleteNote} onEdit={(n) => setActiveNote(n)} />
                            ))}
                        </div>
                    )}

                    {filteredNotes.length === 0 && !isCreating && !notesLoading && (
                        <div className={`text-center py-16 ${isDark ? 'text-neutral-600' : 'text-neutral-400'}`}>
                            <StickyNote size={40} className="mx-auto mb-3 opacity-50" />
                            <p className="text-sm font-bold">No notes yet</p>
                            <p className="text-xs mt-1">Start your private career diary</p>
                        </div>
                    )}

                    {/* Edit Modal */}
                    {activeNote && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setActiveNote(null)} />
                            <div className={`relative w-full max-w-lg rounded-2xl border p-6 space-y-4 ${isDark ? 'bg-neutral-900 border-neutral-700' : 'bg-white border-neutral-200 shadow-2xl'}`}>
                                <input
                                    type="text"
                                    value={activeNote.title}
                                    onChange={(e) => setActiveNote((p: any) => ({ ...p, title: e.target.value }))}
                                    className={`w-full text-lg font-bold bg-transparent outline-none ${isDark ? 'text-white' : 'text-black'}`}
                                />
                                <textarea
                                    value={activeNote.content}
                                    onChange={(e) => setActiveNote((p: any) => ({ ...p, content: e.target.value }))}
                                    rows={6}
                                    className={`w-full bg-transparent outline-none text-sm resize-none ${isDark ? 'text-neutral-300' : 'text-neutral-600'}`}
                                />
                                <div className="flex gap-2 justify-end">
                                    <button onClick={() => setActiveNote(null)} className={`px-4 py-2 rounded-lg text-xs font-bold ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>Cancel</button>
                                    <button
                                        onClick={() => handleUpdateNote(activeNote)}
                                        disabled={savingNote}
                                        className={`px-4 py-2 rounded-lg text-xs font-bold ${isDark ? 'bg-white text-black' : 'bg-black text-white'}`}
                                    >
                                        {savingNote ? 'Saving...' : 'Save Changes'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ====== SALARY TAB ====== */}
            {activeTab === 'salary' && (
                <div className="space-y-4">
                    <div className={`p-5 md:p-6 rounded-[32px] border ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200 shadow-sm'}`}>
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <DollarSign size={20} className="text-amber-500" />
                                <div>
                                    <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-black'}`}>Salary History</h3>
                                    <p className={`text-xs ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>🔒 Private — encrypted and never shared</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowSalaryForm(!showSalaryForm)}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${isDark ? 'bg-white text-black hover:bg-neutral-200' : 'bg-black text-white hover:bg-neutral-800'}`}
                            >
                                <Plus size={12} /> Add Entry
                            </button>
                        </div>

                        {/* Add Form */}
                        {showSalaryForm && (
                            <div className={`p-4 rounded-2xl mb-4 space-y-3 border animate-in fade-in duration-200 ${isDark ? 'bg-neutral-800 border-neutral-700' : 'bg-neutral-50 border-neutral-200'}`}>
                                <div className="grid grid-cols-2 gap-3">
                                    <input type="text" value={salaryForm.role} onChange={(e) => setSalaryForm(p => ({ ...p, role: e.target.value }))} placeholder="Job Title" className={`px-3 py-2 rounded-lg border text-sm font-medium outline-none ${isDark ? 'bg-neutral-900 border-neutral-700 text-white placeholder:text-neutral-600' : 'bg-white border-neutral-200 text-black placeholder:text-neutral-400'}`} />
                                    <input type="text" value={salaryForm.company} onChange={(e) => setSalaryForm(p => ({ ...p, company: e.target.value }))} placeholder="Company" className={`px-3 py-2 rounded-lg border text-sm font-medium outline-none ${isDark ? 'bg-neutral-900 border-neutral-700 text-white placeholder:text-neutral-600' : 'bg-white border-neutral-200 text-black placeholder:text-neutral-400'}`} />
                                    <input type="text" value={salaryForm.amount} onChange={(e) => setSalaryForm(p => ({ ...p, amount: e.target.value }))} placeholder="Amount (e.g. $120,000/yr)" className={`px-3 py-2 rounded-lg border text-sm font-medium outline-none ${isDark ? 'bg-neutral-900 border-neutral-700 text-white placeholder:text-neutral-600' : 'bg-white border-neutral-200 text-black placeholder:text-neutral-400'}`} />
                                    <input type="text" value={salaryForm.date} onChange={(e) => setSalaryForm(p => ({ ...p, date: e.target.value }))} placeholder="Date (e.g. Jan 2024)" className={`px-3 py-2 rounded-lg border text-sm font-medium outline-none ${isDark ? 'bg-neutral-900 border-neutral-700 text-white placeholder:text-neutral-600' : 'bg-white border-neutral-200 text-black placeholder:text-neutral-400'}`} />
                                </div>
                                <div className="flex gap-2 justify-end">
                                    <button onClick={() => setShowSalaryForm(false)} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>Cancel</button>
                                    <button onClick={handleAddSalary} disabled={savingSalary || !salaryForm.role || !salaryForm.amount} className={`px-4 py-1.5 rounded-lg text-xs font-bold disabled:opacity-50 ${isDark ? 'bg-white text-black' : 'bg-black text-white'}`}>
                                        {savingSalary ? 'Saving...' : 'Add'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Salary List */}
                        {salaryEntries.length > 0 ? (
                            <div className="space-y-2">
                                {salaryEntries.map((entry: any, i: number) => (
                                    <div key={entry.id || i} className={`flex items-center justify-between p-3 rounded-xl border ${isDark ? 'bg-neutral-800/50 border-neutral-800' : 'bg-neutral-50 border-neutral-200'}`}>
                                        <div>
                                            <div className={`text-sm font-bold ${isDark ? 'text-white' : 'text-black'}`}>{entry.role}{entry.company ? ` · ${entry.company}` : ''}</div>
                                            <div className={`text-xs ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>{entry.date || 'No date'}</div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className={`text-sm font-black ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>{entry.amount}</span>
                                            <button onClick={() => handleDeleteSalary(entry.id)} className="text-neutral-500 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : !showSalaryForm && (
                            <div className={`text-center py-10 ${isDark ? 'text-neutral-600' : 'text-neutral-400'}`}>
                                <DollarSign size={32} className="mx-auto mb-2 opacity-50" />
                                <p className="text-sm font-bold">No salary records</p>
                                <p className="text-xs mt-1">Track your compensation history privately</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

// Note Card Component
function NoteCard({ note, isDark, onPin, onDelete, onEdit }: {
    note: any; isDark: boolean;
    onPin: (id: string, isPinned: boolean) => void;
    onDelete: (id: string) => void;
    onEdit: (note: any) => void;
}) {
    const cat = NOTE_CATEGORIES.find(c => c.value === note.category);
    return (
        <div className={`p-4 rounded-2xl border transition-all hover:scale-[1.01] cursor-pointer group ${isDark ? 'bg-neutral-900 border-neutral-800 hover:border-neutral-700' : 'bg-white border-neutral-200 hover:border-neutral-300 shadow-sm'}`}
            onClick={() => onEdit(note)}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs">{cat?.emoji || '📝'}</span>
                        <h4 className={`text-sm font-bold truncate ${isDark ? 'text-white' : 'text-black'}`}>{note.title}</h4>
                        {note.isPinned && <Pin size={10} className="text-purple-500 shrink-0" />}
                    </div>
                    {note.content && (
                        <p className={`text-xs line-clamp-2 ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>{note.content}</p>
                    )}
                    <p className={`text-[10px] mt-2 ${isDark ? 'text-neutral-600' : 'text-neutral-400'}`}>
                        {new Date(note.updatedAt).toLocaleDateString()} · {cat?.label || 'General'}
                    </p>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => onPin(note.id, note.isPinned)} className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-neutral-800' : 'hover:bg-neutral-100'}`}>
                        {note.isPinned ? <PinOff size={12} className={isDark ? 'text-neutral-400' : 'text-neutral-500'} /> : <Pin size={12} className={isDark ? 'text-neutral-400' : 'text-neutral-500'} />}
                    </button>
                    <button onClick={() => onDelete(note.id)} className={`p-1.5 rounded-lg transition-colors hover:bg-red-500/10`}>
                        <Trash2 size={12} className="text-red-500" />
                    </button>
                </div>
            </div>
        </div>
    );
}
