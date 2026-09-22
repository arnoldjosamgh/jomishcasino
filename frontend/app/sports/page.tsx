'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useLanguage } from '@/lib/i18n/LanguageContext';

interface Outcome {
  name: string;
  price: number;
}

interface Match {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers: {
    markets: {
      key: string;
      outcomes: Outcome[];
    }[];
  }[];
}

interface BetSelection {
  matchId: string;
  matchTitle: string;
  selection: string;
  odds: number;
}

export default function SportsBetting() {
  const { profile, isAuthenticated } = useAuth();
  const { t } = useLanguage();
  
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('soccer_epl');
  const [betSlip, setBetSlip] = useState<BetSelection[]>([]);
  const [stake, setStake] = useState<number>(1000);
  const [isPlacingBet, setIsPlacingBet] = useState(false);
  const [message, setMessage] = useState<{type: 'success'|'error', text: string} | null>(null);

  const categories = [
    { id: 'soccer_epl', label: t('sports.football') + ' (EPL)' },
    { id: 'basketball_nba', label: t('sports.basketball') + ' (NBA)' },
    { id: 'mma_mixed_martial_arts', label: t('sports.mma') },
  ];

  useEffect(() => {
    const fetchOdds = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/odds?sport=${activeCategory}`);
        const data = await res.json();
        if (data.success) {
          setMatches(data.data);
        }
      } catch (e) {
        console.error('Failed to load odds', e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchOdds();
  }, [activeCategory]);

  const toggleSelection = (match: Match, outcome: Outcome) => {
    setBetSlip(prev => {
      // Check if already selected
      const existingIdx = prev.findIndex(s => s.matchId === match.id && s.selection === outcome.name);
      if (existingIdx >= 0) {
        // Remove it
        return prev.filter((_, i) => i !== existingIdx);
      }
      
      // Remove other selections from same match (single selection per match for accumulator)
      const filtered = prev.filter(s => s.matchId !== match.id);
      
      return [...filtered, {
        matchId: match.id,
        matchTitle: `${match.home_team} vs ${match.away_team}`,
        selection: outcome.name,
        odds: outcome.price
      }];
    });
  };

  const totalOdds = betSlip.reduce((acc, bet) => acc * bet.odds, 1);
  const potentialPayout = betSlip.length > 0 ? stake * totalOdds : 0;

  const placeBet = async () => {
    if (!isAuthenticated) return alert('Please login to place bets');
    if (!profile || profile.balance_ugx < stake) return alert('Insufficient balance');
    if (betSlip.length === 0) return;

    setIsPlacingBet(true);
    setMessage(null);

    try {
      // Place bet via API
      // Since this is an accumulator, we record one big bet
      const response = await fetch('/api/bets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: profile.id,
          game_type: 'sports',
          bet_amount_ugx: stake,
          outcome_amount_ugx: 0, // 0 until resolved
          result: 'pending',
          game_data: {
            selections: betSlip,
            totalOdds,
            potentialPayout
          }
        })
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Bet placed successfully!' });
        setBetSlip([]);
      } else {
        const err = await response.json();
        setMessage({ type: 'error', text: err.error || 'Failed to place bet' });
      }
    } catch (e) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setIsPlacingBet(false);
    }
  };

  const removeSelection = (matchId: string) => {
    setBetSlip(prev => prev.filter(s => s.matchId !== matchId));
  };

  return (
    <div className="container-jomish py-8 flex flex-col lg:flex-row gap-8 relative min-h-screen">
      
      {/* Main Odds Area */}
      <div className="flex-1">
        <h1 className="text-3xl font-black font-outfit mb-6 text-white">{t('sports.place_bet')}</h1>
        
        {/* Categories */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {categories.map(cat => (
             <button 
               key={cat.id}
               onClick={() => setActiveCategory(cat.id)}
               className={`px-5 py-2 rounded-full font-bold whitespace-nowrap transition-colors ${
                 activeCategory === cat.id ? 'bg-jomish-gold-500 text-black' : 'bg-jomish-dark-900 text-gray-400 border border-gray-800'
               }`}
             >
               {cat.label}
             </button>
          ))}
        </div>

        {/* Odds List */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="w-12 h-12 border-4 border-jomish-green-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : matches.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            No active matches found for this category right now.
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {matches.map(match => {
              const market = match.bookmakers[0]?.markets[0];
              if (!market) return null;

              return (
                <div key={match.id} className="bg-jomish-dark-900 border border-gray-800 rounded-xl p-4 md:p-6 transition-colors hover:border-gray-700">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="text-jomish-green-400 text-xs font-bold mb-1 uppercase tracking-wider">{match.sport_title}</div>
                      <div className="text-lg font-bold text-white">{match.home_team} vs {match.away_team}</div>
                    </div>
                    <div className="text-sm text-gray-500 bg-black/30 px-3 py-1 rounded-full">
                      {new Date(match.commence_time).toLocaleDateString()} {new Date(match.commence_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {market.outcomes.map(outcome => {
                      const isSelected = betSlip.some(s => s.matchId === match.id && s.selection === outcome.name);
                      return (
                        <button
                          key={outcome.name}
                          onClick={() => toggleSelection(match, outcome)}
                          className={`flex justify-between items-center p-3 rounded-lg border transition-all ${
                            isSelected 
                              ? 'bg-jomish-green-600 border-jomish-green-400 text-white shadow-[0_0_10px_rgba(34,197,94,0.3)]' 
                              : 'bg-jomish-dark-950 border-gray-800 text-gray-300 hover:border-gray-600'
                          }`}
                        >
                          <span className="font-medium truncate mr-2">{outcome.name}</span>
                          <span className={isSelected ? 'font-bold text-white' : 'font-bold text-jomish-gold-400'}>
                            {outcome.price.toFixed(2)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Bet Slip Sidebar */}
      <div className="w-full lg:w-96 flex-shrink-0">
        <div className="bg-jomish-dark-900 border border-jomish-gold-700/50 rounded-2xl overflow-hidden sticky top-[100px]">
          
          <div className="bg-gradient-to-r from-jomish-green-700 to-jomish-green-900 p-4 border-b border-gray-800 flex justify-between items-center">
            <h3 className="font-bold font-outfit text-white text-lg">{t('sports.bet_slip')}</h3>
            <span className="bg-black/40 text-jomish-gold-400 text-xs font-bold px-2 py-1 rounded-full">
              {betSlip.length} {betSlip.length === 1 ? 'Selection' : 'Selections'}
            </span>
          </div>

          <div className="p-4 flex flex-col gap-4 max-h-[50vh] overflow-y-auto custom-scrollbar">
            {betSlip.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                Your bet slip is empty.<br/>Click on odds to add selections.
              </div>
            ) : (
              betSlip.map(bet => (
                <div key={bet.matchId} className="bg-jomish-dark-950 p-3 rounded-lg border border-gray-800 relative group">
                  <button 
                    onClick={() => removeSelection(bet.matchId)}
                    className="absolute top-2 right-2 text-gray-600 hover:text-red-500 transition-colors"
                  >✕</button>
                  <div className="text-xs text-gray-400 mb-1 pr-6 truncate">{bet.matchTitle}</div>
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-white">{bet.selection}</span>
                    <span className="text-jomish-gold-400 font-bold">{bet.odds.toFixed(2)}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {betSlip.length > 0 && (
            <div className="p-4 border-t border-gray-800 bg-black/40">
              
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-400 text-sm">Total {t('sports.odds')}</span>
                <span className="font-bold text-white text-lg">{totalOdds.toFixed(2)}</span>
              </div>
              
              <div className="mb-4">
                <label className="text-gray-400 text-sm mb-1 block">{t('sports.stake')}</label>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 font-bold">UGX</span>
                  <input 
                    type="number" 
                    value={stake}
                    onChange={(e) => setStake(Number(e.target.value))}
                    className="jomish-input flex-1 !bg-jomish-dark-950"
                    min="100"
                  />
                </div>
              </div>

              <div className="flex justify-between items-center mb-4 p-3 bg-green-900/20 border border-green-500/20 rounded-lg">
                <span className="text-gray-300 font-medium">{t('sports.potential_win')}</span>
                <span className="font-bold text-jomish-green-400 text-lg">UGX {potentialPayout.toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
              </div>

              {message && (
                <div className={`mb-4 p-3 rounded-lg text-sm font-bold text-center ${message.type === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                  {message.text}
                </div>
              )}

              <button 
                onClick={placeBet}
                disabled={isPlacingBet}
                className="btn-gold w-full py-4 font-black shadow-[0_0_15px_rgba(234,179,8,0.2)]"
              >
                {isPlacingBet ? 'Processing...' : t('sports.place_bet')}
              </button>
            </div>
          )}

        </div>
      </div>

    </div>
  );
}
