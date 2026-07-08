const mongoose = require('mongoose');

// Caching ka logic sirf Serverless environments (Vercel) ke liye useful hai
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

const connectDB = async () => {
  // Agar pehle se connection mojood hai, toh wahi use karein
  if (cached.conn) {
    return cached.conn;
  }

  // Agar connection promise nahi hai, toh connect karein
  if (!cached.promise) {
    const opts = {
      bufferCommands: true, // Local ke liye 'true' hona behtar hai
      maxPoolSize: 10,
    };

    cached.promise = mongoose.connect(process.env.MONGO_URI, opts).then((mongooseInstance) => {
      console.log(`MongoDB Connected: ${mongooseInstance.connection.host}`);
      return mongooseInstance;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
};

module.exports = connectDB;