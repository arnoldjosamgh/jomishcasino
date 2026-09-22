'use client';

import Link from 'next/link';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { useEffect, useState } from 'react';

interface Game {
  uuid: string;
  title: string;
  provider: { title: string };
  type: string;
  thumb: { url: string };
  iframe_url?: string;
  rtp?: string;
}

export default function HomePage() {
  const { t } = useLanguage();
  const [jackpot, setJackpot] = useState(158402500);
  const [featuredGames, setFeaturedGames] = useState<Game[]>([]);
  const [gamesLoading, setGamesLoading] = useState(true);

  // Jackpot ticker
  useEffect(() => {
    const interval = setInterval(() => {
      setJackpot(prev => prev + Math.floor(Math.random() * 5000));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Fetch featured games from SlotsLaunch API
  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const res = await fetch('/api/casino-games?per_page=8&page=1');
        const data = await res.json();
        if (data.success) setFeaturedGames(data.data.slice(0, 8));
      } catch (e) {
        console.error('Failed to load featured games');
      } finally {
        setGamesLoading(false);
      }
    };
    fetchFeatured();
  }, []);

  const getGameUrl = (game: Game) =>
    `/games/play/${game.uuid}?title=${encodeURIComponent(game.title)}&provider=${encodeURIComponent(game.provider.title)}&iframe=${encodeURIComponent(game.iframe_url || '')}`;

  return (
    <div className="flex flex-col min-h-screen">

      {/* ===== HERO ===== */}
      <section className="relative pt-24 pb-32 overflow-hidden flex-shrink-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-jomish-green-900 via-jomish-dark-950 to-jomish-dark-950 -z-10"></div>
        <div className="absolute top-16 right-[8%] w-72 h-72 bg-jomish-green-500/20 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-0 left-[8%] w-96 h-96 bg-jomish-gold-500/10 rounded-full blur-[140px] animate-pulse" style={{ animationDelay: '2s' }}></div>

        <div className="container-jomish relative z-10 flex flex-col items-center text-center">
          <div className="inline-block mb-6 px-6 py-2 rounded-full bg-jomish-dark-900 border border-jomish-gold-700/50 text-jomish-gold-400 font-bold text-sm tracking-widest uppercase shadow-[0_0_15px_rgba(234,179,8,0.15)]">
            {t('home.welcome_bonus')}
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black font-outfit mb-6 tracking-tight leading-none">
            <span className="text-white">{t('home.hero_title')}</span>
          </h1>

          <p className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto mb-10 leading-relaxed">
            {t('home.hero_sub')}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <Link href="/register" className="btn-gold text-lg px-12 py-4 shadow-[0_0_30px_rgba(234,179,8,0.2)]">
              🎮 {t('home.hero_cta')}
            </Link>
            <Link href="/games" className="btn-ghost text-lg px-12 py-4 border-2">
              Browse Games
            </Link>
          </div>

          {/* Stats Row */}
          <div className="flex gap-8 mt-16 flex-wrap justify-center">
            {[
              { value: '5,000+', label: 'Casino Games' },
              { value: 'MTN / Airtel', label: 'Instant Deposits' },
              { value: 'UGX', label: 'Primary Currency' },
              { value: '3 Languages', label: 'EN / SW / LG' },
            ].map(stat => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl md:text-3xl font-black font-outfit text-jomish-gold-400">{stat.value}</div>
                <div className="text-gray-500 text-sm mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== JACKPOT TICKER ===== */}
      <section className="border-y border-jomish-gold-800 bg-jomish-dark-900 py-5 relative overflow-hidden flex-shrink-0">
        <div className="absolute inset-0 bg-gradient-to-r from-jomish-gold-900/20 via-transparent to-jomish-gold-900/20"></div>
        <div className="container-jomish flex flex-col md:flex-row items-center justify-between relative z-10 gap-2">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🏆</span>
            <h2 className="text-lg font-bold text-jomish-gold-400 uppercase tracking-widest">{t('home.jackpot_label')}</h2>
          </div>
          <div className="text-4xl md:text-5xl font-black font-outfit text-white tracking-tighter drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">
            UGX {jackpot.toLocaleString()}
          </div>
          <Link href="/games" className="btn-gold text-sm py-2 px-6">Play Now</Link>
        </div>
      </section>

      {/* ===== FEATURED GAMES (from SlotsLaunch API) ===== */}
      <section className="py-20 flex-shrink-0">
        <div className="container-jomish">
          <div className="flex justify-between items-end mb-8">
            <div>
              <h2 className="section-title">Popular Games</h2>
              <p className="text-gray-400">Top picks from 5,000+ casino games</p>
            </div>
            <Link href="/games" className="text-jomish-green-400 hover:text-jomish-green-300 font-bold transition-colors">
              View All →
            </Link>
          </div>

          {gamesLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="aspect-[3/4] bg-jomish-dark-900 rounded-xl animate-pulse border border-gray-800"></div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {featuredGames.map(game => (
                <Link key={game.uuid} href={getGameUrl(game)} className="group block">
                  <div
                    className="relative rounded-xl overflow-hidden border border-gray-800 transition-all duration-300 group-hover:border-jomish-gold-500/50 group-hover:-translate-y-1"
                    style={{ aspectRatio: '3/4' }}
                  >
                    {game.thumb?.url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={game.thumb.url} alt={game.title} className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-jomish-dark-900 to-black flex items-center justify-center text-5xl">
                        🎰
                      </div>
                    )}
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-all duration-300 flex items-center justify-center">
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity px-4 py-2 rounded-full font-bold text-sm text-black" style={{ background: 'linear-gradient(135deg,#eab308,#fde047)' }}>
                        🎮 Play Free
                      </span>
                    </div>
                    {/* Bottom info */}
                    <div className="absolute bottom-0 left-0 right-0 p-3" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.95), transparent)' }}>
                      <div className="text-white font-bold text-sm truncate">{game.title}</div>
                      <div className="text-gray-400 text-xs">{game.provider.title}</div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          <div className="text-center mt-8">
            <Link href="/games" className="btn-ghost inline-block px-10 py-3">
              Browse All 5,000+ Games →
            </Link>
          </div>
        </div>
      </section>

      {/* ===== CATEGORIES ===== */}
      <section className="py-16 bg-jomish-dark-900 border-y border-gray-800 flex-shrink-0">
        <div className="container-jomish">
          <h2 className="section-title mb-8">Game Categories</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { emoji: '🎰', title: 'Slots', desc: '4,000+ slot games', href: '/games?type=slots', color: 'from-purple-900/40 to-black' },
              { emoji: '🃏', title: 'Table Games', desc: 'Blackjack, Roulette, Baccarat', href: '/games?type=table', color: 'from-blue-900/40 to-black' },
              { emoji: '♠️', title: 'Video Poker', desc: 'Jacks or Better & more', href: '/games?type=video_poker', color: 'from-red-900/40 to-black' },
              { emoji: '⚽', title: 'Sports Betting', desc: 'Live odds on top leagues', href: '/sports', color: 'from-green-900/40 to-black' },
            ].map(cat => (
              <Link key={cat.title} href={cat.href} className="group block">
                <div className={`bg-gradient-to-br ${cat.color} border border-gray-800 rounded-2xl p-6 text-center h-full transition-all duration-300 group-hover:border-jomish-gold-500/40 group-hover:-translate-y-1`}>
                  <div className="text-5xl mb-3">{cat.emoji}</div>
                  <div className="font-bold text-white text-lg mb-1">{cat.title}</div>
                  <div className="text-gray-400 text-sm">{cat.desc}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ===== SPORTS BETTING PREVIEW ===== */}
      <section className="py-20 flex-shrink-0">
        <div className="container-jomish">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="flex-1">
              <h2 className="text-4xl md:text-5xl font-black font-outfit mb-4 text-white">
                Live <span className="text-jomish-green-400">Sports Betting</span>
              </h2>
              <p className="text-gray-400 text-lg mb-8 leading-relaxed">
                Get the best odds on Premier League, Champions League, NBA, and more. Instant payouts with MTN & Airtel Money.
              </p>
              <ul className="flex flex-col gap-3 mb-8">
                {['Industry-leading odds powered by The Odds API', 'Live in-play betting across all major sports', 'Instant UGX cashouts via Mobile Money'].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-gray-300">
                    <span className="w-5 h-5 flex-shrink-0 rounded-full bg-jomish-green-500/20 text-jomish-green-400 flex items-center justify-center font-bold text-xs">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/sports" className="btn-gold inline-block px-10 py-4 shadow-[0_0_20px_rgba(234,179,8,0.15)]">
                Bet on Sports
              </Link>
            </div>
            <div className="flex-1 w-full">
              <div className="aspect-video bg-gradient-to-br from-jomish-green-900 to-black rounded-2xl border border-gray-800 p-6 relative overflow-hidden shadow-2xl">
                <div className="absolute top-4 right-4 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full animate-pulse">LIVE</div>
                <div className="h-full flex flex-col justify-center gap-3 relative z-10">
                  {[
                    { team: 'Arsenal', odds: '2.10' },
                    { team: 'Draw', odds: '3.40' },
                    { team: 'Chelsea', odds: '3.20' },
                  ].map(({ team, odds }) => (
                    <div key={team} className="bg-black/40 p-3 rounded-xl border border-gray-800 flex justify-between items-center backdrop-blur-sm">
                      <span className="font-bold text-white">{team}</span>
                      <span className="text-jomish-gold-400 font-black text-lg">{odds}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== PAYMENT METHODS ===== */}
      <section className="py-16 bg-jomish-dark-900 border-t border-gray-800 flex-shrink-0">
        <div className="container-jomish text-center">
          <h2 className="section-title mb-2">Easy Deposits & Withdrawals</h2>
          <p className="text-gray-400 mb-8">Instant transactions in Ugandan Shillings</p>
          <div className="flex justify-center gap-6 flex-wrap">
            {[
              { label: 'MTN Mobile Money', color: '#FFCC00', emoji: '📱' },
              { label: 'Airtel Money', color: '#FF0000', emoji: '📲' },
              { label: 'Visa / Mastercard', color: '#1a56db', emoji: '💳' },
            ].map(method => (
              <div key={method.label}
                className="flex items-center gap-3 px-6 py-3 rounded-xl border border-gray-800 bg-jomish-dark-950"
                style={{ borderColor: `${method.color}30` }}
              >
                <span className="text-2xl">{method.emoji}</span>
                <span className="font-bold text-white text-sm">{method.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
