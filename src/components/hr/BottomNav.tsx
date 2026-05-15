'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useHRStore } from '@/lib/hrStore';
import { HomeIcon, CalendarIcon, ClockIcon, UsersIcon, UserIcon } from './Icons';

const tabs = [
  { href: '/home',      Icon: HomeIcon,     label: 'Главная'     },
  { href: '/vacations', Icon: CalendarIcon,  label: 'Отпуска'     },
  { href: '/time',      Icon: ClockIcon,     label: 'Время'       },
  { href: '/employees', Icon: UsersIcon,     label: 'Сотрудники'  },
  { href: '/profile',   Icon: UserIcon,      label: 'Профиль'     },
];

export function BottomNav() {
  const pathname = usePathname();
  const { user } = useHRStore();
  const isManagerOrAdmin = user.role === 'manager' || user.role === 'admin';

  return (
    <nav style={{
      position: 'fixed',
      bottom: 0, left: 0, right: 0,
      background: 'var(--surface)',
      borderTop: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'stretch',
      paddingBottom: 'env(safe-area-inset-bottom)',
      zIndex: 100,
    }}>
      {tabs.map(({ href, Icon, label }) => {
        const skip = href === '/employees' && !isManagerOrAdmin;
        if (skip) return null;

        const active = pathname === href || pathname.startsWith(href + '/');

        return (
          <Link
            key={href}
            href={href}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 3,
              padding: '10px 4px',
              textDecoration: 'none',
              color: active ? 'var(--blue)' : 'var(--text-3)',
              transition: 'color 0.12s',
              minHeight: 52,
            }}
          >
            <Icon size={22} strokeWidth={active ? 2.1 : 1.7} />
            <span style={{
              fontSize: 11,
              fontWeight: active ? 600 : 400,
              lineHeight: 1,
              letterSpacing: '0.01em',
            }}>
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
