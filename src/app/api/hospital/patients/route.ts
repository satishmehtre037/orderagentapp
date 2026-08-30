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
    const search = searchParams.get('search');

    let query = supabaseAdmin
      .from('hospital_patients')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false });

    if (search) {
      // Sanitize search term to prevent PostgREST filter injection
      const sanitized = search.replace(/[^a-zA-Z0-9\s+\-_]/g, '').trim();
      if (sanitized) {
        query = query.or(`name.ilike.%${sanitized}%,phone.ilike.%${sanitized}%,blood_group.ilike.%${sanitized}%`);
      }
    }

    const { data: patients, error } = await query;

    if (error) {
      console.error('Error fetching hospital patients:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, patients: patients || [] });
  } catch (error: any) {
    console.error('Error in hospital patients GET:', error);
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
      name,
      phone,
      email,
      gender = 'Other',
      age,
      blood_group,
      emergency_contact,
      address,
      medical_history,
    } = body;

    if (!name || !phone) {
      return NextResponse.json(
        { success: false, error: 'Patient name and phone number are required.' },
        { status: 400 }
      );
    }

    // Scoped tenant upsert: Check if patient already exists for this business
    const { data: existingPatient } = await supabaseAdmin
      .from('hospital_patients')
      .select('id')
      .eq('business_id', businessId)
      .eq('phone', phone)
      .maybeSingle();

    let patient: any = null;

    if (existingPatient) {
      const { data: updatedPatient, error: updateErr } = await supabaseAdmin
        .from('hospital_patients')
        .update({
          name,
          email,
          gender,
          age: age ? parseInt(age, 10) : undefined,
          blood_group,
          emergency_contact,
          address,
          medical_history,
          status: 'Active',
          last_visit: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingPatient.id)
        .select()
        .single();

      if (updateErr) {
        return NextResponse.json({ success: false, error: updateErr.message }, { status: 500 });
      }
      patient = updatedPatient;
    } else {
      const { data: newPatient, error: insertErr } = await supabaseAdmin
        .from('hospital_patients')
        .insert([{
          business_id: businessId,
          name,
          phone,
          email,
          gender,
          age: age ? parseInt(age, 10) : undefined,
          blood_group,
          emergency_contact,
          address,
          medical_history,
          status: 'Active',
          last_visit: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }])
        .select()
        .single();

      if (insertErr) {
        return NextResponse.json({ success: false, error: insertErr.message }, { status: 500 });
      }
      patient = newPatient;
    }

    // Send WhatsApp Welcome Kit with dynamic business name
    const hospitalName = business?.name || 'Hospital & Multi-Specialty Clinic';
    const welcomeMsg = `🏥 *Welcome to ${hospitalName}!*\\n\\nNamaste ${name} ji,\\n\\nYour Patient Registration Record has been created successfully.\\n\\n👤 *Patient ID:* #${patient.id.slice(0, 8).toUpperCase()}\\n🩸 *Blood Group:* ${blood_group || 'Not recorded'}\\n📞 *Emergency Contact:* ${emergency_contact || 'None'}\\n\\nYou can book appointments, check lab report status, or speak with our AI Health Assistant 24/7 directly on this WhatsApp number!`;

    if (phone) {
      await sendWhatsAppTextMessage(phone, welcomeMsg);
    }

    return NextResponse.json({ success: true, patient });
  } catch (error: any) {
    console.error('Error creating hospital patient:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
