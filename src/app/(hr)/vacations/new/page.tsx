'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useHRStore } from '@/lib/hrStore';
import { AppCard } from '@/components/hr/AppCard';
import { AppButton } from '@/components/hr/AppButton';
import { AppInput, AppTextarea } from '@/components/hr/AppInput';
import { formatDate, calcDays } from '@/lib/dateUtils';

const VACATION_TYPES = [
  'Ежегодный оплачиваемый',
  'За свой счёт',
  'Учебный',
  'По уходу за ребёнком',
];

type Step = 'form' | 'confirm' | 'success';

export default function NewVacationPage() {
  const router = useRouter();
  const addVacation = useHRStore((s) => s.addVacation);

  const [step, setStep] = useState<Step>('form');
  const [type, setType] = useState(VACATION_TYPES[0]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const days = startDate && endDate ? calcDays(startDate, endDate) : 0;

  function handleNext() {
    if (!startDate) { setError('Выберите дату начала'); return; }
    if (!endDate) { setError('Выберите дату окончания'); return; }
    if (days <= 0) { setError('Дата окончания должна быть позже начала'); return; }
    setError('');
    setStep('confirm');
  }

  async function handleSubmit() {
    setLoading(true);
    try {
      await addVacation({
        startDate,
        endDate,
        days,
        type,
        status: 'pending',
        comment,
      });
      setStep('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось подать заявление');
      setStep('form');
    } finally {
      setLoading(false);
    }
  }

  if (step === 'success') {
    return (
      <div style={{
        minHeight: '100dvh', background: '#F4F7FB',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '24px 20px',
      }}>
        <div style={{ textAlign: 'center', maxWidth: 320 }}>
          <div style={{ fontSize: 72, marginBottom: 20 }}>✅</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#1A2332', marginBottom: 8 }}>Заявление подано!</div>
          <div style={{ fontSize: 14, color: '#78909C', lineHeight: 1.6, marginBottom: 32 }}>
            Ваше заявление на отпуск с {formatDate(startDate)} по {formatDate(endDate)} ({days} дн.) отправлено на рассмотрение руководителю.
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <AppButton onClick={() => router.push('/vacations')} fullWidth>К списку отпусков</AppButton>
            <AppButton onClick={() => router.push('/home')} variant="secondary" fullWidth>На главную</AppButton>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'confirm') {
    return (
      <div style={{ minHeight: '100dvh', background: '#F4F7FB', paddingBottom: 'calc(64px + env(safe-area-inset-bottom))' }}>
        <div style={{
          background: 'linear-gradient(135deg, #1565C0 0%, #1976D2 100%)',
          padding: 'calc(env(safe-area-inset-top) + 16px) 20px 24px',
          borderRadius: '0 0 28px 28px',
        }}>
          <button onClick={() => setStep('form')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.8)', fontSize: 14, cursor: 'pointer', padding: '0 0 8px', fontFamily: 'inherit' }}>
            ← Назад
          </button>
          <div style={{ color: '#fff', fontSize: 20, fontWeight: 800 }}>Подтверждение</div>
          <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 2 }}>Проверьте данные перед подачей</div>
        </div>

        <div style={{ padding: '20px 16px' }}>
          <AppCard style={{ marginBottom: 20 }}>
            {[
              { label: 'Тип отпуска', value: type },
              { label: 'Дата начала', value: formatDate(startDate) },
              { label: 'Дата окончания', value: formatDate(endDate) },
              { label: 'Количество дней', value: `${days} дней` },
              ...(comment ? [{ label: 'Комментарий', value: comment }] : []),
            ].map((row, i, arr) => (
              <div key={row.label} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                padding: '12px 0',
                borderBottom: i < arr.length - 1 ? '1px solid #F0F4F8' : 'none',
              }}>
                <div style={{ fontSize: 13, color: '#78909C' }}>{row.label}</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#1A2332', textAlign: 'right', maxWidth: '60%' }}>{row.value}</div>
              </div>
            ))}
          </AppCard>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <AppButton onClick={handleSubmit} fullWidth disabled={loading}>
              {loading ? 'Отправка...' : 'Подать заявление'}
            </AppButton>
            <AppButton onClick={() => setStep('form')} variant="secondary" fullWidth>Изменить</AppButton>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100dvh', background: '#F4F7FB', paddingBottom: 'calc(64px + env(safe-area-inset-bottom))' }}>
      <div style={{
        background: 'linear-gradient(135deg, #1565C0 0%, #1976D2 100%)',
        padding: 'calc(env(safe-area-inset-top) + 16px) 20px 24px',
        borderRadius: '0 0 28px 28px',
      }}>
        <button onClick={() => router.push('/vacations')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.8)', fontSize: 14, cursor: 'pointer', padding: '0 0 8px', fontFamily: 'inherit' }}>
          ← Назад
        </button>
        <div style={{ color: '#fff', fontSize: 20, fontWeight: 800 }}>Новое заявление</div>
        <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 2 }}>Заполните форму</div>
      </div>

      <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Type */}
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#546E7A', marginBottom: 8 }}>Тип отпуска</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {VACATION_TYPES.map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                style={{
                  padding: '12px 16px', borderRadius: 12,
                  border: type === t ? '2px solid #1976D2' : '1.5px solid #E0E7EF',
                  background: type === t ? '#E3F2FD' : '#fff',
                  color: type === t ? '#1976D2' : '#1A2332',
                  fontSize: 14, fontWeight: type === t ? 700 : 500,
                  textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit',
                  display: 'flex', alignItems: 'center', gap: 10,
                }}
              >
                <span style={{
                  width: 18, height: 18, borderRadius: '50%',
                  border: type === t ? '5px solid #1976D2' : '2px solid #B0BEC5',
                  flexShrink: 0, display: 'inline-block',
                }} />
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Dates */}
        <AppInput
          label="Дата начала"
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />
        <AppInput
          label="Дата окончания"
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          min={startDate}
        />

        {days > 0 && (
          <div style={{
            background: '#E3F2FD', borderRadius: 12,
            padding: '10px 14px',
            fontSize: 14, fontWeight: 600, color: '#1976D2',
            textAlign: 'center',
          }}>
            Длительность: {days} {days === 1 ? 'день' : days < 5 ? 'дня' : 'дней'}
          </div>
        )}

        <AppTextarea
          label="Комментарий (необязательно)"
          placeholder="Причина или пояснение..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
        />

        {error && (
          <div style={{
            background: '#FEF2F2', border: '1px solid #FECACA',
            borderRadius: 10, padding: '10px 14px',
            fontSize: 13, color: '#E53935',
          }}>
            {error}
          </div>
        )}

        <AppButton onClick={handleNext} fullWidth>Далее</AppButton>
      </div>
    </div>
  );
}
