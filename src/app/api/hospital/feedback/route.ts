import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { sendWhatsAppTextMessage } from '@/lib/whatsapp';
import { requireBusiness } from '@/lib/auth/requireBusiness';

export async function GET(req: Request) {
  try {
    const auth = await requireBusiness(req);
    if (auth.errorResponse) {
      return auth.errorResponse;
    }
    const { businessId } = auth;

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    let query = supabaseAdmin
      .from('hospital_feedback')
      .select('*')
      .eq('business_id', businessId)
      .order('requested_at', { ascending: false });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data: feedback, error } = await query;

    if (error) {
      console.error('Error fetching hospital feedback:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, feedback: feedback || [] });
  } catch (error: any) {
    console.error('Error in hospital feedback GET:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireBusiness(req);
    if (auth.errorResponse) {
      return auth.errorResponse;
    }
    const { business, businessId } = auth;

    const body = await req.json();
    const {
      patient_id,
      appointment_id,
      patient_name,
      patient_phone,
      doctor_name,
      rating,
      comment,
    } = body;

    if (!patient_phone || !rating) {
      return NextResponse.json({ success: false, error: 'Patient phone and rating (1-5) are required.' }, { status: 400 });
    }

    const numericRating = parseInt(rating, 10);
    const isUnhappy = numericRating <= 3;

    const { data: feedbackRecord, error } = await supabaseAdmin
      .from('hospital_feedback')
      .insert([{
        business_id: businessId,
        patient_id,
        appointment_id,
        patient_name: patient_name || 'Patient',
        patient_phone,
        doctor_name: doctor_name || 'Attending Doctor',
        rating: numericRating,
        comment,
        status: isUnhappy ? 'escalated' : 'responded',
        google_review_requested: !isUnhappy,
        apology_sent: isUnhappy,
        responded_at: new Date().toISOString(),
      }])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const hospitalName = business?.name || 'Hospital & Multi-Specialty Clinic';

    // Auto-respond via WhatsApp based on rating
    if (isUnhappy) {
      const apologyMsg = `🙏 *We Sincerely Apologize*\n\nNamaste ${patient_name || 'Patient'} ji,\n\nWe are sorry to hear that your experience at ${hospitalName} did not meet expectations (${numericRating}/5 ⭐).\n\nOur patient care supervisor has been notified and will reach out to resolve your concern. You may also reply directly with any details.`;
      await sendWhatsAppTextMessage(patient_phone, apologyMsg);

      // Log escalation
      await supabaseAdmin.from('hospital_escalations').insert([{
        business_id: businessId,
        patient_phone,
        reason: `Patient rated visit ${numericRating}/5: ${comment || 'No specific comment provided.'}`,
        urgency: numericRating === 1 ? 'urgent' : 'normal',
      }]);
    } else {
      const reviewMsg = `⭐ *Thank You For Your High Rating!*\n\nNamaste ${patient_name || 'Patient'} ji,\n\nWe are delighted to know you had a positive experience at ${hospitalName} (${numericRating}/5 ⭐)!\n\nYour review helps other patients find quality healthcare!`;
      await sendWhatsAppTextMessage(patient_phone, reviewMsg);
    }

    return NextResponse.json({ success: true, feedback: feedbackRecord });
  } catch (error: any) {
    console.error('Error submitting hospital feedback:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
