import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuthenticatedUser } from '@/lib/auth-helper';
import { HfInference } from '@huggingface/inference';

const HF_TOKEN = process.env.HF_TOKEN;

// Rate limiting (simple memory cache for this endpoint, or we can use redis if they have it)
// We will just do a basic server-side check.

export async function POST(req: Request) {
    try {
        const user = await getAuthenticatedUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const professionalId = user.id;

        // Verify HF token
        if (!HF_TOKEN) {
            console.error('HF_TOKEN missing for ai-scores generation');
            return NextResponse.json({ error: 'AI Evaluation is unconfigured on the server.' }, { status: 500 });
        }

        // Parse Request
        const { skills, employmentHistory, otherProfiles } = await req.json();

        if (!skills || skills.length === 0) {
            return NextResponse.json({ error: 'No skills provided to evaluate.' }, { status: 400 });
        }

        // Prepare Prompt
        const skillList = skills.map((s: any) => s.name).join(', ');
        const jobList = (employmentHistory || []).map((j: any) => `${j.title} at ${j.company_name} (${j.startDate ? j.startDate : 'Unknown'} - ${j.isCurrent ? 'Present' : (j.endDate || 'Unknown')})`).join('; ');
        const extractedSkills = (otherProfiles || []).map((p: any) => p.description).filter(Boolean).join(' | ');

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

        console.log('[AI Scores] Requesting generation via Llama-3.2...');
        const response = await hf.chatCompletion({
            model: 'meta-llama/Llama-3.2-3B-Instruct',
            messages: [{ role: 'user', content: promptContext }],
            max_tokens: 250,
            temperature: 0.1, // Low temperature for consistent JSON
            response_format: { type: "json_object" }
        });

        const rawContent = response.choices[0].message.content || '';
        console.log('[AI Scores] Raw generated content:', rawContent);

        // Parse the JSON
        let parsedResult;
        try {
            // Find JSON block if model wrapped it in markdown
            const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
            const jsonString = jsonMatch ? jsonMatch[0] : rawContent;
            parsedResult = JSON.parse(jsonString);
        } catch (e) {
            console.error('[AI Scores] Failed to parse JSON from AI model:', rawContent);
            return NextResponse.json({ error: 'AI generated invalid data.' }, { status: 500 });
        }

        // Validate structure
        if (
            typeof parsedResult.depth_score !== 'number' ||
            typeof parsedResult.execution_speed !== 'number' ||
            typeof parsedResult.collaboration_index !== 'number' ||
            typeof parsedResult.creativity_score !== 'number'
        ) {
            return NextResponse.json({ error: 'AI generated incomplete scores.' }, { status: 500 });
        }

        // Save to DB (Upsert)
        const { error: dbError } = await supabaseAdmin
            .from('professional_radar_stats')
            .upsert({
                professional_id: professionalId,
                depth_score: Math.min(Math.max(parsedResult.depth_score, 0), 100),
                execution_speed: Math.min(Math.max(parsedResult.execution_speed, 0), 100),
                collaboration_index: Math.min(Math.max(parsedResult.collaboration_index, 0), 100),
                creativity_score: Math.min(Math.max(parsedResult.creativity_score, 0), 100),
                ai_reasoning: parsedResult.ai_reasoning || 'No reasoning provided.',
                updated_at: new Date().toISOString()
            }, { onConflict: 'professional_id' });

        if (dbError) {
            console.error('[AI Scores] Error saving to DB:', dbError);
            return NextResponse.json({ error: 'Failed to save scores to database.' }, { status: 500 });
        }

        return NextResponse.json({ success: true, data: parsedResult });

    } catch (error: any) {
        console.error('[AI Scores] Route error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
