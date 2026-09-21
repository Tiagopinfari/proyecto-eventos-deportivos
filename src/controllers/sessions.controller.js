import config from '../config/config.js';
import { generateToken } from '../utils/jwt.js';
import sessionsService from '../services/sessions.service.js';
import UserDTO from '../dto/user.dto.js';

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
 * Tras la autenticación de la estrategia 'register', devuelve el nuevo usuario formateado con UserDTO
 */
export const register = async (req, res, next) => {
  try {
    const userDto = UserDTO.from(req.user);
    return res.status(201).json({
      status: 'success',
      payload: {
        id: userDto.id,
        first_name: userDto.first_name,
        last_name: userDto.last_name,
        email: userDto.email,
        role: userDto.role
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
 * Tras la validación de la estrategia 'current', devuelve los datos seguros del usuario mediante UserDTO
 */
export const getCurrentUser = async (req, res, next) => {
  try {
    const userDto = UserDTO.from(req.user);
    return res.status(200).json({
      status: 'success',
      payload: {
        id: userDto.id,
        email: userDto.email,
        role: userDto.role
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
