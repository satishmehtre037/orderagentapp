import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireBusiness } from '@/lib/auth/requireBusiness';

export async function GET(req: Request) {
  try {
    const auth = await requireBusiness(req);
    if (auth.errorResponse) {
      return auth.errorResponse;
    }
    const { businessId } = auth;

    const { searchParams } = new URL(req.url);
    const department = searchParams.get('department');

    let query = supabaseAdmin
      .from('hospital_doctors')
      .select('*')
      .eq('business_id', businessId)
      .order('name', { ascending: true });

    if (department) {
      query = query.eq('department', department);
    }

    const { data: doctors, error } = await query;

    if (error) {
      console.error('Error fetching hospital doctors:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    // If table is empty for this business, seed standard initial doctors list
    if (!doctors || doctors.length === 0) {
      const defaultDoctors = [
        {
          business_id: businessId,
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
          business_id: businessId,
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
          business_id: businessId,
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
          business_id: businessId,
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
          business_id: businessId,
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
    const auth = await requireBusiness(req);
    if (auth.errorResponse) {
      return auth.errorResponse;
    }
    const { businessId } = auth;

    const body = await req.json();
    const {
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
        business_id: businessId,
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
