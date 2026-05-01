'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useHRStore } from '@/lib/hrStore';
import { AppButton } from '@/components/hr/AppButton';
import { AppInput } from '@/components/hr/AppInput';

export default function LoginPage() {
  const router = useRouter();
  const login = useHRStore((s) => s.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) { setError('Введите email'); return; }
    if (!password.trim()) { setError('Введите пароль'); return; }
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      const next = new URLSearchParams(window.location.search).get('next');
      router.push(next || '/home');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось войти');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100dvh',
      background: 'linear-gradient(160deg, #1565C0 0%, #1976D2 40%, #42A5F5 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 20px',
      paddingTop: 'calc(env(safe-area-inset-top) + 24px)',
      paddingBottom: 'calc(env(safe-area-inset-bottom) + 24px)',
    }}>
      {/* Logo */}
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <div style={{
          width: 80, height: 80, borderRadius: 24,
          background: 'rgba(255,255,255,0.2)',
          border: '2px solid rgba(255,255,255,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 36, margin: '0 auto 16px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
        }}>
          🏢
        </div>
        <div style={{ color: '#fff', fontSize: 26, fontWeight: 900, letterSpacing: -0.5 }}>Caravan HR</div>
        <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 14, marginTop: 4 }}>Личный кабинет сотрудника</div>
      </div>

      {/* Card */}
      <div style={{
        background: '#fff',
        borderRadius: 24,
        padding: 24,
        width: '100%',
        maxWidth: 400,
        boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
      }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: '#1A2332', marginBottom: 6 }}>Вход</div>
        <div style={{ fontSize: 13, color: '#78909C', marginBottom: 24 }}>Введите корпоративные данные</div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <AppInput
            label="Корпоративный email"
            type="email"
            placeholder="name@company.ru"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
          <AppInput
            label="Пароль"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />

          {error && (
            <div style={{
              background: '#FEF2F2', border: '1px solid #FECACA',
              borderRadius: 10, padding: '10px 14px',
              fontSize: 13, color: '#E53935', fontWeight: 500,
            }}>
              {error}
            </div>
          )}

          <AppButton type="submit" fullWidth disabled={loading} style={{ marginTop: 4 }}>
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  width: 16, height: 16, borderRadius: '50%',
                  border: '2px solid rgba(255,255,255,0.4)',
                  borderTopColor: '#fff',
                  animation: 'spin 0.7s linear infinite',
                  display: 'inline-block',
                }} />
                Вход...
              </span>
            ) : 'Войти'}
          </AppButton>
        </form>

        <div style={{ marginTop: 20, padding: '12px 14px', background: '#F8FAFC', borderRadius: 10, fontSize: 12, color: '#78909C' }}>
          <span style={{ fontWeight: 600 }}>Тест:</span> alexey.smirnov@caravan.local / Password123!
        </div>
      </div>
    </div>
  );
}
