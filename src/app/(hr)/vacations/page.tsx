'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useHRStore } from '@/lib/hrStore';
import { AppCard } from '@/components/hr/AppCard';
import { PlusIcon } from '@/components/hr/Icons';
import { formatDate } from '@/lib/dateUtils';
import type { VacationStatus } from '@/lib/mockData';

const STATUS: Record<VacationStatus, { label: string; dot: string; text: string }> = {
  approved: { label: 'Одобрен',          dot: 'var(--green)', text: 'var(--green)' },
  pending:  { label: 'На рассмотрении',  dot: 'var(--amber)', text: 'var(--amber)' },
  rejected: { label: 'Отклонён',         dot: 'var(--red)',   text: 'var(--red)'   },
  draft:    { label: 'Черновик',         dot: 'var(--text-3)', text: 'var(--text-3)' },
};

const FILTERS: { key: 'all' | VacationStatus; label: string }[] = [
  { key: 'all',      label: 'Все'       },
  { key: 'approved', label: 'Одобрены'  },
  { key: 'pending',  label: 'В работе'  },
  { key: 'rejected', label: 'Отклонены' },
];

export default function VacationsPage() {
  const router = useRouter();
  const { vacations, vacationBalance } = useHRStore();
  const [filter, setFilter] = useState<'all' | VacationStatus>('all');

  const filtered = filter === 'all' ? vacations : vacations.filter((v) => v.status === filter);

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg)' }} className="pb-nav">
      {/* Header */}
      <div style={{ background: 'var(--blue)', paddingTop: 'env(safe-area-inset-top)' }}>
        <div style={{ padding: '14px 20px 16px' }}>
          <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: 500, marginBottom: 2 }}>
            Доступно дней
          </div>
          <div style={{ color: '#fff', fontSize: 26, fontWeight: 700, letterSpacing: '-0.03em' }}>
            {vacationBalance.remaining}
            <span style={{ fontSize: 15, fontWeight: 500, color: 'rgba(255,255,255,0.8)', marginLeft: 6 }}>
              из {vacationBalance.total}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
            <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13 }}>
              Использовано: <strong style={{ color: '#fff' }}>{vacationBalance.used} дн.</strong>
            </span>
          </div>
        </div>
      </div>

      <div style={{ padding: '14px 16px 0' }}>
        {/* Filters */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 14, overflowX: 'auto' }} className="no-scrollbar">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              style={{
                padding: '6px 14px', borderRadius: 6,
                border: filter === f.key ? 'none' : '1px solid var(--border)',
                cursor: 'pointer', fontSize: 14, fontWeight: 500,
                whiteSpace: 'nowrap', fontFamily: 'inherit',
                background: filter === f.key ? 'var(--blue)' : 'var(--surface)',
                color: filter === f.key ? '#fff' : 'var(--text-2)',
                transition: 'all 0.1s',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* List */}
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-3)', fontSize: 14 }}>
            Заявлений нет
          </div>
        ) : (
          <AppCard padding="0">
            {filtered.map((v, i) => {
              const s = STATUS[v.status];
              return (
                <div key={v.id} style={{
                  padding: '14px 16px',
                  borderBottom: i < filtered.length - 1 ? '1px solid var(--border-light)' : 'none',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>
                      {formatDate(v.startDate)} — {formatDate(v.endDate)}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                      <div style={{ width: 7, height: 7, borderRadius: '50%', background: s.dot }} />
                      <span style={{ fontSize: 13, fontWeight: 500, color: s.text }}>{s.label}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <span style={{ fontSize: 13, color: 'var(--text-3)' }}>{v.type}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)' }}>{v.days} дн.</span>
                    {v.comment && (
                      <span style={{ fontSize: 13, color: 'var(--text-3)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {v.comment}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </AppCard>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => router.push('/vacations/new')}
        style={{
          position: 'fixed',
          bottom: 'calc(72px + env(safe-area-inset-bottom))',
          right: 20,
          width: 52, height: 52,
          borderRadius: '50%',
          background: 'var(--blue)',
          border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff',
          boxShadow: '0 4px 16px rgba(37,99,235,0.4)',
          zIndex: 50,
        }}
      >
        <PlusIcon size={22} strokeWidth={2.5} />
      </button>
    </div>
  );
}
