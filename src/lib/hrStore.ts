import { create } from 'zustand';
import {
  initialMockData,
  type Vacation,
  type SickLeave,
  type TimeRecord,
  type User,
  type VacationBalance,
  type Notification,
  type ApprovalVacation,
} from './mockData';

interface HRState {
  isLoggedIn: boolean;
  loading: boolean;
  user: User;
  vacationBalance: VacationBalance;
  vacations: Vacation[];
  hasMoreVacations: boolean;
  sickLeaves: SickLeave[];
  hasMoreSickLeaves: boolean;
  timeRecords: TimeRecord[];
  notifications: Notification[];
  hasMoreNotifications: boolean;
  approvalVacations: ApprovalVacation[];

  hydrate: () => Promise<boolean>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;

  addVacation: (v: Omit<Vacation, 'id'>) => Promise<Vacation>;
  loadMoreVacations: () => Promise<void>;

  addSickLeave: (s: Pick<SickLeave, 'startDate' | 'comment'>) => Promise<SickLeave>;
  closeSickLeave: (id: number, endDate: string, file: File) => Promise<SickLeave>;
  loadMoreSickLeaves: () => Promise<void>;

  // checkIn / checkOut removed from user-facing store:
  // time records are populated automatically via Hikvision Center integration
  // (see /api/time/checkin and /api/time/checkout — internal webhook endpoints)

  markNotificationRead: (id: number) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  loadMoreNotifications: () => Promise<void>;

  loadApprovals: () => Promise<void>;
  approveVacation: (id: number) => Promise<void>;
  rejectVacation: (id: number) => Promise<void>;
}

async function parseResponse<T>(response: Response): Promise<T> {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(typeof payload.error === 'string' ? payload.error : 'Ошибка запроса');
  }
  return payload as T;
}

export const useHRStore = create<HRState>((set, get) => ({
  isLoggedIn: false,
  loading: false,
  user: initialMockData.user,
  vacationBalance: initialMockData.vacationBalance,
  vacations: initialMockData.vacations,
  hasMoreVacations: false,
  sickLeaves: initialMockData.sickLeaves,
  hasMoreSickLeaves: false,
  timeRecords: initialMockData.timeRecords,
  notifications: initialMockData.notifications,
  hasMoreNotifications: false,
  approvalVacations: [],

  hydrate: async () => {
    set({ loading: true });
    try {
      const data = await parseResponse<{
        user: User;
        vacationBalance: VacationBalance;
        vacations: Vacation[];
        hasMoreVacations: boolean;
        sickLeaves: SickLeave[];
        hasMoreSickLeaves: boolean;
        timeRecords: TimeRecord[];
        notifications: Notification[];
        hasMoreNotifications: boolean;
      }>(await fetch('/api/hr/bootstrap', { credentials: 'include' }));
      set({ ...data, isLoggedIn: true, loading: false });
      return true;
    } catch {
      set({ isLoggedIn: false, loading: false });
      return false;
    }
  },

  login: async (email, password) => {
    await parseResponse<{ user: User }>(
      await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      }),
    );
    await useHRStore.getState().hydrate();
  },

  logout: async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    set({ isLoggedIn: false });
  },

  addVacation: async (v) => {
    const { vacation } = await parseResponse<{ vacation: Vacation }>(
      await fetch('/api/vacations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(v),
      }),
    );
    set((state) => ({ vacations: [vacation, ...state.vacations] }));
    return vacation;
  },

  loadMoreVacations: async () => {
    const state = get();
    if (!state.hasMoreVacations || state.vacations.length === 0) return;
    const lastId = state.vacations[state.vacations.length - 1].id;
    const { vacations, hasMore } = await parseResponse<{ vacations: Vacation[]; hasMore: boolean }>(
      await fetch(`/api/vacations?cursor=${lastId}`, { credentials: 'include' }),
    );
    set((s) => ({ vacations: [...s.vacations, ...vacations], hasMoreVacations: hasMore }));
  },

  addSickLeave: async (s) => {
    const { sickLeave } = await parseResponse<{ sickLeave: SickLeave }>(
      await fetch('/api/sick-leaves', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(s),
      }),
    );
    set((state) => ({ sickLeaves: [sickLeave, ...state.sickLeaves] }));
    return sickLeave;
  },

  closeSickLeave: async (id, endDate, file) => {
    const formData = new FormData();
    formData.set('endDate', endDate);
    formData.set('file', file);
    const { sickLeave } = await parseResponse<{ sickLeave: SickLeave }>(
      await fetch(`/api/sick-leaves/${id}/close`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      }),
    );
    set((state) => ({
      sickLeaves: state.sickLeaves.map((item) => (item.id === id ? sickLeave : item)),
    }));
    return sickLeave;
  },

  loadMoreSickLeaves: async () => {
    const state = get();
    if (!state.hasMoreSickLeaves || state.sickLeaves.length === 0) return;
    const lastId = state.sickLeaves[state.sickLeaves.length - 1].id;
    const { sickLeaves, hasMore } = await parseResponse<{ sickLeaves: SickLeave[]; hasMore: boolean }>(
      await fetch(`/api/sick-leaves?cursor=${lastId}`, { credentials: 'include' }),
    );
    set((s) => ({ sickLeaves: [...s.sickLeaves, ...sickLeaves], hasMoreSickLeaves: hasMore }));
  },

  markNotificationRead: async (id) => {
    set((state) => ({
      notifications: state.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
    }));
    await fetch('/api/notifications/read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ id }),
    });
  },

  markAllNotificationsRead: async () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
    }));
    await fetch('/api/notifications/read-all', { method: 'POST', credentials: 'include' });
  },

  loadMoreNotifications: async () => {
    const state = get();
    if (!state.hasMoreNotifications || state.notifications.length === 0) return;
    const lastId = state.notifications[state.notifications.length - 1].id;
    const { notifications, hasMore } = await parseResponse<{
      notifications: Notification[];
      hasMore: boolean;
    }>(await fetch(`/api/notifications?cursor=${lastId}`, { credentials: 'include' }));
    set((s) => ({
      notifications: [...s.notifications, ...notifications],
      hasMoreNotifications: hasMore,
    }));
  },

  loadApprovals: async () => {
    const { vacations } = await parseResponse<{ vacations: ApprovalVacation[] }>(
      await fetch('/api/vacations/pending', { credentials: 'include' }),
    );
    set({ approvalVacations: vacations });
  },

  approveVacation: async (id) => {
    await parseResponse(
      await fetch(`/api/vacations/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: 'approved' }),
      }),
    );
    set((state) => ({
      approvalVacations: state.approvalVacations.filter((v) => v.id !== id),
    }));
  },

  rejectVacation: async (id) => {
    await parseResponse(
      await fetch(`/api/vacations/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: 'rejected' }),
      }),
    );
    set((state) => ({
      approvalVacations: state.approvalVacations.filter((v) => v.id !== id),
    }));
  },
}));
