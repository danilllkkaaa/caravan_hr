'use client';
import { useHRStore } from '@/lib/hrStore';
import { AppCard } from '@/components/hr/AppCard';
import { AppButton } from '@/components/hr/AppButton';
import { CheckIcon, XIcon, InfoIcon, BellIcon } from '@/components/hr/Icons';

const TYPE_CFG = {
  approved: { Icon: CheckIcon, color: 'var(--green)', bg: 'var(--green-surface)' },
  rejected: { Icon: XIcon,     color: 'var(--red)',   bg: 'var(--red-surface)'   },
  info:     { Icon: InfoIcon,  color: 'var(--blue)',  bg: 'var(--blue-surface)'  },
  reminder: { Icon: BellIcon,  color: 'var(--amber)', bg: 'var(--amber-surface)' },
};

export default function NotificationsPage() {
  const { notifications, markNotificationRead, markAllNotificationsRead } = useHRStore();
  const unreadCount = notifications.filter((n) => !n.read).length;

  const grouped: Record<string, typeof notifications> = {};
  for (const n of notifications) {
    if (!grouped[n.date]) grouped[n.date] = [];
    grouped[n.date].push(n);
  }
  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  function formatGroupDate(iso: string) {
    const d = new Date(iso);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return 'Сегодня';
    if (d.toDateString() === yesterday.toDateString()) return 'Вчера';
    return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
  }

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg)' }} className="pb-nav">
      <div style={{ background: 'var(--blue)', paddingTop: 'env(safe-area-inset-top)' }}>
        <div style={{ padding: '14px 20px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ color: '#fff', fontSize: 16, fontWeight: 600 }}>Уведомления</div>
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 1 }}>
              {unreadCount > 0 ? `${unreadCount} непрочитанных` : 'Все прочитаны'}
            </div>
          </div>
          {unreadCount > 0 && (
            <AppButton
              onClick={markAllNotificationsRead}
              variant="ghost"
              style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13, padding: '6px 10px' }}
            >
              Прочитать все
            </AppButton>
          )}
        </div>
      </div>

      <div style={{ padding: '14px 16px 0' }}>
        {sortedDates.map((date) => (
          <div key={date} style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
              {formatGroupDate(date)}
            </div>
            <AppCard padding="0">
              {grouped[date].map((notif, i) => {
                const { Icon, color, bg } = TYPE_CFG[notif.type];
                return (
                  <div
                    key={notif.id}
                    onClick={() => markNotificationRead(notif.id)}
                    style={{
                      display: 'flex', alignItems: 'flex-start', gap: 12,
                      padding: '13px 14px',
                      borderBottom: i < grouped[date].length - 1 ? '1px solid var(--border-light)' : 'none',
                      cursor: 'pointer',
                      opacity: notif.read ? 0.6 : 1,
                      borderLeft: !notif.read ? `3px solid ${color}` : '3px solid transparent',
                    }}
                  >
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon size={16} color={color} strokeWidth={2} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 3 }}>
                        <div style={{ fontSize: 14, fontWeight: notif.read ? 500 : 600, color: 'var(--text)' }}>
                          {notif.title}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-3)', flexShrink: 0 }}>{notif.time}</div>
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.5 }}>
                        {notif.description}
                      </div>
                    </div>
                  </div>
                );
              })}
            </AppCard>
          </div>
        ))}
      </div>
    </div>
  );
}
