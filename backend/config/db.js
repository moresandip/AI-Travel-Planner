const mongoose = require('mongoose');

const connectDB = async () => {
  const mongoURI = process.env.MONGO_URI;

  if (!mongoURI) {
    console.warn('\n==================================================================');
    console.warn('⚠️  WARNING: MONGO_URI environment variable is not defined!');
    console.warn('Using local fallback database: mongodb://127.0.0.1:27017/ai-travel-planner');
    console.warn('If you are running in production (e.g. Render), please configure');
    console.warn('your MONGO_URI environment variable in the dashboard settings.');
    console.warn('==================================================================\n');
  }

  try {
    const conn = await mongoose.connect(mongoURI || 'mongodb://127.0.0.1:27017/ai-travel-planner');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    if (!mongoURI) {
      console.error('\n🔴 CONNECTION FAILED: Attempted to connect to fallback local MongoDB,');
      console.error('   but no MongoDB server is running locally at 127.0.0.1:27017.');
      console.error('   👉 ACTION REQUIRED: If deploying to Render, set the MONGO_URI environment variable');
      console.error('      to your MongoDB Atlas connection string under the environment settings.');
      console.error('      Example: MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/dbname\n');
    }
    console.warn('Resilient Boot: Continuing server startup without exiting. Database operations will attempt to reconnect or fail gracefully.');
  }
};

module.exports = connectDB;
