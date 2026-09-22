'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/auth-context';

export default function CrashGame() {
  const { profile, isAuthenticated } = useAuth();
  const [gameState, setGameState] = useState<'betting' | 'playing' | 'crashed'>('betting');
  const [multiplier, setMultiplier] = useState(1.0);
  const [betAmount, setBetAmount] = useState(1000);
  const [autoCashout, setAutoCashout] = useState(2.0);
  const [profit, setProfit] = useState(0);
  const [hasCashedOut, setHasCashedOut] = useState(false);
  const [crashPoint, setCrashPoint] = useState(0);
  const [history, setHistory] = useState<number[]>([]);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>();
  const startTimeRef = useRef<number>(0);

  // Provably fair generation simulation
  const generateCrashPoint = () => {
    // In production, this uses HMAC-SHA256 with server+client seeds
    const e = 2 ** 52;
    const h = crypto.getRandomValues(new Uint32Array(2))[0] / (2**32);
    // 1% house edge (instant crash)
    if (h % 100 === 0) return 1.0;
    return Math.max(1.0, (100 * e - h) / (e - h)) / 100;
  };

  const processBetResult = async (result: 'win' | 'loss', finalMultiplier: number = 0) => {
    if (!profile || !isAuthenticated || hasCashedOut) return;
    
    const outcomeAmount = result === 'win' ? betAmount * finalMultiplier : 0;
    
    try {
      await fetch('/api/bets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: profile.id,
          game_type: 'crash',
          bet_amount_ugx: betAmount,
          outcome_amount_ugx: outcomeAmount,
          result,
          game_data: { crashPoint, cashoutAt: finalMultiplier }
        })
      });
    } catch (e) {
      console.error('Failed to process bet result:', e);
    }
  };

  const startGame = () => {
    if (!isAuthenticated) return alert('Please login to play');
    if (profile && profile.balance_ugx < betAmount) return alert('Insufficient balance');

    const targetCrash = generateCrashPoint();
    setCrashPoint(targetCrash);
    setGameState('playing');
    setMultiplier(1.0);
    setHasCashedOut(false);
    setProfit(0);
    startTimeRef.current = performance.now();
    
    const animate = (time: number) => {
      const elapsed = time - startTimeRef.current;
      // Exponential growth curve
      const currentMulti = Math.pow(Math.E, 0.00006 * elapsed);
      
      if (currentMulti >= targetCrash) {
        // Crash
        setMultiplier(targetCrash);
        setGameState('crashed');
        setHistory(prev => [targetCrash, ...prev].slice(0, 10));
        if (!hasCashedOut) {
           processBetResult('loss');
        }
        setTimeout(() => {
          setGameState('betting');
        }, 5000);
        return;
      }
      
      setMultiplier(currentMulti);
      
      // Auto cashout logic
      if (!hasCashedOut && autoCashout > 1 && currentMulti >= autoCashout) {
         handleCashout(autoCashout);
      }
      
      drawChart(currentMulti);
      requestRef.current = requestAnimationFrame(animate);
    };
    
    requestRef.current = requestAnimationFrame(animate);
  };

  const handleCashout = (atMultiplier: number = multiplier) => {
    if (gameState !== 'playing' || hasCashedOut) return;
    setHasCashedOut(true);
    setProfit(betAmount * atMultiplier);
    processBetResult('win', atMultiplier);
  };

  const drawChart = (currentMulti: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw grid
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.beginPath();
    for (let i = 0; i < canvas.width; i += 50) {
      ctx.moveTo(i, 0); ctx.lineTo(i, canvas.height);
    }
    for (let i = 0; i < canvas.height; i += 50) {
      ctx.moveTo(0, i); ctx.lineTo(canvas.width, i);
    }
    ctx.stroke();

    // Draw curve
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, canvas.height);
    
    // Simulate curve progress based on multiplier
    const progress = Math.min(1, Math.log(currentMulti) / 3); // Scale up to roughly 20x for full width
    const x = canvas.width * progress;
    const y = canvas.height - (canvas.height * progress);
    
    ctx.quadraticCurveTo(x * 0.5, canvas.height, x, y);
    ctx.stroke();
    
    // Draw "rocket" dot
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#facc15';
  };

  useEffect(() => {
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  return (
    <div className="glass-card p-6 md:p-8 max-w-4xl mx-auto flex flex-col md:flex-row gap-8">
      
      {/* Sidebar Controls */}
      <div className="w-full md:w-80 flex flex-col gap-6">
        <div className="bg-jomish-dark-900 border border-jomish-gold-700 rounded-lg px-4 py-2 flex justify-between items-center">
          <span className="text-sm text-gray-400">Balance:</span>
          <span className="font-bold text-jomish-gold-400">
            UGX {profile?.balance_ugx?.toLocaleString() || 0}
          </span>
        </div>

        <div className="bg-jomish-dark-900 p-4 rounded-xl border border-gray-800 flex flex-col gap-4">
          <div>
            <label className="text-gray-400 text-sm mb-1 block">Bet Amount (UGX)</label>
            <input 
              type="number" 
              value={betAmount} 
              onChange={(e) => setBetAmount(Number(e.target.value))}
              disabled={gameState === 'playing'}
              className="jomish-input"
              min="100"
            />
          </div>
          <div>
            <label className="text-gray-400 text-sm mb-1 block">Auto Cashout (x)</label>
            <input 
              type="number" 
              value={autoCashout} 
              onChange={(e) => setAutoCashout(Number(e.target.value))}
              disabled={gameState === 'playing'}
              className="jomish-input"
              min="1.01"
              step="0.1"
            />
          </div>

          {gameState === 'betting' ? (
            <button onClick={startGame} className="btn-gold w-full py-4 text-lg mt-2">
              Place Bet
            </button>
          ) : gameState === 'playing' ? (
            <button 
              onClick={() => handleCashout()} 
              disabled={hasCashedOut}
              className={`w-full py-4 text-lg font-bold rounded-xl transition-all ${
                hasCashedOut ? 'bg-gray-700 text-gray-400' : 'bg-jomish-green-500 text-white hover:bg-jomish-green-400 shadow-[0_0_15px_rgba(34,197,94,0.5)]'
              }`}
            >
              {hasCashedOut ? 'Cashed Out' : `Cash Out (UGX ${Math.floor(betAmount * multiplier)})`}
            </button>
          ) : (
            <button disabled className="w-full py-4 text-lg font-bold rounded-xl bg-gray-800 text-gray-500">
              Next round starting...
            </button>
          )}
        </div>
        
        {/* History */}
        <div>
           <div className="text-sm text-gray-400 mb-2">Previous Crashes</div>
           <div className="flex flex-wrap gap-2">
             {history.map((h, i) => (
               <span key={i} className={`text-xs px-2 py-1 rounded font-bold ${h < 2 ? 'text-red-400 bg-red-400/10' : 'text-green-400 bg-green-400/10'}`}>
                 {h.toFixed(2)}x
               </span>
             ))}
           </div>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 flex flex-col relative bg-jomish-dark-950 rounded-xl overflow-hidden border border-gray-800">
        
        {/* Multiplier Display overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none">
          <div className={`text-6xl md:text-8xl font-black font-outfit tracking-tighter transition-colors ${
            gameState === 'crashed' ? 'text-red-500' : 'text-white'
          }`}>
            {multiplier.toFixed(2)}x
          </div>
          {gameState === 'crashed' && (
            <div className="text-red-500 font-bold text-xl mt-2 animate-pulse">CRASHED</div>
          )}
          {hasCashedOut && gameState === 'playing' && (
            <div className="text-green-400 font-bold text-xl mt-2 bg-green-400/10 px-4 py-1 rounded-full border border-green-400/30">
              Cashed Out: +UGX {profit.toLocaleString()}
            </div>
          )}
        </div>

        <canvas 
          ref={canvasRef} 
          width={800} 
          height={500} 
          className="w-full h-full min-h-[300px] object-cover"
        />
      </div>
    </div>
  );
}
