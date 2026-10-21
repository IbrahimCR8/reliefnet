import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/client';

export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    // Return empty list in production when database is not yet populated
    return NextResponse.json({ volunteers: [] });
  }

  try {
    const supabase = process.env.SUPABASE_SERVICE_ROLE_KEY
      ? await createServiceClient()
      : await createClient();

    const { data, error } = await supabase
      .from('volunteer_profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('volunteer_profiles query notice:', error.message);
      return NextResponse.json({ volunteers: [] });
    }

    return NextResponse.json({ volunteers: data || [] });
  } catch (err) {
    console.error('Failed to query volunteers:', err);
    return NextResponse.json({ volunteers: [] });
  }
}
