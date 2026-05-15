'use client';
import { useMemo, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useHRStore } from '@/lib/hrStore';
import { AppButton } from '@/components/hr/AppButton';
import { AppInput } from '@/components/hr/AppInput';
import { formatDate, calcDays } from '@/lib/dateUtils';

export default function SickDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const sickLeaves = useHRStore((s) => s.sickLeaves);
  const closeSickLeave = useHRStore((s) => s.closeSickLeave);
  const sickLeave = useMemo(() => sickLeaves.find((item) => item.id === Number(params.id)), [params.id, sickLeaves]);

  const [closing, setClosing] = useState(false);
  const [endDate, setEndDate] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  if (!sickLeave) {
    return (
      <div style={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', background: '#F4F7FB', padding: 20 }}>
        <AppButton onClick={() => router.push('/sick')}>К списку больничных</AppButton>
      </div>
    );
  }

  const currentSickLeave = sickLeave;
  const days = endDate ? calcDays(currentSickLeave.startDate, endDate) : 0;

  async function handleClose() {
    if (!closing) {
      setClosing(true);
      return;
    }
    if (!endDate) { setError('Выберите дату закрытия'); return; }
    if (days <= 0) { setError('Дата закрытия должна быть позже даты открытия'); return; }
    if (!file) { setError('Прикрепите файл больничного'); return; }

    setError('');
    setLoading(true);
    try {
      await closeSickLeave(currentSickLeave.id, endDate, file);
      router.push('/sick');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось закрыть больничный');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100dvh', background: '#F4F7FB', paddingBottom: 'calc(64px + env(safe-area-inset-bottom))' }}>
      <div style={{ background: 'linear-gradient(135deg, #C62828 0%, #E53935 100%)', padding: 'calc(env(safe-area-inset-top) + 16px) 20px 24px', borderRadius: '0 0 28px 28px' }}>
        <button onClick={() => router.push('/sick')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.8)', fontSize: 14, cursor: 'pointer', padding: '0 0 8px', fontFamily: 'inherit' }}>
          ← Назад
        </button>
        <div style={{ color: '#fff', fontSize: 20, fontWeight: 800 }}>Больничный</div>
        <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13, marginTop: 2 }}>
          Статус: {currentSickLeave.status === 'opened' ? 'открыт' : 'закрыт'}
        </div>
      </div>

      <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <AppInput label="Дата начала" type="date" value={currentSickLeave.startDate} disabled />
        {currentSickLeave.comment && (
          <div style={{ background: '#fff', borderRadius: 12, padding: 14, color: '#546E7A', fontSize: 14 }}>
            {currentSickLeave.comment}
          </div>
        )}

        {currentSickLeave.status === 'closed' && (
          <>
            <AppInput label="Дата закрытия" type="date" value={currentSickLeave.endDate ?? ''} disabled />
            <div style={{ background: '#E8F5E9', borderRadius: 12, padding: '10px 14px', fontSize: 14, fontWeight: 600, color: '#2E7D32', textAlign: 'center' }}>
              Закрыт: {currentSickLeave.endDate ? formatDate(currentSickLeave.endDate) : ''}, {currentSickLeave.days} дн.
            </div>
          </>
        )}

        {currentSickLeave.status === 'opened' && closing && (
          <>
            <AppInput label="Дата закрытия" type="date" value={endDate} min={currentSickLeave.startDate} onChange={(e) => setEndDate(e.target.value)} />
            {days > 0 && (
              <div style={{ background: '#FFEBEE', borderRadius: 12, padding: '10px 14px', fontSize: 14, fontWeight: 600, color: '#E53935', textAlign: 'center' }}>
                Длительность: {days} дн.
              </div>
            )}

            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#546E7A', marginBottom: 8 }}>Файл больничного</div>
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) setFile(f); }}
                onClick={() => fileRef.current?.click()}
                style={{ border: `2px dashed ${dragOver ? '#1976D2' : file ? '#4CAF50' : '#B0BEC5'}`, borderRadius: 14, padding: '20px 16px', textAlign: 'center', cursor: 'pointer', background: dragOver ? '#E3F2FD' : file ? '#E8F5E9' : '#FAFBFC' }}
              >
                <div style={{ fontSize: 32, marginBottom: 8 }}>{file ? '📎' : '📤'}</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: file ? '#4CAF50' : '#546E7A' }}>
                  {file ? file.name : 'Прикрепить файл'}
                </div>
                <div style={{ fontSize: 12, color: '#90A4AE', marginTop: 4 }}>
                  {file ? `${(file.size / 1024).toFixed(0)} КБ` : 'PDF, JPG, PNG - до 10 МБ'}
                </div>
                <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display: 'none' }} onChange={(e) => { const f = e.target.files?.[0]; if (f) setFile(f); }} />
              </div>
            </div>
          </>
        )}

        {error && (
          <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#E53935' }}>
            {error}
          </div>
        )}

        {currentSickLeave.status === 'opened' && (
          <AppButton onClick={handleClose} fullWidth disabled={loading} style={{ background: 'linear-gradient(135deg, #E53935 0%, #C62828 100%)', boxShadow: '0 2px 12px rgba(229,57,53,0.35)' }}>
            {loading ? 'Закрытие...' : closing ? 'Закрыть больничный' : 'Закрыть больничный'}
          </AppButton>
        )}
      </div>
    </div>
  );
}
