import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/client';

export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    // Return empty list in production when database is not yet populated
    return NextResponse.json({ volunteers: [] });
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('volunteer_profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ volunteers: data || [] });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to query volunteers' },
      { status: 500 }
    );
  }
}
