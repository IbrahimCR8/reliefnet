import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { volunteerProfileSchema } from '@/lib/validations';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = volunteerProfileSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid volunteer registration data', details: parsed.error.issues },
        { status: 400 }
      );
    }

    if (!isSupabaseConfigured()) {
      // In demo mode, acknowledge submission without crashing
      return NextResponse.json({
        success: true,
        message: 'Volunteer profile registered in local demo mode (not persisted to live DB).',
        is_demo: true,
      });
    }

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required to save volunteer profile' },
        { status: 401 }
      );
    }

    const { data, error } = await supabase
      .from('volunteer_profiles')
      .upsert({
        user_id: user.id,
        skills: parsed.data.skills,
        availability: parsed.data.availability,
        organization: parsed.data.organization || null,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, profile: data });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to register volunteer' },
      { status: 500 }
    );
  }
}
