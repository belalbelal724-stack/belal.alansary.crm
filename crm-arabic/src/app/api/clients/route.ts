import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const search = req.nextUrl.searchParams.get('q') || '';
  const status = req.nextUrl.searchParams.get('status');
  
  let query = supabase.from('clients').select('*, branch:branches(*)').order('created_at', { ascending: false });
  if (search) query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
  if (status && status !== 'all') query = query.eq('status', status);
  
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  if (!body.full_name) return NextResponse.json({ error: 'الاسم مطلوب' }, { status: 400 });
  
  const { data, error } = await supabase
    .from('clients')
    .insert({ ...body, created_by: user.id })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ data });
}
