import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/client';

export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ role: 'volunteer', isCoordinator: false }, { status: 503 });
  }

  try {
    const body = await request.json();
    const { email, userId } = body;

    if (!email && !userId) {
      return NextResponse.json({ error: 'Email or User ID is required' }, { status: 400 });
    }

    const supabase = await createServiceClient();

    let query = supabase.from('profiles').select('id, email, full_name, role');
    if (userId) {
      query = query.eq('id', userId);
    } else {
      query = query.ilike('email', email.trim());
    }

    const { data: profile, error } = await query.maybeSingle();

    if (error) {
      console.error('Error fetching role in verify-role:', error.message);
      return NextResponse.json({ role: 'volunteer', isCoordinator: false });
    }

    if (!profile) {
      return NextResponse.json({ role: 'volunteer', isCoordinator: false });
    }

    const role = profile.role;
    const isCoordinator = role === 'coordinator' || role === 'admin';

    return NextResponse.json({
      role,
      isCoordinator,
      full_name: profile.full_name,
      email: profile.email,
    });
  } catch (err) {
    console.error('verify-role exception:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
