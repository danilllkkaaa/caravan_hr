'use client';
import { useEffect, useState } from 'react';
import { AppCard } from '@/components/hr/AppCard';

type EmployeeStatus = 'working' | 'sick' | 'vacation' | 'home';

interface Employee {
  id: string;
  name: string;
  firstName: string;
  position: string;
  department: string;
  email: string;
  role: string;
  status: EmployeeStatus;
}

interface Manager extends Employee {
  employees: Employee[];
}

type EmployeesResponse =
  | { mode: 'admin'; department: string; managers: Manager[] }
  | { mode: 'manager'; department: string; employees: Employee[] }
  | { mode: 'user'; department: string; employees: Employee[] };

const STATUS_CONFIG: Record<EmployeeStatus, { label: string; color: string; bg: string }> = {
  working: { label: 'На работе', color: '#2E7D32', bg: '#E8F5E9' },
  sick: { label: 'На больничном', color: '#C62828', bg: '#FFEBEE' },
  vacation: { label: 'В отпуске', color: '#1565C0', bg: '#E3F2FD' },
  home: { label: 'Дома', color: '#546E7A', bg: '#F0F4F8' },
};

function StatusPill({ status }: { status: EmployeeStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span style={{ color: cfg.color, background: cfg.bg, borderRadius: 20, padding: '4px 10px', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}>
      {cfg.label}
    </span>
  );
}

function PersonRow({ person, onClick, expanded }: { person: Employee; onClick?: () => void; expanded?: boolean }) {
  const initial = person.firstName?.[0] || person.name[0] || '?';
  return (
    <AppCard
      padding="13px 14px"
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: '#E3F2FD', color: '#1976D2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, flexShrink: 0 }}>
          {initial}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#1A2332', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {person.name}
            </div>
            {onClick && <span style={{ color: '#90A4AE', fontSize: 14 }}>{expanded ? '⌃' : '⌄'}</span>}
          </div>
          <div style={{ fontSize: 12, color: '#78909C', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {person.position}
          </div>
          <div style={{ fontSize: 11, color: '#90A4AE', marginTop: 1 }}>{person.department}</div>
        </div>
        <StatusPill status={person.status} />
      </div>
    </AppCard>
  );
}

export default function EmployeesPage() {
  const [data, setData] = useState<EmployeesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedManagerIds, setExpandedManagerIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    let active = true;
    fetch('/api/employees', { credentials: 'include' })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || 'Не удалось загрузить сотрудников');
        if (active) setData(payload);
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : 'Не удалось загрузить сотрудников');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  function toggleManager(id: string) {
    setExpandedManagerIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div style={{ minHeight: '100dvh', background: '#F4F7FB', paddingBottom: 'calc(64px + env(safe-area-inset-bottom))' }}>
      <div style={{ background: 'linear-gradient(135deg, #1565C0 0%, #1976D2 100%)', padding: 'calc(env(safe-area-inset-top) + 16px) 20px 24px', borderRadius: '0 0 28px 28px' }}>
        <div style={{ color: '#fff', fontSize: 20, fontWeight: 800 }}>Сотрудники</div>
        <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 2 }}>
          {data?.department ?? 'Оргструктура'}
        </div>
      </div>

      <div style={{ padding: '16px 16px 0' }}>
        {loading && <div style={{ textAlign: 'center', color: '#90A4AE', padding: '32px 0' }}>Загрузка...</div>}
        {error && <div style={{ color: '#E53935', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: 12, fontSize: 13 }}>{error}</div>}

        {data?.mode === 'admin' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#90A4AE', textTransform: 'uppercase', letterSpacing: 0.8, paddingLeft: 2 }}>
              Начальники отделов
            </div>
            {data.managers.map((manager) => {
              const expanded = expandedManagerIds.has(manager.id);
              return (
                <div key={manager.id} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <PersonRow person={manager} onClick={() => toggleManager(manager.id)} expanded={expanded} />
                  {expanded && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingLeft: 14, borderLeft: '2px solid #E0E7EF', marginLeft: 12 }}>
                      {manager.employees.length === 0 && (
                        <div style={{ color: '#90A4AE', fontSize: 13, padding: '8px 0' }}>Нет сотрудников</div>
                      )}
                      {manager.employees.map((employee) => <PersonRow key={employee.id} person={employee} />)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {data?.mode === 'manager' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#90A4AE', textTransform: 'uppercase', letterSpacing: 0.8, paddingLeft: 2 }}>
              Мои сотрудники
            </div>
            {data.employees.length === 0 && (
              <div style={{ textAlign: 'center', color: '#90A4AE', padding: '32px 0' }}>Нет сотрудников</div>
            )}
            {data.employees.map((employee) => <PersonRow key={employee.id} person={employee} />)}
          </div>
        )}

        {data?.mode === 'user' && (
          <div style={{ textAlign: 'center', color: '#90A4AE', padding: '32px 12px', fontSize: 14 }}>
            У вас нет подчиненных сотрудников.
          </div>
        )}
      </div>
    </div>
  );
}
