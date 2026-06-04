const dotenv = require('dotenv')

dotenv.config()

const app = require('./src/app')
const connectDatabase = require('./src/config/database')
const bootstrapAdmin = require('./src/config/bootstrapAdmin')

const port = process.env.PORT || 5000

async function startServer() {
  try {
    await connectDatabase()
    await bootstrapAdmin()
    app.listen(port, () => {
      console.log(`Jodella backend listening on port ${port}`)
    })
  } catch (error) {
    console.error('Unable to start server:', error)
    process.exit(1)
  }
}

startServer()
