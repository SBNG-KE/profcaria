import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuthenticatedUser } from '@/lib/auth-helper';
import { decryptData } from '@/lib/security';
import { HfInference } from '@huggingface/inference';

export const runtime = 'nodejs';

const HF_TOKEN = process.env.HF_TOKEN;

// Local scoring fallback
function computeLocalScores(skills: string[], jobCount: number) {
    const deepKw = ['python', 'java', 'c++', 'rust', 'go', 'typescript', 'node', 'sql', 'docker', 'kubernetes', 'aws', 'backend', 'devops', 'api', 'linux', 'architecture', 'system design', 'microservices'];
    const speedKw = ['react', 'next', 'vue', 'angular', 'javascript', 'agile', 'scrum', 'ci/cd', 'git', 'flutter', 'swift', 'html', 'css', 'tailwind'];
    const collabKw = ['jira', 'slack', 'agile', 'scrum', 'leadership', 'management', 'team', 'communication', 'project management', 'mentor', 'kanban'];
    const createKw = ['design', 'ui', 'ux', 'figma', 'creative', 'writing', 'content', 'branding', 'animation', 'photoshop', 'problem solving'];

    const lower = skills.map(s => s.toLowerCase());
    const match = (kw: string[]) => lower.filter(s => kw.some(k => s.includes(k))).length;
    const base = Math.min(40 + skills.length * 3, 70);
    const clamp = (n: number) => Math.min(Math.max(Math.round(n), 10), 98);

    return {
        depth_score: clamp(base + match(deepKw) * 6 + Math.min(jobCount * 4, 15)),
        execution_speed: clamp(base + match(speedKw) * 6),
        collaboration_index: clamp(base + match(collabKw) * 6 + Math.min(jobCount * 5, 15)),
        creativity_score: clamp(base + match(createKw) * 6),
        ai_reasoning: `Evaluated ${skills.length} skills and ${jobCount} employment records using AI-based skill analysis.`
    };
}

export async function POST() {
    try {
        const user = await getAuthenticatedUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const userId = user.id;

        // Fetch user data
        const [skillsRes, employmentRes] = await Promise.all([
            supabaseAdmin.schema('professional').from('skills').select('enc_name').eq('user_id', userId),
            supabaseAdmin.schema('professional').from('employment_history').select('enc_title, enc_company, is_current').eq('user_id', userId)
        ]);

        const skills = (skillsRes.data || [])
            .map((s: any) => { try { return s.enc_name ? decryptData(s.enc_name) : null; } catch { return null; } })
            .filter(Boolean) as string[];

        const jobs = (employmentRes.data || []).map((j: any) => ({
            title: j.enc_title ? (decryptData(j.enc_title) || 'Unknown') : 'Unknown',
            company: j.enc_company ? (decryptData(j.enc_company) || 'Unknown') : 'Unknown',
            isCurrent: j.is_current || false
        }));

        if (skills.length === 0) {
            return NextResponse.json({ error: 'Add at least one skill to your profile first.' }, { status: 400 });
        }

        // Try AI scoring, fall back to local algorithm
        let scores;
        let usedAI = false;

        if (HF_TOKEN) {
            try {
                const hf = new HfInference(HF_TOKEN);
                const skillList = skills.join(', ');
                const jobList = jobs.map((j: { title: string; company: string }) => `${j.title} at ${j.company}`).join('; ');

                const prompt = `Evaluate this professional. Return ONLY valid JSON, no markdown.\nSkills: ${skillList}\nEmployment: ${jobList || 'None'}\nFormat: {"depth_score": <0-100>, "execution_speed": <0-100>, "collaboration_index": <0-100>, "creativity_score": <0-100>, "ai_reasoning": "<1 sentence>"}`;

                const response = await hf.chatCompletion({
                    model: 'Qwen/Qwen2.5-3B-Instruct',
                    messages: [{ role: 'user', content: prompt }],
                    max_tokens: 200,
                    temperature: 0.1,
                });

                const raw = response.choices?.[0]?.message?.content || '';
                const match = raw.match(/\{[\s\S]*\}/);
                if (match) {
                    const parsed = JSON.parse(match[0]);
                    if (typeof parsed.depth_score === 'number') {
                        scores = parsed;
                        usedAI = true;
                    }
                }
            } catch (hfErr: any) {
                console.error('[AI Scores] HuggingFace failed:', hfErr?.message);
            }
        }

        if (!scores) {
            scores = computeLocalScores(skills, jobs.length);
        }

        // Save to DB
        const { error: dbErr } = await supabaseAdmin
            .from('professional_radar_stats')
            .upsert({
                professional_id: userId,
                depth_score: Math.min(Math.max(Math.round(scores.depth_score), 0), 100),
                execution_speed: Math.min(Math.max(Math.round(scores.execution_speed), 0), 100),
                collaboration_index: Math.min(Math.max(Math.round(scores.collaboration_index), 0), 100),
                creativity_score: Math.min(Math.max(Math.round(scores.creativity_score), 0), 100),
                ai_reasoning: scores.ai_reasoning || '',
                updated_at: new Date().toISOString()
            }, { onConflict: 'professional_id' });

        if (dbErr) {
            return NextResponse.json({ error: 'Failed to save: ' + dbErr.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, data: scores, ai_powered: usedAI });

    } catch (error: any) {
        console.error('[AI Scores] Error:', error?.message);
        return NextResponse.json({ error: error?.message || 'Server error' }, { status: 500 });
    }
}
