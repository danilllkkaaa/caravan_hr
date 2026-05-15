'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useHRStore } from '@/lib/hrStore';
import { AppCard } from '@/components/hr/AppCard';
import { AppButton } from '@/components/hr/AppButton';
import { AppInput, AppTextarea } from '@/components/hr/AppInput';
import { ChevronLIcon, CheckIcon } from '@/components/hr/Icons';
import { formatDate, calcDays } from '@/lib/dateUtils';

const TYPES = ['Ежегодный оплачиваемый', 'За свой счёт', 'Учебный', 'По уходу за ребёнком'];
type Step = 'form' | 'confirm' | 'success';

export default function NewVacationPage() {
  const router = useRouter();
  const addVacation = useHRStore((s) => s.addVacation);

  const [step, setStep] = useState<Step>('form');
  const [type, setType] = useState(TYPES[0]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const days = startDate && endDate ? calcDays(startDate, endDate) : 0;

  function handleNext() {
    if (!startDate) { setError('Выберите дату начала'); return; }
    if (!endDate) { setError('Выберите дату окончания'); return; }
    if (days <= 0) { setError('Дата окончания должна быть позже даты начала'); return; }
    setError('');
    setStep('confirm');
  }

  function handleSubmit() {
    setLoading(true);
    setTimeout(() => {
      addVacation({ startDate, endDate, days, type, status: 'pending', comment });
      setLoading(false);
      setStep('success');
    }, 900);
  }

  if (step === 'success') return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 20px' }}>
      <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--green-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
        <CheckIcon size={26} color="var(--green)" strokeWidth={2.5} />
      </div>
      <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 6, textAlign: 'center' }}>Заявление подано</div>
      <div style={{ fontSize: 14, color: 'var(--text-2)', textAlign: 'center', lineHeight: 1.6, marginBottom: 28, maxWidth: 280 }}>
        {formatDate(startDate)} — {formatDate(endDate)}, {days} дн. Руководитель рассмотрит в ближайшее время.
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%', maxWidth: 320 }}>
        <AppButton onClick={() => router.push('/vacations')} fullWidth>К списку отпусков</AppButton>
        <AppButton onClick={() => router.push('/home')} variant="secondary" fullWidth>На главную</AppButton>
      </div>
    </div>
  );

  if (step === 'confirm') return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg)' }} className="pb-nav">
      <div style={{ background: 'var(--blue)', paddingTop: 'env(safe-area-inset-top)' }}>
        <div style={{ padding: '14px 20px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => setStep('form')} style={{ background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: 8, width: 34, height: 34, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
            <ChevronLIcon size={18} />
          </button>
          <div style={{ color: '#fff', fontSize: 16, fontWeight: 600 }}>Подтверждение</div>
        </div>
      </div>
      <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <AppCard padding="0">
          {[
            { label: 'Тип', value: type },
            { label: 'Начало', value: formatDate(startDate) },
            { label: 'Окончание', value: formatDate(endDate) },
            { label: 'Продолжительность', value: `${days} дней` },
            ...(comment ? [{ label: 'Комментарий', value: comment }] : []),
          ].map((row, i, arr) => (
            <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '13px 16px', borderBottom: i < arr.length - 1 ? '1px solid var(--border-light)' : 'none', gap: 12 }}>
              <span style={{ fontSize: 13, color: 'var(--text-3)' }}>{row.label}</span>
              <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)', textAlign: 'right' }}>{row.value}</span>
            </div>
          ))}
        </AppCard>
        <AppButton onClick={handleSubmit} fullWidth disabled={loading}>
          {loading ? 'Отправка...' : 'Подтвердить и подать'}
        </AppButton>
        <AppButton onClick={() => setStep('form')} variant="secondary" fullWidth>Изменить</AppButton>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg)' }} className="pb-nav">
      <div style={{ background: 'var(--blue)', paddingTop: 'env(safe-area-inset-top)' }}>
        <div style={{ padding: '14px 20px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => router.push('/vacations')} style={{ background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: 8, width: 34, height: 34, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
            <ChevronLIcon size={18} />
          </button>
          <div style={{ color: '#fff', fontSize: 16, fontWeight: 600 }}>Новое заявление</div>
        </div>
      </div>

      <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Type */}
        <div>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-2)', marginBottom: 8 }}>Тип отпуска</div>
          <AppCard padding="0">
            {TYPES.map((t, i) => (
              <button key={t} onClick={() => setType(t)} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                width: '100%', padding: '13px 14px', background: 'none',
                border: 'none', borderBottom: i < TYPES.length - 1 ? '1px solid var(--border-light)' : 'none',
                cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', gap: 12,
              }}>
                <span style={{ fontSize: 14, color: 'var(--text)' }}>{t}</span>
                {type === t && <CheckIcon size={16} color="var(--blue)" strokeWidth={2.5} />}
              </button>
            ))}
          </AppCard>
        </div>

        {/* Dates */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <AppInput label="Начало" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          <AppInput label="Окончание" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} min={startDate} />
        </div>

        {days > 0 && (
          <div style={{ background: 'var(--blue-surface)', border: '1px solid var(--blue-border)', borderRadius: 8, padding: '10px 14px', fontSize: 14, color: 'var(--blue)', fontWeight: 500 }}>
            Продолжительность: <strong>{days} {days === 1 ? 'день' : days < 5 ? 'дня' : 'дней'}</strong>
          </div>
        )}

        <AppTextarea label="Комментарий (необязательно)" placeholder="Причина или пояснение..." value={comment} onChange={(e) => setComment(e.target.value)} rows={3} />

        {error && (
          <div style={{ background: 'var(--red-surface)', border: '1px solid var(--red-border)', borderRadius: 8, padding: '10px 13px', fontSize: 13, color: 'var(--red)' }}>{error}</div>
        )}

        <AppButton onClick={handleNext} fullWidth>Далее</AppButton>
      </div>
    </div>
  );
}
