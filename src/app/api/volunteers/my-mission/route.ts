import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/client';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');

  if (!email) {
    return NextResponse.json({ error: 'Email parameter is required' }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      has_mission: false,
      volunteer: null,
      mission: null,
    });
  }

  try {
    const supabase = process.env.SUPABASE_SERVICE_ROLE_KEY
      ? await createServiceClient()
      : await createClient();

    // 1. Get volunteer profile
    const { data: volunteer, error: volError } = await supabase
      .from('volunteer_profiles')
      .select('*')
      .eq('email', email)
      .single();

    if (volError || !volunteer) {
      return NextResponse.json({
        has_mission: false,
        volunteer: null,
        mission: null,
      });
    }

    // 2. Check if an incident is assigned by coordinator
    if (!volunteer.assigned_incident_id) {
      return NextResponse.json({
        has_mission: false,
        volunteer: {
          id: volunteer.id,
          name: volunteer.name,
          email: volunteer.email,
          phone: volunteer.phone,
          status: 'available',
        },
        mission: null,
      });
    }

    // 3. Fetch the real incident details
    const { data: incident, error: incError } = await supabase
      .from('incidents')
      .select('id, reference_code, title, category, severity, status, location_name, description, assistance_requested')
      .eq('id', volunteer.assigned_incident_id)
      .single();

    if (incError || !incident) {
      return NextResponse.json({
        has_mission: false,
        volunteer: {
          id: volunteer.id,
          name: volunteer.name,
          email: volunteer.email,
          phone: volunteer.phone,
          status: 'available',
        },
        mission: null,
      });
    }

    return NextResponse.json({
      has_mission: true,
      volunteer: {
        id: volunteer.id,
        name: volunteer.name,
        email: volunteer.email,
        phone: volunteer.phone,
        status: 'deployed',
      },
      mission: {
        incident_id: incident.id,
        reference_code: incident.reference_code,
        title: incident.title,
        category: incident.category,
        severity: incident.severity,
        location_name: incident.location_name,
        description: incident.description,
        assistance_requested: incident.assistance_requested,
        assigned_role_task: volunteer.assigned_role_task || 'Disaster Relief Ground Operations',
        assigned_at: volunteer.assigned_at,
        assigned_by_email: volunteer.assigned_by_email || 'Zonal Coordinator',
      },
    });
  } catch (err) {
    console.error('my-mission error:', err);
    return NextResponse.json({
      has_mission: false,
      volunteer: null,
      mission: null,
    });
  }
}
