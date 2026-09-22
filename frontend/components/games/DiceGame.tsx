'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';

export default function DiceGame() {
  const { profile, isAuthenticated } = useAuth();
  
  const [betAmount, setBetAmount] = useState(1000);
  const [target, setTarget] = useState(50);
  const [condition, setCondition] = useState<'under' | 'over'>('under');
  const [isRolling, setIsRolling] = useState(false);
  
  const [lastRoll, setLastRoll] = useState<number | null>(null);
  const [lastResult, setLastResult] = useState<'win' | 'loss' | null>(null);
  const [history, setHistory] = useState<{roll: number, won: boolean}[]>([]);

  // Calculate multiplier based on win chance
  const winChance = condition === 'under' ? target : 100 - target;
  const multiplier = winChance > 0 ? (99 / winChance) : 0; // 1% house edge
  const potentialWin = betAmount * multiplier;

  const rollDice = async () => {
    if (!isAuthenticated) return alert('Please login to play');
    if (!profile || profile.balance_ugx < betAmount) return alert('Insufficient balance');
    if (winChance <= 0 || winChance >= 100) return alert('Invalid target');

    setIsRolling(true);
    setLastRoll(null);
    setLastResult(null);

    // Simulate network delay and rolling animation
    await new Promise(resolve => setTimeout(resolve, 600));

    // Provably fair generation simulation (0.00 to 99.99)
    const result = Math.floor(Math.random() * 10000) / 100;
    
    const won = condition === 'under' ? result < target : result > target;
    const outcomeResult = won ? 'win' : 'loss';
    
    setLastRoll(result);
    setLastResult(outcomeResult);
    setHistory(prev => [{roll: result, won}, ...prev].slice(0, 10));

    try {
      await fetch('/api/bets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: profile.id,
          game_type: 'dice',
          bet_amount_ugx: betAmount,
          outcome_amount_ugx: won ? potentialWin : 0,
          result: outcomeResult,
          game_data: { roll: result, target, condition, multiplier }
        })
      });
    } catch (e) {
      console.error('Failed to process bet result:', e);
    } finally {
      setIsRolling(false);
    }
  };

  return (
    <div className="glass-card p-6 md:p-8 max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h2 className="section-title text-2xl">Dice</h2>
        <div className="bg-jomish-dark-900 border border-jomish-gold-700 rounded-lg px-4 py-2">
          <span className="text-sm text-gray-400">Balance:</span>
          <span className="ml-2 font-bold text-jomish-gold-400">
            UGX {profile?.balance_ugx?.toLocaleString() || 0}
          </span>
        </div>
      </div>

      {/* Main Display Area */}
      <div className="bg-jomish-dark-950 rounded-2xl p-8 mb-8 border border-gray-800 relative overflow-hidden flex flex-col items-center justify-center min-h-[200px]">
        
        {isRolling ? (
          <div className="text-6xl font-bold font-outfit text-white animate-pulse">
            --.--
          </div>
        ) : lastRoll !== null ? (
          <div className={`text-7xl font-black font-outfit tracking-tighter ${lastResult === 'win' ? 'text-green-400' : 'text-red-500'}`}>
            {lastRoll.toFixed(2)}
          </div>
        ) : (
          <div className="text-5xl font-bold font-outfit text-gray-500">
            00.00
          </div>
        )}

        {lastResult && !isRolling && (
           <div className={`mt-4 font-bold text-lg px-6 py-2 rounded-full ${lastResult === 'win' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
             {lastResult === 'win' ? `You won UGX ${potentialWin.toLocaleString(undefined, {maximumFractionDigits: 0})}!` : 'You lost.'}
           </div>
        )}
      </div>

      {/* Controls */}
      <div className="bg-jomish-dark-900 p-6 rounded-xl border border-gray-800 space-y-6">
        
        {/* Slider Area */}
        <div>
          <div className="flex justify-between text-sm mb-4">
            <span className="text-gray-400">0</span>
            <span className="text-gray-400">100</span>
          </div>
          
          <div className="relative pt-1">
            <input
              type="range"
              min="2"
              max="98"
              value={target}
              onChange={(e) => setTarget(Number(e.target.value))}
              className="w-full h-3 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              style={{
                background: condition === 'under' 
                  ? `linear-gradient(to right, #22c55e ${target}%, #374151 ${target}%)`
                  : `linear-gradient(to right, #374151 ${target}%, #ef4444 ${target}%)`
              }}
            />
            {/* Custom thumb styles would go in globals.css normally, simplified here */}
            <div 
              className="absolute top-0 w-8 h-8 bg-white rounded-full shadow-lg border-2 border-jomish-gold-500 flex items-center justify-center transform -translate-x-1/2 -translate-y-1 pointer-events-none"
              style={{ left: `${target}%` }}
            >
               <span className="text-xs font-bold text-gray-900">{target}</span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-jomish-dark-950 p-3 rounded-lg border border-gray-800 text-center">
            <div className="text-gray-400 text-xs mb-1">Multiplier</div>
            <div className="font-bold text-white">{multiplier.toFixed(4)}x</div>
          </div>
          <div className="bg-jomish-dark-950 p-3 rounded-lg border border-gray-800 text-center">
             <div className="text-gray-400 text-xs mb-1">Roll {condition === 'under' ? 'Under' : 'Over'}</div>
             <div className="font-bold text-jomish-gold-400 flex items-center justify-center gap-2 cursor-pointer" onClick={() => setCondition(c => c === 'under' ? 'over' : 'under')} title="Click to swap">
               {condition === 'under' ? '⬇' : '⬆'} {target}
             </div>
          </div>
          <div className="bg-jomish-dark-950 p-3 rounded-lg border border-gray-800 text-center">
            <div className="text-gray-400 text-xs mb-1">Win Chance</div>
            <div className="font-bold text-white">{winChance.toFixed(2)}%</div>
          </div>
        </div>

        <hr className="border-gray-800" />

        {/* Bet Area */}
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <label className="text-gray-400 text-sm mb-1 block">Bet Amount (UGX)</label>
            <div className="flex gap-2">
              <input 
                type="number" 
                value={betAmount} 
                onChange={(e) => setBetAmount(Number(e.target.value))}
                className="jomish-input flex-1"
                min="100"
              />
              <button onClick={() => setBetAmount(b => b / 2)} className="btn-ghost px-3">½</button>
              <button onClick={() => setBetAmount(b => b * 2)} className="btn-ghost px-3">2x</button>
            </div>
          </div>
          
          <div className="flex-1 w-full">
            <label className="text-gray-400 text-sm mb-1 block">Payout on Win</label>
            <div className="jomish-input bg-gray-800/50 text-jomish-gold-400 font-bold border-gray-700">
              UGX {potentialWin.toLocaleString(undefined, {maximumFractionDigits: 0})}
            </div>
          </div>
        </div>

        <button 
          onClick={rollDice} 
          disabled={isRolling}
          className="btn-gold w-full py-4 text-xl mt-4"
        >
          {isRolling ? 'Rolling...' : 'Roll Dice'}
        </button>
      </div>

      {/* History */}
      {history.length > 0 && (
        <div className="mt-6 flex gap-2 overflow-x-auto pb-2">
          {history.map((h, i) => (
            <div key={i} className={`flex-shrink-0 px-3 py-1.5 rounded-lg font-bold text-sm ${h.won ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-gray-800 text-gray-500'}`}>
              {h.roll.toFixed(2)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
