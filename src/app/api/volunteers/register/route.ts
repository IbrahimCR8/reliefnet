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

    const aadharLast4 = parsed.data.aadhar.slice(-4);

    if (!isSupabaseConfigured()) {
      // In demo mode, acknowledge submission without crashing
      return NextResponse.json({
        success: true,
        message: 'register successful will reach you soon',
        volunteer: {
          id: `vol-${Date.now()}`,
          name: parsed.data.name,
          email: parsed.data.email,
          phone: parsed.data.phone,
          aadhar_last4: aadharLast4,
          address: parsed.data.address,
          skills: parsed.data.skills,
          availability: parsed.data.availability,
          organization: parsed.data.organization || 'Independent Responder',
          verification_status: 'pending_review',
        },
        is_demo: true,
      });
    }

    const supabase = await createClient();

    // If password provided, register Supabase auth user so they can login with email & password
    let userId: string | null = null;
    if (parsed.data.password) {
      const { data: authData } = await supabase.auth.signUp({
        email: parsed.data.email,
        password: parsed.data.password,
        options: {
          data: {
            full_name: parsed.data.name,
            role: 'volunteer',
          },
        },
      });
      userId = authData.user?.id || null;
    }

    // Persist full details to volunteer_profiles table in Supabase
    const { data, error } = await supabase
      .from('volunteer_profiles')
      .insert({
        user_id: userId,
        name: parsed.data.name,
        email: parsed.data.email,
        phone: parsed.data.phone,
        aadhar_number: parsed.data.aadhar,
        address: parsed.data.address,
        skills: parsed.data.skills,
        availability: parsed.data.availability,
        organization: parsed.data.organization || null,
        verification_status: 'pending_review',
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'register successful will reach you soon',
      profile: data,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to register volunteer' },
      { status: 500 }
    );
  }
}
