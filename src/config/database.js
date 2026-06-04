const mongoose = require('mongoose')

const MONGODB_URI = process.env.MONGODB_URI

if (!MONGODB_URI) {
  throw new Error('MONGODB_URI is missing from the environment.')
}

let cached = global.mongooseConnection

if (!cached) {
  cached = global.mongooseConnection = { conn: null, promise: null }
}

async function connectDatabase() {
  if (cached.conn) {
    return cached.conn
  }

  if (!cached.promise) {
    mongoose.set('strictQuery', true)
    cached.promise = mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
    })
  }

  cached.conn = await cached.promise
  return cached.conn
}

module.exports = connectDatabase
