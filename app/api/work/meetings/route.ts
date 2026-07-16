/* eslint-disable @typescript-eslint/no-explicit-any */
import { randomUUID } from 'crypto';
import { NextResponse } from 'next/server';
import { getOndwiraSession } from '@/lib/ondwira-auth';
import { resolveOndwiraPeople } from '@/lib/ondwira-contacts';
import { supabaseAdmin } from '@/lib/supabase';
import { decryptData, encryptData } from '@/lib/security';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type MeetingInput = {
  organizationId?: string;
  workGroupId?: string | null;
  title?: string;
  agenda?: string;
  location?: string;
  meetingUrl?: string;
  provider?: string;
  startsAt?: string;
  endsAt?: string;
  timezone?: string;
  participantIds?: string[];
  reminderMinutes?: number[];
};

const providers = new Set(['google_meet', 'zoom', 'teams', 'jitsi', 'custom']);
const allowedReminders = new Set([0, 5, 10, 15, 30, 60, 1440, 10080]);

async function activeMembership(organizationId: string, userId: string) {
  const { data } = await supabaseAdmin.schema('ondwira').from('organization_members')
    .select('role, status, account_type').eq('organization_id', organizationId).eq('user_id', userId).maybeSingle();
  return data?.status === 'active' ? data : null;
}

