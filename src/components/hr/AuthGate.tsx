'use client';
import { ReactNode, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useHRStore } from '@/lib/hrStore';

export function AuthGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const hydrate = useHRStore((s) => s.hydrate);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    hydrate().then((ok) => {
      if (!active) return;
      if (!ok) {
        router.replace(`/login?next=${encodeURIComponent(pathname)}`);
        return;
      }
      setReady(true);
    });
    return () => { active = false; };
  }, [hydrate, pathname, router]);

  if (!ready) return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg)',
    }}>
      <div style={{
        width: 28, height: 28, borderRadius: '50%',
        border: '3px solid var(--border)',
        borderTopColor: 'var(--blue)',
        animation: 'spin 0.7s linear infinite',
      }} />
    </div>
  );

  return <>{children}</>;
}
