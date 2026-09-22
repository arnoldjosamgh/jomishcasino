'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLanguage } from '@/lib/i18n/LanguageContext';

export default function LoginPage() {
  const { login } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container-jomish py-20 flex justify-center items-center min-h-[70vh]">
      <div className="glass-card p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-jomish-green-600 to-jomish-green-400 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(34,197,94,0.3)]">
            <span className="text-3xl">🎰</span>
          </div>
          <h1 className="text-3xl font-black font-outfit text-white">{t('auth.login_title')}</h1>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-400 p-3 rounded-lg text-sm mb-6 font-bold text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-gray-400 text-sm mb-1 block">{t('auth.email')}</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="jomish-input"
              required
            />
          </div>
          
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-gray-400 text-sm">{t('auth.password')}</label>
              <Link href="#" className="text-xs text-jomish-gold-400 hover:underline">{t('auth.forgot_password')}</Link>
            </div>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="jomish-input"
              required
            />
          </div>

          <button 
            type="submit"
            disabled={isLoading}
            className="btn-gold py-4 text-lg font-bold mt-4 shadow-[0_0_15px_rgba(234,179,8,0.2)]"
          >
            {isLoading ? t('common.loading') : t('auth.login_btn')}
          </button>
        </form>

        <p className="text-center text-gray-400 text-sm mt-6">
          {t('auth.no_account')} <Link href="/register" className="text-jomish-green-400 font-bold hover:underline">{t('auth.register_btn')}</Link>
        </p>
      </div>
    </div>
  );
}
