'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useHRStore } from '@/lib/hrStore';

export function BottomNav() {
  const pathname = usePathname();
  const { user, approvalVacations } = useHRStore();
  const isManagerOrAdmin = user.role === 'manager' || user.role === 'admin';

  const tabs = [
    { href: '/home', icon: '🏠', label: 'Главная' },
    { href: '/vacations', icon: '✈️', label: 'Отпуска' },
    { href: '/time', icon: '⏱️', label: 'Время' },
    { href: '/employees', icon: '👥', label: 'Сотрудники' },
    { href: '/profile', icon: '👤', label: 'Профиль' },
  ] as Array<{ href: string; icon: string; label: string; badge?: number }>;

  return (
    <nav style={{
      position: 'fixed',
      bottom: 0, left: 0, right: 0,
      height: 'calc(64px + env(safe-area-inset-bottom))',
      background: '#fff',
      borderTop: '1px solid #EEF2F7',
      display: 'flex',
      alignItems: 'flex-start',
      paddingTop: 8,
      paddingBottom: 'env(safe-area-inset-bottom)',
      zIndex: 100,
      boxShadow: '0 -2px 16px rgba(25,118,210,0.07)',
    }}>
      {tabs.map((tab) => {
        const active = pathname === tab.href || pathname.startsWith(tab.href + '/');
        const badge = tab.href === '/home' && isManagerOrAdmin && approvalVacations.length > 0
          ? approvalVacations.length
          : undefined;

        return (
          <Link
            key={tab.href}
            href={tab.href}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 3,
              textDecoration: 'none',
              position: 'relative',
            }}
          >
            <div style={{ position: 'relative', display: 'inline-flex' }}>
              <span style={{ fontSize: 22, lineHeight: 1, filter: active ? 'none' : 'grayscale(1) opacity(0.5)' }}>
                {tab.icon}
              </span>
              {badge != null && badge > 0 && (
                <span style={{
                  position: 'absolute', top: -4, right: -6,
                  minWidth: 16, height: 16, borderRadius: 8,
                  background: '#FF5252', border: '2px solid #fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 9, fontWeight: 800, color: '#fff',
                  padding: '0 3px',
                }}>
                  {badge > 99 ? '99+' : badge}
                </span>
              )}
            </div>
            <span style={{
              fontSize: 10,
              fontWeight: active ? 700 : 500,
              color: active ? '#1976D2' : '#90A4AE',
              lineHeight: 1,
            }}>
              {tab.label}
            </span>
            {active && (
              <div style={{
                position: 'absolute',
                top: -9, left: '50%',
                transform: 'translateX(-50%)',
                width: 28, height: 3,
                borderRadius: '0 0 4px 4px',
                background: '#1976D2',
              }} />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
