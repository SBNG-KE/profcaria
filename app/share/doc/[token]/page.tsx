
import { notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase';
import { decryptData } from '@/lib/security';
import { verifySmartLinkToken } from '@/lib/sharing';
import { Shield, Lock } from 'lucide-react';

// Force dynamic since we use params and DB
export const dynamic = 'force-dynamic';

export default async function SharedDocPage({ params }: { params: Promise<{ token: string }> }) {
    const { token } = await params;

    // 1. Verify Token
    const payload = verifySmartLinkToken<{
        uid: string;
        type?: string;
        docType?: string;
        sourceType?: 'connection' | 'document';
        sourceId?: string;
        exp: number;
    }>(token);

    if (!payload) {
        return (
            <div className="min-h-screen bg-[#020617] flex items-center justify-center p-8 text-center">
                <div className="space-y-4">
                    <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto border border-red-500/20">
                        <Lock className="text-red-500" size={32} />
                    </div>
                    <h1 className="text-2xl font-black text-white uppercase">Link Expired or Invalid</h1>
                    <p className="text-slate-500">This secure link is no longer active.</p>
                </div>
            </div>
        );
    }

    if (payload.exp < Date.now()) {
        return (
            <div className="min-h-screen bg-[#020617] flex items-center justify-center p-8 text-center">
                <div className="space-y-4">
                    <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto border border-amber-500/20">
                        <Lock className="text-amber-500" size={32} />
                    </div>
                    <h1 className="text-2xl font-black text-white uppercase">Link Expired</h1>
                    <p className="text-slate-500">This secure share link has timed out.</p>
                </div>
            </div>
        );
    }

    // 2. Fetch Document
    // Note: Assuming specific table or logic for 'REASON FOR LEAVING' vs generic 'documents'
    // This matches api/documents/route.ts logic basically
    let content = '';
    let title = payload.docType || payload.type || 'Document'; // Fallback
    let userName = 'Professional';

    // Fetch User Name for Context
    const { data: user } = await supabaseAdmin
        .schema('professional')
        .from('users')
        .select('enc_first_name, enc_last_name')
        .eq('id', payload.uid)
        .single();

    if (user) {
        userName = `${decryptData(user.enc_first_name) || "Professional"} ${decryptData(user.enc_last_name) || ""}`;
    }

    // Fetch Document Content
    if (payload.sourceType === 'connection' && payload.sourceId) {
        // Fetch from Connection (Employer Applications table)
        const { data: conn } = await supabaseAdmin
            .schema('employer')
            .from('applications')
            .select('enc_termination_reason')
            .eq('id', payload.sourceId)
            .single();

        if (conn && conn.enc_termination_reason) {
            content = decryptData(conn.enc_termination_reason) || "No reason provided.";
        } else {
            content = "No content available.";
        }
    } else {
        // Default: Documents table
        const { data: doc } = await supabaseAdmin
            .schema('professional')
            .from('documents')
            .select('enc_content')
            .eq('user_id', payload.uid)
            .eq('type', payload.docType || payload.type) // Handle legacy 'type'
            .single();

        if (doc) {
            content = decryptData(doc.enc_content) || "";
        } else {
            content = "No content available.";
        }
    }


    return (
        <div className="min-h-screen bg-[#0f172a] text-slate-300 font-sans py-12 px-4 md:px-0">
            <div className="max-w-2xl mx-auto bg-[#020617] border border-slate-800 rounded-[32px] overflow-hidden shadow-2xl">
                {/* Header */}
                <div className="bg-slate-900/50 p-8 border-b border-slate-800 text-center">
                    <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-500/20">
                        <Shield className="text-blue-500" size={24} />
                    </div>
                    <h1 className="text-2xl font-black text-white uppercase tracking-tight mb-2">{title}</h1>
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Shared by {userName}</p>
                </div>

                {/* Content */}
                <div className="p-10 leading-relaxed text-lg text-slate-300 min-h-[300px]">
                    <div dangerouslySetInnerHTML={{ __html: content }} className="prose prose-invert max-w-none prose-p:leading-relaxed prose-headings:font-black prose-headings:uppercase prose-a:text-blue-400" />
                </div>

                {/* Footer */}
                <div className="p-6 bg-slate-900/30 border-t border-slate-800 text-center">
                    <p className="text-[10px] text-slate-600 uppercase font-bold tracking-widest flex items-center justify-center gap-2">
                        <Lock size={12} />
                        Securely Shared via Profcaria
                    </p>
                </div>
            </div>
        </div>
    );
}
