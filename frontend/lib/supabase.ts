import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

// Client-side Supabase client (anon key — safe for browser)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Named export alias so pages can do: import { createClient } from '@/lib/supabase'
export { createClient };


// Server-side admin client (service role — only use in API routes)
export function createAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-service-key';
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          email: string;
          balance_ugx: number;
          bonus_balance_ugx: number;
          kyc_status: 'pending' | 'verified' | 'rejected';
          vip_level: 'bronze' | 'silver' | 'gold' | 'platinum';
          language_pref: string;
          first_name: string | null;
          last_name: string | null;
          date_of_birth: string | null;
          phone_number: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
      };
      transactions: {
        Row: {
          id: string;
          user_id: string;
          type: 'deposit' | 'withdrawal' | 'bet' | 'win' | 'bonus';
          amount_ugx: number;
          status: 'pending' | 'completed' | 'failed';
          payment_method: string | null;
          reference: string | null;
          description: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['transactions']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['transactions']['Insert']>;
      };
      bets: {
        Row: {
          id: string;
          user_id: string;
          game_type: string;
          bet_amount_ugx: number;
          outcome_amount_ugx: number;
          result: 'win' | 'loss' | 'push';
          game_data: Record<string, unknown>;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['bets']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['bets']['Insert']>;
      };
      sports_bets: {
        Row: {
          id: string;
          user_id: string;
          event_id: string;
          event_name: string;
          selection: string;
          odds: number;
          stake_ugx: number;
          potential_payout_ugx: number;
          status: 'pending' | 'won' | 'lost' | 'void';
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['sports_bets']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['sports_bets']['Insert']>;
      };
    };
  };
};
