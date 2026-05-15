'use client';
import { useMemo, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useHRStore } from '@/lib/hrStore';
import { AppButton } from '@/components/hr/AppButton';
import { AppInput } from '@/components/hr/AppInput';
import { AppCard } from '@/components/hr/AppCard';
import { ChevronLIcon, CheckIcon, ClipIcon, XIcon, CalendarIcon } from '@/components/hr/Icons';
import { formatDate, calcDays } from '@/lib/dateUtils';

export default function SickDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const sickLeaves = useHRStore((s) => s.sickLeaves);
  const closeSickLeave = useHRStore((s) => s.closeSickLeave);
  const sl = useMemo(() => sickLeaves.find((item) => item.id === Number(params.id)), [params.id, sickLeaves]);

  const [endDate, setEndDate] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  if (!sl) return (
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: 20 }}>
      <AppButton onClick={() => router.push('/sick')}>К списку больничных</AppButton>
    </div>
  );

  const days = endDate && sl ? calcDays(sl.startDate, endDate) : 0;
  const isOpen = sl?.status === 'opened';

  async function handleClose() {
    if (!endDate) { setError('Выберите дату окончания'); return; }
    if (days <= 0) { setError('Дата окончания должна быть позже даты начала'); return; }
    if (!file) { setError('Прикрепите листок нетрудоспособности'); return; }
    setError('');
    setLoading(true);
    try {
      await closeSickLeave(sl!.id, endDate, file);
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось закрыть больничный');
    } finally {
      setLoading(false);
    }
  }

  if (done) return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 20px' }}>
      <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--green-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
        <CheckIcon size={26} color="var(--green)" strokeWidth={2.5} />
      </div>
      <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 6, textAlign: 'center' }}>Больничный закрыт</div>
      <div style={{ fontSize: 14, color: 'var(--text-2)', textAlign: 'center', lineHeight: 1.6, marginBottom: 28, maxWidth: 280 }}>
        {formatDate(sl.startDate)} — {formatDate(endDate)}, {days} дн. Документ передан в HR-отдел.
      </div>
      <AppButton onClick={() => router.push('/sick')} fullWidth style={{ maxWidth: 320 }}>К списку больничных</AppButton>
    </div>
  );

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg)' }} className="pb-nav">
      {/* Header */}
      <div style={{ background: 'var(--blue)', paddingTop: 'env(safe-area-inset-top)' }}>
        <div style={{ padding: '14px 20px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => router.push('/sick')}
            style={{ background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: 8, width: 34, height: 34, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}
          >
            <ChevronLIcon size={18} />
          </button>
          <div>
            <div style={{ color: '#fff', fontSize: 16, fontWeight: 600 }}>Больничный</div>
            <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13, marginTop: 1 }}>
              {isOpen ? 'Шаг 2 из 2 — закрытие' : 'Закрыт'}
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: '16px 16px 0', display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Info card */}
        <AppCard padding="0">
          <div style={{ padding: '13px 16px', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', gap: 12 }}>
            <CalendarIcon size={16} color="var(--text-3)" />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, color: 'var(--text-3)' }}>Дата начала</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginTop: 1 }}>{formatDate(sl.startDate)}</div>
            </div>
          </div>
          {sl.status === 'closed' && sl.endDate && (
            <div style={{ padding: '13px 16px', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', gap: 12 }}>
              <CalendarIcon size={16} color="var(--text-3)" />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, color: 'var(--text-3)' }}>Дата окончания</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginTop: 1 }}>{formatDate(sl.endDate)}</div>
              </div>
            </div>
          )}
          {sl.status === 'closed' && (
            <div style={{ padding: '13px 16px', borderBottom: sl.comment ? '1px solid var(--border-light)' : 'none', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--green)', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, color: 'var(--text-3)' }}>Длительность</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginTop: 1 }}>{sl.days} дн.</div>
              </div>
            </div>
          )}
          {sl.comment && (
            <div style={{ padding: '13px 16px' }}>
              <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 3 }}>Комментарий</div>
              <div style={{ fontSize: 14, color: 'var(--text-2)' }}>{sl.comment}</div>
            </div>
          )}
        </AppCard>

        {/* Closed state: show file if attached */}
        {sl.status === 'closed' && sl.hasFile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', background: 'var(--green-surface)', border: '1px solid var(--green-border)', borderRadius: 10 }}>
            <ClipIcon size={16} color="var(--green)" />
            <span style={{ flex: 1, fontSize: 13, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sl.fileName}</span>
          </div>
        )}

        {/* Open state: close form */}
        {isOpen && (
          <>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Закрытие больничного
            </div>

            <AppInput
              label="Дата окончания"
              type="date"
              value={endDate}
              min={sl.startDate}
              onChange={(e) => setEndDate(e.target.value)}
            />

            {days > 0 && (
              <div style={{ background: 'var(--blue-surface)', border: '1px solid var(--blue-border)', borderRadius: 8, padding: '10px 13px', fontSize: 14, color: 'var(--blue)', fontWeight: 500 }}>
                Длительность: <strong>{days} {days === 1 ? 'день' : days < 5 ? 'дня' : 'дней'}</strong>
              </div>
            )}

            {/* File upload */}
            <div>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-2)', marginBottom: 8 }}>
                Листок нетрудоспособности
              </div>
              {file ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', background: 'var(--green-surface)', border: '1px solid var(--green-border)', borderRadius: 8 }}>
                  <ClipIcon size={16} color="var(--green)" />
                  <span style={{ flex: 1, fontSize: 13, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-3)', flexShrink: 0 }}>{(file.size / 1024).toFixed(0)} КБ</span>
                  <button onClick={() => setFile(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', display: 'flex', padding: 2 }}>
                    <XIcon size={14} />
                  </button>
                </div>
              ) : (
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) setFile(f); }}
                  onClick={() => fileRef.current?.click()}
                  style={{
                    border: `1.5px dashed ${dragOver ? 'var(--blue)' : 'var(--border)'}`,
                    borderRadius: 8, padding: '20px 16px', textAlign: 'center',
                    cursor: 'pointer', background: dragOver ? 'var(--blue-surface)' : 'var(--surface)',
                    transition: 'all 0.15s',
                  }}
                >
                  <ClipIcon size={20} color="var(--text-3)" />
                  <div style={{ fontSize: 13, color: 'var(--text-2)', fontWeight: 500, marginTop: 8 }}>Прикрепить файл</div>
                  <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 3 }}>PDF, JPG, PNG — до 10 МБ</div>
                  <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display: 'none' }}
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) setFile(f); }} />
                </div>
              )}
            </div>

            {error && (
              <div style={{ background: 'var(--red-surface)', border: '1px solid var(--red-border)', borderRadius: 8, padding: '10px 13px', fontSize: 13, color: 'var(--red)' }}>
                {error}
              </div>
            )}

            <AppButton onClick={handleClose} fullWidth disabled={loading}>
              {loading ? 'Закрываем...' : 'Закрыть больничный'}
            </AppButton>
          </>
        )}
      </div>
    </div>
  );
}
