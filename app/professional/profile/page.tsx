"use client"

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  FileText, Plus, X, Clock,
  Bold, Italic, Underline, Link as LinkIcon,
  Heading1, Heading2, Heading3,
  AlignLeft, AlignCenter, AlignRight,
  List, ListOrdered, Image as ImageIcon, Palette,
  Shield, Check, ChevronDown, Type, Share2, Pencil,
  User, MapPin, Globe, Briefcase, Activity, Save, Users,
  Phone, Mail, ArrowRight, PenLine, Copy
} from 'lucide-react';
import LinkPreview from '@/app/components/LinkPreview';
import { useTheme } from '@/app/context/ThemeContext';
import { EXPERIENCE_YEAR_RANGES } from '@/lib/experience-level';

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

// --- ScrollableContainer Component (invisible scrollbar) ---
const ScrollableContainer = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => {
  return (
    <div className={`relative flex-1 min-h-0 ${className}`}>
      <div className="h-full overflow-y-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {children}
      </div>
    </div>
  );
};

// --- Components ---
const DocumentCard = ({ title, onClick, onRemove, isDark }: { title: string, onClick: () => void, onRemove: () => void, isDark: boolean }) => {
  const [sharing, setSharing] = useState(false);

  // Check if this is the "Reason" card (fuzzy match)
  const isReasonCard = title.toUpperCase().includes('REASON') || title.toUpperCase().includes('LEAVING');

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (sharing) return;
    setSharing(true);

    try {
      const res = await fetch('/api/documents/share', {
        method: 'POST',
        body: JSON.stringify({ docType: title })
      });
      if (res.ok) {
        const { link } = await res.json();
        window.open(link, '_blank');
      } else {
        alert('Failed to generate share link.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSharing(false);
    }
  };

  return (
    <div className="group relative flex-shrink-0 w-full md:w-56 h-56 md:h-44">
      <button
        onClick={onClick}
        className={`w-full h-full rounded-2xl border overflow-hidden transition-all duration-300 hover:scale-[1.02] relative z-0 ${isDark ? 'bg-neutral-900 border-neutral-800 hover:border-neutral-700' : 'bg-white border-neutral-200 hover:border-neutral-300 shadow-sm'}`}
      >
        <div className="relative z-10 h-full w-full flex flex-col items-center justify-center gap-2">
          <h2 className={`text-xl font-black tracking-tight transition-colors uppercase text-center px-4 ${isDark ? 'text-white group-hover:text-neutral-300' : 'text-black group-hover:text-neutral-600'}`}>
            {title}
          </h2>

          {isReasonCard && (
            <div
              onClick={handleShare}
              className={`flex items-center gap-2 mt-2 px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${isDark ? 'bg-white/5 hover:bg-white/10 border-white/20' : 'bg-black/5 hover:bg-black/10 border-black/20'}`}
            >
              <Share2 size={12} className={`${sharing ? 'animate-spin' : ''} ${isDark ? 'text-neutral-300' : 'text-neutral-600'}`} />
              <span className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? 'text-neutral-300' : 'text-neutral-600'}`}>
                {sharing ? 'Generating...' : 'Share Reason'}
              </span>
            </div>
          )}
        </div>
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); onRemove(); }}
        className={`absolute top-3 right-3 z-20 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-all ${isDark ? 'bg-neutral-800 text-neutral-500 hover:text-red-400' : 'bg-neutral-100 text-neutral-400 hover:text-red-500'}`}
        title="Delete Card"
      >
        <X size={14} />
      </button>
    </div>
  );
};

const AddNewCard = ({ onClick, isDark }: { onClick: () => void, isDark: boolean }) => {
  return (
    <button
      onClick={onClick}
      className={`group relative flex-shrink-0 w-full md:w-56 h-56 md:h-44 rounded-2xl border-2 border-dashed overflow-hidden transition-all duration-300 hover:scale-[1.02] ${isDark ? 'border-neutral-800 hover:border-neutral-600 bg-neutral-900/50' : 'border-neutral-300 hover:border-neutral-400 bg-neutral-50'}`}
    >
      <div className="relative z-10 h-full w-full flex items-center justify-center">
        <div className={`p-3 rounded-full transition-all ${isDark ? 'bg-neutral-800 text-neutral-500 group-hover:bg-neutral-700 group-hover:text-white' : 'bg-neutral-200 text-neutral-400 group-hover:bg-neutral-300 group-hover:text-black'}`}>
          <Plus size={24} />
        </div>
      </div>
    </button>
  );
}

const AccessModal = ({ isOpen, onClose, cards, selectedCards, onToggle, onSave, isDark }: { isOpen: boolean, onClose: () => void, cards: string[], selectedCards: string[], onToggle: (card: string) => void, onSave: () => void, isDark: boolean }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose}></div>
      <div className={`relative w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'}`}>
        <div className={`p-6 border-b flex items-center justify-between ${isDark ? 'border-neutral-800' : 'border-neutral-200'}`}>
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${isDark ? 'bg-neutral-800 text-white' : 'bg-neutral-100 text-black'}`}><Shield size={20} /></div>
            <div className="text-left">
              <h3 className={`text-lg font-bold uppercase tracking-tight ${isDark ? 'text-white' : 'text-black'}`}>Access Control</h3>
              <p className={`text-xs ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>Enable cards for employer visibility.</p>
            </div>
          </div>
          <button onClick={onClose} className={`p-2 rounded-full transition-colors ${isDark ? 'hover:bg-neutral-800 text-neutral-400' : 'hover:bg-neutral-100 text-neutral-500'}`}><X size={18} /></button>
        </div>

        <div className="p-6 space-y-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {cards.map((card) => {
            const isSelected = selectedCards.includes(card);
            return (
              <button
                key={card}
                onClick={() => onToggle(card)}
                className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all duration-200 ${isSelected ? (isDark ? 'bg-white/10 border-white/20 text-white' : 'bg-black/5 border-black/20 text-black') : (isDark ? 'bg-neutral-800/50 border-neutral-700 text-neutral-400 hover:border-neutral-600' : 'bg-neutral-50 border-neutral-200 text-neutral-500 hover:border-neutral-300')}`}
              >
                <span className="font-bold uppercase tracking-widest text-xs">{card}</span>
                <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${isSelected ? (isDark ? 'bg-white border-white' : 'bg-black border-black') : (isDark ? 'border-neutral-600' : 'border-neutral-300')}`}>
                  {isSelected && <Check size={12} className={isDark ? 'text-black' : 'text-white'} />}
                </div>
              </button>
            );
          })}
        </div>

        <div className={`p-6 border-t ${isDark ? 'border-neutral-800' : 'border-neutral-200'}`}>
          <button onClick={onSave} className={`w-full py-3 font-bold uppercase tracking-widest text-xs rounded-xl transition-all active:scale-95 ${isDark ? 'bg-white text-black hover:bg-neutral-200' : 'bg-black text-white hover:bg-neutral-800'}`}>Save Permissions</button>
        </div>
      </div>
    </div>
  );
};

