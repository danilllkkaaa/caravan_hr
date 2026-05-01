const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const accounts = [
  {
    email: 'danil@mail.com',
    password: 'admin',
    name: 'Данил Администратор',
    firstName: 'Данил',
    position: 'Супер пользователь',
    department: 'Дирекция',
    phone: '+7 (000) 000-00-00',
    employeeId: 'ADMIN-0001',
    hireDate: '2026-05-01',
    vacationTotal: 28,
    vacationUsed: 0,
    role: 'admin',
    managerEmail: null,
  },
  {
    email: 'alexey.smirnov@caravan.local',
    password: 'Password123!',
    name: 'Алексей Николаевич Смирнов',
    firstName: 'Алексей',
    position: 'Старший разработчик',
    department: 'Разработка',
    phone: '+7 (999) 123-45-67',
    employeeId: 'EMP-2847',
    hireDate: '2019-03-15',
    vacationTotal: 28,
    vacationUsed: 14,
    role: 'user',
    managerEmail: 'daniyar.satpayev@caravan.local',
  },
  {
    email: 'maria.ivanova@caravan.local',
    password: 'Password123!',
    name: 'Мария Сергеевна Иванова',
    firstName: 'Мария',
    position: 'Начальник отдела HR',
    department: 'HR',
    phone: '+7 (999) 231-44-10',
    employeeId: 'EMP-3012',
    hireDate: '2021-08-02',
    vacationTotal: 28,
    vacationUsed: 9,
    role: 'manager',
    managerEmail: 'danil@mail.com',
  },
  {
    email: 'timur.akhmetov@caravan.local',
    password: 'Password123!',
    name: 'Тимур Ринатович Ахметов',
    firstName: 'Тимур',
    position: 'Начальник операционного отдела',
    department: 'Операционный отдел',
    phone: '+7 (999) 670-12-09',
    employeeId: 'EMP-3188',
    hireDate: '2020-11-20',
    vacationTotal: 28,
    vacationUsed: 18,
    role: 'manager',
    managerEmail: 'danil@mail.com',
  },
  {
    email: 'olga.petrenko@caravan.local',
    password: 'Password123!',
    name: 'Ольга Андреевна Петренко',
    firstName: 'Ольга',
    position: 'Начальник финансового отдела',
    department: 'Финансы',
    phone: '+7 (999) 410-33-82',
    employeeId: 'EMP-2551',
    hireDate: '2018-02-05',
    vacationTotal: 31,
    vacationUsed: 7,
    role: 'manager',
    managerEmail: 'danil@mail.com',
  },
  {
    email: 'daniyar.satpayev@caravan.local',
    password: 'Password123!',
    name: 'Данияр Ерланович Сатпаев',
    firstName: 'Данияр',
    position: 'Начальник отдела разработки',
    department: 'Разработка',
    phone: '+7 (999) 888-21-45',
    employeeId: 'EMP-3301',
    hireDate: '2022-04-18',
    vacationTotal: 28,
    vacationUsed: 4,
    role: 'manager',
    managerEmail: 'danil@mail.com',
  },
  {
    email: 'elena.hr@caravan.local',
    password: 'Password123!',
    name: 'Елена Викторовна Орлова',
    firstName: 'Елена',
    position: 'Специалист HR',
    department: 'HR',
    phone: '+7 (999) 512-90-11',
    employeeId: 'EMP-3402',
    hireDate: '2023-01-16',
    vacationTotal: 28,
    vacationUsed: 6,
    role: 'user',
    managerEmail: 'maria.ivanova@caravan.local',
  },
  {
    email: 'ivan.logistics@caravan.local',
    password: 'Password123!',
    name: 'Иван Павлович Ким',
    firstName: 'Иван',
    position: 'Логист',
    department: 'Операционный отдел',
    phone: '+7 (999) 704-13-55',
    employeeId: 'EMP-3403',
    hireDate: '2023-06-01',
    vacationTotal: 28,
    vacationUsed: 3,
    role: 'user',
    managerEmail: 'timur.akhmetov@caravan.local',
  },
  {
    email: 'sergey.finance@caravan.local',
    password: 'Password123!',
    name: 'Сергей Олегович Морозов',
    firstName: 'Сергей',
    position: 'Бухгалтер',
    department: 'Финансы',
    phone: '+7 (999) 811-32-71',
    employeeId: 'EMP-3404',
    hireDate: '2024-02-12',
    vacationTotal: 28,
    vacationUsed: 5,
    role: 'user',
    managerEmail: 'olga.petrenko@caravan.local',
  },
];

const vacationTypes = [
  'Ежегодный оплачиваемый',
  'За свой счет',
  'Учебный',
  'По уходу за ребенком',
];

const notifications = [
  ['approved', 'Отпуск согласован', 'Ваш отпуск утвержден руководителем', '2026-04-28', '14:32', false],
  ['reminder', 'Напоминание о расчетном листке', 'Расчетный листок за апрель доступен в разделе документов', '2026-04-27', '09:00', false],
  ['info', 'Корпоративное мероприятие', 'Приглашаем на встречу команды в пятницу в 18:00', '2026-04-25', '16:15', true],
  ['rejected', 'Заявление на отпуск отклонено', 'Период пересекается с критичным релизом. Выберите другие даты', '2026-04-22', '11:20', true],
  ['info', 'Обновление политики ДМС', 'С 1 мая вступают в силу обновленные условия программы ДМС', '2026-04-20', '10:00', true],
];

