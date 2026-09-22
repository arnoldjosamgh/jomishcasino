import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const { user_id, game_type, bet_amount_ugx, outcome_amount_ugx, result, game_data } = await req.json();

    if (!user_id || bet_amount_ugx === undefined || outcome_amount_ugx === undefined || !result) {
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

    if (profile.balance_ugx < bet_amount_ugx) {
      return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 });
    }

    // 1. Deduct bet amount
    try {
      await supabase.rpc('decrement_balance', { user_id, sub_amount: bet_amount_ugx });
    } catch (e) {
      return NextResponse.json({ error: 'Insufficient balance or deduction failed' }, { status: 400 });
    }

    // 2. If win or push, credit the outcome amount
    if (outcome_amount_ugx > 0) {
      await supabase.rpc('increment_balance', { user_id, add_amount: outcome_amount_ugx });
    }

    // 3. Record the bet
    const { data: bet, error: betError } = await supabase.from('bets').insert({
      user_id,
      game_type,
      bet_amount_ugx,
      outcome_amount_ugx,
      result,
      game_data: game_data || {},
    }).select().single();

    if (betError) {
      console.error('Failed to record bet:', betError);
      // We don't rollback balance here because the game result already happened.
      // In production, you'd use a transaction or durable queue.
    }

    // 4. Return new balance
    const { data: newProfile } = await supabase
      .from('profiles')
      .select('balance_ugx')
      .eq('id', user_id)
      .single();

    return NextResponse.json({
      success: true,
      bet,
      new_balance: newProfile?.balance_ugx,
    });
  } catch (error: any) {
    console.error('Bet processing error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
