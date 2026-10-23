import { NextRequest, NextResponse } from 'next/server';
import { reverseGeocode } from '@/lib/geocoding';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const latParam = searchParams.get('lat');
    const lonParam = searchParams.get('lon');

    if (!latParam || !lonParam) {
      return NextResponse.json(
        { error: 'Both "lat" and "lon" parameters are required.' },
        { status: 400 }
      );
    }

    const lat = parseFloat(latParam);
    const lon = parseFloat(lonParam);

    if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      return NextResponse.json(
        { error: 'Invalid coordinate bounds. Latitude must be -90..90 and Longitude -180..180.' },
        { status: 400 }
      );
    }

    const location = await reverseGeocode(lat, lon);

    if (!location) {
      return NextResponse.json(
        { error: 'Could not resolve location for the specified coordinates.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      location,
      success: true,
    });
  } catch (err) {
    console.error('[api/geocode/reverse] Error handling reverse geocode:', err);
    return NextResponse.json(
      { error: 'Internal server error processing reverse geocode.' },
      { status: 500 }
    );
  }
}
