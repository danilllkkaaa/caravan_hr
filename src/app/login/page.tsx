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

  async function handleLogin() {
    if (!email.trim()) { setError('Введите email'); return; }
    if (!password.trim()) { setError('Введите пароль'); return; }
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      router.push('/home');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось войти');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100dvh',
      background: 'var(--bg)',
      display: 'flex',
      flexDirection: 'column',
      paddingTop: 'env(safe-area-inset-top)',
      paddingBottom: 'env(safe-area-inset-bottom)',
    }}>
      {/* Top colour strip */}
      <div style={{
        background: 'var(--blue)',
        padding: '40px 24px 36px',
        flexShrink: 0,
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 10,
          marginBottom: 20,
        }}>
          {/* Wordmark logo */}
          <div style={{
            width: 36, height: 36, borderRadius: 9,
            background: 'rgba(255,255,255,0.18)',
            border: '1px solid rgba(255,255,255,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="7" width="20" height="14" rx="2"/>
              <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/>
            </svg>
          </div>
          <span style={{ color: '#fff', fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em' }}>
            Caravan HR
          </span>
        </div>
        <div style={{ color: '#fff', fontSize: 24, fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.2 }}>
          Личный кабинет<br />сотрудника
        </div>
      </div>

      {/* Form area */}
      <div style={{
        flex: 1,
        background: 'var(--surface)',
        borderRadius: '20px 20px 0 0',
        marginTop: -16,
        padding: '28px 20px 24px',
        display: 'flex',
        flexDirection: 'column',
      }}>
        <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>
          Вход
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 24 }}>
          Используйте корпоративный аккаунт
        </div>

        <form
          method="post"
          action="/api/auth/login-form"
          onSubmit={(e) => {
            e.preventDefault();
            void handleLogin();
          }}
          style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
        >
          <AppInput
            label="Email"
            type="email"
            name="email"
            placeholder="имя@caravan.local"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
          <AppInput
            label="Пароль"
            type="password"
            name="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />

          {error && (
            <div style={{
              background: 'var(--red-surface)',
              border: '1px solid var(--red-border)',
              borderRadius: 8,
              padding: '10px 13px',
              fontSize: 13,
              color: 'var(--red)',
            }}>
              {error}
            </div>
          )}

          <AppButton type="submit" fullWidth disabled={loading} style={{ marginTop: 4 }}>
            {loading
              ? <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
                  Вход...
                </span>
              : 'Войти'}
          </AppButton>
        </form>

        <div style={{ marginTop: 'auto', paddingTop: 24, fontSize: 12, color: 'var(--text-3)', lineHeight: 1.6 }}>
          Проблемы со входом? Обратитесь в IT-поддержку.
        </div>
      </div>
    </div>
  );
}
