'use client';
import { useRouter } from 'next/navigation';
import { useHRStore } from '@/lib/hrStore';
import { AppCard } from '@/components/hr/AppCard';

const CIRCLE_R = 38;
const CIRCLE_C = 48;
const CIRCLE_DASH = 2 * Math.PI * CIRCLE_R;

const TIME_STATUS_LABEL: Record<string, string> = {
  overtime: 'Сверхурочно',
  short: 'Неполный день',
  normal: 'Рабочий день',
  weekend: 'Выходной',
  holiday: 'Праздник',
  absent: 'Отсутствие',
};

const TIME_STATUS_COLOR: Record<string, { color: string; bg: string }> = {
  overtime: { color: '#4CAF50', bg: '#E8F5E9' },
  short:    { color: '#FF9800', bg: '#FFF8E1' },
  normal:   { color: '#1976D2', bg: '#E3F2FD' },
  weekend:  { color: '#90A4AE', bg: '#F5F5F5' },
  holiday:  { color: '#9C27B0', bg: '#F3E5F5' },
  absent:   { color: '#E53935', bg: '#FFEBEE' },
};

export default function HomePage() {
  const router = useRouter();
  const { user, vacationBalance, notifications, timeRecords } = useHRStore();

  const unread = notifications.filter((n) => !n.read);
  const usedFrac = vacationBalance.total > 0 ? vacationBalance.used / vacationBalance.total : 0;
  const strokeDash = CIRCLE_DASH * usedFrac;

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayRecord = timeRecords.find((r) => r.date === todayStr) ?? null;

  const isManagerOrAdmin = user.role === 'manager' || user.role === 'admin';

  const quickActions = [
    { icon: '✈️', label: 'Новый отпуск', href: '/vacations/new', color: '#E3F2FD' },
    { icon: '🏥', label: 'Больничный', href: '/sick', color: '#FCE4EC' },
    { icon: '⏱️', label: 'Табель', href: '/time', color: '#E8F5E9' },
    { icon: '📋', label: 'Мои заявки', href: '/vacations', color: '#FFF8E1' },
    ...(isManagerOrAdmin
      ? [{ icon: '✅', label: 'Согласования', href: '/approvals', color: '#EDE7F6' }]
      : []),
  ];

  return (
    <div style={{ minHeight: '100dvh', background: '#F4F7FB', paddingBottom: 'calc(64px + env(safe-area-inset-bottom))' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #1565C0 0%, #1976D2 100%)',
        padding: 'calc(env(safe-area-inset-top) + 16px) 20px 28px',
        borderRadius: '0 0 28px 28px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13 }}>Добро пожаловать,</div>
            <div style={{ color: '#fff', fontSize: 20, fontWeight: 800, marginTop: 2 }}>{user.firstName}</div>
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 2 }}>{user.position}</div>
          </div>
          <button
            onClick={() => router.push('/notifications')}
            style={{
              background: 'rgba(255,255,255,0.2)', border: 'none',
              borderRadius: 14, width: 44, height: 44,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', position: 'relative',
            }}
          >
            <span style={{ fontSize: 22 }}>🔔</span>
            {unread.length > 0 && (
              <span style={{
                position: 'absolute', top: 6, right: 6,
                width: 10, height: 10, borderRadius: '50%',
                background: '#FF5252', border: '2px solid #1976D2',
              }} />
            )}
          </button>
        </div>
      </div>

      <div style={{ padding: '16px 16px 0' }}>
        {/* Vacation balance */}
        <AppCard style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <svg width={CIRCLE_C * 2} height={CIRCLE_C * 2} style={{ flexShrink: 0 }}>
              <circle cx={CIRCLE_C} cy={CIRCLE_C} r={CIRCLE_R} fill="none" stroke="#EEF2F7" strokeWidth={7} />
              <circle
                cx={CIRCLE_C} cy={CIRCLE_C} r={CIRCLE_R}
                fill="none" stroke="#1976D2" strokeWidth={7}
                strokeDasharray={`${strokeDash} ${CIRCLE_DASH}`}
                strokeLinecap="round"
                transform={`rotate(-90 ${CIRCLE_C} ${CIRCLE_C})`}
              />
              <text x={CIRCLE_C} y={CIRCLE_C + 5} textAnchor="middle" fill="#1A2332" fontSize="15" fontWeight="800" fontFamily="Inter, sans-serif">
                {vacationBalance.remaining}
              </text>
            </svg>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#1A2332', marginBottom: 4 }}>Остаток отпуска</div>
              <div style={{ fontSize: 13, color: '#78909C', marginBottom: 10 }}>
                Использовано <span style={{ fontWeight: 700, color: '#1976D2' }}>{vacationBalance.used}</span> из {vacationBalance.total} дней
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {[
                  { label: 'Остаток', value: vacationBalance.remaining, color: '#1976D2' },
                  { label: 'Использовано', value: vacationBalance.used, color: '#FF9800' },
                  { label: 'Всего', value: vacationBalance.total, color: '#78909C' },
                ].map((item) => (
                  <div key={item.label} style={{ flex: 1, background: '#F8FAFC', borderRadius: 10, padding: '6px 8px', textAlign: 'center' }}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: item.color }}>{item.value}</div>
                    <div style={{ fontSize: 10, color: '#90A4AE' }}>{item.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </AppCard>

        {/* Today's time — read-only, populated from Hikvision */}
        {todayRecord && todayRecord.checkIn !== '—' && (
          <AppCard style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#1A2332' }}>Сегодня</div>
              {todayRecord.status in TIME_STATUS_COLOR && (
                <div style={{
                  fontSize: 11, fontWeight: 600,
                  color: TIME_STATUS_COLOR[todayRecord.status].color,
                  background: TIME_STATUS_COLOR[todayRecord.status].bg,
                  padding: '3px 10px', borderRadius: 20,
                }}>
                  {TIME_STATUS_LABEL[todayRecord.status] ?? todayRecord.status}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {[
                { icon: '🟢', label: 'Приход', value: todayRecord.checkIn },
                { icon: '🔴', label: 'Уход', value: todayRecord.checkOut },
                { icon: '⏱️', label: 'Рабочее время', value: todayRecord.total },
              ].map((item) => (
                <div key={item.label} style={{ flex: 1, background: '#F8FAFC', borderRadius: 10, padding: '8px 6px', textAlign: 'center' }}>
                  <div style={{ fontSize: 16 }}>{item.icon}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#1A2332', marginTop: 2 }}>{item.value}</div>
                  <div style={{ fontSize: 10, color: '#90A4AE' }}>{item.label}</div>
                </div>
              ))}
            </div>
          </AppCard>
        )}

        {/* Quick actions */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#90A4AE', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10, paddingLeft: 2 }}>
            Быстрые действия
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {quickActions.map((action) => (
              <AppCard
                key={action.href}
                onClick={() => router.push(action.href)}
                padding="14px"
                style={{ display: 'flex', alignItems: 'center', gap: 10 }}
              >
                <div style={{
                  width: 40, height: 40, borderRadius: 12,
                  background: action.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 20, flexShrink: 0,
                }}>
                  {action.icon}
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#1A2332', lineHeight: 1.3 }}>
                  {action.label}
                </div>
              </AppCard>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
