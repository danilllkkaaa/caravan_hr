'use client';
import { useEffect, useState } from 'react';
import { useHRStore } from '@/lib/hrStore';
import { AppCard } from '@/components/hr/AppCard';
import { AppButton } from '@/components/hr/AppButton';
import { formatDate } from '@/lib/dateUtils';
import type { ApprovalVacation } from '@/lib/mockData';

export default function ApprovalsPage() {
  const { user, approvalVacations, loadApprovals, approveVacation, rejectVacation } = useHRStore();
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadApprovals().catch(() => {});
  }, [loadApprovals]);

  if (user.role !== 'manager' && user.role !== 'admin') {
    return (
      <div style={{ minHeight: '100dvh', background: '#F4F7FB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#90A4AE', fontSize: 14 }}>Доступ только для менеджеров</div>
      </div>
    );
  }

  async function handleAction(v: ApprovalVacation, action: 'approve' | 'reject') {
    setLoadingId(v.id);
    setError(null);
    try {
      if (action === 'approve') await approveVacation(v.id);
      else await rejectVacation(v.id);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Ошибка');
    } finally {
      setLoadingId(null);
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
        <div style={{ color: '#fff', fontSize: 20, fontWeight: 800 }}>Согласования</div>
        <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 2 }}>
          {approvalVacations.length > 0
            ? `${approvalVacations.length} заявок ожидают решения`
            : 'Новых заявок нет'}
        </div>
      </div>

      <div style={{ padding: '16px 16px 0' }}>
        {error && (
          <div style={{ background: '#FFEBEE', border: '1px solid #FFCDD2', borderRadius: 12, padding: '12px 14px', marginBottom: 12, color: '#C62828', fontSize: 13 }}>
            {error}
          </div>
        )}

        {approvalVacations.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 0', color: '#90A4AE' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#546E7A', marginBottom: 4 }}>Всё согласовано</div>
            <div style={{ fontSize: 13 }}>Нет заявок на рассмотрении</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {approvalVacations.map((v) => (
              <AppCard key={v.id} padding="16px">
                {/* Employee info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 12,
                    background: 'linear-gradient(135deg, #1565C0 0%, #1976D2 100%)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontSize: 16, fontWeight: 800, flexShrink: 0,
                  }}>
                    {v.userFirstName.charAt(0)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#1A2332', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {v.userName}
                    </div>
                    <div style={{ fontSize: 12, color: '#78909C', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {v.userPosition} · {v.userDepartment}
                    </div>
                  </div>
                  <div style={{
                    fontSize: 11, fontWeight: 700, color: '#FF9800',
                    background: '#FFF8E1', padding: '4px 10px', borderRadius: 20, flexShrink: 0,
                  }}>
                    На рассмотрении
                  </div>
                </div>

                {/* Vacation details */}
                <div style={{ background: '#F8FAFC', borderRadius: 10, padding: '10px 12px', marginBottom: 12 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#1A2332', marginBottom: 6 }}>{v.type}</div>
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ fontSize: 10, color: '#90A4AE', textTransform: 'uppercase', letterSpacing: 0.5 }}>Период</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#37474F', marginTop: 1 }}>
                        {formatDate(v.startDate)} — {formatDate(v.endDate)}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: '#90A4AE', textTransform: 'uppercase', letterSpacing: 0.5 }}>Дней</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#1976D2', marginTop: 1 }}>{v.days}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: '#90A4AE', textTransform: 'uppercase', letterSpacing: 0.5 }}>Подано</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#37474F', marginTop: 1 }}>{formatDate(v.createdAt)}</div>
                    </div>
                  </div>
                  {v.comment && (
                    <div style={{ marginTop: 8, fontSize: 12, color: '#78909C', lineHeight: 1.5 }}>
                      💬 {v.comment}
                    </div>
                  )}
                </div>

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: 8 }}>
                  <AppButton
                    variant="primary"
                    fullWidth
                    onClick={() => handleAction(v, 'approve')}
                    disabled={loadingId === v.id}
                    style={{ fontSize: 13 }}
                  >
                    {loadingId === v.id ? '...' : 'Одобрить'}
                  </AppButton>
                  <AppButton
                    variant="danger"
                    fullWidth
                    onClick={() => handleAction(v, 'reject')}
                    disabled={loadingId === v.id}
                    style={{ fontSize: 13 }}
                  >
                    {loadingId === v.id ? '...' : 'Отклонить'}
                  </AppButton>
                </div>
              </AppCard>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
