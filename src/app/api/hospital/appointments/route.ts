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
    const doctorId = searchParams.get('doctor_id');
    const date = searchParams.get('date');

    let query = supabaseAdmin
      .from('hospital_appointments')
      .select('*')
      .eq('business_id', businessId)
      .order('slot_time', { ascending: true });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }
    if (doctorId) {
      query = query.eq('doctor_id', doctorId);
    }
    if (date) {
      query = query.gte('slot_time', `${date}T00:00:00`).lte('slot_time', `${date}T23:59:59`);
    }

    const { data: appointments, error } = await query;

    if (error) {
      console.error('Error fetching hospital appointments:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, appointments: appointments || [] });
  } catch (error: any) {
    console.error('Error in hospital appointments GET:', error);
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
      doctor_id,
      patient_name,
      patient_phone,
      doctor_name = 'Specialist Physician',
      department = 'General Medicine',
      slot_time,
      type = 'OPD',
      source = 'whatsapp',
      notes,
    } = body;

    if (!patient_name || !patient_phone || !slot_time) {
      return NextResponse.json(
        { success: false, error: 'Patient name, phone number, and appointment slot time are required.' },
        { status: 400 }
      );
    }

    // 1. Double-Booking Guard: Check if the doctor is already booked at this exact time
    const { data: conflictingAppt } = await supabaseAdmin
      .from('hospital_appointments')
      .select('id, patient_name')
      .eq('business_id', businessId)
      .eq('doctor_name', doctor_name)
      .eq('slot_time', slot_time)
      .neq('status', 'cancelled')
      .maybeSingle();

    if (conflictingAppt) {
      return NextResponse.json(
        {
          success: false,
          error: `Dr. ${doctor_name} is already booked for this exact slot (${new Date(slot_time).toLocaleTimeString('en-IN')}). Please select an alternate time.`,
        },
        { status: 409 }
      );
    }

    // 2. Sequential Token Calculation (Per-Doctor Per-Day Queue Order)
    const slotDateStr = slot_time.slice(0, 10);
    const dayStart = `${slotDateStr}T00:00:00`;
    const dayEnd = `${slotDateStr}T23:59:59`;

    const { data: highestTokenAppt } = await supabaseAdmin
      .from('hospital_appointments')
      .select('token_number')
      .eq('business_id', businessId)
      .eq('doctor_name', doctor_name)
      .gte('slot_time', dayStart)
      .lte('slot_time', dayEnd)
      .order('token_number', { ascending: false })
      .limit(1)
      .maybeSingle();

    const tokenNumber = (highestTokenAppt?.token_number || 0) + 1;

    // 3. Upsert Patient record scoped to this business
    let resolvedPatientId = patient_id;
    if (!resolvedPatientId) {
      const { data: existingPatient } = await supabaseAdmin
        .from('hospital_patients')
        .select('id')
        .eq('business_id', businessId)
        .eq('phone', patient_phone)
        .maybeSingle();

      if (existingPatient) {
        resolvedPatientId = existingPatient.id;
        await supabaseAdmin
          .from('hospital_patients')
          .update({
            name: patient_name,
            last_message_at: new Date().toISOString(),
            status: 'Active',
          })
          .eq('id', existingPatient.id);
      } else {
        const { data: newPatient } = await supabaseAdmin
          .from('hospital_patients')
          .insert([{
            business_id: businessId,
            name: patient_name,
            phone: patient_phone,
            last_message_at: new Date().toISOString(),
            status: 'Active',
          }])
          .select('id')
          .single();

        if (newPatient) {
          resolvedPatientId = newPatient.id;
        }
      }
    }

    // 4. Create appointment
    const { data: appt, error } = await supabaseAdmin
      .from('hospital_appointments')
      .insert([{
        business_id: businessId,
        patient_id: resolvedPatientId,
        doctor_id,
        patient_name,
        patient_phone,
        doctor_name,
        department,
        slot_time,
        token_number: tokenNumber,
        status: 'confirmed',
        type,
        source,
        notes,
      }])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    // 5. Auto-dispatch WhatsApp appointment confirmation with dynamic clinic name
    const hospitalName = business?.name || 'Hospital & Multi-Specialty Clinic';
    const formattedDate = new Date(slot_time).toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      dateStyle: 'medium',
      timeStyle: 'short',
    });

    const confirmationMsg = `✅ *Appointment Confirmed!* 🏥\n\nNamaste ${patient_name} ji,\n\nYour consultation has been scheduled at *${hospitalName}*:\n👨‍⚕️ *Doctor:* ${doctor_name}\n🏢 *Department:* ${department}\n⏰ *Time:* ${formattedDate}\n🎟️ *Token:* #${tokenNumber}\n\nPlease bring any previous prescriptions or lab reports with you. Reply *RESCHEDULE* if you need to modify your timing.`;

    if (patient_phone) {
      await sendWhatsAppTextMessage(patient_phone, confirmationMsg);
    }

    return NextResponse.json({ success: true, appointment: appt });
  } catch (error: any) {
    console.error('Error creating hospital appointment:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const auth = await requireBusiness(req);
    if (auth.errorResponse) {
      return auth.errorResponse;
    }
    const { business, businessId } = auth;

    const body = await req.json();
    const { id, status, slot_time, doctor_name, department, notes } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Appointment ID is required.' }, { status: 400 });
    }

    // Verify appointment belongs to this business
    const { data: currentAppt, error: lookupErr } = await supabaseAdmin
      .from('hospital_appointments')
      .select('*')
      .eq('id', id)
      .eq('business_id', businessId)
      .maybeSingle();

    if (lookupErr || !currentAppt) {
      return NextResponse.json({ success: false, error: 'Appointment not found or unauthorized.' }, { status: 404 });
    }

    const updatePayload: Record<string, any> = { updated_at: new Date().toISOString() };
    if (status) updatePayload.status = status;
    if (slot_time) {
      updatePayload.slot_time = slot_time;
      updatePayload.rescheduled = true;
    }
    if (doctor_name) updatePayload.doctor_name = doctor_name;
    if (department) updatePayload.department = department;
    if (notes !== undefined) updatePayload.notes = notes;

    const { data: updatedAppt, error } = await supabaseAdmin
      .from('hospital_appointments')
      .update(updatePayload)
      .eq('id', id)
      .eq('business_id', businessId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const hospitalName = business?.name || 'Hospital & Multi-Specialty Clinic';

    // Send WhatsApp update if status changed or rescheduled
    if (updatedAppt?.patient_phone) {
      if (status === 'rescheduled' || slot_time) {
        const formattedDate = new Date(updatedAppt.slot_time).toLocaleString('en-IN', {
          timeZone: 'Asia/Kolkata',
          dateStyle: 'medium',
          timeStyle: 'short',
        });
        const msg = `🔄 *Appointment Rescheduled*\n\nNamaste ${updatedAppt.patient_name} ji,\n\nYour appointment with *${updatedAppt.doctor_name}* has been updated to:\n⏰ *New Slot:* ${formattedDate}\n🎟️ *Token:* #${updatedAppt.token_number || 1}\n\nSee you soon at ${hospitalName}.`;
        await sendWhatsAppTextMessage(updatedAppt.patient_phone, msg);
      } else if (status === 'cancelled') {
        const msg = `❌ *Appointment Cancelled*\n\nNamaste ${updatedAppt.patient_name} ji,\n\nYour appointment with *${updatedAppt.doctor_name}* at *${hospitalName}* has been cancelled as requested.\n\nReply *BOOK* anytime to schedule a new consultation.`;
        await sendWhatsAppTextMessage(updatedAppt.patient_phone, msg);
      } else if (status === 'completed') {
        const msg = `✅ *Consultation Complete*\n\nNamaste ${updatedAppt.patient_name} ji,\n\nWe hope your consultation with *${updatedAppt.doctor_name}* at *${hospitalName}* was helpful.\n\nPlease rate your experience (1 to 5 stars) by replying with a number!`;
        await sendWhatsAppTextMessage(updatedAppt.patient_phone, msg);
      }
    }

    return NextResponse.json({ success: true, appointment: updatedAppt });
  } catch (error: any) {
    console.error('Error updating hospital appointment:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