function date(value) {
  return new Date(`${value}T00:00:00.000Z`);
}

function calcDays(start, end) {
  return Math.round((date(end).getTime() - date(start).getTime()) / 86400000) + 1;
}

function timeRows() {
  const rows = [];
  const start = date('2026-04-01');
  for (let i = 0; i < 30; i++) {
    const d = new Date(start);
    d.setUTCDate(start.getUTCDate() + i);
    const iso = d.toISOString().slice(0, 10);
    const dow = d.getUTCDay();
    if (dow === 0 || dow === 6) {
      rows.push({ date: iso, checkIn: '—', checkOut: '—', total: '—', status: 'weekend' });
      continue;
    }
    if (i === 12) {
      rows.push({ date: iso, checkIn: '—', checkOut: '—', total: '—', status: 'absent' });
      continue;
    }
    if (i % 9 === 0) {
      rows.push({ date: iso, checkIn: '08:52', checkOut: '19:25', total: '9ч 33м', status: 'overtime' });
      continue;
    }
    if (i % 11 === 0) {
      rows.push({ date: iso, checkIn: '09:20', checkOut: '16:45', total: '6ч 25м', status: 'short' });
      continue;
    }
    rows.push({ date: iso, checkIn: '09:00', checkOut: '18:00', total: '8ч 0м', status: 'normal' });
  }
  return rows.reverse();
}

async function main() {
  for (const account of accounts) {
    const passwordHash = await bcrypt.hash(account.password, 12);
    const { password: _password, managerEmail: _managerEmail, ...userData } = account;
    const user = await prisma.user.upsert({
      where: { email: account.email },
      update: {
        name: account.name,
        firstName: account.firstName,
        position: account.position,
        department: account.department,
        phone: account.phone,
        vacationTotal: account.vacationTotal,
        vacationUsed: account.vacationUsed,
        role: account.role,
      },
      create: {
        ...userData,
        passwordHash,
        hireDate: date(account.hireDate),
      },
    });

    if (account.managerEmail) {
      const manager = await prisma.user.findUnique({ where: { email: account.managerEmail } });
      if (manager) {
        await prisma.user.update({
          where: { id: user.id },
          data: { managerId: manager.id },
        });
      }
    } else {
      await prisma.user.update({
        where: { id: user.id },
        data: { managerId: null },
      });
    }

    const existingVacations = await prisma.vacation.count({ where: { userId: user.id } });
    if (existingVacations === 0) {
      await prisma.vacation.createMany({
        data: [
          ['2026-07-01', '2026-07-14', vacationTypes[0], 'approved', 'Летний отпуск'],
          ['2026-05-12', '2026-05-16', vacationTypes[0], 'pending', 'Семейная поездка'],
          ['2026-02-10', '2026-02-12', vacationTypes[1], 'approved', 'Личные дела'],
          ['2026-03-18', '2026-03-21', vacationTypes[0], 'rejected', 'Отклонено руководителем'],
        ].map(([startDate, endDate, type, status, comment]) => ({
          userId: user.id,
          startDate: date(startDate),
          endDate: date(endDate),
          days: calcDays(startDate, endDate),
          type,
          status,
          comment,
        })),
      });
    }

    const existingSick = await prisma.sickLeave.count({ where: { userId: user.id } });
    if (existingSick === 0) {
      await prisma.sickLeave.createMany({
        data: [
          ['2026-01-14', '2026-01-18', 5, 'closed', true, 'sick_leave_001.pdf', 'ОРВИ'],
          ['2026-04-03', null, 0, 'opened', false, null, 'Ожидает закрытия'],
        ].map(([startDate, endDate, days, status, hasFile, fileName, comment]) => ({
          userId: user.id,
          startDate: date(startDate),
          endDate: typeof endDate === 'string' ? date(endDate) : null,
          days,
          status,
          hasFile,
          fileName,
          comment,
        })),
      });
    }

    for (const row of timeRows()) {
      const recordDate = date(row.date);
      await prisma.timeRecord.upsert({
        where: {
          userId_date: {
            userId: user.id,
            date: recordDate,
          },
        },
        update: {
          checkIn: row.checkIn,
          checkOut: row.checkOut,
          total: row.total,
          status: row.status,
        },
        create: {
          userId: user.id,
          date: recordDate,
          checkIn: row.checkIn,
          checkOut: row.checkOut,
          total: row.total,
          status: row.status,
        },
      });
    }

    const existingNotifications = await prisma.notification.count({ where: { userId: user.id } });
    if (existingNotifications === 0) {
      await prisma.notification.createMany({
        data: notifications.map(([type, title, description, notifDate, time, read]) => ({
          userId: user.id,
          type,
          title,
          description,
          date: date(notifDate),
          time,
          read,
        })),
      });
    }
  }

  for (const account of accounts) {
    const user = await prisma.user.findUnique({ where: { email: account.email } });
    if (!user) continue;

    const manager = account.managerEmail
      ? await prisma.user.findUnique({ where: { email: account.managerEmail } })
      : null;

    await prisma.user.update({
      where: { id: user.id },
      data: { managerId: manager?.id ?? null },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
