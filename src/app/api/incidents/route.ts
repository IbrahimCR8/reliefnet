import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/client';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const category = searchParams.get('category');
  const severity = searchParams.get('severity');

  // If Supabase is not configured, return empty incidents list
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ incidents: [], is_demo: false });
  }

  try {
    const supabase = process.env.SUPABASE_SERVICE_ROLE_KEY
      ? await createServiceClient()
      : await createClient();

    let query = supabase
      .from('incidents')
      .select('*, incident_media(*)')
      .eq('is_demo', false)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    } else {
      query = query.neq('status', 'rejected');
    }
    if (category) query = query.eq('category', category);
    if (severity) query = query.eq('severity', severity);

    const { data, error } = await query;

    if (error) {
      console.warn('incidents query notice:', error.message);
      return NextResponse.json({ incidents: [], is_demo: false });
    }

    return NextResponse.json({ incidents: data || [], is_demo: false });
  } catch (err) {
    console.error('Failed to query incidents:', err);
    return NextResponse.json({ incidents: [], is_demo: false });
  }
}
