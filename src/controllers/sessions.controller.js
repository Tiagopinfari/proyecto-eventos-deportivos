import sessionsService from '../services/sessions.service.js';
import config from '../config/config.js';

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

export const register = async (req, res, next) => {
  try {
    const newUser = await sessionsService.registerUser(req.body);
    return res.status(201).json({
      status: 'success',
      payload: newUser
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { token } = await sessionsService.loginUser(req.body);

    const isProduction = config.nodeEnv === 'production';

    res.cookie('currentUser', token, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 3600000, // 1 hora en ms
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

export const getCurrentUser = async (req, res, next) => {
  try {
    const payload = sessionsService.getCurrentUserPayload(req.user);
    return res.status(200).json({
      status: 'success',
      payload
    });
  } catch (error) {
    next(error);
  }
};

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
