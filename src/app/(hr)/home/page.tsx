'use client';
import { useRouter } from 'next/navigation';
import { useHRStore } from '@/lib/hrStore';
import { AppCard } from '@/components/hr/AppCard';
import {
  BellIcon, CalendarIcon, HospitalIcon,
  ClockIcon, ListIcon, ChevronRIcon,
} from '@/components/hr/Icons';

export default function HomePage() {
  const router = useRouter();
  const { user, vacationBalance, notifications, timeRecords } = useHRStore();

  const unread = notifications.filter((n) => !n.read).length;
  const usedPct = vacationBalance.total > 0
    ? Math.round((vacationBalance.used / vacationBalance.total) * 100)
    : 0;

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayRecord = timeRecords.find((r) => r.date === todayStr) ?? timeRecords[0];

  const STATUS_LABEL: Record<string, string> = {
    normal: 'Рабочий день', overtime: 'Сверхурочно',
    short: 'Неполный день', weekend: 'Выходной',
    absent: 'Отсутствие', holiday: 'Праздник',
  };
  const STATUS_COLOR: Record<string, string> = {
    normal: 'var(--blue)', overtime: 'var(--green)',
    short: 'var(--amber)', weekend: 'var(--text-3)',
    absent: 'var(--red)', holiday: 'var(--text-2)',
  };

  const actions = [
    { icon: <CalendarIcon size={18} />, label: 'Заявление на отпуск', href: '/vacations/new', hint: `${vacationBalance.remaining} дн. осталось` },
    { icon: <HospitalIcon size={18} />, label: 'Оформить больничный',  href: '/sick/new',      hint: null },
    { icon: <ClockIcon size={18} />,    label: 'Табель рабочего времени', href: '/time',        hint: null },
    { icon: <ListIcon size={18} />,     label: 'История заявок',       href: '/vacations',     hint: null },
  ];

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg)' }} className="pb-nav">
      {/* Header */}
      <div style={{
        background: 'var(--blue)',
        paddingTop: 'env(safe-area-inset-top)',
      }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '14px 20px 16px',
        }}>
          <div>
            <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12, fontWeight: 500 }}>
              {new Date().toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })}
            </div>
            <div style={{ color: '#fff', fontSize: 18, fontWeight: 700, marginTop: 1, letterSpacing: '-0.02em' }}>
              {user.firstName}
            </div>
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 1 }}>
              {user.position}
            </div>
          </div>
          <button
            onClick={() => router.push('/notifications')}
            style={{
              background: 'rgba(255,255,255,0.12)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 10, width: 40, height: 40,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', position: 'relative', color: '#fff',
            }}
          >
            <BellIcon size={18} />
            {unread > 0 && (
              <span style={{
                position: 'absolute', top: 7, right: 7,
                width: 7, height: 7, borderRadius: '50%',
                background: '#F87171',
                border: '1.5px solid var(--blue)',
              }} />
            )}
          </button>
        </div>
      </div>

      <div style={{ padding: '16px 16px 0' }}>
        {/* Vacation balance */}
        <AppCard style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 13, color: 'var(--text-3)', fontWeight: 500 }}>Отпуск</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.03em', marginTop: 1 }}>
                {vacationBalance.remaining}
                <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-2)', marginLeft: 4 }}>
                  из {vacationBalance.total} дн.
                </span>
              </div>
            </div>
            <div style={{
              background: 'var(--blue-surface)',
              color: 'var(--blue)',
              fontSize: 12, fontWeight: 600,
              padding: '4px 10px', borderRadius: 6,
            }}>
              {vacationBalance.used} использовано
            </div>
          </div>
          {/* Progress bar */}
          <div style={{
            height: 6, borderRadius: 3,
            background: 'var(--border-light)',
            overflow: 'hidden',
          }}>
            <div style={{
              height: '100%', borderRadius: 3,
              width: `${usedPct}%`,
              background: usedPct > 80 ? 'var(--amber)' : 'var(--blue)',
              transition: 'width 0.4s ease',
            }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
            <span style={{ fontSize: 11, color: 'var(--text-3)' }}>0</span>
            <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{usedPct}% использовано</span>
            <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{vacationBalance.total}</span>
          </div>
        </AppCard>

        {/* Today attendance */}
        {todayRecord && todayRecord.checkIn !== '—' && (
          <AppCard style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 13, color: 'var(--text-3)', fontWeight: 500, marginBottom: 4 }}>
                  Сегодня
                </div>
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.01em' }}>
                  {todayRecord.checkIn} → {todayRecord.checkOut}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}>
                  {todayRecord.total} рабочего времени
                </div>
              </div>
              <div style={{
                fontSize: 12, fontWeight: 500,
                color: STATUS_COLOR[todayRecord.status] ?? 'var(--text-2)',
                background: 'var(--border-light)',
                padding: '5px 10px', borderRadius: 6,
              }}>
                {STATUS_LABEL[todayRecord.status] ?? todayRecord.status}
              </div>
            </div>
          </AppCard>
        )}

        {/* Actions */}
        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
          Действия
        </div>
        <AppCard padding="0" style={{ marginBottom: 12 }}>
          {actions.map((action, i) => (
            <button
              key={action.href}
              onClick={() => router.push(action.href)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '13px 14px',
                width: '100%', background: 'none', border: 'none',
                borderBottom: i < actions.length - 1 ? '1px solid var(--border-light)' : 'none',
                cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
              }}
            >
              <div style={{
                width: 34, height: 34, borderRadius: 8,
                background: 'var(--border-light)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, color: 'var(--text-2)',
              }}>
                {action.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>
                  {action.label}
                </div>
                {action.hint && (
                  <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 1 }}>
                    {action.hint}
                  </div>
                )}
              </div>
              <ChevronRIcon size={16} color="var(--text-3)" />
            </button>
          ))}
        </AppCard>

        {/* Unread notifications */}
        {unread > 0 && (
          <AppCard
            onClick={() => router.push('/notifications')}
            padding="13px 14px"
            style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 12 }}
          >
            <div style={{
              width: 34, height: 34, borderRadius: 8,
              background: 'var(--blue-surface)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <BellIcon size={17} color="var(--blue)" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>
                {unread} непрочитанных уведомления
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 1 }}>
                Нажмите, чтобы просмотреть
              </div>
            </div>
            <ChevronRIcon size={16} color="var(--text-3)" />
          </AppCard>
        )}
      </div>
    </div>
  );
}
