import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/client';

export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
  }

  try {
    const body = await request.json();
    const { volunteer_id, volunteer_id_code, action, verification_notes } = body;

    if (!volunteer_id) {
      return NextResponse.json({ error: 'Volunteer ID is required' }, { status: 400 });
    }

    const supabase = process.env.SUPABASE_SERVICE_ROLE_KEY
      ? await createServiceClient()
      : await createClient();

    // Verify caller has coordinator or admin role
    const authClient = await createClient();
    const { data: { user } } = await authClient.auth.getUser();

    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();

      const callerRole = profile?.role || user.app_metadata?.role || user.user_metadata?.role;
      if (callerRole && callerRole !== 'coordinator' && callerRole !== 'admin') {
        return NextResponse.json(
          { error: 'Forbidden: Volunteers are not authorized to verify other volunteers or issue IDs.' },
          { status: 403 }
        );
      }
    }

    const coordinatorEmail = user?.email || 'coordinator@reliefnet.org';

    if (action === 'reject') {
      const { data, error } = await supabase
        .from('volunteer_profiles')
        .update({
          verification_status: 'rejected',
          verification_notes: verification_notes?.trim() || 'Candidate not approved during interview',
          updated_at: new Date().toISOString(),
        })
        .eq('id', volunteer_id)
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: 'Volunteer application declined.',
        volunteer: data,
      });
    }

    // Default action: 'approve'
    const idCode = volunteer_id_code?.trim()?.toUpperCase();
    if (!idCode || idCode.length < 3) {
      return NextResponse.json(
        { error: 'Please enter a valid official Volunteer ID code (e.g. RN-VOL-2026-001)' },
        { status: 400 }
      );
    }

    // Check if ID code is already assigned to someone else
    const { data: existing } = await supabase
      .from('volunteer_profiles')
      .select('id, name')
      .eq('volunteer_id_code', idCode)
      .neq('id', volunteer_id)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: `Volunteer ID "${idCode}" is already assigned to ${existing.name}. Please enter a unique ID.` },
        { status: 409 }
      );
    }

    const verifiedAt = new Date().toISOString();

    const { data: updatedVolunteer, error: updateError } = await supabase
      .from('volunteer_profiles')
      .update({
        volunteer_id_code: idCode,
        verification_status: 'verified',
        phone_interview_completed: true,
        verification_notes: verification_notes?.trim() || 'Phone interview completed. Identity and capabilities confirmed.',
        verified_at: verifiedAt,
        verified_by_email: coordinatorEmail,
        updated_at: verifiedAt,
      })
      .eq('id', volunteer_id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Volunteer verified! Assigned official ID: ${idCode}`,
      volunteer: updatedVolunteer,
    });
  } catch (err) {
    console.error('Verification error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to verify volunteer' },
      { status: 500 }
    );
  }
}
