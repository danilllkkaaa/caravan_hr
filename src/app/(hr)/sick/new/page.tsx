'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useHRStore } from '@/lib/hrStore';
import { AppButton } from '@/components/hr/AppButton';
import { AppInput, AppTextarea } from '@/components/hr/AppInput';
import { ChevronLIcon, CheckIcon } from '@/components/hr/Icons';

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

  if (success) return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 20px' }}>
      <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--amber-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
        <CheckIcon size={26} color="var(--amber)" strokeWidth={2.5} />
      </div>
      <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 6, textAlign: 'center' }}>Больничный открыт</div>
      <div style={{ fontSize: 14, color: 'var(--text-2)', textAlign: 'center', lineHeight: 1.6, marginBottom: 28, maxWidth: 280 }}>
        Больничный зарегистрирован. Когда выздоровеете — закройте его и прикрепите листок нетрудоспособности.
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
          <div>
            <div style={{ color: '#fff', fontSize: 16, fontWeight: 600 }}>Открыть больничный</div>
            <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13, marginTop: 1 }}>Шаг 1 из 2 — регистрация</div>
          </div>
        </div>
      </div>

      <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Step hint */}
        <div style={{ background: 'var(--blue-surface)', border: '1px solid var(--blue-border)', borderRadius: 10, padding: '12px 14px' }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--blue)', marginBottom: 4 }}>Как это работает</div>
          <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6 }}>
            Сейчас вы открываете больничный. После выздоровления зайдите в этот больничный в списке и закройте его, указав дату окончания и прикрепив листок нетрудоспособности.
          </div>
        </div>

        <AppInput
          label="Дата начала"
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />

        <AppTextarea
          label="Комментарий (необязательно)"
          placeholder="ОРВИ, грипп, травма…"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
        />

        {error && (
          <div style={{ background: 'var(--red-surface)', border: '1px solid var(--red-border)', borderRadius: 8, padding: '10px 13px', fontSize: 13, color: 'var(--red)' }}>
            {error}
          </div>
        )}

        <AppButton onClick={handleSubmit} fullWidth disabled={loading}>
          {loading ? 'Открываем...' : 'Открыть больничный'}
        </AppButton>
      </div>
    </div>
  );
}
