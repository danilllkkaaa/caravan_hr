import { BottomNav } from '@/components/hr/BottomNav';
import { AuthGate } from '@/components/hr/AuthGate';

export default function HRLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100dvh', background: '#F4F7FB', position: 'relative' }}>
      <AuthGate>
        <main>{children}</main>
        <BottomNav />
      </AuthGate>
    </div>
  );
}
