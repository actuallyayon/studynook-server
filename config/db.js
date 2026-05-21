const mongoose = require('mongoose');
const dns = require('dns');

// Use Google's DNS to resolve MongoDB Atlas SRV records (wrapped in try-catch for serverless compatibility)
try {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
} catch (error) {
  console.warn('Could not set DNS servers (expected in some serverless environments):', error.message);
}

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    console.log('Retrying in 5 seconds...');
    setTimeout(connectDB, 5000);
  }
};

module.exports = connectDB;
