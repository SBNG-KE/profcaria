import { createHash, randomUUID } from 'crypto';
import { NextResponse } from 'next/server';
import { encryptData } from '@/lib/security';
import { getPublicJob, JOBS_SCHEMA } from '@/lib/profcaria-jobs';
import { inspectDocument, inspectExternalLink } from '@/lib/document-security';
import { getClientIdentifier, checkRateLimit, rateLimitedResponse } from '@/lib/rate-limit';
import { supabaseAdmin } from '@/lib/supabase';

export const runtime = 'nodejs';

const clean = (value: FormDataEntryValue | null, max: number) => typeof value === 'string' ? value.trim().replace(/\0/g, '').slice(0, max) : '';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const limit = await checkRateLimit(getClientIdentifier(request), 'application').catch(() => ({ allowed: true, remaining: 1, resetIn: 0 }));
  if (!limit.allowed) return rateLimitedResponse(limit.resetIn);
  try {
    const { id } = await params;
    const current = await getPublicJob(id);
    if (!current) return NextResponse.json({ error: 'This job is already closed, full, or unavailable.' }, { status: 409 });

    const form = await request.formData();
    const name = clean(form.get('name'), 120);
    const email = clean(form.get('email'), 254).toLowerCase();
    const phone = clean(form.get('phone'), 30);
    const county = clean(form.get('county'), 80);
    const coverNote = clean(form.get('coverNote'), 5000);
    const portfolio = clean(form.get('portfolioUrl'), 1000);
    const answers = clean(form.get('answers'), 40_000);
    const consent = clean(form.get('consent'), 10) === 'true';
    if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: 'Enter your name and a valid email address.' }, { status: 400 });
    if (!consent) return NextResponse.json({ error: 'Consent is required to share this application with the company.' }, { status: 400 });
    const linkScan = portfolio ? inspectExternalLink(portfolio) : { safe: true, normalized: '' };
    if (!linkScan.safe) return NextResponse.json({ error: linkScan.reason }, { status: 400 });

    const emailHash = createHash('sha256').update(`${id}:${email}`).digest('hex');
    const { data: duplicate } = await supabaseAdmin.schema(JOBS_SCHEMA).from('guest_applications').select('id').eq('job_id', id).eq('email_hash', emailHash).maybeSingle();
    if (duplicate) return NextResponse.json({ error: 'An application from this email already exists for this job.' }, { status: 409 });

    const document = form.get('document');
    let documentPath: string | null = null;
    let documentName: string | null = null;
    let scanReport: Record<string, unknown> = { status: 'not_supplied' };
    if (document instanceof File && document.size) {
      const scan = await inspectDocument(document);
      scanReport = { status: scan.status, reasons: scan.reasons, charactersRead: scan.extractedText.length, scannedAt: new Date().toISOString() };
      if (!scan.safe) return NextResponse.json({ error: scan.reasons[0] || 'The document did not pass the security inspection.' }, { status: 422 });
      const suffix = document.name.toLowerCase().split('.').pop() || 'bin';
      documentPath = `applications/${id}/${randomUUID()}.${suffix}`;
      const upload = await supabaseAdmin.storage.from('profcaria-documents').upload(documentPath, Buffer.from(await document.arrayBuffer()), { contentType: document.type, upsert: false });
      if (upload.error) throw upload.error;
      documentName = document.name.slice(0, 180);
    }

    const { data: application, error } = await supabaseAdmin.schema(JOBS_SCHEMA).from('guest_applications').insert({
      job_id: id,
      organization_id: current.row.organization_id,
      email_hash: emailHash,
      enc_contact: encryptData(JSON.stringify({ name, email, phone, county })),
      enc_answers: encryptData(answers || '{}'),
      enc_cover_note: coverNote ? encryptData(coverNote) : null,
      enc_portfolio_url: portfolio ? encryptData(String(linkScan.normalized)) : null,
      document_path: documentPath,
      enc_document_name: documentName ? encryptData(documentName) : null,
      document_scan: scanReport,
      security_status: documentPath ? 'passed' : 'not_required',
      consented_at: new Date().toISOString(),
    }).select('id, status').single();
    if (error || !application) throw error || new Error('Application was not recorded.');
    return NextResponse.json({ applicationId: application.id, status: application.status }, { status: 201 });
  } catch (error) {
    console.error('[PROFCARIA] Guest application failed', error);
    return NextResponse.json({ error: 'Your application could not be submitted. No partial application was sent.' }, { status: 500 });
  }
}
