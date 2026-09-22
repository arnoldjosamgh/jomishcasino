'use client';

import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/lib/auth-context';

export default function PlinkoGame() {
  const { profile, isAuthenticated } = useAuth();
  const [betAmount, setBetAmount] = useState(1000);
  const [risk, setRisk] = useState<'low' | 'medium' | 'high'>('medium');
  const [isDropping, setIsDropping] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Plinko config
  const rows = 12;
  const multipliers = {
    low:    [5.6, 2.1, 1.1, 1, 0.5, 0.5, 0.5, 1, 1.1, 2.1, 5.6],
    medium: [14, 3, 1.5, 1, 0.2, 0.2, 0.2, 1, 1.5, 3, 14],
    high:   [40, 7, 2, 0.2, 0, 0, 0, 0.2, 2, 7, 40]
  };

  const dropBall = async () => {
    if (!isAuthenticated) return alert('Please login to play');
    if (!profile || profile.balance_ugx < betAmount) return alert('Insufficient balance');
    
    setIsDropping(true);
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Simulate physics drop
    const startX = canvas.width / 2;
    const startY = 40;
    const pegSpacingY = (canvas.height - 100) / rows;
    
    let currentX = startX;
    let currentY = startY;
    let pathIndex = 0; // tracks left/right distribution
    
    // Provably fair generation (simulated)
    // We generate 12 decisions (left or right)
    let path = 0;
    const decisions = Array.from({length: rows}, () => {
      const isRight = Math.random() > 0.5;
      if (isRight) path++;
      return isRight;
    });

    // We know the final bucket index will be exactly 'path'
    const finalMultiplier = multipliers[risk][path];

    const animateDrop = (step: number) => {
      if (step > rows) {
        // Drop finished
        processResult(finalMultiplier);
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawBoard(ctx, canvas);

      // Interpolate position
      if (step > 0) {
        const isRight = decisions[step - 1];
        const pegSpacingX = 40;
        const targetX = startX + ((isRight ? 1 : -1) * (step * pegSpacingX / 2));
        const targetY = startY + (step * pegSpacingY);
        
        // Draw falling ball
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.arc(targetX, targetY, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#facc15';
      }

      setTimeout(() => animateDrop(step + 1), 150);
    };

    animateDrop(0);
  };

  const processResult = async (multiplier: number) => {
    if (!profile) return;
    
    const potentialWin = betAmount * multiplier;
    const result = multiplier > 1 ? 'win' : 'loss';
    
    try {
      await fetch('/api/bets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: profile.id,
          game_type: 'plinko',
          bet_amount_ugx: betAmount,
          outcome_amount_ugx: potentialWin,
          result,
          game_data: { risk, multiplier }
        })
      });
    } catch (e) {
      console.error('Failed to process bet result:', e);
    } finally {
      setIsDropping(false);
    }
  };

  const drawBoard = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    // Draw Pegs
    ctx.fillStyle = '#cbd5e1';
    ctx.shadowBlur = 0;
    const pegSpacingY = (canvas.height - 100) / rows;
    const pegSpacingX = 40;
    
    for (let row = 1; row <= rows; row++) {
      const pegsInRow = row + 1;
      const startX = (canvas.width / 2) - ((pegsInRow - 1) * pegSpacingX / 2);
      
      for (let col = 0; col < pegsInRow; col++) {
        ctx.beginPath();
        ctx.arc(startX + (col * pegSpacingX), 40 + (row * pegSpacingY), 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Draw Buckets (Multipliers)
    const activeMultipliers = multipliers[risk];
    const bucketY = canvas.height - 20;
    const bucketWidth = pegSpacingX;
    const totalWidth = activeMultipliers.length * bucketWidth;
    let bStartX = (canvas.width / 2) - (totalWidth / 2);

    ctx.font = '12px Outfit';
    ctx.textAlign = 'center';
    
    activeMultipliers.forEach((multi, i) => {
      // Color scale based on multiplier
      ctx.fillStyle = multi > 1 ? '#22c55e' : (multi === 1 ? '#64748b' : '#ef4444');
      ctx.fillRect(bStartX + (i * bucketWidth) + 2, canvas.height - 40, bucketWidth - 4, 30);
      
      ctx.fillStyle = '#0f172a';
      ctx.fillText(`${multi}x`, bStartX + (i * bucketWidth) + (bucketWidth/2), canvas.height - 20);
    });
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) drawBoard(ctx, canvas);
    }
  }, [risk]); // Redraw on risk change

  return (
    <div className="glass-card p-6 md:p-8 max-w-5xl mx-auto flex flex-col md:flex-row gap-8">
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
              disabled={isDropping}
              className="jomish-input"
              min="100"
            />
          </div>
          
          <div>
            <label className="text-gray-400 text-sm mb-1 block">Risk Level</label>
            <div className="flex gap-2">
              {(['low', 'medium', 'high'] as const).map(r => (
                <button
                  key={r}
                  disabled={isDropping}
                  onClick={() => setRisk(r)}
                  className={`flex-1 py-2 text-sm font-bold capitalize rounded-lg border ${
                    risk === r ? 'bg-jomish-green-600 text-white border-jomish-green-400' : 'bg-gray-800 text-gray-400 border-gray-700'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <button 
            onClick={dropBall} 
            disabled={isDropping}
            className="btn-gold w-full py-4 text-lg mt-2"
          >
            {isDropping ? 'Dropping...' : 'Play'}
          </button>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 flex items-center justify-center bg-jomish-dark-950 rounded-xl overflow-hidden border border-gray-800 py-8">
        <canvas 
          ref={canvasRef} 
          width={600} 
          height={500} 
          className="max-w-full"
        />
      </div>
    </div>
  );
}
