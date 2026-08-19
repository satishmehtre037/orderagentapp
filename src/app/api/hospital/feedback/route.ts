import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { sendWhatsAppTextMessage } from '@/lib/whatsapp';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get('business_id');
    const status = searchParams.get('status');

    let query = supabaseAdmin
      .from('hospital_feedback')
      .select('*')
      .order('requested_at', { ascending: false });

    if (businessId) {
      query = query.eq('business_id', businessId);
    }
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
    const body = await req.json();
    const {
      business_id,
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
        business_id,
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

    // Auto-respond via WhatsApp based on rating
    if (isUnhappy) {
      const apologyMsg = `🙏 *We Sincerely Apologize*\n\nNamaste ${patient_name || 'Patient'} ji,\n\nWe are sorry to hear that your experience did not meet expectations (${numericRating}/5 ⭐).\n\nOur patient care supervisor has been notified and will reach out to resolve your concern. You may also reply directly with any details.`;
      await sendWhatsAppTextMessage(patient_phone, apologyMsg);

      // Log escalation
      await supabaseAdmin.from('hospital_escalations').insert([{
        business_id,
        patient_phone,
        reason: `Patient rated visit ${numericRating}/5: ${comment || 'No specific comment provided.'}`,
        urgency: numericRating === 1 ? 'urgent' : 'normal',
      }]);
    } else {
      const reviewMsg = `⭐ *Thank You For Your High Rating!*\n\nNamaste ${patient_name || 'Patient'} ji,\n\nWe are delighted to know you had a positive experience (${numericRating}/5 ⭐)!\n\nWould you take 30 seconds to leave us a brief review on Google?\n👉 https://g.page/r/medicare-hospital-review\n\nYour review helps other patients find quality healthcare!`;
      await sendWhatsAppTextMessage(patient_phone, reviewMsg);
    }

    return NextResponse.json({ success: true, feedback: feedbackRecord });
  } catch (error: any) {
    console.error('Error submitting hospital feedback:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
