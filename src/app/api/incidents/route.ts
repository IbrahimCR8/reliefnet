import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { DEMO_INCIDENTS } from '@/lib/demo-data';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const category = searchParams.get('category');
  const severity = searchParams.get('severity');

  // If Supabase is not configured, gracefully return filtered demo data
  if (!isSupabaseConfigured()) {
    let filtered = [...DEMO_INCIDENTS];
    if (status) filtered = filtered.filter(i => i.status === status);
    if (category) filtered = filtered.filter(i => i.category === category);
    if (severity) filtered = filtered.filter(i => i.severity === severity);
    return NextResponse.json({ incidents: filtered, is_demo: true });
  }

  try {
    const supabase = await createClient();
    let query = supabase
      .from('incidents')
      .select('*, incident_media(*)')
      .eq('is_demo', false)
      .order('created_at', { ascending: false });

    if (status) query = query.eq('status', status);
    if (category) query = query.eq('category', category);
    if (severity) query = query.eq('severity', severity);

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ incidents: data || [], is_demo: false });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to query incidents' },
      { status: 500 }
    );
  }
}
