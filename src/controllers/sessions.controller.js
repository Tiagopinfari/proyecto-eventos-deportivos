import config from '../config/config.js';
import { generateToken } from '../utils/jwt.js';
import sessionsService from '../services/sessions.service.js';

export const getSessionStatus = async (req, res, next) => {
  try {
    const statusData = await sessionsService.getSessionModuleStatus();
    return res.status(200).json({
      status: 'success',
      payload: statusData
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Tras la autenticación de la estrategia 'register', devuelve el nuevo usuario creado
 */
export const register = async (req, res, next) => {
  try {
    const user = req.user;
    return res.status(201).json({
      status: 'success',
      payload: {
        id: user._id ? user._id.toString() : user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Tras la autenticación de la estrategia 'login', el controlador genera el JWT y setea la cookie
 */
export const login = async (req, res, next) => {
  try {
    const user = req.user;
    const userId = user._id ? user._id.toString() : user.id;

    // Generación de JWT con payload seguro
    const token = generateToken({
      id: userId,
      email: user.email,
      role: user.role
    });

    const isProduction = config.nodeEnv === 'production';

    // Seteo de la cookie HttpOnly currentUser
    res.cookie('currentUser', token, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 3600000, // 1 hora
      secure: isProduction
    });

    return res.status(200).json({
      status: 'success',
      message: 'Login correcto'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Tras la validación de la estrategia 'current', devuelve los datos seguros del usuario
 */
export const getCurrentUser = async (req, res, next) => {
  try {
    return res.status(200).json({
      status: 'success',
      payload: {
        id: req.user.id,
        email: req.user.email,
        role: req.user.role
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Cierra la sesión eliminando la cookie currentUser
 */
export const logout = async (req, res, next) => {
  try {
    res.clearCookie('currentUser');
    return res.status(200).json({
      status: 'success',
      message: 'Sesión cerrada'
    });
  } catch (error) {
    next(error);
  }
};
