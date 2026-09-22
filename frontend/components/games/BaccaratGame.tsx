'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import Image from 'next/image';

interface Card {
  code: string;
  image: string;
  value: string;
  suit: string;
}

export default function BaccaratGame() {
  const { profile, isAuthenticated } = useAuth();
  
  const [deckId, setDeckId] = useState<string | null>(null);
  const [playerHand, setPlayerHand] = useState<Card[]>([]);
  const [bankerHand, setBankerHand] = useState<Card[]>([]);
  const [gameState, setGameState] = useState<'betting' | 'dealing' | 'gameOver'>('betting');
  
  const [betAmount, setBetAmount] = useState(1000);
  const [betType, setBetType] = useState<'player' | 'banker' | 'tie'>('player');
  
  const [message, setMessage] = useState('Place your bet on Player, Banker or Tie');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const initDeck = async () => {
      try {
        const res = await fetch('https://deckofcardsapi.com/api/deck/new/shuffle/?deck_count=8');
        const data = await res.json();
        setDeckId(data.deck_id);
      } catch (e) {
        console.error('Failed to initialize deck:', e);
      }
    };
    initDeck();
  }, []);

  const getBaccaratValue = (card: Card) => {
    if (['10', 'JACK', 'QUEEN', 'KING'].includes(card.value)) return 0;
    if (card.value === 'ACE') return 1;
    return parseInt(card.value);
  };

  const calculateScore = (hand: Card[]) => {
    const sum = hand.reduce((acc, card) => acc + getBaccaratValue(card), 0);
    return sum % 10;
  };

  const drawCards = async (count: number): Promise<Card[]> => {
    if (!deckId) return [];
    const res = await fetch(`https://deckofcardsapi.com/api/deck/${deckId}/draw/?count=${count}`);
    const data = await res.json();
    return data.cards;
  };

  const deal = async () => {
    if (!isAuthenticated) return alert('Please login to play');
    if (!profile || profile.balance_ugx < betAmount) return alert('Insufficient balance');

    setIsProcessing(true);
    setGameState('dealing');
    setMessage('Dealing cards...');

    try {
      // Deduct bet
      await fetch('/api/bets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: profile.id,
          game_type: 'baccarat',
          bet_amount_ugx: betAmount,
          outcome_amount_ugx: 0,
          result: 'loss', // initial state
          game_data: { action: 'deal_start' }
        })
      });

      const cards = await drawCards(4);
      let pHand = [cards[0], cards[2]];
      let bHand = [cards[1], cards[3]];
      
      setPlayerHand(pHand);
      setBankerHand(bHand);

      let pScore = calculateScore(pHand);
      let bScore = calculateScore(bHand);

      // Third card rules
      if (pScore < 8 && bScore < 8) {
        // Player rule
        if (pScore <= 5) {
          const pThird = await drawCards(1);
          pHand = [...pHand, pThird[0]];
          pScore = calculateScore(pHand);
          setPlayerHand(pHand);
        }

        // Banker rule (simplified version: draws if score <= 5)
        if (bScore <= 5) {
           const bThird = await drawCards(1);
           bHand = [...bHand, bThird[0]];
           bScore = calculateScore(bHand);
           setBankerHand(bHand);
        }
      }

      setGameState('gameOver');

      // Determine winner
      let winner: 'player' | 'banker' | 'tie';
      if (pScore > bScore) winner = 'player';
      else if (bScore > pScore) winner = 'banker';
      else winner = 'tie';

      // Evaluate bet
      let won = false;
      let payout = 0;
      let multiplier = 0;

      if (betType === winner) {
        won = true;
        if (winner === 'player') multiplier = 2; // 1:1
        if (winner === 'banker') multiplier = 1.95; // 1:1 minus 5% commission
        if (winner === 'tie') multiplier = 9; // 8:1 payout
        payout = betAmount * multiplier;
      } else if (winner === 'tie' && betType !== 'tie') {
        // Push on tie if bet was on player/banker
        won = true;
        multiplier = 1;
        payout = betAmount;
      }

      const msg = winner === 'tie' ? `Tie (${pScore})!` : `${winner === 'player' ? 'Player' : 'Banker'} wins ${Math.max(pScore, bScore)} to ${Math.min(pScore, bScore)}!`;
      
      if (won && multiplier > 1) {
        setMessage(`${msg} You won UGX ${payout.toLocaleString()}!`);
      } else if (won && multiplier === 1) {
        setMessage(`${msg} Push (Tie) - Bet returned.`);
      } else {
        setMessage(`${msg} You lost.`);
      }

      if (won) {
        await fetch('/api/bets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: profile?.id,
            game_type: 'baccarat',
            bet_amount_ugx: 0,
            outcome_amount_ugx: payout,
            result: multiplier > 1 ? 'win' : 'push',
            game_data: { playerHand: pHand, bankerHand: bHand, winner }
          })
        });
      }

    } catch (e) {
      setMessage('Error dealing cards');
    } finally {
      setIsProcessing(false);
    }
  };

  const resetGame = () => {
    setPlayerHand([]);
    setBankerHand([]);
    setGameState('betting');
    setMessage('Place your bet');
  };

  return (
    <div className="glass-card p-6 md:p-8 max-w-4xl mx-auto flex flex-col items-center">
      <div className="w-full flex justify-between items-center mb-6">
        <h2 className="section-title text-2xl">Baccarat</h2>
        <div className="bg-jomish-dark-900 border border-jomish-gold-700 rounded-lg px-4 py-2">
          <span className="text-sm text-gray-400">Balance:</span>
          <span className="ml-2 font-bold text-jomish-gold-400">
            UGX {profile?.balance_ugx?.toLocaleString() || 0}
          </span>
        </div>
      </div>

      {/* Message Area */}
      <div className="my-6 text-center h-12 flex items-center justify-center">
        <div className={`text-xl font-bold px-6 py-2 rounded-full ${
          message.includes('won') ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
          message.includes('lost') ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
          'bg-gray-800/80 text-white'
        }`}>
          {message}
        </div>
      </div>

      {/* Hands Area */}
      <div className="w-full flex justify-around mb-8">
        
        {/* Player */}
        <div className="flex flex-col items-center">
          <div className="text-xl font-bold text-blue-400 mb-2">
            Player {playerHand.length > 0 && `(${calculateScore(playerHand)})`}
          </div>
          <div className="flex -space-x-8">
            {playerHand.length > 0 ? playerHand.map((card, i) => (
              <div key={i} className="w-20 h-28 md:w-28 md:h-40 relative transform hover:-translate-y-2 transition-transform duration-200">
                <Image src={card.image} alt={card.code} fill className="object-contain drop-shadow-xl" />
              </div>
            )) : (
              <div className="w-20 h-28 md:w-28 md:h-40 border-2 border-dashed border-gray-600 rounded-lg flex items-center justify-center text-gray-500">?</div>
            )}
          </div>
        </div>

        {/* Banker */}
        <div className="flex flex-col items-center">
          <div className="text-xl font-bold text-red-400 mb-2">
            Banker {bankerHand.length > 0 && `(${calculateScore(bankerHand)})`}
          </div>
          <div className="flex -space-x-8">
            {bankerHand.length > 0 ? bankerHand.map((card, i) => (
              <div key={i} className="w-20 h-28 md:w-28 md:h-40 relative transform hover:-translate-y-2 transition-transform duration-200">
                <Image src={card.image} alt={card.code} fill className="object-contain drop-shadow-xl" />
              </div>
            )) : (
              <div className="w-20 h-28 md:w-28 md:h-40 border-2 border-dashed border-gray-600 rounded-lg flex items-center justify-center text-gray-500">?</div>
            )}
          </div>
        </div>

      </div>

      {/* Controls */}
      <div className="w-full max-w-lg bg-jomish-dark-900 p-4 rounded-xl border border-gray-800">
        {gameState === 'gameOver' && (
          <button onClick={resetGame} className="btn-ghost w-full justify-center mb-4">
            New Game
          </button>
        )}
        
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <label className="text-gray-400 text-sm whitespace-nowrap">Bet Amount:</label>
            <input 
              type="number" 
              value={betAmount} 
              onChange={(e) => setBetAmount(Number(e.target.value))}
              className="jomish-input flex-1"
              min="100"
              disabled={gameState !== 'betting'}
            />
          </div>
          
          <div className="flex gap-2">
            {(['player', 'tie', 'banker'] as const).map(type => (
              <button 
                key={type}
                onClick={() => setBetType(type)}
                disabled={gameState !== 'betting'}
                className={`flex-1 py-3 text-sm font-bold uppercase rounded-lg border transition-colors ${
                  betType === type ? 'bg-jomish-gold-600 text-black border-jomish-gold-400' : 'bg-gray-800 text-gray-400 border-gray-700 hover:bg-gray-700'
                }`}
              >
                {type}
                <div className="text-[10px] opacity-70 normal-case">
                  {type === 'tie' ? '8:1' : type === 'banker' ? '1:0.95' : '1:1'}
                </div>
              </button>
            ))}
          </div>

          <button 
            onClick={deal} 
            disabled={isProcessing || !deckId || gameState !== 'betting'}
            className="btn-gold w-full py-4 text-lg mt-2"
          >
            {isProcessing ? 'Dealing...' : 'DEAL'}
          </button>
        </div>
      </div>
    </div>
  );
}
