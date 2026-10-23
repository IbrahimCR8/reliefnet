import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/client';

export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      role: 'volunteer',
      isCoordinator: false,
      isAdmin: false,
      isVolunteer: true,
    }, { status: 503 });
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

    if (error || !profile) {
      // Check if they exist in volunteer_profiles
      const volQuery = userId 
        ? supabase.from('volunteer_profiles').select('id, email, name').eq('user_id', userId)
        : supabase.from('volunteer_profiles').select('id, email, name').ilike('email', email.trim());
      const { data: vol } = await volQuery.maybeSingle();

      if (vol) {
        return NextResponse.json({
          role: 'volunteer',
          isCoordinator: false,
          isAdmin: false,
          isVolunteer: true,
          email: vol.email,
        });
      }

      return NextResponse.json({
        role: 'volunteer',
        isCoordinator: false,
        isAdmin: false,
        isVolunteer: true,
      });
    }

    const role = profile.role;
    const isAdmin = role === 'admin';
    const isCoordinator = role === 'coordinator' || role === 'admin';
    const isVolunteer = role === 'volunteer';

    return NextResponse.json({
      role,
      isAdmin,
      isCoordinator,
      isVolunteer,
      full_name: profile.full_name,
      email: profile.email,
    });
  } catch (err) {
    console.error('verify-role exception:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
