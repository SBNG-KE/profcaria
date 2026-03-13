// Recruiter AI Agent — Gemini-powered hiring assistant for employers

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { supabaseAdmin } from '@/lib/supabase';
import { encryptData, decryptData } from '@/lib/security';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const runtime = 'nodejs';
export const maxDuration = 30;

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const SYSTEM_PROMPT = `You are Profcaria Recruiter AI — a confidential hiring assistant for employers on the Profcaria Career Operating System.

Your capabilities:
- Screen and evaluate job applicants based on their profile snapshots
- Generate targeted interview questions for specific candidates
- Summarize why a candidate is a good or bad fit for a role
- Compare candidates side by side
- Suggest what to look for in interviews
- Help draft job descriptions

Your personality:
- Professional, efficient, and data-driven
- When evaluating candidates, reference specific data from their profiles
- Give clear YES/NO/MAYBE hiring recommendations with reasoning
- Format responses with markdown (headers, bold, bullet points, tables) for readability

Rules:
- NEVER fabricate candidate data — only use what's provided in the context
- If you don't have enough data to evaluate, say so clearly
- Keep responses focused and actionable
- When comparing candidates, use tables for clarity
- Always consider both technical skills and soft indicators (endorsements, verification status)`;

// ── Build employer context ──
async function buildEmployerContext(userId: string): Promise<string> {
    const parts: string[] = [];

    // 1. Get company info
    const { data: company } = await supabaseAdmin
        .schema('employer')
        .from('companies')
        .select('enc_name, enc_industry, enc_size, enc_website, enc_description')
        .eq('owner_id', userId)
        .single();

    if (company) {
        const name = decryptData(company.enc_name) || 'Unknown Company';
        const industry = decryptData(company.enc_industry) || '';
        const size = decryptData(company.enc_size) || '';
        parts.push(`COMPANY: ${name}${industry ? ` | Industry: ${industry}` : ''}${size ? ` | Size: ${size}` : ''}`);
    }

    // 2. Get active jobs
    const { data: jobs } = await supabaseAdmin
        .schema('employer')
        .from('jobs')
        .select('id, enc_title, enc_description, role_category, location_type, employment_type, is_active')
        .eq('company_id', company ? (await supabaseAdmin.schema('employer').from('companies').select('id').eq('owner_id', userId).single()).data?.id : '')
        .eq('is_active', true)
        .limit(10);

    if (jobs && jobs.length > 0) {
        parts.push(`\nACTIVE JOBS (${jobs.length}):`);
        for (const job of jobs) {
            const title = decryptData(job.enc_title) || 'Untitled';
            const desc = decryptData(job.enc_description) || '';
            parts.push(`- ${title} (${job.role_category || 'General'}, ${job.location_type || 'N/A'}, ${job.employment_type || 'N/A'})`);
            if (desc) parts.push(`  Description: ${desc.substring(0, 200)}...`);

            // Get applicants for this job
            const { data: applicants } = await supabaseAdmin
                .schema('employer')
                .from('applications')
                .select('id, status, is_starred, reviewed_at, snapshot_data, created_at')
                .eq('job_id', job.id)
                .order('created_at', { ascending: false })
                .limit(20);

            if (applicants && applicants.length > 0) {
                parts.push(`  Applicants (${applicants.length}):`);
                for (const app of applicants) {
                    const snap = app.snapshot_data as any;
                    if (snap) {
                        const candidateName = snap.name || snap.firstName || 'Unknown';
                        const candidateRole = snap.role || snap.currentRole || '';
                        const candidateSkills = snap.skills ? (Array.isArray(snap.skills) ? snap.skills.join(', ') : snap.skills) : '';
                        const starred = app.is_starred ? '⭐' : '';
                        const reviewed = app.reviewed_at ? '✓ Reviewed' : '⏳ Pending';
                        parts.push(`    ${starred} ${candidateName} — ${candidateRole} | Status: ${app.status} | ${reviewed}`);
                        if (candidateSkills) parts.push(`      Skills: ${candidateSkills}`);
                    }
                }
            } else {
                parts.push(`  No applicants yet`);
            }
        }
    } else {
        parts.push('\nNo active jobs currently.');
    }

    return parts.join('\n');
}

