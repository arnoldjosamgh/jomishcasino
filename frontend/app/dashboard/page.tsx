'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';

interface Transaction {
  id: string;
  type: string;
  amount_ugx: number;
  status: string;
  created_at: string;
}

export default function DashboardPage() {
  const { profile, isAuthenticated, logout } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    const fetchTransactions = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', profile?.id)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (data) setTransactions(data);
      setLoading(false);
    };

    if (profile?.id) {
      fetchTransactions();
    }
  }, [isAuthenticated, profile, router]);

  if (!isAuthenticated || !profile) return null;

  return (
    <div className="container-jomish py-12">
      <h1 className="text-3xl font-black font-outfit mb-8 text-white">{t('nav.dashboard')}</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Profile Card */}
        <div className="glass-card p-6 flex flex-col items-center text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-jomish-green-600 to-jomish-green-400 rounded-full flex items-center justify-center text-3xl font-bold mb-4 shadow-[0_0_20px_rgba(34,197,94,0.3)]">
            {(profile.username?.[0] || 'U').toUpperCase()}
          </div>
          <h2 className="text-xl font-bold text-white mb-1">@{profile.username}</h2>
          <div className="text-jomish-gold-400 text-sm font-bold uppercase tracking-wider mb-4">
            {profile.vip_level} Member
          </div>
          <div className="text-gray-400 text-sm">{profile.email}</div>
          <div className="text-gray-400 text-sm mb-6">{profile.phone_number}</div>
          
          <button onClick={logout} className="btn-ghost w-full text-red-400 border-red-500/30 hover:bg-red-500/10">
            {t('nav.logout')}
          </button>
        </div>

        {/* Balance Card */}
        <div className="md:col-span-2 flex flex-col gap-6">
          <div className="glass-card p-6 bg-gradient-to-br from-jomish-dark-900 to-jomish-dark-950">
            <h3 className="text-gray-400 font-bold mb-2 uppercase tracking-wider text-sm">{t('wallet.balance')}</h3>
            <div className="text-4xl md:text-5xl font-black font-outfit text-jomish-gold-400 mb-6 drop-shadow-[0_0_10px_rgba(234,179,8,0.2)]">
              UGX {profile.balance_ugx.toLocaleString()}
            </div>
            
            <div className="flex gap-4">
              <Link href="/deposit" className="btn-gold flex-1 text-center font-bold">
                {t('wallet.deposit')}
              </Link>
              <Link href="/withdraw" className="btn-ghost flex-1 text-center font-bold">
                {t('wallet.withdraw')}
              </Link>
            </div>
          </div>
          
          {/* Recent Transactions */}
          <div className="glass-card p-6 flex-1">
             <h3 className="text-gray-400 font-bold mb-4 uppercase tracking-wider text-sm">{t('wallet.history')}</h3>
             {loading ? (
               <div className="text-gray-500 text-sm">{t('common.loading')}</div>
             ) : transactions.length === 0 ? (
               <div className="text-gray-500 text-sm text-center py-8">No recent transactions.</div>
             ) : (
               <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                 {transactions.map(tx => (
                   <div key={tx.id} className="flex justify-between items-center p-3 rounded-lg border border-gray-800 bg-black/20">
                     <div className="flex items-center gap-3">
                       <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                         tx.type === 'deposit' || tx.type === 'win' || tx.type === 'bonus' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                       }`}>
                         {tx.type === 'deposit' ? '↓' : tx.type === 'withdraw' ? '↑' : tx.type === 'win' ? 'W' : 'B'}
                       </div>
                       <div>
                         <div className="font-bold text-gray-200 capitalize">{tx.type}</div>
                         <div className="text-xs text-gray-500">{new Date(tx.created_at).toLocaleString()}</div>
                       </div>
                     </div>
                     <div className="text-right">
                       <div className={`font-bold ${tx.type === 'deposit' || tx.type === 'win' || tx.type === 'bonus' ? 'text-green-400' : 'text-white'}`}>
                         {tx.type === 'deposit' || tx.type === 'win' || tx.type === 'bonus' ? '+' : '-'} UGX {tx.amount_ugx.toLocaleString()}
                       </div>
                       <div className={`text-xs uppercase font-bold ${
                         tx.status === 'completed' ? 'text-green-500' : tx.status === 'pending' ? 'text-yellow-500' : 'text-red-500'
                       }`}>
                         {tx.status}
                       </div>
                     </div>
                   </div>
                 ))}
               </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
}
