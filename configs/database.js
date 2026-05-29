import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ override: true });

const getMongoUri = () => {
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;

  if (!mongoUri) {
    throw new Error('MONGODB_URI is not set');
  }

  if (mongoUri.includes('cluster.mongodb.net')) {
    throw new Error('MONGODB_URI is using the placeholder cluster.mongodb.net host');
  }

  return mongoUri;
};

const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(getMongoUri());
    console.log(`\nMongoDB connected! DB HOST: ${connectionInstance.connection.host}`);
  } catch (error) {
    console.error('MongoDB connection FAILED:', error.message);
    process.exit(1);
  }
};

export default connectDB;
