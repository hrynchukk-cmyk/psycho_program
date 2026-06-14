# Psycho Program — Backend API

REST API для адмін-панелі психолога та клієнтського мобільного додатка.

**Стек:** Node.js + Express + TypeScript + Prisma + PostgreSQL, авторизація на JWT з ролями `PRACTITIONER` та `CLIENT`.

## Швидкий старт (локально)

```bash
cd server
cp .env.example .env          # вкажіть DATABASE_URL і JWT_SECRET
npm install
npm run prisma:generate
npm run migrate:dev           # створює таблиці
npm run db:seed               # наповнює демо-даними
npm run dev                   # http://localhost:4000
```

Перевірка: `curl http://localhost:4000/health`

### Демо-акаунти (після сіду)

| Роль | Email | Пароль |
|---|---|---|
| Психолог | `demo@psychoprogram.com` | `demo1234` |
| Клієнт (мобільний додаток) | `client@psychoprogram.com` | `demo1234` |

## Змінні оточення

| Змінна | Призначення |
|---|---|
| `DATABASE_URL` | Рядок підключення до PostgreSQL |
| `JWT_SECRET` | Секрет для підпису токенів (у проді — довгий випадковий рядок) |
| `JWT_EXPIRES_IN` | Час життя токена (напр. `7d`) |
| `PORT` | Порт HTTP-сервера (за замовч. 4000) |
| `CORS_ORIGINS` | Дозволені джерела через кому (адреси фронтенду) |

## Скрипти

| Команда | Дія |
|---|---|
| `npm run dev` | Дев-сервер із hot-reload (tsx watch) |
| `npm run build` / `npm start` | Збірка в `dist/` і запуск продакшн-білда |
| `npm run typecheck` | Перевірка типів без емісії |
| `npm run migrate:dev` | Створити/застосувати міграцію (розробка) |
| `npm run migrate:deploy` | Застосувати міграції (продакшн) |
| `npm run db:seed` | Наповнити демо-даними |
| `npm run db:reset` | Скинути БД і пересіяти |

## Модель ролей

- **PRACTITIONER** — власник робочого простору. Бачить і керує лише своїми клієнтами, групами, активностями тощо (мультитенантна ізоляція за `practitionerId`).
- **CLIENT** — акаунт клієнта для мобільного додатка. Клієнт «активує» акаунт за email, на який його запросив психолог (`POST /api/auth/client/claim`), після чого може читати свої записи щоденника та створювати нові.

## API

Усі захищені маршрути потребують заголовок `Authorization: Bearer <token>`.

### Авторизація
| Метод | Шлях | Хто | Опис |
|---|---|---|---|
| POST | `/api/auth/register` | — | Реєстрація психолога |
| POST | `/api/auth/login` | — | Логін (психолог або клієнт) |
| POST | `/api/auth/client/claim` | — | Клієнт активує акаунт за запрошенням |
| GET | `/api/auth/me` | будь-хто | Поточний користувач |

### Психолог (роль PRACTITIONER)
| Ресурс | Маршрути |
|---|---|
| Клієнти | `GET/POST /api/clients`, `GET/PATCH/DELETE /api/clients/:id` |
| Групи | `GET/POST /api/groups`, `GET/PATCH/DELETE /api/groups/:id`, `POST /api/groups/:id/members`, `DELETE /api/groups/:id/members/:clientId` |
| Активності | `GET/POST /api/activities`, `GET/PATCH/DELETE /api/activities/:id`, `POST /api/activities/:id/copy` |
| Програми | `GET/POST /api/programs`, `GET/PATCH/DELETE /api/programs/:id`, `POST /api/programs/:id/copy` |
| Ресурси | `GET/POST /api/resources`, `DELETE /api/resources/:id`, `PUT /api/resources/:id/shares` |
| Задачі | `GET/POST /api/tasks`, `PATCH/DELETE /api/tasks/:id` |
| Нотатки | `GET/POST /api/notes`, `PATCH/DELETE /api/notes/:id` |
| Доставки | `GET /api/deliveries`, `GET /api/deliveries/:id`, `POST /api/deliveries`, `POST /api/deliveries/:id/reopen`, `POST /api/deliveries/:id/comments` |
| Щоденник | `GET /api/journal` (усі записи клієнтів, фільтри `clientId`/`mood`/`reviewed`), `PATCH /api/journal/:id` (переглянуто/відповідь) |

### Клієнт (роль CLIENT, мобільний додаток)
| Метод | Шлях | Опис |
|---|---|---|
| GET | `/api/journal` | Власні записи щоденника |
| POST | `/api/journal` | Створити запис (mood, title?, body, tags) |

### Бізнес-логіка (за довідкою Quenza)
- **Авто-надсилання**: при `POST /api/groups/:id/members`, якщо в групи увімкнено `autoSendEnabled`, новому учаснику автоматично створюються доставки з `autoSendActivityIds` / `autoSendProgramIds`.
- **Копіювання готового контенту**: `POST /api/activities/:id/copy` і `/api/programs/:id/copy` створюють редаговану власну копію premade-контенту.
- **Повторне відкриття**: `POST /api/deliveries/:id/reopen` повертає завершену активність у статус «в процесі».

## Деплой у хмару

База потребує окремого хостингу (GitHub Pages — лише статика для фронтенду).

### Render (через `render.yaml` у корені репозиторію)
1. New → Blueprint → оберіть цей репозиторій. Render створить веб-сервіс і керовану Postgres.
2. `DATABASE_URL` підставиться автоматично; задайте `JWT_SECRET` і додайте адресу фронтенду в `CORS_ORIGINS`.
3. Команда збірки виконає `prisma migrate deploy` — таблиці створяться автоматично.

### Будь-який хост (Railway/Fly/VPS)
```bash
npm ci
npm run build
npm run migrate:deploy
npm start
```
Передайте `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGINS` через змінні оточення хоста.
