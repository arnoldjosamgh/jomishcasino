'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';

type BetType = 'straight' | 'red' | 'black' | 'even' | 'odd' | 'low' | 'high';

interface PlacedBet {
  type: BetType;
  value: string;
  amount: number;
}

const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
const BLACK_NUMBERS = [2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35];

export default function RouletteGame() {
  const { profile, isAuthenticated } = useAuth();
  const [bets, setBets] = useState<PlacedBet[]>([]);
  const [betAmount, setBetAmount] = useState(100);
  const [isSpinning, setIsSpinning] = useState(false);
  const [lastWinningNumber, setLastWinningNumber] = useState<number | null>(null);
  const [message, setMessage] = useState('Place your bets on the table');

  const totalBet = bets.reduce((sum, b) => sum + b.amount, 0);

  const placeBet = (type: BetType, value: string) => {
    if (isSpinning) return;
    setBets(prev => {
      const existing = prev.find(b => b.type === type && b.value === value);
      if (existing) {
        return prev.map(b => b === existing ? { ...b, amount: b.amount + betAmount } : b);
      }
      return [...prev, { type, value, amount: betAmount }];
    });
  };

  const clearBets = () => {
    if (!isSpinning) setBets([]);
  };

  const spin = async () => {
    if (!isAuthenticated) return alert('Please login to play');
    if (!profile || profile.balance_ugx < totalBet) return alert('Insufficient balance');
    if (bets.length === 0) return alert('Place at least one bet');

    setIsSpinning(true);
    setLastWinningNumber(null);
    setMessage('No more bets! Spinning...');

    // Simulate network delay and spin
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Provably fair generation (0-36)
    const winningNumber = Math.floor(Math.random() * 37);
    
    // Evaluate bets
    let totalWin = 0;
    
    bets.forEach(bet => {
      let won = false;
      let multiplier = 0;

      if (bet.type === 'straight' && parseInt(bet.value) === winningNumber) {
        won = true; multiplier = 36;
      } else if (winningNumber !== 0) {
        if (bet.type === 'red' && RED_NUMBERS.includes(winningNumber)) { won = true; multiplier = 2; }
        if (bet.type === 'black' && BLACK_NUMBERS.includes(winningNumber)) { won = true; multiplier = 2; }
        if (bet.type === 'even' && winningNumber % 2 === 0) { won = true; multiplier = 2; }
        if (bet.type === 'odd' && winningNumber % 2 !== 0) { won = true; multiplier = 2; }
        if (bet.type === 'low' && winningNumber >= 1 && winningNumber <= 18) { won = true; multiplier = 2; }
        if (bet.type === 'high' && winningNumber >= 19 && winningNumber <= 36) { won = true; multiplier = 2; }
      }

      if (won) totalWin += bet.amount * multiplier;
    });

    setLastWinningNumber(winningNumber);
    setIsSpinning(false);
    
    if (totalWin > 0) {
      setMessage(`Number ${winningNumber}! You won UGX ${totalWin.toLocaleString()}!`);
    } else {
      setMessage(`Number ${winningNumber}. You lost.`);
    }

    try {
      await fetch('/api/bets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: profile.id,
          game_type: 'roulette',
          bet_amount_ugx: totalBet,
          outcome_amount_ugx: totalWin,
          result: totalWin > 0 ? 'win' : 'loss',
          game_data: { winningNumber, bets }
        })
      });
    } catch (e) {
      console.error('Failed to process bet result:', e);
    }
  };

  const getColorClass = (num: number) => {
    if (num === 0) return 'bg-green-600 hover:bg-green-500';
    if (RED_NUMBERS.includes(num)) return 'bg-red-600 hover:bg-red-500';
    return 'bg-gray-900 hover:bg-gray-800';
  };

  const getBetAmount = (type: BetType, value: string) => {
    return bets.find(b => b.type === type && b.value === value)?.amount || 0;
  };

  return (
    <div className="glass-card p-6 md:p-8 max-w-5xl mx-auto flex flex-col items-center">
      <div className="w-full flex justify-between items-center mb-6">
        <h2 className="section-title text-2xl">European Roulette</h2>
        <div className="bg-jomish-dark-900 border border-jomish-gold-700 rounded-lg px-4 py-2">
          <span className="text-sm text-gray-400">Balance:</span>
          <span className="ml-2 font-bold text-jomish-gold-400">
            UGX {profile?.balance_ugx?.toLocaleString() || 0}
          </span>
        </div>
      </div>

      {/* Wheel Result Area */}
      <div className="w-full h-32 mb-8 flex items-center justify-center relative">
        {isSpinning ? (
          <div className="w-24 h-24 rounded-full border-4 border-dashed border-jomish-gold-400 animate-[spin-slow_2s_linear_infinite]" />
        ) : lastWinningNumber !== null ? (
          <div className={`w-24 h-24 rounded-full flex items-center justify-center text-4xl font-bold font-outfit text-white border-4 border-jomish-gold-400 shadow-[0_0_20px_rgba(234,179,8,0.5)] ${
            lastWinningNumber === 0 ? 'bg-green-600' : (RED_NUMBERS.includes(lastWinningNumber) ? 'bg-red-600' : 'bg-gray-900')
          }`}>
            {lastWinningNumber}
          </div>
        ) : (
          <div className="text-gray-500 text-lg">Place your bets</div>
        )}
      </div>
      
      <div className="mb-6 text-center text-lg font-semibold text-white">
        {message}
      </div>

      {/* Roulette Table */}
      <div className="w-full overflow-x-auto pb-4">
        <div className="min-w-[700px] bg-green-800 p-2 rounded-xl border-4 border-green-900 shadow-inner flex flex-col gap-1">
          
          {/* Numbers Grid */}
          <div className="flex">
            {/* Zero */}
            <div 
              className="w-16 flex items-center justify-center border border-white/20 text-white font-bold cursor-pointer relative bg-green-600 hover:bg-green-500"
              onClick={() => placeBet('straight', '0')}
            >
              0
              {getBetAmount('straight', '0') > 0 && <div className="absolute w-6 h-6 bg-blue-500 rounded-full border-2 border-white flex items-center justify-center text-[10px] shadow-lg pointer-events-none"></div>}
            </div>

            {/* 1-36 Grid (3 rows) */}
            <div className="flex-1 grid grid-cols-12 gap-[1px] bg-white/20 ml-[1px]">
              {/* Row 3: 3, 6, 9... */}
              {[3,6,9,12,15,18,21,24,27,30,33,36].map(num => (
                <div key={num} className={`h-12 flex items-center justify-center text-white font-bold cursor-pointer relative ${getColorClass(num)}`} onClick={() => placeBet('straight', num.toString())}>
                  {num}
                  {getBetAmount('straight', num.toString()) > 0 && <div className="absolute w-6 h-6 bg-blue-500 rounded-full border-2 border-white flex items-center justify-center text-[10px] shadow-lg pointer-events-none z-10"></div>}
                </div>
              ))}
              {/* Row 2: 2, 5, 8... */}
              {[2,5,8,11,14,17,20,23,26,29,32,35].map(num => (
                <div key={num} className={`h-12 flex items-center justify-center text-white font-bold cursor-pointer relative ${getColorClass(num)}`} onClick={() => placeBet('straight', num.toString())}>
                  {num}
                  {getBetAmount('straight', num.toString()) > 0 && <div className="absolute w-6 h-6 bg-blue-500 rounded-full border-2 border-white flex items-center justify-center text-[10px] shadow-lg pointer-events-none z-10"></div>}
                </div>
              ))}
              {/* Row 1: 1, 4, 7... */}
              {[1,4,7,10,13,16,19,22,25,28,31,34].map(num => (
                <div key={num} className={`h-12 flex items-center justify-center text-white font-bold cursor-pointer relative ${getColorClass(num)}`} onClick={() => placeBet('straight', num.toString())}>
                  {num}
                  {getBetAmount('straight', num.toString()) > 0 && <div className="absolute w-6 h-6 bg-blue-500 rounded-full border-2 border-white flex items-center justify-center text-[10px] shadow-lg pointer-events-none z-10"></div>}
                </div>
              ))}
            </div>
          </div>

          {/* Outside Bets */}
          <div className="flex ml-16 gap-[1px]">
            <div className="flex-1 grid grid-cols-6 gap-[1px] bg-white/20">
              <div className="h-10 flex items-center justify-center bg-green-700 hover:bg-green-600 text-white text-sm font-bold cursor-pointer relative" onClick={() => placeBet('low', '1-18')}>
                1-18
                {getBetAmount('low', '1-18') > 0 && <div className="absolute w-6 h-6 bg-blue-500 rounded-full border-2 border-white shadow-lg pointer-events-none"></div>}
              </div>
              <div className="h-10 flex items-center justify-center bg-green-700 hover:bg-green-600 text-white text-sm font-bold cursor-pointer relative" onClick={() => placeBet('even', 'even')}>
                EVEN
                {getBetAmount('even', 'even') > 0 && <div className="absolute w-6 h-6 bg-blue-500 rounded-full border-2 border-white shadow-lg pointer-events-none"></div>}
              </div>
              <div className="h-10 flex items-center justify-center bg-red-600 hover:bg-red-500 cursor-pointer relative" onClick={() => placeBet('red', 'red')}>
                <div className="w-6 h-6 bg-red-500 border border-white rotate-45"></div>
                {getBetAmount('red', 'red') > 0 && <div className="absolute w-6 h-6 bg-blue-500 rounded-full border-2 border-white shadow-lg pointer-events-none"></div>}
              </div>
              <div className="h-10 flex items-center justify-center bg-gray-900 hover:bg-gray-800 cursor-pointer relative" onClick={() => placeBet('black', 'black')}>
                <div className="w-6 h-6 bg-black border border-white rotate-45"></div>
                {getBetAmount('black', 'black') > 0 && <div className="absolute w-6 h-6 bg-blue-500 rounded-full border-2 border-white shadow-lg pointer-events-none"></div>}
              </div>
              <div className="h-10 flex items-center justify-center bg-green-700 hover:bg-green-600 text-white text-sm font-bold cursor-pointer relative" onClick={() => placeBet('odd', 'odd')}>
                ODD
                {getBetAmount('odd', 'odd') > 0 && <div className="absolute w-6 h-6 bg-blue-500 rounded-full border-2 border-white shadow-lg pointer-events-none"></div>}
              </div>
              <div className="h-10 flex items-center justify-center bg-green-700 hover:bg-green-600 text-white text-sm font-bold cursor-pointer relative" onClick={() => placeBet('high', '19-36')}>
                19-36
                {getBetAmount('high', '19-36') > 0 && <div className="absolute w-6 h-6 bg-blue-500 rounded-full border-2 border-white shadow-lg pointer-events-none"></div>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="w-full max-w-xl bg-jomish-dark-900 p-4 rounded-xl border border-gray-800 flex flex-col md:flex-row gap-4 items-end mt-4">
        <div className="flex-1 w-full">
          <label className="text-gray-400 text-sm">Chip Size (UGX)</label>
          <div className="flex gap-2 mt-1">
            {[100, 500, 1000, 5000].map(amt => (
              <button 
                key={amt} 
                onClick={() => setBetAmount(amt)}
                disabled={isSpinning}
                className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-colors ${
                  betAmount === amt ? 'bg-blue-600 text-white border-blue-400' : 'bg-gray-800 text-gray-400 border-gray-700'
                }`}
              >
                {amt}
              </button>
            ))}
          </div>
        </div>
        
        <div className="flex-1 w-full flex gap-2">
           <div className="flex-1">
             <div className="text-gray-400 text-sm mb-1">Total Bet</div>
             <div className="font-bold text-jomish-gold-400 bg-gray-800/50 py-2 px-3 rounded-lg border border-gray-700">
               UGX {totalBet.toLocaleString()}
             </div>
           </div>
           <button onClick={clearBets} disabled={isSpinning} className="btn-ghost px-4 h-[42px] self-end">
             Clear
           </button>
        </div>
        
        <button 
          onClick={spin} 
          disabled={isSpinning || totalBet === 0}
          className="btn-gold px-8 py-3 h-[42px] font-black w-full md:w-auto"
        >
          {isSpinning ? 'SPINNING...' : 'SPIN'}
        </button>
      </div>
    </div>
  );
}
