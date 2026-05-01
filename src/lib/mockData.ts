export type VacationStatus = 'approved' | 'pending' | 'rejected' | 'draft';

export interface ApprovalVacation {
  id: number;
  userId: string;
  userName: string;
  userFirstName: string;
  userPosition: string;
  userDepartment: string;
  startDate: string;
  endDate: string;
  days: number;
  type: string;
  status: VacationStatus;
  comment: string;
  createdAt: string;
}

export interface Vacation {
  id: number;
  startDate: string;
  endDate: string;
  days: number;
  type: string;
  status: VacationStatus;
  comment: string;
}

export interface SickLeave {
  id: number;
  startDate: string;
  endDate: string | null;
  days: number;
  status: 'opened' | 'closed';
  hasFile: boolean;
  fileName: string | null;
  comment: string;
}

export interface TimeRecord {
  date: string;
  checkIn: string;
  checkOut: string;
  total: string;
  status: 'normal' | 'overtime' | 'short' | 'weekend' | 'holiday' | 'absent';
}

export interface Notification {
  id: number;
  type: 'approved' | 'rejected' | 'info' | 'reminder';
  title: string;
  description: string;
  date: string;
  time: string;
  read: boolean;
}

export interface User {
  name: string;
  firstName: string;
  position: string;
  department: string;
  email: string;
  phone: string;
  employeeId: string;
  hireDate: string;
  role: string;
  managerId?: string | null;
  managerName?: string | null;
}

export interface VacationBalance {
  total: number;
  used: number;
  remaining: number;
}

export interface MockData {
  user: User;
  vacationBalance: VacationBalance;
  vacations: Vacation[];
  sickLeaves: SickLeave[];
  timeRecords: TimeRecord[];
  notifications: Notification[];
}

export const initialMockData: MockData = {
  user: {
    name: 'Алексей Николаевич Смирнов',
    firstName: 'Алексей',
    position: 'Старший разработчик',
    department: 'Отдел разработки',
    email: 'a.smirnov@company.ru',
    phone: '+7 (999) 123-45-67',
    employeeId: 'EMP-2847',
    hireDate: '15.03.2019',
    role: 'user',
    managerId: null,
    managerName: null,
  },
  vacationBalance: {
    total: 28,
    used: 14,
    remaining: 14,
  },
  vacations: [
    {
      id: 1,
      startDate: '2024-07-01',
      endDate: '2024-07-14',
      days: 14,
      type: 'Ежегодный оплачиваемый',
      status: 'approved',
      comment: 'Летний отпуск',
    },
    {
      id: 2,
      startDate: '2024-12-30',
      endDate: '2025-01-08',
      days: 10,
      type: 'Ежегодный оплачиваемый',
      status: 'pending',
      comment: 'Новогодние праздники',
    },
    {
      id: 3,
      startDate: '2024-03-08',
      endDate: '2024-03-10',
      days: 3,
      type: 'За свой счёт',
      status: 'approved',
      comment: 'Семейные обстоятельства',
    },
    {
      id: 4,
      startDate: '2024-02-01',
      endDate: '2024-02-05',
      days: 5,
      type: 'Ежегодный оплачиваемый',
      status: 'rejected',
      comment: 'Отклонено руководителем',
    },
  ],
  sickLeaves: [
    {
      id: 1,
      startDate: '2024-10-14',
      endDate: '2024-10-18',
      days: 5,
      status: 'closed',
      hasFile: true,
      fileName: 'больничный_лист_001.pdf',
      comment: 'ОРВИ',
    },
    {
      id: 2,
      startDate: '2024-06-03',
      endDate: '2024-06-07',
      days: 5,
      status: 'closed',
      hasFile: true,
      fileName: 'больничный_лист_002.pdf',
      comment: 'Грипп',
    },
    {
      id: 3,
      startDate: '2024-11-25',
      endDate: null,
      days: 0,
      status: 'opened',
      hasFile: false,
      fileName: null,
      comment: 'Ожидает документы',
    },
  ],
  timeRecords: [
    { date: '2024-11-25', checkIn: '09:02', checkOut: '18:15', total: '8ч 13м', status: 'normal' },
    { date: '2024-11-26', checkIn: '08:55', checkOut: '19:30', total: '9ч 35м', status: 'overtime' },
    { date: '2024-11-27', checkIn: '09:10', checkOut: '17:50', total: '7ч 40м', status: 'normal' },
    { date: '2024-11-28', checkIn: '09:00', checkOut: '18:00', total: '8ч 0м', status: 'normal' },
    { date: '2024-11-29', checkIn: '09:05', checkOut: '16:30', total: '6ч 25м', status: 'short' },
    { date: '2024-11-30', checkIn: '—', checkOut: '—', total: '—', status: 'weekend' },
    { date: '2024-12-01', checkIn: '—', checkOut: '—', total: '—', status: 'weekend' },
    { date: '2024-12-02', checkIn: '09:01', checkOut: '18:10', total: '8ч 9м', status: 'normal' },
    { date: '2024-12-03', checkIn: '08:58', checkOut: '18:05', total: '8ч 7м', status: 'normal' },
    { date: '2024-12-04', checkIn: '09:15', checkOut: '20:00', total: '9ч 45м', status: 'overtime' },
    { date: '2024-12-05', checkIn: '09:00', checkOut: '18:00', total: '8ч 0м', status: 'normal' },
    { date: '2024-12-06', checkIn: '—', checkOut: '—', total: '—', status: 'absent' },
    { date: '2024-12-07', checkIn: '—', checkOut: '—', total: '—', status: 'weekend' },
    { date: '2024-12-08', checkIn: '—', checkOut: '—', total: '—', status: 'weekend' },
  ],
  notifications: [
    {
      id: 1,
      type: 'approved',
      title: 'Отпуск согласован',
      description: 'Ваш отпуск с 1 по 14 июля 2024 года утверждён руководителем',
      date: '2024-11-28',
      time: '14:32',
      read: false,
    },
    {
      id: 2,
      type: 'reminder',
      title: 'Напоминание о расчётном листке',
      description: 'Расчётный листок за ноябрь доступен в разделе «Документы»',
      date: '2024-11-28',
      time: '09:00',
      read: false,
    },
    {
      id: 3,
      type: 'info',
      title: 'Корпоративное мероприятие',
      description: 'Приглашаем на новогодний корпоратив 20 декабря в 19:00',
      date: '2024-11-27',
      time: '16:15',
      read: true,
    },
    {
      id: 4,
      type: 'rejected',
      title: 'Заявление на отпуск отклонено',
      description: 'Заявление на отпуск 1-5 февраля отклонено. Причина: производственная необходимость',
      date: '2024-11-26',
      time: '11:20',
      read: true,
    },
    {
      id: 5,
      type: 'info',
      title: 'Обновление политики ДМС',
      description: 'С 1 января вступают в силу обновлённые условия программы ДМС',
      date: '2024-11-25',
      time: '10:00',
      read: true,
    },
  ],
};
