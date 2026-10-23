import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { reportIncidentSchema } from '@/lib/validations';
import { generateReferenceCode } from '@/lib/utils';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { forwardGeocode } from '@/lib/geocoding';

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

    let resolvedLat = data.latitude ?? null;
    let resolvedLon = data.longitude ?? null;

    // Background Geocoding: If coordinates are missing or not provided by client,
    // automatically find coordinates in background from the location_name
    if (resolvedLat === null || resolvedLon === null) {
      try {
        const geoResults = await forwardGeocode(data.location_name, 1);
        if (geoResults && geoResults.length > 0) {
          resolvedLat = geoResults[0].latitude;
          resolvedLon = geoResults[0].longitude;
        }
      } catch (geoErr) {
        console.warn('[incidents/create] Automatic background geocoding failed:', geoErr);
      }
    }

    const insertPayload: Record<string, unknown> = {
      reference_code,
      title: data.title,
      category: data.category,
      description: data.description,
      severity: data.severity,
      location_name: data.location_name,
      latitude: resolvedLat,
      longitude: resolvedLon,
      people_affected: data.people_affected ?? null,
      assistance_requested: data.assistance_requested ?? null,
      reporter_name: data.reporter_name,
      reporter_phone: data.reporter_phone,
      status: 'unverified',
      reported_by: user?.id ?? null,
      is_demo: false,
    };

    let { data: incident, error: insertError } = await supabase
      .from('incidents')
      .insert(insertPayload)
      .select()
      .single();

    // If database table does not yet have reporter_name/reporter_phone columns,
    // fallback gracefully by preserving the contact info inside assistance_requested
    if (insertError && (insertError.message?.includes('reporter_name') || insertError.message?.includes('reporter_phone'))) {
      console.warn('[incidents/create] reporter columns not in schema yet, falling back to assistance_requested preservation');
      const contactHeader = `[Reporter: ${data.reporter_name} | Phone: ${data.reporter_phone}]`;
      const fallbackAssistance = data.assistance_requested
        ? `${contactHeader}\n${data.assistance_requested}`
        : contactHeader;

      const fallbackPayload: Record<string, unknown> = {
        ...insertPayload,
        assistance_requested: fallbackAssistance,
      };
      delete fallbackPayload.reporter_name;
      delete fallbackPayload.reporter_phone;

      const fallbackResult = await supabase
        .from('incidents')
        .insert(fallbackPayload)
        .select()
        .single();

      incident = fallbackResult.data;
      insertError = fallbackResult.error;

      if (incident) {
        (incident as Record<string, unknown>).reporter_name = data.reporter_name;
        (incident as Record<string, unknown>).reporter_phone = data.reporter_phone;
      }
    }

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
