"use client"

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, FileText, Search, Download, ExternalLink, Calendar } from 'lucide-react';

interface Contract {
    id: string;
    status: string;
    contract_url: string;
    contract_value: string;
    created_at: string;
    job: { title: string };
    professional: { name: string; email: string };
}

export default function ContractsPage() {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState('');
    const [contracts, setContracts] = useState<Contract[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchContracts();
    }, []);

    const fetchContracts = async () => {
        try {
            const res = await fetch('/api/employer/contracts'); // This needs to return all contracts for the employer
            if (res.ok) {
                const data = await res.json();
                setContracts(data.contracts || []);
            }
        } catch (error) {
            console.error('Error fetching contracts:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredContracts = contracts.filter(c =>
        c.professional?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.job?.title?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-8 h-full flex flex-col">
            <div className="max-w-7xl mx-auto w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

                {/* Header */}
                <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="text-left">
                        <div className="flex items-center gap-2 text-emerald-400 mb-2">
                            <Shield size={16} />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Legal & Compliance</span>
                        </div>
                        <h1 className="text-4xl font-black text-white uppercase tracking-tighter leading-none">Employment Contracts</h1>
                        <p className="text-slate-500 mt-2 text-sm font-medium">Manage and review all signed employment agreements.</p>
                    </div>
                </header>

                {/* Search */}
                <div className="flex flex-wrap gap-4 items-center justify-between">
                    <div className="relative flex-1 min-w-[300px]">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                        <input type="text" placeholder="Search by professional or job title..." className="w-full bg-[#0f172a]/50 border border-white/5 rounded-2xl pl-12 pr-4 py-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                </div>

                {/* Contracts Grid */}
                {isLoading ? (
                    <div className="p-12 text-center">
                        <div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                        <p className="text-slate-500">Loading contracts...</p>
                    </div>
                ) : filteredContracts.length === 0 ? (
                    <div className="bg-[#0f172a] border border-slate-800 rounded-[40px] p-12 text-center space-y-4">
                        <div className="w-20 h-20 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto">
                            <FileText size={32} className="text-slate-600" />
                        </div>
                        <h4 className="text-lg font-bold text-slate-300">No Contracts Found</h4>
                        <p className="text-slate-500 max-w-md mx-auto">Uploaded contracts from your Connections will appear here.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredContracts.map(contract => (
                            <div key={contract.id} className="group bg-[#0f172a] border border-slate-800 rounded-[32px] p-6 hover:border-emerald-500/30 transition-all relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <a href={contract.contract_url} target="_blank" rel="noopener noreferrer" className="p-2 bg-emerald-500 text-white rounded-xl shadow-lg hover:bg-emerald-400 block" title="Download Contract">
                                        <Download size={18} />
                                    </a>
                                </div>

                                <div className="space-y-4">
                                    <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-emerald-500 mb-4">
                                        <FileText size={20} />
                                    </div>

                                    <div>
                                        <h3 className="text-lg font-bold text-white uppercase tracking-tight">{contract.professional?.name || 'Professional'}</h3>
                                        <p className="text-xs text-blue-400 font-bold uppercase tracking-widest mt-1">{contract.job?.title || 'Job Title'}</p>
                                    </div>

                                    <div className="pt-4 border-t border-slate-800 space-y-2">
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="text-slate-500 font-medium">Value</span>
                                            <span className="text-white font-mono font-bold">{contract.contract_value || 'N/A'}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="text-slate-500 font-medium">Signed</span>
                                            <span className="text-slate-300">{new Date(contract.created_at).toLocaleDateString()}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="text-slate-500 font-medium">Status</span>
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${contract.status === 'terminated' ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'}`}>{contract.status}</span>
                                        </div>
                                    </div>

                                    <a href={contract.contract_url} target="_blank" rel="noopener noreferrer" className="block w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-[10px] font-bold uppercase tracking-widest text-center transition-all mt-4">
                                        View Document
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
