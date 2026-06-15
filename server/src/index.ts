import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { env } from './lib/env.js'
import { errorHandler } from './lib/http.js'
import { authRouter } from './routes/auth.js'
import { clientsRouter } from './routes/clients.js'
import { groupsRouter } from './routes/groups.js'
import { activitiesRouter } from './routes/activities.js'
import { programsRouter } from './routes/programs.js'
import { resourcesRouter } from './routes/resources.js'
import { tasksRouter } from './routes/tasks.js'
import { notesRouter } from './routes/notes.js'
import { journalRouter } from './routes/journal.js'
import { deliveriesRouter } from './routes/deliveries.js'
import { clientRouter } from './routes/client.js'

const app = express()

// Private Network Access: Chrome для запиту з публічного сайту (https) на
// локальну мережу/localhost вимагає цей заголовок у відповіді на preflight.
app.use((req, res, next) => {
  if (req.headers['access-control-request-private-network']) {
    res.setHeader('Access-Control-Allow-Private-Network', 'true')
  }
  next()
})

// CORS. Авторизація на Bearer-токенах (без кукі), тож для демо безпечно
// дозволити будь-яке джерело (CORS_ORIGINS="*"). Можна обмежити списком доменів.
const allowAllOrigins = env.corsOrigins.includes('*')
app.use(
  cors({
    origin(origin, callback) {
      // Запити без Origin (curl, мобільні застосунки) дозволені завжди.
      if (allowAllOrigins || !origin || env.corsOrigins.includes(origin)) {
        return callback(null, true)
      }
      // Не кидаємо помилку (це давало б 500 на preflight) — просто без CORS-заголовків.
      callback(null, false)
    },
  }),
)
app.use(express.json({ limit: '1mb' }))

app.get('/health', (_req, res) => res.json({ status: 'ok', time: new Date().toISOString() }))

app.use('/api/auth', authRouter)
app.use('/api/clients', clientsRouter)
app.use('/api/groups', groupsRouter)
app.use('/api/activities', activitiesRouter)
app.use('/api/programs', programsRouter)
app.use('/api/resources', resourcesRouter)
app.use('/api/tasks', tasksRouter)
app.use('/api/notes', notesRouter)
app.use('/api/journal', journalRouter)
app.use('/api/deliveries', deliveriesRouter)
app.use('/api/client', clientRouter)

app.use((_req, res) => res.status(404).json({ error: 'Маршрут не знайдено' }))
app.use(errorHandler)

app.listen(env.port, () => {
  console.log(`Psycho Program API запущено на http://localhost:${env.port}`)
})
