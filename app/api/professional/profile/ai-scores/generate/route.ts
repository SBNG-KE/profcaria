import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuthenticatedUser } from '@/lib/auth-helper';
import { decryptData } from '@/lib/security';
import { HfInference } from '@huggingface/inference';

const HF_TOKEN = process.env.HF_TOKEN;

// Local scoring algorithm — always works, no external API needed
function computeLocalScores(
    skills: string[],
    jobs: { title: string; company: string; isCurrent: boolean }[],
    profiles: string[]
) {
    // Skill categorization
    const deepSkills = ['python', 'java', 'c++', 'rust', 'go', 'typescript', 'node', 'sql', 'postgresql', 'mongodb', 'redis', 'docker', 'kubernetes', 'aws', 'azure', 'gcp', 'linux', 'architecture', 'system design', 'api', 'backend', 'devops', 'microservices', 'graphql', 'security', 'networking'];
    const speedSkills = ['react', 'next', 'vue', 'angular', 'svelte', 'tailwind', 'css', 'html', 'javascript', 'agile', 'scrum', 'ci/cd', 'git', 'jira', 'sprint', 'rapid', 'prototype', 'mvp', 'flutter', 'swift', 'kotlin'];
    const collabSkills = ['jira', 'slack', 'teams', 'agile', 'scrum', 'kanban', 'leadership', 'management', 'mentor', 'team', 'communication', 'project management', 'stakeholder', 'presentation', 'hr', 'hiring'];
    const creativeSkills = ['design', 'ui', 'ux', 'figma', 'sketch', 'photoshop', 'illustrator', 'creative', 'writing', 'content', 'branding', 'animation', 'video', 'photography', 'art', 'innovation', 'problem solving', 'research'];

    const lowerSkills = skills.map(s => s.toLowerCase());

    const countMatches = (category: string[]) =>
        lowerSkills.filter(s => category.some(c => s.includes(c))).length;

    const totalSkills = skills.length;
    const baseScore = Math.min(40 + totalSkills * 3, 70); // Base from skill count

    const depthMatches = countMatches(deepSkills);
    const speedMatches = countMatches(speedSkills);
    const collabMatches = countMatches(collabSkills);
    const creativeMatches = countMatches(creativeSkills);

    // Each category: base + category bonus + job bonus + profile bonus
    const jobBonus = Math.min(jobs.length * 5, 15);
    const profileBonus = Math.min(profiles.length * 3, 10);
    const currentJobBonus = jobs.some(j => j.isCurrent) ? 5 : 0;

    const clamp = (n: number) => Math.min(Math.max(Math.round(n), 10), 98);

    const depth_score = clamp(baseScore + depthMatches * 6 + jobBonus);
    const execution_speed = clamp(baseScore + speedMatches * 6 + currentJobBonus);
    const collaboration_index = clamp(baseScore + collabMatches * 6 + jobBonus + profileBonus);
    const creativity_score = clamp(baseScore + creativeMatches * 6 + profileBonus);

    const reasoning = `Scores based on ${totalSkills} skills, ${jobs.length} employment records, and ${profiles.length} linked profiles. ` +
        `Depth reflects ${depthMatches} technical/backend skills. ` +
        `Execution speed reflects ${speedMatches} frontend/agile skills. ` +
        `Collaboration reflects ${collabMatches} teamwork-related skills. ` +
        `Creativity reflects ${creativeMatches} design/creative skills.`;

    return { depth_score, execution_speed, collaboration_index, creativity_score, ai_reasoning: reasoning };
}

export async function POST(req: Request) {
    try {
        const user = await getAuthenticatedUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const userId = user.id;

        // Fetch user data from DB
        const [skillsRes, employmentRes, profilesRes] = await Promise.all([
            supabaseAdmin.schema('professional').from('skills').select('enc_name').eq('user_id', userId),
            supabaseAdmin.schema('professional').from('employment_history').select('enc_title, enc_company, is_current').eq('user_id', userId),
            supabaseAdmin.schema('professional').from('other_profiles').select('enc_description').eq('user_id', userId)
        ]);

        // Decrypt
        const skills = (skillsRes.data || [])
            .map((s: any) => { try { return s.enc_name ? decryptData(s.enc_name) : null; } catch { return null; } })
            .filter(Boolean) as string[];

        const jobs = (employmentRes.data || []).map((j: any) => ({
            title: j.enc_title ? (decryptData(j.enc_title) || 'Unknown') : 'Unknown',
            company: j.enc_company ? (decryptData(j.enc_company) || 'Unknown') : 'Unknown',
            isCurrent: j.is_current || false
        }));

        const profileDescriptions = (profilesRes.data || [])
            .map((p: any) => { try { return p.enc_description ? decryptData(p.enc_description) : null; } catch { return null; } })
            .filter(Boolean) as string[];

        if (skills.length === 0) {
            return NextResponse.json({ error: 'Add at least one skill to your profile first.' }, { status: 400 });
        }

        // Try HuggingFace AI first, fall back to local algorithm
        let scores;
        let usedAI = false;

        if (HF_TOKEN) {
            try {
                const hf = new HfInference(HF_TOKEN);
                const skillList = skills.join(', ');
                const jobList = jobs.map((j: { title: string; company: string; isCurrent: boolean }) => `${j.title} at ${j.company}`).join('; ');

                const prompt = `Evaluate this professional and return ONLY valid JSON. No explanation, no markdown, just the JSON object.

Skills: ${skillList}
Employment: ${jobList || 'None'}

JSON format: {"depth_score": <0-100>, "execution_speed": <0-100>, "collaboration_index": <0-100>, "creativity_score": <0-100>, "ai_reasoning": "<1 sentence>"}`;

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
                    if (typeof parsed.depth_score === 'number' && typeof parsed.execution_speed === 'number') {
                        scores = parsed;
                        usedAI = true;
                    }
                }
            } catch (hfErr: any) {
                console.error('[AI Scores] HuggingFace failed, using local algorithm:', hfErr?.message);
            }
        }

        // Fallback: use local algorithm
        if (!scores) {
            scores = computeLocalScores(skills, jobs, profileDescriptions);
        }

        // Save to DB
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
            console.error('[AI Scores] DB error:', dbError);
            return NextResponse.json({ error: 'Failed to save scores.', detail: dbError.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, data: scores, ai_powered: usedAI });

    } catch (error: any) {
        console.error('[AI Scores] Error:', error?.message, error?.stack);
        return NextResponse.json({ error: error?.message || 'Server error' }, { status: 500 });
    }
}
