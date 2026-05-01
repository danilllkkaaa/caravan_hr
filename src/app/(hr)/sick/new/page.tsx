'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useHRStore } from '@/lib/hrStore';
import { AppButton } from '@/components/hr/AppButton';
import { AppInput, AppTextarea } from '@/components/hr/AppInput';
import { formatDate } from '@/lib/dateUtils';

export default function NewSickPage() {
  const router = useRouter();
  const addSickLeave = useHRStore((s) => s.addSickLeave);

  const [startDate, setStartDate] = useState('');
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit() {
    if (!startDate) { setError('Выберите дату начала'); return; }
    setError('');
    setLoading(true);
    try {
      await addSickLeave({ startDate, comment });
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось открыть больничный');
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div style={{ minHeight: '100dvh', background: '#F4F7FB', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 20px' }}>
        <div style={{ textAlign: 'center', maxWidth: 320 }}>
          <div style={{ fontSize: 72, marginBottom: 20 }}>🏥</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#1A2332', marginBottom: 8 }}>Больничный открыт</div>
          <div style={{ fontSize: 14, color: '#78909C', lineHeight: 1.6, marginBottom: 32 }}>
            Больничный с {formatDate(startDate)} открыт. Руководитель получит уведомление.
          </div>
          <AppButton onClick={() => router.push('/sick')} fullWidth style={{ background: 'linear-gradient(135deg, #E53935 0%, #C62828 100%)', boxShadow: '0 2px 12px rgba(229,57,53,0.35)' }}>
            К списку больничных
          </AppButton>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100dvh', background: '#F4F7FB', paddingBottom: 'calc(64px + env(safe-area-inset-bottom))' }}>
      <div style={{ background: 'linear-gradient(135deg, #C62828 0%, #E53935 100%)', padding: 'calc(env(safe-area-inset-top) + 16px) 20px 24px', borderRadius: '0 0 28px 28px' }}>
        <button onClick={() => router.push('/sick')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.8)', fontSize: 14, cursor: 'pointer', padding: '0 0 8px', fontFamily: 'inherit' }}>
          ← Назад
        </button>
        <div style={{ color: '#fff', fontSize: 20, fontWeight: 800 }}>Открыть больничный</div>
        <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 2 }}>Укажите дату начала и комментарий</div>
      </div>

      <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <AppInput label="Дата начала" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        <AppTextarea label="Комментарий" placeholder="Например: высокая температура" value={comment} onChange={(e) => setComment(e.target.value)} rows={3} />

        {error && (
          <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#E53935' }}>
            {error}
          </div>
        )}

        <AppButton onClick={handleSubmit} fullWidth disabled={loading} style={{ background: 'linear-gradient(135deg, #E53935 0%, #C62828 100%)', boxShadow: '0 2px 12px rgba(229,57,53,0.35)' }}>
          {loading ? 'Открытие...' : 'Открыть больничный'}
        </AppButton>
      </div>
    </div>
  );
}
