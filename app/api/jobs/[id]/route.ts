import { NextResponse } from 'next/server';
import { decryptData } from '@/lib/security';
import { getPublicJob, JOBS_SCHEMA } from '@/lib/profcaria-jobs';
import { supabaseAdmin } from '@/lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const result = await getPublicJob(id);
    if (!result) return NextResponse.json({ error: 'This job is closed, full, or unavailable.' }, { status: 404 });
    const { data: questions, error } = await supabaseAdmin.schema(JOBS_SCHEMA).from('job_questions')
      .select('id, enc_prompt, question_type, enc_options, required, position')
      .eq('job_id', id)
      .order('position');
    if (error) throw error;
    return NextResponse.json({
      job: result.job,
      questions: (questions || []).map((question: { id: string; enc_prompt: string; question_type: string; enc_options: string | null; required: boolean }) => ({
        id: question.id,
        prompt: decryptData(question.enc_prompt) || '',
        type: question.question_type,
        options: JSON.parse(decryptData(question.enc_options) || '[]'),
        required: question.required,
      })),
    }, { headers: { 'Cache-Control': 'public, max-age=20, stale-while-revalidate=60' } });
  } catch (error) {
    console.error('[PROFCARIA] Public job detail failed', error);
    return NextResponse.json({ error: 'This job could not be loaded.' }, { status: 500 });
  }
}
