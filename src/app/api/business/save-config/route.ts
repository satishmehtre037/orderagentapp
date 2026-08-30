import { NextResponse } from 'next/server';
import { POST as onboardingPost } from '../../onboarding/route';
import { PUT as businessPut } from '../route';

export async function POST(req: Request) {
  try {
    const clone = req.clone();
    const body = await clone.json();

    // If businessId is provided, route to business updater
    if (body.businessId || body.business_id) {
      // Construct PUT-compatible request
      const formattedBody = {
        businessId: body.businessId || body.business_id,
        name: body.formData?.business_name,
        whatsapp_number: body.formData?.whatsapp_number,
        category: body.formData?.category,
        configs: body.formData,
      };

      const putReq = new Request(req.url, {
        method: 'PUT',
        headers: req.headers,
        body: JSON.stringify(formattedBody),
      });

      return businessPut(putReq);
    }

    // Otherwise route to onboarding creator
    return onboardingPost(req);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to process request' }, { status: 500 });
  }
}
