'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useHRStore } from '@/lib/hrStore';
import { AppCard } from '@/components/hr/AppCard';
import { AppButton } from '@/components/hr/AppButton';
import { LogOutIcon, MailIcon, PhoneIcon, HashIcon, CalendarIcon, BriefcaseIcon, UserIcon, ShieldIcon } from '@/components/hr/Icons';

export default function ProfilePage() {
  const router = useRouter();
  const { user, vacationBalance, logout } = useHRStore();
  const [showLogout, setShowLogout] = useState(false);

  async function handleLogout() {
    await logout();
    router.push('/login');
  }

  const roleLabel = user.role === 'admin' ? 'Директор' : user.role === 'manager' ? 'Начальник отдела' : 'Сотрудник';

  const sections = [
    {
      title: 'Должность',
      rows: [
        { Icon: BriefcaseIcon, label: 'Должность',        value: user.position    },
        { Icon: UserIcon,      label: 'Подразделение',     value: user.department  },
        { Icon: ShieldIcon,    label: 'Роль',              value: roleLabel        },
        ...(user.managerName ? [{ Icon: UserIcon, label: 'Руководитель', value: user.managerName }] : []),
      ],
    },
    {
      title: 'Контакты',
      rows: [
        { Icon: MailIcon,  label: 'Email',   value: user.email },
        { Icon: PhoneIcon, label: 'Телефон', value: user.phone },
      ],
    },
    {
      title: 'Занятость',
      rows: [
        { Icon: HashIcon,     label: 'Табельный номер', value: user.employeeId },
        { Icon: CalendarIcon, label: 'Дата приёма',     value: user.hireDate   },
      ],
    },
  ];

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg)' }} className="pb-nav">
      {/* Header */}
      <div style={{ background: 'var(--blue)', paddingTop: 'env(safe-area-inset-top)' }}>
        <div style={{ padding: '20px 20px 24px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 52, height: 52, borderRadius: '50%',
            background: 'rgba(255,255,255,0.15)',
            border: '2px solid rgba(255,255,255,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, color: '#fff', fontWeight: 700, flexShrink: 0,
          }}>
            {user.firstName[0]}
          </div>
          <div>
            <div style={{ color: '#fff', fontSize: 16, fontWeight: 700, letterSpacing: '-0.02em' }}>
              {user.name}
            </div>
            <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12, marginTop: 2 }}>
              {user.position} · {user.department}
            </div>
          </div>
        </div>

        {/* Vacation stats */}
        <div style={{ display: 'flex', background: 'rgba(0,0,0,0.12)', margin: '0 16px 16px', borderRadius: 10, overflow: 'hidden' }}>
          {[
            { value: vacationBalance.remaining, label: 'Остаток' },
            { value: vacationBalance.used,      label: 'Использовано' },
            { value: vacationBalance.total,     label: 'Всего в год' },
          ].map((item, i) => (
            <div key={i} style={{ flex: 1, padding: '10px 8px', textAlign: 'center', borderLeft: i > 0 ? '1px solid rgba(255,255,255,0.1)' : 'none' }}>
              <div style={{ color: '#fff', fontSize: 18, fontWeight: 700 }}>{item.value}</div>
              <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 10, marginTop: 1 }}>{item.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: '16px 16px 0' }}>
        {sections.map((section) => (
          <div key={section.title} style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
              {section.title}
            </div>
            <AppCard padding="0">
              {section.rows.map(({ Icon, label, value }, ii) => (
                <div key={label} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 14px',
                  borderBottom: ii < section.rows.length - 1 ? '1px solid var(--border-light)' : 'none',
                }}>
                  <div style={{ color: 'var(--text-3)', flexShrink: 0, display: 'flex' }}>
                    <Icon size={16} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{label}</div>
                    <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {value}
                    </div>
                  </div>
                </div>
              ))}
            </AppCard>
          </div>
        ))}

        <AppButton
          onClick={() => setShowLogout(true)}
          variant="secondary"
          fullWidth
          icon={<LogOutIcon size={16} color="var(--red)" />}
          style={{ color: 'var(--red)', border: '1px solid var(--red-border)' }}
        >
          Выйти из аккаунта
        </AppButton>
      </div>

      {/* Logout sheet */}
      {showLogout && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'flex-end', zIndex: 200 }}
          onClick={() => setShowLogout(false)}
        >
          <div
            style={{ background: 'var(--surface)', borderRadius: '16px 16px 0 0', padding: `24px 20px calc(28px + env(safe-area-inset-bottom))`, width: '100%' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ width: 32, height: 4, borderRadius: 2, background: 'var(--border)', margin: '0 auto 20px' }} />
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 6, textAlign: 'center' }}>
              Выйти из аккаунта?
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-2)', textAlign: 'center', marginBottom: 20, lineHeight: 1.5 }}>
              Вы будете перенаправлены на страницу входа.
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <AppButton onClick={handleLogout} fullWidth style={{ background: 'var(--red)', border: 'none', color: '#fff' }}>
                Выйти
              </AppButton>
              <AppButton onClick={() => setShowLogout(false)} variant="secondary" fullWidth>
                Отмена
              </AppButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
