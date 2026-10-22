import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/client';

export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ success: true, is_online: false });
  }

  try {
    const body = await request.json();
    const { email, is_online } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const supabase = process.env.SUPABASE_SERVICE_ROLE_KEY
      ? await createServiceClient()
      : await createClient();

    const { error } = await supabase
      .from('volunteer_profiles')
      .update({
        is_online: Boolean(is_online),
        last_active_at: new Date().toISOString(),
      })
      .eq('email', email);

    if (error) {
      console.warn('Presence update warning:', error.message);
    }

    return NextResponse.json({ success: true, is_online: Boolean(is_online) });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
