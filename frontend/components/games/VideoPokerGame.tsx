'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import Image from 'next/image';

interface Card {
  code: string;
  image: string;
  value: string;
  suit: string;
}

export default function VideoPokerGame() {
  const { profile, isAuthenticated } = useAuth();
  
  const [deckId, setDeckId] = useState<string | null>(null);
  const [hand, setHand] = useState<Card[]>([]);
  const [heldIndices, setHeldIndices] = useState<number[]>([]);
  const [gameState, setGameState] = useState<'betting' | 'drawing' | 'gameOver'>('betting');
  const [betAmount, setBetAmount] = useState(100);
  const [message, setMessage] = useState('Place your bet to start');
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastWin, setLastWin] = useState(0);

  // Jacks or Better paytable
  const paytable: Record<string, number> = {
    'Royal Flush': 250,
    'Straight Flush': 50,
    'Four of a Kind': 25,
    'Full House': 9,
    'Flush': 6,
    'Straight': 4,
    'Three of a Kind': 3,
    'Two Pair': 2,
    'Jacks or Better': 1
  };

  useEffect(() => {
    const initDeck = async () => {
      try {
        const res = await fetch('https://deckofcardsapi.com/api/deck/new/shuffle/?deck_count=1');
        const data = await res.json();
        setDeckId(data.deck_id);
      } catch (e) {
        console.error('Failed to initialize deck:', e);
      }
    };
    initDeck();
  }, []);

  const drawCards = async (count: number): Promise<Card[]> => {
    if (!deckId) return [];
    const res = await fetch(`https://deckofcardsapi.com/api/deck/${deckId}/draw/?count=${count}`);
    const data = await res.json();
    return data.cards;
  };

  const evaluateHand = (currentHand: Card[]): string | null => {
    // Simplified evaluation logic for Jacks or Better
    if (currentHand.length !== 5) return null;
    
    const values = currentHand.map(c => {
      if (c.value === 'JACK') return 11;
      if (c.value === 'QUEEN') return 12;
      if (c.value === 'KING') return 13;
      if (c.value === 'ACE') return 14;
      return parseInt(c.value);
    }).sort((a, b) => a - b);
    
    const suits = currentHand.map(c => c.suit);
    const isFlush = suits.every(s => s === suits[0]);
    
    // Check Straight (including low ace)
    let isStraight = true;
    for (let i = 1; i < 5; i++) {
      if (values[i] !== values[i-1] + 1) isStraight = false;
    }
    // Low ace straight check
    if (!isStraight && values[4] === 14 && values[0] === 2 && values[1] === 3 && values[2] === 4 && values[3] === 5) {
      isStraight = true;
    }

    if (isFlush && isStraight && values[4] === 14 && values[0] === 10) return 'Royal Flush';
    if (isFlush && isStraight) return 'Straight Flush';

    // Counts
    const counts: Record<number, number> = {};
    values.forEach(v => counts[v] = (counts[v] || 0) + 1);
    const countArr = Object.values(counts).sort((a, b) => b - a);

    if (countArr[0] === 4) return 'Four of a Kind';
    if (countArr[0] === 3 && countArr[1] === 2) return 'Full House';
    if (isFlush) return 'Flush';
    if (isStraight) return 'Straight';
    if (countArr[0] === 3) return 'Three of a Kind';
    if (countArr[0] === 2 && countArr[1] === 2) return 'Two Pair';
    
    // Jacks or Better
    let hasJacksOrBetter = false;
    for (const [val, count] of Object.entries(counts)) {
      if (count === 2 && parseInt(val) >= 11) hasJacksOrBetter = true;
    }
    if (hasJacksOrBetter) return 'Jacks or Better';

    return null;
  };

  const deal = async () => {
    if (!isAuthenticated) return alert('Please login to play');
    if (!profile || profile.balance_ugx < betAmount) return alert('Insufficient balance');

    setIsProcessing(true);
    setHeldIndices([]);
    setLastWin(0);

    try {
      // Re-shuffle deck
      await fetch(`https://deckofcardsapi.com/api/deck/${deckId}/shuffle/`);
      
      // Deduct bet
      await fetch('/api/bets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: profile.id,
          game_type: 'video_poker',
          bet_amount_ugx: betAmount,
          outcome_amount_ugx: 0,
          result: 'loss',
          game_data: { action: 'deal' }
        })
      });

      const newHand = await drawCards(5);
      setHand(newHand);
      setGameState('drawing');
      setMessage('Hold cards and Draw');
    } catch (e) {
      setMessage('Error dealing cards');
    } finally {
      setIsProcessing(false);
    }
  };

  const draw = async () => {
    setIsProcessing(true);
    try {
      const cardsNeeded = 5 - heldIndices.length;
      let finalHand = [...hand];
      
      if (cardsNeeded > 0) {
        const newCards = await drawCards(cardsNeeded);
        let newIdx = 0;
        finalHand = hand.map((card, i) => heldIndices.includes(i) ? card : newCards[newIdx++]);
      }
      
      setHand(finalHand);
      setGameState('gameOver');
      
      const winningHand = evaluateHand(finalHand);
      
      if (winningHand) {
        const multiplier = paytable[winningHand];
        const winAmount = betAmount * multiplier;
        setLastWin(winAmount);
        setMessage(`${winningHand}! You won UGX ${winAmount.toLocaleString()}!`);
        
        await fetch('/api/bets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: profile?.id,
            game_type: 'video_poker',
            bet_amount_ugx: 0,
            outcome_amount_ugx: winAmount,
            result: 'win',
            game_data: { finalHand, winningHand }
          })
        });
      } else {
        setMessage('Game Over. Try again!');
      }
    } catch (e) {
      setMessage('Error drawing cards');
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleHold = (index: number) => {
    if (gameState !== 'drawing') return;
    setHeldIndices(prev => 
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  return (
    <div className="glass-card p-6 md:p-8 max-w-4xl mx-auto flex flex-col items-center">
      <div className="w-full flex justify-between items-center mb-6">
        <h2 className="section-title text-2xl">Video Poker (Jacks or Better)</h2>
        <div className="bg-jomish-dark-900 border border-jomish-gold-700 rounded-lg px-4 py-2">
          <span className="text-sm text-gray-400">Balance:</span>
          <span className="ml-2 font-bold text-jomish-gold-400">
            UGX {profile?.balance_ugx?.toLocaleString() || 0}
          </span>
        </div>
      </div>

      {/* Paytable */}
      <div className="w-full mb-8 grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
        {Object.entries(paytable).map(([name, mult]) => (
          <div key={name} className={`flex justify-between p-2 rounded border ${message.includes(name) ? 'bg-green-600/30 border-green-500' : 'bg-jomish-dark-950 border-gray-800'}`}>
            <span className="text-gray-300">{name}</span>
            <span className="text-jomish-gold-400 font-bold">{mult}x</span>
          </div>
        ))}
      </div>

      {/* Message */}
      <div className={`mb-6 text-xl font-bold px-6 py-2 rounded-full ${lastWin > 0 ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-gray-800/80 text-white'}`}>
        {message}
      </div>

      {/* Hand */}
      <div className="flex justify-center gap-2 md:gap-4 mb-8">
        {hand.length > 0 ? hand.map((card, i) => (
          <div key={i} className="flex flex-col items-center cursor-pointer" onClick={() => toggleHold(i)}>
            <div className={`text-sm font-bold h-6 mb-1 ${heldIndices.includes(i) ? 'text-red-500' : 'text-transparent'}`}>HELD</div>
            <div className={`w-16 h-24 md:w-28 md:h-40 relative transform transition-transform ${heldIndices.includes(i) ? 'translate-y-2' : ''} ${gameState === 'drawing' ? 'hover:-translate-y-1' : ''}`}>
               <Image src={card.image} alt={card.code} fill className="object-contain drop-shadow-xl" />
            </div>
          </div>
        )) : (
          // Placeholders
          Array.from({length: 5}).map((_, i) => (
            <div key={i} className="flex flex-col items-center">
              <div className="h-6 mb-1"></div>
              <div className="w-16 h-24 md:w-28 md:h-40 border-2 border-dashed border-gray-600 rounded-lg flex items-center justify-center text-gray-500">?</div>
            </div>
          ))
        )}
      </div>

      {/* Controls */}
      <div className="w-full max-w-md bg-jomish-dark-900 p-4 rounded-xl border border-gray-800 flex flex-col gap-4">
        {gameState === 'betting' || gameState === 'gameOver' ? (
          <>
            <div className="flex items-center gap-4">
              <label className="text-gray-400 text-sm whitespace-nowrap">Bet Amount:</label>
              <input 
                type="number" 
                value={betAmount} 
                onChange={(e) => setBetAmount(Number(e.target.value))}
                className="jomish-input flex-1"
                min="100"
              />
            </div>
            <button onClick={deal} disabled={isProcessing || !deckId} className="btn-gold py-4 text-lg">
              {isProcessing ? 'Dealing...' : 'DEAL'}
            </button>
          </>
        ) : (
          <button onClick={draw} disabled={isProcessing} className="btn-gold py-4 text-lg bg-jomish-green-600 border-none">
            {isProcessing ? 'Drawing...' : 'DRAW'}
          </button>
        )}
      </div>
    </div>
  );
}