// ── GET: Fetch chat history ──
export async function GET(req: Request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('profcaria_session')?.value;
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload: auth } = await jwtVerify(token, secret);
        if (auth.schema !== 'employer') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        const userId = auth.uid as string;
        const { searchParams } = new URL(req.url);
        const sessionId = searchParams.get('sessionId');

        // If no sessionId is provided, fetch distinct sessions from messages
        if (!sessionId) {
            const { data: messages } = await supabaseAdmin
                .schema('employer')
                .from('recruiter_ai_messages')
                .select('session_id, role, enc_content, created_at')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(500); // Look at the last 500 messages to find sessions
                
            if (!messages || messages.length === 0) {
                return NextResponse.json({ sessions: [] });
            }

            // Group messages by session_id to extract title (first message) and updated_at (latest message)
            const sessionMap = new Map<string, { title: string, updated_at: string, minTime: number }>();
            
            for (const msg of messages) {
                if (!msg.session_id) continue;
                
                const mTime = new Date(msg.created_at).getTime();
                
                if (!sessionMap.has(msg.session_id)) {
                    // Initialize with the most recent message's time (since we sorted desc)
                    sessionMap.set(msg.session_id, { title: '', updated_at: msg.created_at, minTime: Infinity });
                }
                
                const session = sessionMap.get(msg.session_id)!;
                
                // If this is a user message and older than what we've seen, it might be the primary session title
                if (msg.role === 'user' && mTime <= session.minTime) {
                    const decryptedContent = decryptData(msg.enc_content) || '';
                    let titleStr = decryptedContent.trim().split('\n')[0].substring(0, 35);
                    if (titleStr.length === 35) titleStr += '...';
                    
                    session.title = titleStr;
                    session.minTime = mTime;
                }
            }

            // Convert map to array and sort by updated_at desc
            const sessions: any[] = [];
            for (const [id, s] of sessionMap.entries()) {
                sessions.push({
                    id,
                    title: s.title || 'New Chat',
                    updated_at: s.updated_at
                });
            }
            
            sessions.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

            return NextResponse.json({ sessions });
        }

        // Fetch messages for a specific session
        const { data: messages } = await supabaseAdmin
            .schema('employer')
            .from('recruiter_ai_messages')
            .select('id, role, enc_content, created_at')
            .eq('user_id', userId)
            .eq('session_id', sessionId)
            .order('created_at', { ascending: true })
            .limit(50);

        const decrypted = (messages || []).map((m: any) => ({
            id: m.id,
            role: m.role,
            content: decryptData(m.enc_content) || '',
            createdAt: m.created_at,
        }));

        return NextResponse.json({ messages: decrypted });
    } catch (error) {
        console.error('Recruiter AI GET error:', error);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}

// ── POST: Send message, get AI response ──
export async function POST(req: Request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('profcaria_session')?.value;
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload: auth } = await jwtVerify(token, secret);
        if (auth.schema !== 'employer') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        const userId = auth.uid as string;
        const { message, sessionId } = await req.json();

        if (!message || typeof message !== 'string' || message.trim().length === 0) {
            return NextResponse.json({ error: 'Message is required' }, { status: 400 });
        }

        if (!sessionId) {
            return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
        }

        if (message.length > 2000) {
            return NextResponse.json({ error: 'Message too long (max 2000 chars)' }, { status: 400 });
        }

        // 1. Store user message in messages table
        const encUserMsg = encryptData(message.trim());
        await supabaseAdmin
            .schema('employer')
            .from('recruiter_ai_messages')
            .insert({ 
                user_id: userId, 
                session_id: sessionId,
                role: 'user', 
                enc_content: encUserMsg 
            });

        // 2. Build context
        const employerContext = await buildEmployerContext(userId);

        // 3. Fetch recent conversation history for THIS session
        const { data: recentMsgs } = await supabaseAdmin
            .schema('employer')
            .from('recruiter_ai_messages')
            .select('role, enc_content')
            .eq('user_id', userId)
            .eq('session_id', sessionId)
            .order('created_at', { ascending: false })
            .limit(10);

        const conversationHistory = (recentMsgs || [])
            .reverse()
            .map((m: any) => ({
                role: m.role === 'user' ? 'user' as const : 'model' as const,
                parts: [{ text: decryptData(m.enc_content) || '' }],
            }));

        // 4. Call Gemini
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

        const chat = model.startChat({
            history: [
                {
                    role: 'user',
                    parts: [{ text: `${SYSTEM_PROMPT}\n\n--- EMPLOYER DATA ---\n${employerContext}\n--- END DATA ---\n\nAcknowledge you understand and are ready to help with hiring.` }],
                },
                {
                    role: 'model',
                    parts: [{ text: 'Understood. I have your company profile and current job listings loaded. How can I help with your hiring today?' }],
                },
                ...conversationHistory,
            ],
        });

        const result = await chat.sendMessage(message.trim());
        const aiResponse = result.response.text();

        // 5. Store AI response in messages table
        const encAiMsg = encryptData(aiResponse);
        await supabaseAdmin
            .schema('employer')
            .from('recruiter_ai_messages')
            .insert({ 
                user_id: userId, 
                session_id: sessionId,
                role: 'assistant', 
                enc_content: encAiMsg 
            });

        return NextResponse.json({ response: aiResponse });

    } catch (error: unknown) {
        const errMsg = error instanceof Error ? error.message : String(error);
        console.error('Recruiter AI POST error:', errMsg);

        if (errMsg.includes('API key')) {
            return NextResponse.json({ error: 'AI service not configured.' }, { status: 503 });
        }
        if (errMsg.includes('quota') || errMsg.includes('429')) {
            return NextResponse.json({ error: 'AI rate limit reached. Please wait a moment.' }, { status: 429 });
        }

        return NextResponse.json({ error: `AI error: ${errMsg.substring(0, 150)}` }, { status: 500 });
    }
}
