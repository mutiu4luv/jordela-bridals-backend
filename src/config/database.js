const mongoose = require("mongoose");

const MONGODB_URI = process.env.MONGODB_URI;
const dns = require("dns");
dns.setDefaultResultOrder("ipv4first");

if (!MONGODB_URI) {
  throw new Error("MONGODB_URI is missing from the environment.");
}

let cached = global.mongooseConnection;

if (!cached) {
  cached = global.mongooseConnection = { conn: null, promise: null };
}

async function connectDatabase() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    mongoose.set("strictQuery", true);
    cached.promise = mongoose
      .connect(MONGODB_URI, {
        serverSelectionTimeoutMS: 30000, // Drop down to 30s so it doesn't max out Vercel's 10s limit
        bufferCommands: false,
      })
      .then((mongooseInstance) => {
        console.log("=> MongoDB connected successfully.");
        return mongooseInstance;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;
    throw error;
  }

  return cached.conn;
}

module.exports = connectDatabase;
