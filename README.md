# Caravan HR

Мобильный HR web app на Next.js с PostgreSQL, Prisma, cookie-сессиями и локальным файловым хранилищем для больничных.

## Запуск через Docker Compose

```bash
docker compose up -d --build
```

Приложение будет доступно на `http://localhost:3001`.

PostgreSQL доступен только внутри docker-сети как `postgres:5432`; наружу порт БД не публикуется. Файлы больничных сохраняются в volume `app_uploads` по пути `/app/storage/uploads`.

## Тестовые учетные записи

- `danil@mail.com` / пароль `admin` / роль `admin`
- `alexey.smirnov@caravan.local` / пароль `Password123!`
- `maria.ivanova@caravan.local` / пароль `Password123!`
- `timur.akhmetov@caravan.local` / пароль `Password123!`
- `olga.petrenko@caravan.local` / пароль `Password123!`
- `daniyar.satpayev@caravan.local` / пароль `Password123!`
- `elena.hr@caravan.local` / пароль `Password123!`
- `ivan.logistics@caravan.local` / пароль `Password123!`
- `sergey.finance@caravan.local` / пароль `Password123!`

Роли:

- `admin` - директор.
- `manager` - начальник отдела.
- `user` - сотрудник.

## Переменные окружения

См. `.env.example`.

Для HTTPS-деплоя поставьте:

```env
SESSION_COOKIE_SECURE=true
```

Локально через `http://localhost:3001` оставляйте `SESSION_COOKIE_SECURE=false`, иначе браузер не сохранит cookie.

## Полезные команды

```bash
npm run type-check
npm run lint
npm run build
npm run prisma:generate
npm run prisma:deploy
npm run seed
```
