import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuthenticatedUser } from '@/lib/auth-helper';
import { decryptData } from '@/lib/security';
import { HfInference } from '@huggingface/inference';

const HF_TOKEN = process.env.HF_TOKEN;

export async function POST(req: Request) {
    // Diagnostic tracking
    let lastStep = 'init';

    try {
        // Step 1: Auth
        lastStep = 'auth';
        const user = await getAuthenticatedUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const userId = user.id;

        // Step 2: HF Token
        lastStep = 'hf_token_check';
        if (!HF_TOKEN) {
            return NextResponse.json({ error: 'AI service not configured. Set HF_TOKEN.', step: lastStep }, { status: 500 });
        }

        // Step 3: Fetch skills
        lastStep = 'fetch_skills';
        const skillsRes = await supabaseAdmin
            .schema('professional')
            .from('skills')
            .select('enc_name')
            .eq('user_id', userId);

        if (skillsRes.error) {
            return NextResponse.json({ error: 'DB error fetching skills', step: lastStep, detail: skillsRes.error.message }, { status: 500 });
        }

        // Step 4: Decrypt skills
        lastStep = 'decrypt_skills';
        const skills = (skillsRes.data || [])
            .map((s: any) => {
                try { return s.enc_name ? decryptData(s.enc_name) : null; } catch { return null; }
            })
            .filter(Boolean);

        if (skills.length === 0) {
            return NextResponse.json({ error: 'No skills found. Add skills to your profile first.', step: lastStep, rawCount: skillsRes.data?.length || 0 }, { status: 400 });
        }

        // Step 5: Fetch employment
        lastStep = 'fetch_employment';
        const employmentRes = await supabaseAdmin
            .schema('professional')
            .from('employment_history')
            .select('enc_title, enc_company, enc_start_date, enc_end_date, is_current')
            .eq('user_id', userId);

        // Step 6: Decrypt employment
        lastStep = 'decrypt_employment';
        const jobs = (employmentRes.data || []).map((j: any) => {
            try {
                const title = j.enc_title ? decryptData(j.enc_title) : 'Unknown';
                const company = j.enc_company ? decryptData(j.enc_company) : 'Unknown';
                return `${title} at ${company}`;
            } catch { return null; }
        }).filter(Boolean);

        // Step 7: Fetch other profiles
        lastStep = 'fetch_other_profiles';
        const profilesRes = await supabaseAdmin
            .schema('professional')
            .from('other_profiles')
            .select('enc_description')
            .eq('user_id', userId);

        // Step 8: Decrypt profiles
        lastStep = 'decrypt_profiles';
        const profileDescriptions = (profilesRes.data || []).map((p: any) => {
            try { return p.enc_description ? decryptData(p.enc_description) : null; } catch { return null; }
        }).filter(Boolean);

        // Step 9: Build prompt
        lastStep = 'build_prompt';
        const skillList = skills.join(', ');
        const jobList = jobs.join('; ') || 'None provided';
        const profileContext = profileDescriptions.join(' | ') || 'None provided';

        const prompt = `You are evaluating a professional's skills profile. Analyze and return ONLY valid JSON with scores from 0-100.

Skills: ${skillList}
Employment: ${jobList}
Additional context: ${profileContext}

Return this exact JSON structure with integer scores:
{"depth_score": 0, "execution_speed": 0, "collaboration_index": 0, "creativity_score": 0, "ai_reasoning": "explanation"}

depth_score = technical depth and backend/system skills
execution_speed = delivery velocity, frontend tools, agile experience
collaboration_index = teamwork, leadership, stability in roles
creativity_score = design, creative problem solving, unique approaches`;

        // Step 10: Call HuggingFace
        lastStep = 'hf_call';
        const hf = new HfInference(HF_TOKEN);
        const hfResponse = await hf.chatCompletion({
            model: 'Qwen/Qwen2.5-3B-Instruct',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 300,
            temperature: 0.1,
        });

        // Step 11: Parse response
        lastStep = 'parse_response';
        const rawContent = hfResponse.choices?.[0]?.message?.content || '';
        const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            return NextResponse.json({ error: 'AI did not return JSON', step: lastStep, raw: rawContent.substring(0, 200) }, { status: 500 });
        }

        // Step 12: Parse JSON
        lastStep = 'parse_json';
        let scores;
        try {
            scores = JSON.parse(jsonMatch[0]);
        } catch (e: any) {
            return NextResponse.json({ error: 'Invalid JSON from AI', step: lastStep, raw: jsonMatch[0].substring(0, 200) }, { status: 500 });
        }

        // Step 13: Validate
        lastStep = 'validate';
        const fields = ['depth_score', 'execution_speed', 'collaboration_index', 'creativity_score'];
        for (const f of fields) {
            if (typeof scores[f] !== 'number') {
                return NextResponse.json({ error: `Missing field: ${f}`, step: lastStep, scores }, { status: 500 });
            }
        }

        // Step 14: Save to DB
        lastStep = 'db_save';
        const { error: dbError } = await supabaseAdmin
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

        if (dbError) {
            return NextResponse.json({ error: 'Failed to save scores', step: lastStep, detail: dbError.message }, { status: 500 });
        }

        // Done!
        return NextResponse.json({ success: true, data: scores });

    } catch (error: any) {
        // Return the exact step and error in the response body
        return NextResponse.json({
            error: error?.message || 'Unknown error',
            step: lastStep,
            stack: error?.stack?.split('\n').slice(0, 3).join(' | ')
        }, { status: 500 });
    }
}
