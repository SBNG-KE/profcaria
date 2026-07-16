import { NextResponse } from 'next/server';
import { getOndwiraSession } from '@/lib/ondwira-auth';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getOndwiraSession();
  const { id } = await params;
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { data: meeting } = await supabaseAdmin.schema('ondwira').from('work_meetings').select('id, organizer_id, status').eq('id', id).maybeSingle();
  if (!meeting) return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
  const { data: participant } = await supabaseAdmin.schema('ondwira').from('work_meeting_participants').select('user_id').eq('meeting_id', id).eq('user_id', session.uid).maybeSingle();
  if (!participant && meeting.organizer_id !== session.uid) return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
  const input = await request.json().catch(() => null) as { action?: string; response?: string; reminderMinutes?: number } | null;

  if (input?.action === 'rsvp' && ['accepted', 'tentative', 'declined'].includes(input.response || '')) {
    const { error } = await supabaseAdmin.schema('ondwira').from('work_meeting_participants').update({ response: input.response, responded_at: new Date().toISOString() }).eq('meeting_id', id).eq('user_id', session.uid);
    if (error) return NextResponse.json({ error: 'Response could not be saved' }, { status: 500 });
    return NextResponse.json({ response: input.response });
  }
  if (input?.action === 'cancel') {
    if (meeting.organizer_id !== session.uid) return NextResponse.json({ error: 'Only the organiser can cancel this meeting' }, { status: 403 });
    await supabaseAdmin.schema('ondwira').from('work_meetings').update({ status: 'cancelled', cancelled_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('id', id);
    return NextResponse.json({ cancelled: true });
  }
  if (input?.action === 'reminder_delivered' && Number.isFinite(input.reminderMinutes)) {
    await supabaseAdmin.schema('ondwira').from('work_meeting_reminders').update({ delivered_at: new Date().toISOString() }).eq('meeting_id', id).eq('user_id', session.uid).eq('reminder_minutes', input.reminderMinutes);
    return NextResponse.json({ delivered: true });
  }
  return NextResponse.json({ error: 'Unsupported meeting action' }, { status: 400 });
}
