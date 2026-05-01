'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useHRStore } from '@/lib/hrStore';
import { AppCard } from '@/components/hr/AppCard';
import { formatDate } from '@/lib/dateUtils';

const STATUS_CONFIG = {
  opened: { label: 'Открыт', color: '#FF9800', bg: '#FFF8E1' },
  closed: { label: 'Закрыт', color: '#4CAF50', bg: '#E8F5E9' },
};

export default function SickPage() {
  const router = useRouter();
  const { sickLeaves, hasMoreSickLeaves, loadMoreSickLeaves } = useHRStore();
  const [loadingMore, setLoadingMore] = useState(false);
  const openedCount = sickLeaves.filter((l) => l.status === 'opened').length;

  async function handleLoadMore() {
    setLoadingMore(true);
    try {
      await loadMoreSickLeaves();
    } finally {
      setLoadingMore(false);
    }
  }

  return (
    <div style={{ minHeight: '100dvh', background: '#F4F7FB', paddingBottom: 'calc(64px + env(safe-area-inset-bottom))' }}>
      <div style={{ background: 'linear-gradient(135deg, #C62828 0%, #E53935 100%)', padding: 'calc(env(safe-area-inset-top) + 16px) 20px 24px', borderRadius: '0 0 28px 28px' }}>
        <div style={{ color: '#fff', fontSize: 20, fontWeight: 800 }}>Больничные</div>
        <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 2 }}>Листки нетрудоспособности</div>
        <div style={{ marginTop: 14, display: 'flex', gap: 8 }}>
          <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 10, padding: '8px 14px', border: '1px solid rgba(255,255,255,0.25)', textAlign: 'center', flex: 1 }}>
            <div style={{ color: '#fff', fontSize: 18, fontWeight: 800 }}>{sickLeaves.length}</div>
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 10, marginTop: 1 }}>Всего</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 10, padding: '8px 14px', border: '1px solid rgba(255,255,255,0.25)', textAlign: 'center', flex: 1 }}>
            <div style={{ color: '#fff', fontSize: 18, fontWeight: 800 }}>{openedCount}</div>
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 10, marginTop: 1 }}>Открыто</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 10, padding: '8px 14px', border: '1px solid rgba(255,255,255,0.25)', textAlign: 'center', flex: 1 }}>
            <div style={{ color: '#fff', fontSize: 18, fontWeight: 800 }}>{sickLeaves.reduce((s, l) => s + l.days, 0)}</div>
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 10, marginTop: 1 }}>Дней</div>
          </div>
        </div>
      </div>

      <div style={{ padding: '16px 16px 0' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {sickLeaves.map((sl) => {
            const cfg = STATUS_CONFIG[sl.status];
            return (
              <AppCard
                key={sl.id}
                padding="14px 16px"
                onClick={() => sl.status === 'opened' && router.push(`/sick/${sl.id}`)}
                style={{ cursor: sl.status === 'opened' ? 'pointer' : 'default' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#1A2332' }}>Больничный лист</div>
                    <div style={{ fontSize: 12, color: '#78909C', marginTop: 2 }}>
                      {formatDate(sl.startDate)} {sl.endDate ? `- ${formatDate(sl.endDate)}` : '- открыт'}
                    </div>
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: cfg.color, background: cfg.bg, padding: '4px 10px', borderRadius: 20 }}>
                    {cfg.label}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <div style={{ background: '#F0F4F8', borderRadius: 8, padding: '4px 10px', fontSize: 13, fontWeight: 700, color: '#E53935' }}>
                    {sl.status === 'opened' ? 'Открыт' : `${sl.days} дн.`}
                  </div>
                  {sl.hasFile && (
                    <a
                      href={`/api/sick-leaves/${sl.id}/file`}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#E8F5E9', borderRadius: 8, padding: '4px 10px', fontSize: 12, color: '#4CAF50', fontWeight: 600, textDecoration: 'none' }}
                    >
                      <span>📎</span>
                      <span style={{ maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sl.fileName}</span>
                    </a>
                  )}
                  {sl.comment && <div style={{ fontSize: 12, color: '#78909C', flex: 1 }}>{sl.comment}</div>}
                </div>
              </AppCard>
            );
          })}

          {hasMoreSickLeaves && (
            <button
              onClick={handleLoadMore}
              disabled={loadingMore}
              style={{
                width: '100%', padding: '14px', borderRadius: 14,
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

      <button
        onClick={() => router.push('/sick/new')}
        style={{ position: 'fixed', bottom: 'calc(80px + env(safe-area-inset-bottom))', right: 20, width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg, #E53935 0%, #C62828 100%)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, color: '#fff', boxShadow: '0 4px 20px rgba(229,57,53,0.45)', zIndex: 50 }}
      >
        +
      </button>
    </div>
  );
}
