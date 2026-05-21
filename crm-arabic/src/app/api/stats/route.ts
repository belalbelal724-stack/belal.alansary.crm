import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const [clients, branches, orders] = await Promise.all([
    supabase.from('clients').select('id', { count: 'exact', head: true }),
    supabase.from('branches').select('id', { count: 'exact', head: true }),
    supabase.from('orders').select('amount, status'),
  ]);

  const totalRevenue = (orders.data || [])
    .filter((o: any) => o.status === 'completed')
    .reduce((sum: number, o: any) => sum + Number(o.amount), 0);

  return NextResponse.json({
    totalClients: clients.count || 0,
    totalBranches: branches.count || 0,
    totalOrders: orders.data?.length || 0,
    totalRevenue,
  });
}
