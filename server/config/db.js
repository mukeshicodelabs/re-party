
// dbConnect.js
const mongoose = require('mongoose');

const connectToDB = async () => {
  const uri = process.env.DB_URL;

  if (!uri) {
    throw new Error('DB_URL environment variable is not set');
  }

  try {
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1); // Exit the app if connection fails
  }
};

module.exports = connectToDB;
