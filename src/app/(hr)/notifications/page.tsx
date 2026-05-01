'use client';
import { useState } from 'react';
import { useHRStore } from '@/lib/hrStore';
import { AppCard } from '@/components/hr/AppCard';
import { AppButton } from '@/components/hr/AppButton';

const TYPE_CONFIG = {
  approved: { icon: '✅', color: '#4CAF50', bg: '#E8F5E9' },
  rejected: { icon: '❌', color: '#E53935', bg: '#FFEBEE' },
  info: { icon: 'ℹ️', color: '#1976D2', bg: '#E3F2FD' },
  reminder: { icon: '⏰', color: '#FF9800', bg: '#FFF8E1' },
};

export default function NotificationsPage() {
  const { notifications, markNotificationRead, markAllNotificationsRead, hasMoreNotifications, loadMoreNotifications } = useHRStore();
  const [loadingMore, setLoadingMore] = useState(false);
  const unreadCount = notifications.filter((n) => !n.read).length;

  const grouped: Record<string, typeof notifications> = {};
  for (const n of notifications) {
    if (!grouped[n.date]) grouped[n.date] = [];
    grouped[n.date].push(n);
  }
  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  function formatGroupDate(iso: string): string {
    const d = new Date(iso);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return 'Сегодня';
    if (d.toDateString() === yesterday.toDateString()) return 'Вчера';
    return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
  }

  async function handleLoadMore() {
    setLoadingMore(true);
    try {
      await loadMoreNotifications();
    } finally {
      setLoadingMore(false);
    }
  }

  return (
    <div style={{ minHeight: '100dvh', background: '#F4F7FB', paddingBottom: 'calc(64px + env(safe-area-inset-bottom))' }}>
      <div style={{
        background: 'linear-gradient(135deg, #1565C0 0%, #1976D2 100%)',
        padding: 'calc(env(safe-area-inset-top) + 16px) 20px 24px',
        borderRadius: '0 0 28px 28px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ color: '#fff', fontSize: 20, fontWeight: 800 }}>Уведомления</div>
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 2 }}>
              {unreadCount > 0 ? `${unreadCount} непрочитанных` : 'Все прочитаны'}
            </div>
          </div>
          {unreadCount > 0 && (
            <AppButton
              onClick={markAllNotificationsRead}
              variant="ghost"
              style={{ color: 'rgba(255,255,255,0.9)', fontSize: 13, padding: '8px 12px' }}
            >
              Прочитать все
            </AppButton>
          )}
        </div>
      </div>

      <div style={{ padding: '16px 16px 0' }}>
        {sortedDates.map((date) => (
          <div key={date} style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#90A4AE', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8, paddingLeft: 2 }}>
              {formatGroupDate(date)}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {grouped[date].map((notif) => {
                const cfg = TYPE_CONFIG[notif.type];
                return (
                  <AppCard
                    key={notif.id}
                    onClick={() => markNotificationRead(notif.id)}
                    padding="14px"
                    style={{
                      display: 'flex', alignItems: 'flex-start', gap: 12,
                      opacity: notif.read ? 0.75 : 1,
                      borderLeft: !notif.read ? `3px solid ${cfg.color}` : '3px solid transparent',
                    }}
                  >
                    <div style={{
                      width: 40, height: 40, borderRadius: 12,
                      background: cfg.bg,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 20, flexShrink: 0,
                    }}>
                      {cfg.icon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                        <div style={{ fontSize: 14, fontWeight: notif.read ? 600 : 800, color: '#1A2332', flex: 1 }}>
                          {notif.title}
                        </div>
                        <div style={{ fontSize: 11, color: '#90A4AE', flexShrink: 0, marginTop: 2 }}>{notif.time}</div>
                      </div>
                      <div style={{ fontSize: 13, color: '#78909C', marginTop: 4, lineHeight: 1.5 }}>
                        {notif.description}
                      </div>
                    </div>
                    {!notif.read && (
                      <div style={{
                        width: 8, height: 8, borderRadius: '50%',
                        background: cfg.color, flexShrink: 0, marginTop: 4,
                      }} />
                    )}
                  </AppCard>
                );
              })}
            </div>
          </div>
        ))}

        {hasMoreNotifications && (
          <button
            onClick={handleLoadMore}
            disabled={loadingMore}
            style={{
              width: '100%', padding: '14px', borderRadius: 14, marginBottom: 16,
              border: '1.5px dashed #B0BEC5', background: 'transparent',
              color: '#546E7A', fontSize: 13, fontWeight: 600,
              cursor: loadingMore ? 'default' : 'pointer', fontFamily: 'inherit',
            }}
          >
            {loadingMore ? 'Загрузка...' : 'Загрузить ещё'}
          </button>
        )}
      </div>
    </div>
  );
}