const SystemPopup = ({ isOpen, onClose, onSave, isDark }: { isOpen: boolean, onClose: () => void, onSave: (name: string) => void, isDark: boolean }) => {
  const [name, setName] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className={`relative w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'}`}>
        <div className={`p-5 border-b flex items-center justify-between ${isDark ? 'border-neutral-800' : 'border-neutral-200'}`}>
          <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-black'}`}>Add New Section</h3>
          <button onClick={onClose} className={`p-2 rounded-full transition-colors ${isDark ? 'hover:bg-neutral-800 text-neutral-400' : 'hover:bg-neutral-100 text-neutral-500'}`}><X size={18} /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="space-y-2">
            <label className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>Section Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. PORTFOLIO, WORK SAMPLES"
              className={`w-full border rounded-xl px-4 py-3 focus:outline-none transition-all uppercase ${isDark ? 'bg-neutral-800 border-neutral-700 text-white placeholder-neutral-600 focus:border-neutral-500' : 'bg-neutral-50 border-neutral-200 text-black placeholder-neutral-400 focus:border-neutral-400'}`}
              autoFocus
            />
          </div>
          <p className={`text-xs ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>This will create a new encrypted section in your professional profile.</p>
        </div>
        <div className={`p-5 border-t flex gap-3 ${isDark ? 'border-neutral-800' : 'border-neutral-200'}`}>
          <button onClick={onClose} className={`flex-1 py-3 px-4 rounded-xl border font-bold text-sm transition-all ${isDark ? 'border-neutral-700 text-neutral-300 hover:bg-neutral-800' : 'border-neutral-200 text-neutral-600 hover:bg-neutral-100'}`}>Cancel</button>
          <button
            onClick={() => { if (name) { onSave(name); setName(''); onClose(); } }}
            className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all ${isDark ? 'bg-white text-black hover:bg-neutral-200' : 'bg-black text-white hover:bg-neutral-800'}`}
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
};

