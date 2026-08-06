import sessionsService from '../services/sessions.service.js';
import { successResponse } from '../utils/response-handler.js';

export const getSessionStatus = async (req, res, next) => {
  try {
    const statusData = await sessionsService.getSessionModuleStatus();
    return successResponse(res, statusData, 'Estructura inicial de sesiones lista');
  } catch (error) {
    next(error);
  }
};

export const register = async (req, res, next) => {
  try {
    const newUser = await sessionsService.registerUser(req.body);
    return successResponse(res, newUser, 'Usuario registrado con éxito', 201);
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  return successResponse(res, null, 'Funcionalidad de inicio de sesión pendiente para entrega de Autenticación', 501);
};
