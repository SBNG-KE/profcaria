"use client"

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  FileText, Plus, X, Clock,
  Bold, Italic, Underline, Link as LinkIcon,
  Heading1, Heading2, Heading3,
  AlignLeft, AlignCenter, AlignRight,
  List, ListOrdered, Image as ImageIcon, Palette,
  Shield, Check, ChevronDown, Type, Share2, Pencil,
  GraduationCap, Award, BadgeCheck, Briefcase, Link2, Trash2, PenLine, Move, Copy,
  Building2, Globe, MapPin, Mail, Camera, Save, Loader2, ArrowRight,
  Eye, ThumbsUp, MessageSquare, MoreHorizontal, User, Activity, Phone, Users, Repeat2,
  Upload, FileUp, Download, Replace, File
} from 'lucide-react';
import VerificationBadge from '@/app/components/VerificationBadge';
import SlideOverPanel from '@/app/components/ui/SlideOverPanel';
import LinkPreview from '@/app/components/LinkPreview';
import ProfileAnalytics from '@/app/components/professional/ProfileAnalytics';
import PostsPreview from '@/app/components/professional/PostsPreview';
import PostCard from '@/app/components/professional/PostCard';
import { useTheme } from '@/app/context/ThemeContext';
import { EXPERIENCE_YEAR_RANGES } from '@/lib/experience-level';
import ProfileInfoSection from '@/app/components/professional/ProfileInfoSection';
import { SearchableDropdown } from '@/app/components/SearchableDropdown';
import { getNames } from 'country-list';

const COUNTRIES = getNames().sort();
const CONTINENTS = [
  "Africa", "Antarctica", "Asia", "Europe", "North America", "Oceania", "South America"
].map(c => ({ value: c, label: c }));