function safeMeetingUrl(value: string | undefined) {
  if (!value?.trim()) return null;
  try {
    const url = new URL(value.trim());
    return ['http:', 'https:'].includes(url.protocol) ? url.toString().slice(0, 2000) : null;
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const session = await getOndwiraSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const requestedOrganization = new URL(request.url).searchParams.get('organizationId');
  const { data: memberships, error: membershipError } = await supabaseAdmin.schema('ondwira').from('organization_members')
    .select('organization_id, account_type, role, status, organizations!inner(id, name)').eq('user_id', session.uid).eq('status', 'active');
  if (membershipError) return NextResponse.json({ error: 'Unable to load meeting access' }, { status: 500 });
  const allowedOrganizations = (memberships ?? []).filter((item: any) => !requestedOrganization || item.organization_id === requestedOrganization);
  const organizationIds = allowedOrganizations.map((item: any) => item.organization_id);
  if (!organizationIds.length) return NextResponse.json({ organizations: memberships ?? [], meetings: [] });

  const { data: participantRows } = await supabaseAdmin.schema('ondwira').from('work_meeting_participants').select('meeting_id').eq('user_id', session.uid);
  const participantMeetingIds = (participantRows ?? []).map((item: { meeting_id: string }) => item.meeting_id);
  const select = 'id, organization_id, work_group_id, conversation_id, organizer_id, enc_title, enc_agenda, enc_location, enc_meeting_url, provider, starts_at, ends_at, timezone, reminder_minutes, status, native_room_ready, created_at, work_groups(name)';
  const [organizedResult, invitedResult] = await Promise.all([
    supabaseAdmin.schema('ondwira').from('work_meetings').select(select).in('organization_id', organizationIds).eq('organizer_id', session.uid).order('starts_at'),
    participantMeetingIds.length
      ? supabaseAdmin.schema('ondwira').from('work_meetings').select(select).in('organization_id', organizationIds).in('id', participantMeetingIds).order('starts_at')
      : Promise.resolve({ data: [], error: null }),
  ]);
  if (organizedResult.error || invitedResult.error) return NextResponse.json({ error: 'Unable to load meetings' }, { status: 500 });
  const meetings = [...new Map([...(organizedResult.data ?? []), ...(invitedResult.data ?? [])].map((item: any) => [item.id, item])).values()];
  const meetingIds = meetings.map((meeting: any) => meeting.id);
  if (!meetingIds.length) return NextResponse.json({ organizations: memberships ?? [], meetings: [] });

  const [participantsResult, remindersResult, memberResult] = await Promise.all([
    supabaseAdmin.schema('ondwira').from('work_meeting_participants').select('meeting_id, user_id, participant_role, response, responded_at').in('meeting_id', meetingIds),
    supabaseAdmin.schema('ondwira').from('work_meeting_reminders').select('meeting_id, reminder_minutes, delivered_at, dismissed_at').eq('user_id', session.uid).in('meeting_id', meetingIds),
    supabaseAdmin.schema('ondwira').from('organization_members').select('organization_id, user_id, account_type').in('organization_id', organizationIds).eq('status', 'active'),
  ]);
  const people = await resolveOndwiraPeople((memberResult.data ?? []) as Array<{ user_id: string; account_type: string }>);
  return NextResponse.json({
    viewerId: session.uid,
    organizations: memberships ?? [],
    meetings: meetings.map((meeting: any) => ({
      id: meeting.id,
      organizationId: meeting.organization_id,
      groupId: meeting.work_group_id,
      groupName: meeting.work_groups?.name || null,
      organizerId: meeting.organizer_id,
      isOrganizer: meeting.organizer_id === session.uid,
      title: decryptData(meeting.enc_title),
      agenda: decryptData(meeting.enc_agenda),
      location: decryptData(meeting.enc_location),
      meetingUrl: decryptData(meeting.enc_meeting_url),
      provider: meeting.provider,
      startsAt: meeting.starts_at,
      endsAt: meeting.ends_at,
      timezone: meeting.timezone,
      reminderMinutes: meeting.reminder_minutes,
      status: meeting.status,
      nativeRoomReady: meeting.native_room_ready,
      participants: (participantsResult.data ?? []).filter((participant: any) => participant.meeting_id === meeting.id).map((participant: any) => ({
        userId: participant.user_id,
        name: people.get(participant.user_id)?.name || (participant.user_id === session.uid ? 'You' : 'Member'),
        role: participant.participant_role,
        response: participant.response,
      })),
      viewerResponse: (participantsResult.data ?? []).find((participant: any) => participant.meeting_id === meeting.id && participant.user_id === session.uid)?.response || 'pending',
      reminders: (remindersResult.data ?? []).filter((reminder: any) => reminder.meeting_id === meeting.id),
    })),
  });
}

export async function POST(request: Request) {
  const session = await getOndwiraSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const input = await request.json().catch(() => null) as MeetingInput | null;
  if (!input?.organizationId || !(await activeMembership(input.organizationId, session.uid))) return NextResponse.json({ error: 'Choose an organisation you belong to' }, { status: 403 });
  const title = input.title?.trim().replace(/\s+/g, ' ').slice(0, 160);
  const startsAt = input.startsAt && !Number.isNaN(Date.parse(input.startsAt)) ? new Date(input.startsAt) : null;
  const endsAt = input.endsAt && !Number.isNaN(Date.parse(input.endsAt)) ? new Date(input.endsAt) : null;
  if (!title || !startsAt || !endsAt || endsAt <= startsAt) return NextResponse.json({ error: 'Add a title and a valid start and end time' }, { status: 400 });
  if (startsAt.getTime() < Date.now() - 5 * 60000) return NextResponse.json({ error: 'Meeting time must be in the future' }, { status: 400 });
  const provider = providers.has(input.provider || '') ? input.provider! : 'custom';
  let meetingUrl = safeMeetingUrl(input.meetingUrl);
  if (provider === 'jitsi' && !meetingUrl) meetingUrl = `https://meet.jit.si/ondwira-${randomUUID().replace(/-/g, '')}`;
  if (input.meetingUrl && !meetingUrl) return NextResponse.json({ error: 'Use a valid http or https meeting link' }, { status: 400 });
  const reminderMinutes = [...new Set((input.reminderMinutes ?? [10]).map(Number).filter(value => allowedReminders.has(value)))].sort((a, b) => a - b);

  let group: { id: string; conversation_id: string | null } | null = null;
  if (input.workGroupId) {
    const { data } = await supabaseAdmin.schema('ondwira').from('work_groups').select('id, conversation_id').eq('id', input.workGroupId).eq('organization_id', input.organizationId).is('archived_at', null).maybeSingle();
    if (!data) return NextResponse.json({ error: 'Choose a valid work group' }, { status: 400 });
    group = data;
  }
  const requestedIds = new Set([session.uid, ...(input.participantIds ?? [])]);
  if (group) {
    const { data: groupMembers } = await supabaseAdmin.schema('ondwira').from('work_group_members').select('user_id').eq('group_id', group.id).is('removed_at', null);
    (groupMembers ?? []).forEach((member: { user_id: string }) => requestedIds.add(member.user_id));
  }
  const { data: allowedParticipants } = await supabaseAdmin.schema('ondwira').from('organization_members').select('user_id').eq('organization_id', input.organizationId).eq('status', 'active').in('user_id', [...requestedIds]);
  const participantIds = (allowedParticipants ?? []).map((item: { user_id: string }) => item.user_id);

  const { data: meeting, error } = await supabaseAdmin.schema('ondwira').from('work_meetings').insert({
    organization_id: input.organizationId,
    work_group_id: group?.id || null,
    conversation_id: group?.conversation_id || null,
    organizer_id: session.uid,
    enc_title: encryptData(title),
    enc_agenda: input.agenda?.trim() ? encryptData(input.agenda.trim().slice(0, 8000)) : null,
    enc_location: input.location?.trim() ? encryptData(input.location.trim().slice(0, 500)) : null,
    enc_meeting_url: meetingUrl ? encryptData(meetingUrl) : null,
    provider,
    starts_at: startsAt.toISOString(),
    ends_at: endsAt.toISOString(),
    timezone: input.timezone?.trim().slice(0, 100) || 'Africa/Nairobi',
    reminder_minutes: reminderMinutes,
  }).select('id').single();
  if (error || !meeting) return NextResponse.json({ error: 'The meeting could not be scheduled' }, { status: 500 });

  const { error: participantError } = await supabaseAdmin.schema('ondwira').from('work_meeting_participants').insert(participantIds.map((userId: string) => ({
    meeting_id: meeting.id,
    user_id: userId,
    participant_role: userId === session.uid ? 'host' : 'required',
    response: userId === session.uid ? 'accepted' : 'pending',
    responded_at: userId === session.uid ? new Date().toISOString() : null,
  })));
  if (participantError) {
    await supabaseAdmin.schema('ondwira').from('work_meetings').delete().eq('id', meeting.id);
    return NextResponse.json({ error: 'Meeting participants could not be saved' }, { status: 500 });
  }
  if (reminderMinutes.length) await supabaseAdmin.schema('ondwira').from('work_meeting_reminders').insert(participantIds.flatMap((userId: string) => reminderMinutes.map(minutes => ({ meeting_id: meeting.id, user_id: userId, reminder_minutes: minutes }))));

  if (group?.conversation_id) {
    const payload = { title, description: input.agenda?.trim() || '', location: input.location?.trim() || '', startsAt: startsAt.toISOString(), endsAt: endsAt.toISOString(), meetingUrl };
    const { data: message } = await supabaseAdmin.schema('ondwira').from('messages').insert({
      conversation_id: group.conversation_id,
      sender_id: session.uid,
      sender_type: session.schema,
      body: encryptData(title),
      message_type: 'meeting',
      payload_ciphertext: encryptData(JSON.stringify(payload)),
    }).select('id').single();
    if (message) await supabaseAdmin.schema('ondwira').from('message_events').insert({
      message_id: message.id,
      event_kind: 'meeting',
      encrypted_title: encryptData(title),
      encrypted_description: input.agenda?.trim() ? encryptData(input.agenda.trim().slice(0, 8000)) : null,
      encrypted_location: input.location?.trim() ? encryptData(input.location.trim().slice(0, 500)) : null,
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
      meeting_url: meetingUrl ? encryptData(meetingUrl) : null,
    });
  }
  return NextResponse.json({ meeting: { id: meeting.id } }, { status: 201 });
}
