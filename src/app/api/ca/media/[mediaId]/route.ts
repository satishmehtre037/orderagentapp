import { NextResponse } from 'next/server';
import { downloadWhatsAppMedia } from '@/services/whisperService';

export const dynamic = 'force-dynamic';

export async function GET(
  req: Request,
  { params }: { params: { mediaId: string } }
) {
  const { mediaId } = params;

  if (!mediaId) {
    return NextResponse.json({ error: 'Media ID required' }, { status: 400 });
  }

  try {
    const { buffer, mimeType } = await downloadWhatsAppMedia(mediaId);

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': mimeType || 'application/pdf',
        'Content-Disposition': 'inline',
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch (err: any) {
    console.error('[CA Media API Error]:', err);
    return NextResponse.json(
      { error: 'Failed to retrieve WhatsApp media', details: err.message },
      { status: 500 }
    );
  }
}
