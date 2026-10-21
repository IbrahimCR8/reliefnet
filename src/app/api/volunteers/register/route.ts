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
        message: 'Volunteer registration submitted successfully. We will verify your government ID and contact you soon.',
        volunteer: {
          id: `vol-${Date.now()}`,
          name: parsed.data.name,
          email: parsed.data.email,
          phone: parsed.data.phone,
          aadhar_last4: aadharLast4,
          skills: parsed.data.skills,
          availability: parsed.data.availability,
          organization: parsed.data.organization || 'Independent Responder',
          status: 'pending_verification',
        },
        is_demo: true,
      });
    }

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    // In production, allow unauthenticated volunteer intake or authenticated upsert
    const { data, error } = await supabase
      .from('volunteer_profiles')
      .upsert({
        user_id: user?.id || null,
        name: parsed.data.name,
        email: parsed.data.email,
        phone: parsed.data.phone,
        aadhar_last4: aadharLast4,
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
