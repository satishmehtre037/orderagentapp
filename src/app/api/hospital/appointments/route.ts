import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { sendWhatsAppTextMessage } from '@/lib/whatsapp';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get('business_id');
    const status = searchParams.get('status');
    const doctorId = searchParams.get('doctor_id');
    const date = searchParams.get('date');

    let query = supabaseAdmin
      .from('hospital_appointments')
      .select('*')
      .order('slot_time', { ascending: true });

    if (businessId) {
      query = query.eq('business_id', businessId);
    }
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
    const body = await req.json();
    const {
      business_id,
      patient_id,
      doctor_id,
      patient_name,
      patient_phone,
      doctor_name,
      department,
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

    // Determine random token number
    const tokenNumber = Math.floor(Math.random() * 40) + 1;

    // Upsert Patient record if not exists
    let resolvedPatientId = patient_id;
    if (!resolvedPatientId) {
      const { data: existingPatient } = await supabaseAdmin
        .from('hospital_patients')
        .select('id')
        .eq('business_id', business_id)
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
            business_id,
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

    const { data: appt, error } = await supabaseAdmin
      .from('hospital_appointments')
      .insert([{
        business_id,
        patient_id: resolvedPatientId,
        doctor_id,
        patient_name,
        patient_phone,
        doctor_name: doctor_name || 'Specialist Physician',
        department: department || 'General Medicine',
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

    // Auto-dispatch WhatsApp appointment confirmation
    const formattedDate = new Date(slot_time).toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      dateStyle: 'medium',
      timeStyle: 'short',
    });

    const confirmationMsg = `✅ *Appointment Confirmed!* 🏥\n\nNamaste ${patient_name} ji,\n\nYour consultation has been successfully scheduled:\n👨‍⚕️ *Doctor:* ${doctor_name || 'Specialist'}\n🏢 *Department:* ${department || 'General OPD'}\n⏰ *Time:* ${formattedDate}\n🎟️ *Token:* #${tokenNumber}\n\nPlease bring any previous prescriptions or lab reports with you. Reply *RESCHEDULE* if you need to modify your timing.`;

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
    const body = await req.json();
    const { id, status, slot_time, doctor_name, department, notes } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Appointment ID is required.' }, { status: 400 });
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
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    // Send WhatsApp update if status changed or rescheduled
    if (updatedAppt?.patient_phone) {
      if (status === 'rescheduled' || slot_time) {
        const formattedDate = new Date(updatedAppt.slot_time).toLocaleString('en-IN', {
          timeZone: 'Asia/Kolkata',
          dateStyle: 'medium',
          timeStyle: 'short',
        });
        const msg = `🔄 *Appointment Rescheduled*\n\nNamaste ${updatedAppt.patient_name} ji,\n\nYour appointment with *${updatedAppt.doctor_name}* has been updated to:\n⏰ *New Slot:* ${formattedDate}\n🎟️ *Token:* #${updatedAppt.token_number || 1}\n\nSee you soon at MediCare Hospital.`;
        await sendWhatsAppTextMessage(updatedAppt.patient_phone, msg);
      } else if (status === 'cancelled') {
        const msg = `❌ *Appointment Cancelled*\n\nNamaste ${updatedAppt.patient_name} ji,\n\nYour appointment with *${updatedAppt.doctor_name}* has been cancelled as requested.\n\nReply *BOOK* anytime to schedule a new consultation.`;
        await sendWhatsAppTextMessage(updatedAppt.patient_phone, msg);
      } else if (status === 'completed') {
        // Trigger feedback scanner
        const msg = `✅ *Consultation Complete*\n\nNamaste ${updatedAppt.patient_name} ji,\n\nWe hope your consultation with *${updatedAppt.doctor_name}* was helpful.\n\nPlease rate your experience (1 to 5 stars) by replying with a number!`;
        await sendWhatsAppTextMessage(updatedAppt.patient_phone, msg);
      }
    }

    return NextResponse.json({ success: true, appointment: updatedAppt });
  } catch (error: any) {
    console.error('Error updating hospital appointment:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
