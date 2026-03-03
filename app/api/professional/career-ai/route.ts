// Career AI API Route — Gemini-powered career agent

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { supabaseAdmin } from '@/lib/supabase';
import { encryptData, decryptData } from '@/lib/security';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const runtime = 'nodejs';
export const maxDuration = 30;

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// ── System prompt for the Career AI ──
const SYSTEM_PROMPT = `You are Profcaria Career AI — a personal, confidential career advisor embedded inside the Profcaria Career Operating System.

Your capabilities:
- Analyze the user's career profile, skills, employment history, and AI-generated radar scores
- Provide actionable career guidance, interview prep, salary negotiation tips, and skill gap analysis
- Help with resume/profile optimization
- Give job search strategy advice

Your personality:
- Direct, concise, and actionable — no fluff
- Supportive but honest — tell them what they need to hear
- Use data from their profile when available (don't make up stats)
- Format responses with markdown (headers, bold, bullet points) for readability

Rules:
- NEVER share the user's data with anyone
- If you don't have data to answer, say so and suggest what the user can do
- Keep responses focused and under 500 words unless the user asks for detail
- Reference specific profile data when giving advice (e.g., "Your collaboration score is 72/100...")`;

// ── Build context from user's profile data ──
async function buildUserContext(userId: string): Promise<string> {
    const parts: string[] = [];

    // 1. Profile basics
    const { data: user } = await supabaseAdmin
        .schema('professional')
        .from('users')
        .select('enc_first_name, enc_last_name, enc_current_role, enc_about, enc_email, badge_type, intent_mode')
        .eq('id', userId)
        .single();

    if (user) {
        const firstName = decryptData(user.enc_first_name) || 'Unknown';
        const role = decryptData(user.enc_current_role) || 'Not set';
        const about = decryptData(user.enc_about) || '';
        parts.push(`[PROFILE] Name: ${firstName}, Current Role: ${role}, Badge: ${user.badge_type || 'none'}, Intent: ${user.intent_mode || 'not set'}`);
        if (about) parts.push(`[ABOUT] ${about.substring(0, 300)}`);
    }

    // 2. Skills
    const { data: skills } = await supabaseAdmin
        .schema('professional')
        .from('skills')
        .select('enc_name')
        .eq('user_id', userId)
        .limit(20);

    if (skills && skills.length > 0) {
        const skillNames = skills.map((s: any) => decryptData(s.enc_name)).filter(Boolean);
        parts.push(`[SKILLS] ${skillNames.join(', ')}`);
    }

    // 3. Employment history
    const { data: employment } = await supabaseAdmin
        .schema('professional')
        .from('employment_history')
        .select('enc_title, enc_company, start_date, end_date, is_current')
        .eq('user_id', userId)
        .order('start_date', { ascending: false })
        .limit(5);

    if (employment && employment.length > 0) {
        const jobs = employment.map((e: any) => {
            const title = decryptData(e.enc_title) || 'Unknown';
            const company = decryptData(e.enc_company) || 'Unknown';
            return `${title} at ${company} (${e.start_date || '?'} - ${e.is_current ? 'Present' : e.end_date || '?'})`;
        });
        parts.push(`[EMPLOYMENT] ${jobs.join(' | ')}`);
    }

    // 4. Radar stats
    const { data: radar } = await supabaseAdmin
        .from('professional_radar_stats')
        .select('depth_score, execution_speed, collaboration_index, creativity_score')
        .eq('professional_id', userId)
        .single();

    if (radar) {
        parts.push(`[AI RADAR] Depth: ${radar.depth_score}/100, Execution Speed: ${radar.execution_speed}/100, Collaboration: ${radar.collaboration_index}/100, Creativity: ${radar.creativity_score}/100`);
    }

    // 5. Preferences
    const { data: prefs } = await supabaseAdmin
        .schema('professional')
        .from('preferences')
        .select('target_roles, work_modes, employment_types, experience_years_ranges')
        .eq('user_id', userId)
        .single();

    if (prefs) {
        const targetRoles = prefs.target_roles?.join(', ') || 'Not set';
        const workModes = prefs.work_modes?.join(', ') || 'Not set';
        parts.push(`[PREFERENCES] Target Roles: ${targetRoles}, Work Modes: ${workModes}`);
    }

    // 6. Education
    const { data: education } = await supabaseAdmin
        .schema('professional')
        .from('education')
        .select('enc_school, enc_degree, enc_field_of_study')
        .eq('user_id', userId)
        .limit(3);

    if (education && education.length > 0) {
        const edus = education.map((e: any) => {
            const school = decryptData(e.enc_school) || '';
            const degree = decryptData(e.enc_degree) || '';
            const field = decryptData(e.enc_field_of_study) || '';
            return `${degree} in ${field} from ${school}`;
        }).filter((e: string) => e.trim() !== 'in  from ');
        if (edus.length > 0) parts.push(`[EDUCATION] ${edus.join(' | ')}`);
    }

    return parts.join('\n');
}

