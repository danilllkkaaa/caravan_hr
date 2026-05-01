'use client';
import { useState } from 'react';
import { useHRStore } from '@/lib/hrStore';
import { AppCard } from '@/components/hr/AppCard';
import type { TimeRecord } from '@/lib/mockData';

const DAY_LABELS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

const MONTH_NAMES = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
];

type DisplayStatus = TimeRecord['status'] | 'sick' | 'vacation';

const STATUS_CONFIG: Record<DisplayStatus, { color: string; bg: string; label: string }> = {
  normal:   { color: '#1976D2', bg: '#E3F2FD', label: 'Норма' },
  overtime: { color: '#4CAF50', bg: '#E8F5E9', label: 'Сверхурочно' },
  short:    { color: '#FF9800', bg: '#FFF8E1', label: 'Неполный' },
  weekend:  { color: '#90A4AE', bg: '#F5F5F5', label: 'Выходной' },
  holiday:  { color: '#9C27B0', bg: '#F3E5F5', label: 'Праздник' },
  absent:   { color: '#E53935', bg: '#FFEBEE', label: 'Отсутствие' },
  sick:     { color: '#D84315', bg: '#FBE9E7', label: 'Больничный' },
  vacation: { color: '#0277BD', bg: '#E1F5FE', label: 'Отпуск' },
};

const STATUS_DOT: Record<DisplayStatus, string> = {
  normal:   '#1976D2',
  overtime: '#4CAF50',
  short:    '#FF9800',
  weekend:  '#CFD8DC',
  holiday:  '#9C27B0',
  absent:   '#E53935',
  sick:     '#D84315',
  vacation: '#0277BD',
};

function isoToYM(iso: string): { year: number; month: number } {
  const [y, m] = iso.split('-').map(Number);
  return { year: y, month: m };
}

