"use client"

import React, { useState, useEffect, useRef } from 'react';
import { FileText, Download, Clock, CheckCircle, AlertCircle, Upload, X } from 'lucide-react';

interface Contract {
    id: string;
    jobTitle: string;
    employerName: string;
    status: 'active' | 'terminated' | 'ended';
    contractUrl: string;
    previousContractUrl?: string;
    createdAt: string;
    value: string;
}

export default function ProfessionalContractsPage() {
    const [contracts, setContracts] = useState<Contract[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploadForm, setUploadForm] = useState({ jobTitle: '', employerName: '', value: '' });

    useEffect(() => {
        fetchContracts();
    }, []);

    const fetchContracts = async () => {
        try {
            const res = await fetch('/api/professional/contracts');
            if (res.ok) {
                const data = await res.json();
                setContracts(data.contracts);
            }
        } catch (error) {
            console.error("Error fetching contracts", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        const file = e.target.files[0];

        if (!uploadForm.jobTitle || !uploadForm.employerName || !uploadForm.value) {
            alert('Please fill in all fields');
            return;
        }

        setIsUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('jobTitle', uploadForm.jobTitle);
            formData.append('employerName', uploadForm.employerName);
            formData.append('value', uploadForm.value);

            const res = await fetch('/api/professional/contracts/upload', {
                method: 'POST',
                body: formData
            });

            if (res.ok) {
                setIsUploadModalOpen(false);
                setUploadForm({ jobTitle: '', employerName: '', value: '' });
                fetchContracts();
            } else {
                alert('Failed to upload contract');
            }
        } catch (error) {
            console.error('Upload error:', error);
            alert('Failed to upload contract');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <>
            <div className="p-8 max-w-7xl mx-auto space-y-8 pb-32 h-full flex flex-col">
                <header className="flex items-center justify-between border-b border-slate-800 pb-8 shrink-0">
                    <div className="text-left">
                        <h1 className="text-4xl font-black text-white uppercase tracking-tighter">My Contracts</h1>
                        <p className="text-slate-400 mt-2">View your active and past employment contracts.</p>
                    </div>
                    <button
                        onClick={() => setIsUploadModalOpen(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-lg shadow-blue-600/20 active:scale-95"
                    >
                        <Upload size={18} />
                        <span>Upload Contract</span>
                    </button>
                </header>

                {isLoading ? (
                    <div className="flex-1 flex flex-col items-center justify-center">
                        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mb-4"></div>
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Loading contracts...</p>
                    </div>
                ) : contracts.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-600 space-y-4">
                        <FileText size={64} className="opacity-10" />
                        <p className="font-bold text-sm uppercase tracking-widest">No active contracts found</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto pb-20">
                        {contracts.map(contract => (
                            <div key={contract.id} className="group bg-[#0f172a] border border-slate-800 rounded-[32px] p-6 hover:border-blue-500/30 transition-all relative overflow-hidden flex flex-col cursor-default">
                                <div className="absolute top-0 right-0 p-4">
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${contract.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                        contract.status === 'terminated' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                            'bg-slate-800 text-slate-500 border-slate-700'
                                        }`}>
                                        {contract.status}
                                    </span>
                                </div>

                                <div className="mb-6 mt-2">
                                    <h3 className="text-xl font-black text-white uppercase tracking-tight line-clamp-1">{contract.jobTitle}</h3>
                                    <p className="text-blue-400 font-bold text-sm">{contract.employerName}</p>
                                </div>

                                <div className="space-y-4 mb-6 flex-1">
                                    <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-2xl border border-slate-800/50">
                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Value</span>
                                        <span className="font-mono text-white font-bold">{contract.value}</span>
                                    </div>
                                    <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-2xl border border-slate-800/50">
                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Signed</span>
                                        <span className="font-mono text-slate-300 text-xs">{new Date(contract.createdAt).toLocaleDateString()}</span>
                                    </div>
                                </div>

                                <div className="space-y-2 mt-auto">
                                    <a
                                        href={contract.contractUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-between w-full p-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-lg shadow-blue-600/20 active:scale-95 group-hover:scale-[1.02]"
                                    >
                                        <span>Current Contract</span>
                                        <Download size={16} />
                                    </a>

                                    {contract.previousContractUrl && (
                                        <a
                                            href={contract.previousContractUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center justify-between w-full p-3 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl font-bold uppercase tracking-widest text-[10px] transition-all"
                                        >
                                            <span>Previous Version</span>
                                            <Clock size={14} />
                                        </a>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Upload Modal */}
            {isUploadModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setIsUploadModalOpen(false)}></div>
                    <div className="relative w-full max-w-lg bg-[#0f172a] border border-slate-700 rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                            <h3 className="text-xl font-bold text-white uppercase tracking-tight">Upload Contract</h3>
                            <button onClick={() => setIsUploadModalOpen(false)} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Job Title</label>
                                <input
                                    type="text"
                                    value={uploadForm.jobTitle}
                                    onChange={(e) => setUploadForm({ ...uploadForm, jobTitle: e.target.value })}
                                    placeholder="e.g. Senior Developer"
                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Employer Name</label>
                                <input
                                    type="text"
                                    value={uploadForm.employerName}
                                    onChange={(e) => setUploadForm({ ...uploadForm, employerName: e.target.value })}
                                    placeholder="e.g. Tech Corp"
                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Contract Value</label>
                                <input
                                    type="text"
                                    value={uploadForm.value}
                                    onChange={(e) => setUploadForm({ ...uploadForm, value: e.target.value })}
                                    placeholder="e.g. $120,000/year"
                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Contract File (PDF)</label>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".pdf"
                                    onChange={handleFileUpload}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-500 transition-all"
                                />
                            </div>
                        </div>
                        <div className="p-6 bg-slate-900/50 flex gap-3">
                            <button
                                onClick={() => setIsUploadModalOpen(false)}
                                className="flex-1 py-3 px-4 rounded-xl border border-slate-700 text-slate-300 font-bold hover:bg-slate-800 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploading || !uploadForm.jobTitle || !uploadForm.employerName || !uploadForm.value}
                                className="flex-1 py-3 px-4 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isUploading ? 'Uploading...' : 'Choose File & Upload'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
