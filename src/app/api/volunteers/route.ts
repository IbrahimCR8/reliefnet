import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/client';

export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      volunteers: [],
      total: 0,
      online_count: 0,
      available_count: 0,
      assigned_count: 0,
      pending_verification_count: 0,
      verified_count: 0,
    });
  }

  try {
    const supabase = process.env.SUPABASE_SERVICE_ROLE_KEY
      ? await createServiceClient()
      : await createClient();

    // Query all volunteer profiles
    const { data: volunteers, error } = await supabase
      .from('volunteer_profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('volunteer_profiles query notice:', error.message);
      return NextResponse.json({
        volunteers: [],
        total: 0,
        online_count: 0,
        available_count: 0,
        assigned_count: 0,
        pending_verification_count: 0,
        verified_count: 0,
      });
    }

    const rawList = volunteers || [];

    // Fetch assigned incident details if any are assigned
    const assignedIncidentIds = rawList
      .map((v) => v.assigned_incident_id)
      .filter(Boolean) as string[];

    let incidentMap: Record<string, { id: string; reference_code: string; title: string; location_name: string; severity: string; category: string }> = {};

    if (assignedIncidentIds.length > 0) {
      const { data: incData } = await supabase
        .from('incidents')
        .select('id, reference_code, title, location_name, severity, category')
        .in('id', assignedIncidentIds);

      if (incData) {
        incData.forEach((inc) => {
          incidentMap[inc.id] = inc;
        });
      }
    }

    // Now format volunteers with live online status and real assignment info
    const now = new Date().getTime();
    const FIFTEEN_MINUTES_MS = 15 * 60 * 1000;

    const enriched = rawList.map((vol) => {
      // Calculate real online presence: either explicitly marked online or active within last 15 mins
      const lastActive = vol.last_active_at ? new Date(vol.last_active_at).getTime() : 0;
      const isOnline = Boolean(vol.is_online || (lastActive > 0 && now - lastActive < FIFTEEN_MINUTES_MS));

      const assignedIncident = vol.assigned_incident_id ? incidentMap[vol.assigned_incident_id] || null : null;

      return {
        ...vol,
        is_online: isOnline,
        assigned_incident: assignedIncident,
      };
    });

    const onlineCount = enriched.filter((v) => v.is_online).length;
    const assignedCount = enriched.filter((v) => Boolean(v.assigned_incident_id)).length;
    const availableCount = enriched.length - assignedCount;
    const pendingVerificationCount = enriched.filter((v) => v.verification_status !== 'verified').length;
    const verifiedCount = enriched.filter((v) => v.verification_status === 'verified').length;

    return NextResponse.json({
      volunteers: enriched,
      total: enriched.length,
      online_count: onlineCount,
      available_count: availableCount,
      assigned_count: assignedCount,
      pending_verification_count: pendingVerificationCount,
      verified_count: verifiedCount,
    });
  } catch (err) {
    console.error('Failed to query volunteers:', err);
    return NextResponse.json({
      volunteers: [],
      total: 0,
      online_count: 0,
      available_count: 0,
      assigned_count: 0,
      pending_verification_count: 0,
      verified_count: 0,
    });
  }
}