// ── GET: Fetch chat history ──
export async function GET() {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('profcaria_session')?.value;
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload: auth } = await jwtVerify(token, secret);
        if (auth.schema !== 'professional') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        const { data: messages } = await supabaseAdmin
            .schema('professional')
            .from('career_ai_messages')
            .select('id, role, enc_content, created_at')
            .eq('user_id', auth.uid)
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
        console.error('Career AI GET error:', error);
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
        if (auth.schema !== 'professional') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        const userId = auth.uid as string;
        const { message } = await req.json();

        if (!message || typeof message !== 'string' || message.trim().length === 0) {
            return NextResponse.json({ error: 'Message is required' }, { status: 400 });
        }

        if (message.length > 2000) {
            return NextResponse.json({ error: 'Message too long (max 2000 chars)' }, { status: 400 });
        }

        // 1. Store user message
        const encUserMsg = encryptData(message.trim());
        await supabaseAdmin
            .schema('professional')
            .from('career_ai_messages')
            .insert({ user_id: userId, role: 'user', enc_content: encUserMsg });

        // 2. Build context
        const userContext = await buildUserContext(userId);

        // 3. Fetch recent conversation history (last 10 messages for context)
        const { data: recentMsgs } = await supabaseAdmin
            .schema('professional')
            .from('career_ai_messages')
            .select('role, enc_content')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(10);

        const conversationHistory = (recentMsgs || [])
            .reverse()
            .map((m: any) => ({
                role: m.role === 'user' ? 'user' as const : 'model' as const,
                parts: [{ text: decryptData(m.enc_content) || '' }],
            }));

        // 4. Call Gemini
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

        const chat = model.startChat({
            history: [
                {
                    role: 'user',
                    parts: [{ text: `${SYSTEM_PROMPT}\n\n--- USER PROFILE DATA ---\n${userContext}\n--- END PROFILE DATA ---\n\nAcknowledge you understand and are ready to help. Say a brief one-line greeting.` }],
                },
                {
                    role: 'model',
                    parts: [{ text: 'Understood. I have your career profile loaded. How can I help you today?' }],
                },
                ...conversationHistory,
            ],
        });

        const result = await chat.sendMessage(message.trim());
        const aiResponse = result.response.text();

        // 5. Store AI response
        const encAiMsg = encryptData(aiResponse);
        await supabaseAdmin
            .schema('professional')
            .from('career_ai_messages')
            .insert({ user_id: userId, role: 'assistant', enc_content: encAiMsg });

        return NextResponse.json({
            response: aiResponse,
        });

    } catch (error: unknown) {
        const errMsg = error instanceof Error ? error.message : String(error);
        console.error('Career AI POST error:', errMsg);

        if (errMsg.includes('API key')) {
            return NextResponse.json({ error: 'AI service not configured. Please contact support.' }, { status: 503 });
        }
        if (errMsg.includes('quota') || errMsg.includes('429')) {
            return NextResponse.json({ error: 'AI rate limit reached. Please wait a moment and try again.' }, { status: 429 });
        }
        if (errMsg.includes('not found') || errMsg.includes('model')) {
            return NextResponse.json({ error: 'AI model unavailable. Please try again later.' }, { status: 503 });
        }

        return NextResponse.json({ error: `AI error: ${errMsg.substring(0, 150)}` }, { status: 500 });
    }
}
