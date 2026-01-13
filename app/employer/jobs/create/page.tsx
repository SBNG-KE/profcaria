"use client"

import React, { useState, useRef, useEffect, Suspense } from 'react';
import { ROLE_CATEGORY_OPTIONS } from '@/lib/role-categories';
export const dynamic = 'force-dynamic';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    Plus, X, GripVertical, Type, Hash, List, CheckSquare,
    ChevronUp, ChevronDown, Save, Trash2, Layout, Briefcase, FileText, MapPin, Clock
} from 'lucide-react';

interface FormField {
    id: string;
    type: 'text' | 'number' | 'radio' | 'checkbox';
    label: string;
    options?: string[];
    required: boolean;
}

function CreateJobPageContent() {
    const router = useRouter();
    const [title, setTitle] = useState('');
    const [roleCategories, setRoleCategories] = useState<string[]>([]);
    const [description, setDescription] = useState('');
    const [maxApplications, setMaxApplications] = useState<number | ''>('');
    const [locationType, setLocationType] = useState<'remote' | 'onsite' | 'hybrid'>('remote');
    const [employmentType, setEmploymentType] = useState<'full-time' | 'part-time' | 'contract' | 'internship' | 'temporary'>('full-time');
    const [location, setLocation] = useState('');
    const [isRestricted, setIsRestricted] = useState(false);
    const [targetLocations, setTargetLocations] = useState<string[]>([]);
    const [targetLocInput, setTargetLocInput] = useState('');
    const [fields, setFields] = useState<FormField[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [canRestrict, setCanRestrict] = useState(false);

    useEffect(() => {
        fetch('/api/employer/limits')
            .then(res => res.json())
            .then(data => {
                if (data.limits) {
                    setCanRestrict(data.limits.restrictedLocations);
                }
            })
            .catch(console.error);
    }, []);

    // Get jobId from search params
    const searchParams = useSearchParams();
    const jobId = searchParams.get('id');

    useEffect(() => {
        if (!jobId) return;

        const fetchJob = async () => {
            setIsLoading(true);
            try {
                const res = await fetch('/api/employer/jobs');
                if (res.ok) {
                    const data = await res.json();
                    const job = data.jobs.find((j: any) => j.id === jobId);
                    if (job) {
                        setTitle(job.title);
                        if (job.role_categories && Array.isArray(job.role_categories)) {
                            setRoleCategories(job.role_categories);
                        } else if (job.role_category) {
                            setRoleCategories([job.role_category]);
                        }
                        setDescription(job.description);
                        if (job.max_applications) setMaxApplications(job.max_applications);
                        setLocationType(job.location_type || 'remote');
                        setEmploymentType(job.employment_type || 'full-time');
                        setLocation(job.location || '');
                        setIsRestricted(job.is_restricted || false);
                        // Decrypting target locations is done in API but returned as plain array in GET
                        setTargetLocations(job.target_locations || []);
                        setFields(job.formSchema || []);
                    }
                }
            } catch (error) {
                console.error("Error fetching job details", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchJob();
    }, [jobId]);

    const addField = (type: FormField['type']) => {
        const newField: FormField = {
            id: Math.random().toString(36).substr(2, 9),
            type,
            label: '',
            required: false,
            options: type === 'radio' || type === 'checkbox' ? ['Option 1'] : undefined
        };
        setFields([...fields, newField]);
    };

    const removeField = (id: string) => {
        setFields(fields.filter(f => f.id !== id));
    };

    const updateField = (id: string, updates: Partial<FormField>) => {
        setFields(fields.map(f => f.id === id ? { ...f, ...updates } : f));
    };

    const moveField = (index: number, direction: 'up' | 'down') => {
        const newFields = [...fields];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= fields.length) return;

        [newFields[index], newFields[targetIndex]] = [newFields[targetIndex], newFields[index]];
        setFields(newFields);
    };

    const handleSave = async () => {
        if (!title || !description || fields.length === 0) {
            alert("Please fill in the job title, description, and at least one form field.");
            return;
        }

        setIsSaving(true);
        try {
            const url = jobId ? `/api/employer/jobs/${jobId}` : '/api/employer/jobs';
            const method = jobId ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title,
                    role_categories: roleCategories,
                    description,
                    max_applications: maxApplications,
                    location_type: locationType,
                    employment_type: employmentType,
                    location: location,
                    is_restricted: isRestricted,
                    target_locations: targetLocations,
                    formSchema: fields
                })
            });

            if (res.ok) {
                router.push('/employer/home');
            } else {
                alert("Failed to save job.");
            }
        } catch (error) {
            console.error("Save error:", error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8 pb-32 font-sans">
            <header className="flex items-center justify-between border-b border-slate-800 pb-8">
                <div className="text-left">
                    <h1 className="text-4xl font-black text-white uppercase tracking-tighter">{jobId ? 'Edit Job Post' : 'Create New Job'}</h1>
                    <p className="text-slate-400 mt-2">{jobId ? 'Update your job details and application form.' : 'Design your custom application form and set job details.'}</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-xl shadow-emerald-600/20 active:scale-95 disabled:opacity-50"
                >
                    <Save size={18} />
                    <span>{isSaving ? 'Saving...' : jobId ? 'Update Job' : 'Publish Job'}</span>
                </button>
            </header>

            {/* MAIN DETAILS CARD */}
            <div className="bg-[#0f172a] border border-slate-800 p-8 rounded-[32px] space-y-6">
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                        <Briefcase size={14} /> Job Title
                    </label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g. Senior Frontend Engineer"
                        className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-bold text-lg"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                        <Briefcase size={14} /> Role Categories {roleCategories.length > 0 && <span className="text-blue-400">({roleCategories.length} selected)</span>}
                    </label>
                    <select
                        onChange={(e) => {
                            if (e.target.value) {
                                if (roleCategories.includes(e.target.value)) {
                                    setRoleCategories(roleCategories.filter(c => c !== e.target.value));
                                } else {
                                    setRoleCategories([...roleCategories, e.target.value]);
                                }
                                e.target.value = ''; // Reset
                            }
                        }}
                        className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-bold text-sm appearance-none cursor-pointer"
                    >
                        <option value="">+ Add a category...</option>
                        {ROLE_CATEGORY_OPTIONS.map(opt => (
                            <option
                                key={opt.value}
                                value={opt.value}
                                disabled={roleCategories.includes(opt.value)}
                                className={roleCategories.includes(opt.value) ? 'text-slate-500' : ''}
                            >
                                {opt.label} {roleCategories.includes(opt.value) ? '✓' : ''}
                            </option>
                        ))}
                    </select>

                    {roleCategories.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                            {roleCategories.map(cat => {
                                const label = ROLE_CATEGORY_OPTIONS.find(o => o.value === cat)?.label || cat;
                                return (
                                    <button
                                        key={cat}
                                        onClick={() => setRoleCategories(roleCategories.filter(c => c !== cat))}
                                        className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30 rounded-lg text-xs font-bold transition-all group"
                                    >
                                        <span>{label}</span>
                                        <X size={12} className="opacity-50 group-hover:opacity-100" />
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                        <FileText size={14} /> Description
                    </label>
                    {/* List Format Buttons */}
                    <div className="flex gap-2 mb-2">
                        <button
                            type="button"
                            onClick={() => {
                                const lines = description.split('\n');
                                const formatted = lines.map(line => {
                                    if (line.trim() && !line.trim().startsWith('•') && !line.trim().match(/^\d+\./)) {
                                        return '• ' + line.trim();
                                    }
                                    return line;
                                }).join('\n');
                                setDescription(formatted);
                            }}
                            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg text-xs font-bold transition-all flex items-center gap-2"
                        >
                            <List size={14} /> Bullets
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                const lines = description.split('\n');
                                let counter = 1;
                                const formatted = lines.map(line => {
                                    if (line.trim() && !line.trim().startsWith('•') && !line.trim().match(/^\d+\./)) {
                                        return `${counter++}. ` + line.trim();
                                    } else if (line.trim()) {
                                        // Replace existing bullet with number
                                        const cleaned = line.replace(/^[•\d]+\.?\s*/, '').trim();
                                        if (cleaned) return `${counter++}. ${cleaned}`;
                                    }
                                    return line;
                                }).join('\n');
                                setDescription(formatted);
                            }}
                            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg text-xs font-bold transition-all flex items-center gap-2"
                        >
                            <Hash size={14} /> Numbered
                        </button>
                    </div>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Describe the role, responsibilities, and requirements..."
                        className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all min-h-[150px] text-sm leading-relaxed"
                    />
                </div>
            </div>

            {/* MAX APPLICATIONS (NEW) */}
            <div className="bg-[#0f172a] border border-slate-800 p-8 rounded-[32px] space-y-6">
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                        <Hash size={14} /> Max Applications (Optional)
                    </label>
                    <p className="text-xs text-slate-500">Auto-close the job after this many applications. Leave empty for unlimited.</p>
                    <input
                        type="number"
                        min="1"
                        value={maxApplications}
                        onChange={(e) => setMaxApplications(e.target.value ? parseInt(e.target.value) : '')}
                        placeholder="e.g. 100"
                        className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-bold text-lg"
                    />
                </div>
            </div>

            {/* LOCATION & EMPLOYMENT GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Location Card */}
                <div className="bg-[#0f172a] border border-slate-800 p-8 rounded-[32px] space-y-6 flex flex-col h-full">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                            <MapPin size={14} /> Location Type
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            {(['remote', 'onsite', 'hybrid'] as const).map((type) => (
                                <button
                                    key={type}
                                    onClick={() => setLocationType(type)}
                                    className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl border transition-all ${locationType === type
                                        ? 'bg-emerald-600/20 border-emerald-500/50 text-white'
                                        : 'bg-slate-900/50 border-slate-700/50 text-slate-400 hover:border-slate-600'
                                        }`}
                                >
                                    <div className={`w-3 h-3 rounded-full border-2 flex items-center justify-center ${locationType === type ? 'border-emerald-500' : 'border-slate-600'
                                        }`}>
                                        {locationType === type && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                                    </div>
                                    <span className="font-bold text-[10px] uppercase tracking-wider">{type}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2 flex-1 flex flex-col justify-end">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                            <MapPin size={14} /> Specific Location
                        </label>
                        <input
                            type="text"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            placeholder={locationType === 'remote' ? "e.g. Worldwide or New York (HQ)" : "e.g. London, UK"}
                            className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-bold"
                        />
                    </div>

                    <div className="pt-4 border-t border-slate-800 space-y-4">
                        <label className={`flex items-center justify-between group ${canRestrict ? 'cursor-pointer' : 'cursor-not-allowed opacity-70'}`}>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 group-hover:text-blue-400 transition-colors">
                                    <MapPin size={14} /> Restricted Area?
                                </span>
                                <span className="text-[10px] text-slate-600 font-medium mt-1">
                                    Only visible to candidates in specific locations.
                                </span>
                            </div>
                            <div className={`w-10 h-6 rounded-full p-1 transition-all ${isRestricted ? 'bg-blue-600' : 'bg-slate-700'} ${!canRestrict ? 'opacity-50' : ''}`}>
                                <div className={`w-4 h-4 bg-white rounded-full shadow-md transition-all transform ${isRestricted ? 'translate-x-4' : 'translate-x-0'}`} />
                            </div>
                            <input type="checkbox" checked={isRestricted} onChange={(e) => setIsRestricted(e.target.checked)} className="hidden" disabled={!canRestrict} />
                        </label>
                        {!canRestrict && (
                            <p className="text-[10px] text-amber-500 font-bold bg-amber-500/10 p-2 rounded-lg border border-amber-500/20">
                                Upgrade to Pro or Enterprise to access Restricted Locations feature.
                            </p>
                        )}

                        {isRestricted && (
                            <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={targetLocInput}
                                        onChange={(e) => setTargetLocInput(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && targetLocInput) {
                                                e.preventDefault();
                                                setTargetLocations([...targetLocations, targetLocInput]);
                                                setTargetLocInput('');
                                            }
                                        }}
                                        placeholder="Add Allowed Country (e.g. Kenya)"
                                        className="flex-1 bg-slate-900/50 border border-slate-700/50 rounded-xl px-3 py-2 text-white text-xs font-bold focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                    <button
                                        onClick={() => {
                                            if (targetLocInput) {
                                                setTargetLocations([...targetLocations, targetLocInput]);
                                                setTargetLocInput('');
                                            }
                                        }}
                                        className="p-2 bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white rounded-xl transition-all"
                                    >
                                        <Plus size={16} />
                                    </button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {targetLocations.map((loc, i) => (
                                        <span key={i} className="flex items-center gap-1.5 px-2 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                                            {loc}
                                            <button onClick={() => setTargetLocations(targetLocations.filter((_, idx) => idx !== i))} className="hover:text-red-400"><X size={12} /></button>
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Employment Type Card */}
                <div className="bg-[#0f172a] border border-slate-800 p-8 rounded-[32px] space-y-6 h-full">
                    <div className="space-y-2 h-full flex flex-col">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                            <Clock size={14} /> Employment Type
                        </label>
                        <div className="grid grid-cols-2 gap-2 flex-1">
                            {(['full-time', 'part-time', 'contract', 'internship'] as const).map((type) => (
                                <button
                                    key={type}
                                    onClick={() => setEmploymentType(type)}
                                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${employmentType === type
                                        ? 'bg-purple-600/20 border-purple-500/50 text-white'
                                        : 'bg-slate-900/50 border-slate-700/50 text-slate-400 hover:border-slate-600'
                                        }`}
                                >
                                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${employmentType === type ? 'border-purple-500' : 'border-slate-600'
                                        }`}>
                                        {employmentType === type && <div className="w-2 h-2 rounded-full bg-purple-500" />}
                                    </div>
                                    <span className="font-bold text-xs capitalize">{type}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="border-t border-slate-800 my-8"></div>

            {/* FORM BUILDER SECTION */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">

                {/* LEFT: FORM PREVIEW */}
                <div className="lg:col-span-3 space-y-4">
                    <div className="flex items-center justify-between px-4">
                        <h2 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-3">
                            <Layout size={24} className="text-blue-500" />
                            Application Form
                        </h2>
                        <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">{fields.length} Fields Added</span>
                    </div>

                    {fields.length === 0 ? (
                        <div className="border-2 border-dashed border-slate-800 rounded-[32px] p-20 flex flex-col items-center justify-center text-slate-600 space-y-4">
                            <Plus size={48} className="opacity-20" />
                            <p className="font-bold text-sm uppercase tracking-widest text-center">
                                Use the picker on the right<br />to add questions
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {fields.map((field, index) => (
                                <div key={field.id} className="group relative bg-[#0f172a] border border-slate-800 p-6 rounded-[32px] transition-all hover:border-blue-500/30 animate-in slide-in-from-right-4 duration-300">
                                    <div className="flex items-start justify-between gap-6">
                                        <div className="p-2 text-slate-700 cursor-grab active:cursor-grabbing"><GripVertical size={20} /></div>

                                        <div className="flex-1 space-y-4">
                                            <div className="flex items-center gap-4">
                                                <input
                                                    type="text"
                                                    value={field.label}
                                                    onChange={(e) => updateField(field.id, { label: e.target.value })}
                                                    placeholder="Enter your question here..."
                                                    className="flex-1 bg-transparent border-b border-slate-800 text-lg font-bold text-white placeholder:text-slate-700 focus:outline-none focus:border-blue-500 transition-colors"
                                                />
                                                <span className="px-3 py-1 bg-slate-900 text-[10px] font-black text-slate-500 uppercase tracking-widest rounded-lg border border-slate-800">{field.type}</span>
                                            </div>

                                            {(field.type === 'radio' || field.type === 'checkbox') && field.options && (
                                                <div className="space-y-2 ml-4">
                                                    {field.options.map((option, optIdx) => (
                                                        <div key={optIdx} className="flex items-center gap-3">
                                                            <div className={`w-4 h-4 rounded-full border border-slate-700 ${field.type === 'checkbox' ? 'rounded-sm' : ''}`} />
                                                            <input
                                                                type="text"
                                                                value={option}
                                                                onChange={(e) => {
                                                                    const newOptions = [...field.options!];
                                                                    newOptions[optIdx] = e.target.value;
                                                                    updateField(field.id, { options: newOptions });
                                                                }}
                                                                className="bg-transparent border-b border-transparent hover:border-slate-800 focus:border-blue-500 focus:outline-none text-sm text-slate-400 py-1 transition-all"
                                                            />
                                                            <button
                                                                onClick={() => {
                                                                    const newOptions = field.options!.filter((_, i) => i !== optIdx);
                                                                    updateField(field.id, { options: newOptions });
                                                                }}
                                                                className="p-1 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                                            >
                                                                <X size={14} />
                                                            </button>
                                                        </div>
                                                    ))}
                                                    <button
                                                        onClick={() => updateField(field.id, { options: [...field.options!, `Option ${field.options!.length + 1}`] })}
                                                        className="text-[10px] font-black text-blue-500 uppercase tracking-widest flex items-center gap-2 hover:text-blue-400 transition-all pt-2"
                                                    >
                                                        <Plus size={12} /> Add Option
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex flex-col gap-2">
                                            <button onClick={() => moveField(index, 'up')} className="p-2 hover:bg-slate-800 rounded-xl text-slate-500 hover:text-white transition-all"><ChevronUp size={18} /></button>
                                            <button onClick={() => moveField(index, 'down')} className="p-2 hover:bg-slate-800 rounded-xl text-slate-500 hover:text-white transition-all"><ChevronDown size={18} /></button>
                                            <button onClick={() => removeField(field.id)} className="p-2 hover:bg-red-500/10 rounded-xl text-slate-500 hover:text-red-500 transition-all"><Trash2 size={18} /></button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* RIGHT: TOOL PICKER (STICKY) */}
                <div className="lg:col-span-1">
                    <div className="sticky top-8 bg-blue-600/10 border border-blue-500/20 p-6 rounded-[32px] space-y-4">
                        <h3 className="text-sm font-black text-blue-400 uppercase tracking-widest">Add Field</h3>
                        <div className="grid grid-cols-1 gap-3">
                            <button onClick={() => addField('text')} className="flex items-center gap-3 p-4 bg-slate-900/50 hover:bg-slate-800 border border-slate-700/50 rounded-2xl text-slate-300 text-xs font-bold transition-all group">
                                <span className="p-2 bg-slate-800 rounded-lg group-hover:bg-slate-700 transition-all"><Type size={16} /></span>
                                Short Text
                            </button>
                            <button onClick={() => addField('number')} className="flex items-center gap-3 p-4 bg-slate-900/50 hover:bg-slate-800 border border-slate-700/50 rounded-2xl text-slate-300 text-xs font-bold transition-all group">
                                <span className="p-2 bg-slate-800 rounded-lg group-hover:bg-slate-700 transition-all"><Hash size={16} /></span>
                                Number
                            </button>
                            <button onClick={() => addField('radio')} className="flex items-center gap-3 p-4 bg-slate-900/50 hover:bg-slate-800 border border-slate-700/50 rounded-2xl text-slate-300 text-xs font-bold transition-all group">
                                <span className="p-2 bg-slate-800 rounded-lg group-hover:bg-slate-700 transition-all"><List size={16} /></span>
                                Choices
                            </button>
                            <button onClick={() => addField('checkbox')} className="flex items-center gap-3 p-4 bg-slate-900/50 hover:bg-slate-800 border border-slate-700/50 rounded-2xl text-slate-300 text-xs font-bold transition-all group">
                                <span className="p-2 bg-slate-800 rounded-lg group-hover:bg-slate-700 transition-all"><CheckSquare size={16} /></span>
                                Checkbox
                            </button>
                        </div>
                        <div className="pt-4 border-t border-blue-500/20">
                            <p className="text-[10px] text-blue-400/60 leading-relaxed font-medium">
                                Select a field type to add it to your application form on the left.
                            </p>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}

export default function CreateJobPage() {
    return (
        <Suspense fallback={<div className="p-8 text-slate-500 uppercase tracking-widest text-xs">Initializing Editor...</div>}>
            <CreateJobPageContent />
        </Suspense>
    );
}
