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
  return res.status(501).json({
    status: 'info',
    message: 'Funcionalidad de inicio de sesión pendiente para entrega de Autenticación'
  });
};
