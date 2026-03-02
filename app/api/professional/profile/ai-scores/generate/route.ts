import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuthenticatedUser } from '@/lib/auth-helper';
import { decryptData } from '@/lib/security';

export async function POST() {
    let step = 'init';
    try {
        step = 'auth';
        const user = await getAuthenticatedUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized', step }, { status: 401 });
        const userId = user.id;

        step = 'fetch_skills';
        let skills: string[] = [];
        try {
            const res = await supabaseAdmin.schema('professional').from('skills').select('enc_name').eq('user_id', userId);
            if (res.error) return NextResponse.json({ error: res.error.message, step }, { status: 500 });
            skills = (res.data || []).map((s: any) => {
                try { return s.enc_name ? decryptData(s.enc_name) : null; } catch { return null; }
            }).filter(Boolean) as string[];
        } catch (e: any) {
            return NextResponse.json({ error: e?.message, step: 'skills_query_crash' }, { status: 500 });
        }

        if (skills.length === 0) {
            return NextResponse.json({ error: 'Add skills first.', step, skillCount: 0 }, { status: 400 });
        }

        step = 'fetch_jobs';
        let jobCount = 0;
        try {
            const res = await supabaseAdmin.schema('professional').from('employment_history').select('is_current').eq('user_id', userId);
            jobCount = res.data?.length || 0;
        } catch { /* ignore */ }

        step = 'compute_scores';
        const deepKw = ['python', 'java', 'c++', 'rust', 'go', 'typescript', 'node', 'sql', 'docker', 'kubernetes', 'aws', 'backend', 'devops', 'api', 'linux', 'architecture'];
        const speedKw = ['react', 'next', 'vue', 'angular', 'javascript', 'agile', 'scrum', 'ci/cd', 'git', 'flutter', 'swift', 'html', 'css', 'tailwind'];
        const collabKw = ['jira', 'slack', 'agile', 'scrum', 'leadership', 'management', 'team', 'communication', 'project management', 'mentor'];
        const createKw = ['design', 'ui', 'ux', 'figma', 'creative', 'writing', 'content', 'branding', 'animation', 'photoshop', 'problem solving'];

        const lower = skills.map((s: string) => s.toLowerCase());
        const match = (kw: string[]) => lower.filter((s: string) => kw.some((k: string) => s.includes(k))).length;
        const base = Math.min(40 + skills.length * 3, 70);
        const clamp = (n: number) => Math.min(Math.max(Math.round(n), 10), 98);

        const scores = {
            depth_score: clamp(base + match(deepKw) * 6 + Math.min(jobCount * 4, 15)),
            execution_speed: clamp(base + match(speedKw) * 6),
            collaboration_index: clamp(base + match(collabKw) * 6 + Math.min(jobCount * 5, 15)),
            creativity_score: clamp(base + match(createKw) * 6),
            ai_reasoning: `Based on ${skills.length} skills and ${jobCount} employment records.`
        };

        step = 'db_save';
        const { error: dbErr } = await supabaseAdmin
            .from('professional_radar_stats')
            .upsert({
                professional_id: userId,
                depth_score: scores.depth_score,
                execution_speed: scores.execution_speed,
                collaboration_index: scores.collaboration_index,
                creativity_score: scores.creativity_score,
                ai_reasoning: scores.ai_reasoning,
                updated_at: new Date().toISOString()
            }, { onConflict: 'professional_id' });

        if (dbErr) {
            return NextResponse.json({ error: dbErr.message, step, code: dbErr.code }, { status: 500 });
        }

        return NextResponse.json({ success: true, data: scores });

    } catch (error: any) {
        return NextResponse.json({ error: error?.message || 'Unknown', step }, { status: 500 });
    }
}
