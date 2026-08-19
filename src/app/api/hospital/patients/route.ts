import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { sendWhatsAppTextMessage } from '@/lib/whatsapp';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get('business_id');
    const search = searchParams.get('search');

    let query = supabaseAdmin
      .from('hospital_patients')
      .select('*')
      .order('created_at', { ascending: false });

    if (businessId) {
      query = query.eq('business_id', businessId);
    }
    if (search) {
      query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%,blood_group.ilike.%${search}%`);
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
    const body = await req.json();
    const {
      business_id,
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

    const { data: patient, error } = await supabaseAdmin
      .from('hospital_patients')
      .upsert(
        [{
          business_id,
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
        }],
        { onConflict: 'phone' }
      )
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    // Send WhatsApp Welcome Kit
    const welcomeMsg = `🏥 *Welcome to MediCare Hospital!*\n\nNamaste ${name} ji,\n\nYour Patient Registration Record has been created successfully.\n\n👤 *Patient ID:* #${patient.id.slice(0, 8).toUpperCase()}\n🩸 *Blood Group:* ${blood_group || 'Not recorded'}\n📞 *Emergency Contact:* ${emergency_contact || 'None'}\n\nYou can book appointments, check lab report status, or speak with our AI Health Assistant 24/7 directly on this WhatsApp number!`;

    if (phone) {
      await sendWhatsAppTextMessage(phone, welcomeMsg);
    }

    return NextResponse.json({ success: true, patient });
  } catch (error: any) {
    console.error('Error creating hospital patient:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
