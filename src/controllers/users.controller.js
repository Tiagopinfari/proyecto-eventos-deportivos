import usersService from '../services/users.service.js';
import { successResponse } from '../utils/response-handler.js';

/**
 * Controlador para la ruta administrativa de usuarios (solo admin)
 * Cumple con consumir únicamente la capa de servicios y responder con DTOs
 */
export const getAllUsers = async (req, res, next) => {
  try {
    const sanitizedUsers = await usersService.getAllUsers();
    return successResponse(res, sanitizedUsers, 'Usuarios obtenidos con éxito');
  } catch (error) {
    next(error);
  }
};
