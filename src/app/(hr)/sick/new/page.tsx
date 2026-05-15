'use client';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useHRStore } from '@/lib/hrStore';
import { AppButton } from '@/components/hr/AppButton';
import { AppInput, AppTextarea } from '@/components/hr/AppInput';
import { ChevronLIcon, CheckIcon, ClipIcon, XIcon } from '@/components/hr/Icons';
import { formatDate, calcDays } from '@/lib/dateUtils';

export default function NewSickPage() {
  const router = useRouter();
  const addSickLeave = useHRStore((s) => s.addSickLeave);
  const closeSickLeave = useHRStore((s) => s.closeSickLeave);

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [comment, setComment] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const days = startDate && endDate ? calcDays(startDate, endDate) : 0;

  async function handleSubmit() {
    if (!startDate) { setError('Выберите дату начала'); return; }
    if (!endDate) { setError('Выберите дату окончания'); return; }
    if (days <= 0) { setError('Дата окончания должна быть позже даты начала'); return; }
    if (!file) { setError('Прикрепите файл больничного'); return; }
    setError('');
    setLoading(true);
    try {
      const sickLeave = await addSickLeave({ startDate, comment });
      await closeSickLeave(sickLeave.id, endDate, file);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось оформить больничный');
    } finally {
      setLoading(false);
    }
  }

  if (success) return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 20px' }}>
      <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--green-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
        <CheckIcon size={26} color="var(--green)" strokeWidth={2.5} />
      </div>
      <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 6, textAlign: 'center' }}>Больничный оформлен</div>
      <div style={{ fontSize: 14, color: 'var(--text-2)', textAlign: 'center', lineHeight: 1.6, marginBottom: 28, maxWidth: 280 }}>
        {formatDate(startDate)} — {formatDate(endDate)}, {days} дн. Передан в HR-отдел.
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%', maxWidth: 320 }}>
        <AppButton onClick={() => router.push('/sick')} fullWidth>К списку больничных</AppButton>
        <AppButton onClick={() => router.push('/home')} variant="secondary" fullWidth>На главную</AppButton>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg)' }} className="pb-nav">
      <div style={{ background: 'var(--blue)', paddingTop: 'env(safe-area-inset-top)' }}>
        <div style={{ padding: '14px 20px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => router.push('/sick')} style={{ background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: 8, width: 34, height: 34, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
            <ChevronLIcon size={18} />
          </button>
          <div style={{ color: '#fff', fontSize: 16, fontWeight: 600 }}>Новый больничный</div>
        </div>
      </div>

      <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <AppInput label="Начало" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          <AppInput label="Окончание" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} min={startDate} />
        </div>

        {days > 0 && (
          <div style={{ background: 'var(--blue-surface)', border: '1px solid var(--blue-border)', borderRadius: 8, padding: '10px 13px', fontSize: 14, color: 'var(--blue)', fontWeight: 500 }}>
            Продолжительность: <strong>{days} {days === 1 ? 'день' : days < 5 ? 'дня' : 'дней'}</strong>
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
              <div style={{ fontSize: 13, color: 'var(--text-2)', fontWeight: 500, marginTop: 8 }}>
                Прикрепить файл
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 3 }}>PDF, JPG, PNG — до 10 МБ</div>
              <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display: 'none' }}
                onChange={(e) => { const f = e.target.files?.[0]; if (f) setFile(f); }} />
            </div>
          )}
        </div>

        <AppTextarea label="Диагноз / комментарий" placeholder="ОРВИ, грипп…" value={comment} onChange={(e) => setComment(e.target.value)} rows={3} />

        {error && (
          <div style={{ background: 'var(--red-surface)', border: '1px solid var(--red-border)', borderRadius: 8, padding: '10px 13px', fontSize: 13, color: 'var(--red)' }}>{error}</div>
        )}

        <AppButton onClick={handleSubmit} fullWidth disabled={loading}>
          {loading ? 'Отправка...' : 'Отправить'}
        </AppButton>
      </div>
    </div>
  );
}
