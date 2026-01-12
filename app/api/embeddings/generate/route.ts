/**
 * API Route: Generate Embeddings
 * Called when jobs are created or preferences are updated
 * Stores embeddings in database for fast matching
 */

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { generateEmbedding } from '@/lib/embeddings';
import { decryptData } from '@/lib/security';
import { serializeEmbedding } from '@/lib/vector-search';

export const runtime = 'nodejs';
export const maxDuration = 60; // Allow longer for model loading

async function getUserId() {
    const cookieStore = await cookies();
    const token = cookieStore.get('profcaria_session')?.value;
    if (!token) return null;
    try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload } = await jwtVerify(token, secret);
        return { uid: payload.uid as string, schema: payload.schema as string };
    } catch {
        return null;
    }
}

/**
 * POST /api/embeddings/generate
 * Body: { type: 'job' | 'preferences', id?: string }
 * 
 * For professionals: generates embedding from their preferences (target_roles, etc.)
 * For employers: generates embedding for a specific job
 */
export async function POST(req: Request) {
    try {
        const auth = await getUserId();
        if (!auth) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { type, id } = body;

        if (type === 'preferences' && auth.schema === 'professional') {
            // Generate embedding for user's preferences
            const { data: prefs } = await supabaseAdmin
                .schema('professional')
                .from('preferences')
                .select('target_roles, headline')
                .eq('user_id', auth.uid)
                .single();

            if (!prefs) {
                return NextResponse.json({ error: 'Preferences not found' }, { status: 404 });
            }

            // Create text representation of preferences
            const targetRoles = Array.isArray(prefs.target_roles) ? prefs.target_roles.join(', ') : '';
            const text = `${targetRoles} ${prefs.headline || ''}`.trim();

            if (!text) {
                return NextResponse.json({ error: 'No content to embed' }, { status: 400 });
            }

            // Generate embedding
            const embedding = await generateEmbedding(text);

            if (!embedding) {
                return NextResponse.json({
                    error: 'Embedding generation failed',
                    fallback: 'Rule-based matching will be used'
                }, { status: 500 });
            }

            // Store in database
            const { error: updateError } = await supabaseAdmin
                .schema('professional')
                .from('preferences')
                .update({ embedding_json: embedding })
                .eq('user_id', auth.uid);

            if (updateError) {
                console.error('Error storing embedding:', updateError);
                return NextResponse.json({ error: 'Failed to store embedding' }, { status: 500 });
            }

            return NextResponse.json({
                success: true,
                message: 'Preferences embedding generated',
                dimension: embedding.length
            });

        } else if (type === 'job' && auth.schema === 'employer' && id) {
            // Generate embedding for a job
            const { data: job } = await supabaseAdmin
                .schema('employer')
                .from('jobs')
                .select('enc_title, enc_description, company_id')
                .eq('id', id)
                .single();

            if (!job || job.company_id !== auth.uid) {
                return NextResponse.json({ error: 'Job not found' }, { status: 404 });
            }

            // Decrypt and combine job info
            const title = decryptData(job.enc_title) || '';
            const description = decryptData(job.enc_description) || '';
            const text = `${title} ${description}`.trim().slice(0, 512); // Limit length

            if (!text) {
                return NextResponse.json({ error: 'No content to embed' }, { status: 400 });
            }

            // Generate embedding
            const embedding = await generateEmbedding(text);

            if (!embedding) {
                return NextResponse.json({
                    error: 'Embedding generation failed',
                    fallback: 'Rule-based matching will be used'
                }, { status: 500 });
            }

            // Store in database
            const { error: updateError } = await supabaseAdmin
                .schema('employer')
                .from('jobs')
                .update({ embedding_json: embedding })
                .eq('id', id);

            if (updateError) {
                console.error('Error storing job embedding:', updateError);
                return NextResponse.json({ error: 'Failed to store embedding' }, { status: 500 });
            }

            return NextResponse.json({
                success: true,
                message: 'Job embedding generated',
                dimension: embedding.length
            });

        } else {
            return NextResponse.json({
                error: 'Invalid request',
                usage: 'POST with { type: "preferences" } or { type: "job", id: "job-uuid" }'
            }, { status: 400 });
        }

    } catch (error) {
        console.error('Embedding generation error:', error);
        return NextResponse.json({
            error: 'Internal server error',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
