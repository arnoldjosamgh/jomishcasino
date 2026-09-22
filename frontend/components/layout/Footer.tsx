'use client';

import Link from 'next/link';
import { useLanguage } from '@/lib/i18n/LanguageContext';

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer style={{
      background: 'var(--jomish-dark-950)',
      borderTop: '1px solid var(--border-green)',
      padding: '4rem 0 2rem 0',
      marginTop: 'auto',
    }}>
      <div className="container-jomish">
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '3rem',
          marginBottom: '3rem',
        }}>
          {/* Brand */}
          <div>
            <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', textDecoration: 'none', marginBottom: '1.5rem' }}>
              <div style={{
                width: '32px', height: '32px',
                background: 'linear-gradient(135deg, #064520, #22c55e)',
                borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '2px solid rgba(234,179,8,0.5)',
                fontFamily: 'Outfit, sans-serif',
                fontWeight: '900',
                fontSize: '1rem',
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
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem', lineHeight: 1.6 }}>
              Uganda's premier online casino and sports betting platform. Experience the thrill of real-money gaming with instant deposits and withdrawals via Mobile Money.
            </p>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <span style={{ fontSize: '1.5rem', opacity: 0.5 }}>🔞</span>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', alignSelf: 'center' }}>
                Play responsibly. Must be 18+ to play.
              </span>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 style={{ color: 'var(--text-primary)', marginBottom: '1.5rem', fontSize: '1.1rem' }}>Games</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {['Slots', 'Blackjack', 'Roulette', 'Crash Games', 'Live Casino'].map(item => (
                <li key={item}>
                  <Link href="/games" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.9rem', transition: 'color 0.2s' }}
                        onMouseEnter={e => (e.target as HTMLElement).style.color = 'var(--text-gold)'}
                        onMouseLeave={e => (e.target as HTMLElement).style.color = 'var(--text-secondary)'}>
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 style={{ color: 'var(--text-primary)', marginBottom: '1.5rem', fontSize: '1.1rem' }}>Sports</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {['Football', 'Basketball', 'Tennis', 'MMA / UFC'].map(item => (
                <li key={item}>
                  <Link href="/sports" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.9rem', transition: 'color 0.2s' }}
                        onMouseEnter={e => (e.target as HTMLElement).style.color = 'var(--text-gold)'}
                        onMouseLeave={e => (e.target as HTMLElement).style.color = 'var(--text-secondary)'}>
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 style={{ color: 'var(--text-primary)', marginBottom: '1.5rem', fontSize: '1.1rem' }}>Support & Payments</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <li>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                  <span className="badge badge-gold">MTN Mobile Money</span>
                  <span className="badge badge-red">Airtel Money</span>
                </div>
              </li>
              {['FAQ', 'Terms & Conditions', 'Privacy Policy', 'Contact Us'].map(item => (
                <li key={item}>
                  <Link href="#" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.9rem', transition: 'color 0.2s' }}
                        onMouseEnter={e => (e.target as HTMLElement).style.color = 'var(--text-gold)'}
                        onMouseLeave={e => (e.target as HTMLElement).style.color = 'var(--text-secondary)'}>
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.05)',
          paddingTop: '2rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1rem',
          textAlign: 'center',
        }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            &copy; {new Date().getFullYear()} Jomish Casino. All rights reserved.
          </p>
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem', maxWidth: '800px' }}>
            Jomish Casino is operated by Jomish Entertainment Ltd. Gambling can be addictive, please play responsibly.
            This service is for entertainment purposes. Ensure you comply with local laws and regulations regarding online gambling.
          </p>
        </div>
      </div>
    </footer>
  );
}
