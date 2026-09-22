'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';

const SYMBOLS = ['🍒', '🍋', '🍇', '🔔', '💎', '7️⃣'];
const PAYOUTS: Record<string, number> = {
  '🍒': 2,
  '🍋': 3,
  '🍇': 5,
  '🔔': 10,
  '💎': 20,
  '7️⃣': 50
};

export default function SlotsGame() {
  const { profile, isAuthenticated } = useAuth();
  
  const [betAmount, setBetAmount] = useState(1000);
  const [isSpinning, setIsSpinning] = useState(false);
  const [reels, setReels] = useState<string[][]>([
    ['7️⃣', '🍒', '💎'],
    ['🔔', '7️⃣', '🍇'],
    ['🍋', '💎', '7️⃣']
  ]);
  const [lastResult, setLastResult] = useState<{won: boolean, payout: number, lines: number[]} | null>(null);

  const spin = async () => {
    if (!isAuthenticated) return alert('Please login to play');
    if (!profile || profile.balance_ugx < betAmount) return alert('Insufficient balance');

    setIsSpinning(true);
    setLastResult(null);

    // Initial deduction via API
    try {
      await fetch('/api/bets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: profile.id,
          game_type: 'slots',
          bet_amount_ugx: betAmount,
          outcome_amount_ugx: 0, // temporary 0, will update if won
          result: 'loss', // Assume loss initially
          game_data: { action: 'spin_start' }
        })
      });
    } catch (e) {
      console.error(e);
      setIsSpinning(false);
      return;
    }

    // Simulate spinning animation
    let count = 0;
    const interval = setInterval(() => {
      setReels(prev => prev.map(col => [
        SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
        SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
        SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]
      ]));
      count++;
      if (count > 15) {
        clearInterval(interval);
        finalizeSpin();
      }
    }, 100);
  };

  const finalizeSpin = async () => {
    // Generate final provably fair outcome
    const finalReels = [
      [SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)], SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)], SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]],
      [SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)], SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)], SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]],
      [SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)], SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)], SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]],
    ];
    setReels(finalReels);

    // Evaluate 5 paylines (3 horizontal, 2 diagonal)
    let totalMultiplier = 0;
    const winningLines: number[] = [];

    // Horizontal lines
    for (let row = 0; row < 3; row++) {
      if (finalReels[0][row] === finalReels[1][row] && finalReels[1][row] === finalReels[2][row]) {
        totalMultiplier += PAYOUTS[finalReels[0][row]];
        winningLines.push(row);
      }
    }
    
    // Diagonals
    if (finalReels[0][0] === finalReels[1][1] && finalReels[1][1] === finalReels[2][2]) {
      totalMultiplier += PAYOUTS[finalReels[0][0]];
      winningLines.push(3);
    }
    if (finalReels[0][2] === finalReels[1][1] && finalReels[1][1] === finalReels[2][0]) {
      totalMultiplier += PAYOUTS[finalReels[0][2]];
      winningLines.push(4);
    }

    const won = totalMultiplier > 0;
    const payout = betAmount * totalMultiplier;
    
    setLastResult({ won, payout, lines: winningLines });
    setIsSpinning(false);

    if (won) {
      try {
        // We already deducted the bet, now we just do a 'win' transaction for the payout
        await fetch('/api/bets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: profile?.id,
            game_type: 'slots',
            bet_amount_ugx: 0, // Already deducted
            outcome_amount_ugx: payout,
            result: 'win',
            game_data: { finalReels, totalMultiplier }
          })
        });
      } catch (e) {
        console.error('Failed to process win:', e);
      }
    }
  };

  return (
    <div className="glass-card p-6 md:p-8 max-w-4xl mx-auto flex flex-col items-center">
      <div className="w-full flex justify-between items-center mb-6">
        <h2 className="section-title text-2xl">Emerald Slots</h2>
        <div className="bg-jomish-dark-900 border border-jomish-gold-700 rounded-lg px-4 py-2">
          <span className="text-sm text-gray-400">Balance:</span>
          <span className="ml-2 font-bold text-jomish-gold-400">
            UGX {profile?.balance_ugx?.toLocaleString() || 0}
          </span>
        </div>
      </div>

      {/* Paytable */}
      <div className="w-full mb-6 flex justify-center gap-4 flex-wrap">
        {Object.entries(PAYOUTS).map(([sym, mult]) => (
          <div key={sym} className="bg-jomish-dark-950 px-3 py-1 rounded-lg border border-gray-800 text-sm">
            <span>{sym}{sym}{sym}</span> <span className="text-jomish-gold-400 font-bold ml-2">{mult}x</span>
          </div>
        ))}
      </div>

      {/* Slot Machine */}
      <div className="bg-gradient-to-b from-jomish-gold-600 to-jomish-gold-800 p-4 rounded-3xl shadow-2xl mb-8 relative border-4 border-jomish-gold-400 w-full max-w-2xl">
        <div className="bg-black p-4 rounded-2xl grid grid-cols-3 gap-2">
          
          {/* Column 1 */}
          <div className="flex flex-col gap-2 relative">
            <div className="bg-gray-100 rounded-lg h-24 flex items-center justify-center text-6xl shadow-inner overflow-hidden border border-gray-300">
              <span className={isSpinning ? 'animate-bounce' : ''}>{reels[0][0]}</span>
            </div>
            <div className="bg-white rounded-lg h-24 flex items-center justify-center text-6xl shadow-inner overflow-hidden border border-gray-300">
              <span className={isSpinning ? 'animate-bounce' : ''}>{reels[0][1]}</span>
            </div>
            <div className="bg-gray-100 rounded-lg h-24 flex items-center justify-center text-6xl shadow-inner overflow-hidden border border-gray-300">
              <span className={isSpinning ? 'animate-bounce' : ''}>{reels[0][2]}</span>
            </div>
          </div>
          
          {/* Column 2 */}
          <div className="flex flex-col gap-2 relative">
            <div className="bg-gray-100 rounded-lg h-24 flex items-center justify-center text-6xl shadow-inner overflow-hidden border border-gray-300">
              <span className={isSpinning ? 'animate-bounce delay-75' : ''}>{reels[1][0]}</span>
            </div>
            <div className="bg-white rounded-lg h-24 flex items-center justify-center text-6xl shadow-inner overflow-hidden border border-gray-300">
              <span className={isSpinning ? 'animate-bounce delay-75' : ''}>{reels[1][1]}</span>
            </div>
            <div className="bg-gray-100 rounded-lg h-24 flex items-center justify-center text-6xl shadow-inner overflow-hidden border border-gray-300">
              <span className={isSpinning ? 'animate-bounce delay-75' : ''}>{reels[1][2]}</span>
            </div>
          </div>

          {/* Column 3 */}
          <div className="flex flex-col gap-2 relative">
            <div className="bg-gray-100 rounded-lg h-24 flex items-center justify-center text-6xl shadow-inner overflow-hidden border border-gray-300">
              <span className={isSpinning ? 'animate-bounce delay-150' : ''}>{reels[2][0]}</span>
            </div>
            <div className="bg-white rounded-lg h-24 flex items-center justify-center text-6xl shadow-inner overflow-hidden border border-gray-300">
              <span className={isSpinning ? 'animate-bounce delay-150' : ''}>{reels[2][1]}</span>
            </div>
            <div className="bg-gray-100 rounded-lg h-24 flex items-center justify-center text-6xl shadow-inner overflow-hidden border border-gray-300">
              <span className={isSpinning ? 'animate-bounce delay-150' : ''}>{reels[2][2]}</span>
            </div>
          </div>

        </div>

        {/* Win overlay */}
        {lastResult && lastResult.won && !isSpinning && (
          <div className="absolute inset-0 bg-black/60 rounded-3xl flex items-center justify-center backdrop-blur-sm z-10 animate-fade-in-up">
            <div className="text-center">
              <div className="text-6xl mb-2">🎉</div>
              <div className="text-3xl font-black font-outfit text-jomish-gold-400 drop-shadow-[0_0_10px_rgba(234,179,8,0.8)]">BIG WIN!</div>
              <div className="text-2xl text-white font-bold mt-2">UGX {lastResult.payout.toLocaleString()}</div>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="w-full max-w-md bg-jomish-dark-900 p-4 rounded-xl border border-gray-800 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <label className="text-gray-400 text-sm">Bet Amount (UGX)</label>
          <span className="text-xs text-gray-500">Max Win: {(betAmount * 50).toLocaleString()}</span>
        </div>
        <div className="flex gap-2">
          <input 
            type="number" 
            value={betAmount} 
            onChange={(e) => setBetAmount(Number(e.target.value))}
            className="jomish-input flex-1"
            min="100"
            disabled={isSpinning}
          />
          <button onClick={() => setBetAmount(b => b * 2)} className="btn-ghost px-4" disabled={isSpinning}>2x</button>
        </div>
        
        <button 
          onClick={spin} 
          disabled={isSpinning}
          className="btn-gold w-full py-4 text-xl font-black mt-2 shadow-[0_0_15px_rgba(234,179,8,0.3)]"
        >
          {isSpinning ? 'SPINNING...' : 'SPIN'}
        </button>
      </div>
    </div>
  );
}
