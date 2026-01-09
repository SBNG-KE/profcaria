"use client"

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  FileText, Plus, X, Clock,
  Bold, Italic, Underline, Link as LinkIcon,
  Heading1, Heading2, Heading3,
  AlignLeft, AlignCenter, AlignRight,
  List, ListOrdered, Image as ImageIcon, Palette,
  Shield, Check, ChevronDown, Type
} from 'lucide-react';

const FONTS = [
  "Default", "Arial", "Verdana", "Tahoma", "Trebuchet MS", "Times New Roman",
  "Georgia", "Garamond", "Courier New", "Brush Script MT", "Impact",
  "Roboto", "Open Sans", "Lato", "Montserrat", "Poppins"
];

const COLORS = [
  "#cbd5e1", // Default Slate 300
  "#000000", "#444444", "#666666", "#999999", "#CCCCCC", "#FFFFFF",
  "#ef4444", "#f97316", "#f59e0b", "#eab308", "#84cc16", "#22c55e",
  "#10b981", "#14b8a6", "#06b6d4", "#0ea5e9", "#3b82f6", "#6366f1",
  "#8b5cf6", "#a855f7", "#d946ef", "#ec4899", "#f43f5e", "#713f12"
];

const FONT_SIZES = [
  { label: "10px", value: "1" },
  { label: "13px", value: "2" },
  { label: "16px", value: "3" },
  { label: "18px", value: "4" },
  { label: "24px", value: "5" },
  { label: "32px", value: "6" },
  { label: "48px", value: "7" }
];

// --- ScrollableContainer Component ---
const ScrollableContainer = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showScrollbar, setShowScrollbar] = useState(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const checkScroll = () => {
      const hasScroll = el.scrollHeight > el.clientHeight;
      setShowScrollbar(hasScroll);
      if (hasScroll) {
        const progress = el.scrollTop / (el.scrollHeight - el.clientHeight);
        setScrollProgress(progress);
      }
    };

    checkScroll();
    el.addEventListener('scroll', checkScroll);
    window.addEventListener('resize', checkScroll);

    // Watch for content changes (images loading, typing)
    const observer = new MutationObserver(checkScroll);
    observer.observe(el, { childList: true, subtree: true, attributes: true });

    return () => {
      el.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
      observer.disconnect();
    };
  }, [children]);

  return (
    <div className={`relative flex-1 min-h-0 ${className}`}>
      <div ref={scrollRef} className="h-full overflow-y-auto scrollbar-hide">
        {children}
      </div>
      {showScrollbar && (
        <div className="absolute right-1.5 top-4 bottom-4 w-1.5 pointer-events-none z-50 flex flex-col justify-start">
          <div
            className="absolute right-0 w-full transition-all duration-75 ease-out flex flex-col gap-[3px] items-center"
            style={{ top: `calc(${scrollProgress * 100}% - ${scrollProgress * 40}px)` }}
          >
            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.6)]"></div>
            <div className="w-1 h-1 bg-blue-500/80 rounded-full shadow-sm"></div>
            <div className="w-1 h-1 bg-blue-500/60 rounded-full shadow-sm"></div>
            <div className="w-1 h-1 bg-blue-500/40 rounded-full shadow-sm"></div>
            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.6)]"></div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Components ---
const DocumentCard = ({ title, onClick, onRemove }: { title: string, onClick: () => void, onRemove: () => void }) => {
  return (
    <div className="group relative flex-shrink-0 w-full md:w-60 h-64 md:h-52">
      <button
        onClick={onClick}
        className="w-full h-full rounded-[40px] border-t-2 border-l-2 border-blue-500/80 bg-[#050b14] overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(59,130,246,0.15)] relative z-0"
      >
        <div className="relative z-10 h-full w-full flex items-center justify-center">
          <h2 className="text-3xl font-black text-slate-200 tracking-tighter group-hover:text-blue-400 transition-colors uppercase">
            {title}
          </h2>
        </div>
        <div className="absolute top-0 left-0 w-24 h-24 bg-blue-500/10 blur-[40px] pointer-events-none"></div>
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); onRemove(); }}
        className="absolute top-4 right-4 z-20 p-2 bg-slate-900/80 text-slate-500 hover:text-red-400 hover:bg-slate-900 rounded-full opacity-0 group-hover:opacity-100 transition-all"
        title="Delete Card"
      >
        <X size={16} />
      </button>
    </div>
  );
};

