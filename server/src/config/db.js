// config/db.js
// -----------------------------------------------------------------------
// Isolated MongoDB connection logic via Mongoose.
// Kept separate from server.js so that:
//   - Connection options live in exactly one place
//   - Reconnection / error listeners are centralised
//   - Future changes (e.g. connection pooling, read replicas) touch
//     only this file
// -----------------------------------------------------------------------

import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

export const connectDB = async () => {
  try {
    mongoose.set('strictQuery', true);

    const conn = await mongoose.connect(env.mongoUri);

    logger.info(`MongoDB connected: ${conn.connection.host}`);

    // Log runtime connection issues (e.g. network blip) without crashing
    // the whole process - Mongoose will attempt to reconnect automatically.
    mongoose.connection.on('error', (err) => {
      logger.error(`MongoDB connection error: ${err.message}`);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });
  } catch (error) {
    // A failed initial connection is unrecoverable for this process -
    // exit so the hosting platform (Render) can restart the container.
    logger.error(`MongoDB initial connection failed: ${error.message}`);
    process.exit(1);
  }
};
