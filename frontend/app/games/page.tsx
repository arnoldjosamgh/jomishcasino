'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

interface Game {
  uuid: string;
  title: string;
  provider: { title: string };
  type: string;
  has_demo: boolean;
  thumb: { url: string };
  iframe_url?: string;
  rtp?: string;
}

interface Meta {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
}

const CATEGORIES = [
  { id: 'all', label: '🎮 All Games' },
  { id: 'slots', label: '🎰 Slots' },
  { id: 'table', label: '🃏 Table Games' },
  { id: 'video_poker', label: '♠️ Video Poker' },
  { id: 'live', label: '🎥 Live Casino' },
  { id: 'jackpot', label: '💰 Jackpots' },
  { id: 'crash', label: '🚀 Crash' },
];

const PROVIDERS = ['All Providers', 'Pragmatic Play', "Play'n GO", 'NetEnt', 'Microgaming', 'Evolution', 'Hacksaw Gaming', 'Push Gaming', 'Relax Gaming'];

export default function GamesLobby() {
  const [games, setGames] = useState<Game[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeProvider, setActiveProvider] = useState('All Providers');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isMockData, setIsMockData] = useState(false);

  const fetchGames = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: '24',
        ...(activeCategory !== 'all' && { type: activeCategory }),
        ...(activeProvider !== 'All Providers' && { provider: activeProvider }),
        ...(search && { search }),
      });

      const res = await fetch(`/api/casino-games?${params}`);
      const data = await res.json();

      if (data.success) {
        setGames(data.data);
        setMeta(data.meta);
        setIsMockData(!!data.mock);
      }
    } catch (e) {
      console.error('Failed to load games:', e);
    } finally {
      setIsLoading(false);
    }
  }, [page, activeCategory, activeProvider, search]);

  useEffect(() => {
    fetchGames();
  }, [fetchGames]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [activeCategory, activeProvider, search]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
  };

  const getGameUrl = (game: Game) => `/games/play/${game.uuid}?title=${encodeURIComponent(game.title)}&provider=${encodeURIComponent(game.provider.title)}&iframe=${encodeURIComponent(game.iframe_url || '')}`;

  return (
    <div className="min-h-screen">
      {/* Hero Banner */}
      <div className="relative bg-gradient-to-b from-jomish-dark-900 to-jomish-dark-950 border-b border-gray-800 py-10 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(34,197,94,0.1)_0%,_transparent_60%)]"></div>
        <div className="container-jomish relative z-10">
          <h1 className="text-4xl md:text-5xl font-black font-outfit text-white mb-2">
            Casino <span className="text-jomish-gold-400">Games</span>
          </h1>
          <p className="text-gray-400 text-lg">
            {meta ? `${meta.total.toLocaleString()}+ real casino games` : 'Hundreds of real casino games'} — powered by top providers
          </p>
          {isMockData && (
            <div className="mt-3 inline-block bg-yellow-500/20 border border-yellow-500/40 text-yellow-400 text-xs px-3 py-1.5 rounded-full font-bold">
              ⚡ Demo mode — Add your SlotsLaunch API key to load 5,000+ live games
            </div>
          )}
        </div>
      </div>

      <div className="container-jomish py-8">
        {/* Search + Provider Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <form onSubmit={handleSearch} className="flex gap-2 flex-1">
            <input
              type="text"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder="Search games, providers..."
              className="jomish-input flex-1"
            />
            <button type="submit" className="btn-gold px-6">Search</button>
          </form>
          <select
            value={activeProvider}
            onChange={e => setActiveProvider(e.target.value)}
            className="jomish-input md:w-52"
          >
            {PROVIDERS.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-none">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              style={{
                padding: '0.5rem 1.25rem',
                borderRadius: '100px',
                border: `1px solid ${activeCategory === cat.id ? 'rgba(234,179,8,0.6)' : 'rgba(255,255,255,0.08)'}`,
                background: activeCategory === cat.id ? 'rgba(234,179,8,0.15)' : 'rgba(255,255,255,0.03)',
                color: activeCategory === cat.id ? '#fde047' : '#9ca3af',
                fontWeight: activeCategory === cat.id ? '700' : '500',
                fontSize: '0.875rem',
                whiteSpace: 'nowrap',
                cursor: 'pointer',
                transition: 'all 0.2s',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Game Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Array.from({ length: 24 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] bg-jomish-dark-900 rounded-xl animate-pulse border border-gray-800"></div>
            ))}
          </div>
        ) : games.length === 0 ? (
          <div className="text-center py-24 text-gray-500">
            <div className="text-6xl mb-4">🎮</div>
            <p className="text-xl font-bold">No games found</p>
            <p className="text-sm mt-2">Try a different search or category</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {games.map(game => (
              <GameCard key={game.uuid} game={game} getGameUrl={getGameUrl} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {meta && meta.last_page > 1 && (
          <div className="flex justify-center gap-3 mt-10">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn-ghost px-6 py-2 disabled:opacity-30"
            >
              ← Prev
            </button>
            <div className="flex items-center gap-2">
              {Array.from({ length: Math.min(5, meta.last_page) }, (_, i) => {
                const pageNum = Math.max(1, Math.min(page - 2, meta.last_page - 4)) + i;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    style={{
                      width: '40px', height: '40px',
                      borderRadius: '8px',
                      border: `1px solid ${page === pageNum ? 'rgba(234,179,8,0.6)' : 'rgba(255,255,255,0.1)'}`,
                      background: page === pageNum ? 'rgba(234,179,8,0.15)' : 'transparent',
                      color: page === pageNum ? '#fde047' : '#9ca3af',
                      fontWeight: '700',
                      cursor: 'pointer',
                    }}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setPage(p => Math.min(meta.last_page, p + 1))}
              disabled={page === meta.last_page}
              className="btn-ghost px-6 py-2 disabled:opacity-30"
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function GameCard({ game, getGameUrl }: { game: Game; getGameUrl: (g: Game) => string }) {
  const [imgError, setImgError] = useState(false);
  const [hovered, setHovered] = useState(false);

  // Emoji fallback thumbnails per type
  const fallbackEmoji: Record<string, string> = {
    slots: '🎰', table: '🃏', video_poker: '♠️', live: '🎥', jackpot: '💰', crash: '🚀'
  };

  return (
    <Link href={getGameUrl(game)} className="group block">
      <div
        className="relative rounded-xl overflow-hidden border border-gray-800 transition-all duration-300"
        style={{
          aspectRatio: '3/4',
          transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
          boxShadow: hovered ? '0 12px 30px rgba(0,0,0,0.5)' : 'none',
          borderColor: hovered ? 'rgba(234,179,8,0.4)' : undefined,
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Thumbnail */}
        {!imgError && game.thumb?.url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={game.thumb.url}
            alt={game.title}
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-jomish-dark-900 to-black flex items-center justify-center text-5xl">
            {fallbackEmoji[game.type] || '🎮'}
          </div>
        )}

        {/* Overlay on hover */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center transition-all duration-300"
          style={{
            background: hovered ? 'rgba(0,0,0,0.75)' : 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.1) 50%, transparent 100%)',
          }}
        >
          {hovered && (
            <div className="mb-3">
              <div
                className="px-5 py-2 rounded-full font-bold text-sm text-black"
                style={{ background: 'linear-gradient(135deg, #eab308, #fde047)' }}
              >
                🎮 Play Free
              </div>
            </div>
          )}
        </div>

        {/* Game info overlay at bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-2" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.95), transparent)' }}>
          <div className="text-white font-bold text-xs leading-tight truncate">{game.title}</div>
          <div className="text-gray-400 text-[10px] truncate">{game.provider.title}</div>
          {game.rtp && (
            <div className="text-jomish-green-400 text-[10px] font-bold">RTP {game.rtp}%</div>
          )}
        </div>

        {/* RTP badge */}
        {game.rtp && parseFloat(game.rtp) >= 97 && (
          <div
            className="absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full"
            style={{ background: 'rgba(34,197,94,0.9)', color: '#fff' }}
          >
            HOT
          </div>
        )}
      </div>
    </Link>
  );
}
