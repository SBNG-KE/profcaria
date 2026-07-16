/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { getOndwiraSession } from '@/lib/ondwira-auth';
import { resolveOndwiraAccounts } from '@/lib/ondwira-contacts';
import { supabaseAdmin } from '@/lib/supabase';
import { decryptData, encryptData } from '@/lib/security';
import {
  addStageEvent, cleanText, ensureCompanyGroupMembership, evaluateApplication,
  requireOrganizationManager,
} from '@/lib/ondwira-recruitment';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function loadApplication(id: string) {
  const { data } = await supabaseAdmin.schema('ondwira').from('applications')
    .select('*, jobs(*, organizations(id, name))').eq('id', id).maybeSingle();
  return data;
}

async function managerAccess(application: any, userId: string) {
  return requireOrganizationManager(application.organization_id, userId);
}

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getOndwiraSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const application = await loadApplication(id);
  if (!application) return NextResponse.json({ error: 'Application not found.' }, { status: 404 });
  const manager = await managerAccess(application, session.uid);
  const isApplicant = application.applicant_id === session.uid;
  if (!manager && !isApplicant) return NextResponse.json({ error: 'Application not found.' }, { status: 404 });

  const [
    { data: answers }, { data: documents }, { data: history }, { data: stages },
    { data: interviews }, { data: offers }, { data: evaluations }, people,
  ] = await Promise.all([
    supabaseAdmin.schema('ondwira').from('application_answers')
      .select('enc_answer, passed_knockout, awarded_score, job_questions(id, enc_prompt, question_type)')
      .eq('application_id', id),
    supabaseAdmin.schema('ondwira').from('application_documents')
      .select('document_id, document_kind, enc_title_snapshot, access_revoked_at, documents(source_type, enc_file_url, enc_external_url, mime_type, credential_issuer, credential_id)')
      .eq('application_id', id),
    supabaseAdmin.schema('ondwira').from('employment_records')
      .select('id, title, employment_type, status, started_at, ended_at, verification_status, verification_method, organizations(name)')
      .eq('user_id', application.applicant_id).order('started_at', { ascending: false }),
    supabaseAdmin.schema('ondwira').from('application_stage_events').select('*')
      .eq('application_id', id).order('created_at', { ascending: false }),
    supabaseAdmin.schema('ondwira').from('recruitment_interviews').select('*')
      .eq('application_id', id).order('starts_at', { ascending: false }),
    supabaseAdmin.schema('ondwira').from('job_offers').select('*, contracts(status)')
      .eq('application_id', id).order('version', { ascending: false }),
    supabaseAdmin.schema('ondwira').from('application_ai_evaluations').select('*')
      .eq('application_id', id).order('created_at', { ascending: false }).limit(5),
    resolveOndwiraAccounts([application.applicant_id]),
  ]);
  const snapshot = JSON.parse(decryptData(application.enc_candidate_snapshot) || '{}');
  return NextResponse.json({
    permissions: { isApplicant, canManage: Boolean(manager) },
    application: {
      id: application.id,
      status: application.status,
      source: application.source,
      submittedAt: application.submitted_at,
      coverNote: decryptData(application.enc_cover_note),
      screeningScore: application.screening_score,
      screeningRecommendation: application.screening_recommendation,
      screeningSummary: decryptData(application.enc_screening_summary),
      candidate: { id: application.applicant_id, name: people.get(application.applicant_id)?.name || snapshot.name || 'Ondwira member' },
      snapshot,
      job: {
        id: application.jobs.id,
        title: decryptData(application.jobs.enc_title),
        organizationId: application.organization_id,
        organizationName: application.jobs.organizations?.name,
      },
    },
    answers: (answers ?? []).map((answer: any) => ({
      questionId: answer.job_questions?.id,
      prompt: decryptData(answer.job_questions?.enc_prompt),
      answer: decryptData(answer.enc_answer),
      passedKnockout: answer.passed_knockout,
      score: answer.awarded_score,
    })),
    documents: (documents ?? []).map((document: any) => ({
      id: document.document_id,
      title: decryptData(document.enc_title_snapshot),
      kind: document.document_kind,
      sourceType: document.documents?.source_type,
      fileUrl: decryptData(document.documents?.enc_file_url),
      externalUrl: decryptData(document.documents?.enc_external_url),
      mimeType: document.documents?.mime_type,
      credentialIssuer: document.documents?.credential_issuer,
      credentialId: document.documents?.credential_id,
      accessRevoked: Boolean(document.access_revoked_at),
    })),
    history,
    stages: (stages ?? []).map((stage: any) => ({ ...stage, note: decryptData(stage.enc_note), enc_note: undefined })),
    interviews: (interviews ?? []).map((interview: any) => ({
      id: interview.id, stage: interview.stage, status: interview.status,
      startsAt: interview.starts_at, endsAt: interview.ends_at, timezone: interview.timezone,
      provider: interview.provider, location: decryptData(interview.enc_location),
      meetingUrl: decryptData(interview.enc_meeting_url), agenda: decryptData(interview.enc_agenda),
      candidateResponse: interview.candidate_response,
    })),
    offers: (offers ?? []).map((offer: any) => ({
      id: offer.id, version: offer.version, status: offer.status,
      title: decryptData(offer.enc_title), terms: decryptData(offer.enc_terms),
      proposedStartDate: offer.proposed_start_date, expiresAt: offer.expires_at,
      sentAt: offer.sent_at, contractId: offer.contract_id, contractStatus: offer.contracts?.status,
    })),
    evaluations: (evaluations ?? []).map((evaluation: any) => ({
      ...evaluation, explanation: decryptData(evaluation.enc_explanation), enc_explanation: undefined,
    })),
  });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getOndwiraSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const application = await loadApplication(id);
  if (!application) return NextResponse.json({ error: 'Application not found.' }, { status: 404 });
  const input = await request.json().catch(() => null) as any;
  const action = cleanText(input?.action, 40);
  const isApplicant = application.applicant_id === session.uid;
  const manager = await managerAccess(application, session.uid);
  const actorId = session.uid;
  const now = new Date().toISOString();

  async function changeStatus(nextStatus: string, scope: 'applicant' | 'organization', reasonCode?: string, note?: string) {
    const update: Record<string, unknown> = { status: nextStatus };
    if (nextStatus === 'shortlisted') update.shortlisted_at = now;
    if (nextStatus === 'rejected') update.rejected_at = now;
    if (nextStatus === 'withdrawn') update.withdrawn_at = now;
    if (nextStatus === 'hired') update.hired_at = now;
    const { error } = await supabaseAdmin.schema('ondwira').from('applications').update(update).eq('id', id);
    if (error) throw error;
    await addStageEvent({
      applicationId: id, fromStatus: application.status, toStatus: nextStatus,
      actorId, actorScope: scope, reasonCode, note,
    });
  }

  if (action === 'withdraw') {
    if (!isApplicant || ['hired', 'employment_ended', 'withdrawn'].includes(application.status)) {
      return NextResponse.json({ error: 'This application cannot be withdrawn.' }, { status: 409 });
    }
    await changeStatus('withdrawn', 'applicant', 'candidate_withdrew', cleanText(input.note, 2000));
    await supabaseAdmin.schema('ondwira').from('application_documents').update({ access_revoked_at: now }).eq('application_id', id);
    return NextResponse.json({ success: true, status: 'withdrawn' });
  }

  if (action === 'interview_response') {
    if (!isApplicant || !input.interviewId || !['accepted', 'tentative', 'declined'].includes(input.response)) {
      return NextResponse.json({ error: 'Use a valid interview response.' }, { status: 400 });
    }
    const { data: interview } = await supabaseAdmin.schema('ondwira').from('recruitment_interviews')
      .update({ candidate_response: input.response, status: input.response === 'declined' ? 'declined' : 'accepted' })
      .eq('id', input.interviewId).eq('application_id', id).select('work_meeting_id').maybeSingle();
    if (!interview) return NextResponse.json({ error: 'Interview not found.' }, { status: 404 });
    if (interview.work_meeting_id) {
      await supabaseAdmin.schema('ondwira').from('work_meeting_participants').update({
        response: input.response, responded_at: now,
      }).eq('meeting_id', interview.work_meeting_id).eq('user_id', session.uid);
    }
    return NextResponse.json({ success: true });
  }

  if (action === 'offer_response') {
    if (!isApplicant || !input.offerId || !['accepted', 'declined'].includes(input.response)) {
      return NextResponse.json({ error: 'Use a valid offer response.' }, { status: 400 });
    }
    const offerStatus = input.response === 'accepted' ? 'accepted' : 'declined';
    const { data: offer } = await supabaseAdmin.schema('ondwira').from('job_offers')
      .update({ status: offerStatus, responded_at: now }).eq('id', input.offerId).eq('application_id', id)
      .in('status', ['sent', 'viewed', 'negotiating']).select('id').maybeSingle();
    if (!offer) return NextResponse.json({ error: 'Offer is no longer open.' }, { status: 409 });
    await changeStatus(input.response === 'accepted' ? 'offer_accepted' : 'offer_declined', 'applicant', `offer_${input.response}`);
    return NextResponse.json({ success: true, status: input.response === 'accepted' ? 'offer_accepted' : 'offer_declined' });
  }

  if (action === 'resign') {
    if (!isApplicant || !['hired', 'employment_ended'].includes(application.status)) {
      return NextResponse.json({ error: 'No active employment was found for this application.' }, { status: 409 });
    }
    const { data: record } = await supabaseAdmin.schema('ondwira').from('employment_records')
      .select('id, status').eq('legacy_application_id', id).eq('user_id', session.uid).maybeSingle();
    if (!record || !['active', 'notice'].includes(record.status)) return NextResponse.json({ error: 'Employment is not active.' }, { status: 409 });
    const lastDay = input.lastDay && !Number.isNaN(Date.parse(input.lastDay)) ? input.lastDay : null;
    await supabaseAdmin.schema('ondwira').from('employment_records').update({
      status: 'notice', ended_at: lastDay, end_reason: 'resignation', last_event_at: now,
    }).eq('id', record.id);
    await supabaseAdmin.schema('ondwira').from('employment_events').insert({
      employment_record_id: record.id, organization_id: application.organization_id,
      worker_id: session.uid, actor_id: session.uid, event_type: 'resignation_submitted',
      effective_at: now, enc_reason: cleanText(input.reason, 3000) ? encryptData(cleanText(input.reason, 3000)) : null,
      metadata: { proposedLastDay: lastDay },
    });
    return NextResponse.json({ success: true, status: 'notice' });
  }

  if (!manager) return NextResponse.json({ error: 'Only hiring managers can perform this action.' }, { status: 403 });

  if (action === 'screen') {
    const result = await evaluateApplication(id);
    return NextResponse.json({ success: true, status: result.nextStatus, screening: result });
  }
  if (action === 'move') {
    const next = cleanText(input.status, 40);
    const allowed = new Set(['needs_review', 'on_hold', 'shortlisted', 'interview', 'offer']);
    if (!allowed.has(next)) return NextResponse.json({ error: 'Use a valid hiring stage.' }, { status: 400 });
    await changeStatus(next, 'organization', cleanText(input.reasonCode, 80), cleanText(input.note, 3000));
    return NextResponse.json({ success: true, status: next });
  }
  if (action === 'reject') {
    const note = cleanText(input.note, 3000);
    if (note.length < 10) return NextResponse.json({ error: 'Add a clear human-reviewed rejection reason.' }, { status: 400 });
    await changeStatus('rejected', 'organization', cleanText(input.reasonCode, 80) || 'not_selected', note);
    return NextResponse.json({ success: true, status: 'rejected' });
  }
  if (action === 'review') {
    if (!['strong_yes', 'yes', 'mixed', 'no', 'strong_no'].includes(input.recommendation)) {
      return NextResponse.json({ error: 'Choose a review recommendation.' }, { status: 400 });
    }
    await supabaseAdmin.schema('ondwira').from('application_reviews').upsert({
      application_id: id, reviewer_id: session.uid, recommendation: input.recommendation,
      score: Number.isInteger(input.score) ? Math.max(0, Math.min(100, input.score)) : null,
      enc_note: cleanText(input.note, 5000) ? encryptData(cleanText(input.note, 5000)) : null,
      updated_at: now,
    }, { onConflict: 'application_id,reviewer_id' });
    return NextResponse.json({ success: true });
  }
  if (action === 'schedule_interview') {
    const starts = input.startsAt && !Number.isNaN(Date.parse(input.startsAt)) ? new Date(input.startsAt) : null;
    const ends = input.endsAt && !Number.isNaN(Date.parse(input.endsAt)) ? new Date(input.endsAt) : null;
    if (!starts || !ends || ends <= starts || starts <= new Date()) {
      return NextResponse.json({ error: 'Choose a valid future interview time.' }, { status: 400 });
    }
    const provider = ['ondwira', 'google_meet', 'zoom', 'teams', 'jitsi', 'custom', 'in_person', 'phone'].includes(input.provider)
      ? input.provider : 'ondwira';
    const title = `Interview: ${decryptData(application.jobs.enc_title) || 'Role'}`;
    const meetingProvider = ['in_person', 'phone'].includes(provider) ? 'custom' : provider;
    const { data: meeting, error: meetingError } = await supabaseAdmin.schema('ondwira').from('work_meetings').insert({
      organization_id: application.organization_id,
      organizer_id: session.uid,
      enc_title: encryptData(title),
      enc_agenda: cleanText(input.agenda, 8000) ? encryptData(cleanText(input.agenda, 8000)) : null,
      enc_location: cleanText(input.location, 500) ? encryptData(cleanText(input.location, 500)) : null,
      enc_meeting_url: cleanText(input.meetingUrl, 2000) ? encryptData(cleanText(input.meetingUrl, 2000)) : null,
      provider: meetingProvider,
      starts_at: starts.toISOString(), ends_at: ends.toISOString(),
      timezone: cleanText(input.timezone, 100) || 'Africa/Nairobi',
      reminder_minutes: [10, 60, 1440],
      native_room_ready: provider === 'ondwira' ? false : false,
    }).select('id').single();
    if (meetingError || !meeting) return NextResponse.json({ error: 'Interview meeting could not be created.' }, { status: 500 });
    await supabaseAdmin.schema('ondwira').from('work_meeting_participants').insert([
      { meeting_id: meeting.id, user_id: session.uid, participant_role: 'host', response: 'accepted', responded_at: now },
      { meeting_id: meeting.id, user_id: application.applicant_id, participant_role: 'required', response: 'pending' },
    ]);
    const { data: interview, error } = await supabaseAdmin.schema('ondwira').from('recruitment_interviews').insert({
      application_id: id, organization_id: application.organization_id, work_meeting_id: meeting.id,
      stage: ['screening', 'first', 'technical', 'panel', 'final', 'culture', 'other'].includes(input.stage) ? input.stage : 'first',
      status: 'scheduled', starts_at: starts.toISOString(), ends_at: ends.toISOString(),
      timezone: cleanText(input.timezone, 100) || 'Africa/Nairobi', provider,
      enc_location: cleanText(input.location, 500) ? encryptData(cleanText(input.location, 500)) : null,
      enc_meeting_url: cleanText(input.meetingUrl, 2000) ? encryptData(cleanText(input.meetingUrl, 2000)) : null,
      enc_agenda: cleanText(input.agenda, 8000) ? encryptData(cleanText(input.agenda, 8000)) : null,
      scheduled_by: session.uid,
    }).select('id').single();
    if (error || !interview) return NextResponse.json({ error: 'Interview could not be linked.' }, { status: 500 });
    await changeStatus('interview', 'organization', 'interview_scheduled');
    await supabaseAdmin.schema('ondwira').from('job_events').insert({
      job_id: application.job_id, organization_id: application.organization_id, actor_id: session.uid,
      application_id: id, event_type: 'interview_scheduled', metadata: { interviewId: interview.id },
    });
    return NextResponse.json({ success: true, status: 'interview', interviewId: interview.id });
  }
  if (action === 'send_offer') {
    const title = cleanText(input.title, 180);
    const terms = cleanText(input.terms, 30_000);
    if (!title || terms.length < 30) return NextResponse.json({ error: 'Add an offer title and complete terms.' }, { status: 400 });
    const { data: previous } = await supabaseAdmin.schema('ondwira').from('job_offers')
      .select('version').eq('application_id', id).order('version', { ascending: false }).limit(1);
    const version = Number(previous?.[0]?.version || 0) + 1;
    const { data: document } = await supabaseAdmin.schema('ondwira').from('documents').insert({
      owner_id: session.uid, enc_title: encryptData(`${title} — v${version}`), document_kind: 'contract',
      source_type: 'generated', enc_content: encryptData(terms), agent_readable: false,
    }).select('id').single();
    if (!document) return NextResponse.json({ error: 'Offer document could not be generated.' }, { status: 500 });
    const { data: contract } = await supabaseAdmin.schema('ondwira').from('contracts').insert({
      organization_id: application.organization_id, worker_id: application.applicant_id,
      document_id: document.id, status: 'sent', sent_at: now, created_by: session.uid,
    }).select('id').single();
    if (!contract) return NextResponse.json({ error: 'Offer contract could not be created.' }, { status: 500 });
    const { data: offer, error } = await supabaseAdmin.schema('ondwira').from('job_offers').insert({
      application_id: id, organization_id: application.organization_id, contract_id: contract.id,
      version, status: 'sent', enc_title: encryptData(title), enc_terms: encryptData(terms),
      proposed_start_date: input.proposedStartDate || null,
      expires_at: input.expiresAt ? new Date(input.expiresAt).toISOString() : null,
      sent_by: session.uid, sent_at: now,
    }).select('id').single();
    if (error || !offer) return NextResponse.json({ error: 'Offer could not be sent.' }, { status: 500 });
    await changeStatus('offer', 'organization', 'offer_sent');
    await supabaseAdmin.schema('ondwira').from('job_events').insert({
      job_id: application.job_id, organization_id: application.organization_id, actor_id: session.uid,
      application_id: id, event_type: 'offer_sent', metadata: { offerId: offer.id, version },
    });
    return NextResponse.json({ success: true, status: 'offer', offerId: offer.id, contractId: contract.id });
  }
  if (action === 'hire') {
    if (!['offer_accepted', 'offer'].includes(application.status)) {
      return NextResponse.json({ error: 'The candidate must have an accepted offer before employment starts.' }, { status: 409 });
    }
    const { data: offer } = await supabaseAdmin.schema('ondwira').from('job_offers')
      .select('id, contract_id, status, proposed_start_date, contracts(status)')
      .eq('application_id', id).order('version', { ascending: false }).limit(1).maybeSingle();
    if (!offer || offer.status !== 'accepted') return NextResponse.json({ error: 'The latest offer has not been accepted.' }, { status: 409 });
    if (offer.contract_id && offer.contracts?.status !== 'signed') {
      return NextResponse.json({ error: 'The contract must be signed before employment starts.' }, { status: 409 });
    }
    const { data: identity } = await supabaseAdmin.schema('ondwira').from('account_identities')
      .select('identity_type').eq('account_id', application.applicant_id).in('identity_type', ['professional', 'employer']).maybeSingle();
    const startDate = input.startDate || offer.proposed_start_date || new Date().toISOString().slice(0, 10);
    const { data: employment, error } = await supabaseAdmin.schema('ondwira').from('employment_records').upsert({
      user_id: application.applicant_id, organization_id: application.organization_id,
      legacy_application_id: id, job_id: application.job_id,
      title: decryptData(application.jobs.enc_title) || 'Role',
      employment_type: application.jobs.employment_type, status: 'active', started_at: startDate,
      ended_at: null, end_reason: null, source: 'contract',
      verification_status: 'verified', verification_method: 'ondwira_lifecycle',
      verified_at: now, verified_by: session.uid, last_event_at: now,
    }, { onConflict: 'legacy_application_id' }).select('id').single();
    if (error || !employment) return NextResponse.json({ error: 'Employment record could not be started.' }, { status: 500 });
    await Promise.all([
      ensureCompanyGroupMembership({
        organizationId: application.organization_id, workerId: application.applicant_id,
        accountType: identity?.identity_type === 'employer' ? 'employer' : 'professional',
        actorId: session.uid, sourceId: employment.id, active: true,
      }),
      supabaseAdmin.schema('ondwira').from('employment_events').insert({
        employment_record_id: employment.id, organization_id: application.organization_id,
        worker_id: application.applicant_id, actor_id: session.uid,
        event_type: 'employment_started', effective_at: new Date(startDate).toISOString(),
        metadata: { applicationId: id, offerId: offer.id },
      }),
    ]);
    await changeStatus('hired', 'organization', 'employment_started');
    await supabaseAdmin.schema('ondwira').from('job_events').insert({
      job_id: application.job_id, organization_id: application.organization_id, actor_id: session.uid,
      application_id: id, event_type: 'hired', metadata: { employmentId: employment.id },
    });
    return NextResponse.json({ success: true, status: 'hired', employmentId: employment.id });
  }
  if (action === 'end_employment') {
    const ending = ['resigned', 'terminated', 'ended'].includes(input.outcome) ? input.outcome : null;
    const reason = cleanText(input.reason, 4000);
    if (!ending || reason.length < 10) return NextResponse.json({ error: 'Choose an outcome and record a clear reason.' }, { status: 400 });
    const { data: employment } = await supabaseAdmin.schema('ondwira').from('employment_records')
      .select('id, status').eq('legacy_application_id', id).maybeSingle();
    if (!employment || !['active', 'notice'].includes(employment.status)) {
      return NextResponse.json({ error: 'No active employment was found.' }, { status: 409 });
    }
    const endDate = input.endDate || new Date().toISOString().slice(0, 10);
    const { data: identity } = await supabaseAdmin.schema('ondwira').from('account_identities')
      .select('identity_type').eq('account_id', application.applicant_id).in('identity_type', ['professional', 'employer']).maybeSingle();
    await supabaseAdmin.schema('ondwira').from('employment_records').update({
      status: ending, ended_at: endDate, end_reason: reason, last_event_at: now,
    }).eq('id', employment.id);
    const eventType = ending === 'resigned' ? 'resignation_accepted' : ending === 'terminated' ? 'dismissed' : 'employment_ended';
    await Promise.all([
      supabaseAdmin.schema('ondwira').from('employment_events').insert({
        employment_record_id: employment.id, organization_id: application.organization_id,
        worker_id: application.applicant_id, actor_id: session.uid,
        event_type: eventType, effective_at: new Date(endDate).toISOString(), enc_reason: encryptData(reason),
      }),
      ensureCompanyGroupMembership({
        organizationId: application.organization_id, workerId: application.applicant_id,
        accountType: identity?.identity_type === 'employer' ? 'employer' : 'professional',
        actorId: session.uid, sourceId: employment.id, active: false,
      }),
    ]);
    await changeStatus('employment_ended', 'organization', eventType, reason);
    return NextResponse.json({ success: true, status: 'employment_ended' });
  }
  return NextResponse.json({ error: 'Unknown application action.' }, { status: 400 });
}