const AddNewCard = ({ onClick }: { onClick: () => void }) => {
  return (
    <button
      onClick={onClick}
      className="group relative flex-shrink-0 w-full md:w-60 h-64 md:h-52 rounded-[40px] border-t-2 border-l-2 border-slate-700/50 bg-[#050b14] overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:border-blue-500/50 hover:shadow-[0_0_20px_rgba(59,130,246,0.1)]"
    >
      <div className="relative z-10 h-full w-full flex items-center justify-center">
        <div className="p-4 rounded-full bg-slate-800/50 text-slate-400 group-hover:bg-blue-500/20 group-hover:text-blue-400 transition-all">
          <Plus size={32} />
        </div>
      </div>
    </button>
  );
}

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
  const [documents, setDocuments] = useState<string[]>(['RESUME', 'CV', 'CERTIFICATES']);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [isAccessModalOpen, setIsAccessModalOpen] = useState(false);
  const [selectedCards, setSelectedCards] = useState<string[]>(['RESUME']);

  const [activeDocument, setActiveDocument] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const [fontSize, setFontSize] = useState(16);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showFontPicker, setShowFontPicker] = useState(false);
  const [showFontSizePicker, setShowFontSizePicker] = useState(false);
  const [currentFont, setCurrentFont] = useState('Default');
  const [currentFontSize, setCurrentFontSize] = useState('3'); // Default 16px

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
  const [isDataLoading, setIsDataLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [cardRes, accessRes] = await Promise.all([
          fetch('/api/professional/cards'),
          fetch('/api/documents?type=access_control')
        ]);

        if (cardRes.ok) {
          const data = await cardRes.json();
          if (data.cards) setDocuments(data.cards);
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
      const res = await fetch('/api/professional/permissions/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          permissions: selectedCards
        })
      });
      if (res.ok) {
        setIsAccessModalOpen(false);
        alert("Permissions updated and synced with active applications.");
      } else {
        alert("Failed to save permissions.");
      }
    } catch (error) {
      console.error("Error saving permissions", error);
      alert("Failed to save permissions.");
    }
  };

  const saveContent = useCallback(async () => {
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
  }, [activeDocument]);

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

    // Check font
    const fontValue = document.queryCommandValue('fontName');
    if (fontValue) setCurrentFont(fontValue.replace(/"/g, ''));

    // Check size
    const sizeValue = document.queryCommandValue('fontSize');
    if (sizeValue) setCurrentFontSize(sizeValue);
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

  const toggleCardAccess = (card: string) => {
    setSelectedCards(prev =>
      prev.includes(card) ? prev.filter(c => c !== card) : [...prev, card]
    );
  };

  return (
    <>
      <div className="p-8">
        <div className="relative z-10 max-w-7xl mx-auto min-h-full">
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* Access Management Header */}
            <div className="flex items-center justify-between p-6 bg-blue-900/10 border border-blue-500/20 rounded-[32px] backdrop-blur-md">
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

            {/* Document Cards - Shown directly */}
            <div className="flex flex-wrap items-start justify-start gap-8 pb-12 pr-6 text-left">
              {documents.map((doc, index) => (
                <DocumentCard
                  key={index}
                  title={doc}
                  onClick={() => setActiveDocument(doc)}
                  onRemove={() => {
                    if (confirm(`Are you sure you want to delete ${doc}?`)) {
                      setDocuments(prev => prev.filter(d => d !== doc));
                    }
                  }}
                />
              ))}
              <AddNewCard onClick={() => setIsPopupOpen(true)} />
            </div>
          </div>
        </div>
      </div>

      {/* --- THE SLIDER (OVERLAY) --- */}
      <div
        className={`
                fixed inset-0 z-[105] h-[100dvh] bg-[#050b14]/98 border-l border-slate-700/50 backdrop-blur-2xl flex flex-col theme-professional
                transition-all duration-500 ease-in-out shadow-[-20px_0_50px_rgba(0,0,0,0.7)]
                ${activeDocument ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0 pointer-events-none'}
            `}
      >
        <div className="flex flex-wrap items-center gap-4 p-4 md:p-6 border-b border-slate-800/50 shrink-0 z-10 bg-[#050b14]/50 backdrop-blur-md sticky top-0 justify-between">
          <div className="flex flex-wrap items-center gap-3 md:gap-6">
            <button
              onClick={saveContent}
              className={`relative flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-full border border-slate-700/30 bg-slate-800/50 transition-all duration-300 group ${isSaving ? 'scale-90 bg-blue-500/20' : 'hover:scale-110 active:scale-95'}`}
            >
              {isSaving && <span className="absolute inset-0 rounded-full animate-ping bg-blue-400/30"></span>}
              <span className={`text-[10px] font-bold text-slate-500 group-hover:text-blue-400 transition-colors opacity-30 group-hover:opacity-100 ${isSaving ? 'text-blue-400 opacity-100' : ''}`}>SAVE</span>
            </button>

            <div className="w-px h-8 bg-slate-800 hidden sm:block"></div>

            <div className="flex items-center gap-1 bg-slate-900/50 rounded-lg p-1 border border-slate-800 overflow-x-auto max-w-[200px] md:max-w-none scrollbar-hide">
              <button onClick={() => execCommand('justifyLeft')} className={`p-2 transition-colors rounded ${formats.alignLeft ? 'text-blue-400 bg-blue-500/10' : 'text-slate-500 hover:text-blue-400'}`}><AlignLeft size={18} /></button>
              <button onClick={() => execCommand('justifyCenter')} className={`p-2 transition-colors rounded ${formats.alignCenter ? 'text-blue-400 bg-blue-500/10' : 'text-slate-500 hover:text-blue-400'}`}><AlignCenter size={18} /></button>
              <button onClick={() => execCommand('justifyRight')} className={`p-2 transition-colors rounded ${formats.alignRight ? 'text-blue-400 bg-blue-500/10' : 'text-slate-500 hover:text-blue-400'}`}><AlignRight size={18} /></button>
              <div className="w-px h-4 bg-slate-700 mx-1 shrink-0"></div>
              <button onClick={() => execCommand('insertOrderedList')} className={`p-2 transition-colors rounded ${formats.orderedList ? 'text-blue-400 bg-blue-500/10' : 'text-slate-500 hover:text-blue-400'}`}><ListOrdered size={18} /></button>
              <button onClick={() => execCommand('insertUnorderedList')} className={`p-2 transition-colors rounded ${formats.unorderedList ? 'text-blue-400 bg-blue-500/10' : 'text-slate-500 hover:text-blue-400'}`}><List size={18} /></button>
            </div>

            {/* FONT SELECTOR */}
            <div className="relative z-50">
              <div className="flex items-center gap-2">
                {/* Font Family */}
                <div className="relative">
                  <button
                    onClick={() => setShowFontPicker(!showFontPicker)}
                    className="flex items-center gap-2 px-3 py-2 bg-slate-900/50 border border-slate-800 rounded-lg text-slate-400 hover:text-white hover:border-slate-700 transition-all min-w-[140px]"
                  >
                    <Type size={16} />
                    <span className="text-xs font-bold truncate flex-1 text-left">{currentFont}</span>
                    <ChevronDown size={14} />
                  </button>
                  {showFontPicker && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowFontPicker(false)}></div>
                      <div className="absolute top-full left-0 mt-2 w-48 max-h-64 overflow-y-auto bg-[#0f172a] border border-slate-700 rounded-xl shadow-2xl z-50 py-2 scrollbar-hide">
                        {FONTS.map(font => (
                          <button
                            key={font}
                            onClick={() => {
                              execCommand('fontName', font === 'Default' ? 'inherit' : font);
                              setCurrentFont(font);
                              setShowFontPicker(false);
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-blue-600/20 hover:text-blue-400 transition-colors"
                            style={{ fontFamily: font === 'Default' ? 'inherit' : font }}
                          >
                            {font}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {/* Font Size */}
                <div className="relative">
                  <button
                    onClick={() => setShowFontSizePicker(!showFontSizePicker)}
                    className="flex items-center gap-2 px-3 py-2 bg-slate-900/50 border border-slate-800 rounded-lg text-slate-400 hover:text-white hover:border-slate-700 transition-all min-w-[70px]"
                  >
                    <span className="text-xs font-bold truncate flex-1 text-center">
                      {FONT_SIZES.find(s => s.value === currentFontSize)?.label || "Size"}
                    </span>
                    <ChevronDown size={14} />
                  </button>
                  {showFontSizePicker && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowFontSizePicker(false)}></div>
                      <div className="absolute top-full left-0 mt-2 w-24 bg-[#0f172a] border border-slate-700 rounded-xl shadow-2xl z-50 py-2">
                        {FONT_SIZES.map(size => (
                          <button
                            key={size.value}
                            onClick={() => {
                              execCommand('fontSize', size.value);
                              setCurrentFontSize(size.value);
                              setShowFontSizePicker(false);
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-blue-600/20 hover:text-blue-400 transition-colors"
                          >
                            {size.label}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
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
                <button
                  onClick={() => setShowColorPicker(!showColorPicker)}
                  className="text-slate-500 hover:text-blue-400 transition-colors"
                >
                  <Palette size={18} />
                </button>

                {showColorPicker && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowColorPicker(false)}></div>
                    <div className="absolute top-full right-0 mt-2 p-3 bg-[#0f172a] border border-slate-700 rounded-xl shadow-2xl z-50 w-[200px]">
                      <div className="grid grid-cols-6 gap-2">
                        {COLORS.map(color => (
                          <button
                            key={color}
                            onClick={() => {
                              execCommand('foreColor', color);
                              setShowColorPicker(false);
                            }}
                            className="w-6 h-6 rounded-full border border-slate-700 hover:scale-110 transition-transform"
                            style={{ backgroundColor: color }}
                            title={color}
                          />
                        ))}
                      </div>
                    </div>
                  </>
                )}
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

        <ScrollableContainer className="p-4 md:p-8 flex-1">
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
                            [&_img]:max-w-full [&_img]:max-h-[400px] [&_img]:object-contain [&_img]:rounded-xl [&_img]:my-4 [&_img]:shadow-lg
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
