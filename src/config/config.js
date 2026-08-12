import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: process.env.PORT || 8080,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUrl: process.env.MONGO_URL || 'mongodb://127.0.0.1:27017/eventos_deportivos',
  jwtSecret: process.env.JWT_SECRET || 'secreto_desarrollo_local_jwt_123',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1h'
};

export default config;
