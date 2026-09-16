import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: process.env.PORT || 8080,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUrl: process.env.MONGO_URL || 'mongodb://127.0.0.1:27017/eventos_deportivos',
  jwtSecret: process.env.JWT_SECRET || 'secreto_desarrollo_local_jwt_123',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1h',
  mail: {
    host: process.env.MAIL_HOST || 'smtp.ethereal.email',
    port: Number(process.env.MAIL_PORT) || 587,
    user: process.env.MAIL_USER || '',
    pass: process.env.MAIL_PASS || '',
    from: process.env.MAIL_FROM || 'SportEventHub <noreply@sporteventhub.com>'
  }
};

export default config;
