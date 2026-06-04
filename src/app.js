const express = require('express')
const cors = require('cors')
const authRouter = require('./routes/auth')
const formsRouter = require('./routes/forms')

const app = express()

const defaultAllowedOrigins = new Set([
  'https://jodella-bridals.vercel.app',
  'http://localhost:5173',
  'http://localhost:4173',
  'http://localhost:3000',
])

if (process.env.CORS_ORIGIN) {
  process.env.CORS_ORIGIN.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
    .forEach((origin) => defaultAllowedOrigins.add(origin))
}

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        return callback(null, true)
      }

      const isLocalhost = /^https?:\/\/localhost(?::\d+)?$/.test(origin)
      const isAllowed = defaultAllowedOrigins.has(origin) || isLocalhost

      return callback(null, isAllowed)
    },
    credentials: false,
  }),
)
app.use(express.json({ limit: '2mb' }))

app.get('/', (_req, res) => {
  res.send('Jodella backend API is running.')
})

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.get('/robots.txt', (_req, res) => {
  res.type('text/plain').send('User-agent: *\nDisallow: /')
})

app.get('/favicon.ico', (_req, res) => {
  res.status(204).end()
})

app.use('/api/auth', authRouter)
app.use('/api/forms', formsRouter)

app.use((error, _req, res, _next) => {
  console.error(error)
  res.status(500).json({
    message: 'An unexpected server error occurred.',
  })
})

module.exports = app
