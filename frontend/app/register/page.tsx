'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLanguage } from '@/lib/i18n/LanguageContext';

export default function RegisterPage() {
  const { register } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await register(email, password, { username, phone_number: phone });
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to register');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container-jomish py-12 flex justify-center items-center min-h-[70vh]">
      <div className="glass-card p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black font-outfit text-white">{t('auth.register_title')}</h1>
          <p className="text-gray-400 mt-2">Join Uganda's Premier Casino</p>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-400 p-3 rounded-lg text-sm mb-6 font-bold text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-gray-400 text-sm mb-1 block">{t('auth.username')}</label>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="jomish-input"
              required
              minLength={3}
            />
          </div>

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
            <label className="text-gray-400 text-sm mb-1 block">{t('auth.phone')} (+256)</label>
            <input 
              type="tel" 
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="jomish-input"
              placeholder="770000000"
              required
            />
          </div>
          
          <div>
            <label className="text-gray-400 text-sm mb-1 block">{t('auth.password')}</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="jomish-input"
              required
              minLength={6}
            />
          </div>

          <div className="flex items-center gap-2 mt-2">
            <input type="checkbox" id="terms" required className="accent-jomish-green-500 w-4 h-4" />
            <label htmlFor="terms" className="text-xs text-gray-400">{t('auth.terms')}</label>
          </div>

          <button 
            type="submit"
            disabled={isLoading}
            className="btn-gold py-4 text-lg font-bold mt-2 shadow-[0_0_15px_rgba(234,179,8,0.2)]"
          >
            {isLoading ? t('common.loading') : t('auth.register_btn')}
          </button>
        </form>

        <p className="text-center text-gray-400 text-sm mt-6">
          {t('auth.have_account')} <Link href="/login" className="text-jomish-green-400 font-bold hover:underline">{t('auth.login_btn')}</Link>
        </p>
      </div>
    </div>
  );
}
