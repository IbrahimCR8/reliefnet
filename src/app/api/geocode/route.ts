import { NextRequest, NextResponse } from 'next/server';
import { forwardGeocode } from '@/lib/geocoding';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q');
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? Math.min(Math.max(parseInt(limitParam, 10) || 5, 1), 10) : 5;

    if (!q || q.trim().length < 2) {
      return NextResponse.json({
        results: [],
        message: 'Query parameter "q" must be at least 2 characters.',
      });
    }

    const results = await forwardGeocode(q, limit);

    return NextResponse.json({
      query: q,
      count: results.length,
      results,
    });
  } catch (err) {
    console.error('[api/geocode] Error handling forward geocode:', err);
    return NextResponse.json(
      { error: 'Failed to process geocoding request.', results: [] },
      { status: 500 }
    );
  }
}
