import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const { amount_ugx, payment_method, phone_number, user_id } = await req.json();

    if (!user_id || !amount_ugx || !payment_method) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Verify balance first
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('balance_ugx')
      .eq('id', user_id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    if (profile.balance_ugx < amount_ugx) {
      return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 });
    }

    // Deduct balance immediately (optimistic lock in a real app, here we use RPC)
    try {
      await supabase.rpc('decrement_balance', { user_id, sub_amount: amount_ugx });
    } catch (e) {
      return NextResponse.json({ error: 'Insufficient balance or deduction failed' }, { status: 400 });
    }

    const reference = `JOMISH-WTH-${Date.now()}`;

    // Record transaction
    const { data: transaction, error: txError } = await supabase.from('transactions').insert({
      user_id,
      type: 'withdrawal',
      amount_ugx,
      status: 'pending',
      payment_method,
      reference,
      description: `Withdrawal via ${payment_method}`,
    }).select().single();

    if (txError) {
      // Rollback balance if recording transaction fails
      await supabase.rpc('increment_balance', { user_id, add_amount: amount_ugx });
      throw txError;
    }

    // Simulate webhook response after 3 seconds for sandbox mode
    setTimeout(async () => {
      try {
        await supabase.from('transactions').update({ status: 'completed' }).eq('id', transaction.id);
      } catch (err) {
        console.error('Simulated withdrawal webhook failed:', err);
      }
    }, 3000);

    return NextResponse.json({
      success: true,
      message: 'Withdrawal initiated successfully',
      transaction,
    });
  } catch (error: any) {
    console.error('Withdrawal error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
