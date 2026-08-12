import { verifyToken } from '../utils/jwt.js';
import CustomError from '../utils/custom-error.js';

/**
 * Middleware para proteger rutas autenticadas.
 * Verifica la existencia y validez de la cookie HTTP-Only 'currentUser'.
 */
export const authMiddleware = (req, res, next) => {
  let token = req.cookies?.currentUser;

  // Soporte secundario por si se envía mediante Bearer token en Header
  if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new CustomError('No autenticado', 401));
  }

  try {
    const decoded = verifyToken(token);
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role
    };
    next();
  } catch (error) {
    return next(new CustomError('No autenticado', 401));
  }
};

export default authMiddleware;
