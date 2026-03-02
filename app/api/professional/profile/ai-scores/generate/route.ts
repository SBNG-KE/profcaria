import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuthenticatedUser } from '@/lib/auth-helper';
import { HfInference } from '@huggingface/inference';

const HF_TOKEN = process.env.HF_TOKEN;

export async function POST(req: Request) {
    console.log('[AI Scores] === START === Endpoint hit');
    try {
        console.log('[AI Scores] Step 1: Authenticating user...');
        const user = await getAuthenticatedUser();

        if (!user) {
            console.error('[AI Scores] Step 1 FAILED: No authenticated user');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const professionalId = user.id;
        console.log('[AI Scores] Step 1 OK: User ID =', professionalId);

        // Verify HF token
        console.log('[AI Scores] Step 2: Checking HF_TOKEN...', HF_TOKEN ? 'EXISTS' : 'MISSING');
        if (!HF_TOKEN) {
            console.error('[AI Scores] Step 2 FAILED: HF_TOKEN is not set in environment');
            return NextResponse.json({ error: 'AI Evaluation is unconfigured on the server.' }, { status: 500 });
        }

        // Fetch user data server-side
        console.log('[AI Scores] Step 3: Fetching user data from DB...');
        const [skillsRes, employmentRes, otherProfilesRes] = await Promise.all([
            supabaseAdmin
                .schema('professional')
                .from('skills')
                .select('name')
                .eq('professional_id', professionalId),
            supabaseAdmin
                .schema('professional')
                .from('employment_history')
                .select('job_title, company_name, start_date, end_date, is_current')
                .eq('professional_id', professionalId)
                .order('start_date', { ascending: false }),
            supabaseAdmin
                .schema('professional')
                .from('other_profiles')
                .select('platform, url, description')
                .eq('professional_id', professionalId)
        ]);

        if (skillsRes.error) console.error('[AI Scores] Step 3 DB Error (skills):', skillsRes.error);
        if (employmentRes.error) console.error('[AI Scores] Step 3 DB Error (employment):', employmentRes.error);
        if (otherProfilesRes.error) console.error('[AI Scores] Step 3 DB Error (otherProfiles):', otherProfilesRes.error);

        const skills = skillsRes.data || [];
        const employmentHistory = employmentRes.data || [];
        const otherProfiles = otherProfilesRes.data || [];

        console.log(`[AI Scores] Step 3 OK: ${skills.length} skills, ${employmentHistory.length} jobs, ${otherProfiles.length} profiles`);

        if (skills.length === 0) {
            console.warn('[AI Scores] Step 3 STOPPED: No skills found for user');
            return NextResponse.json({ error: 'Please add at least one skill to your profile before generating AI scores.' }, { status: 400 });
        }

        // Prepare Prompt
        const skillList = skills.map((s: any) => s.name).join(', ');
        const jobList = employmentHistory.map((j: any) =>
            `${j.job_title} at ${j.company_name} (${j.start_date ? new Date(j.start_date).getFullYear() : 'Unknown'} - ${j.is_current ? 'Present' : (j.end_date ? new Date(j.end_date).getFullYear() : 'Unknown')})`
        ).join('; ');
        const extractedSkills = otherProfiles.map((p: any) => p.description).filter(Boolean).join(' | ');

        const promptContext = `
The user is a professional in the tech/business industry.
Analyze their profile:
Skills: ${skillList}
Employment History: ${jobList || 'None provided'}
Additional Skills/Projects Context: ${extractedSkills || 'None provided'}

Task: Generate a JSON object scoring this professional from 0 to 100 in four specific categories based strictly on the provided data.
Categories:
- "depth_score": Technical understanding, complex/backend skills, system architecture presence.
- "execution_speed": Velocity of delivery, frontend/agile tools, fast job transitions or promotions.
- "collaboration_index": Teamwork tools (Jira, Slack, Agile), long tenures showing stability, leadership roles.
- "creativity_score": UI/UX design, writing, problem-solving skills, creative portfolios.
- "ai_reasoning": A 1-2 sentence explanation of why these score indexes were given based on the specific skills or jobs you see.

Output nothing but valid JSON. Example:
{
  "depth_score": 85,
  "execution_speed": 70,
  "collaboration_index": 90,
  "creativity_score": 65,
  "ai_reasoning": "High collaboration due to 3-year tenure at Acme Corp and agile tools. Strong depth from Rust and C++."
}
        `;

        const hf = new HfInference(HF_TOKEN);

        console.log('[AI Scores] Step 4: Calling HuggingFace Llama-3.2-3B-Instruct... Skills:', skillList);
        const response = await hf.chatCompletion({
            model: 'meta-llama/Llama-3.2-3B-Instruct',
            messages: [{ role: 'user', content: promptContext }],
            max_tokens: 300,
            temperature: 0.1,
        });
        console.log('[AI Scores] Step 4 OK: Got response from HuggingFace');

        const rawContent = response.choices?.[0]?.message?.content || '';
        console.log('[AI Scores] Step 5: Raw AI output:', rawContent);

        // Parse the JSON
        let parsedResult;
        try {
            const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
            const jsonString = jsonMatch ? jsonMatch[0] : rawContent;
            parsedResult = JSON.parse(jsonString);
        } catch (e) {
            console.error('[AI Scores] JSON parse failed. Raw:', rawContent);
            return NextResponse.json({ error: 'AI generated invalid response. Please try again.' }, { status: 500 });
        }

        // Validate structure
        const requiredFields = ['depth_score', 'execution_speed', 'collaboration_index', 'creativity_score'];
        for (const field of requiredFields) {
            if (typeof parsedResult[field] !== 'number') {
                console.error(`[AI Scores] Missing or invalid field: ${field}`, parsedResult);
                return NextResponse.json({ error: 'AI generated incomplete scores. Please try again.' }, { status: 500 });
            }
        }

        // Save to DB (Upsert)
        console.log('[AI Scores] Step 7: Saving scores to DB...');
        const { error: dbError } = await supabaseAdmin
            .from('professional_radar_stats')
            .upsert({
                professional_id: professionalId,
                depth_score: Math.min(Math.max(Math.round(parsedResult.depth_score), 0), 100),
                execution_speed: Math.min(Math.max(Math.round(parsedResult.execution_speed), 0), 100),
                collaboration_index: Math.min(Math.max(Math.round(parsedResult.collaboration_index), 0), 100),
                creativity_score: Math.min(Math.max(Math.round(parsedResult.creativity_score), 0), 100),
                ai_reasoning: parsedResult.ai_reasoning || 'No reasoning provided.',
                updated_at: new Date().toISOString()
            }, { onConflict: 'professional_id' });

        if (dbError) {
            console.error('[AI Scores] Step 7 FAILED: DB upsert error:', JSON.stringify(dbError));
            return NextResponse.json({ error: 'Failed to save scores.' }, { status: 500 });
        }

        console.log('[AI Scores] === DONE === Success for user:', professionalId, 'Scores:', JSON.stringify(parsedResult));
        return NextResponse.json({ success: true, data: parsedResult });

    } catch (error: any) {
        console.error('[AI Scores] === CRASHED === Unhandled error:', error?.message || error);
        console.error('[AI Scores] Stack:', error?.stack);
        return NextResponse.json({ error: error?.message || 'Internal Server Error' }, { status: 500 });
    }
}
