// Interview Prep Agent — Gemini-powered mock interview question generator

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { supabaseAdmin } from '@/lib/supabase';
import { encryptData, decryptData } from '@/lib/security';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const runtime = 'nodejs';
export const maxDuration = 30;

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// ── GET: Fetch question history ──
export async function GET(req: Request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('profcaria_session')?.value;
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload: auth } = await jwtVerify(token, secret);
        if (auth.schema !== 'professional') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        const userId = auth.uid as string;

        const { data: questions } = await supabaseAdmin
            .schema('professional')
            .from('interview_prep_questions')
            .select('id, enc_question, enc_answer, job_title, question_type, created_at')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(200);

        const decrypted = (questions || []).map((q: any) => ({
            id: q.id,
            question: decryptData(q.enc_question) || '',
            answer: decryptData(q.enc_answer) || '',
            jobTitle: q.job_title,
            type: q.question_type,
            createdAt: q.created_at,
        }));

        // Group by job title
        const grouped: Record<string, any[]> = {};
        decrypted.forEach((q: any) => {
            if (!grouped[q.jobTitle]) grouped[q.jobTitle] = [];
            grouped[q.jobTitle].push(q);
        });

        return NextResponse.json({ history: grouped });
    } catch (error) {
        console.error('Interview Prep GET error:', error);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}

// ── POST: Generate new interview questions ──
export async function POST(req: Request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('profcaria_session')?.value;
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload: auth } = await jwtVerify(token, secret);
        if (auth.schema !== 'professional') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        const userId = auth.uid as string;
        const { jobTitle, jobDescription, count = 5 } = await req.json();

        if (!jobTitle || typeof jobTitle !== 'string' || jobTitle.trim().length === 0) {
            return NextResponse.json({ error: 'Job title is required' }, { status: 400 });
        }

        const questionCount = Math.min(Math.max(Number(count), 1), 15);

        // 1. Fetch user's skills
        const { data: skills } = await supabaseAdmin
            .schema('professional')
            .from('skills')
            .select('enc_name')
            .eq('user_id', userId);

        const userSkills = (skills || [])
            .map((s: any) => decryptData(s.enc_name))
            .filter(Boolean);

        // 2. Fetch user's current role
        const { data: user } = await supabaseAdmin
            .schema('professional')
            .from('users')
            .select('enc_current_role, enc_about')
            .eq('id', userId)
            .single();

        const currentRole = user ? decryptData(user.enc_current_role) || '' : '';
        const about = user ? decryptData(user.enc_about) || '' : '';

        // 3. Fetch ALL previously generated questions for this job title (anti-repeat)
        const { data: previousQuestions } = await supabaseAdmin
            .schema('professional')
            .from('interview_prep_questions')
            .select('enc_question')
            .eq('user_id', userId)
            .eq('job_title', jobTitle.trim());

        const pastQuestions = (previousQuestions || [])
            .map((q: any) => decryptData(q.enc_question))
            .filter(Boolean);

        // 4. Build Gemini prompt
        const previousBlock = pastQuestions.length > 0
            ? `\n\n⛔ PREVIOUSLY ASKED QUESTIONS — DO NOT REPEAT ANY OF THESE:\n${pastQuestions.map((q: string, i: number) => `${i + 1}. ${q}`).join('\n')}`
            : '';

        const prompt = `You are an expert interview coach. Generate exactly ${questionCount} unique interview questions for a "${jobTitle.trim()}" position.

Candidate profile:
- Current role: ${currentRole || 'Not specified'}
- About: ${about || 'Not specified'}
- Skills: ${userSkills.length > 0 ? userSkills.join(', ') : 'Not specified'}
${jobDescription ? `\nJob description:\n${jobDescription.substring(0, 1500)}` : ''}
${previousBlock}

For each question, provide:
1. The question itself
2. A type tag (one of: behavioral, technical, situational, competency)
3. A model answer that the candidate could use (2-4 sentences, specific and actionable)

CRITICAL RULES:
- Generate EXACTLY ${questionCount} questions, no more, no less
- NEVER repeat any previously asked question listed above
- Mix question types (behavioral, technical, situational)
- Tailor questions to the candidate's actual skills and experience
- Make model answers specific, not generic

Respond in STRICT JSON format only, no markdown, no explanation:
[
  {
    "question": "...",
    "type": "behavioral|technical|situational|competency",
    "answer": "..."
  }
]`;

        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        // 5. Parse JSON response
        let parsed: any[];
        try {
            // Strip markdown code blocks if present
            const cleaned = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            parsed = JSON.parse(cleaned);
        } catch {
            console.error('Failed to parse Gemini response:', responseText.substring(0, 500));
            return NextResponse.json({ error: 'AI returned an invalid response. Please try again.' }, { status: 500 });
        }

        if (!Array.isArray(parsed) || parsed.length === 0) {
            return NextResponse.json({ error: 'AI returned no questions. Please try again.' }, { status: 500 });
        }

        // 6. Store questions in DB (encrypted)
        const insertRows = parsed.map((q: any) => ({
            user_id: userId,
            enc_question: encryptData(q.question || ''),
            enc_answer: encryptData(q.answer || ''),
            job_title: jobTitle.trim(),
            question_type: q.type || 'general',
        }));

        await supabaseAdmin
            .schema('professional')
            .from('interview_prep_questions')
            .insert(insertRows);

        // 7. Return the questions (unencrypted for display)
        const questions = parsed.map((q: any, i: number) => ({
            id: `new-${i}`,
            question: q.question,
            answer: q.answer,
            type: q.type || 'general',
            jobTitle: jobTitle.trim(),
        }));

        return NextResponse.json({ questions });

    } catch (error: unknown) {
        const errMsg = error instanceof Error ? error.message : String(error);
        console.error('Interview Prep POST error:', errMsg);

        if (errMsg.includes('API key')) {
            return NextResponse.json({ error: 'AI service not configured.' }, { status: 503 });
        }
        if (errMsg.includes('quota') || errMsg.includes('429')) {
            return NextResponse.json({ error: 'AI rate limit reached. Please wait a moment.' }, { status: 429 });
        }

        return NextResponse.json({ error: `AI error: ${errMsg.substring(0, 150)}` }, { status: 500 });
    }
}
