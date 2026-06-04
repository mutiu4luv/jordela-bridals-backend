const express = require('express')
const cors = require('cors')
const authRouter = require('./routes/auth')
const formsRouter = require('./routes/forms')

const app = express()

const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim()).filter(Boolean)
  : []

app.use(
  cors({
    origin: allowedOrigins.length > 0 ? allowedOrigins : true,
  }),
)
app.use(express.json({ limit: '2mb' }))

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
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