export default function ProfessionalHome() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Profile page tab state
  const [activeProfileTab, setActiveProfileTab] = useState<'documents' | 'profile' | 'preferences'>('profile');

  // Profile Info state (moved from Settings)
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [about, setAbout] = useState('');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [followerCount, setFollowerCount] = useState(0);

  // Inline Editing State
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingRole, setIsEditingRole] = useState(false);
  const [isEditingContact, setIsEditingContact] = useState(false);
  const [isEditingAbout, setIsEditingAbout] = useState(false);

  // Job Preferences state (moved from Settings)
  const [targetRoleInput, setTargetRoleInput] = useState('');
  const [targetRoles, setTargetRoles] = useState<string[]>([]);
  const [workModes, setWorkModes] = useState<string[]>([]);
  const [employmentTypes, setEmploymentTypes] = useState<string[]>([]);
  const [preferredCountries, setPreferredCountries] = useState<string[]>([]);
  const [locationInput, setLocationInput] = useState('');
  const [isOpenToRelocation, setIsOpenToRelocation] = useState(false);
  const [experienceYearsRanges, setExperienceYearsRanges] = useState<string[]>([]);

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

  // State for editable title
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editableTitle, setEditableTitle] = useState('');

  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  // Link preview state
  const [linkPreviewUrl, setLinkPreviewUrl] = useState<string | null>(null);
  const [linkPreviewPosition, setLinkPreviewPosition] = useState<{ x: number; y: number } | null>(null);
  const [pendingLinkData, setPendingLinkData] = useState<{ textNode: Node; urlStart: number; urlEnd: number; fullUrl: string; displayText: string } | null>(null);

  // Link input popover state (for toolbar button)
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkInputUrl, setLinkInputUrl] = useState('');
  const linkInputRef = useRef<HTMLInputElement>(null);


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
        const [cardRes, accessRes, userRes, prefsRes, followRes] = await Promise.all([
          fetch('/api/professional/cards'),
          fetch('/api/documents?type=access_control'),
          fetch('/api/auth/me'),
          fetch('/api/professional/preferences'),
          fetch('/api/professional/follow?type=followers')
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
        // Load user profile data
        if (userRes.ok) {
          const userData = await userRes.json();
          if (userData.profile) {
            setFirstName(userData.profile.firstName || '');
            setLastName(userData.profile.lastName || '');
            setEmail(userData.profile.email || '');
            setPhone(userData.profile.phoneNumber || '');
            setRole(userData.profile.currentRole || '');
            setAbout(userData.profile.about || '');
            setCountry(userData.profile.country || 'Auto-detected');
            setCity(userData.profile.city || 'Auto-detected');
          }
        }
        // Load job preferences
        if (prefsRes.ok) {
          const prefsData = await prefsRes.json();
          if (prefsData.preferences) {
            const prefs = prefsData.preferences;
            setTargetRoles(prefs.target_roles || []);
            setWorkModes(prefs.work_modes || []);
            setEmploymentTypes(prefs.employment_types || []);
            setPreferredCountries(prefs.preferred_locations?.countries || []);
            setIsOpenToRelocation(prefs.is_open_to_relocation || false);
            setExperienceYearsRanges(prefs.experience_years_ranges || []);
          }
        }
        // Load followers
        if (followRes.ok) {
          const followData = await followRes.json();
          setFollowerCount(followData.followers?.length || 0);
        }
      } catch (error) {
        console.error("Error fetching dashboard data", error);
      } finally {
        setIsDataLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  // Save Profile Info to API
  const handleSaveProfile = async () => {
    setProfileLoading(true);
    setProfileMessage(null);
    try {
      const res = await fetch('/api/professional/profile/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          phone,
          role,
          about
        })
      });
      if (res.ok) {
        setProfileMessage({ type: 'success', text: 'Profile saved successfully!' });
      } else {
        const data = await res.json();
        setProfileMessage({ type: 'error', text: data.error || 'Failed to save profile.' });
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      setProfileMessage({ type: 'error', text: 'An error occurred while saving.' });
    } finally {
      setProfileLoading(false);
    }
  };

  // Save Job Preferences to API
  const handleSavePreferences = async () => {
    setProfileLoading(true);
    setProfileMessage(null);
    try {
      const res = await fetch('/api/professional/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_roles: targetRoles,
          preferred_locations: { countries: preferredCountries, continents: [] },
          work_modes: workModes,
          employment_types: employmentTypes,
          is_open_to_relocation: isOpenToRelocation,
          experience_years_ranges: experienceYearsRanges
        })
      });
      if (res.ok) {
        setProfileMessage({ type: 'success', text: 'Preferences saved successfully!' });
      } else {
        const data = await res.json();
        setProfileMessage({ type: 'error', text: data.error || 'Failed to save preferences.' });
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
      setProfileMessage({ type: 'error', text: 'An error occurred while saving.' });
    } finally {
      setProfileLoading(false);
    }
  };

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
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !selection.toString().trim()) {
      alert('Please select the text you want to turn into a link first.');
      return;
    }
    // Show inline link input instead of window.prompt
    setShowLinkInput(true);
    setLinkInputUrl('');
    // Focus the input after it renders
    setTimeout(() => linkInputRef.current?.focus(), 100);
  };

  // Confirm link from the inline input
  const confirmLink = () => {
    if (linkInputUrl.trim()) {
      const url = linkInputUrl.startsWith('http') ? linkInputUrl : 'https://' + linkInputUrl;
      execCommand('createLink', url);
    }
    setShowLinkInput(false);
    setLinkInputUrl('');
  };

  // Helper to convert URL text to anchor element
  const convertUrlToLink = (textNode: Node, urlStart: number, urlEnd: number, fullUrl: string, displayText: string) => {
    const selection = window.getSelection();

    try {
      const urlRange = document.createRange();
      urlRange.setStart(textNode, urlStart);
      urlRange.setEnd(textNode, urlEnd);

      const anchor = document.createElement('a');
      anchor.href = fullUrl;
      anchor.target = '_blank';
      anchor.rel = 'noopener noreferrer';
      anchor.style.color = '#60a5fa';
      anchor.style.textDecoration = 'underline';
      anchor.style.cursor = 'pointer';
      anchor.textContent = displayText;

      urlRange.deleteContents();
      urlRange.insertNode(anchor);

      // Add a space after the link
      const space = document.createTextNode(' ');
      anchor.parentNode?.insertBefore(space, anchor.nextSibling);

      if (selection) {
        const newRange = document.createRange();
        newRange.setStartAfter(space);
        newRange.collapse(true);
        selection.removeAllRanges();
        selection.addRange(newRange);
      }
    } catch (error) {
      console.error('Error converting URL to link:', error);
    }
  };

  // Handle keyboard events for URL detection
  const handleEditorKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'Enter') {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;
      const range = selection.getRangeAt(0);
      const textNode = range.startContainer;

      if (textNode.nodeType === Node.TEXT_NODE && textNode.textContent) {
        const text = textNode.textContent.substring(0, range.startOffset);
        const words = text.split(/\s+/);
        const lastWord = words[words.length - 1];

        // Check if last word is a URL
        const urlPattern = /^(https?:\/\/|www\.)[^\s]+$/i;
        if (lastWord && urlPattern.test(lastWord)) {
          const fullUrl = lastWord.startsWith('www.') ? 'https://' + lastWord : lastWord;
          const urlStart = text.lastIndexOf(lastWord);
          const urlEnd = urlStart + lastWord.length;

          // Get position for the preview popup
          const rangeRect = range.getBoundingClientRect();

          // Store pending link data
          setPendingLinkData({
            textNode,
            urlStart,
            urlEnd,
            fullUrl,
            displayText: lastWord
          });

          // Show link preview popup
          setLinkPreviewUrl(fullUrl);
          setLinkPreviewPosition({
            x: Math.min(rangeRect.left, window.innerWidth - 350),
            y: rangeRect.bottom + 10
          });
        }
      }
    }
  };

  // Handle paste events to detect URLs
  const handleEditorPaste = (e: React.ClipboardEvent) => {
    const pastedText = e.clipboardData.getData('text/plain');

    // Check if the entire pasted content is a URL
    const urlPattern = /^(https?:\/\/|www\.)[^\s]+$/i;
    if (urlPattern.test(pastedText.trim())) {
      e.preventDefault();

      const fullUrl = pastedText.trim().startsWith('www.')
        ? 'https://' + pastedText.trim()
        : pastedText.trim();

      // Get current selection position for popup
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const rangeRect = range.getBoundingClientRect();

        // Insert the URL text first
        document.execCommand('insertText', false, pastedText.trim());

        // Get the new text node and position
        const newSelection = window.getSelection();
        if (newSelection && newSelection.rangeCount > 0) {
          const newRange = newSelection.getRangeAt(0);
          const newTextNode = newRange.startContainer;

          if (newTextNode.nodeType === Node.TEXT_NODE && newTextNode.textContent) {
            const text = newTextNode.textContent;
            const urlEnd = newRange.startOffset;
            const urlStart = urlEnd - pastedText.trim().length;

            // Store pending link data
            setPendingLinkData({
              textNode: newTextNode,
              urlStart,
              urlEnd,
              fullUrl,
              displayText: pastedText.trim()
            });

            // Show link preview popup
            setLinkPreviewUrl(fullUrl);
            setLinkPreviewPosition({
              x: Math.min(rangeRect.left, window.innerWidth - 350),
              y: rangeRect.bottom + 10
            });
          }
        }
      }
    }
  };

  // Handle clicks on links in the editor
  const handleEditorClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;

    // Check if clicked on an anchor element
    if (target.tagName === 'A') {
      e.preventDefault();
      const href = (target as HTMLAnchorElement).href;
      window.open(href, '_blank', 'noopener,noreferrer');
    }
  };

  // Function to insert link (called when preview confirms)
  const insertLinkFromPreview = () => {
    if (!pendingLinkData) return;

    const { textNode, urlStart, urlEnd, fullUrl, displayText } = pendingLinkData;
    convertUrlToLink(textNode, urlStart, urlEnd, fullUrl, displayText);

    // Clear preview state
    setLinkPreviewUrl(null);
    setLinkPreviewPosition(null);
    setPendingLinkData(null);
  };

  // Close link preview and convert to plain link (no preview needed)
  const closeLinkPreview = () => {
    if (pendingLinkData) {
      // Convert to link anyway (just without showing preview)
      const { textNode, urlStart, urlEnd, fullUrl, displayText } = pendingLinkData;
      convertUrlToLink(textNode, urlStart, urlEnd, fullUrl, displayText);
    }
    setLinkPreviewUrl(null);
    setLinkPreviewPosition(null);
    setPendingLinkData(null);
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

  // Check if a card is a base card (cannot be renamed)
  const isBaseCard = (title: string) => {
    const baseCards = ['RESUME', 'CV', 'CERTIFICATES'];
    return baseCards.includes(title.toUpperCase());
  };

  // Handler for renaming a card
  const handleRenameCard = async (oldTitle: string, newTitle: string) => {
    if (!newTitle.trim() || newTitle.toUpperCase() === oldTitle.toUpperCase()) {
      setIsEditingTitle(false);
      return;
    }

    try {
      const res = await fetch('/api/professional/cards', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldTitle, newTitle })
      });

      if (res.ok) {
        const data = await res.json();
        const updatedTitle = data.newTitle || newTitle.toUpperCase();

        // Update documents list
        setDocuments(prev => prev.map(d => d === oldTitle ? updatedTitle : d));

        // Update active document
        setActiveDocument(updatedTitle);

        // Update selected cards if the renamed card was selected
        if (selectedCards.includes(oldTitle)) {
          setSelectedCards(prev => prev.map(c => c === oldTitle ? updatedTitle : c));
        }
      } else {
        const errData = await res.json();
        alert(errData.error || 'Failed to rename card.');
      }
    } catch (error) {
      console.error('Error renaming card:', error);
      alert('Failed to rename card.');
    } finally {
      setIsEditingTitle(false);
    }
  };

  // Start editing the title
  const startEditingTitle = () => {
    if (activeDocument && !isBaseCard(activeDocument)) {
      setEditableTitle(activeDocument);
      setIsEditingTitle(true);
      setTimeout(() => titleInputRef.current?.focus(), 50);
    }
  };

  return (
    <>
      <div className="p-6">
        <div className="relative z-10 max-w-7xl mx-auto min-h-full">
          <div className="space-y-6">

            {/* Profile Page Tabs */}
            <div className={`flex space-x-2 p-1 rounded-xl w-fit border ${isDark ? 'bg-neutral-900/50 border-neutral-800' : 'bg-neutral-100 border-neutral-200'}`}>
              <button
                onClick={() => setActiveProfileTab('profile')}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-bold transition-all ${activeProfileTab === 'profile' ? (isDark ? 'bg-white text-black' : 'bg-black text-white') + ' shadow-lg' : isDark ? 'text-neutral-400 hover:text-white hover:bg-white/5' : 'text-neutral-500 hover:text-black hover:bg-black/5'}`}
              >
                <User size={16} /> Profile Info
              </button>
              <button
                onClick={() => setActiveProfileTab('documents')}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-bold transition-all ${activeProfileTab === 'documents' ? (isDark ? 'bg-white text-black' : 'bg-black text-white') + ' shadow-lg' : isDark ? 'text-neutral-400 hover:text-white hover:bg-white/5' : 'text-neutral-500 hover:text-black hover:bg-black/5'}`}
              >
                <FileText size={16} /> Documents
              </button>
              <button
                onClick={() => setActiveProfileTab('preferences')}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-bold transition-all ${activeProfileTab === 'preferences' ? (isDark ? 'bg-white text-black' : 'bg-black text-white') + ' shadow-lg' : isDark ? 'text-neutral-400 hover:text-white hover:bg-white/5' : 'text-neutral-500 hover:text-black hover:bg-black/5'}`}
              >
                <Briefcase size={16} /> Job Preferences
              </button>
            </div>

            {/* Documents Tab Content */}
            {activeProfileTab === 'documents' && (
              <>
                {/* Access Management Header */}
                <div className={`flex items-center justify-between p-5 rounded-2xl border ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200 shadow-sm'}`}>
                  <div className="flex items-center gap-4">
                    <div className={`p-2.5 rounded-xl ${isDark ? 'bg-neutral-800 text-white' : 'bg-neutral-100 text-black'}`}><Shield size={20} /></div>
                    <div className="text-left">
                      <h3 className={`text-sm font-bold uppercase tracking-tight ${isDark ? 'text-white' : 'text-black'}`}>Application Access</h3>
                      <p className={`text-xs ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>Control which cards are visible to employers when you apply.</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsAccessModalOpen(true)}
                    className={`px-4 py-2 text-xs font-bold rounded-lg transition-all active:scale-95 ${isDark ? 'bg-white text-black hover:bg-neutral-200' : 'bg-black text-white hover:bg-neutral-800'}`}
                  >
                    Manage Permissions
                  </button>
                </div>

                {/* Document Cards - Shown directly */}
                <div className="flex flex-wrap items-start justify-start gap-6 pb-8 text-left">
                  {documents.map((doc, index) => (
                    <DocumentCard
                      key={index}
                      title={doc}
                      onClick={() => setActiveDocument(doc)}
                      onRemove={async () => {
                        const baseCards = ['RESUME', 'CV', 'CERTIFICATES'];
                        if (baseCards.includes(doc.toUpperCase())) {
                          alert('Cannot delete base cards (Resume, CV, Certificates).');
                          return;
                        }
                        if (confirm(`Are you sure you want to delete ${doc}? This action cannot be undone.`)) {
                          try {
                            const res = await fetch('/api/professional/cards', {
                              method: 'DELETE',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ title: doc })
                            });
                            if (res.ok) {
                              setDocuments(prev => prev.filter(d => d !== doc));
                              // Also remove from selected cards if it was selected
                              setSelectedCards(prev => prev.filter(c => c !== doc));
                            } else {
                              const errData = await res.json();
                              alert(errData.error || 'Failed to delete card.');
                            }
                          } catch (error) {
                            console.error('Error deleting card:', error);
                            alert('Failed to delete card.');
                          }
                        }
                      }}
                      isDark={isDark}
                    />
                  ))}
                  <AddNewCard onClick={() => setIsPopupOpen(true)} isDark={isDark} />
                </div>
              </>
            )}

            {/* Profile Info Tab Content */}
            {activeProfileTab === 'profile' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-500">
                {/* 1. Identity Card */}
                <div className={`p-8 rounded-[40px] ${isDark ? 'bg-neutral-900 border border-neutral-800' : 'bg-white border border-neutral-200 shadow-sm'}`}>
                  <div className="flex flex-col md:flex-row gap-8 items-start">

                    {/* Left: Profile Image */}
                    <div className="flex-shrink-0">
                      <div className={`w-40 h-40 md:w-48 md:h-48 rounded-[2rem] overflow-hidden border-4 ${isDark ? 'bg-neutral-800 border-neutral-800' : 'bg-neutral-100 border-white shadow-lg'}`}>
                        {/* Placeholder for now - can be updated to real image later */}
                        <div className={`w-full h-full flex items-center justify-center font-black text-6xl ${isDark ? 'text-neutral-700' : 'text-neutral-300'}`}>
                          {firstName.charAt(0)}{lastName.charAt(0)}
                        </div>
                      </div>
                    </div>

                    {/* Right: Details */}
                    <div className="flex-1 w-full space-y-6">

                      {/* Name & Role Section */}
                      <div className="space-y-2">
                        {/* Name */}
                        <div className="flex items-center gap-3 group">
                          {isEditingName ? (
                            <div className="flex gap-2 w-full max-w-md">
                              <input
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                placeholder="First Name"
                                className={`flex-1 px-4 py-2 rounded-xl font-bold text-2xl outline-none border-2 focus:border-blue-500 ${isDark ? 'bg-neutral-800 border-neutral-700 text-white' : 'bg-neutral-50 border-neutral-200 text-black'}`}
                                autoFocus
                              />
                              <input
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                placeholder="Last Name"
                                className={`flex-1 px-4 py-2 rounded-xl font-bold text-2xl outline-none border-2 focus:border-blue-500 ${isDark ? 'bg-neutral-800 border-neutral-700 text-white' : 'bg-neutral-50 border-neutral-200 text-black'}`}
                              />
                              <button onClick={() => { handleSaveProfile(); setIsEditingName(false); }} className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700"><Check size={20} /></button>
                            </div>
                          ) : (
                            <>
                              <h1 className={`text-4xl md:text-5xl font-black vide-tighter ${isDark ? 'text-white' : 'text-black'}`}>
                                {firstName || lastName ? `${firstName} ${lastName}` : <span className="text-neutral-500 text-3xl">Your Name</span>}
                              </h1>
                              <button onClick={() => setIsEditingName(true)} className={`opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-full ${isDark ? 'hover:bg-neutral-800 text-neutral-400' : 'hover:bg-neutral-100 text-neutral-500'}`}>
                                <PenLine size={24} />
                              </button>
                            </>
                          )}
                        </div>

                        {/* Role */}
                        <div className="flex items-center gap-3 group">
                          {isEditingRole ? (
                            <div className="flex gap-2 w-full max-w-md">
                              <input
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                                placeholder="Current Role (e.g. Senior Developer)"
                                className={`flex-1 px-4 py-2 rounded-xl font-medium text-lg outline-none border-2 focus:border-blue-500 ${isDark ? 'bg-neutral-800 border-neutral-700 text-neutral-300' : 'bg-neutral-50 border-neutral-200 text-neutral-700'}`}
                                autoFocus
                              />
                              <button onClick={() => { handleSaveProfile(); setIsEditingRole(false); }} className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700"><Check size={18} /></button>
                            </div>
                          ) : (
                            <>
                              <p className={`text-xl font-medium ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                                {role || 'No role set'}
                              </p>
                              <button onClick={() => setIsEditingRole(true)} className={`opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-full ${isDark ? 'hover:bg-neutral-800 text-neutral-400' : 'hover:bg-neutral-100 text-neutral-500'}`}>
                                <PenLine size={18} />
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      <div className={`h-px w-full ${isDark ? 'bg-neutral-800' : 'bg-neutral-100'}`}></div>

                      {/* Contact Info */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>Email</label>
                          <div className={`flex items-center gap-2 font-medium ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}>
                            <Mail size={16} /> {email || 'No email provided'}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <label className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>Phone</label>
                          <div className={`flex items-center gap-2 font-medium ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}>
                            <Phone size={16} /> {phone || 'No phone provided'}
                          </div>
                        </div>
                      </div>

                      {/* Profile Link */}
                      <div className="space-y-2">
                        <label className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>Profile Link</label>
                        <div className={`flex items-center p-1.5 rounded-xl border ${isDark ? 'bg-neutral-950 border-neutral-800' : 'bg-neutral-50 border-neutral-200'}`}>
                          <div className={`px-3 text-sm truncate flex-1 ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                            https://profcaria.com/p/{firstName.toLowerCase()}-{lastName.toLowerCase()}
                          </div>
                          <button className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-neutral-800 text-white' : 'hover:bg-white text-black shadow-sm'}`}>
                            <Copy size={16} />
                          </button>
                        </div>
                        <p className={`text-[10px] ${isDark ? 'text-neutral-600' : 'text-neutral-500'}`}>Share this link for others to view your professional profile.</p>
                      </div>

                      {/* Posts Activity Button */}
                      <div className="pt-2">
                        <button className={`group flex items-center gap-3 px-6 py-4 rounded-2xl w-full md:w-auto transition-all border ${isDark ? 'bg-neutral-800/50 border-neutral-700 hover:bg-neutral-800 text-white' : 'bg-white border-neutral-200 hover:border-neutral-300 shadow-sm text-black'}`}>
                          <div className="flex flex-col items-start">
                            <span className="font-black text-2xl">0</span>
                            <span className={`text-xs font-bold uppercase tracking-widest ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>Posts Published</span>
                          </div>
                          <div className={`ml-auto p-2 rounded-full ${isDark ? 'bg-neutral-700 group-hover:bg-neutral-600' : 'bg-neutral-100 group-hover:bg-neutral-200'}`}>
                            <ArrowRight size={20} />
                          </div>
                        </button>
                      </div>

                    </div>
                  </div>
                </div>
                {/* 2. Analytics Card Placeholder */}
                <div className={`p-8 rounded-[40px] grid grid-cols-3 gap-4 border ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200 shadow-sm'}`}>
                  <div className="text-center space-y-1">
                    <div className={`text-3xl font-black ${isDark ? 'text-white' : 'text-black'}`}>{followerCount}</div>
                    <div className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>Followers</div>
                  </div>
                  <div className="text-center space-y-1 border-l border-r border-neutral-200/10">
                    <div className={`text-3xl font-black ${isDark ? 'text-white' : 'text-black'}`}>0</div>
                    <div className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>Profile Visits</div>
                    <div className="text-[10px] text-green-500 font-bold">+0% this week</div>
                  </div>
                  <div className="text-center space-y-1">
                    <div className={`text-3xl font-black ${isDark ? 'text-white' : 'text-black'}`}>0</div>
                    <div className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>Post Impressions</div>
                  </div>
                </div>

                {/* 3. About Section */}
                <div className={`p-8 rounded-[40px] space-y-4 border ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200 shadow-sm'}`}>
                  <div className="flex items-center justify-between">
                    <h3 className={`text-xl font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-black'}`}>About</h3>
                    {!isEditingAbout && (
                      <button onClick={() => setIsEditingAbout(true)} className={`p-2 rounded-full ${isDark ? 'hover:bg-neutral-800 text-neutral-400' : 'hover:bg-neutral-100 text-neutral-500'}`}><PenLine size={18} /></button>
                    )}
                  </div>

                  {isEditingAbout ? (
                    <div className="space-y-4">
                      <div className="relative">
                        <textarea
                          value={about}
                          onChange={(e) => {
                            if (e.target.value.length <= 700) {
                              setAbout(e.target.value);
                            }
                          }}
                          className={`w-full h-32 p-4 rounded-2xl outline-none resize-none border-2 focus:border-blue-500 ${isDark ? 'bg-neutral-800 border-neutral-700 text-white' : 'bg-neutral-50 border-neutral-200 text-black'}`}
                          placeholder="Tell us about your professional journey..."
                          autoFocus
                        />
                        <div className={`absolute bottom-4 right-4 text-xs font-bold ${about.length >= 700 ? 'text-red-500' : isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>
                          {about.length}/700
                        </div>
                      </div>
                      <div className="flex justify-end gap-3">
                        <button onClick={() => setIsEditingAbout(false)} className={`px-4 py-2 rounded-xl font-bold text-sm ${isDark ? 'text-neutral-400 hover:bg-neutral-800' : 'text-neutral-500 hover:bg-neutral-100'}`}>Cancel</button>
                        <button onClick={() => { handleSaveProfile(); setIsEditingAbout(false); }} className="px-6 py-2 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700">Save Bio</button>
                      </div>
                    </div>
                  ) : (
                    <p className={`leading-relaxed whitespace-pre-wrap ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                      {about || 'Share your professional background, key achievements, and current focus. (Max 700 characters)'}
                    </p>
                  )}
                </div>
                {/* 4. Sections List (Employment, Education, etc) */}
                <div className="space-y-4">
                  {['Employment History', 'Education', 'Skills', 'Licenses & Certifications', 'Honors & Awards'].map((section) => (
                    <div key={section} className={`p-6 rounded-[32px] border ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-neutral-100 border-neutral-200'} opacity-60`}>
                      <h3 className={`text-lg font-bold ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>{section}</h3>
                    </div>
                  ))}
                  <button className={`w-full py-6 rounded-[32px] border-2 border-dashed font-bold flex items-center justify-center gap-2 transition-all ${isDark ? 'border-neutral-800 text-neutral-500 hover:border-neutral-700 hover:text-neutral-300' : 'border-neutral-200 text-neutral-400 hover:border-neutral-300 hover:text-neutral-600'}`}>
                    <Plus size={20} /> Add Section
                  </button>
                </div>
              </div>
            )}

            {/* Job Preferences Tab Content */}
            {activeProfileTab === 'preferences' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-500">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className={`border p-6 rounded-[32px] space-y-4 ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200 shadow-sm'}`}>
                    <h3 className={`text-xl font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-black'}`}><Briefcase className={isDark ? 'text-neutral-400' : 'text-neutral-600'} size={24} /> Target Roles</h3>
                    <p className={`text-xs ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>Add job titles you're interested in.</p>
                    <div className="flex gap-2">
                      <input type="text" value={targetRoleInput} onChange={(e) => setTargetRoleInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && targetRoleInput) { setTargetRoles([...targetRoles, targetRoleInput]); setTargetRoleInput(''); } }} placeholder="Type role and hit Enter..." className={`flex-1 border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 transition-all font-bold ${isDark ? 'bg-neutral-800 border-neutral-700 text-white focus:ring-neutral-600' : 'bg-white border-neutral-200 text-black focus:ring-neutral-200'}`} />
                    </div>
                    <div className="flex flex-wrap gap-2">{targetRoles.map((r, i) => (<div key={i} className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border ${isDark ? 'bg-white/10 text-white border-white/20' : 'bg-black/5 text-black border-black/10'}`}>{r}<button onClick={() => setTargetRoles(targetRoles.filter((_, idx) => idx !== i))} className="hover:opacity-70"><X size={12} /></button></div>))}</div>
                  </div>
                  <div className={`border p-6 rounded-[32px] space-y-4 ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200 shadow-sm'}`}>
                    <h3 className={`text-xl font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-black'}`}><Globe className={isDark ? 'text-neutral-400' : 'text-neutral-600'} size={24} /> Preferred Locations</h3>
                    <p className={`text-xs ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>Countries where you'd like to work.</p>
                    <div className="flex gap-2">
                      <input type="text" value={locationInput} onChange={(e) => setLocationInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && locationInput) { setPreferredCountries([...preferredCountries, locationInput]); setLocationInput(''); } }} placeholder="Type country and hit Enter..." className={`flex-1 border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 transition-all font-bold ${isDark ? 'bg-neutral-800 border-neutral-700 text-white focus:ring-neutral-600' : 'bg-white border-neutral-200 text-black focus:ring-neutral-200'}`} />
                    </div>
                    <div className="flex flex-wrap gap-2">{preferredCountries.map((c, i) => (<div key={i} className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border ${isDark ? 'bg-neutral-800 text-neutral-300 border-neutral-700' : 'bg-neutral-100 text-neutral-700 border-neutral-200'}`}>{c}<button onClick={() => setPreferredCountries(preferredCountries.filter((_, idx) => idx !== i))} className="hover:opacity-70"><X size={12} /></button></div>))}</div>
                    <label className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${isDark ? 'bg-neutral-800/50 hover:bg-neutral-800' : 'bg-white border border-neutral-200 hover:bg-neutral-50'}`}>
                      <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${isOpenToRelocation ? (isDark ? 'bg-white border-white' : 'bg-black border-black') : isDark ? 'border-neutral-600' : 'border-neutral-300'}`}>{isOpenToRelocation && <Check size={14} className={isDark ? 'text-black' : 'text-white'} />}</div>
                      <input type="checkbox" checked={isOpenToRelocation} onChange={(e) => setIsOpenToRelocation(e.target.checked)} className="hidden" />
                      <span className={`text-sm font-bold ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}>Open to relocation</span>
                    </label>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className={`border p-6 rounded-[32px] space-y-2 ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200 shadow-sm'}`}>
                    <h3 className={`text-xl font-bold flex items-center gap-2 mb-4 ${isDark ? 'text-white' : 'text-black'}`}><Activity className={isDark ? 'text-neutral-400' : 'text-neutral-600'} size={24} /> Work Mode</h3>
                    {['remote', 'onsite', 'hybrid'].map((mode) => (<label key={mode} className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all group ${isDark ? 'bg-neutral-800/50 hover:bg-neutral-800' : 'bg-white border border-neutral-200 hover:bg-neutral-50'}`}><span className={`font-bold capitalize transition-colors ${isDark ? 'text-neutral-300 group-hover:text-white' : 'text-neutral-600 group-hover:text-black'}`}>{mode}</span><div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${workModes.includes(mode) ? (isDark ? 'bg-white border-white' : 'bg-black border-black') : isDark ? 'border-neutral-600' : 'border-neutral-300'}`}>{workModes.includes(mode) && <Check size={14} className={isDark ? 'text-black' : 'text-white'} />}</div><input type="checkbox" checked={workModes.includes(mode)} onChange={(e) => { if (e.target.checked) setWorkModes([...workModes, mode]); else setWorkModes(workModes.filter(m => m !== mode)); }} className="hidden" /></label>))}
                  </div>
                  <div className={`border p-6 rounded-[32px] space-y-2 ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200 shadow-sm'}`}>
                    <h3 className={`text-xl font-bold flex items-center gap-2 mb-4 ${isDark ? 'text-white' : 'text-black'}`}><Briefcase className={isDark ? 'text-neutral-400' : 'text-neutral-600'} size={24} /> Employment Type</h3>
                    {['full-time', 'part-time', 'contract', 'internship'].map((type) => (<label key={type} className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all group ${isDark ? 'bg-neutral-800/50 hover:bg-neutral-800' : 'bg-white border border-neutral-200 hover:bg-neutral-50'}`}><span className={`font-bold capitalize transition-colors ${isDark ? 'text-neutral-300 group-hover:text-white' : 'text-neutral-600 group-hover:text-black'}`}>{type}</span><div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${employmentTypes.includes(type) ? (isDark ? 'bg-white border-white' : 'bg-black border-black') : isDark ? 'border-neutral-600' : 'border-neutral-300'}`}>{employmentTypes.includes(type) && <Check size={14} className={isDark ? 'text-black' : 'text-white'} />}</div><input type="checkbox" checked={employmentTypes.includes(type)} onChange={(e) => { if (e.target.checked) setEmploymentTypes([...employmentTypes, type]); else setEmploymentTypes(employmentTypes.filter(t => t !== type)); }} className="hidden" /></label>))}
                  </div>
                </div>
                <div className="flex justify-end">
                  <button onClick={handleSavePreferences} disabled={profileLoading} className={`px-8 py-4 rounded-xl font-black uppercase tracking-widest text-xs transition-all shadow-xl active:scale-95 disabled:opacity-50 ${isDark ? 'bg-white text-black hover:bg-neutral-200' : 'bg-black text-white hover:bg-neutral-800'}`}>
                    <Save size={18} className="inline mr-2" />
                    {profileLoading ? 'Saving...' : 'Save Preferences'}
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* --- THE SLIDER (OVERLAY) --- */}
      <div
        className={`
                fixed inset-0 z-[105] h-[100dvh] border-l backdrop-blur-2xl flex flex-col
                transition-all duration-500 ease-in-out
                ${isDark ? 'bg-black border-neutral-800' : 'bg-[#f8fafe] border-neutral-200'}
                ${activeDocument ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0 pointer-events-none'}
            `}
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <div className={`flex flex-wrap items-center gap-4 p-4 border-b shrink-0 z-10 backdrop-blur-md sticky top-0 justify-between ${isDark ? 'bg-black/90 border-neutral-800' : 'bg-white/90 border-neutral-200'}`}>
          <div className="flex flex-wrap items-center gap-3 md:gap-4">
            <button
              onClick={saveContent}
              className={`relative flex items-center justify-center w-9 h-9 rounded-full border transition-all duration-300 group ${isDark ? 'border-neutral-700 bg-neutral-800' : 'border-neutral-300 bg-white shadow-sm hover:border-black'} ${isSaving ? 'scale-90' : 'hover:scale-105 active:scale-95'}`}
            >
              {isSaving && <span className={`absolute inset-0 rounded-full animate-ping ${isDark ? 'bg-white/30' : 'bg-black/10'}`}></span>}
              <span className={`text-[9px] font-bold transition-colors ${isSaving ? (isDark ? 'text-white' : 'text-black') : isDark ? 'text-neutral-500 group-hover:text-white' : 'text-neutral-500 group-hover:text-black'}`}>SAVE</span>
            </button>

            <div className={`w-px h-6 hidden sm:block ${isDark ? 'bg-neutral-800' : 'bg-neutral-300'}`}></div>

            <div className={`flex items-center gap-0.5 rounded-lg p-0.5 border overflow-x-auto max-w-[200px] md:max-w-none ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-300'}`} style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              <button onClick={() => execCommand('justifyLeft')} className={`p-1.5 transition-colors rounded ${formats.alignLeft ? (isDark ? 'text-white bg-white/10' : 'text-black bg-neutral-100') : isDark ? 'text-neutral-500 hover:text-white' : 'text-slate-500 hover:bg-slate-50 hover:text-black'}`}><AlignLeft size={16} /></button>
              <button onClick={() => execCommand('justifyCenter')} className={`p-1.5 transition-colors rounded ${formats.alignCenter ? (isDark ? 'text-white bg-white/10' : 'text-black bg-neutral-100') : isDark ? 'text-neutral-500 hover:text-white' : 'text-slate-500 hover:bg-slate-50 hover:text-black'}`}><AlignCenter size={16} /></button>
              <button onClick={() => execCommand('justifyRight')} className={`p-1.5 transition-colors rounded ${formats.alignRight ? (isDark ? 'text-white bg-white/10' : 'text-black bg-neutral-100') : isDark ? 'text-neutral-500 hover:text-white' : 'text-slate-500 hover:bg-slate-50 hover:text-black'}`}><AlignRight size={16} /></button>
              <div className={`w-px h-4 mx-0.5 shrink-0 ${isDark ? 'bg-neutral-700' : 'bg-neutral-300'}`}></div>
              <button onClick={() => execCommand('insertOrderedList')} className={`p-1.5 transition-colors rounded ${formats.orderedList ? (isDark ? 'text-white bg-white/10' : 'text-black bg-neutral-100') : isDark ? 'text-neutral-500 hover:text-white' : 'text-slate-500 hover:bg-slate-50 hover:text-black'}`}><ListOrdered size={16} /></button>
              <button onClick={() => execCommand('insertUnorderedList')} className={`p-1.5 transition-colors rounded ${formats.unorderedList ? (isDark ? 'text-white bg-white/10' : 'text-black bg-neutral-100') : isDark ? 'text-neutral-500 hover:text-white' : 'text-slate-500 hover:bg-slate-50 hover:text-black'}`}><List size={16} /></button>
            </div>

            {/* FONT SELECTOR */}
            <div className="relative z-50">
              <div className="flex items-center gap-2">
                {/* Font Family */}
                <div className="relative">
                  <button
                    onClick={() => setShowFontPicker(!showFontPicker)}
                    className={`flex items-center gap-2 px-3 py-2 border rounded-lg transition-all min-w-[140px] ${isDark ? 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:text-white hover:border-neutral-600' : 'bg-white border-neutral-300 text-slate-600 hover:border-neutral-400 hover:text-black shadow-sm'}`}
                  >
                    <Type size={16} />
                    <span className="text-xs font-bold truncate flex-1 text-left">{currentFont}</span>
                    <ChevronDown size={14} />
                  </button>
                  {showFontPicker && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowFontPicker(false)}></div>
                      <div className={`absolute top-full left-0 mt-2 w-48 max-h-64 overflow-y-auto border rounded-xl shadow-2xl z-50 py-2 ${isDark ? 'bg-neutral-900 border-neutral-700' : 'bg-white border-neutral-200'}`} style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                        {FONTS.map(font => (
                          <button
                            key={font}
                            onClick={() => {
                              execCommand('fontName', font === 'Default' ? 'inherit' : font);
                              setCurrentFont(font);
                              setShowFontPicker(false);
                            }}
                            className={`w-full text-left px-4 py-2 text-sm transition-colors ${isDark ? 'text-neutral-300 hover:bg-white/10 hover:text-white' : 'text-slate-600 hover:bg-neutral-50 hover:text-black'}`}
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
                    className={`flex items-center gap-2 px-3 py-2 border rounded-lg transition-all min-w-[70px] ${isDark ? 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:text-white hover:border-neutral-600' : 'bg-white border-neutral-300 text-slate-600 hover:border-neutral-400 hover:text-black shadow-sm'}`}
                  >
                    <span className="text-xs font-bold truncate flex-1 text-center">
                      {FONT_SIZES.find(s => s.value === currentFontSize)?.label || "Size"}
                    </span>
                    <ChevronDown size={14} />
                  </button>
                  {showFontSizePicker && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowFontSizePicker(false)}></div>
                      <div className={`absolute top-full left-0 mt-2 w-24 border rounded-xl shadow-2xl z-50 py-2 ${isDark ? 'bg-neutral-900 border-neutral-700' : 'bg-white border-neutral-200'}`}>
                        {FONT_SIZES.map(size => (
                          <button
                            key={size.value}
                            onClick={() => {
                              execCommand('fontSize', size.value);
                              setCurrentFontSize(size.value);
                              setShowFontSizePicker(false);
                            }}
                            className={`w-full text-left px-4 py-2 text-sm transition-colors ${isDark ? 'text-neutral-300 hover:bg-white/10 hover:text-white' : 'text-slate-600 hover:bg-neutral-50 hover:text-black'}`}
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

            <div className={`flex items-center gap-1 rounded-lg p-1 border hidden md:flex ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-300'}`}>
              <button onClick={() => toggleHeading('H1')} className={`flex items-center gap-2 px-3 py-2 rounded transition-colors ${formats.h1 ? (isDark ? 'bg-white/10 text-white' : 'bg-neutral-100 text-black') : isDark ? 'text-neutral-500 hover:text-white' : 'text-slate-500 hover:bg-slate-50 hover:text-black'}`}><Heading1 size={20} /><span className="text-xs font-bold uppercase hidden lg:inline">Title</span></button>
              <button onClick={() => toggleHeading('H2')} className={`flex items-center gap-2 px-3 py-2 rounded transition-colors ${formats.h2 ? (isDark ? 'bg-white/10 text-white' : 'bg-neutral-100 text-black') : isDark ? 'text-neutral-500 hover:text-white' : 'text-slate-500 hover:bg-slate-50 hover:text-black'}`}><Heading2 size={18} /><span className="text-xs font-bold uppercase hidden lg:inline">Sub</span></button>
              <button onClick={() => toggleHeading('H3')} className={`flex items-center gap-2 px-3 py-2 rounded transition-colors ${formats.h3 ? (isDark ? 'bg-white/10 text-white' : 'bg-neutral-100 text-black') : isDark ? 'text-neutral-500 hover:text-white' : 'text-slate-500 hover:bg-slate-50 hover:text-black'}`}><Heading3 size={16} /><span className="text-xs font-bold uppercase hidden lg:inline">Head</span></button>
            </div>

            <div className={`flex items-center gap-1 rounded-lg p-1 border ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-300'}`}>
              <button onClick={() => execCommand('bold')} className={`p-2 transition-colors rounded ${formats.bold ? (isDark ? 'text-white bg-white/10' : 'text-black bg-neutral-100') : isDark ? 'text-neutral-500 hover:text-white' : 'text-slate-500 hover:bg-slate-50 hover:text-black'}`}><Bold size={18} /></button>
              <button onClick={() => execCommand('italic')} className={`p-2 transition-colors rounded ${formats.italic ? (isDark ? 'text-white bg-white/10' : 'text-black bg-neutral-100') : isDark ? 'text-neutral-500 hover:text-white' : 'text-slate-500 hover:bg-slate-50 hover:text-black'}`}><Italic size={18} /></button>
              <button onClick={() => execCommand('underline')} className={`p-2 transition-colors rounded ${formats.underline ? (isDark ? 'text-white bg-white/10' : 'text-black bg-neutral-100') : isDark ? 'text-neutral-500 hover:text-white' : 'text-slate-500 hover:bg-slate-50 hover:text-black'}`}><Underline size={18} /></button>

              <div className="relative group p-2">
                <button
                  onClick={() => setShowColorPicker(!showColorPicker)}
                  className={`transition-colors ${isDark ? 'text-neutral-500 hover:text-white' : 'text-slate-500 hover:text-black'}`}
                >
                  <Palette size={18} />
                </button>

                {showColorPicker && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowColorPicker(false)}></div>
                    <div className={`absolute top-full right-0 mt-2 p-3 border rounded-xl shadow-2xl z-50 w-[200px] ${isDark ? 'bg-neutral-900 border-neutral-700' : 'bg-white border-neutral-200'}`}>
                      <div className="grid grid-cols-6 gap-2">
                        {COLORS.map(color => (
                          <button
                            key={color}
                            onClick={() => {
                              execCommand('foreColor', color);
                              setShowColorPicker(false);
                            }}
                            className={`w-6 h-6 rounded-full border hover:scale-110 transition-transform ${isDark ? 'border-neutral-600' : 'border-neutral-300'}`}
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
                <ImageIcon size={18} className={`cursor-pointer ${isDark ? 'text-neutral-500 group-hover:text-white' : 'text-slate-500 group-hover:text-black'}`} />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
              </div>

              {/* Link button with inline popover */}
              <div className="relative">
                <button onClick={addLink} className={`p-2 transition-colors rounded ${isDark ? 'text-neutral-500 hover:text-white' : 'text-slate-500 hover:text-black'}`}><LinkIcon size={18} /></button>

                {showLinkInput && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowLinkInput(false)}></div>
                    <div className={`absolute top-full left-0 sm:left-auto sm:right-0 mt-2 p-3 border rounded-xl shadow-2xl z-50 w-[calc(100vw-2rem)] max-w-[280px] ${isDark ? 'bg-neutral-900 border-neutral-700' : 'bg-white border-neutral-200'}`}>
                      <div className={`text-xs mb-2 font-medium ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>Enter URL:</div>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          ref={linkInputRef}
                          type="text"
                          value={linkInputUrl}
                          onChange={(e) => setLinkInputUrl(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') confirmLink();
                            if (e.key === 'Escape') setShowLinkInput(false);
                          }}
                          placeholder="https://example.com"
                          className={`flex-1 min-w-0 border rounded-lg px-3 py-2 text-sm focus:outline-none ${isDark ? 'bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-600' : 'bg-neutral-50 border-neutral-200 text-black placeholder:text-neutral-400'}`}
                        />
                        <button
                          onClick={confirmLink}
                          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors shrink-0 ${isDark ? 'bg-white text-black hover:bg-neutral-200' : 'bg-black text-white hover:bg-neutral-800'}`}
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={() => setActiveDocument(null)}
            className={`p-2 rounded-full transition-all duration-300 group ${isDark ? 'text-neutral-500 hover:text-white hover:bg-white/10' : 'text-neutral-400 hover:text-black hover:bg-black/5'}`}
          >
            <X size={24} className="group-hover:rotate-90 transition-transform duration-300" />
          </button>
        </div>

        <ScrollableContainer className="p-4 md:p-8 flex-1">
          <div className={`max-w-4xl mx-auto pb-40 ${isDark ? '' : 'bg-white shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] border border-neutral-200 min-h-[1100px] p-12 md:p-20 rounded-sm'}`}>
            <div className={`mb-8 border-b pb-4 ${isDark ? 'border-slate-800' : 'border-neutral-100'}`}>
              <div className="flex items-center gap-3 group/title">
                {isEditingTitle ? (
                  <input
                    ref={titleInputRef}
                    type="text"
                    value={editableTitle}
                    onChange={(e) => setEditableTitle(e.target.value.toUpperCase())}
                    onBlur={() => {
                      if (activeDocument) {
                        handleRenameCard(activeDocument, editableTitle);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && activeDocument) {
                        handleRenameCard(activeDocument, editableTitle);
                      } else if (e.key === 'Escape') {
                        setIsEditingTitle(false);
                        setEditableTitle(activeDocument || '');
                      }
                    }}
                    className={`text-4xl font-black uppercase tracking-tight bg-transparent border-b-2 focus:outline-none transition-colors ${isDark ? 'border-neutral-700 text-white focus:border-white' : 'border-neutral-300 text-black focus:border-black'}`}
                    style={{ width: `${Math.max(editableTitle.length * 28, 150)}px` }}
                  />
                ) : (
                  <>
                    <h1 className={`text-4xl font-black uppercase tracking-tight ${isDark ? 'text-white' : 'text-black'}`}>{activeDocument || 'Untitled'}</h1>
                    {activeDocument && !isBaseCard(activeDocument) && (
                      <button
                        onClick={startEditingTitle}
                        className={`p-2 rounded-lg transition-all opacity-0 group-hover/title:opacity-100 ${isDark ? 'text-neutral-400 hover:text-white hover:bg-white/10' : 'text-slate-400 hover:text-black hover:bg-black/5'}`}
                        title="Rename card"
                      >
                        <Pencil size={18} />
                      </button>
                    )}
                  </>
                )}
              </div>
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
              className={`
                w-full focus:outline-none 
                empty:before:content-['Start_typing...'] empty:before:text-slate-500 empty:before:pointer-events-none
                ${isDark ? 'text-neutral-300' : 'text-black'}
                [&_ol]:list-decimal [&_ol]:ml-4 [&_ul]:list-disc [&_ul]:ml-4
                [&_img]:max-w-full [&_img]:max-h-[400px] [&_img]:object-contain [&_img]:rounded-xl [&_img]:my-4 [&_img]:shadow-lg
                [&_a]:underline [&_a]:cursor-pointer ${isDark ? '[&_a]:text-neutral-300 [&_a]:decoration-neutral-500' : '[&_a]:text-black [&_a]:decoration-black'}
              `}
              style={{
                minHeight: '1000px',
                fontSize: `${fontSize}px`,
                lineHeight: '1.7',
                whiteSpace: 'pre-wrap'
              }}
              onInput={checkFormats}
              onMouseUp={checkFormats}
              onKeyDown={handleEditorKeyDown}
              onKeyUp={checkFormats}
              onPaste={handleEditorPaste}
              onClick={handleEditorClick}
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
        isDark={isDark}
      />

      <SystemPopup
        isOpen={isPopupOpen}
        onClose={() => setIsPopupOpen(false)}
        onSave={handleAddDocument}
        isDark={isDark}
      />

      {/* Link Preview Popup */}
      {linkPreviewUrl && linkPreviewPosition && (
        <LinkPreview
          url={linkPreviewUrl}
          position={linkPreviewPosition}
          onClose={closeLinkPreview}
          onInsert={() => insertLinkFromPreview()}
        />
      )}
    </>
  );
}
