'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useState, Suspense } from 'react';

function GamePlayerContent() {
  const searchParams = useSearchParams();
  const { profile, isAuthenticated } = useAuth();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [betAmount, setBetAmount] = useState(1000);
  const [showDepositPrompt, setShowDepositPrompt] = useState(false);

  const title = searchParams.get('title') || 'Game';
  const provider = searchParams.get('provider') || '';
  const iframeUrl = searchParams.get('iframe') || '';

  const formatBalance = (ugx: number) =>
    `UGX ${ugx.toLocaleString('en-UG', { maximumFractionDigits: 0 })}`;

  // If no iframe URL fallback to a nice "coming soon" state
  if (!iframeUrl) {
    return (
      <div className="container-jomish py-20 text-center">
        <div className="text-8xl mb-6">🎰</div>
        <h1 className="text-3xl font-bold text-white mb-4">{title}</h1>
        <p className="text-gray-400 mb-8">This game is loading... Add your SlotsLaunch API key to play.</p>
        <Link href="/games" className="btn-ghost">← Back to Games</Link>
      </div>
    );
  }

  return (
    <div className={`${isFullscreen ? 'fixed inset-0 z-50 bg-black' : 'min-h-screen bg-jomish-dark-950'} flex flex-col`}>

      {/* Top bar */}
      {!isFullscreen && (
        <div className="bg-jomish-dark-900 border-b border-gray-800 px-4 py-3 flex items-center gap-4">
          <Link href="/games" className="text-gray-400 hover:text-white transition-colors text-sm font-medium flex items-center gap-1">
            ← Games
          </Link>
          <div className="flex-1">
            <h1 className="font-bold text-white text-lg leading-tight">{title}</h1>
            <div className="text-xs text-gray-500">{provider}</div>
          </div>
          {isAuthenticated && profile && (
            <div className="flex items-center gap-3">
              <div
                className="px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2"
                style={{ background: 'rgba(6,69,32,0.5)', border: '1px solid rgba(34,197,94,0.3)' }}
              >
                <span className="text-jomish-green-400">💰</span>
                <span className="text-white">{formatBalance(profile.balance_ugx ?? 0)}</span>
              </div>
              <Link href="/deposit" className="btn-gold text-sm py-1.5 px-4">Deposit</Link>
            </div>
          )}
          {!isAuthenticated && (
            <div className="flex gap-2">
              <Link href="/login" className="btn-ghost text-sm py-1.5 px-4">Login</Link>
              <Link href="/register" className="btn-gold text-sm py-1.5 px-4">Register</Link>
            </div>
          )}
          <button
            onClick={() => setIsFullscreen(true)}
            className="text-gray-400 hover:text-white transition-colors"
            title="Fullscreen"
          >
            ⛶
          </button>
        </div>
      )}

      {/* Game iframe */}
      <div className="flex-1 flex flex-col md:flex-row gap-0 relative">
        {/* Main Game Area */}
        <div className="flex-1 relative bg-black">
          {isFullscreen && (
            <button
              onClick={() => setIsFullscreen(false)}
              className="absolute top-4 right-4 z-50 bg-black/70 text-white px-4 py-2 rounded-lg text-sm font-bold border border-gray-700 hover:bg-gray-800"
            >
              Exit Fullscreen ✕
            </button>
          )}
          <iframe
            src={iframeUrl}
            title={title}
            allow="autoplay; fullscreen"
            allowFullScreen
            className="w-full h-full border-0"
            style={{ minHeight: isFullscreen ? '100vh' : '600px' }}
          />
        </div>

        {/* Side Panel - only when not fullscreen */}
        {!isFullscreen && (
          <div className="w-full md:w-80 flex-shrink-0 bg-jomish-dark-900 border-t md:border-t-0 md:border-l border-gray-800 flex flex-col">

            {/* Game Info */}
            <div className="p-4 border-b border-gray-800">
              <div className="flex gap-2 mb-3">
                <span className="badge badge-green">{provider}</span>
              </div>
              <div className="text-xs text-gray-500 leading-relaxed">
                Playing in free / demo mode. No real money involved.
              </div>
            </div>

            {/* Real Money CTA */}
            <div className="p-4 border-b border-gray-800">
              <div
                className="rounded-xl p-4 text-center"
                style={{ background: 'linear-gradient(135deg, rgba(6,69,32,0.6), rgba(3,7,18,0.8))', border: '1px solid rgba(34,197,94,0.2)' }}
              >
                <div className="text-2xl mb-2">💰</div>
                <div className="text-white font-bold mb-1">Play for Real Money</div>
                <div className="text-gray-400 text-xs mb-3">Deposit via MTN or Airtel Money</div>
                {isAuthenticated ? (
                  <Link href="/deposit" className="btn-gold w-full py-2 text-sm text-center block">
                    Deposit Now
                  </Link>
                ) : (
                  <Link href="/register" className="btn-gold w-full py-2 text-sm text-center block">
                    Create Account
                  </Link>
                )}
              </div>
            </div>

            {/* Quick game links */}
            <div className="p-4 flex-1">
              <div className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-3">Play More Games</div>
              <div className="flex flex-col gap-2">
                {[
                  { label: '🎰 Slots', href: '/games?type=slots' },
                  { label: '🃏 Table Games', href: '/games?type=table' },
                  { label: '♠️ Video Poker', href: '/games?type=video_poker' },
                  { label: '⚽ Sports Betting', href: '/sports' },
                ].map(({ label, href }) => (
                  <Link
                    key={href}
                    href={href}
                    className="flex items-center gap-2 p-2.5 rounded-lg border border-gray-800 text-gray-300 text-sm hover:border-gray-600 hover:text-white transition-colors"
                  >
                    {label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function GamePlayerPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-jomish-green-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <GamePlayerContent />
    </Suspense>
  );
}
