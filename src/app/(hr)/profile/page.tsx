'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useHRStore } from '@/lib/hrStore';
import { AppCard } from '@/components/hr/AppCard';
import { AppButton } from '@/components/hr/AppButton';
import { AppInput } from '@/components/hr/AppInput';

export default function ProfilePage() {
  const router = useRouter();
  const { user, vacationBalance, logout } = useHRStore();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [createUserLoading, setCreateUserLoading] = useState(false);
  const [createUserError, setCreateUserError] = useState('');
  const [createUserSuccess, setCreateUserSuccess] = useState('');

  async function handleLogout() {
    await logout();
    router.push('/login');
  }

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    setCreateUserError('');
    setCreateUserSuccess('');
    setCreateUserLoading(true);

    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: newUserEmail, password: newUserPassword }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(typeof payload.error === 'string' ? payload.error : 'Не удалось добавить пользователя');
      }
      setCreateUserSuccess(`Пользователь ${newUserEmail} добавлен`);
      setNewUserEmail('');
      setNewUserPassword('');
    } catch (err) {
      setCreateUserError(err instanceof Error ? err.message : 'Не удалось добавить пользователя');
    } finally {
      setCreateUserLoading(false);
    }
  }

  const sections = [
    {
      title: 'Личные данные',
      items: [
        { icon: '👤', label: 'ФИО', value: user.name },
        { icon: '💼', label: 'Должность', value: user.position },
        { icon: '🏢', label: 'Подразделение', value: user.department },
      ],
    },
    {
      title: 'Контакты',
      items: [
        { icon: '✉️', label: 'Email', value: user.email },
        { icon: '📱', label: 'Телефон', value: user.phone },
      ],
    },
    {
      title: 'Занятость',
      items: [
        { icon: '🆔', label: 'Табельный номер', value: user.employeeId },
        { icon: '📅', label: 'Дата приёма', value: user.hireDate },
        { icon: '🔐', label: 'Роль', value: user.role === 'admin' ? 'Директор' : user.role === 'manager' ? 'Начальник отдела' : 'Сотрудник' },
        ...(user.managerName ? [{ icon: '👥', label: 'Руководитель', value: user.managerName }] : []),
      ],
    },
  ];

  return (
    <div style={{ minHeight: '100dvh', background: '#F4F7FB', paddingBottom: 'calc(64px + env(safe-area-inset-bottom))' }}>
      {/* Header with avatar */}
      <div style={{
        background: 'linear-gradient(135deg, #1565C0 0%, #1976D2 100%)',
        padding: 'calc(env(safe-area-inset-top) + 20px) 20px 28px',
        borderRadius: '0 0 28px 28px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
      }}>
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          background: 'rgba(255,255,255,0.25)',
          border: '3px solid rgba(255,255,255,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 30, color: '#fff', fontWeight: 800,
          boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
        }}>
          {user.firstName[0]}
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: '#fff', fontSize: 17, fontWeight: 800, lineHeight: 1.3 }}>{user.name}</div>
          <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13, marginTop: 3 }}>{user.position}</div>
          <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 1 }}>{user.department}</div>
        </div>
        <div style={{
          background: 'rgba(255,255,255,0.2)', borderRadius: 20,
          padding: '6px 16px', display: 'flex', gap: 16,
          border: '1px solid rgba(255,255,255,0.3)',
        }}>
          {[
            { value: vacationBalance.remaining, label: 'дней остаток' },
            { value: vacationBalance.used, label: 'использовано' },
            { value: vacationBalance.total, label: 'всего в год' },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              {i > 0 && <div style={{ width: 1, height: 28, background: 'rgba(255,255,255,0.2)' }} />}
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: '#fff', fontSize: 16, fontWeight: 800 }}>{item.value}</div>
                <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 10 }}>{item.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: '16px 16px 8px' }}>
        {sections.map((section, si) => (
          <div key={si} style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#90A4AE', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8, paddingLeft: 2 }}>{section.title}</div>
            <AppCard padding="0">
              {section.items.map((item, ii) => (
                <div key={ii} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '13px 16px',
                  borderBottom: ii < section.items.length - 1 ? '1px solid #F0F4F8' : 'none',
                }}>
                  <div style={{ width: 34, height: 34, borderRadius: 10, background: '#F0F4F8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
                    {item.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11, color: '#90A4AE', fontWeight: 500 }}>{item.label}</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#1A2332', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.value}</div>
                  </div>
                </div>
              ))}
            </AppCard>
          </div>
        ))}

        {user.role === 'admin' && (
          <div style={{ marginBottom: 10 }}>
            <AppButton onClick={() => setShowCreateUser(true)} fullWidth icon="+">
              Добавить пользователя
            </AppButton>
          </div>
        )}

        <AppButton onClick={() => setShowLogoutConfirm(true)} variant="danger" fullWidth icon="🚪">
          Выйти из аккаунта
        </AppButton>
      </div>

      {showCreateUser && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end', zIndex: 200 }}
          onClick={() => setShowCreateUser(false)}
        >
          <div
            style={{ background: '#fff', borderRadius: '24px 24px 0 0', padding: `24px 20px calc(32px + env(safe-area-inset-bottom))`, width: '100%', boxShadow: '0 -4px 32px rgba(0,0,0,0.2)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ width: 36, height: 4, borderRadius: 2, background: '#E0E7EF', margin: '0 auto 20px' }} />
            <div style={{ fontSize: 18, fontWeight: 800, color: '#1A2332', marginBottom: 6, textAlign: 'center' }}>Добавить пользователя</div>
            <div style={{ fontSize: 13, color: '#78909C', textAlign: 'center', marginBottom: 20 }}>
              Новый пользователь будет создан как сотрудник.
            </div>

            <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <AppInput
                label="Почта"
                type="email"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                autoComplete="email"
                required
              />
              <AppInput
                label="Пароль"
                type="password"
                value={newUserPassword}
                onChange={(e) => setNewUserPassword(e.target.value)}
                autoComplete="new-password"
                required
              />

              {createUserError && (
                <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#E53935' }}>
                  {createUserError}
                </div>
              )}
              {createUserSuccess && (
                <div style={{ background: '#E8F5E9', border: '1px solid #C8E6C9', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#2E7D32' }}>
                  {createUserSuccess}
                </div>
              )}

              <AppButton type="submit" fullWidth disabled={createUserLoading}>
                {createUserLoading ? 'Добавление...' : 'Подтвердить'}
              </AppButton>
              <AppButton type="button" onClick={() => setShowCreateUser(false)} variant="secondary" fullWidth>
                Отмена
              </AppButton>
            </form>
          </div>
        </div>
      )}

      {showLogoutConfirm && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end', zIndex: 200 }}
          onClick={() => setShowLogoutConfirm(false)}
        >
          <div
            style={{ background: '#fff', borderRadius: '24px 24px 0 0', padding: `24px 20px calc(32px + env(safe-area-inset-bottom))`, width: '100%', boxShadow: '0 -4px 32px rgba(0,0,0,0.2)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ width: 36, height: 4, borderRadius: 2, background: '#E0E7EF', margin: '0 auto 20px' }} />
            <div style={{ fontSize: 18, fontWeight: 800, color: '#1A2332', marginBottom: 8, textAlign: 'center' }}>Выйти из аккаунта?</div>
            <div style={{ fontSize: 14, color: '#78909C', textAlign: 'center', marginBottom: 24, lineHeight: 1.5 }}>
              Вы уверены, что хотите выйти? Несохранённые данные будут потеряны.
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <AppButton onClick={handleLogout} variant="danger" fullWidth>Выйти</AppButton>
              <AppButton onClick={() => setShowLogoutConfirm(false)} variant="secondary" fullWidth>Отмена</AppButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
