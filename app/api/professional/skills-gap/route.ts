// Skills Gap Agent — Gemini-powered skill gap analysis

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { supabaseAdmin } from '@/lib/supabase';
import { encryptData, decryptData } from '@/lib/security';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const runtime = 'nodejs';
export const maxDuration = 30;

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// ── GET: Fetch analysis history ──
export async function GET() {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('profcaria_session')?.value;
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload: auth } = await jwtVerify(token, secret);
        if (auth.schema !== 'professional') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        const userId = auth.uid as string;

        const { data: analyses } = await supabaseAdmin
            .schema('professional')
            .from('skills_gap_analyses')
            .select('id, job_title, matched_skills, missing_skills, match_percentage, enc_analysis, created_at')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(20);

        const decrypted = (analyses || []).map((a: any) => ({
            id: a.id,
            jobTitle: a.job_title,
            matchedSkills: a.matched_skills || [],
            missingSkills: a.missing_skills || [],
            matchPercentage: a.match_percentage || 0,
            analysis: decryptData(a.enc_analysis) || '',
            createdAt: a.created_at,
        }));

        return NextResponse.json({ analyses: decrypted });
    } catch (error) {
        console.error('Skills Gap GET error:', error);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}

// ── POST: Run skills gap analysis ──
export async function POST(req: Request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('profcaria_session')?.value;
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload: auth } = await jwtVerify(token, secret);
        if (auth.schema !== 'professional') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        const userId = auth.uid as string;
        const { jobTitle, jobDescription } = await req.json();

        if (!jobTitle || typeof jobTitle !== 'string' || jobTitle.trim().length === 0) {
            return NextResponse.json({ error: 'Job title is required' }, { status: 400 });
        }

        // 1. Fetch user's skills
        const { data: skills } = await supabaseAdmin
            .schema('professional')
            .from('skills')
            .select('enc_name')
            .eq('user_id', userId);

        const userSkills = (skills || [])
            .map((s: any) => decryptData(s.enc_name))
            .filter(Boolean) as string[];

        // 2. Fetch user's profile for context
        const { data: user } = await supabaseAdmin
            .schema('professional')
            .from('users')
            .select('enc_current_role, enc_about')
            .eq('id', userId)
            .single();

        const currentRole = user ? decryptData(user.enc_current_role) || '' : '';

        // 3. Fetch user's employment history for experience context
        const { data: employment } = await supabaseAdmin
            .schema('professional')
            .from('employment')
            .select('enc_role, enc_company')
            .eq('user_id', userId)
            .limit(5);

        const pastRoles = (employment || [])
            .map((e: any) => `${decryptData(e.enc_role) || ''} at ${decryptData(e.enc_company) || ''}`)
            .filter((r: string) => r.trim() !== 'at');

        // 4. Call Gemini
        const prompt = `You are a career skills analyst. Analyze the gap between this candidate's skills and a target job.

CANDIDATE PROFILE:
- Current Role: ${currentRole || 'Not specified'}
- Skills: ${userSkills.length > 0 ? userSkills.join(', ') : 'No skills listed'}
- Past Experience: ${pastRoles.length > 0 ? pastRoles.join(' → ') : 'Not specified'}

TARGET JOB: ${jobTitle.trim()}
${jobDescription ? `JOB DESCRIPTION:\n${jobDescription.substring(0, 2000)}` : ''}

Respond in STRICT JSON format only, no markdown, no explanation:
{
    "matchPercentage": <number 0-100>,
    "matchedSkills": ["skill1", "skill2"],
    "missingSkills": ["skill1", "skill2"],
    "analysis": "A detailed 3-5 sentence analysis of the candidate's fit. Be specific about what they have, what they're missing, and what they should learn first. Reference their actual skills and experience.",
    "topPriority": "The #1 most important skill/certification they should acquire next and why",
    "learningPath": ["Step 1: ...", "Step 2: ...", "Step 3: ..."]
}

Rules:
- matchedSkills should only contain skills the candidate ACTUALLY HAS that are relevant to the job
- missingSkills should list skills REQUIRED for the job that the candidate DOES NOT HAVE
- Be realistic with matchPercentage — consider both hard and soft skills
- learningPath should be actionable (specific courses, certs, projects)
- If the candidate has no skills listed, base analysis on their role/experience`;

        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        // 5. Parse response
        let parsed: any;
        try {
            const cleaned = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            parsed = JSON.parse(cleaned);
        } catch {
            console.error('Failed to parse Gemini response:', responseText.substring(0, 500));
            return NextResponse.json({ error: 'AI returned an invalid response. Please try again.' }, { status: 500 });
        }

        // 6. Store in DB
        const encAnalysis = encryptData(JSON.stringify({
            analysis: parsed.analysis || '',
            topPriority: parsed.topPriority || '',
            learningPath: parsed.learningPath || [],
        }));

        await supabaseAdmin
            .schema('professional')
            .from('skills_gap_analyses')
            .insert({
                user_id: userId,
                job_title: jobTitle.trim(),
                enc_analysis: encAnalysis,
                matched_skills: parsed.matchedSkills || [],
                missing_skills: parsed.missingSkills || [],
                match_percentage: parsed.matchPercentage || 0,
            });

        return NextResponse.json({
            result: {
                jobTitle: jobTitle.trim(),
                matchPercentage: parsed.matchPercentage || 0,
                matchedSkills: parsed.matchedSkills || [],
                missingSkills: parsed.missingSkills || [],
                analysis: parsed.analysis || '',
                topPriority: parsed.topPriority || '',
                learningPath: parsed.learningPath || [],
            }
        });

    } catch (error: unknown) {
        const errMsg = error instanceof Error ? error.message : String(error);
        console.error('Skills Gap POST error:', errMsg);

        if (errMsg.includes('API key')) {
            return NextResponse.json({ error: 'AI service not configured.' }, { status: 503 });
        }
        if (errMsg.includes('quota') || errMsg.includes('429')) {
            return NextResponse.json({ error: 'AI rate limit reached. Please wait a moment.' }, { status: 429 });
        }

        return NextResponse.json({ error: `AI error: ${errMsg.substring(0, 150)}` }, { status: 500 });
    }
}
