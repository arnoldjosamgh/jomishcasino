'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useLanguage } from '@/lib/i18n/LanguageContext';

export default function Header() {
  const { isAuthenticated, profile, logout } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const formatBalance = (ugx: number) =>
    `UGX ${ugx.toLocaleString('en-UG', { maximumFractionDigits: 0 })}`;

  const langs = [
    { code: 'en', label: 'EN', flag: '🇺🇬' },
    { code: 'sw', label: 'SW', flag: '🇹🇿' },
    { code: 'lg', label: 'LG', flag: '🇺🇬' },
  ] as const;

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: scrolled
          ? 'rgba(3,7,18,0.96)'
          : 'linear-gradient(180deg, rgba(3,7,18,0.98) 0%, rgba(3,7,18,0.85) 100%)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(34,197,94,0.15)',
        transition: 'all 0.3s ease',
      }}
    >
      <div className="container-jomish" style={{ display: 'flex', alignItems: 'center', height: '68px', gap: '1.5rem' }}>
        {/* Logo */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', textDecoration: 'none', flexShrink: 0 }}>
          <div style={{
            width: '38px', height: '38px',
            background: 'linear-gradient(135deg, #064520, #22c55e)',
            borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '2px solid rgba(234,179,8,0.5)',
            boxShadow: '0 0 12px rgba(34,197,94,0.4)',
            fontFamily: 'Outfit, sans-serif',
            fontWeight: '900',
            fontSize: '1.1rem',
            color: '#fde047',
          }}>J</div>
          <span style={{
            fontFamily: 'Outfit, sans-serif',
            fontWeight: '800',
            fontSize: '1.2rem',
            background: 'linear-gradient(135deg, #f0fdf4, #fde047)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>Jomish Casino</span>
        </Link>

        {/* Desktop Nav */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', flex: 1, marginLeft: '1rem' }}
             className="desktop-nav">
          {[
            { href: '/games', label: t('nav.games') },
            { href: '/sports', label: t('nav.sports') },
            { href: '/promotions', label: t('nav.promotions') },
          ].map(({ href, label }) => (
            <Link key={href} href={href} style={{
              padding: '0.45rem 0.875rem',
              borderRadius: '8px',
              color: '#cbd5e1',
              fontWeight: '500',
              fontSize: '0.9rem',
              textDecoration: 'none',
              transition: 'all 0.2s',
              fontFamily: 'Inter, sans-serif',
            }}
            onMouseEnter={e => { (e.target as HTMLElement).style.color = '#4ade80'; (e.target as HTMLElement).style.background = 'rgba(34,197,94,0.08)'; }}
            onMouseLeave={e => { (e.target as HTMLElement).style.color = '#cbd5e1'; (e.target as HTMLElement).style.background = 'transparent'; }}>
              {label}
            </Link>
          ))}
        </nav>

        {/* Right side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginLeft: 'auto' }}>
          {/* Language Switcher */}
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '2px', border: '1px solid rgba(255,255,255,0.08)' }}>
            {langs.map(({ code, label }) => (
              <button key={code}
                onClick={() => setLanguage(code)}
                style={{
                  padding: '0.3rem 0.5rem',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  fontWeight: '700',
                  fontFamily: 'Outfit, sans-serif',
                  transition: 'all 0.2s',
                  background: language === code ? 'rgba(34,197,94,0.2)' : 'transparent',
                  color: language === code ? '#4ade80' : '#64748b',
                }}>
                {label}
              </button>
            ))}
          </div>

          {isAuthenticated ? (
            <>
              {/* Balance pill */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                background: 'rgba(6,69,32,0.4)',
                border: '1px solid rgba(34,197,94,0.3)',
                borderRadius: '10px',
                padding: '0.4rem 0.875rem',
                cursor: 'pointer',
              }}
                onClick={() => setUserMenuOpen(!userMenuOpen)}>
                <span style={{ fontSize: '0.7rem', color: '#4ade80', fontWeight: '600', fontFamily: 'Outfit' }}>💰</span>
                <span style={{ fontSize: '0.82rem', color: '#f0fdf4', fontWeight: '700', fontFamily: 'Outfit' }}>
                  {formatBalance(profile?.balance_ugx ?? 0)}
                </span>
              </div>

              {/* User dropdown */}
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  style={{
                    width: '36px', height: '36px',
                    background: 'linear-gradient(135deg, #0d6e35, #22c55e)',
                    borderRadius: '50%',
                    border: '2px solid rgba(234,179,8,0.4)',
                    color: '#030712',
                    fontWeight: '800',
                    fontSize: '0.9rem',
                    fontFamily: 'Outfit',
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                  {(profile?.username?.[0] ?? 'U').toUpperCase()}
                </button>
                {userMenuOpen && (
                  <div style={{
                    position: 'absolute', right: 0, top: '48px',
                    background: 'rgba(10,15,26,0.98)',
                    border: '1px solid rgba(34,197,94,0.2)',
                    borderRadius: '12px',
                    minWidth: '180px',
                    overflow: 'hidden',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
                  }}>
                    <div style={{ padding: '0.875rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      <div style={{ fontWeight: '700', fontFamily: 'Outfit', color: '#f0fdf4', fontSize: '0.9rem' }}>
                        @{profile?.username}
                      </div>
                      <div style={{ color: '#4ade80', fontSize: '0.78rem', marginTop: '2px' }}>
                        {profile?.vip_level?.toUpperCase()} Member
                      </div>
                    </div>
                    {[
                      { href: '/dashboard', label: t('nav.dashboard') },
                      { href: '/deposit', label: t('nav.deposit') },
                      { href: '/withdraw', label: t('nav.withdraw') },
                    ].map(({ href, label }) => (
                      <Link key={href} href={href}
                        onClick={() => setUserMenuOpen(false)}
                        style={{
                          display: 'block', padding: '0.65rem 1rem',
                          color: '#cbd5e1', textDecoration: 'none',
                          fontSize: '0.875rem', transition: 'background 0.2s',
                        }}
                        onMouseEnter={e => (e.target as HTMLElement).style.background = 'rgba(34,197,94,0.08)'}
                        onMouseLeave={e => (e.target as HTMLElement).style.background = 'transparent'}>
                        {label}
                      </Link>
                    ))}
                    <button
                      onClick={async () => { await logout(); setUserMenuOpen(false); }}
                      style={{
                        width: '100%', textAlign: 'left', padding: '0.65rem 1rem',
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: '#f87171', fontSize: '0.875rem',
                        borderTop: '1px solid rgba(255,255,255,0.06)',
                      }}>
                      {t('nav.logout')}
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link href="/login" className="btn-ghost" style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}>
                {t('nav.login')}
              </Link>
              <Link href="/register" className="btn-gold" style={{ fontSize: '0.875rem', padding: '0.55rem 1.25rem' }}>
                {t('nav.register')}
              </Link>
            </>
          )}

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="mobile-menu-btn"
            style={{
              background: 'none', border: 'none', color: '#f0fdf4', cursor: 'pointer',
              fontSize: '1.5rem', display: 'none',
            }}>
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div style={{
          background: 'rgba(3,7,18,0.98)',
          borderTop: '1px solid rgba(34,197,94,0.15)',
          padding: '1rem',
        }}>
          {[
            { href: '/games', label: t('nav.games') },
            { href: '/sports', label: t('nav.sports') },
            { href: '/promotions', label: t('nav.promotions') },
            ...(isAuthenticated ? [
              { href: '/dashboard', label: t('nav.dashboard') },
              { href: '/deposit', label: t('nav.deposit') },
            ] : [
              { href: '/login', label: t('nav.login') },
              { href: '/register', label: t('nav.register') },
            ]),
          ].map(({ href, label }) => (
            <Link key={href} href={href}
              onClick={() => setMenuOpen(false)}
              style={{ display: 'block', padding: '0.75rem 0.5rem', color: '#cbd5e1', textDecoration: 'none', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              {label}
            </Link>
          ))}
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: flex !important; }
        }
      `}</style>
    </header>
  );
}
