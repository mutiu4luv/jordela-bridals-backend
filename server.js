const dotenv = require('dotenv')

dotenv.config()

const app = require('./src/app')
const connectDatabase = require('./src/config/database')
const bootstrapAdmin = require('./src/config/bootstrapAdmin')

const port = process.env.PORT || 5000

async function warmDatabase() {
  try {
    await connectDatabase()
    await bootstrapAdmin()
    console.log('Jodella database connection ready.')
  } catch (error) {
    console.error('Database connection failed:', error)
  }
}

if (process.env.VERCEL) {
  module.exports = app
} else {
  app.listen(port, () => {
    console.log(`Jodella backend listening on port ${port}`)
  })

  void warmDatabase()
}
