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
    return () => {
      active = false;
    };
  }, [hydrate, pathname, router]);

  if (!ready) {
    return (
      <div style={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', color: '#78909C', fontSize: 14 }}>
        Загрузка...
      </div>
    );
  }

  return children;
}
