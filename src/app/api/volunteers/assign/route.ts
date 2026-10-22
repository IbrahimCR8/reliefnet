import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/client';

export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
  }

  try {
    const body = await request.json();
    const { volunteer_id, incident_id, role_task, action } = body;

    if (!volunteer_id) {
      return NextResponse.json({ error: 'Volunteer ID is required' }, { status: 400 });
    }

    const supabase = process.env.SUPABASE_SERVICE_ROLE_KEY
      ? await createServiceClient()
      : await createClient();

    // Verify coordinator session (if authenticated user exists)
    const { data: { user } } = await supabase.auth.getUser();
    const coordinatorEmail = user?.email || 'coordinator@reliefnet.org';

    if (action === 'unassign') {
      // Relieve volunteer from current mission
      const { data: updatedVolunteer, error: updateError } = await supabase
        .from('volunteer_profiles')
        .update({
          assigned_incident_id: null,
          assigned_role_task: null,
          assigned_at: null,
          assigned_by_email: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', volunteer_id)
        .select()
        .single();

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }

      // Update assignment log if table exists
      await supabase
        .from('volunteer_assignments')
        .update({ status: 'completed', updated_at: new Date().toISOString() })
        .eq('volunteer_profile_id', volunteer_id)
        .eq('status', 'assigned');

      return NextResponse.json({
        success: true,
        message: 'Volunteer successfully relieved from mission.',
        volunteer: updatedVolunteer,
      });
    }

    // Assigning a job to the volunteer
    if (!incident_id) {
      return NextResponse.json({ error: 'Incident ID is required for assignment' }, { status: 400 });
    }

    // Verify the incident exists in real database
    const { data: incident, error: incError } = await supabase
      .from('incidents')
      .select('id, reference_code, title')
      .eq('id', incident_id)
      .single();

    if (incError || !incident) {
      return NextResponse.json({ error: 'Target incident does not exist in database' }, { status: 404 });
    }

    const assignedAt = new Date().toISOString();
    const taskDescription = role_task?.trim() || 'Disaster Relief Ground Operations';

    // 1. Update volunteer profile
    const { data: updatedVolunteer, error: volError } = await supabase
      .from('volunteer_profiles')
      .update({
        assigned_incident_id: incident.id,
        assigned_role_task: taskDescription,
        assigned_at: assignedAt,
        assigned_by_email: coordinatorEmail,
        updated_at: assignedAt,
      })
      .eq('id', volunteer_id)
      .select()
      .single();

    if (volError) {
      return NextResponse.json({ error: volError.message }, { status: 500 });
    }

    // 2. Insert into volunteer_assignments log (ignoring error if table doesn't have profile FK yet)
    try {
      await supabase.from('volunteer_assignments').insert({
        incident_id: incident.id,
        volunteer_profile_id: volunteer_id,
        role_task: taskDescription,
        assigned_by_email: coordinatorEmail,
        status: 'assigned',
      });
    } catch {
      // Non-blocking log insert
    }

    return NextResponse.json({
      success: true,
      message: `Assigned volunteer to ${incident.reference_code}: ${incident.title}`,
      volunteer: updatedVolunteer,
    });
  } catch (err) {
    console.error('Assignment error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to execute assignment' },
      { status: 500 }
    );
  }
}
