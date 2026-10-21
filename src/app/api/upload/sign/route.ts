import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary server-side using secure environment variables
const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

if (cloudName && apiKey && apiSecret) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });
}

export async function POST(request: NextRequest) {
  try {
    if (!cloudName || !apiKey || !apiSecret) {
      return NextResponse.json(
        {
          error: 'Cloudinary credentials are not configured on the server.',
          configured: false,
        },
        { status: 503 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const timestamp = Math.round(new Date().getTime() / 1000);
    const folder = body.folder || 'reliefnet/incidents';

    // Parameters to sign for authenticated signed upload
    const paramsToSign: Record<string, string | number> = {
      folder,
      timestamp,
    };

    const signature = cloudinary.utils.api_sign_request(paramsToSign, apiSecret);

    return NextResponse.json({
      signature,
      timestamp,
      apiKey,
      cloudName,
      folder,
      configured: true,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate upload signature' },
      { status: 500 }
    );
  }
}
