const dotenv = require('dotenv')

dotenv.config()

const app = require('./src/app')
const connectDatabase = require('./src/config/database')
const bootstrapAdmin = require('./src/config/bootstrapAdmin')

const port = process.env.PORT || 5000

app.get('/', (_req, res) => {
  res.send('Welcome to the Jodella backend!')
})

async function warmDatabase() {
  try {
    await connectDatabase()
    await bootstrapAdmin()
    console.log('Jodella database connection ready.')
  } catch (error) {
    console.error('Database connection failed:', error)
  }
}

app.listen(port, () => {
  console.log(`Jodella backend listening on port ${port}`)
})

void warmDatabase()
