'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useHRStore } from '@/lib/hrStore';
import { AppCard } from '@/components/hr/AppCard';
import { formatDate } from '@/lib/dateUtils';
import type { VacationStatus } from '@/lib/mockData';

const STATUS_CONFIG = {
  approved: { label: 'Одобрен', color: '#4CAF50', bg: '#E8F5E9' },
  pending: { label: 'На рассмотрении', color: '#FF9800', bg: '#FFF8E1' },
  rejected: { label: 'Отклонён', color: '#E53935', bg: '#FFEBEE' },
  draft: { label: 'Черновик', color: '#90A4AE', bg: '#F5F5F5' },
};

const FILTERS: { key: 'all' | VacationStatus; label: string }[] = [
  { key: 'all', label: 'Все' },
  { key: 'approved', label: 'Одобрены' },
  { key: 'pending', label: 'Ожидают' },
  { key: 'rejected', label: 'Отклонены' },
];

export default function VacationsPage() {
  const router = useRouter();
  const { vacations, vacationBalance, hasMoreVacations, loadMoreVacations } = useHRStore();
  const [filter, setFilter] = useState<'all' | VacationStatus>('all');
  const [loadingMore, setLoadingMore] = useState(false);

  const filtered = filter === 'all' ? vacations : vacations.filter((v) => v.status === filter);

  async function handleLoadMore() {
    setLoadingMore(true);
    try {
      await loadMoreVacations();
    } finally {
      setLoadingMore(false);
    }
  }

  return (
    <div style={{ minHeight: '100dvh', background: '#F4F7FB', paddingBottom: 'calc(64px + env(safe-area-inset-bottom))' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #1565C0 0%, #1976D2 100%)',
        padding: 'calc(env(safe-area-inset-top) + 16px) 20px 24px',
        borderRadius: '0 0 28px 28px',
      }}>
        <div style={{ color: '#fff', fontSize: 20, fontWeight: 800 }}>Отпуска</div>
        <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 2 }}>История заявлений</div>

        {/* Balance chips */}
        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          {[
            { label: 'Остаток', value: vacationBalance.remaining, color: '#fff', bg: 'rgba(255,255,255,0.2)' },
            { label: 'Использовано', value: vacationBalance.used, color: '#fff', bg: 'rgba(255,255,255,0.15)' },
            { label: 'Всего', value: vacationBalance.total, color: 'rgba(255,255,255,0.8)', bg: 'rgba(255,255,255,0.1)' },
          ].map((chip) => (
            <div key={chip.label} style={{
              flex: 1, background: chip.bg, borderRadius: 12,
              padding: '8px 6px', textAlign: 'center',
              border: '1px solid rgba(255,255,255,0.2)',
            }}>
              <div style={{ color: chip.color, fontSize: 18, fontWeight: 800 }}>{chip.value}</div>
              <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 10, marginTop: 1 }}>{chip.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: '16px 16px 0' }}>
        {/* Filters */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, overflowX: 'auto', paddingBottom: 4 }} className="no-scrollbar">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              style={{
                padding: '7px 16px', borderRadius: 20,
                border: 'none', cursor: 'pointer',
                fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap',
                background: filter === f.key ? '#1976D2' : '#fff',
                color: filter === f.key ? '#fff' : '#546E7A',
                boxShadow: filter === f.key ? '0 2px 8px rgba(25,118,210,0.3)' : '0 1px 4px rgba(0,0,0,0.06)',
                fontFamily: 'inherit',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '48px 0', color: '#90A4AE', fontSize: 14 }}>
              Заявления не найдены
            </div>
          )}
          {filtered.map((v) => {
            const cfg = STATUS_CONFIG[v.status];
            return (
              <AppCard key={v.id} padding="14px 16px">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#1A2332' }}>{v.type}</div>
                    <div style={{ fontSize: 12, color: '#78909C', marginTop: 2 }}>
                      {formatDate(v.startDate)} — {formatDate(v.endDate)}
                    </div>
                  </div>
                  <div style={{
                    fontSize: 11, fontWeight: 700,
                    color: cfg.color, background: cfg.bg,
                    padding: '4px 10px', borderRadius: 20,
                  }}>
                    {cfg.label}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <div style={{
                    background: '#F0F4F8', borderRadius: 8,
                    padding: '4px 10px', fontSize: 13, fontWeight: 700, color: '#1976D2',
                  }}>
                    {v.days} дн.
                  </div>
                  {v.comment && (
                    <div style={{ fontSize: 12, color: '#78909C', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {v.comment}
                    </div>
                  )}
                </div>
              </AppCard>
            );
          })}

          {hasMoreVacations && filter === 'all' && (
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

      {/* FAB */}
      <button
        onClick={() => router.push('/vacations/new')}
        style={{
          position: 'fixed',
          bottom: 'calc(80px + env(safe-area-inset-bottom))',
          right: 20,
          width: 56, height: 56,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #1976D2 0%, #1565C0 100%)',
          border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 26, color: '#fff',
          boxShadow: '0 4px 20px rgba(25,118,210,0.45)',
          zIndex: 50,
        }}
      >
        +
      </button>
    </div>
  );
}
