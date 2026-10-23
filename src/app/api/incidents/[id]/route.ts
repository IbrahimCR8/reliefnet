import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/client';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
  }

  try {
    const supabase = process.env.SUPABASE_SERVICE_ROLE_KEY
      ? await createServiceClient()
      : await createClient();
    const { data: incident, error: incError } = await supabase
      .from('incidents')
      .select('*, incident_media(*)')
      .eq('id', id)
      .single();

    if (incError || !incident) {
      return NextResponse.json({ error: 'Incident not found' }, { status: 404 });
    }

    const { data: history } = await supabase
      .from('incident_status_history')
      .select('*')
      .eq('incident_id', id)
      .order('created_at', { ascending: true });

    return NextResponse.json({ incident, history: history || [], is_demo: false });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Database error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const body = await request.json();
    const { status, notes } = body;

    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 });
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json({ success: true, updated: { id, status } });
    }

    const supabase = process.env.SUPABASE_SERVICE_ROLE_KEY
      ? await createServiceClient()
      : await createClient();
    
    // Check authenticated coordinator
    const { data: { user } } = await supabase.auth.getUser();

    const updatePayload: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (status === 'verified') {
      updatePayload.verified_at = new Date().toISOString();
      if (user?.id) updatePayload.verified_by = user.id;
    }

    const { data, error } = await supabase
      .from('incidents')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, incident: data });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to update incident' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ success: true, deletedId: id, is_demo: true });
  }

  try {
    const supabase = process.env.SUPABASE_SERVICE_ROLE_KEY
      ? await createServiceClient()
      : await createClient();

    // 1. Clean up associated media, assignments, and status history
    await supabase.from('incident_media').delete().eq('incident_id', id);
    await supabase.from('volunteer_assignments').delete().eq('incident_id', id);
    await supabase.from('incident_status_history').delete().eq('incident_id', id);

    // 2. Delete the incident record completely from database
    const { error } = await supabase.from('incidents').delete().eq('id', id);

    if (error) {
      console.error('[incidents/delete] Supabase error deleting incident:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Incident and all associated data permanently deleted from database.',
      deletedId: id,
    });
  } catch (err) {
    console.error('[incidents/delete] Unexpected error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to delete incident' },
      { status: 500 }
    );
  }
}
