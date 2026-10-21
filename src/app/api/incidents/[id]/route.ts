import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { DEMO_INCIDENTS, DEMO_STATUS_HISTORY } from '@/lib/demo-data';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!isSupabaseConfigured()) {
    const demo = DEMO_INCIDENTS.find(i => i.id === id);
    if (!demo) {
      return NextResponse.json({ error: 'Incident not found' }, { status: 404 });
    }
    const history = DEMO_STATUS_HISTORY.filter(h => h.incident_id === id);
    return NextResponse.json({ incident: demo, media: [], history, is_demo: true });
  }

  try {
    const supabase = await createClient();
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
