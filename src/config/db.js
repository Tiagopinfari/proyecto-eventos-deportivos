import mongoose from 'mongoose';
import config from './config.js';

export const connectDB = async () => {
  try {
    if (!config.mongoUrl) {
      console.warn('[MongoDB] No se ha especificado MONGO_URL en las variables de entorno.');
      return;
    }
    await mongoose.connect(config.mongoUrl);
    console.log('[MongoDB] Conexión exitosa a la base de datos de eventos deportivos');
  } catch (error) {
    console.error('[MongoDB Error] Fallo al conectar a la base de datos:', error.message);
  }
};

export default connectDB;
