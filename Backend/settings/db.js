const mongoose = require ("mongoose");

const connectDB = async () => {
  try {
    // This reads the MONGO_URI straight from your .env file
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Database connection error: ${error.message}`);
    process.exit(1); // Stop the app if connection fails
  }
};

module.exports = connectDB;