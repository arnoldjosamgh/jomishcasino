'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';

export default function SettingsPage() {
  const { profile, isAuthenticated, logout } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{type: 'success'|'error', text: string} | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    if (profile) {
      setFirstName(profile.first_name || '');
      setLastName(profile.last_name || '');
      setPhone(profile.phone_number || '');
    }
  }, [isAuthenticated, profile, router]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    
    setIsSaving(true);
    setMessage(null);
    
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: firstName,
          last_name: lastName,
          phone_number: phone
        })
        .eq('id', profile.id);

      if (error) throw error;
      
      setMessage({ type: 'success', text: 'Settings updated successfully. Refresh to see changes.' });
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message || 'Failed to update settings' });
    } finally {
      setIsSaving(false);
    }
  };

  if (!isAuthenticated || !profile) return null;

  return (
    <div className="container-jomish py-12 max-w-2xl">
      <h1 className="text-3xl font-black font-outfit mb-8 text-white">Account Settings</h1>
      
      <div className="glass-card p-6 md:p-8">
        {message && (
          <div className={`mb-6 p-4 rounded-xl border ${
            message.type === 'success' ? 'bg-green-500/20 border-green-500/50 text-green-400' : 'bg-red-500/20 border-red-500/50 text-red-400'
          }`}>
            {message.text}
          </div>
        )}
        
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-gray-400 text-sm mb-1 block">{t('auth.first_name')}</label>
              <input 
                type="text" 
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="jomish-input"
              />
            </div>
            <div>
              <label className="text-gray-400 text-sm mb-1 block">{t('auth.last_name')}</label>
              <input 
                type="text" 
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="jomish-input"
              />
            </div>
          </div>
          
          <div>
            <label className="text-gray-400 text-sm mb-1 block">{t('auth.phone')}</label>
            <input 
              type="tel" 
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="jomish-input"
            />
          </div>

          <div>
            <label className="text-gray-400 text-sm mb-1 block">{t('auth.email')} (Cannot be changed)</label>
            <input 
              type="email" 
              value={profile.email}
              disabled
              className="jomish-input opacity-50 cursor-not-allowed"
            />
          </div>

          <button 
            type="submit"
            disabled={isSaving}
            className="btn-gold py-4 text-lg font-bold mt-4 shadow-[0_0_15px_rgba(234,179,8,0.2)]"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
}