function getCalendarCells(year: number, month: number): Array<string | null> {
  const firstDow = new Date(year, month - 1, 1).getDay();
  const startPad = firstDow === 0 ? 6 : firstDow - 1;
  const daysInMonth = new Date(year, month, 0).getDate();
  const cells: Array<string | null> = [];
  for (let i = 0; i < startPad; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(`${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
  }
  return cells;
}

// Returns 'sick' or 'vacation' if the date falls within those periods, else null.
function getAbsenceOverlay(
  dateStr: string,
  sickLeaves: ReturnType<typeof useHRStore.getState>['sickLeaves'],
  vacations: ReturnType<typeof useHRStore.getState>['vacations'],
): 'sick' | 'vacation' | null {
  const ts = new Date(dateStr + 'T00:00:00.000Z').getTime();
  const todayTs = new Date(new Date().toISOString().slice(0, 10) + 'T00:00:00.000Z').getTime();

  for (const sl of sickLeaves) {
    const start = new Date(sl.startDate + 'T00:00:00.000Z').getTime();
    // Opened sick leave extends to today; closed — to endDate.
    const end = sl.endDate
      ? new Date(sl.endDate + 'T00:00:00.000Z').getTime()
      : todayTs;
    if (ts >= start && ts <= end) return 'sick';
  }

  for (const v of vacations) {
    if (v.status !== 'approved') continue;
    const start = new Date(v.startDate + 'T00:00:00.000Z').getTime();
    const end = new Date(v.endDate + 'T00:00:00.000Z').getTime();
    if (ts >= start && ts <= end) return 'vacation';
  }

  return null;
}

export default function TimePage() {
  const { timeRecords, sickLeaves, vacations } = useHRStore();
  const [view, setView] = useState<'week' | 'month'>('month');
  const [selectedDate, setSelectedDate] = useState<string | null>(timeRecords[0]?.date ?? null);
  const [weekOffset, setWeekOffset] = useState(0);

  const latestDate = timeRecords[0]?.date ?? new Date().toISOString().slice(0, 10);
  const { year: latestYear, month: latestMonth } = isoToYM(latestDate);
  const [calYear, setCalYear] = useState(latestYear);
  const [calMonth, setCalMonth] = useState(latestMonth);

  const recordMap = Object.fromEntries(timeRecords.map((r) => [r.date, r]));
  const selectedRecord = selectedDate ? recordMap[selectedDate] : null;
  const selectedOverlay = selectedDate && !selectedRecord
    ? getAbsenceOverlay(selectedDate, sickLeaves, vacations)
    : null;

  const weekStart = weekOffset * 7;
  const weekRecords = timeRecords.slice(weekStart, weekStart + 7);

  function parseHours(total: string): number {
    const match = total.match(/(\d+)ч/);
    return match ? parseInt(match[1]) : 0;
  }

  function prevMonth() {
    if (calMonth === 1) { setCalYear(calYear - 1); setCalMonth(12); }
    else setCalMonth(calMonth - 1);
  }
  function nextMonth() {
    const now = new Date();
    if (calYear > now.getFullYear() || (calYear === now.getFullYear() && calMonth >= now.getMonth() + 1)) return;
    if (calMonth === 12) { setCalYear(calYear + 1); setCalMonth(1); }
    else setCalMonth(calMonth + 1);
  }

  const calendarCells = getCalendarCells(calYear, calMonth);

  // Determine effective display status for a given date
  function getDisplayStatus(dateStr: string): DisplayStatus | null {
    const rec = recordMap[dateStr];
    if (rec) return rec.status;
    return getAbsenceOverlay(dateStr, sickLeaves, vacations);
  }

  return (
    <div style={{ minHeight: '100dvh', background: '#F4F7FB', paddingBottom: 'calc(64px + env(safe-area-inset-bottom))' }}>
      <div style={{
        background: 'linear-gradient(135deg, #1B5E20 0%, #388E3C 100%)',
        padding: 'calc(env(safe-area-inset-top) + 16px) 20px 24px',
        borderRadius: '0 0 28px 28px',
      }}>
        <div style={{ color: '#fff', fontSize: 20, fontWeight: 800 }}>Рабочее время</div>
        <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 2 }}>Табель учёта</div>

        <div style={{
          marginTop: 14, display: 'flex', gap: 4,
          background: 'rgba(0,0,0,0.2)', borderRadius: 12, padding: 4,
        }}>
          {(['week', 'month'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              style={{
                flex: 1, padding: '7px 0', borderRadius: 9,
                border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                fontSize: 13, fontWeight: 700,
                background: view === v ? '#fff' : 'transparent',
                color: view === v ? '#1B5E20' : 'rgba(255,255,255,0.75)',
                transition: 'all 0.18s',
              }}
            >
              {v === 'week' ? 'Неделя' : 'Месяц'}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: '16px 16px 0' }}>
        {/* ── WEEK VIEW ── */}
        {view === 'week' && (
          <AppCard style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <button
                onClick={() => setWeekOffset(Math.max(0, weekOffset - 1))}
                style={{ background: '#F0F4F8', border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', fontSize: 18, color: '#546E7A' }}
                disabled={weekOffset === 0}
              >‹</button>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#1A2332' }}>
                {weekOffset === 0 ? 'Текущая неделя' : `Неделя −${weekOffset}`}
              </div>
              <button
                onClick={() => setWeekOffset(weekOffset + 1)}
                style={{ background: '#F0F4F8', border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', fontSize: 18, color: '#546E7A' }}
                disabled={weekStart + 7 >= timeRecords.length}
              >›</button>
            </div>

            <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end', height: 88, justifyContent: 'space-between' }}>
              {Array.from({ length: 7 }).map((_, i) => {
                const rec = weekRecords[i];
                const hours = rec ? parseHours(rec.total) : 0;
                const barH = rec && hours > 0 ? Math.max(8, (hours / 11) * 72) : 4;
                const color = rec ? STATUS_DOT[rec.status] : '#EEF2F7';
                const isSelected = rec?.date === selectedDate;
                return (
                  <div
                    key={i}
                    onClick={() => rec && setSelectedDate(rec.date)}
                    style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, cursor: rec ? 'pointer' : 'default' }}
                  >
                    <div style={{
                      width: '100%', height: barH,
                      borderRadius: '4px 4px 2px 2px',
                      background: color,
                      opacity: isSelected ? 1 : 0.65,
                      boxShadow: isSelected ? `0 2px 8px ${color}80` : 'none',
                      outline: isSelected ? `2px solid ${color}` : 'none',
                      outlineOffset: 1,
                      transition: 'all 0.15s',
                    }} />
                    <div style={{ fontSize: 10, color: isSelected ? '#1A2332' : '#90A4AE', fontWeight: isSelected ? 700 : 500 }}>
                      {DAY_LABELS[i]}
                    </div>
                  </div>
                );
              })}
            </div>
          </AppCard>
        )}

        {/* ── MONTH CALENDAR VIEW ── */}
        {view === 'month' && (
          <AppCard style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <button onClick={prevMonth} style={{ background: '#F0F4F8', border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', fontSize: 18, color: '#546E7A' }}>‹</button>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#1A2332' }}>
                {MONTH_NAMES[calMonth - 1]} {calYear}
              </div>
              <button onClick={nextMonth} style={{ background: '#F0F4F8', border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', fontSize: 18, color: '#546E7A' }}>›</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 4 }}>
              {DAY_LABELS.map((d, i) => (
                <div key={d} style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, color: i >= 5 ? '#E53935' : '#90A4AE', paddingBottom: 4 }}>
                  {d}
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3 }}>
              {calendarCells.map((dateStr, idx) => {
                if (!dateStr) return <div key={`pad-${idx}`} />;

                const displayStatus = getDisplayStatus(dateStr);
                const rec = recordMap[dateStr];
                const dayNum = parseInt(dateStr.split('-')[2]);
                const isSelected = dateStr === selectedDate;
                const isWeekend = idx % 7 >= 5;
                const isClickable = !!rec || !!displayStatus;
                const dotColor = displayStatus ? STATUS_DOT[displayStatus] : null;

                return (
                  <div
                    key={dateStr}
                    onClick={() => isClickable && setSelectedDate(dateStr)}
                    style={{
                      aspectRatio: '1',
                      borderRadius: 10,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: isClickable ? 'pointer' : 'default',
                      background: isSelected && displayStatus
                        ? STATUS_CONFIG[displayStatus].bg
                        : displayStatus
                          ? `${STATUS_DOT[displayStatus]}18`
                          : 'transparent',
                      border: isSelected && displayStatus
                        ? `2px solid ${STATUS_DOT[displayStatus]}`
                        : '2px solid transparent',
                      transition: 'all 0.12s',
                      gap: 2,
                    }}
                  >
                    <span style={{
                      fontSize: 13,
                      fontWeight: isSelected ? 800 : displayStatus ? 600 : 400,
                      color: isSelected && displayStatus
                        ? STATUS_CONFIG[displayStatus].color
                        : displayStatus
                          ? '#1A2332'
                          : isWeekend ? '#E57373' : '#B0BEC5',
                      lineHeight: 1,
                    }}>
                      {dayNum}
                    </span>
                    {dotColor && (
                      <div style={{
                        width: 5, height: 5, borderRadius: '50%',
                        background: dotColor,
                        opacity: isSelected ? 1 : 0.85,
                      }} />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div style={{ marginTop: 14, display: 'flex', flexWrap: 'wrap', gap: '6px 12px' }}>
              {(Object.entries(STATUS_CONFIG) as [DisplayStatus, typeof STATUS_CONFIG[DisplayStatus]][])
                .filter(([k]) => k !== 'holiday')
                .map(([key, cfg]) => (
                  <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: cfg.color }} />
                    <span style={{ fontSize: 11, color: '#78909C' }}>{cfg.label}</span>
                  </div>
                ))}
            </div>
          </AppCard>
        )}

        {/* ── SELECTED DAY DETAIL ── */}
        {(selectedRecord || selectedOverlay) && selectedDate && (
          <AppCard style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#1A2332' }}>
                {new Date(selectedDate + 'T12:00:00Z').toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })}
              </div>
              {(() => {
                const status: DisplayStatus | null = selectedRecord?.status ?? selectedOverlay;
                if (!status) return null;
                return (
                  <div style={{
                    fontSize: 11, fontWeight: 700,
                    color: STATUS_CONFIG[status].color,
                    background: STATUS_CONFIG[status].bg,
                    padding: '4px 10px', borderRadius: 20,
                  }}>
                    {STATUS_CONFIG[status].label}
                  </div>
                );
              })()}
            </div>

            {selectedRecord && selectedRecord.checkIn !== '—' ? (
              <div style={{ display: 'flex', gap: 8 }}>
                {[
                  { icon: '🟢', label: 'Приход', value: selectedRecord.checkIn },
                  { icon: '🔴', label: 'Уход', value: selectedRecord.checkOut },
                  { icon: '⏱️', label: 'Рабочее время', value: selectedRecord.total },
                ].map((item) => (
                  <div key={item.label} style={{ flex: 1, background: '#F8FAFC', borderRadius: 10, padding: '10px 6px', textAlign: 'center' }}>
                    <div style={{ fontSize: 18 }}>{item.icon}</div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#1A2332', marginTop: 4 }}>{item.value}</div>
                    <div style={{ fontSize: 10, color: '#90A4AE', marginTop: 2 }}>{item.label}</div>
                  </div>
                ))}
              </div>
            ) : selectedRecord ? (
              <div style={{ textAlign: 'center', padding: '16px 0', color: '#90A4AE', fontSize: 14 }}>
                {selectedRecord.status === 'weekend' ? 'Выходной день'
                  : selectedRecord.status === 'holiday' ? 'Праздничный день'
                  : 'Нет данных о явке'}
              </div>
            ) : selectedOverlay === 'sick' ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0' }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: '#FBE9E7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>🏥</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#1A2332' }}>Больничный лист</div>
                  <div style={{ fontSize: 12, color: '#78909C', marginTop: 2 }}>День входит в период нетрудоспособности</div>
                </div>
              </div>
            ) : selectedOverlay === 'vacation' ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0' }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: '#E1F5FE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>✈️</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#1A2332' }}>Отпуск</div>
                  <div style={{ fontSize: 12, color: '#78909C', marginTop: 2 }}>День входит в утверждённый период отпуска</div>
                </div>
              </div>
            ) : null}
          </AppCard>
        )}
      </div>
    </div>
  );
}
