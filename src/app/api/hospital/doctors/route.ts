import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get('business_id');
    const department = searchParams.get('department');

    let query = supabaseAdmin
      .from('hospital_doctors')
      .select('*')
      .order('name', { ascending: true });

    if (businessId) {
      query = query.eq('business_id', businessId);
    }
    if (department) {
      query = query.eq('department', department);
    }

    const { data: doctors, error } = await query;

    if (error) {
      console.error('Error fetching hospital doctors:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    // If table is empty, seed standard doctors list for clinic/hospital
    if (!doctors || doctors.length === 0) {
      const defaultDoctors = [
        {
          business_id: businessId || undefined,
          name: 'Dr. Rajesh Gupta',
          department: 'Cardiology',
          specialization: 'Senior Cardiologist & Interventionalist (MD, DM)',
          fee: 800,
          available_days: 'Mon,Tue,Wed,Thu,Fri',
          start_time: '09:00',
          end_time: '14:00',
          slot_duration_minutes: 20,
          status: 'Active',
        },
        {
          business_id: businessId || undefined,
          name: 'Dr. Ananya Iyer',
          department: 'Pediatrics',
          specialization: 'Consultant Pediatrician & Neonatologist (MD)',
          fee: 600,
          available_days: 'Mon,Wed,Fri,Sat',
          start_time: '10:00',
          end_time: '16:00',
          slot_duration_minutes: 15,
          status: 'Active',
        },
        {
          business_id: businessId || undefined,
          name: 'Dr. Vikramaditya Rao',
          department: 'Orthopedics',
          specialization: 'Joint Replacement & Spine Surgeon (MS, MCh)',
          fee: 900,
          available_days: 'Tue,Thu,Sat',
          start_time: '11:00',
          end_time: '18:00',
          slot_duration_minutes: 20,
          status: 'Active',
        },
        {
          business_id: businessId || undefined,
          name: 'Dr. Priya Sharma',
          department: 'General Medicine',
          specialization: 'Senior General Physician & Diabetologist (MBBS, MD)',
          fee: 500,
          available_days: 'Mon,Tue,Wed,Thu,Fri,Sat',
          start_time: '09:00',
          end_time: '17:00',
          slot_duration_minutes: 15,
          status: 'Active',
        },
        {
          business_id: businessId || undefined,
          name: 'Dr. Sameer Deshmukh',
          department: 'Neurology',
          specialization: 'Consultant Neurologist (DM Neurology, AIIMS)',
          fee: 1000,
          available_days: 'Mon,Thu,Fri',
          start_time: '14:00',
          end_time: '19:00',
          slot_duration_minutes: 30,
          status: 'Active',
        },
      ];

      const { data: seededDocs } = await supabaseAdmin
        .from('hospital_doctors')
        .insert(defaultDoctors)
        .select();

      return NextResponse.json({ success: true, doctors: seededDocs || defaultDoctors });
    }

    return NextResponse.json({ success: true, doctors });
  } catch (error: any) {
    console.error('Error in hospital doctors GET:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      business_id,
      name,
      department,
      specialization,
      fee = 500,
      available_days = 'Mon,Tue,Wed,Thu,Fri,Sat',
      start_time = '09:00',
      end_time = '17:00',
      slot_duration_minutes = 15,
    } = body;

    if (!name || !department) {
      return NextResponse.json({ success: false, error: 'Doctor name and department are required.' }, { status: 400 });
    }

    const { data: doctor, error } = await supabaseAdmin
      .from('hospital_doctors')
      .insert([{
        business_id,
        name,
        department,
        specialization,
        fee: parseInt(fee, 10),
        available_days,
        start_time,
        end_time,
        slot_duration_minutes: parseInt(slot_duration_minutes, 10),
        status: 'Active',
      }])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, doctor });
  } catch (error: any) {
    console.error('Error creating hospital doctor:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
