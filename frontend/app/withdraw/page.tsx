'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';

export default function WithdrawPage() {
  const { profile, isAuthenticated } = useAuth();
  const router = useRouter();
  const [amount, setAmount] = useState(5000);
  const [method, setMethod] = useState<'mtn' | 'airtel'>('mtn');
  const [phone, setPhone] = useState(profile?.phone_number || '');
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState<{type: 'success'|'error', text: string} | null>(null);

  if (!isAuthenticated) {
    return (
      <div className="container-jomish py-20 text-center">
        <h1 className="text-3xl font-bold mb-4 text-white">Please Login</h1>
        <p className="text-gray-400 mb-8">You need to be logged in to make a withdrawal.</p>
        <button onClick={() => router.push('/login')} className="btn-gold">Login Now</button>
      </div>
    );
  }

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount < 5000) {
      setMessage({ type: 'error', text: 'Minimum withdrawal is UGX 5,000' });
      return;
    }

    if (!profile || profile.balance_ugx < amount) {
      setMessage({ type: 'error', text: 'Insufficient balance' });
      return;
    }
    
    if (!phone) {
      setMessage({ type: 'error', text: 'Mobile number is required' });
      return;
    }

    setIsProcessing(true);
    setMessage(null);

    try {
      const res = await fetch('/api/transactions/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: profile.id,
          amount_ugx: amount,
          payment_method: method,
          phone_number: phone
        })
      });

      const data = await res.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'Withdrawal initiated successfully! Funds will be sent to your mobile money account shortly.' });
        setAmount(5000);
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to initiate withdrawal' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="container-jomish py-12 max-w-2xl">
      <h1 className="text-3xl font-black font-outfit mb-2 text-white">Withdraw Funds</h1>
      <p className="text-gray-400 mb-8">Cash out your winnings instantly to Mobile Money.</p>

      <div className="glass-card p-6 md:p-8">
        
        {/* Balance Display */}
        <div className="bg-jomish-dark-900 border border-jomish-gold-700/50 rounded-xl p-4 mb-6 flex justify-between items-center">
           <div>
             <div className="text-gray-400 text-sm mb-1">Available Balance</div>
             <div className="text-2xl font-bold text-jomish-gold-400">UGX {profile?.balance_ugx?.toLocaleString() || 0}</div>
           </div>
           <button onClick={() => setAmount(profile?.balance_ugx || 0)} className="btn-ghost text-xs">
             Max
           </button>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-xl border ${
            message.type === 'success' ? 'bg-green-500/20 border-green-500/50 text-green-400' : 'bg-red-500/20 border-red-500/50 text-red-400'
          }`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleWithdraw} className="flex flex-col gap-6">
          
          {/* Payment Method */}
          <div>
            <label className="text-gray-300 font-bold mb-3 block">Withdraw To</label>
            <div className="grid grid-cols-2 gap-3">
              <button 
                type="button"
                onClick={() => setMethod('mtn')}
                className={`p-4 rounded-xl border flex items-center justify-center gap-3 transition-all ${
                  method === 'mtn' ? 'bg-[#ffcc00]/20 border-[#ffcc00] text-[#ffcc00]' : 'bg-jomish-dark-950 border-gray-800 text-gray-400 hover:border-gray-600'
                }`}
              >
                <div className="font-bold">MTN Mobile Money</div>
              </button>
              
              <button 
                type="button"
                onClick={() => setMethod('airtel')}
                className={`p-4 rounded-xl border flex items-center justify-center gap-3 transition-all ${
                  method === 'airtel' ? 'bg-[#ff0000]/20 border-[#ff0000] text-[#ff0000]' : 'bg-jomish-dark-950 border-gray-800 text-gray-400 hover:border-gray-600'
                }`}
              >
                <div className="font-bold">Airtel Money</div>
              </button>
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="text-gray-300 font-bold mb-2 block">Amount (UGX)</label>
            <input 
              type="number" 
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="jomish-input text-lg py-3"
              min="5000"
              required
            />
          </div>

          {/* Phone Number */}
          <div>
            <label className="text-gray-300 font-bold mb-2 block">Mobile Number</label>
            <div className="flex">
              <span className="inline-flex items-center px-4 bg-gray-800 border border-r-0 border-gray-700 rounded-l-xl text-gray-400">
                +256
              </span>
              <input 
                type="tel" 
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="770000000"
                className="jomish-input rounded-l-none"
                required
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={isProcessing}
            className="btn-gold py-4 text-xl font-bold mt-4 shadow-[0_0_20px_rgba(234,179,8,0.2)]"
          >
            {isProcessing ? 'Processing...' : `Withdraw UGX ${amount.toLocaleString()}`}
          </button>
          
        </form>
      </div>
    </div>
  );
}
