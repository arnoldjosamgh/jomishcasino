'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import Image from 'next/image';

interface Card {
  code: string;
  image: string;
  images: { svg: string; png: string };
  value: string;
  suit: string;
}

export default function BlackjackGame() {
  const { profile, isAuthenticated, token } = useAuth();
  
  const [deckId, setDeckId] = useState<string | null>(null);
  const [playerHand, setPlayerHand] = useState<Card[]>([]);
  const [dealerHand, setDealerHand] = useState<Card[]>([]);
  const [gameState, setGameState] = useState<'betting' | 'playing' | 'dealerTurn' | 'gameOver'>('betting');
  const [betAmount, setBetAmount] = useState(1000);
  const [message, setMessage] = useState('Place your bet to start');
  const [isProcessing, setIsProcessing] = useState(false);

  // Initialize deck on mount
  useEffect(() => {
    const initDeck = async () => {
      try {
        const res = await fetch('https://deckofcardsapi.com/api/deck/new/shuffle/?deck_count=6');
        const data = await res.json();
        setDeckId(data.deck_id);
      } catch (e) {
        console.error('Failed to initialize deck:', e);
        setMessage('Failed to load game. Please refresh.');
      }
    };
    initDeck();
  }, []);

  const calculateScore = (hand: Card[]) => {
    let score = 0;
    let aces = 0;

    for (const card of hand) {
      if (['JACK', 'QUEEN', 'KING'].includes(card.value)) {
        score += 10;
      } else if (card.value === 'ACE') {
        aces += 1;
        score += 11;
      } else {
        score += parseInt(card.value);
      }
    }

    while (score > 21 && aces > 0) {
      score -= 10;
      aces -= 1;
    }

    return score;
  };

  const drawCards = async (count: number): Promise<Card[]> => {
    if (!deckId) return [];
    const res = await fetch(`https://deckofcardsapi.com/api/deck/${deckId}/draw/?count=${count}`);
    const data = await res.json();
    return data.cards;
  };

  const processBetResult = async (result: 'win' | 'loss' | 'push', multiplier: number = 1) => {
    if (!profile) return;
    
    const outcomeAmount = result === 'win' ? betAmount + (betAmount * multiplier) : (result === 'push' ? betAmount : 0);
    
    try {
      await fetch('/api/bets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: profile.id,
          game_type: 'blackjack',
          bet_amount_ugx: betAmount,
          outcome_amount_ugx: outcomeAmount,
          result,
          game_data: { playerHand, dealerHand }
        })
      });
      // Optionally trigger balance refresh here
    } catch (e) {
      console.error('Failed to process bet result:', e);
    }
  };

  const startGame = async () => {
    if (!isAuthenticated || !profile) {
      setMessage('Please login to play');
      return;
    }
    
    if (profile.balance_ugx < betAmount) {
      setMessage('Insufficient balance');
      return;
    }

    setIsProcessing(true);
    try {
      const cards = await drawCards(4);
      const newPlayerHand = [cards[0], cards[2]];
      const newDealerHand = [cards[1], cards[3]];
      
      setPlayerHand(newPlayerHand);
      setDealerHand(newDealerHand);
      
      const playerScore = calculateScore(newPlayerHand);
      
      if (playerScore === 21) {
        setGameState('gameOver');
        setMessage('Blackjack! You win!');
        await processBetResult('win', 1.5); // 3:2 payout for blackjack
      } else {
        setGameState('playing');
        setMessage('Your turn: Hit or Stand');
      }
    } catch (e) {
      setMessage('Error dealing cards');
    } finally {
      setIsProcessing(false);
    }
  };

  const hit = async () => {
    setIsProcessing(true);
    try {
      const cards = await drawCards(1);
      const newHand = [...playerHand, cards[0]];
      setPlayerHand(newHand);
      
      const score = calculateScore(newHand);
      if (score > 21) {
        setGameState('gameOver');
        setMessage('Bust! You lose.');
        await processBetResult('loss');
      }
    } catch (e) {
      setMessage('Error drawing card');
    } finally {
      setIsProcessing(false);
    }
  };

  const playDealerTurn = useCallback(async () => {
    setGameState('dealerTurn');
    let currentDealerHand = [...dealerHand];
    let dealerScore = calculateScore(currentDealerHand);
    const playerScore = calculateScore(playerHand);

    setIsProcessing(true);
    
    try {
      while (dealerScore < 17) {
        // Small delay for dramatic effect
        await new Promise(resolve => setTimeout(resolve, 800));
        const cards = await drawCards(1);
        currentDealerHand = [...currentDealerHand, cards[0]];
        setDealerHand(currentDealerHand);
        dealerScore = calculateScore(currentDealerHand);
      }

      setGameState('gameOver');
      
      if (dealerScore > 21) {
        setMessage('Dealer busts! You win!');
        await processBetResult('win');
      } else if (dealerScore > playerScore) {
        setMessage('Dealer wins.');
        await processBetResult('loss');
      } else if (dealerScore < playerScore) {
        setMessage('You win!');
        await processBetResult('win');
      } else {
        setMessage('Push (Tie).');
        await processBetResult('push');
      }
    } catch (e) {
      setMessage('Error during dealer turn');
    } finally {
      setIsProcessing(false);
    }
  }, [dealerHand, playerHand]);

  const stand = () => {
    playDealerTurn();
  };

  const resetGame = () => {
    setPlayerHand([]);
    setDealerHand([]);
    setGameState('betting');
    setMessage('Place your bet');
  };

  return (
    <div className="glass-card p-6 md:p-8 max-w-4xl mx-auto flex flex-col items-center">
      <div className="w-full flex justify-between items-center mb-6">
        <h2 className="section-title text-2xl">Blackjack</h2>
        <div className="bg-jomish-dark-900 border border-jomish-gold-700 rounded-lg px-4 py-2">
          <span className="text-sm text-gray-400">Balance:</span>
          <span className="ml-2 font-bold text-jomish-gold-400">
            UGX {profile?.balance_ugx?.toLocaleString() || 0}
          </span>
        </div>
      </div>

      {/* Dealer Area */}
      <div className="w-full min-h-[200px] mb-8 relative flex flex-col items-center">
        <div className="text-gray-400 mb-2 font-semibold">
          Dealer {gameState !== 'betting' && gameState !== 'playing' ? `(${calculateScore(dealerHand)})` : ''}
        </div>
        <div className="flex justify-center -space-x-12">
          {dealerHand.map((card, idx) => (
            <div key={idx} className="w-24 h-36 md:w-32 md:h-48 relative transform hover:-translate-y-2 transition-transform duration-200" style={{ zIndex: idx }}>
              {/* Hide dealer's second card during player turn */}
              {gameState === 'playing' && idx === 1 ? (
                <div className="w-full h-full bg-blue-900 border-2 border-white rounded-lg bg-[url('https://deckofcardsapi.com/static/img/back.png')] bg-cover" />
              ) : (
                <Image src={card.image} alt={card.code} fill className="object-contain drop-shadow-xl" />
              )}
            </div>
          ))}
          {dealerHand.length === 0 && (
             <div className="w-24 h-36 md:w-32 md:h-48 border-2 border-dashed border-gray-600 rounded-lg flex items-center justify-center text-gray-500">?</div>
          )}
        </div>
      </div>

      {/* Message Area */}
      <div className="my-6 text-center h-12 flex items-center justify-center">
        <div className={`text-xl font-bold px-6 py-2 rounded-full ${
          message.includes('win') ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
          message.includes('lose') || message.includes('Bust') ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
          'bg-gray-800/80 text-white'
        }`}>
          {message}
        </div>
      </div>

      {/* Player Area */}
      <div className="w-full min-h-[200px] mb-8 relative flex flex-col items-center">
        <div className="text-gray-400 mb-2 font-semibold">
          You {playerHand.length > 0 ? `(${calculateScore(playerHand)})` : ''}
        </div>
        <div className="flex justify-center -space-x-12">
          {playerHand.map((card, idx) => (
            <div key={idx} className="w-24 h-36 md:w-32 md:h-48 relative transform hover:-translate-y-2 transition-transform duration-200" style={{ zIndex: idx }}>
              <Image src={card.image} alt={card.code} fill className="object-contain drop-shadow-xl" />
            </div>
          ))}
          {playerHand.length === 0 && (
             <div className="w-24 h-36 md:w-32 md:h-48 border-2 border-dashed border-gray-600 rounded-lg flex items-center justify-center text-gray-500">?</div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="w-full max-w-md bg-jomish-dark-900 p-4 rounded-xl border border-gray-800">
        {gameState === 'betting' || gameState === 'gameOver' ? (
          <div className="flex flex-col gap-4">
             {gameState === 'gameOver' && (
                <button onClick={resetGame} className="btn-ghost w-full justify-center mb-2">
                  New Game
                </button>
             )}
            <div className="flex items-center gap-4">
              <label className="text-gray-400 text-sm whitespace-nowrap">Bet Amount:</label>
              <input 
                type="number" 
                value={betAmount} 
                onChange={(e) => setBetAmount(Number(e.target.value))}
                className="jomish-input flex-1"
                min="100"
                step="100"
              />
            </div>
            <div className="flex gap-2">
              {[500, 1000, 5000, 10000].map(amt => (
                <button key={amt} onClick={() => setBetAmount(amt)} className="btn-ghost flex-1 py-1 text-xs">
                  {amt}
                </button>
              ))}
            </div>
            <button 
              onClick={startGame} 
              disabled={isProcessing || !deckId}
              className="btn-gold w-full mt-2"
            >
              {isProcessing ? 'Dealing...' : `Deal (UGX ${betAmount})`}
            </button>
          </div>
        ) : (
          <div className="flex gap-4">
            <button 
              onClick={hit} 
              disabled={gameState !== 'playing' || isProcessing}
              className="flex-1 bg-jomish-green-600 hover:bg-jomish-green-500 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50"
            >
              Hit
            </button>
            <button 
              onClick={stand} 
              disabled={gameState !== 'playing' || isProcessing}
              className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50"
            >
              Stand
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
