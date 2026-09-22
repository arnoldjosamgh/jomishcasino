import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const { amount_ugx, payment_method, phone_number, user_id } = await req.json();

    if (!user_id || !amount_ugx || !payment_method) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // In a real implementation, you would call Dusupay API here.
    // For sandbox/demo, we'll simulate the deposit initiation.
    const reference = `JOMISH-DEP-${Date.now()}`;

    const { data: transaction, error } = await supabase.from('transactions').insert({
      user_id,
      type: 'deposit',
      amount_ugx,
      status: 'pending',
      payment_method,
      reference,
      description: `Deposit via ${payment_method}`,
    }).select().single();

    if (error) throw error;

    // Simulate webhook response after 3 seconds for sandbox mode
    // (In production, this happens via actual webhook from Dusupay)
    setTimeout(async () => {
      try {
        const { data: tx } = await supabase.from('transactions').select('*').eq('id', transaction.id).single();
        if (tx && tx.status === 'pending') {
          // Update tx to completed
          await supabase.from('transactions').update({ status: 'completed' }).eq('id', transaction.id);
          // Credit user balance
          await supabase.rpc('increment_balance', { user_id: tx.user_id, add_amount: tx.amount_ugx });
        }
      } catch (err) {
        console.error('Simulated webhook failed:', err);
      }
    }, 3000);

    return NextResponse.json({
      success: true,
      message: 'Deposit initiated',
      transaction,
      redirect_url: null // Would be Dusupay hosted page URL
    });
  } catch (error: any) {
    console.error('Deposit error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
