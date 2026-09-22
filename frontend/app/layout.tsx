import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';
import { LanguageProvider } from '@/lib/i18n/LanguageContext';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: 'Jomish Casino — Uganda\'s Premier Online Casino',
  description: 'Play casino games, sports betting, and win big at Jomish Casino. Deposit with MTN Mobile Money, Airtel Money. Real money games in UGX.',
  keywords: 'Jomish Casino, Uganda casino, online casino, sports betting, MTN mobile money, Airtel money, slots, blackjack, roulette',
  openGraph: {
    title: 'Jomish Casino — Uganda\'s Premier Online Casino',
    description: 'Play slots, blackjack, roulette, crash games & live sports betting. Deposit with Mobile Money in UGX.',
    type: 'website',
    locale: 'en_UG',
    siteName: 'Jomish Casino',
  },
  robots: 'index, follow',
  viewport: 'width=device-width, initial-scale=1',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <LanguageProvider>
            <Header />
            <main style={{ minHeight: '100vh' }}>
              {children}
            </main>
            <Footer />
          </LanguageProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
