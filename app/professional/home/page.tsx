"use client"

import React, { useState, useRef, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import {
  FileText, Plus, X, Clock,
  Bold, Italic, Underline, Link as LinkIcon,
  Heading1, Heading2, Heading3,
  AlignLeft, AlignCenter, AlignRight,
  List, ListOrdered, Image as ImageIcon, Palette,
  UserCircle, Video, Cable, Calendar, Star, Users, MessageSquare, Share2, Zap, Shield, Check,
  Building2
} from 'lucide-react';

// --- Scroll Helpers ---
const ScrollableContainer = ({ children, className = "" }: { children: ReactNode, className?: string }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showScrollbar, setShowScrollbar] = useState(false);

  const handleScroll = () => {
    const element = scrollRef.current;
    if (!element) return;
    const { scrollTop, scrollHeight, clientHeight } = element;
    if (scrollHeight <= clientHeight) {
      setShowScrollbar(false);
      return;
    }
    setShowScrollbar(true);
    const scrollPercentage = scrollTop / (scrollHeight - clientHeight);
    setScrollProgress(scrollPercentage);
  };

  useEffect(() => {
    handleScroll();
    window.addEventListener('resize', handleScroll);
    return () => window.removeEventListener('resize', handleScroll);
  }, [children]);

  return (
    <div className="relative flex-1 min-h-0 overflow-hidden flex flex-col">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className={`flex-1 overflow-y-auto scrollbar-hide ${className}`}
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {children}
      </div>
      {showScrollbar && (
        <div className="absolute right-1 top-2 bottom-2 w-1 pointer-events-none z-50">
          <div
            className="absolute right-0 w-full transition-all duration-75 ease-out flex flex-col gap-[2px] items-center"
            style={{ top: `calc(${scrollProgress * 100}% - ${scrollProgress * 24}px)` }}
          >
            <div className="w-1 h-1 bg-slate-500/50 rounded-full shadow-sm"></div>
            <div className="w-1 h-1 bg-slate-500/70 rounded-full shadow-sm"></div>
            <div className="w-1 h-1 bg-slate-500/90 rounded-full shadow-sm"></div>
            <div className="w-1 h-1 bg-slate-500/50 rounded-full shadow-sm"></div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Components ---
const DocumentCard = ({ title, onClick }: { title: string, onClick: () => void }) => {
  return (
    <button
      onClick={onClick}
      className="group relative flex-shrink-0 w-60 h-52 rounded-[40px] border-t-2 border-l-2 border-blue-500/80 bg-[#050b14] overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(59,130,246,0.15)]"
    >
      <div className="relative z-10 h-full w-full flex items-center justify-center">
        <h2 className="text-3xl font-black text-slate-200 tracking-tighter group-hover:text-blue-400 transition-colors uppercase">
          {title}
        </h2>
      </div>
      <div className="absolute top-0 left-0 w-24 h-24 bg-blue-500/10 blur-[40px] pointer-events-none"></div>
    </button>
  );
};

const AddNewCard = ({ onClick }: { onClick: () => void }) => {
  return (
    <button
      onClick={onClick}
      className="group relative flex-shrink-0 w-60 h-52 rounded-[40px] border-t-2 border-l-2 border-slate-700/50 bg-[#050b14] overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:border-blue-500/50 hover:shadow-[0_0_20px_rgba(59,130,246,0.1)]"
    >
      <div className="relative z-10 h-full w-full flex items-center justify-center">
        <div className="p-4 rounded-full bg-slate-800/50 text-slate-400 group-hover:bg-blue-500/20 group-hover:text-blue-400 transition-all">
          <Plus size={32} />
        </div>
      </div>
    </button>
  );
}

const ActionCard = ({ icon: Icon, title, subtitle, color = "blue", isActive = false, onClick }: any) => {
  const colorStyles = {
    blue: "from-blue-600/20 to-blue-900/20 border-blue-500/30 text-blue-400",
    emerald: "from-emerald-600/20 to-emerald-900/20 border-emerald-500/30 text-emerald-400",
    violet: "from-violet-600/20 to-violet-900/20 border-violet-500/30 text-violet-400",
  };
  return (
    <button onClick={onClick} className={`relative group flex flex-col items-start justify-between p-6 h-40 w-full rounded-2xl border bg-gradient-to-br transition-all duration-300 ${isActive ? 'scale-[1.02] shadow-2xl ring-1 ring-offset-1 ring-offset-[#050b14] ring-blue-500/50' : 'hover:scale-[1.02] hover:shadow-xl'} ${colorStyles[color as keyof typeof colorStyles]}`}>
      <div className={`p-3 rounded-xl bg-[#050b14]/50 shadow-inner text-current`}><Icon size={28} /></div>
      <div className="text-left">
        <h3 className="text-lg font-bold text-slate-100">{title}</h3>
        <p className="text-xs text-slate-400 font-medium">{subtitle}</p>
      </div>
    </button>
  );
};

const AccessModal = ({ isOpen, onClose, cards, selectedCards, onToggle, onSave }: { isOpen: boolean, onClose: () => void, cards: string[], selectedCards: string[], onToggle: (card: string) => void, onSave: () => void }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose}></div>
      <div className="relative w-full max-w-lg bg-[#0f172a] border border-slate-700/50 rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-8 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/20 rounded-2xl text-blue-400"><Shield size={24} /></div>
            <div className="text-left">
              <h3 className="text-xl font-black text-white uppercase tracking-tight">Access Control</h3>
              <p className="text-xs text-slate-500">Enable cards for employer visibility.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 transition-colors"><X size={20} /></button>
        </div>

        <div className="p-8 space-y-3">
          {cards.map((card) => {
            const isSelected = selectedCards.includes(card);
            return (
              <button
                key={card}
                onClick={() => onToggle(card)}
                className={`w-full flex items-center justify-between p-5 rounded-2xl border transition-all duration-300 ${isSelected ? 'bg-blue-600/10 border-blue-500/50 text-white' : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-700'}`}
              >
                <span className="font-bold uppercase tracking-widest text-sm">{card}</span>
                <div className={`w-6 h-6 rounded-full border flex items-center justify-center transition-all ${isSelected ? 'bg-blue-600 border-blue-500 scale-110' : 'border-slate-700'}`}>
                  {isSelected && <Check size={14} className="text-white" />}
                </div>
              </button>
            );
          })}
        </div>

        <div className="p-8 bg-slate-900/50 flex gap-4">
          <button onClick={onSave} className="flex-1 py-4 bg-blue-600 text-white font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-blue-500 transition-all shadow-xl shadow-blue-600/20 active:scale-95">Save Permissions</button>
        </div>
      </div>
    </div>
  );
};

const SystemPopup = ({ isOpen, onClose, onSave }: { isOpen: boolean, onClose: () => void, onSave: (name: string) => void }) => {
  const [name, setName] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative w-full max-w-md bg-[#0f172a] border border-slate-700 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-200">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-xl font-bold text-white">Add New Section</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 transition-colors"><X size={20} /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Section Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. PORTFOLIO, WORK SAMPLES"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all uppercase"
              autoFocus
            />
          </div>
          <p className="text-xs text-slate-500">This will create a new encrypted section in your professional profile.</p>
        </div>
        <div className="p-6 bg-slate-900/50 flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 px-4 rounded-xl border border-slate-700 text-slate-300 font-bold hover:bg-slate-800 transition-all">Cancel</button>
          <button
            onClick={() => { if (name) { onSave(name); setName(''); onClose(); } }}
            className="flex-1 py-3 px-4 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/20"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
};

export default function ProfessionalHome() {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<'profile' | 'interview' | 'connect' | null>(null);
  const [documents, setDocuments] = useState<string[]>(['RESUME', 'CV', 'CERTIFICATES']);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [isAccessModalOpen, setIsAccessModalOpen] = useState(false);
  const [selectedCards, setSelectedCards] = useState<string[]>(['RESUME']);

  // --- EDITOR STATE ---
  const [activeDocument, setActiveDocument] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const [fontSize, setFontSize] = useState(16);

  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Formatting State
  const [formats, setFormats] = useState({
    bold: false, italic: false, underline: false,
    h1: false, h2: false, h3: false,
    alignLeft: true, alignCenter: false, alignRight: false,
    orderedList: false, unorderedList: false,
  });

  // --- DATA LOADING & SAVING LOGIC ---
  const [interviews, setInterviews] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);

  // --- DATA LOADING & SAVING LOGIC ---
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [cardRes, interviewRes, notifRes, accessRes] = await Promise.all([
          fetch('/api/professional/cards'),
          fetch('/api/professional/interviews'),
          fetch('/api/shared/notifications'),
          fetch('/api/documents?type=access_control')
        ]);

        if (cardRes.ok) {
          const data = await cardRes.json();
          if (data.cards) setDocuments(data.cards);
        }
        if (interviewRes.ok) {
          const data = await interviewRes.json();
          setInterviews(data.interviews || []);
        }
        if (notifRes.ok) {
          const data = await notifRes.json();
          setNotifications(data.notifications || []);
        }
        if (accessRes.ok) {
          const data = await accessRes.json();
          if (data.content) {
            try {
              setSelectedCards(JSON.parse(data.content));
            } catch (e) {
              console.error("Error parsing access control data", e);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching dashboard data", error);
      } finally {
        setIsDataLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  // Fetch content when document is opened
  useEffect(() => {
    const fetchDocContent = async () => {
      if (!activeDocument) return;

      try {
        const res = await fetch(`/api/documents?type=${activeDocument}`);
        if (res.ok) {
          const data = await res.json();
          if (editorRef.current) {
            editorRef.current.innerHTML = data.content || '';
          }
          if (data.lastUpdated) {
            setLastSavedTime(new Date(data.lastUpdated).toLocaleString());
          } else {
            setLastSavedTime(null);
          }
        }
      } catch (error) {
        console.error("Error fetching document content", error);
      }
    };
    fetchDocContent();
  }, [activeDocument]);

  const savePermissions = async () => {
    try {
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          docType: 'access_control',
          content: JSON.stringify(selectedCards)
        })
      });
      if (res.ok) {
        setIsAccessModalOpen(false);
      } else {
        alert("Failed to save permissions.");
      }
    } catch (error) {
      console.error("Error saving permissions", error);
      alert("Failed to save permissions.");
    }
  };

  const saveContent = async () => {
    if (!activeDocument || !editorRef.current) return;

    setIsSaving(true);
    const content = editorRef.current.innerHTML;

    try {
      const localKey = `autosave_${activeDocument}`;
      localStorage.setItem(localKey, JSON.stringify({
        content: content,
        timestamp: new Date().getTime()
      }));

      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          docType: activeDocument,
          content: content
        })
      });

      if (!res.ok) throw new Error("API Save Failed");

      setLastSavedTime(new Date().toLocaleString());
      setTimeout(() => setIsSaving(false), 500);

    } catch (error) {
      console.error("Save failed", error);
      setIsSaving(false);
      alert("Failed to save to secure storage. Check database permissions.");
    }
  };

  // --- EDITOR COMMANDS ---
  const checkFormats = () => {
    const blockValue = document.queryCommandValue('formatBlock');
    setFormats({
      bold: document.queryCommandState('bold'),
      italic: document.queryCommandState('italic'),
      underline: document.queryCommandState('underline'),
      h1: blockValue === 'h1',
      h2: blockValue === 'h2',
      h3: blockValue === 'h3',
      alignLeft: document.queryCommandState('justifyLeft'),
      alignCenter: document.queryCommandState('justifyCenter'),
      alignRight: document.queryCommandState('justifyRight'),
      orderedList: document.queryCommandState('insertOrderedList'),
      unorderedList: document.queryCommandState('insertUnorderedList'),
    });
  };

  const execCommand = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    checkFormats();
  };

  const toggleHeading = (tag: 'H1' | 'H2' | 'H3') => {
    const currentBlock = document.queryCommandValue('formatBlock');
    if (currentBlock && currentBlock.toLowerCase() === tag.toLowerCase()) {
      execCommand('formatBlock', 'p');
    } else {
      execCommand('formatBlock', tag);
    }
  };

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    execCommand('foreColor', e.target.value);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];
    try {
      const response = await fetch(
        `/api/upload?filename=${file.name}`,
        { method: 'POST', body: file }
      );

      if (!response.ok) throw new Error("Upload failed");

      const newBlob = await response.json();
      execCommand('insertImage', newBlob.url);
    } catch (error) {
      console.error("Image upload error", error);
      alert("Failed to upload image.");
    }
  };

  const addLink = () => {
    const url = window.prompt("Enter URL:");
    if (url) execCommand('createLink', url);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'Enter') {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;
      const textNode = selection.getRangeAt(0).startContainer;

      if (textNode.nodeType === Node.TEXT_NODE && textNode.textContent) {
        const lastWord = textNode.textContent.split(/\s+/).pop();
        if (lastWord && (lastWord.startsWith('http') || lastWord.startsWith('www.'))) {
          // Browser contentEditable logic
        }
      }
    }
  };

  const handleAddDocument = async (name: string) => {
    try {
      const res = await fetch('/api/professional/cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: name })
      });
      if (res.ok) {
        setDocuments([...documents, name.toUpperCase()]);
      } else {
        alert("Failed to save card metadata. Ensure database table exists.");
      }
    } catch (error) {
      console.error("Error adding document", error);
      alert("Failed to add document.");
    }
  };

  const toggleSection = (section: 'profile' | 'interview' | 'connect') => {
    if (activeSection === section) {
      setActiveSection(null);
    } else {
      setActiveSection(section);
      setActiveDocument(null);
    }
  };

  const toggleCardAccess = (card: string) => {
    setSelectedCards(prev =>
      prev.includes(card) ? prev.filter(c => c !== card) : [...prev, card]
    );
  };

  return (
    <>
      <ScrollableContainer className="p-8">
        <div className="relative z-10 max-w-7xl mx-auto min-h-full">
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* Notifications Bar */}
            {notifications.length > 0 && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-[28px] flex items-center justify-between group overflow-hidden relative backdrop-blur-md">
                <div className="flex items-center gap-4 px-2">
                  <div className="relative">
                    <Zap size={20} className="text-emerald-400 animate-pulse" />
                    {notifications.filter(n => !n.is_read).length > 0 && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#050b14]"></span>
                    )}
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest leading-none mb-1">Live Update</span>
                    <span className="text-xs font-bold text-white uppercase tracking-tight line-clamp-1">{notifications[0].message}</span>
                  </div>
                </div>
                <button
                  onClick={() => router.push('/professional/home')}
                  className="px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all border border-emerald-500/20 mr-1"
                >
                  View All ({notifications.length})
                </button>
              </div>
            )}

            {/* Top Action Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
              <ActionCard
                icon={UserCircle}
                title="Profile"
                subtitle="View Details"
                color="blue"
                isActive={activeSection === 'profile'}
                onClick={() => toggleSection('profile')}
              />
              <ActionCard
                icon={Video}
                title="Interview"
                subtitle="Practice & Schedule"
                color="violet"
                isActive={activeSection === 'interview'}
                onClick={() => toggleSection('interview')}
              />
              <ActionCard
                icon={Cable}
                title="Connect"
                subtitle="Network & Sync"
                color="emerald"
                isActive={activeSection === 'connect'}
                onClick={() => toggleSection('connect')}
              />
            </div>

            {/* Divider Line */}
            {(activeSection) && <div className="w-full h-px bg-slate-800 my-6 animate-in fade-in duration-300"></div>}

            {/* DYNAMIC CONTENT AREA */}
            <div className="relative">

              {/* PROFILE CONTENT */}
              {activeSection === 'profile' && (
                <div className="w-full animate-in fade-in slide-in-from-bottom-8 duration-500">
                  {/* Access Management Header */}
                  <div className="mb-8 flex items-center justify-between p-6 bg-blue-900/10 border border-blue-500/20 rounded-[32px] backdrop-blur-md">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-blue-500/20 rounded-2xl text-blue-400"><Shield size={24} /></div>
                      <div className="text-left">
                        <h3 className="text-lg font-bold text-white uppercase tracking-tight">Application Access</h3>
                        <p className="text-xs text-slate-400">Control which cards are visible to employers when you apply.</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsAccessModalOpen(true)}
                      className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-blue-600/20 active:scale-95 flex items-center gap-2"
                    >
                      Manage Permissions
                    </button>
                  </div>

                  <div className="flex flex-wrap items-start justify-start gap-8 pb-12 pr-6 text-left">
                    {documents.map((doc, index) => (
                      <DocumentCard key={index} title={doc} onClick={() => setActiveDocument(doc)} />
                    ))}
                    <AddNewCard onClick={() => setIsPopupOpen(true)} />
                  </div>
                </div>
              )}

              {/* INTERVIEW CONTENT */}
              {activeSection === 'interview' && (
                <div className="w-full space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-500 pb-20">
                  <header className="flex items-center justify-between">
                    <div className="text-left">
                      <h2 className="text-3xl font-black text-white uppercase tracking-tight">Interview Center</h2>
                      <p className="text-slate-400 mt-2">Manage your interviews, practice sessions, and schedules.</p>
                    </div>
                  </header>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 space-y-4">
                      <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                        <Calendar size={16} /> Scheduled Interviews
                      </h3>
                      {interviews.length === 0 ? (
                        <div className="bg-slate-900/50 border border-slate-800 p-12 rounded-[32px] flex flex-col items-center justify-center text-slate-700 gap-4">
                          <Video size={48} className="opacity-20" />
                          <p className="font-bold text-xs uppercase tracking-widest">No interviews scheduled yet</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 gap-4">
                          {interviews.map((interview) => (
                            <div key={interview.id} className="bg-[#0f172a] border border-slate-800 p-6 rounded-[32px] flex items-center justify-between group hover:border-blue-500/30 transition-all">
                              <div className="flex items-center gap-6">
                                <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden">
                                  {interview.companyLogo ? <img src={interview.companyLogo} className="w-full h-full object-cover" /> : <Building2 size={32} className="text-slate-600" />}
                                </div>
                                <div className="text-left space-y-1">
                                  <h4 className="text-xl font-bold text-white uppercase tracking-tighter">{interview.jobTitle}</h4>
                                  <p className="text-xs text-blue-400 font-bold uppercase tracking-widest">{interview.companyName}</p>
                                  <div className="flex items-center gap-4 text-[10px] text-slate-500 font-bold uppercase">
                                    <span className="flex items-center gap-1.5"><Clock size={12} /> {new Date(interview.scheduledAt).toLocaleString()}</span>
                                    <span className="flex items-center gap-1.5 text-emerald-500"><Zap size={12} /> Live Link Ready</span>
                                  </div>
                                </div>
                              </div>
                              <a href={interview.meetingLink} target="_blank" rel="noopener noreferrer" className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all">Join Session</a>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="space-y-6">
                      <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl space-y-4 text-left">
                        <div className="p-3 bg-violet-500/20 text-violet-400 w-fit rounded-xl"><Video size={24} /></div>
                        <h3 className="text-xl font-bold text-white">Mock Practice</h3>
                        <p className="text-slate-400 text-sm">Practice with AI-driven mock interviews and get instant feedback.</p>
                        <button className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm font-bold transition-colors">Start Practice</button>
                      </div>
                      <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl space-y-4 text-left">
                        <div className="p-3 bg-emerald-500/20 text-emerald-400 w-fit rounded-xl"><Star size={24} /></div>
                        <h3 className="text-xl font-bold text-white">Feedback</h3>
                        <p className="text-slate-400 text-sm">Review feedback from your past interview sessions.</p>
                        <button className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm font-bold transition-colors">View All</button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* CONNECT CONTENT */}
              {activeSection === 'connect' && (
                <div className="w-full space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-500 pb-20">
                  <header className="flex items-center justify-between">
                    <div className="text-left">
                      <h2 className="text-3xl font-black text-white uppercase tracking-tight">Connect & Network</h2>
                      <p className="text-slate-400 mt-2">Grow your professional network and sync with industry leaders.</p>
                    </div>
                    <button className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-emerald-600/20 active:scale-95">
                      <Plus size={20} />
                      <span>New Connection</span>
                    </button>
                  </header>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl space-y-4 text-center">
                      <div className="mx-auto p-3 bg-emerald-500/20 text-emerald-400 w-fit rounded-xl"><Users size={24} /></div>
                      <h3 className="text-2xl font-black text-white">42</h3>
                      <p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest">Connections</p>
                    </div>
                    <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl space-y-4 text-center">
                      <div className="mx-auto p-3 bg-blue-500/20 text-blue-400 w-fit rounded-xl"><MessageSquare size={24} /></div>
                      <h3 className="text-2xl font-black text-white">12</h3>
                      <p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest">Messages</p>
                    </div>
                    <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl space-y-4 text-center">
                      <div className="mx-auto p-3 bg-violet-500/20 text-violet-400 w-fit rounded-xl"><Zap size={24} /></div>
                      <h3 className="text-2xl font-black text-white">8</h3>
                      <p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest">Leads</p>
                    </div>
                    <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl space-y-4 text-center">
                      <div className="mx-auto p-3 bg-slate-700/20 text-slate-400 w-fit rounded-xl"><Share2 size={24} /></div>
                      <h3 className="text-2xl font-black text-white">5</h3>
                      <p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest">Referrals</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </ScrollableContainer>

      {/* --- THE SLIDER (OVERLAY) --- */}
      <div
        className={`
                absolute inset-0 z-50 bg-[#050b14]/98 border-l border-slate-700/50 backdrop-blur-2xl flex flex-col
                transition-all duration-500 ease-in-out shadow-[-20px_0_50px_rgba(0,0,0,0.7)]
                ${activeDocument ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0 pointer-events-none'}
            `}
      >
        <div className="flex flex-wrap items-center justify-between p-6 gap-4 border-b border-slate-800/50 shrink-0 z-10 bg-[#050b14]/50 backdrop-blur-md sticky top-0">
          <div className="flex flex-wrap items-center gap-4 md:gap-6">
            <button
              onClick={saveContent}
              className={`relative flex items-center justify-center w-12 h-12 rounded-full border border-slate-700/30 bg-slate-800/50 transition-all duration-300 group ${isSaving ? 'scale-90 bg-blue-500/20' : 'hover:scale-110 active:scale-95'}`}
            >
              {isSaving && <span className="absolute inset-0 rounded-full animate-ping bg-blue-400/30"></span>}
              <span className={`text-[10px] font-bold text-slate-500 group-hover:text-blue-400 transition-colors opacity-30 group-hover:opacity-100 ${isSaving ? 'text-blue-400 opacity-100' : ''}`}>SAVE</span>
            </button>

            <div className="w-px h-8 bg-slate-800 hidden sm:block"></div>

            <div className="flex items-center gap-1 bg-slate-900/50 rounded-lg p-1 border border-slate-800">
              <button onClick={() => execCommand('justifyLeft')} className={`p-2 transition-colors rounded ${formats.alignLeft ? 'text-blue-400 bg-blue-500/10' : 'text-slate-500 hover:text-blue-400'}`}><AlignLeft size={18} /></button>
              <button onClick={() => execCommand('justifyCenter')} className={`p-2 transition-colors rounded ${formats.alignCenter ? 'text-blue-400 bg-blue-500/10' : 'text-slate-500 hover:text-blue-400'}`}><AlignCenter size={18} /></button>
              <button onClick={() => execCommand('justifyRight')} className={`p-2 transition-colors rounded ${formats.alignRight ? 'text-blue-400 bg-blue-500/10' : 'text-slate-500 hover:text-blue-400'}`}><AlignRight size={18} /></button>
              <div className="w-px h-4 bg-slate-700 mx-1"></div>
              <button onClick={() => execCommand('insertOrderedList')} className={`p-2 transition-colors rounded ${formats.orderedList ? 'text-blue-400 bg-blue-500/10' : 'text-slate-500 hover:text-blue-400'}`}><ListOrdered size={18} /></button>
              <button onClick={() => execCommand('insertUnorderedList')} className={`p-2 transition-colors rounded ${formats.unorderedList ? 'text-blue-400 bg-blue-500/10' : 'text-slate-500 hover:text-blue-400'}`}><List size={18} /></button>
            </div>

            <div className="flex items-center gap-1 bg-slate-900/50 rounded-lg p-1 border border-slate-800 hidden md:flex">
              <button onClick={() => toggleHeading('H1')} className={`flex items-center gap-2 px-3 py-2 rounded transition-colors ${formats.h1 ? 'bg-blue-500/20 text-blue-400' : 'text-slate-500 hover:text-white'}`}><Heading1 size={20} /><span className="text-xs font-bold uppercase hidden lg:inline">Title</span></button>
              <button onClick={() => toggleHeading('H2')} className={`flex items-center gap-2 px-3 py-2 rounded transition-colors ${formats.h2 ? 'bg-blue-500/20 text-blue-400' : 'text-slate-500 hover:text-white'}`}><Heading2 size={18} /><span className="text-xs font-bold uppercase hidden lg:inline">Sub</span></button>
              <button onClick={() => toggleHeading('H3')} className={`flex items-center gap-2 px-3 py-2 rounded transition-colors ${formats.h3 ? 'bg-blue-500/20 text-blue-400' : 'text-slate-500 hover:text-white'}`}><Heading3 size={16} /><span className="text-xs font-bold uppercase hidden lg:inline">Head</span></button>
            </div>

            <div className="flex items-center gap-1 bg-slate-900/50 rounded-lg p-1 border border-slate-800">
              <button onClick={() => execCommand('bold')} className={`p-2 transition-colors rounded ${formats.bold ? 'text-blue-400 bg-blue-500/10' : 'text-slate-500 hover:text-blue-400'}`}><Bold size={18} /></button>
              <button onClick={() => execCommand('italic')} className={`p-2 transition-colors rounded ${formats.italic ? 'text-blue-400 bg-blue-500/10' : 'text-slate-500 hover:text-blue-400'}`}><Italic size={18} /></button>
              <button onClick={() => execCommand('underline')} className={`p-2 transition-colors rounded ${formats.underline ? 'text-blue-400 bg-blue-500/10' : 'text-slate-500 hover:text-blue-400'}`}><Underline size={18} /></button>

              <div className="relative group p-2">
                <Palette size={18} className="text-slate-500 group-hover:text-blue-400 cursor-pointer" />
                <input
                  type="color"
                  onChange={handleColorChange}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
              </div>

              <div className="relative group p-2">
                <ImageIcon size={18} className="text-slate-500 group-hover:text-blue-400 cursor-pointer" />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
              </div>

              <button onClick={addLink} className="p-2 text-slate-500 hover:text-blue-400 transition-colors rounded"><LinkIcon size={18} /></button>
            </div>
          </div>

          <button
            onClick={() => setActiveDocument(null)}
            className="p-2 rounded-full text-slate-600 hover:text-red-500 hover:bg-red-500/10 transition-all duration-300 group"
          >
            <X size={28} className="group-hover:rotate-90 transition-transform duration-300" />
          </button>
        </div>

        <ScrollableContainer className="p-10">
          <div className="max-w-4xl mx-auto pb-40">
            <div className="mb-8 border-b border-slate-800 pb-4">
              <h1 className="text-4xl font-black text-white uppercase tracking-tight">{activeDocument || 'Untitled'}</h1>
              <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                <Clock size={12} />
                <span>
                  {lastSavedTime ? `Last saved: ${lastSavedTime}` : 'Unsaved'}
                </span>
              </div>
            </div>

            <div
              ref={editorRef}
              contentEditable
              suppressContentEditableWarning={true}
              className="
                            w-full text-slate-300 focus:outline-none 
                            empty:before:content-['Start_typing...'] empty:before:text-slate-700 empty:before:pointer-events-none
                            [&_ol]:list-decimal [&_ol]:ml-4 [&_ul]:list-disc [&_ul]:ml-4
                            [&_img]:max-w-full [&_img]:rounded-xl [&_img]:my-4 [&_img]:shadow-lg
                        "
              style={{
                minHeight: '1000px',
                fontSize: `${fontSize}px`,
                lineHeight: '1.7',
                whiteSpace: 'pre-wrap'
              }}
              onInput={checkFormats}
              onMouseUp={checkFormats}
              onKeyUp={(e) => {
                checkFormats();
                handleKeyDown(e);
              }}
            />
          </div>
        </ScrollableContainer>
      </div>

      <AccessModal
        isOpen={isAccessModalOpen}
        onClose={() => setIsAccessModalOpen(false)}
        cards={documents}
        selectedCards={selectedCards}
        onToggle={toggleCardAccess}
        onSave={savePermissions}
      />

      <SystemPopup
        isOpen={isPopupOpen}
        onClose={() => setIsPopupOpen(false)}
        onSave={handleAddDocument}
      />
    </>
  );
}
