const dotenv = require('dotenv')

dotenv.config()

const app = require('../src/app')
const connectDatabase = require('../src/config/database')
const bootstrapAdmin = require('../src/config/bootstrapAdmin')

let bootstrapPromise = null

async function prepareApp() {
  await connectDatabase()

  if (!bootstrapPromise) {
    bootstrapPromise = bootstrapAdmin()
  }

  await bootstrapPromise
}

module.exports = async (req, res) => {
  await prepareApp()
  return app(req, res)
}
