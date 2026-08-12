import jwt from 'jsonwebtoken';
import config from '../config/config.js';

/**
 * Genera un token JWT firmado con el payload del usuario y expiración configurada
 * @param {Object} payload - Objeto con datos públicos del usuario ({ id, email, role })
 * @returns {string} Token JWT firmado
 */
export const generateToken = (payload) => {
  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn
  });
};

/**
 * Verifica y decodifica un token JWT utilizando el secreto del servidor
 * @param {string} token - Token JWT enviado por el cliente
 * @returns {Object} Payload decodificado del token
 */
export const verifyToken = (token) => {
  return jwt.verify(token, config.jwtSecret);
};
