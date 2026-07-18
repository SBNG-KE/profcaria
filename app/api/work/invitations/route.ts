import { NextResponse } from 'next/server';
import { getOndwiraSession } from '@/lib/ondwira-auth';
import { resolveOndwiraAccounts } from '@/lib/ondwira-contacts';
import { addAutomaticOrganizationAccess, removeOrganizationAccess, resolveOrganizationAccountType } from '@/lib/ondwira-organizations';
import { supabaseAdmin } from '@/lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getOndwiraSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const now = new Date().toISOString();
  await supabaseAdmin.schema('ondwira').from('organization_invitations').update({ status: 'expired' })
    .eq('invitee_account_id', session.uid).eq('status', 'pending').lte('expires_at', now);
  const { data, error } = await supabaseAdmin.schema('ondwira').from('organization_invitations')
    .select('id, organization_id, role, invited_by, expires_at, created_at, organizations!inner(id, name)')
    .eq('invitee_account_id', session.uid).eq('status', 'pending').gt('expires_at', now).order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: 'Unable to load work invitations.' }, { status: 500 });
  const inviters = await resolveOndwiraAccounts((data ?? []).map((invitation: { invited_by: string }) => invitation.invited_by));
  return NextResponse.json({
    invitations: (data ?? []).map((invitation: { id: string; organization_id: string; role: string; invited_by: string; expires_at: string; created_at: string; organizations: { id: string; name: string } }) => ({
      id: invitation.id,
      organizationId: invitation.organization_id,
      organizationName: invitation.organizations.name,
      role: invitation.role,
      invitedBy: inviters.get(invitation.invited_by)?.name || 'Organisation administrator',
      expiresAt: invitation.expires_at,
      createdAt: invitation.created_at,
    })),
  });
}

export async function PATCH(request: Request) {
  const session = await getOndwiraSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const input = await request.json().catch(() => null) as { invitationId?: string; action?: string } | null;
  if (!input?.invitationId || !['accept', 'decline'].includes(input.action || '')) return NextResponse.json({ error: 'Invalid invitation action.' }, { status: 400 });
  const { data: invitation, error } = await supabaseAdmin.schema('ondwira').from('organization_invitations')
    .select('id, organization_id, role, status, expires_at').eq('id', input.invitationId).eq('invitee_account_id', session.uid).maybeSingle();
  if (error || !invitation || invitation.status !== 'pending') return NextResponse.json({ error: 'Invitation not found.' }, { status: 404 });
  if (new Date(invitation.expires_at).getTime() <= Date.now()) {
    await supabaseAdmin.schema('ondwira').from('organization_invitations').update({ status: 'expired' }).eq('id', invitation.id);
    return NextResponse.json({ error: 'This invitation has expired.' }, { status: 410 });
  }
  if (input.action === 'decline') {
    const { error: declineError } = await supabaseAdmin.schema('ondwira').from('organization_invitations').update({ status: 'declined' }).eq('id', invitation.id).eq('status', 'pending');
    if (declineError) return NextResponse.json({ error: 'The invitation could not be declined.' }, { status: 500 });
    return NextResponse.json({ success: true, status: 'declined' });
  }

  const accountType = await resolveOrganizationAccountType(session.uid);
  const now = new Date().toISOString();
  const { error: membershipError } = await supabaseAdmin.schema('ondwira').from('organization_members').upsert({
    organization_id: invitation.organization_id,
    user_id: session.uid,
    account_type: accountType,
    role: invitation.role,
    status: 'active',
    joined_at: now,
    ended_at: null,
  }, { onConflict: 'organization_id,user_id' });
  if (membershipError) return NextResponse.json({ error: 'The organisation membership could not be activated.' }, { status: 500 });
  try {
    await addAutomaticOrganizationAccess({ organizationId: invitation.organization_id, userId: session.uid, accountType });
  } catch (syncError) {
    await supabaseAdmin.schema('ondwira').from('organization_members').update({ status: 'invited', ended_at: now }).eq('organization_id', invitation.organization_id).eq('user_id', session.uid);
    console.error('[ONDWIRA] invitation group sync failed', syncError);
    return NextResponse.json({ error: 'Work access could not be synchronized. Please try accepting again.' }, { status: 500 });
  }
  const { error: acceptError } = await supabaseAdmin.schema('ondwira').from('organization_invitations').update({
    status: 'accepted', accepted_by: session.uid, accepted_at: now,
  }).eq('id', invitation.id).eq('status', 'pending');
  if (acceptError) {
    await supabaseAdmin.schema('ondwira').from('organization_members')
      .update({ status: 'invited', ended_at: now })
      .eq('organization_id', invitation.organization_id).eq('user_id', session.uid);
    await removeOrganizationAccess(invitation.organization_id, session.uid).catch(() => undefined);
    return NextResponse.json({ error: 'The invitation acceptance could not be recorded.' }, { status: 500 });
  }
  await supabaseAdmin.schema('ondwira').from('organization_invitations').update({ status: 'revoked' })
    .eq('organization_id', invitation.organization_id).eq('invitee_account_id', session.uid).eq('status', 'pending').neq('id', invitation.id);
  return NextResponse.json({ success: true, status: 'accepted', organizationId: invitation.organization_id });
}
