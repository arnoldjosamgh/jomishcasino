'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';

export default function DepositPage() {
  const { profile, isAuthenticated } = useAuth();
  const router = useRouter();
  const [amount, setAmount] = useState(5000);
  const [method, setMethod] = useState<'mtn' | 'airtel' | 'card'>('mtn');
  const [phone, setPhone] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState<{type: 'success'|'error', text: string} | null>(null);

  if (!isAuthenticated) {
    return (
      <div className="container-jomish py-20 text-center">
        <h1 className="text-3xl font-bold mb-4 text-white">Please Login</h1>
        <p className="text-gray-400 mb-8">You need to be logged in to make a deposit.</p>
        <button onClick={() => router.push('/login')} className="btn-gold">Login Now</button>
      </div>
    );
  }

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount < 1000) {
      setMessage({ type: 'error', text: 'Minimum deposit is UGX 1,000' });
      return;
    }
    
    if ((method === 'mtn' || method === 'airtel') && !phone) {
      setMessage({ type: 'error', text: 'Mobile number is required' });
      return;
    }

    setIsProcessing(true);
    setMessage(null);

    try {
      const res = await fetch('/api/transactions/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: profile?.id,
          amount_ugx: amount,
          payment_method: method,
          phone_number: phone
        })
      });

      const data = await res.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'Deposit initiated! Please check your phone for the USSD prompt.' });
        // In a real app with cards, redirect to data.redirect_url if it's a card payment
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to initiate deposit' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="container-jomish py-12 max-w-2xl">
      <h1 className="text-3xl font-black font-outfit mb-2 text-white">Deposit Funds</h1>
      <p className="text-gray-400 mb-8">Instantly top up your Jomish Casino account.</p>

      <div className="glass-card p-6 md:p-8">
        
        {message && (
          <div className={`mb-6 p-4 rounded-xl border ${
            message.type === 'success' ? 'bg-green-500/20 border-green-500/50 text-green-400' : 'bg-red-500/20 border-red-500/50 text-red-400'
          }`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleDeposit} className="flex flex-col gap-6">
          
          {/* Payment Method */}
          <div>
            <label className="text-gray-300 font-bold mb-3 block">Select Payment Method</label>
            <div className="grid grid-cols-3 gap-3">
              <button 
                type="button"
                onClick={() => setMethod('mtn')}
                className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${
                  method === 'mtn' ? 'bg-[#ffcc00]/20 border-[#ffcc00] text-[#ffcc00]' : 'bg-jomish-dark-950 border-gray-800 text-gray-400 hover:border-gray-600'
                }`}
              >
                <div className="font-bold">MTN</div>
                <div className="text-[10px] uppercase opacity-70">Mobile Money</div>
              </button>
              
              <button 
                type="button"
                onClick={() => setMethod('airtel')}
                className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${
                  method === 'airtel' ? 'bg-[#ff0000]/20 border-[#ff0000] text-[#ff0000]' : 'bg-jomish-dark-950 border-gray-800 text-gray-400 hover:border-gray-600'
                }`}
              >
                <div className="font-bold">Airtel</div>
                <div className="text-[10px] uppercase opacity-70">Money</div>
              </button>

              <button 
                type="button"
                onClick={() => setMethod('card')}
                className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${
                  method === 'card' ? 'bg-blue-500/20 border-blue-500 text-blue-400' : 'bg-jomish-dark-950 border-gray-800 text-gray-400 hover:border-gray-600'
                }`}
              >
                <div className="font-bold">Card</div>
                <div className="text-[10px] uppercase opacity-70">Visa / MC</div>
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
              min="1000"
              required
            />
            <div className="flex gap-2 mt-2">
              {[5000, 10000, 20000, 50000].map(amt => (
                <button 
                  key={amt} 
                  type="button"
                  onClick={() => setAmount(amt)}
                  className="btn-ghost flex-1 py-1 text-xs"
                >
                  +{amt}
                </button>
              ))}
            </div>
          </div>

          {/* Phone Number for MM */}
          {(method === 'mtn' || method === 'airtel') && (
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
              <p className="text-xs text-gray-500 mt-2">Enter your number to receive the payment prompt.</p>
            </div>
          )}

          <button 
            type="submit"
            disabled={isProcessing}
            className="btn-gold py-4 text-xl font-bold mt-4 shadow-[0_0_20px_rgba(234,179,8,0.2)]"
          >
            {isProcessing ? 'Processing...' : `Deposit UGX ${amount.toLocaleString()}`}
          </button>
          
        </form>
      </div>
    </div>
  );
}
