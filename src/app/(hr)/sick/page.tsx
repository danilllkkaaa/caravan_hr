'use client';
import { useRouter } from 'next/navigation';
import { useHRStore } from '@/lib/hrStore';
import { AppCard } from '@/components/hr/AppCard';
import { PlusIcon, ClipIcon } from '@/components/hr/Icons';
import { formatDate } from '@/lib/dateUtils';

const STATUS = {
  opened: { label: 'Открыт',  dot: 'var(--amber)', text: 'var(--amber)' },
  closed: { label: 'Закрыт',  dot: 'var(--green)', text: 'var(--green)' },
};

export default function SickPage() {
  const router = useRouter();
  const { sickLeaves } = useHRStore();
  const openCount = sickLeaves.filter((l) => l.status === 'opened').length;
  const totalDays = sickLeaves.filter((l) => l.status === 'closed').reduce((s, l) => s + l.days, 0);

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg)' }} className="pb-nav">
      <div style={{ background: 'var(--blue)', paddingTop: 'env(safe-area-inset-top)' }}>
        <div style={{ padding: '14px 20px 16px' }}>
          <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12, fontWeight: 500, marginBottom: 2 }}>Больничные</div>
          <div style={{ display: 'flex', gap: 20, marginTop: 8 }}>
            <div>
              <div style={{ color: '#fff', fontSize: 22, fontWeight: 700, letterSpacing: '-0.03em' }}>{sickLeaves.length}</div>
              <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, marginTop: 1 }}>всего</div>
            </div>
            <div>
              <div style={{ color: '#fff', fontSize: 22, fontWeight: 700, letterSpacing: '-0.03em' }}>{totalDays}</div>
              <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, marginTop: 1 }}>дней закрыто</div>
            </div>
            {openCount > 0 && (
              <div>
                <div style={{ color: '#FBBF24', fontSize: 22, fontWeight: 700, letterSpacing: '-0.03em' }}>{openCount}</div>
                <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, marginTop: 1 }}>открыто</div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ padding: '14px 16px 0' }}>
        {sickLeaves.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-3)', fontSize: 14 }}>
            Нет записей
          </div>
        ) : (
          <AppCard padding="0">
            {sickLeaves.map((sl, i) => {
              const s = STATUS[sl.status];
              return (
                <div key={sl.id} style={{
                  padding: '14px 16px',
                  borderBottom: i < sickLeaves.length - 1 ? '1px solid var(--border-light)' : 'none',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>
                      {formatDate(sl.startDate)}
                      {sl.endDate ? ` — ${formatDate(sl.endDate)}` : ' — открыт'}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: s.dot }} />
                      <span style={{ fontSize: 12, fontWeight: 500, color: s.text }}>{s.label}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                    {sl.status === 'closed' && (
                      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)' }}>{sl.days} дн.</span>
                    )}
                    {sl.hasFile && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--green)' }}>
                        <ClipIcon size={13} color="var(--green)" />
                        <span style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {sl.fileName}
                        </span>
                      </span>
                    )}
                    {!sl.hasFile && sl.status !== 'opened' && (
                      <span style={{ fontSize: 12, color: 'var(--text-3)' }}>Без файла</span>
                    )}
                    {sl.comment && (
                      <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{sl.comment}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </AppCard>
        )}
      </div>

      <button
        onClick={() => router.push('/sick/new')}
        style={{
          position: 'fixed',
          bottom: 'calc(72px + env(safe-area-inset-bottom))',
          right: 20,
          width: 52, height: 52, borderRadius: '50%',
          background: 'var(--blue)', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', boxShadow: '0 4px 16px rgba(37,99,235,0.4)', zIndex: 50,
        }}
      >
        <PlusIcon size={22} strokeWidth={2.5} />
      </button>
    </div>
  );
}