const COUNTRY_OPTIONS = COUNTRIES.map(c => ({ value: c, label: c }));

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
              <p className={`text-xs ${isDark ? 'text-neutral-500' : 'text-neutral-600'}`}>Enable cards for employer visibility.</p>
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
          <p className={`text-xs ${isDark ? 'text-neutral-500' : 'text-neutral-600'}`}>This will create a new encrypted section in your professional profile.</p>
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
  const [userId, setUserId] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [about, setAbout] = useState('');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [shortUrl, setShortUrl] = useState('');
  const [profileImageUrl, setProfileImageUrl] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);
  const [isAvailableForHire, setIsAvailableForHire] = useState<boolean>(true);
  const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [followerCount, setFollowerCount] = useState(0);
  const [badgeType, setBadgeType] = useState<string | null>(null);

  // Inline Editing State
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingRole, setIsEditingRole] = useState(false);
  const [isEditingContact, setIsEditingContact] = useState(false);
  const [isEditingAbout, setIsEditingAbout] = useState(false);
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [isEditingPhone, setIsEditingPhone] = useState(false);

  // Job Preferences state (moved from Settings)
  const [targetRoleInput, setTargetRoleInput] = useState('');
  const [targetRoles, setTargetRoles] = useState<string[]>([]);
  const [workModes, setWorkModes] = useState<string[]>([]);
  const [employmentTypes, setEmploymentTypes] = useState<string[]>([]);
  const [preferredCountries, setPreferredCountries] = useState<string[]>([]);
  const [preferredContinents, setPreferredContinents] = useState<string[]>([]);
  const [locationInput, setLocationInput] = useState('');
  const [isOpenToRelocation, setIsOpenToRelocation] = useState(false);
  const [experienceYearRanges, setExperienceYearRanges] = useState<string[]>([]);

  // Image Positioning State (Professional)
  const [imagePosition, setImagePosition] = useState<string>('50% 50%');
  const [isRepositioning, setIsRepositioning] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number, y: number } | null>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Initialize position to center/top/bottom if legacy
  useEffect(() => {
    // Check if we need to convert legacy keywords
    if (imagePosition === 'center' || imagePosition === 'top' || imagePosition === 'bottom') {
      if (imagePosition === 'center') setImagePosition('50% 50%');
      else if (imagePosition === 'top') setImagePosition('50% 0%');
      else if (imagePosition === 'bottom') setImagePosition('50% 100%');
    }
  }, []); // Run once on mount if state was preloaded (or relies on useEffect below)

  // Actually, imagePosition is initialized from API in fetchDashboardData
  // We should add a conversion there or a useEffect listening to it?
  // Let's add a useEffect that listens to changes but only converts if it's a keyword
  useEffect(() => {
    if (imagePosition === 'center') setImagePosition('50% 50%');
    else if (imagePosition === 'top') setImagePosition('50% 0%');
    else if (imagePosition === 'bottom') setImagePosition('50% 100%');
  }, [imagePosition]);


  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isRepositioning) return;
    e.preventDefault();
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  // Global Drag Logic
  useEffect(() => {
    if (!isRepositioning || !dragStart) return;

    const handleWindowMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;

      const sensitivity = 0.2;

      let [currentX, currentY] = [50, 50];
      try {
        const parts = imagePosition.split(' ');
        if (parts.length === 2 && parts[0].endsWith('%')) {
          currentX = parseFloat(parts[0]);
          currentY = parseFloat(parts[1]);
        }
      } catch (err) { }

      let newX = currentX - (deltaX * sensitivity);
      let newY = currentY - (deltaY * sensitivity);

      newX = Math.max(0, Math.min(100, newX));
      newY = Math.max(0, Math.min(100, newY));

      setImagePosition(`${newX.toFixed(1)}% ${newY.toFixed(1)}%`);
      setDragStart({ x: e.clientX, y: e.clientY });
    };

    const handleWindowMouseUp = () => {
      setDragStart(null);
    };

    window.addEventListener('mousemove', handleWindowMouseMove);
    window.addEventListener('mouseup', handleWindowMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);
    };
  }, [isRepositioning, dragStart, imagePosition]);

  const handleCopyLink = async () => {
    try {
      // Use unified share API for clean short links
      const res = await fetch(`/api/share?type=profile&userType=professional&id=${userId}`);
      if (res.ok) {
        const { link } = await res.json();
        await navigator.clipboard.writeText(link);
        setProfileMessage({ type: 'success', text: 'Profile link copied!' });
      } else {
        // Fallback to direct link if API fails
        const fallbackLink = `${window.location.origin}/${firstName}-${lastName}`.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        await navigator.clipboard.writeText(fallbackLink);
        setProfileMessage({ type: 'success', text: 'Profile link copied!' });
      }
    } catch (err) {
      console.error(err);
      const fallbackLink = `${window.location.origin}/${firstName}-${lastName}`.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      navigator.clipboard.writeText(fallbackLink);
      setProfileMessage({ type: 'success', text: 'Profile link copied!' });
    }
    setTimeout(() => setProfileMessage(null), 3000);
  };

  const [documents, setDocuments] = useState<string[]>(['RESUME', 'CV', 'COVER LETTER']);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [isAccessModalOpen, setIsAccessModalOpen] = useState(false);
  const [selectedCards, setSelectedCards] = useState<string[]>(['RESUME']);

  // --- NEW PROFILE SECTIONS STATE ---
  const [employmentHistory, setEmploymentHistory] = useState<any[]>([]);
  const [education, setEducation] = useState<any[]>([]);
  const [skills, setSkills] = useState<any[]>([]);
  const [certifications, setCertifications] = useState<any[]>([]);
  const [awards, setAwards] = useState<any[]>([]);
  const [otherProfiles, setOtherProfiles] = useState<any[]>([]);

  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [isSlideOverOpen, setIsSlideOverOpen] = useState(false);
  const [sectionLoading, setSectionLoading] = useState(false);
  const [formData, setFormData] = useState<any>({}); // Form data for active section

  const [activeDocument, setActiveDocument] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const [fontSize, setFontSize] = useState(16);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showFontPicker, setShowFontPicker] = useState(false);
  const [showFontSizePicker, setShowFontSizePicker] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const magicImportInputRef = useRef<HTMLInputElement>(null); const [currentFont, setCurrentFont] = useState('Default');
  const [currentFontSize, setCurrentFontSize] = useState('3'); // Default 16px

  // Posts State
  const [isPostsPanelOpen, setIsPostsPanelOpen] = useState(false);
  const [activePostsTab, setActivePostsTab] = useState<'posts' | 'reposts' | 'saved'>('posts');
  const [profilePosts, setProfilePosts] = useState<any[]>([]);
  const [isProfilePostsLoading, setIsProfilePostsLoading] = useState(false);

  // Document Upload Mode State
  const [documentMode, setDocumentMode] = useState<'writing' | 'upload'>('writing');
  const [shareDocMode, setShareDocMode] = useState<'writing' | 'upload'>('writing'); // Which mode to share with employers
  const [uploadedDocuments, setUploadedDocuments] = useState<any[]>([]);
  const [isUploadLoading, setIsUploadLoading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [renamingDocId, setRenamingDocId] = useState<string | null>(null);
  const [renamingValue, setRenamingValue] = useState('');
  const uploadInputRef = useRef<HTMLInputElement>(null);

  // State for editable title
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editableTitle, setEditableTitle] = useState('');


  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null); // For Editor
  const profileImageInputRef = useRef<HTMLInputElement>(null); // For Profile
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

  const fetchProfile = async () => {
    setProfileLoading(true);
    try {
      const userRes = await fetch('/api/auth/me');
      if (userRes.ok) {
        const userData = await userRes.json();
        if (userData.profile) {
          setUserId(userData.user?.id || userData.id || '');
          setFirstName(userData.profile.firstName || '');
          setLastName(userData.profile.lastName || '');
          setEmail(userData.profile.email || '');
          setPhone(userData.profile.phoneNumber || userData.profile.phone || '');
          setRole(userData.profile.role || '');
          setAbout(userData.profile.about || '');
          setCountry(userData.profile.country || 'Auto-detected');
          setCity(userData.profile.city || 'Auto-detected');
          setShortUrl(userData.profile.shortUrl || '');
          setProfileImageUrl(userData.profile.profileImageUrl || '');
          setImagePosition(userData.profile.imagePosition || 'center');
          setBadgeType(userData.profile.badgeType || 'none');
          setIsAvailableForHire(userData.profile.isAvailableForHire ?? true);
        }
      }
    } catch (error) {
      console.error("Error fetching user profile", error);
    } finally {
      setProfileLoading(false);
    }
  };

  const fetchDocuments = async () => {
    try {
      const [cardRes, accessRes, uploadRes, modeRes] = await Promise.all([
        fetch('/api/professional/cards'),
        fetch('/api/documents?type=access_control'),
        fetch('/api/professional/documents/upload'),
        fetch('/api/professional/documents/mode'),
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
      if (uploadRes.ok) {
        const data = await uploadRes.json();
        if (data.documents) setUploadedDocuments(data.documents);
      }
      if (modeRes.ok) {
        const data = await modeRes.json();
        if (data.mode) setShareDocMode(data.mode);
      }
    } catch (error) {
      console.error("Error fetching documents", error);
    }
  };

  // Upload document functions
  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setIsUploadLoading(true);
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('name', file.name.replace(/\.[^/.]+$/, '')); // Remove extension for display name

        const res = await fetch('/api/professional/documents/upload', {
          method: 'POST',
          body: formData
        });

        if (res.ok) {
          const data = await res.json();
          setUploadedDocuments(prev => [data.document, ...prev]);
        } else {
          const err = await res.json();
          alert(err.error || 'Failed to upload file');
        }
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload file');
    } finally {
      setIsUploadLoading(false);
    }
  };

  const handleDeleteUploadedDoc = async (docId: string) => {
    if (!confirm('Are you sure you want to delete this file?')) return;

    try {
      const res = await fetch(`/api/professional/documents/upload?id=${docId}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        setUploadedDocuments(prev => prev.filter(d => d.id !== docId));
      } else {
        alert('Failed to delete file');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete file');
    }
  };

  const handleRenameUploadedDoc = async (docId: string, newName: string) => {
    if (!newName.trim()) {
      setRenamingDocId(null);
      return;
    }

    try {
      const formData = new FormData();
      formData.append('id', docId);
      formData.append('name', newName);

      const res = await fetch('/api/professional/documents/upload', {
        method: 'PUT',
        body: formData
      });

      if (res.ok) {
        setUploadedDocuments(prev => prev.map(d =>
          d.id === docId ? { ...d, name: newName } : d
        ));
      } else {
        alert('Failed to rename file');
      }
    } catch (error) {
      console.error('Rename error:', error);
      alert('Failed to rename file');
    } finally {
      setRenamingDocId(null);
    }
  };

  const handleReplaceFile = async (docId: string, file: File) => {
    setIsUploadLoading(true);
    try {
      const formData = new FormData();
      formData.append('id', docId);
      formData.append('file', file);

      const res = await fetch('/api/professional/documents/upload', {
        method: 'PUT',
        body: formData
      });

      if (res.ok) {
        // Refresh the list
        const uploadRes = await fetch('/api/professional/documents/upload');
        if (uploadRes.ok) {
          const data = await uploadRes.json();
          setUploadedDocuments(data.documents || []);
        }
      } else {
        alert('Failed to replace file');
      }
    } catch (error) {
      console.error('Replace error:', error);
      alert('Failed to replace file');
    } finally {
      setIsUploadLoading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('word') || fileType.includes('document')) return '📝';
    if (fileType.includes('image')) return '🖼️';
    return '📎';
  };

  const handleShareModeChange = async (mode: 'writing' | 'upload') => {
    try {
      const res = await fetch('/api/professional/documents/mode', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode })
      });
      if (res.ok) {
        setShareDocMode(mode);
      } else {
        alert('Failed to update preference');
      }
    } catch (error) {
      console.error('Error updating share mode:', error);
      alert('Failed to update preference');
    }
  };

  const fetchPreferences = async () => {
    try {
      const prefsRes = await fetch('/api/professional/preferences');
      if (prefsRes.ok) {
        const prefsData = await prefsRes.json();
        if (prefsData.preferences) {
          const prefs = prefsData.preferences;
          setTargetRoles(prefs.target_roles || []);
          setWorkModes(prefs.work_modes || []);
          setEmploymentTypes(prefs.employment_types || []);
          setPreferredCountries(prefs.preferred_locations?.countries || []);
          setIsOpenToRelocation(prefs.is_open_to_relocation || false);
          setExperienceYearRanges(prefs.experience_years_ranges || []);
        }
      }
    } catch (error) {
      console.error("Error fetching preferences", error);
    }
  };

  const fetchSections = async () => {
    try {
      const [empRes, eduRes, skillRes, certRes, awardRes, otherRes] = await Promise.all([
        fetch('/api/professional/profile/employment'),
        fetch('/api/professional/profile/sections/education'),
        fetch('/api/professional/profile/sections/skills'),
        fetch('/api/professional/profile/sections/certifications'),
        fetch('/api/professional/profile/sections/awards'),
        fetch('/api/professional/profile/sections/other_profiles')
      ]);

      if (empRes.ok) setEmploymentHistory((await empRes.json()).history || []);
      if (eduRes.ok) setEducation((await eduRes.json()).data || []);
      if (skillRes.ok) setSkills((await skillRes.json()).data || []);
      if (certRes.ok) setCertifications((await certRes.json()).data || []);
      if (awardRes.ok) setAwards((await awardRes.json()).data || []);
      if (otherRes.ok) setOtherProfiles((await otherRes.json()).data || []);
    } catch (error) {
      console.error("Error fetching sections", error);
    }
  };



  // --- POST HANDLERS (with optimistic updates) ---
  const handleLike = async (postId: string) => {
    const targetPost = profilePosts.find(p => p.id === postId);
    if (!targetPost) return;

    const wasLiked = targetPost.isLiked;
    const newLikedStatus = !wasLiked;
    const countDelta = newLikedStatus ? 1 : -1;

    // Optimistic Update
    setProfilePosts(prev => prev.map(p => p.id === postId ? { ...p, isLiked: newLikedStatus, likesCount: (p.likesCount || 0) + countDelta } : p));

    try {
      const res = await fetch(`/api/professional/posts/${postId}/like`, { method: 'POST' });
      if (!res.ok) throw new Error('Like failed');
    } catch (err) {
      console.error(err);
      // Revert on error
      setProfilePosts(prev => prev.map(p => p.id === postId ? { ...p, isLiked: wasLiked, likesCount: (p.likesCount || 0) - countDelta } : p));
    }
  };

  const handleRepost = async (postId: string) => {
    const targetPost = profilePosts.find(p => p.id === postId);
    if (!targetPost) return;

    const isReposting = !targetPost.isReposted;

    // Optimistic Update
    setProfilePosts(prev => prev.map(p => p.id === postId ? { ...p, isReposted: isReposting, repostsCount: (p.repostsCount || 0) + (isReposting ? 1 : -1) } : p));

    try {
      const method = isReposting ? 'POST' : 'DELETE';
      const res = await fetch(`/api/professional/posts/${postId}/repost`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      if (isReposting && res.status === 409) return; // Already reposted
      if (!res.ok) throw new Error();
    } catch (err) {
      console.error(err);
      // Revert on error
      setProfilePosts(prev => prev.map(p => p.id === postId ? { ...p, isReposted: !isReposting, repostsCount: (p.repostsCount || 0) + (isReposting ? -1 : 1) } : p));
    }
  };

  const handleShare = async (postId: string) => {
    try {
      const res = await fetch(`/api/shared/posts/${postId}/share`);
      if (res.ok) {
        const { link } = await res.json();
        if (navigator.share) {
          await navigator.share({ title: 'Check out this post', url: link });
        } else {
          await navigator.clipboard.writeText(link);
          alert('Short link copied to clipboard!');
        }
      } else {
        const url = `${window.location.origin}/professional/feed?post=${postId}`;
        await navigator.clipboard.writeText(url);
        alert('Link copied to clipboard!');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleFollow = async (targetUserId: string, type: string = 'user') => {
    // Optimistic Update
    const updateFollowStatus = (isFollowing: boolean) => {
      setProfilePosts(prev => prev.map(p => p.author.id === targetUserId ? { ...p, author: { ...p.author, isFollowing } } : p));
    };

    updateFollowStatus(true);

    try {
      const res = await fetch('/api/professional/follow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: targetUserId, type })
      });
      if (!res.ok) throw new Error('Follow failed');
    } catch (err) {
      console.error(err);
      // Revert on error
      updateFollowStatus(false);
    }
  };

  const handleReport = (postId: string) => {
    // Navigate to support or show modal
    alert(`Reported post ${postId}`);
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    try {
      const res = await fetch(`/api/professional/posts/${postId}`, { method: 'DELETE' });
      if (res.ok) {
        fetchProfilePosts();
      } else {
        alert('Failed to delete post');
      }
    } catch (err) {
      console.error('Error deleting post:', err);
    }
  };

  // Delete Repost Handler
  const handleDeleteRepost = async (repostId: string) => {
    if (!confirm('Are you sure you want to remove this repost?')) return;
    try {
      const res = await fetch(`/api/professional/posts/repost/${repostId}`, { method: 'DELETE' }); // Verify active route
      // Wait actually, verify if the route is /api/professional/posts/[id]/repost with DELETE?
      // Or we need a new route. The plan said "Update DELETE /api/posts/repost".
      // Let's assume the correct route based on standard REST or what I implemented.
      // Actually ref checking... task.md said "Create API endpoint for Repost Deletion (DELETE)".
      // Let's use /api/professional/posts/repost/[id] or similar.
      // I'll check if that route exists in next step. For now assume standard ID deletion.
      // Correction: usually DELETE /api/professional/posts/repost?id=... or /api/professional/reposts/[id].
      // Implementation Plan mentions: "Update DELETE /api/posts/repost".
      // Let's use a generic fetch here and I will verify the route exists next.
      // If the route is missing I will create it.
    } catch (err) { console.error(err); }
  };

  // Re-implementing correctly:
  const handleRemoveRepost = async (repostId: string) => {
    if (!confirm('Remove this repost?')) return;
    try {
      const res = await fetch(`/api/professional/posts/repost?id=${repostId}`, { method: 'DELETE' });
      if (res.ok) fetchProfilePosts();
    } catch (e) { console.error(e); }
  };

  const handleSave = async (postId: string, authorType: string) => {
    // Optimistic Update
    setProfilePosts(prev => prev.map(p => p.id === postId ? { ...p, isSaved: !p.isSaved } : p));

    try {
      const res = await fetch(`/api/professional/posts/${postId}/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: authorType })
      });
      if (!res.ok) throw new Error();
    } catch (err) {
      console.error(err);
      // Revert
      setProfilePosts(prev => prev.map(p => p.id === postId ? { ...p, isSaved: !p.isSaved } : p));
    }
  };


  const fetchProfilePosts = async () => {
    setIsProfilePostsLoading(true);
    try {
      let url = `/api/professional/profile/posts?tab=${activePostsTab}`;
      if (activePostsTab === 'saved') {
        url = `/api/professional/posts/saved`;
      }
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setProfilePosts(data.posts || []);
      }
    } catch (error) {
      console.error("Error fetching profile posts", error);
    } finally {
      setIsProfilePostsLoading(false);
    }
  };

  useEffect(() => {
    const initData = async () => {
      setIsDataLoading(true);
      await Promise.all([
        fetchProfile(),
        fetchDocuments(),
        fetchPreferences(),
        fetchSections(),
        fetchProfilePosts()
      ]);
      setIsDataLoading(false);
    };
    initData();
  }, []);

  // Refetch posts when tab changes
  useEffect(() => {
    fetchProfilePosts();
  }, [activePostsTab]);

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
          about,
          imagePosition,
          isAvailableForHire
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
          preferred_locations: { countries: preferredCountries, continents: preferredContinents },
          work_modes: workModes,
          employment_types: employmentTypes,
          is_open_to_relocation: isOpenToRelocation,
          experience_years_ranges: experienceYearRanges
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

  const handleProfileImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setProfileLoading(true);
    setProfileMessage(null);
    try {
      const res = await fetch(`/api/professional/profile/image?filename=${encodeURIComponent(file.name)}`, {
        method: 'POST',
        body: file
      });
      if (res.ok) {
        const data = await res.json();
        setProfileImageUrl(data.url);
        setProfileMessage({ type: 'success', text: 'Photo uploaded successfully!' });
      } else {
        setProfileMessage({ type: 'error', text: 'Failed to upload photo' });
      }
    } catch (error) {
      setProfileMessage({ type: 'error', text: 'An error occurred while uploading' });
    } finally {
      setProfileLoading(false);
      if (profileImageInputRef.current) profileImageInputRef.current.value = '';
    }
  };

  const handleProfileImageDelete = async () => {
    if (!profileImageUrl) return;
    if (!confirm("Are you sure you want to remove your profile photo?")) return;

    setProfileLoading(true);
    setProfileMessage(null);
    try {
      const res = await fetch('/api/professional/profile/image', { method: 'DELETE' });
      if (res.ok) {
        setProfileImageUrl('');
        setProfileMessage({ type: 'success', text: 'Photo removed successfully!' });
      } else {
        setProfileMessage({ type: 'error', text: 'Failed to remove photo' });
      }
    } catch (error) {
      setProfileMessage({ type: 'error', text: 'An error occurred while removing' });
    } finally {
      setProfileLoading(false);
    }
  };

  const handleToggleAvailability = async (checked: boolean) => {
    setIsAvailableForHire(checked);
    try {
      const res = await fetch('/api/professional/profile/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAvailableForHire: checked })
      });
      if (!res.ok) {
        setProfileMessage({ type: 'error', text: 'Failed to update availability.' });
        // Revert on failure
        setIsAvailableForHire(!checked);
      }
    } catch (error) {
      console.error('Error updating availability:', error);
      setProfileMessage({ type: 'error', text: 'Error updating availability.' });
      setIsAvailableForHire(!checked);
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

  const handleMagicUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];

    setIsParsing(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/documents/parse', {
        method: 'POST',
        body: formData
      });

      if (!res.ok) throw new Error("Parsing failed");

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      if (data.content) {
        // Replace content while preserving undo history
        // 1. Focus editor
        editorRef.current?.focus();

        // 2. Select All
        execCommand('selectAll');

        // 3. Insert new content (replaces selection)
        execCommand('insertHTML', data.content);
      }
    } catch (error) {
      console.error("Magic upload error", error);
      alert("Failed to extract text from file.");
    } finally {
      setIsParsing(false);
      if (magicImportInputRef.current) magicImportInputRef.current.value = '';
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
    const baseCards = ['RESUME', 'CV', 'COVER LETTER'];
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

  // --- SECTION HANDLERS ---
  const openAddSection = (section: string) => {
    setActiveSection(section);
    setEditingItem(null);
    setFormData({}); // Reset form
    setIsSlideOverOpen(true);
  };

  const openEditSection = (section: string, item: any) => {
    setActiveSection(section);
    setEditingItem(item);
    setFormData(item); // Load item data
    setIsSlideOverOpen(true);
  };

  const handleSaveSection = async (formData: any) => {
    if (!activeSection) return;
    setSectionLoading(true);

    try {
      const url = activeSection === 'employment'
        ? '/api/professional/profile/sections/employment' // Manual employment uses generic CRUD
        : `/api/professional/profile/sections/${activeSection}`;

      const method = editingItem ? 'PUT' : 'POST';
      const body = editingItem ? { ...formData, id: editingItem.id } : formData;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        setProfileMessage({ type: 'success', text: 'Saved successfully!' });
        setIsSlideOverOpen(false);
        // Refresh data
        // For simplicity, we could splice locally, but refetching ensures consistency specifically for hybrid lists like employment
        if (activeSection === 'employment') {
          const r = await fetch('/api/professional/profile/employment');
          if (r.ok) setEmploymentHistory((await r.json()).history || []);
        } else {
          const r = await fetch(`/api/professional/profile/sections/${activeSection}`);
          if (r.ok) {
            const d = (await r.json()).data || [];
            if (activeSection === 'education') setEducation(d);
            if (activeSection === 'skills') setSkills(d);
            if (activeSection === 'certifications') setCertifications(d);
            if (activeSection === 'awards') setAwards(d);
            if (activeSection === 'other_profiles') setOtherProfiles(d);
          }
        }
      } else {
        const err = await res.json();
        setProfileMessage({ type: 'error', text: err.error || 'Failed to save.' });
      }
    } catch (e) {
      setProfileMessage({ type: 'error', text: 'Error saving data.' });
    } finally {
      setSectionLoading(false);
    }
  };

  const handleDeleteSection = async (section: string, id: string) => {
    if (!confirm('Are you sure you want to delete this?')) return;
    setSectionLoading(true);
    try {
      const url = section === 'employment'
        ? `/api/professional/profile/sections/employment?id=${id}`
        : `/api/professional/profile/sections/${section}?id=${id}`;

      const res = await fetch(url, { method: 'DELETE' });
      if (res.ok) {
        setProfileMessage({ type: 'success', text: 'Deleted successfully!' });
        // Refresh data
        if (section === 'employment') {
          const r = await fetch('/api/professional/profile/employment');
          if (r.ok) setEmploymentHistory((await r.json()).history || []);
        } else {
          const r = await fetch(`/api/professional/profile/sections/${section}`);
          if (r.ok) {
            const d = (await r.json()).data || [];
            if (section === 'education') setEducation(d);
            if (section === 'skills') setSkills(d);
            if (section === 'certifications') setCertifications(d);
            if (section === 'awards') setAwards(d);
            if (section === 'other_profiles') setOtherProfiles(d);
          }
        }
      } else {
        setProfileMessage({ type: 'error', text: 'Failed to delete.' });
      }
    } catch (e) {
      setProfileMessage({ type: 'error', text: 'Error deleting.' });
    } finally {
      setSectionLoading(false);
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
      <div className="p-4 md:p-6">
        <div className="relative z-10 max-w-7xl mx-auto min-h-full">
          <div className="space-y-6">

            {/* Profile Page Tabs */}
            <div className={`flex overflow-x-auto max-w-full space-x-2 p-1 rounded-xl border no-scrollbar ${isDark ? 'bg-neutral-900/50 border-neutral-800' : 'bg-neutral-100 border-neutral-200'}`}>
              <button
                onClick={() => setActiveProfileTab('profile')}
                className={`flex items-center gap-2 px-4 md:px-6 py-3 rounded-lg text-sm font-bold whitespace-nowrap transition-all ${activeProfileTab === 'profile' ? (isDark ? 'bg-white text-black' : 'bg-black text-white') + ' shadow-lg' : isDark ? 'text-neutral-400 hover:text-white hover:bg-white/5' : 'text-neutral-500 hover:text-black hover:bg-black/5'}`}
              >
                <User size={16} /> Profile Info
              </button>
              <button
                onClick={() => setActiveProfileTab('documents')}
                className={`flex items-center gap-2 px-4 md:px-6 py-3 rounded-lg text-sm font-bold whitespace-nowrap transition-all ${activeProfileTab === 'documents' ? (isDark ? 'bg-white text-black' : 'bg-black text-white') + ' shadow-lg' : isDark ? 'text-neutral-400 hover:text-white hover:bg-white/5' : 'text-neutral-500 hover:text-black hover:bg-black/5'}`}
              >
                <FileText size={16} /> Documents
              </button>
              <button
                onClick={() => setActiveProfileTab('preferences')}
                className={`flex items-center gap-2 px-4 md:px-6 py-3 rounded-lg text-sm font-bold whitespace-nowrap transition-all ${activeProfileTab === 'preferences' ? (isDark ? 'bg-white text-black' : 'bg-black text-white') + ' shadow-lg' : isDark ? 'text-neutral-400 hover:text-white hover:bg-white/5' : 'text-neutral-500 hover:text-black hover:bg-black/5'}`}
              >
                <Briefcase size={16} /> Job Preferences
              </button>
            </div>

            {/* Documents Tab Content */}
            {activeProfileTab === 'documents' && (
              <>
                {/* Mode Toggle Tabs */}
                <div className={`flex items-center gap-3 p-2 rounded-xl border ${isDark ? 'bg-neutral-900/50 border-neutral-800' : 'bg-neutral-100 border-neutral-200'}`}>
                  <button
                    onClick={() => setDocumentMode('writing')}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all ${documentMode === 'writing' ? (isDark ? 'bg-blue-600 text-white' : 'bg-blue-600 text-white') + ' shadow-lg' : isDark ? 'text-neutral-400 hover:text-white hover:bg-white/5' : 'text-neutral-500 hover:text-black hover:bg-black/5'}`}
                  >
                    <Pencil size={16} /> Write Documents
                  </button>
                  <button
                    onClick={() => setDocumentMode('upload')}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all ${documentMode === 'upload' ? (isDark ? 'bg-emerald-600 text-white' : 'bg-emerald-600 text-white') + ' shadow-lg' : isDark ? 'text-neutral-400 hover:text-white hover:bg-white/5' : 'text-neutral-500 hover:text-black hover:bg-black/5'}`}
                  >
                    <Upload size={16} /> Upload Files
                  </button>
                </div>

                {/* Share Mode Preference */}
                <div className={`flex items-center justify-between p-4 rounded-2xl border ${isDark ? 'bg-gradient-to-r from-violet-500/10 to-purple-500/10 border-violet-500/20' : 'bg-gradient-to-r from-violet-50 to-purple-50 border-violet-200'}`}>
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${isDark ? 'bg-violet-500/20 text-violet-400' : 'bg-violet-100 text-violet-700'}`}>
                      <Share2 size={18} />
                    </div>
                    <div className="text-left">
                      <h4 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-black'}`}>Share Preference</h4>
                      <p className={`text-xs ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>Choose which documents employers see when you apply</p>
                    </div>
                  </div>
                  <div className={`flex items-center gap-2 p-1 rounded-lg ${isDark ? 'bg-neutral-800' : 'bg-neutral-200'}`}>
                    <button
                      onClick={() => handleShareModeChange('writing')}
                      className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${shareDocMode === 'writing' ? (isDark ? 'bg-blue-600 text-white' : 'bg-blue-600 text-white') : isDark ? 'text-neutral-400 hover:text-white' : 'text-neutral-500 hover:text-black'}`}
                    >
                      Written
                    </button>
                    <button
                      onClick={() => handleShareModeChange('upload')}
                      className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${shareDocMode === 'upload' ? (isDark ? 'bg-emerald-600 text-white' : 'bg-emerald-600 text-white') : isDark ? 'text-neutral-400 hover:text-white' : 'text-neutral-500 hover:text-black'}`}
                    >
                      Uploaded
                    </button>
                  </div>
                </div>

                {/* Writing Mode Content */}
                {documentMode === 'writing' && (
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

                {/* Upload Mode Content */}
                {documentMode === 'upload' && (
                  <>
                    {/* Info Banner */}
                    <div className={`flex items-center gap-4 p-4 rounded-2xl border ${isDark ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-emerald-50 border-emerald-200'}`}>
                      <div className={`p-2.5 rounded-xl ${isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700'}`}><Upload size={20} /></div>
                      <div className="text-left flex-1">
                        <h3 className={`text-sm font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-800'}`}>Upload Mode</h3>
                        <p className={`text-xs ${isDark ? 'text-emerald-300/70' : 'text-emerald-700/70'}`}>All uploaded files are automatically shared with employers when you apply. Max 10MB per file.</p>
                      </div>
                    </div>

                    {/* Upload Drop Zone */}
                    <div
                      className={`relative p-8 rounded-2xl border-2 border-dashed text-center transition-all cursor-pointer ${isDragOver ? (isDark ? 'border-emerald-500 bg-emerald-500/10' : 'border-emerald-500 bg-emerald-50') : isDark ? 'border-neutral-700 hover:border-neutral-600 bg-neutral-900/50' : 'border-neutral-300 hover:border-neutral-400 bg-neutral-50'}`}
                      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                      onDragLeave={() => setIsDragOver(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsDragOver(false);
                        handleFileUpload(e.dataTransfer.files);
                      }}
                      onClick={() => uploadInputRef.current?.click()}
                    >
                      {isUploadLoading ? (
                        <div className="flex flex-col items-center gap-3">
                          <Loader2 size={32} className="animate-spin text-emerald-500" />
                          <p className={`text-sm font-medium ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>Uploading...</p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-3">
                          <div className={`p-4 rounded-full ${isDark ? 'bg-neutral-800' : 'bg-neutral-200'}`}>
                            <FileUp size={28} className={isDark ? 'text-neutral-400' : 'text-neutral-500'} />
                          </div>
                          <div>
                            <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-black'}`}>Drop files here or click to upload</p>
                            <p className={`text-xs mt-1 ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>Supports PDF, DOC, DOCX, JPG, PNG, WEBP</p>
                          </div>
                        </div>
                      )}
                      <input
                        ref={uploadInputRef}
                        type="file"
                        multiple
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp"
                        onChange={(e) => handleFileUpload(e.target.files)}
                        className="hidden"
                      />
                    </div>

                    {/* Uploaded Files List */}
                    {uploadedDocuments.length > 0 && (
                      <div className={`rounded-2xl border overflow-hidden ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200 shadow-sm'}`}>
                        <div className={`px-5 py-3 border-b ${isDark ? 'border-neutral-800' : 'border-neutral-200'}`}>
                          <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-black'}`}>Uploaded Files ({uploadedDocuments.length})</h3>
                        </div>
                        <div className="divide-y divide-neutral-800">
                          {uploadedDocuments.map((doc) => (
                            <div key={doc.id} className={`flex items-center gap-4 p-4 hover:bg-neutral-800/30 transition-colors ${isDark ? '' : 'hover:bg-neutral-50'}`}>
                              {/* File Icon */}
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${isDark ? 'bg-neutral-800' : 'bg-neutral-100'}`}>
                                {getFileIcon(doc.fileType)}
                              </div>

                              {/* File Info */}
                              <div className="flex-1 min-w-0">
                                {renamingDocId === doc.id ? (
                                  <input
                                    type="text"
                                    value={renamingValue}
                                    onChange={(e) => setRenamingValue(e.target.value)}
                                    onBlur={() => handleRenameUploadedDoc(doc.id, renamingValue)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') handleRenameUploadedDoc(doc.id, renamingValue);
                                      if (e.key === 'Escape') setRenamingDocId(null);
                                    }}
                                    className={`w-full px-2 py-1 rounded-lg text-sm font-medium outline-none border ${isDark ? 'bg-neutral-800 border-neutral-700 text-white' : 'bg-neutral-100 border-neutral-300 text-black'}`}
                                    autoFocus
                                  />
                                ) : (
                                  <p
                                    className={`text-sm font-medium truncate cursor-pointer hover:underline ${isDark ? 'text-white' : 'text-black'}`}
                                    onClick={() => { setRenamingDocId(doc.id); setRenamingValue(doc.name); }}
                                    title="Click to rename"
                                  >
                                    {doc.name}
                                  </p>
                                )}
                                <p className={`text-xs ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>
                                  {formatFileSize(doc.fileSize)} • {doc.createdAt ? new Date(doc.createdAt).toLocaleDateString() : 'Just now'}
                                </p>
                              </div>

                              {/* Actions */}
                              <div className="flex items-center gap-2">
                                <a
                                  href={doc.blobUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-neutral-700 text-neutral-400 hover:text-white' : 'hover:bg-neutral-200 text-neutral-500 hover:text-black'}`}
                                  title="View/Download"
                                >
                                  <Download size={16} />
                                </a>
                                <label className={`p-2 rounded-lg cursor-pointer transition-colors ${isDark ? 'hover:bg-neutral-700 text-neutral-400 hover:text-white' : 'hover:bg-neutral-200 text-neutral-500 hover:text-black'}`} title="Replace file">
                                  <input
                                    type="file"
                                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp"
                                    onChange={(e) => {
                                      if (e.target.files?.[0]) handleReplaceFile(doc.id, e.target.files[0]);
                                    }}
                                    className="hidden"
                                  />
                                  <FileUp size={16} />
                                </label>
                                <button
                                  onClick={() => handleDeleteUploadedDoc(doc.id)}
                                  className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-red-500/20 text-neutral-400 hover:text-red-400' : 'hover:bg-red-50 text-neutral-500 hover:text-red-600'}`}
                                  title="Delete"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Empty State */}
                    {uploadedDocuments.length === 0 && !isUploadLoading && (
                      <div className={`p-8 rounded-2xl border text-center ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200 shadow-sm'}`}>
                        <File size={32} className={`mx-auto mb-3 ${isDark ? 'text-neutral-600' : 'text-neutral-400'}`} />
                        <p className={`text-sm font-medium ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>No files uploaded yet</p>
                        <p className={`text-xs mt-1 ${isDark ? 'text-neutral-600' : 'text-neutral-400'}`}>Upload your resume, certificates, or other documents</p>
                      </div>
                    )}
                  </>
                )}
              </>
            )}


            {/* Profile Info Tab Content */}
            {activeProfileTab === 'profile' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-500">
                {/* Message Banner */}
                {profileMessage && (
                  <div className={`p-4 rounded-xl text-sm font-medium ${profileMessage.type === 'success' ? (isDark ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-emerald-50 text-emerald-700 border border-emerald-200') : (isDark ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-red-50 text-red-700 border border-red-200')}`}>
                    {profileMessage.text}
                  </div>
                )}

                {/* 1. Identity Card */}
                <div className={`p-5 md:p-8 rounded-[32px] md:rounded-[40px] ${isDark ? 'bg-neutral-900 border border-neutral-800' : 'bg-white border border-neutral-200 shadow-sm'}`}>
                  <div className="flex flex-col md:flex-row gap-8 items-start">

                    {/* Left: Profile Image */}
                    <div className="flex-shrink-0 relative group">
                      <div className={`w-40 h-40 md:w-48 md:h-48 rounded-[2rem] overflow-hidden border-4 flex items-center justify-center bg-white ${isDark ? 'border-neutral-800' : 'border-white shadow-lg'} ${isRepositioning ? 'cursor-move ring-4 ring-blue-500 ring-offset-2' : ''}`}>
                        {profileLoading ? (
                          <Loader2 size={32} className="text-neutral-400 animate-spin" />
                        ) : profileImageUrl ? (
                          <img
                            ref={imageRef}
                            src={profileImageUrl}
                            alt="Profile"
                            className={`w-full h-full object-cover transition-none select-none ${isRepositioning ? '' : 'transition-all duration-300'}`}
                            style={{ objectPosition: imagePosition }}
                            onMouseDown={handleMouseDown}
                            draggable={false}
                          />
                        ) : (
                          <div className={`font-black text-6xl ${isDark ? 'text-neutral-700' : 'text-neutral-300'}`}>
                            {firstName.charAt(0)}{(lastName && lastName !== 'null') ? lastName.charAt(0) : ''}
                          </div>
                        )}
                      </div>

                      {/* Upload/Delete/Align Overlay */}
                      <div className={`absolute inset-0 rounded-[2rem] flex flex-col items-center justify-center gap-2 transition-opacity ${isRepositioning ? 'opacity-0 pointer-events-none' : 'opacity-0 group-hover:opacity-100'} ${isDark ? 'bg-black/80' : 'bg-black/60'}`}>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => profileImageInputRef.current?.click()}
                            className="p-3 rounded-full bg-white/20 hover:bg-white/30 transition-colors backdrop-blur-md"
                            title="Upload Photo"
                          >
                            <Camera size={20} className="text-white" />
                          </button>
                          {profileImageUrl && (
                            <>
                              <button
                                onClick={() => setIsRepositioning(true)}
                                className="p-3 rounded-full bg-white/20 hover:bg-white/30 transition-colors backdrop-blur-md"
                                title="Reposition Photo"
                              >
                                <Move size={20} className="text-white" />
                              </button>
                              <button
                                onClick={handleProfileImageDelete}
                                className="p-3 rounded-full bg-white/20 hover:bg-white/30 transition-colors backdrop-blur-md"
                                title="Remove Photo"
                              >
                                <Trash2 size={20} className="text-white" />
                              </button>
                            </>
                          )}
                        </div>
                        <span className="text-white text-xs font-medium">Change Photo</span>
                      </div>

                      {isRepositioning && (
                        <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 flex gap-2 z-50">
                          <button
                            onClick={() => { setIsRepositioning(false); handleSaveProfile(); }}
                            className="p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all active:scale-95"
                            title="Save Position"
                          >
                            <Check size={20} />
                          </button>
                          <button
                            onClick={() => setIsRepositioning(false)}
                            className="p-3 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-all active:scale-95"
                            title="Cancel"
                          >
                            <X size={20} />
                          </button>
                        </div>
                      )}

                      {/* Reuse the existing fileInputRef if it was meant for profile? 
                          Wait, line 1327 uses fileInputRef for the EDITOR image upload. 
                          I need a NEW ref for profile image or conditional logic.
                          I will create a new ref `profileImageInputRef` in the state section first.
                      */}
                      <input
                        ref={profileImageInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleProfileImageUpload}
                        className="hidden"
                      />
                    </div>

                    {/* Right: Details */}
                    <div className="flex-1 w-full space-y-6">

                      {/* Name & Role Section */}
                      <div className="space-y-2">
                        {/* Name */}
                        <div className="flex items-center gap-3 group">
                          {isEditingName ? (
                            <div className="flex flex-col md:flex-row gap-2 w-full max-w-md relative z-10">
                              <input
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                placeholder="First Name"
                                className={`flex-1 px-3 py-2 rounded-lg font-bold text-lg md:text-xl outline-none border focus:border-blue-500 ${isDark ? 'bg-neutral-800 border-neutral-700 text-white' : 'bg-neutral-50 border-neutral-200 text-black'}`}
                                autoFocus
                              />
                              <input
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                placeholder="Last Name"
                                className={`flex-1 px-3 py-2 rounded-lg font-bold text-lg md:text-xl outline-none border focus:border-blue-500 ${isDark ? 'bg-neutral-800 border-neutral-700 text-white' : 'bg-neutral-50 border-neutral-200 text-black'}`}
                              />
                              <button onClick={() => { handleSaveProfile(); setIsEditingName(false); }} className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex-shrink-0"><Check size={20} /></button>
                            </div>
                          ) : (
                            <>
                              <h1 className={`text-3xl md:text-5xl font-black tracking-tighter ${isDark ? 'text-white' : 'text-black'}`}>
                                {firstName || (lastName && lastName !== 'null') ? (
                                  <span className="flex items-center gap-2">
                                    {firstName} {lastName === 'null' ? '' : lastName}
                                    <VerificationBadge tier={badgeType} size={32} />
                                  </span>
                                ) : <span className="text-neutral-500 text-3xl">Your Name</span>}
                              </h1>
                              <button onClick={() => setIsEditingName(true)} className={`p-2 rounded-full transition-colors ${isDark ? 'hover:bg-neutral-800 text-neutral-400 hover:text-white' : 'hover:bg-neutral-100 text-neutral-500 hover:text-black'}`}>
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
                              <p className={`text-xl font-medium ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                                {role || 'No role set'}
                              </p>
                              <button onClick={() => setIsEditingRole(true)} className={`p-1.5 rounded-full transition-colors ${isDark ? 'hover:bg-neutral-800 text-neutral-400 hover:text-white' : 'hover:bg-neutral-100 text-neutral-500 hover:text-black'}`}>
                                <PenLine size={18} />
                              </button>
                            </>
                          )}
                        </div>

                        {/* Availability Toggle */}
                        <div className="flex items-center gap-3 mt-2">
                          <label className={`relative inline-flex items-center cursor-pointer`}>
                            <input
                              type="checkbox"
                              checked={isAvailableForHire}
                              onChange={(e) => handleToggleAvailability(e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className={`w-9 h-5 rounded-full peer peer-focus:ring-2 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 transition-colors ${isDark ? 'bg-neutral-700 peer-checked:bg-emerald-500' : 'bg-neutral-200 peer-checked:bg-emerald-500'}`}></div>
                            <div className={`absolute top-[2px] left-[2px] bg-white border border-gray-300 border-none rounded-full h-4 w-4 transition-all peer-checked:translate-x-full`}></div>
                          </label>
                          <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? (isAvailableForHire ? 'text-emerald-400' : 'text-neutral-500') : (isAvailableForHire ? 'text-emerald-600' : 'text-neutral-400')}`}>
                            {isAvailableForHire ? 'Available for Hire' : 'Not Open to Offers'}
                          </span>
                        </div>

                      </div>
                    </div>



                    {/* Content Section */}
                    <div className="space-y-6 pt-2">

                      {/* Row 1: Contact & Links */}
                      <div className="flex flex-col md:flex-row gap-8">
                        {/* Contact Info */}
                        <div className="space-y-4 flex-1 min-w-0 w-full max-w-full">
                          <div className="space-y-1 group">
                            <label className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-neutral-500' : 'text-neutral-600'}`}>Email</label>
                            {isEditingEmail ? (
                              <div className="flex gap-2">
                                <input
                                  value={email}
                                  onChange={(e) => setEmail(e.target.value)}
                                  placeholder="name@example.com"
                                  className={`flex-1 px-3 py-1.5 rounded-lg font-medium outline-none border focus:border-blue-500 ${isDark ? 'bg-neutral-800 border-neutral-700 text-white' : 'bg-neutral-50 border-neutral-200 text-black'}`}
                                  autoFocus
                                />
                                <button onClick={() => { handleSaveProfile(); setIsEditingEmail(false); }} className="p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700"><Check size={16} /></button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <div className={`flex items-center gap-2 font-medium truncate ${isDark ? 'text-neutral-300' : 'text-black'}`}>
                                  <Mail size={16} className="shrink-0" />
                                  <span className="truncate select-all">{email || 'No email provided'}</span>
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    onClick={() => {
                                      if (email) {
                                        navigator.clipboard.writeText(email);
                                        setProfileMessage({ type: 'success', text: 'Email copied!' });
                                        setTimeout(() => setProfileMessage(null), 2000);
                                      }
                                    }}
                                    className={`p-1 rounded-full ${isDark ? 'hover:bg-neutral-800 text-neutral-400' : 'hover:bg-neutral-100 text-neutral-500'}`}
                                    title="Copy Email"
                                  >
                                    <Copy size={14} />
                                  </button>
                                  <button onClick={() => setIsEditingEmail(true)} className={`p-1 rounded-full transition-colors ${isDark ? 'hover:bg-neutral-800 text-neutral-400 hover:text-white' : 'hover:bg-neutral-100 text-neutral-500 hover:text-black'}`}>
                                    <PenLine size={14} />
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="space-y-1 group">
                            <label className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-neutral-500' : 'text-neutral-600'}`}>Phone</label>
                            {isEditingPhone ? (
                              <div className="flex gap-2">
                                <input
                                  value={phone}
                                  onChange={(e) => setPhone(e.target.value)}
                                  placeholder="+1234567890"
                                  className={`flex-1 px-3 py-1.5 rounded-lg font-medium outline-none border focus:border-blue-500 ${isDark ? 'bg-neutral-800 border-neutral-700 text-white' : 'bg-neutral-50 border-neutral-200 text-black'}`}
                                  autoFocus
                                />
                                <button onClick={() => { handleSaveProfile(); setIsEditingPhone(false); }} className="p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700"><Check size={16} /></button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <div className={`flex items-center gap-2 font-medium truncate ${isDark ? 'text-neutral-300' : 'text-black'}`}>
                                  <Phone size={16} className="shrink-0" /> <span className="truncate">{phone || 'No phone provided'}</span>
                                </div>
                                <button onClick={() => setIsEditingPhone(true)} className={`p-1 rounded-full transition-colors ${isDark ? 'hover:bg-neutral-800 text-neutral-400 hover:text-white' : 'hover:bg-neutral-100 text-neutral-500 hover:text-black'}`}>
                                  <PenLine size={14} />
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Profile Link */}
                          <div className="space-y-2 w-full max-w-full overflow-hidden">
                            <label className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-neutral-500' : 'text-neutral-600'}`}>Profile Link</label>
                            <div className={`grid grid-cols-[1fr_auto] items-center p-1.5 rounded-xl border w-full max-w-full overflow-hidden ${isDark ? 'bg-neutral-950 border-neutral-800' : 'bg-neutral-50 border-neutral-200'}`}>
                              <div className={`px-3 text-sm truncate min-w-0 ${isDark ? 'text-neutral-400' : 'text-black'}`}>
                                {typeof window !== 'undefined' ? `${window.location.origin}/${shortUrl || `${firstName}-${lastName}`.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}` : '...'}
                              </div>
                              <button
                                onClick={handleCopyLink}
                                className={`p-2 rounded-lg transition-colors shrink-0 ${isDark ? 'hover:bg-neutral-800 text-white' : 'hover:bg-white text-black shadow-sm'}`}
                              >
                                {profileMessage?.text === 'Profile link copied!' ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                              </button>
                            </div>
                            <p className={`text-[10px] ${isDark ? 'text-neutral-600' : 'text-neutral-600'}`}>Share this link for others to view your professional profile.</p>
                          </div>
                        </div>

                      </div>


                    </div>
                  </div>
                </div>

                {/* About Section (Standalone Card) */}
                <div className={`p-5 md:p-8 rounded-[32px] md:rounded-[40px] border ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200 shadow-sm'}`}>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className={`text-xl font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-black'}`}>
                      <User size={20} /> About
                    </h3>
                    <button onClick={() => setIsEditingAbout(true)} className={`p-2 rounded-full ${isDark ? 'hover:bg-neutral-800 text-neutral-400' : 'hover:bg-neutral-100 text-neutral-500'}`}>
                      <PenLine size={20} />
                    </button>
                  </div>

                  {isEditingAbout ? (
                    <div className="space-y-4">
                      <textarea
                        value={about}
                        onChange={(e) => setAbout(e.target.value)}
                        className={`w-full p-6 rounded-2xl font-medium outline-none border-2 focus:border-blue-500 min-h-[160px] text-lg leading-relaxed ${isDark ? 'bg-neutral-800 border-neutral-700 text-white' : 'bg-neutral-50 border-neutral-200 text-black'}`}
                        placeholder="Tell us about yourself..."
                        autoFocus
                      />
                      <div className="flex justify-end gap-3">
                        <button onClick={() => setIsEditingAbout(false)} className={`px-5 py-2.5 rounded-xl text-sm font-bold ${isDark ? 'text-neutral-400 hover:bg-neutral-800' : 'text-neutral-600 hover:bg-neutral-100'}`}>Cancel</button>
                        <button onClick={() => { handleSaveProfile(); setIsEditingAbout(false); }} className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 shadow-lg shadow-blue-500/30">Save Profile</button>
                      </div>
                    </div>
                  ) : (
                    <p className={`text-lg leading-relaxed whitespace-pre-wrap ${isDark ? 'text-neutral-300' : 'text-neutral-600'}`}>
                      {about || 'No about section added yet. Click the edit button to introduce yourself.'}
                    </p>
                  )}
                </div>

                {/* Analytics Section */}
                <ProfileAnalytics isDark={isDark} />

                {/* Posts Preview */}
                {/* Posts Section */}
                <div className="mt-8">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className={`text-xl font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-black'}`}>
                      <FileText size={20} /> Posts
                    </h3>
                    <button
                      onClick={() => { setActivePostsTab('posts'); setIsPostsPanelOpen(true); }}
                      className={`flex items-center gap-2 text-sm font-bold hover:underline ${isDark ? 'text-neutral-400 hover:text-white' : 'text-neutral-500 hover:text-black'}`}
                    >
                      View All <ArrowRight size={16} />
                    </button>
                  </div>
                  {profilePosts.length > 0 ? (
                    <div className="max-w-xl">
                      <PostCard
                        post={profilePosts[0]}
                        isDark={isDark}
                        currentUserId={userId}
                        onLike={() => handleLike(profilePosts[0].id)}
                        onRepost={() => handleRepost(profilePosts[0].id)}
                        onShare={() => handleShare(profilePosts[0].id)}
                        onFollow={() => handleFollow(profilePosts[0].author.id, profilePosts[0].author.type === 'employer' ? 'company' : 'user')}
                        onReport={handleReport}
                        onDelete={handleDeletePost}
                        onEdit={() => { }}
                        onCommentAdded={() => setProfilePosts((prev: any[]) => prev.map(p => p.id === profilePosts[0].id ? { ...p, commentsCount: (p.commentsCount || 0) + 1 } : p))}
                      />
                    </div>
                  ) : (
                    <div className={`p-8 rounded-[32px] border text-center ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200 shadow-sm'}`}>
                      <p className={`text-sm font-medium ${isDark ? 'text-neutral-500' : 'text-neutral-600'}`}>No posts yet.</p>
                    </div>
                  )}
                </div>

                <ProfileInfoSection
                  isDark={isDark}
                  readOnly={false}
                  employmentHistory={employmentHistory}
                  education={education}
                  skills={skills}
                  certifications={certifications}
                  awards={awards}
                  otherProfiles={otherProfiles}
                  onAdd={(section, prefillData, isVerifiedStack) => {
                    setActiveSection(section);
                    setFormData({ ...prefillData, ...(isVerifiedStack ? { isCurrent: true, _isVerifiedStack: true } : {}) });
                    setEditingItem(null);
                    setIsSlideOverOpen(true);
                  }}
                  onEdit={(section, item, isVerifiedStack) => {
                    setActiveSection(section);
                    setEditingItem(item);
                    setFormData({ ...item, _isVerifiedStack: !!isVerifiedStack }); // Pre-fill form
                    setIsSlideOverOpen(true);
                  }}
                  onDelete={(section, id) => handleDeleteSection(section, id)}
                />
              </div>
            )}


            {/* Job Preferences Tab Content */}
            {activeProfileTab === 'preferences' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-500">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className={`border p-5 md:p-6 rounded-[32px] space-y-4 ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200 shadow-sm'}`}>
                    <h3 className={`text-xl font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-black'}`}><Briefcase className={isDark ? 'text-neutral-400' : 'text-neutral-600'} size={24} /> Target Roles</h3>
                    <p className={`text-xs ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>Add job titles you're interested in.</p>
                    <div className="flex gap-2">
                      <input type="text" value={targetRoleInput} onChange={(e) => setTargetRoleInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && targetRoleInput) { setTargetRoles([...targetRoles, targetRoleInput]); setTargetRoleInput(''); } }} placeholder="Type role and hit Enter..." className={`flex-1 border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 transition-all font-bold ${isDark ? 'bg-neutral-800 border-neutral-700 text-white focus:ring-neutral-600' : 'bg-white border-neutral-200 text-black focus:ring-neutral-200'}`} />
                    </div>
                    <div className="flex flex-wrap gap-2">{targetRoles.map((r, i) => (<div key={i} className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border ${isDark ? 'bg-white/10 text-white border-white/20' : 'bg-black/5 text-black border-black/10'}`}>{r}<button onClick={() => setTargetRoles(targetRoles.filter((_, idx) => idx !== i))} className="hover:opacity-70"><X size={12} /></button></div>))}</div>
                  </div>
                  <div className={`border p-5 md:p-6 rounded-[32px] space-y-4 ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200 shadow-sm'}`}>
                    <h3 className={`text-xl font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-black'}`}><Globe className={isDark ? 'text-neutral-400' : 'text-neutral-600'} size={24} /> Preferred Locations</h3>
                    <p className={`text-xs ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>Select countries and continents where you'd like to work.</p>

                    {/* Countries Dropdown */}
                    <div className="space-y-2">
                      <label className={`text-xs font-bold uppercase ${isDark ? 'text-neutral-500' : 'text-neutral-600'}`}>Countries</label>
                      <SearchableDropdown
                        options={COUNTRY_OPTIONS}
                        selectedValues={preferredCountries}
                        onSelect={(val) => setPreferredCountries([...preferredCountries, val])}
                        onRemove={(val) => setPreferredCountries(preferredCountries.filter(c => c !== val))}
                        placeholder="Select countries..."
                        searchPlaceholder="Search countries..."
                        isMulti={true}
                        isDark={isDark}
                      />
                    </div>

                    {/* Continents Dropdown */}
                    <div className="space-y-2">
                      <label className={`text-xs font-bold uppercase ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>Continents</label>
                      {/* Note: We need to store continents in state. Assuming preferredLocations structure is { countries: [], continents: [] } from API */}
                      {/* But current state `preferredCountries` seems to just be a string array. I need to check `preferredLocations` state object if it exists or if I need to split it. */}
                      {/* Reviewing state: `const [preferredCountries, setPreferredCountries] = useState<string[]>([]);` */}
                      {/* I need to add `preferredContinents` state. accessing via `preferredLocations.continents` in API. */}
                    </div>

                    <label className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${isDark ? 'bg-neutral-800/50 hover:bg-neutral-800' : 'bg-white border border-neutral-200 hover:bg-neutral-50'}`}>
                      <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${isOpenToRelocation ? (isDark ? 'bg-white border-white' : 'bg-black border-black') : isDark ? 'border-neutral-600' : 'border-neutral-300'}`}>{isOpenToRelocation && <Check size={14} className={isDark ? 'text-black' : 'text-white'} />}</div>
                      <input type="checkbox" checked={isOpenToRelocation} onChange={(e) => setIsOpenToRelocation(e.target.checked)} className="hidden" />
                      <span className={`text-sm font-bold ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}>Open to relocation</span>
                    </label>
                  </div>
                </div>
                <div className={`border p-5 md:p-6 rounded-[32px] space-y-4 ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200 shadow-sm'}`}>
                  <h3 className={`text-xl font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-black'}`}><Clock className={isDark ? 'text-neutral-400' : 'text-neutral-600'} size={24} /> Experience Years</h3>
                  <p className={`text-xs ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>How many years of relevant experience do you have?</p>
                  <div className="grid grid-cols-2 gap-3">
                    {EXPERIENCE_YEAR_RANGES.map((range) => (
                      <label key={range.value} className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border ${isDark ? 'bg-neutral-800 border-neutral-700 hover:bg-neutral-700' : 'bg-white border-neutral-200 hover:bg-neutral-50'}`}>
                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${experienceYearRanges.includes(range.value) ? (isDark ? 'bg-white border-white' : 'bg-black border-black') : isDark ? 'border-neutral-600' : 'border-neutral-300'}`}>
                          {experienceYearRanges.includes(range.value) && <Check size={14} className={isDark ? 'text-black' : 'text-white'} />}
                        </div>
                        <input
                          type="checkbox"
                          className="hidden"
                          checked={experienceYearRanges.includes(range.value)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setExperienceYearRanges([...experienceYearRanges, range.value]);
                            } else {
                              setExperienceYearRanges(experienceYearRanges.filter(r => r !== range.value));
                            }
                          }}
                        />
                        <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-black'}`}>{range.label}</span>
                      </label>
                    ))}
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
      </div >

      {/* --- THE SLIDER (OVERLAY) --- */}
      < div
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

              <div className="flex flex-col items-center gap-0.5">
                <button
                  onClick={() => magicImportInputRef.current?.click()}
                  disabled={isParsing}
                  className={`flex items-center gap-2 px-3 py-2 border rounded-lg transition-all ${isDark ? 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:text-white' : 'bg-white border-neutral-300 text-slate-600 hover:text-black shadow-sm'} ${isParsing ? 'opacity-50 cursor-wait' : ''}`}
                  title="Import from File (PDF/Word)"
                >
                  {isParsing ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
                  <span className="text-xs font-bold hidden sm:inline">Import</span>
                </button>
                <span className={`text-[9px] font-medium ${isDark ? 'text-neutral-500' : 'text-neutral-600'}`}>pdf/docx/txt only</span>
              </div>
              <input
                ref={magicImportInputRef}
                type="file"
                accept=".pdf,.docx,.txt"
                onChange={handleMagicUpload}
                className="hidden"
              />

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
      </div >

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
      {
        linkPreviewUrl && linkPreviewPosition && (
          <LinkPreview
            url={linkPreviewUrl}
            position={linkPreviewPosition}
            onClose={closeLinkPreview}
            onInsert={() => insertLinkFromPreview()}
          />
        )
      }
      <SlideOverPanel
        isOpen={isSlideOverOpen}
        onClose={() => setIsSlideOverOpen(false)}
        title={editingItem ? `Edit ${activeSection}` : `Add ${activeSection}`}
        isDark={isDark}
      >
        <div className="space-y-4">
          {/* EMPLOYMENT FORM */}
          {activeSection === 'employment' && (
            <>
              <div>
                <label className={`text-xs font-bold uppercase ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>Company / Organization</label>
                <input disabled={formData._isVerifiedStack} className={`w-full p-3 rounded-xl border mt-1 ${isDark ? 'bg-neutral-800 border-neutral-700' : 'bg-neutral-50 border-neutral-200'} ${formData._isVerifiedStack ? 'opacity-50 cursor-not-allowed' : ''}`} value={formData.company || ''} onChange={e => setFormData({ ...formData, company: e.target.value })} placeholder="Company Name" />
              </div>
              <div>
                <label className={`text-xs font-bold uppercase ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>Title</label>
                <input className={`w-full p-3 rounded-xl border mt-1 ${isDark ? 'bg-neutral-800 border-neutral-700' : 'bg-neutral-50 border-neutral-200'}`} value={formData.title || ''} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="Job Title" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`text-xs font-bold uppercase ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>Start Date</label>
                  <input type="date" className={`w-full p-3 rounded-xl border mt-1 ${isDark ? 'bg-neutral-800 border-neutral-700' : 'bg-neutral-50 border-neutral-200'}`} value={formData.startDate || ''} onChange={e => setFormData({ ...formData, startDate: e.target.value })} />
                </div>
                <div>
                  <label className={`text-xs font-bold uppercase ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>End Date</label>
                  <input type="date" disabled={formData.isCurrent || formData._isVerifiedStack} className={`w-full p-3 rounded-xl border mt-1 ${isDark ? 'bg-neutral-800 border-neutral-700' : 'bg-neutral-50 border-neutral-200'} ${(formData.isCurrent || formData._isVerifiedStack) ? 'opacity-50 cursor-not-allowed' : ''}`} value={formData.endDate || ''} onChange={e => setFormData({ ...formData, endDate: e.target.value })} />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="isCurrent" disabled={formData._isVerifiedStack} checked={formData.isCurrent || false} onChange={e => setFormData({ ...formData, isCurrent: e.target.checked })} />
                <label htmlFor="isCurrent" className={`text-sm font-medium ${isDark ? 'text-white' : 'text-black'} ${formData._isVerifiedStack ? 'opacity-50 cursor-not-allowed' : ''}`}>I currently work here</label>
              </div>
              <div>
                <label className={`text-xs font-bold uppercase ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>Description</label>
                <textarea className={`w-full p-3 h-32 rounded-xl border mt-1 ${isDark ? 'bg-neutral-800 border-neutral-700' : 'bg-neutral-50 border-neutral-200'}`} value={formData.description || ''} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Describe your role..." />
              </div>
            </>
          )}

          {/* EDUCATION FORM */}
          {activeSection === 'education' && (
            <>
              <div>
                <label className={`text-xs font-bold uppercase ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>School / University</label>
                <input className={`w-full p-3 rounded-xl border mt-1 ${isDark ? 'bg-neutral-800 border-neutral-700' : 'bg-neutral-50 border-neutral-200'}`} value={formData.school || ''} onChange={e => setFormData({ ...formData, school: e.target.value })} placeholder="School Name" />
              </div>
              <div>
                <label className={`text-xs font-bold uppercase ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>Degree</label>
                <input className={`w-full p-3 rounded-xl border mt-1 ${isDark ? 'bg-neutral-800 border-neutral-700' : 'bg-neutral-50 border-neutral-200'}`} value={formData.degree || ''} onChange={e => setFormData({ ...formData, degree: e.target.value })} placeholder="Bachelor's, Master's..." />
              </div>
              <div>
                <label className={`text-xs font-bold uppercase ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>Field of Study</label>
                <input className={`w-full p-3 rounded-xl border mt-1 ${isDark ? 'bg-neutral-800 border-neutral-700' : 'bg-neutral-50 border-neutral-200'}`} value={formData.fieldOfStudy || ''} onChange={e => setFormData({ ...formData, fieldOfStudy: e.target.value })} placeholder="Computer Science..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`text-xs font-bold uppercase ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>Start Date</label>
                  <input type="date" className={`w-full p-3 rounded-xl border mt-1 ${isDark ? 'bg-neutral-800 border-neutral-700' : 'bg-neutral-50 border-neutral-200'}`} value={formData.startDate || ''} onChange={e => setFormData({ ...formData, startDate: e.target.value })} />
                </div>
                <div>
                  <label className={`text-xs font-bold uppercase ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>End Date</label>
                  <input type="date" disabled={formData.isCurrent} className={`w-full p-3 rounded-xl border mt-1 ${isDark ? 'bg-neutral-800 border-neutral-700' : 'bg-neutral-50 border-neutral-200'} ${formData.isCurrent ? 'opacity-50' : ''}`} value={formData.endDate || ''} onChange={e => setFormData({ ...formData, endDate: e.target.value })} />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="isCurrentEdu" checked={formData.isCurrent || false} onChange={e => setFormData({ ...formData, isCurrent: e.target.checked })} />
                <label htmlFor="isCurrentEdu" className={`text-sm font-medium ${isDark ? 'text-white' : 'text-black'}`}>I am currently studying here</label>
              </div>
            </>
          )}

          {/* SKILLS FORM */}
          {activeSection === 'skills' && (
            <div>
              <label className={`text-xs font-bold uppercase ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>Skill Name</label>
              <input className={`w-full p-3 rounded-xl border mt-1 ${isDark ? 'bg-neutral-800 border-neutral-700' : 'bg-neutral-50 border-neutral-200'}`} value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="React, Python, Design..." />
            </div>
          )}

          {/* CERTIFICATIONS FORM */}
          {activeSection === 'certifications' && (
            <>
              <div>
                <label className={`text-xs font-bold uppercase ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>Name</label>
                <input className={`w-full p-3 rounded-xl border mt-1 ${isDark ? 'bg-neutral-800 border-neutral-700' : 'bg-neutral-50 border-neutral-200'}`} value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Certification Name" />
              </div>
              <div>
                <label className={`text-xs font-bold uppercase ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>Issuer</label>
                <input className={`w-full p-3 rounded-xl border mt-1 ${isDark ? 'bg-neutral-800 border-neutral-700' : 'bg-neutral-50 border-neutral-200'}`} value={formData.issuer || ''} onChange={e => setFormData({ ...formData, issuer: e.target.value })} placeholder="Google, AWS..." />
              </div>
              <div>
                <label className={`text-xs font-bold uppercase ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>Issue Date</label>
                <input type="date" className={`w-full p-3 rounded-xl border mt-1 ${isDark ? 'bg-neutral-800 border-neutral-700' : 'bg-neutral-50 border-neutral-200'}`} value={formData.issueDate || ''} onChange={e => setFormData({ ...formData, issueDate: e.target.value })} />
              </div>
            </>
          )}

          {/* AWARDS FORM */}
          {activeSection === 'awards' && (
            <>
              <div>
                <label className={`text-xs font-bold uppercase ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>Title</label>
                <input className={`w-full p-3 rounded-xl border mt-1 ${isDark ? 'bg-neutral-800 border-neutral-700' : 'bg-neutral-50 border-neutral-200'}`} value={formData.title || ''} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="Award Title" />
              </div>
              <div>
                <label className={`text-xs font-bold uppercase ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>Issuer</label>
                <input className={`w-full p-3 rounded-xl border mt-1 ${isDark ? 'bg-neutral-800 border-neutral-700' : 'bg-neutral-50 border-neutral-200'}`} value={formData.issuer || ''} onChange={e => setFormData({ ...formData, issuer: e.target.value })} placeholder="Organization..." />
              </div>
              <div>
                <label className={`text-xs font-bold uppercase ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>Date</label>
                <input type="date" className={`w-full p-3 rounded-xl border mt-1 ${isDark ? 'bg-neutral-800 border-neutral-700' : 'bg-neutral-50 border-neutral-200'}`} value={formData.date || ''} onChange={e => setFormData({ ...formData, date: e.target.value })} />
              </div>
            </>
          )}

          {/* OTHER PROFILES FORM */}
          {activeSection === 'other_profiles' && (
            <>
              <div>
                <label className={`text-xs font-bold uppercase ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>Network</label>
                <input className={`w-full p-3 rounded-xl border mt-1 ${isDark ? 'bg-neutral-800 border-neutral-700' : 'bg-neutral-50 border-neutral-200'}`} value={formData.network || ''} onChange={e => setFormData({ ...formData, network: e.target.value })} placeholder="LinkedIn, GitHub..." />
              </div>
              <div>
                <label className={`text-xs font-bold uppercase ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>URL</label>
                <input className={`w-full p-3 rounded-xl border mt-1 ${isDark ? 'bg-neutral-800 border-neutral-700' : 'bg-neutral-50 border-neutral-200'}`} value={formData.url || ''} onChange={e => setFormData({ ...formData, url: e.target.value })} placeholder="https://..." />
              </div>
            </>
          )}

          <div className="pt-4">
            <button
              onClick={() => handleSaveSection(formData)}
              disabled={sectionLoading}
              className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 disabled:opacity-50"
            >
              {sectionLoading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </SlideOverPanel>

      {/* Posts SlideOver */}
      <SlideOverPanel
        isOpen={isPostsPanelOpen}
        onClose={() => setIsPostsPanelOpen(false)}
        title="Posts"
        isDark={isDark}
        className="max-w-2xl"
      >
        <div className="space-y-4 pb-20">
          <div className="flex items-center gap-4 border-b pb-4 mb-4 dark:border-neutral-800">
            <button
              onClick={() => setActivePostsTab('posts')}
              className={`pb-2 text-sm font-bold uppercase tracking-wider transition-colors border-b-2 ${activePostsTab === 'posts' ? (isDark ? 'text-white border-white' : 'text-black border-black') : (isDark ? 'text-neutral-500 border-transparent hover:text-neutral-300' : 'text-neutral-400 border-transparent hover:text-neutral-600')}`}
            >
              Posts
            </button>
            <button
              onClick={() => setActivePostsTab('reposts')}
              className={`pb-2 text-sm font-bold uppercase tracking-wider transition-colors border-b-2 ${activePostsTab === 'reposts' ? (isDark ? 'text-white border-white' : 'text-black border-black') : (isDark ? 'text-neutral-500 border-transparent hover:text-neutral-300' : 'text-neutral-400 border-transparent hover:text-neutral-600')}`}
            >
              Reposts
            </button>
            <button
              onClick={() => setActivePostsTab('saved')}
              className={`pb-2 text-sm font-bold uppercase tracking-wider transition-colors border-b-2 ${activePostsTab === 'saved' ? (isDark ? 'text-white border-white' : 'text-black border-black') : (isDark ? 'text-neutral-500 border-transparent hover:text-neutral-300' : 'text-neutral-400 border-transparent hover:text-neutral-600')}`}
            >
              Saved
            </button>
          </div>

          {isProfilePostsLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className={`animate-spin ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`} />
            </div>
          ) : profilePosts.length > 0 ? (
            <div className="space-y-4">
              {profilePosts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  isDark={isDark}
                  currentUserId={userId}
                  onLike={() => handleLike(post.id)}
                  onRepost={() => handleRepost(post.id)}
                  onShare={() => handleShare(post.id)}
                  onFollow={() => handleFollow(post.author.id, post.author.type === 'employer' ? 'company' : 'user')}
                  onReport={handleReport}
                  onDelete={handleDeletePost}
                  onEdit={() => { }} // or handleStartEdit if implemented

                  onCommentAdded={() => setProfilePosts((prev: any[]) => prev.map(p => p.id === post.id ? { ...p, commentsCount: (p.commentsCount || 0) + 1 } : p))}
                  onSave={() => handleSave(post.id, post.author.type)}
                />
              ))}
            </div>
          ) : (
            <p className={`text-center py-10 text-sm ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>
              No posts found.
            </p>
          )}
        </div>
      </SlideOverPanel>
    </>
  );
}
