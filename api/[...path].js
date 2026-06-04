const dotenv = require('dotenv')

dotenv.config()

const app = require('../src/app')
const connectDatabase = require('../src/config/database')
const bootstrapAdmin = require('../src/config/bootstrapAdmin')

let bootstrapPromise = null

function warmBootstrapAdmin() {
  if (!bootstrapPromise) {
    bootstrapPromise = bootstrapAdmin().finally(() => {
      bootstrapPromise = null
    })
  }

  return bootstrapPromise
}

module.exports = async (req, res) => {
  await connectDatabase()
  void warmBootstrapAdmin()
  return app(req, res)
}
