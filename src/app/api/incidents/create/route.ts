import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { reportIncidentSchema } from '@/lib/validations';
import { generateReferenceCode } from '@/lib/utils';
import { isSupabaseConfigured } from '@/lib/supabase/client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body with Zod
    const parseResult = reportIncidentSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: parseResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const data = parseResult.data;
    const reference_code = generateReferenceCode();

    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: 'Database is not configured. Add Supabase keys to .env.local.' },
        { status: 503 }
      );
    }

    const supabase = process.env.SUPABASE_SERVICE_ROLE_KEY
      ? await createServiceClient()
      : await createClient();

    // Get current user (anonymous reporting is allowed)
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data: incident, error: insertError } = await supabase
      .from('incidents')
      .insert({
        reference_code,
        title: data.title,
        category: data.category,
        description: data.description,
        severity: data.severity,
        location_name: data.location_name,
        latitude: data.latitude ?? null,
        longitude: data.longitude ?? null,
        people_affected: data.people_affected ?? null,
        assistance_requested: data.assistance_requested ?? null,
        status: 'unverified',
        reported_by: user?.id ?? null,
        is_demo: false,
      })
      .select()
      .single();

    if (insertError) {
      console.error('[incidents/create] Insert error:', insertError);
      return NextResponse.json(
        { error: 'Failed to save incident record.' },
        { status: 500 }
      );
    }

    // If Cloudinary media is attached, link to incident_media
    if (data.cloudinary_url && data.cloudinary_public_id && incident) {
      await supabase.from('incident_media').insert({
        incident_id: incident.id,
        cloudinary_public_id: data.cloudinary_public_id,
        cloudinary_url: data.cloudinary_url,
        resource_type: 'image',
        uploaded_by: user?.id ?? null,
      });
    }

    return NextResponse.json({ incident, success: true }, { status: 201 });
  } catch (err) {
    console.error('[incidents/create] Unexpected error:', err);
    return NextResponse.json(
      { error: 'Internal server error processing incident report.' },
      { status: 500 }
    );
  }
}
